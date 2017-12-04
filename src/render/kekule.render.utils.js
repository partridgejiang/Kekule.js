/**
 * @fileoverview
 * Utility classes and methods for rendering 2D or 3D molecule structures.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /core/kekule.structures.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.extensions.js
 * requires /render/kekule.render.renderColorData.js
 */

/**
 * Contains constants for rich text manipulation.
 * @class
 */
Kekule.Render.RichText = {
	/** Indicate an rich text item is text section. */
	SECTION: 'section',
	/** Indicate an rich text item is group. */
	GROUP: 'group',
	/** Indicate an rich text group contains multiline. */
	LINES: 'lines',
	/** Superscript. */
	SUP: 'superscript',
	/** Subscript */
	SUB: 'subscript',
	/** Normal text */
	NORMAL: 'normal'
};

/**
 *  Methods to manipulate rich format text.
 *  A rich format text is consists of a array of objects. For example:
 *    {
 *    	role: 'seq',
 *    	anchorItem: itemRef,  // or default first item, must be the direct child of group or seq
 *    	items: [
 *        {
 *          role: 'lines',  // this special role is used in multiline text
 *          items: [
 *          {
 *            role: 'section',
 *            text: 'Text1',
 *            //font: 'arial bold italic 10px',
 *            textType: 'subscript',
 *            refItem: anRichTextItem,   // the subscript or superscript is attached to which one? If not set, regard prev one as refItem
 *            horizontalAlign: 1,   // value from Kekule.Render.TextAlign
 *            verticalAlign: 1,
 *            charDirection: 1,
 *            overhang: 0.1,
 *            oversink: 0.1,
 * 					  _noAlignRect: true,  // a special property to tell the drawer that this item should not be considered into align box.
 * 				  									// super/subscript defaultly has noAlign = true
 *          },
 *          {
 *            role: 'section'
 *            text: 'Text2',
 *            fontSize: '20px',
 *            textType: 'normal'
 *          },
 *          {
 *            role: 'group',
 *            anchorItem: itemRef,
 *            items: [...]
 *          }
 *          ]
 *       ]
 *    }
 *  @class
 */
