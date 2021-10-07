describe('Test of some core data and functions of spectra module', function(){
	it('Kekule.Spectroscopy.Utils test', function(){
		var r1 = {'x': {min: 1, max: 2}};
		var r2 = {'x': {min: 0, max: 1.5}, z: {max: 0, min: -1}};
		var r3 = {'x': {min: 0.5, max: 3}, y: {min: 0, max: 1}};
		expect(Kekule.Spectroscopy.Utils.mergeDataRange(r1, r2)).toEqual({'x': {min: 0, max: 2}, z: {max: 0, min: -1}});
		expect(Kekule.Spectroscopy.Utils.mergeDataRange(r1, r3)).toEqual({'x': {min: 0.5, max: 3}, 'y': {min: 0, max: 1}});
		expect(Kekule.Spectroscopy.Utils.mergeDataRange(r2, r3)).toEqual({'x': {min: 0, max: 3}, 'y': {min: 0, max: 1}, z: {max: 0, min: -1}});
	});

	it('Spectrum.SpectrumData class test', function(){
		var variables = [
			new Kekule.VarDefinition({'symbol': 'x', 'units': 'unitX'}),
			new Kekule.VarDefinition({'symbol': 'y', 'units': 'unitY', 'dependency': Kekule.VarDependency.DEPENDENT}),
			new Kekule.VarDefinition({'symbol': 'z', 'units': 'unitZ', 'dependency': Kekule.VarDependency.DEPENDENT}),
			new Kekule.VarDefinition({'symbol': 'd', 'units': 'unitR', 'dependency': Kekule.VarDependency.DEPENDENT}),
			new Kekule.VarDefinition({'symbol': 'r', 'units': 'unitR', 'dependency': Kekule.VarDependency.DEPENDENT})
		];
		var sData = new Kekule.Spectroscopy.SpectrumData(null, variables);
		sData.setDefaultVarValue('d', 20);

		sData.appendData({x: 1, y: 1, z: 1, r: -1, 'extra1': 'extra1Value0', 'extra2': 'extra2Value0'});
		sData.appendData([3,3,3,null,-3]);
		sData.appendData([2,2,2,null,-2]);
		var raw = [4,4,4,null,-4];
		raw._extra = {};
		raw._extra.extra1 = 'extra1Value3';
		sData.appendData(raw);
		sData.sort();
		sData.setValueAt(5, {x: 6, y: 6, z: 6, r: -6, 'extra1': 'extra1Value5'});
		sData.setValueAt(4, {x: 5, y: 5, z: 5, r: -5, 'extra1': 'extra1Value5'});
		sData.setExtraInfoAt(1, {'extra2': 'extra2Value1'});

		sData.forEach(function(value, index){
			var v = index + 1;
			expect(value.x).toEqual(v);
			expect(value.y).toEqual(v);
			expect(value.z).toEqual(v);
			expect(value.r).toEqual(-v);
			expect(value.d).toEqual(20);
		});

		expect(sData.getValueAt(0)._extra.extra1).toEqual('extra1Value0');
		expect(sData.getValueAt(0)._extra.extra2).toEqual('extra2Value0');
		expect(sData.getRawValueAt(0)._extra.extra1).toEqual('extra1Value0');
		expect(sData.getRawValueAt(0)._extra.extra2).toEqual('extra2Value0');
		expect(sData.getValueAt(3)._extra.extra1).toEqual('extra1Value3');
		expect(sData.getRawValueAt(3)._extra.extra1).toEqual('extra1Value3');
		expect(sData.getValueAt(4)).toEqual({x: 5, y: 5, z: 5, r: -5, d: 20, '_extra': {'extra1': 'extra1Value5'}});
		expect(sData.getValueAt(5)).toEqual({x: 6, y: 6, z: 6, r: -6, d: 20, '_extra': {'extra1': 'extra1Value5'}});
		expect(sData.getExtraInfoAt(1)).toEqual({'extra2': 'extra2Value1'});
	});

	it('Kekule.Spectrum.ContinuousData class test', function(){
		var variables = [
			new Kekule.VarDefinition({'symbol': 'x', 'units': 'unitX'}),
			new Kekule.VarDefinition({'symbol': 'y', 'units': 'unitY', 'dependency': Kekule.VarDependency.DEPENDENT}),
			new Kekule.VarDefinition({'symbol': 'z', 'units': 'unitZ', 'dependency': Kekule.VarDependency.DEPENDENT}),
			new Kekule.VarDefinition({'symbol': 'd', 'units': 'unitR', 'dependency': Kekule.VarDependency.DEPENDENT})
		];
		var sData = new Kekule.Spectroscopy.SpectrumData(null, variables);
		sData.setContinuousVarRange('x', 0, 10);
		sData.setContinuousVarRange('z', 5, 0);
		sData.setDefaultVarValue('d', 10);
		sData.appendData({y: 0});
		sData.appendData({y: 1});
		sData.appendData({y: 2, 'extra': 'extraValue'});
		sData.appendData({y: 3});
		sData.appendData({y: 4});
		sData.appendData({y: 5});

		expect(sData.getHashValueAt(0).x).toEqual(0);
		expect(sData.getHashValueAt(1).x).toEqual(2);
		expect(sData.getHashValueAt(2).x).toEqual(4);
		expect(sData.getHashValueAt(3).x).toEqual(6);
		expect(sData.getHashValueAt(4).x).toEqual(8);
		expect(sData.getHashValueAt(5).x).toEqual(10);

		expect(sData.getHashValueAt(0).z).toEqual(5);
		expect(sData.getHashValueAt(1).z).toEqual(4);
		expect(sData.getHashValueAt(2).z).toEqual(3);
		expect(sData.getHashValueAt(3).z).toEqual(2);
		expect(sData.getHashValueAt(4).z).toEqual(1);
		expect(sData.getHashValueAt(5).z).toEqual(0);

		expect(sData.getHashValueAt(1).d).toEqual(10);
		expect(sData.getHashValueAt(2).d).toEqual(10);
		expect(sData.getHashValueAt(3).d).toEqual(10);

		expect(sData.getExtraInfoAt(2).extra).toEqual('extraValue');
	});

	/*
	it('Kekule.IO.JcampUtils methods test', function(){

	});
	*/

	it('Kekule.IO.JcampLdrValueParser test', function(){
		// note the month param in Date constructor starts from 0
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1913/04/05', ''])).toEqual(new Date(1913, 3, 5));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1913/4/5', ''])).toEqual(new Date(1913, 3, 5));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1998/08/12 23:18:02'])).toEqual(new Date(1998, 7, 12, 23, 18, 2));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1998/08/12 23:18:02.'])).toEqual(new Date(1998, 7, 12, 23, 18, 2));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1998/08/12  23:18:02.0010'])).toEqual(new Date(1998, 7, 12, 23, 18, 2, 10));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['1998/08/12  23:18:02.0010 +0500'])).toEqual(new Date(1998, 7, 12, 23, 18, 2, 10));
		expect(Kekule.IO.Jcamp.LdrValueParser.longDateParser(['98/08/12 23:18:02.0010 +0500'])).toEqual(new Date(98, 7, 12, 23, 18, 2, 10));
	});

	var DT = Kekule.IO.Jcamp.DigitCharType;
	var asdfDecodeTestCases = [
		{'src': '1000 2000  2001, 2002 ;2003 2003 2003', 'value': [1000, 2000, 2001, 2002, 2003, 2003, 2003], 'lastValueType': DT.ASCII},  // ASCII format
		{'src': '1000 2000 ? 2001, ? 2002 ;2003 2003 2003', 'value': [1000, 2000, NaN, 2001, NaN, 2002, 2003, 2003, 2003], 'lastValueType': DT.ASCII},
		{'src': '1000 2000  -2001, +2002 ;2003 2003 -2003', 'value': [1000, 2000, -2001, 2002, 2003, 2003, -2003], 'lastValueType': DT.PAC},
		{'src': '1000.23 2000.7  -2001.4, +2002.2 ;2003.1 2003 -2003', 'value': [1000.23, 2000.7, -2001.4, 2002.2, 2003.1, 2003, -2003], 'lastValueType': DT.PAC},
		{'src': '+1000+2000+2001+2002+2003+2003+2003', 'value': [1000, 2000, 2001, 2002, 2003, 2003, 2003], 'lastValueType': DT.PAC},   // PAC format
		{'src': '+1000+2000-2001+2002+2003+2003-2003', 'value': [1000, 2000, -2001, 2002, 2003, 2003, -2003], 'lastValueType': DT.PAC},
		{'src': 'A000B000B001B002B003B003B003', 'value': [1000, 2000, 2001, 2002, 2003, 2003, 2003], 'lastValueType': DT.SQZ},   // SQZ format
		{'src': 'A000B000b001B002B003B003b003', 'value': [1000, 2000, -2001, 2002, 2003, 2003, -2003], 'lastValueType': DT.SQZ},
		{'src': '10B0C0C0B0A0@abc', 'value': [10 , 20 , 30 , 30 ,	20 , 10 , 0 , -1 , -2 , -3], 'lastValueType': DT.SQZ},
		{'src': 'A000J000JJJ%%', 'value': [1000, 2000, 2001, 2002, 2003, 2003, 2003], 'lastValueType': DT.DIF},   // DIF format
		{'src': '10J0J0%j0j0j0jjj', 'value': [10 , 20 , 30 , 30 ,	20 , 10 , 0 , -1 , -2 , -3], 'lastValueType': DT.DIF},
		{'src': '50U', 'value': [50, 50, 50], 'lastValueType': DT.ASCII},   // DUP format
		{'src': '50%U', 'value': [50, 50, 50, 50], 'lastValueType': DT.DIF},
		{'src': 'A000J000TJ%%', 'value': [1000, 2000, 3000, 3001, 3001, 3001], 'lastValueType': DT.DIF},
		{'src': '608.3 A000J000TJ%%', 'value': [608.3, 1000, 2000, 3000, 3001, 3001, 3001], 'lastValueType': DT.DIF},
		{'src': '608.3? A000J000TJ%%?', 'value': [608.3, NaN, 1000, 2000, 3000, 3001, 3001, 3001, NaN], 'lastValueType': DT._ABNORMAL_VALUE},
		{'src': '10J0T%j0UjU', 'value': [10 , 20 , 30 , 30 ,	20 , 10 , 0 , -1 , -2 , -3], 'lastValueType': DT.DIF},
		{'src': '-121.7 78 +35.5 10J0T%j0UjU', 'value': [-121.7, 78, +35.5, 10 , 20 , 30 , 30 ,	20 , 10 , 0 , -1 , -2 , -3], 'lastValueType': DT.DIF},
		{'src': '.12 -.23 30.T 10J0T%j0UjU', 'value': [0.12, -0.23, 30, 30, 10 , 20 , 30 , 30 ,	20 , 10 , 0 , -1 , -2 , -3], 'lastValueType': DT.DIF},
		// complex
		{
			//'src': '@VKT%TLkj%J%KLJ%njKjL%kL%jJULJ%kLKl%lLMNPNPRLJOQTOJ1P',
			'src': '@VKT%TLkj%J%KLJ%njKjL%kL%jJULJ%kLK1%lLMNPNPRLJ0QTOJ1P',
			'value': [0, 0, 0, 0, 2, 4, 4, 4, 7, 5, 4, 4, 5, 5, 7, 10, 11, 11, 6, 5, 7, 6, 9, 9, 7, 10, 10, 9, 10, 11, 12, 15, 16, 16, 14, 17, 38, 38, 35, 38, 42, 47, 54, 59, 66, 75, 78, 88, 96, 104, 110, 121, 128],
			'lastValueType': DT.DIF
		}
	];

	var asdfDecodeItemCompareFunc = function(i1, i2)
	{
		if (isNaN(i1) && isNaN(i2))
			return 0;
		else if (i1 === undefined && i2 === undefined)
			return 0;
		else
			return (Kekule.NumUtils.isFloatEqual(i1, i2))? 0:
				(i1 < i2)? -1: 1;
	}

	for (var i = 0, l = asdfDecodeTestCases.length; i < l; ++i)
	{
		var testCase = asdfDecodeTestCases[i];
		(function _test(testCase)
		{
			it('Kekule.IO.JcampUtils ASDF decode test: ' + testCase.src, function () {
				var decodeValue = Kekule.IO.Jcamp.Utils.decodeAsdfLine(testCase.src);
				//console.log('expect to equal ', i, decodeValue, testCase.value, decodeValue.__$lastValueType__);
				expect(Kekule.ArrayUtils.compare(decodeValue, testCase.value, asdfDecodeItemCompareFunc) === 0).toEqual(true);
				expect(decodeValue.__$lastValueType__).toEqual(testCase.lastValueType);
			});
		})(testCase);
	}

	var affnGroupDecodeTestCases = [
		{src: '1 , 2 ; 3,4', 'value': [[1,2], [3,4]]},
		{src: '1 , 2 ;, ; 3,4', 'value': [[1,2], [undefined, undefined], [3,4]]},
		{src: '50, 2.52; 51, 9.32; 52, 7.42; 53, 1.30; 54, 5.46; 61, 4.07', 'value': [[50, 2.52], [51, 9.32], [52, 7.42], [53, 1.30], [54, 5.46], [61, 4.07]]},
		{src: '68, 1.22  77, 1.89; 79, 1.63  93, 2.13; 94, 100.00; 95, 8.09', 'value': [[68, 1.22], [77, 1.89], [79, 1.63], [93, 2.13], [94, 100.00], [95, 8.09]]},
		{src: '1 , 2 ; 3,4 astring,bstring', 'value': [[1,2], [3,4], ['astring', 'bstring']]},
		{src: '27.00, 1.0,, < 7>', 'value': [[27, 1, undefined, ' 7']]},
		{src: '125.70, 1.0,, <17>; 2, < 6>,3', 'value': [[125.7, 1, undefined, '17'], [2, ' 6',3]]},
		{src: '125.70, 1.0,, <17 6,5 >; 2, < 6;1>,3', 'value': [[125.7, 1, undefined, '17 6,5 '], [2, ' 6;1',3]]},
		{src: ' (27.00, 1.0,, < 7>)  ', 'value': [[27, 1, undefined, ' 7']]},
	];
	var affnGroupDecodeItemCompareFunc = function(i1, i2)
	{
		var result = Kekule.ArrayUtils.compare(i1, i2, asdfDecodeItemCompareFunc);
		//console.log('compare in array', i1, i2, result);
		return result;
	}
	for (var i = 0, l = affnGroupDecodeTestCases.length; i < l; ++i)
	{
		var testCase = affnGroupDecodeTestCases[i];
		(function _test(testCase){
			it('Kekule.IO.JcampUtils AFFN group decode test: ' + testCase.src, function(){
				var decodeValue = Kekule.IO.Jcamp.Utils.decodeAffnGroupLine(testCase.src);
				//console.log('expect to equal ', i, decodeValue, testCase.value);
				var compareResult = Kekule.ArrayUtils.compare(decodeValue, testCase.value, affnGroupDecodeItemCompareFunc);
				//console.log('expect to equal ', i, decodeValue, testCase.value, compareResult);
				expect(compareResult === 0).toEqual(true);
			});
		})(testCase);
	}
});