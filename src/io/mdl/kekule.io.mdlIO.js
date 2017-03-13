/**
 * @fileoverview
 * Reader and Writer classes for MDL V2000 and V3000 formats.
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
 * requires /io/mdl/kekule.io.mdlBase.js
 * requires /io/mdl/kekule.io.mdl2000.js
 * requires /io/mdl/kekule.io.mdl3000.js
 * requires /localization
 */

/*
 * Default options to read/write CML format data.
 * @object
 */
Kekule.globalOptions.add('IO.mdl', {
	mdlVersion: Kekule.IO.MdlVersion.V2000,
	coordMode: Kekule.CoordMode.UNKNOWN
});

/**
 * Class to read and anaylsis MDL 2000 / 3000 Connection Table block.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 * @private
 */
Kekule.IO.MdlStructureFragmentReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.MdlStructureFragmentReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlStructureFragmentReader',
	/** @constructs */
	initialize: function($super, coordMode)
	{
		$super();
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	createFragment: function(parentObj)
	{
		// descendants should override this.
	},
	/** @private */
	createCtabReader: function(mdlVersion)
	{
		if (mdlVersion == Kekule.IO.MdlVersion.V3000)
			return new Kekule.IO.Mdl3kCTabReader();
		else
			return new Kekule.IO.Mdl2kCTabReader();
	},
	/** @private */
	getCtabVersion: function(textBuffer)
	{
		var pos = textBuffer.getCurrLineNo();
		var line = textBuffer.readLine();
		textBuffer.setCurrLineNo(pos);
		// check version tag at the end of line
		var s = line.substr(33, 6).trim();
		if (s == 'V3000')
			return Kekule.IO.MdlVersion.V3000;
		else if (s == 'V2000')
			return Kekule.IO.MdlVersion.V2000;
		else  // wrong version flag, it may be a CTAB 2000
		{
			//Kekule.error(Kekule.ErrorMsg.NOT_MDL_FORMAT_DATA);
			//return null;
			return Kekule.IO.MdlVersion.V2000;
		}
	},
	/**
	 * Create CTab of fragment by ctabInfo JSON data.
	 * @param {Kekule.StructureFragment} fragment
	 * @param {Hash} ctabInfo
	 * @returns {Kekule.StructureConnectionTable}
	 * @private
	 */
	createStructureFromJson: function(ctabInfo, parentObj)
	{
		var fragment = this.createFragment();
		if (fragment)
			Kekule.IO.MdlStructureUtils.fillFragment(fragment, ctabInfo, this.getCoordMode());
		return fragment;
	},
	/** @private */
	doReadBlock: function($super, textBuffer, parentObj)
	{
		// check ctab format, V2000 or V3000
		var version = this.getCtabVersion(textBuffer);
		if (!version)
			return null;
		/*
		var buffer = (version == Kekule.IO.MdlVersion.V2000)? textBuffer:
		  new Kekule.IO.Mdl3kTextBuffer(textBuffer.getLines());  // V3000 need different type of text buffer
		*/
		var ctabReader = this.createCtabReader(version);
		/*
		if (version == Kekule.IO.MdlVersion.V3000)
			var ctabInfo = ctabReader.readBlock(textBuffer.getText(), parentObj);
		else
			var ctabInfo = ctabReader.doReadBlock(buffer, parentObj);
		*/
		//var ctabInfo = ctabReader.readBlock(textBuffer.getUnreadLines(), parentObj);
		var ctabInfo = ctabReader.doReadBlock(textBuffer, parentObj);
		if (ctabInfo.atomInfos.coordMode)
			this._forceCoordMode = ctabInfo.atomInfos.coordMode;
		var result = this.createStructureFromJson(ctabInfo, parentObj);
		return result;
	}
});

/**
 * Class to write a {@link Kekule.StructureFragment} to MDL 2000 / 3000 Connection Table block.
 * @class
 * @augments Kekule.IO.MdlBlockWriter
 * @private
 */
Kekule.IO.MdlStructureFragmentWriter = Class.create(Kekule.IO.MdlBlockWriter,
/** @lends Kekule.IO.MdlStructureFragmentWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlStructureFragmentWriter',
	/** @constructs */
	initialize: function($super, version, coordMode)
	{
		$super();
		this.setMdlVersion(version || Kekule.IO.MdlVersion.V2000);
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mdlVersion', {'dataType': DataType.INT, 'defaultValue': Kekule.IO.MdlVersion.V2000});
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	createCtabWriter: function(mdlVersion)
	{
		if (mdlVersion == Kekule.IO.MdlVersion.V3000)
			return new Kekule.IO.Mdl3kCTabWriter(this.getCoordMode());
		else
			return new Kekule.IO.Mdl2kCTabWriter(this.getCoordMode());
	},
	/** @private */
	doWriteBlock: function($super, obj, textBuffer)
	{
		var ctabWriter = this.createCtabWriter(this.getMdlVersion());
		var text = ctabWriter.writeBlock(obj);
		textBuffer.writeText(text);
	}
});

/**
 * Directly read CTab block of MDL 3000 MOL file.
 * First 4 lines of MDL 3000 MOL file are for backward compatibility and has little use.
 * So this reader skips them and read CTAB block directly.
 * @class
 * @augments Kekule.IO.MdlStructureFragmentReader
 * @private
 */
Kekule.IO.Mdl3kMoleculeCTabReader = Class.create(Kekule.IO.MdlStructureFragmentReader,
/** @lends Kekule.IO.Mdl3kMoleculeCTabReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kMoleculeCTabReader',
	/** @private */
	createFragment: function(parentObj)
	{
		return new Kekule.Molecule();
	},
	/** @private */
	doReadBlock: function($super, textBuffer, parentObj)
	{
		var ctabReader = this.createCtabReader(Kekule.IO.MdlVersion.V3000);
		//var ctabInfo = ctabReader.readBlock(textBuffer.getUnreadLines(), parentObj);
		var ctabInfo = ctabReader.doReadBlock(textBuffer, parentObj);
		return this.createStructureFromJson(ctabInfo, parentObj);
	}
});

/**
 * Directly write CTab block of MDL 3000 MOL file.
 * First 4 lines of MDL 3000 MOL file are for backward compatibility and has little use.
 * So this writer skips them and write CTAB block directly.
 * @class
 * @augments Kekule.IO.MdlStructureFragmentWriter
 * @private
 */
