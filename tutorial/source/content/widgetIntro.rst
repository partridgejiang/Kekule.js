Introduction to Widget
======================

Kekule.js provides many web widgets that can be integrated into HTML pages
or web applications directly and easily. For example, user can create a periodical table widget,
set its properties and insert it to an HTML element in several lines of JavaScript code:

::

  var widget = new Kekule.ChemWidget.PeriodicTable(document);
  widget.setEnableSelect(true)
    .setDisplayedComponents(['symbol', 'name', 'atomicNumber'])
    .appendToElem(document.getElementById('parent'));  // append to HTML element

You can also create widget on existing HTML element:

::

  var widget = new Kekule.ChemWidget.PeriodicTable(document.getElementById('div1'));

Another way to create widget is *HTML binding*, using ``data-widget`` or
``data-kekule-widget`` attribute to set the class name of widget in normal HTML element.
The following HTML code will bind periodical table widget directly to the ``div`` element
and some properties of the widget are set by ``data-`` attributes simultaneously:

.. code-block:: html

  <div id="periodicTable1" data-widget="Kekule.ChemWidget.PeriodicTable"
    data-enable-select="true"
    data-displayed-components="['symbol', 'name', atomicNumber']">
  </div>

Then you can use method ``getWidgetOnElem`` or ``getWidgetById`` to access that
widget in JavaScript code:

::

  var periodicTable = Kekule.Widget.getWidgetById('periodicTable1');
  var periodicTable = Kekule.Widget.getWidgetOnElem(document.getElementById('periodicTable1'));

Currently there are dozens of widgets shipped with the toolkit. They are divided
into two groups: common widgets and chem widgets.

Common Widgets [#moduleWidget]_
-------------------------------

These widgets are general-purposed and usually not directly related to chemoinformatics,
including button, drop box, text editor, tab group, menu, dialog and so on. Here we will not
introduce them in details. You can check the
`API document <http://partridgejiang.github.io/Kekule.js/documents/>`_ or
`demos <http://partridgejiang.github.io/Kekule.js/demos/>`_ in Kekule.js website.

.. The following table lists some useful common widgets.

..
  ===========================   ===========
  Class                         Description
  ===========================   ===========
  Kekule.Widget.Button          Button widget.
  Kekule.Widget.ButtonGroup     A tool bar to group buttons together.
  ===========================   ===========


Chem Widgets [#moduleChemWidget]_
---------------------------------

The most useful chem widgets in the toolkit is *composer*, *viewer* and *periodic table*.

===============================   ===========
Widget Class                      Description
===============================   ===========
Kekule.ChemWidget.PeriodicTable   An interactive periodic table. Use can select one or more elements in it.
Kekule.ChemWidget.Viewer          A widget to display molecule (and other chem objects)
                                  in 2D or 3D form.
                                  Basic interactions like zooming and rotation are
                                  also supported.
Kekule.Editor.Composer            2D chemical structure editor capable of handling both
                                  molecule structure and other objects such as text block
                                  and reaction symbol.
===============================   ===========

The periodic table widget is relatively simple to use,
`this online demo <http://partridgejiang.github.io/Kekule.js/demos/items/periodicTable/periodicTable.html>`_
illustrates functions of it. Viewer and composer are much powerful and they will be explored
further in the following parts of this tutorial.


.. [#moduleWidget] To use common widgets, widget module must be loaded and
  additional style sheet also need to be linked in HTML page, e.g.:
.. code-block:: html

	<script src="kekule.js?module=widget"></script>
	<link rel="stylesheet" type="text/css" href="themes/default/kekule.css" />

.. [#moduleChemWidget] To use chem widgets, chem widget module must be loaded and
  additional style sheet also need to be linked in HTML page, e.g.:
.. code-block:: html

	<script src="kekule.js?module=chemWidget"></script>
	<link rel="stylesheet" type="text/css" href="themes/default/kekule.css" />
