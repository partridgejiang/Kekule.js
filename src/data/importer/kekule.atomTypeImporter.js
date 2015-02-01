/**
 * @fileoverview
 * Import structgen_atomtypes.xml data from CDK library.
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
 *  An class with static methods to load content of structgen_atomtypes.xml from CDK 
 *  and save data into a JSON text.
 *  @class Kekule.AtomTypeImporter
 */
Kekule.AtomTypeImporter = {
	/** 
	 *  Load structgen_atomtypes.xml string.
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
		var atomTypeNodes = srcDoc.getElementsByTagName('atomType');
		for (var i = 0, l = atomTypeNodes.length; i < l; ++i)
		{
			var atomType = {};
			var typeNode = atomTypeNodes[i];
			atomType.id = typeNode.getAttribute('id');
			var atomNodes = typeNode.getElementsByTagName('atom');
			if (atomNodes.length <= 0)
				continue;
			var atomNode = atomNodes[0];
			var elementSymbol = atomNode.getAttribute('elementType');
			var atomicNumber = Kekule.ChemicalElementsDataUtil.getAtomicNumber(elementSymbol);
			
			if (importLimitedElements && (loadOptions.includeElems.indexOf(elementSymbol) < 0))
				continue;
			
			var scalarNodes = atomNode.getElementsByTagName('scalar');
			for (var j = 0, k = scalarNodes.length; j < k; ++j)
			{
				var node = scalarNodes[j];
				var propName = node.getAttribute('dictRef');
				propName = propName.replace('cdk:', '');
				var propValue = Kekule.DomUtils.getElementText(node);
				propValue = parseFloat(propValue);  // all properties is float
				atomType[propName] = propValue;
			}
			
			// insert atomType object to result
			var elementObj = result[atomicNumber - 1];
			if (!elementObj)
			{
				elementObj = {};
				elementObj.elementSymbol = elementSymbol;
				elementObj.atomicNumber = atomicNumber;
				elementObj.atomTypes = [];
				result[atomicNumber - 1] = elementObj;
			}
			elementObj.atomTypes.push(atomType);
		}
		// all atomtypes should be sorted by bondOrderSum then maxBondOrder
		var compareFunc = function(item1, item2)
			{
				var result = item1.bondOrderSum - item2.bondOrderSum;
				if (result === 0)
					result = item1.maxBondOrder - item2.maxBondOrder;
				return result;
			};
		for (var i = 0, l = result.length; i < l; ++i)
		{
			var elemObj = result[i];
			if (elemObj)
			{
				elemObj.atomTypes.sort(compareFunc);
			}
		} 
		return result;
	},
	
	saveObjToStr: function(obj)
	{
		return JsonUtility.serializeToStr(obj/*, {prettyPrint: true}*/);
	},
	
	import: function(src, options)
	{
		var obj = Kekule.AtomTypeImporter.loadXmlData(src, options);
		return Kekule.AtomTypeImporter.saveObjToStr(obj);
	}
}