describe('Output test of SMILES', function(){

	var testIO = function(title, fileUrl, expectedSmiles)
	{
		it(title, function(done){
			Kekule.IO.loadUrlData('data/' + fileUrl, function(chemObj, success){
				expect(chemObj).not.toBeNull();
				var outputSmiles = Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.SMILES);
				expect(outputSmiles).toEqual(expectedSmiles);
				done();
			});
		}, 30000);
	};

	var testCases = [
    {'url': 'smilesOutputTest/[NH4].mol', 'smiles': '[NH4]'},
		{'url': 'smilesOutputTest/NH4_explicitHBonds.mol', 'smiles': '[NH5]'},
		{'url': 'smilesOutputTest/NH3_explicitHBonds.mol', 'smiles': 'N'},
		{'url': 'smilesOutputTest/NH2_explicitHBonds.mol', 'smiles': 'N'},
		{'url': 'smilesOutputTest/NH4_explicitHBonds_wedge.mol', 'smiles': '[NH5]'},
		{'url': 'smilesOutputTest/CH4_explicitHBonds_wedge.mol', 'smiles': 'C'},
		{'url': 'smilesOutputTest/CH3_explicitHBonds_wedge.mol', 'smiles': 'C'},
		{'url': 'smilesOutputTest/CH5_explicitHBonds_wedge.mol', 'smiles': '[CH5]'},
  ];

	testCases.forEach(function(info){
		testIO('Test on url: ' + info.url, info.url, info.smiles);
	});
});
