Molecule Comparison and Searching
=================================

Users often need to compare the structure, or search for substructure in molecules.
The toolkit provides corresponding APIs.

Comparing Molecules [#module]_
------------------------------

To check if two molecule structure is same, just call method ``isSameStructureWith``:[#example]_

::

  // compare srcMol and targetMol, check if the structure is same
  var isSame = srcMol.isSameStructureWith(targetMol);
  // report in console
  var msg = 'The two molecules are ' + (isSame? 'same': 'different');


Substructure Searching [#module]_
---------------------------------

Substructure matching can be done by the following code:[#example]_

::

  // search options
  var options = {
    'level': Kekule.StructureComparationLevel.CONSTITUTION,  // compare in consititution level
    'compareCharge': false,   // ignore charge
    'compareMass': false      // ignore mass number difference
  };
  // check if srcMol is a sub structure in targetMol
  var result = targetMol.search(srcMol, options);

When not matching, the search result will be ``null``, otherwise the result is an array that
contains matching child objects (atoms and bonds) in targetMol. You can iterate it easily:[#example]_

::

  for (var i = 0, l = result.length; i < l; ++i)
  {
    var obj = result[i];
    if (obj instanceof Kekule.ChemStructureConnector)  // is bond
      console.log(obj.getClassName(), obj.getBondOrder? obj.getBondOrder(): '');
    else   // is atom
      console.log(obj.getClassName(), obj.getLabel());
  }

.. note:: Currently, stereochemistry is ignore during substructure search.

.. note:: Substructure search is a time-consuming job, especially to complex molecules.

.. [#example] Example of this chapter can be found and run at `here <../examples/searchMol.html>`_.
.. [#module] To use this feature, algorithm module must be loaded, e.g.:
.. code-block:: html

	<script src="kekule.js?module=algorithm"></script>