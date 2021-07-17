define(/*'qtype_kekule_chem_base/extraWidgets',*/ ['kekule', 'local_kekulejs/kekuleMoodle'], function(){

function init() {

	if (typeof (KekuleMoodle) === 'undefined')
		KekuleMoodle = {};
	if (!KekuleMoodle.Widget)
		KekuleMoodle.Widget = {};

	KekuleMoodle.Widget.ChemObjSelectorPanel = Class.create(Kekule.Widget.Panel, {
		CLASS_NAME: 'KekuleMoodle.Widget.ChemObjSelectorPanel',
		initialize: function (/*$super, */parentOrElementOrDocument, renderType, viewerConfigs) {
			//this.setPropStoreFieldValue('renderType', renderType);
			//this.setPropStoreFieldValue('viewerConfigs', viewerConfigs);
			this.tryApplySuper('initialize', [parentOrElementOrDocument]);
			this._renderConfigs = this._generateDefaultRenderConfigs();
			var viewerGrid = new Kekule.ChemWidget.ViewerGrid(this, renderType, viewerConfigs);
			viewerGrid.setEnableAdd(false).setEnableRemove(false);
			this.setPropStoreFieldValue('viewerGrid', viewerGrid);
			this.on('click', this.reactCellClick.bind(this));
		},
		initProperties: function () {
			this.defineProp('objects', {
				'dataType': DataType.ARRAY, 'serializable': false,
				'setter': function (value) {
					this.setPropStoreFieldValue('objects', value || []);
					this.objectsChanged();
				}
			});
			//this.defineProp('renderType', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
			//this.defineProp('viewerConfigs', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});

			// private
			this.defineProp('viewerGrid', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		},
		doFinalize: function () {
			this.getViewerGrid().finalize();
			this.tryApplySuper('doFinalize');
		},

		/** @ignore */
		doGetWidgetClassName: function (/*$super*/) {
			return this.tryApplySuper('doGetWidgetClassName') + ' ' + 'KM-ChemObjSelectorPanel';
		},

		_generateDefaultRenderConfigs: function () {
			var result = new Kekule.Render.Render2DConfigs();
			result.getLengthConfigs().setAutofitContextPadding(10);
			//result.getLengthConfigs().setBondLineWidth(4);
			return result;
		},

		objectsChanged: function ()  // update viewers to reflect to objects change
		{
			var objs = this.getObjects();
			var grid = this.getViewerGrid();
			grid.clearWidgets();
			for (var i = 0, l = objs.length; i < l; ++i) {
				grid.addChemObj(objs[i]);
			}
			var viewers = grid.getChildWidgets();
			for (var i = 0, l = viewers.length; i < l; ++i) {
				viewers[i].beginUpdate();
				viewers[i].setAutoShrink(true);
				viewers[i].setRenderConfigs(this._renderConfigs);
				viewers[i].setPadding(this._renderConfigs.getLengthConfigs().getAutofitContextPadding());
				viewers[i].endUpdate();
				//viewers[i].repaint();
			}
		},

		_getTargetViewer: function (srcWidget) {
			if (srcWidget instanceof Kekule.ChemWidget.Viewer && srcWidget.getParent() === this.getViewerGrid()) {
				return srcWidget;
			} else {
				var parent = srcWidget.getParent();
				return parent ? this._getTargetViewer(parent) : null;
			}
		},

		reactCellClick: function (e) {
			var viewer = this._getTargetViewer(e.target);
			if (viewer)  // click on viewer
			{
				this.invokeEvent('select', {'viewer': viewer, 'chemObj': viewer.getChemObj()});
			}
		}
	});

}

return {
	'init': function(){
		Kekule._ready(init);
	}
};

});