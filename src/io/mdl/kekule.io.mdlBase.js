/**
 * @fileoverview
 * Some common routines for both MOL/RXN 2000 and MOL/RXN 3000 files.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /data/kekule.dataUtils.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.reactions.js
 * requires /localization
 */

/**
 * Enumeration of MDL MOL/RXN file versions.
 * @enum
 */
Kekule.IO.MdlVersion = {
	V2000: 2,
	V3000: 3
};

/**
 * Some constants about MDL.
 * @class
 */
Kekule.IO.MDL = {
	VER2000: 'V2000',
	VER3000: 'V3000',
	SYMBOL_ANYATOM: 'A',
	SYMBOL_STARATOM: '*',
	SYMBOL_HETEROATOM: 'Q',
	SYMBOL_RGROUP: 'R',
	SYMBOL_RGROUP2: 'R#',
	SYMBOL_LONEPAIR: 'LP',
	SYMBOL_ATOMLIST: 'L',
	SYMBOL_DUMMYATOM: 'Du',  // is this symbol legal in MDL?
	SD_DATA_HEAD_PREFIX: '>',
	MOL_DELIMITER: '$$$$'
};

/**
 * Util methods for MDL 2000 format
 * @class
 */
Kekule.IO.MdlUtils = {

	/**
	 * Check if an atom symbol is standing for a dummy atom.
	 * @param {String} value
	 * @returns {Bool}
	 */
	isUnspecifiedAtomSymbol: function(value)
	{
		return ((value === Kekule.IO.MDL.SYMBOL_ANYATOM) || (value === Kekule.IO.MDL.SYMBOL_STARATOM));
	},
	/**
	 * Check if an atom symbol is standing for a hetero atom.
	 * @param {String} value
	 * @returns {Bool}
	 */
	isHeteroAtomSymbol: function(value)
	{
		return (value === Kekule.IO.MDL.SYMBOL_HETEROATOM);
	},
	/**
	 * Check if an atom symbol is standing for a RGroup
	 * @param {String} value
	 * @returns {Bool}
	 */
	isRGroupSymbol: function(value)
	{
		return (value === Kekule.IO.MDL.SYMBOL_RGROUP) || ((value === Kekule.IO.MDL.SYMBOL_RGROUP2));
	},
	/**
	 * Check if an atom symbol is standing for a lone pair
	 * @param {String} value
	 * @returns {Bool}
	 */
	isLonePairSymbol: function(value)
	{
		return (value === Kekule.IO.MDL.SYMBOL_LONEPAIR);
	},
	isAtomListSymbol: function(value)
	{
		return (value === Kekule.IO.MDL.SYMBOL_ATOMLIST);
	},
	/**
	 * Analysis MDL date time string as MMDDYYHHmm or MMDDYYYYHHmm (long format).
	 * @param {String} str
	 * @param {Bool} isLongFormat
	 * @returns {Date}
	 */
	analysisMdlDateTimeStr: function(str, isLongFormat)
	{
		var date = new Date();
		var istart = 0, ilength = 2;
		var month = (parseInt(str.substr(istart, ilength).trim(), 10) || 1) - 1;
		istart += ilength;
		var day = parseInt(str.substr(istart, ilength).trim(), 10) || 0;
		istart += ilength;
		ilength = isLongFormat? 4: 2;
		var year = parseInt(str.substr(istart, ilength), 10) || 0;
		if (!isLongFormat)
		{
			if (year >= 70) // assume 1970-1999
				year += 1900;
			else // 2000-2069
 				year += 2000;
		}
		date.setFullYear(year, month, day);
		istart += ilength;
		ilength = 2;
		var hour = parseInt(str.substr(istart, ilength), 10) || 0;
		istart += ilength;
		var minute = parseInt(str.substr(istart, ilength), 10) || 0;
		date.setHours(hour, minute);
		return date;
	},
	/**
	 * Get a MDL date time string as MMDDYYHHmm or MMDDYYYYHHmm (long format).
	 * @param {Date} date
	 * @param {Bool} useLongFormat
	 * @returns {String}
	 */
	generateMdlDateTimeStr: function(date, useLongFormat)
	{
		var s = '';
		// MMDDYYHHmm or MMDDYYYYHHmm
		s += date.getMonth().toString().lpad(2, '0');
		s += date.getDate().toString().lpad(2, '0');
		if (useLongFormat)
			s += date.getFullYear().toString().lpad(4, '0');
		else
			s += (date.getFullYear() % 100).toString().lpad(2, '0');
		s += date.getHours().toString().lpad(2, '0');
		s += date.getMinutes().toString().lpad(2, '0');
		return s;
	},
	/**
	 * Convert a MDL radical value to a Kekule one.
	 * @param {Int} value
	 * @returns {Int}
	 */
	mdlRadicalToKekule: function(value)
	{
		return value;
	},
	/**
	 * Convert a Kekule radical value to a MDL one.
	 * @param {Int} value
	 * @returns {Int}
	 */
	kekuleRadicalToMdl: function(value)
	{
		return value;
	},
	/**
	 * Convert a MDL bond type value to {@link Kekule.BondOrder} value.
	 * @param {Int} value
	 */
	bondTypeToKekuleOrder: function(value)
	{
		switch (value)
		{
			case 1: return Kekule.BondOrder.SINGLE; break;
			case 2: return Kekule.BondOrder.DOUBLE; break;
			case 3: return Kekule.BondOrder.TRIPLE; break;
			case 4: return Kekule.BondOrder.EXPLICIT_AROMATIC; break;
			default:  // value 5-8 is used for SSS query, here all returns UNSET
				return Kekule.BondOrder.UNSET;
		}
	},
	/**
	 * Convert a Kekule bond order to MDL bond type.
	 * @param {Int} value
	 */
	kekuleBondOrderToMdlType: function(value)
	{
		switch (value)
		{
			case Kekule.BondOrder.SINGLE: return 1; break;
			case Kekule.BondOrder.DOUBLE: return 2; break;
			case Kekule.BondOrder.TRIPLE: return 3; break;
			case Kekule.BondOrder.EXPLICIT_AROMATIC: return 4; break;
			default:
				return 1;
		}
	},

	/**
	 * Get version from first line of a RXN file.
	 * @param {String} line
	 * @returns {Int} Value from {@link Kekule.IO.MdlVersion}
	 */
	getRxnMarkVersion: function(line)
	{
		var s = line.substr(0, 4);
		if (s != '$RXN') // identifier wrong
		{
			return null;
		}
		else  // get file version
		{
			s = line.substr(4).trim();
			return (s == Kekule.IO.MDL.VER3000)? Kekule.IO.MdlVersion.V3000: Kekule.IO.MdlVersion.V2000;
		}
	},

	/**
	 * Check if a object can be output as MDL MOL/CTAB format.
	 * @params {Variant} obj Generally a {@link Kekule.StructureFragment} with Ctab can be output well.
	 * @returns {Bool}
	 */
	assertIlegalForCtabOutput: function(obj)
	{
		// assert obj is a Kekule.StructureFragment and has Ctab
		if (!(obj instanceof Kekule.StructureFragment))
		{
			Kekule.error(/*Kekule.ErrorMsg.CAN_NOT_WRITE_NON_MOLECULE_TO_MOL*/Kekule.$L('ErrorMsg.CAN_NOT_WRITE_NON_MOLECULE_TO_MOL'));
			return false;
		}
		else if (!obj.hasCtab())  // no ctab, can not output either
		{
			Kekule.error(/*Kekule.ErrorMsg.MOLECULE_HAS_NO_CTAB_TO_OUTPUT*/Kekule.$L('ErrorMsg.MOLECULE_HAS_NO_CTAB_TO_OUTPUT'));
			return false;
		}
		else
			return true;
	}
};

