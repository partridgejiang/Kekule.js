/**
 * @fileoverview
 * Configurations of base editors.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.configs.js
 * requires /utils/kekule.utils.js
 * requires /widgets/kekule.widget.sys.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/editor/kekule.chemEditor.editorUtils.js
 */

(function(){

"use strict";

var PS = Class.PropertyScope;

/**
 * Config class of base editor (class {@link Kekule.Editor.BaseEditor}).
 * @class
 * @augments Kekule.ChemWidget.ChemObjDisplayerConfigs
 *
 * @property {Kekule.EditorConfigs.UiMarkerConfigs} uiMarkerConfigs
 * @property {Kekule.EditorConfigs.InteractionConfigs} interactionConfigs
 * @property {Kekule.Editor.StructureConfigs} structureConfigs
 */
Kekule.Editor.BaseEditorConfigs = Class.create(Kekule.ChemWidget.ChemObjDisplayerConfigs,
/** @lends Kekule.Editor.BaseEditorConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.BaseEditorConfigs',

	/** @private */
	initProperties: function()
	{
		this.addConfigProp('uiMarkerConfigs', 'Kekule.EditorConfigs.UiMarkerConfigs');
		this.addConfigProp('interactionConfigs', 'Kekule.EditorConfigs.InteractionConfigs');
		this.addConfigProp('structureConfigs', 'Kekule.Editor.StructureConfigs');
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('uiMarkerConfigs', new Kekule.Editor.UiMarkerConfigs());
		this.setPropStoreFieldValue('interactionConfigs', new Kekule.Editor.InteractionConfigs());
		this.setPropStoreFieldValue('structureConfigs', new Kekule.Editor.StructureConfigs());
	}
});

/**
 * Config class of chem space editor (class {@link Kekule.Editor.ChemSpaceEditor}).
 * @class
 * @augments Kekule.Editor.BaseEditorConfigs
 *
 * @property {Kekule.Editor.ChemSpaceConfigs} chemSpaceConfigs
 */
Kekule.Editor.ChemSpaceEditorConfigs = Class.create(Kekule.Editor.BaseEditorConfigs,
/** @lends Kekule.Editor.ChemSpaceEditorConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ChemSpaceEditorConfigs',
	/** @private */
	initProperties: function()
	{
		this.addConfigProp('chemSpaceConfigs', 'Kekule.Editor.ChemSpaceConfigs');
		this.addConfigProp('styleSetterConfigs', 'Kekule.Editor.StyleSetterConfigs', undefined, {'scope': PS.PUBLIC});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setPropStoreFieldValue('chemSpaceConfigs', new Kekule.Editor.ChemSpaceConfigs());
		this.setPropStoreFieldValue('styleSetterConfigs', new Kekule.Editor.StyleSetterConfigs());
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Editor.ChemSpaceEditorConfigs);

/**
 * Configs of interaction between user and editor.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Bool} enableTrackOnNearest If true, hot track or selection will focus on object nearest to coord,
 *   otherwise, focus on topmost object around coord.
 * @property {Bool} enableHotTrack Whether highlighting objects under mouse when mouse moves over editor.
 * @property {Int} objBoundTrackInflation The bound of object will usually be inflated to make it easier to select. This value controls the inflating degree.
 * @property {Int} selectionMarkerInflation Inflation of selection marker, makes it easier to see the containing objects.
 * @property {Int} selectionMarkerEdgeInflation Inflation when judging if a coord is on selection marker edge.
 * @property {Int} rotationRegionInflation A circle with this ratio outside selection area marker will be regarded as rotation region.
 * @property {Float} constrainedRotateStep In constrained rotate mode, rotation angle will only be times of this value.
 * @property {Int} rotationLocationPointDistanceThreshold Rotate will occur only when mouse point distance (from rotation center) larger than this value
 *   (too small distance will cause very sharp rotation).
 * @property {Int} directedMoveDistanceThreshold Directed moving will only be done if moved distance large than this value.
 * @property {Bool} enablePartialAreaSelecting If this value is true, when drag a selecting rubber band, object partial in the band will also be selected.
 * @property {Int} atomSetterFontSize Font size of atom setter widget.
 * @property {Bool} allowUnknownAtomSymbol If true, input unknown text in atom setter will add new pseudo atom.
 * @property {Int} clonedObjectScreenOffset The pixel distance between cloned objects and origin objects when doing clone selection action in editor.
 */
Kekule.Editor.InteractionConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Editor.InteractionConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.InteractionConfigs',
	/** @private */
	initProperties: function()
	{
		var degreeStep = Math.PI / 180;

		this.addBoolConfigProp('enableTrackOnNearest', true);

		this.addBoolConfigProp('enableHotTrack', true);
		this.addIntConfigProp('objBoundTrackInflation', 5);
		this.addBoolConfigProp('enablePartialAreaSelecting', false);
		this.addIntConfigProp('selectionMarkerInflation', 5, {'scope': PS.PUBLIC});
		this.addIntConfigProp('selectionMarkerEdgeInflation', 5, {'scope': PS.PUBLIC});
		this.addIntConfigProp('rotationRegionInflation', 10, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('constrainedRotateStep', degreeStep * 15, {'scope': PS.PUBLIC});  // 15 degree
		this.addIntConfigProp('rotationLocationPointDistanceThreshold', 10);
		this.addIntConfigProp('directedMoveDistanceThreshold', 10);

		this.addIntConfigProp('clonedObjectScreenOffset', 10);

		this.addIntConfigProp('atomSetterFontSize', 14);
		this.addBoolConfigProp('allowUnknownAtomSymbol', true);
	}
});

/**
 * Configs of UI marker styles.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {String} hotTrackerColor Color of hot track marker.
 * @property {Float} hotTrackerOpacity Opacity of hot track marker.
 * @property {String} selectionMarkerStrokeColor Stroke color of selection marker.
 * @property {Float} selectionMarkerStrokeWidth Width of selection marker stroke.
 * @property {String} selectionMarkerFillColor Fill color of selection marker. Usually this value should be set to null (not filled).
 * @property {Float} selectionMarkerOpacity Opacity of selection marker.
 * @property {Number} selectionTransformMarkerSize Width/height of selection transform handler box, in px.
 * @property {Float} selectionTransformMarkerOpacity Opacity of selection transform marker.
 * @property {String} selectingMarkerStrokeColor Stroke color of selecting marker.
 * @property {Float} selectingMarkerStrokeWidth Width of selecting marker stroke.
 * @property {String} selectingMarkerStrokeDash Dash style of selecting marker.
 * @property {String} selectingMarkerFillColor Fill color of selecting marker. Usually this value should be set to null (not filled).
 * @property {Float} selectingMarkerOpacity Opacity of selecting marker.
 */
Kekule.Editor.UiMarkerConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Editor.UiMarkerConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.UiMarkerConfigs',
	/** @private */
	initProperties: function()
	{
		this.addStrConfigProp('hotTrackerColor', '#0000FF');
		this.addFloatConfigProp('hotTrackerOpacity', 0.5);

		this.addStrConfigProp('selectionMarkerStrokeColor', '#0000FF');
		this.addFloatConfigProp('selectionMarkerStrokeWidth', 2);
		this.addStrConfigProp('selectionMarkerFillColor', '#0000FF');
		this.addFloatConfigProp('selectionMarkerOpacity', 0.2);
		this.addFloatConfigProp('selectionTransformMarkerSize', 8, {'scope': PS.PUBLIC});  // currently not used?
		this.addFloatConfigProp('selectionTransformMarkerOpacity', 0.4, {'scope': PS.PUBLIC});  // currently not used?

		this.addStrConfigProp('selectingMarkerStrokeColor', '#000000');
		this.addFloatConfigProp('selectingMarkerStrokeWidth', 1);
		this.addStrConfigProp('selectingMarkerStrokeDash', true);
		this.addStrConfigProp('selectingMarkerFillColor', null);
		this.addFloatConfigProp('selectingMarkerOpacity', 0.7);
	}
});

