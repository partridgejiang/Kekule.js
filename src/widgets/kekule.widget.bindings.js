/**
 * Implementation of data binding of Kekule widget (and even other object).
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /utils/kekule.domUtils.js
 * requires /xbrowsers/kekule.x.js
 * requires /widget/kekule.widget.base.js
 */

(function(){
"use strict";


/**
 * A  binding item between objects.
 * @class
 * @augments ObjectEx
 *
 * @param {ObjectEx} source Source object to retrieve data.
 * @param {ObjectEx} target Target object to affect by data.
 * @param {String} sourceName Appoint how to retrieve data from source, usually a property name.
 * @param {String} targetName Appoint how to set data to target, usually a property name.
 *
 * @property {ObjectEx} source Source object to retrieve data.
 * @property {ObjectEx} target Target object to affect by data.
 * @property {String} sourceName Appoint how to retrieve data from source, usually a property name.
 * @property {String} targetName Appoint how to set data to target, usually a property name.
 */
Kekule.DataBingItem = Class.create(ObjectEx,
/** @lends Kekule.DataBingItem# */
{
	/** @private */
	CLASS_NAME: 'Kekule.DataBingItem',
	/** @constructs */
	initialize: function($super, source, sourceName, target, targetName)
	{
		$super();
		this.setSource(source);
		this.setSourceName(sourceName);
		this.setTarget(target);
		this.setTargetName(targetName);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('source', {'dataType': DataType.OBJECTEX, 'serializable': false});
		this.defineProp('sourceName', {'dataType': DataType.STRING, 'serializable': false});
		this.defineProp('target', {'dataType': DataType.OBJECTEX, 'serializable': false});
		this.defineProp('targetName', {'dataType': DataType.STRING, 'serializable': false});
	},

	/**
	 * Retrieve data from source and feed to target, or from target to source if reverseDirection is true.
	 * @param {Bool} reverseDirection
	 */
	updateData: function(reverseDirection)
	{
		var src = this.getSource();
		var target = this.getTarget();
		var srcName = this.getSourceName();
		var targetName = this.getTargetName();
		if (src && target && srcName && targetName)
		{
			if (reverseDirection)
			{
				var data = target.getDataByBindingName(targetName);
				src.setDataByBindingName(srcName, data);
			}
			else
			{
				var data = src.getDataByBindingName(sourceName);
				target.setDataByBindingName(targetName, data);
			}
		}
	}
});

ClassEx.extend(ObjectEx,
/** @lends Kekule.ObjectEx# */
{
	/**
	 * Retrieve data by a binding name.
	 * Descendants can override this method.
	 * @param {String} name
	 */
	getDataByBindingName: function(name)
	{
		if (this.hasProperty(name))  // is property
			return this.getPropValue(name);
		else if (DataType.isFunctionValue(this[name]))  // is function
			return this[name]();
	},
	/**
	 * Set data by binding name.
	 * Descendants can override this method.
	 * @param {String} name
	 * @param {Variant} value
	 */
	setDataByBindingName: function(name, value)
	{
		var v = value;
		var propInfo = this.getPropInfo(name);
		if (propInfo)  // is property
		{
			var propType = propInfo.dataType;
			var valueType = DataType.getType(value);
			if ((propType !== valueType) && (valueType === DataType.STRING))  // need to convert, now only convert string to other type
			{
				v = DataType.StringUtils.deserializeValue(value);
			}
		}
		this.setPropValue(name, v);
		return this;
	},
	/**
	 * Create a data binding from src/srcName to this/targetName.
	 * @param {ObjectEx} src
	 * @param {String} srcName
	 * @param {String} targetName
	 */
	createDataBinding: function(src, srcName, targetName)
	{
		var result = new Kekule.DataBingItem(src, srcName, this, targetName);
		this.getDataBindings(true).push(result);
		return result;
	},
	/**
	 * Remove a data binding item.
	 * @param {Kekule.DataBindingItem} bindingItem
	 */
	removeDataBinding: function(bindingItem)
	{
		Kekule.ArrayUtils.remove(this.getDataBindings(), bindingItem);
	},

	/**
	 * Update all bound data.
	 * @param {Bool} reverseDirection
	 */
	updateBindingData: function(reverseDirection)
	{
		var items = this.getDataBindings();
		if (items && items.length)
		{
			for (var i = 0, l = items.length; i < l; ++i)
			{
				items[i].updateData(reverseDirection);
			}
		}
	}
});

/*
 * data binding
 */
ClassEx.defineProp(ObjectEx, 'dataBindings', {'dataType': DataType.ARRAY,
	'scope': Class.PropertyScope.PRIVATE,
	'getter': function(canCreate)
	{
		var result = this.getPropStoreFieldValue('dataBindings');
		if (!result && canCreate)
		{
			result = [];
			this.setPropStoreFieldValue('dataBindings', result);
		}
		return result;
	}
});

})();
