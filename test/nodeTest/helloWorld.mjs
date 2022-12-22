/**
 * Created by ginger on 2017/10/29.
 */

//var Kekule = require('../../src/kekule.js').Kekule;
//import {Kekule} from '../../utils/jsMinifier/dist/kekule.min.js';
//import {Kekule} from '../../utils/jsMinifier/dist/kekule.js';
//var Kekule = require('../../utils/jsMinifier/dist/kekule.min.js').Kekule;
//import K from '../../dist/kekule.esm.mjs';
import {Kekule, ClassEx} from '../../src/kekule.esm.dev.mjs';
// let Kekule = K.Kekule;

//console.log(_kekule_environment_);

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

//console.log(Kekule.scriptSrcInfo);

//let hasNodeEnv = (typeof process === 'object') && (typeof process.versions === 'object') && (typeof process.versions.node !== 'undefined');
//console.log('hasNodeEnv', hasNodeEnv);

//console.log(Kekule.OpenBabel);


//if (false)
var r = Kekule.modules(['openbabel'], err => {
    if (err)
        console.error(err);
    else
    {
        console.log(Kekule.OpenBabel);
        setTimeout(() => console.log('after', Kekule.OpenBabel), 1500);
    }
});
