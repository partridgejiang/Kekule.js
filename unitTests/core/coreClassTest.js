/**
 * Created by ginger on 2017/2/19.
 */

describe('Test of some methods of core classes', function(){
	it('Compare method test on chemObj', function(){
		var o1 = new Kekule.ChemObject();
		var o2 = o1.clone(true);

		expect(o1.compare(1)).toEqual(1);
		expect(o1.compare(false)).toEqual(1);
		expect(o1.compare({a: 1})).toEqual(1);
		expect(o1.compare(new Date())).toEqual(1);

		expect(o1.compare(o2)).toEqual(0);
		expect(o2.compare(o1)).toEqual(0);

		//o2.setId((o2.getId() || '') + 'dummy');
		o2.setInfoValue('key1', 'value1');
		expect(o1.compare(o2)).toBeLessThan(0);
		expect(o2.compare(o1)).toBeGreaterThan(0);
	});

	it('Structure compare method test on atom', function(){

		var ops1 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, 'atom': false, 'mass': false, 'stereo': false, 'hydrogenCount': false};
		var ops2 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, 'atom': true, 'mass': false, 'stereo': false, 'hydrogenCount': false};
		var ops3 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, 'atom': true, 'mass': true, 'stereo': false, 'hydrogenCount': false};
		var ops4 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, 'atom': true, 'mass': true, 'stereo': true, 'hydrogenCount': false};
		var ops5 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, 'atom': false, 'mass': false, 'stereo': true, 'hydrogenCount': false};

		var atomC = new Kekule.Atom('a1', 'C');
		var atomC13 = new Kekule.Atom('a2', 'C', 13);
		var atomCStereo = new Kekule.Atom('a3', 'C');
			atomCStereo.setParity(2);
		var atomOStereo = new Kekule.Atom('a4', 'O');
			atomOStereo.setParity(2);

		// test on atoms
		expect(atomC.compare(atomC13, ops1)).toEqual(0);
		expect(atomC.compare(atomC13, ops2)).toEqual(0);
		expect(atomC.compare(atomC13, ops3)).toEqual(-1);
		expect(atomC.compare(atomC13, ops4)).toEqual(-1);

		expect(atomC.compare(atomCStereo, ops1)).toEqual(0);
		expect(atomC.compare(atomCStereo, ops2)).toEqual(0);
		expect(atomC.compare(atomCStereo, ops3)).toEqual(0);
		expect(atomC.compare(atomCStereo, ops4)).not.toEqual(0);

		expect(atomC.compare(atomOStereo, ops1)).toEqual(0);
		expect(atomC.compare(atomOStereo, ops2)).toEqual(-1);
		expect(atomC.compare(atomOStereo, ops3)).toEqual(-1);
		expect(atomC.compare(atomOStereo, ops4)).not.toEqual(0);

		expect(atomCStereo.compare(atomOStereo, ops1)).toEqual(0);
		expect(atomCStereo.compare(atomOStereo, ops2)).toEqual(-1);
		expect(atomCStereo.compare(atomOStereo, ops5)).toEqual(0);

		var pseudoAtom1 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.DUMMY);
			//pseudoAtom1.setSymbol('CCC1');
		var pseudoAtom1_2 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.DUMMY);
			//pseudoAtom1_2.setSymbol('CCC2');
		var pseudoAtom2 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.HETERO);
			//pseudoAtom2.setSymbol('CCC1');
		var pseudoAtom2_2 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.HETERO);
			//pseudoAtom2_2.setSymbol('CCC2');
		var pseudoAtom3 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.ANY);
			//pseudoAtom3.setSymbol('CCC1');
		var pseudoAtom4 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.CUSTOM);
			pseudoAtom4.setSymbol('CCC1');
		var pseudoAtom5 = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.CUSTOM);
			pseudoAtom5.setSymbol('CCC2');

		// test on pseudoAtoms
		expect(pseudoAtom1.compare(pseudoAtom1_2, ops4)).toEqual(0);
		expect(pseudoAtom2.compare(pseudoAtom2_2, ops4)).toEqual(0);
		expect(pseudoAtom1.compare(pseudoAtom2, ops1)).toEqual(0);
		expect(pseudoAtom1.compare(pseudoAtom2, ops4)).not.toEqual(0);
		expect(pseudoAtom1.compare(pseudoAtom3, ops4)).not.toEqual(0);
		expect(pseudoAtom3.compare(pseudoAtom2, ops4)).not.toEqual(0);
		expect(pseudoAtom4.compare(pseudoAtom5, ops1)).toEqual(0);
		expect(pseudoAtom4.compare(pseudoAtom5, ops4)).not.toEqual(0);

		var vAtom1 = new Kekule.VariableAtom();
			vAtom1.setDisallowedIsotopeIds(['O', 'C13', 'P']);
		var vAtom2 = new Kekule.VariableAtom();
			vAtom2.setDisallowedIsotopeIds(['P', 'O', 'C13']);
		var vAtom3 = vAtom1.clone();
			vAtom3.setAllowedIsotopeIds(['O', 'C13', 'P']);
		var vAtom4 = new Kekule.VariableAtom();
			vAtom4.setAllowedIsotopeIds(['O', 'C13', 'P']);

		// test on variable atoms
		expect(vAtom1.compare(vAtom2, ops4)).toEqual(0);
		expect(vAtom1.compare(vAtom3, ops4)).not.toEqual(0);
		expect(vAtom1.compare(vAtom4, ops4)).not.toEqual(0);
		expect(vAtom3.compare(vAtom4, ops4)).toEqual(0);


		// test on different types
		expect(atomC.compare(pseudoAtom1, ops1)).not.toEqual(0);
		expect(atomC.compare(pseudoAtom1, ops2)).not.toEqual(0);
		expect(atomC.compare(vAtom1, ops1)).not.toEqual(0);
		expect(atomC.compare(vAtom1, ops2)).not.toEqual(0);
	});

	it('Structure compare method test on bond', function(){
		var b1 = new Kekule.Bond();
		b1.setBondOrder(1);
		b1.setParity(1);
		var b2 = new Kekule.Bond();
		b2.setBondOrder(2);
		b2.setParity(0);

		var ops1 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, structureLevel: Kekule.StructureComparationLevel.SKELETAL};
		var ops2 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, structureLevel: Kekule.StructureComparationLevel.CONSTITUTION};
		var ops3 = {'method': Kekule.ComparisonMethod.CHEM_STRUCTURE, structureLevel: Kekule.StructureComparationLevel.CONFIGURATION};

		expect(b1.compare(b2, ops1)).toEqual(0);

		expect(b2.compare(b1, ops1)).toEqual(0);
		expect(b1.compare(b2, ops2)).not.toEqual(0);
		expect(b2.compare(b1, ops2)).not.toEqual(0);
		expect(b1.compare(b2, ops3)).not.toEqual(0);
		expect(b2.compare(b1, ops3)).not.toEqual(0);

	});
});