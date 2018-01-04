/**
 * @fileoverview
 * The implementation of Action class.
 * Action is a type of class that can be associated with widget to do a specified job (like the corresponding
 * part in Delphi).
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /xbrowsers/kekule.x.js
 * requires /html/kekule.nativeServices.js
 * requires /localization/
 */


(function(){

/**
 * Base class for actions.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} visible Change the property to set widgets' visibility style linked to this action.
 * @property {Bool} displayed Change the property to set widgets' display style linked to this action.
 * @property {Bool} enabled Whether widget linked to this action can reflect to user input. Default is true.
 * @property {Bool} checked Change the checked property of widgets linked to this action.
 * @property {String} checkGroup If this value is set, checked will be automatically set to true when action is executed.
 *   What's more, when a action's checked is set to true, all other actions with the same checkGroup in action list will
 *   be automatically set to false.
 * @property {String} hint Hint of action. If this value is set, all widgets' hint properties will be updated.
 * @property {Text} text Caption/text of action. If this value is set, all widgets' hint properties will be updated.
 * @property {String} htmlClassName This value will be added to widget when action is linked and will be removed when action is unlinked.
 * @property {owner} Owner of action, usually a {@link Kekule.ActionList}.
 * @property {Kekule.Widget.BaseWidget} invoker Who invokes this action.
 */
/**
 * Invoked when an action is executed. Has one field: {htmlEvent: html event to raise the action}.
 * @name Kekule.Action#execute
 * @event
 */
Kekule.Action = Class.create(ObjectEx,
/** @lends Kekule.Action# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Action',
	/** @private */
	HTML_CLASSNAME: null,
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('linkedWidgets', []);

		this.setPropStoreFieldValue('enabled', true);
		this.setPropStoreFieldValue('visible', true);
		this.setPropStoreFieldValue('displayed', true);

		this.setPropStoreFieldValue('htmlClassName', this.getInitialHtmlClassName());

		this.setBubbleEvent(true);

		this.reactWidgetExecuteBind = this.reactWidgetExecute.bind(this);
	},
	/** @private */
	finalize: function($super)
	{
		var owner = this.getOwner();
		if (owner && owner.actionRemoved)
		{
			owner.actionRemoved(this);
		}
		this.unlinkAllWidgets();
		this.setPropStoreFieldValue('linkedWidgets', []);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('enabled', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (value !== this.getEnabled())
				{
					this.setPropStoreFieldValue('enabled', value);
					this.updateAllWidgetsProp('enabled', value);
				}
			}
		});
		this.defineProp('visible', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (value !== this.getVisible())
				{
					this.setPropStoreFieldValue('visible', value);
					this.updateAllWidgetsProp('visible', value);
				}
			}
		});
		this.defineProp('displayed', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (value !== this.getDisplayed())
				{
					this.setPropStoreFieldValue('displayed', value);
					this.updateAllWidgetsProp('displayed', value);
				}
			}
		});
		this.defineProp('checked', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				if (value !== this.getChecked())
				{
					this.setPropStoreFieldValue('checked', value);
					this.updateAllWidgetsProp('checked', value);
					this.checkedChanged();
				}
			}
		});
		this.defineProp('checkGroup', {'dataType': DataType.STRING});
		this.defineProp('hint', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				if (value && (value !== this.getHint()))
				{
					this.setPropStoreFieldValue('hint', value);
					this.updateAllWidgetsProp('hint', value);
				}
			}
		});
		this.defineProp('text', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				if (value && (value !== this.getText()))
				{
					this.setPropStoreFieldValue('text', value);
					this.updateAllWidgetsProp('text', value);
				}
			}
		});

		this.defineProp('htmlClassName', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var old = this.getHtmlClassName();
				this.setPropStoreFieldValue('htmlClassName', value);
				this.updateAllWidgetClassName(value, old);
			}
		});

		this.defineProp('owner', {'dataType': DataType.OBJECT, 'serializable': false, 'setter': null});

		// widgets that associated with this action. Private property.
		this.defineProp('linkedWidgets', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('invoker', {'dataType': 'Kekule.Widget.BaseWidget', 'serializable': false, 'setter': null});
	},

	/** @private */
	getHigherLevelObj: function()
	{
		return this.getOwner();
	},

	/** @ignore */
	invokeEvent: function($super, eventName, event)
	{
		if (!event)
			event = {};
		// save invoker into event param
		if (!event.invoker)
			event.invoker = this.getInvoker();
		$super(eventName, event);
	},

	/** @private */
	getInitialHtmlClassName: function()
	{
		return this.HTML_CLASSNAME || null;
	},
	/**
	 * Returns belonged action list.
	 * @returns {Kekule.ActionList}
	 */
	getActionList: function()
	{
		var result = this.getOwner();
		return (result instanceof Kekule.ActionList)? result: null;
	},

	/** @private */
	checkedChanged: function()
	{
		//var group = this.getCheckGroup();
		var list = this.getActionList();
		if (list)
			list.actionCheckedChanged(this);
	},

	/**
	 * Link a widget to this action.
	 * This method should not be called directly. Instead, user should use the action property of widget.
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @ignore
	 */
	linkWidget: function(widget)
	{
		var widgets = this.getLinkedWidgets();
		if (widgets.indexOf(widget) < 0)
		{
			// update widget properties
			var text = this.getText();
			if (text)
				this.updateWidgetProp(widget, 'text', text);
			var hint = this.getHint();
			if (hint)
				this.updateWidgetProp(widget, 'hint', hint);
			this.updateWidgetProp(widget, 'enabled', this.getEnabled());
			this.updateWidgetProp(widget, 'displayed', this.getDisplayed());
			this.updateWidgetProp(widget, 'visible', this.getVisible());
			this.updateWidgetProp(widget, 'checked', this.getChecked());
			this.updateWidgetClassName(widget, this.getHtmlClassName(), null);

			// install event handler
			widget.addEventListener('execute', this.reactWidgetExecuteBind);
			// add to array
			widgets.push(widget);

			return this;
		}
	},
	/**
	 * Unlink a widget from this action,
	 * This method should not be called directly. Instead, user should use widget.setAction(null).
	 * @param {Kekule.Widget.BaseWidget} widget
	 * @ignore
	 */
	unlinkWidget: function(widget)
	{
		var widgets = this.getLinkedWidgets();
		var index = widgets.indexOf(widget);
		if (index >= 0)
		{
			// remove class names
			this.updateWidgetClassName(widget, null, this.getHtmlClassName());
			// uninstall event handler
			widget.removeEventListener('execute', this.reactWidgetExecuteBind);
			// remove from array
			widgets.splice(index, 1);
		}
	},
	/** @private */
	unlinkAllWidgets: function()
	{
		var widgets = this.getLinkedWidgets();
		for (var i = widgets.length - 1; i >= 0; --i)
		{
			this.unlinkWidget(widgets[i]);
		}
	},

	/** @private */
	reactWidgetExecute: function(e)
	{
		return this.execute(e.target, e.htmlEvent);
	},

	/**
	 * Execute the action.
	 * @param {Object} target Object that invokes this action.
	 * @param {Object} htmlEvent HTML event that causes the executing process, can be null.
	 */
	execute: function(target, htmlEvent)
	{
		var oldChecked = this.getChecked();
		if (!this.getCheckGroup() || !oldChecked)
		{
			this.doExecute(target, htmlEvent);
			if (this.getCheckGroup())
			{
				this.setChecked(true);
			}
		}
		this.setPropStoreFieldValue('invoker', target);
		this.invokeEvent('execute', {'htmlEvent': htmlEvent});
		return this;
	},
	/**
	 * Do the actual action job. Descendants should override this method.
	 * @private
	 */
	doExecute: function(target, htmlEvent)
	{
		// do nothing here
	},

	/**
	 * Update the state (enabled, visible and so on) of action.
	 */
	update: function()
	{
		this.doUpdate();
		return this;
	},
	/**
	 * Do the actual state updating job. Descendants should override this method.
	 * @private
	 */
	doUpdate: function()
	{
		// do nothing here
	},

	/** @private */
	updateAllWidgetsProp: function(propName, propValue)
	{
		var widgets = this.getLinkedWidgets();
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			var w = widgets[i];
			this.updateWidgetProp(w, propName, propValue);
		}
	},
	/** @private */
	updateWidgetProp: function(widget, propName, propValue)
	{
		if (widget.hasProperty(propName))
		{
			widget.setPropValue(propName, propValue);
		}
	},
	/** @private */
	updateWidgetClassName: function(widget, addClasses, removeClasses)
	{
		if (removeClasses)
			widget.removeClassName(removeClasses, true);
		if (addClasses)
			widget.addClassName(addClasses, true);
	},
	/** @private */
	updateAllWidgetClassName: function(addClasses, removeClasses)
	{
		var widgets = this.getLinkedWidgets();
		for (var i = 0, l = widgets.length; i < l; ++i)
		{
			var w = widgets[i];
			this.updateWidgetClassName(w, addClasses, removeClasses);
		}
	}
});

