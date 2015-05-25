/**
 * @fileoverview
 * Extend PageMod to persit tab-worker relationship.
 * @author Partridge Jiang
 */

const { Class, extend } = require("sdk/core/heritage");
const pageMod = require("sdk/page-mod");

const PageModEx = Class({
	extends: pageMod.PageMod,
	setup: function(options)
	{
		this._tabWorkerMap = new WeakMap();
		var that = this;
		var ops = Object.create(options);
		var oldOnAttach = options.onAttach;
		var newOnAttach = function(worker)
		{
			var tab = worker.tab;
			//console.log('set worker', tab.url, worker.url, worker);
			if (tab.url === worker.url)  // ensure only top document is recorded, iframe works are ignored currently
				that._tabWorkerMap.set(tab, worker);
			worker.on('detach', function()
			{
				if (tab.url === worker.url)
					that._tabWorkerMap.delete(tab);
			});
			if (oldOnAttach)
				oldOnAttach(worker);
		}
		ops.onAttach = newOnAttach;
		var result = pageMod.PageMod.prototype.setup.apply(this, [ops]);
		return result;
	},
	getWorkerOnTab: function(tab)
	{
		return this._tabWorkerMap.get(tab);
	}
});

exports.PageModEx = PageModEx;


