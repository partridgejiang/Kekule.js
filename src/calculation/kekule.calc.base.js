/**
 * @fileoverview
 * Provides basic interface of calculation task.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.root.js
 * requires /xbrowsers/kekule.x.js
 */

(function(){
"use strict";

/**
 * Namespace for all structure calculators.
 * @namespace
 */
Kekule.Calculator = {

};

/**
 * Returns default path to store calculator web worker scripts.
 * @returns {String}
 */
Kekule.Calculator.getWorkerBasePath = function()
{
	var isMin = Kekule.scriptSrcInfo.useMinFile;
	var path = isMin? 'workers/': 'calculation/workers/';
	path = Kekule.scriptSrcInfo.path + path;
	return path;
};

/**
 * An base class to perform molecule calculation task.
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} async Whether the calculation is performed asynchronously.
 *   Note: the asynchronous calculation is performed by web worked. If web worker
 *   is not supported by browser, the calculation will always be run directly on main thread.
 */
Kekule.Calculator.Base = Class.create(ObjectEx,
/** @lends Kekule.Calculator.Base# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Calculator.Base',
	/** @private */
	initProperties: function()
	{
		this.defineProp('async', {'dataType': DataType.BOOL});
		// private
		this.defineProp('worker', {'dataType': DataType.OBJECT, 'setter': null});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setAsync(true);
		this.reactWorkerMessageBind = this.reactWorkerMessage.bind(this);
		this.reactWorkerErrorBind = this.reactWorkerError.bind(this);
	},

	/**
	 * Returns default path to store calculator web worker scripts.
	 * @returns {String}
	 */
	getWorkerBasePath: function()
	{
		return Kekule.Calculator.getWorkerBasePath();
	},
	/**
	 * Run the calculation task. Result will be returned by callback function.
	 * @param {Func} callback Callback function called when calculation is done.
	 * @param {Func} errCallback Callback function called when error occurs.
	 *   errCallback function should has param (err) where err is the possible error object (or string).
	 */
	execute: function(callback, errCallback)
	{
		var self = this;
		/*
		var done = function()
		{
			if (callback)
				callback.apply(this, arguments);
			//self.workerJobDone();
		};
		*/
		this._doneCallback = callback;  //done;
		this._errCallback = errCallback;
		if (this.getAsync() && this.isWorkerSupported() && this.createWorker())  // try using worker
		{
			var w = this.getWorker();
			this.workerStartCalc(w);
		}
		else  // sync
		{
			var err, executed;
			try
			{
				executed = this.executeSync(callback);
			}
			catch(e)
			{
				err = e;
			}
			if (err)
			{
				Kekule.error(err);
				this.error(err);
			}
			else if (executed)
			{
				if (err)
					this.error(err);
				else
					this.done();
			}
		}
	},
	/**
	 * Run the calculation task in sync mode.
	 * Descendants should override this method.
	 * @returns {Bool} If calculation is all done, function should returns true.
	 *   Otherwise false should be returned and done() should be called manually.
	 * @private
	 */
	executeSync: function(callback)
	{
		// do nothing here
	},
	/**
	 * Called when error occurs in calculation.
	 * @param {Object} err
	 * @private
	 */
	error: function(err)
	{
		Kekule.error(err);
		if (this._errCallback)
			this._errCallback(err);
	},
	/**
	 * Called when the calculation job is done.
	 * @private
	 */
	done: function()
	{
		if (this._doneCallback)
			this._doneCallback.apply(this, arguments);
		this.workerJobDone();
	},
	/**
	 * Terminate the calculation process in worker.
	 * Note: this function is available only in async mode.
	 */
	halt: function()
	{
		var w = this.getWorker();
		if (w)
		{
			w.terminate();
			this.error(Kekule.$L('ErrorMsg.CALC_TERMINATED_BY_USER'));
		}
		//this.done(Kekule.$L('ErrorMsg.CALC_TERMINATED_BY_USER'));
	},

	/**
	 * Returns whether script worker can be used in current environment.
	 * @returns {Bool}
	 */
	isWorkerSupported: function()
	{
		return Kekule.BrowserFeature.workers;
	},
	/**
	 * Create a new web worker to run calculation task.
	 */
	createWorker: function()
	{
		if (this.isWorkerSupported())
		{
			var url = this.getWorkerScriptFile();
			if (url)
			{
				var w = new Worker(url);
				w.addEventListener('message', this.reactWorkerMessageBind);
				w.addEventListener('error', this.reactWorkerErrorBind);
				this.setPropStoreFieldValue('worker', w);
				return w;
			}
		}
	},
	/**
	 * Returns the work script file URL.
	 * Descendants should override this method.
	 * @returns {String}
	 */
	getWorkerScriptFile: function()
	{
		return null;
	},
	/**
	 * Notify the worker to import other script file.
	 * @private
	 */
	importWorkerScriptFile: function(url)
	{
		this.postWorkerMessage({'type': 'importScript', 'url': url});
	},
	postWorkerMessage: function(msg)
	{
		var w = this.getWorker();
		if (w)
			w.postMessage(msg);
	},
	/**
	 * React message evoked by worker.
	 * @param {Object} e
	 */
	reactWorkerMessage: function(e)
	{
		return this.doReactWorkerMessage(e.data, e);
	},
	/**
	 * Do actual job of reactWorkerMessage.
	 * Descendants should override this method.
	 * @param {Variant} data
	 * @param {Object} e
	 * @private
	 */
	doReactWorkerMessage: function(data, e)
	{
		// do nothing here
	},
	/**
	 * React error evoked by worker.
	 * @param {Object} e
	 */
	reactWorkerError: function(e)
	{
		Kekule.error(e.message);
		//this.done(e.message);
		this.error(e.message);
	},
	/**
	 * Notify the worker that the calculation should be started, essential params
	 * should also be passed into worker.
	 * Descendants should override this method.
	 * @param {Object} worker
	 * @private
	 */
	workerStartCalc: function(worker)
	{
		// do nothing here
	},
	/**
	 * Called when calculation job in worker is finished.
	 * @private
	 */
	workerJobDone: function()
	{
		var w = this.getWorker();
		if (w)
		{
			w.terminate();
			this.setPropStoreFieldValue('worker', null);
		}
	}
});

/**
 * Abstract class to generate 3D structure from 2D one.
 * TGhe concrete generator should inherit from this class.
 * @class
 * @augments Kekule.Calculator.Base
 *
 * @property {Kekule.StructureFragment} sourceMol Source 2D molecule.
 * @property {Kekule.StructureFragment} generatedMol 3D molecule structure generated from sourceMol.
 * @property {Hash} options Options to generate 3D structure.
 */
Kekule.Calculator.AbstractStructure3DGenerator = Class.create(Kekule.Calculator.Base,
/** @lends Kekule.Calculator.AbstractStructure3DGenerator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Calculator.AbstractStructure3DGenerator',
	/** @private */
	initProperties: function()
	{
		this.defineProp('sourceMol', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('generatedMol', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('options', {'dataType': DataType.HASH,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('options');
				if (!result)
				{
					result = {};
					this.setPropStoreFieldValue('options', result);
				}
				return result;
			}
		});
	}
});

/**
 * Manager of some common calculation services.
 * @object
 */
Kekule.Calculator.ServiceManager = {
	/** @private */
	_services: {},
	/** @private */
	_getServiceClasses: function(serviceName, canCreate)
	{
		var result = CS._services[serviceName];
		if (!result && canCreate)
		{
			result = [];
			CS._services[serviceName] = result;
		}
		return result;
	},
	/**
	 * Register a class to perform calculation service.
	 * @param {String} serviceName
	 * @param {Class} serviceClass
	 */
	register: function(serviceName, serviceClass)
	{
		var classes = CS._getServiceClasses(serviceName, true);
		var index = classes.indexOf(serviceClass);
		if (index >= 0)  // already exists, send it to tail
		{
			classes.splice(index, 1);
		}
		classes.push(serviceClass);
	},
	/**
	 * Unregister a class to perform calculation service.
	 * @param {String} serviceName
	 * @param {Class} serviceClass
	 */
	unregister: function(serviceName, serviceClass)
	{
		var classes = CS._getServiceClasses(serviceName, true);
		var index = classes.indexOf(serviceClass);
		if (index >= 0)  // already exists, send it to tail
		{
			classes.splice(index, 1);
		}
	},
	/**
	 * Get the most recent registered class for service.
	 * @param {String} serviceName
	 * @return {Class}
	 */
	getServiceClass: function(serviceName)
	{
		var result = null;
		var classes = CS._getServiceClasses(serviceName);
		if (classes && classes.length)
			result = classes[classes.length - 1];
		return result;
	}
};
var CS = Kekule.Calculator.ServiceManager;

/**
 * Predefined service names of calculation.
 * @enum
 */
Kekule.Calculator.Services = {
	GEN3D: '3D structure generator'
};

/**
 * Generate 3D structure based on 2D sourceMol.
 * This method seek for registered 'gen3D' calculation service.
 * @param {Kekule.StructureFragment} sourceMol
 * @param {Hash} options
 * @param {Func} callback Callback function when the calculation job is done. Callback(generatedMol).
 * @param {Func} errCallback Callback function when error occurs in calculation. Callback(err).
 * @returns {Object} Created calculation object.
 */
Kekule.Calculator.generate3D = function(sourceMol, options, callback, errCallback)
{
	var serviceName = Kekule.Calculator.Services.GEN3D;
	var c = CS.getServiceClass(serviceName);
	if (c)
	{
		var o = new c();
		try
		{
			var done = function()
			{
				if (callback)
					callback(o.getGeneratedMol());
			};
			var error = function(err)
			{
				if (errCallback)
					errCallback(err);
			}
			try
			{
				o.setSourceMol(sourceMol);
				o.setOptions(options);
				o.execute(done, error);
			}
			catch(e)
			{
				error(e);
			}
		}
		finally
		{
			//o.finalize();
			return o;
		}
	}
	else
	{
		var errMsg = Kekule.$L('ErrorMsg.CALC_SERVICE_UNAVAILABLE').format(serviceName);
		if (callback)
			callback(errMsg);
		//Kekule.error(errMsg);
		return null;
	}
}

})();