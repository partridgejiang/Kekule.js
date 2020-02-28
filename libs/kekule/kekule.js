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

// avoid Node error
var document = $root.document;
if (!document)
{
	if (typeof(window) !== 'undefined')
		document = window.document;
}


// check if is in Node.js environment
var isNode = (typeof process === 'object') && (typeof process.versions === 'object') && (typeof process.versions.node !== 'undefined');
var isWebpack = (typeof(__webpack_require__) === 'function');

//if (!isWebpack && isNode)
if (typeof(__webpack_require__) !== 'function' && isNode)
{
	var __nodeContext = {};
	try
	{
		var vm = require("vm");
		var fs = require("fs");
	}
	catch(e)
	{
	}
}

if (!isNode)
{
	var readyState = document && document.readyState;
	var isIE = window.attachEvent && !window.opera;
	var docReady = (readyState === 'complete' || readyState === 'loaded' ||
		(readyState === 'interactive' && !isIE));  // in IE8-10, handling this script cause readyState to 'interaction' but the whole page is not loaded yet
}

if (isNode && typeof(global) !== 'undefined')
{
	$root = global;  // set root as global object, share with the context of running Kekule code
}

function isDocReady()
{
	if (!isNode)
	{
		var readyState = document && document.readyState;
		var isIE = window.attachEvent && !window.opera;
		return (readyState === 'complete' || readyState === 'loaded' ||
			(readyState === 'interactive' && !isIE));  // in IE8-10, handling this script cause readyState to 'interaction' but the whole page is not loaded yet
	}
	else // no doc
		return true;
}

function directAppend(doc, libName)
{
  doc.write('<script type="text/javascript" src="'+libName+'"><\/script>');
}
function nodeAppend(url)
{
	if (isNode)
	{
		try
		{
			var data = fs.readFileSync(url, 'utf8');
			vm.runInThisContext(data, {'filename': url});
			//vm.runInNewContext(data, __nodeContext, {'filename': url});
			//eval(data);
			return true;
		}
		catch(e)
		{
			// may be in webpack? Need further investigation
			/*
			if ($root.require)
			{
				var extPos = url.toLowerCase().lastIndexOf('.js');
				var coreFileName;
				if (extPos >= 0)
				{
					coreFileName = url.substr(0, extPos);
				}
				if (coreFileName)
					require('./' + fileName + '.js');
				else
					require('./' + fileName);
			}
			*/
			//console.error(url, e.message);
			return e;
		}
	}
}

var existedScriptUrls = [];
function appendScriptFile(doc, url, callback)
{
	if (existedScriptUrls.indexOf(url) >= 0)  // already loaded
	{
		if (callback)
			callback(null);
		return;
	}
	if (isNode)
	{
		var appendResult = nodeAppend(url);
		if (callback)
		{
			if (appendResult === true)
				callback(null);
			else
				callback(appendResult);  // error
		}
		return appendResult;
	}
	else // browser
	{
		try
		{
			var result = doc.createElement('script');
			result.src = url;
			result.onerror = function(error){
				if (callback)
					callback(new Error('Loading script file ' + url + ' failed'));
			};
			result.onload = result.onreadystatechange = function(e) {
				if (result._loaded)
					return;
				var readyState = result.readyState;
				if (readyState === undefined || readyState === 'loaded' || readyState === 'complete')
				{
					result._loaded = true;
					result.onload = result.onreadystatechange = null;
					existedScriptUrls.push(url);
					if (callback)
						callback(null);
				}
			};
			(doc.getElementsByTagName('head')[0] || doc.body).appendChild(result);
			return result;
		}
		catch(e)
		{
			if (callback)
				callback(e);
		}
		//console.log('load script', url);
	}
}
function appendScriptFiles(doc, urls, callback)
{
	var dupUrls = [].concat(urls);
	_appendScriptFilesCore(doc, dupUrls, callback, []);
}
function _appendScriptFilesCore(doc, urls, callback, errors)
{
	if (urls.length <= 0)
	{
		if (callback)
		{
			if (!errors.length)
				callback(null);
			else
				callback(new Error(errors.join(', ')));
		}
		return;
	}
	var file = urls.shift();
	appendScriptFile(doc, file, function(error)
		{
			if (error)
			{
				errors.push(error? (error.message || error): '');
			}
			_appendScriptFilesCore(doc, urls, callback, errors);
		}
	);
}