Kekule.IO.Mdl3kMoleculeCTabWriter = Class.create(Kekule.IO.MdlStructureFragmentWriter,
/** @lends Kekule.IO.Mdl3kMoleculeCTabWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kMoleculeCTabWriter',
	/** @constructs */
	initialize: function($super, coordMode)
	{
		$super(Kekule.IO.MdlVersion.V3000, coordMode);
	},
	/** @private */
	doWriteBlock: function($super, obj, textBuffer)
	{
		var ctabWriter = new Kekule.IO.Mdl3kCTabWriter(this.getCoordMode());;
		var text = ctabWriter.writeBlock(obj);
		textBuffer.writeText(text);
	}
});


/**
 * Class to read and anaylsis MDL MOL 2000/3000 data and create Molecule.
 * @class
 * @augments Kekule.IO.MdlStructureFragmentReader
 */
Kekule.IO.MdlMoleculeReader = Class.create(Kekule.IO.MdlStructureFragmentReader,
/** @lends Kekule.IO.MdlMoleculeReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlMoleculeReader',
	/** @private */
	createFragment: function(parentObj)
	{
		var result = new Kekule.Molecule();
		return result;
	},
	/**
	 * Read MOL 2000/3000 file header lines.
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @param {Object} parentObj
	 * @return {Hash}
	 * @private
	 */
	readHeaderInfo: function(textBuffer, parentObj)
	{
		var result = {};
		// line 1: molecule name
		var name = textBuffer.readLine();
		if (name)
			result.name = name;
		// line 2: MOL file information
		var infoLine = textBuffer.readLine();
		var info = this.readInfoLine(infoLine);
		if (info)
			result = Object.extend(result, info);
		// line 3: comment
		var comment = textBuffer.readLine();
		if (comment)
			result.comment = comment;
		return result;
	},
	/**
	 * Read information line (line 2) of a MOL 2000 / 3000 file.
	 * @param {String} line
	 * @returns {Hash}
	 * @private
	 */
	readInfoLine: function(line)
	{
		var result = {};
		if (line.trim()) // info line can be blank
		{
			// IIPPPPPPPPMMDDYYHHmmddSSssssssssssEEEEEEEEEEEERRRRRR
			// II: User's first and last initials
			var s = line.substr(0, 2).trim();
			if (s)
				result.userAbbr = s;
			// PPPPPPPP: program name
			s = line.substr(2, 8).trim();
			if (s)
				result.programName = s;
			// MMDDYYHHmm: Date and time
			//var date;
			s = line.substr(10, 10);
			if (s.trim())
			{
				/*
				date = new Date();
				var month = (parseInt(line.substr(10, 2).trim()) || 1) - 1;
				var day = parseInt(line.substr(12, 2).trim()) || 0;
				var year = parseInt(line.substr(14, 2), 10) || 0;
				if (year >= 70) // assume 1970-1999
					year += 1900;
				else // 2000-2069
 					year += 2000
				date.setFullYear(year, month, day);
				var hour = parseInt(line.substr(16, 2), 10) || 0;
				var minute = parseInt(line.substr(18, 2), 10) || 0;
				date.setHours(hour, minute);
				result.date = date;
				*/
				result.date = Kekule.IO.MdlUtils.analysisMdlDateTimeStr(s, false);
			}
			// dd: dimensional codes, 2D or 3D
			s = line.substr(20, 2);
			result.coordMode = (s == '3D')?
				Kekule.CoordMode.COORD3D:
				((s == '2D')? Kekule.CoordMode.COORD2D: Kekule.CoordMode.UNKNOWN );
			// SSssssssssss: scaling factors
			// TODO: not parsed here, may be this property is important.
			// EEEEEEEEEEEE: energy, no need to parse
			// RRRRRR: registry info, no need to parse
		}
		return result;
	},
	/** @private */
	doReadBlock: function($super, textBuffer, parentObj)
	{
		var headerInfo = this.readHeaderInfo(textBuffer, parentObj);
		if (headerInfo && (typeof(headerInfo.coordMode) != 'undefined'))
			this.setCoordMode(headerInfo.coordMode);
		var mol = $super(textBuffer, parentObj);
		// add header information to mol
		if (mol && headerInfo)
		{
			headerInfo.name? mol.setName(headerInfo.name): null;
			headerInfo.userAbbr? mol.setInfoValue('author', headerInfo.userAbbr): null;
			headerInfo.programName? mol.setInfoValue('generator', headerInfo.programName): null;
			headerInfo.date? mol.setInfoValue('date', headerInfo.date): null;
			headerInfo.comment? mol.setInfoValue('comment', headerInfo.comment): null;
		}
		// check if next line is M END
		// in 3k, this line will not be read by ctab reader, so just read and discard it
		if (!textBuffer.eof())
		{
			var line = textBuffer.getCurrLine();
			if (line.trim().toUpperCase() === 'M  END')
				textBuffer.readLine();
		}
		return mol;
	}
});

/**
 * Class to write {@link Kekule.Molecule} to MDL MOL 2000/3000 data.
 * @class
 * @augments Kekule.IO.MdlStructureFragmentWriter
 */
Kekule.IO.MdlMoleculeWriter = Class.create(Kekule.IO.MdlStructureFragmentWriter,
/** @lends Kekule.IO.MdlMoleculeWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlMoleculeWriter',
	/**
	 * Write MOL 2000/3000 file header lines.
	 * @param {Kekule.Molecule} mol
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	writeHeaderInfo: function(mol, textBuffer)
	{
		// line 1: molecule name
		textBuffer.writeLine(mol.getName() || /*Kekule.Texts.UNNAMED*/Kekule.$L('Texts.UNNAMED') || '');
		// line 2: MOL file information
		var infoLine = this.generateInfoLine(mol);
		textBuffer.writeLine(infoLine);
		// line 3: comment
		var comment = mol.getInfoValue('comment');
		textBuffer.writeLine(comment || '');
	},
	/**
	 * Get information line (line 2) for writing to MOL 2000 / 3000 file.
	 * @param {Kekule.Molecule} mol
	 * @returns {String}
	 * @private
	 */
	generateInfoLine: function(mol)
	{
		var s = '';
		// IIPPPPPPPPMMDDYYHHmmddSSssssssssssEEEEEEEEEEEERRRRRR
		// II: User's first and last initials
		var author = mol.getInfoValue('author');
		s += author? author.toString().substr(0, 2).rpad(2): '  ';
		// PPPPPPPP: program name
		var progName = mol.getInfoValue('generator');
		s += progName? progName.toString().substr(0, 8).rpad(8): Kekule.LIBNAME_CORE.rpad(8);
		// MMDDYYHHmm: Date and time
		var date = mol.getInfoValue('date') || new Date();  // default is now
		s += Kekule.IO.MdlUtils.generateMdlDateTimeStr(date, false);  // short date time format
		// dd: dimensional codes, 2D or 3D
		s += (this.getCoordMode() == Kekule.CoordMode.COORD3D)? '3D': '2D';
		// SSssssssssss: scaling factors
		// TODO: not handled here, may be this property is important.
		// EEEEEEEEEEEE: energy, no need to handle
		// RRRRRR: registry info, no need to handle
		return s;
	},
	/**
	 * Get molecule data from an object.
	 * @param {Variant} obj
	 */
	getMolecule: function(obj)
	{
		return Kekule.ChemStructureUtils.getTotalStructFragment(obj);
	},
	/** @private */
	doWriteBlock: function($super, obj, textBuffer)
	{
		var mol = this.getMolecule(obj);
		if (mol)
		{
			var molInfo = Kekule.IO.MdlStructureUtils.getMoleculeCtabStructureInfo(mol);
			this.setCoordMode(molInfo.coordMode);  // coord mode can be get from mol info
			// header
			this.writeHeaderInfo(mol, textBuffer);
			if (this.getMdlVersion() == Kekule.IO.MdlVersion.V3000)  // add a compatible count line
				textBuffer.writeLine(Kekule.IO.MdlStructureUtils.generateClassicStyleCountLine(molInfo, this.getMdlVersion()));
			// Ctab
			$super(mol, textBuffer);
			if (this.getMdlVersion() == Kekule.IO.MdlVersion.V3000)  // 3k compatible end tag
				textBuffer.writeLine('M  END');
		}
		else // not found
		{
			// do nothing
		}
	}
});

