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
});
