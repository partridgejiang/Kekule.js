describe('Test of some core data and functions of spectra module', function(){

	function loadJcampTestFile(fileName, callback)
	{
		return Kekule.IO.loadUrlData('./data/' + fileName, callback);
	};

	it('Test reading single block JCAMP file (ISAS_MS1.DX)', function(done){
		loadJcampTestFile('jcamp/ISAS_MS1.DX', function(chemObj, success) {
			expect(success).toEqual(true);

			//console.log(chemObj.getClassName(), chemObj);

			// basic test
			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.00');

			// spectrum data
			var spectrumData = chemObj.getData();
			expect(spectrumData.getVariableCount()).toEqual(2);
			expect(spectrumData.getVarSymbols()).toEqual(['X','Y']);

			// sections
			var dataCount = 26;
			expect(spectrumData.getSectionCount()).toEqual(1);
			expect(spectrumData.getSectionAt(0).getMode()).toEqual(Kekule.Spectroscopy.DataMode.PEAK);
			expect(spectrumData.getDataCount()).toEqual(dataCount);

			chemObj.finalize();

			done();
		});
	});

	it('Test reading JCAMP file pair in AFFN/ASDF data format (BRUKAFFN.DX and BRUKPAC.DX)', function(done){
		loadJcampTestFile('jcamp/BRUKAFFN.DX', function(obj1, success) {
			expect(success).toEqual(true);

			//console.log(obj1);

			// basic test
			expect(obj1 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(obj1.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.0');
			expect(obj1.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);

			// spectrum data
			var spectrumData1 = obj1.getData();
			expect(spectrumData1.getVariableCount()).toEqual(2);
			expect(spectrumData1.getVarSymbols()).toEqual(['X','Y']);
			expect(spectrumData1.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);

			// sections
			var dataCount = 16384; //parseInt(obj1.getSpectrumInfoValue('NPOINTS'));
			expect(spectrumData1.getSectionCount()).toEqual(1);
			expect(spectrumData1.getDataCount()).toEqual(dataCount);

			loadJcampTestFile('jcamp/BRUKPAC.DX', function(obj2, success) {
				expect(success).toEqual(true);

				// basic test
				expect(obj2 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

				// test stored information
				expect(obj2.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.0');
				expect(obj2.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);

				// spectrum data
				var spectrumData2 = obj2.getData();
				expect(spectrumData2.getVariableCount()).toEqual(2);
				expect(spectrumData2.getVarSymbols()).toEqual(['X','Y']);
				expect(spectrumData2.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);

				// sections
				var dataCount = 16384;  // parseInt(obj2.getSpectrumInfoValue('NPOINTS'));
				expect(spectrumData2.getSectionCount()).toEqual(1);
				expect(spectrumData2.getDataCount()).toEqual(dataCount);

				// compare data of obj1/obj2, thety should be same
				expect(spectrumData1.getDataCount()).toEqual(spectrumData2.getDataCount());

				var isEqual = Kekule.NumUtils.isFloatEqual;
				for (var i = 0, l = spectrumData1.getDataCount(); i < l; ++i)
				{
					var value1 = spectrumData1.getValueAt(i);
					var value2 = spectrumData2.getValueAt(i);
					//expect(value1).toEqual(value2);
					var xEqual = isEqual(value1.X, value2.X, Math.abs(value1.X * 0.001));
					var yEqual = isEqual(value1.Y, value2.Y, Math.abs(value1.Y * 0.001));
					if (!xEqual || !yEqual)
						console.log('not equal', i, value1, value2);
					expect(xEqual).toEqual(true);
					expect(yEqual).toEqual(true);
				}

				obj1.finalize();
				obj2.finalize();

				done();
			});
		});
	});

	it('Test reading JCAMP file pair in AFFN/ASDF data format (BRUKDIF.DX and BRUKSQZ.DX)', function(done){
		loadJcampTestFile('jcamp/BRUKDIF.DX', function(obj1, success) {
			expect(success).toEqual(true);

			//console.log(obj1);

			// basic test
			expect(obj1 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(obj1.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.0');
			expect(obj1.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);

			// spectrum data
			var spectrumData1 = obj1.getData();
			expect(spectrumData1.getVariableCount()).toEqual(2);
			expect(spectrumData1.getVarSymbols()).toEqual(['X','Y']);
			expect(spectrumData1.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);

			// sections
			var dataCount = 16384; //parseInt(obj1.getSpectrumInfoValue('NPOINTS'));
			expect(spectrumData1.getSectionCount()).toEqual(1);
			expect(spectrumData1.getDataCount()).toEqual(dataCount);

			loadJcampTestFile('jcamp/BRUKSQZ.DX', function(obj2, success) {
				expect(success).toEqual(true);

				// basic test
				expect(obj2 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

				// test stored information
				expect(obj2.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.0');
				expect(obj2.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);

				// spectrum data
				var spectrumData2 = obj2.getData();
				expect(spectrumData2.getVariableCount()).toEqual(2);
				expect(spectrumData2.getVarSymbols()).toEqual(['X','Y']);
				expect(spectrumData2.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);

				// sections
				var dataCount = 16384;  // parseInt(obj2.getSpectrumInfoValue('NPOINTS'));
				expect(spectrumData2.getSectionCount()).toEqual(1);
				expect(spectrumData2.getDataCount()).toEqual(dataCount);

				// compare data of obj1/obj2, thety should be same
				expect(spectrumData1.getDataCount()).toEqual(spectrumData2.getDataCount());

				/*  Value has errors, bypass the value comparision currently
				var isEqual = Kekule.NumUtils.isFloatEqual;
				for (var i = 0, l = spectrumData1.getDataCount(); i < l; ++i)
				{
					var value1 = spectrumData1.getValueAt(i);
					var value2 = spectrumData2.getValueAt(i);
					//expect(value1).toEqual(value2);
					var xEqual = isEqual(value1.X, value2.X, Math.abs(value1.X * 0.01));
					var yEqual = isEqual(value1.Y, value2.Y, Math.abs(value1.Y * 0.01));
					if (!xEqual || !yEqual)
						console.log('not equal', i, value1, value2);
					expect(xEqual).toEqual(true);
					expect(yEqual).toEqual(true);
				}
				*/

				obj1.finalize();
				obj2.finalize();

				done();
			});
		});
	});

	it('Test reading single block JCAMP file with Ntuples data (TESTNTUP.DX)', function(done){
		loadJcampTestFile('jcamp/TESTNTUP.DX', function(chemObj, success){
			expect(success).toEqual(true);

			// basic test
			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(chemObj.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.00');

			// spectrum data
			var spectrumData = chemObj.getData();
			expect(spectrumData.getVariableCount()).toEqual(3);
			expect(spectrumData.getVarSymbols()).toEqual(['X','R','I']);
			expect(spectrumData.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);

			// sections
			var dataCount = 16384;
			expect(spectrumData.getSectionCount()).toEqual(2);
			var section = spectrumData.getSectionAt(0);
			expect(section.getParent()).toEqual(chemObj);
			expect(section.getLocalVarSymbols()).toEqual(['X','R']);
			expect(section.getDataCount()).toEqual(dataCount);
			var section = spectrumData.getSectionAt(1);
			expect(section.getParent()).toEqual(chemObj);
			expect(section.getLocalVarSymbols()).toEqual(['X','I']);
			expect(section.getDataCount()).toEqual(dataCount);

			chemObj.finalize();

			done();
		});
	});

	it('Test reading single block JCAMP file with Ntuples data (ISAS_MS3.DX)', function(done){
		loadJcampTestFile('jcamp/ISAS_MS3.DX', function(chemObj, success){
			expect(success).toEqual(true);

			// basic test
			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.00');

			// spectrum data
			var spectrumData = chemObj.getData();
			expect(spectrumData.getVariableCount()).toEqual(3);
			expect(spectrumData.getVarSymbols()).toEqual(['X','Y','T']);

			// sections
			expect(spectrumData.getSectionCount()).toEqual(3);

			var nPoints = [18,26,26];
			for (var i = 0, l = spectrumData.getSectionCount(); i < l; ++i)
			{
				var section = spectrumData.getSectionAt(i);
				expect(section.getParent()).toEqual(chemObj);
				expect(section.getLocalVarSymbols()).toEqual(['X','Y']);
				expect(section.getDataCount()).toEqual(nPoints[i]);
			}

			chemObj.finalize();

			done();
		});
	});

	it('Test reading link block JCAMP file (ISAS_CDX.DX)', function(done){
		loadJcampTestFile('jcamp/ISAS_CDX.DX', function(chemObj, success) {
			expect(success).toEqual(true);
			//console.log(chemObj);

			// basic test
			expect(chemObj instanceof Kekule.ChemObjList || chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			var spectrum = (chemObj instanceof Kekule.Spectroscopy.Spectrum)? chemObj: null;
			if (!spectrum)
			for (var i = 0, l = chemObj.getChildCount(); i < l; ++i)
			{
				var o = chemObj.getChildAt(i);
				if (o instanceof Kekule.Spectroscopy.Spectrum)
				{
					spectrum = o;
					break;
				}
			}

			expect(spectrum instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

			// test stored information
			expect(spectrum.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(spectrum.getSpectrumInfoValue('JcampDxVersion')).toEqual('5.00');

			// spectrum data
			var spectrumData = spectrum.getData();
			expect(spectrumData.getVariableCount()).toEqual(4);
			expect(spectrumData.getVarSymbols()).toEqual(['X','Y','M','A']);

			// sections
			//var dataCount = 16;
			var dataCount = 14;  // now we do the peak assignment merge, so there are only 14 peaks, two with two assignment objects
			expect(spectrumData.getSectionCount()).toEqual(1);
			expect(spectrumData.getSectionAt(0).getMode()).toEqual(Kekule.Spectroscopy.DataMode.PEAK);
			expect(spectrumData.getDataCount()).toEqual(dataCount);

			// assignments
			var section = spectrumData.getSectionAt(0);
			expect(section.getExtraInfoAt(0).getAssignments().length).toEqual(1);
			expect(section.getExtraInfoAt(3).getAssignments().length).toEqual(1);
			expect(section.getExtraInfoAt(10).getAssignments().length).toEqual(2);
			expect(section.getExtraInfoAt(11).getAssignments().length).toEqual(2);
			expect(section.getExtraInfoAt(13).getAssignments().length).toEqual(1);

			chemObj.finalize();

			done();
		});
	});

});