/**
 * Configs of molecule structure settings.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {String} defBondType Default type of bond.
 * @property {Int} defBondOrder Default order of bond.
 * @property {Int} defBondLength Default bond length.
 * @property {Array} defBondAngles A mapping of default 2D bond angles to different bond types, in arc.
 *   The mapping is a series of values like the following:
 *     angles[bondOrder1][0] = [defaultAngle];
 *     angles[bondOrder1][bondOrder2] = [angle of two bonds];
 * @property {Float} bondConstrainedDirectionDelta When moving bond, the bond angle will be changed in n*delta in constrained mode.
 * @property {Array} bondConstrainedDirectionAngles When moving bond, besides bondConstrainedDirectionDelta, bond angle can also be "docked" to these values.
 * @property {Float} bondConstrainedDirectionAngleThreshold
 * @property {Float} initialBondDirection When create a brand new bond (without any existed bond connected), which direction should the bond be.
 * @property {String} defIsotopeId Default isotope of atom.
 * @property {Array} primaryOrgChemAtoms Atom symbols of most often seen in organic chemistry.
 */
Kekule.Editor.StructureConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Editor.StructureConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.StructureConfigs',
	/** @private */
	initProperties: function()
	{
		/*
		 this.addFloatConfigProp('defBondAngle', Math.PI * 2 / 3);
		 this.defineProp('defBondAngleDegree', {'dataType': DataType.FLOAT,
		 'getter': function() { return this.getDefBondAngle() * 180 / Math.PI; },
		 'setter': function(value) { this.setDefBondAngle(value * Math.PI / 180); }
		 });
		 */
		this.addStrConfigProp('defBondType', Kekule.BondType.DEFAULT, {'enumSource': Kekule.BondType});
		this.addIntConfigProp('defBondOrder', Kekule.BondOrder.SINGLE, {'enumSource': Kekule.BondOrder});
		this.addFloatConfigProp('defBondLength', 0.8);
		this.addConfigProp('defBondAngles', DataType.ARRAY, undefined, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('bondConstrainedDirectionDelta', undefined, {'scope': PS.PUBLIC});
		this.addConfigProp('bondConstrainedDirectionAngles', DataType.ARRAY, undefined, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('bondConstrainedDirectionAngleThreshold', undefined, {'scope': PS.PUBLIC});
		this.addFloatConfigProp('initialBondDirection', undefined, {'scope': PS.PUBLIC});
		this.addStrConfigProp('defIsotopeId', 'C');
		this.addConfigProp('primaryOrgChemAtoms', DataType.ARRAY, undefined, {'scope': PS.PUBLIC});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();

		var degreeStep = Math.PI / 180;

		// init defBondAngles array
		var angles = [];
		var BO = Kekule.BondOrder;
		var angle120 = Math.PI * 2 / 3;
		angles[0] = angle120;  // default value for unset bonds
		angles[BO.EXPLICIT_AROMATIC] = [angle120];
		angles[BO.TRIPLE] = [Math.PI];
		angles[BO.DOUBLE] = [angle120];
		angles[BO.DOUBLE][BO.DOUBLE] = Math.PI;
		angles[BO.SINGLE] = [angle120];

		this.setDefBondAngles(angles);
		this.setBondConstrainedDirectionDelta(10 * Math.PI / 180);
		this.setBondConstrainedDirectionAngles([0, 90 * degreeStep, 180 * degreeStep, 270 * degreeStep]);
		this.setBondConstrainedDirectionAngleThreshold(degreeStep * 3);
		this.setInitialBondDirection(30 * degreeStep);

		this.setPrimaryOrgChemAtoms(['C', 'H', 'O', 'N', 'P', 'S', 'F', 'Cl', 'Br', 'I']);
	},

	/**
	 * Get the default bond angle of two valence bonds.
	 * @param {Int} bondOrder1
	 * @param {Int} bondOrder2
	 * @returns {Float}
	 */
	getDefAngleOfBonds: function(bondOrder1, bondOrder2)
	{
		var b1 = bondOrder1 || 0;
		var b2 = bondOrder2 || 0;
		if (b1 > b2)
		{
			b1 = bondOrder2 || 0;
			b2 = bondOrder1 || 0;
		}
		var angles = this.getDefBondAngles();
		var map = angles[b2];
		if (!map)
			return angles[0];  // default value for unset bonds
		else
		{
			var value = map[b1];
			return value || map[0];
		}
	},

	/**
	 * Returns default angle when added new bond to startObj.
	 * @param {Kekule.ChemObject} startObj
	 * @param {Int} newBondOrder
	 * @return {Float}
	 */
	getNewBondDefAngle: function(startObj, newBondOrder)
	{
		if (Kekule.ObjUtils.isUnset(newBondOrder))
			newBondOrder = this.getDefBondOrder();
		var result;
		var surroundingObjs = Kekule.Editor.StructureUtils.getSurroundingObjs(startObj);
		if (surroundingObjs.length === 1)  // one existing bond, defAngle is decided by new bond order and existing bond order
		{
			var existingConnector = startObj.getLinkedConnectorAt(0);
			if (existingConnector && (existingConnector.getConnectedObjs().indexOf(surroundingObjs[0]) >= 0))
			{
				var existingBondOrder = existingConnector.getBondOrder? existingConnector.getBondOrder(): null;
				if (Kekule.ObjUtils.notUnset(existingBondOrder))
					result = this.getDefAngleOfBonds(newBondOrder, existingBondOrder);
			}
		}
		else if (surroundingObjs.length === 0)  // no connected bond, use initialDirection
			result = this.getInitialBondDirection();
		else
			result = this.getDefAngleOfBonds(newBondOrder, 0);
		return result;
	}
});

