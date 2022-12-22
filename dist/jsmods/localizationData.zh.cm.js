var exporter = require("../kekule.moduleEnvInits.cm.js");
require("../kekule.js");
require("../mins/root.min.js");
require("../mins/localization.min.js");
require("../mins/common.min.js");
require("../mins/localizationData.zh.min.js");
Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "localizationData.zh"]);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }
module.exports = exporter();