/**
 * Class to read and anaylsis both MDL SD file data then create Molecule or MoleculeList.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 * @private
 */
Kekule.IO.MdlStructDataReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.MdlStructDataReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlStructDataReader',
	/** @private */
	DATA_HEAD_PREFIX: Kekule.IO.MDL.SD_DATA_HEAD_PREFIX, //'>',
	/** @private */
	DATA_DBFIELD_PATTERN: /\bDT(\d+)\b/,
	/** @private */
	DATA_KEY_NAME_PATTERN: /\<(.+)\>/,
	/** @private */
	MOL_DELIMITER: Kekule.IO.MDL.MOL_DELIMITER, //'$$$$',
	/** @private */
	doReadBlock: function(textBuffer, parentObj)
	{
		var molReader = new Kekule.IO.MdlMoleculeReader();
		try
		{
			var currKey, currValue;
			var mol;
			var mols = [];
			// repeatly, read mol block than data block
			while (!textBuffer.eof())
			{
				try
				{
					mol = molReader.doReadBlock(textBuffer, null);
				}
				catch(e) // tailing blank lines after $$$$ may cause error in reading mol, just ignore it and terminate reading
				{
					mol = null;
				}
				if (mol)  // read data block
				{
					mols.push(mol);
					currKey = null;
					currValue = null;
					while (!textBuffer.eof())
					{
						var lineInfo = this.analysisDataLine(textBuffer.readLine());
						if (lineInfo)
						{
							var lineType = lineInfo.lineType;
							if (lineType === 'dataheader')
								currKey = lineInfo.key;
							else if (lineType === 'datavalue')
							{
								if (currKey)
								{
									currValue = lineInfo.value;
									mol.setInfoValue(currKey, currValue);
								}
							}
							else if (lineType === 'moldelimiter')
								break;  // exit data read loop to read the next molecule
						}
					}
				}
				else
					break;
			}
			if (mols.length > 1)  // more than one molecule, returns a list
			{
				var result = new Kekule.ChemObjList();
				for (var i = 0, l = mols.length; i < l; ++i)
					result.append(mols[i]);
				return result;
			}
			else
				return mols[0];
		}
		finally
		{
			molReader.finalize();
		}
	},
	/** @private */
	analysisDataLine: function(line)
	{
		var lineType, key, value;
		var s = line.trim();
		if (s.startsWith(this.DATA_HEAD_PREFIX))  // data header, read data key name
		{
			lineType = 'dataheader';
			key = this.getDataHeaderKey(line);
			if (key)
				return {'lineType': lineType, 'key': key};
			else
				return null;
		}
		else if (s.startsWith(this.MOL_DELIMITER))  // molecule delimiter
		{
			return {'lineType': 'moldelimiter'};
		}
		else  // data line or blank line
		{
			if (!s)  // blank
				return null;
			else
				return {'lineType': 'datavalue', 'value': line};
		}
	},
	/** @private */
	getDataHeaderKey: function(line)
	{
		var key = null;
		// try get key name
		var result = this.DATA_KEY_NAME_PATTERN.exec(line);
		if (result && (result.length > 1))
			key = result[1];
		else  // try get database field name
		{
			result = this.DATA_DBFIELD_PATTERN.exec(line);
			if (result && (result.length > 1))
				key = result[1];
			else  // do not know the exactly key, return whole line
				key = line;
		}
		return key;
	},
	doReadDataBlock: function(textBuffer, mol)
	{
		var line = textBuffer.readLine();
		// if start with '>', is a data header

	}
});

/**
 * Class to write {@link Kekule.Molecule} or other molecule list to MDL SD format data.
 * @class
 * @augments Kekule.IO.MdlStructureFragmentWriter
 */
