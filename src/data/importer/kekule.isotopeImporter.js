/**
 * @fileoverview
 * Import isotopes.xml data from CDK library.
 * @author Partridge Jiang
 */

/*
 *  requires /lan/xmlJsons.js
 *  requires /utils/kekule.utils.js
 *  requires /data/kekule/dataUtils.js
 */

if (!window.Kekule)
	Kekule = {};

/**
 *  An class with static methods to load content of isotopes.xml from CDK
 *  and save data into a JSON text.
 *  @class Kekule.IsotopesImporter
 */
Kekule.IsotopesImporter = {
	/**
	 *  Load isotopes.xml string.
	 *  @param {String} data The source xml string.
	 *  @param {Object} options A hash object to set options of importing. Can include the following fields:
	 *  	{
	 *  		includeElems: {Array} an array to hold element symbols, only isotopes of those elements need to be imported
	 *  	}
	 *  @returns {Object} A JavaScript object to hold all data.
	 */
	loadXmlData: function(data, options)
	{
		var loadOptions = options || {};
		var importLimitedElements = (!!loadOptions.includeElems);
		var result = [];
		// parse data into a XML document
		var srcDoc = XmlUtility.parse(data);
		// analysis srcDoc
		var isotopeListNodes = srcDoc.getElementsByTagName('isotopeList');
		for (var i = 0, l = isotopeListNodes.length; i < l; ++i)
		{
			var listNode = isotopeListNodes[i];
			var isotopeNodes = listNode.getElementsByTagName('isotope');
			if (isotopeNodes.length <= 0)  // empty list, bypass
				continue;
			var elemId = listNode.getAttribute('id');
			if (importLimitedElements && (loadOptions.includeElems.indexOf(elemId) < 0))
				continue;
			var elementObj = {};
			elementObj.elementSymbol = elemId;
			if (elementObj.elementSymbol)
				elementObj.atomicNumber = Kekule.ChemicalElementsDataUtil.getAtomicNumber(elementObj.elementSymbol);
			elementObj.isotopes = [];
			for (var j = 0, k = isotopeNodes.length; j < k; ++j)
			{
				var obj = {};
				var node = isotopeNodes[j];
				var isoElementSymbol = node.getAttribute('elementType');
				var isotopeId = node.getAttribute('id');
				var massNum = node.getAttribute('number');
				massNum = parseInt(massNum);
				if (isoElementSymbol && isotopeId)
				{
					//obj.atomicNumber = Kekule.ChemicalElementsDataUtil.getAtomicNumber(obj.elementSymbol);
					obj.id = isotopeId;
					obj.massNumber = massNum;
					// analysis children
					var propertyNodes = node.getElementsByTagName('scalar');
					for (var n = 0, m = propertyNodes.length; n < m; ++n)
					{
						var propNode = propertyNodes[n];
						var propName = propNode.getAttribute('dictRef');
						// remove 'bo:' head
						propName = propName.replace('bo:', '');
						var propValue = Kekule.DomUtils.getElementText(propNode);
						if (propName == 'atomicNumber')
							;   // bypass, as we have already got it
						else if (propName == 'relativeAbundance')
							obj.relativeAbundance = parseFloat(propValue) / 100;
						else if (propName == 'exactMass')
						{
							obj.exactMass = parseFloat(propValue);
							var errorValue = propNode.getAttribute('errorValue');
							if (errorValue)
								obj.exactMass.errorValue = parseFloat(errorValue);
						}
						else if (propName == 'halfLife')
							obj.halfLife = parseFloat(propValue);  // in second
						else
							obj[propName] = propValue;
						// append atomic number in each isotope entry
						obj.atomicNumber = elementObj.atomicNumber;
					}
				}
				elementObj.isotopes.push(obj);
			}
			//result.push(elementObj);
			result[elementObj.atomicNumber - 1] = elementObj;
		}
		//console.log(result);
		return result;
	},

	/**
	 *  Save imported JS object to a JSON string.
	 *  @param {Object} obj Imported JavaScript object.
	 *  @returns {String} JSON string.
	 */
	saveObjToStr: function(obj)
	{
		return JsonUtility.serializeToStr(obj);
	},

	import: function(src, options)
	{
		var obj = Kekule.IsotopesImporter.loadXmlData(src, options);
		return Kekule.IsotopesImporter.saveObjToStr(obj);
	}
};