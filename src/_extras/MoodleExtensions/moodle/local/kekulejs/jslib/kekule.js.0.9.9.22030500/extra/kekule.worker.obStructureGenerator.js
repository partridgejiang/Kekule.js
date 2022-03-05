/**
 * @fileoverview
 * Web worker to generator 3D structure from 2D one by OpenBabel library.
 * @author Partridge Jiang
 */

(function($root)
{
var importedScriptUrls = [];
var obScriptLoaded = false;
var runtimeInited = false;
var initOps;
var Module;
var pendingFuncs = [];

function initEnv()
{
	if (!obScriptLoaded)  // OpenBabel.js not loaded, can not init now, suspend
		return;
	if (typeof(Module) === 'object')  // module already set up, no need to set up again
		return;
	if (initOps)
	{
		var moduleName = initOps.moduleName;
		var initCallbackName = initOps.initCallbackName;
		var module = $root[moduleName];
		if (module && initCallbackName)
		{
			$root[initCallbackName] = function()  // init callback function, 3D generation can only done after wasm runtime is done
			{
				runtimeInited = true;
				execPendingFuncs(pendingFuncs);
			}
		}
		if (initOps.usingModulaize && typeof(module) === 'function')
		{
			module = module();
			initModule(module);
		}
		Module = module;
	}
}

function initModule(module)
{
	module.print = function(data) {
		postMessage({'type': 'print', 'data': data});
		console.log(data);
	};
	module.printErr = function(data) {
		postMessage({'type': 'printErr', 'data': data});
		console.log(data);
	};
}

function execPendingFuncs(funcs)
{
	if (!funcs)
		funcs = pendingFuncs;
	var func = funcs.shift();
	if (func)
	{
		func.apply($root);
		execPendingFuncs(funcs);
	}
}

function requestExec(func)
{
	pendingFuncs.push(func);
	if (runtimeInited)
		execPendingFuncs();
}

addEventListener('message', function(e)
{
	handleMessages(e.data);
});

function handleMessages(msgData)
{
	var msgType = msgData.type;
	if (msgType === 'importScript')
	{
		if (importedScriptUrls.indexOf(msgData.url) < 0)
		{
			//console.log('import script', msgData.url);
			importScripts(msgData.url);
			obScriptLoaded = true;
			importedScriptUrls.push(msgData.url);
			// after import, set intial data
			initEnv();
		}
	}
	else if (msgType === 'obInit')  // set up initial environment
	{
		initOps = msgData;
		initEnv();
	}
	else if (msgType === 'gen3D' || msgType === 'gen2D')
	{
		//console.log('recieve', msgType, msgData);
		var invokerUid = msgData.uid;
		var molData = msgData.molData;
		if (msgType === 'gen2D')
		{
			var execFunc = function ()
			{
				var genData = generate2DMolData(molData, {});
				//console.log('post data', invokerUid, genData);
				// feedback
				postMessage({'type': 'output2D', 'molData': genData, 'uid': invokerUid});
			};
		}
		else if (msgType === 'gen3D')
		{
			var forceFieldName = msgData.forceField;
			var useFFCalc = msgData.applyFFCalc;  // whether use force field calculation or quick approach
			var speed = msgData.speed;  // speed using OB gen3D operation, can be 1-6 (the larger the faster) or string like 'fastest', 'med', etc.
			var execFunc = function ()
			{
				var genData = generate3DMolData(molData, {
					'useFFCalc': useFFCalc,
					'forceFieldName': forceFieldName,
					'speed': speed
				});
				// feedback
				postMessage({'type': 'output3D', 'molData': genData, 'uid': invokerUid});
			};
		}
		/*
		if (runtimeInited)
			execFunc();
		else
			pendingFuncs.push(execFunc);
		*/
		requestExec(execFunc);
	}
};

function generate2DMolData(molData, options)
{
	var result;
	var obMol = _gen2DByObOperation(molData, options || {});
	if (!obMol)  // failed
	{
		// Kekule.raise(Kekule.$L('ErrorMsg.OpenBabel.FAIL_TO_GENERATE_3D_STRUCTURE'));
		throw 'Fail to generate 2D structure';
	}
	else  // success
	{
		// fetch back coords of obMol to mol
		//var mol3D = AU.obObjToKekule(obMol);
		var obConv = new (Module['ObConversionWrapper'])();
		try
		{
			obConv.setOutFormat('chemical/x-mdl-molfile', 'mol');
			if (obConv.writeToOutput(obMol))
				result = obConv.getOutStr();
			else
				throw 'Fail to save generated 3D data';
		}
		finally
		{
			obConv['delete']();
		}
		obMol['delete']();
	}
	return result;
}

function generate3DMolData(molData, /*forceFieldName*/options)
{
	var result;
	//console.log('Module', Module);
	var op = options || {};
	var forceFieldName = op.forceFieldName;
	var result = null;
	var obMol;
	if (op.useFFCalc)
	{
		var _obGen = new (Module['OB3DGenWrapper'])();
		try
		{
			obMol = _obGen.generate3DStructureFromMolData(molData, forceFieldName || '');
		}
		finally
		{
			_obGen['delete']();
		}
	}
	else
	{
		obMol = _gen3DByObOperation(molData, op);
	}
	if (!obMol)  // failed
	{
		// Kekule.raise(Kekule.$L('ErrorMsg.OpenBabel.FAIL_TO_GENERATE_3D_STRUCTURE'));
		throw 'Fail to generate 3D structure';
	}
	else  // success
	{
		// fetch back coords of obMol to mol
		//var mol3D = AU.obObjToKekule(obMol);
		var obConv = new (Module['ObConversionWrapper'])();
		try
		{
			obConv.setOutFormat('chemical/x-mdl-molfile', 'mol');
			if (obConv.writeToOutput(obMol))
				result = obConv.getOutStr();
			else
				throw 'Fail to save generated 3D data';
		}
		finally
		{
			obConv['delete']();
		}
		obMol['delete']();
	}
	return result;
};

function _genStructByObOperation(molData, dimension, options)
{
	var speed = ('' + options.speed) || '';  // ensure speed is string
	var conv = new (Module['ObConversionWrapper'])();
	var result = null;
	try
	{
		conv.setInFormat('', 'mol');
		var mol = new Module['OBMol']();
		try
		{
			conv.readString(mol, molData);
			var opName = (dimension === 2)? 'Gen2D': 'Gen3D';
			var generator = Module['OBOp'].FindType(opName);
			if (generator)
			{
				generator.Do(mol, speed);
				result = mol;
			}
		}
		finally
		{
			if (!result)
				mol['delete']();
		}
	}
	finally
	{
		conv['delete']();
	}
	return result;
}
function _gen2DByObOperation(molData, options)
{
	return _genStructByObOperation(molData, 2, options);
}
function _gen3DByObOperation(molData, options)
{
	return _genStructByObOperation(molData, 3, options);
}

})(this);