/**
 * Container of a series of related actions.
 * @class
 * @augments ObjectEx
 *
 * @property {Array} actions Actions in this list.
 * @property {Bool} ownActions If this property is true, action will be finalized if removed from this list.
 *   Default is true.
 * @property {Bool} autoUpdate If set to true, all actions in list will update their state after one action is executed.
 */
/**
 * Invoked when a child action is executed. Event param of it has field: {action}
 * @name Kekule.ActionList#execute
 * @event
 */
Kekule.ActionList = Class.create(ObjectEx,
/** @lends Kekule.ActionList# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ActionList',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		this.setPropStoreFieldValue('actions', []);
		this.setPropStoreFieldValue('ownActions', true);
		this.setPropStoreFieldValue('autoUpdate', true);
		this.reactActionExecutedBind = this.reactActionExecuted.bind(this);
		this.addEventListener('execute', this.reactActionExecutedBind);
	},
	/** @private */
	finalize: function($super)
	{
		this.removeEventListener('execute', this.reactActionExecutedBind);
		this.clear();
		this.setPropStoreFieldValue('actions', null);
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('actions', {'dataType': DataType.ARRAY, 'serializable': false, 'setter': null});
		this.defineProp('ownActions', {'dataType': DataType.BOOL});
		this.defineProp('autoUpdate', {'dataType': DataType.BOOL,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('autoUpdate', value);
				if (value)
					this.updateAll();
			}
		});
	},

	/**
	 * Returns if one action of group is already checked.
	 * @param {String} group
	 * @returns {Bool}
	 */
	hasActionChecked: function(group)
	{
		return !!this.getCheckedAction(group);
	},

	/**
	 * Returns checked action of group.
	 * @param {String} group
	 * @returns {Kekule.Action}
	 */
	getCheckedAction: function(group)
	{
		var actions = this.getActions();
		for (var i = 0, l = actions.length; i < l; ++i)
		{
			var a = actions[i];
			if ((a.getCheckGroup() === group) && (a.getChecked()))
				return a;
		}
		return null;
	},

	/**
	 * Called after an action is added to list.
	 * @private
	 */
	actionAdded: function(action)
	{
		if (this.getOwnActions())
		{
			var oldOwner = action.getOwner();
			if (oldOwner && oldOwner.actionRemoved)
				oldOwner.actionRemoved(action);
			action.setPropStoreFieldValue('owner', this);
		}

		Kekule.ArrayUtils.pushUnique(this.getActions(), action);
		action.update();
		// install event listener
		//action.addEventListener('execute', this.reactActionExecutedBinded);
	},
	/**
	 * Called after an action is removed from list.
	 * @private
	 */
	actionRemoved: function(action)
	{
		Kekule.ArrayUtils.remove(this.getActions(), action);
		action.setPropStoreFieldValue('owner', null);
		// remove event listener
		//action.removeEventListener('execute', this.reactActionExecutedBinded);
	},

	/**
	 * Notify a child action item's checked property checked.
	 * @private
	 */
	actionCheckedChanged: function(action)
	{
		if (action && action.getChecked())
		{
			var group = action.getCheckGroup();
			if (group)
			{
				var actions = this.getActions();
				for (var i = 0, l = actions.length; i < l; ++i)
				{
					var a = actions[i];
					if ((a !== action) && (a.getCheckGroup() === group) && (a.getChecked()))
						a.setChecked(false);
				}
			}
		}
	},

	/**
	 * Event listener to react to execute event of child actions.
	 * @private
	 */
	reactActionExecuted: function(e)
	{
		// this method will receives execute event from child actions
		if (e.target instanceof Kekule.Action)
		{
			this.invokeEvent('execute', {'action': e.target});
			if (this.getAutoUpdate())
				this.updateAll();
		}
	},

	/**
	 * Returns count of actions inside.
	 * Same as {@link Kekule.ActionList.getActionLength}.
	 * @returns {Int}
	 */
	getActionCount: function()
	{
		return this.getActions().length;
	},
	/**
	 * Returns count of actions inside.
	 * Same as {@link Kekule.ActionList.getActionCount}.
	 * @returns {Int}
	 */
	getActionLength: function()
	{
		return this.getActions().length;
	},
	/**
	 * Returns action object at index.
	 * @param {Int} index
	 * @returns {Kekule.Action}
	 */
	getActionAt: function(index)
	{
		return this.getActions()[index];
	},
	/**
	 * Returns index of an action in list.
	 * @param {Kekule.Action} action
	 * @returns {Int}
	 */
	indexOfAction: function(action)
	{
		return this.getActions().indexOf(action);
	},
	/**
	 * Check whether an action is in this list.
	 * @param {Kekule.Action} action
	 * @returns {Bool}
	 */
	hasAction: function(action)
	{
		return this.indexOfAction(action) >= 0;
	},

	/**
	 * Add a new action to list.
	 * @param {Kekule.Action} action
	 */
	add: function(action)
	{
		this.actionAdded(action);
		return this;
	},
	/**
	 * Remove an action from list.
	 * @param {Kekule.Action} action
	 */
	remove: function(action)
	{
		this.actionRemoved(action);
		if (this.getOwnActions())
			action.finalize();
		return this;
	},
	/**
	 * Remove action at index.
	 * @param {Int} index
	 */
	removeAt: function(index)
	{
		var actions = this.getActions();
		var action = actions[index];
		if (action)
		{
			Kekule.ArrayUtils.removeAt(actions, index);
			this.actionRemoved(action);
		}
		return this;
	},
	/**
	 * Clear all actions in list.
	 */
	clear: function()
	{
		var actions = this.getActions();
		for (var i = actions.length - 1; i >=0; --i)
		{
			this.actionRemoved(actions[i]);
		}
		this.setPropStoreFieldValue('actions', []);
		return this;
	},

	/**
	 * Update state of all actions in list.
	 */
	updateAll: function()
	{
		var actions = this.getActions();
		for (var i = 0, l = actions.length; i < l; ++i)
		{
			actions[i].update();
		}
		return this;
	}
});


