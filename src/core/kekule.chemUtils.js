/**
 * @fileoverview
 * Utils method about chem objects.
 * @author Partridge Jiang
 */

/*
 * requires /utils/kekule.utils.js
 * requires /core/kekule.common.js
 * requires /kekule.structures.js
 */

(function () {

"use strict";

/**
 * Util class to manipulate ctab based chem structures.
 * @class
 */
Kekule.ChemStructureUtils = {
	/**
	 * Returns median of all input connector lengths.
	 * @param {Array} connectors
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @return {Float}
	 */
	getConnectorLengthMedian: function(connectors, coordMode, allowCoordBorrow)
	{
		var lengths = [];
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			if (connector && connector.getLength)
			{
				var length = connector.getLength(coordMode, allowCoordBorrow);
				if (length)
					lengths.push(length);
			}
		}
		if (l === 0)  // no connectors at all
			return 1;  // TODO: this value should be calculated
		if (l <= 1)
			return lengths[0];
		else
		{
			// sort lengths to find the median one
			lengths.sort();
			var count = lengths.length;
			var result = (count % 2)? lengths[(count + 1) >> 1]: (lengths[count >> 1] + lengths[(count >> 1) - 1]) / 2;
			return result;
		}
	},
	/**
	 * Returns structured children of chemObj. The type of chemObj can be:
	 *   {@link Kekule.ChemObjList}: returns chemObj.getItems();
	 *   {@link Kekule.ChemStructureObjectGroup}: returns chemObj.getAllObjs();
	 *   {@link Kekule.CompositeMolecule}: returns chemObj.getSubMolecules().getAllObjs().
	 *   {@link Kekule.ChemSpaceElement} or {@link Kekule.ChemSpace}: returns all child structured objects inside it.
	 * Other types will simply return [chemObj].
	 * If param cascade is true, each childObj will also be checked.
	 * @param {Variant} chemObj
	 * @param {Bool} cascade
	 * @returns {Array}
	 */
	getChildStructureObjs: function(chemObj, cascade)
	{
		var result;
		if (chemObj instanceof Kekule.CompositeMolecule)
			result = chemObj.getSubMolecules().getAllObjs();
		else if (chemObj instanceof Kekule.ChemStructureObjectGroup)
			result = chemObj.getAllObjs();
		else if (chemObj instanceof Kekule.ChemObjList)
			result = chemObj.getItems();
		else if (chemObj instanceof Kekule.ChemSpaceElement)
			result = chemObj.getChildren().getItems();
		else if (chemObj instanceof Kekule.ChemSpace)
			result = chemObj.getChildren();
		else
		{
			return [chemObj];
		}
		result = [].concat(result);  // clone result, avoid affect properties of chemObj

		// if not returned and cascade, need future check
		if (cascade)
		{
			var newResult = [];
			for (var i = 0, l = result.length; i < l; ++i)
			{
				var obj = result[i];
				var cascadeChilds = Kekule.ChemStructureUtils.getChildStructureObjs(obj, cascade);
				if (cascadeChilds.length <= 1)  // can not find cascade children
					Kekule.ArrayUtils.pushUnique(newResult, obj);
				else  // children find, use them to replace obj
				{
					Kekule.ArrayUtils.pushUnique(newResult, cascadeChilds);
				}
			}
			result = newResult;
		}
		//console.log(result);
		return result;
	},

	/**
	 * Returns all child structure fragments among children of chemObj.
	 * @param {Variant} chemObj
	 * @param {Bool} cascade
	 * @returns {Array}
	 */
	getAllStructFragments: function(chemObj, cascade)
	{
		if (chemObj instanceof Kekule.StructureFragment)
			return [chemObj];

		var childObjs = Kekule.ChemStructureUtils.getChildStructureObjs(chemObj, cascade);
		var result = [];
		for (var i = 0, l = childObjs.length; i < l; ++i)
		{
			if (childObjs[i] instanceof Kekule.StructureFragment)
				Kekule.ArrayUtils.pushUnique(result, childObjs[i]);
		}
		return result;
	},

	/**
	 * Find all child structure fragments among children of chemObj, then merge them into one.
	 * @param {Variant} chemObj
	 * @param {Class} newFragmentClass If set, new fragment will be based on this class.
	 *   Otherwise an instance of {@link Kekule.Molecule} will be created.
	 * @return {Kekule.StructureFragment}
	 */
	getTotalStructFragment: function(chemObj, newFragmentClass)
	{
		var fragments = Kekule.ChemStructureUtils.getAllStructFragments(chemObj, true);
		var count = fragments.length;
		if (count <= 0)  // nothing found
			return null;
		else if (count === 1)  // only one, returns it directly
			return fragments[0];
		else  // need merge
		{
			return Kekule.ChemStructureUtils.mergeStructFragments(fragments, newFragmentClass);
		}
	},

	/**
	 * Returns nodes or connectors that should be removed cascadely with chemStructObj.
	 * @param {Object} chemStructObj
	 * @returns {Array}
	 * @deprecated
	 */
	getCascadeDeleteObjs: function(chemStructObj)
	{
		var result = [];
		// all usual connectors (two ends) connected to chemStructObj should be removed
		var linkedConnectors = chemStructObj.getLinkedConnectors? chemStructObj.getLinkedConnectors(): [];
		for (var i = 0, l = linkedConnectors.length; i < l; ++i)
		{
			var connector = linkedConnectors[i];
			if (connector.getConnectedObjs().length <= 2)
			{
				Kekule.ArrayUtils.pushUnique(result, connector);
				var newCascadeObjs = Kekule.ChemStructureUtils.getCascadeDeleteObjs(connector);
				Kekule.ArrayUtils.pushUnique(result, newCascadeObjs);
			}
		}

		if (chemStructObj instanceof Kekule.ChemStructureNode)
		{
			// no additional objects should be delete
		}
		else if (chemStructObj instanceof Kekule.ChemStructureConnector)
		{
			// nodes connected with and only with this connector should be removed
			var objs = chemStructObj.getConnectedObjs();
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if (obj instanceof Kekule.ChemStructureNode)
				{
					if (obj.getLinkedConnectors().length <= 1)
						Kekule.ArrayUtils.pushUnique(result, obj);
				}
			}
		}
		else  // other objects
			;

		return result;
	},

	/**
	 * Move nodes and connectors from target to dest structure fragment.
	 * @param {Kekule.StructureFragment} target
	 * @param {Kekule.StructureFragment} dest
	 * @param {Array} moveNodes
	 * @param {Array} moveConnectors
	 * @param {Bool} ignoreAnchorNodes
	 */
	moveChildBetweenStructFragment: function(target, dest, moveNodes, moveConnectors, ignoreAnchorNodes)
	{
		/*
		var CU = Kekule.CoordUtils;

		target.beginUpdate();
		dest.beginUpdate();
		var anchorNodes = target.getAnchorNodes();
		try
		{
			// TODO: here we need change coord if essential
			var targetCoord2D = target.getAbsCoord2D();
			var targetCoord3D = target.getAbsCoord3D();
			var destCoord2D = dest.getAbsCoord2D();
			var destCoord3D = dest.getAbsCoord3D();

			var coordDelta2D = CU.substract(targetCoord2D, destCoord2D);
			var coordDelta3D = CU.substract(targetCoord3D, destCoord3D);

			//console.log('coordDelta', coordDelta2D, coordDelta3D);

			var nodes = Kekule.ArrayUtils.clone(moveNodes);
			var connectors = Kekule.ArrayUtils.clone(moveConnectors);
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				var index = target.indexOfNode(node);
				if (index >= 0)
				{
					target.removeNodeAt(index, true);  // preserve linked connectors

					var oldCoord2D = node.getCoord2D();
					if (oldCoord2D)
					{
						var newCoord2D = CU.add(oldCoord2D, coordDelta2D);
						node.setCoord2D(newCoord2D);
					}
					var oldCoord3D = node.getCoord3D();
					if (oldCoord3D)
					{
						var newCoord3D = CU.add(oldCoord3D, coordDelta3D);
						node.setCoord2D(newCoord3D);
					}

					dest.appendNode(node);
					if (anchorNodes.indexOf(node)>= 0)
					{
						target.removeAnchorNode(node);
						if (!ignoreAnchorNodes)
							dest.appendAnchorNode(node);
					}
				}
			}
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				var index = target.indexOfConnector(connector);
				if (index >= 0)
				{
					target.removeConnectorAt(index, true);  // preserve linked objects
					dest.appendConnector(connector);
				}
			}
		}
		finally
		{
			//console.log('[struct merge done]');
			dest.endUpdate();
			target.endUpdate();
		}
		*/
		return Kekule.StructureFragment.moveChildBetweenStructFragment(target, dest, moveNodes, moveConnectors, ignoreAnchorNodes);
	},

	/** @private */
	_getCascadeConnectedNodesAndConnectors: function(connector, parentStructFragment)
	{
		var connectors = [];
		var nodes = [];
		var objs = connector.getConnectedObjs();
		for (var j = 0, k = objs.length; j < k; ++j)
		{
			var obj = objs[j];
			if (obj !== connector)
			{
				if (parentStructFragment)
					obj = parentStructFragment.findDirectChildOfObj(obj);
				if (obj instanceof Kekule.ChemStructureNode)
					Kekule.ArrayUtils.pushUnique(nodes, obj);
				else if (obj instanceof Kekule.ChemStructureConnector)
				{
					Kekule.ArrayUtils.pushUnique(connectors, obj);
					var connected = Kekule.ChemStructureUtils._getCascadeConnectedNodesAndConnectors(obj);
					Kekule.ArrayUtils.pushUnique(connectors, connected.connectors);
					Kekule.ArrayUtils.pushUnique(nodes, connected.nodes);
				}
			}
		}
		return {'connectors': connectors, 'nodes': nodes};
	},

	/**
	 * Merge all fragments into a big one (this one may be unconnected).
	 * @param {Array} fragments
	 * @param {Class} newFragmentClass If set, new fragment will be based on this class.
	 *   Otherwise an instance of {@link Kekule.Molecule} will be created.
	 * @return {Kekule.StructureFragment}
	 */
	mergeStructFragments: function(fragments, newFragmentClass)
	{
		if (fragments.length <= 1)
			return fragments[0];
		else
		{
			var fclass = newFragmentClass || Kekule.Molecule;
			var result = new fclass();

			for (var i = 0, l = fragments.length; i < l; ++i)
			{
				var frag = fragments[i].clone();
				Kekule.ChemStructureUtils.moveChildBetweenStructFragment(frag, result, frag.getNodes(), frag.getConnectors());
			}
			return result;
		}
	},

	/**
	 * Split structFragment with unconnected nodes to multiple ones.
	 * @param {Kekule.StructureFragment} structFragment
	 * @returns {Array}
	 */
	splitStructFragment: function(structFragment)
	{
		if (!structFragment.hasCtab())  // no ctab, can not split
			return [structFragment];

		var allNodes = structFragment.getNodes();
		if (allNodes.length <= 0)
			return [structFragment];

		var allConnectors = structFragment.getConnectors();

		var splits = [];
		var currNodes = [allNodes[0]];
		var currConnectors = [];
		var currIndex = 0;
		//while (currNodes.length < allNodes.length))
		do
		{
			var node = currNodes[currIndex];
			var connectors = node.getLinkedConnectors();
			if (node.getCrossConnectors)
				connectors.concat(node.getCrossConnectors() || []);
			Kekule.ArrayUtils.pushUnique(currConnectors, connectors);
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connected = Kekule.ChemStructureUtils._getCascadeConnectedNodesAndConnectors(connectors[i], structFragment);
				Kekule.ArrayUtils.pushUnique(currConnectors, connected.connectors);
				Kekule.ArrayUtils.pushUnique(currNodes, connected.nodes);
			}
			++currIndex;
		}
		while (currIndex < currNodes.length);

		splits.push(structFragment);

		var restNodes = Kekule.ArrayUtils.exclude(allNodes, currNodes);
		var restConnectors = Kekule.ArrayUtils.exclude(allConnectors, currConnectors);

		if (restNodes.length > 0)
		{
			var fragClass = structFragment.getClass();
			var newFragment = new fragClass();
			Kekule.ChemStructureUtils.moveChildBetweenStructFragment(structFragment, newFragment, restNodes, restConnectors);

			var newSplits = Kekule.ChemStructureUtils.splitStructFragment(newFragment);
			splits = splits.concat(newSplits);
		}
		return splits;
	},

	/**
	 * Returns a vector reflect coord2 - coord1.
	 * @param {Kekule.ChemStructureObject} obj1
	 * @param {Kekule.ChemStructureObject} obj2
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash}
	 */
	getAbsCoordVectorBetweenObjs: function(obj1, obj2, coordMode, allowCoordBorrow)
	{
		var coord1 = obj1.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		var coord2 = obj2.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		return Kekule.CoordUtils.substract(coord2, coord1);
	}
};


