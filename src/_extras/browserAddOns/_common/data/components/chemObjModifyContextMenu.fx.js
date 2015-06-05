/**
 * @fileoverview
 * Addon context menu to modify existing chem object on page.
 * @author Partridge Jiang
 */

(function(){

	var ChemObjModifyContextMenuItem = {
		// execute when click on menu item
		execute: function(node, data)
		{
			if (data === globalConsts.MENU_MODIFY_CHEMOBJ)
				M.modifyOnElem(node);
		},
		// modify chem obj in elem
		modifyOnElem: function(elem)
		{
			// select on elem first
			var doc = elem.ownerDocument;
			var selection = doc.getSelection();
			if (selection)
			{
				var range = doc.createRange();
				range.selectNode(elem);
				selection.removeAllRanges();
				selection.addRange(range);
			}
			// emit event to call for edit panel
			self.postMessage(globalConsts.MSG_SHOW);
		},

		_init: function()
		{
			self.on('click', M.execute);
		}
	};
	var M = ChemObjModifyContextMenuItem;

	ChemObjModifyContextMenuItem._init();

})();