// Some useful and common actions
/**
 * Action to open a file dialog and load file(s).
 * This action relies on JavaScript FileReader API.
 * @class
 * @augments Kekule.Action
 *
 * @property filters {Array} Filters of open file dialog.
 */
/**
 * Invoked when file(s) is loaded from dialog. Has one additional fields: {files, file}
 * @name Kekule.ActionFileOpen#open
 * @event
 */
Kekule.ActionFileOpen = Class.create(Kekule.Action,
/** @lends Kekule.ChemWidget.ActionFileOpen# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionFileOpen',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		//this.reactFileOpenBind = this.reactFileOpen.bind(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('filters', {'dataType': DataType.ARRAY});
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		this.setEnabled(this.getEnabled() && Kekule.NativeServices.showFilePickerDialog/*Kekule.BrowserFeature.fileapi*/);
	},
	/** @private */
	doExecute: function(target)
	{
		var elem = target.getElement();
		var doc = elem.ownerDocument;
		/*
		var input = this.createInputElem(doc);
		input.click();  // open file dialog
		//this._inputElem = input;
		*/
		var self = this;
		var invoker = this.getInvoker();  // save invoker in closure
		//this.openFilePicker(doc, this.reactFileOpenBind);
		this.openFilePicker(doc, function(result, firstFile, files){
			if (result)
				self.fileOpened(files, invoker);
		});
	},
	/**
	 * Open a file open dialog, when it is closed, callback will be evoked.
	 * @param {HTMLDocument} doc
	 * @param {Function} callback Callback function, with params (result(true on OK), files, firstFile)
	 */
	openFilePicker: function(doc, callback)
	{
		/*
		if (Kekule.ActionFileOpen.openFilePicker)
			return Kekule.ActionFileOpen.openFilePicker(doc, callback);
		else
			return null;
		*/
		return Kekule.NativeServices.showFilePickerDialog(doc, callback, {
			'mode': 'open',
			'filters': this.getFilters()
		});
	},

	/* @private */
	/*
	reactInputChange: function(e)
	{
		var target = e.getTarget();
		console.log('file input change', target.files);
		this.fileOpened(target.files);
		// dismiss input element
		//this._inputElem = null;
		Kekule.X.Event.removeListener(target, 'change', this.reactInputChangeBind);
		target.ownerDocument.body.focus();
		if (target.parentNode)
		{
			target.parentNode.removeChild(target);
		}
	},
	*/
	/* @private */
	/*
	reactFileOpen: function(result, firstFile, files)
	{
		if (result)
			this.fileOpened(files);
	},
	*/
	/**
	 * Called when file is opened from input element.
	 * @param {Object} files
	 * @private
	 */
	fileOpened: function(files, invoker)
	{
		this.doFileOpened(files, invoker);
		this.invokeEvent('open', {'files': files, 'file': files[0]});
	},
	/**
	 * Do actual work of fileOpened. Descendants can override this method.
	 * @param {Object} files
	 * @private
	 */
	doFileOpened: function(files, invoker)
	{
		// do nothing here
	}
});

