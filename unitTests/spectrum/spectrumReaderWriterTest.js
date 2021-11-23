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

	var outputFormats = ['cml',  'jcamp-dx'];
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
		'jcamp/TESTNTUP.DX',
		'jcamp/10038695_13C.jcamp'

		//'jcamp/BRUKDIF.DX'
	];

	//srcTestFiles = ['cmlSpect/example1.cml'];


	srcTestFiles.forEach(function(srcFile){
		it('Test reader/writer based on src ' + srcFile, function(done) {
			loadFile(srcFile, function(chemObj, success){
				expect(success).toEqual(true);
				var spectrum = getSpectrumInside(chemObj);
				expect(spectrum instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);

				outputFormats.forEach(function(format) {
					var compareOptions = {method: Kekule.ComparisonMethod.CHEM_STRUCTURE};
					var outputData = Kekule.IO.saveFormatData(chemObj, format);
					// reload it and check whether the reload object are equal to the original spectrum
					var chemObj2 = Kekule.IO.loadFormatData(outputData, format);
					var spectrum2 = getSpectrumInside(chemObj2);
					expect(spectrum2 instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
					//console.log(spectrum2, spectrum2.getRefMolecules());
					//console.log(spectrum, spectrum.getRefMolecules());
					//console.log(outputData);
					//spectrum2.getActiveDataSection().setRawValueAt(1, [0, 0]);
					//expect(isSpectrumEqual(spectrum, spectrum2)).toEqual(true);
					var spectrum1 = spectrum;
					if (srcFile.endsWith('.cml') && format === 'jcamp-dx')
					{
						//spectrum1 = spectrum.clone();
						spectrum1 = getSpectrumInside(chemObj.clone());  // clone and restain the possible refMolecules
						/*
						// CML file may containing refMolecules that can not be handled by JCAMP now, remove it
						spectrum1.setRefMolecules(undefined);
						spectrum2.setRefMolecules(undefined);
						*/
						// CML file may containing peak details that can not be handled by JCAMP now, remove them
						for (var i = 0, l = spectrum1.getDataSectionCount(); i < l; ++i)
						{
							var section = spectrum1.getDataSectionAt(i);
							if (section.isPeakSection())
							{
								for (var j = 0, jj = section.getDataCount(); j < jj; ++j)
								{
									//section.setExtraInfoAt(j, undefined);
									var extra = section.getExtraInfoAt(j);
									if (extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails)
									{
										if (extra.getAssignment())
										{
											extra.setShape(undefined);
											extra.setMultiplicity(undefined);
										}
										else
										{
											section.setExtraInfoAt(j, undefined);
										}
									}
								}
							}
						}
					}
					// the meta may be different in CML/JCAMP
					if ((srcFile.endsWith('.cml') && format === 'jcamp-dx')
						|| (!srcFile.endsWith('.cml') && format === 'cml'))
						compareOptions.ignoredProperties = ['metaData', 'conditions', 'parameters'];

					expect(spectrum1.equal(spectrum2, compareOptions)).toEqual(true);
					spectrum2.finalize();
				});

				chemObj.finalize();

				done();
			});
		});
	});

});