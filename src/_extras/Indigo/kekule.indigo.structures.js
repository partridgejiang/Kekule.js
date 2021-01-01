/**
 * @fileoverview
 * Structure routines utilizing Indigo library.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /io/kekule.io.js
 * requires /core/kekule.chemUtils.js
 * requires /_extras/indigo/kekule.indigo.base.js
 * requires /_extras/indigo/indigoAdapter.js
 * requires /_extras/kekule.emscriptenUtils.js
 * requires /calculation/kekule.calc.base.js
 */

(function(){

"use strict";

/** @ignore */
var KI = Kekule.Indigo;

/**
 * Util class to handle structures using Indigo
 * @object
 */
Kekule.Indigo.StructUtils = {
	/**
	 * Generate new structure with 2D coords.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Hash} options Options to generate 2D structure. Currently omitted.
	 * @returns {Kekule.StructureFragment} New molecule instance that containing all 3D coords.
	 */
	generate2DStructure: function(mol, options, childObjMap)
	{
		var Indigo = KI.getIndigo();
		var iMol = KI.AdaptUtils.kMolToIndigo(mol);
		Indigo.setOption("smart-layout", "true");
		Indigo.layout(iMol);
		var result = KI.AdaptUtils.iMolToKekule(iMol);

		return result;
	}
};

if (Kekule.Calculator)
{

	/**
	 * Class to generate 2D structure from 0D one utilizing Indigo lib.
	 * @class
	 * @augments Kekule.Calculator.AbstractStructureGenerator
	 */
	Kekule.Calculator.IndigoStructure2DGenerator = Class.create(Kekule.Calculator.AbstractStructureGenerator,
	/** @lends Kekule.Calculator.IndigoStructure2DGenerator# */
	{
		/** @private */
		CLASS_NAME: 'Kekule.Calculator.IndigoStructure2DGenerator',
		/** @ignore */
		execute: function(callback)
		{
			// since the layout of Indigo is quite fast, force it runs in sync mode
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
		},

		/** @ignore */
		doExecuteSync: function(callback)
		{
			if (Kekule.Indigo)
			{
				var self = this;
				Kekule.Indigo.loadIndigoScript(null, function()
				{
					var err;
					try
					{
						var mol = Kekule.Indigo.StructUtils.generate2DStructure(self.getSourceMol(), self.getOptions());
						self.setGeneratedMol(mol);
					}
					catch (e)
					{
						err = e;
					}
					if (!err)  // successful
						self.done();
					if (callback)
						callback(err);
				});
			}
			else
			{
				Kekule.error(Kekule.$L('ErrorMsg.MODULE_NOT_LOADED').format('Indigo'));
			}
			return false;
		}
	});

	Kekule.Calculator.ServiceManager.register(Kekule.Calculator.Services.GEN2D, Kekule.Calculator.IndigoStructure2DGenerator, 'indigo', 0);
}


})();