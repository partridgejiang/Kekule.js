import exporter from "../kekule.moduleEnvInits.esm.mjs";
import "../kekule.js";
import "../mins/root.min.js";
import "../mins/localization.min.js";
import "../mins/common.min.js";
import "../mins/data.min.js";
import "../mins/core.min.js";
import "../mins/html.min.js";
import "../mins/algorithm.min.js";
import "../mins/io.min.js";
import "../mins/render.min.js";
import "../mins/widget.min.js";
import "../mins/chemWidget.min.js";
Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "data", "core", "html", "algorithm", "io", "render", "widget", "chemWidget"]);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }
export default exporter();