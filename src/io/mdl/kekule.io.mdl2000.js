/**
 * @fileoverview
 * File for supporting MDL CTAB/MOL/RXN V2000 data.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.elements.js
 * requires /core/kekule.electrons.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.reactions.js
 * requires /utils/kekule.textHelper.js
 * requires /io/kekule.io.js
 * requires /io/kekule.io.mdlBase.js
 * requires /localization
 */

/**
 * Util methods for MDL 2000 format.
 * @class
 * @private
 */
Kekule.IO.Mdl2kUtils = {
	/**
	 * Turn charge value in CTAB atom line to normal value
	 * @param {Int} value
	 * @returns {Int}
	 * @private
	 */
	atomLineChargeToKekule: function(value)
	{
		switch (value)
		{
			case 1: return 3; break;
			case 2: return 2; break;
			case 3: return 1; break;
			case 5: return -1; break;
			case 6: return -2; break;
			case 7: return -3; break;
			default: return 0;  //0
		}
	},
	/**
	 * Turn normal charge value to value used in CTAB atom line.
	 * @param {Int} value
	 * @returns {Int}
	 * @private
	 */
	chargeToMdlAtomLineValue: function(value)
	{
		switch (value)
		{
			case 1: return 3; break;
			case 2: return 2; break;
			case 3: return 1; break;
			case -1: return 5; break;
			case -2: return 6; break;
			case -3: return 7; break;
			default: return 0;  //0
		}
	},
	/**
	 * If the charge value in atom line is 4, it does not mean a charge but a doublet radical.
	 * @param {Int} value
	 * @returns {Int}
	 * @private
	 */
	atomLineChargeToRadical: function(value)
	{
		if (value == 4)
			return Kekule.RadicalType.DOUBLET;  // doublet radical
		else
			return 0;
	},
	/**
	 * If the radical value 2(doublet), atom line charge value should be 4
	 * @param {Int} value
	 * @returns {Int}
	 * @private
	 */
	radicalToMdlAtomLineValue: function(value)
	{
		return (value == Kekule.RadicalType.DOUBLET)? 4: 0;
	},
	/**
	 * Convert charge and radical to a suitable CHG value in MDL 2k atom line.
	 * @param {Int} charge
	 * @param {Int} radical
	 * @private
	 */
	chargeOrRadicalToMdlAtomLineValue: function(charge, radical)
	{
		if (charge)
			return Kekule.IO.Mdl2kUtils.chargeToMdlAtomLineValue(charge);
		else if (radical)
			return Kekule.IO.Mdl2kUtils.radicalToMdlAtomLineValue(charge);
		else
			return 0;
	},
	/**
	 * Convert a MDL bond stereo value to {@link Kekule.BondStereo} value.
	 * @param {Int} value
	 * @param {Int} bondOrder Note this value is a Kekule order, not a MDL one.
	 * @returns {Int} Value from  {@link Kekule.BondStereo}
	 * @private
	 */
	bondStereoToKekule: function(value, bondOrder)
	{
		if (bondOrder == Kekule.BondOrder.SINGLE)
		{
			switch (value)
			{
				case 1: return Kekule.BondStereo.UP; break;
				case 4: return Kekule.BondStereo.UP_OR_DOWN; break;  // either
				case 6: return Kekule.BondStereo.DOWN; break;
				default: // 0
					return Kekule.BondStereo.NONE;
			}
		}
		else if (bondOrder == Kekule.BondOrder.DOUBLE)
		{
			switch (value)
			{
				case 3: return Kekule.BondStereo.E_Z_BY_COORDINATES; break;  // cis or trans by coord
				default: // 0
					return Kekule.BondStereo.NONE;
			}
		}
		else
			return Kekule.BondStereo.NONE;
	},
	/**
	 * Convert a {@link Kekule.BondStereo} value to MDL bond stereo value in bond line.
	 * @param {Int} value Value from {@link Kekule.BondStereo}.
	 * @param {Int} bondOrder Note this value is a Kekule order, not a MDL one.
	 * @returns {Int}
	 * @private
	 */
	bondStereoToMdlBondLineValue: function(value, bondOrder)
	{
		if (bondOrder == Kekule.BondOrder.SINGLE)
		{
			switch (value)
			{
				case Kekule.BondStereo.UP: return 1;
				case Kekule.BondStereo.UP_OR_DOWN: return 4;
				case Kekule.BondStereo.DOWN: return 6;
				default: // Kekule.BondStereo.NONE
					return 0;
			}
		}
		else if (bondOrder == Kekule.BondOrder.DOUBLE)
		{
			switch (value)
			{
				case Kekule.BondStereo.E_Z_BY_COORDINATES: return 3; // cis or trans by coord
				default: // Kekule.BondStereo.NONE
					return 0;
			}
		}
		else
			return 0;
	},

	/**
	 * Turn a float coordinate value to a MDL V2000 coordinate string.
	 * @param {Float} value
	 * @returns {String}
	 * @private
	 */
	coordToStr: function(value)
	{
		return (value || 0).toFixed(4);
	},

	/**
	 * Get isotope's mass difference used in CTAB 2000 atom block.
	 * @param {Object} isotope
	 * @private
	 */
	getMassDiff: function(isotope)
	{
		var elemInfo = Kekule.ChemicalElementsDataUtil.getElementInfo(isotope.getAtomicNumber());
		var naturalMass = elemInfo.naturalMass;
		return Math.round(isotope.getMassNumber() - naturalMass);
	},

	/**
	 * If node is a {@link Kekule.VariableAtom}, property line need to be add to CTAB.
	 * This method generate such a line.
	 * @param {Kekule.VariableAtom} node
	 * @private
	 */
	getAtomListPropLineValue: function(node)
	{
		// M ALS aaannn e 11112222333344445555...
		// should generate nnn e 11112222333344445555... part
		var s = '';
		var ids = node.getAllowedIsotopeIds();
		if (ids && ids.length) // allow list
			s = ' F ';
		else // disallow list
		{
			s = ' T ';
			ids = node.getDisallowedIsotopeIds();
		}
		if (ids && ids.length)
		{
			var symbols = [];
			for (var i = 0, l = ids.length; i < l; ++i)
			{
				var detail = Kekule.IsotopesDataUtil.getIsotopeIdDetail(ids[i]);
				if (detail && detail.symbol)
					symbols.push(detail.symbol.rpad(4));
			}
			var sSymbols = symbols.join('');
			s = symbols.length.toString().lpad(3) + s + sSymbols;
			return s;
		}
		else // no explicit atoms
			return null;
	},

	/**
	 * Generate leading tag for prop line. Usually 'M  XXX'
	 * @param {String} propName
	 * @param {String} prefix
	 * @private
	 */
	getCtabPropLineTag: function(propName, prefix)
	{
		return (prefix || 'M') + '  ' + propName;
	},
	/**
	 * Generate leading tag with entry count for prop line. Usually 'M  XXXnnn'
	 * @param {String} propName
	 * @param {Int} entryCount
	 * @param {String} prefix
	 * @private
	 */
	getCtabPropLineCountTag: function(propName, entryCount, prefix)
	{
		var r = (prefix || 'M') + '  ' + propName;
		if (entryCount)
			r += (entryCount).toString().lpad(3);
		return r;
	},
	/**
	 * Generate property line string with values.
	 * @param {Array} values
	 * @param {String} propName
	 * @param {Int} entryCount
	 * @param {String} prefix
	 * @private
	 */
	generateCtabPropLine: function(values, propName, entryCount, prefix)
	{
		var tag = Kekule.IO.Mdl2kUtils.getCtabPropLineCountTag(propName, entryCount, prefix);
		return tag + ' ' + values.join(' ');
	}
}

