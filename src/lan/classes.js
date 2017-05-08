/**
 *  @fileoverview
 *  This file simulates the class-based inheritance, most of the code is
 *  borrowed from Prototype lib. My own property system borrowed form WebShow framework
 *  is also added here.
 *
 *  @author Partridge Jiang
 */


"use strict";

(function($jsRoot){

/** @ignore */
function emptyFunction() {};


/** @ignore */
function __$A__(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
}

/** @class Class */
var Class = {
		/**
		 * @description Create a Prototypejs style class, createCore(baseClass, newClassHash).
		 * @param {Class} baseClass Parent class.
		 * @param {Hash} newClassHash A hash contains methods of current class.
		 * @return {Class} The class created.
		 */
    createCore: function() {
        var parent = null, properties = __$A__(arguments);
        if (Object.isFunction(properties[0]))
            parent = properties.shift();

        function klass() {
            this.initialize.apply(this, arguments);
        }

        Object.extend(klass, Class.Methods);

        klass.superclass = parent;
        klass.subclasses = [];

        if (parent) {
            var subclass = function() { };
            subclass.prototype = parent.prototype;
            klass.prototype = new subclass;
            parent.subclasses.push(klass);
        }

        for (var i = 0; i < properties.length; i++)
            klass.addMethods(properties[i]);

        if (!klass.prototype.initialize)
            klass.prototype.initialize = emptyFunction; //Prototype.emptyFunction;

        klass.prototype.constructor = klass;

        return klass;
    },
    /**
		 * @description Create a new class, currently same as createCore, create(baseClass, newClassHash).
		 * @see Class#createCore.
		 * @param {Class} baseClass Parent class.
		 * @param {Hash} newClassHash A hash contains methods of current class.
		 * @return {Class} The class created.
		 */
    create: function()
    {
    	var result = Class.createCore.apply(this, arguments);
  		// init properties
  		//if (result.prototype.initProperties)
  		{
  			// init properties field in prototype
  			/*
  			if (!result.prototype.properties)
  				result.prototype.properties = [];
  			*/
  			/*
  			 * Use lasy creation, the property list will be created only the first instance of class is used
  			if (result.prototype.hasOwnProperty('initProperties'))  // prevent call parent initProperties method
  				result.prototype.initProperties.apply(result.prototype);
  			*/
  		}
  		return result;
    },
	/**
	 * Finalize object.
	 * @param {ObjectEx} obj
	 */
	free: function(obj)
	{
		if (obj.finalize)
			obj.finalize();
		obj = null;
	}
};

/** @ignore */
Class.Methods = {
		/* @lends Class */
		/*
		 * @description Add new methods to a existing class.
		 * @param {Hash} source A hash contains methods to add.
		 * @return {Class} resultClass Current class with methods added.
		 */
		/** @ignore */
		// Note this method is modified by Partridge Jiang to support '$origin' param.
    addMethods: function(source) {
    		if (!source)
    			return this;
        var ancestor = this.superclass && this.superclass.prototype;
        var properties = Object.keys(source);

        if (!Object.keys({ toString: true }).length)
            properties.push("toString", "valueOf");

				var doNothing = function() {};


				for (var i = 0, length = properties.length; i < length; i++) {
				    var property = properties[i];
				    var value = source[property];

						var isFunction = Object.isFunction(value);

				    //if (ancestor && isFunction && value.argumentNames().first() == "$super")
					if (ancestor && isFunction && FunctionUtils.argumentNames(value).first() == "$super")
						{
				        var method = value;
				        /** @inner */
				        value = (function(m) {
				            return function() { return (ancestor[m] || doNothing).apply(this, arguments); };
				        })(property).wrap(method);

				        value.valueOf = method.valueOf.bind(method);
				        value.toString = method.toString.bind(method);
				    }
				    this.prototype[property] = value;
				}
        return this;
    }
};

/** @ignore */
Object.extend = function(destination, source, ignoreUnsetValue, ignoreEmptyString) {
    for (var property in source)
		{
			var value = source[property];
			if (ignoreUnsetValue && ((value === undefined) || (value === null)))
				continue;
			if (ignoreEmptyString && (value === ''))
				continue;
      destination[property] = value;
		}
    return destination;
};
/** @ignore */
Object.extendEx = function(destination, source, options)
{
  var ops = options || {};
  for (var property in source)
  {
    var value = source[property];
    if (ops.ignoreUnsetValue && ((value === undefined) || (value === null)))
      continue;
    if (ops.ignoreEmptyString && (value === ''))
      continue;

    var oldValue = destination[property];
    if (options.preserveExisted && oldValue)
      continue;
    var oldProto = oldValue && oldValue.constructor && oldValue.constructor.prototype;
    var newProto = value && value.constructor && value.constructor.prototype;
    if (oldValue && typeof(oldValue) === 'object' && oldProto === newProto)
      Object.extend(oldValue, value);
    else
      destination[property] = value;
  }
  return destination;
};
/** @ignore */
Object._extendSupportMethods = function(destination, methods)
{
  return Object.extendEx(destination, methods, {ignoreUnsetValue: true, preserveExisted: true});
};
/** @ignore */
// e.g., obj.getCascadeFieldValue('level1.level2.name') will return obj.level1.level2.name.
Object.getCascadeFieldValue = function(fieldName, root)
{
  var result;
  var cascadeNames;
  if (fieldName.length && fieldName.splice)  // is an array
    cascadeNames = fieldName;
  else
    cascadeNames = fieldName.split('.');
  if (!root)
    var root = this;
  for (var i = 0, l = cascadeNames.length; i < l; ++i)
  {
    result = root[cascadeNames[i]];
    if (!result)
      break;
    else
      root = result;
  }
  return result;
};
/** @ignore */
Object.setCascadeFieldValue = function(fieldName, value, root, forceCreateEssentialObjs)
{
  var cascadeNames;
  if (fieldName.length && fieldName.splice)  // is an array
    cascadeNames = fieldName;
  else
    cascadeNames = fieldName.split('.');
  var parent = root;
  for (var i = 0, l = cascadeNames.length; i < l; ++i)
  {
    var name = cascadeNames[i];
    if (i === l - 1)  // success
    {
      parent[name] = value;
      return value; //true;
    }
    else
    {
      var obj = parent[name];
      if (!obj && forceCreateEssentialObjs)  // create new obj
      {
        obj = {};
        parent[name] = obj;
      }
      if (!obj)
        return false;
      else
        parent = obj;
    }
  }
};

/**
 * Create a "heir" object of proto.
 * @ignore
 */
Object._inherit = function(proto)
{
	if (proto === null)
		proto = {};
		//throw TypeError();

	var t = typeof(proto);
	if (!(DataType.isFunctionType(t) || DataType.isObjectType(t)))
		throw TypeError();
	function f() {};
	f.prototype = proto;
	return new f();
};

if (!Object.create)
{
	Object.create = Object._inherit;
}

/** @ignore */
// Add by Partridge Jiang
// copy a set of values from src to dest
Object.copyValues = function(dest, src, propNames)
{
	if (!propNames)
		return Object.extend(dest, source);
	else
	{
		for (var i = 0, l = propNames.length; i < l; ++i)
		{
			var prop = propNames[i];
			var value = src[prop];
			if (value !== undefined)
				dest[prop] = value;
		}
		return dest;
	}
};

// extend class methods
/** @ignore */
Object._extendSupportMethods(Object, {
  keys: function(object) {
      var keys = [];
      for (var property in object)
          keys.push(property);
      return keys;
  },
  isFunction: function(object) {
      return typeof object == "function";
  },
  isUndefined: function(object) {
      return typeof object == "undefined";
  }
});

var FunctionUtils = {
	argumentNames: function(f) {
		var names = ((f.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/) || [])[1] || '').replace(/\s+/g, '').split(',');
		return names.length == 1 && !names[0] ? [] : names;
	},
	/*
	wrap: function(f, wrapper) {
		var __method = f;
		return function() {
			return wrapper.apply(f, [__method.bind(f)].concat(__$A__(arguments)));
		};
	},
	methodize: function(f) {
		if (f._methodized) return f._methodized;
		var __method = f;
		return f._methodized = function() {
			var a = Array.prototype.slice.call(arguments);
			a.unshift(f);
			return __method.apply(null, a);
		};
	},
	bind: function(f) {
		if (arguments.length < 2 && Object.isUndefined(arguments[0])) return f;
		var __method = f, args = __$A__(arguments), object = args.shift();
		return function() {
			return __method.apply(object, args.concat(__$A__(arguments)));
		};
	},
	delay: function(f) {
		var __method = f, args = __$A__(arguments), timeout = args.shift();
		return window.setTimeout(function() {
			return __method.apply(__method, args);
		}, timeout);
	},
	defer: function() {
		var __method = f, args = __$A__(arguments), timeout = args.shift();
		return window.setTimeout(function() {
			return __method.apply(__method, args);
		}, 10);
	}
	*/
};

/** @ignore */
Object._extendSupportMethods(Function.prototype, {
  argumentNames: function() {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');
      return names.length == 1 && !names[0] ? [] : names;
  },
  wrap: function(wrapper) {
      var __method = this;
      return function() {
          return wrapper.apply(this, [__method.bind(this)].concat(__$A__(arguments)));
      };
  },
  methodize: function() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = Array.prototype.slice.call(arguments);
      a.unshift(this);
      return __method.apply(null, a);
    };
  },
  bind: function() {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = __$A__(arguments), object = args.shift();
    return function() {
      return __method.apply(object, args.concat(__$A__(arguments)));
    };
  },
  delay: function() {
    var __method = this, args = __$A__(arguments), timeout = args.shift();
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  },
  defer: function() {
    var __method = this, args = __$A__(arguments), timeout = args.shift();
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, 10);
  }
});
/*
Object._extendSupportMethods(Function.prototype, {
	argumentNames: function() {
		return FunctionUtils.argumentNames(this);
	},
	wrap: function(wrapper) {
		return FunctionUtils.wrap(this, wrapper);
	},
	methodize: function() {
		return FunctionUtils.methodize(this);
	},
	bind: function() {
		return FunctionUtils.bind(this);
	},
	delay: function() {
		return FunctionUtils.delay(this);
	},
	defer: function() {
		return FunctionUtils.defer(this);
	}
});
*/


