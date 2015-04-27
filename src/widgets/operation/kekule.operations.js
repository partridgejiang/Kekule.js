/**
 * @fileoverview
 * Implementation of command pattern.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /localization/
 */

/**
 * Base class for a command in command pattern.
 * @class
 * @augments ObjectEx
 *
 * //@property {Int} state Operation state, value from {@link Kekule.Operation.State}.
 */
Kekule.Operation = Class.create(ObjectEx,
/** @lends Kekule.Operation# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Operation',
	/** @constructs */
	initialize: function($super)
	{
		$super();
		//this.setPropStoreFieldValue('state', Kekule.Operation.State.UNEXECUTED);
	},
	/** @private */
	initProperties: function()
	{
		//this.defineProp('state', {'dataType': DataType.INT, 'setter': null});
	},
	/**
	 * Indicate whether this command can be undone. Default is true.
	 * Descendants should override this method if unreversible.
	 * @returns {Bool}
	 */
	isReversible: function()
	{
		return true;
	},
	/**
	 * Execute this command.
	 */
	execute: function()
	{
		//var state = this.getState();
		//if (state === Kekule.Operation.State.UNEXECUTED)
		{
			var result = this.doExecute();
			//this.setPropStoreFieldValue('state', Kekule.Operation.State.EXECUTED);
			return result;
		}
		/*
		else
		{
			console.log('execute fail', state);
			return null;
		}
		*/
	},
	/**
	 * Do actual job of execute. Descendants should override this method.
	 * @private
	 */
	doExecute: function()
	{
		// do nothing here
	},
	/**
	 * Undo command execution.
	 */
	reverse: function()
	{
		if (!this.isReversible())  // can not reverse
			Kekule.raise(/*Kekule.ErrorMsg.COMMAND_NOT_REVERSIBLE*/Kekule.$L('ErrorMsg.COMMAND_NOT_REVERSIBLE'));

		//var state = this.getState();
		//if (state === Kekule.Operation.State.EXECUTED)
		{
			var result = this.doReverse();
			//this.setPropStoreFieldValue('state', Kekule.Operation.State.UNEXECUTED);
			return result;
		}
		/*
		else
		{
			console.log('reverse fail', state, this);
			return null;
		}
		*/
	},
	/**
	 * Do actual job of reverse. Descendants should override this method.
	 * @private
	 */
	doReverse: function()
	{
		// do nothing here
	}
});

/**
 * Enumeration of operation state.
 * @class
 */
Kekule.Operation.State = {
	/** Operation is not executed. */
	UNEXECUTED: 0,
	/** Operation is already executed. */
	EXECUTED: 1
};

/**
 * A macro operation consisted by several child operations.
 * @class
 * @augments Kekule.Command
 * @param {Array} childOperations Child operations of this macro one.
 *
 * @property {Array} children Child operations.
 */
Kekule.MacroOperation = Class.create(Kekule.Operation,
/** @lends Kekule.MacroOperation# */
{
	/** @private */
	CLASS_NAME: 'Kekule.MacroOperation',
	/** @constructs */
	initialize: function($super, childOperations)
	{
		$super();
		this.setChildren(childOperations || []);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('children', {'dataType': DataType.ARRAY});
	},
	/** @private */
	isReversible: function()
	{
		var children = this.getChildren();
		for (var i = 0, l = children.length; i < l; ++i)
		{
			if (!children[i].isReversible())
				return false;
		}
		return true;
	},
	/** @private */
	doExecute: function()
	{
		var children = this.getChildren();
		for (var i = 0, l = children.length; i < l; ++i)
		{
			children[i].execute();
		}
	},
	/** @private */
	doReverse: function()
	{
		var children = this.getChildren();
		for (var i = children.length - 1; i >= 0; --i)
		{
			children[i].reverse();
		}
	},

	/**
	 * Add a sub operation.
	 * @param {Kekule.Operation} oper
	 * @return {Int}
	 */
	add: function(oper)
	{
		return this.getChildren().push(oper);
	},
	/**
	 * Delete a sub operation.
	 * @param {Kekule.Operation} oper
	 */
	remove: function(oper)
	{
		var opers = this.getChildren();
		var i = opers.indexOf(oper);
		if (i >= 0)
			return opers.splice(i, 1);
		else
			return null;
	},
	/**
	 * Returns child operation at index.
	 * @param {Int} index
	 * @returns {Kekule.Operation}
	 */
	getChildAt: function(index)
	{
		return this.getChildren()[index];
	},
	/**
	 * Returns child operation count.
	 * @returns {Int}
	 */
	getChildCount: function()
	{
		return this.getChildren().length;
	}
});

/**
 * A operation history list to support undo and redo.
 * @class
 * @augments ObjectEx
 * @param {Int} capacity Maxium operation count in list.
 *
 * @property {Int} capacity Maxium operation count in list. If set to null, the operation count is unlimited.
 * @property {Array} operations Operations in list.
 */
/**
 * Invoked when the items in operation history has some changes.
 * @name Kekule.OperationHistory#operChange
 * @event
 */
/**
 * Invoked when the an operation is pushed into history.
 *   event param of it has two fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.OperationHistory#push
 * @event
 */
/**
 * Invoked when the an operation is popped from history.
 *   event param of it has two fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.OperationHistory#pop
 * @event
 */
/**
 * Invoked when one operation is undone.
 *   event param of it has two fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.OperationHistory#undo
 * @event
 */