/**
 * Class to read and anaylsis MDL 2000 Connection Table block.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 * @private
 */
Kekule.IO.Mdl2kCTabReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.Mdl2kCTabReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl2kCTabReader',
	/** @private */
	doReadBlock: function(textBuffer, parentObj)
	{
		return this.analysisCTab(textBuffer);
	},
	/**
	 * Analysis the whole ctab
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	analysisCTab: function(textBuffer)
	{
		var result = {};
		// count line
		var line = textBuffer.readLine();
		var countInfo = this.analysisCountLine(line);
		// anaylis table according to countInfo, firstly atom lines
		var atomInfos = [];
		atomInfos.isCoord3D = false;
		for (var i = 0; i < countInfo.atomCount; ++i)
		{
			line = textBuffer.readLine();
			var atomInfo = this.analysisAtomLine(line);
			if (atomInfo.z)  // has z coord, 3D mode
				atomInfos.isCoord3D = true;
			atomInfos.push(atomInfo);
		}
		// then bond lines
		var bondInfos = [];
		for (var i = 0; i < countInfo.bondCount; ++i)
		{
			line = textBuffer.readLine();
			var bondInfo = this.analysisBondLine(line);
			bondInfos.push(bondInfo);
		}
		// then atom list lines
		for (var i = 0; i < countInfo.atomListCount; ++i)
		{
			line = textBuffer.readLine();
			var atomListInfo = this.analysisAtomListInfoLine(line);
			// attach list info to atom
			if (atomInfos[atomListInfo.atomIndex])
			{
				atomInfos[atomListInfo.atomIndex].atomListInfo = atomListInfo;
			}
		}
		// then stext lines, ignore currently.
		// each stext has two lines:
		// xxxxx.xxxxyyyyy.yyyy  - the coordinate
		// TTTT...               - the text
		for (var i = 0; i < countInfo.stextCount; ++i)
		{
			line = textBuffer.readLine();
			line = textBuffer.readLine();
		}
		// all left is properties lines till "M END"
		var sgroupInfos = [];
		while (!textBuffer.eof())
		{
			line = textBuffer.readLine();
			var info = this.analysisPropertyLine(line, atomInfos, sgroupInfos);
			if (info.prop === 'END')  // end of connection table, break;
				break;
			if (info.prop === 'SKP')  // skip lines
			{
				for (var i = 0; i < info.count; ++i)
				{
					if (textBuffer.eof())
						break;
					line = textBuffer.readLine();
				}
			}
			else if (info.leading === 'A')  // atom alias
			{
				if (textBuffer.eof())
					break;
				var atomIndex = info.atomIndex;
				line = textBuffer.readLine();
				//console.log(atomInfos, atomIndex, atomInfos[atomIndex]);
				atomInfos[atomIndex].symbol = line.trim();
			}
		}

		result.countInfo = countInfo;
		result.atomInfos = atomInfos;
		result.bondInfos = bondInfos;
		result.sgInfos = sgroupInfos;

		return result;
	},
	/**
	 * Read count line of CTAB.
	 * @private
	 */
	analysisCountLine: function(line)
	{
		var result = {};
		// line format: aaabbblllfffcccsssxxxrrrpppiiimmmvvvvvv
		// vvvvvv: version flag, check if it is V2000
		var s = line.substr(33, 6).trim();
		if (s && s != Kekule.IO.MDL.VER2000) // wrong version flag, it may be not a CTAB 2000, raise exception
		  // Note: sometime Version mark may be missing (s is empty), assume V2000
		{
			Kekule.error(/*Kekule.ErrorMsg.NOT_MDL2000_FORMAT_DATA*/Kekule.$L('ErrorMsg.NOT_MDL2000_FORMAT_DATA'));
			return null;
		}
		// aaa: number of atoms
		s = line.substr(0, 3);
		result.atomCount = parseInt(s, 10);
		// bbb: number of bonds
		s = line.substr(3, 3);
		result.bondCount = parseInt(s, 10);
		// lll: atomList count, used for query, currently bypass
		// fff: obsolete
		// ccc: chiral flag: 0=not chiral, 1=chiral
		s = line.substr(12, 3);
		result.isChiral = (parseInt(s, 10) != 0);
		// sss: number of stext entries (for ISIS/Desktop)
		s = line.substr(15, 3);
		result.stextCount = parseInt(s, 10);
		// xxxrrrpppiii: obsolete
		// mmm: No longer supported, the default is set to 999, ignore here
		return result;
	},
	/**
	 * Analysis a line of atom block in CTAB.
	 * @return {Hash} Info about this atom.
	 * @private
	 */
	analysisAtomLine: function(line)
	{
		var result = {};
		// line format: xxxxx.xxxxyyyyy.yyyyzzzzz.zzzz aaaddcccssshhhbbbvvvHHHrrriiimmmnnneee
		// xxxxx.xxxxyyyyy.yyyyzzzzz.zzzz: x,y,z-coord
		var s = line.substr(0, 10);
		result.x = parseFloat(s);
		s = line.substr(10, 10);
		result.y = parseFloat(s);
		s = line.substr(20, 10);
		result.z = parseFloat(s);
		// aaa: atom symbol
		s = line.substr(31, 3);
		result.symbol = s.trim();
		// dd: mass difference
		s = line.substr(34, 2);
		result.massDiff = parseInt(s, 10);
		// ccc: charge
		s = line.substr(36, 3);
		var i = parseInt(s, 10);
		var rad = Kekule.IO.Mdl2kUtils.atomLineChargeToRadical(i);
		if (rad)  // ccc is 4, means doublet radical
			result.radical = rad;
		else  // ccc is charge
			result.charge = Kekule.IO.Mdl2kUtils.atomLineChargeToKekule(i);
		// sss: atom stereo parity
		s = line.substr(39, 3);
		var i = parseInt(s, 10);
		if (i)
			result.parity = i;
		//s = line.substr(39, 3);
		// hhh: hydrogen count + 1, used for query. Need to be handled here????
		s = line.substr(42, 3);
		var i = parseInt(s, 10);
		if (i > 0)
			result.hydrongenCount = i - 1;
		// bbb: stereo care box, used for query, ignore
		// vvv:
		// TODO: valence, ignore here
		// HHH: H0 designator, 0 = not specified, 1 = no H atoms allowed, ignored
		// rrriii: not used
		// mmm: atom-atom mapping number, used for reaction, ignored currently
		// nnn: inversion/retention flag, used for reaction, ignored currently
		// eee: exact change flag, 0 = property not applied, 1 = change on atom must be exactly as shown
		  // used for reaction or query, ignored currrenly
		return result;
	},
	/**
	 * Analysis a line of bond block in CTAB.
	 * @return {Hash} Info about this bond.
	 * @private
	 */
	analysisBondLine: function(line)
	{
		var result = {};
		// line format: 111222tttsssxxxrrrccc
		// 111222: first and second atom number
		var s = line.substr(0, 3);
		result.atomIndex1 = parseInt(s, 10) - 1;
		s = line.substr(3, 3);
		result.atomIndex2 = parseInt(s, 10) - 1;
		//ttt: bond type
		s = line.substr(6, 3);
		result.order = Kekule.IO.MdlUtils.bondTypeToKekuleOrder(parseInt(s, 10));
		//sss: bond stereo
		s = line.substr(9, 3);
		var stereo = Kekule.IO.Mdl2kUtils.bondStereoToKekule(parseInt(s, 10), result.order);
		if (stereo)
			result.stereo = stereo;
		// xxx: not used
		// rrr: bond topology, 0 = Either, 1 = Ring, 2 = Chain, SSS queries only, ignored
		// ccc: reacting center status, for reaction and query, ignored
		return result;
	},
	/**
	 * Analysis a line of atom list block in CTAB.
	 * @return {Hash} Info about this atom list.
	 * @private
	 */
	analysisAtomListInfoLine: function(line)
	{
		var result = {};
		// line format: aaa kSSSSn 111 222 333 444 555
		// aaa: number of atom (L) where list is attached
		var s = line.substr(0, 3);
		result.atomIndex = parseInt(s, 10) - 1;
		// k: = T = [NOT] list, = F = normal list
		s = line.substr(4, 1);
		result.isAllowList = (s.toLowerCase() == 'f');
		// SSSS: space
		// n: number of entries in list, max is 5
		s = line.substr(9, 1);
		var entryCount = Math.min(parseInt(s, 10), 5);
		// 111 222 333 444 555: atomic number of each atom on the list
		result.atomicNumbers = [];
		var start = 11;
		for (var i = 0; i < entryCount; ++i)
		{
			start += 4 * i;
			s = line.substr(start, 3);
			var atomicNumber = parseInt(s, 10);
			if (atomicNumber)
				result.atomicNumbers.push(atomicNumber);
		}
		return result;
	},
	/**
	 * Analysis a line of properties block in CTAB.
	 * @param {String} line
	 * @param {Array} atomInfos Atom info array read from atom block
	 * @param {Array} sgroupInfos Sgroup info that may be filled in property list.
	 * @return {Hash} Info about this property.
	 * @private
	 */
	analysisPropertyLine: function(line, atomInfos, sgroupInfos)
	{
		var result = {};
		// generally the line has a "M  XXXnnx aaa" start, but A aaa, V aaa, G aaa or S SKPnnn is also legal.
		var slead = line.substr(0, 1);
		result.leading = slead;

		if (slead == 'M')
		{
			var spropId = line.substr(3, 3).trim();
			result.prop = spropId;
			var atomIndex, sgIndex, sgInfo;
			if (spropId === 'END')  // M END
			{
				return result;
			}
			if (['CHG', 'RAD', 'ISO'].indexOf(spropId) >= 0) // these tags may contain multiple entries in a line
			{
				var entryCount = parseInt(line.substr(6, 3).trim());
				result.entryCount = entryCount;
				result.entries = [];
				propName = (spropId === 'CHG')? 'charge':
					(spropId === 'RAD')? 'radical':
					'massNumber';

				var currPos = 10;
				for (var i = 0; i < entryCount; ++i)
				{
					var atomIndex = parseInt(line.substr(currPos, 3).trim(), 10) - 1;
					var propValue = parseInt(line.substr(currPos + 4, 3).trim(), 10);
					//console.log(atomIndex, propName, propValue, atomInfos[atomIndex]);
					currPos += 8;
					result.entries.push({'atomIndex': atomIndex, propName: propValue});
					atomInfos[atomIndex][propName] = propValue;
				}
				//console.log(atomInfos);

				/*
				var satom = line.substr(10, 3).trim();
				atomIndex = parseInt(satom, 10) - 1;
				result.atomIndex = atomIndex;
				*/
			}
			else if (['STY', 'SLB'].indexOf(spropId) >= 0)
			{
				sgIndex = parseInt(line.substr(10, 3), 10) - 1;
				sgInfo = sgroupInfos[sgIndex];
			}
			else if (['SAL', 'SBL', 'SMT', 'SCL', 'SAP', 'SBV'].indexOf(spropId) >= 0)
			{
				sgIndex = parseInt(line.substr(7, 3), 10) - 1;
				sgInfo = sgroupInfos[sgIndex];
			}
			/*
			var svalues = [];
			for (var i = 0; i < entryCount; ++i)
			{
				var svalue = line.substr(14 + i * 4, 3).trim();
				svalues.push(svalue);
			}
			*/

			var valueStart = 14;  // start position of actual infos
			switch (spropId)
			{
				/*
				case 'CHG':  // charge
					{
						result.charge = parseInt(line.substr(valueStart, 3).trim(), 10);
						atomInfos[atomIndex].charge = result.charge;
						break;
					}
				case 'RAD':  // radical
					{
						result.radical = parseInt(line.substr(valueStart, 3).trim(), 10);
						atomInfos[atomIndex].radical = Kekule.IO.MdlUtils.mdlRadicalToKekule(result.radical);
						break;
					}
				case 'ISO':  // isotope
					{
						result.massNumber = parseInt(line.substr(valueStart, 3).trim(), 10);
						atomInfos[atomIndex].massNumber = result.massNumber;
						break;
					}
				*/
				case 'ALS':  // atom list
					{
						var atomListInfo = {};
						var satom = line.substr(7, 3).trim();
						atomListInfo.atomIndex = parseInt(satom, 10) - 1;
						result.atomIndex = atomListInfo.atomIndex;
						//var count = parseInt(Math.min(line.substr(10, 3), 16));
						var count = parseInt(line.substr(10, 3));  // allow more than 16 (unstandard data)
						var s = line.substr(14, 1);
						atomListInfo.isAllowList = (s.toLowerCase() == 'f');
						atomListInfo.symbols = [];
						for (var i = 0; i < count; ++i)
						{
							s = line.substr(16 + i * 4, 4).trim();
							atomListInfo.symbols.push(s);
						}
						result.atomListInfo = atomListInfo;
						// may be there is ALS line for atomIndex before...
						var oldAtomListInfo = atomInfos[atomListInfo.atomIndex].atomListInfo;
						if (!oldAtomListInfo)
							atomInfos[atomListInfo.atomIndex].atomListInfo = atomListInfo;
						else  // merge old and new
						{
							if (oldAtomListInfo.isAllowList !== atomListInfo.isAllowList)  // can not merge, overwrite
								atomInfos[atomListInfo.atomIndex].atomListInfo = atomListInfo;
							else  // merge
							{
								oldAtomListInfo.symbols = Kekule.ArrayUtils.pushUnique(oldAtomListInfo.symbols, atomListInfo.symbols);
							}
						}
						break;
					}
				/*
				case 'APO':  // attach point for RGroup, M  APOnn2 aaa vvv, ignored currently
				case 'AAL':  // Atom Attachment Order, M  AAL aaann2 111 v1v 222 v2v, ignored currently
				case 'RGP':  // Rgroup Label Location, M  RGPnn8 aaa rrr, ignored
				case 'LOG':  // Rgroup Logic, Unsatisfied Sites, Range of Occurrence. ignored
				case 'SST':  // Sgroup Subtype, M  SSTnn8 sss ttt, ignored
				case 'SCN':  // Sgroup Connectivity, M  SCNnn8 sss ttt, ignored
				case 'SDS':  // Sgroup Expansion, M  SDS EXPn15 sss ..., ignored
				case 'SPA':  // Multiple Group Parent Atom List, M SPA sssn15 aaa ..., ignored
				// ... a packs of Sgroup properties are ignored
					{
						break;
					}
				*/
				case 'STY':  // Sgroup type, M  STYnn8 sss ttt, only handle SUP (abbreviation Sgroup)
					{
						//var sgIndex = parseInt(line.substr(10, 3), 10) - 1;
						var sgType = line.substr(14, 3);
						if (sgType == 'SUP')
						{
							sgroupInfos[sgIndex] = {'sgType': 'SUP'};
						}
						break;
					}
				case 'SLB':  // Sgroup Labels, M  SLBnn8 sss vvv
					{
						//var sgIndex = parseInt(line.substr(10, 3), 10) - 1;
						//var sgInfo = sgroupInfos[sgIndex];
						if (sgInfo)
							sgInfo.labelId = line.substr(14).trim();
						break;
					}
				case 'SAL':  // Sgroup Atom List, M  SAL sssn15 aaa ...
					{
						//var sgIndex = parseInt(line.substr(7, 3), 10) - 1;
						//var sgInfo = sgroupInfos[sgIndex];
						if (sgInfo)
						{
							//var atomCount = parseInt(Math.min(line.substr(10, 3), 15));
							var atomCount = parseInt(line.substr(10, 3));  // allow non-standard format (more than 15)
							if (!sgInfo.atomIndexes) // maybe sg atomIndexes is already created when file has more than one SAL lines
								sgInfo.atomIndexes = [];
							for (var i = 0; i < atomCount; ++i)
							{
								var s = line.substr(14 + i * 4, 3);
								var atomIndex = parseInt(s) - 1;
								sgInfo.atomIndexes.push(atomIndex);
							}
							//console.log('SAL', atomCount, sgInfo.atomIndexes);
						}
						break;
					}
				case 'SBL':  // Sgroup Bond List, M  SBL sssn15 bbb ...  // bond connect to group
					{
						//var sgIndex = parseInt(line.substr(7, 3), 10) - 1;
						//var sgInfo = sgroupInfos[sgIndex];
						if (sgInfo && (sgInfo.sgType == 'SUP'))
						{
							//var bondCount = parseInt(Math.min(line.substr(10, 3), 15));
							var bondCount = parseInt(line.substr(10, 3));  // allow more than 15 one (unstandard when reading)
							if (!sgInfo.crossBondIndexes) // maybe sg xbond indexes is already created when file has more than one SBL lines
								sgInfo.crossBondIndexes = [];
							for (var i = 0; i < bondCount; ++i)
							{
								var s = line.substr(14 + i * 4, 3);
								var bondIndex = parseInt(s) - 1;
								sgInfo.crossBondIndexes.push(bondIndex);
							}
						}
						break;
					}
				case 'SMT':  // Sgroup Subscript, M  SMT sss m...
					{
						//var sgIndex = parseInt(line.substr(7, 3), 10) - 1;
						//var sgInfo = sgroupInfos[sgIndex];
						if (sgInfo)
						{
							if (sgInfo.sgType == 'SUP')
								sgInfo.label = line.substr(11).trim();
							else
								sgInfo.subscript = line.substr(11).trim();
						}
						break;
					}
				case 'SCL':  // Abbreviation Sgroup Class, M SCL sss d...
					{
						if (sgInfo)
						{
							sgInfo.sgClass = line.substr(11).trim();
						}
						break;
					}
				case 'SBV':  // Abbreviation Sgroup Bond and Vector Information, M  SBV sss bb1 x1 y1
					{
						if (sgInfo)
						{
							var vecBondIndex = parseInt(line.substr(11, 3), 10) - 1;
							vectorX = parseFloat(line.substr(14, 10));
							vectorY = parseFloat(line.substr(24, 10));
							if (!sgInfo.bondVectors)
								sgInfo.bondVectors = [];
							sgInfo.bondVectors[vecBondIndex] = {
								'bondIndex': vecBondIndex,
								'x': vectorX,
								'y': vectorY
							};
							var sz = line.substr(34, 10).trim();
							if (sz)
							{
								vectorZ = parseFloat(sz) || 0;
								sgInfo.bondVectors[vecBondIndex].z = vectorZ;
							}
						}
						break;
					}
				/*
				case 'SAP':  // Abbreviation Sgroup Attachment Point, M  SAP sssnn6 iii ooo cc, how to handled?
					{
						break;
					}
				case '$3D':  // M  $3Dnnn, 3D property, how to handled?
					{
						break;
					}
				case 'END':  // end of block
					{
						// do nothing
						break;
					}
				*/
			}
		}
		else if (slead === 'A')  // atom alias in ISIS Draw
		{
			var currPos = 3;
			var atomIndex = parseInt(line.substr(currPos, 3).trim(), 10) - 1;
			//result.prop = 'A';
			result.atomIndex = atomIndex;
		}
		else if (slead === 'V')  // atom value in ISIS Draw, ignored
		{

		}
		else if (slead === 'G')  // TODO: Group abbreviation in ISIS Draw, currently ignored
		{

		}
		else if (slead === 'S')  // S  SKPnnn, skip tag
		{
			var spropId = line.substr(3, 3).trim();
			result.prop = spropId;
			result.count = parseInt(line.substr(6, 3), 10);
		}
		return result;
	}
});