/** @ignore */
Object._extendSupportMethods(Array.prototype, {
  first: function() {
      return this[0];
  },
  last: function() {
    return this[this.length - 1];
  },
  clear: function() {
    this.length = 0;
    return this;
  },
  without: function() {
    var values = __$A__(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },
  removeAt: function(index)
  {
    /*
    for (var i = index, l = this.length - 1; i < l - 1; ++i)
    {
      this[i] = this[i + 1];
    }
    delete this[length - 1];
    */
    this.splice(index, 1);
  },
  remove: function(item)
  {
    var index = this.indexOf(item);
    if (index >= 0)
      return this.removeAt(index);
  },
  forEach: function(func, scope)
  {
    var i, len;
    for (i = 0, len = this.length; i < len; ++i) {
      if (i in this) {
        func.call(scope, this[i], i, this);
      }
    }
  }
});
if (!Array.prototype.indexOf)
{
	/** @ignore */
	Array.prototype.indexOf = function(item, i) {
	  i || (i = 0);
	  var length = this.length;
	  if (i < 0) i = length + i;
	  for (; i < length; i++)
	    if (this[i] === item) return i;
	  return -1;
	};
}

if (!Array.prototype.lastIndexOf)
{
	/** @ignore */
	Array.prototype.lastIndexOf = function(item, i) {
	  i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
	  var n = this.slice(0, i).reverse().indexOf(item);
	  return (n < 0) ? n : i - n - 1;
	};
}

/** @ignore */
Object._extendSupportMethods(String.prototype, {
	gsub: function gsub(pattern, replacement) {
		var result = '', source = this, match;
		//replacement = this.gsub.prepareReplacement(replacement);

		while (source.length > 0) {
			if (match = source.match(pattern)) {
				result += source.slice(0, match.index);
				result += replacement;
				source  = source.slice(match.index + match[0].length);
			} else {
				result += source, source = '';
			}
		}
		return result;
	},

	sub: function(pattern, replacement, count) {
		//replacement = this.gsub.prepareReplacement(replacement);
		count = Object.isUndefined(count) ? 1 : count;

		return this.gsub(pattern, function(match) {
			if (--count < 0) return match[0];
			return replacement(match);
		});
	},

	scan: function(pattern, iterator) {
		this.gsub(pattern, iterator);
		return String(this);
	},

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script); });
  },

  escapeHTML: function escapeHTML() {
		/*
    var self = arguments.callee;
    self.text.data = this;
    return self.div.innerHTML;
    */
		return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />');
  },

  unescapeHTML: function() {
		/*
    var div = new Element('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? (div.childNodes.length > 1 ?
      __$A__(div.childNodes).inject('', function(memo, node) { return memo+node.nodeValue; }) :
      div.childNodes[0].nodeValue) : '';
    */
		return this.replace(/\<br \/\>/g, '\n').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  times: function(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },
	capitalizeFirst: function() {
    return this.charAt(0).toUpperCase() + this.substring(1);
  },

  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
      var character = String.specialChar[match[0]];
      return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  },

  toJSON: function() {
    return this.inspect(true);
  },

  unfilterJSON: function(filter) {
    return this.sub(filter || Prototype.JSONFilter, '#{1}');
  },

  isJSON: function() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  },

  evalJSON: function(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  },

  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },

  empty: function() {
    return this == '';
  },

  blank: function() {
    return /^\s*$/.test(this);
  },

  interpolate: function(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }
});

// added by partridge
/** @ignore */
Object._extendSupportMethods(String.prototype, {
	upperFirst: function()
	{
		return this.charAt(0).toUpperCase() + this.substring(1);
	},
	// 'The {0} is dead. Don\'t code {0}. Code {1} that is open source!'.format('ASP', 'PHP');
	format: function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
	},
  trim: function()
  {
    return this.replace(/^\s*|\s*$/g, "");
  },
	ltrim: function()
	{
		return this.replace(/^\s+/,"");
	},
	rtrim: function()
	{
		return this.replace(/\s+$/,"");
	},
  trimLeft: function()
  {
    return this.ltrim();
  },
  trimRight: function()
  {
    return this.rtrim();
  },
	pad: function(length, padString, rightPad)
	{
		var p = padString || ' ';
		var a = [];
		for (var i = 0, l = length - this.length; i < l; ++i)
			a.push(p);
		var str = this;
		if (rightPad)
			return str + a.join('');
		else
			return a.join('') + str;
	},
	lpad: function(length, padString)
	{
		return this.pad(length, padString, false);
	},
	rpad: function(length, padString)
	{
		return this.pad(length, padString, true);
	},
	reverse: function()
	{
		var length = this.length;
		var a = [];
		for (var i = length - 1; i >= 0; --i)
		{
			a.push(this.charAt(i));
		}
		return a.join('');
	},
	toCharArray: function()
	{
		var a = [];
		for (var i = 0, l = this.length; i < l; ++i)
		{
			a.push(this.charAt(i));
		}
		return a;
	},

	/*
	 * Turn camelized word like thisIsAWord to this-is-a-word.
	 */
	hyphenize: function(hyphen)
	{
		if (!hyphen)
			hyphen = '-';
		var len = this.length;
		var a = [];
		for (var i = 0; i < len; ++i)
		{
			var c = this.charAt(i);
			if ((i !== 0) && (c >= 'A') && (c <= 'Z'))
			{
				a.push(hyphen + c.toLowerCase());
			}
			else
				a.push(c);
		}
		return a.join('');
	}
});



/**
 * Some helper methods about string
 * @class
 */
var StringUtils = {
	/** @private */
	STRUE: '$TRUE',
	/** @private */
	SFALSE: '$FALSE',
	/** @private */
	SUNDEFINED: '$UNDEFINED',
	/** @private */
	SNULL: '$NULL',
	/** @private */
	SNAN: '$NAN',
	/** @private */
	SPOSITIVE: '+',
	/** @private */
	SNEGATIVE: '-',
	/** @private */
	SDATEPREFIX: '@',
	/**
	 * Check if a str is all consisted of digitals
	 * @param {String} str
	 * @returns {Bool}
	 * @private
	 */
	isAllDigitalChar: function(str)
	{
		for (var i = 0, l = str.length; i < l; ++i)
		{
			var c = str.charAt(i);
			var isDigital = (c >= '0') && (c <= '9');
			if ((!isDigital) && (c != '.'))
				return false;
		}
		return true;
	},
	/**
   * Check if str is in number format.
   * @param {String} str
   * @returns {Bool}
   */
  isNumbericStr: function(str)
  {
    var a = Number(str);
    return !isNaN(a);
  },
	/**
	 * Serialize a simple value and try to preserve value type info.
	 * @param {Variant} value
	 * @param {Array} unchangeTypes Name of types that need not to be special marked.
	 * @returns {String}
	 */
	serializeValue: function(value, unchangeTypes)
	{
		var utypes = unchangeTypes || [];
		var vtype = DataType.getType(value);
		if (utypes.indexOf(vtype) >= 0)
			return value.toString();

		if (value === null)
			return StringUtils.SNULL;
		else if (typeof(value) == 'undefined')
			return StringUtils.SUNDEFINED;
		else if (value != value)  // NaN
			return StringUtils.SNAN;
		else
		{
			switch (vtype)
			{
				case 'boolean':
					return value ? StringUtils.STRUE : StringUtils.SFALSE;
					break;
				case 'number': case DataType.INT:case DataType.FLOAT:
					// add '+' or '-' symbol before a number value
					var sign = (value >= 0)? StringUtils.SPOSITIVE: '';  //this.SNEGATIVE;
					return sign + value;
					break;
				case DataType.DATE:
					return StringUtils.SDATEPREFIX + value.toString();
				default:  // string
					return value.toString();
			}
		}
	},
	/**
	 * Deserialize a simple value from string by value type info stored inside.
	 * @param {String} str
	 * @param {String} preferedType If provided, str will be converted to this type.
	 * @returns {Variant}
	 */
	deserializeValue: function(str, preferedType)
	{
		if (typeof(str) !== 'string')
			return str;
		switch(str)
		{
			case StringUtils.STRUE: return true; break;
			case StringUtils.SFALSE: return false; break;
			case StringUtils.SNULL: return null; break;
			case StringUtils.SUNDEFINED: return undefined; break;
			case StringUtils.SNAN: return NaN; break;
			default:
			{
				if (preferedType)
				{
					switch (preferedType)
					{
						case DataType.FLOAT:
							return parseFloat(str); break;
						case DataType.INT:
							return parseInt(str); break;
						case 'number':
							return parseFloat(str); break;
						case 'boolean':
							return !!str; break;
						default:
							return str;
					}
				}
				else // guess
				{
					var firstChar = str.charAt(0);
					switch (firstChar)
					{
						case StringUtils.SPOSITIVE:
						case StringUtils.SNEGATIVE: // may be number
							{
								var s = str.substring(1);
								if (StringUtils.isNumbericStr(s)) // really number or number like 1e20
									return parseFloat(str);
								else
									return str;
								break;
							}
						case StringUtils.SDATEPREFIX:  // may be date
							{
								var s = str.substr(1);
								return new Date(s);
							}
						default:
							return str;
					}
				}
			}
		}
	}
};


// Added by partridge
/** @ignore */
Object.extend(Date.prototype, {
	/** @ignore */
	copyFrom: function(src)
	{
		this.setFullYear(src.getFullYear(), src.getMonth(), src.getDate());
		this.setTime(src.getTime());
	}
});

/** @ignore */
if (!Math.sqr)
{
  Math.sqr = function(x)
  {
    return x * x;
  };
}
/** @ignore */
if (!Math.sign)
  Math.sign = function(x) {
    return (x > 0)? 1:
      (x < 0)? -1:
        0;
  };

// Add Node.XXXX support in IE
//if (!window.Node) var Node = { };
if (!$jsRoot.Node) $jsRoot.Node = { };