function loadChildScriptFiles(scriptUrls, forceDomLoader, callback)
{
	if (isNode)  // Node.js environment
	{
		appendScriptFiles(document, scriptUrls, function(error)
		{
			// set a marker indicate that all modules are loaded
			(this.Kekule || __nodeContext.Kekule)._loaded();
			if (callback)
				callback(error);
		});
	}
	else  // in normal browser environment
	{
		if (!isDocReady() && !forceDomLoader)  // can directly write to document
		{
			try
			{
				for (var i = 0, l = scriptUrls.length; i < l; ++i)
					directAppend(document, scriptUrls[i]);

				var sloadedCode = 'if (this.Kekule) Kekule._loaded();';
				/*
				 if (window.btoa)  // use data uri to insert loaded code, avoid inline script problem in Chrome extension (still no use in Chrome)
				 {
				 var sBase64 = btoa(sloadedCode);
				 var sdataUri = 'data:;base64,' + sBase64;
				 directAppend(document, sdataUri);
				 }
				 else  // use simple inline code in IE below 10 (which do not support data uri)
				 */
				//directAppend(document, 'kekule.loaded.js');  // manully add small file to mark lib loaded
				document.write('<script type="text/javascript">' + sloadedCode + '<\/script>');
				if (callback)
					callback(null);
			}
			catch(e)
			{
				callback(e);
			}
		}
		else
			appendScriptFiles(document, scriptUrls, function(error)
			{
				if (!error)
				{
					// set a marker indicate that all modules are loaded
					Kekule._loaded();
				}
				if (callback)
					callback(error);
			});
	}
}