Kekule.IO.MdlStructDataWriter = Class.create(Kekule.IO.MdlBlockWriter,
/** @lends Kekule.IO.MdlStructDataWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlStructDataWriter',
	/** @private */
	IGNORED_INFO_FIELDS: ['generator', 'author', 'date', 'comment'],
	/** @constructs */
	initialize: function($super, version, coordMode)
	{
		$super();
		this.setMdlVersion(version || Kekule.IO.MdlVersion.V2000);
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mdlVersion', {'dataType': DataType.INT, 'defaultValue': Kekule.IO.MdlVersion.V2000});
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	doWriteBlock: function(chemObj, textBuffer)
	{
		var mols = this.getChildMols(chemObj);

		var molWriter = new Kekule.IO.MdlMoleculeWriter();
		molWriter.setMdlVersion(this.getMdlVersion());
		molWriter.setCoordMode(this.getCoordMode());

		for (var i = 0, l = mols.length; i < l; ++i)
		{
			var mol = mols[i];
			// write molecule
			var text = molWriter.writeBlock(mol);
			textBuffer.writeText(text);

			// write data information
			var data = this.getMolData(mol);
			this.doWriteDataBlock(data, textBuffer);

			// then molecule delimiter
			textBuffer.writeLine(Kekule.IO.MDL.MOL_DELIMITER);
		}
	},
	/** @private */
	doWriteDataBlock: function(data, textBuffer)
	{
		var keys = Kekule.ObjUtils.getOwnedFieldNames(data);
		for (var i = 0, l = keys.length; i < l; ++i)
		{
			var key = keys[i];
			if (this.IGNORED_INFO_FIELDS.indexOf(key) < 0)
			{
				var header = Kekule.IO.MDL.SD_DATA_HEAD_PREFIX + ' <' + key + '>';
				var value = data[key];
				// write data/value and a blank line
				if (header && value)
				{
					textBuffer.writeLine(header);
					textBuffer.writeLine(value);
					textBuffer.writeLine('');
				}
			}
		}
	},
	/**
	 * Returns child molecule in parent chemObj.
	 * Each child molecule need a block in MDL SD file.
	 * @param {Kekule.ChemObject} chemObj
	 * @returns {Array}
	 */
	getChildMols: function(chemObj)
	{
		var children = Kekule.ChemStructureUtils.getChildStructureObjs(chemObj, true);
		/*
		if (chemObj instanceof Kekule.ChemObjList)
			children = chemObj.getItems();
		else if (chemObj instanceof Kekule.CompositeMolecule)
			children = chemObj.getSubMolecules().getAllObjs();
		else if (chemObj instanceof Kekule.ChemStructureObjectGroup)
			children = chemObj.getAllObjs();
		else // single object
			children = [chemObj];
		*/

		// filter out molecule
		var result = [];
		for (var i = 0, l = children.length; i < l; ++i)
		{
			var child = children[i];
			if (child instanceof Kekule.StructureFragment)
				result.push(child);
		}

		return result;
	},
	/**
	 * Returns a hash with all data need to write to SD content.
	 * @param {Kekule.ChemObject} mol
	 * @returns {Hash}
	 */
	getMolData: function(mol)
	{
		var info = mol.getInfo? mol.getInfo() || {}: null;
		return info;
	}
});

/**
 * Base class to read and anaylsis both MDL RXN 2000 and 3000 data then create Reaction.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 * @private
 */
Kekule.IO.MdlBaseReactionReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.MdlBaseReactionReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlBaseReactionReader',
	/**
	 * Read header block (first 4 lines) of a RXN file.
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @param {Object} parentObj
	 * @returns {Hash}
	 * @private
	 */
	readHeaderBlock: function(textBuffer, parentObj)
	{
		var result = {};
		var s;
		// line 1: identifier
		var line = textBuffer.readLine().trim();
		s = line.substr(0, 4);
		if (s != '$RXN') // identifier wrong
		{
			Kekule.error(/*Kekule.ErrorMsg.NOT_MDL_RXN_DATA*/Kekule.$L('ErrorMsg.NOT_MDL_RXN_DATA'));
			return null;
		}
		else  // get file version
		{
			s = line.substr(4).trim();
			if (s == 'V3000')
				result.version = Kekule.IO.MdlVersion.V3000;
			else
				result.version = Kekule.IO.MdlVersion.V2000;
		}
		// line 2: reaction name
		line = textBuffer.readLine().trim();
		if (line)
			result.name = line;
		// line 3: reaction info
		// IIIIIIPPPPPPPPPMMDDYYYYHHmmRRRRRRR
		{
			line = textBuffer.readLine();
			// IIIIII: User's initials
			s = line.substr(0, 6).trim();
			if (s)
				result.userAbbr = s;
			// PPPPPPPPP: program name
			s = line.substr(6, 9).trim();
			if (s)
				result.programName = s;
			// MMDDYYYYHHmm: date time.
			// NOTE: early softwares may generate datetime string in short format, doesnot handle this now.
			s = line.substr(15, 10);
			if (s.trim())
				result.date = Kekule.IO.MdlUtils.analysisMdlDateTimeStr(s, true);
			// RRRRRRR: reg no, ignored
		}
		// line 4: comment line
		line = textBuffer.readLine().trim();
		if (line)
			result.comment = line;
		return result;
		//return Kekule.IO.MdlUtils.parseReactionHeader(textBuffer);
	},

	/**
	 * Get reactant and product count from count line.
	 * @param {Object} line
	 * @private
	 */
	readSubstanceCountLine: function(line)
	{
		// do nothing here
	},
	/**
	 * Read MOL blocks in RXN file.
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @returns {Kekule.Molecule}
	 * @private
	 */
	readMolBlock: function(textBuffer)
	{
		// do nothing here
	},

	/** @private */
	doReadBlock: function($super, textBuffer, parentObj)
	{
		var headerInfo = this.readHeaderBlock(textBuffer, null);
		// read header info success, this is a legal RXN file, do other jobs
		var substanceInfo = this.readSubstanceCountLine(textBuffer.readLine());
		var result = new Kekule.Reaction();
		// then MOL blocks
		var line = '';
		/*
		while (line != '$MOL')
			line = textBuffer.readLine();
		*/

		for (var i = 0; i < substanceInfo.reactantCount; ++i)
		{
			var mol = this.readMolBlock(textBuffer);
			if (mol)
				result.appendReactant(mol);
		}
		for (var i = 0; i < substanceInfo.productCount; ++i)
		{
			var mol = this.readMolBlock(textBuffer);
			if (mol)
				result.appendProduct(mol);
		}
		// append meta info
		if (result && headerInfo)
		{
			headerInfo.name? result.setName(headerInfo.name): null;
			headerInfo.userAbbr? result.setInfoValue('author', headerInfo.userAbbr): null;
			headerInfo.programName? result.setInfoValue('generator', headerInfo.programName): null;
			headerInfo.date? result.setInfoValue('date', headerInfo.date): null;
			headerInfo.comment? result.setInfoValue('comment', headerInfo.comment): null;
		}
		return result;
	}
});

/**
 * Class to read and anaylsis MDL RXN 2000 data and create Reaction.
 * @class
 * @augments Kekule.IO.MdlBaseReactionReader
 * @private
 */
