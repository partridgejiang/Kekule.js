/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

module.metadata = {
  "stability": "experimental",
  "engines": {
    "Firefox": "*"
  }
};

const { open: openWindow } = require('sdk/window/helpers');
const { defer } = require('sdk/core/promise');
const { Worker } = require('sdk/content/worker');
const { getActiveTab, setTabURL } = require('sdk/tabs/utils');
const { data } = require('sdk/self');

const { when: unload } = require('sdk/system/unload');
const { on, off } = require('sdk/system/events');
const workers = new WeakMap();

function onWindowClose({subject: chromeWindow}) {
  let worker = workers.get(chromeWindow);

  if (worker) {
    worker.destroy();
    workers.delete(chromeWindow);
  }
}

function onUnload({target: {defaultView: window}}) {
  if (this !== window && !window.frameElement) {
    let worker = workers.get(this);

    if (worker)
      worker.detach();
  }
}

on('domwindowclosed', onWindowClose, true);
unload(() => off('domwindowclosed', onWindowClose));

function open(options={}) {
  let { promise, resolve } = defer();
  let { url, features, contentScript, contentScriptFile, onMessage } = options;

  url = data.url(url);

  openWindow("", {
    features: features || {}
  }).then(browser => {
    if (contentScriptFile)
      contentScriptFile = [].concat(contentScriptFile).map(data.url)

    if (contentScriptFile || contentScript) {
      let worker = Worker({
        contentScript: contentScript,
        contentScriptFile: contentScriptFile,
        onMessage: onMessage
      });

      workers.set(browser, worker);

      browser.addEventListener('unload', onUnload);
    };

    browser.addEventListener('DOMContentLoaded', ({target}) => {
      let window = target.defaultView;

      if (browser !== window && !window.frameElement) {
        browser.document.title = target.title;

        let worker = workers.get(browser);

        if (worker) {
          worker.attach(window);
          resolve(worker);
        } else {
          resolve(null);
        }
      }
    });

    setTabURL(getActiveTab(browser), url);
  }).then(null, console.error)

  return promise;
};

exports.open = open;