if (!$jsRoot.Node.ELEMENT_NODE) {
  // DOM level 2 ECMAScript Language Binding
  Object.extend($jsRoot.Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}

/**
 * Enumeration of property scope.
 * @enum {Int}
 */
Class.PropertyScope = {
	DEFAULT: 3,
	PUBLISHED: 3,
	PUBLIC: 2,
	PRIVATE: 1
};

/** @class Class.PropList
 *  @description Property list, inside each prop is stored as a object:
 *  {
 *  	name: property name,
 *  	storeField: defaultly which field to store value,
 *  	dataType:
 *  	serializable: boolean,
 *  	defaultValue: default value of property
 *    // added in 2014-05-02, for object inspector
 *    title: a string that displays in object inspector.
 *    description: a string that describes the property.
 *    category: string, category of property. Different property may have the same category.
 *    scope: private, public or published. Used to filter output properties in object inspector.
 *    enumSource: object. Some property marked as int or other type may be actually a enum,
 *      if this value is set, all owned fields of enumSource will be treated as possible enum values in object inspector.
 *    elementType: string. For array type property, this field set the type of array items.
 *  }
 *  @ignore
 */
Class.PropList = function()
{
	this.props = [];
};
Class.PropList.prototype = {
	//** @private */
	//PROP_KEY_PREFIX: '__$prop__',
	//** @private */
	/*
	getPropKeyPrefix: function(propName)
	{
		return this.PROP_KEY_PREFIX + propName;
	},
	*/
	/**
	 * Add a property info object to the list.
	 * @param {String} propName
	 * @param {Hash} options A hash that may contains the following fields:
	 *   {
	 *     storeField: field name to store the property in object.
	 *     dataType: data type of property, unused currently.
	 *     serializable: whether this property can be serialized or unserialized.
	 *     defaultValue: default value of property, can only be simple type (string, number) now.
	 *     getter:
	 *     setter:
	 *     // added in 2014-05-02, for object inspector
	 *     title: a string that displays in object inspector.
	 *     description: a string that describes the property.
	 *     category: string, category of property. Different property may have the same category.
	 *     scope: private, public or published. Used to filter output properties in object inspector.
	 *     enumSource: object. Some property marked as int or other type may be actually a enum,
	 *       if this value is set, all owned fields of enumSource will be treated as possible enum values in object inspector.
	 *     elementType: string. For array type property, this field set the type of array items.
	 *   }
	 * @returns {Object} A property info object just added.
	 */
	addProperty: function(propName, options)
	{
		if (!options)
			options = {};

		var propInfo;
		propInfo = this.getPropInfo(propName);
		if (!propInfo)
		{
			propInfo = {};
			this.props.push(propInfo);
		}
		propInfo = Object.extend(propInfo, options);
		if (propInfo.serializable  === undefined)
			propInfo.serializable = true;

		propInfo.name = propName;
		/*
		propInfo.storeField = options.storeField;
		propInfo.dataType = options.dataType;
		propInfo.serializable = options.serializable;
		propInfo.defaultValue = options.defaultValue;
		*/

		/*
		// to accelarate the speed of getting prop info, add a hash key here
		this[this.getPropKeyPrefix(propName)] = propInfo;
		*/

		return propInfo;
	},
	/**
	 * Remove a property info object from list
	 * @param {String} propName property name to be removed.
	 */
	removeProperty: function(propName)
	{
		/*
		var hashKey = this.getPropKeyPrefix(propName);
		if (this[hashKey])
			delete this[hashKey];
		*/

		var index = this.indexOf(propName);
		if (index >= 0)
		{
			this.props.splice(index, 1);
		}
		//this.props.length = this.props.length - 1;
	},
	removePropAt: function(index)
	{
		if (index >= 0)
		{
			var prop = this.props[index];
			if (prop)
			{
				/*
				var hashKey = this.getPropKeyPrefix(prop.name);
				if (this[hashKey])
					delete this[hashKey];
				*/
				this.props.splice(index, 1);
			}
		}
	},
	/**
	 * Returns property count in this list.
	 * @returns {Int}
	 */
	getLength: function()
	{
		return this.props.length;
	},
	/**
	 * Get the index of a property in list.
	 * @param {String} propName Name of property to be found.
	 * @returns {Num} Index of property found. If nothing is found, returns -1.
	 */
	indexOf: function(propName)
	{
		for (var i = 0, l = this.props.length; i < l; ++i)
		{
			if (this.props[i].name === propName)
				return i;
		}
		return -1;
	},
	/**
	 * Get property info object from the list at index.
	 * @param {Int} index index of property to be found.
	 * @returns {Object} Property info object found. If nothing is found, returns null.
	 */
	getPropInfoAt: function(index)
	{
		if (index >= 0)
			return this.props[index];
		else
			return null;
	},
	/**
	 * Get property info object from the list.
	 * @param {String} propName Name of property to be found.
	 * @returns {Object} Property info object found. If nothing is found, returns null.
	 */
	getPropInfo: function(propName)
	{
		var result;
		/*
		var hashKey = this.getPropKeyPrefix(propName);
		if (this[hashKey])
			result = this[hashKey];
		else
		*/
		{
			var index = this.indexOf(propName);
			var result = this.getPropInfoAt(index);

			/*
			if (!result)
				;
			else
			{
				console.dir(this);
				throw('should not be here: ' + propName);
			}
			*/

			//this[hashKey] = result;   // add to hash key to accelerate next time searching
		}
		return result;
	},
	/**
	 * Check whether a property existed in the list.
	 * @param {String} propName Name of property to be checked.
	 * @return {Bool} true or false.
	 */
	hasProperty: function(propName)
	{
		/*
		var hashKey = this.getPropKeyPrefix(propName);
		return (!!this[hashKey]) || (this.indexOf(propName) >= 0);
		*/
		return (this.indexOf(propName) >= 0);
	},
	/**
	 * Clear all property info objects in the list.
	 */
	clear: function()
	{
		/*
		var props = this.props;
		for (var i = props.length; i >= 0; --i)
		{
			this.removePropAt(i);
		}
		*/
		this.props.clear();
	},
	/**
	 * Clone the while propList
	 * @returns {Class.PropList}
	 */
	clone: function()
	{
		var result = new Class.PropList();
		result.props = this.props.slice();
    //result.props = [].concat(this.props);
		return result;
	},
	/**
	 * Append the content of propList to current one.
	 * @param {Class.PropList} propList
	 */
	appendList: function(propList)
	{
		for (var i = 0, l = propList.props.length; i < l; ++i)
		{
			this.props.push(propList.props[i]);
		}
	}
};
Class.PropList.prototype.constructor = Class.PropList;

/**
 *  @class Class.EventHandlerList
 *  @description
 *  Event handler list, support for multi-receiver event system
 *  the list hold a handlerInfo array, each item has two fields:
 *  {
 *  	handler: handler function,
 *  	thisArg: this scope object, if null, use default this
 *  }
 *  @ignore
 */
Class.EventHandlerList = function()
{
	this.handlers = [];
  this._$flag_ = 'KekuleEventList';
};
Class.EventHandlerList.prototype = {
	/**
	 * Add a handler to the list
	 * @param {Function} handler An event handler function.
	 * @param {Object} thisArg The handler should be bind to which scope when be invoked.
	 */
	add: function(handler, thisArg)
	{
		if (!thisArg)
			thisArg = null;
		this.handlers.push({
			'thisArg': thisArg,
			'handler': handler
		});
	},
	/**
	 * Remove an event handler from the list.
	 * @param {Function} handler Handler function to be removed.
	 * @param {Object} thisArg If this param is null, all functions same as handler
	 *   in the list will be removed regardless of whether their thisArg is setted.
	 */
	remove: function(handler, thisArg)
	{
		var indexes = this.indexesOf(handler, thisArg);
		if (indexes.length > 0)
		{
			for (var i = indexes.length - 1; i >= 0; --i)
			{
				this.removeAt(indexes[i]);
			}
		}
	},
	/**
	 * Remove an event handler at a specified index.
	 * @param {Num} index
	 */
	removeAt: function(index)
	{
		for (var i = index, l = this.handlers.length; i < l; ++i)
			this.handlers[i] = this.handlers[i + 1];
		this.handlers.length = this.handlers.length - 1;
	},
	/**
	 * Clear all handlers in the list.
	 */
	clear: function()
	{
		this.handlers = [];
	},
	/**
	 * Get handler info object from the list.
	 * @param {Num} index
	 * @return {Object} Handler info object on index.
	 */
	getHandlerInfo: function(index)
	{
		return this.handlers[index];
	},
	/**
	 * Get the index of a handler specified with thisArg.
	 * @param {Function} handler
	 * @param {Object} thisArg
	 * @return {Num} Index of the handler. If nothing is found, returns -1.
	 */
	indexOf: function(handler, thisArg)
	{
		for (var i = 0, l = this.handlers.length; i < l; ++i)
		{
			if (this.handlers[i].handler == handler)
			{
				if ((thisArg !== undefined) && (this.handlers[i].thisArg === thisArg))
					return i;
				else if (thisArg === undefined)
					return i;
			}
		}
		return -1;
	},
	/**
	 * Seek out all indexes that match handler and thisArg.
	 * @param {Function} handler
	 * @param {Object} thisArg
	 * @return {Array} All found indexes. If nothing is found, an empty array will be returned.
	 */
	indexesOf: function(handler, thisArg)
	{
		var result = [];
		for (var i = 0, l = this.handlers.length; i < l; ++i)
		{
			if (this.handlers[i].handler == handler)
			{
				if ((thisArg !== undefined) && (this.handlers[i].thisArg === thisArg))
					result.push(i);
				else if (thisArg === undefined)
					result.push(i);
			}
		}
		return result;
	},
	/**
	 * Get total count of registered handlers.
	 * @return {Num} Number of handlers.
	 */
	getLength: function()
	{
		return this.handlers.length;
	}
};
Class.EventHandlerList.constructor = Class.EventHandlerList;

/**
 * Includes constants and mthods about data types.
 * @class
 */
var DataType = {
	/** Unknown data type, same as {@link DataType.VARIANT}. */
	UNKNOWN: null,
	/** Variant data type, same as {@link DataType.UNKNOWN}. */
	VARIANT: null,
	/** Basic data type, including string, number and boolean. */
	PRIMARY: 'primary',
	/** type of JS const undefined */
	UNDEFINED: 'undefined',
	/** Boolean. */
	BOOL: 'boolean',
	/** Boolean. same as {@link DataType.BOOL} */
	BOOLEAN: 'boolean',
	/** Number. */
	NUMBER: 'number',
	/** Explicit integer number. */
	INT: 'int',
	/** Explicit integer number, same as {@link DataType.INT} */
	INTEGER: 'int',
	/** Explicit float number. */
	FLOAT: 'float',
	/** String */
	STRING: 'string',
	/** Array */
	ARRAY: 'array',
	/** Function */
	FUNCTION: 'function',
	/** Hash */
	DATE: 'date',
	HASH: 'object',
	/** A normal JavaScript object. */
	OBJECT: 'object',
	/** Object extended from {@link ObjectEx} */
	OBJECTEX: 'objectex',
	/** A CLASS */
	CLASS: 'class',

	/**
	 * Returns whether a type name is string, number or boolean
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isSimpleType: function(typeName)
	{
		return (typeName == DataType.STRING) || (typeName == DataType.NUMBER)
			|| (typeName == DataType.INT) || (typeName == DataType.FLOAT)
			|| (typeName == DataType.BOOL) || (typeName == DataType.UNDEFINED)
			|| (typeName == DataType.PRIMARY);
	},
	/**
	 * Returns whether a type name is object, array or objectex
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isComplexType: function(typeName)
	{
		return !(DataType.isSimpleType(typeName) || DataType.isFunctionType(typeName));
	},
	/**
	 * Returns whether a type name is function.
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isFunctionType: function(typeName)
	{
		return typeName == DataType.FUNCTION;
	},
	/**
	 * Returns whether a type name is object.
	 * NOTE: this function does not distinguish array.
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isObjectType: function(typeName)
	{
		return typeName == DataType.OBJECT;
	},
	/**
	 * Returns whether a type name is Date.
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isDateType: function(typeName)
	{
		return typeName == DataType.DATE;
	},
	/**
	 * Returns whether a type name is ObjectEx.
	 * @param {String} typeName
	 * @returns {Bool}
	 */
	isObjectExType: function(typeName)
	{
		var result = DataType.isComplexType(typeName) && (!DataType.isObjectType(typeName)) && (!DataType.isDateType(typeName));
		if (result)  // check if the class exists
		{
			var classObj = ClassEx.findClass(typeName);
			result = classObj && ClassEx.isOrIsDescendantOf(classObj, ObjectEx);
		}
		return result;
	},
	/**
	 * Get value type and returns a data type string.
	 * @param {Variant} value
	 * @returns {String}
	 */
	getType: function(value)
	{
		var stype = typeof(value);
		switch (stype)
		{
			// TODO: Some native classes such as RegExp are not checked yet
			// basic types
			case 'undefined': return DataType.UNDEFINED;
			case 'function': return DataType.FUNCTION;
			case 'boolean': return DataType.BOOL;
			case 'string': return DataType.STRING;
			case 'number':
				{
					if (Math.floor(value) == value)
						return DataType.INT;
					else
						return DataType.FLOAT;
				}
			case 'object':  // complex
				{
					if (this.isDateValue(value))
						return DataType.DATE;
					else if (DataType.isArrayValue(value))
						return DataType.ARRAY;
					else if (ClassEx.isClass(value))
						return DataType.CLASS;
					else if (DataType.isObjectExValue(value) && value.getClassName)
						return value.getClassName();
					else
						return DataType.OBJECT;
				}
			default:
				return stype;
		}
	},
	/**
	 * Check if value is number, string or bool.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isSimpleValue: function(value)
	{
		return DataType.isSimpleType(typeof(value));
	},
	/**
	 * Check if value is undefined
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isUndefinedValue: function(value)
	{
		return typeof(value) == 'undefined';
	},
	/**
	 * Check if value is null
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isNullValue: function(value)
	{
		return (value === null);
	},
	/**
	 * Check if value is a function.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isFunctionValue: function(value)
	{
		return typeof(value) == 'function';
	},
	/**
	 * Check if an value is an non-array Object.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isObjectValue: function(value)
	{
		if (value)  // not null
			return (typeof(value) == 'object') && (!DataType.isArrayValue(value)) && (!DataType.isDateValue(value));
		else
			return false;
	},
	/**
	 * Check if an value is an instance of Date.
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isDateValue: function(value)
	{
		if (value)
			return ((typeof(value) == 'object') && (value.getFullYear !== undefined));
		return false;
	},
	/**
	 * Check if an value is an Array
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isArrayValue: function(value)
	{
		if (value)
			return ((typeof(value) == 'object') && (value.length !== undefined));
		else
			return false;
	},
	/**
	 * Check if an value is an instance of ObjectEx
	 * @param {Variant} value
	 * @returns {Bool}
	 * @private
	 */
	isObjectExValue: function(value)
	{
		return (value instanceof ObjectEx);
	},
	/**
	 * Create an instance of typeName
	 * @param {String} typeName
	 * @returns {Variant}
	 */
	createInstance: function(typeName)
	{
		switch (typeName)
		{
			case DataType.UNDEFINED: return undefined;
			case DataType.DATE: return new Date();
			case DataType.ARRAY: return new Array();
			case DataType.OBJECT: return new Object();
			case DataType.FUNCTION: return new Function();
			default: // maybe a ObjectEx descendant
				{
					var classInstance = ClassEx.findClass(typeName.capitalizeFirst()); //eval(typeName.capitalizeFirst());
					return new classInstance();
				}
		}
	}
};


/**
 * A pack of utility methods to modify a existing class.
 * @class ClassEx
 */
var ClassEx = {
	/**
	 * Checks if a object is a class object.
	 * @param {Object} classObj
	 */
	isClass: function(classObj)
	{
		if (!classObj)
			return false;
		return !!(classObj.superclass || classObj.subclasses);
	},
	/**
	 * Return class object from class name. If this class is not found, null will be returned.
	 * @param {String} className
	 * @returns {Class}
	 */
	findClass: function(className, root)
	{
    /*
		var result;
		var cascadeNames = className.split('.');
    if (!root)
		  var root = $jsRoot;
		for (var i = 0, l = cascadeNames.length; i < l; ++i)
		{
			result = root[cascadeNames[i]];
			if (!result)
				break;
			else
				root = result;
		}
		return result;
		*/
		return Object.getCascadeFieldValue(className, root || $jsRoot);
	},
	/**
	 * Get class name of aClass, usually returns CLASS_NAME field of aClass
	 * @returns {String} Class name.
	 */
	getClassName: function(aClass)
	{
		return aClass.prototype.CLASS_NAME;
	},
  /**
   * Get last part of class name of this class.
   * For example, 'Atom' will be returned by class 'Kekule.Atom'.
   * @return {String} Last part of class name of class.
   */
  getClassLocalName: function(aClass)
  {
    var className = ClassEx.getClassName(aClass);
    var pos = className.lastIndexOf('.');
    return (pos >= 0)? className.substring(pos + 1): className;
  },
	/**
	 * Get prototype of aClass.
	 * @returns {Object}
	 */
	getPrototype: function(aClass)
	{
		return aClass.prototype;
	},
	/**
	 * Get super class if aClass.
	 * @returns {Object}
	 */
	getSuperClass: function(aClass)
	{
		return aClass.superclass || aClass.constructor.superclass;
	},
	/**
	 * Get prototype of super class.
	 * @return {Object} If there is no super class, null is returned.
	 */
	getSuperClassPrototype: function(aClass)
	{
		if (aClass.superclass)
			return aClass.superclass.prototype;
		else
			return null;
	},
	/**
	 * Returns the class that is the super class of all input classes.
	 * @param {Object} class1
	 * @param {Object} class2
	 * @returns {Object}
	 * @private
	 */
	_getCommonSuperClass2: function(class1, class2)
	{
		var result = class1;
		while (result && (!ClassEx.isOrIsDescendantOf(class2, result)))
		{
			result = ClassEx.getSuperClass(result);
		}
		return result;
	},
	/**
	 * Returns common super class of all objects.
	 * @param {Array} objects
	 * @returns {Class}
	 * @private
	 */
	getCommonSuperClass: function(objects)
	{
		if (!objects || !objects.length)
			return null;
		var result = objects[0].getClass? objects[0].getClass(): null;
		if (!result)
			return null;
		for (var i = 1, l = objects.length; i < l; ++i)
		{
			var classObj = objects[i].getClass? objects[i].getClass(): null;
			if (!classObj)
				return null;
			result = ClassEx._getCommonSuperClass2(result, classObj);
		}
		return result;
	},
	/**
	 * Check if aClass is a descendant of superClass.
	 * @param {Class} aClass
	 * @param {Class} superClass
	 * @returns {Bool}
	 */
	isDescendantOf: function(aClass, superClass)
	{
		var ancestor = ClassEx.getSuperClass(aClass);
		while (ancestor && (ancestor !== superClass))
		{
			ancestor = ClassEx.getSuperClass(ancestor);
		}
		return !!ancestor;
	},
	/**
	 * Check if aClass is or is a descendant of superClass.
	 * @param {Class} aClass
	 * @param {Class} superClass
	 * @returns {Bool}
	 */
	isOrIsDescendantOf: function(aClass, superClass)
	{
		return (aClass === superClass) || ClassEx.isDescendantOf(aClass, superClass);
	},
	/**
	 * Check if aClass is or is a descendant of one memeber of superClasses.
	 * @param {Class} aClass
	 * @param {Array} superClasses
	 * @returns {Bool}
	 */
	isOrIsDescendantOfClasses: function(aClass, superClasses)
	{
		for (var i = 0, l = superClasses.length; i < l; ++i)
		{
			if (ClassEx.isOrIsDescendantOf(aClass, superClasses[i]))
				return true;
		}
		return false;
	},
	/**
	 * Ensure property system of a class is properly initialized.
	 * @private
	 */
	_ensurePropertySystem: function(aClass)  // used internally for create property list
	{
		var proto = ClassEx.getPrototype(aClass);
		if (!proto)
			return;
		if (!proto.hasOwnProperty('properties'))
		{
			// ensure super class's property list is created
			var parent = ClassEx.getSuperClass(aClass);
			if (parent)
				ClassEx._ensurePropertySystem(parent);
			ClassEx._createPropertyList(aClass);
			if (proto.hasOwnProperty('initProperties'))  // prevent call parent initProperties method
				proto.initProperties.apply(proto);
		}
	},
	/** @private */
	_createPropertyList: function(aClass)  // used internal, create property list
	{
		if (!ClassEx.getPrototype(aClass).hasOwnProperty('properties'))
			ClassEx.getPrototype(aClass).properties = new Class.PropList();
	},
	/**
	 * Get own property list of this aClass, excluding inherited properties.
	 * @returns {Class.PropList}
	 */
	getOwnPropList: function(aClass)
	{
		var proto = ClassEx.getPrototype(aClass);
		if (proto)
		{
			proto._initPropertySystem();
			return proto.properties;
		}
		else
			return null;
	},
	/**
	 * Get property list of this aClass, including inherited properties.
   * @param {Class} aClass
	 * @returns {Class.PropList}
	 */
	getAllPropList: function(aClass)
	{
		var result;
		var s = ClassEx.getSuperClassPrototype(aClass);
		if (s)
		{
			result = s.getAllPropList().clone();
			result.appendList(ClassEx.getOwnPropList(aClass));
		}
		else
			result = ClassEx.getOwnPropList(aClass);
		return result;
	},
  /**
   * Get list of all properties of certain scopes in this class, including ones inherited from parent class.
   * @param {Class} aClass
   * @param {Array} scopes Array item value from {@link Class.PropertyScope}.
   * @returns {Class.PropList}
   */
  getPropListOfScopes: function(aClass, scopes)
  {
    /*
    var list = ClassEx.getAllPropList(aClass);
    if (!scopes || !scopes.length)
      return list;
    for (var i = list.getLength() - 1; i >= 0; --i)
    {
      var propInfo = list.getPropInfoAt(i);
      var propScope = propInfo.scope || Class.PropertyScope.DEFAULT;
      if (scopes.indexOf(propScope) < 0)  // discard
        list.removePropAt(i);
    }
    return list;
    */
    var findOwnList = function(aClass, scopes)
    {
      var list = ClassEx.getOwnPropList(aClass).clone();
      if (list)
      {
        for (var i = list.getLength() - 1; i >= 0; --i)
        {
          var propInfo = list.getPropInfoAt(i);
          var propScope = propInfo.scope || Class.PropertyScope.DEFAULT;
          if (scopes.indexOf(propScope) < 0)  // discard
            list.removePropAt(i);
        }
      }
      return list;
    };

    var result;
    var s = ClassEx.getSuperClass(aClass);
    if (s)
    {
      result = ClassEx.getPropListOfScopes(s, scopes).clone();
      result.appendList(findOwnList(aClass, scopes));
    }
    else
      result = findOwnList(aClass, scopes);
    return result;
  },

	/**
	 *  Define a property in aClass.
	 *  @param {Object} aClass Class object.
	 *  @param {String} propName Name of property, case sensitive.
	 *  @param {Object} options A hash object, may contains the following fields:
	 *  {
	 *  	dataType: type of property data
	 *  	storeField: field in object to store property value,
	 *  	getter: getter function,
	 *  	setter: setter function, if set to null, the property will be read-only,
	 *  	serializable: boolean, whether the property should be save or restore in serialization,
	 *  	defaultValue: default value of property, can only be simple type (number, string, bool...)
	 *  }
	 *  @return {Object} Property info object added to property list.
	 */
  defineProp: function(aClass, propName, options)
  {
		ClassEx._ensurePropertySystem(aClass);
		return ClassEx.getPrototype(aClass).defineProp(propName, options);
  },
  /**
	 *  Define a set of properties in aClass.
	 *  @param {Object} aClass Class object.
	 *  @param {Array} propDefItems An array of property define info. Each item may contains the following fields:
	 *  {
	 * 		name: name of property.
	 *  	dataType: type of property data
	 *  	storeField: field in object to store property value,
	 *  	getter: getter function,
	 *  	setter: setter function, if set to null, the property will be read-only,
	 *  	serializable: boolean, whether the property should be save or restore in serialization,
	 *  	defaultValue: default value of property, can only be simple type (number, string, bool...)
	 *  }
	 *  @return {Object} Property info object added to property list.
	 */
  defineProps: function(aClass, propDefItems)
  {
  	ClassEx._ensurePropertySystem(aClass);
  	var proto = ClassEx.getPrototype(aClass);
  	for (var i = 0, l = propDefItems.length; i < l; ++i)
  	{
  		var item = propDefItems[i];
  		var propName = item.name;
  		var options = item;
  		proto.defineProp(propName, options);
  	}
  },
  /**
   * Get property info object from the property list of aClass.
   * @param {String} propName Name of property.
   * @return {Object} Property info object found. If there is no such a property, null is returned.
   */
  getPropInfo: function(aClass, propName)
  {
  	return ClassEx.getPrototype(aClass).getPropInfo(propName);
  },
  /**
   * Define an event in aClass. Event is actually a special property with type {@link Class.EventHandlerList}
   * @param {String} eventName Name of event.
   * @return {Object} Property info object created.
   */
  defineEvent: function(aClass, eventName)
  {
  	return ClassEx.getPrototype(aClass).defineEvent(eventName);
  },
	/**
	 * Get a used method name in object/class
	 * @private
	 */
	getUnusedMethodName: function(aClass, baseName, fromIndex)
	{
		var start = fromIndex || 0;
		var i = start;
		var p = ClassEx.getPrototype(aClass);
		var name = baseName + Number(i).toString();
		while (p[name])
		{
			++i;
			name = baseName + Number(i).toString();
		}
		return name;
	},
	/**
	 * Extend a class method. New method defined in method param will replace the old one,
	 * while the old one can be called in first input parameter (usually named $origin) inside new method.
	 * However, $super can not be called in new method body.
	 * For example:
	 *   ClassEx.extend(SomeClass, 'setValue', function($origin, value)
	 *     {
	 *       return $origin(value);
	 *     }
	 *   );
	 * @param {Class} aClass
	 * @param {String} methodName
	 * @param {Function} method
	 */
	extendMethod: function(aClass, methodName, method)
	{
		var proto = ClassEx.getPrototype(aClass);
		var originMethod = proto[methodName];
		var newName = ClassEx.getUnusedMethodName(aClass, '__$changed$_' + methodName + '__');
		proto[newName] = originMethod;

		/** @ignore */
		var value = (function(m) {
			return function() {
				return proto[m].apply(this, arguments);
			};
		})(newName).wrap(method);

		proto[methodName] = value;

		value.valueOf = method.valueOf.bind(method);
		value.toString = method.toString.bind(method);
	},
	/**
	 * Extend class with a pack of methods.
	 * If method already in original class, you may use $origin to mark the original one.
	 * For exmaple:
	 *   ClassEx.extend(SomeClass, {
	 *     initialize: function($origin)
	 *   	 {
	 *       $origin();
	 *       // do something more...
	 *     }
	 *   });
	 * @param {Class} aClass
	 * @param {Hash} extension A pack of methods extended.
	 */
	extend: function(aClass, extension)
	{
		var proto = ClassEx.getPrototype(aClass);
		var ancestor = ClassEx.getSuperClassPrototype(aClass);  // proto.superclass && proto.superclass.prototype;
		var properties = Object.keys(extension);

		if (!Object.keys({ toString: true }).length)
			properties.push("toString", "valueOf");

		for (var i = 0, length = properties.length; i < length; i++)
		{
		    var property = properties[i], value = extension[property];
				if (typeof(value) == 'function')
				{
					//var args = value.argumentNames();
					var args = FunctionUtils.argumentNames(value);
					var first = args.first();

					if (first == '$origin')
					{
						var method = value;
						var originMethod = proto[property];
						var newName = ClassEx.getUnusedMethodName(aClass, '__$changed$_' + property + '__');
						proto[newName] = originMethod;

						/** @ignore */
		        value = (function(m) {
		            return function() {
									return proto[m].apply(/*proto*/this, arguments);
								};
		        })(newName).wrap(method);

						value.valueOf = method.valueOf.bind(method);
	        	value.toString = method.toString.bind(method);

						args.shift();
						first = args.first();
					}

					if (first == '$super')
					{
						var method = value;

						/** @ignore */
		        value = (function(m) {
		            return function() { return ancestor[m].apply(/*proto*/this, arguments); };
		        })(property).wrap(method);

		        value.valueOf = method.valueOf.bind(method);
		        value.toString = method.toString.bind(method);
					}
				}

		    proto[property] = value;
		}
		return aClass;
	}
};

var
/**
 * @class ObjectEx
 * @description Base class for property support.
 *
 * //@property {Bool} enablePropValueGetEvent Whether propValueGet event should
 * //  be fired when a property value is read.
 * @property {Bool} enablePropValueSetEvent Whether propValueSet event should
 *   be fired when a property value is written.
 * @property {Bool} bubbleEvent Whether event evoked can be relayed to higher level object.
 * @property {Bool} suppressChildChangeEventInUpdating If this property is true, when object is updating
 *   (calling obj.beginUpdate()), received "change" event will always not be bubbled. Instead, when updating
 *   finished (calling obj.endUpdate()), a "change" event of self (not child object) will be triggered with special
 *   property name '[chilren]'.
 */
/*
 * Invoked when a property value is gotten by its getter.
 *   event param of it has two fields: {propName, propValue}
 *   If property enablePropValueGottenEvent is false, this event will never be fired.
 * @name ObjectEx#propValueGet
 * @event
 * @deprecated
 * @not usable now
 */
/**
 * Invoked when a property value is set by its setter
 *   event param of it has two fields: {propName, propValue}
 *   If property enablePropValueSetEvent is false, this event will never be fired.
 * @name ObjectEx#propValueSet
 * @event
 */
/**
 * Invoked when the object has been modified.
 *   event param of it has one fields: {changedPropNames: Array}
 * @name ObjectEx#change
 * @event
 */
/**
 * Invoked when {@link ObjectEx#finalize} is called and the object is released.
 *   event param of it has one fields: {obj}
 * @name ObjectEx#finalize
 * @event
 */
ObjectEx = Class.create(
/** @lends ObjectEx# */
{
	/**
	 * name of class
	 * @private
	 */
	CLASS_NAME: 'ObjectEx',
	//* @private */
	//PROPINFO_HASHKEY_PREFIX: '__$propInfo__',
	/**
	 * @constructs
	 */
	initialize: function()
	{
		this._initPropertySystem();
		this.initPropValues();
		this._updateStatus = 0;  // used internal in begin/endUpdate methods
    this._childChangeEventSuppressed = false;
		this._modifiedProps = [];  // used internal in begin/endUpdate methods
		this._finalized = false;  // used internally, mark if the object has been freed
		this.afterInitialization();
	},
	/**
	 * Do jobs after initialization, desendants can override this method
	 */
	afterInitialization: function()
	{
		// do nothing here
	},
	/**
	 *  Free resources used. Like finalize method in Java.
	 */
	finalize: function()
	{
		if (!this._finalized)  // avoid call finalize multiple times on one object
		{
			this.doFinalize();
			this.invokeEvent('finalize', {'obj': this});
      // free all event objects
      this.setPropStoreFieldValue('eventHandlers', null);
			this._finalized = true;
		}
	},
	/**
	 *  Do actual work of finalize.
	 *  @private
	 */
	doFinalize: function()
	{
		// do nothing here
	},
	/**
	 * Define all essential properties in this method.
	 * You do not need to call $super here in descendant classes. Each class only need to
	 * declare his own properties.
	 */
	initProperties: function()
	{
		// define properties
		this.defineProp('enablePropValueGetEvent', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('enablePropValueSetEvent', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		this.defineProp('bubbleEvent', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
    this.defineProp('suppressChildChangeEventInUpdating', {'dataType': DataType.BOOL, 'serializable': false, 'scope': Class.PropertyScope.PUBLIC});
		// private, event storer
		this.defineProp('eventHandlers', {'dataType': DataType.HASH, 'serializable': false, 'scope': Class.PropertyScope.PRIVATE,
			'getter': function()
				{
					var r = this.getPropStoreFieldValue('eventHandlers');
					if (!r)
					{
						r = {};
						this.setPropStoreFieldValue('eventHandlers', r);
					}
					return r;
				}
		});
		/*
		// define two events that related with properties
		this.defineEvent('propValueGet');
		this.defineEvent('propValueSet');
		this.defineEvent('change');
		*/
	},
	/**
	 * Set initial value of properties.
   * Desendants can override this method.
	 */
	initPropValues: function()
	{
		// do nothing here
	},

	/**
	 * Get object level above this one.
	 * @private
	 */
	getHigherLevelObj: function()
	{
		return null;
	},

	/**
	 * Called after this object is saved through a serialization system. Descendants may override this.
	 */
	saved: function()
	{
		// do nothing here
	},
	/**
	 * Called after this object is loaded by a serialization system. Descendants may override this.
	 */
	loaded: function()
	{
		// do nothing here
	},

	/** @private */
	_initPropertySystem: function()  // used internally for create property list
	{
		if (!this.getPrototype().hasOwnProperty('properties'))
		{
			// ensure super class's property list is created
			var parent = this.getSuperClassPrototype();
			if (parent)
				parent._initPropertySystem.apply(parent);
			this._createPropertyList();
			if (this.getPrototype().hasOwnProperty('initProperties'))  // prevent call parent initProperties method
				this.getPrototype().initProperties.apply(this.getPrototype());
		}
	},
	/** @private */
	_createPropertyList: function()  // used internal, create property list
	{
		if (!this.getPrototype().hasOwnProperty('properties'))
			this.getPrototype().properties = new Class.PropList();
	},
	/**
	 * Get class of this object.
	 * @return {Object} Class object.
	 */
	getClass: function()
	{
		return this.constructor;
	},
	/**
	 * Get super class of this object.
	 * @return {Object} Class object.
	 */
	getSuperClass: function()
	{
		return this.getClass().superclass;
	},
	/**
	 * Get class name of this object, usually returns CLASS_NAME field.
	 * @return {String} Class name of object.
	 */
	getClassName: function()
	{
		return this.getPrototype().CLASS_NAME;
	},
  /**
   * Get last part of class name of this object.
   * For example, 'Atom' will be returned by instance of class 'Kekule.Atom'.
   * @return {String} Last part of class name of object.
   */
  getClassLocalName: function()
  {
    return ClassEx.getClassLocalName(this.getClass());
  },
	/**
	 * Returns a name to be used in serialization. Descendants can override this.
	 * @return {String}
	 */
	getSerializationName: function()
  {
    return this.getClassName();
  },
	/**
	 * Get prototype of this object.
	 * @return {Object}
	 */
	getPrototype: function()
	{
		if (this.prototype)
		{
			return this.prototype;
		}
		else
		{
			return this.constructor.prototype;
		}
	},
	/**
	 * Get prototype of super class.
	 * @return {Object} If there is no super class, null is returned.
	 */
	getSuperClassPrototype: function()
	{
		if (this.constructor && this.constructor.superclass)
			return this.constructor.superclass.prototype;
		else
			return null;
	},
	/*
	getPropList: function()
	{
		if (!this.getPrototype().properties)
			this.getPrototype().properties = new PropList();
		return this.getPrototype().properties;
	},
	*/
	/**
	 * Get property list of this class. The properties inherited from parent class will not be returned.
	 * @returns {Class.PropList}
	 */
	getOwnPropList: function()
	{
		this._initPropertySystem();
		return this.getPrototype().properties;
	},
	/**
	 * Get list of all properties in this class, including ones inherited from parent class.
	 * @returns {Class.PropList}
	 */
	getAllPropList: function()
	{
		var result;
		var s = this.getSuperClassPrototype();
		if (s)
		{
			result = s.getAllPropList().clone();
			result.appendList(this.getOwnPropList());
		}
		else
			result = this.getOwnPropList().clone();
		return result;
	},
  /**
   * Get list of all properties of certain scopes in this class, including ones inherited from parent class.
   * @param {Array} scopes Array item from {@link Class.PropertyScope}.
   * @returns {Class.PropList}
   */
  getPropListOfScopes: function(scopes)
  {
    return ClassEx.getPropListOfScopes(this.getClass(), scopes);
  },
	/** @private */
	getPropInfoHashKey: function(propName)
	{
		return ObjectEx._PROPINFO_HASHKEY_PREFIX + propName;
	},
	/** @private */
	getDefPropStoreFieldName: function(propName)
	{
		return ObjectEx._PROP_STOREFIELD_PREFIX + propName;
	},
	/**
	 *  Define a property in class.
	 *  @param {String} propName Name of property, case sensitive.
	 *  @param {Object} options A hash object, may contains the following fields:
	 *  {
	 *  	dataType: type of property data, a string constant in {@link DataType} or a class name.
	 *  	//storeField: field in object to store property value,  // not allowed for running speed
	 *  	getter: getter function,
	 *  	setter: setter function, if set to null, the property will be read-only,
	 *  	serializable: boolean, whether the property should be save or restore in serialization. Default is true.
	 *  	defaultValue: default value of property, can only be simple type (number, string, bool...)
	 *  }
	 *  @return {Object} Property info object added to property list.
	 */
  defineProp: function(propName, options)
  {
		if (!options)
			options = {};
		if (options.serializable === undefined)
			options.serializable = true;
		if (!options.storeField)  // use default store field
			options.storeField = this.getDefPropStoreFieldName(propName); //'f' + propName;
		//options.storeField = this.getDefPropStoreFieldName(propName);
		var list = this.getOwnPropList();
		var prop = list.addProperty(propName, options);
		if (options.getter !== null)
			prop.getter = this.createPropGetter(prop, options.getter);
		if (options.setter !== null)
			prop.setter = this.createPropSetter(prop, options.setter);

		// to accelerate property access, add a hash key here
		this[this.getPropInfoHashKey(propName)] = prop;
		return prop;
  },
  /** @private */
  createPropGetter: function(prop, getter)
  {
  	var propNameBase = prop.name.toString().upperFirst();
  	var getterName = 'get' + propNameBase;
		var doGetterName = 'doGet' + propNameBase;
		var actualGetter = this[doGetterName];
  	if (!actualGetter)
		{
			actualGetter = getter || new Function('return this["' + prop.storeField + '"];');
			this.getPrototype()[doGetterName] = actualGetter; // doGetXXX, descendant can override this method
		}

		/*
  	this.getPrototype()[getterName] = new Function(
			//'var args = Array.prototype.slice(arguments); args.unshift("' + prop.name + '");'
			//+ 'return this.getPropValue.apply(this, args);'
  		'return this.getPropValue("' + prop.name + '");'
  	);
  	*/
		/*
		this.getPrototype()[getterName] = function()
			{
				var args = Array.prototype.slice.call(arguments);
				args.unshift(prop.name);
				return this.getPropValue.apply(this, args);
			};
			*/
		//this.getPrototype()[getterName] = actualGetter;
		this.getPrototype()[getterName] = function()
		{
			var args =arguments; // Array.prototype.slice.call(arguments);
			return this[doGetterName].apply(this, args);
		};

  	return doGetterName; //actualGetter; //this[getterName];
  },
  /** @private */
  createPropSetter: function(prop, setter)
  {
		var propName = prop.name.toString();
  	var propNameBase = propName.upperFirst();
  	var setterName = 'set' + propNameBase;
		var doSetterName = 'doSet' + propNameBase;
  	var actualSetter = this[doSetterName];

		if (!this[doSetterName])
		{
			actualSetter = setter || new Function('value', 'this["' + prop.storeField + '"] = value;');
  		this.getPrototype()[doSetterName] = actualSetter; // doSetXXX, descendant can override this method
		}
  	/*
  	this.getPrototype()[setterName] = new Function('value',
  		'return this.setPropValue("' + prop.name + '", value);'
  	);
  	*/
		this.getPrototype()[setterName] = function()
			{
				var args = Array.prototype.slice.call(arguments);
				var value = args[0];

				/*
				args.unshift(prop.name);
				return this.setPropValueX.apply(this, args);
				*/
				this[doSetterName].apply(this, args);
				this.notifyPropSet(propName, value);
				/*
				// NOTE: here we call actualSetter directly instead of call setPropValue
				// because the former can pass multiple args inside
				actualSetter.apply(this, args);
				this.notifyPropSet(propName, value);
				*/

				return this;
			};

  	//this.getPrototype()[setterName] = actualSetter;
  	return doSetterName; // actualSetter; //this[setterName];
  },
  /**
   * Check if property exists in current class.
   * @param {String} propName Name of property.
   * @return {Boolean}
   */
  hasProperty: function(propName)
  {
  	return (this.getPropInfo(propName) != null);
  },
  /**
   * Get property info object from the property list of current class.
   * @param {String} propName Name of property.
   * @return {Object} Property info object found. If there is no such a property, null is returned.
   */
  getPropInfo: function(propName)
  {
		var pname = propName || '';
		var hashKey = this.getPropInfoHashKey(pname) || '';
		var result = this[hashKey];

		if (!result)
		{
			result = this.getOwnPropList().getPropInfo(pname);
			if (!result)  // check parent
			{
				var parent = this.getSuperClassPrototype();
				if (parent && parent.getPropInfo)
					result = parent.getPropInfo(pname);
				else
					result = null;
			}

			/* need further test
			// to accelerate property access, add a hash key here
			this[this.getPropInfoHashKey(propName)] = result;
			*/
		}
		return result;
  },
	/**
	 * Returns type constants of property.
	 * @param {String} propName
	 * @returns {String} Values from {@link DataType}.
	 */
	getPropertyDataType: function(propName)
	{
		var info = this.getPropInfo(propName);
		return info? info.dataType: null;
	},
	/**
	 * Returns if property is serializable.
	 * @param {String} propName
	 * @returns {Bool}
	 */
	isPropertySerializable: function(propName)
	{
		var info = this.getPropInfo(propName);
		var s = info && info.serializable;
		return (s === undefined) || (!!s);
	},
  /**
   * Get value of a property's store field. Use this method to get property value and avoid
   * the call of property getter.
   * Note: if the property has no store field, this method may returns null or undefined.
   * @param {String} propName Name of property.
   * @return {Variant} Value of property. If property does not exists, null is returned.
   */
  getPropStoreFieldValue: function(propName)
  {
  	var info = this.getPropInfo(propName);
  	if (info.storeField)
  		return this[info.storeField];
  	else
  		return undefined;
  	/*
		var storeFieldName = this.getDefPropStoreFieldName(propName);
		return this[storeFieldName];
		*/
  },
  /**
   * Get value of a property.
   * @param {String} propName Name of property.
   * @return {Variant} Value of property. If property does not exists, null is returned.
   */
  getPropValue: function(propName)
  {
  	var result;
  	var info = this.getPropInfo(propName);
  	if (info)
  	{
	  	if (info.getter) // getter set
			{
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				//result = info.getter.apply(this);
				result = this[info.getter].apply(this, args);
			}
			else
				result = this[info.storeField];
	  	//this.notifyPropGet(propName, result);
	  	return result;
  	}
  	else
  		return null;
  },
	/**
   * Returns values of a series of properties.
   * @param {Variant} propNames Can be an array of property names, also can be an object while the
   *   direct field names of object will be regarded as property names.
   * @returns {Hash} Stores all property name-value pair.
   */
  getPropValues: function(propNames)
  {
    var result = {};
    var names;
    if (DataType.isArrayValue(propNames))
    {
      for (var i = 0, l = propNames.length; i < l; ++i)
      {
        var pname = propNames[i];
        result[pname] = this.getPropValue(pname);
      }
    }
    else if (DataType.isObjectValue(propNames))
    {
      for (var pname in propNames)
      {
        if (propNames.hasOwnProperty(pname) && typeof(obj[pname]) !== 'function')
          result[pname] = this.getPropValue(pname);
      }
    }
    return result;
  },
  /**
   * Set value of a property's store field. Use this method to set property value and avoid
   * the call of property setter. Readonly property can also be changed in this method.
   * Note: if the property has no store field, this method will has no effect on property.
   * @param {String} propName Name of property.
   * @return {Variant} Value of property. If property does not exists, null is returned.
   */
  setPropStoreFieldValue: function(propName, value)
  {
		var pname;
  	var info = this.getPropInfo(propName);
  	if (info.storeField)
  		this[info.storeField] = value;
  },
  /**
   * Set value of a property.
   * @param {String} propName Name of property.
   * @param {Variant} value Value of the property.
   * @param {bool} ignoreReadOnly Try set the value directly through store field
   *   even if the property is a readonly one (without a setter).
   */
  setPropValue: function(propName, value, ignoreReadOnly)  // if ignoreReadOnly, a property without setter will still be set value
  {
  	var info = this.getPropInfo(propName);
  	if (info)
  	{
	  	if (info.setter)  // getter set
	  		//info.setter.apply(this, [value]);
				this[info.setter].apply(this, [value]);
	  	else if (ignoreReadOnly)
	  		this[info.storeField] = value;
			this.notifyPropSet(propName, value);
  	}
		return this;  // return this object for linkage call
  },
	/**
	 * Set value of a property. Similar to {@link ObjectEx.setPropValue} but can pass in multiple params.
	 * The first param is always the property name while the rest will be put into setter method (setXXX).
	 */
	setPropValueX: function()
	{
		var args = Array.prototype.slice.call(arguments);
		var propName = args.shift();
		var info = this.getPropInfo(propName);
		if (info)
		{
			if (info.setter)  // getter set
				this[info.setter].apply(this, args);
			this.notifyPropSet(propName, this.getPropValue(propName));
		}
		return this;  // return this object for linkage call
	},

	/**
	 * Set a series of property.
	 * @param {Hash} hash A hash object, its key and values will be used to set property value.
	 * @param {bool} ignoreReadOnly Try set the value directly through store field
	 *   even if the property is a readonly one (without a setter).
	 */
	setPropValues: function(hash, ignoreReadOnly)
	{
		for (var propName in hash)
		{
			if (hash.hasOwnProperty(propName)/* && (typeof(hash[propName]) != 'function')*/)
			{
				if (this.hasProperty(propName))
				{
					var propValue = hash[propName];
					this.setPropValue(propName, propValue, ignoreReadOnly);
				}
			}
		}
		return this;
	},

  /** @private */
  _isPropGetOrSetEvent: function(propName)
  {
  	return (propName == 'propValueGet') || (propName == 'propValueSet');
  },
  /*
   * Notify that a property value is get
   * @param {String} propName Name of property.
   * @param {Variant} value Value of the property.
	 * // Time consuming and has little use, not appliable now.
   */
	/*
  notifyPropGet: function(propName, value)
  {
  	if (this._isPropGetOrSetEvent(propName) || this.isEventPropName(propName))
  		return;
  	//if (this.getEnablePropValueGetEvent())  // cause recursion
  	if (this.getPropStoreFieldValue('enablePropValueGetEvent'))
  		this.invokeEvent('propValueGet', {'propName': propName, 'propValue': value});
  },
  */
  /**
   * Notify that a property value is set
   * @param {String} propName Name of property.
   * @param {Variant} newValue New value of the property.
   */
  notifyPropSet: function(propName, newValue, doNotEvokeObjChange)
  {
		if (this.isUpdating())  // in update state, just queue modified property names
		{
			//console.log('updating', this.getClassName(), propName);
			if (this._modifiedProps.indexOf(propName) < 0)
				this._modifiedProps.push(propName);
			return;
		}

  	if (this._isPropGetOrSetEvent(propName) || this.isEventPropName(propName))
  		return;

  	/*
  	if (propName == 'enablePropValueSetEvent')
  		return;
  	*/
  	//if (this.getEnablePropValueSetEvent()) // cause recursion

		this.doPropChanged(propName, newValue);
  	if (this.getPropStoreFieldValue('enablePropValueSetEvent'))
  	{
  		this.invokeEvent('propValueSet', {'propName': propName, 'propValue': newValue});
  	}
		if (!doNotEvokeObjChange)
		{
			this.objectChange([propName]);
		}
  },
	/**
	 * Called when object is changed.
	 * @privte
	 */
	objectChange: function(modifiedPropNames)
	{
		this.doObjectChange(modifiedPropNames);
		this.invokeEvent('change', {'changedPropNames': modifiedPropNames});
	},
	/** @private */
	doObjectChange: function(modifiedPropNames)
	{
		// do nothing
	},
	/**
   * Do some job when a property value is changed. Descendants can override this.
   * @param {String} propName Name of property.
   * @param {Variant} newValue New value of the property.
   */
	doPropChanged: function(propName, newValue)
	{
		// do nothing here
	},

  // multi-broadcast support
  /**
   * Define an event in class. Event is actually a special property with type {@link Class.EventHandlerList}
   * @param {String} eventName Name of event.
   * @return {Object} Property info object created.
   * @deprecated
   */
  defineEvent: function(eventName)
  {
  	return;   // do nothing here, as this function is deprecated
  	// event is actually a special property, read only
  	var propName = this.eventNameToPropName(eventName);
  	var result = this.defineProp(propName, {'serializable': false, 'setter': null});
  	/*
  	// set event value as an event handler list
  	var handlers = new EventHandlerList();
  	this.setPropValue(propName, handlers, true);
  	*/
  	// NOTE: should not set value in define stage, otherwise the storeField will be directly inside prototype
  	return result;
  },
  /**
   * @private
   * @deprecated
   */
  eventNameToPropName: function(eventName)
    // turn a event name to a special prop name, to not confused with other properties
  {
  	return '__event_' + eventName;
  },
  /**
   * @private
   * @deprecated
   */
  isEventPropName: function(propName)
  {
  	return ((typeof(propName) == 'string') && (propName.indexOf('__event_') >= 0));
  },
  /*
   * Check if property is a event.
   * @param {String} eventName Name to check.
   * @return {Bool} True or false.
   * @deprecated
   */
  /*
  isEvent: function(eventName)
  {
  	var propName = this.eventNameToPropName(eventName);
  	return this.hasProperty(propName);
  },
  */
  /**
   * Check if a object is {@link Class.EventHandlerList}.
   * @param {Object} value
   * @return {bool} True or false.
   */
  isEventHandlerList: function(value)
  {
  	return (value && (typeof(value) == 'object') && (value instanceof Class.EventHandlerList) /*value.add && value.clear*/);
  },
  /**
   * Get the handler list of a event.
   * @param {String} eventName Name of event.
   * @return {Class.EventHandlerList} Handler list of event. If this event does not exist, null is returned.
   */
  getEventHandlerList: function(eventName)
  {
  	var hs = this.getEventHandlers();
  	var result = hs[eventName];
  	if (!result)
  	{
  		result = new Class.EventHandlerList();
  		hs[eventName] = result;
  	}
  	return result;
  	/*
  	var propName = this.eventNameToPropName(eventName);
  	var result = this.getPropValue(propName);
  	if (!result)  // not set yet
  	{
  		result = new EventHandlerList();
  		this.setPropValue(propName, result, true);
  		//this.setPropFieldValue(propName, result, true);
  	}
  	return result;
  	*/
  },

  /**
   * Add an event handler.
   * @param {String} eventName Name of event.
   * @param {Function} listener Handler function.
   * @param {Object} thisArg The scope object applied when the handler is called.
   * @return {Object} Handler info object on success, null on fail.
   */
  addEventListener: function(eventName, listener, thisArg)
    // add a listener function to list
  {
  	var handlerList = this.getEventHandlerList(eventName);
  	if (this.isEventHandlerList(handlerList))
  	{
  		return handlerList.add(listener, thisArg);
  	}
  	else
  		return null;
  },
	/**
	 * Add an event handler that will only be evoked once.
	 * @param {String} eventName Name of event.
	 * @param {Function} listener Handler function.
	 * @param {Object} thisArg The scope object applied when the handler is called.
	 * @return {Object} Handler info object on success, null on fail.
	 */
	addOnceEventListener: function(eventName, listener, thisArg)
	{
		var self = this;
		var wrapper = function(event)
		{
			self.removeEventListener(eventName, wrapper, thisArg);
			listener(event);
		};
		return this.addEventListener(eventName, wrapper, thisArg);
	},
  /**
   * Remove an event handler.
   * @param {String} eventName Name of event.
   * @param {Function} listener Handler function.
   * @param {Object} thisArg The scope object applied when the handler is called.
   *   If not set, all listenr function in list will be removed.
   */
  removeEventListener: function(eventName, listener, thisArg)
  {
  	var handlerList = this.getEventHandlerList(eventName);
  	if (this.isEventHandlerList(handlerList))
  	{
  		return handlerList.remove(listener, thisArg);
  	}
  },
  /**
   * Add an event handler, shortcut for {@link ObjectEx.addEventListener}.
   * @param {String} eventName Name of event.
   * @param {Function} listener Handler function.
   * @param {Object} thisArg The scope object applied when the handler is called.
   * @return {Object} Handler info object on success, null on fail.
   */
  on: function(eventName, listener, thisArg)
  {
    return this.addEventListener(eventName, listener, thisArg);
  },
  /**
   * Add an event handler that will only be evoked once, shortcut for {@link ObjectEx.addOnceEventListener}.
   * @param {String} eventName Name of event.
   * @param {Function} listener Handler function.
   * @param {Object} thisArg The scope object applied when the handler is called.
   * @return {Object} Handler info object on success, null on fail.
   */
  once: function(eventName, listener, thisArg)
  {
    return this.addOnceEventListener(eventName, listener, thisArg);
  },
  /**
   * Remove an event handler, shortcut for (@link ObjectEx.removeEventListener}.
   * @param {String} eventName Name of event.
   * @param {Function} listener Handler function.
   * @param {Object} thisArg The scope object applied when the handler is called.
   *   If not set, all listenr function in list will be removed.
   */
  off: function(eventName, listener, thisArg)
  {
    return this.removeEventListener(eventName, listener, thisArg);
  },
  /**
   * Invoke an event and call all corresponding handlers (listeners).
   * @param {String} eventName Event to be invoked.
   * @param {Object} event A hash object with information about event.
   *   At least should include the following fields:
   *   {
   *     name: name of event,
   *     target: which object invoke this event, generally this object
   *   }
   *   If this parameter is not set, the default value {eventName, this} will be used.
   */
  invokeEvent: function(eventName, event)
  {
  	if (!event)
  		event = {};
  	event.name = eventName;
	  event.target = this;
	  event.stopPropagation = function() { event.cancelBubble = true; };
  	this.dispatchEvent(eventName, event);
  },
  /**
   * Relay event from child of this object.
   * @param {String} eventName Event to be invoked.
   * @param {Object} event A hash object with information about event.
   */
  relayEvent: function(eventName, event)
  {
  	event.currentTarget = this;
    if (eventName === 'change' && this.getSuppressChildChangeEventInUpdating() && this.isUpdating())  // suppress child change event
		{
			//console.log('suppress child change event', this.getClassName(), event.target.getClassName());
      this._childChangeEventSuppressed = true;
		}
    else
  	  this.dispatchEvent(eventName, event);
  },
  /** @private */
  dispatchEvent: function(eventName, event)
  {
  	var handlerList = this.getEventHandlerList(eventName);
  	if (this.isEventHandlerList(handlerList))
  	{
	  	for (var i = 0, l = handlerList.getLength(); i < l; ++i)
	  	{
	  		var handlerInfo = handlerList.getHandlerInfo(i);
	  		if (handlerInfo.handler)
        {
          handlerInfo.handler.apply(handlerInfo.thisArg, [event]);
        }
	  	}
  	}
    else
    {
      //console.log(eventName, this.getClassName(), handlerList._$flag_);
    }
  	var higherObj = this.getHigherLevelObj();
  	if (!event.cancelBubble && this.getBubbleEvent() && higherObj)
  	{
  		if (higherObj.relayEvent)
  			higherObj.relayEvent(eventName, event);
  	}
  },
  /**
   * Stop propagation of event, disallow it to bubble to higher level.
   * @param {Object} event
   */
  stopEventPropagation: function(event)
  {
  	event.cancelBubble = true;
  },

  /**
   * Overwrite method of object instance (rather than prototype) with a new one.
   * @param {String} methodName
   * @param {Func} newMethod New function.
   *   The arguments of function should be same as overwritten one plus a extra leading param stores the old method.
   *   e.g. Overwrite getPropValue method: <br />
   *     var obj = new ObjectEx(); <br />
   *     obj.overwriteMethod('getPropValue', function($old, propName) <br />
   *       { <br />
   *         console.log('new method');
   *         return $old(propName);
   *       });
   * @returns {ObjectEx}
   */
  overwriteMethod: function(methodName, newMethod)
  {
    var self = this;
    var oldMethod = this[methodName];
    this[methodName] = function _delegator_()
    {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(oldMethod.bind(self));
      return newMethod.apply(self, args);
    };
    return this;
  },

	// clone and assign services
	/**
	 * Assign data in srcObj to this object.
	 * @param {ObjectEx} srcObj
	 */
	assign: function(srcObj)
	{
		return srcObj.assignTo(this);
	},
	/**
	 * Assign data in this object to targetObj.
	 * @param {ObjectEx} targetObj
	 */
	assignTo: function(targetObj)
	{
		var jsonObj = {};
		this.saveObj(jsonObj, 'json');
		targetObj.loadObj(jsonObj, 'json');
	},
	/**
	 * Returns a cloned object.
	 * @returns {ObjectEx}
	 */
	clone: function()
	{
		var classObj = this.getClass();
		var result = new classObj();
		this.assignTo(result);
		return result;
	},

	/**
	 * Begin to update multiple properties of object. In update state, all changed properties
	 *   will not invoke propertySet event until method endUpdate is called.
	 */
	beginUpdate: function()
	{
		++this._updateStatus;
	},
	/**
	 * Update end and notify all properties changed after calling of beginUpdate.
	 */
	endUpdate: function()
	{
		--this._updateStatus;
		this.checkUpdateStatus();
		if (!this.isUpdating())  // update end, notify changed properties
		{
			var modifiedProps = this._modifiedProps || [];
			this._modifiedProps = [];
      if (this._childChangeEventSuppressed)
        modifiedProps.push('[children]');  // TODO: special propName, indicating children has been changed
      this.doEndUpdate(modifiedProps);
      this._childChangeEventSuppressed = false;
		}
	},
	/**
	 * Actual work of endUpdate, just invoke all property change events.
	 */
	doEndUpdate: function(modifiedPropNames)
	{
		if (modifiedPropNames.length)
		{
			if (this.getPropStoreFieldValue('enablePropValueSetEvent'))
			{
				for (var i = 0, l = modifiedPropNames.length; i < l; ++i)
				{
					var propName = modifiedPropNames[i];
					var propValue = this.getPropValue(propName);
					this.notifyPropSet(propName, propValue, true);
				}
			}
			/*this.invokeEvent('change after update', modifiedPropNames);*/
			this.objectChange(modifiedPropNames);
		}
	},
	/**
	 * Check if object is in updating state.
	 */
	isUpdating: function()
	{
		return this._updateStatus > 0;
	},
	/**
	 * Check whether property is changed in begin/endUpdate procedure.
	 * @param {Object} propName
	 */
	isPropUpdated: function(propName)
	{
		return (this._modifiedProps.indexOf(propName) >= 0);
	},
	/** @private */
	checkUpdateStatus: function()
	{
		if (this._updateStatus <= 0)
		{
			this._updateStatus = 0;
		}
	},

	// Copy & clone services
	/**
	 * Copy property values to dest object. Dest must be a desendant of {@link ObjectEx}.
	 * @param {ObjectEx} dest
	 */
	copyPropsTo: function(dest)
	{
		var props = this.getAllPropList();
		for (var i = 0, l = props.getLength(); i < l; ++i)
		{
			var propName = props.getPropInfoAt(i).name;
			// check if propName exists in dest
			if (dest.hasProperty(propName))
			{
				var propValue = this.getPropValue(propName);
				dest.setPropValue(propName, propValue, true);
			}
		}
	}
});
/** @private */
ObjectEx._PROPINFO_HASHKEY_PREFIX = '__$propInfo__';
ObjectEx._PROP_STOREFIELD_PREFIX = '__$';

// Export to root name space
$jsRoot.Class = Class;
$jsRoot.ClassEx = ClassEx;
$jsRoot.ObjectEx = ObjectEx;
$jsRoot.DataType = DataType;
DataType.StringUtils = StringUtils;

})(this);

