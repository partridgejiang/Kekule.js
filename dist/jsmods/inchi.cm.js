var exporter = require("../kekule.moduleEnvInits.cm.js");
require("../kekule.js");
require("../mins/root.min.js");
require("../mins/localization.min.js");
require("../mins/common.min.js");
require("../mins/data.min.js");
require("../mins/core.min.js");
require("../mins/emscripten.min.js");
require("../mins/algorithm.min.js");
require("../mins/io.min.js");
require("../mins/inchi.min.js");
module.exports = exporter();
if(!Kekule.scriptSrcInfo.modules)Kekule.scriptSrcInfo.modules=[];
Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "data", "core", "emscripten", "algorithm", "io", "inchi"]);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }