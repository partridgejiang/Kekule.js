/**
 * @fileoverview
 * Util classes for chem glyphs.
 * @author Partridge Jiang
 */

/*
 * requires /core/kekule.common.js
 * requires /chemdoc/kekule.commonChemMarkers.js
 */

(function(){
"use strict";

////////////// A util class for electron donor/receptor arrows ///////////
/** @ignore */
Kekule.Glyph.ElectronArrowGlyphUtils = {
	isValidChemNodeOrConnectorStickTarget: function(targetObj)
	{
		var result = (targetObj instanceof Kekule.ChemStructureNode) || (targetObj instanceof Kekule.ChemStructureConnector);
		if (!result && (targetObj instanceof Kekule.ChemMarker.BaseMarker))
		{
			var parent = targetObj.getParent && targetObj.getParent();
			if (parent)  // the marker of node/connector (e.g., electron pair) can also be a valid target
				result = (parent instanceof Kekule.ChemStructureNode) || (parent instanceof Kekule.ChemStructureConnector);
		}
		return result;
	},
	isValidElectronTarget: function(obj)
	{
		return Kekule.Glyph.ElectronArrowGlyphUtils.isValidChemNodeOrConnectorStickTarget(obj);
	},
	getValidElectronTarget: function(glyphNode)
	{
		var stickTarget = glyphNode && glyphNode.getCoordStickTarget && glyphNode.getCoordStickTarget();
		if (stickTarget && Kekule.Glyph.ElectronArrowGlyphUtils.isValidElectronTarget(stickTarget))
			return stickTarget;
		else
			return null;
	},
	setValidElectronTarget: function(glyphNode, target)
	{
		if (glyphNode.getAllowCoordStickTo && glyphNode.getAllowCoordStickTo(target))
		{
			if (!target)
				glyphNode.setCoordStickTarget(null);
			else if (Kekule.Glyph.ElectronArrowGlyphUtils.isValidElectronTarget(target))
				glyphNode.setCoordStickTarget(target);
		}
	},
	getValidElectronTargetNodeOrConnector: function(glyphNode)
	{
		var result = null;
		var target = Kekule.Glyph.ElectronArrowGlyphUtils.getValidElectronTarget(glyphNode);
		if (target)
		{
			if (target instanceof Kekule.ChemMarker.BaseMarker)
				result = target.getParent();
			else
				result = target;
		}
		return result;
	},
};

})();