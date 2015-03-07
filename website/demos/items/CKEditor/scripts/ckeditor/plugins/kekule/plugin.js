(function(){
	var CLASS_NAME_VIEWER2D = 'K-Chem-Viewer2D';
	var CLASS_NAME_VIEWER3D = 'K-Chem-Viewer3D';

	var addScriptFile = function(doc, url, callback)
	{
		var result = doc.createElement('script');
		result.src = url;
		result.onload = result.onreadystatechange = function(e)
		{
			if (result._loaded)
				return;
			var readyState = result.readyState;
			if (readyState === undefined || readyState === 'loaded' || readState === 'complete')
			{
				result._loaded = true;
				result.onload = result.onreadystatechange = null;
				callback();
			}
		}
		doc.getElementsByTagName('head')[0].appendChild(result);
		return result;
	};
	var addSeqScriptFiles = function(doc, urls)
	{
		if (urls.length <= 0)
			return;
		var file = urls.shift();
		addScriptFile(doc, file, function()
			{
				addSeqScriptFiles(doc, urls);
			}
		);
	};
	var addCssFile = function(doc, url)
	{
		// <link rel="stylesheet" type="text/css" href="../../../src/widgets/themes/default/default.css" />
		var result = doc.createElement('link');
		result.setAttribute('rel', 'stylesheet');
		result.setAttribute('type', 'text/css');
		result.setAttribute('href', url);
		//doc.getElementsByTagName('head')[0].appendChild(result);
		doc.body.appendChild(result);
		return result;
	};
	var addEssentialAssocFiles = function(editor, pluginPath)
	{
		var doc = document;
		// script files
		var scriptPath = pluginPath + 'libs/';
		var scriptFiles = ['raphael.js', 'raphael.export.js', 'Three.js', 'kekule.compressed.js'];
		var scriptUrls = [];
		for (var i = 0, l = scriptFiles.length; i < l; ++i)
		{
			scriptUrls.push(scriptPath + scriptFiles[i]);
		}
		addSeqScriptFiles(doc, scriptUrls);
		// CSS files
		var cssPath = pluginPath + 'styles/';
		var cssFiles = ['default.css', 'defaultColor.css', 'chemWidget.css', 'chemWidgetColor.css', 'override.css'];
		for (var i = 0, l = cssFiles.length; i < l; ++i)
		{
			var url = cssPath + cssFiles[i];
			addCssFile(doc, url);
			editor.addContentsCss(url);  // also add to HTML inside editor
		}
	};

	CKEDITOR.plugins.add( 'kekule', {
		icons: 'chemObj2D',
		lang: 'en,zh-cn',
		init: function( editor ) {
			addEssentialAssocFiles(editor, this.path);

			editor.addCommand( 'insertChemObj2D',
				new CKEDITOR.dialogCommand( 'insertChemObjDialog2D', {
					allowedContent: 'img[data-*](K-*)'
				})
			);
			editor.addCommand( 'insertChemObj3D',
				new CKEDITOR.dialogCommand( 'insertChemObjDialog3D', {
					allowedContent: 'img[data-*](K-*)'
				})
			);
			/*
			editor.addCommand( 'insertChemObj',
				{
					exec: function( editor ) {
						var now = new Date();
						editor.insertHtml( 'The current date and time is: <em>' + now.toString() + '</em>' );
					}
				});
			*/

			/*
			var styleDir = this.path + 'styles/';
			editor.addContentsCss(styleDir + 'default.css');
			editor.addContentsCss(styleDir + 'defaultColor.css');
			editor.addContentsCss(styleDir + 'chemWidget.css');
			editor.addContentsCss(styleDir + 'chemWidgetColor.css');
			*/

			var sToolbar = /*'kekule'; //*/ 'insert';
			//editor.ui.addToolbarGroup(sToolbar, null, 'insert');
			editor.ui.addButton( 'ChemObj2D', {
				label: editor.lang.kekule.caption_ins_mol2D, //*/'Insert 2D Molecule',
				icon: this.path + 'icons/insertChemObj2D.png',
				command: 'insertChemObj2D',
				toolbar: sToolbar
			});
			editor.ui.addButton( 'ChemObj3D', {
				label: editor.lang.kekule.caption_ins_mol3D, //*/'Insert 3D Molecule',
				icon: this.path + 'icons/insertChemObj3D.png',
				command: 'insertChemObj3D',
				toolbar: sToolbar
			});

			if ( editor.contextMenu ) {
				editor.addMenuGroup( 'kekuleGroup' );
				editor.addMenuItem( 'chemObj2DItem', {
					label: editor.lang.kekule.caption_edit_mol2D,  //'Edit 2D Molecule',
					icon: this.path + 'icons/insertChemObj2D.png',
					command: 'insertChemObj2D',
					group: 'kekuleGroup'
				});
				editor.addMenuItem( 'chemObj3DItem', {
					label: editor.lang.kekule.caption_edit_mol3D,  //'Edit 3D Molecule',
					icon: this.path + 'icons/insertChemObj3D.png',
					command: 'insertChemObj3D',
					group: 'kekuleGroup'
				});

				editor.contextMenu.addListener( function( element )
				{
					if (element.hasClass(CLASS_NAME_VIEWER2D))  // 2D molecule
					{
						return {chemObj2DItem: CKEDITOR.TRISTATE_OFF};
					}
					else if (element.hasClass(CLASS_NAME_VIEWER3D))  // 3D molecule
					{
						return {chemObj3DItem: CKEDITOR.TRISTATE_OFF};
					}
				});
			}



			CKEDITOR.dialog.add( 'insertChemObjDialog2D', this.path + 'dialogs/insertChemObjDlg.js' );
			CKEDITOR.dialog.add( 'insertChemObjDialog3D', this.path + 'dialogs/insertChemObjDlg.js' );
		}
	});
})();