var kekuleFiles = {
	'lan': {
		'files': [
			'lan/classes.js',
			'lan/xmlJsons.js',
			'lan/serializations.js'
		],
		'category': 'lan',
		'minFile': 'root.min.js'
	},
	'root': {
		'files': [
			'core/kekule.root.js'
		],
		'category': 'root',
		'minFile': 'root.min.js'
	},

	'localization': {
		'requires': ['lan', 'root'],
		'files': [
			'localization/kekule.localizations.js'
			/*
			'localization/en/kekule.localize.general.en.js',
			'localization/en/kekule.localize.widget.en.js',
			'localization/en/kekule.localize.objDefines.en.js'
			/*
			'localization/zh/kekule.localize.general.zh.js',
			'localization/zh/kekule.localize.widget.zh.js'
			*/
		],
		'category': 'localization',
		'minFile': 'localization.min.js'
	},
	'localizationData': {
		'requires': ['localization'],
		'files': [
			'localization/en/kekule.localize.general.en.js',
			'localization/en/kekule.localize.widget.en.js',
			'localization/en/kekule.localize.objDefines.en.js'
		],
		'category': 'localization',
		'minFile': 'localization.min.js'
	},

	'common': {
		'requires': ['lan', 'root', 'localization'],
		'files': [
			'core/kekule.common.js',
			'core/kekule.exceptions.js',
			'utils/kekule.utils.js',
			'utils/kekule.domHelper.js',
			'utils/kekule.domUtils.js'
		],
		'category': 'common',
		'minFile': 'common.min.js'
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
			'chemdoc/kekule.glyph.utils.js',
			'chemdoc/kekule.glyph.pathGlyphs.js',
			'chemdoc/kekule.glyph.lines.js',
			'chemdoc/kekule.glyph.chemGlyphs.js',
			'chemdoc/kekule.contentBlocks.js',
			'chemdoc/kekule.attachedMarkers.js',
			'chemdoc/kekule.commonChemMarkers.js'
		],
		'category': 'core'
	},

	'html': {
		'requires': ['lan', 'root', 'common'],
		'files': [
			'xbrowsers/kekule.x.js',
			'html/kekule.nativeServices.js',
			'html/kekule.predefinedResLoaders.js',
			'utils/kekule.htmlDomUtils.js'
		],
		'category': 'core'
	},

	'io': {
		'requires': ['lan', 'root', 'common', 'core'],
		'files': [
			'utils/kekule.textHelper.js',
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
		'requires': ['lan', 'root', 'common', 'core', 'html'],
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
			'lib/hammer.js/hammer.min.js',

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
			'widgets/commonCtrls/kekule.widget.resizers.js',
			'widgets/commonCtrls/kekule.widget.movers.js',
			'widgets/commonCtrls/kekule.widget.images.js',
			'widgets/commonCtrls/kekule.widget.containers.js',
			'widgets/commonCtrls/kekule.widget.menus.js',
			'widgets/commonCtrls/kekule.widget.buttons.js',
			'widgets/commonCtrls/kekule.widget.formControls.js',
			'widgets/commonCtrls/kekule.widget.nestedContainers.js',
			'widgets/commonCtrls/kekule.widget.treeViews.js',
			'widgets/commonCtrls/kekule.widget.dialogs.js',
			'widgets/commonCtrls/kekule.widget.msgPanels.js',
			'widgets/commonCtrls/kekule.widget.tabViews.js',
			'widgets/advCtrls/kekule.widget.valueListEditors.js',
			'widgets/advCtrls/kekule.widget.colorPickers.js',
			'widgets/advCtrls/kekule.widget.textEditors.js',
			'widgets/advCtrls/kekule.widget.widgetGrids.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspectors.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspector.propEditors.js',
			'widgets/advCtrls/objInspector/kekule.widget.objInspector.operations.js',
			'widgets/advCtrls/kekule.widget.configurators.js',
			'widgets/advCtrls/grids/kekule.widget.dataSets.js',
			'widgets/advCtrls/grids/kekule.widget.dataGrids.js',
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
			'widgets/chem/editor/kekule.chemEditor.repositoryData.js',
			'widgets/chem/editor/kekule.chemEditor.repositories.js',
			'widgets/chem/editor/kekule.chemEditor.utilWidgets.js',
			'widgets/chem/editor/kekule.chemEditor.chemSpaceEditors.js',
			'widgets/chem/editor/kekule.chemEditor.nexus.js',
			'widgets/chem/editor/kekule.chemEditor.actions.js',
			'widgets/chem/editor/kekule.chemEditor.trackParser.js',

			'widgets/chem/editor/kekule.chemEditor.objModifiers.js',
			'widgets/chem/editor/modifiers/kekule.chemEditor.styleModifiers.js',
			'widgets/chem/editor/modifiers/kekule.chemEditor.textModifiers.js',
			'widgets/chem/editor/modifiers/kekule.chemEditor.structureModifiers.js',
			'widgets/chem/editor/modifiers/kekule.chemEditor.glyphModifiers.js',

			'widgets/advCtrls/objInspector/kekule.widget.objInspector.chemPropEditors.js',

			'widgets/chem/editor/kekule.chemEditor.composers.js',
		],
		'category': 'chemWidget'
	},

	'webComponent': {
		'requires': ['lan', 'root', 'common', 'core', 'html', 'io', 'render', 'algorithm', 'widget', 'chemWidget'],
		'files': [
			'webComponents/kekule.webComponent.base.js',
			'webComponents/kekule.webComponent.widgetWrappers.js'
		]
	},

	'algorithm': {
		'requires': ['lan', 'root', 'common', 'core'],
		'files': [
			'algorithm/kekule.graph.js',
			'algorithm/kekule.structures.helpers.js',
			//'algorithm/kekule.structures.comparers.js',
			'algorithm/kekule.structures.canonicalizers.js',
			'algorithm/kekule.structures.ringSearches.js',
			'algorithm/kekule.structures.aromatics.js',
			'algorithm/kekule.structures.standardizers.js',
			'algorithm/kekule.structures.searches.js',
			'algorithm/kekule.structures.stereos.js'
		],
		'category': 'algorithm'
	},

	'calculation': {
		'requires': ['lan', 'root', 'common', 'core', 'algorithm'],
		'files': [
			'calculation/kekule.calc.base.js'
		]
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
			'_extras/OpenBabel/kekule.openbabel.base.js',
			'_extras/OpenBabel/kekule.openbabel.io.js',
			'_extras/OpenBabel/kekule.openbabel.structures.js'
		],
		'category': 'extra'
	},
	'indigo': {
		'requires': ['lan', 'root', 'core', 'emscripten', 'io'],
		'files': [
			'_extras/Indigo/kekule.indigo.base.js',
			'_extras/Indigo/kekule.indigo.io.js'
		],
		'category': 'extra'
	},
	'inchi': {
		'requires': ['lan', 'root', 'core', 'emscripten', 'io'],
		'files': [
			'_extras/InChI/kekule.inchi.js'
		],
		'category': 'extra'
	},

	// Localization resources
	'localizationData.zh': {
		'requires': ['localization'],
		'files': [
			'localization/zh/kekule.localize.general.zh.js',
			'localization/zh/kekule.localize.widget.zh.js'
			//'localization/zh/kekule.localize.objDefines.zh.js'
		],
		'category': 'localizationData.zh',
		'autoCompress': false  // do not compress js automatically
	}
};