/**
 * Action to open a file dialog and load file data.
 * This action relies on JavaScript FileReader API.
 * @class
 * @augments Kekule.Action
 *
 * @property filters {Array} Filters of open file dialog.
 */
/**
 * Invoked when file(s) is loaded from dialog and data is loaded. Has one additional fields: {data, fileName, success}
 * @name Kekule.ActionLoadFileData#load
 * @event
 */
Kekule.ActionLoadFileData = Class.create(Kekule.Action,
/** @lends Kekule.ChemWidget.ActionLoadFileData# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionLoadFileData',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		//this.reactFileLoadBind = this.reactFileLoad.bind(this);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('filters', {'dataType': DataType.ARRAY});
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		this.setEnabled(this.getEnabled() && Kekule.NativeServices.canLoadFileData());
	},
	/** @private */
	doExecute: function(target)
	{
		var elem = target.getElement();
		var doc = elem.ownerDocument;
		//this.loadFileData(doc, this.reactFileLoadBind);
		var self = this;
		var invoker = this.getInvoker();  // save invoker in closure
		this.loadFileData(doc, function(result, data, fileName){
			self.dataLoaded(data, fileName, !!result, invoker);
		});
	},
	/**
	 * Open a file open dialog, when it is closed, callback will be evoked.
	 * @param {HTMLDocument} doc
	 * @param {Function} callback Callback function, with params (result(true on OK), files, firstFile)
	 */
	loadFileData: function(doc, callback)
	{
		//console.log('load file data', this.getFilters());
		return Kekule.NativeServices.loadFileData(doc, callback, {
			'filters': this.getFilters()
		});
	},

	/** @private */
	reactFileLoad: function(result, data, fileName)
	{
		this.dataLoaded(data, fileName, !!result);
	},
	/**
	 * Called when file is opened and data is loaded.
	 * @private
	 */
	dataLoaded: function(data, fileName, loaded, invoker)
	{
		this.doDataLoaded(data, fileName, loaded, invoker);
		this.invokeEvent('load', {'fileName': fileName, 'data': data, 'success': loaded});
	},
	/**
	 * Do actual work of fileOpened. Descendants can override this method.
	 * @private
	 */
	doDataLoaded: function(data, fileName, loaded, invoker)
	{
		// do nothing here
	}
});