Kekule.IO.Mdl2kReactionReader = Class.create(Kekule.IO.MdlBaseReactionReader,
/** @lends Kekule.IO.Mdl2kReactionReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl2kReactionReader',
	/** @private */
	readHeaderBlock: function($super, textBuffer, parentObj)
	{
		var result = $super(textBuffer, parentObj);
		if (result.version != Kekule.IO.MdlVersion.V2000)
		{
			Kekule.error(/*Kekule.ErrorMsg.NOT_MDL2000_RXN_DATA*/Kekule.$L('ErrorMsg.NOT_MDL2000_RXN_DATA'));
			return null;
		}
		else
			return result;
	},

	/**
	 * Get reactant and product count from count line.
	 * @param {Object} line
	 * @private
	 */
	readSubstanceCountLine: function(line)
	{
		var result = {};
		// rrrppp
		result.reactantCount = parseInt(line.substr(0, 3), 10) || 0;
		result.productCount = parseInt(line.substr(3, 3), 10) || 0;
		return result;
	},

	/** @private */
	readMolBlock: function(textBuffer)
	{
		var line = textBuffer.readLine(); //textBuffer.getLineAt(textBuffer.getCurrLineNo());
		while ((line !== '$MOL') && (!textBuffer.eof()))
			line = textBuffer.readLine();  // skip heading $MOL mark
		if (textBuffer.eof())  // can not find mol block
		  return null;
		// fetch lines until $MOL end tag if found
		var lines = [];
		//var line = textBuffer.readLine();
		var line = textBuffer.getCurrLine();
		while ((line !== '$MOL') && (!textBuffer.eof()))
		{
			lines.push(line);
			textBuffer.incCurrLineNo();
			//line = textBuffer.readLine();
			line = textBuffer.getCurrLine();
		}
		return (new Kekule.IO.MdlMoleculeReader()).readBlock(lines, null);
	}
});

/**
 * Class to read and anaylsis MDL RXN 3000 data and create Reaction.
 * @class
 * @augments Kekule.IO.MdlBaseReactionReader
 * @private
 */
Kekule.IO.Mdl3kReactionReader = Class.create(Kekule.IO.MdlBaseReactionReader,
/** @lends Kekule.IO.Mdl3kReactionReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.Mdl3kReactionReader',
	/** @private */
	createTextBuffer: function()
	{
		return (new Kekule.IO.Mdl3kTextBuffer());
	},
	/** @private */
	readHeaderBlock: function($super, textBuffer, parentObj)
	{
		var result = $super(textBuffer, parentObj);
		if (result.version != Kekule.IO.MdlVersion.V3000)
		{
			Kekule.error(/*Kekule.ErrorMsg.NOT_MDL3000_RXN_DATA*/Kekule.$L('ErrorMsg.NOT_MDL3000_RXN_DATA'));
			return null;
		}
		else
			return result;
	},

	/** @private */
	readSubstanceCountLine: function(line)
	{
		var result = {};
		// M  V30 COUNTS rcount pcount
		var values = Kekule.IO.Mdl3kValueUtils.splitValues(line);
		if (values.shift().value.trim() != 'COUNTS') // not a count line
		{
			Kekule.error(/*Kekule.ErrorMsg.NOT_MDL3000_RXN_COUNTLINE*/Kekule.$L('ErrorMsg.NOT_MDL3000_RXN_COUNTLINE'));
			return null;
		}
		result.reactantCount = parseInt(values.shift().value, 10) || 0;
		result.productCount = parseInt(values.shift().value, 10) || 0;
		return result;
	},

	/** @private */
	readMolBlock: function(textBuffer)
	{
		if (textBuffer.getBlockBuffer)
		{
			var buffer = textBuffer.getBlockBuffer('CTAB');
			return (new Kekule.IO.Mdl3kMoleculeCTabReader()).doReadBlock(buffer);
		}
		else
			return null;
	}
});

/**
 *  Class to read and anaylsis both RXN 2000 and 3000 data then create Reaction.
 * @class
 * @augments Kekule.IO.MdlBlockReader
 */
Kekule.IO.MdlReactionReader = Class.create(Kekule.IO.MdlBlockReader,
/** @lends Kekule.IO.MdlReactionReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlReactionReader',
	/** @private */
	doReadBlock: function(textBuffer, parentObj)
	{
		var reader;
		var version = Kekule.IO.MdlUtils.getRxnMarkVersion(textBuffer.getCurrLine());
		if (version == Kekule.IO.MdlVersion.V3000)
			reader = new Kekule.IO.Mdl3kReactionReader();
		else
			reader = new Kekule.IO.Mdl2kReactionReader();
		return reader.readBlock(textBuffer.getUnreadLines(), parentObj);
	}
});

/**
 * Class to write both MDL RXN 2000 and 3000 data.
 * @class
 * @augments Kekule.IO.MdlBlockWriter
 * @private
 */
