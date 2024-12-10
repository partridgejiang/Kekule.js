describe('Output test of  generation options', function(){

    beforeAll(function(done){
        // TODO: note this test should be done in browser (for loading OpenBabel)
        Kekule.modules('openbabel', function(error) {
            if (!error)
                Kekule.OpenBabel.enable(function() {
                    done();
                });
        });

        /*
        Kekule.modules('indigo', function(error) {
            if (!error)
                Kekule.Indigo.enable(function() {
                    done();
                });
        });
        */
    });

    var testSmilesGenerationModeOnUrl = function(title, url)
    {
        it(title, function(done){
            Kekule.IO.loadUrlData('data/' + url, function(chemObj, success){
                expect(chemObj).not.toBeNull();
                var options = {generationMode: Kekule.IO.SmilesGenerationMode.HEAVIEST};
                // var options = {generationMode: generationMode};
                var outputSmilesDefault = Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.SMILES);
                var outputSmilesOptions = Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.SMILES, options);
                /*
                if (outputSmilesDefault !== outputSmilesOptions)
                    console.log('output smiles', outputSmilesDefault, outputSmilesOptions);
                */
                var newMol1 = Kekule.IO.loadFormatData(outputSmilesDefault, Kekule.IO.DataFormat.SMILES);
                var newMol2 = Kekule.IO.loadFormatData(outputSmilesOptions, Kekule.IO.DataFormat.SMILES);
                expect(newMol1).not.toBeNull();
                expect(newMol2).not.toBeNull();
                expect(newMol1.isSameStructureWith(newMol2)).toBeTruthy();
                done();
            });
        }, 30000);
    };

    var testSmilesRandomizeOnUrl = function(title, url)
    {
        it(title, function(done){
            Kekule.IO.loadUrlData('data/' + url, function(chemObj, success){
                expect(chemObj).not.toBeNull();
                var options = {generationMode: Kekule.IO.SmilesGenerationMode.RANDOM, randomOutputCount: 10};
                var outputSmilesList = Kekule.IO.saveFormatData(chemObj, Kekule.IO.DataFormat.SMILES, options);
                if (outputSmilesList.length > 1) {
                    var newMol0 = Kekule.IO.loadFormatData(outputSmilesList[0], Kekule.IO.DataFormat.SMILES);
                    var newMol0_SmilesGen = Kekule.IO.saveFormatData(newMol0, Kekule.IO.DataFormat.SMILES);
                    expect(newMol0).not.toBeNull();
                    for (var i = 1; i < outputSmilesList.length; ++i) {
                        var newMol = Kekule.IO.loadFormatData(outputSmilesList[i], Kekule.IO.DataFormat.SMILES);
                        expect(newMol).not.toBeNull();
                        var newMol_SmilesGen = Kekule.IO.saveFormatData(newMol, Kekule.IO.DataFormat.SMILES);
                        expect(newMol_SmilesGen).toEqual(newMol0_SmilesGen);
                        /*
                        var isSame = newMol.isSameStructureWith(newMol0);
                        expect(isSame).toBeTruthy();
                        if (!isSame) {
                            console.log('Diff', url, outputSmilesList[0], ' : ', outputSmilesList[i]);
                        }
                        */
                    }
                }
                done();
            });
        }, 30000);
    }

    var srcUrls = [
        'mdl/ArrowBond.mol', 'mdl/ArrowBond3000.mol', 'mdl/Complex2.mol', 'mdl/cyclohexene.mol',
        'mdl/cyclohextone.mol', 'mdl/multipleBonds.mol', 'mdl/spiro1.mol', 'mdl/wedges.mol',
        'mdl/Cyclodextrin.mol',
        'mdl/aromatic1.mol', 'mdl/aromatic2.mol', 'mdl/aromatic3.mol', 'mdl/aromatic4.mol', 'mdl/aromatic5.mol', 'mdl/aromatic6.mol',  //'mdl/aromatic7.mol',
        'mdl/azulene.mol', 'mdl/benzene.mol', 'mdl/choloylcoa.mol', 'mdl/dative.mol', 'mdl/github112_qry.mol', 'mdl/github112_tgt.mol',
        'mdl/linear.mol', 'mdl/monomer.mol', 'mdl/napthalene.mol', 'mdl/porphyrin.mol', 'mdl/quinone.mol',
        'mdl/molV3000.mol', 'mdl/Ooporphyrin.mol', 'mdl/hydroxyamino.mol', 'mdl/hisotopes.mol', 'mdl/het5.mol', 'mdl/D-mannose.mol',
        'mdl/diadamantane-cubane.mol', 'mdl/decalin.mol',
        'cml/(1R)-1-aminoethan-1-ol.cml', 'cml/(1R)-1-aminoethan-1-ol-malformedDictRef.cml', 'cml/(1R)-1-aminoethan-1-ol-multipleBondStereo.cml',
        'cml/benzene.cml', 'cml/butadiene.cml', 'cml/COONa.cml',
        //'cml/cs2a.mol.cml',  // ignore this since two molecules exists in this file

        'cml/cyclohexane-xdrawchem.cml', 'cml/isolated_ringsystems.cml', 'cml/keggtest.cml', //'cml/methanol1.cml', 'cml/methanol2.cml',
        'cml/mol28.cml', 'cml/naphtalene.cml', 'cml/nitrate.cml', 'cml/phosphate.cml', 'cml/toluene.cml',

        'json/DoubleRingInSubgroup.kcj', 'json/FischerProjection1.kcj', 'json/NestedSubgroup.kcj', 'json/PhCOOH.kcj', 'json/subgroups.kcj'
    ];

    var doTests = function() {
        srcUrls.forEach(function (url) {
            testSmilesGenerationModeOnUrl('Test on outputting different mode of SMILES for url: ' + url, url);
            testSmilesRandomizeOnUrl('Test on outputting random SMILES for url' + url, url);
        });
    };

    // setTimeout(doTests, 1000);
    doTests();
});