/**
 * Action to open a file save dialog and save file(s).
 * This action relies on Data URL.
 * @class
 * @augments Kekule.Action
 *
 * @param {String} data Data to save.
 * @param {String} fileName Prefered file name to save.
 *
 * @property {String} data Data to save.
 * @property {String} fileName Prefered file name to save.
 *
 * @property filters {Array} Filters of save file dialog.
 */
Kekule.ActionFileSave = Class.create(Kekule.Action,
/** @lends Kekule.ChemWidget.ActionFileSave# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemWidget.ActionFileSave',
	/** @constructs */
	initialize: function($super, data, fileName)
	{
		$super();
		if (data)
			this.setData(data);
		if (fileName)
			this.setFileName(fileName);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('data', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('fileName', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('filters', {'dataType': DataType.ARRAY});
	},
	/** @private */
	doUpdate: function($super)
	{
		$super();
		this.setEnabled(this.getEnabled() /*&& this.getData()*/ && Kekule.NativeServices.canSaveFileData());
	},
	/** @private */
	doExecute: function(target)
	{
		var doc;
		if (!target)
			doc = document;
		else
		{
			var elem = target.getElement();
			doc = elem.ownerDocument;
		}
		Kekule.NativeServices.saveFileData(doc, this.getData(), null, {'initialFileName': this.getFileName(), 'filters': this.getFilters()});
		/*
		var dataElem = this.createDataElem(doc, this.getData(), this.getFileName());
		dataElem.click();  // save file dialog
		dataElem.parentNode.removeChild(dataElem);
		*/
	}

	/** @private */
	/*
	createDataElem: function(doc, data, fileName)
	{
		var elem = doc.createElement('a');
		elem.setAttribute('href', 'data:application/octet-stream,' + encodeURIComponent(data));
		elem.setAttribute('download', fileName);
		elem.innerHTML = 'download here!';
		doc.body.appendChild(elem);
		return elem;
	}
  */
});

/**
 * A util to manager all named actions for special widgets.
 * @class
 */
Kekule.ActionManager = {
	/** @private */
	_namedActionMap: null,
	/** @private */
	_getNamedActionMap: function(canCreate)
	{
		var result = AM._namedActionMap;
		if (!result && canCreate)
		{
			result = new Kekule.MapEx();
			AM._namedActionMap = result;
		}
		return result;
	},
	/** @private */
	getRegisteredActionsOfClass: function(widgetClass, canCreate)
	{
		var actionMap = AM._getNamedActionMap(canCreate);
		if (actionMap)
		{
			var result = actionMap.get(widgetClass);
			if (!result && canCreate)
			{
				result = {};
				actionMap.set(widgetClass, result);
			}
			return result;
		}
		else
			return null;
	},
	/**
	 * Register a named action to a special widget class.
	 * @param {String} name
	 * @param {Class} actionClass
	 * @param {Class} targetWidgetClass
	 */
	registerNamedActionClass: function(name, actionClass, targetWidgetClass)
	{
		var actions = AM.getRegisteredActionsOfClass(targetWidgetClass, true);
		actions[name] = actionClass;
	},
	/**
	 * Unregister a named action from a special widget class.
	 * @param {String} name
	 * @param {Class} targetWidgetClass
	 */
	unregisterNamedActionClass: function(name, targetWidgetClass)
	{
		var actions = AM.getRegisteredActionsOfClass(targetWidgetClass, false);
		if (actions && actions[name])
			delete actions[name];
	},
	/**
	 * Returns action class associated with name for a specific widget class.
	 * @param {String} name
	 * @param {Variant} widgetOrClass Widget instance of widget class.
	 * @param {Bool} checkSupClasses When true, if action is not found in current widget class, super classes will also be checked.
	 * @returns {Class}
	 */
	getActionClassOfName: function(name, widgetOrClass, checkSupClasses)
	{
		var widgetClass = ClassEx.isClass(widgetOrClass)? widgetOrClass:
				(widgetOrClass.getClass && widgetOrClass.getClass());
		if (!widgetClass)
			return null;
		var actions = AM.getRegisteredActionsOfClass(widgetClass, false);
		var result = actions && actions[name];
		if (!result && checkSupClasses)  // cascade
		{
			var supClass = ClassEx.getSuperClass(widgetClass);
			result = supClass? AM.getActionClassOfName(name, supClass, checkSupClasses): null;
		}
		return result;
	}
};
var AM = Kekule.ActionManager;

})();