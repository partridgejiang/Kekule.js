/**
 * @fileoverview
 * Context menu on chem obj element.
 * @author Partridge Jiang
 */

const WIDGET_SELECTOR = '*[data-chem-obj], *[data-widget], *[data-kekule-widget]';
const self = require("sdk/self");
const cm = require("sdk/context-menu");
const { globalConsts } = require('../globalConsts.js');
const { MsgUtils } = require('../globalUtils.js');

var ChemObjContextMenuSetter = {
	create: function(chemObjModifyPanel)
	{
		// modify molecule item
		return cm.Item({
			label: globalConsts.CAPTION_MENU_MODIFY_CHEMOBJ, //"Modify molecule...",
			data: globalConsts.MENU_MODIFY_CHEMOBJ,
			context: cm.SelectorContext(WIDGET_SELECTOR),
			contentScriptFile: [
				self.data.url('../lib/globalConsts.js'),
				self.data.url('../lib/globalUtils.js'),
				self.data.url('./components/chemObjModifyContextMenu.js')
			],
			onMessage: function (msg)
			{
				if (msg.message = globalConsts.MSG_SHOW)
					chemObjModifyPanel.show({'querySelElem': true});
			}
		});
	}
};

exports.create = ChemObjContextMenuSetter.create;