/**
 * An abstract class to analysis and get tokens from text.
 * @augments ObjectEx
 * @class
 * @param {String} text Text to analysis.
 */
Kekule.TokenAnalyzer = Class.create(ObjectEx,
/** @lends Kekule.TokenAnalyzer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TokenAnalyzer',
	/**
	 * @constructs
	 */
	initialize: function($super, text)
	{
		$super();
		this.setSrcText(text);
	},
	/** @private */
	initProperties: function()
	{
		// private properties
		this.defineProp('srcText', {'dataType': DataType.STRING,
			'setter': function(value)
			{
				var v = value || '';
				this.setPropStoreFieldValue('srcText', v);
				this.setPropStoreFieldValue('srcLength', v.length);
				this.setCurrPos(0);
			}
		});
		this.defineProp('srcLength', {'dataType': DataType.INT, 'setter': null, 'serializable': false})
		this.defineProp('currPos', {'dataType': DataType.INT, 'serializable': false});
	},
	/**
	 * Returns type of char. Neighboring char with same type can be merged into a token.
	 * Descendants need to override this method.
	 * @param {String} c
	 * @returns {Variant}
	 * @private
	 */
	getCharType: function(c)
	{
		// do nothing here
		return 0;
	},
	/**
	 * Check if two char types are matched and can be merged into a token.
	 * Descendants may override this method.
	 * @param {Variant} currT
	 * @param {Variant} lastT
	 * @return {Bool}
	 */
	isCharTypeMatched: function(currT, lastT)
	{
		return currT === lastT;
	},
	/** @private */
	nextCharInfo: function()
	{
		var p = this.getCurrPos();
		if (p >= this.getSrcLength())
			return null;
		else
		{
			var c = this.getSrcText().charAt(p);
			this.setCurrPos(p + 1);
			return {'char': c, 'charType': this.getCharType(c)};
		}
	},
	/**
	 * Returns next token of srcText.
	 * @returns {Hash} {token, tokenType}
	 * @private
	 */
	nextTokenInfo: function()
	{
		var lastCharInfo = this.nextCharInfo();
		if (lastCharInfo)
		{
			var token = lastCharInfo['char'];  // .char will cause problem in YUI compressor
			var tokenType = lastCharInfo.charType;
			var currCharInfo = this.nextCharInfo();
			while (currCharInfo && this.isCharTypeMatched(currCharInfo.charType, lastCharInfo.charType))
			{
				token += currCharInfo['char'];
				lastCharInfo = currCharInfo;
				currCharInfo = this.nextCharInfo();
			}
			if (currCharInfo)  // now currCharInfo type is different from last, reverse a pos
				this.setCurrPos(this.getCurrPos() - 1);
			return {'token': token, 'tokenType': tokenType};
		}
		else
			return null;
	},
	/**
	 * Returns all token info in src text.
	 * @returns {Array} Each item is a hash of {token, tokenType}.
	 */
	getAllTokenInfos: function()
	{
		var result = [];
		var info = this.nextTokenInfo();
		while (info)
		{
			result.push(info);
			info = this.nextTokenInfo();
		}
		return result;
	}
});

