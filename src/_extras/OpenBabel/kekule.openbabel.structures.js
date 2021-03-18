/**
 * @fileoverview
 * Structure routines utilizing OpenBabel library.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /io/kekule.io.js
 * requires /core/kekule.chemUtils.js
 * requires /_extras/OpenBabel/kekule.openbabel.adapters.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /calculation/kekule.calc.base.js
 * requires /localization
 */

(function(){
"use strict";

/** @ignore */
var EU = Kekule.EmscriptenUtils;
/** @ignore */
var OB = Kekule.OpenBabel;
/** @ignore */
var AU = Kekule.OpenBabel.AdaptUtils;

/**
 * Util class to handle structures using OpenBabel
 * @object
 */
Kekule.OpenBabel.StructUtils = {
	/**
	 * Generate new structure with 2D coords.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Hash} options Options to generate 2D structure. Currently omitted.
	 * @returns {Kekule.StructureFragment} New molecule instance that containing all 3D coords.
	 */
	generate2DStructure: function(mol, options, childObjMap)
	{
		var mol;
		var op = options || {};
		try
		{
			var srcToObMap = new Kekule.MapEx();
			var obToDestMap = new Kekule.MapEx();

			var obMol = AU.kObjToOB(mol, null, srcToObMap);
			if (!Kekule.OpenBabel.StructUtils._gen2DByObOperation(obMol, op))  // failed
			{
				obMol['delete']();
				obMol = null
			}

			if (!obMol)  // failed
			{
				Kekule.raise(Kekule.$L('ErrorMsg.OpenBabel.FAIL_TO_GENERATE_3D_STRUCTURE'));
			}
			else  // success
			{
				// fetch back coords of obMol to mol
				mol = AU.obObjToKekule(obMol, null, obToDestMap);
				//console.log(mol3D);
				if (childObjMap)  // fill the map from src to dest
				{
					var keyObjs = srcToObMap.getKeys();
					for (var i = 0, l = keyObjs.length; i < l; ++i)
					{
						var keyObj = keyObjs[i];
						var obObj = srcToObMap.get(keyObj);
						if (obObj)
						{
							var destObj = obToDestMap.get(obObj);
							if (destObj)
								childObjMap.set(keyObj, destObj);
						}
					}
				}
			}
		}
		finally
		{
			if (obMol)
				obMol['delete']();
		}

		return mol;
	},
	/**
	 * Generate new structure with 3D coords of mol.
	 * Note: mol should not contain any sub groups.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Hash} options Options to generate 3D structure, may including fields: {speed, 'applyFFCalc', 'forceField'}.
	 * @returns {Kekule.StructureFragment} New molecule instance that containing all 3D coords.
	 */
	generate3DStructure: function(mol, options, childObjMap)
	{
		var mol3D;
		var op = options || {};
		var forceFieldName = op.forceField;
		try
		{
			//var obMol = AU.kObjToOB(mol);

			/*
			var r = _obGen.generate3DStructure(obMol, forceFieldName || 'MMFF94');
			if (r < 0)  // less than 0 means error occurs
			{
				console.log('error', r);
				//Kekule.raise(Kekule.$L('ErrorMsg.OpenBabel.FAIL_TO_GENERATE_3D_STRUCTURE'));
			}
			*/
			var srcToObMap = new Kekule.MapEx();
			var obToDestMap = new Kekule.MapEx();

			var obMol = AU.kObjToOB(mol, null, srcToObMap);
			if (op.applyFFCalc)
			{
				var _obGen = new (OB.getClassCtor('OB3DGenWrapper'))();
				try
				{
					/*
					var data = Kekule.IO.saveFormatData(mol, Kekule.IO.DataFormat.MOL);
					obMol = _obGen.generate3DStructureFromMolData(data, forceFieldName || '');
					*/
					_obGen.generate3DStructure(obMol, forceFieldName || '');
				} finally
				{
					_obGen['delete']();
				}
			}
			else
			{
				if (!Kekule.OpenBabel.StructUtils._gen3DByObOperation(obMol, op))  // failed
				{
					obMol['delete']();
					obMol = null
				}
			}
			if (!obMol)  // failed
			{
				Kekule.raise(Kekule.$L('ErrorMsg.OpenBabel.FAIL_TO_GENERATE_3D_STRUCTURE'));
			}
			else  // success
			{
				// fetch back coords of obMol to mol
				mol3D = AU.obObjToKekule(obMol, null, obToDestMap);
				//console.log(mol3D);
				if (childObjMap)  // fill the map from src to dest
				{
					var keyObjs = srcToObMap.getKeys();
					for (var i = 0, l = keyObjs.length; i < l; ++i)
					{
						var keyObj = keyObjs[i];
						var obObj = srcToObMap.get(keyObj);
						if (obObj)
						{
							var destObj = obToDestMap.get(obObj);
							if (destObj)
								childObjMap.set(keyObj, destObj);
						}
					}
				}
			}
		}
		finally
		{
			if (obMol)
				obMol['delete']();
		}

		return mol3D;
	},
	/** @private */
	_gen2DByObOperation: function(obMol, options)
	{
		var result = false;
		var Module = OB.getModule();
		var gen2d = Module['OBOp'].FindType('Gen2D');
		if (gen2d)
		{
			var speed = ('' + options.speed) || '';  // ensure speed is string
			gen2d.Do(obMol, speed);
			result = true;
		}
		return result;
	},
	/** @private */
	_gen3DByObOperation: function(obMol, options)
	{
		var speed = ('' + options.speed) || '';  // ensure speed is string
		var result = false;

		var Module = OB.getModule();
		var gen3d = Module['OBOp'].FindType('Gen3D');
		if (gen3d)
		{
			gen3d.Do(obMol, speed);
			result = true;
		}

		return result;
	}
};

if (Kekule.Calculator)
{

	/**
	 * Class to generate 2D/3D structure from 3D/2D or 0D one utilizing Open Babel lib.
	 * @class
	 * @augments Kekule.Calculator.AbstractStructureGenerator
	 */
	Kekule.Calculator.ObStructureBaseGenerator = Class.create(Kekule.Calculator.AbstractStructureGenerator,
	/** @lends Kekule.Calculator.ObStructureBaseGenerator# */
	{
		/** @private */
		CLASS_NAME: 'Kekule.Calculator.ObStructureBaseGenerator',
		/** @ignore */
		isWorkerShared: function()
		{
			return true;
		},
		/** @ignore */
		getGeneratorCoordMode: function()
		{
			var dim = this.getOutputDimension();
			return (dim === 2)? Kekule.CoordMode.COORD2D: Kekule.CoordMode.COORD3D;
		},
		/** @private */
		getOutputDimension: function()  // descendants should override this to decide generating 2D or 3D structure
		{
			return 3;  // default one
		},
		/** @private */
		_getInputMsgName: function()
		{
			return 'gen' + this.getOutputDimension() + 'D';
		},
		/** @private */
		_getOutputMsgName: function()
		{
			return 'output' + this.getOutputDimension() + 'D';
		},
		/** @private */
		getObInitOptions: function()
		{
			return Kekule.OpenBabel.getObInitOptions();
		},
		/** @private */
		getForceField: function()
		{
			return this.getOptions().forceField;
		},
		/** @ignore */
		doGetWorker: function()
		{
			var result = this.tryApplySuper('doGetWorker');
			if (!result)
			{
				result = Kekule.Calculator.ObStructureBaseGenerator._worker;  // try get from the shared instance
			}
			return result;
		},
		/** @ignore */
		createWorker: function(/*$super*/)
		{
			var w = this.tryApplySuper('createWorker')  /* $super() */;
			if (w)
			{
				//var url = Kekule.getScriptPath() + '_extras/OpenBabel/openbabel.js.O1';
				var url = Kekule.OpenBabel.getObScriptUrl();
				//console.log('create worker', url);
				this.importWorkerScriptFile(url);
				var initOps = this.getObInitOptions();
				this.postWorkerMessage({
					'type': 'obInit',
					'usingModulaize': initOps.usingModulaize,
					'moduleName': initOps.moduleName,
					'initCallbackName': initOps.moduleInitCallbackName
				});
				Kekule.Calculator.ObStructureBaseGenerator._worker = w;  // worker shared by instances, avoid create multiple times
			}
			return w;
		},
		/** @ignore */
		getWorkerScriptFile: function()
		{
			//return this.getWorkerBasePath() + 'kekule.worker.obStructureGenerator.js';
			var result = Kekule.OpenBabel.getObPath() + 'kekule.worker.obStructureGenerator.js'; //'workers/kekule.worker.obStructureGenerator.js';
			return result;
		},
		/** @ignore */
		doReactWorkerMessage: function(/*$super, */data, e)
		{
			this.tryApplySuper('doReactWorkerMessage', [data, e])  /* $super(data, e) */;
			if (data.type === /*'output3D'*/this._getOutputMsgName())  // receive generated structure
			{
				var genData = data.molData;
				//console.log(Date.now(), 'receive message', data.uid, this.getUid());
				if (genData)  // successful
				{
					var m = Kekule.IO.loadMimeData(genData, 'chemical/x-mdl-molfile');
					var childObjMap = this.getChildObjMap();
					if (childObjMap)  // fill the map, since we transform the molecule by MOL format data, sequences of atoms/bonds are our only clue
					{
						var srcMol = this.getSourceMol().getFlattenedShadowFragment(true);
						for (var i = 0, l = srcMol.getNodeCount(); i < l; ++i)
						{
							childObjMap.set(srcMol.getNodeAt(i), m.getNodeAt(i));
						}
						for (var i = 0, l = srcMol.getConnectorCount(); i < l; ++i)
						{
							childObjMap.set(srcMol.getConnectorAt(i), m.getConnectorAt(i));
						}
					}
					this.setGeneratedMol(m);
					this.done();
				}
			}
		},
		/** @ignore */
		workerStartCalc: function(worker)
		{
			var mol = this.getSourceMol();
			var flattenMol = mol.getFlattenedShadowFragment(true);
			//var molData = Kekule.IO.saveMimeData(mol, 'chemical/x-mdl-molfile');
			var molData = Kekule.IO.saveMimeData(flattenMol, 'chemical/x-mdl-molfile');
			var msg = Object.extend(this.getOptions(), {'type': /*'gen3D'*/this._getInputMsgName(), 'molData': molData});
			//console.log('send to worker', this.getUid());
			this.postWorkerMessage(msg);
		},

		/** @ignore */
		doExecuteSync: function(callback)
		{
			if (Kekule.OpenBabel)
			{
				var self = this;
				Kekule.OpenBabel.loadObScript(null, function()
				{
					var err;
					try
					{
						var generatorFunc = (self.getOutputDimension() === 2)? Kekule.OpenBabel.StructUtils.generate2DStructure: Kekule.OpenBabel.StructUtils.generate3DStructure;
						var mol = generatorFunc(self.getSourceMol(), /*self.getForceField()*/self.getOptions());
						self.setGeneratedMol(mol);
					}
					catch (e)
					{
						err = e;
						throw e;
					}

					if (!err)  // successful
						self.done();
					if (callback)
						callback(err);

					return true;
				});
			}
			else
			{
				Kekule.error(Kekule.$L('ErrorMsg.MODULE_NOT_LOADED').format('OpenBabel'));
			}
			return false;
		}
	});

	/**
	 * Class to generate 3D structure from 0D/2D one utilizing Open Babel lib.
	 * @class
	 * @augments Kekule.Calculator.ObStructureBaseGenerator
	 */
	Kekule.Calculator.ObStructure3DGenerator = Class.create(Kekule.Calculator.ObStructureBaseGenerator,
	/** @lends Kekule.Calculator.ObStructure3DGenerator# */
	{
		/** @private */
		CLASS_NAME: 'Kekule.Calculator.ObStructure3DGenerator',
		/** @ignore */
		getOutputDimension: function()
		{
			return 3;
		}
	});

	/**
	 * Class to generate 2D structure from 0D/2D one utilizing Open Babel lib.
	 * @class
	 * @augments Kekule.Calculator.ObStructureBaseGenerator
	 */
	Kekule.Calculator.ObStructure2DGenerator = Class.create(Kekule.Calculator.ObStructureBaseGenerator,
	/** @lends Kekule.Calculator.ObStructure2DGenerator# */
	{
		/** @private */
		CLASS_NAME: 'Kekule.Calculator.ObStructure2DGenerator',
		/** @ignore */
		getOutputDimension: function()
		{
			return 2;
		}
	});

	Kekule.Calculator.ServiceManager.register(Kekule.Calculator.Services.GEN3D, Kekule.Calculator.ObStructure3DGenerator, 'openbabel', 10);
	Kekule.Calculator.ServiceManager.register(Kekule.Calculator.Services.GEN2D, Kekule.Calculator.ObStructure2DGenerator, 'openbabel', 10);

}



})();