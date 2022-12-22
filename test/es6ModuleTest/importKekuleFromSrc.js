import exporter from "../../src/kekule.moduleEnvInits.esm.mjs";
//import "../../src/kekule.esm.dev.mjs";

import "../../src/kekule.js";
import "../../dist/mins/root.min.js";
import "../../dist/mins/localization.min.js";
import "../../dist/mins/common.min.js";
import "../../dist/mins/data.min.js";
import "../../dist/mins/core.min.js";
import "../../dist/mins/html.min.js";
import "../../dist/mins/io.min.js";
import "../../dist/mins/render.min.js";
import "../../dist/mins/algorithm.min.js";
import "../../dist/mins/widget.min.js";
import "../../dist/mins/chemWidget.min.js";

Kekule.ArrayUtils.pushUnique(Kekule.scriptSrcInfo.modules, ["lan", "root", "localization", "localizationData", "common", "data", "core", "html", "io", "render", "algorithm", "widget", "chemWidget"]);
Kekule.scriptSrcInfo.useMinFile = false;
Kekule.environment.setEnvVar('kekule.useMinJs', false);
if (typeof(Kekule) !== 'undefined') { Kekule._loaded(); }

export default exporter();

