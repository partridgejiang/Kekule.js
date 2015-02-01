/**
 * @fileoverview
 * Import chemicalElements.xml data from CDK library.
 * @author Partridge Jiang
 */

/*
 *  requires /lan/xmlJsons.js
 *  requires /utils/kekule.utils.js
 *  requires /data/kekule.dataUtils.js
 */

if (!window.Kekule)
	Kekule = {};

/**
 *  An class with static methods to load content of chemicalElements.xml from CDK 
 *  and save data into a JSON text.
 *  @class Kekule.ChemElemImporter
 */
Kekule.ChemElemImporter = {
	/** 
	 *  Load chemicalElements.xml string.
	 *  @param {String} data The source xml string.
	 *  @param {Object} options A hash object to set options of importing. Can include the following fields:
	 *  	{
	 *  		importCasId: {Bool} whether import CAS ID,
	 *  		calcNaturalMass: {Bool} whether calculate natural abundance mass number.
	 *  			Note this can only be calculated when kekule.isotopesData.js exists.
	 *  	}
	 *  @returns {Object} A JavaScript object to hold all data. 
	 */
	loadElemXmlData: function(data, options)
	{
		var ops = options? options: {};
		var result = [];
		// parse data into a XML document
		var srcDoc = XmlUtility.parse(data);
		// analysis srcDoc
		var elemTypeNodes = srcDoc.getElementsByTagName('elementType');
		for (var i = 0, l = elemTypeNodes.length; i < l; ++i)
		{
			var elemTypeNode = elemTypeNodes[i];
			var obj = {};
			obj.symbol = elemTypeNode.getAttribute('id');
			if (obj.symbol === 'R')  // bypass the first Pseudoatom
				continue;
			// analysis attributes
			var children = elemTypeNode.childNodes;
			for (var j = 0, k = children.length; j < k; ++j)
			{
				var child = children[j];
				if (child.nodeType == 1)  // Node.ELEMENT_NODE
				{
					var tagName = child.tagName;
					if ((tagName == 'label') && (child.getAttribute('dictRef') == 'cas:id')) // a CAS-id
					{
						if (!(ops.importCasId === false))  
						{
							var text = Kekule.DomUtils.getElementText(child);
							if (text)
								obj.casId = text; 
						}
					}
					else if (tagName == 'scalar')  // scalar values
					{
						var valueName = child.getAttribute('dictRef');
						// remove 'cdk:' head
						valueName = valueName.replace('cdk:', '');
						var value = Kekule.DomUtils.getElementText(child);
						// check value type
						var valueType = child.getAttribute('dataType');
						if (value !== '')
						{
							if (valueType == 'xsd:Integer')
								value = parseInt(value);
							else  // xsd:String, but some store float values
							{
								var floatValue = parseFloat(value);
								if (floatValue.toString() == value)
									value = floatValue;
								else if ((valueName == 'radiiCova') || (valueName == 'radiiVdw') || (valueName == 'paulingE'))
									value = floatValue;
							}
							obj[valueName] = value; 
						}
					}
				}
			}

			if (ops.calcNaturalMass && Kekule.isotopesData)
			{
				var isotopes = Kekule.IsotopesDataUtil.getAllIsotopeInfos(obj.atomicNumber);
				if (isotopes)
				{
					var totalMass = 0;
					var totalAbundance = 0;
					if (isotopes.length > 1) 
					{
						for (var j = 0, k = isotopes.length; j < k; ++j) 
						{
							var isotope = isotopes[j];
							totalMass += (isotope.exactMass || isotope.massNumber) * (isotope.relativeAbundance || 0);
							totalAbundance += isotope.relativeAbundance || 0;
						}
						if (totalAbundance && totalMass)
							obj.naturalMass = totalMass / totalAbundance;
					}
				}
				else if (isotopes[0])
				{
					var mass = isotopes[0].exactMass || isotopes[0].massNumber;
					if (mass)
						obj.naturalMass = mass;
				}
			}
			
			//result.push(obj);
			result[obj.atomicNumber - 1] = obj;
		}
		return result;
	},
	/**
	 *  Save imported JS object to a JSON string.
	 *  @param {Object} obj Imported JavaScript object.
	 *  @returns {String} JSON string. 
	 */
	saveObjToStr: function(obj)
	{
		return JsonUtility.serializeToStr(obj/*, {'prettyPrint': true}*/);
	},
	
	import: function(src, options)
	{
		var obj = Kekule.ChemElemImporter.loadElemXmlData(src, options);
		return Kekule.ChemElemImporter.saveObjToStr(obj);
	}
}
