/**
 * Created by Chen on 2018/12/18.
 */

describe('Test of structure comparison', function(){
	var MB = TestMolBuilder;
	var allMols = [];
	var allMolNames = [
		'compTest1_1.mol', 'compTest1_2.mol',
		'compTest2_1.kcj', 'compTest2_2.kcj',
		'compTest3_1.kcj', 'compTest3_2.kcj',
		'compTest4_1.mol', 'compTest4_2.mol',
		'compTestFischer1_1.kcj', 'compTestFischer1_2.kcj',
		'chainStereoCenterWithH01.mol', 'chainStereoCenterWithH02.mol',
		'chainStereoCenterWithH01_01.mol',
		'wedgeWithH01_1.mol', 'wedgeWithH01_2.mol',
		'wedgeWithH02_1.mol', 'wedgeWithH02_2.mol',
		'wedgeWithH03_1.mol', 'wedgeWithH03_2.mol'
	];
	beforeAll(function(done){   // load all essential molecules
		var allUrls = [];
		allMolNames.forEach(function(name){
			var url = 'compTest/' + name;
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

	var testComparison = function(title, targetMolName, srcMolName, options, expectResult)
	{
		it(title, function(){
			var targetMol = allMols[targetMolName];
			expect(targetMol).not.toBeNull();
			var srcMol = allMols[srcMolName];
			expect(srcMol).not.toBeNull();
			try
			{
				var result = !!srcMol.isSameStructureWith(targetMol, options);
			}
			catch(e)
			{
				throw e;
			}
			expect(result).toEqual(expectResult);
		});
	};

	testComparison('Comparison base on mol pair 1',
		'compTest1_1.mol', 'compTest1_2.mol', null,
		false
	);
	testComparison('Comparison base on mol pair 2',
		'compTest2_1.kcj', 'compTest2_2.kcj', null,
		true
	);
	testComparison('Comparison base on mol pair 3',
		'compTest3_1.kcj', 'compTest3_2.kcj', null,
		true
	);
	testComparison('Comparison base on mol pair 3',
		'compTest4_1.mol', 'compTest4_2.mol', null,
		true
	);
	testComparison('Comparison base on Fischer mol pair 1',
		'compTestFischer1_1.kcj', 'compTestFischer1_2.kcj', null,
		true
	);
	testComparison('Comparison on stereo centers with H atom -1',
		'chainStereoCenterWithH01.mol', 'chainStereoCenterWithH02.mol', null,
		false
	);
	testComparison('Comparison on stereo centers with H atom -2',
		'chainStereoCenterWithH01.mol', 'chainStereoCenterWithH01_01.mol', null,
		true
	);
	testComparison('Comparison base on wedge bonds with H - 1',
		'wedgeWithH01_1.mol', 'wedgeWithH01_2.mol', null,
		false
	);
	testComparison('Comparison base on wedge bonds with H - 2',
			'wedgeWithH02_1.mol', 'wedgeWithH02_2.mol', null,
			false
	);
	testComparison('Comparison base on wedge bonds with H - 3',
			'wedgeWithH03_1.mol', 'wedgeWithH03_2.mol', null,
			true
	);
});