Kekule.Render.RichTextUtils = {
	/** @private */
	STYLE_PROPS: ['fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'color', 'opacity'],
	/**
	 * Create a new and empty rich text object.
	 */
	create: function()
	{
		//return {'items': []};
		return Kekule.Render.RichTextUtils.createGroup(/*'seq'*/);
	},
	/**
	 * Create a new group.
	 * @param {String} role Role of group, if not set, a normal role of 'group' will be created.
	 */
	createGroup: function(role, style)
	{
		var result = {'role': role || 'group', 'items': []};
		if (style)
		{
			for (var p in style)
			{
				if (style.hasOwnProperty(p))
				{
					result[p] = style[p];
				}
			}
		}
		return result;
	},
	/**
	 * Create a section object of richText (an item in richtext array).
	 * @param {String} text
	 * @param {Hash} style
	 */
	createSection: function(text, style)
	{
		var section = {'text': text};
		if (style)
		{
			for (var p in style)
			{
				if (style.hasOwnProperty(p))
				{
					section[p] = style[p];
				}
			}
		}
		return section;
	},
	/**
	 * Convert a plain string to rich format text.
	 * Multiline is supported.
	 * @param {String} str
	 * @param {Hash} style Can be null
	 * @returns {Object}
	 */
	strToRichText: function(str, style)
	{
		if (!str)
			str = '';
		var RTU = Kekule.Render.RichTextUtils;
		var lines = str.split('\n');
		//console.log('split to', lines);
		if (lines.length <= 1)
			return Kekule.Render.RichTextUtils.appendText(RTU.create(), str, style);
		else  // multiline
		{
			var result = RTU.createGroup(Kekule.Render.RichText.LINES);
			for (var i = 0, l = lines.length; i < l; ++i)
			{
				var line = lines[i] || '\u00a0';  // unicode non-break blank, to insert a blank line  // TODO: may need a better solution
				RTU.appendText(result, line, style);
			}
			//console.log('rich text', result);
			return result;
		}
	},
	/**
	 * Insert a styled text to a special position of richText group.
	 * @param {Object} richTextGroup
	 * @param {Int} index
	 * @param {String} text
	 * @param {Hash} style Can be null.
	 * @param {Bool} isAnchor Whether the newly insert section will become the anchorItem.
	 * @returns {Object}
	 */
	insertText: function(richTextGroup, index, text, style, isAnchor)
	{
		var section = Kekule.Render.RichTextUtils.createSection(text, style);
		//richText.splice(index, 0, section);
		richTextGroup.items.splice(index, 0, section);
		if (isAnchor)
			richTextGroup.anchorItem = section;
		return richTextGroup;
	},
	/**
	 * Append a styled text to richText group and returns the whole group.
	 * @param {Object} richTextGroup
	 * @param {String} text
	 * @param {Hash} style Can be null.
	 * @param {Bool} isAnchor Whether the newly insert section will become the anchorItem.
	 * @returns {Object} richTextGroup
	 */
	appendText: function(richTextGroup, text, style, isAnchor)
	{
		var section = Kekule.Render.RichTextUtils.createSection(text, style);
		richTextGroup.items.push(section);
		if (isAnchor)
			richTextGroup.anchorItem = section;
		return richTextGroup;
	},
	/**
	 * Append a styled text to richText group and returns the new section created.
	 * @param {Object} richTextGroup
	 * @param {String} text
	 * @param {Hash} style Can be null.
	 * @param {Bool} isAnchor Whether the newly insert section will become the anchorItem.
	 * @returns {Object} New section appended to richTextGroup.
	 */
	appendText2: function(richTextGroup, text, style, isAnchor)
	{
		var section = Kekule.Render.RichTextUtils.createSection(text, style);
		richTextGroup.items.push(section);
		if (isAnchor)
			richTextGroup.anchorItem = section;
		return section;
	},
	/**
	 * Insert a group or section to a special position in destGroup.
	 * @param {Object} destGroup
	 * @param {Int} index
	 * @param {Object} groupOrSection
	 * @returns {Object}
	 */
	insert: function(destGroup, index, groupOrSection)
	{
		destGroup.items.splice(index, 0, groupOrSection);
		return destGroup;
	},
	/**
	 * Append a group or section to tail in destGroup.
	 * @param {Object} destGroup
	 * @param {Object} groupOrSection
	 * @returns {Object}
	 */
	append: function(destGroup, groupOrSection)
	{
		destGroup.items.push(groupOrSection);
		return destGroup;
	},
	/**
	 * Append a set of groups or sections to tail in destGroup.
	 * @param {Object} destGroup
	 * @param {Array} items
	 * @returns {Object}
	 */
	appendItems: function(destGroup, items)
	{
		destGroup.items = destGroup.items.concat(Kekule.ArrayUtils.toArray(items));
		return destGroup;
	},

	/**
	 * Returns type (section or group) of item.
	 * @param {Object} item
	 * @returns {String} Constant value from {@link Kekule.Render.RichText}.
	 */
	getItemType: function(item)
	{
		if (item.items)
		{
			//return Kekule.Render.RichText.GROUP;
			return item.role;  // GROUP or LINE
		}
		else
		{
			return Kekule.Render.RichText.SECTION;
		}
	},
	/**
	 * Returns role (normal, sup or sub) of item.
	 * @param {Object} item
	 * @returns {String} Constant value from {@link Kekule.Render.RichText}
	 */
	getItemRole: function(item)
	{
		//return /*item.role || Kekule.Render.RichText.NORMAL;*/
		var R = Kekule.Render.RichText;
		return (Kekule.Render.RichTextUtils.getItemType(item) === R.GROUP)? R.GROUP: R.SECTION;
	},
	/**
	 * Return text type (normal, superscript or subscript) of item.
	 * @param {Object} item
	 * @returns {String} Constant value from {@link Kekule.Render.RichText}
	 */
	getItemTextType: function(item)
	{
		return item.textType || Kekule.Render.RichText.NORMAL;
	},
	/**
	 * Check if item is a superscript.
	 * @param {Object} item
	 * @returns {Bool}
	 */
	isSuperscript: function(item)
	{
		return Kekule.Render.RichTextUtils.getItemTextType(item) == Kekule.Render.RichText.SUP;
	},
	/**
	 * Check if item is a superscript.
	 * @param {Object} item
	 * @returns {Bool}
	 */
	isSubscript: function(item)
	{
		return Kekule.Render.RichTextUtils.getItemTextType(item) == Kekule.Render.RichText.SUB;
	},
	/**
	 * Check if an item is a rich text group.
	 * @param {Object} item
	 * @returns {Bool}
	 */
	isGroup: function(item)
	{
		return Kekule.Render.RichTextUtils.getItemType(item) === Kekule.Render.RichText.GROUP;
	},
	/**
	 * Check if an item is a rich text section.
	 * @param {Object} item
	 * @returns {Bool}
	 */
	isSection: function(item)
	{
		return Kekule.Render.RichTextUtils.getItemType(item) === Kekule.Render.RichText.SECTION;
	},

	/**
	 * Returns the first normal text (nor sub/superscript) in rich text.
	 * @param {Object} richTextGroup
	 * @returns {Object}
	 */
	getFirstNormalTextSection: function(richTextGroup)
	{
		for (var i = 0, l = richTextGroup.items.length; i < l; ++i)
		{
			var item = richTextGroup.items[i];
			var textType = Kekule.Render.RichTextUtils.getItemTextType(item);
			if (textType === Kekule.Render.RichText.NORMAL)
				return item;
		}
		return null;
	},

	/**
	 * Returns the actual refItem of item. Generally this function returns item.refItem,
	 * however, if that value is not set, function will return item's nearest sibling.
	 * @param {Object} item
	 * @param {Object} parent item's parent group.
	 * @returns {Object}
	 */
	getActualRefItem: function(item, parent)
	{
		var result = item.refItem;
		if ((!result) && (parent.items.length > 1))  // check sibling
		{
			var index = parent.items.indexOf(item);
			if (index > 0)
				result = parent.items[index - 1];
			else if (index == 0)
				result = parent.items[1];
			else
				result = null;
		}
		return result;
	},

	/**
	 * Find the real anchor item in richText cascadely.
	 * @param {Object} richText
	 * @returns {Object}
	 */
	getFinalAnchorItem: function(richText)
	{
		if (richText.anchorItem)
			return Kekule.Render.RichTextUtils.getFinalAnchorItem(richText.anchorItem);
		else
			return richText;
	},

	/**
	 * Tidy the rich text and merge groups with same style.
	 * @param {Object} richText
	 * @returns {Object}
	 */
	tidy: function(richText)
	{
		var result = Kekule.Render.RichTextUtils.createGroup(richText.role);
		var currIndex = -1;
		for (var i = 0, l = richText.items.length; i < l; ++i)
		{
			var item = richText.items[i];
			if (item.items) // is group
			{
				var newGroup = Kekule.Render.RichTextUtils.tidy(item);
				// check if newGroup has only one section, if true, convert it into a section
				if (newGroup.items.length == 1)
				{
					var newItem = Object.extend({}, newGroup);
					delete newItem.items;
					delete newItem.role;
					newItem = Object.extend(newItem, newGroup.items[0]);
					item = newItem;
					// then try merge items
				}
				else if (newGroup.items.length > 0)
				{
					++currIndex;
					result.items.push(newGroup);
					continue;
				}
			}
			//else // text item, try merge
 			{
				var merged = false;
				if (currIndex >= 0)
				{
					var prevItem = result.items[currIndex];
					if (!prevItem.items)  // not group, just text
					{
						// check if item and prevItem has the same style
						if (Kekule.ObjUtils.equal(item, prevItem, ['text']))
						{
							prevItem.text += item.text;
							merged = true;
						}
					}
				}
				if (!merged)
				{
					++currIndex;
					result.items.push(Object.extend({}, item));
				}
			}
		}
		return result;
	},

	/**
	 * Clone source rich text.
	 * @param {Object} richText
	 * @returns {Object}
	 */
	clone: function(richText)
	{
		var result = {};
		Object.extend(result, richText);
		if (richText.items)
		{
			result.items = [];
			for (var i = 0, l = richText.items.length; i < l; ++i)
			{
				var item = {};
				item = Kekule.Render.RichTextUtils.clone(richText.items[i]);
				result.items.push(item);
				/*
				if (richText.anchorItem && (richText.anchorItem == richText.items[i]))
					result.anchorItem = item;
				*/
			}
		}
		// RefItem and AnchorItem pointer should be handled carefully

		if (result.items)
		{
			if (richText.anchorItem)
			{
				var index = richText.items.indexOf(richText.anchorItem);
				if (index >= 0)
					result.anchorItem = result.items[index]
				else
					result.anchorItem = null;
			}

			for (var i = 0, l = result.items.length; i < l; ++i)
			{
				var originItem = richText.items[i];
				var item = result.items[i];
				if (originItem.refItem)
				{
					var index = richText.items.indexOf(originItem.refItem);
					if (index >= 0)
						item.refItem = result.items[index]
					else
						item.refItem = null;
				}
			}
		}
		return result;
	},

	/**
	 * Extract text in rich text and returns a pure string.
	 * @param {Object} richText
	 * @returns {String}
	 */
	toText: function(richText)
	{
		var result = '';
		if (richText.items)
		{
			for (var i = 0, l = richText.items.length; i < l; ++i)
			{
				var item = richText.items[i];
				if (item.items)  // group
					result += Kekule.Render.RichTextUtils.toText(item);
				else if (item.text)  // plain text
				{
					result += item.text;
				}
			}
		}
		else
			return richText.text || '';
		return result;
	},

	_toDebugHtml: function(richText)
	{
		var result = '';
		for (var i = 0, l = richText.items.length; i < l; ++i)
		{
			var item = richText.items[i];
			if (item.items)  // group
				result += Kekule.Render.RichTextUtils._toDebugHtml(item);
			else if (item.text)  // plain text
			{
				switch (item.textType)
				{
					case Kekule.Render.RichText.SUB:
						result += '<sub>' + item.text + '</sub>';
						break;
					case Kekule.Render.RichText.SUP:
						result += '<sup>' + item.text + '</sup>';
						break;
					default:
						result += item.text;
				}
			}
		}
		return result;
	},

	/**
	 * Convert rich text to HTML element.
	 * Note: in the conversion, vertical lines are all turned into horizontal lines
	 * @param {Document} doc Owner document of result element.
	 * @param {Object} richText
	 * @param {Bool} reversedDirection
	 * @returns {HTMLElement}
	 */
	toHtml: function(doc, richText, reversedDirection)
	{
		var RT = Kekule.Render.RichText;
		var result;

		var reversed;
		if (richText.charDirection)
			reversed = richText.charDirection === Kekule.Render.TextDirection.RTL
				|| richText.charDirection === Kekule.Render.TextDirection.BTT;
		else
			reversed = reversedDirection;


		var role = richText.role;
		if (role === RT.SECTION || richText.text)  // text section
		{
			var textType = richText.textType;
			var tagName = (textType === RT.SUB)? 'sub':
					(textType === RT.SUP)? 'sup':
					'span';
			result = doc.createElement(tagName);
			var text = richText.text;
			if (reversed)
				text = text.reverse();
			Kekule.DomUtils.setElementText(result, richText.text || '');
		}
		else // line or group
		{
			var childEmbedTagName = null;
			var childEmbedStyleText;
			if (role === RT.LINES)
			{
				result = doc.createElement('div');
				childEmbedTagName = 'p';
				childEmbedStyleText = 'margin:0.2em 0;padding:0';
			}
			else // group
			{
				result = doc.createElement('span');
			}
			// convert children
			var lastChildElem;
			for (var i = 0, l = richText.items.length; i < l; ++i)
			{
				var item = richText.items[i];
				var childElem = Kekule.Render.RichTextUtils.toHtml(doc, item, reversed);
				if (childEmbedTagName)
				{
					var embedElem = doc.createElement(childEmbedTagName);
					if (childEmbedStyleText)
						embedElem.style.cssText = childEmbedStyleText;
					embedElem.appendChild(childElem);
					childElem = embedElem;
				}
				if (!reversed || !lastChildElem)
					result.appendChild(childElem);
				else
					result.insertBefore(childElem, lastChildElem);
				lastChildElem = childElem;
			}
		}

		// styles
		var elemStyle = result.style;
		var styleProps = Kekule.Render.RichTextUtils.STYLE_PROPS;
		for (var i = 0, l = styleProps.length; i < l; ++i)
		{
			var prop = styleProps[i];
			if (richText[prop])
			{
				elemStyle[prop] = richText[prop];
			}
		}

		return result;
	},

	/**
	 * Create new rich text from HTML element.
	 * @param {Element} htmlElement
	 * @returns {Object} Created richtext object.
	 */
	fromHtml: function(htmlElement)
	{
		var RT = Kekule.Render.RichText;
		var RTU = Kekule.Render.RichTextUtils;
		var DU = Kekule.DomUtils;
		var SU = Kekule.StyleUtils;

		function _createRichTextFromHtmlNode(node, isRoot)
		{
			if (node.nodeType === Node.TEXT_NODE)  // pure text node, create a section
			{
				var text = node.nodeValue;
				// erase line breaks
				text = text.replace(/[\r\n]/g, '');
				return text.trim()? RTU.createSection(text): null; // ignore all space text
			}
			else if (node.nodeType === Node.ELEMENT_NODE)
			{
				var stylePropNames = RTU.STYLE_PROPS;
				stylePropNames.push('direction');
				var styles = {};
				// extract styles from HTML
				for (var i = 0, l = stylePropNames.length; i < l; ++i)
				{
					var stylePropName = stylePropNames[i];
					var value;
					if (isRoot)  // is root element, consider computed styles
					{
						value = SU.getComputedStyle(node, stylePropName);
					}
					else  // child elements, only consider inline styles
					{
						value = node.style[stylePropName];
					}
					if (value)
						styles[stylePropName] = value;
				}
				// char direction
				if (!styles.direction)
					styles.charDirection = Kekule.Render.TextDirection.DEFAULT;
				else
				{
					styles.charDirection = (styles.direction === 'ltr')? Kekule.Render.TextDirection.LTR:
							(styles.direction === 'rtl')? Kekule.Render.TextDirection.RTL:
							(styles.direction === 'inherit')? Kekule.Render.TextDirection.INHERIT:
							null;
					delete styles.direction;
				}

				// Check if element has children elements
				if (!DU.getFirstChildElem(node))  // no child element, may elem only contains text
				{
					var text = DU.getElementText(node);
					var tagName = node.tagName.toLowerCase();
					if (tagName === 'sub')
						styles.textType = RT.SUB;
					else if (tagName === 'sup')
						styles.textType = RT.SUP;
					else
						styles.textType = RT.NORMAL;
					return text? RTU.createSection(text, styles): null;
				}
				else  // iterate through children
				{
					var resultRole = RT.GROUP;
					var childNodes = DU.getChildNodesOfTypes(node, [Node.ELEMENT_NODE, Node.TEXT_NODE]);
					var childRTs = [];
					var hasLines = false;
					for (var i = 0, l = childNodes.length; i < l; ++i)
					{
						var child = childNodes[i];
						var childRT = _createRichTextFromHtmlNode(child, false);
						if (child.nodeType === Node.ELEMENT_NODE)  //
						{
							if (child.tagName.toLowerCase() === 'br')  // explicit line break
							{
								// push special flags
								childRTs.push('br');
								hasLines = true;
							}
							var isBlockElem = SU.isBlockElem(child);
							if (isBlockElem)
							{
								hasLines = true;
								childRT._isLine = true; // markup it is a text line
							}
						}
						if (childRT)
						{
							childRTs.push(childRT);
							//RTU.append(result, childRT);
						}
					}
					if (hasLines)  // need to group childRTs into lines
					{
						var linedChildRTs = [];
						var unpushedChildren = [];
						for (var i = 0, l = childRTs.length; i < l; ++i)
						{
							var childRT = childRTs[i];
							if (childRT._isLine || childRT == 'br')  // special break flag
							{
								if (unpushedChildren.length)  // create a new group to include all unhandled inline sections
								{
									if (unpushedChildren.length > 1)
									{
										var prevGroup = RTU.createGroup();
										RTU.appendItems(prevGroup, unpushedChildren);
										linedChildRTs.push(prevGroup);
									}
									else
										linedChildRTs.push(unpushedChildren[0]);
									unpushedChildren = [];
								}
								if (childRT._isLine)
								{
									delete childRT._isLine;
									linedChildRTs.push(childRT);
								}
							}
							else
								unpushedChildren.push(childRT);
						}
						if (unpushedChildren.length)
						{
							if (unpushedChildren.length > 1)
							{
								var prevGroup = RTU.createGroup();
								RTU.appendItems(prevGroup, unpushedChildren);
								linedChildRTs.push(prevGroup);
							}
							else
								linedChildRTs.push(unpushedChildren[0]);
						}
						childRTs = linedChildRTs;
					}
					// at last push childRTs to result
					if (hasLines)
						resultRole = RT.LINES;

					var result = RTU.createGroup(resultRole, styles);
					for (var i = 0, l = childRTs.length; i < l; ++i)
					{
						RTU.append(result, childRTs[i]);
					}
					return result;
				}
			}
		}

		return _createRichTextFromHtmlNode(htmlElement, true);
	}
};

/**
 * Methods about chem information displaying and rich text.
 * @class
 */
Kekule.Render.ChemDisplayTextUtils = {
	/** @private */
	//RADICAL_LABEL: ['', '••', '•', '••'],
	RADICAL_LABEL: ['', '\u2022\u2022', '\u2022', '\u2022\u2022'],
	/**
	 * Returns suitable text to indicate the radical.
	 * @param {Int} radical
	 * @returns {String}
	 */
	getRadicalDisplayText: function(radical)
	{
		return Kekule.Render.ChemDisplayTextUtils.RADICAL_LABEL[radical];
	},
	/**
	 * Create a rich text section (usually superscript) to display atom charge and radical.
	 * @param {Number} charge
	 * @param {Int} radical
	 * @param {Int} partialChargeDecimalsLength
	 * @param {Int} chargeMarkType
	 * @returns {Object}
	 */
	createElectronStateDisplayTextSection: function(charge, radical, partialChargeDecimalsLength, chargeMarkType)
	{
		var result = null;
		var slabel = '';
		var showCharge = (!!charge) && (!partialChargeDecimalsLength || (Math.abs(charge) > Math.pow(10, -partialChargeDecimalsLength)/2));
		if (showCharge)
		{
			var chargeSign = (charge > 0)? '+': '-';
			var chargeAmount = Math.abs(charge);
			if (chargeAmount != 1)
			{
				slabel += partialChargeDecimalsLength? Kekule.NumUtils.toDecimals(chargeAmount, partialChargeDecimalsLength): chargeAmount.toString();
			}
			else  // +1 or -1, may use different charge sign char
			{
				if (chargeMarkType === Kekule.Render.ChargeMarkRenderType.CIRCLE_AROUND)
					chargeSign = (charge > 0)? '\u2295': '\u2296';
			}
			slabel += chargeSign;
		}

		if (radical)
		{
			slabel += Kekule.Render.ChemDisplayTextUtils.getRadicalDisplayText(radical) || '';
		}

		if (slabel)
			result = Kekule.Render.RichTextUtils.createSection(slabel,
				{'textType': Kekule.Render.RichText.SUP, 'charDirection': Kekule.Render.TextDirection.LTR}
			);
		return result;
	},

	/**
	 * Convert a chemistry formula to a displayable rich format text label.
	 * @param {Kekule.MolecularFormula} formula
	 * @param {Bool} showCharge Whether display formula charge.
	 * @param {Bool} showRadical Whether display formula radical.
	 * @param {Int} partialChargeDecimalsLength
	 * @returns {Object}
	 */
	formulaToRichText: function(formula, showCharge, showRadical, partialChargeDecimalsLength, displayConfigs, chargeMarkType)
	{
		//var result = Kekule.Render.RichTextUtils.create();
		var result = Kekule.Render.ChemDisplayTextUtils._convFormulaToRichTextGroup(formula, false, showCharge, showRadical, partialChargeDecimalsLength, displayConfigs, chargeMarkType);
		return result;
	},

	/** @private */
	_convFormulaToRichTextGroup: function(formula, showBracket, showCharge, showRadical, partialChargeDecimalsLength, displayConfigs, chargeMarkType)
	{
		var result = Kekule.Render.RichTextUtils.createGroup();
		var sections = formula.getSections();
		if (showBracket)
		{
			var bracketIndex = formula.getMaxNestedLevel() % Kekule.FormulaUtils.FORMULA_BRACKET_TYPE_COUNT;
			var bracketStart = Kekule.FormulaUtils.FORMULA_BRACKETS[bracketIndex][0];
			var bracketEnd = Kekule.FormulaUtils.FORMULA_BRACKETS[bracketIndex][1];
			result = Kekule.Render.RichTextUtils.appendText(result, bracketStart);
		}
		for (var i = 0, l = sections.length; i < l; ++i)
		{
			var obj = sections[i].obj;
			var charge = formula.getSectionCharge(sections[i]);
			var subgroup = null;
			if (obj instanceof Kekule.MolecularFormula)  // a sub-formula
			{
				// TODO: sometimes bracket is unessential, such as SO42- and so on, need more judge here
				subgroup = Kekule.Render.ChemDisplayTextUtils._convFormulaToRichTextGroup(obj, true, false, false, partialChargeDecimalsLength, displayConfigs, chargeMarkType); // do not show charge right after, we will add it later
			}
			else if (obj.getDisplayRichText) // an atom/isotope
			{
				var subgroup = obj.getDisplayRichText(Kekule.Render.HydrogenDisplayLevel.NONE, false, null, displayConfigs, partialChargeDecimalsLength, chargeMarkType);  // do not show charge right after symbol
			}

			if (subgroup)
			{
				// count
				if (sections[i].count != 1)
				{
					subgroup = Kekule.Render.RichTextUtils.appendText(subgroup, sections[i].count.toString(), {'textType': Kekule.Render.RichText.SUB});
					subgroup.charDirection = Kekule.Render.TextDirection.LTR;
				}

				// charge is draw after count
				if (showCharge && charge)
				{
					var chargeSection = Kekule.Render.ChemDisplayTextUtils.createElectronStateDisplayTextSection(charge, null, partialChargeDecimalsLength, chargeMarkType);
					if (chargeSection)
					{
						Kekule.Render.RichTextUtils.append(subgroup, chargeSection);
					}
				}

				result = Kekule.Render.RichTextUtils.append(result, subgroup);
			}
		}
		if (showBracket)
			result = Kekule.Render.RichTextUtils.appendText(result, bracketEnd);

		if (showCharge || showRadical)
		{
			var charge = formula.getCharge();
			var radical = formula.getRadical();
			var chargeSection = Kekule.Render.ChemDisplayTextUtils.createElectronStateDisplayTextSection(charge, radical, partialChargeDecimalsLength, chargeMarkType);
			if (chargeSection)
			{
				Kekule.Render.RichTextUtils.append(result, chargeSection);
			}
		}

		return result;
	}
};


/**
 * Help methods to draw text.
 * @class
 */
Kekule.Render.TextDrawUtils = {
	/**
	 * Check if a text line is in horizontal direction (LTR or RTL).
	 * @param {Object} charDirection
	 * @returns {Bool}
	 */
	isHorizontalLine: function(charDirection)
	{
		return ((charDirection == Kekule.Render.TextDirection.LTR)
			|| (charDirection == Kekule.Render.TextDirection.RTL)
			|| (charDirection == null));  // default is horizontal
	},

	/**
	 * Check if a text line is in vertical direction (TTB or BTT).
	 * @param {Object} charDirection
	 * @returns {Bool}
	 */
	isVerticalLine: function(charDirection)
	{
		return ((charDirection == Kekule.Render.TextDirection.TTB)
			|| (charDirection == Kekule.Render.TextDirection.BTT));
	},

	/**
	 * Get opposite direction.
	 * @param {Int} direction
	 * @returns {Int}
	 */
	getOppositeDirection: function(direction)
	{
		var TD = Kekule.Render.TextDirection;
		switch (direction)
		{
			case TD.LTR: return TD.RTL;
			case TD.RTL: return TD.LTR;
			case TD.TTB: return TD.BTT;
			case TD.BTT: return TD.TTB;
		}
	},
	/**
	 * Check if two directions are opposite.
	 * @param {Int} direction1
	 * @param {Int} direction2
	 * @return {Bool}
	 */
	isOppositeDirection: function(direction1, direction2)
	{
		return Kekule.Render.TextDrawUtils.getOppositeDirection(direction1) === direction2;
	},

	/**
	 * Turn line break direction to actual direction value.
	 * @param {Int} direction
	 * @param {Int} parentDirection
	 */
	getActualDirection: function(direction, parentDirection)
	{
		if (direction === TD.LINE_BREAK)
		{
			return ((parentDirection === TD.TTB) || (parentDirection === TD.BTT))? TD.LTR:
				((parentDirection === TD.LTR) || (parentDirection === TD.RTL))? TD.TTB:
				direction;
		}
		else
			return direction;
	},

	getActualAlign: function(align, direction)
	{
		var A = Kekule.Render.TextAlgin;
		var D = Kekule.Render.TextDirection;

		switch (align)
		{
			case A.LEFT:
			case A.RIGHT:
			case A.TOP:
			case A.BOTTOM:
			case A.CENTER:
			{
				return align;
				break;
			}
			case A.LEADING:
			{
				switch (direction)
				{
					case D.TTB: return A.TOP;
					case D.BTT: return A.BOTTOM;
					case D.RTL: return A.RIGHT;
					case D.LTR:
					default:
						return A.LEFT;
				}
			}
			case A.TRAILING:
			{
				switch (direction)
				{
					case D.BTT: return A.TOP;
					case D.TTB: return A.BOTTOM;
					case D.RTL: return A.LEFT;
					case D.LTR:
					default:
						return A.RIGHT;
				}
			}
		}
	}
}

/**
 * Help methods about path used in 2D renderer.
 * @class
 */
Kekule.Render.DrawPathUtils = {
	/**
	 * Make a path array from arguments.
	 * For instance, makePath('M', [10, 20], 'L', [20, 30]).
	 * The path method string is similiar to SVG path string format, including:
	 *  M	moveto	(x y)+
	 *  Z	closepath	(none)
	 * 	L	lineto	(x y)+
	 * 	//H	horizontal lineto	x+
	 * 	//V	vertical lineto	y+
	 * 	C	curveto	(x1 y1 x2 y2 x y)+
	 * 	S	smooth curveto	(x2 y2 x y)+
	 * 	Q	quadratic Bézier curveto	(x1 y1 x y)+
	 * 	T	smooth quadratic Bézier curveto	(x y)+
	 * 	A	elliptical arc	(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+
	 */
	makePath: function()
	{
		var result = [];
		var sMethod = null;
		var params = [];
		var group;
		for (var i = 0, l = arguments.length; i < l; ++i)
		{
			var arg = arguments[i];
			if (DataType.isArrayValue(arg))
			{
				params = params.concat(arg);
			}
			else if (typeof(arg) === 'number')
			{
				params.push(arg);
			}
			else // start of a new method
 			{
				if (sMethod) // there is a prev method, group up it
				{
					group = {
						'method': sMethod,
						'params': params
					};
					result.push(group);
					// empty curr method and params
					sMethod = null;
					params = [];
				}
				// then new method
				sMethod = arg.toString();
			}

			if (i === l - 1)  // last one, wrap up last group
			{
				if (sMethod) // there is a prev method, group up it
				{
					group = {
						'method': sMethod,
						'params': params
					};
					result.push(group);
				}
			}
		}
		return result;
	}
};

/**
 * Help methods to draw connector (usually a bond).
 * @class
 */
Kekule.Render.ConnectorDrawUtils = {
	/**
	 * Get possible render type of a connector.
	 * If connector is a bond, this function will return the same result as {@link Kekule.Render.ConnectorDrawUtils.getPossibleBondRenderType},
	 * otherwise a default set will be returned.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Array} A set of possible values from {@link Kekule.Render.BondRenderType}.
	 */
	getPossibleConnectorRenderTypes: function(connector)
	{
		if (connector instanceof Kekule.Bond)
			return Kekule.Render.ConnectorDrawUtils.getPossibleBondRenderTypes(connector);
		else
		{
			var RT = Kekule.Render.BondRenderType;
			return [RT.SINGLE, RT.DASHED, RT.WAVY];
		}
	},
	/**
	 * Get default render type of a connector.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @returns {Int} Value from {@link Kekule.Render.BondRenderType}.
	 */
	getDefConnectorRenderType: function(connector)
	{
		var a = Kekule.Render.ConnectorDrawUtils.getPossibleConnectorRenderTypes(connector);
		return a[0];
	},
	/**
	 * Get possible render type of a bond.
	 * @param {Kekule.Bond} bond
	 * @returns {Array} A set of possible values from {@link Kekule.Render.BondRenderType}.
	 */
	getPossibleBondRenderTypes: function(bond)
	{
		var RT = Kekule.Render.BondRenderType;
		var BT = Kekule.BondType;
		var btype = bond.getBondType();
		switch (btype)
		{
			case BT.HYDROGEN: return [RT.DASHED, RT.ARROWED, RT.WAVY]; break;
			// TODO: Arrow direction of coordinate bond should be calculated
			case BT.COORDINATE: return [RT.ARROWED, RT.SINGLE, RT.DASHED, RT.WAVY]; break;
			case BT.IONIC: /*case BT.COORDINATE:*/ case BT.METALLIC: case BT.UNKNOWN:
				return [RT.SINGLE, RT.DASHED, RT.WAVY]; break;
			case BT.COVALENT: break;  // need further check in the following code
			default:
				return [RT.SINGLE, RT.DASHED, RT.ARROWED, RT.WAVY];
		}
		// if covalent bond, then further check it
		if (bond.getConnectedObjCount() > 2)  // multiple center bond
			return [RT.DASHED, RT.SINGLE];
		var BO = Kekule.BondOrder;
		switch (bond.getBondOrder())
		{
			case BO.DOUBLE:
			{
				var dresult = [RT.DOUBLE, RT.DASHED_DOUBLE, RT.BOLD_DOUBLE, RT.WAVY];
				if (bond.getStereo && [Kekule.BondStereo.E_OR_Z, Kekule.BondStereo.CIS_OR_TRANS].indexOf(bond.getStereo()) >= 0)
					dresult.unshift(RT.SCISSORS_DOUBLE);
				return dresult;
				break;
			}
			case BO.TRIPLE: return [RT.TRIPLE, RT.BOLD_TRIPLE, RT.WAVY]; break;
			case BO.QUAD: return [RT.QUAD, RT.BOLD_QUAD, RT.WAVY]; break;
			case BO.EXPLICIT_AROMATIC: return [RT.SOLID_DASH, RT.WAVY]; break;
			case BO.SINGLE:  // complex, need consider stereo chemistry
				{
					var BS = Kekule.BondStereo;
					var result = [RT.SINGLE, RT.BOLD, RT.WAVY];
					switch (bond.getStereo())
					{
						case BS.UP: result.unshift(RT.WEDGED_SOLID, RT.WEDGED_HOLLOW); break;
						case BS.UP_INVERTED: result.unshift(RT.WEDGED_SOLID_INV, RT.WEDGED_HOLLOW_INV); break;
						case BS.DOWN: result.unshift(RT.WEDGED_HASHED, RT.DASHED); break;
						case BS.DOWN_INVERTED: result.unshift(RT.WEDGED_HASHED_INV, RT.DASHED); break;
						case BS.UP_OR_DOWN: case BS.UP_OR_DOWN_INVERTED: result = [RT.WAVY, RT.SINGLE]; break;
						case BS.CLOSER: result = [RT.WEDGED_SOLID_BOTH, RT.WEDGED_HOLLOW_BOTH]; break;
						default:  // NONE
							;// do nothing
					}
					return result;
					break;
				}
			default: // OTHER, UNSET
				return [RT.SINGLE, RT.DASHED, RT.ARROWED, RT.WAVY];
		}
	},
	/**
	 * Get default render type of a bond.
	 * @param {Kekule.Bond} bond
	 * @returns {Int} Value from {@link Kekule.Render.BondRenderType}.
	 */
	getDefBondRenderType: function(bond)
	{
		var a = Kekule.Render.ConnectorDrawUtils.getPossibleBondRenderTypes(bond);
		return a[0];
	},

	/**
	 * Get 3D render type of a connector.
	 * If connector is a bond, this function will return the same result as {@link Kekule.Render.ConnectorDrawUtils.getBondRender3DTypes},
	 * otherwise a default type will be returned.
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Int} renderMode Value from {@link Kekule.Render.Bond3DRenderMode}.
	 * @returns {Int} Value from {@link Kekule.Render.Bond3DRenderType}.
	 */
	getConnectorRender3DType: function(connector, renderMode)
	{
		var BRT = Kekule.Render.Bond3DRenderType;
		var BRM = Kekule.Render.Bond3DRenderMode;
		if (renderMode && ((renderMode === BRM.WIRE) || (renderMode === BRM.CYLINDER)))
			return BRT.SINGLE;
		else
		{
			if (connector instanceof Kekule.Bond)
				return Kekule.Render.ConnectorDrawUtils.getBondRender3DTypes(connector);
			else
				return BRT.SINGLE;
		}
	},
	/**
	 * Get suitable 3D render type of a bond.
	 * @param {Kekule.Bond} bond
	 * @returns {Int} Value from {@link Kekule.Render.Bond3DRenderType}.
	 */
	getBondRender3DTypes: function(bond)
	{
		var RT = Kekule.Render.Bond3DRenderType;
		var BT = Kekule.BondType;
		var btype = bond.getBondType();
		switch (btype)
		{
			case BT.HYDROGEN: return RT.DASH; break;
			case BT.COVALENT: break;  // need further check in the following code
			default:
				return RT.SINGLE;
		}
		// if covalent bond, then further check it
		var BO = Kekule.BondOrder;
		switch (bond.getBondOrder())
		{
			case BO.DOUBLE: return RT.DOUBLE; break;
			case BO.TRIPLE: return RT.TRIPLE; break;
			case BO.EXPLICIT_AROMATIC: return RT.SOLID_DASH; break;
			default: // OTHER, UNSET
				return RT.SINGLE;
		}
	}
};

/**
 * Help methods to manupilate chem object.
 * @class
 */
Kekule.Render.ObjUtils = {
	/**
	 * Returns 2D containing box of usual chem object.
	 * @param {Kekule.ChemObjecy} chemObj
	 * @param {Int} coordMode
	 * @param {Bool} allowCoordBorrow
	 * @returns {Hash}
	 */
	getContainerBox: function(chemObj, coordMode, allowCoordBorrow)
	{
		if (!coordMode)
			coordMode = Kekule.CoordMode.COORD2D;
		var box;
		var o = chemObj;
		/*
		if (o.getExposedContainerBox2D)
			box = o.getExposedContainerBox2D(allowCoordBorrow);
		else if (o.getContainerBox2D)
			box = o.getContainerBox2D(allowCoordBorrow);
		else  // no containerBox related method, use coord
			box = null;
		*/
		if (o.getExposedContainerBox)
			box = o.getExposedContainerBox(coordMode, allowCoordBorrow);
		else if (o.getContainerBox)
			box = o.getContainerBox(coordMode, allowCoordBorrow);
		else  // no containerBox related method, use coord
		{
			var coord = o.getAbsCoordOfMode? o.getAbsCoordOfMode(coordMode): null;
			box = coord? Kekule.BoxUtils.createBox(coord, coord): null;
		}

		return box;
	}
};

/**
 * Help methods to manipulate bound info base on simple shape.
 * @class
 */
Kekule.Render.MetaShapeUtils = {
//Kekule.Render.BoundUtils = {
	/**
	 * Create a new ShapeInfo object.
	 * @param {Int} shapeType
	 * @param {Array} coords
	 * @param {Hash} additionalInfos
	 * @returns {Object}
	 */
	createShapeInfo: function(shapeType, coords, additionalInfos)
	//createBoundInfo: function(boundType, coords, additionalInfos)
	{
		var result = {};
		result.shapeType = shapeType;
		result.coords = coords;
		if (additionalInfos)
			result = Object.extend(result, additionalInfos);
		return result;
	},
	/**
	 * Check if shape is a composite one (usually is an array of simple shapes).
	 * @param {Variant} shape
	 * @returns {Bool}
	 */
	isCompositeShape: function(shape)
	{
		return DataType.isArrayValue(shape);
	},
	/**
	 * Inflate shape with delta on each direction.
	 * @param {Object} originalShape
	 * @param {Float} delta
	 * @returns {Object} A new boundInfo.
	 */
	inflateShape: function(originalShape, delta)
	{
		if (!originalShape)
			return null;
		var T = Kekule.Render.MetaShapeType;
		var B = Kekule.Render.MetaShapeUtils;

		// composite shape
		if (B.isCompositeShape(originalShape))
		{
			var result = [];
			for (var i = 0, l = originalShape.length; i < l; ++i)
			{
				var oldChildShape = originalShape[i];
				var newChildShape = B.inflateShape(oldChildShape, delta);
				result.push(newChildShape);
			}
			return result;
		}

		// simple shape
		var newBound;
		switch (originalShape.shapeType)
		{
			case T.POINT: newBound = B._inflatePointShape(originalShape, delta); break;
			case T.CIRCLE: newBound = B._inflateCircleShape(originalShape, delta); break;
			case T.LINE: newBound = B._inflateLineShape(originalShape, delta); break;
			case T.RECT: newBound = B._inflateRectShape(originalShape, delta); break;
			case T.POLYGON: newBound = B._inflatePolygonShape(originalShape, delta); break;
		}
		return newBound;
	},
	/** @private */
	_inflatePointShape: function(originalShape, delta)
	{
		var newBound = Kekule.Render.MetaShapeUtils.createShapeInfo(
			Kekule.Render.BoundShapeType.CIRCLE, [originalShape.coords[0]], {'radius': delta});
		return newBound;
	},
	/** @private */
	_inflateCircleShape: function(originalShape, delta)
	{
		var newBound = Kekule.Render.MetaShapeUtils.createShapeInfo(
			Kekule.Render.BoundShapeType.CIRCLE, [originalShape.coords[0]], {'radius': originalShape.radius + delta});
		return newBound;
	},
	/** @private*/
	_inflateLineShape: function(originalShape, delta)
	{
		var newBound = Kekule.Render.MetaShapeUtils.createShapeInfo(
			Kekule.Render.BoundShapeType.LINE,
			[originalShape.coords[0], originalShape.coords[1]], {'width': (originalShape.width || 0) + delta * 2});
		return newBound;
	},
	/** @private */
	_inflateRectShape: function(originalShape, delta)
	{
		var newBound = Kekule.Render.MetaShapeUtils.createShapeInfo(Kekule.Render.BoundShapeType.RECT, []);
		var newCoords = Kekule.Render.MetaShapeUtils._inflateCoords(originalShape.coords, delta);
		newBound.coords = newCoords;
		return newBound;
	},
	/** @private */
	_inflatePolygonShape: function(originalShape, delta)
	{
		var newBound = Kekule.Render.MetaShapeUtils.createShapeInfo(Kekule.Render.BoundShapeType.POLYGON, []);
		var newCoords = Kekule.Render.MetaShapeUtils._inflateCoords(originalShape.coords, delta);
		newBound.coords = newCoords;
		return newBound;
	},
	/** @private */
	_inflateCoords: function(coords, delta)
	{
		var C = Kekule.CoordUtils;
		var result = [];
		// calc center of coords
		var center = C.getCenter(coords);
		for (var i = 0, l = coords.length; i < l; ++i)
		{
			var coord = coords[i];
			var vec = C.substract(coord, center);
			var distance = C.getDistance(coord);
			var deltaVec = C.multiply(vec, delta / distance);
			var newCoord = C.add(coord, deltaVec);
			result.push(newCoord);
		}
		return result;
	},
	/**
	 * Returns distance of coord to a bound shape. A negative value means coord insude shape.
	 * @param {Hash} coord
	 * @param {Hash} shapeInfo Provides the shape box information of this object on context. It has the following fields:
	 *   {
	 *     shapeType: value from {@link Kekule.Render.MetaShapeType}.
	 *     coords: [Array of coords]
	 *     otherInfo: ...
	 *   }
	 *   Note that shapeInfo may be an array, in that case, nearest distance will be returned.
	 * @param {Float} inflate
	 * @returns {Float}
	 */
	getDistance: function(coord, shapeInfo, inflate)
	{
		if (Kekule.Render.MetaShapeUtils.isCompositeShape(shapeInfo))
		{
			var result = null;
			for (var i = 0, l = shapeInfo.length; i < l; ++i)
			{
				var info = shapeInfo[i];
				var d = Kekule.Render.MetaShapeUtils.getDistance(coord, info, inflate);
				if (result === null || result > d)
					result = d;
			}
			return result;
		}
		else
		{
			var T = Kekule.Render.MetaShapeType;
			var B = Kekule.Render.MetaShapeUtils;
			var newBound = inflate? B.inflateShape(shapeInfo, inflate): shapeInfo;
			switch (shapeInfo.shapeType)
			{
				case T.POINT: return (inflate? B._getDistanceToCircle(coord, newBound): B._getDistanceToPoint(coord, newBound));
				case T.CIRCLE: return B._getDistanceToCircle(coord, newBound);
				case T.LINE: return B._getDistanceToLine(coord, newBound);
				case T.RECT: return B._getDistanceToRect(coord, newBound);
				case T.POLYGON: return B._getDistanceToPolygon(coord, newBound);
				default: return false;
			}
		}
	},
	/** @private */
	_getDistanceToPoint: function(coord, shapeInfo)
	{
		return Kekule.CoordUtils.getDistance(coord, shapeInfo.coords[0]);
	},
	/** @private */
	_getDistanceToCircle: function(coord, shapeInfo)
	{
		var C = Kekule.CoordUtils;
		var d = C.getDistance(coord, shapeInfo.coords[0]);
		return d - shapeInfo.radius;
	},
	/** @private */
	_getDistanceToLine: function(coord, shapeInfo)
	{
		var SU = Kekule.Render.MetaShapeUtils;
		// get cross point of coord and line
		var lineCoords = shapeInfo.coords;
		var crossPoint = Kekule.Render.MetaShapeUtils._calcVerticalLineCrossPoint(coord, lineCoords[0], lineCoords[1]);
		// check if cross point is between two coords of line
		var betweenFlag;

		var NU = Kekule.NumUtils;
		//if (lineCoords[0].x !== lineCoords[1].x)
		/*
		 if (!NU.isFloatEqual(lineCoords[0].x, lineCoords[1].x))
		 betweenFlag = (Math.sign(crossPoint.x - lineCoords[0].x) * Math.sign(crossPoint.x - lineCoords[1].x) <= 0);
		 //else if (lineCoords[0].y !== lineCoords[1].y)
		 else if (!NU.isFloatEqual(lineCoords[0].y, lineCoords[1].y))
		 betweenFlag = (Math.sign(crossPoint.y - lineCoords[0].y) * Math.sign(crossPoint.y - lineCoords[1].y) <= 0);
		 else // x/y of coord0/1 all equal, two coords are actually the same point
		 */
		if (NU.isFloatEqual(lineCoords[0].x, lineCoords[1].x) && NU.isFloatEqual(lineCoords[0].y, lineCoords[1].y))
		// x/y of coord0/1 all equal, two coords are actually the same point
		{
			var circleInfo = {coords: [shapeInfo.coords[0]], radius: shapeInfo.width};
			var result = SU._getDistanceToCircle(coord, circleInfo);
			return result;
		}
		else
		{
			var vector = Kekule.CoordUtils.substract(lineCoords[1], lineCoords[0]);
			if (Math.abs(vector.y) > Math.abs(vector.x))
				betweenFlag = (Math.sign(crossPoint.y - lineCoords[0].y) * Math.sign(crossPoint.y - lineCoords[1].y) <= 0);
			else
				betweenFlag = (Math.sign(crossPoint.x - lineCoords[0].x) * Math.sign(crossPoint.x - lineCoords[1].x) <= 0);
		}

		if (!betweenFlag)  // not inside
		{
			//console.log(crossPoint, crossPoint.x - lineCoords[0].x, crossPoint.x - lineCoords[1].x);
			//return false;
			// returns distance to nearest end point circle
			var circleInfo0 = {coords: [shapeInfo.coords[0]], radius: shapeInfo.width || 0};
			var circleInfo1 = {coords: [shapeInfo.coords[1]], radius: shapeInfo.width || 0};
			var d0 = SU._getDistanceToCircle(coord, circleInfo0);
			var d1 = SU._getDistanceToCircle(coord, circleInfo1);
			return Math.min(d0, d1);
		}
		else  // inside line (with width)
		{
			var distance = Kekule.CoordUtils.getDistance(coord, crossPoint) - (shapeInfo.width || 0) / 2;
			//console.log('distance', distance, boundInfo.width);
			//return (distance <= shapeInfo.width / 2);
			return distance;
		}
	},
	/** @private */
	_getDistanceToRect: function(coord, shapeInfo)
	{
		var cornerCoords = shapeInfo.coords;
		var dx0 = (coord.x - cornerCoords[0].x);
		var dx1 = (coord.x - cornerCoords[1].x);
		var dy0 = (coord.y - cornerCoords[0].y);
		var dy1 = (coord.y - cornerCoords[1].y);
		var inside = (dx0 * dx1 <= 0) && (dy0 * dy1 <= 0);
		if (inside)
			return -Math.min(Math.abs(dx0), Math.abs(dx1), Math.abs(dy0), Math.abs(dy1));
		else  // outside, calc distance to each corner
		{
			var CU = Kekule.CoordUtils;
			return Math.min(
					CU.getDistance(coord, cornerCoords[0]),
					CU.getDistance(coord, cornerCoords[1]),
					CU.getDistance(coord, {'x': cornerCoords[0].x, 'y': cornerCoords[1].y}),
					CU.getDistance(coord, {'x': cornerCoords[1].x, 'y': cornerCoords[0].y})
			);
		}
	},
	/** @private */
	_getDistanceToPolygon: function(coord, shapeInfo)
	{
		var C = Kekule.CoordUtils;
		var SU = Kekule.Render.MetaShapeUtils;
		var T = Kekule.Render.MetaShapeType;
		var inside = SU._isInsidePolygon(coord, shapeInfo);
		var lineCoords = shapeInfo.coords;
		var distance = null;
		for (var i = 0, l = lineCoords.length; i < l; ++i)
		{
			var coord1 = lineCoords[i];
			var coord2 = lineCoords[(i + 1) % l];
			// calc distance to line
			var lineShape = SU.createShapeInfo(T.LINE, [coord1, coord2], {'width': 0});
			var d = SU._getDistanceToLine(coord, lineShape);
			if (distance === null)
				distance = d;
			else if (distance > d)
				distance = d;
		}
		if (inside)
			distance = -distance;
		return distance;
	},

	/**
	 * Check if a point is inside a bound.
	 * @param {Hash} coord
	 * @param {Hash} shapeInfo Provides the shape box information of this object on context. It has the following fields:
	 *   {
	 *     shapeType: value from {@link Kekule.Render.MetaShapeType}.
	 *     coords: [Array of coords]
	 *     otherInfo: ...
	 *   }
	 *   Note that shapeInfo may be an array to check if coord in either of items of array.
	 * @param {Float} inflate
	 * @returns {Bool}
	 */
	isCoordInside: function(coord, shapeInfo, inflate)
	{
		//if (Kekule.ArrayUtils.isArray(shapeInfo))
		if (Kekule.Render.MetaShapeUtils.isCompositeShape(shapeInfo))
		{
			for (var i = 0, l = shapeInfo.length; i < l; ++i)
			{
				var info = shapeInfo[i];
				if (Kekule.Render.MetaShapeUtils.isCoordInside(coord, info, inflate))
					return true;
			}
			return false;
		}
		else
		{
			var T = Kekule.Render.MetaShapeType;
			var B = Kekule.Render.MetaShapeUtils;
			var newBound = inflate? B.inflateShape(shapeInfo, inflate): shapeInfo;
			switch (shapeInfo.shapeType)
			{
				case T.POINT: return (inflate? B._isInsideCircle(coord, newBound): B._isInsidePoint(coord, newBound));
				case T.CIRCLE: return B._isInsideCircle(coord, newBound);
				case T.LINE: return B._isInsideLine(coord, newBound);
				case T.RECT: return B._isInsideRect(coord, newBound);
				case T.POLYGON: return B._isInsidePolygon(coord, newBound);
				default: return false;
			}
		}
	},
	/** @private */
	_isInsidePoint: function(coord, shapeInfo)
	{
		return Kekule.CoordUtils.isEqual(coord, shapeInfo.coords[0]);
	},
	/** @private */
	_isInsideCircle: function(coord, shapeInfo)
	{
		var C = Kekule.CoordUtils;
		var d = C.getDistance(coord, shapeInfo.coords[0]);
		return (d <= shapeInfo.radius);
	},
	/** @private */
	_isInsideLine: function(coord, shapeInfo)
	{
		// get cross point of coord and line
		var lineCoords = shapeInfo.coords;
		var crossPoint = Kekule.Render.MetaShapeUtils._calcVerticalLineCrossPoint(coord, lineCoords[0], lineCoords[1]);
		//console.log(crossPoint);
		// check if cross point is between two coords of line
		var betweenFlag;

		var NU = Kekule.NumUtils;
		//if (lineCoords[0].x !== lineCoords[1].x)
		/*
		if (!NU.isFloatEqual(lineCoords[0].x, lineCoords[1].x))
			betweenFlag = (Math.sign(crossPoint.x - lineCoords[0].x) * Math.sign(crossPoint.x - lineCoords[1].x) <= 0);
		//else if (lineCoords[0].y !== lineCoords[1].y)
		else if (!NU.isFloatEqual(lineCoords[0].y, lineCoords[1].y))
			betweenFlag = (Math.sign(crossPoint.y - lineCoords[0].y) * Math.sign(crossPoint.y - lineCoords[1].y) <= 0);
		else // x/y of coord0/1 all equal, two coords are actually the same point
		*/
		if (NU.isFloatEqual(lineCoords[0].x, lineCoords[1].x) && NU.isFloatEqual(lineCoords[0].y, lineCoords[1].y))
			// x/y of coord0/1 all equal, two coords are actually the same point
		{
			var circleInfo = {coords: [shapeInfo.coords[0]], radius: shapeInfo.width};
			var result = Kekule.Render.MetaShapeUtils._isInsideCircle(coord, circleInfo);
			return result;
		}
		else
		{
			var vector = Kekule.CoordUtils.substract(lineCoords[1], lineCoords[0]);
			if (Math.abs(vector.y) > Math.abs(vector.x))
				betweenFlag = (Math.sign(crossPoint.y - lineCoords[0].y) * Math.sign(crossPoint.y - lineCoords[1].y) <= 0);
			else
				betweenFlag = (Math.sign(crossPoint.x - lineCoords[0].x) * Math.sign(crossPoint.x - lineCoords[1].x) <= 0);
		}

		if (!betweenFlag)  // not inside
		{
			//console.log(crossPoint, crossPoint.x - lineCoords[0].x, crossPoint.x - lineCoords[1].x);
			return false;
		}
		else
		{
			var distance = Kekule.CoordUtils.getDistance(coord, crossPoint);
			//console.log('distance', distance, boundInfo.width);
			return (distance <= shapeInfo.width / 2);
		}
	},
	/** @private */
	_isInsideRect: function(coord, shapeInfo)
	{
		var lineCoords = shapeInfo.coords;
		/*
		return ((coord.x - lineCoords[0].x) * (coord.x - lineCoords[1].x) <= 0)
			&& ((coord.y - lineCoords[0].y) * (coord.y - lineCoords[1].y) <= 0);
		*/
		return Kekule.CoordUtils.insideRect(coord, lineCoords[0], lineCoords[1]);
	},
	/** @private */
	_isInsidePolygon: function(coord, shapeInfo)
	{
		var C = Kekule.CoordUtils;
		var lineCoords = shapeInfo.coords;
		var crossCount = 0;
		for (var i = 0, l = lineCoords.length; i < l; ++i)
		{
			var coord1 = lineCoords[i];
			var coord2 = lineCoords[(i + 1) % l];
			// calc cross point of line x = coord.x and line (coord1 - coord2)
			var deltaVec = C.substract(coord2, coord1);
			if (deltaVec.x === 0)  // line (coord1 - coord2) is a vertical line, will not cross
				continue;
			else
			{
				var crossCoord = {'x': coord.x};
				crossCoord.y = ((crossCoord.x - coord1.x) / deltaVec.x) * deltaVec.y + coord1.y;
				if (C.insideRect(crossCoord, coord1, coord2))
					++crossCount;
			}
		}
		return (crossCount % 2 === 0);
	},
	/**
	 * Calc cross point of coord to line (lineCoord1 - lineCoord2).
	 * @private
	 */
	_calcVerticalLineCrossPoint: function(coord, lineCoord1, lineCoord2)
	{
		/*
		// methods are from http://blog.csdn.net/fly542/article/details/6638299
		// first turn line formula to Ax + By + C = 0 form
		var A = (lineCoord1.y - lineCoord2.y) / (lineCoord1.x - lineCoord2.x);
		var B = lineCoord1.y - A * lineCoord1.y;
		// its vertical line formula is Bx - Ay + m = 0, calc m
		var m = coord.x - A * coord.y;
		// calc cross point coord
		var result = {};
		result.x = (m - A * B) / (A * A + 1);
		result.y = A * result.x + B;
		return result;
		*/
		// method from http://blog.sina.com.cn/s/blog_4bf793ad0100gudn.html
		var result = {};
		if (Math.abs(lineCoord1.x - lineCoord2.x) < 1e-10)  // a vertical line or near vertical line
		{
			result.x = lineCoord1.x;
			result.y = coord.y;
		}
		else
		{
			var k = (lineCoord2.y - lineCoord1.y) / (lineCoord2.x - lineCoord1.x);
			// 垂线的斜率为 - 1 / k，垂线方程为：y = (-1/k) * (x - coord.x) + coord.y
			// calc cross point
			// x = ( k^2 * pt1.x + k * (point.y - pt1.y ) + point.x ) / ( k^2 + 1) ，y = k * ( x - pt1.x) + pt1.y
			result.x = (k * k * lineCoord1.x + k * (coord.y - lineCoord1.y) + coord.x) / (k * k + 1);
			result.y = k * (result.x - lineCoord1.x) + lineCoord1.y;
		}
		return result;
	},

	/**
	 * Returns the minimum rect that contains this shape.
	 * @param {Object} shapeInfo
	 * @param {Float} Inflation
	 * returns {Object}
	 */
	getContainerBox: function(shapeInfo, inflation)
	{
		var T = Kekule.Render.MetaShapeType;
		var U = Kekule.Render.MetaShapeUtils;
		var C = Kekule.BoxUtils;
		var coords = shapeInfo.coords;
		inflation = inflation || 0;
		var result;

		if (U.isCompositeShape(shapeInfo))  // composite shape
		{
			result = null;
			for (var i = 0, l = shapeInfo.length; i < l; ++i)
			{
				var childShape = shapeInfo[i];
				var childBox = U.getContainerBox(childShape);
				if (!result)
					result = childBox;
				else
					result = C.getContainerBox(result, childBox);
			}
		}
		else  // simple shape
		{
			switch (shapeInfo.shapeType)
			{
				case T.POINT:
				case T.CIRCLE:
					{
						var radius = (shapeInfo.shapeType === T.POINT)? 0: (shapeInfo.radius || 0);
						var coord = coords[0];
						result = C.createBox({x: coord.x - radius, y: coord.y - radius}, {x: coord.x + radius, y: coord.y + radius});
						break;
					}
				case T.LINE:
					{
						var result = C.createBox(coords[0], coords[1]);
						// TODO: a rough calculate
						result = Kekule.BoxUtils.inflateBox(result, (shapeInfo.width || 0) / 2);
						break;
					}
				case T.RECT:
					{
						// TODO: does not consider line width here
						result = C.createBox(coords[0], coords[1]);
						break;
					}
				case T.POLYGON:
					{
						result = C.createBox(coords[0], coords[0]);
						for (var i = 1, l = coords.length; i < l; ++i)
						{
							var coord = coords[i];
							result = {
								'x1': Math.min(result.x1, coord.x),
								'y1': Math.min(result.y1, coord.y),
								'x2': Math.max(result.x2, coord.x),
								'y2': Math.max(result.y2, coord.y)
							};
						}
						break;
					}
			}
		}
		if (inflation)
		{
			result = Kekule.BoxUtils.inflateBox(result, inflation);
		}
		return result;
	},

	/**
	 * Check if a shape is inside a rect box.
	 * @param {Object} shapeInfo
	 * @param {Hash} box
	 * @returns {Bool}
	 */
	isInsideBox: function(shapeInfo, box)
	{
		var cbox = Kekule.Render.MetaShapeUtils.getContainerBox(shapeInfo);
		return Kekule.BoxUtils.isInside(cbox, box);
	},
	/**
	 * Check if a shape is intersecting with box.
	 * @param {Object} shapeInfo
	 * @param {Hash} box
	 * @returns {Bool}
	 */
	isIntersectingBox: function(shapeInfo, box)
	{
		if (U.isCompositeShape(shapeInfo))
		{
			for (var i = 0, l = shapeInfo.length; i < l; ++i)
			{
				var childShape = shapeInfo[i];
				var childInside = Kekule.Render.MetaShapeUtils.isIntersectingBox(childShape, box);
				if (childInside)
					return true;
			}
		}
		else
		{
			// TODO: currently only check coords, line width or circle radius are not considered
			var coords = shapeInfo.coords;
			for (var i = 0, l = coords.length; i < l; ++i)
			{
				var coord = coords[i];
				if (Kekule.CoordUtils.isInsideBox(coord, box))
					return true;
			}
			return false;
		}
	}
};

/**
 * Help methods to manipulate renderOptions property of a chem structure object.
 * @class
 */
Kekule.Render.RenderOptionUtils = {
	/**
	 * Create a new options object, inherits settings from options and local renderOptions of obj.
	 * @param {Kekule.ChemObject} obj
	 * @param {Hash} options
	 * @returns {Hash}
	 */
	mergeObjLocalRenderOptions: function(obj, options)
	{
		/*
		var result = Object.create(options);
		if (obj && obj.getRenderOptions)
		{
			var ops = obj.getRenderOptions() || {};
			result = Object.extend(result, ops);
		}
		*/
		var childOps = (obj && obj.getOverriddenRenderOptions)? obj.getOverriddenRenderOptions(): null;

		return Kekule.Render.RenderOptionUtils.mergeRenderOptions(childOps || {}, options);
	},
	/**
	 * Create a new options object, inherits settings from options and local renderOptions of obj.
	 * @param {Kekule.ChemObject} obj
	 * @param {Hash} options
	 * @returns {Hash}
	 */
	mergeObjLocalRender3DOptions: function(obj, options)
	{
		/*
		 var result = Object.create(options);
		 if (obj && obj.getRenderOptions)
		 {
		 var ops = obj.getRenderOptions() || {};
		 result = Object.extend(result, ops);
		 }
		 */
		var childOps = (obj && obj.getOverriddenRender3DOptions)? obj.getOverriddenRender3DOptions(): null;

		return Kekule.Render.RenderOptionUtils.mergeRenderOptions(childOps || {}, options);
	},
	/**
	 * Merge childOptions into parentOptions.
	 * @param {Hash} childOptions
	 * @param {Hash} parentOptions
	 * @returns {Hash}
	 */
	mergeRenderOptions: function(childOptions, parentOptions)
	{
		var result = Object.create(parentOptions);
		result = Object.extend(result, childOptions, true, true);
		return result;
	},
	getColor: function(renderOptions)
	{
		return renderOptions? renderOptions.color: null;
	},
	/**
	 * Get molecule display type from render options.
	 * @param {Object} renderOptions
	 * @returns {Int} Value from {@link Kekule.Render.MoleculeDisplayType}.
	 */
	getMoleculeDisplayType: function(renderOptions)
	{
		return renderOptions? renderOptions.moleculeDisplayType: null;
	},
	/**
	 * Get display mode of a node.
	 * @param {Object} renderOptions
	 * @returns {Int} Value from {@link Kekule.Render.NodeLabelDisplayMode}.
	 */
	getNodeDisplayMode: function(renderOptions)
	{
		return renderOptions? renderOptions.nodeDisplayMode: null;
	},
	/**
	 * Get hydrongen display level of a node.
	 * @param {Object} renderOptions
	 * @returns {Int}
	 */
	getHydrogenDisplayLevel: function(renderOptions)
	{
		return renderOptions? renderOptions.hydrogenDisplayLevel: null;
	},
	/**
	 * Check whether charge should be displayed.
	 * @param {Object} renderOptions
	 * @returns {Bool}
	 */
	getShowCharge: function(renderOptions)
	{
		return renderOptions? renderOptions.showCharge: null;
	},
	getChargeDrawOptions: function(renderOptions)
	{
		if (!renderOptions)
			return null;
		else
		{
			var props = ['showCharge', 'chargeMarkType', 'chargeMarkFontSize',
				'chargeMarkMargin',
				'chargeMarkCircleWidth',  // width of circle stroke
				'color', 'opacity'];
			var result = Object.copyValues({}, renderOptions, props);
			return result;
		}
	},
	/**
	 * Retrieve useful options to draw rich text (including font size, font family and so on) from renderOptions.
	 * @param {Object} renderOptions
	 * @returns {Hash}
	 */
	getNodeLabelDrawOptions: function(renderOptions)
	{
		if (!renderOptions)
			return null;
		else
		{
			var props = ['fontSize', 'fontFamily', 'supFontSizeRatio', 'subFontSizeRatio',
				'superscriptOverhang', 'subscriptOversink', 'textBoxXAlignment', 'textBoxYAlignment',
				'color', 'opacity'];
			var result = Object.copyValues({}, renderOptions, props);
			return result;
		}
	},
	/**
	 * Retrieve bond render type from renderOptions of a chem object.
	 * @param {Object} renderOptions
	 * @returns {Int}
	 */
	getConnectorRenderType: function(renderOptions)
	{
		return renderOptions? renderOption.renderType: null;
	},
	/**
	 * Retrieve params for drawing connectors.
	 * @param {Object} renderOptions
	 * @returns {Hash}
	 */
	getConnectorDrawParams: function(renderOptions)
	{
		if (!renderOptions)
			return null;
		else
		{
			var props = ['bondLineWidth', 'boldBondLineWidth', 'hashSpacing', 'multipleBondSpacingRatio',
				'multipleBondSpacingAbs', 'multipleBondMaxAbsSpacing', 'bondArrowLength', 'bondArrowWidth',
				'bondWedgeWidth', 'bondWedgeHashMinWidth', 'color', 'opacity'];
			var result = Object.copyValues({}, renderOptions, props);
			return result;
		}
	},

	/*
	 * Get rich text draw options from textFontConfigs and drawOptions.
	 * Settings in drawOptions may override the ones in textFontConfigs.
	 * This function is used by ctab or formula renderer.
	 * @param {Kekule.Render.Render2DConfigs} render2DConfigs
	 * @param {Hash} drawOptions
	 * @returns {Hash}
	 * @deprecated
	 */
	/*
	extractRichTextDraw2DOptions: function(render2DConfigs, drawOptions)
	{
		var oneOf = Kekule.oneOf;
		var textFontConfigs = render2DConfigs.getTextFontConfigs();
		var op = {
					'fontSize': oneOf(drawOptions.fontSize, render2DConfigs.getLengthConfigs().getAtomFontSize()),
					'fontFamily': oneOf(drawOptions.fontFamily, textFontConfigs.getAtomFontFamily()),
					'supFontSizeRatio': oneOf(drawOptions.supFontSizeRatio, textFontConfigs.getSupFontSizeRatio()),
					'subFontSizeRatio': oneOf(drawOptions.subFontSizeRatio, textFontConfigs.getSubFontSizeRatio()),
					'superscriptOverhang': oneOf(drawOptions.superscriptOverhang, textFontConfigs.getSuperscriptOverhang()),
					'subscriptOversink': oneOf(drawOptions.subscriptOversink, textFontConfigs.getSubscriptOversink()),
					/ *
					'textBoxXAlignment': Kekule.Render.BoxXAlignment.CENTER,
					'textBoxYAlignment': Kekule.Render.BoxYAlignment.CENTER,
					* /
					'color': oneOf(drawOptions.atomColor, drawOptions.color, render2DConfigs.getColorConfigs().getAtomColor()),
					'opacity': oneOf(drawOptions.opacity, render2DConfigs.getGeneralConfigs().getDrawOpacity())
				};
		return op;
	},
	*/

	convertConfigsToPlainHash: function(configs)
	{
		var U = Kekule.Render.RenderOptionUtils;
		if (configs instanceof Kekule.Render.Render3DConfigs)
			return U.convert3DConfigsToPlainHash(configs)
		else
			return U.convert2DConfigsToPlainHash(configs);
	},

	/**
	 * Convert the whole {@link Kekule.Render.Render2DConfigs} instance into a
	 * one-level hash object.
	 * @param {Kekule.Render.Render2DConfigs} render2DConfigs
	 * @returns {Hash}
	 */
	convert2DConfigsToPlainHash: function(render2DConfigs)
	{
		var OU = Kekule.ObjUtils;
		var result = {};
		// keep a ref to config instance
		result._configs = render2DConfigs;

		// general configs
		var h = render2DConfigs.getGeneralConfigs().toHash();
		OU.replacePropName(h, 'drawOpacity', 'opacity');
		result = Object.extend(result, h);

		// moleculeDisplayConfigs
		h = render2DConfigs.getMoleculeDisplayConfigs().toHash();
		OU.replacePropName(h, 'defMoleculeDisplayType', 'moleculeDisplayType');
		OU.replacePropName(h, 'defNodeDisplayMode', 'nodeDisplayMode');
		OU.replacePropName(h, 'defHydrogenDisplayLevel', 'hydrogenDisplayLevel');
		OU.replacePropName(h, 'defChargeMarkType', 'chargeMarkType');
		result = Object.extend(result, h);

		// displayLabelConfigs, special, keep the whole config object
		result.displayLabelConfigs = render2DConfigs.getDisplayLabelConfigs();

		// textFontConfigs
		h = render2DConfigs.getTextFontConfigs().toHash();
		result = Object.extend(result, h);

		// lengthConfigs
		h = render2DConfigs.getLengthConfigs().toHash();
		result = Object.extend(result, h);
		result.unitLength = result.unitLength || 1;

		// colorConfigs
		h = render2DConfigs.getColorConfigs().toHash();
		result = Object.extend(result, h);

		return result;
	},
	/**
	 * Convert the whole {@link Kekule.Render.Render3DConfigs} instance into a
	 * one-level hash object.
	 * @param {Kekule.Render.Render3DConfigs} render3DConfigs
	 * @returns {Hash}
	 */
	convert3DConfigsToPlainHash: function(render3DConfigs)
	{
		var OU = Kekule.ObjUtils;
		var result = {};
		// keep a ref to config instance
		result._configs = render3DConfigs;

		// generalConfigs
		var h = render3DConfigs.getGeneralConfigs().toHash();
		OU.replacePropName(h, 'drawOpacity', 'opacity');
		result = Object.extend(result, h);

		// environmentConfigs
		var h = render3DConfigs.getEnvironmentConfigs().toHash();
		result = Object.extend(result, h);

		// moleculeDisplayConfigs
		var h = render3DConfigs.getMoleculeDisplayConfigs().toHash();
		OU.replacePropName(h, 'defMoleculeDisplayType', 'moleculeDisplayType');
		OU.replacePropName(h, 'defBondSpliceMode', 'bondSpliceMode');
		OU.replacePropName(h, 'defDisplayMultipleBond', 'displayMultipleBond');
		OU.replacePropName(h, 'defBondColor', 'bondColor');
		OU.replacePropName(h, 'defAtomColor', 'atomColor');
		result = Object.extend(result, h);

		// modelConfigs
		var h = render3DConfigs.getModelConfigs().toHash();
		result = Object.extend(result, h);

		// lengthConfigs
		var h = render3DConfigs.getLengthConfigs().toHash();
		result = Object.extend(result, h);

		return result;
	},

	/**
	 * Returns common render option or render 3D option value of multiple chemObjs.
	 * If values in objects are not same, null will be returned.
	 * @param {Array} chemObjs
	 * @param {String} propName
	 * @param {Bool} is3DOption
	 * @returns {Variant}
	 * @private
	 */
	getCascadeRenderOptionValueOfObjs: function(chemObjs, propName, is3DOption)
	{
		var result;
		var resultSet = false;
		var objs = Kekule.ArrayUtils.toArray(chemObjs);
		var getFunc = is3DOption? 'getCascadedRender3DOption': 'getCascadedRenderOption';
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj[getFunc])
			{
				var value = obj[getFunc](propName);
				if (!resultSet)
				{
					result = value;
					resultSet = true;
				}
				else
				{
					if (result != value)  // not match
						return null;
				}
			}
		}
		return result;
	},

	/**
	 * Set render option or render 3D option value(s) to multiple chemObjs.
	 * @param {Array} chemObjs
	 * @param {Hash} options Hash of options. {renderOptionName: value}.
	 * @param {Bool} is3DOption If true, styles will be put to Render3DOptions, otherwise RenderOptions will be set.
	 * @private
	 */
	setRenderOptionValueOfObjs: function(chemObjs, options, is3DOption)
	{
		var objs = Kekule.ArrayUtils.toArray(chemObjs);
		var setFunc = is3DOption? 'setRenderOption': 'setRenderOption';
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (obj[setFunc])
			{
				var propNames = Kekule.ObjUtils.getOwnedFieldNames(options)
				for (var j = 0, k = propNames.length; j < k; ++j)
				{
					obj[setFunc](propNames[j], options[propNames[j]]);
				}
			}
		}
	}
};