var prequestModules = ['lan', 'root', 'localization', 'localizationData', 'common'];
var usualModules = prequestModules.concat(['core', 'html', 'io', 'render', 'widget', 'chemWidget', 'algorithm', 'calculation', 'data']);
var allModules = usualModules.concat(['emscripten', 'inchi', 'openbabel', 'indigo']);
var nodeModules = prequestModules.concat(['core', 'io', 'algorithm', 'calculation', 'data']);
var defaultLocals = [];

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
			if (module && module.requires)
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
}

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
}

function analysisEntranceScriptSrc(doc)
{
	var entranceSrc = /^(.*\/?)kekule\.js(\?.*)?$/;
	var scriptSrcPattern = /^(.*[\/\\])[^\/\\]*\.js(\?.*)?$/;
	var paramForceDomLoader = /^domloader\=(.+)$/;
	var paramMinFile = /^min\=(.+)$/;
	var paramModules = /^modules\=(.+)$/;
	var paramLocalDatas = /^locals\=(.+)$/;
	var paramLanguage = /^language\=(.+)$/;

	var matchResult;
	// try get current script info by document.currentScript
	if (doc && doc.currentScript && doc.currentScript.src)
	{
		var scriptSrc = decodeURIComponent(doc.currentScript.src);  // sometimes the URL is escaped, ',' becomes '%2C'(e.g. in Moodle)
		if (scriptSrc)
		{
			matchResult = scriptSrc.match(scriptSrcPattern);
		}
	}
	else  // use the traditional way, detect each <script> tags
	{
		var scriptElems = doc.getElementsByTagName('script');
		for (var j = scriptElems.length - 1; j >= 0; --j)
		{
			var elem = scriptElems[j];
			var scriptSrc = decodeURIComponent(elem.src);  // sometimes the URL is escaped, ',' becomes '%2C'(e.g. in Moodle)
			if (scriptSrc)
			{
				matchResult = scriptSrc.match(entranceSrc);
				if (matchResult)
				{
					break;
				}
			}
		}
	}

	if (matchResult)
	{
		var pstr = matchResult[2];
		if (pstr)
			pstr = pstr.substr(1);  // eliminate starting '?'
		var result = {
			'src': scriptSrc,
			'path': matchResult[1],
			'paramStr': pstr,
			'useMinFile': true
		};

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
					continue;
				}
				// check module param
				var moduleMatch = params[i].match(paramModules);
				if (moduleMatch)
				{
					var moduleStr = moduleMatch[1];
					var modules = moduleStr.split(',');
					continue;
				}
				// force dom loader
				var forceDomLoaderMatch = params[i].match(paramForceDomLoader);
				if (forceDomLoaderMatch)
				{
					var pvalue = forceDomLoaderMatch[1].toLowerCase();
					var value = ['false', 'no', 'f', 'n'].indexOf(pvalue) < 0;
					result.forceDomLoader = value;
					continue;
				}
				// check required local data
				var localsMatch = params[i].match(paramLocalDatas);
				if (localsMatch)
				{
					var localsStr = localsMatch[1];
					var locals = localsStr.split(',');
					result.locals = locals;
					continue;
				}
				// language
				var forceLanguage = params[i].match(paramLanguage);
				if (forceLanguage)
				{
					var pvalue = forceLanguage[1];
					result.language = pvalue;
					continue;
				}
			}
			if (modules)
				result.modules = modules;
			else
				result.modules = usualModules;  // no modules appointed, use default setting

			// handle local data
			if (!result.locals)
				result.locals = defaultLocals;
			if (result.locals || result.language)
			{
				var localNames = [].concat(result.locals || []);
				if (result.language && localNames.indexOf(result.language) < 0)  // local resources of forced language should always be loaded
				{
					localNames.push(result.language);
				}
				if (localNames.length)
				{
					var localizationModuleIndex = result.modules.indexOf('localizationData');
					if (localizationModuleIndex < 0)  // local data module not listed, put local data as first module
						localizationModuleIndex = -1;
					for (var i = 0, l = localNames.length; i < l; ++i)
					{
						var localName = localNames[i];
						if (localName === 'en')  // default local resource, already be loaded, by pass
							continue;
						// insert resources, right after localization module, before other widget modules
						result.modules.splice(localizationModuleIndex + 1, 0, 'localizationData.' + localName);
					}
				}
			}
		}

		return result;
	}

	//return null;
	return {
		'src': '',
		'path': '',
		'modules': usualModules,
		//'useMinFile': false  // for debug
		'useMinFile': true
	}; // return a default setting
}

