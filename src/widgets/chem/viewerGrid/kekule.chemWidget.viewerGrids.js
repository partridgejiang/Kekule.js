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
 * requires /widgets/kekule.widget.dialogs.js
 * requires /widgets/kekule.widget.helpers.js
 * requires /widgets/chem/kekule.chemWidget.base.js
 * requires /widgets/chem/kekule.chemWidget.viewers.js
 * requires /widgets/operation/kekule.actions.js
 * requires /widgets/commonCtrls/kekule.widget.buttons.js
 * requires /widgets/commonCtrls/kekule.widget.containers.js
 *
 * requires /localization/kekule.localize.widget.js
 */

(function(){
"use strict";

/** @ignore */
Kekule.ChemWidget.HtmlClassNames = Object.extend(Kekule.ChemWidget.HtmlClassNames, {
	VIEWER_GRID: 'K-Chem-Viewer-Grid'
});

var CNS = Kekule.Widget.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;



})();