/**
 * Created by ginger on 2016/3/6.
 */

describe('IO Test of different file formats', function(){

	var testIO = function(title, fileUrl, formatIds)
	{
		it(title, function(done){
			Kekule.IO.loadUrlData('data/' + fileUrl, function(chemObj, success){
				expect(chemObj).not.toBeNull();
				//console.log(chemObj.getCtab());
				var fIds = Kekule.ArrayUtils.toArray(formatIds);
				fIds.forEach(function(formatId) {
					var data = Kekule.IO.saveFormatData(chemObj, formatId);
					expect(data).not.toBeNull();
					var chemObj2 = Kekule.IO.loadFormatData(data, formatId);
					expect(chemObj2).not.toBeNull();

					expect(chemObj.getNodeCount()).toEqual(chemObj.getNodeCount());
					expect(chemObj.getConnectorCount()).toEqual(chemObj.getConnectorCount());

					if (chemObj instanceof Kekule.StructureFragment)
					{
						var compareResult = chemObj.isSameStructureWith(chemObj2);
						//console.log(formatId, compareResult);
						expect(compareResult).toBeTruthy();
					}
				});
				done();
			});
		}, 30000);
	};

	var srcUrls = [
		'mdl/ArrowBond.mol', 'mdl/ArrowBond3000.mol', 'mdl/Complex2.mol', 'mdl/cyclohexene.mol',
		'mdl/cyclohextone.mol', 'mdl/multipleBonds.mol', 'mdl/spiro1.mol', 'mdl/wedges.mol',
		'mdl/Cyclodextrin.mol',
		'mdl/aromatic1.mol', 'mdl/aromatic2.mol', 'mdl/aromatic3.mol', 'mdl/aromatic4.mol', 'mdl/aromatic5.mol', 'mdl/aromatic6.mol', 'mdl/aromatic7.mol',
		'mdl/azulene.mol', 'mdl/benzene.mol', 'mdl/choloylcoa.mol', 'mdl/dative.mol', 'mdl/github112_qry.mol', 'mdl/github112_tgt.mol',
		'mdl/linear.mol', 'mdl/monomer.mol', 'mdl/napthalene.mol', 'mdl/porphyrin.mol', 'mdl/quinone.mol',
		'mdl/molV3000.mol', 'mdl/Ooporphyrin.mol', 'mdl/hydroxyamino.mol', 'mdl/hisotopes.mol', 'mdl/het5.mol', 'mdl/D-mannose.mol',
		'mdl/diadamantane-cubane.mol', 'mdl/decalin.mol',
		'cml/(1R)-1-aminoethan-1-ol.cml', 'cml/(1R)-1-aminoethan-1-ol-malformedDictRef.cml', 'cml/(1R)-1-aminoethan-1-ol-multipleBondStereo.cml',
		'cml/benzene.cml', 'cml/butadiene.cml', 'cml/COONa.cml',
		'cml/cs2a.mol.cml',

		'cml/cyclohexane-xdrawchem.cml', 'cml/isolated_ringsystems.cml', 'cml/keggtest.cml', 'cml/methanol1.cml', 'cml/methanol2.cml',
		'cml/mol28.cml', 'cml/naphtalene.cml', 'cml/nitrate.cml', 'cml/phosphate.cml', 'cml/toluene.cml',

		'json/DoubleRingInSubgroup.kcj', 'json/FischerProjection1.kcj', 'json/NestedSubgroup.kcj', 'json/PhCOOH.kcj', 'json/subgroups.kcj'
	];
	var formats = ['mol', 'sd', 'mol3k', 'cml', 'Kekule-JSON', 'Kekule-XML'];
	srcUrls.forEach(function(url){
		testIO('Test on url: ' + url, url, formats);
	});
});