/**
 * Invoked when one operation is redone.
 *   event param of it has one fields: {operation: Kekule.Operation, currOperIndex: Int}
 * @name Kekule.OperationHistory#redo
 * @event
 */
/**
 * Invoked when the operation list is cleared.
 *   event param of it has one fields: {currOperIndex: Int}
 * @name Kekule.OperationHistory#clear
 * @event
 */
Kekule.OperationHistory = Class.create(ObjectEx,
/** @lends Kekule.OperationHistory# */
{
	/** @private */
	CLASS_NAME: 'Kekule.OperationHistory',
	/** @constructs */
	initialize: function($super, capacity)
	{
		$super();
		this.setCapacity(capacity || null);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('capacity', {'dataType': DataType.INT});
		this.defineProp('operations', {
			'dataType': DataType.ARRAY,
			'getter': function()
				{
					var result = this.getPropStoreFieldValue('operations');
					if (!result)
					{
						result = [];
						this.setPropStoreFieldValue('operations', result);
					}
					return result;
				}
		});
		// private property
		this.defineProp('currIndex', {'dataType': DataType.INT, 'serializable': false});

		// events
		this.defineEvent('push');
		this.defineEvent('pop');
		this.defineEvent('undo');
		this.defineEvent('redo');
	},

	/** @private */
	checkCapacity: function()
	{
		var c = this.getCapacity();
		if ((!c) || (c <= 0))
			return;
		var a = this.getPropStoreFieldValue('operations');
		while (a && (a.length > c))
		{
			a.shift();
			if (this.getCurrIndex() > 0)
				this.setCurrIndex(this.getCurrIndex() - 1);
		}
	},

	/**
	 * Returns count of operations in history.
	 * @returns {Int}
	 */
	getOperationCount: function()
	{
		return this.getOperations().length;
	},
	/**
	 * Return child operation at index.
	 * @param {Int} index
	 * @returns {Kekule.Operation}
	 */
	getOperationAt: function(index)
	{
		return this.getOperations()[index];
	},

	/**
	 * Get current operation in list.
	 * @returns {Kekule.Operation}
	 */
	getCurrOperation: function()
	{
		var index = this.getCurrIndex();
		if (index >= 0)
			return this.getOperations()[index];
		else
			return null;
	},

	/**
	 * Clear the history list.
	 */
	clear: function()
	{
		this.setOperations([]);
		this.setCurrIndex(-1);
		this.invokeEvent('clear', {'currOperIndex': this.getCurrIndex()});
		this.invokeEvent('operChange');
	},

	/**
	 * Add new operation to history list.
	 * @param {Kekule.Operation} operation
	 */
	push: function(operation)
	{
		var a = this.getOperations();
		// discard all operations after currIndex
		var index = this.getCurrIndex();
		if (index < a.length)
			a.splice(index + 1, a.length - index - 1);
		// push inside new one
		a.push(operation)
		this.setCurrIndex(a.length - 1);
		this.checkCapacity();
		this.invokeEvent('push', {'operation': operation, 'currOperIndex': this.getCurrIndex()});
		this.invokeEvent('operChange');
	},
	/**
	 * Popup topmost operation out of list.
	 * @returns {Kekule.Operation}
	 */
	pop: function()
	{
		var result;
		var index = this.getCurrIndex();
		if (this.canPop())
		{
			result = this.getOperations()[index];
			this.setCurrIndex(--index);
			this.invokeEvent('pop', {'operation': result, 'currOperIndex': this.getCurrIndex()});
			this.invokeEvent('operChange');
		}
		else
			result = null;
		return result;
	},
	/**
	 * Check if a pop action can be taken.
	 * @returns {Bool}
	 * @private
	 */
	canPop: function()
	{
		var index = this.getCurrIndex();
		return ((index >= 0) && (!!this.getOperations().length));
	},
	/**
	 * Rollback a pop action.
	 * @returns {Kekule.Operation}
	 */
	unpop: function()
	{
		var result;
		var index = this.getCurrIndex();
		var a = this.getOperations();
		if (this.canUnpop())
		{
			this.setCurrIndex(++index);
			result = this.getOperations()[index];
		}
		else
			result = null;
		return result;
	},
	/**
	 * Check if an unpop action can be taken.
	 * @returns {Bool}
	 * @private
	 */
	canUnpop: function()
	{
		var index = this.getCurrIndex();
		return (index < this.getOperations().length - 1);
	},
	/**
	 * Undo current operation.
	 * @returns {Kekule.Operation} Operation undone.
	 */
	undo: function()
	{
		var op = this.pop();
		if (op && op.isReversible())
		{
			op.reverse();
		}
		this.invokeEvent('undo', {'operation': op, 'currOperIndex': this.getCurrIndex()});
		this.invokeEvent('operChange');
		return op;
	},
	/**
	 * Undo all operations.
	 */
	undoAll: function()
	{
		while (this.canUndo)
			this.undo();
	},
	/**
	 * Check if an undo action can be taken.
	 * @returns {Bool}
	 */
	canUndo: function()
	{
		return this.canPop();
	},
	/**
	 * Redo a rollbacked operation.
	 * @returns {Kekule.Operation} Operation redone.
	 */
	redo: function()
	{
		var op = this.unpop();
		if (op)
			op.execute();
		this.invokeEvent('redo', {'operation': op, 'currOperIndex': this.getCurrIndex()});
		this.invokeEvent('operChange');
		return op;
	},
	/**
	 * Check if a redo action can be taken.
	 * @returns {Bool}
	 */
	canRedo: function()
	{
		return this.canUnpop();
	}
});
