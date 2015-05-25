/**
 * @fileoverview
 * Extended panel, support noautohide option.
 * @author Partridge Jiang
 */

const panel = require("sdk/panel");
const { Class, extend } = require("sdk/core/heritage");
const { merge } = require("sdk/util/object");
const viewCore = require("sdk/view/core");


const PanelEx = Class({
	extends: panel.Panel,
	setup: function setup(options)
	{
		var ops = options || {};
		var result = panel.Panel.prototype.setup.apply(this, [ops]);
		if (ops.noautohide !== undefined)
			this.noautohide = !!ops.noautohide;
		if (ops.showHtmlTip !== undefined)
			this.showHtmlTip = !!ops.showHtmlTip;
		return result;
	},
	getView: function()
	{
		return viewCore.getActiveView(this);
	},
	get noautohide()
	{
		var attribValue = this.getView().getAttribute('noautohide');
		var boolValue = false;
		try
		{
			boolValue = JSON.parse(attribValue);
		}
		catch(e)
		{
			boolValue = true;
		}
		return boolValue;
	},
	set noautohide (value)
	{
		this.getView().setAttribute('noautohide', value);
	},
	get showHtmlTip()
	{
		var attribValue = this.getView().getAttribute('tooltip');
		return attribValue === 'aHTMLTooltip';
	},
	set showHtmlTip(value)
	{
		if (value)
			this.getView().setAttribute('tooltip', 'aHTMLTooltip');
		else
			this.getView().setAttribute('tooltip', '');
	}
});

exports.PanelEx = PanelEx;