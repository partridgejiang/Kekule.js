var Kekule = require('kekule').Kekule;

var MolDupChecker = {
	calcDupRate(mol1, mol2, coordModes)
	{
		var isSame = mol1 && mol2 && mol1.equalStructure(mol2);
		if (!isSame)
			return 0;

		var compareObjs1 = MolDupChecker._getMolChildObjs(mol1);
		var compareObjs2 = MolDupChecker._getMolChildObjs(mol2);
		var centerCoords1 = [], centerCoords2 = [];
		//var coordModes = [2, 3];
		var coordModes = [2, 3];
		for (var i = 0, l = coordModes.length; i < l; ++i)
		{
			centerCoords1[coordModes[i]] = MolDupChecker._getMolCenterCoord(mol1, coordModes[i]);
			centerCoords2[coordModes[i]] = MolDupChecker._getMolCenterCoord(mol2, coordModes[i]);
		}

		mol1.canonicalize();
		mol2.canonicalize();

		var dupRates = [];
		//for (var i = 0, l = Math.max(mol1.getChildCount(), mol2.getChildCount()); i < l; ++i)
		for (var i = 0, l = Math.max(compareObjs1.length, compareObjs2.length); i < l; ++i)
		{
			//var obj1 = mol1.getChildAt(i);
			//var obj2 = mol2.getChildAt(i);
			var obj1 = compareObjs1[i];
			var obj2 = compareObjs2[i];

			/*
			if (obj1 instanceof Kekule.ChemStructureNode)
			{
				console.log('check ', obj1.getSymbol(), obj2.getSymbol());
			}
			*/
			if (!obj1 || !obj2)
			{
				dupRates.push(0);
				//break;
				continue;
			}
			else
			{
				if (!obj1.equalStructure(obj2))  // node or bond not in same order, no duplication
				{
					dupRates.push(0);
					//break;
					continue;
				}
				else
				{
					if (obj1 instanceof Kekule.ChemStructureNode)
					{
						//console.log(obj1.canonicalizationIndex, obj2.canonicalizationIndex, obj1.getSymbol(), obj2.getSymbol());
						if (obj1.canonicalizationIndex !== obj2.canonicalizationIndex)
						{
							dupRates.push(0);
							//break;
							continue;
						}
						var coordDupRate = 0;
						var coordDupRateCalcCount = 0;
						for (var j = 0, jj = coordModes.length; j < jj; ++j)
						{
							var cmode = coordModes[j];
							var rate = MolDupChecker._calcCoordDupRate(obj1, obj2, centerCoords1[cmode], centerCoords2[cmode], cmode);
							//console.log(i, cmode, rate);
							if (!isNaN(rate))  // not NaN
							{
								coordDupRate += rate;
								++coordDupRateCalcCount;
							}
						}
						if (coordDupRateCalcCount > 0)
							dupRates.push(coordDupRate / coordDupRateCalcCount);
					}
				}
			}
		}
		if (!dupRates.length)
			return 0;
		else
		{
			var result = 0;
			for (var i = 0, l = dupRates.length; i < l; ++i)
			{
				result += dupRates[i];
			}
			return result / dupRates.length;
		}
	},
	_getMolChildObjs(mol)
	{
		var result = [];
		for (var i = 0, l = mol.getChildCount(); i < l; ++i)
		{
			result.push(mol.getChildAt(i));
		}
		return result;
	},
	_getMolCenterCoord(mol, coordMode)
	{
		var coordSum = {};
		var nodeCount = mol.getNodeCount();
		var count = 0;
		for (var i = 0; i < nodeCount; ++i)
		{
			var coord = mol.getNodeAt(i).getCoordOfMode(coordMode);
			if (coord)
			{
				coordSum = Kekule.CoordUtils.add(coord, coordSum);
				++count;
			}
		}
		return Kekule.CoordUtils.divide(coordSum, count);
	},
	_calcCoordDupRate(node1, node2, coordCenter1, coordCenter2, coordMode)
	{
		var coord1 = node1.getCoordOfMode(coordMode) || {};
		var coord2 = node2.getCoordOfMode(coordMode) || {};
		if (coordCenter1 && coordCenter2)
		{
			coord1 = Kekule.CoordUtils.substract(coord1, coordCenter1);
			coord2 = Kekule.CoordUtils.substract(coord2, coordCenter2);
		}
		/*
		var fields = (coordMode === Kekule.CoordMode.COORD3D)? ['x', 'y', 'z']: ['x', 'y'];
		for (var i = 0, l = fields.length; i < l; ++i)
		{

		}
		*/
		var distanceDelta = Kekule.CoordUtils.getDistance(coord1, coord2);
		var length = (Kekule.CoordUtils.getDistance(coord1, null) + Kekule.CoordUtils.getDistance(coord2, null)) / 2;
		var diffRate = distanceDelta / length;

		var result = (diffRate < 1e-6)? 1:
			(diffRate > 0.999999)? 0: (1 - diffRate);
		result = Math.max(result, 0);
		//console.log(coord1, coord2, coordMode, length, diffRate);
		//var result = Math.max(1 - diffRate, 0);
		return result;
	}
}

exports.MolDupChecker = MolDupChecker;