/**
 * Created by ginger on 2016/3/1.
 */

var TestMolBuilder;

(function(){

ClassEx.extend(Kekule.StructureFragment, {
	addAtom: function(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D)
	{
		//console.log('add atom', elemSymbolOrAtomicNumber);
		this.appendAtom(elemSymbolOrAtomicNumber, massNumber, coord2D, coord3D);
		return this;
	},
	addBond: function(nodesOrIndexes, bondOrder, bondType)
	{
		//console.log('add bond', bondOrder);
		this.appendBond(nodesOrIndexes, bondOrder, bondType);
		return this;
	},
	addAtoms: function(elemSymbolOrAtomicNumbers, repeatCount)
	{
		var infos = Kekule.ArrayUtils.toArray(elemSymbolOrAtomicNumbers);
		var count = repeatCount || 1;
		for (var j = 0; j < count; ++j)
		{
			for (var i = 0, l = infos.length; i < l; ++i)
			{
				this.addAtom(infos[i]);
			}
		}
		return this;
	},
	// bondInfo: [[node1, node2, order], ...]
	addBonds: function(bondInfos)
	{
		for (var i = 0, l = bondInfos.length; i < l; ++i)
		{
			var info = bondInfos[i];
			this.addBond([info[0], info[1]], info[2]);
		}
		return this;
	}
});

var BO = Kekule.BondOrder;

TestMolBuilder = {
	loadExternalData: function(relUrl, callback)
	{
		return Kekule.IO.loadUrlData('./data/' + relUrl, function(chemObj, success){
			callback(chemObj);
		});
	},
	loadExternalFiles: function(refUrls, callback)
	{
		var totalCount = refUrls.length;
		if (totalCount > 0)
		{
			var loadedCount = 0;
			var loadResults = [];
			refUrls.forEach(function(url, index)
			{
				try
				{
					TestMolBuilder.loadExternalData(url, function(chemObj)
					{
						loadResults[index] = chemObj;
						loadedCount++;
						//console.log('loaded', url, !!chemObj);
						if (loadedCount >= totalCount)
						{
							//console.log('All loaded', totalCount);
							callback(loadResults);
						}
					});
				}
				catch(e)
				{
					//console.log('Fail load', url);
					throw e;
				}
			});
		}
		else
			callback([]);
	},

	// Generate an Alkane (chain of carbons with no hydrogens) of a given length.
	makeAlkane: function(length)
	{
		var mol = new Kekule.Molecule();
		mol.addAtom('C');
		for (var i = 1; i < length; ++i)
		{
			mol.addAtom('C').addBond([i - 1, i], BO.SINGLE);
		}
	},

	makeAlphaPinene: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C')
		//	.addAtom('C').addAtom('C');
		mol.addAtoms('C', 10);
		mol.addBond([0, 1], BO.DOUBLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE)
			.addBond([4, 5], BO.SINGLE).addBond([5, 0], BO.SINGLE).addBond([0, 6], BO.SINGLE).addBond([3, 7], BO.SINGLE)
			.addBond([5, 7], BO.SINGLE).addBond([7, 8], BO.SINGLE).addBond([7, 9], BO.SINGLE);
		return mol;
	},
	makeEthylCyclohexane: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 8);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE)
			.addBond([4, 5], BO.SINGLE).addBond([5, 0], BO.SINGLE).addBond([0, 6], BO.SINGLE).addBond([6, 7], BO.SINGLE);
		return mol;
	},
	makeCyclohexene: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 6);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE)
			.addBond([4, 5], BO.SINGLE).addBond([5, 0], BO.DOUBLE);
		return mol;
	},
	makeCyclohexane: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 6);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE)
			.addBond([4, 5], BO.SINGLE).addBond([5, 0], BO.SINGLE);
		return mol;
	},
	makeCyclopentane: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 5);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE)
			.addBond([4, 0], BO.SINGLE);
		return mol;
	},
	makeCyclobutane: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 4);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 3], BO.SINGLE).addBond([3, 0], BO.SINGLE);
		return mol;
	},
	makeCyclobutadiene: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 4);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.DOUBLE).addBond([2, 3], BO.SINGLE).addBond([3, 0], BO.DOUBLE);
		return mol;
	},
	makePropylCycloPropane: function()
	{
		var mol = new Kekule.Molecule();
		//mol.addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C').addAtom('C');
		mol.addAtoms('C', 6);
		mol.addBond([0, 1], BO.SINGLE).addBond([1, 2], BO.SINGLE).addBond([2, 0], BO.SINGLE)
			.addBond([2, 3], BO.SINGLE).addBond([3, 4], BO.SINGLE).addBond([4, 5], BO.SINGLE);
		return mol;
	},
	makeEthylPropylPhenantren: function()
	{
		var mol = new Kekule.Molecule();
		mol.addAtoms('C', 19);
		mol.addBonds([
			[0, 1, BO.SINGLE],
			[1, 2, BO.DOUBLE],
			[2, 3, BO.SINGLE],
			[3, 4, BO.DOUBLE],
			[4, 5, BO.SINGLE],
			[5, 6, BO.DOUBLE],
			[6, 7, BO.SINGLE],
			[7, 8, BO.DOUBLE],
			[8, 9, BO.SINGLE],
			[9, 0, BO.DOUBLE],
			[9, 4, BO.SINGLE],
			[8, 10, BO.SINGLE],
			[10, 11, BO.DOUBLE],
			[11, 12, BO.SINGLE],
			[12, 13, BO.DOUBLE],
			[13, 7, BO.SINGLE],
			[3, 14, BO.SINGLE],
			[14, 15, BO.SINGLE],
			[12, 16, BO.SINGLE],
			[16, 17, BO.SINGLE],
			[17, 18, BO.SINGLE]
		]);
		return mol;
	},

	makeAzulene: function()
	{
		var mol = new Kekule.Molecule();
		mol.addAtoms('C', 10);
		mol.addBonds([
			[0, 1, BO.DOUBLE],
			[1, 2, BO.SINGLE],
			[2, 3, BO.DOUBLE],
			[3, 4, BO.SINGLE],
			[4, 5, BO.DOUBLE],
			[5, 6, BO.SINGLE],
			[6, 7, BO.DOUBLE],
			[7, 8, BO.SINGLE],
			[8, 9, BO.DOUBLE],
			[9, 5, BO.SINGLE],
			[9, 0, BO.SINGLE]
		]);
		return mol;
	},

	makeBiphenyl: function()
	{
		var mol = new Kekule.Molecule();
		mol.addAtoms('C', 12);
		mol.addBonds([
			[0, 1, BO.DOUBLE],
			[1, 2, BO.SINGLE],
			[2, 3, BO.DOUBLE],
			[3, 4, BO.SINGLE],
			[4, 5, BO.DOUBLE],
			[5, 0, BO.SINGLE],

			[0, 6, BO.SINGLE],

			[6, 7, BO.DOUBLE],
			[7, 8, BO.SINGLE],
			[8, 9, BO.DOUBLE],
			[9, 10, BO.SINGLE],
			[10, 11, BO.DOUBLE],
			[11, 6, BO.SINGLE]
		]);
		return mol;
	},

	makeSpiroRings: function()
	{
		var mol = new Kekule.Molecule();
		mol.addAtoms('C', 10);
		mol.addBonds([
			[0, 1, BO.SINGLE],
			[1, 2, BO.SINGLE],
			[2, 3, BO.SINGLE],
			[3, 4, BO.SINGLE],
			[4, 5, BO.SINGLE],
			[5, 6, BO.SINGLE],
			[6, 0, BO.SINGLE],
			[6, 7, BO.SINGLE],
			[7, 8, BO.SINGLE],
			[8, 9, BO.SINGLE],
			[6, 9, BO.SINGLE]
		]);
		return mol;
	}
};

})();