/**
 * Configs of chem space default settings.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Hash} defScreenSize2D Default 2D screen size of space, based on px.
 * @property {Hash} defScreenSize3D Default 3D size of space.
 * @property {Num} defPadding Padding on top when adding an unpositioned object to container chem space.
 */
Kekule.Editor.ChemSpaceConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Editor.ChemSpaceConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.ChemSpaceConfigs',
	/** @private */
	initProperties: function()
	{
		this.addHashConfigProp('defScreenSize2D');
		this.addHashConfigProp('defScreenSize3D');
		this.addNumConfigProp('defPadding', 50);
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setDefScreenSize2D({'x': 900, 'y': 1500});
		this.setDefScreenSize3D({'x': 600, 'y': 600, 'z': 600});
	}
});

/**
 * Configs of chem composer style toolbar settings.
 * @class
 * @augments Kekule.AbstractConfigs
 *
 * @property {Array} listedFontSizes Predefined font size displayed in font size combo box, in px.
 * @property {Array} listedFontNames Predefined font names displayed in font size combo box.
 */
Kekule.Editor.StyleSetterConfigs = Class.create(Kekule.AbstractConfigs,
/** @lends Kekule.Editor.StyleSetterConfigs# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.StyleSetterConfigs',
	/** @private */
	initProperties: function()
	{
		this.defineProp('listedFontSizes', {'dataType': DataType.ARRAY});
		this.defineProp('listedFontNames', {'dataType': DataType.ARRAY});
	},
	/** @private */
	initPropValues: function($super)
	{
		$super();
		this.setListedFontSizes([8,9,10,11,12,14,16,18,20,24,28,32,36,40,44,48,54,60,66,72,80,88,96]);
		/*
		this.setListedFontNames([
			'Arial, Helvetica, sans-serif',
			'Georgia, Times New Roman, Times, serif',
			'Courier New, Courier, monospace',
			'Tahoma, Geneva, sans-serif',
			'Trebuchet MS, Arial, Helvetica, sans-serif',
			'Arial Black, Gadget, sans-serif',
			'Palatino Linotype, Book Antiqua, Palatino, serif',
			'Lucida Sans Unicode, Lucida Grande, sans-serif',
			'MS Serif, New York, serif',
			'Lucida Console, Monaco, monospace',
			'Comic Sans MS, cursive'
		]);
		*/
		this.setListedFontNames(Kekule.Widget.FontEnumerator.getAvailableFontFamilies());
	}
});

})();
