/**
 * Created by ginger on 2016/3/2.
 */

describe('Test of finding aromatic rings in molecule', function()
{
	var MB = TestMolBuilder;

	it('aromatic test on benzene', function(done){
		MB.loadExternalData('mdl/aromatic1.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);
			expect(rings[0].connectors.length).toEqual(6);
			done();
		});
	});

	it('aromatic test on furan', function(done){
		MB.loadExternalData('mdl/aromatic2.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);
			expect(rings[0].connectors.length).toEqual(5);
			done();
		});
	});

	it('aromatic test on quinone', function(done){
		MB.loadExternalData('mdl/aromatic3.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(0);
			done();
		});
	});

	// TODO:
	/*
	xit('aromatic test on azulene', function(done){
		MB.loadExternalData('mdl/aromatic4.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);
			expect(rings[0].connectors.length).toEqual(10);
			done();
		});
	});
	*/

	it('aromatic test on oxypyridinide', function(done){
		MB.loadExternalData('mdl/aromatic5.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);  // 0 in CDK, 1 in daylight
			expect(rings[0].connectors.length).toEqual(6);
			done();
		});
	});

	it('aromatic test on pyridinone', function(done){
		MB.loadExternalData('mdl/aromatic6.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);  // 0 in CDK, 1 in daylight
			expect(rings[0].connectors.length).toEqual(6);
			done();
		});
	});

	it('aromatic test on complex', function(done){
		MB.loadExternalData('mdl/aromatic7.mol', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findAromaticRings();
			expect(rings.length).toEqual(1);
			expect(rings[0].connectors.length).toEqual(5);
			done();
		});
	});
});