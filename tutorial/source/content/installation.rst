Installation
============

Using NPM
---------------------

The Kekule.js package can be installed with npm with the following command line:

.. code-block:: shell

    npm install --save kekule

Afterwards, the package can be imported to your project with ES module ``import`` or CommonJS ``require``:

.. code-block:: javascript

    import { Kekule } from 'kekule';
    import 'kekule/theme/default';       // if Kekule widgets is used in browser, the theme CSS should be imported as well
    console.log(Kekule.VERSION);

.. code-block:: javascript

    let Kekule = require('kekule').Kekule;
    require('kekule/theme/default');    // if Kekule widgets is used in browser, the theme CSS should be imported as well
    console.log(Kekule.VERSION);

The default import approaches above include all modules of Kekule.js.
If you want to reduce the total file size and achieve a better result from tree-shaking,
individual modules may be imported as well:

.. code-block:: javascript

    // Import IO and ChemWidget modules (and their prerequisites) only
    import { Kekule } from './node_modules/kekule/dist/jsmods/io.esm.mjs';
    import './node_modules/kekule/dist/jsmods/spectroscopy.esm.mjs';   // Yes, no need to set Kekule here again
    // Also load the Chinese(zh-CN) language data resource
    import './node_modules/kekule/dist/jsmods/localizationData.zh.esm.mjs';

    import 'Kekule/theme/default';

.. code-block:: javascript

    // Import IO and ChemWidget modules (and their prerequisites) only
    let Kekule = require('./node_modules/kekule/dist/jsmods/io.cm.js').Kekule;
    require('./node_modules/kekule/dist/jsmods/chemWidget.cm.js');      // No need to set Kekule here again
    // Also load the Chinese(zh-CN) language data resource
    require('./node_modules/kekule/dist/jsmods/localizationData.zh.cm.js');

    require('Kekule/theme/default');

The Traditional Way
---------------------

Of course, as a JavaScript toolkit, Kekule.js can also be imported with HTML ``<script>`` tag.

.. code-block:: html

    <!-- from CDN -->
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/kekule/dist/themes/default/kekule.css" />
    <script src="https://cdn.jsdelivr.net/npm/kekule/dist/kekule.min.js"></script>
    <!-- or -->
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/browse/kekule/dist/themes/default/kekule.css" />
    <script src="https://unpkg.com/kekule@1.0.0/dist/kekule.min.js"></script>
    <!-- or from other CDN -->


.. code-block:: html

    <!-- from local file -->
    <link rel="stylesheet" type="text/css" href="./node_modules/dist/themes/default/kekule.css" />
    <script src="./node_modules/kekule/dist/kekule.min.js"></script>

If only partial of the package need to be loaded, the special bootstrap JavaScript file ``kekule.js`` can be used
to include only the limited modules:

.. code-block:: html

    <!--  Load IO and ChemWidget modules (and their prerequisites) only -->
    <script src="./node_modules/kekule/dist/kekule.js?modules=io,chemWidget"></script>

Other parameters can be used after ``kekule.js`` to set the localization information:

.. code-block:: html

    <!--
        Load IO and ChemWidget modules (and their prerequisites) only.
        The English and Chinese language data are loaded as well.
        Here the display language of Kekule widgets is set to Chinese manually (rather than be auto-detected from browser).
    -->
    <script src="./node_modules/kekule/dist/kekule.js?modules=io,chemWidget&locals=en,zh&language=zh"></script>


Dynamic module loading
---------------------------

In your JavaScript code, additional Kekule.js modules can also be dynamically loaded:

.. code-block:: javascript

    Kekule.modules(['algorithm', 'calculation'], function(error) {
        if (!error)
        {
            // algorithm and calculation modules loaded successfully, functions can be used now.
        }
    });

The dynamic loading mechanism is also applied to web worker and web assembly files inside Kekule.js.
For example, when utilizing the wasm compilation of OpenBabel with Kekule, the following codes are often used:

.. code-block:: javascript

    Kekule.OpenBabel.enable(error => {
        if (!error)
        {
            console.log('OpenBabel wasm loaded and can be accessed!');
        }
    });

In this process, the external ``dist/extra/openbabel.js``, ``dist/extra/openbabel.wasm``, ``dist/extra/openbabel.data``
and ``dist/extra/kekule.worker.obStructureGenerator.js`` may be loaded. Since this dynamic loading method can not be
handled automatically by project package tool like WebPack, you have to copy the ``dist/extra`` and ``dist/mins``
directory to your root of the bundled js.

Child modules and function of Kekule.js
--------------------------------------------

The following table is a brief introduction of major modules in current toolkit:

=============   ================
Module	        Major feature(s)
=============   ================
Core            * Representation of chemical concepts including element, atom, bond, molecule and reaction.
IO              * Read/write different format of chemical data. Now including:

                  * Kekule JSON/XML format
                  * CML
                  * MDL MOL2000/3000
                  * JCAMP-DX/CS
                  * SMILES (for output)

Render          * Provides low-level cross-browser render methods to draw molecule (and other chemical objects) in web browser context..

Spectroscopy    * Representation of molecule spectra.
                * Rendering of spectrum.

Widget          * Small components to be used in web applications, including button, text box, combo box, dialog, tree view, tab view, text editor, color picker, object inspector and so on.
                * Animation system to show/hide those widgets.
                * Actions associated with those widgets.
Chem Widget     * Widgets related to chemistry, including:

                  * Periodical table
                  * 2D or 3D viewer for molecule and other chemical objects.
                  * 2D diagram editor for molecule and other chemical objects.

Algorithm       * Algorithms for chemical graph theory, including:

                  * Ring perception
                  * Aromatic ring recognization
                  * Molecule comparison
                  * Sub-structure search
                  * Stereo center and stereo bond identification
=============   ================

.. _libsForRendering:

Two additional JavaScript libraries may also be requested for drawing molecule (and other chem objects) in HTML page. You can download those libraries from their website easily:

`Raphael.js <http://dmitrybaranovskiy.github.io/raphael/>`_:
	This library is utilized to draw 2D chem objects in SVG or VML format (rather than the default Canvas form of Kekule.js). However, as currently most modern web browsers support Canvas well, it is seldom needed unless you have to support a very ancient web browser (e.g., IE6-9).

`Three.js <http://threejs.org/>`_:
	This library is utilized to draw 3D molecules in WebGL or Canvas form. As the whole three.js lib is quite large and a little overhead for drawing molecule, it is planned to replaced by our own implementation in the future.

If Raphael.js and three.js are used, don't forget to put them ahead of Kekule.js script tag:

.. code-block:: html

	<script src="raphael.min.js"></script>
	<script src="Three.js"></script>
	<script src="kekule.js?module=chemWidget"></script>

When using Raphael.js or three.js with ``import``/``require``, additional code need to be used to let Kekule.js be aware of its existence:

::

    import * as THREE from 'three';
    import { Kekule } from 'kekule';
    Kekule.externalResourceManager.register('three.js', THREE);

    define([ "path/to/raphael" ], function(Raphael) {
      Kekule.externalResourceManager.register('Raphael.js', Raphael);
    });