/**
 * Help methods to manipulate render3DOptions property of a chem structure object.
 * @class
 */
Kekule.Render.Render3DOptionUtils = {
	/**
	 * Retrieve bond render type from render3DOptions of a chem object.
	 * @param {Object} renderOptions
	 * @returns {Int}
	 */
	getConnectorRenderType: function(renderOptions)
	{
		return renderOptions? renderOptions.renderType: null;
	},

	/**
	 * Convert the whole {@link Kekule.Render.Render3DConfigs} instance into a
	 * one-level hash object.
	 * @param {Kekule.Render.Render2DConfigs} render3DConfigs
	 * @returns {Hash}
	 */
	convertConfigsToPlainHash: function(render3DConfigs)
	{

	}
};

/**
 * Help methods to get colors used for atom.
 * @class
 */
Kekule.Render.RenderColorUtils = {
	/**
	 * Return active color set used for atoms.
	 * @param {Int} rendererType Indicate the color will be used in 2D or 3D renderer.
	 * @return {Array}
	 */
	getActiveAtomColorSet: function(rendererType)
	{
		return Kekule.Render.atomColors[rendererType];
	},
	/**
	 * Set active color set for atoms.
	 * @param {String} newSetName
	 * @param {Int} rendererType Indicate the color will be used in 2D or 3D renderer.
	 */
	setActiveAtomColorSet: function(newSetName, rendererType)
	{
		var r = Kekule.Render.AtomColorSets[newSetName];
		if (r)
			Kekule.Render.atomColorSet[rendererType] = r;
		return r;
	},
	/**
	 * Get color for an atom.
	 * @param {Object} atomicNumber 0 is for default color for non-atom node.
	 * @param {Int} rendererType Indicate the color will be used in 2D or 3D renderer.
	 * @returns {String} '#RRGGBB' format color.
	 */
	getColor: function(atomicNumber, rendererType)
	{
		var s = Kekule.Render.RenderColorUtils.getActiveAtomColorSet(rendererType);
		var r = s[atomicNumber];
		if (!r)
			r = s[0];  // default one
		return r;
	}
};

