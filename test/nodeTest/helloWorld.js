/**
 * Created by ginger on 2017/10/29.
 */

//var Kekule = require('../../src/kekule.js').Kekule;
//var Kekule = require('../../dist/kekule.js').Kekule;
//var Kekule = require('../../dist/kekule.min.js').Kekule;
//var Kekule = require('../../src/kekule.cm.dev.js').Kekule;
var Kekule = require('../../dist/kekule.cm.js').Kekule;
// var Kekule = require('../../src/kekule.cm.dev.js').Kekule;
//var Kekule = require('../../').Kekule;

/*
console.log(global._kekule_environment_);
console.log(__dirname);
console.log(__filename);
*/

console.log(Kekule.scriptSrcInfo);

// Create a simple CO2 molecule
var mol = new Kekule.Molecule();
var atomC = mol.appendAtom('C');
var atomO1 = mol.appendAtom('O');
var atomO2 = mol.appendAtom('O');
mol.appendBond([atomC, atomO1], 2);
mol.appendBond([atomC, atomO2], 2);

// Output formula
var formula = mol.calcFormula();
console.log('Formula: ', formula.getText());

// Output SMILES
var smiles = Kekule.IO.saveFormatData(mol, 'smi');
console.log('SMILES: ', smiles);

// Output MOL2k
var mol2k = Kekule.IO.saveFormatData(mol, 'mol');
console.log('MOL 2000: \n', mol2k);

var r = Kekule.modules(['openbabel'], err => {
	if (err)
		console.error(err);
	else
	{
		console.log(Kekule.OpenBabel);
		setTimeout(() => console.log('after', Kekule.OpenBabel), 1500);
	}
});


