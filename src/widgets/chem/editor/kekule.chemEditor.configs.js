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
 * @property {Float} editorInitialZoom Initial zoom level of chem editor.
 * @property {Bool} scrollToObjAfterLoading Whether automatically scroll to the newly loaded chem object in editor.
 * @property {Bool} enableTrackOnNearest If true, hot track or selection will focus on object nearest to coord,
 *   otherwise, focus on topmost object around coord.
 * @property {Bool} enableHotTrack Whether highlighting objects under mouse when mouse moves over editor.
 * @property {Bool} autoSelectNewlyInsertedObjects Whether select objects newly inserted by mouse or pen into editor by IA controllers automatically.
 * @property {Bool} autoSelectNewlyInsertedObjectsOnTouch Whether select objects newly inserted by touch into editor by IA controllers automatically.
 * @property {Int} objBoundTrackMinInflation The bound of object will usually be inflated to make it easier to select. This value controls the minimal inflating degree.
 * @property {Int} selectionMarkerInflation Inflation of selection marker, makes it easier to see the containing objects.
 * @property {Int} selectionMarkerEdgeInflation Inflation when judging if a coord is on selection marker edge.
 * @property {Int} selectionMarkerDefPulseDuration
 * @property {Int} selectionMarkerDefPulseCount
 * @property {Int} selectionCurveSimplificationDistanceThreshold Distance threshold to simplify the selecting curve.
 * @property {Int} rotationRegionInflation A circle with this ratio outside selection area marker will be regarded as rotation region.
 * @property {Float} constrainedRotateStep In constrained rotate mode, rotation angle will only be times of this value.
 * @property {Int} rotationLocationPointDistanceThreshold Rotate will occur only when mouse point distance (from rotation center) larger than this value
 *   (too small distance will cause very sharp rotation).
 * @property {Int} directedMoveDistanceThreshold Directed moving will only be done if moved distance large than this value.
 * @property {Bool} enablePartialAreaSelecting If this value is true, when drag a selecting rubber band, object partial in the band will also be selected.
 * @property {Bool} enableMergePreview When set to true, a preview of merge (instead of actual merge) will be displayed during manipulation of chem objects.
 *   Set this value to true will improve the performance of chem editor.
 * @property {Bool} followPointerCoordOnDirectManipulatingSingleObj If true, the new coord of manipulating object will be set directly by the position of pointer (rather than the delta coord to the original position).
 * @property {Bool} enableOffSelectionManipulation If true, holding pointer down outside selection region for a while
 *   will enter the manipulation state to move the selected objects.
 * @property {Int} OffSelectionManipulationActivatingTimeThreshold Holding pointer down longer then this time (in ms) may
 *   invoker off selection manipulation.
 * @property {Bool} enableGestureManipulation Whether using pinch/rotate gesture to manipulate selected objects is allowed.
 * @property {Bool} enableGestureZoomOnEditor Whether using pinch gesture change the zoom level of editor is allowed.
 * @property {Float} unmovePointerDistanceThreshold When moving less than this distance, pointer will be regarded as still.
 * @property {Int} atomSetterFontSize Font size of atom setter widget.
 * @property {Bool} allowUnknownAtomSymbol If true, input unknown text in atom setter will add new pseudo atom.
 * @property {Bool} enableBondKekulizeHucklize Whether Kekulize and Hucklize buttons are shown in bond modifier of editor.
 * @property {Int} clonedObjectScreenOffset The pixel distance between cloned objects and origin objects when doing clone selection action in editor.
 * @property {Int} selectingCurveSimplificationDistanceThreshold Distance threshold to simplify curves in selecting marker.
 * @property {Float} selectingBrushWidth The selecting brush width.
 * //@property {Int} selectingBrushMinWidth Min width of selecting brush.
 * @property {Int} trackSimplifierDistanceThreshold Distance threshold to simplify curves in track structure input.
 * @property {Float} trackTouchRefLength In touch track input, the editor may be zoomed in to ensure the default bond screen level is this value (in inch).
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

		this.addBoolConfigProp('scrollToObjAfterLoading', true);
		this.addBoolConfigProp('autoSelectNewlyInsertedObjects', !true);
		this.addBoolConfigProp('autoSelectNewlyInsertedObjectsOnTouch', true);

		this.addIntConfigProp('objBoundTrackMinInflation', 5);
		this.addIntConfigProp('objBoundTrackMinInflationMouse', null);
		this.addIntConfigProp('objBoundTrackMinInflationPen', null);
		this.addIntConfigProp('objBoundTrackMinInflationTouch', 10);

		this.addFloatConfigProp('objBoundTrackInflationRatio', 0.2);
		this.addFloatConfigProp('objBoundTrackInflationRatioMouse', null);
		this.addFloatConfigProp('objBoundTrackInflationRatioPen', null);
		this.addFloatConfigProp('objBoundTrackInflationRatioTouch', 0.33);

		this.addBoolConfigProp('enablePartialAreaSelecting', false);
		this.addFloatConfigProp('selectingBrushWidth', 12);
		this.addBoolConfigProp('enableOffSelectionManipulation', true);
		this.addIntConfigProp('offSelectionManipulationActivatingTimeThreshold', 800);
		this.addFloatConfigProp('unmovePointerDistanceThreshold', 5, {'scope': PS.PUBLIC}); // hidden to object inspector
		//this.addFloatConfigProp('selectingBrushMinWidth', 5);
		this.addIntConfigProp('selectingCurveSimplificationDistanceThreshold', 2, {'scope': PS.PUBLIC}); // hidden to object inspector
		this.addIntConfigProp('selectionMarkerInflation', 5);
		this.addIntConfigProp('selectionMarkerEdgeInflation', 5);
		this.addIntConfigProp('selectionMarkerDefPulseDuration', 500);
		this.addIntConfigProp('selectionMarkerDefPulseCount', 2);

		this.addBoolConfigProp('followPointerCoordOnDirectManipulatingSingleObj', true);
		this.addIntConfigProp('followPointerCoordOnDirectManipulatingSingleObjDistanceThreshold', 2);
		//this.addConfigProp('constrainedResizeLevels', DataType.ARRAY, undefined);
		this.addFloatConfigProp('constrainedResizeStep', 0.125/*0.25*/);
		this.addIntConfigProp('rotationRegionInflation', 10);
		this.addFloatConfigProp('constrainedRotateStep', degreeStep * 7.5);  // 7.5 degree
		this.addIntConfigProp('rotationLocationPointDistanceThreshold', 10);
		this.addIntConfigProp('directedMoveDistanceThreshold', 10);
		this.addBoolConfigProp('enableMergePreview', true);

		this.addBoolConfigProp('enableGestureManipulation', true);
		this.addBoolConfigProp('enableGestureZoomOnEditor', true);

		this.addIntConfigProp('clonedObjectScreenOffset', 10);

		this.addIntConfigProp('atomSetterFontSize', 14);
		this.addBoolConfigProp('allowUnknownAtomSymbol', true);

		this.addBoolConfigProp('enableBondKekulizeHucklize', true);

		this.addIntConfigProp('trackSimplifierDistanceThreshold', 8);
		this.addIntConfigProp('trackSimplifierIgnoreSegmentThreshold', 10);
		this.addIntConfigProp('trackMergeDistanceThreshold', 20);
		this.addFloatConfigProp('trackOptimizationAngleConstraint', degreeStep * 30);  // 30 degree
		this.addConfigProp('trackOptimizationDistanceConstraints', DataType.ARRAY, undefined, {'scope': PS.PUBLIC});
		this.addIntConfigProp('trackOptimizationPrimaryDistanceConstraint', 1);
		this.addFloatConfigProp('trackTouchRefLength', 0.5, {'scope': PS.PUBLIC});  // 0.5 inchi
		this.addBoolConfigProp('autoAdjustZoomLevelOnTrackTouching', !true, {'scope': PS.PUBLIC});  // currently has some problems, disable it

		this.addFloatConfigProp('editorInitialZoom', 1.5);
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setTrackOptimizationDistanceConstraints([0.5, 1, 3, 4, 5]);
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
 * @property {Float} selectionMarkerEmphasisOpacity Opacity of a highlighted selection marker.
 * @property {Number} selectionTransformMarkerSize Width/height of selection transform handler box, in px.
 * @property {Float} selectionTransformMarkerOpacity Opacity of selection transform marker.
 * @property {String} selectingMarkerStrokeColor Stroke color of selecting marker.
 * @property {Float} selectingMarkerStrokeWidth Width of selecting marker stroke.
 * @property {String} selectingMarkerStrokeDash Dash style of selecting marker.
 * @property {String} selectingMarkerFillColor Fill color of selecting marker. Usually this value should be set to null (not filled).
 * @property {Float} selectingMarkerOpacity Opacity of selecting marker.
 * @property {String} selectingBrushMarkerStrokeColor Stroke color of selecting brush marker.
 * @property {String} selectingBrushMarkerStrokeDash Dash style of selecting brush marker.
 * @property {Float} selectingBrushMarkerOpacity Opacity of selecting brush marker.
 * @property {String} selectingBrushMarkerStrokeLineCap
 * @property {String} selectingBrushMarkerStrokeLineJoin
 * @property {String} flexStructureAssocMarkerColor Color of marker displaying atom count in flex ring/chain controller.
 * @property {Float} flexStructureAssocMarkerOpacity Opacity of marker displaying atom count in flex ring/chain controller.
 * @property {Int} flexStructureAssocMarkerFontSize Font size of marker displaying atom count in flex ring/chain controller.
 *
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
		this.addFloatConfigProp('selectionMarkerEmphasisOpacity', 0.4);
		this.addFloatConfigProp('selectionTransformMarkerSize', 8, {'scope': PS.PUBLIC});  // currently not used?
		this.addFloatConfigProp('selectionTransformMarkerOpacity', 0.4, {'scope': PS.PUBLIC});  // currently not used?

		this.addStrConfigProp('selectingMarkerStrokeColor', '#000000');
		this.addFloatConfigProp('selectingMarkerStrokeWidth', 1);
		this.addStrConfigProp('selectingMarkerStrokeDash', true);
		this.addStrConfigProp('selectingMarkerFillColor', null);
		this.addFloatConfigProp('selectingMarkerOpacity', 0.7);

		this.addStrConfigProp('selectingBrushMarkerStrokeColor', '#0000FF');
		this.addStrConfigProp('selectingBrushMarkerStrokeDash', false);
		this.addFloatConfigProp('selectingBrushMarkerStrokeLineCap', 'round');
		this.addFloatConfigProp('selectingBrushMarkerStrokeLineJoin', 'round');
		this.addFloatConfigProp('selectingBrushMarkerOpacity', 0.3);

		this.addStrConfigProp('trackMarkerStrokeColor', '#0000AA');
		this.addFloatConfigProp('trackMarkerStrokeWidth', 2);
		this.addStrConfigProp('trackMarkerStrokeDash', false);
		this.addFloatConfigProp('trackMarkerOpacity', 0.5);

		this.addStrConfigProp('flexStructureAssocMarkerColor', '#0000AA');
		this.addFloatConfigProp('flexStructureAssocMarkerOpacity', 0.5);
		this.addIntConfigProp('flexStructureAssocMarkerFontSize', 14);
		this.addStrConfigProp('flexStructureAssocMarkerFontFamily', "Arial, Helvetica, sans-serif");
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
 * @property {Bool} enableChargeAndRadicalMarker If true, marker objects will be used in editor to represent charge and radical.
 * @property {Int}  The max atom count when creating carbon chain using flex chain tool. 0 means no restricts.
 * @property {Int} minFlexRingAtomCount The min atom count when creating carbon ring using flex ring tool.
 * @property {Int} maxFlexRingAtomCount The max atom count when creating carbon ring using flex ring tool. 0 means no restricts.
 * //@property {Int} initialFlexRingAtomCount The initial atom count when creating carbon ring using flex ring tool.
 *
 * @property {Hash} nonAtomNodeInputSetting Settings to restrict the input types of non-atom node.
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
		this.addIntConfigProp('maxFlexChainAtomCount', 0);  // no limits on flex chain
		this.addIntConfigProp('minFlexRingAtomCount', 3);
		this.addIntConfigProp('maxFlexRingAtomCount', 18);  // too large ring cause performance problem
		//this.addIntConfigProp('initialFlexRingAtomCount', 3);

		//this.addBoolConfigProp('enableChargeAndRadicalMarker', true);

		this.addHashConfigProp('enabledNonAtomNodeTypes', {
			'RGroup': true,
			'pseudoatomDummy': true,
			'pseudoatomHetero': true,
			'pseudoatomAny': true,
			'variableAtomList': true,
			'variableAtomNotList': true
		});
		this.addHashConfigProp('enabledBondForms', {
			// covalent bond types
			'single': true,
			'double': true,
			'triple': true,
			'quad': true,
			'explicitAromatic': true,
			// stereo bond types
			'up': true,
			'upInverted': true,
			'down': true,
			'downInverted': true,
			'upOrDown': true,
			'eOrZ': true,
			'closer': true,
			// other types
			'ionic': false,
			'coordinate': false,
			'metallic': false,
			'hydrogen': true
		});
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

		this.setPrimaryOrgChemAtoms(['C', 'H', 'O', 'N', 'P', 'S', 'F', 'Cl', 'Br', 'I', 'Si', 'D', 'C13']);
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
