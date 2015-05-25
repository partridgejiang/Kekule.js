(function($root){

// IE8 does not support array.indexOf
if (!Array.prototype.indexOf)
{
	/** @ignore */
	Array.prototype.indexOf = function(item, i) {
		i || (i = 0);
		var length = this.length;
		if (i < 0) i = length + i;
		for (; i < length; i++)
			if (this[i] === item) return i;
		return -1;
	};
}

function kekuleRequire(libName)
{
	// inserting via DOM fails in Safari 2.0, so brute force approach
  document.write('<script type="text/javascript" src="'+libName+'"><\/script>');
	/*
	var elem = document.createElement('script');
	elem.setAttribute('type', 'text/javascript');
	elem.src = libName;
	//document.body.appendChild(elem);
	var headElem = document.getElementsByTagName('head')[0];
	var parentElem = headElem || document.body;
	console.log('insert to ', parentElem.tagName, libName);
	parentElem.appendChild(elem);
	*/
}

var kekuleFiles = {
	'lan': {
		'files': [
			'lan/json2.js',
			'lan/classes.js',
			'lan/xmlJsons.js',
			'lan/serializations.js'
		],
		'category': 'core',
		'minFile': 'root.min.js'
	},
	'root': {
		'files': [
			'core/kekule.root.js'
		],
		'category': 'core',
		'minFile': 'root.min.js'
	},

	'localization': {
		'requires': ['lan', 'root'],
		'files': [
			'localization/kekule.localizations.js',
			'localization/en/kekule.localize.en.js',
			'localization/en/kekule.localize.widget.en.js',
			'localization/en/kekule.localize.objDefines.en.js'

			//'localization/zh/kekule.localize.widget.zh.js'
		],
		'category': 'localization'
	},

	'common': {
		'requires': ['lan', 'root', 'localization'],
		'files': [
			'core/kekule.common.js',
			'core/kekule.exceptions.js',
			'utils/kekule.utils.js',
			'utils/kekule.domUtils.js',
			'utils/kekule.domHelper.js',
			'utils/kekule.textHelper.js'
		],
		'category': 'core'
		//'minFile': 'root.min.js'
	},

	'core': {
		'requires': ['lan', 'root', 'common', 'data'],
		'files': [
			'core/kekule.configs.js',
			'core/kekule.elements.js',
			'core/kekule.electrons.js',
			'core/kekule.valences.js',
			'core/kekule.structures.js',
			'core/kekule.structureBuilder.js',
			'core/kekule.reactions.js',
			'core/kekule.chemUtils.js',

			'chemdoc/kekule.glyph.base.js',
			'chemdoc/kekule.textBlocks.js',
			'chemdoc/kekule.glyph.pathGlyphs.js',
			'chemdoc/kekule.glyph.lines.js',
			'chemdoc/kekule.glyph.chemGlyphs.js'
		],
		'category': 'core'
	},

	'html': {
		'requires': ['lan', 'root', 'common'],
		'files': [
			'xbrowsers/kekule.x.js',
			'html/kekule.nativeServices.js',
			'html/kekule.predefinedResLoaders.js'
		],
		'category': 'core'
	},

	'io': {
		'requires': ['lan', 'root', 'common', 'core'],
		'files': [
			'io/kekule.io.js',
			'io/cml/kekule.io.cml.js',
			'io/mdl/kekule.io.mdlBase.js',
			'io/mdl/kekule.io.mdl2000.js',
			'io/mdl/kekule.io.mdl3000.js',
			'io/mdl/kekule.io.mdlIO.js',
			'io/smiles/kekule.io.smiles.js',
			'io/native/kekule.io.native.js'
		],
		'category': 'io'
	},

	'render': {
		'requires': ['lan', 'root', 'common', 'core'],
		'files': [
			'render/kekule.render.extensions.js',
			'render/kekule.render.base.js',
			'render/kekule.render.renderColorData.js',
			'render/kekule.render.utils.js',
			'render/kekule.render.configs.js',
			'render/kekule.render.baseTextRender.js',
			'render/kekule.render.boundInfoRecorder.js',
			'render/2d/kekule.render.renderer2D.js',
			'render/2d/kekule.render.glyphRender2D.js',
			'render/2d/kekule.render.canvasRenderer.js',
			'render/2d/kekule.render.raphaelRenderer.js',
			'render/3d/kekule.render.renderer3D.js',
			'render/3d/kekule.render.threeRenderer.js',
			'render/kekule.render.painter.js'
		],
		'category': 'render'
	},

	'widget': {
		'requires': ['lan', 'root', 'common', 'html'],
		'files': [
			'widgets/operation/kekule.operations.js',
			'widgets/operation/kekule.actions.js',

			'widgets/kekule.widget.bindings.js',
			'widgets/kekule.widget.base.js',
			'widgets/kekule.widget.sys.js',
			'widgets/kekule.widget.clipboards.js',
			'widgets/kekule.widget.helpers.js',
			'widgets/kekule.widget.styleResources.js',
			'widgets/kekule.widget.autoLaunchers.js',
			'widgets/transitions/kekule.widget.transitions.js',
			'widgets/transitions/kekule.widget.transMgr.js',
			'widgets/commonCtrls/kekule.widget.images.js',
			//'widgets/commonCtrls/kekule.widget.menus.js',
			'widgets/commonCtrls/kekule.widget.containers.js',
			'widgets/commonCtrls/kekule.widget.buttons.js',
			'widgets/commonCtrls/kekule.widget.formControls.js',
			'widgets/commonCtrls/kekule.widget.nestedContainers.js',
			'widgets/commonCtrls/kekule.widget.treeViews.js',
			'widgets/commonCtrls/kekule.widget.dialogs.js',
			'widgets/commonCtrls/kekule.widget.msgPanels.js',
			'widgets/commonCtrls/kekule.widget.tabViews.js',
			'widgets/commonCtrls/kekule.widget.resizers.js',
			'widgets/advCtrls/kekule.widget.valueListEditors.js',
			'widgets/advCtrls/kekule.widget.colorPickers.js',
			'widgets/advCtrls/kekule.widget.textEditors.js',
			'widgets/advCtrls/kekule.widget.widgetGrids.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspectors.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspector.propEditors.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspector.operations.js',
			'widgets/advCtrls/kekule.widget.configurators.js',
			'widgets/sys/kekule.widget.sysMsgs.js',

			'widgets/operation/kekule.operHistoryTreeViews.js'  // debug
		],
		'category': 'widget'
	},

	'chemWidget': {
		'requires': ['lan', 'root', 'common', 'core', 'html', 'io', 'render', 'algorithm', 'widget'],
		'files': [
			'widgets/chem/kekule.chemWidget.base.js',
			'widgets/chem/kekule.chemWidget.dialogs.js',
			'widgets/chem/periodicTable/kekule.chemWidget.periodicTables.js',
			'widgets/chem/kekule.chemWidget.chemObjDisplayers.js',
			'widgets/chem/structureTreeView/kekule.chemWidget.structureTreeViews.js',
			'widgets/chem/uiMarker/kekule.chemWidget.uiMarkers.js',
			'widgets/chem/viewer/kekule.chemWidget.viewers.js',
			'widgets/chem/viewer/kekule.chemWidget.viewerGrids.js',
			'widgets/chem/viewer/kekule.chemWidget.chemObjInserters.js',

			'widgets/chem/editor/kekule.chemEditor.extensions.js',
			'widgets/chem/editor/kekule.chemEditor.baseEditors.js',
			'widgets/chem/editor/kekule.chemEditor.operations.js',
			'widgets/chem/editor/kekule.chemEditor.editorUtils.js',
			'widgets/chem/editor/kekule.chemEditor.configs.js',
			'widgets/chem/editor/kekule.chemEditor.repositories.js',
			'widgets/chem/editor/kekule.chemEditor.chemSpaceEditors.js',
			'widgets/chem/editor/kekule.chemEditor.nexus.js',
			'widgets/chem/editor/kekule.chemEditor.composers.js',
			'widgets/chem/editor/kekule.chemEditor.actions.js',

			'widgets/advCtrls/objInspector/kekule.widget.objInspector.chemPropEditors.js'
		],
		'category': 'chemWidget'
	},

	'algorithm': {
		'requires': ['lan', 'root', 'common', 'core'],
		'files': [
			'algorithm/kekule.graph.js',
			'algorithm/kekule.structures.helpers.js',
			'algorithm/kekule.structures.comparers.js',
			'algorithm/kekule.structures.canonicalizers.js',
			'algorithm/kekule.structures.ringSearches.js',
			'algorithm/kekule.structures.aromatics.js',
			'algorithm/kekule.structures.standardizers.js',
			'algorithm/kekule.structures.searches.js',
			'algorithm/kekule.structures.stereos.js'
		],
		'category': 'algorithm'
	},

	'data': {
		'requires': ['root'],
		'files': [
			'data/kekule.chemicalElementsData.js',
			'data/kekule.isotopesData.organSet.js',
			'data/kekule.structGenAtomTypesData.js',
			'data/kekule.dataUtils.js'
		]
	},

	'emscripten': {
		'requires': ['root', 'common'],
		'files': [
			'_extras/kekule.emscriptenUtils.js'
		],
		'category': 'extra'
	},

	'openbabel': {
		'requires': ['lan', 'root', 'core', 'emscripten', 'io'],
		'files': [
			'localization/en/kekule.localize.extras.openbabel.en.js',
			'_extras/OpenBabel/kekule.openbabel.adapters.js',
			'_extras/OpenBabel/kekule.openbabel.io.js'
		],
		'category': 'extra'
	}
};

var prequestModules = ['lan', 'root', 'localization', 'common'];
var usualModules = prequestModules.concat(['core', 'html', 'io', 'render', 'widget', 'chemWidget', 'algorithm', 'data']);
var allModules = usualModules.concat(['emscripten', 'openbabel']);

function getEssentialModules(modules)
{
	var ms = modules || usualModules;
	ms = prequestModules.concat(ms);
	var result = [];

	var pushModule = function(modules, moduleName)
	{
		if (modules.indexOf(moduleName) < 0)
		{
			var module = kekuleFiles[moduleName];
			if (module.requires)
			{
				for (var j = 0, k = module.requires.length; j < k; ++j)
				{
					var rm = module.requires[j];
					pushModule(modules, rm);
				}
			}
			modules.push(moduleName);
		}
	};
	for (var i = 0, l = ms.length; i < l; ++i)
	{
		var module = ms[i];
		pushModule(result, module);
	}
	return result;
};

function getEssentialFiles(modules, useMinFile)
{
	var ms = getEssentialModules(modules);
	var result = [];
	for (var i = 0, l = ms.length; i < l; ++i)
	{
		var moduleName = ms[i];
		var m = kekuleFiles[moduleName];
		if (m && m.files)
		{
			if (useMinFile)
			{
				var minFileName = m.minFile || (moduleName + '.min.js');
				if (result.indexOf(minFileName) < 0)
					result.push(minFileName);
			}
			else
				result = result.concat(m.files);
		}
	}
	return result;
};

function analysisEntranceScriptSrc()
{
	var entranceSrc = /^(.*\/?)kekule\.js(\?.*)?$/;
	var paramMinFile = /^min\=(.+)$/;
	var paramModules = /^modules\=(.+)$/;
	var scriptElems = document.getElementsByTagName('script');
	var loc;
	for (var i = scriptElems.length - 1; i >= 0; --i)
	{
		var elem = scriptElems[i];
		if (elem.src)
		{
			var matchResult = elem.src.match(entranceSrc);
			if (matchResult)
			{
				var pstr = matchResult[2];
				if (pstr)
					pstr = pstr.substr(1);  // eliminate starting '?'
				var result = {
					'src': elem.src,
					'path': matchResult[1],
					'paramStr': pstr,
					'useMinFile': true
				}

				if (result.paramStr)  // analysis params
				{
					var modules;
					var params = result.paramStr.split('&');
					for (var i = 0, l = params.length; i < l; ++i)
					{
						// check min file usage
						var minFileMatch = params[i].match(paramMinFile);
						if (minFileMatch)
						{
							var pvalue = minFileMatch[1].toLowerCase();
							var value = ['false', 'no', 'f', 'n'].indexOf(pvalue) < 0;
							//var value = (pvalue === 'false') || (pvalue === 'f') || (pvalue === 'no') || (pvalue === 'n');
							//var value = ['true', 'yes', 't', 'y'].indexOf(pvalue) >= 0;
							result.useMinFile = value;
						}
						// check module param
						var moduleMatch = params[i].match(paramModules);
						if (moduleMatch)
						{
							var moduleStr = moduleMatch[1];
							var modules = moduleStr.split(',');
							continue;
						}
					}
					if (modules)
						result.modules = modules;
				}

				return result;
			}
		}
	}
	return null;
}

function init()
{
	var scriptInfo = analysisEntranceScriptSrc();
	var files = getEssentialFiles(scriptInfo.modules, scriptInfo.useMinFile);
	var path = scriptInfo.path;
	for (var i = 0, l = files.length; i < l; ++i)
	{
		kekuleRequire(path + files[i]);
	}
	// save loaded module and file information
	scriptInfo.files = files;
	scriptInfo.allModuleStructures = kekuleFiles;
	$root['__$kekule_load_info__'] = scriptInfo;
}

init();

})(this);