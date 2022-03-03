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
/** @ignore */
Kekule.Calculator.Utils = {
	_instanceMaxIndex: 0,
	generateUid: function()
	{
		++Kekule.Calculator.Utils._instanceMaxIndex;
		return 'Kekule.Calculator.' + Kekule.Calculator.Utils._instanceMaxIndex;
	}
};

/**
 * Returns default path to store calculator web worker scripts.
 * @returns {String}
 */
Kekule.Calculator.getWorkerBasePath = function()
{
	var isMin = Kekule.isUsingMinJs(); //Kekule.scriptSrcInfo.useMinFile;
	var path = isMin? 'workers/': 'calculation/workers/';
	path = Kekule.getScriptPath() + path;  // Kekule.scriptSrcInfo.path + path;
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
	WORKER_SHARED_COUNT_FIELD: '__$workerSharedCount$__',
	/** @constructs */
	initialize: function()
	{
		this.setPropStoreFieldValue('uid', this._generateUid());
		this.tryApplySuper('initialize');
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('async', {'dataType': DataType.BOOL});
		// private
		this.defineProp('worker', {'dataType': DataType.OBJECT, 'setter': null});
		this.defineProp('uid', {'dataType': DataType.STRING, 'setter': null});  // every calculator should has a unique id
	},
	/** @ignore */
	initPropValues: function(/*$super*/)
	{
		this.tryApplySuper('initPropValues')  /* $super() */;
		this.setAsync(true);
		this.reactWorkerMessageBind = this.reactWorkerMessage.bind(this);
		this.reactWorkerErrorBind = this.reactWorkerError.bind(this);
	},
	/** @ignore */
	doFinalize: function()
	{
		this.finalizeWorker();
		this.tryApplySuper('doFinalize');
	},

	/** @private */
	_generateUid: function()
	{
		return Kekule.Calculator.Utils.generateUid();
	},

	/**
	 * Returns whether the worker this calculator created is shared by multiple instances.
	 * Desendants may override this method.
	 * @returns {Bool}
	 * @private
	 */
	isWorkerShared: function()
	{
		return false;
	},
	/** @private */
	_incWorkerSharedCount: function(worker)
	{
		if (this.isWorkerShared())
		{
			var v = worker[this.WORKER_SHARED_COUNT_FIELD] || 0;
			++v;
			worker[this.WORKER_SHARED_COUNT_FIELD] = v;
		}
	},
	/** @private */
	_decWorkerSharedCount: function(worker)
	{
		if (this.isWorkerShared())
		{
			var v = worker[this.WORKER_SHARED_COUNT_FIELD] || 0;
			if (v)
				--v;
			worker[this.WORKER_SHARED_COUNT_FIELD] = v;
		}
	},
	/** @private */
	_isWorkerInSharingState: function(worker)
	{
		return this.isWorkerShared() && ((worker[this.WORKER_SHARED_COUNT_FIELD] || 0) > 0);
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
	 * @param {Func} msgCallback Callback function that receives log messages from calculator. Callback(msgData).
	 */
	execute: function(callback, errCallback, msgCallback)
	{
		var self = this;
		/*
		var done = function()
		{
			if (callback)
				callback.apply(this, arguments);
			//self.finalizeWorker();
		};
		*/
		this._doneCallback = callback;  //done;
		this._errCallback = errCallback;
		this._msgCallback = msgCallback;
		if (this.getAsync() && this.isWorkerSupported() && this.fetchWorker())  // try using worker
		{
			var w = this.getWorker();
			this._incWorkerSharedCount(w);
			this._installWorkerEventReceiver(w);
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
		this._doneCallback = callback;  //done;
		var result = this.doExecuteSync(callback);
		if (result)
			this.done();
		return result;
	},
	/**
	 * Do actual work of method executeSync.
	 * Descendants should override this method.
	 * @returns {Bool}
	 */
	doExecuteSync: function(callback)
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
		if (this._errCallback)
			this._errCallback(err);
		else
		{
			//Kekule.error(err);
			throw err;
		}
	},
	/**
	 * Called when the calculation job is done.
	 * @private
	 */
	done: function()
	{
		if (this._doneCallback)
			this._doneCallback.apply(this, arguments);
		if (this.getWorker())
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
	 * Returns the worked instance stored in {@link Kekule.Calculator.Base.worker} property.
	 * If the property is empty, create a worker with {@link Kekule.Calculator.Base.createWorker}.
	 * @returns {Object}
	 * @private
	 */
	fetchWorker: function()
	{
		var result = this.getWorker();
		if (!result)
			result = this.createWorker();
		return result;
	},
	/**
	 * Create a new web worker to run calculation task.
	 * @private
	 */
	createWorker: function()
	{
		if (this.isWorkerSupported())
		{
			var url = this.getWorkerScriptFile();
			if (url)
			{
				var w = new Worker(url);
				this.setPropStoreFieldValue('worker', w);
				return w;
			}
		}
	},
	/** @private */
	_installWorkerEventReceiver: function(worker)
	{
		worker.addEventListener('message', this.reactWorkerMessageBind);
		worker.addEventListener('error', this.reactWorkerErrorBind);
	},
	/** @private */
	_uninstallWorkerEventReceiver: function(worker)
	{
		worker.removeEventListener('message', this.reactWorkerMessageBind);
		worker.removeEventListener('error', this.reactWorkerErrorBind);
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
	/**
	 * Post message to worker.
	 * @param {Hash} msg
	 */
	postWorkerMessage: function(msg)
	{
		// ensure msg has uid field of self
		var m = Object.extend({'uid': this.getUid()}, msg);
		//console.log('[msg sent to worker]', m);
		var w = this.getWorker();
		if (w)
			w.postMessage(m);
	},
	/**
	 * React message evoked by worker.
	 * @param {Object} e
	 */
	reactWorkerMessage: function(e)
	{
		//console.log('react msg', e.data.uid, this.getUid());
		// check if message is sent to self
		if (e.data.uid === this.getUid())
		{
			if (this._msgCallback)
				this._msgCallback(e.data);
			return this.doReactWorkerMessage(e.data, e);
		}
		else
			return null;
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
		//Kekule.error(e.message);
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
	workerJobDone: function()
	{
		var w = this.getWorker();
		if (w)
		{
			//console.log('worker done', this.getUid());
			this._uninstallWorkerEventReceiver(w);
			this._decWorkerSharedCount(w);
			/*
			if (!this._isWorkerInSharingState(w))  // avoid terminate shared worker too early
			{
				//console.log('TERMINATE');
				w.terminate();
			}
			this.setPropStoreFieldValue('worker', null);
			*/
		}
	},
	/**
	 * Called when calculation job in worker is finished.
	 * @private
	 */
	finalizeWorker: function()
	{
		var w = this.getWorker();
		if (w)
		{
			//console.log('worker done', this.getUid());
			if (!this._isWorkerInSharingState(w))  // avoid terminate shared worker too early
			{
				//console.log('TERMINATE');
				w.terminate();
			}
			this.setPropStoreFieldValue('worker', null);
		}
	}
});

/**
 * Abstract class to generate 2D/3D structure from 0D or 3D/2D one.
 * The concrete generator should inherit from this class.
 * @class
 * @augments Kekule.Calculator.Base
 *
 * @property {Kekule.StructureFragment} sourceMol Source molecule.
 * @property {Kekule.StructureFragment} generatedMol 2D/3D molecule structure generated from sourceMol.
 * @property {Kekule.MapEx} childObjMap A map of child objects in sourceMol to generatedMol.
 * @property {Hash} options Options to generate 2D/3D structure.
 *   A special field { modifySource: bool } can be set to true to change the coordinates of sourceMol as well.
 */
Kekule.Calculator.AbstractStructureGenerator = Class.create(Kekule.Calculator.Base,
/** @lends Kekule.Calculator.AbstractStructureGenerator# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Calculator.AbstractStructureGenerator',
	/** @private */
	initProperties: function()
	{
		this.defineProp('sourceMol', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('generatedMol', {'dataType': 'Kekule.StructureFragment', 'serializable': false});
		this.defineProp('childObjMap', {'dataType': 'Kekule.MapEx', 'serializable': false});
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
	},
	/**
	 * Returns the coord mode (2D or 3D) this generator generates.
	 * Descendants should override this method.
	 * @returns {Int}
	 */
	getGeneratorCoordMode: function()
	{
		return Kekule.CoordMode.COORD3D;
	},
	/** @ignore */
	done: function()
	{
		this._modifySourceAccordingToGeneratedMol(this.getSourceMol(), this.getGeneratedMol(), this.getChildObjMap());
		this.tryApplySuper('done');
	},
	/**
	 * Set generatedMol and childObjMap.
	 * If this.getOptions().modifySource is true, in this method, the sourceMol will be modified.
	 * @param {Kekule.StructureFragment} generatedMol
	 * @param {Kekule.MapEx} childObjMap
	 * @private
	 */
	_modifySourceAccordingToGeneratedMol: function(srcMol, generatedMol, childObjMap)
	{
		// update coordinates of source mol
		var map = childObjMap;
		if (map)
		{
			var coordMode = this.getGeneratorCoordMode();
			var keys = map.getKeys();
			srcMol.beginUpdate();
			try
			{
				for (var i = 0, l = keys.length; i < l; ++i)
				{
					if (keys[i] instanceof Kekule.ChemStructureNode)
					{
						var srcNode = keys[i];
						var destNode = map.get(srcNode);
						var coord = destNode.getCoordOfMode(coordMode);
						srcNode.setCoordOfMode(coord, coordMode);
					}
				}
			}
			finally
			{
				srcMol.endUpdate();
			}
		}
	}
});

/**
 * Manager of some common calculation services.
 * @object
 */
Kekule.Calculator.ServiceManager = {
	/** @private */
	_serviceInfos: {},
	/** @private */
	_getServiceClassInfos: function(serviceName, canCreate)
	{
		var result = CS._serviceInfos[serviceName];
		if (!result && canCreate)
		{
			result = [];
			CS._serviceInfos[serviceName] = result;
		}
		return result;
	},
	/** @private */
	_findServiceClassInfoItemIndex: function(serviceName, serviceClass, serviceId)
	{
		var classInfos = CS._getServiceClassInfos(serviceName, false);
		if (classInfos)
		{
			for (var i = classInfos.length - 1; i >= 0; --i)
			{
				var info = classInfos[i];
				if (info)
				{
					if (!serviceClass || info.serviceClass === serviceClass)
					{
						if (!serviceId || info.id === serviceId)
							return i;
					}
				}
			}
		}
		return -1;
	},
	/**
	 * Register a class to perform calculation service.
	 * @param {String} serviceName
	 * @param {Class} serviceClass
	 * @param {String} serviceId An ID of this service class.
	 *   The user can use this id to access to service class instance precisely.
	 * @param {Number} priorityLevel
	 */
	register: function(serviceName, serviceClass, serviceId, priorityLevel)
	{
		var classInfos = CS._getServiceClassInfos(serviceName, true);
		var index = CS._findServiceClassInfoItemIndex(serviceName, serviceClass);
		if (index >= 0)  // already exists, send it to tail
		{
			classInfos.splice(index, 1);
		}
		classInfos.push({'serviceClass': serviceClass, 'id': serviceId, 'priorityLevel': priorityLevel || 0});
	},
	/**
	 * Unregister a class to perform calculation service.
	 * @param {String} serviceName
	 * @param {Class} serviceClass
	 */
	unregister: function(serviceName, serviceClass)
	{
		var index = CS._findServiceClassInfoItemIndex(serviceName, serviceClass);
		if (index >= 0)  // already exists, unregister it
		{
			var classInfos = CS._getServiceClassInfos(serviceName, false);
			classInfos.splice(index, 1);
		}
	},
	/** @private */
	_getRegisteredServiceInfo: function(serviceName, serviceId)
	{
		var currPriority = -1;
		var result = null;
		var classInfos = CS._getServiceClassInfos(serviceName);
		if (classInfos)
		{
			for (var i = 0, l = classInfos.length; i < l; ++i)
			{
				var info = classInfos[i];
				if (info)
				{
					if (serviceId && info.id === serviceId)
					{
						result = info;
						break;
					}
					else
					{
						if (!result || info.priorityLevel >= currPriority)
						{
							result = info;
							currPriority = info.priorityLevel;
						}
					}
				}
			}
		}
		return result;
	},
	/**
	 * Get the most recent registered class for service.
	 * @param {String} serviceName
	 * @param {String} serviceId If this id is not set, the class with the highest priority level will be returned.
	 * @return {Class}
	 */
	getServiceClass: function(serviceName, serviceId)
	{
		var info = CS._getRegisteredServiceInfo(serviceName, serviceId);
		return info && info.serviceClass;
	}
};
var CS = Kekule.Calculator.ServiceManager;

/**
 * Predefined service names of calculation.
 * @enum
 */
Kekule.Calculator.Services = {
	GEN2D: '2D structure generator',
	GEN3D: '3D structure generator'
};

/**
 * Check if a certain service can be executed with calculator.
 * @param {String} serviceName
 * @returns {Bool}
 */
Kekule.Calculator.hasService = function(serviceName)
{
	return !!CS.getServiceClass(serviceName);
};

/**
 * Generate 2D or 3D structure based on sourceMol.
 * This method seek for registered calculation service with genSeviceName.
 * @param {Kekule.StructureFragment} sourceMol
 * @param {String} genServiceName
 * @param {Hash} options
 * @param {Func} callback Callback function when the calculation job is done. Callback(generatedMol, childObjMap).
 * @param {Func} errCallback Callback function when error occurs in calculation. Callback(err).
 * @param {Func} msgCallback Callback function that receives log messages from calculator. Callback(msgData).
 * @returns {Object} Created calculation object.
 */
Kekule.Calculator.generateStructure = function(sourceMol, genSeviceName, options, callback, errCallback, msgCallback)
{
	var serviceName = genSeviceName || Kekule.Calculator.Services.GEN3D;
	var c = CS.getServiceClass(serviceName);
	if (c)
	{
		var o = new c();
		var childObjMap;
		if (o.setChildObjMap)
		{
			childObjMap = new Kekule.MapEx(true);
			o.setChildObjMap(childObjMap);
		}
		var done = function()
		{
			if (callback)
				callback(o.getGeneratedMol(), childObjMap);
		};
		var error = function(err)
		{
			if (errCallback)
				errCallback(err);
		};
		var onMsg = function(msgData)
		{
			if (msgCallback)
				msgCallback(msgData);
		};
		try
		{
			o.setSourceMol(sourceMol);
			o.setOptions(options);
			if (options && options.sync)
				o.setAsync(false);
			o.execute(done, error, onMsg);
		}
		catch(e)
		{
			error(e);
		}
		//o.finalize();
		return o;
	}
	else
	{
		var errMsg = Kekule.$L('ErrorMsg.CALC_SERVICE_UNAVAILABLE').format(serviceName);
		if (errCallback)
			errCallback(errMsg);
		//Kekule.error(errMsg);
		return null;
	}
};

/**
 * Generate 3D structure based on 2D or 0D sourceMol.
 * This method seek for registered GEN3D calculation service.
 * @param {Kekule.StructureFragment} sourceMol
 * @param {Hash} options
 * @param {Func} callback Callback function when the calculation job is done. Callback(generatedMol).
 * @param {Func} errCallback Callback function when error occurs in calculation. Callback(err).
 * @param {Func} msgCallback Callback function that receives log messages from calculator. Callback(msgData).
 * @returns {Object} Created calculation object.
 */
Kekule.Calculator.generate3D = function(sourceMol, options, callback, errCallback, msgCallback)
{
	return Kekule.Calculator.generateStructure(sourceMol, Kekule.Calculator.Services.GEN3D, options, callback, errCallback, msgCallback);
}

/**
 * Generate 2D structure based on 3D or 0D sourceMol.
 * This method seek for registered GEN2D calculation service.
 * @param {Kekule.StructureFragment} sourceMol
 * @param {Hash} options
 * @param {Func} callback Callback function when the calculation job is done. Callback(generatedMol).
 * @param {Func} errCallback Callback function when error occurs in calculation. Callback(err).
 * @param {Func} msgCallback Callback function that receives log messages from calculator. Callback(msgData).
 * @returns {Object} Created calculation object.
 */
Kekule.Calculator.generate2D = function(sourceMol, options, callback, errCallback, msgCallback)
{
	return Kekule.Calculator.generateStructure(sourceMol, Kekule.Calculator.Services.GEN2D, options, callback, errCallback, msgCallback);
}

})();