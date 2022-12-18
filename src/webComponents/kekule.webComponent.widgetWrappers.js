/**
 * @fileoverview
 * Wrap some common used widgets into web components.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /widget/chem/periodicTable/kekule.chemWidget.periodicTables.js
 * requires /widget/chem/viewer/kekule.chemWidget.viewers.js
 * requires /widget/chem/viewer/kekule.chemWidget.chemObjInserters.js
 * requires /widget/chem/editor/kekule.chemEditor.composers.js
 * requires /webcComponent/kekule.webComponent.base.js
 */

(function(){

"use strict";

var wrapWidgetConfigs = [
	{'widgetClassName': 'Kekule.ChemWidget.PeriodicTable', 'htmlTagName': 'kekule-periodic-table'},
	{'widgetClassName': 'Kekule.ChemWidget.Viewer', 'htmlTagName': 'kekule-viewer'},
	{'widgetClassName': 'Kekule.ChemWidget.Viewer2D', 'htmlTagName': 'kekule-viewer2d'},
	{'widgetClassName': 'Kekule.ChemWidget.Viewer3D', 'htmlTagName': 'kekule-viewer3d'},
	{'widgetClassName': 'Kekule.ChemWidget.SpectrumInspector', 'htmlTagName': 'kekule-spectrum-inspector'},
	{'widgetClassName': 'Kekule.ChemWidget.ChemObjInserter', 'htmlTagName': 'kekule-chem-obj-inserter'},
	{'widgetClassName': 'Kekule.ChemWidget.SpectrumObjInserter', 'htmlTagName': 'kekule-spectrum-obj-inserter'},
	{'widgetClassName': 'Kekule.Editor.Composer', 'htmlTagName': 'kekule-composer'}
];

function wrapWidgets()
{
	if (Kekule.WebComponent && Kekule.WebComponent.Utils)
	{
		var compNamespace = Kekule.WebComponent;
		for (var i = 0, l = wrapWidgetConfigs.length; i < l; ++i)
		{
			var config = wrapWidgetConfigs[i];
			var widgetClass = Object.getCascadeFieldValue(config.widgetClassName, Kekule.$jsRoot);
			var htmlTagName = config.htmlTagName;
			if (widgetClass && htmlTagName)  // do wrap
			{
				var widgetShortName = Kekule.ClassUtils.getLastClassName(config.widgetClassName);
				var wrapper = Kekule.WebComponent.Utils.wrapWidget(widgetClass, htmlTagName);
				compNamespace[widgetShortName] = wrapper;  // add to namespace
			}
		}
	}
}

Kekule._registerAfterLoadSysProc(wrapWidgets);

})();