/** @ignore */
Kekule.Render.UpdateObjUtils = {
	/** @ignore */
	_extractObjsOfUpdateObjDetails: function(updatedObjDetails)
	{
		var result = [];
		for (var i = 0, l = updatedObjDetails.length; i < l; ++i)
		{
			var detail = updatedObjDetails[i];
			if (detail.obj)
				Kekule.ArrayUtils.pushUnique(result, detail.obj);
		}
		return result;
	},
	/** @ignore */
	_createUpdateObjDetailsFromObjs: function(updatedObjs)
	{
		var result = [];
		for (var i = 0, l = updatedObjs.length; i < l; ++i)
		{
			result.push({'obj': updatedObjs[i]});
		}
		return result;
	}
};


/**
 * Helper class to define some common methods of renderer.
 * @class
 */
Kekule.Render.RendererDefineUtils = {
	/// Methods to expand support for compositeObjRenderer
	/**
	 * @class
	 * @private
	 */
	CompositeObjRendererMethods:
	/** @lends Kekule.Render.RendererDefineUtil.CompositeObjRendererMethods# */
	{
		/*
		initialize: function($super, chemObj, drawBridge, parent)
		{
			$super(chemObj, drawBridge, parent);
		},
		*/
		/** @ignore */
		finalize: function($super)
		{
			this.reset();
			$super();
		},
		/** @private */
		doEstimateObjBox: function(context, options, allowCoordBorrow)
		{
			var result = null;
			var renderers = this.prepareChildRenderers();
			var BU = Kekule.BoxUtils;
			for (var i = 0, l = renderers.length; i < l; ++i)
			{
				var r = renderers[i];
				if (r)
				{
					var b = r.estimateObjBox(context, options, allowCoordBorrow);
					if (b)
					{
						if (!result)
							result = Object.extend({}, b);
						else
							result = BU.getContainerBox(result, b);
					}
				}
			}
			return result;
		},
		/** @ignore */
		isChemObjRenderedBySelf: function($super, context, obj)
		{
			var result = $super(context, obj);
			if (!result)
			{
				var childRenderers = this.getChildRenderers();
				for (var i = 0, l = childRenderers.length; i < l; ++i)
				{
					var r = childRenderers[i];
					if (r.isChemObjRenderedBySelf(context, obj))
						return true;
				}
			}
			if (!result)
			{
				this.refreshChildObjs();
				var objs = this.getTargetChildObjs();
				result = (objs && objs.indexOf(obj) >= 0);
				//console.log('here', this.getClassName(), obj.getClassName(), result);
			}
			return result;
		},
		/** @ignore */
		isChemObjRenderedDirectlyBySelf: function($super, context, obj)
		{
			return $super(context, obj);
		},
		/**
		 * Returns all children of this.getChemObj(). Descendants must override this method.
		 * If no children is found, null should be returned.
		 * @returns {Array}
		 * @private
		 */
		getChildObjs: function()
		{
			return null;
		},
		/**
		 * Prepare all child objects to be drawn.
		 * @private
		 */
		prepareChildObjs: function()
		{
			var childObjs = this.getTargetChildObjs();
			if (childObjs)  // already prepared
				return childObjs;

			this.setTargetChildObjs(this.getChildObjs());
			return this.getTargetChildObjs();
		},
		/** @private */
		refreshChildObjs: function()
		{
			this.setTargetChildObjs(null);
			this.prepareChildObjs();
		},
		/** @private */
		getChildRenderers: function()
		{
			return this.getChildRendererMap().getValues();
		},
		/** @private */
		getRendererForChild: function(childObj, canCreate)
		{
			var renderSelector = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
				Kekule.Render.get3DRendererClass: Kekule.Render.get2DRendererClass;
			var rendererMap = this.getChildRendererMap();
			var result = rendererMap.get(childObj);
			if (!result && canCreate)
			{
				var c = renderSelector(childObj) || Kekule.Render.DummyRenderer;  // dummy renderer, do nothing
				var result = c? new c(childObj, this.getDrawBridge(), /*this.getRenderConfigs(),*/ this): null;  // renderer may be null for some unregistered objects
				rendererMap.set(childObj, result);
				result.setRedirectContext(this.getRedirectContext());
			}
			return result;
		},
		/**
		 * Prepare renders to draw child objects.
		 * @private
		 */
		prepareChildRenderers: function()
		{
			/*
			var childRenderers = this.getChildRenderers();
			if (childRenderers)
				return childRenderers;
			childRenderers = [];
			this.setChildRenderers(childRenderers);
			*/
			var rendererMap = this.getChildRendererMap();

			var childObjs = this.prepareChildObjs() || [];

			// remove unneed renderers
			var oldRenderedObjs = rendererMap.getKeys();
			for (var i = 0, l = oldRenderedObjs.length; i < l; ++i)
			{
				var obj = oldRenderedObjs[i];
				if (childObjs.indexOf(obj) < 0)
					rendererMap.remove(obj);
			}
			// add new renderers if needed
			for (var i = 0, l = childObjs.length; i < l; ++i)
			{
				var childObj = childObjs[i];
				/*
				if (!rendererMap.get(childObj))
				{
					var c = renderSelector(childObj);
					var r = c? new c(childObj, this.getDrawBridge(), this): null;  // renderer may be null for some unregistered objects
					//console.log('prepare new child renderer', r.getClassName(), childObj.getClassName(), childObj.getNodeCount? childObj.getNodeCount(): -1);
					//childRenderers.push(r);
					rendererMap.set(childObj, r);
				}
				*/
				this.getRendererForChild(childObj, true);
			}

			//return childRenderers;
			return rendererMap.getValues();
		},
		/**
		 * Release all child renderer instance.
		 * @private
		 */
		releaseChildRenderers: function()
		{
			var rendererMap = this.getChildRendererMap();
			//var childRenderers = this.getChildRenderers();
			var childRenderers = rendererMap.getValues();
			if (!childRenderers)
				return;
			for (var i = 0, l = childRenderers.length; i < l; ++i)
			{
				childRenderers[i].finalize();
			}
			//this.setChildRenderers(null);
			rendererMap.clear();
		},

		/**
		 * Prepare child objects and renderers, a must have step before draw.
		 * @private
		 */
		prepare: function()
		{
			this.prepareChildObjs();
			this.prepareChildRenderers();
		},

		/**
		 * Set renderer to initialized state, clear childObjs and childRenderers.
		 * @private
		 */
		reset: function()
		{
			this.setTargetChildObjs(null);
			this.releaseChildRenderers();
		},

		/** @private */
		doDraw: function($super, context, baseCoord, options)
		{
			// prepare, calc transform options and so on
			//this.reset();
			this.prepare();
			$super(context, baseCoord, options);

			// then draw each child objects by child renderers
			return this.doDrawCore(context, options);
		},
		/** @private */
		doDrawCore: function(context, options)
		{
			var group = this.createDrawGroup(context);
			var childRenderers = this.getChildRenderers();
			/*
			 var coordMode = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
			 Kekule.CoordMode.COORD3D: Kekule.CoordMode.COORD2D;
			 var transformFunc = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
			 Kekule.CoordUtils.transform3D: Kekule.CoordUtils.transform2D;
			 */

			var ops = Object.create(options);
			/*
			var chemObj = this.getChemObj();
			var objOptions = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
				chemObj.getOverriddenRender3DOptions(): chemObj.getOverriddenRenderOptions();

			ops = Object.extend(ops, objOptions || {});
			*/

			//console.log('overrided ops', chemObj.getClassName(), ops, objOptions);

			this.getRenderCache(context).childDrawOptions = ops;

			for (var i = 0, l = childRenderers.length; i < l; ++i)
			{
				var r = childRenderers[i];
				var baseCoord = null;
				/*
				 var chemObj = r.getChemObj();
				 if (chemObj.getAbsBaseCoordOfMode)
				 {
				 var baseCoord = chemObj.getAbsBaseCoordMode(coordMode);
				 baseCoord = transformFunc(baseCoord, options.transformParams);
				 }
				 //console.log('drawOptions', options);
				 */
				var elem = r.draw(context, baseCoord, ops);
				if (group && elem)
					this.addToDrawGroup(elem, group);
			}
			//console.log('drawn group', group);
			return group;
		},
		/* @private */
		/*
		doRedraw: function(context)
		{
			//console.log('redraw', this.getClassName());
			return this.doRedrawCore(context);
		},
		*/
		/* @private */
		/*
		doRedrawCore: function(context, options)
		{
			var group = this.createDrawGroup(context);
			var childRenderers = this.getChildRenderers();

			for (var i = 0, l = childRenderers.length; i < l; ++i)
			{
				var r = childRenderers[i];
				var elem = r.redraw(context)
				if (group && elem)
					this.addToDrawGroup(elem, group);
			}
			return group;
		},
		*/

		/** @private */
		doClear: function(context)
		{
			var childRenderers = this.getChildRendererMap().getValues();
			for (var i = 0, l = childRenderers.length; i < l; ++i)
			{
				if (childRenderers[i])
				{
					childRenderers[i].clear(context);
				}
			}
			return true;
		},
		/** @private */
		doUpdate: function(context, updateObjDetails, updateType)
		{
			var updatedObjs = Kekule.Render.UpdateObjUtils._extractObjsOfUpdateObjDetails(updateObjDetails);
			//console.log(this.getClassName(), updateType, updateObjDetails);

			//console.log(updatedObjs);

			//this.setTargetChildObjs(null);
			//this.prepareChildObjs();  // update childObjs

			//var directChildren = this.getChildObjs();
			var directChildren = this.getTargetChildObjs();
			var childRendererMap = this.getChildRendererMap();
			var objs = Kekule.ArrayUtils.toArray(updatedObjs);
			var objsMap = new Kekule.MapEx(false);
			var renderers = [];
			var redrawRoot = false;

			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];
				if (this.isChemObjRenderedDirectlyBySelf(context, obj))  // need redraw self
				{
					redrawRoot = true;
				}
			}
			if (redrawRoot)
			{
				//console.log('redraw root', this.getClassName());
				this.doClear(context);
				this.redraw(context);
				return true;
			}

			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i];

				/*
				// debug
				var isMol = false;
				if (obj instanceof Kekule.StructureFragment)
				{
					console.log('obj update here', obj.getId());
					isMol = true;
				}
				*/

				/*  // TODO: now has bugs, disable it currently
				if (this.isChemObjRenderedDirectlyBySelf(context, obj))  // the root object it self updated, need re-render self
				{
					//console.log('do redraw');
					redrawRoot = true;
					//return true;
				}
				*/

				var renderer = childRendererMap.get(obj);

				if (renderer)  // is direct child and has a corresponding renderer
				{
					/*
					// debug
					if (isMol)
					{
						console.log('find renderer', renderer.getClassName(), updateType, obj.getId());
						if (!renderer.id)
							renderer.id = obj.getId();
						else if (renderer.id !== obj.getId())
							console.log('id conflivt', renderer.id, obj.getId())
					}
					*/
					// check update type, if updateType is remove, just remove the renderer
					if (updateType === Kekule.Render.ObjectUpdateType.REMOVE)
					{
						renderer.clear();
						childRendererMap.remove(obj);
					}
					else
					{
						Kekule.ArrayUtils.pushUnique(renderers, renderer);
						//renderers.push(renderer);
						olds = [obj];
						objsMap.set(renderer, olds);
					}
				}
				else
				{
					var rs = this._getRenderersForChildObj(context, obj);
					if (!rs.length)
					{
						if (directChildren.indexOf(obj) >= 0)  // still can not find
						{
							var r = this.getRendererForChild(obj, true);
							/*
							if (r)
								rs.push(r);
							*/

							//console.log('here', r.getClassName());
							// draw directly
							var drawnResult = r.draw(context, null, this.getRenderCache(context).childDrawOptions);
							if (drawnResult)
							{
								var drawnElem = this.getCachedDrawnElem(context);
								if (drawnElem)
									this.addToDrawGroup(drawnResult, drawnElem);
							}
						}
					}
					for (var j = 0, k = rs.length; j < k; ++j)
					{
						var renderer = rs[j];
						var olds = objsMap.get(renderer);
						if (!olds)
						{
							renderers.push(renderer);
							olds = [];
							objsMap.set(renderer, olds);
						}
						olds.push(obj);
					}
				}
			}

			//console.log('do update', this.getClassName(), renderers);

			// apply update in each renderer
			var result = true;
			for (var i = 0, l = renderers.length; i < l; ++i)
			{
				var renderer = renderers[i];
				//console.log(renderer);
				var o = objsMap.get(renderer);
				//console.log('call update', renderer.getClassName(), o);
				var details = Kekule.Render.UpdateObjUtils._createUpdateObjDetailsFromObjs(o);
				/*
				// debug
				if (renderer.id)
					console.log('renderer id', renderer.id);
				if (renderer.getChemObj() instanceof Kekule.StructureFragment)
				{
					console.log('update renderer', renderer.getClassName(), updateType, o);
				}
				*/
				var r = renderer.update(context, details, updateType);
				result = result && r;

				/*
				if (!result)  // fail to update part, need to repaint whole
				{
					break;
				}
				*/
			}

			var result = renderers && renderers.length > 0;

			/*
			//if (redrawRoot)
			if (!result)
			{

				this.doClear(context);
				this.redraw(context);
				result = true;

			}
			*/
			if (!result)
			{
				result = true;
			}

			//console.log('update', updatedObjs[0].getClassName(), this.getChemObj().getClassName(), updatedObjs[0] === this.getChemObj(), renderers.length);

			return result;
		},
		/** @private */
		_getRenderersForChildObj: function(context, childObj)
		{
			var result = [];
			var childRenderers = this.getChildRenderers();
			for (var i = 0, l = childRenderers.length; i < l; ++i)
			{
				var r = childRenderers[i];
				if (r.isChemObjRenderedBySelf(context, childObj))
					result.push(r);
			}
			return result;
		}
	},

	/**
	 * Define composite render properties and methods to a class.
	 * @param {Object} aClass Should be class object.
	 */
	addCompositeRenderSupport: function(aClass)
	{
		ClassEx.defineProp(aClass, 'targetChildObjs', {
			'dataType': DataType.ARRAY,
			'serializable': false
		});
		/*
		ClassEx.defineProp(aClass, 'childRenderers', {
			'dataType': DataType.ARRAY,
			'serializable': false
		});
		*/
		ClassEx.defineProp(aClass, 'childRendererMap', {
			'dataType': DataType.OBJECT,
			'serializable': false,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('childRendererMap');
				if (!result)
				{
					result = new Kekule.MapEx(true);  // non-weak map, as we should store the renderers
					this.setPropStoreFieldValue('childRendererMap', result);
				}
				return result;
			}
		});
		ClassEx.extend(aClass, Kekule.Render.RendererDefineUtils.CompositeObjRendererMethods);
	}
};
