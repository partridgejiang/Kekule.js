(function(){

Kekule.DemoUtils = {
	DEMO_INFOS: [],
	DEMO_MAP: {},
	newDemoItem: function(id, title, shortDesc)
	{
		var result = {'id': id, 'title': title, 'shortDesc': shortDesc};
		DU.DEMO_MAP[id] = result;
		return result;
	},
	newDemoCategory: function(id, title, shortDesc, children)
	{
		var result = DU.newDemoItem(id, title, shortDesc);
		result.children = children || [];
		return result;
	},
	newRootCategory: function(id, title, shortDesc, children)
	{
		var result = DU.newDemoCategory(id, title, shortDesc, children);
		Kekule.DemoUtils.DEMO_INFOS.push(result);
		return result;
	},
	newConcreteDemo: function(id, title, shortDesc, url, introUrl)
	{
		var result = DU.newDemoItem(id, title, shortDesc);
		result.url = url;
		result.introUrl = introUrl;
		return result;
	},

	isCategory: function(demoItem)
	{
		return !!demoItem.children;
	},

	getInfoById: function(id)
	{
		return DU.DEMO_MAP[id];
	}
};
var DU = Kekule.DemoUtils;
// add demos
DU.newRootCategory('algorithm', 'Algorithm', 'Demos about molecule algorithm', [
	DU.newConcreteDemo('ringPerception', 'Ring Perception', 'Detects all rings, SSSR and aromatic rings in molecule.', 'algorithm/ringSearch.html', 'algorithm/ringSearch_intro.html'),
	DU.newConcreteDemo('structCompare', 'Structure Compare', 'Compare two user input molecule.', 'algorithm/structureCompare.html', 'algorithm/structureCompare_intro.html'),
	DU.newConcreteDemo('structSearch', 'Sub Structure Search', 'Search sub structure in molecules.', 'algorithm/structureSearch.html', 'algorithm/structureSearch_intro.html'),
	DU.newConcreteDemo('reactionExercise', 'Reaction Exercise', 'An online organic chemistry reaction exam, fill in keys and check the score on pure client code.', 'algorithm/reactionExercise.html')
]);
DU.newRootCategory('widget', 'Common Widget', 'Demos about common widgets such as button, textbox, etc.', [
	DU.newConcreteDemo('autoLaunch', 'Widget Auto-Launching', 'Demonstrates of embeddeding widgets in HTML page and launching them automatically.', 'widget/autoLaunch.html'),
	DU.newConcreteDemo('commonWidgets', 'Common Widgets', 'Demonstrates general-use widgets like button, check box, tab view and so on.', 'widget/commonWidgets.html'),
	DU.newConcreteDemo('dataTable', 'Data Table', 'Demonstrates the usage of data table widget to display chemical data..', 'dataTable/dataTable.html')
]);
DU.newRootCategory('chemWidget', 'Chem Widget', 'Demos about widgets of chemistry', [
	DU.newConcreteDemo('periodicTable', 'Periodic Table', 'Demonstrates the use of periodic table widget.', 'periodicTable/periodicTable.html'),
	DU.newConcreteDemo('chemViewer2D', 'Chem Viewer 2D', 'Demonstrates function of 2D chem viewer widget.', 'chemViewer/chemViewer2D.html', 'chemViewer/chemViewer_intro.html'),
	DU.newConcreteDemo('chemViewer3D', 'Chem Viewer 3D', 'Demonstrates function of 3D chem viewer widget.', 'chemViewer/chemViewer3D.html', 'chemViewer/chemViewer_intro.html'),
	DU.newConcreteDemo('embeddedViewer', 'Embedded Chem Object', 'Demonstrates display molecules using embedded chem viewer and pure HTML code (without JavaScript).', 'chemViewer/embeddedChemViewer.html'),
	DU.newConcreteDemo('moleculeViewer', 'Molecule Viewer', 'Demonstrates variety forms of chem viewer widge to display molecule.', 'chemViewer/moleculeViewer.html'),
	DU.newConcreteDemo('chemEditor', 'Chem Composer', 'A full function chemistry editor.', 'chemEditor/chemEditor.html')
]);
DU.newRootCategory('extra', 'Extra', 'Demos some extra functions of Kekule.js', [
	DU.newConcreteDemo('ckEditorPlugins', 'Plugins for CKEditor', 'Demonstrates the integration of Kekule.js with web rich text editor.', 'CKEditor/ckeditorDemo.html', 'CKEditor/ckeditorDemo_intro.html'),
	DU.newConcreteDemo('openBabelGen3D', '3D Structure Generator', 'Generate 3D molecule structure from 2D connection table by force field calculation totally inside web browser.', 'calculation/gen3D.html'),
]);


Kekule.Demos = {};

Kekule.Demos.LaunchUtils = {
	DEMO_ITEM_BASE_PATH: 'items/',
	_getDemoLaunchHref: function(demoId)
	{
		return 'demoLauncher.html?id=' + demoId;
	},
	fillDemoListHtml: function(navElem, contentElem)
	{
		var doc = (navElem || contentElem).ownerDocument;
		var demos = Kekule.DemoUtils.DEMO_INFOS;
		for (var i = 0, l = demos.length; i < l; ++i)
		{
			var item = demos[i];
			if (DU.isCategory(item))
			{
				ILU._addCategoryHtml(item, doc, navElem, contentElem);
			}
			else
			{
				ILU._addConcreteDemoHtml(item, doc, navElem, contentElem);
			}
		}
	},
	_addCategoryHtml: function(category, doc, parentNavElem, parentContentElem)
	{
		var navElem, contentElem;
		if (parentNavElem)
		{
			var elem = doc.createElement('a');
			elem.innerHTML = category.title;
			elem.id = category.id;
			elem.href = 'javascript:void(0)';
			var navElem = doc.createElement('ul');
			elem.appendChild(navElem);
			parentNavElem.appendChild(elem);
		}
		if (parentContentElem)
		{
			var elem = doc.createElement('h2');
			elem.innerHTML = category.title;
			contentElem = doc.createElement('section');
			contentElem.appendChild(elem);
			contentElem.className = 'DemoCategory';
			parentContentElem.appendChild(contentElem);
		}
		var children = category.children;
		if (children && children.length)
		{
			for (var i = 0, l = children.length; i < l; ++i)
			{
				var child = children[i];
				if (DU.isCategory(child))
					ILU._addCategoryHtml(child, doc, navElem, contentElem);
				else
					ILU._addConcreteDemoHtml(child, doc, navElem, contentElem);
			}
		}
	},
	_addConcreteDemoHtml: function(item, doc, parentNavElem, parentContentElem)
	{
		if (parentNavElem)
		{
			var elem = doc.createElement('li');
			var aElem = doc.createElement('a');
			aElem.innerHTML = item.title;
			aElem.href = ILU._getDemoLaunchHref(item.id);
			elem.appendChild(aElem);
			parentNavElem.appendChild(elem);
		}
		if (parentContentElem)
		{
			var aElem = doc.createElement('a');
			aElem.innerHTML = item.title;
			aElem.href = ILU._getDemoLaunchHref(item.id);
			var elem = doc.createElement('h3');
			elem.appendChild(aElem);
			var sElem = doc.createElement('section');
			sElem.appendChild(elem);
			sElem.className = 'DemoItem';
			if (item.shortDesc)
			{
				/*
				var elem = doc.createElement('p');
				elem.innerHTML = item.shortDesc;
				*/
				var elem = ILU._createDescriptionElem(doc, item.shortDesc);
				sElem.appendChild(elem);
			}
			parentContentElem.appendChild(sElem);
		}
	},

	fillConcreteDemoHtml: function(demoId, navElem, titleElem, introElem)
	{
		var doc = (navElem || titleElem || introElem).ownerDocument;
		var demoInfo = DU.getInfoById(demoId);
		// nav menu
		ILU.fillDemoListHtml(navElem, null);
		// title
		titleElem.innerHTML = demoInfo.title;
		// description
		var pElem = ILU._createDescriptionElem(doc, demoInfo.shortDesc);
		introElem.appendChild(pElem);
		// open in new window link
		var aElem = doc.createElement('a');
		aElem.href = ILU.DEMO_ITEM_BASE_PATH + demoInfo.url;
		aElem.setAttribute('target', '_blank');
		aElem.innerHTML = 'Open  demo in new window &gt;';
		var pElem = doc.createElement('p');
		pElem.className = 'LinkDemoOpenInNewWindow';
		pElem.appendChild(aElem);
		introElem.appendChild(pElem);
	},

	_createDescriptionElem: function(doc, description)
	{
		var result = doc.createElement('p');
		Kekule.DomUtils.setElementText(result, description);
		return result;
	},

	getDemoPageId: function(doc)
	{
		if (!doc)
			doc = document;
		var url = doc.location.href;
		var querys = Kekule.UrlUtils.analysisSearch(url, true);
		var demoId = querys.id;
		return demoId;
	},
	loadDemoPage: function(demoId, demoFrameElem, introFrameElem)
	{
		var demoInfo = DU.getInfoById(demoId);
		var url = demoInfo.url;
		demoFrameElem.src = ILU.DEMO_ITEM_BASE_PATH + url;
		demoFrameElem.ownerDocument.title = demoInfo.title + ' - Kekule.js Demo';
		var rootElem = demoFrameElem.ownerDocument.documentElement;
		/*
		if (rootElem)  // add offline manifest		
		{
			var manifestUrl = ILU.DEMO_ITEM_BASE_PATH + url.replace('.html', '.manifest'); 
			rootElem.setAttribute('manifest', manifestUrl);
		}
		*/

		url = demoInfo.introUrl;
		if (url)
		{
			introFrameElem.src = ILU.DEMO_ITEM_BASE_PATH + url;
		}
	},
	loadDemoByPageParam: function(demoFrameElem, introFrameElem)
	{
		var demoId = ILU.getDemoPageId();
		if (demoId)
		{
			ILU.loadDemoPage(demoId, demoFrameElem, introFrameElem);
		}
	}
};
var ILU = Kekule.Demos.LaunchUtils;


})();
