# Kekule.js

Kekule.js is an open source JavaScript toolkit for chemoinformatics released under MIT license. It can be used in both web applications and node applications to read, write, display and edit chemical objects (e.g. molecules) and to perform some chemical algorithms (e.g. molecule structure comparing, searching, aromatic detection).

More details about this project can be found in [Kekule.js website](http://partridgejiang.github.io/Kekule.js/). 

## Installation

For web applications, Kekule.js can be simply included in HTML page by `<script>` tag:

```xml
<script src="kekule.js?module=io,chemWidget,algorithm"></script>
```

Note the module param after "?". In the example above, module io, chemWidget and algorithm, as well as other prerequisite modules will be loaded.

If widget or chem widget modules are used, additional style sheet file also need to be linked in HTML page:

```xml
<link rel="stylesheet" type="text/css" href="themes/default/kekule.css" />
```

For node applications, the whole package can be installed by npm install command:

```bash
$ npm install kekule
```

Then Kekule namespace should be imported into the application:

```javascript
var Kekule = require('kekule').Kekule;
```

After installation (in web or in node.js environment), you can run a small test to ensure that the toolkit works properly:
 
```javascript
// Create a simple CO2 molecule
var mol = new Kekule.Molecule();
var atomC = mol.appendAtom('C');
var atomO1 = mol.appendAtom('O');
var atomO2 = mol.appendAtom('O');
mol.appendBond([atomC, atomO1], 2);
mol.appendBond([atomC, atomO2], 2);

// Get formula
var formula = mol.calcFormula();
console.log('Formula: ', formula.getText());

// Output SMILES (IO module should be loaded in web application)
var smiles = Kekule.IO.saveFormatData(mol, 'smi');
console.log('SMILES: ', smiles);

// Output MOL2k (IO module should be loaded in web application)
var mol2k = Kekule.IO.saveFormatData(mol, 'mol');
console.log('MOL 2000: \n', mol2k);
```

## Documentations and Demos

A set of [tutorials](http://partridgejiang.github.io/Kekule.js/documents/tutorial/index.html) and [demos](http://partridgejiang.github.io/Kekule.js/demos/index.html) are built to explain the basic operations in Kekule.js (e.g. creating molecule, loading and saving chemical objects, getting molecule information and usage of chem widgets).   

The full API documents can be found [here](http://partridgejiang.github.io/Kekule.js/documents/).
 
## License

The toolkit is released under [MIT](https://github.com/partridgejiang/Kekule.js/blob/master/LICENSE) license.