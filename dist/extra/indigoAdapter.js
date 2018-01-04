function CreateIndigo(module)  // create Indigo adapter object
{
	var Module = module || IndigoModule();
	var result = {
		INDIGO_RC_NOT_CENTER: -1,
		INDIGO_RC_UNMARKED: 0,
		INDIGO_RC_CENTER: 1,
		INDIGO_RC_UNCHANGED: 2,
		INDIGO_RC_MADE_OR_BROKEN: 4,
		INDIGO_RC_ORDER_CHANGED: 8,
		INDIGO_ABS: 1,
		INDIGO_OR: 2,
		INDIGO_AND: 3,
		INDIGO_EITHER: 4,
		INDIGO_UP: 5,
		INDIGO_DOWN: 6,
		INDIGO_CIS: 7,
		INDIGO_TRANS: 8,
		INDIGO_CHAIN: 9,
		INDIGO_RING: 10,
		INDIGO_ALLENE: 11,
		INDIGO_SINGLET: 101,
		INDIGO_DOUBLET: 102,
		INDIGO_TRIPLET: 103,
		free: Module.cwrap('indigoFree', 'number', ['number']),
		setOption: Module.cwrap('indigoSetOption', 'number', ['string', 'string']),
		loadMoleculeFromString: Module.cwrap('indigoLoadMoleculeFromString', 'number', ['string']),
		molfile: Module.cwrap('indigoMolfile', 'string', ['number']),
		layout: Module.cwrap('indigoLayout', 'number', ['number'])
	};
	result._module = Module;  // save module object
	return result;

};