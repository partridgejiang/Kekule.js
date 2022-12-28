Web Component Wrapper of Widgets
========================================

`Web Component <https://developer.mozilla.org/en-US/docs/Web/Web_Components>`_ is
a fashion solution to encapsulate custom elements and functions away from
other context of the web applications. In the recent version of Kekule.js, web component technology is
introduced and all widgets can be used in a web component way.

The toolkit provides a util function encapsulating a normal Kekule.js into a web component element:

.. code-block:: javascript

  Kekule.WebComponent.Utils.wrapWidget(Kekule.Widget.CheckButton, 'kekule-check-button');
  // Create a custom element <kekule-check-button> encapsulating Kekule.Widget.CheckButton

Afterwards, that custom element can be used in the web page:

.. code-block:: javascript

  var myButton = document.createElement('kekule-check-button');
  document.body.appendChild(myButton);
  var buttonWidget = myButton.widget;   // property widget stores the actual widget object in custom element
  buttonWidget.text = 'Web Component Button';   // set a widget property
  buttonWidget.on('click', function(e){ console.log('click'); });   // call a widget method

Note the ``widget`` property of wrapped custom element is pointing the the widget instance, so you can use it
to manipulate the inner widget with ease. By the way, by default, most of the widget properties are also mapped
to the custom element in ``Kekule.WebComponent.Utils.wrapWidget``, so you can also get/set property values directly
on the custom element. The following code snippet actually do the same work as the last one:

.. code-block:: javascript

  var myButton = document.createElement('kekule-check-button');
  document.body.appendChild(myButton);
  myButton.text = 'Web Component Button';   // same to myButton.widget.text = 'Web Component Button';
  myButton.widget.on('click', function(e){ console.log('click'); });;   // but method are not mapped by default

Aside from JavaScript code, wrapped custom element can also be used directly in HTML code. The attribute of element
can be used to set the widget properties directly:

.. code-block:: html

  <kekule-check-button id="myButton" text="Web Component Button"></kekule-check-button>
  <script>
    var myButton = document.getElementById('myButton');
    myButton.widget.on('click', function(e){ console.log('click'); });;
  </script>

In the web component module, three often used chemical widgets are already be wrapped：
the :doc:`Viewer<./chemViewer>` (``<kekule-viewer>``), :doc:`Composer<./composer>` (``<kekule-composer>``),
:doc:`SpectrumInspector<./spectra>` (``<kekule-spectrum-inspector>``) and PeriodicTable (``<kekule-periodic-table>``).
Users can use those custom elements directly in their HTML codes, e.g.:

.. code-block:: html

  <kekule-viewer id="viewer" style="width:500px;height:500px" chem-obj="url(molecule.mol)" render-type="3"></kekule-viewer>
  <script>
    var viewer = document.getElementById('viewer').widget;
    viewer.predefinedSetting = 'fullFunc';
  </script>

The demo of web component wrapper can be found on
`Kekule.js demo page <http://partridgejiang.github.io/Kekule.js/demos/>`_ .