/**
 * Enumeration of chem text token type.
 * @enum
 */
Kekule.ChemTextTypes = {
	// Chem text char types
	/** @private */
	CT_ATOM_SYMBOL_LEADING: 1,  // highercased alphabet, e.g. 'C' in 'Cu'
	/** @private */
	CT_ATOM_SYMBOL_FOLLOWING: 2,  // lowercased alphabet, e.g. 'u' in 'Cu'
	/** @private */
	CT_CHARGE_SYMBOL: 3,  // '+', '-'
	/** @private */
	CT_NUMBER: 4,
	/** @private */
	CT_BRACKET_LEADING: 10,  // '(', '[' and '{'
	/** @private */
	CT_BRACKET_TAILING: 11,  // ')', ']' and '}'
	/** @private */
	CT_SEPARATOR: 20,  // space to separate texts
	/** @private */
	CT_UNKNOWN: 0
};
var CT = Kekule.ChemTextTypes;

/**
 * A helper class to analysis chem text (e.g. formula).
 * @augments Kekule.TokenAnalyzer
 * @class
 * @param {String} text Text to analysis.
 */
Kekule.ChemTextAnalyzer = Class.create(Kekule.TokenAnalyzer,
/** @lends Kekule.ChemTextAnalyzer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ChemTextAnalyzer',
	/** @ignore */
	getCharType: function(c)
	{
		if (c === ' ')
			return CT.CT_SEPARATOR;
		if (c >= '0' && c <= '9')  // number
			return CT.CT_NUMBER;
		else if (['+', '-'].indexOf(c) >= 0)
			return CT.CT_CHARGE_SYMBOL;
		else if (['(', '[', '{'].indexOf(c) >= 0)
			return CT.CT_BRACKET_LEADING;
		else if ([')', ']', '}'].indexOf(c) >= 0)
			return CT.CT_BRACKET_TAILING;
		else if (c >= 'A' && c <= 'Z')
			return CT.CT_ATOM_SYMBOL_LEADING;
		else if (c >= 'a' && c <= 'z')
			return CT.CT_ATOM_SYMBOL_FOLLOWING;
		else
			return CT.CT_UNKNOWN;
	},
	/** @ignore */
	isCharTypeMatched: function(currT, lastT)
	{
		if (Kekule.ArrayUtils.intersect([CT.CT_BRACKET_LEADING, CT.CT_BRACKET_TAILING], [currT, lastT]).length)
			return false;
		else
			return (currT === lastT && lastT !== CT.CT_ATOM_SYMBOL_LEADING) ||
				(lastT === CT.CT_ATOM_SYMBOL_LEADING && currT === CT.CT_ATOM_SYMBOL_FOLLOWING);
	}
});

