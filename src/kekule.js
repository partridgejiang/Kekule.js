function kekuleRequire(libName)
{
	// inserting via DOM fails in Safari 2.0, so brute force approach
  document.write('<script type="text/javascript" src="'+libName+'"><\/script>');
}

function getKekuleIncludes()
{
	var includes = [
		// douglascrockford's JSON2 lib, for JSON support in IE6/7
		'lan/json2.js',
		// Sizzle lib, for CSS style selector
		'lan/sizzle.js',

		// core
		'lan/classes.js',
		'lan/xmlJsons.js',
		'lan/serializations.js',

		// root
		'core/kekule.root.js',

		// Localization
		'localization/en/kekule.localize.en.js',
		'localization/en/kekule.localize.widget.en.js',
		'localization/en/kekule.localize.objDefines.en.js',
		'localization/en/kekule.localize.extras.openbabel.en.js',

		'core/kekule.common.js',
		'core/kekule.exceptions.js',
		'core/kekule.configs.js',
		'core/kekule.elements.js',
		'core/kekule.electrons.js',
		'core/kekule.valences.js',
		'core/kekule.structures.js',
		'core/kekule.structureBuilder.js',
		'core/kekule.reactions.js',
		'core/kekule.chemUtils.js',

		'utils/kekule.utils.js',
		'utils/kekule.domUtils.js',
		'utils/kekule.domHelper.js',
		'utils/kekule.textHelper.js',

		// X-Browser
		'xbrowsers/kekule.x.js',

		// chemdoc
		'chemdoc/kekule.glyph.base.js',
		'chemdoc/kekule.textBlocks.js',
		'chemdoc/kekule.glyph.pathGlyphs.js',
		'chemdoc/kekule.glyph.lines.js',
		'chemdoc/kekule.glyph.chemGlyphs.js',

		// IO
		'io/kekule.io.js',
		'io/cml/kekule.io.cml.js',
		'io/mdl/kekule.io.mdlBase.js',
		'io/mdl/kekule.io.mdl2000.js',
		'io/mdl/kekule.io.mdl3000.js',
		'io/mdl/kekule.io.mdlIO.js',
		'io/smiles/kekule.io.smiles.js',
		'io/native/kekule.io.native.js',

		// Renderer
		'render/kekule.render.extensions.js',
		'render/kekule.render.base.js',
		'render/kekule.render.utils.js',
		'render/kekule.render.configs.js',
		'render/kekule.render.baseTextRender.js',
		'render/kekule.render.boundInfoRecorder.js',
		'render/2d/kekule.render.renderer2D.js',
		'render/2d/kekule.render.glyphRender2D.js',
		'render/2d/kekule.render.canvasRenderer.js',
		'render/2d/kekule.render.raphaelRenderer.js',
		//'render/2d_OLD/kekule.render.def2DRenderer.js',
		//'render/2d_OLD/kekule.render.def2DGlyphRenderer.js',
		//'render/2d_OLD/kekule.render.raphaelUtils.js',
		//'render/2d_OLD/kekule.render.raphaelRenderer.js',
		//'render/3d/kekule.render.def3DRenderer.js',
		//'render/3d/kekule.render.threeRenderer.js',
		'render/3d/kekule.render.renderer3D.js',
		'render/3d/kekule.render.threeRenderer.js',

		'render/kekule.render.painter.js',

		// operation & action
		'widgets/operation/kekule.operations.js',
		'widgets/operation/kekule.actions.js',

		// widgets
		//'widgets/hammer.min.js',  // extra lib for touch events
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
		'widgets/commonCtrls/kekule.widget.menus.js',
		'widgets/commonCtrls/kekule.widget.containers.js',
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
		'widgets/advCtrls/objInspector/kekule.widget.objInspectors.js',
		'widgets/advCtrls/objInspector/kekule.widget.objInspector.propEditors.js',
		'widgets/advCtrls/objInspector/kekule.widget.objInspector.chemPropEditors.js',
		'widgets/advCtrls/objInspector/kekule.widget.objInspector.operations.js',
		'widgets/advCtrls/kekule.widget.configurators.js',
		'widgets/sys/kekule.widget.sysMsgs.js',

		'widgets/operation/kekule.operHistoryTreeViews.js',  // debug

		// chem widgets
		'widgets/chem/kekule.chemWidget.base.js',
		'widgets/chem/periodicTable/kekule.chemWidget.periodicTables.js',
		'widgets/chem/kekule.chemWidget.chemObjDisplayers.js',
		'widgets/chem/structureTreeView/kekule.chemWidget.structureTreeViews.js',
		'widgets/chem/uiMarker/kekule.chemWidget.uiMarkers.js',
		'widgets/chem/viewer/kekule.chemWidget.viewers.js',
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
		//'widgets/chem/editor/2d/kekule.chemEditor.editor2d.js',

		/*
		 // uiComps
		 'uiComponents_DEPRECATED/kekule.uiComps.js',

		 // Operation
		 'uiComponents_DEPRECATED/operation/kekule.operations.js',

		 // viewer
		 'uiComponents_DEPRECATED/viewer/kekule.viewer.base.js',
		 'uiComponents_DEPRECATED/viewer/kekule.viewer.baseIaControllers.js',
		 'uiComponents_DEPRECATED/viewer/2d/kekule.viewer.viewer2dConfigs.js',
		 'uiComponents_DEPRECATED/viewer/2d/kekule.viewer.viewer2d.js',
		 'uiComponents_DEPRECATED/viewer/3d/kekule.viewer.viewer3dConfigs.js',
		 'uiComponents_DEPRECATED/viewer/3d/kekule.viewer.viewer3d.js',

		 // editor
		 'uiComponents_DEPRECATED/editor/kekule.editor.extensions.js',
		 'uiComponents_DEPRECATED/editor/kekule.editor.base.js',
		 'uiComponents_DEPRECATED/editor/kekule.editor.editOperations.js',
		 'uiComponents_DEPRECATED/editor/2d/kekule.editor.editor2dConfigs.js',
		 'uiComponents_DEPRECATED/editor/2d/kekule.editor.editor2dBase.js',
		 'uiComponents_DEPRECATED/editor/2d/kekule.editor.uiMarkers.js',
		 'uiComponents_DEPRECATED/editor/2d/kekule.editor.ctab2dEditors.js',
		 'uiComponents_DEPRECATED/editor/2d/kekule.editor.editor2dUtils.js',

		 // html
		 'html/kekule.autoLaunchers.js',
		 */
		'html/kekule.predefinedResLoaders.js',

		// algorithm
		'algorithm/kekule.graph.js',
		'algorithm/kekule.structures.helpers.js',
		'algorithm/kekule.structures.canonicalizers.js',
		'algorithm/kekule.structures.ringSearches.js',
		'algorithm/kekule.structures.aromatics.js',
		'algorithm/kekule.structures.standardizers.js',
		'algorithm/kekule.structures.searches.js',

		// Data
		'data/kekule.chemicalElementsData.js',
		'data/kekule.isotopesData.organSet.js',
		'data/kekule.structGenAtomTypesData.js',
		'data/kekule.dataUtils.js',
		'render/kekule.render.renderColorData.js',

		// Extras
		'_extras/kekule.emscriptenUtils.js',
		'_extras/OpenBabel/kekule.openbabel.adapters.js',
		'_extras/OpenBabel/kekule.openbabel.io.js'
		//'_extras/OpenBabel/openbabel.js.LARGE'
	];
	return includes;
}

function kekuleLoad()
{
	var scriptElems = document.getElementsByTagName('script');
	var loc;
	for (var i = 0, l = scriptElems.length; i < l; ++i)
	{
		var elem = scriptElems[i];
		if (elem.src && (elem.src.match(/kekule\.js(\?.*)?$/)))
		{
			loc = elem.src;
			break;
		}
	}

	var includes = getKekuleIncludes();
	var path = loc.replace(/kekule\.js(\?.*)?$/,'');


	for (var i = 0, l = includes.length; i < l; ++i)
		kekuleRequire(path + includes[i]);
}

kekuleLoad();