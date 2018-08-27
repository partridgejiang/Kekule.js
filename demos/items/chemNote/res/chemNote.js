var ChemNote = {};

function $(id)
{
	return document.getElementById(id);
}

(function(document, window){
"use strict";

var AU = Kekule.ArrayUtils;
var DU = Kekule.DomUtils;
var EU = Kekule.HtmlElementUtils;

ChemNote.HtmlClassNames = {
	NOTE_LISTVIEW: 'ChemNote-NoteListView',
	NOTE_ITEM: 'ChemNote-NoteItem',
	NOTE_ITEM_CONTAINER: 'ChemNote-NoteItem-Container',
	NOTE_ITEM_TEXT_REGION: 'ChemNote-NoteItem-TextRegion',
	NOTE_ITEM_CHEM_REGION: 'ChemNote-NoteItem-ChemRegion',
	NOTE_ITEM_TITLE: 'ChemNote-NoteItem-Title',
	NOTE_ITEM_TEXT_CONTENT: 'ChemNote-NoteItem-TextContent',
	/*NOTE_ITEM_IMG_PREVIEW: 'ChemNote-NoteItem-ImgPreview',*/
	NOTE_ITEM_CHEM_CONTENT: 'ChemNote-NoteItem-ChemContent',
	NOTE_ITEM_DATETIME: 'ChemNote-NoteItem-DateTime',

	NOTE_EDITOR: 'ChemNote-NoteEditor',
	NOTE_EDITOR_TEXT_REGION: 'ChemNote-NoteEditor-TextRegion',
	NOTE_EDITOR_CHEM_REGION: 'ChemNote-NoteEditor-ChemRegion',
	NOTE_EDITOR_CHEM_EDIT_BUTTON: 'ChemNote-NoteEditor-ChemEditButton'
};
var CNS = ChemNote.HtmlClassNames;
var CCNS = Kekule.ChemWidget.HtmlClassNames;

ChemNote.Texts = {
	CAPTION_NOTE_TITLE: 'Title',
	CAPTION_NOTE_TEXT_CONTENT: 'Text content',
	CAPTION_NOTE_CHEM_CONTENT: 'Chemistry content',
	TEXT_EMPTY: '<empty>'
};
var CNT =	ChemNote.Texts;

ChemNote.PreviewImage = {
	WIDTH: 400,
	HEIGHT: 300
};

ChemNote.NoteDataSet = Class.create(Kekule.Widget.ArrayDataSet, {
	/** @private */
	CLASS_NAME: 'ChemNote.NoteDataSet',

	/**
	 * Save data to localStorage.
	 * @param {String} keyName
	 */
	saveToStorage: function(keyName)
	{
		var data = this.getData();
		this._sortData(data);
		var str = JSON.stringify(data);
		window.localStorage.setItem(keyName, str);
	},
	/**
	 * Load data from storage.
	 * @param {String} keyName
	 */
	loadFromStorage: function(keyName)
	{
		try
		{
			var str = window.localStorage.getItem(keyName);
			var data = JSON.parse(str);
			this._sortData(data);
			this.setData(data);
		}
		finally
		{

		}
	},
	/** @private */
	_sortData: function(data)
	{
		if (data)
		{
			data.sort(function(a, b)
			{
				return a.modifiedTime - b.modifiedTime;
			});
		}
	}
});

ChemNote.NoteListView = Class.create(Kekule.Widget.BaseWidget, {
	/** @private */
	CLASS_NAME: 'ChemNote.NoteListView',
	/** @private */
	BINDABLE_TAG_NAMES: ['ul', 'ol'],
	/** @private */
	FIELD_DATA_ITEM: '__$data__',
	/** @private */
	FIELD_VIEW_ITEM: '__$view__',
	/** @constructs */
	initialize: function($super, parentOrElementOrDocument, isDumb)
	{
		$super(parentOrElementOrDocument);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dataSet', {
			'dataType': 'ChemNote.NoteDataSet',
			'scope': Class.PropertyScope.PUBLIC, 'serializable': false
		});
		// private
		//this.defineProp('containerElem', {'dataType':DataType.OBJECT, 'setter': null, 'serializable': false});
	},

	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		if (modifiedPropNames.indexOf('dataSet') >= 0)
		{
			this.bindData(this.getDataSet());
		}
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.NOTE_LISTVIEW;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('ul');
		return result;
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		/*
		var elem = doc.createElement('div');
		elem.className = CNS.NOTE_ITEM_CONTAINER;
		this.setPropStoreFieldValue('containerElem', elem);
		return [elem];
		*/
		return $super(doc, rootElem);
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		this.bindData();
	},

	/**
	 * Bind to a data set and refresh outlook.
	 * @param {Object} dataset
	 */
	bindData: function(dataset)
	{
		if (!dataset)
			dataset = this.getDataSet();
		var doc = this.getDocument();
		var parentElem = this.getElement();
		parentElem.innerHTML = '';
		if (dataset)
		{
			var notes = dataset.getData();
			for (var i = notes.length - 1; i >= 0; --i)  // reversed order
			{
				this.appendItem(notes[i], doc, parentElem);
			}
			this.sortItems();
		}
	},
	/**
	 * Add new note data to dataset.
	 * @param noteData
	 */
	addNote: function(noteData)
	{
		var data = this.getDataSet().getData();
		if (data)
		{
			data.push(noteData);
			this.appendItem(noteData);
			this.notifyItemChanged();
		}
	},
	/**
	 * Remove a note from list.
	 * @param noteData
	 */
	removeNote: function(noteData)
	{
		if (this.getDataSet())
		{
			var data = this.getDataSet().getData();
			if (data)
			{
				var index = data.indexOf(noteData);
				if (index >= 0)
				{
					data.splice(index, 1);
					//var elem = data[this.FIELD_VIEW_ITEM];
					var elem = this.getListViewItemOfData(noteData);
					if (elem)
						elem.parentNode.removeChild(elem);
				}
			}
		}
	},
	/**
	 * Modify a note.
	 * @param noteData
	 */
	modifyNote: function(noteData)
	{
		//var elem = noteData[this.FIELD_VIEW_ITEM];
		var elem = this.getListViewItemOfData(noteData);
		if (elem)
		{
			this._updateListViewItem(elem, noteData);
			this.notifyItemChanged();
		}
	},

	/** @private */
	notifyItemChanged: function()
	{
		this.sortItems();
	},

	/**
	 * Returns array of note item elements in list.
	 */
	getItems: function()
	{
		var root = this.getElement();
		return DU.getDirectChildElems(root, 'li');
	},
	/**
	 * Sort note item elements according to modification time.
	 */
	sortItems: function()
	{
		var items = this.getItems();
		var field = this.FIELD_DATA_ITEM;
		items.sort(function(a, b){
			var dataA = a[field];
			var dataB = b[field];
			return (dataA.modifiedTime || 0) - (dataB.modifiedTime || 0);
		});

		var root = this.getElement();
		DU.clearChildContent(root);
		for (var i = items.length - 1; i >= 0; --i)  // reversed order
		{
			root.appendChild(items[i]);
		}
	},

	/**
	 * Check if note is in this list.
	 * @param noteData
	 * @returns {Bool}
	 */
	hasItem: function(noteData)
	{
		var data = this.getDataSet().getData();
		if (data)
		{
			var index = data.indexOf(noteData);
			if (index >= 0)
				return true;
		}
		return false;
	},
	/**
	 * Create a new note item element (but do not inserted into DOM).
	 * @param noteData
	 * @param doc
	 */
	createItem: function(noteData, doc)
	{
		if (!doc)
			doc = this.getDocument();

		var result = doc.createElement('li');
		result.className = CNS.NOTE_ITEM;

		var containerElem = doc.createElement('div');
		containerElem.className = CNS.NOTE_ITEM_CONTAINER;

		var textRegionElem = doc.createElement('div');
		textRegionElem.className = CNS.NOTE_ITEM_TEXT_REGION;
		containerElem.appendChild(textRegionElem);
		var chemRegionElem = doc.createElement('div');
		chemRegionElem.className = CNS.NOTE_ITEM_CHEM_REGION;
		containerElem.appendChild(chemRegionElem);

		// title
		var titleElem = doc.createElement('h2');
		titleElem.className = CNS.NOTE_ITEM_TITLE;
		//DU.setElementText(titleElem, noteData.title || CNT.TEXT_EMPTY);
		textRegionElem.appendChild(titleElem);

		// timestamp
		var timeElem = doc.createElement('h3');
		timeElem.className = CNS.NOTE_ITEM_DATETIME;
		var timeText = '';
		/*
		 if (noteData.modifiedTime)
		 {
		 var d = new Date(noteData.modifiedTime);
		 timeText = d.toLocaleString();
		 }
		 DU.setElementText(timeElem, timeText);
		 */
		textRegionElem.appendChild(timeElem);

		// text content
		var textElem = doc.createElement('p');
		textElem.className = CNS.NOTE_ITEM_TEXT_CONTENT;
		//DU.setElementText(textElem, noteData.text || CNT.TEXT_EMPTY);
		textRegionElem.appendChild(textElem);

		// img preview
		var imgPreviewElem = doc.createElement('pre');
		imgPreviewElem.className = CNS.NOTE_ITEM_CHEM_CONTENT;
		chemRegionElem.appendChild(imgPreviewElem);

		result.appendChild(containerElem);

		// delete mark


		result[this.FIELD_DATA_ITEM] = noteData;
		//noteData[this.FIELD_VIEW_ITEM] = result;

		this._updateListViewItem(result, noteData);

		return result;
	},
	/**
	 * Append element represent note data item.
	 * @param doc
	 * @param parentElem
	 * @param noteData
	 */
	appendItem: function(noteData, doc, parentElem)
	{
		if (!doc)
			doc = this.getDocument();
		if (!parentElem)
			parentElem = this.getElement();

		var result;
		if (this.getDataSet())
		{
			result = this.createItem(noteData, doc, parentElem);
			parentElem.appendChild(result);
			//this.notifyItemChanged();
		}
		return result;
	},
	/** @private */
	getListViewItemOfData: function(noteData)
	{
		var items = this.getElement().getElementsByTagName('li');
		for (var i = 0, l = items.length; i < l; ++i)
		{
			var item = items[i];
			if (item[this.FIELD_DATA_ITEM] === noteData)
				return item;
		}
		return null;
	},
	/** @private */
	_updateListViewItem: function(itemElem, noteData)
	{
		// title
		var titleElem = itemElem.getElementsByTagName('h2')[0];
		DU.setElementText(titleElem, noteData.title || CNT.TEXT_EMPTY);

		// time
		var timeElem = itemElem.getElementsByTagName('h3')[0];
		var timeText = '';
		if (noteData.modifiedTime)
		{
			var d = new Date(noteData.modifiedTime);
			timeText = d.toLocaleString();
		}
		DU.setElementText(timeElem, timeText);

		// text
		var textElem = itemElem.getElementsByTagName('p')[0];
		var texts = noteData.text || CNT.TEXT_EMPTY;
		var convText = texts.split('\n').join('<br />');
		//DU.setElementText(textElem, convText);
		textElem.innerHTML = convText;

		// img preview
		if (noteData.imgPreview)
		{
			var chemPreviewElem = itemElem.getElementsByTagName('pre')[0];
			chemPreviewElem.style.backgroundImage = 'url(' + noteData.imgPreview + ')';
		}
	},

	/** @private */
	_getBelongedItemElem: function(childElem)
	{
		if (!DU.isDescendantOf(childElem, this.getElement()))
			return null;
		if (childElem[this.FIELD_DATA_ITEM])
			return childElem;
		else
			return this._getBelongedItemElem(childElem.parentNode);
	},

	/**
	 * Select a note item in list.
	 * @param noteItemElem
	 */
	selectNoteItem: function(noteItemElem)
	{
		var note = noteItemElem[this.FIELD_DATA_ITEM];
		//console.log(note);
		this.invokeEvent('select', {'note': note});
	},

	/** @private */
	doReactActiviting: function($super, e)
	{
		$super(e);
		var targetElem = e.getTarget();
		var itemElem = this._getBelongedItemElem(targetElem);
		this._activeItem = itemElem;
	},
	/** @private */
	doReactDeactiviting: function($super, e)
	{
		$super(e);
		if (this.getIsActive())  // meet a active-deactive event, clicked or key pressed on button
		{
			var targetElem = e.getTarget();
			var itemElem = this._getBelongedItemElem(targetElem);
			if (itemElem && itemElem === this._activeItem)
				this.selectNoteItem(itemElem);
		}
	}
});

