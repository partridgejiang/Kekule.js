Get Molecule Information
========================

With the instance of molecule, user can use a series of properties and methods
provided by the toolkit to reveal the information of molecule, from the intuitive
atom/bond count to more complicated feature such as ring set and stereo center.

Iterating over Atoms and Bonds
------------------------------

Once you have a molecule, it's easy to loop over its atoms and bonds:[#example]_

::

  // iterate all nodes(atoms)
  for (var i = 0, l = mol.getNodeCount(); i < l; ++i)
  {
    var node = mol.getNodeAt(i);
    console.log('node ' + i, node.getClassName(), node.getLabel());
  }
  // iterate all connectors(bonds)
  for (var i = 0, l = mol.getConnectorCount(); i < l; ++i)
  {
    var connector = mol.getConnectorAt(i);
    console.log('connector ' + i,
      connector.getClassName(), connector.getBondOrder? connector.getBondOrder(): '?');
  }

The atom or bond inside a molecule can also be accessed by its id:

::

  var atom1 = mol.getNodeById('atom1');  // returns the atom with id 'atom1'
  var bond1 = mol.getConnectorById('bond1');  // returns the bond with id 'bond1'

To individual node(atom) or connector(bond), their belonged molecule (or structure fragment)
can be get by method *getParentFragment*:

::

  var mol = atom.getParentFragment();
  var mol = bond.getParentFragment();

In the molecule, atoms and bonds connected with each other, their relations can be gained
by properties *linkedConnectors*, *linkedObjs* of node and *connectedObjs* of connector:

::

  var bondsAroundAtom = atom.getLinkedConnectors();
    // returns an array of connectors linked with this atom
  var neighborAtoms = atom.getLinkedObjs();
    // returns neighbor atoms linked with this atom by only one bond
  var objectsLinkedByOneBond = bond.getConnectedObjs();
    // returns array of objects connected by connector


..
	Canonicalization
	----------------

	Canonicalization ensures the unique order of atoms and bonds in molecule. It can be done
	with the following code:


Molecule Formula
----------------

Formula can be calculated from atoms in molecule:[#example]_

::

  // get molecule in editor
  var mol = getCurrMol();
  // get the formula object
  var formula = mol.calcFormula();
  // turn formula object into text
  console.log(formula.getText());

Ring Information [#module]_
---------------------------

Kekule.js provides method to easily find all rings and SSSR(Smallest Set of Smallest Rings) of a molecule.
The following codes can be used to get all rings:[#example]_

::

  var mol = getCurrMol();
  // find all rings of molecule
  var rings = mol.findAllRings();

The result of method *mol.findAllRings* is a JavaScript array, each *item* of it is an object represents
a ring in the molecule, all nodes(atoms) and connectors(bonds) in the ring can be access by *item.nodes*
and *item.connectors*:[#example]_

::

  var ringCountMap = [];
  // iterate over those rings
  for (var i = 0, l = rings.length; i < l; ++i)
  {
    var ring = rings[i];
    var nodeCount = ring.nodes.length;
    ringCountMap[nodeCount] = (ringCountMap[nodeCount] || 0) + 1;
  }
  // report
  console.log('Find ' + (rings.length || 0) + ' rings');
  for (var i = 0, l = ringCountMap.length; i < l; ++i)
  {
    var count = ringCountMap[i] || 0;
    if (count)
      console.log('ring with ' + i + ' atoms: ', count);
  }

For example, the codes above to find all rings in phenanthrene will shows the following logs
in the console panel of web browser:

.. code-block:: text

  Find 6 rings
  ring with 6 atoms:  3
  ring with 10 atoms:  2
  ring with 14 atoms:  1


The SSSR rings can be found with method *findSSSR*:[#example]_

::

  var mol = getCurrMol();
  if (mol)
  {
    // find SSSR of molecule
    var rings = mol.findSSSR();
    var ringCountMap = [];
    // iterate over those rings
    for (var i = 0, l = rings.length; i < l; ++i)
    {
      var ring = rings[i];
      var nodeCount = ring.nodes.length;
      ringCountMap[nodeCount] = (ringCountMap[nodeCount] || 0) + 1;
    }
    // report
    console.log('Find ' + (rings.length || 0) + ' SSSR rings');
    for (var i = 0, l = ringCountMap.length; i < l; ++i)
    {
      var count = ringCountMap[i] || 0;
      if (count)
        console.log('ring with ' + i + ' atoms: ', count);
    }
  }

The codes above performed on phenanthrene will shows the following logs in console panel:

.. code-block:: text

  Find 3 SSSR rings
  ring with 6 atoms:  3

As ring searching is often to be a time consuming job to complex molecules, ring information returned
by *findAllRings* and *findSSSR* will be cached until the structure of molecule been changed.

.. attention:: Currently, multicenter bonds and bond-bond connections are ignored during ring perception.


Aromatic Detection [#module]_
-----------------------------

Currently, to save the calculation time, aromatic detection is carried on SSSR rings of molecule in
Kekule.js. You can simply call method *findAromaticRings*:[#example]_

::

  var mol = getCurrMol();
  if (mol)
  {
    // find aromatic of molecule
    var rings = mol.findAromaticRings();
    var ringCountMap = [];
    // iterate over those rings
    for (var i = 0, l = rings.length; i < l; ++i)
    {
      var ring = rings[i];
      var nodeCount = ring.nodes.length;
      ringCountMap[nodeCount] = (ringCountMap[nodeCount] || 0) + 1;
    }
    // report
    console.log('Find ' + (rings.length || 0) + ' aromatic rings');
    for (var i = 0, l = ringCountMap.length; i < l; ++i)
    {
      var count = ringCountMap[i] || 0;
      if (count)
        console.log('ring with ' + i + ' atoms: ', count);
    }
  }

The codes above performed on phenanthrene will shows the following logs in console panel:

.. code-block:: text

  Find 3 aromatic rings
  ring with 6 atoms:  3


Stereo Perception [#module]_
----------------------------

Chiral atoms or stereo bonds can also be revealed:[#example]_

::

  var chiralNodes = mol.perceiveChiralNodes();
  var stereoBonds = mol.perceiveStereoConnectors();

Those methods returns all stereo atoms and bonds. To simplify the calculation,
configuration of atom or bond is not marked with R/S or E/Z but with a parity
value: 1(odd), 2(even) or 0(unknown):[#example]_

::

  for (var i = 0, l = chiralNodes.length; i < l; ++i)
  {
    var n = chiralNodes[i];
    console.log('Chiral center: ', n.getLabel(), n.getParity());
  }
  for (var i = 0, l = stereoBonds.length; i < l; ++i)
  {
    var c = stereoBonds[i];
    console.log('Stereo bond: ', c.getParity());
  }


.. [#example] Example of this chapter can be found and run at `here <../examples/getMolInfo.html>`_.
.. [#module] To use this feature, algorithm module must be loaded, e.g.:
.. code-block:: html

	<script src="kekule.js?module=algorithm"></script>