function loadModuleScriptFiles(modules, useMinFile, rootPath, kekuleScriptInfo, callback)  // return loaded files
{
	if (typeof Kekule !== "undefined" && Kekule.LOADED)
		Kekule.LOADED = false;   // a flag, indicating now are loading script files

	var loadedModules = kekuleScriptInfo.modules || [];
	var essentialModules = [];
	for (var i = 0, l = modules.length; i < l; ++i)
	{
		if (loadedModules.indexOf(modules[i]) < 0)
			essentialModules.push(modules[i]);
	}

	var files = getEssentialFiles(essentialModules, useMinFile);
	var essentialFiles = [];
	var path = rootPath;

	var loadedScriptUrls = kekuleScriptInfo.fileUrls || [];
	var essentialUrls = [];
	for (var i = 0, l = files.length; i < l; ++i)
	{
		var url = path + files[i];
		if (loadedScriptUrls.indexOf(url) < 0)
		{
			essentialUrls.push(url);
			essentialFiles.push(files[i]);
		}
	}
	essentialUrls.push(path + 'kekule.loaded.js');  // manually add small file to indicate the end of Kekule loading

	loadChildScriptFiles(essentialUrls, null, function(error){
		kekuleScriptInfo.modules = kekuleScriptInfo.modules.concat(essentialModules);
		kekuleScriptInfo.files = kekuleScriptInfo.files.concat(essentialFiles);
		kekuleScriptInfo.fileUrls = kekuleScriptInfo.fileUrls.concat(essentialUrls);
		if (callback)
			callback(error);
	});

	return {
		'modules': essentialModules,
		'files': essentialFiles,
		'fileUrls': essentialUrls
	};
}