ChemNote.NoteEditor = Class.create(Kekule.Widget.Container, {
	/** @private */
	CLASS_NAME: 'ChemNote.NoteEditor',
	/** @private */
	initProperties: function()
	{
		this.defineProp('note', {'dataType': DataType.OBJECT});
		this.defineProp('titleEditor', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('textEditor', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('chemViewer', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('chemEditButton', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
		this.defineProp('imgExporter', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});
	},
	/** @ignore */
	doObjectChange: function($super, modifiedPropNames)
	{
		if (modifiedPropNames.indexOf('note') >= 0)
		{
			this.loadFromNote(this.getNote());
		}
	},

	/** @ignore */
	doGetWidgetClassName: function($super)
	{
		return $super() + ' ' + CNS.NOTE_EDITOR;
	},
	/** @ignore */
	doCreateRootElement: function(doc)
	{
		var result = doc.createElement('div');
		return result;
	},
	/** @ignore */
	doBindElement: function($super, element)
	{
		$super(element);
		this.loadFromNote();
	},
	/** @ignore */
	doCreateSubElements: function($super, doc, rootElem)
	{
		var result = $super(doc, rootElem);
		var textRegion = doc.createElement('div');
		textRegion.className = CNS.NOTE_EDITOR_TEXT_REGION;

		rootElem.appendChild(textRegion);

		var textBox = new Kekule.Widget.TextBox(this);
		textBox.setPlaceholder('[' + CNT.CAPTION_NOTE_TITLE + ']');
		textBox.appendToElem(textRegion);
		this.setPropStoreFieldValue('titleEditor', textBox);

		var textArea = new Kekule.Widget.TextArea(this);
		textArea.setPlaceholder('[' + CNT.CAPTION_NOTE_TEXT_CONTENT + ']');
		textArea.appendToElem(textRegion);
		this.setPropStoreFieldValue('textEditor', textArea);

		var chemRegion = doc.createElement('div');
		chemRegion.className = CNS.NOTE_EDITOR_CHEM_REGION;

		rootElem.appendChild(chemRegion);

		var imgExporter = new Kekule.ChemWidget.Viewer2D(this);
		imgExporter.setUseCornerDecoration(false).setDimension(ChemNote.PreviewImage.WIDTH, ChemNote.PreviewImage.HEIGHT);
		var imgExporterElem = imgExporter.getElement();
		imgExporterElem.style.visibility = 'hidden';
		imgExporterElem.style.zIndex = '-1';
		imgExporterElem.style.position = 'absolute';
		imgExporterElem.style.top = '-10000px';
		imgExporterElem.style.left = '-10000px';
		imgExporter.appendToElem(chemRegion);
		this.setPropStoreFieldValue('imgExporter', imgExporter);

		var chemViewer = new Kekule.ChemWidget.Viewer2D(this);
		chemViewer.setUseCornerDecoration(true);
		chemViewer.setEnableEdit(true).setEnableEditFromVoid(true).setRestrainEditorWithCurrObj(false);
		chemViewer.appendToElem(chemRegion);
		this.setPropStoreFieldValue('chemViewer', chemViewer);
		Kekule.X.Event.addListener(window, 'resize', function(){
			chemViewer.resized();
		});
		Kekule.X.domReady(function(){
			chemViewer.resized();
		});

		var btn = new Kekule.Widget.Button(this);
		btn.setText('Edit');
		btn.addClassName(CNS.NOTE_EDITOR_CHEM_EDIT_BUTTON).addClassName(CCNS.ACTION_VIEWER_EDIT);
		btn.appendToElem(chemViewer.getElement());
		btn.on('execute', this.requestOpenChemEditor, this);
		this.setPropStoreFieldValue('chemEditButton', btn);

		return (result || []).concat(textRegion, chemRegion);
	},

	requestOpenChemEditor: function()
	{
		/*
		var chemObj = this.getChemViewer().getChemObj();
		this.invokeEvent('requestEditChemObj', {'chemObj': chemObj});
		*/
		this.getChemViewer().openEditor(this.getChemEditButton());
	},

	/** @private */
	_loadChemObj: function(data)
	{
		return Kekule.IO.loadFormatData(data, Kekule.IO.DataFormat.KEKULE_JSON);
	},
	_saveChemObj: function(chemObj)
	{
		return Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.KEKULE_JSON);
	},
	/** @private */
	loadFromNote: function(note)
	{
		if (!note)
			note = this.getNote();

		if (note)
		{
			this.getTitleEditor().setValue(note.title || '');
			this.getTextEditor().setValue(note.text || '');
			if (note.chemObj)
			{
				try
				{
					var chemObj = this._loadChemObj(note.chemObj);
					this.getChemViewer().setChemObj(chemObj);
				}
				catch(e)
				{
					Kekule.error(e.message);
				}
			}
			else
				this.getChemViewer().setChemObj(null);
		}
	},
	/** @private */
	saveToNote: function(note)
	{
		if (note)
		{
			note.title = this.getTitleEditor().getValue() || null;
			note.text = this.getTextEditor().getValue() || null;
			note.modifiedTime = Date.now();
			// chem data
			var chemObj = this.getChemViewer().getChemObj();
			var chemData = chemObj? this._saveChemObj(chemObj): '';
			note.chemObj = chemData;
			// preview img
			var imgExporter = this.getImgExporter();
			imgExporter.setChemObj(null);
			imgExporter.setChemObj(chemObj);
			var dataUri = imgExporter.exportToDataUri('image/png');
			note.imgPreview = dataUri;
			//console.log('img preview', dataUri);
		}
	}
});

ChemNote.PanelSwitcher = Class.create(ObjectEx,{
	CLASS_NAME: 'ChemNote.PanelSwitcher',
	/** @private */
	initialize: function($super)
	{
		$super();
		//this._transition = new Kekule.Widget.Css3SlideTransition()
	},
	initProperties: function()
	{
		this.defineProp('panels', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('activePanel', {'dataType': DataType.OBJECT, 'serializable': false,
			'setter': function(value)
			{
				if (this.getPanels().indexOf(value) >= 0)
				{
					var old = this.getActivePanel() || this.getPanels()[0];
					this.switchPanel(old, value);
					//this.setPropStoreFieldValue('activePanel', value);
				}
			}
		});
		this.defineProp('activePanelIndex', {'dataType': DataType.INT, 'serializable': false,
			'getter': function()
			{
				var active = this.getActivePanel();
				if (active)
					return this.getPanels().indexOf(active);
				else
					return -1;
			},
			'setter': function(value)
			{
				var panel = this.getPanels()[value];
				if (panel)
					this.setActivePanel(panel);
			}
		})
	},
	getAspectRatio: function()
	{
		var dim = Kekule.DocumentUtils.getClientDimension(document);
		return dim.width / dim.height;
	},
	switchPanel: function(oldPanel, newPanel)
	{
		var aspectRatio = this.getAspectRatio();
		var direction;
		var oldIndex = oldPanel? this.getPanels().indexOf(oldPanel): -1;
		var newIndex = newPanel? this.getPanels().indexOf(newPanel): -1;
		if (newPanel)
		{
			direction = (oldIndex < newIndex) ? Kekule.Widget.Direction.RTL : Kekule.Widget.Direction.LTR;
			/*
			if (aspectRatio <= 1)  // left or right slide
			{
				direction = (oldIndex < newIndex) ? Kekule.Widget.Direction.RTL : Kekule.Widget.Direction.LTR;
			}
			else  // top or bottom slide
			{
				direction = (oldIndex < newIndex) ? Kekule.Widget.Direction.BTT : Kekule.Widget.Direction.TTB;
			}
			*/
			var trans = new Kekule.Widget.Css3SlideTransition(direction);
			var transOps = {
				'duration': 250
			};
			newPanel.style.display = 'block';
			newPanel.style.visibility = 'visible';
			newPanel.style.zIndex = 1000;
			var self = this;
			trans.execute(newPanel, null, function()
			{
				self.setPropStoreFieldValue('activePanel', newPanel);
				newPanel.style.zIndex = 1;
				if (oldPanel)
				{
					//oldPanel.style.display = 'none';
					oldPanel.style.visibility = 'hidden';
					oldPanel.style.zIndex = -1;
				}
			}, transOps);
			//console.log(oldPanel, newPanel);
		}
	}
});


})(document, window);