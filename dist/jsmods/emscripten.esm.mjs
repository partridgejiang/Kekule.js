import exporter from "../kekule.moduleEnvInits.esm.mjs";
import "../kekule.js";
import "../mins/root.min.js";
import "../mins/localization.min.js";
import "../mins/common.min.js";
import "../mins/emscripten.min.js";
Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "emscripten"]);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }
export default exporter();