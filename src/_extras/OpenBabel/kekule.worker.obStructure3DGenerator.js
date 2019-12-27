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
	var func = funcs.shift();
	if (func)
		func.apply($root);
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
	else if (msgType === 'gen3D')
	{
		var molData = msgData.molData;
		var forceFieldName = msgData.forceField;
		var execFunc = function() {
			var genData = generate3DMolData(molData, forceFieldName);
			// feedback
			postMessage({'type': 'output3D', 'molData': genData});
		}
		if (runtimeInited)
			execFunc();
		else
			pendingFuncs.push(execFunc);
	}
};

function generate3DMolData(molData, forceFieldName)
{
	//console.log('Module', Module);
	var _obGen = new (Module['OB3DGenWrapper'])();
	var result = null;
	try
	{
		var obMol = _obGen.generate3DStructureFromMolData(molData, forceFieldName || '');
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
		}
		obMol['delete']();
	}
	finally
	{
		_obGen['delete']();
	}
	return result;
};

})(this);