/**
 * Utils to create Kekule structures by JSON info read from MDL data.
 * @class
 * @private
 */
Kekule.IO.MdlStructureUtils = {
	/**
	 * Create CTab of fragment by ctabInfo JSON data.
	 * @param {Kekule.StructureFragment} fragment
	 * @param {Hash} ctabInfo
	 * @param {Int} coordMode Value from {@link Kekule.CoordMode}, force coordinate in which mode.
	 * @returns {Kekule.StructureFragment}
	 * @private
	 */
	fillFragment: function(fragment, ctabInfo, coordMode)
	{
		fragment.clear();
		if (ctabInfo)
		{
			// atoms
			var isCoord3D;
			if (coordMode && (coordMode != Kekule.CoordMode.UNKNOWN))
				isCoord3D = coordMode == Kekule.CoordMode.COORD3D;
			else
				isCoord3D = ctabInfo.atomInfos.isCoord3D;
			if (ctabInfo.atomInfos)
			{
				for (var i = 0, l = ctabInfo.atomInfos.length; i < l; ++i)
				{
					var info = ctabInfo.atomInfos[i];
					if (info)
					{
						var atom = Kekule.IO.MdlStructureUtils.createStructureNode(fragment, info, isCoord3D);
						if (atom)
							fragment.appendNode(atom);
						else
							Kekule.raise(/*Kekule.ErrorMsg.MDL_CTAB_ATOM_CANNOT_CREATE*/Kekule.$L('ErrorMsg.MDL_CTAB_ATOM_CANNOT_CREATE'));
					}
				}
			}
			// bonds
			if (ctabInfo.bondInfos)
			{
				for (var i = 0, l = ctabInfo.bondInfos.length; i < l; ++i)
				{
					var info = ctabInfo.bondInfos[i];
					if (info)
					{
						var bond = Kekule.IO.MdlStructureUtils.createStructureConnector(fragment, info);
						if (bond)
							fragment.appendConnector(bond);
						else
							Kekule.raise(/*Kekule.ErrorMsg.MDL_CTAB_BOND_CANNOT_CREATE*/Kekule.$L('ErrorMsg.MDL_CTAB_BOND_CANNOT_CREATE'));
					}
				}
			}
			// sgroup
			if (ctabInfo.sgInfos && ctabInfo.sgInfos.length)
			{
				var subGroupInfo = [];
				for (var i = 0, l = ctabInfo.sgInfos.length; i < l; ++i)
				{
					var info = ctabInfo.sgInfos[i];
					if (info && (info.sgType == 'SUP'))  // superAtom, subgroup
					{
						var atoms = [];
						for (var j = 0, k = info.atomIndexes.length; j < k; ++j)
							atoms.push(fragment.getNodeAt(info.atomIndexes[j]));
						if (atoms.length)
							subGroupInfo.push({'atoms': atoms, 'text': info.label});
					}
				}
				for (var i = 0, l = subGroupInfo.length; i < l; ++i)
				{
					var atoms = subGroupInfo[i].atoms;
					if (atoms.length)
					{
						var subGroup = fragment.marshalSubFragment(atoms, new Kekule.SubGroup());
						var groupText = subGroupInfo[i].text;
						if (subGroup.setFormulaText && groupText.match(/.+\d/))  // text has number at middle, may be a formula
							subGroup.setFormulaText(subGroupInfo[i].text);
						else
							subGroup.setAbbr(subGroupInfo[i].text);
					}
				}
			}
		}

		return fragment;
	},
	/**
	 * Create {@link Kekule.Atom} or other structure node by atomInfo read from MDL data.
	 * @param {Kekule.StructureFragment} fragment
	 * @param {Object} atomInfo
	 * @returns {Kekule.ChemStructureNode}
	 * @private
	 */
	createStructureNode: function(fragment, atomInfo, isCoord3D)
	{
		//console.log(atomInfo);

		var result;
		// create suitable node first
		//console.log(atomInfo.atomListInfo);
		if (atomInfo.atomListInfo || Kekule.IO.MdlUtils.isAtomListSymbol(atomInfo.symbol)) // an atom list
		{
			result = new Kekule.VariableAtom();
			// fill isotope list
			var list = [];
			if (atomInfo.atomListInfo && atomInfo.atomListInfo.symbols)
			{
				list = list.concat(atomInfo.atomListInfo.symbols);
				if (atomInfo.atomListInfo.isAllowList)
					result.setAllowedIsotopeIds(list);
				else
					result.setDisallowedIsotopeIds(list);
			}
		}
		else if (Kekule.IO.MdlUtils.isRGroupSymbol(atomInfo.symbol))
		{
			result = new Kekule.RGroup();
		}
		else if (Kekule.IO.MdlUtils.isHeteroAtomSymbol(atomInfo.symbol))
		{
			result = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.HETERO);
		}
		else if (Kekule.IO.MdlUtils.isUnspecifiedAtomSymbol(atomInfo.symbol))
		{
			result = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.ANY);
		}
		else // normal atom?
		{
			var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(atomInfo.symbol);
			if (elemInfo)
			{
				// get massNumber
				var massNumber = null;
				if (atomInfo.massNumber)
					massNumber = atomInfo.massNumber;
				else if (atomInfo.massDiff)  // need get normal mass number and calculate
				{
					//var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(atomInfo.symbol);
					if (elemInfo)
					{
						var naturalMass = elemInfo.naturalMass;
						var massNumber = Math.round(naturalMass + atomInfo.massDiff);
						var isotopeInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(elemInfo.atomicNumber, massNumber);
						if (!isotopeInfo)
						{
							massNumber = Math.floor(naturalMass + atomInfo.massDiff);
							isotopeInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(elemInfo.atomicNumber, massNumber);
						}
						if (!isotopeInfo)
						{
							massNumber = Math.ceil(naturalMass + atomInfo.massDiff);
							isotopeInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(elemInfo.atomicNumber, massNumber);
						}
						if (!isotopeInfo)  // not found, do not consider isotope
							massNumber = null;
					}
				}
				result = new Kekule.Atom(null, atomInfo.symbol, massNumber);
			}
			else  // may be an isotope alias
			{
				var isoInfo = Kekule.IsotopesDataUtil.getIsotopeInfo(atomInfo.symbol);
				if (isoInfo)
					result = new Kekule.Atom(null, isoInfo.atomicNumber, isoInfo.massNumber);
				else // has no element info, create a pseudo atom
					result = new Kekule.Pseudoatom(null, Kekule.PseudoatomType.ANY);
			}
		}

		// then node detail, coordinate, hydrongenCount and charge
		if (atomInfo.charge)
			result.setCharge(atomInfo.charge);
		if (atomInfo.radical)
			result.setRadical(atomInfo.radical);
		if (atomInfo.parity && result.setParity)
			result.setParity(atomInfo.parity);
		if (typeof(atomInfo.hydrongenCount) != 'undefined')
		{
			if (result.setExplicitHydrogenCount)
				result.setExplicitHydrogenCount(atomInfo.hydrongenCount);
		}
		if (isCoord3D)
			result.setCoord3D({'x': atomInfo.x, 'y': atomInfo.y, 'z': atomInfo.z});
		else
			result.setCoord2D({'x': atomInfo.x, 'y': atomInfo.y});

		return result;
	},
	/**
	 * Create {@link Kekule.Bond} or other structure connector by bondInfo read from MDL data.
	 * Note: atoms in fragment should be created before creating bonds.
	 * @param {Kekule.StructureFragment} fragment
	 * @param {Object} bondInfo
	 * @returns {Kekule.ChemStructureConnector}
	 * @private
	 */
	createStructureConnector: function(fragment, bondInfo)
	{
		// find two atoms
		var atom1 = fragment.getNodeAt(bondInfo.atomIndex1);
		var atom2 = fragment.getNodeAt(bondInfo.atomIndex2);
		if (atom1 && atom2)
		{
			var objs = [atom1, atom2];
			// check if there is multiple endpoint in MDL 3k
			if (bondInfo.endAtomIndexes)
			{
				for (var i = 0, l = bondInfo.endAtomIndexes.length; i < l; ++i)
				{
					var atom = fragment.getNodeAt(bondInfo.endAtomIndexes[i]);
					if (atom)
						objs.push(atom);
				}
			}
			var result = new Kekule.Bond(null, objs, bondInfo.order);
			if (typeof(bondInfo.stereo) != 'undefined')
				result.setStereo(bondInfo.stereo);
			return result;
		}
		else  // atom not exists, return null
			return null;
	},

	/**
	 * Check if a node is {@link Kekule.VariableAtom} which should be translate to MDL atom list.
	 * @param {Object} node
	 * @private
	 */
	isNodeVariableAtom: function(node)
	{
		return node instanceof Kekule.VariableAtom;
	},
	/**
	 * Return atom's type string for MDL. Usually an atom's element symbol.
	 * @param {Kekule.ChemStructureNode} node
	 * @returns {String}
	 * @private
	 */
	getAtomTypeStr: function(node, is2k)
	{
		if (node instanceof Kekule.Atom)
			return node.getSymbol();
		else if (node instanceof Kekule.Pseudoatom)
		{
			switch (node.getAtomType())
			{
				case Kekule.PseudoatomType.ANY: return Kekule.IO.MDL.SYMBOL_ANYATOM;
				case Kekule.PseudoatomType.HETERO: return Kekule.IO.MDL.SYMBOL_HETEROATOM;
				//case Kekule.PseudoatomType.DUMMY: return Kekule.IO.MDL.SYMBOL_DUMMYATOM;
				default: return Kekule.IO.MDL.SYMBOL_DUMMYATOM;
			}
		}
		else if (node instanceof Kekule.RGroup)
			return Kekule.IO.MDL.SYMBOL_RGROUP;
		else if (node instanceof Kekule.VariableAtom)  // atom list, here returns str for MDL 3000
		{
			if (is2k)
				return Kekule.IO.MDL.SYMBOL_ATOMLIST;
			else
			{
				var s = '[';
				var ids = node.getAllowedIsotopeIds();
				if (ids && ids.length) // allow list
					;
				else // disallow list
 				{
					s = 'NOT[';
					ids = node.getDisallowedIsotopeIds();
				}
				if (ids && ids.length)
				{
					var symbols = [];
					for (var i = 0, l = ids.length; i < l; ++i)
					{
						var detail = Kekule.IsotopesDataUtil.getIsotopeIdDetail(ids[i]);
						if (detail && detail.symbol)
							symbols.push(detail.symbol);
					}
					var sinner = symbols.join(',');
					s = s + sinner + ']';
					return s;
				}
				else  // no explicit ids
					return Kekule.IO.MDL.SYMBOL_ATOMLIST;
			}
		}
		else  // do not know what atom
			return '?';
	},
	/**
	 * Get basic molecule info such as atoms, bonds, subgroups for Ctab writer.
	 * @param {Kekule.StructureFragment} mol
	 * @returns {Hash} {atoms, bonds, subGroups, coordMode}
	 * @private
	 */
	getMoleculeCtabStructureInfo: function(mol)
	{
		var result = {};
		result.atoms = mol.getLeafNodes();
		result.bonds = mol.getAllChildConnectors();
		result.subGroups = mol.getSubFragments();
		var count2d = 0, count3d = 0;
		for (var i = 0, l = result.atoms.length; i < l; ++i)
		{
			if (result.atoms[i].hasCoord3D())
				++count3d;
			if (result.atoms[i].hasCoord2D())
				++count2d;
		}
		result.coordMode = (count2d > count3d)? Kekule.CoordMode.COORD2D: Kekule.CoordMode.COORD3D;
		return result;
	},
	/**
	 * Split node connected with connector to 2 groups: 2 primaryNodes and other remainNodes
	 * @param {Kekule.ChemStructureConnector} connector
	 * @private
	 */
	splitConnectedNodes: function(connector)
	{
		var result = {'primaryNodes': []};
		var count = 0;
		var objs = connector.getConnectedObjs();
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			if (objs[i] instanceof Kekule.ChemStructureNode)  // bond-bond connection is not supported by MDL
			{
				if (count < 2)  // add to node1/2
				{
					result.primaryNodes.push(objs[i]);
					++count;
				}
				else  // remainNodes
				{
					if (!result.remainNodes)
						result.remainNodes = [];
					result.remainNodes.push(objs[i]);
				}
			}
		}
		/*
		if (result.primaryNodes.length < 2)
		{
			for (var i = result.primaryNodes.length; i < 2; ++i)
				atoms.push(null);
		}
		*/
		return result;
	},

	/**
	 * Generate 2k or 3k compatibility count line string of molecule.
	 * @param {Hash} molInfo Info returned by {@link Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo}.
	 * @param {Int} mdlVersion
	 * @returns {String}
	 * @private
	 */
	generateClassicStyleCountLine: function(molInfo, mdlVersion)
	{
		if (mdlVersion == Kekule.IO.MdlVersion.V3000)
			return '  0  0  0     0  0              0 V3000';
		else // 2k count line
 		{
			var s = '';
			// format: format: aaabbblllfffcccsssxxxrrrpppiiimmmvvvvvv
			// aaa: number of atoms
			s += molInfo.atoms.length.toString().lpad(3);
			// bbb: number of bonds
			s += molInfo.bonds.length.toString().lpad(3);
			// lll: atomList count, used for query, currently bypass
			s += '0'.lpad(3);
			// fff: obsolete
			s += '0'.lpad(3);
			// ccc: chiral flag: 0=not chiral, 1=chiral
			// TODO: currently chiral is not considered
			s += '0'.lpad(3);
			// sss: number of stext entries (for ISIS/Desktop)
			s += '0'.lpad(3);
			// xxxrrrpppiii: obsolete
			for (var i = 0; i < 4; ++i)
				s += '0'.lpad(3);
			// mmm: No longer supported, the default is set to 999, ignore here
			s += '999';
			// vvvvvv, version tag
			s += Kekule.IO.MDL.VER2000.lpad(6);
			return s;
		}
	}
};

