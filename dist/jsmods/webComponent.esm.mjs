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
import "../mins/webComponent.min.js";
let { Kekule, Class, ClassEx, ObjectEx, DataType} = exporter();
export { Kekule, Class, ClassEx, ObjectEx, DataType};
if(!Kekule.scriptSrcInfo.modules)Kekule.scriptSrcInfo.modules=[];
Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "data", "core", "html", "algorithm", "io", "render", "widget", "chemWidget", "webComponent"]);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }