Installation
============

As a JavaScript toolkit, usually Kekule.js should
be `downloaded <http://partridgejiang.github.io/Kekule.js/download/>`_ and
be referred in HTML page by <script> tag. You can use the compressed script file to
reduce the net traffic:

.. code-block:: html

	<script src="kekule.min.js"></script>

By using kekule.min.js, all modules (exclude module Extra) are loaded into HTML page. If only a few modules is needed, you can utilize a special bootstrap script:

.. code-block:: html

	<script src="kekule.js?module=chemWidget,algorithm"></script>

Note the module parameter after "?". In the example above, module chemWidget and algorithm, as well as other prerequisite modules will be loaded.

The following table is a brief introduction of major modules in current toolkit:

=============   ================
Module	        Major feature(s)
=============   ================
Core            * Representation of chemical concepts including element, atom, bond, molecule and reaction.
IO              * Read/write different format of chemical data. Now including:

                  * Kekule JSON/XML format
                  * CML
                  * MDL MOL2000/3000
                  * SMILES (for output)

Render          * Provides low-level cross-browser render methods to draw molecule (and other chemical objects) in web browser context..
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

If widget or chem widget modules are used, additional style sheet file also need to be linked into HTML page:

.. code-block:: html

	<link rel="stylesheet" type="text/css" href="themes/default/kekule.css" />

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
