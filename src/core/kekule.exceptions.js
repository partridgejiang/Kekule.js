/**
 * @fileoverview
 * This file is for exception and error handling in Kekule.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 */


/**
 * @description Class for exception handler.
 * @class Kekule.ExceptionHandler
 * @augments ObjectEx
 */
Kekule.ExceptionHandler = Class.create(ObjectEx,
/** @lends Kekule.ExceptionHandler# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ExceptionHandler',
	/** @private */
	//instance: null,
	/** @private */
	initProperties: function()
	{
		//this.defineProp('enableDetail', {datatype: DataType.BOOL});
		/**
		 * Invoked when an exception is throwed by ExceptionHandler
		 *   event param of it has field: {exception: Kekule.Exception}
		 * If a listener modify the event param and add a new field e.stop = true,
		 *   then the exception will not thrown to JavaScript language system.
		 * @name Kekule.ExceptionHandler#exceptionThrown
		 * @event
		 */
		this.defineEvent('exceptionThrown');
	},
	/** @private */
	notifyExceptionThrown: function(e, exceptionLevel)
	{
		var eventArg = {'exception': e, 'level': exceptionLevel};
		this.invokeEvent('exceptionThrown', eventArg);
		return eventArg;
	},
	/**
	 * Throw an exception and invoke onExeption event
	 * @param {Object} e Exception object.
	 */
	throwException: function(e, exceptionLevel)
	{
		var EL = Kekule.ExceptionLevel;
		if (!exceptionLevel)
			exceptionLevel = EL.ERROR;
		var eventArg = this.notifyExceptionThrown(e, exceptionLevel || EL.ERROR);
		if (!eventArg.stop)
		{
			/*
			alert(e);
			throw e;
			*/
			if ((!exceptionLevel) || (exceptionLevel === EL.ERROR))
			{
				var eo = e;
				if (typeof(e) === 'string')
					eo = new Kekule.Exception(e);
				throw eo;
			}
			else
			{
				if (typeof(console) !== 'undefined')
				{
					if (typeof(e) !== 'string')
						e = e.message;
					var method = (exceptionLevel === EL.WARNING)? 'warn':
						(exceptionLevel === EL.NOTE)? 'info':
							'log';
					if (method)
						console[method](e);
					else
						console.log(e);
				}
			}
		}
	},
	/**
	 * Throw an exception and invoke onExeption event, same as {@link Kekule.ExceptionHandler.throwException}
	 */
	raise: function(e, exceptionLevel)
	{
		return this.throwException(e, exceptionLevel || Kekule.ExceptionLevel.ERROR);
	}
});
/** Get a singleton instance of Kekule.ExceptionHandler. */
Kekule.ExceptionHandler.getInstance = function()
{
	if (!this.instance)
		this.instance = new Kekule.ExceptionHandler();
	return this.instance;
};
Kekule.exceptionHandler = Kekule.ExceptionHandler.getInstance();

/**
 * Base class for exception in Kekule
 * @class
 * @param {String} message Message of exception.
 * @param {String} name Name of exception.
 *
 * @property {String} message Message of exception, read only.
 */
Kekule.Exception = function(message, name)
{
	this.message = message;
	this.name = name;
};
Kekule.Exception.prototype = new Error();
Kekule.Exception.prototype.constructor = Kekule.Exception;
Object.extend(Kekule.Exception.prototype,
	{
		/** @lends Kekule.Exception# */
		getMessage: function()
		{
			return this.message;
		}
	}
);

/**
 * Class for a critical error.
 * @class
 * @augments Kekule.Exception
 * @param {String} message Message of exception.
 * @param {String} name Name of exception.
 */
Kekule.Error = function(message, name)
{
	this.message = message;
	this.name = name;
};
Kekule.Error.prototype = Kekule.Exception.prototype;
Kekule.Error.prototype.constructor = Kekule.Error;

/**
 * Class for a error about chemistry
 * @class
 * @augments Kekule.Error
 * @param {String} message Message of exception.
 * @param {String} name Name of exception.
 */
Kekule.ChemError = function(message, name)
{
	this.message = message;
	this.name = name;
};
Kekule.ChemError.prototype = Kekule.Error.prototype; // new Kekule.Error();
Kekule.ChemError.prototype.constructor = Kekule.ChemError;

// TODO: for debug only
// If console is not defined, just add one to avoid exception in some browser
if (typeof(console) == 'undefined')
{
	console = {
		log: function() {},
		warn: function() {},
		info: function() {},
		error: function() {}
	};

}