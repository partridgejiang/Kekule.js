/**
 * A special JS file that need to be compressed into kekule.min.js or
 * any other compressed files that load directly in HTML document (rather
 * than using kekule.js loader).
 */

if (this.Kekule)
	Kekule._loaded();
