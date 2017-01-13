/**
 * Created by ginger on 2016/3/2.
 */

describe('Test of stereo bond in molecule', function(){
	var MB = TestMolBuilder;

	it('Test double bond stereo E', function(done){
		MB.loadExternalData('mdl/but-2-ene_E.mol', function(mol){
			expect(mol).not.toBeNull();
			var bonds = mol.perceiveStereoConnectors();
			var count = (bonds && bonds.length) || 0;
			expect(count).toEqual(1);
			var bond = bonds[0];
			expect(bond.getParity()).toEqual(Kekule.StereoParity.EVEN);
			done();
		});
	});
	it('Test double bond stereo Z', function(done){
		MB.loadExternalData('mdl/but-2-ene_Z.mol', function(mol){
			expect(mol).not.toBeNull();
			var bonds = mol.perceiveStereoConnectors();
			var count = (bonds && bonds.length) || 0;
			expect(count).toEqual(1);
			var bond = bonds[0];
			expect(bond.getParity()).toEqual(Kekule.StereoParity.ODD);
			done();
		});
	});
});

describe('Test of finding stereo center in molecule', function()
{
	var MB = TestMolBuilder;

	var testStereoCenter = function(title, molUrl, stereoCenterCount)
	{
		it(title, function(done){
			MB.loadExternalData(molUrl, function(mol){
				expect(mol).not.toBeNull();
				var nodes = mol.perceiveChiralNodes();
				var count = (nodes && nodes.length) || 0;
				expect(count).toEqual(stereoCenterCount);
				done();
			});
		});
	};
	var none = function(title, molUrl)
	{
		testStereoCenter(title, molUrl, 0);
	};
	var tetrahedral = function(title, molUrl)
	{
		testStereoCenter(title, molUrl, 1);
	};

	testStereoCenter("[BH-](C)(N)O", 'stereoTest/stereoCenterB1.mol', 1);
	testStereoCenter("[B-](C)(N)(O)CC", 'stereoTest/stereoCenterB2.mol', 1);

	testStereoCenter("[BH2-](C)(C)", 'stereoTest/stereoCenterB3.mol', 0);
	testStereoCenter("[BH3-](C)", 'stereoTest/stereoCenterB4.mol', 0);
	testStereoCenter("[BH4-]", 'stereoTest/stereoCenterB5.mol', 0);

	testStereoCenter("[B-](=C)(=C)(=C)(=C)", 'stereoTest/stereoCenterB6.mol', 0); // abnormal valence
	testStereoCenter("[B-](=C)(=C)", 'stereoTest/stereoCenterB7.mol', 0);
	testStereoCenter("[B-](=C)(C)(C)(C)", 'stereoTest/stereoCenterB8.mol', 0);

	testStereoCenter("B(C)", 'stereoTest/stereoCenterB9.mol', 0);
	testStereoCenter("B(C)(N)", 'stereoTest/stereoCenterB10.mol', 0);
	testStereoCenter("B(C)(N)O", 'stereoTest/stereoCenterB11.mol', 0);
	testStereoCenter("B(C)(N)(O)CC", 'stereoTest/stereoCenterB12.mol', 0); // abnormal valence

	// accept Sp3 Carbons with < 2 hydrogens
	testStereoCenter("C(C)(N)(O)", 'stereoTest/stereoCenterC1.mol', 1);
	testStereoCenter("C(C)(N)(O)CC", 'stereoTest/stereoCenterC2.mol', 1);

	// reject when > 1 hydrogen or < 4 neighbors
	testStereoCenter("C", 'stereoTest/stereoCenterC3.mol', 0);
	testStereoCenter("C(C)", 'stereoTest/stereoCenterC4.mol', 0);
	testStereoCenter("C(C)(N)", 'stereoTest/stereoCenterC5.mol', 0);
	testStereoCenter("C(=C)(C)N", 'stereoTest/stereoCenterC6.mol', 0);
	//bicoordinate("C(=CC)=CC");
	testStereoCenter("C(=C)(=C)(=C)=C", 'stereoTest/stereoCenterC8.mol', 0); // nb abnormal valence
	testStereoCenter("C#N", 'stereoTest/stereoCenterC9.mol', 0);

	testStereoCenter("[C+](C)(N)(O)", 'stereoTest/stereoCenterC10.mol', 0);
	testStereoCenter("[C+](C)(N)(O)CC", 'stereoTest/stereoCenterC11.mol', 0); // nb abnormal valence
	testStereoCenter("[C-](C)(N)(O)", 'stereoTest/stereoCenterC12.mol', 0);
	testStereoCenter("[C-](C)(N)(O)CC", 'stereoTest/stereoCenterC13.mol', 0); // nb abnormal valence

	none("N", 'stereoTest/stereoCenterN1.mol');
	none("N(C)(N)(O)", 'stereoTest/stereoCenterN2.mol');
	none("N(=C)(C)", 'stereoTest/stereoCenterN3.mol');

	// TODO: can not distinguish chiral center in small rings
	//tetrahedral("N(C)(C1)O1", 'stereoTest/stereoCenterN4.mol');
	//tetrahedral("N(C)(C1)C1C", 'stereoTest/stereoCenterN5.mol');

	none("N(C)(C1)CCCC1", 'stereoTest/stereoCenterN6.mol'); // n.b. equivalence checked later
	/*none*/tetrahedral("N(C)(C1)CCCC1C", 'stereoTest/stereoCenterN7.mol');  // TODO: should has no chiral center in large ring (in CDK)

	none("N(C1)C1", 'stereoTest/stereoCenterN8.mol'); // n.b. equivalence checked later
	//none("N(C1)C1C", 'stereoTest/stereoCenterN9.mol');  // should has a center of C, but CDK reports none

	tetrahedral("[N+](C)(N)(O)CC", 'stereoTest/stereoCenterN10.mol');
	none("[N+](=C)(C)C", 'stereoTest/stereoCenterN11.mol');
	none("[N+](=C)=C", 'stereoTest/stereoCenterN12.mol');
	none("[N+](#C)C", 'stereoTest/stereoCenterN13.mol');

	none("[NH+](=C)(C)C", 'stereoTest/stereoCenterN14.mol');
	none("[NH2+](C)C", 'stereoTest/stereoCenterN15.mol');
	none("[NH3+]C", 'stereoTest/stereoCenterN16.mol');
	none("[NH4+]", 'stereoTest/stereoCenterN17.mol');

	//none("[N+](N)([NH])(C)CC", 'stereoTest/stereoCenterN18.mol');   // TODO:
	//none("[N+](O)([O])(C)CC", 'stereoTest/stereoCenterN19.mol');
	//none("[N+](S)([S])(C)CC", 'stereoTest/stereoCenterN20.mol');
	none("[N+]([SeH])([Se])(C)C", 'stereoTest/stereoCenterN21.mol');
	none("[N+]([TeH])([Te])(C)C", 'stereoTest/stereoCenterN22.mol');

	//tetrahedral("N(=C)(C)(N)O", 'stereoTest/stereoCenterN23.mol');
	none("N(=C)(=C)C", 'stereoTest/stereoCenterN24.mol');
	none("N(#C)=C", 'stereoTest/stereoCenterN25.mol');

	none("N(=C)(C)(C)", 'stereoTest/stereoCenterN26.mol');
	none("N(=C)(C)", 'stereoTest/stereoCenterN27.mol');
	none("N(=C)", 'stereoTest/stereoCenterN28.mol');

	none("N(N)(=N)(C)CC", 'stereoTest/stereoCenterN29.mol');
	none("N(O)(=O)(C)CC", 'stereoTest/stereoCenterN30.mol');
	none("N(S)(=S)(C)CC", 'stereoTest/stereoCenterN31.mol');
	none("N([SeH])(=[Se])(C)C", 'stereoTest/stereoCenterN32.mol');
	none("N([TeH])(=[Te])(C)C", 'stereoTest/stereoCenterN33.mol');

	testStereoCenter("Molecule with subgroup", 'json/FischerProjection1.kcj', 1);
});