function init()
{
	var scriptInfo, files, path;
	if (isNode)
	{
		scriptInfo = {
			'src': this.__filename || '',
			'path': __dirname + '/',
			'modules': nodeModules,
			//'useMinFile': false  // for debug
			'useMinFile': true,
			'nodeModule': typeof(module !== 'undefined')? module: this.module,  // record the node module, for using the module methods (e.g. require) later
			'nodeRequire': typeof(require !== 'undefined')? require: this.require,
		};

		// if min files not found, use dev files instead
		var testFileName = scriptInfo.path + kekuleFiles.root.minFile;
		try
		{
			fs.statSync(testFileName)
		}
		catch(e)
		{
			//scriptInfo.path += 'src/'
			scriptInfo.useMinFile = false;
		}
	}
	else  // in browser
	{
		scriptInfo = analysisEntranceScriptSrc(document);
	}

	scriptInfo.explicitModules = scriptInfo.modules;
	var modules = getEssentialModules(scriptInfo.modules);
	//scriptInfo.modules = modules;
	scriptInfo.modules = [];
	scriptInfo.files = [];
	scriptInfo.fileUrls = [];

	// save loaded module and file information
	scriptInfo.allModuleStructures = kekuleFiles;
	$root['__$kekule_load_info__'] = scriptInfo;
	$root['__$kekule_scriptfile_utils__'] = {
		'appendScriptFile': appendScriptFile,
		'appendScriptFiles': appendScriptFiles,
		'loadModuleScriptFiles': loadModuleScriptFiles
	};

	loadModuleScriptFiles(modules, scriptInfo.useMinFile, scriptInfo.path, scriptInfo, function(error){
		if (isNode)  // export Kekule namespace
		{
			// export Kekule in module
			exports.Kekule = this.Kekule || __nodeContext.Kekule;
			exports.Class = this.Class || __nodeContext.Class;
			exports.ClassEx = this.ClassEx || __nodeContext.ClassEx;
			exports.ObjectEx = this.ObjectEx || __nodeContext.ObjectEx;
			exports.DataType = this.DataType || __nodeContext.DataType;
			// and these common vars in global
			this.Class = exports.Class;
			this.ClassEx = exports.ClassEx;
			this.ObjectEx = exports.ObjectEx;
			this.DataType = exports.DataType;
			// then store script info of Kekule
			this.Kekule.scriptSrcInfo = scriptInfo;
		}
	});

	//console.log('ROOT', $root);

	/*
	files = getEssentialFiles(scriptInfo.modules, scriptInfo.useMinFile);
	path = scriptInfo.path;

	var scriptUrls = [];
	for (var i = 0, l = files.length; i < l; ++i)
	{
		scriptUrls.push(path + files[i]);
	}
	scriptUrls.push(path + 'kekule.loaded.js');  // manually add small file to indicate the end of Kekule loading

	// save loaded module and file information
	scriptInfo.files = files;
	scriptInfo.fileUrls = scriptUrls;  // already loaded file urls
	scriptInfo.allModuleStructures = kekuleFiles;
	$root['__$kekule_load_info__'] = scriptInfo;
	$root['__$kekule_scriptfile_utils__'] = {
		'appendScriptFile': appendScriptFile,
		'appendScriptFiles': appendScriptFiles
	};

	loadChildScriptFiles(scriptUrls, scriptInfo.forceDomLoader, function(){
		if (isNode)  // export Kekule namespace
		{
			// export Kekule in module
			exports.Kekule = this.Kekule || __nodeContext.Kekule;
			exports.Class = this.Class || __nodeContext.Class;
			exports.ClassEx = this.ClassEx || __nodeContext.ClassEx;
			exports.ObjectEx = this.ObjectEx || __nodeContext.ObjectEx;
			exports.DataType = this.DataType || __nodeContext.DataType;
			// and these common vars in global
			this.Class = exports.Class;
			this.ClassEx = exports.ClassEx;
			this.ObjectEx = exports.ObjectEx;
			this.DataType = exports.DataType;
			// then store script info of Kekule
			this.Kekule.scriptSrcInfo = scriptInfo;
		}
	});
	*/
}

if (isWebpack)
{
	module.exports = require('./kekule.webpack.prod.js');
}
else
	init();

})(this);