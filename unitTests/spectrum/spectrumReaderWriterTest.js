describe('Test of the I/O functions of spectrum', function() {

	Kekule.globalOptions.IO.cml.autoConvertNmrDataFreqToUnit = null;  // disable unit conversion, avoid affect the comparisons

	function loadFile(fileName, callback)
	{
		return Kekule.IO.loadUrlData('./data/' + fileName, callback);
	};
	function getSpectrumInside(obj)
	{
		if (obj instanceof Kekule.Spectroscopy.Spectrum)
			return obj;
		else if (obj.getChildCount)
		{
			for (var i = 0, l = obj.getChildCount(); i < l; ++i)
			{
				var child = obj.getChildAt(i);
				if (child instanceof Kekule.Spectroscopy.Spectrum)
					return child;
			}
		}
		return null;
	};
	function numEqual(n1, n2)
	{
		return Kekule.NumUtils.isFloatEqual(n1, n2);
	};
	function isSpectrumEqual(sp1, sp2)
	{
		// simple properties
		for (var prop of ['id', 'title', 'spectrumType'])
		{
			if (sp1.getPropValue(prop) !== sp2.getPropValue(prop))
				return false;
		}
		return true;
	};

	var outputFormats = ['cml'];
	var srcTestFiles = [

		'cmlSpect/example0.cml',
		'cmlSpect/example1.cml',
		'cmlSpect/example2.cml',
		'cmlSpect/example3.cml',
		'jcamp/BRUKAFFN.DX',
		'jcamp/BRUKDIF.DX',
		'jcamp/BRUKPAC.DX',
		'jcamp/BRUKSQZ.DX',
		//'jcamp/ISAS_CDX.DX',  // TODO: the M/A variables in JCAMP can not be handled in CML yet
		'jcamp/ISAS_MS1.DX',
		'jcamp/ISAS_MS3.DX',
		'jcamp/TESTNTUP.DX'

		//'jcamp/BRUKDIF.DX'
	];

	srcTestFiles.forEach(function(srcFile){
		it('Test reader/writer based on src ' + srcFile, function(done) {
			loadFile(srcFile, function(chemObj, success){
				expect(success).toEqual(true);
				var spectrum = getSpectrumInside(chemObj);
				expect(spectrum instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

				outputFormats.forEach(function(format){
					var outputData = Kekule.IO.saveFormatData(chemObj, format);
					// reload it and check whether the reload object are equal to the original spectrum
					var chemObj2 = Kekule.IO.loadFormatData(outputData, format);
					var spectrum2 = getSpectrumInside(chemObj2);
					expect(spectrum2 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
					//spectrum2.getActiveDataSection().setRawValueAt(1, [0, 0]);
					//expect(isSpectrumEqual(spectrum, spectrum2)).toEqual(true);
					expect(spectrum.equal(spectrum2, {method: Kekule.ComparisonMethod.CHEM_STRUCTURE})).toEqual(true);
					spectrum2.finalize();
				});

				chemObj.finalize();

				done();
			});
		});
	});

});