/**
 * Class to write MDL 3000 Connection Table block.
 * @class
 * @augments Kekule.IO.Mdl3kBlockWriter
 * @private
 */
Kekule.IO.Mdl2kCTabWriter = Class.create(Kekule.IO.MdlBlockWriter,
/** @lends Kekule.IO.Mdl2kCTabWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl2kCTabWriter',
	/** @constructs */
	initialize: function($super, coordMode)
	{
		$super();
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('coordMode', {'dataType': DataType.INT, 'deaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	doWriteBlock: function(obj, textBuffer)
	{
		Kekule.IO.MdlUtils.assertIlegalForCtabOutput(obj);
		return this.outputCtab(obj, textBuffer);
	},
	/**
	 * Output atoms and bonds in molecule to text data.
	 * @param {Kekule.StructureFragment} mol
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	outputCtab: function(mol, textBuffer)
	{
		var atomPropLines = [];
		var molInfo = Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo(mol);
		// decide coordMode
		if (this.getCoordMode() != Kekule.CoordMode.UNKNOWN)
			molInfo.coordMode = this.getCoordMode();
		// count line
		textBuffer.writeLine(this.generateCountLine(molInfo));
		// atom block
		this.outputAtomBlock(mol, molInfo, textBuffer, atomPropLines);
		// bond block
		this.outputBondBlock(mol, molInfo, textBuffer);
		// property lines
		if (atomPropLines.length)
		{
			for (var i = 0, l = atomPropLines.length; i < l; ++i)
				textBuffer.writeLine(atomPropLines[i]);
		}
		// subgroup property lines
		this.outputSubgroupsPropLines(mol, molInfo, textBuffer);
		textBuffer.writeLine(Kekule.IO.Mdl2kUtils.getCtabPropLineTag('END'));  // property line end
		/*
		this.outputPropertyLines(mol, molInfo, textBuffer);
		*/
	},
	/**
	 * Generate count line string of molecule.
	 * @param {Hash} molInfo Info returned by {@link Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo}.
	 * @returns {String}
	 * @private
	 */
	generateCountLine: function(molInfo)
	{
		/*
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
		*/
		return Kekule.IO.MdlStructureUtils.generateClassicStyleCountLine(molInfo, Kekule.IO.MdlVersion.V2000);
	},
	/**
	 * Output atom block to textBuffer.
	 * Isotope, charge, radical and so on also need to output extra property line,
	 * those lines are pused into atomPropLines param.
	 * @private
	 */
	outputAtomBlock: function(mol, molInfo, textBuffer, atomPropLines)
	{
		for (var i = 0, l = molInfo.atoms.length; i < l; ++i)
		{
			var atom = molInfo.atoms[i];
			var line = this.generateAtomLine(i, molInfo.coordMode, atom, atomPropLines);
			textBuffer.writeLine(line);
		}
	},
	/**
	 * Generate a line about atom in atom block.
	 * Isotope, charge, radical and so on also need to output extra property line,
	 * those lines are pused into atomPropLines param.
	 * @private
	 */
	generateAtomLine: function(index, coordMode, atom, atomPropLines)
	{
		// Coordinate convert function
		var cf = Kekule.IO.Mdl2kUtils.coordToStr;
		var s = '';
		var sAtomIndex = (index + 1).toString().lpad(3);
		// format: xxxxx.xxxxyyyyy.yyyyzzzzz.zzzz aaaddcccssshhhbbbvvvHHHrrriiimmmnnneee
		// xxxxx.xxxxyyyyy.yyyyzzzzz.zzzz: x,y,z-coord
		var coord = (coordMode == Kekule.CoordMode.COORD3D)? atom.getAbsCoord3D(): atom.getAbsCoord2D();
		s += cf(coord.x).lpad(10) + cf(coord.y).lpad(10) + cf(coord.z).lpad(10);
		// aaa: atom symbol
		s += ' ' + Kekule.IO.MdlStructureUtils.getAtomTypeStr(atom, true).rpad(3);  // 2k mode
		if (Kekule.IO.MdlStructureUtils.isNodeVariableAtom(atom))  // atom list need additional property line
		{
			// M  ALS aaannn e 11112222333344445555...
			var satomList = Kekule.IO.Mdl2kUtils.getAtomListPropLineValue(atom);
			if (satomList)
			{
				var propLine = Kekule.IO.Mdl2kUtils.getCtabPropLineTag('ALS') + ' ' + sAtomIndex + satomList;
				atomPropLines.push(propLine);
			}
		}
		// dd: mass difference
		if (atom.getMassNumber && atom.getMassNumber())
		{
			var massDiff = Kekule.IO.Mdl2kUtils.getMassDiff(atom.getIsotope()) || 0;
			  // the node has massNumber property must have isotope
			s += massDiff.toString().lpad(2);
			//M  ISOnn8 aaa vvv
			var propLine = Kekule.IO.Mdl2kUtils.generateCtabPropLine(
				[sAtomIndex, atom.getMassNumber().toString().lpad(3)],
				'ISO', 1);
			atomPropLines.push(propLine);
		}
		else
			s += '0'.lpad(2);
		// ccc: charge
		s += Kekule.IO.Mdl2kUtils.chargeOrRadicalToMdlAtomLineValue(
				atom.getCharge? atom.getCharge(): null,
				atom.getRadical? atom.getRadical(): null
			).toString().lpad(3);
		if (atom.getCharge && atom.getCharge())
		{
			//M  CHGnn8 aaa vvv ...
			var propLine = Kekule.IO.Mdl2kUtils.generateCtabPropLine(
				[sAtomIndex, atom.getCharge().toString().lpad(3)],
				'CHG', 1);
			atomPropLines.push(propLine);
		}
		if (atom.getRadical && atom.getRadical())
		{
			//M  RADnn8 aaa vvv
			var propLine = Kekule.IO.Mdl2kUtils.generateCtabPropLine(
				[sAtomIndex, Kekule.IO.MdlUtils.kekuleRadicalToMdl(atom.getRadical()).toString().lpad(3)],
				'RAD', 1);
			atomPropLines.push(propLine);
		}
		// sss: atom stereo parity
		var parity = atom.getParity? (atom.getParity() || 0): 0;
		s += parity.toString().lpad(3);
		// hhh: hydrogen count + 1, used for query. Need to be handled here????
		var hcount = atom.getExplicitHydrogenCount? atom.getExplicitHydrogenCount(): null;
		var shcount = Kekule.ObjUtils.isUnset(hcount)? '0': (hcount + 1).toString();
		s += shcount.lpad(3);
		/*
		// bbb: stereo care box, used for query, ignore
		s += '0'.lpad(3);
		// vvv: valence, ignore here
		s += '0'.lpad(3);
		// HHH: H0 designator, 0 = not specified, 1 = no H atoms allowed, ignored
		s += '0'.lpad(3);
		// rrriii: not used
		s += '0'.lpad(3);
		s += '0'.lpad(3);
		// mmm: atom-atom mapping number, used for reaction, ignored currently
		s += '0'.lpad(3);
		// nnn: inversion/retention flag, used for reaction, ignored currently
		s += '0'.lpad(3);
		// eee: exact change flag, 0 = property not applied, 1 = change on atom must be exactly as shown
		// used for reaction or query, ignored currrenly
		s += '0'.lpad(3);
		*/
		for (var i = 0, sfill = '0'.lpad(3); i < 8; ++i)
			s += sfill;
		return s;
	},
	/**
	 * Output bond block to textBuffer.
	 * @private
	 */
	outputBondBlock: function(mol, molInfo, textBuffer)
	{
		for (var i = 0, l = molInfo.bonds.length; i < l; ++i)
		{
			var bond = molInfo.bonds[i];
			var line = this.generateBondLine(i, bond, molInfo.atoms);
			textBuffer.writeLine(line);
		}
	},
	/**
	 * Generate a line about bond in bond block.
	 * @private
	 */
	generateBondLine: function(index, bond, atomList)
	{
		var s = '';
		// format: 111222tttsssxxxrrrccc
		// 111222: first and second atom number
		var nodeGroup = Kekule.IO.MdlStructureUtils.splitConnectedNodes(bond);
		s += (atomList.indexOf(nodeGroup.primaryNodes[0]) + 1).toString().lpad(3);
		s += (atomList.indexOf(nodeGroup.primaryNodes[1]) + 1).toString().lpad(3);
		//ttt: bond type
		if (bond.getBondOrder)
			s += Kekule.IO.MdlUtils.kekuleBondOrderToMdlType(bond.getBondOrder()).toString().lpad(3);
		else
			s += '0'.lpad(3);
		//sss: bond stereo
		if (bond.getStereo && bond.getBondOrder)
			s += Kekule.IO.Mdl2kUtils.bondStereoToMdlBondLineValue(bond.getStereo(), bond.getBondOrder()).toString().lpad(3);
		else
			s += '0'.lpad(3);
		// xxx: not used
		s += '0'.lpad(3);
		// rrr: bond topology, 0 = Either, 1 = Ring, 2 = Chain, SSS queries only, ignored
		s += '0'.lpad(3);
		// ccc: reacting center status, for reaction and query, ignored
		s += '0'.lpad(3);

		return s;
	},
	/**
	 * Output property line about subgroups to textBuffer.
	 * @private
	 */
	outputSubgroupsPropLines: function(mol, molInfo, textBuffer)
	{
		// sub-group (super-atom)
		for (var i = 0, l = molInfo.subGroups.length; i < l; ++i)
		{
			var lines = this.generateSgroupLines(i, molInfo.subGroups[i], molInfo);
			for (var j = 0, k = lines.length; j < k; ++j)
				textBuffer.writeLine(lines[j]);
		}
	},
	/**
	 * Generate lines about sub-group in Sgroup property line block.
	 * @private
	 */
	generateSgroupLines: function(index, subGroup, molInfo)
	{
		var result = [];
		var sIndex = (index + 1).toString().lpad(3);
		// STY, type: M  STYnn8 sss ttt ...
		var s = Kekule.IO.Mdl2kUtils.generateCtabPropLine([sIndex, 'SUP'], 'STY', 1);
		result.push(s);
		// SLB, Sgroup Labels, M  SLBnn8 sss vvv
		s = Kekule.IO.Mdl2kUtils.generateCtabPropLine([sIndex, sIndex], 'SLB', 1);
		result.push(s);
		// SMT, Sgroup Subscript, M  SMT sss m...
		/*
		var slabel = subGroup.getAbbr?
			subGroup.getAbbr(): (
				subGroup.getName? subGroup.getName(): null
			);
		*/
		var slabel = (subGroup.getAbbr && subGroup.getAbbr())
				|| (subGroup.getFormulaText && subGroup.getFormulaText())
				|| (subGroup.getName && subGroup.getName());
		if (slabel)
		{
			s = Kekule.IO.Mdl2kUtils.generateCtabPropLine([sIndex, slabel], 'SMT');
			result.push(s);
		}
		// SAL, Sgroup Atom List, M  SAL sssn15 aaa ...
		var atomIndexes = [];
		var atoms = subGroup.getLeafNodes();
		for (var i = 0, l = atoms.length; i < l; ++i)
		{
			var index = molInfo.atoms.indexOf(atoms[i]);
			if (index >= 0)
				atomIndexes.push((index + 1).toString().lpad(3));
		}
		atomIndexes = atomIndexes.sort();
		// maxium of 15 atoms are allowed in one line
		var atomIndexGroups = Kekule.ArrayUtils.divide(atomIndexes, 15);
		for (var i = 0, l = atomIndexGroups.length; i < l; ++i)
		{
			var subAtomIndexes = atomIndexGroups[i];
			s = Kekule.IO.Mdl2kUtils.getCtabPropLineTag('SAL') + ' '
					+ sIndex + subAtomIndexes.length.toString().lpad(3) + ' ' + subAtomIndexes.join(' ');
			result.push(s);
		}
		// SBL, Sgroup xbond List, M  SBL sssn15 bbb
		// SBV, Abbreviation Sgroup Bond and Vector Information, M  SBV sss bb1 x1 y1
		var xbonds = subGroup.getCrossConnectors();
		var xbondIndexes = [];
		var xbondVectors = [];
		var cf = Kekule.IO.Mdl2kUtils.coordToStr;
		for (var i = 0, l = xbonds.length; i < l; ++i)
		{
			var index = molInfo.bonds.indexOf(xbonds[i]);
			if (index >= 0)
			{
				xbondIndexes.push((index + 1).toString().lpad(3));
				// vector: bondIndex, x,y z
				var vectorArray = [index + 1];  // index
				// vector x/y/z calculation
				var nodeGroup = Kekule.IO.MdlStructureUtils.splitConnectedNodes(xbonds[i]);
				var atoms = nodeGroup.primaryNodes;
				var vector = {};
				if (atoms.length == 2)
				{
					if (molInfo.coordMode == Kekule.CoordMode.COORD2D)
					{
						vector = Kekule.CoordUtils.substract(atoms[0].getAbsCoord2D(), atoms[1].getAbsCoord2D());
						vectorArray = vectorArray.concat([cf(vector.x).lpad(10), cf(vector.y).lpad(10)]);
					}
					else
					{
						vector = Kekule.CoordUtils.substract(atoms[0].getAbsCoord3D(), atoms[1].getAbsCoord3D());
						vectorArray = vectorArray.concat([cf(vector.x), cf(vector.y), cf(vector.z)]);
					}
				}
				xbondVectors.push(vectorArray);
			}
		}
		xbondIndexes = xbondIndexes.sort();
		// SBL M  SBL sssn15 bbb
		// maxium of 15 atoms are allowed in one line
		var xbondIndexGroups = Kekule.ArrayUtils.divide(xbondIndexes, 15);
		for (var i = 0, l = xbondIndexGroups.length; i < l; ++i)
		{
			var subXbondIndexes = xbondIndexGroups[i];
			s = Kekule.IO.Mdl2kUtils.getCtabPropLineTag('SBL') + ' '
					+ sIndex + subXbondIndexes.length.toString().lpad(3) + ' ' + subXbondIndexes.join(' ');
			result.push(s);
		}
		// SBV M  SBV sss bb1 x1 y1
		for (var i = 0, l = xbondVectors.length; i < l; ++i)
		{
			var vectorIndex = xbondVectors[i].shift();
			var sVectors = xbondVectors[i].join('');
			s = Kekule.IO.Mdl2kUtils.getCtabPropLineTag('SBV') + ' '
				+ sIndex + ' ' + vectorIndex.toString().lpad(3) + sVectors;
			result.push(s);
		}
		return result;
	}
});