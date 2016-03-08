/**
 * Created by ginger on 2016/3/2.
 */

describe('Test of finding SSSR in molecule', function(){
	var MB = TestMolBuilder;

	it('Cycle block test on internal data', function(){
		var mol = MB.makeAzulene();
		var blocks = mol.findCycleBlocks();
		expect(blocks.length).toEqual(1);

		var mol = MB.makeBiphenyl();
		var blocks = mol.findCycleBlocks();
		expect(blocks.length, 2);

		var mol = MB.makeSpiroRings();
		var blocks = mol.findCycleBlocks();
		expect(blocks.length, 1);
	});
});