Kekule.IO.MdlReactionWriter = Class.create(Kekule.IO.MdlBlockWriter,
/** @lends Kekule.IO.MdlReactionWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlReactionWriter',
	/** @constructs */
	initialize: function($super, version, coordMode)
	{
		$super();
		this.setMdlVersion(version || Kekule.IO.MdlVersion.V2000);
		this.setCoordMode(coordMode || Kekule.CoordMode.UNKNOWN);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mdlVersion', {'dataType': DataType.INT, 'defaultValue': Kekule.IO.MdlVersion.V2000});
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/**
	 * Write header block (first 4 lines) of a RXN file.
	 * @param {Kekule.Reaction} reaction
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	writeHeaderBlock: function(reaction, textBuffer)
	{
		var s;
		// line 1: identifier
		s = '$RXN' + ((this.getMdlVersion() == Kekule.IO.MdlVersion.V3000)? ' ' + Kekule.IO.MDL.VER3000: '');
		textBuffer.writeLine(s);
		// line 2: reaction name
		textBuffer.writeLine(reaction.getName() || '');
		// line 3: reaction info
		// IIIIIIPPPPPPPPPMMDDYYYYHHmmRRRRRRR
		{
			// IIIIII: User's initials
			var author = reaction.getInfoValue('author') || '';
			s = author.substr(0, 6).rpad(6);
			// PPPPPPPPP: program name
			var generator = reaction.getInfoValue('generator') || '';
			s += generator.substr(0, 9).rpad(9);
			// MMDDYYYYHHmm: date time.
			var date = reaction.getInfoValue('date') || new Date();  // default is now
			// NOTE: early softwares may generate datetime string in short format, doesnot handle this now.
			s += Kekule.IO.MdlUtils.generateMdlDateTimeStr(date, true);
			// RRRRRRR: reg no, ignored
		}
		textBuffer.writeLine(s);
		// line 4: comment line
		var comment = reaction.getInfoValue('comment') || '';
		textBuffer.writeLine(comment);
	},
	/**
	 * Get reactant and product count line.
	 * @param {Kekule.Reaction} reaction
	 * @private
	 */
	generateSubstanceCountLine: function(reaction)
	{
		// 3k:  M  V30 COUNTS rcount pcount
		if (this.getMdlVersion() == Kekule.IO.MdlVersion.V3000)
			return 'M  V30 COUNTS ' + Kekule.IO.Mdl3kValueUtils.mergeValues([reaction.getReactantCount(), reaction.getProductCount()]);
		// 2k:  rrrppp
			return reaction.getReactantCount().toString().lpad(3) + reaction.getProductCount().toString().lpad(3);
	},
	/**
	 * Write delimiter between molecules.
	 * 2k will write '$MOL', 3k should do nothing
	 * @param {Object} textBuffer
	 */
	writeMolDelimiterLine: function(textBuffer)
	{
		if (this.getMdlVersion() == Kekule.IO.MdlVersion.V2000)
			textBuffer.writeLine('$MOL');
	},
	/**
	 * Write MOL blocks in RXN file.
	 * @param {Kekule.Molecule} mol
	 * @param {Kekule.TextLinesBuffer} textBuffer
	 * @private
	 */
	writeMolBlock: function(mol, textBuffer)
	{
		var writer = this.getMdlVersion() == Kekule.IO.MdlVersion.V3000?
			new Kekule.IO.Mdl3kMoleculeCTabWriter(this.getCoordMode()):  // no need to write compatible lines in 3k
			new Kekule.IO.MdlMoleculeWriter(this.getMdlVersion(), this.getCoordMode());
		var text = writer.writeBlock(mol);
		textBuffer.writeText(text);
	},

	/** @private */
	doWriteBlock: function($super, reaction, textBuffer)
	{
		var is3kMode = this.getMdlVersion() == Kekule.IO.MdlVersion.V3000;
		  // if in 3k mode, reactant and products should be surrounded by block begin/end tag
		// header
		this.writeHeaderBlock(reaction, textBuffer);
		var substanceInfoLine = this.generateSubstanceCountLine(reaction);
		textBuffer.writeLine(substanceInfoLine);
		// then MOL blocks
		if (is3kMode)
			textBuffer.writeLine('M  V30 ' + Kekule.IO.Mdl3kUtils.get3kBlockStartTag('REACTANT'));
		for (var i = 0; i < reaction.getReactantCount(); ++i)
		{
			this.writeMolDelimiterLine(textBuffer);
			this.writeMolBlock(reaction.getReactantAt(i), textBuffer);
		}
		if (is3kMode)
			textBuffer.writeLine('M  V30 ' + Kekule.IO.Mdl3kUtils.get3kBlockEndTag('REACTANT'));
		if (is3kMode)
			textBuffer.writeLine('M  V30 ' + Kekule.IO.Mdl3kUtils.get3kBlockStartTag('PRODUCT'));
		for (var i = 0; i < reaction.getProductCount(); ++i)
		{
			this.writeMolDelimiterLine(textBuffer);
			this.writeMolBlock(reaction.getProductAt(i), textBuffer);
		}
		if (is3kMode)
		{
			textBuffer.writeLine('M  V30 ' + Kekule.IO.Mdl3kUtils.get3kBlockEndTag('PRODUCT'));
			// total end tag
			textBuffer.writeLine('M  END');
		}
	}
});

/**
 * Base abstract reader for MDL 2000 / 3000 format data.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.BaseMdlReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.BaseMdlReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.BaseMdlReader',
	/** @private */
	doReadData: function(data, dataType, format)
	{
		if (dataType != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		{
			Kekule.error(/*Kekule.ErrorMsg.MDL_INPUT_DATATYPE_NOT_TEXT*/Kekule.$L('ErrorMsg.MDL_INPUT_DATATYPE_NOT_TEXT'));
			return null;
		}
		else
		{
			return this.doReadMdlData(data);
		}
	},
	/**
	 * Do actual work of reading MDL data.
	 * Descendants should override this method.
	 * @param {String} data
	 * @returns {Kekule.ChemObject}
	 * @private
	 */
	doReadMdlData: function(data)
	{
		// do nothing here
		return null;
	}
});

/**
 * Base abstract writer for MDL 2000 / 3000 format text data.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 *
 * @property {Int} mdlVersion Output format. V2000 and V3000 has totally different data structures.
 * @property {Int} coordMode Output 2D or 3D coordinate for molecule.
 */
Kekule.IO.BaseMdlWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.BaseMdlWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.BaseMdlWriter',
	/** @private */
	initialize: function($super, options)
	{
		$super(options);
		if (!options)
			options = {};
		this.setMdlVersion(options.mdlVersion || Kekule.globalOptions.IO.mdl.mdlVersion);
		this.setCoordMode(options.coordMode || Kekule.globalOptions.IO.mdl.coordMode);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mdlVersion', {'dataType': DataType.INT, 'defaultValue': Kekule.IO.MdlVersion.V2000});
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	doWriteData: function($super, obj, dataType, format)
	{
		var dtype = dataType || Kekule.IO.ChemDataType.TEXT;
		if (dtype != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		{
			Kekule.error(/*Kekule.ErrorMsg.MDL_OUTPUT_DATATYPE_NOT_TEXT*/Kekule.$L('ErrorMsg.MDL_OUTPUT_DATATYPE_NOT_TEXT'));
			return null;
		}
		else
			return $super(obj, dtype, format);
	}
});

/**
 * Reader for MOL 2000 / 3000 format text data.
 * Use MolReader.readData() can retrieve a suitable Kekule.Molecule.
 * Data fetch in should be a string.
 * @class
 * @augments Kekule.IO.BaseMdlReader
 */
Kekule.IO.MdlMolReader = Class.create(Kekule.IO.BaseMdlReader,
/** @lends Kekule.IO.MdlMolReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlMolReader',
	/** @private */
	doReadMdlData: function(data)
	{
		var reader = new Kekule.IO.MdlMoleculeReader();
		return reader.readBlock(data, null);
	}
});

/**
 * Writer for MOL 2000 / 3000 format text data.
 * Use molWriter.writeData(obj) to save Kekule object to MDL text content.
 * @class
 * @augments Kekule.IO.BaseMdlWriter
 */
Kekule.IO.MdlMolWriter = Class.create(Kekule.IO.BaseMdlWriter,
/** @lends Kekule.IO.MdlMolWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlMolWriter',
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		/*
		if (dataType != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		{
			Kekule.error(Kekule.ErrorMsg.MDL_OUTPUT_DATATYPE_NOT_TEXT);
			return null;
		}
		else
		*/
		{
			var writer = new Kekule.IO.MdlMoleculeWriter(this.getMdlVersion(), this.getCoordMode());
			return writer.writeBlock(obj);
		}
	}
});

/**
 * Reader for MOL 2000 / 3000 SD (structure-data) format text data.
 * Data fetch in should be a string.
 * @class
 * @augments Kekule.IO.BaseMdlReader
 */
