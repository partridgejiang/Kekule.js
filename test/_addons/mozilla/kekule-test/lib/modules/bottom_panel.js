
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const windowUtils = require('sdk/window/utils');

exports.BottomPanel = function(options) {
  
  var win = windowUtils.getMostRecentBrowserWindow();
  var doc = win.document;
  
  var overlay = doc.createElementNS(XUL_NS, 'panel');
  overlay.setAttribute("id", "bottom_panel_id_"  + new Date().getTime().toString());
  overlay.style.height = options.height;
  overlay.style.display = "block";

  var width = doc.documentElement.clientWidth;

  var iframe = doc.createElementNS(XUL_NS, 'iframe');
  iframe.setAttribute('type', 'chrome');
  iframe.style.width = width + "px";
  iframe.style.height = options.height;
  iframe.style.display = "block";
  
  overlay.appendChild(iframe);
  
  addonbar = doc.getElementById("addon-bar");
  parent = addonbar.parentNode;
  parent.insertBefore(overlay, addonbar);
  
  var { Symbiont } = require('sdk/content/content');
  const IframeSymb = Symbiont.resolve({ 
    constructor: '_init',
  }).compose({
    constructor: function IframeSymb(options) {
      this._frame = options.frame;
      this._init(options);
      this.hide();
    },

    show: function() {
      this._frame.parentNode.style.display = "block";
    },

    hide: function() {
      this._frame.parentNode.style.display = "none";
    }

  });

  out = IframeSymb({
    frame: iframe,
    contentURL: options.contentURL
  });
  out.iframe = iframe;
  return out;

}
