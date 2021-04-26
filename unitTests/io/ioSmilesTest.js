describe('Output test of SMILES', function(){

	var testIO = function(title, fileUrl, expectedSmiles, options)
	{
		it(title, function(done){
			Kekule.IO.loadUrlData('data/' + fileUrl, function(chemObj, success){
				expect(chemObj).not.toBeNull();
				var outputSmiles = Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.SMILES, options);
				expect(outputSmiles).toEqual(expectedSmiles);
				done();
			});
		}, 30000);
	};

	var testCases = [
		// H problems
		{'url': 'smilesOutputTest/[C].mol', 'smiles': '[C]', 'smilesIgnoreImplicit': '[C]', 'smilesIgnoreExplicit': '[C]'},
		{'url': 'smilesOutputTest/[CH2].mol', 'smiles': '[CH2]', 'smilesIgnoreImplicit': '[CH2]', 'smilesIgnoreExplicit': '[C]'},
		{'url': 'smilesOutputTest/CH3_explicitHBonds.mol', 'smiles': '[CH3]', 'smilesIgnoreImplicit': '[CH3]', 'smilesIgnoreExplicit': '[CH]'},
    {'url': 'smilesOutputTest/[NH4].mol', 'smiles': '[NH4]', 'smilesIgnoreImplicit': '[NH4]', 'smilesIgnoreExplicit': '[NH3]'},
		{'url': 'smilesOutputTest/NH4_explicitHBonds.mol', 'smiles': '[NH5]', 'smilesIgnoreImplicit': '[NH4]', 'smilesIgnoreExplicit': '[NH5]'},
		{'url': 'smilesOutputTest/NH3_explicitHBonds.mol', 'smiles': 'N', 'smilesIgnoreImplicit': 'N', 'smilesIgnoreExplicit': 'N'},
		{'url': 'smilesOutputTest/NH2_explicitHBonds.mol', 'smiles': 'N', 'smilesIgnoreImplicit': '[NH2]', 'smilesIgnoreExplicit': 'N'},
		{'url': 'smilesOutputTest/NH4_explicitHBonds_wedge.mol', 'smiles': '[NH5]', 'smilesIgnoreImplicit': '[NH4]', 'smilesIgnoreExplicit': '[NH5]'},
		{'url': 'smilesOutputTest/CH4_explicitHBonds_wedge.mol', 'smiles': 'C', 'smilesIgnoreImplicit': 'C', 'smilesIgnoreExplicit': 'C'},
		{'url': 'smilesOutputTest/CH3_explicitHBonds_wedge.mol', 'smiles': 'C', 'smilesIgnoreImplicit': '[CH3]', 'smilesIgnoreExplicit': 'C'},
		{'url': 'smilesOutputTest/CH5_explicitHBonds_wedge.mol', 'smiles': '[CH5]', 'smilesIgnoreImplicit': '[CH5]', 'smilesIgnoreExplicit': '[CH5]'},
		{'url': 'smilesOutputTest/C=H.mol', 'smiles': '[H]=C', 'smilesIgnoreImplicit': '[H]=[C]', 'smilesIgnoreExplicit': '[H]=C'},
		{'url': 'smilesOutputTest/[Fe].mol', 'smiles': '[Fe]', 'smilesIgnoreImplicit': '[Fe]', 'smilesIgnoreExplicit': '[Fe]'},
		{'url': 'smilesOutputTest/CCFe.mol', 'smiles': 'CC[Fe]', 'smilesIgnoreImplicit': '[C][C][Fe]', 'smilesIgnoreExplicit': 'CC[Fe]'},
		{'url': 'smilesOutputTest/CH4_explicitHCount.mol', 'smiles': 'C', 'smilesIgnoreImplicit': 'C', 'smilesIgnoreExplicit': '[C]'},
		{'url': 'smilesOutputTest/CH4_implicit.mol', 'smiles': 'C', 'smilesIgnoreImplicit': '[C]', 'smilesIgnoreExplicit': 'C'},
		// hetereo atoms on aromatic ring
		{'url': 'smilesOutputTest/pyrrole.mol', 'smiles': 'c1[nH]ccc1'},
		{'url': 'smilesOutputTest/pyridine.mol', 'smiles': 'c1cnccc1'},
  ];

	testCases.forEach(function(info){
		if (info.smiles)
			testIO('Test on outputing normal SMILES for url: ' + info.url, info.url, info.smiles);
		if (info.smilesIgnoreImplicit)
			testIO('Test on outputing ignore implicit SMILES for url: ' + info.url, info.url, info.smilesIgnoreImplicit, {ignoreImplicitHydrogens: true});
		if (info.smilesIgnoreExplicit)
			testIO('Test on outputing ignore explicit SMILES for url: ' + info.url, info.url, info.smilesIgnoreExplicit, {ignoreExplicitHydrogens: true});
	});
});
