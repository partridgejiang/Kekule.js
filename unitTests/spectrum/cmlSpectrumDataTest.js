describe('Test of some core data and functions of spectra module', function() {

	Kekule.globalOptions.IO.cml.enableExtractSampleInsideSpectrum = true;

	function loadTestFile(fileName, callback)
	{
		return Kekule.IO.loadUrlData('./data/' + fileName, callback);
	};
	function numEqual(n1, n2)
	{
		return Kekule.NumUtils.isFloatEqual(n1, n2);
	}
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
	}

	it('Test reading single CMLSpect file with continuous data (example0.cml)', function(done) {
		loadTestFile('cmlSpect/example0.cml', function (chemObj, success) {
			expect(success).toEqual(true);

			chemObj = getSpectrumInside(chemObj);

			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.UV_VIS);
			expect(chemObj.getTitle()).toEqual('Holmium Oxide Wavelength Standard');

			// metas
			expect(chemObj.getSpectrumInfoValue('Origin')).toEqual('Lambda 900');
			expect(chemObj.getSpectrumInfoValue('Resolution').getValue()).toEqual(2);
			expect(chemObj.getSpectrumInfoValue('Resolution').getUnit()).toEqual('nm');

			// sample
			expect(chemObj.getRefMolecule().hasFormula()).toEqual(true);
			expect(chemObj.getRefMolecule().getFormula().getText()).toEqual('Ho2O3');

			// variables
			expect(chemObj.getVariableCount()).toEqual(2);
			expect(chemObj.getVarSymbols()).toEqual(['x','y']);
			expect(chemObj.getVariable(0).getUnit()).toEqual('nm');
			expect(chemObj.getVariable(1).getUnit()).toEqual('absorbance');

			// sections
			var dataSize = 501;
			expect(chemObj.getDataSectionCount()).toEqual(1);
			var sec = chemObj.getActiveDataSection();
			expect(sec.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);
			expect(sec.getDataCount()).toEqual(dataSize);

			// section data
			var v = sec.getValueAt(0);
			expect(numEqual(v.x, 200)).toEqual(true);
			expect(numEqual(v.y, 0.46341657)).toEqual(true);
			var v = sec.getValueAt(10);
			expect(numEqual(v.x, 210)).toEqual(true);
			expect(numEqual(v.y, 0.32141477)).toEqual(true);
			var v = sec.getValueAt(dataSize - 1);
			expect(numEqual(v.x, 700)).toEqual(true);
			expect(numEqual(v.y, 0.0297209)).toEqual(true);

			chemObj.finalize();
			done();
		});
	});

	it('Test reading Mol/Spect combined file with peak data and assignments (example1.cml)', function(done) {
		loadTestFile('cmlSpect/example1.cml', function (chemObj, success) {
			expect(success).toEqual(true);
			expect(chemObj.getChildCount()).toEqual(2);

			var mol = chemObj.getChildAt(0);
			var spec = chemObj.getChildAt(1);

			expect(mol instanceof Kekule.Molecule).toEqual(true);
			expect(spec instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(spec.getTitle()).toEqual(undefined);

			// mol
			expect(mol.getNodeCount()).toEqual(32);
			expect(mol.getConnectorCount()).toEqual(34);
			expect(mol.getId()).toEqual('nmrshiftdb10026026');

			// spectrum
			expect(spec.getId()).toEqual('nmrshiftdb10074894');
			expect(spec.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);

			// metas
			expect(spec.getSpectrumInfoValue('NMR.ObserveFrequency').getValue()).toEqual(500);
			expect(spec.getSpectrumInfoValue('NMR.ObserveFrequency').getUnit()).toEqual('MHz');
			expect(spec.getSpectrumInfoValue('NMR.ObserveNucleus')).toEqual('H');
			expect(spec.getSpectrumInfoValue('ObserveNucleus')).toEqual('H');  // test for prefix omit

			// variables
			expect(spec.getVariableCount()).toEqual(2);
			expect(spec.getVarSymbols()).toEqual(['x','y']);
			expect(spec.getVariable(0).getUnit()).toEqual('ppm');

			// sections
			var dataSize = 15;
			expect(spec.getDataSectionCount()).toEqual(1);
			var sec = spec.getActiveDataSection();
			expect(sec.getMode()).toEqual(Kekule.Spectroscopy.DataMode.PEAK);
			expect(sec.getDataCount()).toEqual(dataSize);

			// section data
			var v = sec.getValueAt(0);
			expect(numEqual(v.x, 3.369999885559082)).toEqual(true);
			expect(numEqual(v.y, 1)).toEqual(true);
			var v = sec.getValueAt(5);
			expect(numEqual(v.x, 4.760000228881836)).toEqual(true);
			expect(numEqual(v.y, 1)).toEqual(true);
			var v = sec.getValueAt(dataSize - 1);
			expect(numEqual(v.x, 10.609999656677246)).toEqual(true);
			expect(numEqual(v.y, 1)).toEqual(true);

			// extra info, including assignments
			var extra = sec.getExtraInfoAt(0);
			expect(extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails).toEqual(true);
			expect(extra.getShape()).toEqual('sharp');
			expect(extra.getAssignment() instanceof Kekule.Atom).toEqual(true);
			expect(extra.getAssignment().getId()).toEqual('a25');
			var extra = sec.getExtraInfoAt(6);
			expect(extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails).toEqual(true);
			expect(extra.getShape()).toEqual('sharp');
			expect(!extra.getAssignment()).toEqual(true);
			//expect(extra.getAssignment() instanceof Kekule.Atom).toEqual(true);
			//expect(extra.getAssignment().getId()).toEqual('a36');
			var extra = sec.getExtraInfoAt(dataSize - 2);
			expect(extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails).toEqual(true);
			expect(extra.getShape()).toEqual('sharp');
			expect(extra.getAssignment() instanceof Kekule.Atom).toEqual(true);
			expect(extra.getAssignment().getId()).toEqual('a26');

			chemObj.finalize();
			done();
		});
	});

	it('Test reading CMLSpect file with multiple data sections (example2.cml)', function(done) {
		loadTestFile('cmlSpect/example2.cml', function (chemObj, success) {
			expect(success).toEqual(true);

			chemObj = getSpectrumInside(chemObj);

			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.IR);
			expect(chemObj.getTitle()).toEqual('2-Butanol');

			// metas
			expect(chemObj.getSpectrumInfoValue('cml.press').getValue()).toEqual(12345);
			expect(chemObj.getSpectrumInfoValue('cml.press').getUnit()).toEqual('Pa');
			expect(chemObj.getSpectrumInfoValue('press').getUnit()).toEqual('Pa');  // test for prefix omit

			// sample
			expect(chemObj.getRefMolecule().hasFormula()).toEqual(true);
			expect(chemObj.getRefMolecule().getFormula().getText()).toEqual('C4H10O');

			// variables
			expect(chemObj.getVariableCount()).toEqual(2);
			expect(chemObj.getVarSymbols()).toEqual(['x','y']);
			expect(chemObj.getVariable(0).getUnit()).toEqual('cm-1');
			expect(chemObj.getVariable(1).getUnit()).toEqual('absorbance');

			// sections
			var dataSize1 = 227;
			var dataSize2 = 4;
			expect(chemObj.getDataSectionCount()).toEqual(2);
			var sec = chemObj.getDataSectionAt(0);
			expect(sec.getMode()).toEqual(Kekule.Spectroscopy.DataMode.CONTINUOUS);
			expect(sec.getDataCount()).toEqual(dataSize1);

			var multiplier = 0.000109021;
			var v = sec.getValueAt(0);
			expect(numEqual(v.x, 734)).toEqual(true);
			expect(numEqual(v.y, 42 * multiplier)).toEqual(true);
			var v = sec.getValueAt(dataSize1 - 1);
			expect(numEqual(v.x, 1638)).toEqual(true);
			expect(numEqual(v.y, 49 * multiplier)).toEqual(true);

			var sec = chemObj.getDataSectionAt(1);
			expect(sec.getMode()).toEqual(Kekule.Spectroscopy.DataMode.PEAK);
			expect(sec.getDataCount()).toEqual(dataSize2);
			var v = sec.getValueAt(0);
			expect(numEqual(v.x, 2974)).toEqual(true);
			expect(numEqual(v.y, 1.0921)).toEqual(true);
			var v = sec.getValueAt(dataSize2 - 1);
			expect(numEqual(v.x, 3657)).toEqual(true);
			expect(numEqual(v.y, 0.1092)).toEqual(true);

			var extra = sec.getExtraInfoAt(0);
			expect(extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails).toEqual(true);
			expect(extra.getShape()).toEqual('sharp');
			expect(extra.getMultiplicity()).toEqual(Kekule.Spectroscopy.PeakMultiplicity.SINGLET);
			var extra = sec.getExtraInfoAt(dataSize2 - 1);
			expect(extra instanceof Kekule.Spectroscopy.SpectrumPeakDetails).toEqual(true);
			expect(extra.getShape()).toEqual('broad');

			chemObj.finalize();
			done();
		});
	});

	it('Test reading CMLSpect file of simple peak data (example3.cml)', function(done) {
		loadTestFile('cmlSpect/example3.cml', function (chemObj, success) {
			expect(success).toEqual(true);

			chemObj = getSpectrumInside(chemObj);

			expect(chemObj instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getTitle()).toEqual('4-vinylbenzyl chloride');

			// metas
			expect(chemObj.getSpectrumInfoValue('Owner')).toEqual('Robert Badger');

			// sample
			expect(chemObj.getRefMolecule().hasFormula()).toEqual(true);
			expect(chemObj.getRefMolecule().getFormula().getText()).toEqual('C9H9Cl');

			// variables
			expect(chemObj.getVariableCount()).toEqual(2);
			expect(chemObj.getVarSymbols()).toEqual(['x', 'y']);
			expect(chemObj.getVariable(0).getUnit()).toEqual('m/z');
			expect(chemObj.getVariable(1).getUnit()).toEqual('relabundance');

			// sections
			var dataSize1 = 91;
			expect(chemObj.getDataSectionCount()).toEqual(1);
			var sec = chemObj.getDataSectionAt(0);
			expect(sec.getMode()).toEqual(Kekule.Spectroscopy.DataMode.PEAK);
			expect(sec.getDataCount()).toEqual(dataSize1);

			chemObj.finalize();
			done();
		});
	});

	it('Test reading CMLSpect file with multiple parts (example4.cml)', function(done) {
		loadTestFile('cmlSpect/example4.cml', function (chemObj, success) {
			expect(success).toEqual(true);

			expect(chemObj.getChildCount()).toEqual(16);
			expect(chemObj.getChildAt(0) instanceof Kekule.Molecule).toEqual(true);
			expect(chemObj.getChildAt(1) instanceof Kekule.Molecule).toEqual(true);
			expect(chemObj.getChildAt(2) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(2).getTitle()).toEqual('Table 2.1');
			expect(chemObj.getChildAt(2).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(chemObj.getChildAt(3) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(3).getTitle()).toEqual('Table 2.2');
			expect(chemObj.getChildAt(3).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(chemObj.getChildAt(4) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(4).getTitle()).toEqual('Table 1.1');
			expect(chemObj.getChildAt(4).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(chemObj.getChildAt(5) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(5).getTitle()).toEqual('Table 1.2');
			expect(chemObj.getChildAt(5).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.NMR);
			expect(chemObj.getChildAt(6) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(6).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(6).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.UV_VIS);
			expect(chemObj.getChildAt(7) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(7).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(7).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.UV_VIS);
			expect(chemObj.getChildAt(8) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(8).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(8).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.IR);
			expect(chemObj.getChildAt(9) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(9).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(9).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.IR);
			expect(chemObj.getChildAt(10) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(10).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(10).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getChildAt(11) instanceof Kekule.Spectroscopy.Spectrum).toEqual(true);
			expect(chemObj.getChildAt(11).getTitle()).toEqual(undefined);
			expect(chemObj.getChildAt(11).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);

			expect(chemObj.getChildAt(12).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getChildAt(13).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getChildAt(14).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);
			expect(chemObj.getChildAt(15).getSpectrumType()).toEqual(Kekule.Spectroscopy.SpectrumType.MS);

			chemObj.finalize();
			done();
		});
	});

});