describe('Test of some core data and functions of spectra module', function(){
	it('Spectrum.SpectrumData class test', function(){
		var variables = [
			new Kekule.VarDefinition('x', 'unitX', null),
			new Kekule.VarDefinition('y', 'unitY', Kekule.VarDependency.DEPENDENT),
			new Kekule.VarDefinition('z', 'unitZ', Kekule.VarDependency.DEPENDENT),
			new Kekule.VarDefinition('r', 'unitR', Kekule.VarDependency.DEPENDENT)
		];
		var sData = new Kekule.Spectrum.SpectrumData(null, variables);

		sData.append({x: 1, y: 1, z: 1, r: -1});
		sData.append([3,3,3,-3]);
		sData.append([2,2,2,-2]);
		sData.sort();

		sData.forEach(function(value, index){
			var v = index + 1;
			expect(value.x).toEqual(v);
			expect(value.y).toEqual(v);
			expect(value.z).toEqual(v);
			expect(value.r).toEqual(-v);
		});
	});

	it('Kekule.Spectrum.ContinuousData class test', function(){
		var variables = [
			new Kekule.VarDefinition('x', 'unitX', null),
			new Kekule.VarDefinition('y', 'unitY', Kekule.VarDependency.DEPENDENT),
			new Kekule.VarDefinition('z', 'unitZ', Kekule.VarDependency.DEPENDENT)
		];
		var sData = new Kekule.Spectrum.ContinuousData(null, variables);
		sData.setVarRange('x', 0, 10);
		sData.setVarRange('z', 5, 0);
		sData.append({y: 0});
		sData.append({y: 1});
		sData.append({y: 2});
		sData.append({y: 3});
		sData.append({y: 4});
		sData.append({y: 5});

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
	});

	/*
	it('Kekule.IO.JcampUtils methods test', function(){

	});
	*/

	it('Kekule.IO.JcampLdrValueParser test', function(){
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1913/04/05', ''])).toEqual(new Date(1913, 4, 5));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1913/4/5', ''])).toEqual(new Date(1913, 4, 5));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1998/08/12 23:18:02'])).toEqual(new Date(1998, 8, 12, 23, 18, 2));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1998/08/12 23:18:02.'])).toEqual(new Date(1998, 8, 12, 23, 18, 2));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1998/08/12  23:18:02.0010'])).toEqual(new Date(1998, 8, 12, 23, 18, 2, 10));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['1998/08/12  23:18:02.0010 +0500'])).toEqual(new Date(1998, 8, 12, 23, 18, 2, 10));
		expect(Kekule.IO.JcampLdrValueParser.longDateParser(['98/08/12 23:18:02.0010 +0500'])).toEqual(new Date(98, 8, 12, 23, 18, 2, 10));
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
		else
			return (Kekule.NumUtils.isFloatEqual(i1, i2, 1e-6))? 0:
				(i1 < i2)? -1: 1;
	}

	for (var i = 0, l = asdfDecodeTestCases.length; i < l; ++i)
	{
		var testCase = asdfDecodeTestCases[i];
		(function _test(testCase)
		{
			it('Kekule.IO.JcampUtils ASDF decode test: ' + testCase.src, function () {
				var decodeValue = Kekule.IO.JcampUtils.decodeAsdfLine(testCase.src);
				//console.log('expect to equal ', i, decodeValue, testCase.value, decodeValue.__$lastValueType__);
				expect(Kekule.ArrayUtils.compare(decodeValue, testCase.value, asdfDecodeItemCompareFunc) === 0).toEqual(true);
				expect(decodeValue.__$lastValueType__).toEqual(testCase.lastValueType);
			});
		})(testCase);
	}
});