/**
 * Created by Chen on 2016/3/7.
 */

describe('Test of some core data and functions', function(){
	it('Element data test', function(){
		var symbols = ['H', 'C', 'O', 'Nd', 'Gd', 'Lu'];
		var atomicNumbers = [1, 6, 8, 60, 64, 71];
		for (var i = 0, l = symbols.length; i < l; ++i)
		{
			var symbol = symbols[i];
			var num = Kekule.ChemicalElementsDataUtil.getAtomicNumber(symbol);
			expect(atomicNumbers[i]).toEqual(num);
		}
		for (var i = 0, l = atomicNumbers.length; i < l; ++i)
		{
			var atomicNumber = atomicNumbers[i];
			var s = Kekule.ChemicalElementsDataUtil.getElementSymbol(atomicNumber);
			expect(symbols[i]).toEqual(s);
		}
	});

	it('Isotope data test', function(){
		var info = Kekule.IsotopesDataUtil.getIsotopeInfo('H', 1);
		expect(info.exactMass).toEqual(1.007825032);
		var info = Kekule.IsotopesDataUtil.getIsotopeInfo('H', 3);
		expect(info.exactMass).toEqual(3.016049278);
		var info = Kekule.IsotopesDataUtil.getIsotopeInfo('F', 30);
		expect(info.exactMass).toEqual(30.0525);
	});

	it('Atom type test', function(){
		var atomTypes = Kekule.AtomTypeDataUtil.getAllAtomTypes('C');
		var atomType = atomTypes[0];
		expect(atomType.maxBondOrder).toEqual(3);
		expect(atomType.bondOrderSum).toEqual(4);

		var atomTypes = Kekule.AtomTypeDataUtil.getAllAtomTypes('N');
		var atomType = atomTypes[1];
		expect(atomType.maxBondOrder).toEqual(2);
		expect(atomType.bondOrderSum).toEqual(5);
	});


	it('Atom creation test', function(){
		var atomSymbols = ['H', 'H', 'C', 'C', 'O', 'N', 'Cl', 'H', 'C'];
		var massNumbers = [1, 1, 12, 13, 16, 14, 35, 2, 12];
		var atoms = [];
		for (var i = 0, l = atomSymbols.length; i < l; ++i)
		{
			atoms[i] = new Kekule.Atom(atomSymbols[i], massNumbers[i]);
		}
		atoms[0].setSymbol('O');
		expect(atoms[0].getAtomicNumber()).toEqual(8);
		expect(atoms[0].getMassNumber()).not.toBeDefined();
		atoms[1].setMassNumber(3);
		expect(atoms[1].getAtomicNumber()).toEqual(1);
		expect(atoms[1].getMassNumber()).toEqual(3);
		atoms[3].changeIsotope('C', 12);
		expect(atoms[3].getAtomicNumber()).toEqual(6);
		expect(atoms[3].getMassNumber()).toEqual(12);
		atoms[6].setSymbol('F');
		expect(atoms[6].getAtomicNumber()).toEqual(9);
		expect(atoms[6].getMassNumber()).not.toBeDefined();
	});

	it('ChemObjectCompare test', function(){
		var atomSymbols = ['H', 'H', 'C', 'C', 'C', 'N', 'O', 'Cl'];
		var massNumbers = [1, 1, 12, 12, 13, 14, 16, 35];
		var charges = [-3, 1, -1, 1, -1, 0, 0, -1];
		var atoms = [];
		var compareValues = [];
		var ops = {compareAtom: true, compareMass: true, compareCharge: true};

		for (var i = 0, l = atomSymbols.length; i < l; ++i)
		{
			atoms[i] = new Kekule.Atom(atomSymbols[i], massNumbers[i]);
			atoms[i].setCharge(charges[i]);
			//compareValues[i] = Kekule.UnivChemStructObjComparer.getNodeCompareValue(atoms[i], ops);
		}
		/*
		for (var i = 1, l = compareValues.length; i < l; ++i)
		{
			expect(compareValues[i]).toBeGreaterThan(compareValues[i - 1]);
		}
		*/
		for (var i = 1, l = atomSymbols.length; i < l; ++i)
		{
			expect(atoms[i].compare(atoms[i-1]).toBeGreaterThan(0);
		}
	});

	it('Matrix test', function(){
		var M = Kekule.MatrixUtils;
		var m1 = M.create(3, 3, [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1
		]);
		var m2 = M.create(3, 3, [
			1, 1, 1,
			1, 1, 1,
			1, 1, 1
		]);
		var m3 = M.create(3, 2, [
			2, 4,
			1, 5,
			3, 2
		]);

		var r = M.add(m1, m2);

		expect(M.getValue(r, 1, 1)).toEqual(2);
		expect(M.getValue(r, 1, 2)).toEqual(1);
		expect(M.getValue(r, 2, 1)).toEqual(1);
		expect(M.getValue(r, 3, 3)).toEqual(2);

		r = M.multiply(m2, m3);
		expect(M.getValue(r, 1, 1)).toEqual(6);
		expect(M.getValue(r, 3, 2)).toEqual(11);
	});
});