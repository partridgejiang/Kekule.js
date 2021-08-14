describe('Test of some core data and functions of spectra module', function(){

	function loadJcampTestFile(fileName, callback)
	{
		return Kekule.IO.loadUrlData('./data/' + fileName, callback);
	}

	it('Test reading single block JCAMP file with Ntuples data', function(done){
		loadJcampTestFile('jcamp/TESTNTUP.DX', function(chemObj, success){
			expect(success).toBeTrue();
			done();
		});
	});

});