var express = require('express');
var router = express.Router();

var Kekule = require('kekule').Kekule;

function extractReqData(req)
{
  var sSource = req.body.sourceMol;
  var sTarget = req.body.targetMol;
  var mimeType = req.body.mimeType || Kekule.IO.MimeType.JSON;
  var result = {};
  try
  {
    result.options = JSON.parse(req.body.options || '{}');
    // parse source and target molecule
    if (sSource)
      result.srcMol = Kekule.IO.loadMimeData(sSource, mimeType);
    if (sTarget)
      result.targetMol = Kekule.IO.loadMimeData(sTarget, mimeType);
  }
  catch(e)
  {
    result.error = 'Molecule data error';
  }
  return result;
}

// Compare two molecule with options
router.post('/compare', function(req, res, next) {
  var result = {};
  try
  {
    var reqData = extractReqData(req);
    if (!reqData.error)
    {
      //console.log('Compare molecules', srcMol, targetMol);
      result.result = reqData.srcMol.isSameStructureWith(reqData.targetMol, reqData.options);
    }
    else
      result.error = reqData.error;
  }
  catch(e)
  {
    result.error = e.message;
  }
  console.log((new Date()).toLocaleString(), 'Compare returns result', result);
  // returns result as JSON
  res.json(result);
});

// Check if srcMol contains target mol
router.post('/contain', function(req, res, next) {
  var result = {};
  try
  {
    var reqData = extractReqData(req);
    if (!reqData.error)
    {
      if (reqData.options.reversed)
        result.result = !!reqData.targetMol.search(reqData.srcMol, reqData.options);
      else
        result.result = !!reqData.srcMol.search(reqData.targetMol, reqData.options);
    }
    else
      result.error = reqData.error;
  }
  catch(e)
  {
    result.error = e.message;
  }
  console.log((new Date()).toLocaleString(), 'Contain returns result', result);
  // returns result as JSON
  res.json(result);
});

router.get('/compare', function(req, res, next) {
  res.render('index', { title: 'Mol Comparer' });
});

module.exports = router;
