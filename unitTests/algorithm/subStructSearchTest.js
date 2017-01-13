/**
 * Created by Chen on 2016/3/7.
 */

describe('Test of sub structure search', function(){
	var MB = TestMolBuilder;
	var allMols = {};
	var allMolNames = [
		'benzene', 'PhEt', 'hexane',
		'BnBr', 'iPrPh', 'diene',
		'cisButene', 'transButene',
		'cisDiene', 'transDiene',
		'cisDiMeHexane', 'transDiMeHexane1', 'transDiMeHexane2',
		'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2',
		'subgroup1',
		'github112_qry', 'github112_tgt'
	];
	beforeAll(function(done){   // load all essential molecules
		var allUrls = [];
		allMolNames.forEach(function(name){
			var url = 'searchTest/' + name + '.mol';
			allUrls.push(url);
		});
		MB.loadExternalFiles(allUrls, function(mols){
			mols.forEach(function(mol, index)
			{
				var name = allMolNames[index];
				allMols[name] = mol;
			});
			//console.log(allMols);
			done();
		});
	});

	var testSearch = function(title, targetMolName, srcMolNames, options, expectResults)
	{
		it(title, function(){
			var targetMol = allMols[targetMolName];
			expect(targetMol).not.toBeNull();
			for (var i = 0, l = srcMolNames.length; i < l; ++i)
			{
				var srcMol = allMols[srcMolNames[i]];
				expect(srcMol).not.toBeNull();
				try
				{
					//console.log(srcMolNames[i], srcMol.getClassName());
					var result = !!srcMol.search(targetMol, options);
				}
				catch(e)
				{
					//console.log('fail', srcMolNames[i]);
					throw e;
				}
				expect(result).toEqual(expectResults[i]);
			}
		});
	};

	testSearch('Search base on skeletal 1',
			'benzene',
			['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.SKELETAL},
			[true, true, true, true, true]
	);
	testSearch('Search base on skeletal 2',
			'hexane',
			['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.SKELETAL},
			[true, true, true, true, true]
	);
	testSearch('Search base on skeletal 3',
			'PhEt',
			['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.SKELETAL},
			[true, true, true, true, true]
	);

	testSearch('Search base on constitution 1',
		'benzene',
		['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
		{'level': Kekule.StructureComparationLevel.CONSTITUTION},
		[true, true, false, false, false]
	);
	testSearch('Search base on constitution 2',
		'hexane',
		['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
		{'level': Kekule.StructureComparationLevel.CONSTITUTION},
		[false, false, true, true, true]
	);
	testSearch('Search base on constitution 3',
			'PhEt',
			['BnBr', 'iPrPh', 'cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.CONSTITUTION},
			[false, true, false, false, false]
	);

	testSearch('Search base on constitution 4',
			'transButene',
			['transDiene', 'cisDiene'],
			{'level': Kekule.StructureComparationLevel.CONSTITUTION},
			[true, true]
	);
	testSearch('Search base on constitution 5',
			'cisButene',
			['transDiene', 'cisDiene'],
			{'level': Kekule.StructureComparationLevel.CONSTITUTION},
			[true, true]
	);
	testSearch('Search base on constitution 6',
			'github112_qry',
			['github112_tgt'],
			{'level': Kekule.StructureComparationLevel.CONSTITUTION},
			[true, true]
	);

	testSearch('Search base on configuration 1',
			'cisDiMeHexane',
			['cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[true, false, false]
	);
	testSearch('Search base on configuration 2',
			'transDiMeHexane1',
			['cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[false, true, false]
	);
	testSearch('Search base on configuration 3',
			'transDiMeHexane2',
			['cisDiEtHexane', 'transDiEtHexane1', 'transDiEtHexane2'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[false, false, true]
	);

	testSearch('Search base on configuration 4',
			'transButene',
			['transDiene', 'cisDiene'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[true, false]
	);
	testSearch('Search base on configuration 5',
			'cisButene',
			['transDiene', 'cisDiene'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[false, true]
	);

	testSearch('Search on molecule with subgroup-1',
			'benzene',
			['subgroup1'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[true]
	);

	testSearch('Search on molecule with subgroup-2',
			'PhEt',
			['subgroup1'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[true]
	);

	testSearch('Search on molecule with subgroup-3',
			'iPrPh',
			['subgroup1'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[true]
	);

	testSearch('Search on molecule with subgroup-3',
			'transDiene',
			['subgroup1'],
			{'level': Kekule.StructureComparationLevel.CONFIGURATION},
			[false]
	);

});