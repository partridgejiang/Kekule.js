/**
 * @fileoverview
 * Base types and classes of chem viewer.
 * Viewer is a widget to show chem objects on HTML page.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /core/kekule.common.js
 * requires /widgets/kekule.widget.base.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.chemObjDisplayers.js
 * requires /widgets/chem/kekule.chemWidget.viewers.js
 * requires /widgets/advCtrls/kekule.widget.widgetGrids.js
 * requires /widgets/chem/kekule.chemWidget.dialogs.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){
"use strict";

var PS = Class.PropertyScope;

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	VIEWER_GRID: 'K-Chem-Viewer-Grid'
});

var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

/**
 * A grid to display a series of chem objects with chem viewer.
 * @class
 * @augments Kekule.Widget.WidgetGrid
 */
Kekule.ChemWidget.ViewerGrid = Class.create(Kekule.Widget.WidgetGrid,
/** @lends Kekule.ChemWidget.ViewerGrid# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ViewerGrid',
	initialize: function($super, parentOrElementOrDocument, renderType, viewerConfigs)
	{
		this.setPropStoreFieldValue('renderType', renderType);
		this.setPropStoreFieldValue('viewerConfigs', viewerConfigs);
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this._shadowedPropPairs = [];  // private
		this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'setter': null, 'scope': PS.PUBLIC});
		this.defineProp('chemObjs', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null,
			'getter': function()
			{
				var result = [];
				this.each(function(viewer){
					result.push(viewer.getChemObj());
				});
				return result;
			}
		});
		// shadow property of viewers
		this.defineViewerShadowProps([
			'drawOptions', 'moleculeDisplayType', 'zoom', 'autoSize', /*'padding',*/ 'enableLoadNewFile',
			'viewerConfigs', 'allowedMolDisplayTypes', 'enableEdit', 'modalEdit',
			'toolButtons', 'enableToolbar', 'toolbarPos',	'toolbarMarginVertical', 'toolbarMarginHorizontal', 'toolbarEvokeModes', 'toolbarRevokeModes', 'toolbarRevokeTimeout',
			'caption', 'showCaption', 'autoCaption', 'captionPos', 'enableDirectInteraction', 'enableTouchInteraction'
		]);
		this.defineViewerShadowProps(['viewerPredefinedSetting'], ['predefinedSetting']);
		// private
		this.defineProp('actionLoadData', {'dataType': 'Kekule.ChemWidget.ActionDisplayerLoadData', 'serializable': false, 'scope': PS.PRIVATE,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('actionLoadData');
				if (!result)
				{
					result = new Kekule.ChemWidget.ActionDisplayerLoadData();
					this.setPropStoreFieldValue('actionLoadData', result);
				}
				return result;
			}
		});
	},
	/** @private */
	defineViewerShadowProps: function(propNames, viewerPropNames)
	{
		if (!viewerPropNames)
			viewerPropNames = [];

		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var propName = propNames[i];
			var viewerPropName = viewerPropNames[i] || propNames[i];
			this.defineViewerShadowProp(propName, viewerPropName);
		}
	},
	/** @private */
	defineViewerShadowProp: function(propName, viewerPropName)
	{
		if (!viewerPropName)
			viewerPropName = propName;
		var viewerClass = Kekule.ChemWidget.Viewer;

		var viewerPropInfo = ClassEx.getPropInfo(viewerClass, viewerPropName);
		if (viewerPropInfo)
		{
			var propInfo = Object.create(viewerPropInfo);
			propInfo.getter = undefined;  // use default getter
			//propInfo.setter = undefined;  // use default
			propInfo.setter = function(value)
			{
				this.setPropStoreFieldValue(propName, value);
				// and update all child viewers
				this.each(function(viewer)
				{
					viewer.setPropValue(viewerPropName, value);
				});
			};
			this.defineProp(propName, propInfo);
			this._shadowedPropPairs.push({'prop': propName, 'viewerProp': viewerPropName});
		}
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CCNS.VIEWER_GRID;
	},

	/** @ignore */
	createWidget: function($super)
	{
		var doc = this.getDocument();
		// react to click on add cell, show a dialog to load or edit chem object
		var dialog = new Kekule.ChemWidget.LoadDataDialog(doc); //new Kekule.Editor.ComposerDialog(doc);
		var self = this;
		dialog.openModal(function(result){
			if (dialog.isPositiveResult(result))
			{
				var chemObj = dialog.getChemObj();
				if (chemObj)
				{
					var w = self.doCreateNewChildWidget(doc, chemObj);
					w.setParent(self);
				}
			}
		}, this.getAddingCell());
		/*
		var result = this.doCreateNewChildWidget(this.getDocument());
		if (result)
		{
			result.setParent(this);
			return result;
		}

		return $super();
		*/
	},

	/** @ignore */
	doCreateNewChildWidget: function(doc, chemObj)
	{
		var result = new Kekule.ChemWidget.Viewer(doc, null, this.getRenderType(), this.getViewerConfigs());
		// set shadowed properties
		this.doSetShadowedPropValuesToViewer(result);
		if (!chemObj)
		{
			/*
			var action = this.getActionLoadData();
			action.setDisplayer(result);
			action.execute();
			*/
		}
		else
		{
			result.setChemObj(chemObj);
		}
		return result;
	},
	/** @private */
	doSetShadowedPropValuesToViewer: function(viewer)
	{
		for (var i = 0, l = this._shadowedPropPairs.length; i < l; ++i)
		{
			var pair = this._shadowedPropPairs[i];
			var value = this.getPropValue(pair.prop);
			viewer.setPropValue(pair.viewerProp, value);
		}
	},

	/**
	 * Create a new viewer and load chem object
	 * @param {Kekule.ChemObject} chemObj
	 */
	addChemObj: function(chemObj)
	{
		this.doCreateNewChildWidget(this.getDocument(), chemObj).setParent(this);
		return this;
	},
	/**
	 * Removes viewer displaying chemObj.
	 * @param {Kekule.ChemObject} chemObj
	 */
	removeChemObj: function(chemObj)
	{
		var self = this;
		this.each(function(viewer){
			if (viewer.getChemObj() === chemObj)
				self.removeWidget(viewer, true);  // do finalize
		});
		return this;
	}
});

/**
 * A grid to display a series of chem objects with chem viewer 2D.
 * @class
 * @augments Kekule.ChemWidget.ViewerGrid
 */
Kekule.ChemWidget.ViewerGrid2D = Class.create(Kekule.ChemWidget.ViewerGrid,
/** @lends Kekule.ChemWidget.ViewerGrid2D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ViewerGrid2D',
	initialize: function($super, parentOrElementOrDocument, viewerConfigs)
	{
		$super(parentOrElementOrDocument, Kekule.Render.RendererType.R2D, viewerConfigs);
	}
});

/**
 * A grid to display a series of chem objects with chem viewer 3D.
 * @class
 * @augments Kekule.ChemWidget.ViewerGrid
 */
Kekule.ChemWidget.ViewerGrid3D = Class.create(Kekule.ChemWidget.ViewerGrid,
/** @lends Kekule.ChemWidget.ViewerGrid3D# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ViewerGrid3D',
	initialize: function($super, parentOrElementOrDocument, viewerConfigs)
	{
		$super(parentOrElementOrDocument, Kekule.Render.RendererType.R3D, viewerConfigs);
	}
});

})();