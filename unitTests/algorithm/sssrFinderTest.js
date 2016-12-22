/**
 * Created by ginger on 2016/3/2.
 */

describe('Test of finding SSSR in molecule', function(){
	var MB = TestMolBuilder;

	var mergeRingMembers = function(rings)
	{
		var result = {nodes: [], connectors: []};
		rings.forEach(function(ring){
			Kekule.ArrayUtils.pushUnique(result.nodes, ring.nodes);
			Kekule.ArrayUtils.pushUnique(result.connectors, ring.connectors);
		});
		return result;
	};

	it('SSSR test on internal data: SSSR atoms and bonds in Alpha Pinene', function(){
		var mol = MB.makeAlphaPinene();
		var rings = mol.findSSSR();
		var partition = mergeRingMembers(rings);
		expect(partition.nodes.length).toEqual(7);
		expect(partition.connectors.length).toEqual(8);
	});

	it('SSSR Test on external data: molecule with subgroups - PhCOOH', function(done){
		MB.loadExternalData('json/PhCOOH.kcj', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findSSSR();
			expect(rings.length).toEqual(1);
			var partition = mergeRingMembers(rings);
			expect(partition.nodes.length).toEqual(6);
			expect(partition.connectors.length).toEqual(6);
			done();
		});
	});

	it('SSSR Test on external data: molecule with subgroups - Custom', function(done){
		MB.loadExternalData('json/DoubleRingInSubgroup.kcj', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findSSSR();
			expect(rings.length).toEqual(3);
			var partition = mergeRingMembers(rings);
			expect(partition.nodes.length).toEqual(16);
			expect(partition.connectors.length).toEqual(17);
			done();
		});
	});

	it('SSSR Test on external data: molecule with nested subgroups', function(done){
		MB.loadExternalData('json/NestedSubgroup.kcj', function(mol){
			expect(mol).not.toBeNull();
			var rings = mol.findSSSR();
			expect(rings.length).toEqual(4);
			var partition = mergeRingMembers(rings);
			expect(partition.nodes.length).toEqual(22);
			expect(partition.connectors.length).toEqual(23);
			done();
		});
	});
});