/**
 * A handler for MDL 2000 or 3000 blocks. Base class for block reader and writers.
 * @class
 * @augments ObjectEx
 */
Kekule.IO.MdlBlockHandler = Class.create(ObjectEx,
/** @lends Kekule.IO.MdlBlockHandler# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlBlockHandler',
	/** @private */
	initProperties: function()
	{
		// private property
		this.defineProp('textBuffer', {
			'dataType': 'Kekule.TextLinesBuffer',
			'serializable': false,
			'getter': function()
				{
					var r = this.getPropStoreFieldValue('textBuffer');
					if (!r)
					{
						r = this.createTextBuffer();
						this.setPropStoreFieldValue('textBuffer', r);
					}
					return r;
				},
			'setter': null
		});
	},
	/**
	 * V2000 and V3000 reader has different text formats, so different text buffer class is needed.
	 * @private
	 */
	createTextBuffer: function()
	{
		return new Kekule.TextLinesBuffer();
	}
});

/**
 * Base class of readers to read different MDL blocks (2000 or 3000).
 * @class
 * @augments Kekule.IO.MdlBlockHandler
 */
Kekule.IO.MdlBlockReader = Class.create(Kekule.IO.MdlBlockHandler,
/** @lends Kekule.IO.MdlBlockReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlBlockReader',
	/**
	 * Read a text block and return a suitable object.
	 * @param {Variant} textOrLines String or array of string.
	 * @param {Kekule.ChemObject} parentObj
	 * @returns {Variant}
	 */
	readBlock: function(textOrLines, parentObj)
	{
		if (typeof(textOrLines) == 'string')
			this.getTextBuffer().setText(textOrLines);
		else
			this.getTextBuffer().setLines(textOrLines);
		this.getTextBuffer().reset();
		return this.doReadBlock(this.getTextBuffer());
	},
	/**
	 * Do the actual work of {@link Kekule.IO.MdlBlockReader#readBlock}.
	 * Read content in textBuffer and create suitable object. Descendants should override this method.
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @param {Kekule.ChemObject} parentObj
	 * @private
	 */
	doReadBlock: function(textBuffer, parentObj)
	{
		// do nothing here.
	}
});

/**
 * Base class of writers to write different MDL blocks (2000 or 3000).
 * @class
 * @augments Kekule.IO.MdlBlockHandler
 */
Kekule.IO.MdlBlockWriter = Class.create(Kekule.IO.MdlBlockHandler,
/** @lends Kekule.IO.MdlBlockWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlBlockWriter',
	/**
	 * Write a text block for a suitable object.
	 * @param {Variant} obj Kekule object to write.
	 * @returns {String} Text written.
	 */
	writeBlock: function(obj)
	{
		this.getTextBuffer().clear();
		this.doWriteBlock(obj, this.getTextBuffer());
		return this.getTextBuffer().getText();
	},
	/**
	 * Do the actual work of {@link Kekule.IO.MdlBlockWriter#writeBlock}. Write text to textBuffer.
	 * Read content in textBuffer and create suitable object. Descendants should override this method.
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @param {Variant} obj Kekule object to write.
	 * @private
	 */
	doWriteBlock: function(obj, textBuffer)
	{
		// do nothing here.
	}
});
