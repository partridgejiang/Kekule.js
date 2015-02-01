/**
 * @fileoverview
 * Contains classes and functions help to analysis text format chemical data,
 * especially the line/column fixed ones such as MDL MOL/SDF/RXN.
 * @author Partridge Jiang
 */


/*
 * requires /lan/classes.js
 * requires /lan/xmlJsons.js
 * requires /core/kekule.common.js
 * requires /localization
 */

/**
 * A helper class to read / write text data organized in lines.
 * @class
 * @augments ObjectEx
 * @param {Variant} textOrLines A pack of text (String) or lines (Array) to read.
 *
 * @property {String} text Text data to handle.
 * @property {Array} lines Each item is a line of text.
 * @property {Integer} currLineNo Which line is currently reading.
 */
Kekule.TextLinesBuffer = Class.create(ObjectEx,
/** @lends Kekule.TextLinesBuffer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.TextLinesBuffer',
	/** @private */
	LINEBREAK: '\n',
	/** @constructs */
	initialize: function($super, textOrLines)
	{
		$super();
		this.setPropStoreFieldValue('lines', []);
		if (textOrLines)
		{
			if (typeof(textOrLines) == 'string')
				this.setText(textOrLines);
			else
				this.setLines(textOrLines);
		}
		this.setCurrLineNo(0);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('lines', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('text', {
			'dataType': DataType.STRING,
			'serializable': false,
			'getter': function()
				{
					return this.getLines().join(this.LINEBREAK);
				},
			'setter': function(value)
				{
					this.setPropStoreFieldValue('lines', []);
					this.reset();
					this.appendText(value);
				}
		});

		this.defineProp('currLineNo', {'dataType': DataType.INT, 'serializable': false});
	},
	/**
	 * Get lines unread (below currLinNo).
	 * @returns {String}
	 */
	getUnreadLines: function()
	{
		var lines = [].concat(this.getLines());
		lines.splice(0, this.getCurrLineNo());
		return lines;
	},
	/**
	 * Get text unread (below currLinNo).
	 * @returns {String}
	 */
	getUnreadText: function()
	{
		return this.getUnreadLines().join(this.LINEBREAK);
	},
	/**
	 * Append text to current one.
	 * @param {String} text
	 */
	appendText: function(text)
	{
		var lines = text.split(this.LINEBREAK);
		this.appendLines(lines);
	},
	/**
	 * Append lines of text to current one.
	 * @param {Array} lines
	 */
	appendLines: function(lines)
	{
		this.setPropStoreFieldValue('lines', this.getLines().concat(lines));
		this.notifyPropSet('lines', this.getPropStoreFieldValue('lines'));
	},
	/**
	 * Clear text and lines.
	 */
	clear: function()
	{
		this.setLines([]);
		this.setCurrLineNo(0);
	},

	// methods about line read
	/** @private */
	incCurrLineNo: function(count)
	{
		if ((count === null) || (typeof(count) == 'undefined'))
			count = 1;
		var i = this.getCurrLineNo();
		i += count;
		this.setCurrLineNo(i);
	},
	/**
	 * Get value of line in index.
	 * @param {Int} index
	 * @returns {String}
	 */
	getLineAt: function(index)
	{
		var s = this.getLines()[index];
		if (s && s.length && (s.charAt(s.length - 1) === '\r'))   // may has '\r' hangling
			s = s.substring(0, s.length - 1);
		return s;
	},
	/**
	 * Get value of current line but not move currLineNo to next line.
	 * @returns {String}
	 */
	getCurrLine: function()
	{
		return this.getLineAt(this.getCurrLineNo());
	},
	/**
	 * Get value of current line and move currLineNo to next line.
	 * @returns {String}
	 */
	readLine: function()
	{
		var r = this.getLineAt(this.getCurrLineNo());
		this.incCurrLineNo();
		return r;
	},
	/**
	 * Insert a line at current position and move currLineNo to next line.
	 * @param {String} line
	 */
	writeLine: function(line)
	{
		var lines = this.getLines();
		lines.splice(this.getCurrLineNo(), 0, line);
		this.incCurrLineNo();
	},
	/**
	 * Insert array of lines at current position and move currLineNo.
	 * @param {Array} lines
	 */
	writeLines: function(lines)
	{
		/*
		var lines = this.getLines();
		lines.splice(this.getCurrLineNo(), 0, lines);
		this.incCurrLineNo(lines.length);
		*/
		for (var i = 0, l = lines.length; i < l; ++i)
			this.writeLine(lines[i]);
	},
	/**
	 * Insert text at current position and move currLineNo.
	 * Text may have line breaks.
	 * @param {String} text
	 */
	writeText: function(text)
	{
		var lines = text.split(this.LINEBREAK);
		this.writeLines(lines);
	},
	/**
	 * Check whether all lines are read and currLineNo point to end of data.
	 * @returns {Bool}
	 */
	eof: function()
	{
		return this.getCurrLineNo() >= this.getLines().length;
	},
	/**
	 * Reset currLineNo to zero (beginning of text data).
	 */
	reset: function()
	{
		this.setCurrLineNo(0);
	}
});