Kekule.IO.MdlSdReader = Class.create(Kekule.IO.BaseMdlReader,
/** @lends Kekule.IO.MdlSdReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlSdReader',
	/** @private */
	doReadMdlData: function(data)
	{
		{
			var reader = new Kekule.IO.MdlStructDataReader();
			return reader.readBlock(data, null);
		}
	}
});

/**
 * Writer for MOL 2000 / 3000 SD (structure-data) format text data.
 * @class
 * @augments Kekule.IO.BaseMdlWriter
 */
Kekule.IO.MdlSdWriter = Class.create(Kekule.IO.BaseMdlWriter,
/** @lends Kekule.IO.MdlSdWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlSdWriter',
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		var writer = new Kekule.IO.MdlStructDataWriter(this.getMdlVersion(), this.getCoordMode());
		return writer.writeBlock(obj);
	}
});

/**
 * Reader for RXN 2000/3000 format text data.
 * Use RxnReader.readData() can retrieve a suitable Kekule.Reaction.
 * Data fetch in should be a string.
 * @class
 * @augments Kekule.IO.BaseMdlReader
 */
Kekule.IO.MdlRxnReader = Class.create(Kekule.IO.BaseMdlReader,
/** @lends Kekule.IO.MdlRxnReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlRxnReader',
	/** @private */
	doReadMdlData: function(data)
	{
		var reader = new Kekule.IO.MdlReactionReader();
		return reader.readBlock(data, null);
	}
});

/**
 * Writer for RXN 2000 / 3000 format text data.
 * Use RxnReader.writeData(obj) to save a Kekule.Reaction to MDL V2000 or 3000 text.
 * @class
 * @augments Kekule.IO.BaseMdlWriter
 */
Kekule.IO.MdlRxnWriter = Class.create(Kekule.IO.BaseMdlWriter,
/** @lends Kekule.IO.MdlRxnWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlRxnWriter',
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		/*
		if (dataType != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		{
			Kekule.error(Kekule.ErrorMsg.MDL_OUTPUT_DATATYPE_NOT_TEXT);
			return null;
		}
		else
		*/
		{
			var writer = new Kekule.IO.MdlReactionWriter(this.getMdlVersion(), this.getCoordMode());
			return writer.writeBlock(obj);
		}
	}
});

/**
 * Reader for MOL or RXN 2000/3000 format text data.
 * Use MdlReader.readData() can retrieve a suitable Kekule object.
 * Data fetch in should be a string.
 * @class
 * @augments Kekule.IO.ChemDataReader
 */
Kekule.IO.MdlReader = Class.create(Kekule.IO.ChemDataReader,
/** @lends Kekule.IO.MdlReader# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlReader',
	/** @private */
	doReadData: function(data, dataType, format)
	{
		if (dataType != Kekule.IO.ChemDataType.TEXT) // can not understand data other than text
		{
			Kekule.error(/*Kekule.ErrorMsg.MDL_INPUT_DATATYPE_NOT_TEXT*/Kekule.$L('ErrorMsg.MDL_INPUT_DATATYPE_NOT_TEXT'));
			return null;
		}
		else
		{
			var reader;
			// check first 4 chars of data, $RXN means reaction, otherwise, MOL
			var tag = data.substr(0, 4);
			if (tag == '$RXN')
				reader = new Kekule.IO.MdlReactionReader();
			else
				reader = new Kekule.IO.MdlMoleculeReader();
			return reader.readBlock(data, null);
		}
	}
});

/**
 * A general class to write MOL or RXN 2000/3000 format text data.
 * Use MdlWriter.writeData() to save a reaction or molecule.
 * @class
 * @augments Kekule.IO.ChemDataWriter
 */
Kekule.IO.MdlWriter = Class.create(Kekule.IO.ChemDataWriter,
/** @lends Kekule.IO.MdlWriter# */
{
	/** @private */
	CLASS_NAME: 'Kekule.IO.MdlWriter',
	/** @private */
	initialize: function($super, options)
	{
		$super(options);
		var op = options || {};
		this.setMdlVersion(op.mdlVersion || Kekule.globalOptions.IO.mdl.mdlVersion);
		this.setCoordMode(op.coordMode || Kekule.globalOptions.IO.mdl.coordMode);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('mdlVersion', {'dataType': DataType.INT, 'defaultValue': Kekule.IO.MdlVersion.V2000});
		this.defineProp('coordMode', {'dataType': DataType.INT, 'defaultValue': Kekule.CoordMode.UNKNOWN});
	},
	/** @private */
	doWriteData: function(obj, dataType, format)
	{
		var writer;
		if (obj instanceof Kekule.Reaction)
			writer = new Kekule.IO.MdlRxnWriter(this.getMdlVersion(), this.getCoordMode());
		else if (obj instanceof Kekule.StructureFragment)
			writer = new Kekule.IO.MdlMolWriter(this.getMdlVersion(), this.getCoordMode());
		else
		{
			var className = (obj && obj.getClassName)? obj.getClassName(): typeof(obj);
			Kekule.error(/*Kekule.ErrorMsg.UNABLE_TO_OUTPUT_AS_MDL*/Kekule.$L('ErrorMsg.UNABLE_TO_OUTPUT_AS_MDL').format(className));
			return null;
		}
		if (writer)
			return writer.writeData(obj);
	}
});

