/**
 * @fileoverview
 * Standardization routines for chemical structures, especially for ctab based ones.
 * Standardization may include canonicalization, aromatic perception and so on.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /utils/kekule.utils.js
 * requires /algorithm/kekule.structure.canonicalizers.js
 * requires /algorithm/kekule.structure.aromatics.js
 * requires /algorithm/kekule.structure.stereos.js
 */

(function(){
"use strict";

/**
 * Default options to do structure standardize.
 * @object
 */
Kekule.globalOptions.add('algorithm.molStandardization', {
	cleanStructure: true,
	clearHydrogens: true,
	unmarshalSubFragments: true,
	doCanonicalization: true,
	doAromaticPerception: true,
	doStereoPerception: true
});

/**
 * A helper class to standardize molecule.
 * @class
 */
Kekule.MolStandardizer = {
	/**
	 * Standardize a structure fragment (molecule).
	 * Standardization may include canonicalization, aromatic perception and so on.
	 * @param {Kekule.StructureFragment} structureFragment
	 * @param {Hash} options Standardization options, including the following fields:
	 *   {
	 *     cleanStructure: bool, whether clean the structure before standardization.
	 *     clearHydrogens: bool, whether removes all explicit hydrogen atoms (and related bonds).
	 *       Note that only H connected with simple single bond will be removed. The H on wedge bonds will be retained (as they may related to stereo).
	 *     unmarshalSubFragments: bool, whether unmarshal all sub structures cascadedly of molecule, default is true.
	 *     hucklizeStructure: bool, whether convert all single/double bond in aromatic rings to explicit aromatic one, default is false.
	 *     doCanonicalization: bool, whether do canonicalization to molecule, default is true.
	 *     canonicalizerExecutorId: string, which canonicalizer executor should be used. If this
	 *       value is not set, default one will be used instead.
	 *     doAromaticPerception: bool, whether do aromatic ring perception to molecule, default is true.
	 *     doStereoPerception: bool, whether detect and mark all stereo factors of nodes and connectors, default is true.
	 *   }.
	 */
	standardize: function(structureFragment, options)
	{
		var defOptions = Object.extend({}, Kekule.globalOptions.algorithm.molStandardization);
		var mol = structureFragment;
		var op = Object.extend(defOptions, options);
		if (op.unmarshalSubFragments)
			mol.unmarshalAllSubFragments(true);
		if (op.cleanStructure)
			mol.clean();
		/*
		if (op.clearHydrogens)
			mol.clearExplicitBondHydrogens();
		*/


		if (op.hucklizeStructure)
			mol.hucklize();

		/*
		if (op.doStereoPerception)
		{
			Kekule.canonicalizer.canonicalize(mol, op.canonicalizerExecutorId || null);
			mol.perceiveStereos(null, true);  // stereo detection should do canonicalization first
		}
		else*/ if (op.doCanonicalization)
			Kekule.canonicalizer.canonicalize(mol, op.canonicalizerExecutorId || null);

		if (op.doAromaticPerception)
		{
			mol.perceiveAromaticRings();
		}

		if (op.doStereoPerception)
			mol.perceiveStereos(null, true, op);  // already canonicalized, no need to do again, what's more, canonicalization may clear the ring info already perceived

		// Hydrongen should be cleared at last, since it may affect stereo perception
		if (op.clearHydrogens)
			mol.clearExplicitBondHydrogens(true);  // do not clear structure flags when removing hydrogen

		return mol;
	}
};

Object.extend(Kekule.ChemStructureUtils,
/** @lends Kekule.ChemStructureUtils */
{
	/**
	 * Compare two structure fragment (molecule) in chem level (atoms, bonds and structures).
	 * @param {Kekule.StructureFragment} mol1
	 * @param {Kekule.StructureFragment} mol2
	 * @param {Hash} compareOptions
	 * @returns {Int}
	 */
	compareStructFragment: function(mol1, mol2, compareOptions)
	{
		// clone the structure to avoid change original molecule objects
		var m1 = mol1.clone(false);
		var m2 = mol2.clone(false);
		// set cano index of two root molecules to null, avoid affect the following comparison
		m1.setCanonicalizationIndex(null);
		m2.setCanonicalizationIndex(null);

		// compare options, may also containing standardization options (e.g. stereo perception options)
		var op = Object.create(compareOptions || {}); //Object.extend(compareOptions || {});

		// explicitly convert aromatic ring bonds for comparison
		if (op.hucklizeStructure === undefined)
			op.hucklizeStructure = true;

		// standardize each
		m1 = Kekule.MolStandardizer.standardize(m1, op);
		m2 = Kekule.MolStandardizer.standardize(m2, op);

		op.doStandardize = false;  // flag that notify the molecule do not do standardize again (that will invoke recursion)
		op.extraComparisonProperties = ['canonicalizationIndex'];  // flag that indicate the cano step has been done and the canoIndex can be used in comparison
		// compare
		//return Kekule.UnivChemStructObjComparer.compare(m1, m2, op) === 0;
		return m1.compareStructure(m2, op);
	},
	/**
	 * Check if two structure fragment (molecule) is same in chem level (same
	 * atoms, bonds and structures).
	 * @param {Kekule.StructureFragment} mol1
	 * @param {Kekule.StructureFragment} mol2
	 * @param {Hash} compareOptions
	 * @returns {Bool}
	 */
	isSameStructure: function(mol1, mol2, compareOptions)
	{
		return Kekule.ChemStructureUtils.compareStructFragment(mol1, mol2, compareOptions) === 0;
	}
});

ClassEx.extend(Kekule.ChemObject,
/** @lends Kekule.ChemObject# */
{
	/**
	 * Standardize this structure fragment (molecule).
	 * Standardization may include canonicalization, aromatic perception and so on.
	 * @param {Hash} options Standardization options, including the following fields:
	 *   {
	 *     unmarshalSubFragments: bool, whether unmarshal all sub structures cascadedly of molecule, default is true.
	 *     doCanonicalization: bool, whether do canonicalization to molecule, default is true.
	 *     canonicalizerExecutorId: string, which canonicalizer executor should be used. If this
	 *       value is not set, default one will be used instead.
	 *     doAromaticPerception: bool, whether do aromatic ring perception to molecule, default is true.
	 *   }.
	 */
	standardize: function(options)
	{
		// find out all molecule
		var mols = Kekule.ChemStructureUtils.getAllStructFragments(this, true);
		for (var i = 0, l = mols.length; i < l; ++i)
		{
			mols[i].standardize(options);
		}
		return this;
	}
});
ClassEx.extend(Kekule.StructureFragment,
/** @lends Kekule.StructureFragment# */
{
	/**
	 * Standardize this structure fragment (molecule).
	 * Standardization may include canonicalization, aromatic perception and so on.
	 * @param {Hash} options Standardization options, including the following fields:
	 *   {
	 *     unmarshalSubFragments: bool, whether unmarshal all sub structures cascadedly of molecule, default is true.
	 *     doCanonicalization: bool, whether do canonicalization to molecule, default is true.
	 *     canonicalizerExecutorId: string, which canonicalizer executor should be used. If this
	 *       value is not set, default one will be used instead.
	 *     doAromaticPerception: bool, whether do aromatic ring perception to molecule, default is true.
	 *   }.
	 */
	standardize: function(options)
	{
		return Kekule.MolStandardizer.standardize(this, options);
	},
	/**
	 * Check if two structure fragment (molecule) is same in chem level (same
	 * atoms, bonds and structures).
	 * @param {Kekule.StructureFragment} target
	 * @param {Hash} compareOptions
	 * @returns {Bool}
	 */
	isSameStructureWith: function(target, compareOptions)
	{
		return Kekule.ChemStructureUtils.isSameStructure(this, target, compareOptions);
	}
});
ClassEx.extendMethod(Kekule.StructureFragment, 'doCompare', function($origin, targetObj, options){
	if (options.method === Kekule.ComparisonMethod.CHEM_STRUCTURE
			&& (options.doStandardize !== false)
			&& (targetObj instanceof Kekule.StructureFragment))
	{
		return Kekule.ChemStructureUtils.compareStructFragment(this, targetObj, options);
	}
	else
		return $origin(targetObj, options);
});

})();