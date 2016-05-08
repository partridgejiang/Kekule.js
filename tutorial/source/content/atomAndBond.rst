Atom and Bond
=============

Atoms and bonds are the foundation of varies of molecules. They are represented as
objects in Kekule.js.

Working with Atom
-----------------

To create an atom:

::

  var atom = new Kekule.Atom('atom1');  // create an atom with an id

Atom can be modified by its properties:

=============  ==========  ===========
Property       Value Type  Description
=============  ==========  ===========
atomicNumber    int        Atomic number of atom, e.g. 6 for carbon.
                           It will be automatically changed when property ``symbol`` is set.
symbol          string     Symbol of atom, e.g., 'C' for carbon.
                           It will be automatically changed when property ``atomicNumber`` is set.
massNumber      int        Mass number of the isotope.
isotopeId       string     A shortcut property to set atomic number and mass
                           number all at once, e.g. '13C' or 'C13'.
charge          float      Charge on this atom. Partial charge (e.g. +0.5) is allowed.
=============  ==========  ===========

::

  // set atom to represent C13
  atom.setSymbol('C').setMassNumber(13);  // note that the property can be set cascadedly
  // same effect as the previous line
  atom.setIsotopeId('C13');
  // atom O2-
  atom.setAtomicNumber(8).setCharge(-2);

Some property values can be set during the creation of atom:

::

  var atom = new Kekule.Atom('atom1', 'C', 13);   // create C13 atom


Working with Bond
-----------------

To create a bond:

::

  var bond = new Kekule.Bond('bond1');  // create a bond with an id

Two of the most important properties of bond is its type and order:

==========  ==========  ===========
Property    Value Type  Description
==========  ==========  ===========
bondType     string     Type of bond, can be set to
                        ``Kekule.BondType.COVALENT/IONIC/COORDINATE/METALLIC/HYDROGEN.``
bondOrder     int       Order of covalence bond, can be set to
                        ``Kekule.BondOrder.SINGLE/DOUBLE/TRIPLE`` and so on.
==========  ==========  ===========

::

  // create a double covalent bond
  bond.setBondType(Kekule.BondType.COVALENT).setBondOrder(2);

If ``bondType`` or ``bondOrder`` property is not set, the bond will be considered
as a single covalent bond by default.

Atoms can be connected together by bonds, thus a molecule is created. This will
be discussed in the next part of this tutorial.