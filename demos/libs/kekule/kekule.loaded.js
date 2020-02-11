/**
 * A special JS file that need to be compressed into kekule.min.js or
 * any other compressed files that load directly in HTML document (rather
 * than using kekule.js loader).
 */

if (typeof(Kekule) !== 'undefined')
{
	Kekule._loaded();
}

// export objects in webpack or other similiar environment at the tail of the js files
if (typeof (module) !== 'undefined')
{
	try
	{
		module.exports = {
			'Class': Class,
			'ClassEx': ClassEx,
			'ObjectEx': ObjectEx,
			'DataType': DataType,
			'Kekule': Kekule
		};
		//module.exports = Kekule;
	}
	catch (e)
	{
	}
}

