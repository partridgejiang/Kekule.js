/**
 * @fileoverview
 * A file to store string constants for define properties of objects.
 * @author Partridge Jiang
 */

/** @ignore */
Kekule.LOCAL_RES = true;

Kekule.Localization.setCurrModule('objDefines');

/** @ignore */
Kekule.OBJDEF_TEXTS = {};

/** @ignore */
//Kekule.OBJDEF_TEXTS.en =
Kekule.Localization.addResource('en', 'OBJDEF_TEXTS',
{
	TITLE_PREFIX: 'TITLE_',
	DESCRIPTION_PREFIX: 'DES_',
	//---------------------- General ------------------------
	// titles

	// descriptions
	DES_ID: 'Unique ID for object.',

	Render: {
		GeneralConfigs: {
			TITLE_drawOpacity: 'Opacity',
			DES_drawOpacity: 'Opacity (between 0-1) to draw objects'
		},
		Render2DConfigs: {
			TITLE_generalConfigs: 'General render settings',
			DES_generalConfigs: 'General render settings',
			TITLE_moleculeDisplayConfigs: 'Molecule display settings',
			DES_moleculeDisplayConfigs: 'Settings about molecule display styles',
			TITLE_displayLabelConfigs: 'Display label settings',
			DES_displayLabelConfigs: 'Settings of displayed label in molecule/chem object',
			TITLE_textFontConfigs: 'Text and font settings',
			DES_textFontConfigs: 'Settings about text and font of display',
			TITLE_lengthConfigs: 'Lengths settings',
			DES_lengthConfigs: 'Lengths to display molecule/chem object',
			TITLE_colorConfigs: 'Color settings',
			DES_colorConfigs: 'Color settings to display molecule/chem object'
		},
		MoleculeDisplayConfigs: {
			TITLE_defMoleculeDisplayType: 'Default molecule display mode',
			DES_defMoleculeDisplayType: 'Default display type of molecule: in skeletal or in condensed mode',
			TITLE_defNodeDisplayMode: 'Default atom display mode',
			DES_defNodeDisplayMode: 'Default mode to display atom in molecule',
			TITLE_defHydrogenDisplayLevel: 'Default hydrogen display level',
			DES_defHydrogenDisplayLevel: 'How to display explicit or implicit hydrogens of atom',
			TITLE_defChargeMarkType: 'Default charge mark type',
			DES_defChargeMarkType: null,    // TODO: how to descript this
			TITLE_partialChargeDecimalsLength: 'Decimal length of partial charge',
			DES_partialChargeDecimalsLength: 'If an atom has a partical charge (e.g., +1.5), how many digits after decimal point should be displayed'
		},
		DisplayLabelConfigs: {
			TITLE_enableIsotopeAlias: 'Enable isotope alias',
			DES_enableIsotopeAlias: 'Whether isotope alias (e.g. D for 2H) is used to display atom label.',
			TITLE_unsetElement: 'Unset element',
			DES_unsetElement: 'Label for unset or unknown element',
			TITLE_dummyAtom: 'Dummy atom',
			DES_dummyAtom: 'Label for dummy atom',
			TITLE_heteroAtom: 'Hetero atom',
			DES_heteroAtom: 'Label for general hetero atom',
			TITLE_anyAtom: 'Any atom',
			DES_anyAtom: 'Label for atom wildcard',
			TITLE_variableAtom: 'Variable atom',
			DES_variableAtom: 'Label for variable atom or atom list',
			TITLE_rgroup: 'RGroup',
			DES_rgroup: 'Label for RGroup',
			TITLE_isoListLeadingBracket: 'Atom list leading bracket',
			TITLE_isoListTailingBracket: 'Atom list tailing bracket',
			TITLE_isoListDelimiter: 'Atom delimiter in list',
			TITLE_isoListDisallowPrefix: 'Prefix of not-atom list'
		},
		TextFontConfigs: {
			TITLE_labelFontFamily: 'Label font',
			DES_labelFontFamily: 'Font to draw general label',
			TITLE_atomFontFamily: 'Atom font',
			DES_atomFontFamily: 'Font to draw atom label',
			TITLE_supFontSizeRatio: 'Superscript font size ratio',
			DES_supFontSizeRatio: 'Ratio of Superscript text size to normal text size',
			TITLE_subFontSizeRatio: 'Subscript font size ratio',
			DES_subFontSizeRatio: 'Ratio of Subscript text size to normal text size',
			TITLE_superscriptOverhang: 'Superscript text overhang',
			DES_superscriptOverhang: null,
			TITLE_subscriptOversink: 'Subscript text oversink',
			DES_subscriptOversink: null,
			TITLE_textCharDirection: 'Text direction',
			DES_textCharDirection: 'Default text direction',
			TITLE_textHorizontalAlign: 'Horizontal text alignment',
			DES_textHorizontalAlign: 'Default horizontal text alignment of label',
			TITLE_textVerticalAlign: 'Vertical text alignment',
			DES_textVerticalAlign: 'Default vertical text alignment of label'
		},
		LengthConfigs: {
			TITLE_labelFontSize: 'Label text size',
			DES_labelFontSize: 'Size of general label text',
			TITLE_atomFontSize: 'Atom text size',
			DES_atomFontSize: 'Size of atom label text',
			TITLE_allenCenterAtomRadius: 'Allen center radius',
			DES_allenCenterAtomRadius: 'Radius to draw dot on center carbon atom in allen',
			TITLE_chargeMarkFontSize: 'Charge mark size',
			DES_chargeMarkFontSize: 'Font size of charge mark',
			TITLE_chargeMarkMargin: 'Charge mark margin',
			DES_chargeMarkMargin: 'Margin between charge mark and atom',
			TITLE_defBondLength: 'Default bond length',
			DES_defBondLength: 'Default length of a chemical bond',
			TITLE_bondLineWidth: 'Bond line width',
			DES_bondLineWidth: 'Line width to draw a chemical bond',
			TITLE_hashSpacing: 'Hash spacing',
			DES_hashSpacing: 'Spacing between small lines in hash bond',
			TITLE_multipleBondSpacingRatio: 'Multiple bond spacing ratio',
			DES_multipleBondSpacingRatio: 'Ratio of spacing between two lines in double or triple bond to bond length.',
			TITLE_multipleBondMaxAbsSpacing: 'Max multiple bond spacing',
			DES_multipleBondMaxAbsSpacing: 'Maximum spacing between multiple bond',
			TITLE_bondArrowLength: 'Bond arrow length',
			DES_bondArrowLength: 'The length of end triangle in arrow bond',
			TITLE_bondArrowWidth: 'Bond arrow width',
			DES_bondArrowWidth: 'The width of end triangle in arrow bond',
			TITLE_bondWedgeWidth: 'Bond wedge max width',
			DES_bondWedgeWidth: 'The width of ending point in wedge bond',
			TITLE_bondWedgeHashMinWidth: 'Bond wedge min width',
			DES_bondWedgeHashMinWidth: 'The width of starting point in wedge bond',
			TITLE_bondWavyRadius: 'Bond wavy radius',
			DES_bondWavyRadius: 'Radius to draw arc of wavy bond',
			TITLE_glyphStrokeWidth: 'Glyph stroke width',
			DES_glyphStrokeWidth: 'The default width of glyph strokes',
			TITLE_autofitContextPadding: 'Autofit context padding',
			DES_autofitContextPadding: 'Padding of autofit widget edge and drawn object'
		},
		ColorConfigs:	{
			TITLE_useAtomSpecifiedColor: 'Use element specified color',
			DES_useAtomSpecifiedColor: 'Whether use different color on different element',
			TITLE_labelColor: 'Label color',
			DES_labelColor: 'Default color of general label',
			TITLE_atomColor: 'Atom color',
			DES_atomColor: 'Default color of atom label',
			TITLE_bondColor: 'Bond color',
			DES_bondColor: 'Default color of bond',
			TITLE_glyphStrokeColor: 'Glyph stroke color',
			DES_glyphStrokeColor: 'Default stroke color of glyph',
			TITLE_glyphFillColor: 'Glyph fill color',
			DES_glyphFillColor: 'Default fill color of glyph'
		},

		Render3DConfigs: {
			TITLE_generalConfigs: 'General render settings',
			DES_generalConfigs: 'General render settings',
			TITLE_moleculeDisplayConfigs: 'Molecule display settings',
			DES_moleculeDisplayConfigs: 'Settings about molecule display styles',
			TITLE_environmentConfigs: '3D environment settings',
			DES_environmentConfigs: 'Settings of 3D environment',
			TITLE_modelConfigs: '3D model settings',
			DES_modelConfigs: 'Settings to render a 3D molecule model',
			TITLE_lengthConfigs: 'Lengths settings',
			DES_lengthConfigs: 'Lengths to display molecule'
		},
		Render3DEnvironmentConfigs: {
			TITLE_graphicQuality: 'Graphic quality',
			DES_graphicQuality: 'Quality of 3D graphic'
		},
		Molecule3DDisplayConfigs: {
			TITLE_defMoleculeDisplayType: 'Default molecule display type',
			DES_defMoleculeDisplayType: 'Draw molecule in wire, stick, ball stick or space fill mode',
			TITLE_defBondSpliceMode: 'Bond splice mode',
			DES_defBondSpliceMode: 'How to draw a splice mode between two atoms with different color',
			TITLE_defDisplayMultipleBond: 'Display multiple bond',
			DES_defDisplayMultipleBond: 'Whether draw multiple bond lines for double or triple bond',
			TITLE_defBondColor: 'Default bond color',
			DES_defBondColor: 'Default bond color',
			TITLE_defAtomColor: 'Default atom color',
			DES_defAtomColor: 'Default atom color',
			TITLE_useAtomSpecifiedColor: 'Use element specified color',
			DES_useAtomSpecifiedColor: 'Whether use different color on different element'
		},
		Model3DConfigs: {
			TITLE_hideHydrogens: 'Hide hydrogens',
			DES_hideHydrogens: 'Whether hide all hydrogen atoms in 3D model',
			TITLE_useVdWRadius: 'Use von dar Waals radius',
			DES_useVdWRadius: 'Whether use atom\'s von dar Waals radius to draw 3D model',
			TITLE_multiConnectorRadiusRatio: 'Multi-bond radius ratio',
			DES_multiConnectorRadiusRatio: 'If use multi-cylinder for multibond, this value is the radius ratio between multi and single bond',
			TITLE_multiConnectorMarginRatio: 'Multi-bond margin ratio',
			DES_multiConnectorMarginRatio: 'If multi-cylinder is used for multibond, ratio of margin between cylinders and radius of cylinder'
		},
		Length3DConfigs: {
			TITLE_fixedNodeRadius: 'Fixed atom radius',
			DES_fixedNodeRadius: 'If vdW radius of atom is not used, this value will be used for all atom\'s radius',
			TITLE_connectorRadius: 'Bond radius',
			DES_connectorRadius: 'Bond will be draw based on this radius in stick or ball_stick mode',
			TITLE_connectorLineWidth: 'Bond line width',
			DES_connectorLineWidth: 'Bond will be draw on this width in wire mode'
		}
	},

	Widget: {
		BaseWidget: {
			TITLE_settingFacade: 'General settings',
			DES_settingFacade: 'General settings'
		}
	},

	ChemWidget: {
		ChemObjDisplayer: {
			TITLE_enableLoadNewFile: 'Enable load data',
			DES_enableLoadNewFile: 'Whether loading new data is enabled'
		},
		ChemObjDisplayerConfigs: {
			TITLE_ioConfigs: 'I/O settings',
			DES_ioConfigs: 'Settings of input/output'
		},
		ChemObjDisplayerIOConfigs: {
			TITLE_canonicalizeBeforeSave: 'Canonicalize before save',
			DES_canonicalizeBeforeSave: 'Whether canonicalize molecule before saving it'
		},
		Viewer:	{
			TITLE_enableDirectInteraction: 'Enable direct interaction',
			DES_enableDirectInteraction: 'Whether interaction with chem object in viewer is enabled',
			TITLE_enableTouchInteraction: 'Enable touch interaction',
			DES_enableTouchInteraction: 'Whether touch interaction is enabled',
			TITLE_enableToolbar: 'Enable toolbar',
			DES_enableToolbar: 'Whether toolbar of viewer is displayed',
			TITLE_toolbarPos: 'Toolbar Position',
			DES_toolbarPos: 'Position of toolbar in viewer',
			TITLE_toolbarMarginHorizontal: 'Toolbar horizontal margin',
			DES_toolbarMarginHorizontal: 'Horizontal margin of toolbar to viewer edge',
			TITLE_toolbarMarginVertical: 'Toolbar vertical margin',
			DES_toolbarMarginVertical: 'Vertical margin of toolbar to viewer edge',
			TITLE_enableEdit: 'Enable editing',
			DES_enableEdit: 'Whether edit chem object in viewer is enabled',
			TITLE_modalEdit: 'Modal editing',
			DES_modalEdit: 'Using modal dialog or popup dialog to edit chem object'
		}
	},

	Editor: {
		BaseEditorConfigs: {
			TITLE_uiMarkerConfigs: 'UI marker settings',
			DES_uiMarkerConfigs: 'Settings of interaction marker',
			TITLE_interactionConfigs: 'Interaction settings',
			DES_interactionConfigs: 'Settings about interaction of editor',
			TITLE_structureConfigs: 'Structure settings',
			DES_structureConfigs: 'Settings about creating molecule structure'
		},
		ChemSpaceEditorConfigs: {
			TITLE_chemSpaceConfigs: 'Chem space settings',
			DES_chemSpaceConfigs: 'Settings about chem space/chem document',
			TITLE_styleSetterConfigs: 'Style setter settings',
			DES_styleSetterConfigs: 'Settings of style toolbar of editor'
		},
		InteractionConfigs: {
			TITLE_enableTrackOnNearest: 'Enale track on nearest',
			DES_enableTrackOnNearest: 'If setting to true, hot track or selection will focus on nearest object to current position, otherwise, the topmost object around will be focused.',
			TITLE_enableHotTrack: 'Enable hot track',
			DES_enableHotTrack: 'Whether highlighting objects under mouse position',
			TITLE_autoSelectNewlyInsertedObjects: 'Auto select new inserted objects',
			DES_autoSelectNewlyInsertedObjects: 'Whether select objects newly inserted or modified in editor automatically',
			TITLE_objBoundTrackMinInflation: 'Object bound minimal inflation (default)',
			DES_objBoundTrackMinInflation: 'The default minimal inflation of the bound of object to make it easier to select',
			TITLE_objBoundTrackMinInflationMouse: 'Object bound minimal inflation (mouse)',
			DES_objBoundTrackMinInflationMouse: 'The minimal inflation of the bound of object to make it easier to select when using mouse as pointer device',
			TITLE_objBoundTrackMinInflationTouch: 'Object bound minimal inflation (touch)',
			DES_objBoundTrackMinInflationTouch: 'The minimal inflation of the bound of object to make it easier to select when touching on screen',
			TITLE_objBoundTrackMinInflationPen: 'Object bound minimal inflation (pen)',
			DES_objBoundTrackMinInflationPen: 'The minimal inflation of the bound of object to make it easier to select when using pen as pointer device',
			TITLE_objBoundTrackInflationRatio: 'Object bound inflation ratio (default)',
			DES_objBoundTrackInflationRatio: 'The default inflation ratio (compaing with the default bond length) of the bound of object to make it easier to select',
			TITLE_objBoundTrackInflationRatioMouse: 'Object bound inflation ratio (mouse)',
			DES_objBoundTrackInflationRatioMouse: 'The inflation ratio (compaing with the default bond length) of the bound of object to make it easier to select when using mouse as pointer device',
			TITLE_objBoundTrackInflationRatioPen: 'Object bound inflation ratio (pen)',
			DES_objBoundTrackInflationRatioPen: 'The inflation ratio (compaing with the default bond length) of the bound of object to make it easier to select when using pen as pointer device',
			TITLE_objBoundTrackInflationRatioTouch: 'Object bound inflation ratio (touch)',
			DES_objBoundTrackInflationRatioTouch: 'The inflation ratio (compaing with the default bond length) of the bound of object to make it easier to select when touching on screen',
			TITLE_selectionMarkerInflation: 'Selection marker inflation',
			DES_selectionMarkerInflation: 'Inflation of object selection mark, makes it easier to see the containing objects',
			TITLE_selectionMarkerEdgeInflation: 'Selection edge inflation',
			DES_selectionMarkerEdgeInflation: 'Inflation when judging if a coord is on selection mark edge',
			TITLE_constrainedRotateStep: 'Constrained rotation step',
			DES_constrainedRotateStep: 'Constrained rotation step, in arc',
			TITLE_rotationLocationPointDistanceThreshold: 'Rotation starting min distance',
			DES_rotationLocationPointDistanceThreshold: 'Rotation will occur only when mouse point distance (from rotation center) larger than this value',
			TITLE_directedMoveDistanceThreshold: 'Direct move min distance',
			DES_directedMoveDistanceThreshold: 'Direct moving will only be done if moved distance large than this value',
			TITLE_enablePartialAreaSelecting: 'Enable partial selecting',
			DES_enablePartialAreaSelecting: 'If this value is true, when drag a selecting rubber band, object partly in the band will be totally selected',
			TITLE_selectingBrushWidth: 'Brush selecting Width',
			DES_selectingBrushWidth: 'Width of brush in brush selecting',
			TITLE_enableOffSelectionManipulation: 'Enable off-selection manipulation',
			DES_enableOffSelectionManipulation: 'When setting to true, you can still move, resize or rotate selected objects by holding mouse or touch outside selection for a while',
			TITLE_offSelectionManipulationActivatingTimeThreshold: 'Off-selection manipulation hold time',
			DES_offSelectionManipulationActivatingTimeThreshold: 'The minimal time (in ms) need for holding mouse or touch to invoke off-selection manipulation',
			TITLE_selectionMarkerDefPulseDuration: 'Default selection mark pulse duration',
			DES_selectionMarkerDefPulseDuration: 'The duration (in ms) of selection mark pulse when the selection is been emphasised',
			TITLE_selectionMarkerDefPulseCount: 'Default selection mark pulse count',
			DES_selectionMarkerDefPulseCount: 'The pulse count when the selection is been emphasised',
			TITLE_rotationRegionInflation: 'Rotation region inflation',
			DES_rotationRegionInflation: 'User can rotate the selected objects by pressing and move mouse in this inflated region outside selection',
			TITLE_enableMergePreview: 'Enable merge preview',
			DES_enableMergePreview: 'Whether a preview operation is used rather then the actual merge operation when merge two objects in editor during manipulation. Turn on this option may improve the performance of object manipulation.',
			TITLE_enableGestureManipulation: 'Enable gesture manipulation',
			DES_enableGestureManipulation: 'Whether user can use touch gestures (e.g. pinch) to scale or rotate selected objects in editor',
			TITLE_enableGestureZoomOnEditor: 'Enable gesture zoom on editor',
			DES_enableGestureZoomOnEditor: 'Whether user can use pinch gesture to zoom in or out the editor when there is no selection existed',

			TITLE_trackSimplifierDistanceThreshold: 'Track-input curve simplification threshold',
			DES_trackSimplifierDistanceThreshold: 'Distance threshold in simplifying curve drawn by track-input tool',
			TITLE_trackSimplifierIgnoreSegmentThreshold: 'Track-input ignored segment threshold',
			DES_trackSimplifierIgnoreSegmentThreshold: 'Segment length less than this threshold drawn by track-input will be ignored in parsing',
			TITLE_trackMergeDistanceThreshold: 'Track-input merge distance threshold',
			DES_trackMergeDistanceThreshold: 'If a joint or end point of line segment drawn by track-inpu tool is close to another line segment (less than this threshold), it will be regarded on that line.',
			TITLE_trackOptimizationAngleConstraint: 'Track-input optimization line cross angle constraint',
			DES_trackOptimizationAngleConstraint: null,
			TITLE_trackOptimizationDistanceConstraints: 'Track-input optimization line length constraint',
			DES_trackOptimizationDistanceConstraints: null,
			TITLE_trackOptimizationPrimaryDistanceConstraint: 'Track-input optimization primary line length',
			DES_trackOptimizationPrimaryDistanceConstraint: null,
			TITLE_autoAdjustZoomLevelOnTrackTouching: null,
			DES_autoAdjustZoomLevelOnTrackTouching: null,

			TITLE_editorInitialZoom: 'Editor initial zoom level',
			DES_editorInitialZoom: 'The initial zoom level of editor',

			TITLE_atomSetterFontSize: 'Atom setter font size',
			DES_atomSetterFontSize: 'Font size of atom setter',
			TITLE_allowUnknownAtomSymbol: 'Allow unknown atom symbol',
			DES_allowUnknownAtomSymbol: 'Allow inputting unknown symbol and handle it as pseudo atom in atom setter',
			TITLE_clonedObjectScreenOffset: 'Copied object coord offset',
			DES_clonedObjectScreenOffset: 'The distance between copied objects and origin objects when doing paste selection action in editor'
		},
		UiMarkerConfigs: {
			TITLE_hotTrackerColor: 'Hot track mark color',
			DES_hotTrackerColor: 'Color of hot track mark',
			TITLE_hotTrackerOpacity: 'Hot track mark opacity',
			DES_hotTrackerOpacity: 'Opacity of hot track marker, value from 0 to 1',
			TITLE_selectionMarkerStrokeColor: 'Selection mark stroke color',
			DES_selectionMarkerStrokeColor: 'Stroke color of selection mark',
			TITLE_selectionMarkerStrokeWidth: 'Selection mark stroke width',
			DES_selectionMarkerStrokeWidth: 'Width of selection mark stroke',
			TITLE_selectionMarkerFillColor: 'Selection mark fill color',
			DES_selectionMarkerFillColor: 'Fill color of selection mark.',
			TITLE_selectionMarkerOpacity: 'Selection mark opacity',
			DES_selectionMarkerOpacity: 'Opacity of selection mark, value from 0 to 1',
			TITLE_selectionMarkerEmphasisOpacity: 'Emphasised selection mark opacity',
			DES_selectionMarkerEmphasisOpacity: 'Opacity of emphasised selection marker, value from 0 to 1',
			TITLE_selectingMarkerStrokeColor: 'Selecting mark stroke color',
			DES_selectingMarkerStrokeColor: 'Stroke color of selecting rubber band mark',
			TITLE_selectingMarkerStrokeWidth: 'Selecting mark stroke width',
			DES_selectingMarkerStrokeWidth: 'Stroke width of selection rubber band',
			TITLE_selectingMarkerStrokeDash: 'Selecting mark dash style',
			DES_selectingMarkerStrokeDash: 'Dash style of selecting rubber band',
			TITLE_selectingMarkerFillColor: 'Selecting mark fill color',
			DES_selectingMarkerFillColor: 'Fill color of selecting mark. Usually this value should be left blank (not filled)',
			TITLE_selectingMarkerOpacity: 'Selecting mark opacity',
			DES_selectingMarkerOpacity: 'Opacity of selecting mark, value from 0 to 1',
			TITLE_selectingBrushMarkerStrokeColor: 'Brush selecting mark stroke color',
			DES_selectingBrushMarkerStrokeColor: 'Stroke color of brush selecting mark',
			TITLE_selectingBrushMarkerStrokeDash: 'Brush selecting mark dash style',
			DES_selectingBrushMarkerStrokeDash: 'Dash style of brush selecting track',
			TITLE_selectingBrushMarkerStrokeLineCap: 'Brushing selecting mark line-cap style',
			DES_selectingBrushMarkerStrokeLineCap: 'Line-cap style of both ends of brush selecting track',
			TITLE_selectingBrushMarkerStrokeLineJoin: 'Brushing selecting mark join point style',
			DES_selectingBrushMarkerStrokeLineJoin: 'Join style of brush selection track segments',
			TITLE_selectingBrushMarkerOpacity: 'Brush selecting mark opacity',
			DES_selectingBrushMarkerOpacity: 'Opacity of brush selecting mark, value from 0 to 1',
			TITLE_trackMarkerStrokeColor: 'Track-input mark stroke color',
			DES_trackMarkerStrokeColor: 'Stroke color of track mark when using track-input tool to draw a structure',
			TITLE_trackMarkerStrokeWidth: 'Track-input mark stroke width',
			DES_trackMarkerStrokeWidth: 'Stroke width of track mark when using track-input tool to draw a structure',
			TITLE_trackMarkerStrokeDash: 'Track-input mark dash style',
			DES_trackMarkerStrokeDash: 'Dash style of track mark when using track-input tool to draw a structure',
			TITLE_trackMarkerOpacity: 'Track-input mark opacity',
			DES_trackMarkerOpacity: 'Opacity of track mark when using track-input tool to draw a structure',
			TITLE_flexStructureAssocMarkerColor: 'Flex structure association mark color',
			DES_flexStructureAssocMarkerColor: 'Color of mark showing atom count of flex ring/chain tool',
			TITLE_flexStructureAssocMarkerOpacity: 'Flex structure association mark opacity',
			DES_flexStructureAssocMarkerOpacity: 'Opacity of mark showing atom count of flex ring/chain tool',
			TITLE_flexStructureAssocMarkerFontSize: 'Flex structure association mark font size',
			DES_flexStructureAssocMarkerFontSize: 'Font size of mark showing atom count of flex ring/chain tool',
			TITLE_flexStructureAssocMarkerFontFamily: 'Flex structure association mark font family',
			DES_flexStructureAssocMarkerFontFamily: 'Font family of mark showing atom count of flex ring/chain tool'
		},
		StructureConfigs: {
			TITLE_defBondType: 'Default bond type',
			DES_defBondType: 'Default type of bond',
			TITLE_defBondOrder: 'Default bond order',
			DES_defBondOrder: 'Default bond order',
			TITLE_defBondLength: 'Default bond length',
			DES_defBondLength: 'Default bond length',
			TITLE_defIsotopeId: 'Default isotope',
			DES_defIsotopeId: 'Default isotope when adding a new atom',
			TITLE_maxFlexChainAtomCount: 'Maximum flex chain atom count',
			DES_maxFlexChainAtomCount: 'Maximum atom count when inputting with flex chain tool',
			TITLE_minFlexChainAtomCount: 'Minimal flex chain atom count',
			DES_minFlexChainAtomCount: 'Minimal atom count when inputting with flex chain tool',
			TITLE_maxFlexRingAtomCount: 'Maximum flex ring atom count',
			DES_maxFlexRingAtomCount: 'Maximum atom count when inputting with flex ring tool',
			TITLE_minFlexRingAtomCount: 'Minimal flex ring atom count',
			DES_minFlexRingAtomCount: 'Minimal atom count when inputting with flex ring tool',
			TITLE_enabledNonAtomNodeTypes: 'Available non-atom structure node types',
			DES_enabledNonAtomNodeTypes: 'Non-atom structure node types available in editor',
			TITLE_enabledBondForms: 'Available bond forms',
			DES_enabledBondForms: 'Bond forms available in editor'
		},
		ChemSpaceConfigs: {
			TITLE_defScreenSize2D: 'Default 2D screen size',
			TITLE_defScreenSize3D: 'Default 3D screen size',
			TITLE_defPadding: 'Default padding',
			DES_defPadding: 'Padding on top when adding an unpositioned object to container chem space'
		},

		BaseEditor: {
			TITLE_enableCreateNewDoc: 'Enable create new document',
			DES_enableCreateNewDoc: 'Whether creating a new document is allowed',
			TITLE_initOnNewDoc: 'Starts with a new document',
			DES_initOnNewDoc: 'Whether create a new document automatically when composer is initialized',
			TITLE_enableOperHistory: 'Enable undo',
			DES_enableOperHistory: 'Whether undo/redo is enabled'
		},
		Composer: {
			TITLE_enableStyleToolbar: 'Enable style toolbar',
			DES_enableStyleToolbar: 'Whether display style toolbar to set color, font and size of objects',
			TITLE_allowCreateNewChild: 'Enable create new child object',
			DES_allowCreateNewChild: 'Whether new direct child of document can be created'
		}
	}
});
