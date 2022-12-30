# Kekule.js

Kekule.js is an open source JavaScript toolkit for chemoinformatics released under MIT license. 
It can be used in both web applications and node applications to read, write, display and edit chemical objects (e.g. molecules) 
and to perform some chemical algorithms (e.g. molecule structure comparing, searching, aromatic detection).

More details about this project can be found in [Kekule.js website](http://partridgejiang.github.io/Kekule.js/). 

## Installation and import

The whole Kekule.js package can be installed with npm:

```shell
npm install --save kekule
```

then be imported to your project with ES module ``import`` or CommonJS ``require``:

```javascript
import { Kekule } from 'kekule';
import 'kekule/theme/default';       // if Kekule widgets is used in browser, the theme CSS should be imported as well
console.log(Kekule.VERSION);
```

```javascript
let Kekule = require('kekule').Kekule;
require('kekule/theme/default');    // if Kekule widgets is used in browser, the theme CSS should be imported as well
console.log(Kekule.VERSION);
```

For web applications, Kekule.js can also be used in a traditional way by simply including it in the HTML page with `<script>` tag:

```html
<!-- from CDN -->
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/kekule/dist/themes/default/kekule.css" />
<script src="https://cdn.jsdelivr.net/npm/kekule/dist/kekule.min.js"></script>
```

```html
<!-- or from local file -->
<link rel="stylesheet" type="text/css" href="./node_modules/dist/themes/default/kekule.css" />
<script src="./node_modules/kekule/dist/kekule.min.js"></script>
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

// Output SMILES
var smiles = Kekule.IO.saveFormatData(mol, 'smi');
console.log('SMILES: ', smiles);

// Output MOL2k
var mol2k = Kekule.IO.saveFormatData(mol, 'mol');
console.log('MOL 2000: \n', mol2k);
```
       
The [installation](http://partridgejiang.github.io/Kekule.js/documents/tutorial/content/installation.html) 
chapter of [Kekule.js tutorial](http://partridgejiang.github.io/Kekule.js/documents/tutorial/) provides more details
of how to integrate Kekule.js into your own project.

## Cheminformatics

Kekule.js implements many commonly-used cheminformatics tasks in JavaScript (in the other word, 
no need to communicate with a backend server). These include (but not limit to):

### IO

```javascript
// load a molecule from JavaScript string
let cmlData = '<cml xmlns="http://www.xml-cml.org/schema"><molecule id="m1"><atomArray><atom id="a2" elementType="C" x2="7.493264658965051" y2="35.58088907877604"/><atom id="a3" elementType="O" x2="8.186084981992602" y2="35.18088907877604"/><atom id="a1" elementType="C" x2="6.800444335937501" y2="35.18088907877604"/></atomArray><bondArray><bond id="b2" order="S" atomRefs2="a2 a3"/><bond id="b1" order="S" atomRefs2="a2 a1"/></bondArray></molecule></cml>';
let molecule = Kekule.IO.loadFormatData(cmlData, 'cml');

// load a spectrum from string
let jcampData = '##TITLE=CCH-4\n##JCAMP-DX=4.24\n##DATA TYPE=INFRARED SPECTRUM ...{omitted}... ##END=';
let spectrum = Kekule.IO.loadMimeData(cmlData, 'chemical/x-jcamp-dx');

// load from url
let url = './data/mol2D/quinone.mol';
Kekule.IO.loadUrlData(url, (mol, success) => {
  if (success)
    console.log('Load molecule successful', mol);
});

// load from file object
document.getElementById('inputFile').addEventListener('change', () => {
  let file = document.getElementById('inputFile').files[0];
  if (file)
  {
    Kekule.IO.loadFileData(file, function(mol, success) {
      if (success)
      console.log('Load molecule successful', mol);
    });
  }
});

// save to string in SMILES format
let smiles = Kekule.IO.saveFormatData(spectrum, 'smi');
// use mimetype to set the output format
let dataMol = Kekule.IO.saveMimeData(molecule, 'chemical/x-mdl-molfile');   
```

### Molecule information
                                 
```javascript
// get all rings of molecule
let allRings = molecule.findAllRings();
// get SSSR of molecule
let sssRings = molecule.findSSSR();
// get aromatic of molecule
let aromaticRings = molecule.findAromaticRings();

// find chiral atoms and stereo bonds in molecule
let chiralAtoms = molecule.perceiveChiralNodes();
let stereoBonds = molecule.perceiveStereoConnectors();
```
                        
### Molecule comparison and sub-structure search

```javascript
// compare srcMol and targetMol, check if the structure is same
let isSame = srcMolecule.isSameStructureWith(targetMolecule);
// search sub structure inside targetMolecule
let searchResult = targetMolecule.search(subStructure);
if (!!searchResult)
	console.log('The sub structure is in target');
```

## Widget

Kekule.js shipped with a series of web widgets providing UIs to display / modify chemistry objects in web application. 
These powerful widgets are probably the most commonly used parts of Kekule.js. 

The widgets can be initialized automatically with simple HTML tag:

```html
<!-- a viewer widget to display the molecule -->
<div id="chemViewer" style="width:500px;height:400px" data-widget="Kekule.ChemWidget.Viewer" data-chem-obj="url(./data/mol2D/quinone.mol)"></div>

<!-- a composer widget to edit the molecule -->
<div id="composer" style="width:600px;height:400px" data-widget="Kekule.Editor.Composer" data-chem-obj="url(./data/mol2D/quinone.mol)"></div>
```
```javascript
Kekule.X.domReady(() => {  // called after DOM ready and the widget been initialized
  let viewer = Kekule.Widget.getWidgetById('chemViewer');
  let composer = Kekule.Widget.getWidgetById('composer');
});

```

or created with JavaScript code:

```javascript
// create a viewer widget and append it as child to #parent HTML element
let chemViewer = new Kekule.ChemWidget.Viewer(document);
chemViewer.setDimension('500px', '400px');
chemViewer
  .appendToElem(document.getElementById('parent'))
  .setChemObj(molecule);

// create a composer widget directly on #div1
let composer = new Kekule.Editor.Composer(document.getElementById('div1'));
composer.setDimension('600px', '400px');
composer.setChemObj(molecule);
```

## Widget wrapper
                                    
It is also possible to wrap a widget into standard [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components).
Details can be found at the web component chapter of [tutorial](http://partridgejiang.github.io/Kekule.js/documents/tutorial/content/webComponent.html).

Project [Kekule-Vue](https://github.com/partridgejiang/Kekule-Vue) can be used to wrap Kekule widget into 
[Vue](https://github.com/vuejs/vue) components with vue props, models and events.

Project [Kekule-React](https://github.com/partridgejiang/Kekule-React) can be used to wrap Kekule widget into
[React](https://github.com/facebook/react) components with props and events.
 
## Documentations and Demos

[Tutorials](http://partridgejiang.github.io/Kekule.js/documents/tutorial/index.html) and 
[demos](http://partridgejiang.github.io/Kekule.js/demos/index.html) are built to explain the basic 
operations in Kekule.js (e.g. creating molecule, loading and saving chemical objects, getting molecule 
information and usage of chem widgets).
 
## License

The toolkit is released under [MIT](https://github.com/partridgejiang/Kekule.js/blob/master/LICENSE) license.