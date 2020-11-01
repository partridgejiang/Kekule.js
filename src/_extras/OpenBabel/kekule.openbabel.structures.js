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
	 * Generate new structure with 3D coord of mol by specified force field.
	 * Note: mol should not contain any sub groups.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Hash} options Options to generate 3D structure, may including fields: {speed, 'applyFFCalc', 'forceField'}.
	 * @returns {Kekule.StructureFragment} New molecule instance that containing all 3D coords.
	 */
	generate3DStructure: function(mol, options)
	{
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
			var obMol;
			if (op.applyFFCalc)
			{
				var _obGen = new (OB.getClassCtor('OB3DGenWrapper'))();
				try
				{
					var data = Kekule.IO.saveFormatData(mol, Kekule.IO.DataFormat.MOL);
					obMol = _obGen.generate3DStructureFromMolData(data, forceFieldName || '');
				} finally
				{
					_obGen['delete']();
				}
			}
			else
			{
				obMol = AU.kObjToOB(mol);
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
				var mol3D = AU.obObjToKekule(obMol);
				//console.log(mol3D);
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
	 * Class to generate 3D structure from 2D one utilizing Open Babel lib.
	 * @class
	 * @augments Kekule.Calculator.AbstractStructure3DGenerator
	 */
	Kekule.Calculator.ObStructure3DGenerator = Class.create(Kekule.Calculator.AbstractStructure3DGenerator,
	/** @lends Kekule.Calculator.ObStructure3DGenerator# */
	{
		/** @private */
		CLASS_NAME: 'Kekule.Calculator.ObStructure3DGenerator',
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
		createWorker: function(/*$super*/)
		{
			var w = this.tryApplySuper('createWorker')  /* $super() */;
			if (w)
			{
				//var url = Kekule.getScriptPath() + '_extras/OpenBabel/openbabel.js.O1';
				var url = Kekule.OpenBabel.getObScriptUrl();
				this.importWorkerScriptFile(url);
				var initOps = this.getObInitOptions();
				this.postWorkerMessage({
					'type': 'obInit',
					'usingModulaize': initOps.usingModulaize,
					'moduleName': initOps.moduleName,
					'initCallbackName': initOps.moduleInitCallbackName
				});
			}
			return w;
		},
		/** @ignore */
		getWorkerScriptFile: function()
		{
			//return this.getWorkerBasePath() + 'kekule.worker.obStructure3DGenerator.js';
			var result = Kekule.OpenBabel.getObPath() + 'kekule.worker.obStructure3DGenerator.js'; //'workers/kekule.worker.obStructure3DGenerator.js';
			return result;
		},
		/** @ignore */
		doReactWorkerMessage: function(/*$super, */data, e)
		{
			this.tryApplySuper('doReactWorkerMessage', [data, e])  /* $super(data, e) */;
			if (data.type === 'output3D')  // receive generated structure
			{
				var genData = data.molData;
				if (genData)  // successful
				{
					var m = Kekule.IO.loadMimeData(genData, 'chemical/x-mdl-molfile');
					this.setGeneratedMol(m);
					this.done();
				}
			}
		},
		/** @ignore */
		workerStartCalc: function(worker)
		{
			var mol = this.getSourceMol();
			var molData = Kekule.IO.saveMimeData(mol, 'chemical/x-mdl-molfile');
			var msg = Object.extend(this.getOptions(), {'type': 'gen3D', 'molData': molData});
			this.postWorkerMessage(msg);
			//this.postWorkerMessage({'type': 'gen3D', 'molData': molData, 'forceField': this.getForceField()});
		},

		/** @ignore */
		executeSync: function(callback)
		{
			if (Kekule.OpenBabel && document)
			{
				var self = this;
				Kekule.OpenBabel.loadObScript(document, function()
				{
					var err;
					try
					{
						var mol = Kekule.OpenBabel.StructUtils.generate3DStructure(self.getSourceMol(), /*self.getForceField()*/self.getOptions());
						self.setGeneratedMol(mol);
					}
					catch (e)
					{
						err = e;
					}
					if (callback)
						callback(err);
				});
			}
			else
			{
				Kekule.error(Kekule.$L('ErrorMsg.MODULE_NOT_LOADED').format('OpenBabel'));
			}
			return false;
		}
	});
	Kekule.Calculator.ServiceManager.register(Kekule.Calculator.Services.GEN3D, Kekule.Calculator.ObStructure3DGenerator);

}



})();