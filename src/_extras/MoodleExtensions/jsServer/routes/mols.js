var express = require('express');
var router = express.Router();

var Kekule = require('kekule').Kekule;

// Compare two molecule with options
router.post('/compare', function(req, res, next) {
  var sSource = req.body.sourceMol;
  var sTarget = req.body.targetMol;
  var mimeType = req.body.mimeType || Kekule.IO.MimeType.JSON;
  var result = {};
  try
  {
    var options = JSON.parse(req.body.options || '{}');
    // parse source and target molecule
    var srcMol = Kekule.IO.loadMimeData(sSource, mimeType);
    var targetMol = Kekule.IO.loadMimeData(sTarget, mimeType);
    //console.log('Compare molecules', srcMol, targetMol);
    result.result = srcMol.isSameStructureWith(targetMol, options);
  }
  catch(e)
  {
    result.error = e.message;
  }
  console.log('Return result', result);
  // returns result as JSON
  res.json(result);
});

router.get('/compare', function(req, res, next) {
  res.render('index', { title: 'Mol Comparer' });
});

module.exports = router;