(function ()
{
	// register chem data formats
	var molFmtId = 'mol';
	var rxnFmtId = 'rxn';
	var sdFmtId = 'sd';
	var mol3kFmtId = 'mol3k';
	var rxn3kFmtId = 'rxn3k';

	Kekule.IO.DataFormat.MOL = molFmtId;
	Kekule.IO.DataFormat.RXN = rxnFmtId;
	Kekule.IO.DataFormat.SD = sdFmtId;
	Kekule.IO.DataFormat.MOL3K = mol3kFmtId;
	Kekule.IO.DataFormat.RXN3K = rxn3kFmtId;

	// extents mime type consts
	Kekule.IO.MimeType.MDL_MOL = 'chemical/x-mdl-molfile';
	Kekule.IO.MimeType.MDL_RXN = 'chemical/x-mdl-rxnfile';
	Kekule.IO.MimeType.MDL_SD = 'chemical/x-mdl-sdfile';

	/*
	Kekule.IO.DataFormatsManager.register('mol', 'chemical/x-mdl-molfile', 'mol',
		Kekule.IO.ChemDataType.TEXT, 'MDL Mol 2000/3000 format');
	Kekule.IO.DataFormatsManager.register('rxn', 'chemical/x-mdl-rxnfile', 'rxn',
		Kekule.IO.ChemDataType.TEXT, 'MDL Reaction 2000/3000 format');
	Kekule.IO.DataFormatsManager.register('sd', 'chemical/x-mdl-sdfile', ['sd', 'sdf'],
		Kekule.IO.ChemDataType.TEXT, 'MDL Structure-Data format');

	var molFmtId = Kekule.IO.DataFormatsManager.findFormatId('chemical/x-mdl-molfile');
	var rxnFmtId = Kekule.IO.DataFormatsManager.findFormatId('chemical/x-mdl-rxnfile');
	var sdFmtId = Kekule.IO.DataFormatsManager.findFormatId('chemical/x-mdl-sdfile');
	*/

	Kekule.IO.DataFormatsManager.register(molFmtId, Kekule.IO.MimeType.MDL_MOL, 'mol',
		Kekule.IO.ChemDataType.TEXT, 'MDL Mol 2000 format');
	Kekule.IO.DataFormatsManager.register(rxnFmtId, Kekule.IO.MimeType.MDL_RXN, 'rxn',
		Kekule.IO.ChemDataType.TEXT, 'MDL Reaction 2000 format');
	Kekule.IO.DataFormatsManager.register(sdFmtId, Kekule.IO.MimeType.MDL_SD, ['sd', 'sdf'],
		Kekule.IO.ChemDataType.TEXT, 'MDL Structure-Data format');
	Kekule.IO.DataFormatsManager.register(mol3kFmtId, Kekule.IO.MimeType.MDL_MOL, 'mol',
		Kekule.IO.ChemDataType.TEXT, 'MDL Mol 3000 format');
	Kekule.IO.DataFormatsManager.register(rxn3kFmtId, Kekule.IO.MimeType.MDL_RXN, 'rxn',
		Kekule.IO.ChemDataType.TEXT, 'MDL Reaction 3000 format');

	// register ChemData reader and writer
	Kekule.IO.ChemDataReaderManager.register('MDL-mol', Kekule.IO.MdlMolReader, [molFmtId, mol3kFmtId]);
	Kekule.IO.ChemDataReaderManager.register('MDL-rxn', Kekule.IO.MdlRxnReader, [rxnFmtId, rxn3kFmtId]);
	Kekule.IO.ChemDataReaderManager.register('MDL-general', Kekule.IO.MdlReader, [molFmtId, mol3kFmtId, rxnFmtId, rxn3kFmtId]);
	Kekule.IO.ChemDataReaderManager.register('MDL-sd', Kekule.IO.MdlSdReader, sdFmtId);

	var suitableClasses = [Kekule.StructureFragment, Kekule.ChemObjList, Kekule.ChemStructureObjectGroup, Kekule.ChemSpaceElement, Kekule.ChemSpace];

	Kekule.IO.ChemDataWriterManager.register('MDL-mol', Kekule.IO.MdlMolWriter, /*[Kekule.StructureFragment]*/suitableClasses, molFmtId);
	Kekule.IO.ChemDataWriterManager.register('MDL-mol3k', Kekule.IO.MdlMolWriter, /*[Kekule.StructureFragment]*/suitableClasses, mol3kFmtId, {'createOptions': {'mdlVersion': Kekule.IO.MdlVersion.V3000}});
	Kekule.IO.ChemDataWriterManager.register('MDL-rxn', Kekule.IO.MdlRxnWriter, [Kekule.Reaction], rxnFmtId);
	Kekule.IO.ChemDataWriterManager.register('MDL-rxn3k', Kekule.IO.MdlRxnWriter, [Kekule.Reaction], rxn3kFmtId);
	//Kekule.IO.ChemDataWriterManager.register('MDL-general', Kekule.IO.MdlWriter, [Kekule.StructureFragment, Kekule.Reaction], [molFmtId, mol3kFmtId, rxnFmtId, rxn3kFmtId]);
	Kekule.IO.ChemDataWriterManager.register('MDL-sd', Kekule.IO.MdlSdWriter, suitableClasses, sdFmtId);

	/*
	 TODO: MDL 2000 and 3000 have same MIME type, so they are registered by same format ID
	 TODO: How to save object in different format separately?
	*/

	/*
	// register ChemData reader and writer
	Kekule.IO.ChemDataReaderManager.register('mdl-general', Kekule.IO.MdlReader, {
		'title': 'MDL format general',
		'mimeType': '',
		'fileExt': ['mol', 'rxn']
	});
	Kekule.IO.ChemDataReaderManager.register('mol', Kekule.IO.MdlMolReader, {
		'title': 'MDL Mol format',
		'mimeType': 'chemical/x-mdl-molfile',
		'fileExt': 'mol'
	});
	Kekule.IO.ChemDataReaderManager.register('rxn', Kekule.IO.MdlRxnReader, {
		'title': 'MDL Reaction format',
		'mimeType': 'chemical/x-mdl-rxnfile',
		'fileExt': 'rxn'
	});

	Kekule.IO.ChemDataWriterManager.register('mdl-general', Kekule.IO.MdlWriter,
		[Kekule.ChemStructureFragment, Kekule.Reaction],
		{
			'title': 'MDL format general',
			'mimeType': '',
			'fileExt': ['mol', 'rxn']
		});
	Kekule.IO.ChemDataWriterManager.register('mol2000', Kekule.IO.MdlMolWriter,
		[Kekule.ChemStructureFragment],
		{
			'createOptions': {'mdlVersion': Kekule.IO.MdlVersion.V2000},
			'title': 'MDL Mol 2000 format',
			'mimeType': 'chemical/x-mdl-molfile',
			'fileExt': 'mol'
		});
	Kekule.IO.ChemDataWriterManager.register('mol3000', Kekule.IO.MdlMolWriter,
		[Kekule.ChemStructureFragment],
		{
			'createOptions': {'mdlVersion': Kekule.IO.MdlVersion.V3000},
			'title': 'MDL Mol 3000 format',
			'mimeType': 'chemical/x-mdl-molfile',
			'fileExt': 'mol'
		});
	Kekule.IO.ChemDataWriterManager.register('rxn2000', Kekule.IO.MdlRxnWriter,
		[Kekule.Reaction],
		{
			'createOptions': {'mdlVersion': Kekule.IO.MdlVersion.V2000},
			'title': 'MDL Reaction 2000 format',
			'mimeType': 'chemical/x-mdl-rxnfile',
			'fileExt': 'rxn'
		});
	Kekule.IO.ChemDataWriterManager.register('rxn3000', Kekule.IO.MdlRxnWriter,
		[Kekule.Reaction],
		{
			'createOptions': {'mdlVersion': Kekule.IO.MdlVersion.V3000},
			'title': 'MDL Reaction 3000 format',
			'mimeType': 'chemical/x-mdl-rxnfile',
			'fileExt': 'rxn'
		});
	*/
})();
