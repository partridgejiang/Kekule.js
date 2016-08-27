var express = require('express');
var router = express.Router();

var Kekule = require('kekule').Kekule;

// Compare two molecule with options
router.post('/compare', function(req, res, next) {
  var sSource = req.body.sourceMol;
  var sTarget = req.body.targetMol;
  var mimeType = req.body.mimeType || Kekule.IO.MimeType.JSON;
  var options = JSON.parse(req.body.options || '{}');
  // parse source and target molecule
  var srcMol = Kekule.IO.loadMimeData(sSource, mimeType);
  var targetMol = Kekule.IO.loadMimeData(sTarget, mimeType);
  var result = srcMol.isSameStructureWith(targetMol, options);
  // returns result as JSON
  res.json(result);
});

module.exports = router;