/**
 * Util class to manipulate molecule formulas.
 * @class
 */
Kekule.FormulaUtils = {
	/**
	 * Nestable brackets used to display formula.
	 * @private
	 */
	FORMULA_BRACKETS: [['(', ')'], ['[', ']'], ['{', '}']],
	/** @private */
	FORMULA_BRACKET_TYPE_COUNT: 3,
	/**
	 * Create a formula object from plain text.
	 * @param {String} text
	 * @param {Kekule.ChemObject} parent Parent object of formula.
	 * @param {Kekule.MoleculeFormula} formula If this param is set, changes will be take on this object.
	 *   Otherwise a new instance of formula will be created and returned.
	 * @returns {Kekule.MoleculeFormula}
	 */
	textToFormula: function(text, parent, formula)
	{
		var result = formula || null;
		if (result)
		{
			result.clear();
		}
		var analyzer = new Kekule.ChemTextAnalyzer(text);
		try
		{
			var tokenInfos = analyzer.getAllTokenInfos();
			//console.log(tokenInfos);
			if (!result)
				result = new Kekule.MolecularFormula(parent);
			var tokenLength =  tokenInfos.length;
			if (tokenLength)
			{
				var currObj, currSection, lastTokenInfo = null, currCharge;
				var currFormula = result;
				currSection = {};

				var createNewSection = function()
				{
					currSection = {};
				};
				var wrapUpCurrSection = function()
				{
					if (currSection && currSection.obj)
						currFormula.appendSection(currSection.obj, currSection.count, currSection.charge);
				};

				// iterate through tokens
				for (var i = 0; i < tokenLength; ++i)
				{
					var tokenInfo = tokenInfos[i];
					var tokenType = tokenInfo.tokenType;
					var token = tokenInfo.token;
					var handled = false;   // mark if currToken is handled
					if (tokenType === CT.CT_BRACKET_LEADING)  // bracket, new layer
					{
						wrapUpCurrSection();
						var subFormula = new Kekule.MolecularFormula(parent);
						subFormula._parentFormula = currFormula;
						currFormula = subFormula;
						createNewSection();
						handled = true;
					}
					else if (tokenType === CT.CT_BRACKET_TAILING)
					{
						wrapUpCurrSection();
						createNewSection();
						currSection.obj = currFormula;
						currFormula = currFormula._parentFormula;
						tokenInfo.asSymbol = true;
						handled = true;
					}
					else if ([CT.CT_ATOM_SYMBOL_LEADING, CT.CT_ATOM_SYMBOL_FOLLOWING].indexOf(tokenType) >= 0)  // atom symbol
					{
						if (currSection.obj)
						{
							wrapUpCurrSection();
							createNewSection();
						}
						// TODO: currently only atom can be created
						var massNum = currSection.massNum;
						if (!massNum)  // check if lastToken is unhandled number, if so, it may be the mass num of current symbol
						{
							if (lastTokenInfo && !lastTokenInfo.handled && (lastTokenInfo.tokenType === CT.CT_NUMBER))
								massNum = parseInt(lastTokenInfo.token, 10) || null;
						}
						var slabel = '' + (massNum || '') + token;
						currSection.obj = Kekule.ChemStructureNodeFactory.createByLabel(slabel);
						//currSection.obj = new Kekule.Atom(null, token, massNum);
						tokenInfo.asSymbol = true;
						handled = true;
					}
					else if (tokenType === CT.CT_CHARGE_SYMBOL)
					{
						currCharge = (token === '+')? +1: -1;
						tokenInfo.asCharge = true;
						if (lastTokenInfo.tokenType === CT.CT_NUMBER)
						{
							var schargeCount;
							if (lastTokenInfo.asCount)
							{
								if (lastTokenInfo.token.length > 1)  // last digit should be charge
								{
									var t = lastTokenInfo.token;
									schargeCount = t.substr(t.length - 1);
									if (lastTokenInfo.asCount)
										currSection.count = parseInt(t.substring(0, t.length - 1), 10);
								}
								else
								{
									schargeCount = lastTokenInfo.token;
									if (lastTokenInfo.asCount)
										currSection.count = 1;
								}
							}
							else
							{
								schargeCount = lastTokenInfo.token;
								lastTokenInfo.asChargeCount = true;
							}
							currCharge *= parseInt(schargeCount, 10);
						}
						currSection.charge = currCharge;
						handled = true;
					}
					else if (tokenType === CT.CT_NUMBER)
					{
						var num = parseInt(token, 10);
						if (currCharge && lastTokenInfo.tokenType === CT.CT_CHARGE_SYMBOL && lastTokenInfo.asCharge)  // last token is charge
						{
							currCharge *= num;
							currSection.charge = currCharge;
							tokenInfo.asChargeCount = true;
							handled = true;
						}
						else if (currSection.obj && lastTokenInfo.asSymbol)  // atom symbol already set, number is count
						{
							currSection.count = num;
							tokenInfo.asCount = true;
							handled = true;
						}
						else if (!currSection.obj)  // symbol not set, this leading number should be the isotope number
						{
							currSection.massNum = num;
							handled = true;
						}
						else  // do not know the use of number, may be the mass num of next atom symbol
						{

						}
					}
					tokenInfo.handled = handled;
					lastTokenInfo = tokenInfo;
				}

				if (currSection && currSection.obj)
					wrapUpCurrSection();
			}
			// debug
			//var rt = result.getDisplayRichText();
			//console.log(Kekule.Render.RichTextUtils.toText(rt));
			return result;
		}
		finally
		{
			analyzer.finalize();
		}
	},

	/**
	 * Returns plain text generated by formula.
	 * @param {Kekule.MolculeFormula} formula
	 * @param {Bool} showCharge Whether display formula charge.
	 * @param {Int} partialChargeDecimalsLength
	 * @returns {String}
	 */
	formulaToText: function(formula, showCharge, partialChargeDecimalsLength)
	{
		/*
		var result = '';
		var sections = formula.getSections();
		*/
		/*
		var rt = Kekule.Render.ChemDisplayTextUtils.formulaToRichText(formula, true, true);
		var result = Kekule.Render.RichTextUtils.toText(rt);
		return result;
		*/
		if (Kekule.ObjUtils.isUnset(showCharge))
			showCharge = true;
		return FU._convFormulaToText(formula, false, showCharge, partialChargeDecimalsLength);
	},

	/** @private */
	_convFormulaToText: function(formula, showBracket, showCharge, partialChargeDecimalsLength)
	{
		var result = '';
		var sections = formula.getSections();
		if (showBracket)
		{
			var bracketIndex = formula.getMaxNestedLevel() % FU.FORMULA_BRACKET_TYPE_COUNT;
			var bracketStart =FU.FORMULA_BRACKETS[bracketIndex][0];
			var bracketEnd = FU.FORMULA_BRACKETS[bracketIndex][1];
			result += bracketStart;
		}
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var obj = sections[i].obj;
			var charge = formula.getSectionCharge(sections[i]);
			var subgroup = null;
			if (obj instanceof Kekule.MolecularFormula)  // a sub-formula
			{
				// TODO: sometimes bracket is unessential, such as SO42- and so on, need more judge here
				subgroup = FU._convFormulaToText(obj, true, false, false, partialChargeDecimalsLength); // do not show charge right after, we will add it later
			}
			else if (obj.getLabel) // an atom/isotope
			{
				var subgroup = obj.getLabel();
				if (obj.getMassNumber && obj.getMassNumber())  // explicit mass number atom, add a separator before it
					subgroup = (result? ' ': '') + subgroup;
			}

			if (subgroup)
			{
				var explicitCount = false;
				// count
				if (sections[i].count != 1)
				{
					subgroup += sections[i].count;
					explicitCount = true;
				}

				// charge is draw after count
				if (showCharge && charge)
				{
					var chargelabel = FU._convChargeToText(charge, partialChargeDecimalsLength);
					//chargelabel += chargeSign;
					subgroup += (explicitCount? ' ': '') + chargelabel;  // separate count and charge
				}

				result += subgroup;
			}
		}
		if (showBracket)
			result += bracketEnd;

		if (showCharge)
		{
			var charge = formula.getCharge();
			if (charge)
			{
				var chargelabel = FU._convChargeToText(charge, partialChargeDecimalsLength);
				result += chargelabel;
			}
		}

		return result;
	},
	/** @private */
	_convChargeToText: function(charge, partialChargeDecimalsLength)
	{
		if (!charge)
			return null;
		var chargeSign = (charge > 0)? '+': '-';
		var chargeAmount = Math.abs(charge);
		var chargelabel = chargeSign;
		if (chargeAmount != 1)
		{
			chargelabel = (partialChargeDecimalsLength? Kekule.NumUtils.toDecimals(chargeAmount, partialChargeDecimalsLength): chargeAmount.toString()) + chargeSign;
		}
		return chargelabel;
	}
};

var FU = Kekule.FormulaUtils;

// extend MoleculeFormula class
ClassEx.defineProp(Kekule.MolecularFormula, 'text', {
	'dataType': DataType.STRING, 'serializable': false,
	'getter': function() { return FU.formulaToText(this); },
	'setter': function(value)
	{
		FU.textToFormula(value, this.getParent(), this);
	}
});

})();
