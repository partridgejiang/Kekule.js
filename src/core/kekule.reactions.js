/**
 * @fileoverview
 * This file contains basic classes about chemical reactions.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /core/kekule.structures.js
 */

/**
 * Enumeration of type of molecules or conditions in reaction.
 * @class
 */
Kekule.ReactionComponent = {
	REACTANT: 'reactant',
	PRODUCT: 'product',
	SUBSTANCE: 'substance',
	CONDITION: 'condition'
};

/**
 * Enumeration of standard roles in a reaction.
 * @class
 */
Kekule.ReactionRole = {
	// for reactant
	REAGENT: 'reagent',
	// for substances
	CATALYST: 'catalyst',
	SOLVENT: 'solvent',
	// for conditions
	TEMPERATURE: 'temperature',
	DURATION: 'duration'
}

/**
 * Enumeration of reaction direction.
 */
Kekule.ReactionDirection = {
	/** Reaction equilibrium which is (almost) fully on the product side. Often denoted with a forward arrow. */
	FORWARD: 1,
	/** Reaction equilibrium which is (almost) fully on the reactant side. Often denoted with a backward arrow. */
	BACKWARD: -1,
	/** Reaction equilibrium state. Often denoted by a double arrow. */
	BIDIRECTION: 0
};

/**
 * A chemical reaction. Including information on reactants, products, substances and conditions.
 * All informations are organized in a role-object form using {@link Kekule.RoleMap}. Property
 * reactants, products and substances should be maps of role-{@link Kekule.Molecule}. Property
 * conditions can be of role-Object.
 * @class
 * @augments Kekule.ChemObject
 *
 * @property {String} name Name of reaction.
 * @property {String} title Title of reaction.
 * @property {String} reactionType Type of reaction.
 * @property {Float} yield Yield of reaction. 0 <= Value <= 1.
 * @property {Array} reactants Reactants of reaction, each item in array should be a role map based hash.
 * @property {Array} products Products of reaction, each item in array should be a role map based hash.
 * @property {Array} substances Substances related but not evolved in reaction, such as solvent.
 *   Each item in array should be a a role map based hash.
 * @property {Array} conditions Conditions of reaction, including temperature, pressure and so on.
 */
Kekule.Reaction = Class.create(Kekule.ChemObject,
/** @lends Kekule.Reaction# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Reaction',
	/** @private */
	initialize: function($super, id)
	{
		$super(id);
		this.setDirection(Kekule.ReactionDirection.FORWARD);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('name', {'dataType': DataType.STRING});
		this.defineProp('title', {'dataType': DataType.STRING});
		this.defineProp('reactionType', {'dataType': DataType.STRING});
		this.defineProp('yield', {'dataType': DataType.FLOAT});
		this.defineProp('direction', {
			'dataType': DataType.INT, 'defaultValue': Kekule.ReactionDirection.FORWARD,
			'enumSource': Kekule.ReactionDirection
		});
		this.defineProp('reactants', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('reactants');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('reactants', r);
					}
					return r;
				}
		});
		this.defineProp('products', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('products');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('products', r);
					}
					return r;
				}
		});
		this.defineProp('substances', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('substances');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('substances', r);
					}
					return r;
				}
		});
		this.defineProp('conditions', {
			'dataType': DataType.ARRAY,
			'setter': null,
			'getter': function(canCreate)
				{
					var r = this.getPropStoreFieldValue('conditions');
					if ((!r) && canCreate)
					{
						r = [];
						this.setPropStoreFieldValue('conditions', r);
					}
					return r;
				}
		});
	},

	/** @private */
	ownerChanged: function($super, newOwner)
	{
		var components = ['reactants', 'products', 'substances', 'conditions'];
		for (var i = 0, l = components.length; i < l; ++i)
		{
			var compName = components[i];
			var a = this.getComponentArray(compName);
			if (a)
			{
				for (var j = 0, k = a.length; j < k; ++j)
				{
					var item = a[j].item;
					if (item.setOwner)
						item.setOwner(newOwner);
				}
			}
		}
		$super(newOwner);
	},

	/** @private */
	assertAddingMolecule: function(obj)
	{
		if (!(obj instanceof Kekule.Molecule))
		{
			Kekule.chemError(/*Kekule.ErrorMsg.UNABLE_ADD_NONMOLECULE_MAP*/Kekule.$L('ErrorMsg.UNABLE_ADD_NONMOLECULE_MAP'));
		}
	},
	/** @private */
	notifyReactantsChange: function()
	{
		this.notifyPropSet('reactants', this.getPropStoreFieldValue('reactants'));
	},
	/** @private */
	notifyProductsChange: function()
	{
		this.notifyPropSet('products', this.getPropStoreFieldValue('products'));
	},
	/** @private */
	notifySubstancesChange: function()
	{
		this.notifyPropSet('substances', this.getPropStoreFieldValue('substances'));
	},
	/** @private */
	notifyConditionsChange: function()
	{
		this.notifyPropSet('conditions', this.getPropStoreFieldValue('conditions'));
	},
	/** @private */
	notifyComponentChange: function(component)
	{
		var propName = this.componentToPropName(component);
		if (propName)
			this.notifyPropSet(propName, this.getPropStoreFieldValue(propName));
	},

	/**
	 * Get property name corresponding to values in {@link Kekule.ReactionComponent}
	 * @param {String} component
	 * @returns {String} Property name or null (if not found).
	 */
	componentToPropName: function(component)
	{
		return component + 's';
	},

	// methods about general aspects of reaction
	/**
	 * Get component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Bool} canCreate Whether create a new array if component array is not set.
	 * @return {Array} Corresponding array to component or null on failure.
	 */
	getComponentArray: function(component, canCreate)
	{
		var pname = this.componentToPropName(component);
		if (pname)
		{
			switch (pname)
			{
				case 'reactants': return this.doGetReactants(canCreate); break;
				case 'products': return this.doGetProducts(canCreate); break;
				case 'substances': return this.doGetSubstances(canCreate); break;
				case 'conditions': return this.doGetConditions(canCreate); break;
				default: return null;
			}
		}
		else
			return null;
	},
	/**
	 * Get item count of a component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @return {Int} Length of array or null on failure.
	 */
	getComponentItemCount: function(component)
	{
		var a = this.getComponentArray(component);
		return a? a.length: 0;
	},
	/**
	 * Get item at index of a component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map in array. Return null if not found.
	 */
	getMapAt: function(component, index)
	{
		var a = this.getComponentArray(component);
		return a? a[index]: null;
	},
	/**
	 * Get map.item at index of a component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Int} index Index in array.
	 * @return {Variant} Item in map object or null on failure.
	 */
	getMapItemAt: function(component, index)
	{
		var r = this.getMapAt(component, index);
		return r? r.item: null;
	},
	/**
	 * Get index of map in array of component.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Hash} map Map object to find.
	 * @returns {Int} Index of map or -1 on failure.
	 */
	indexOfMap: function(component, map)
	{
		var a = this.getComponentArray(component);
		return a? a.indexOf(map): -1;
	},
	/**
	 * Get index of map.item in a component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Int} Index of item or -1 on failure.
	 */
	indexOfItem: function(component, item, role)
	{
		var a = this.getComponentArray(component);
		if (a)
		{
			for (var i = 0, l = a.length; i < l; ++i)
			{
				if (a[i].item == item)
				{
					if (typeof(role) === 'undefined')
						return i;
					else if (role === a[i].role)
						return i;
				}
			}
		}
		return -1;
	},
	/**
	 * Append map to the array of component. If already exists, append will not be done.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Hash} map Map to find.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendMap: function(component, map)
	{
		if ((component == Kekule.ReactionComponent.PRODUCT)
			|| (component == Kekule.ReactionComponent.REACTANT))
			this.assertAddingMolecule(map.item);
		var r = Kekule.ArrayUtils.pushUniqueEx(this.getComponentArray(component, true), map);
		if (r.isPushed)
			this.notifyComponentChange(component);
		return r.index;
	},
	/**
	 * Combine item and role to a map object and append it to the array of component.
	 *   If the same item and role already exists, append will not be done.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Variant} item
	 * @param {String} role Can be null to indicate with no explicit role.
	 * @param {Hash} additionalInfo Additional fields and values need to add to role map.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendItem: function(component, item, role, additionalInfo)
	{
		var index = this.indexOfItem(component, item, role);
		if (index < 0)  // not exists, can append
		{
			if ((component == Kekule.ReactionComponent.PRODUCT)
				|| (component == Kekule.ReactionComponent.REACTANT))
				this.assertAddingMolecule(item);
			var map = Kekule.RoleMapUtils.createMap(item, role);
			if (additionalInfo)
				Object.extend(map, additionalInfo);
			var r = Kekule.ArrayUtils.pushUniqueEx(this.getComponentArray(component, true), map);
			this.notifyComponentChange(component);
			return r.index;
		}
		else
			return index;
	},
	/**
	 * remove map at index of a component array.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Item removed or null on failure.
	 */
	removeMapAt: function(component, index)
	{
		var r = null;
		var a = this.getComponentArray(component);
		if (a)
		{
			r = Kekule.ArrayUtils.removeAt(a, index);
			if (r)
				this.notifyComponentChange(component);
		}
		return r;
	},
	/**
	 * Remove map from the array of component.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Hash} map Map to find.
	 * @returns {Hash} map removed or null on failure.
	 */
	removeMap: function(component, map)
	{
		var r = null;
		var a = this.getComponentArray(component);
		if (a)
		{
			r = Kekule.ArrayUtils.remove(a, map);
			if (r)
				this.notifyComponentChange(component);
		}
		return r;
	},
	/**
	 * Remove map of item/role from the array of component.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Hash} Map removed or null on failure.
	 */
	removeItem: function(component, item, role)
	{
		var index = this.indexOfItem(component, item, role);
		if (index >= 0)  // exists and can be removed
			return this.removeMapAt(component, index);
		else
			return null;
	},
	/**
	 * Clear array of component.
	 * @param {String} component Component name, value from {@link Kekule.ReactionComponent}.
	 */
	clearComponent: function(component)
	{
		var a = this.getComponentArray(component);
		a = [];
		this.notifyComponentChange(component);
	},

	// methods about different arrays
	/**
	 * Get item count of {@link Kekule.Reaction#reactants} array.
	 * @return {Int} Length of array or null on failure.
	 */
	getReactantCount: function()
	{
		return this.getComponentItemCount(Kekule.ReactionComponent.REACTANT);
	},
	/**
	 * Get item count of {@link Kekule.Reaction#products} array.
	 * @return {Int} Length of array or null on failure.
	 */
	getProductCount: function()
	{
		return this.getComponentItemCount(Kekule.ReactionComponent.PRODUCT);
	},
	/**
	 * Get item count of {@link Kekule.Reaction#substances} array.
	 * @return {Int} Length of array or null on failure.
	 */
	getSubstancesCount: function()
	{
		return this.getComponentItemCount(Kekule.ReactionComponent.SUBSTANCE);
	},
	/**
	 * Get item count of {@link Kekule.Reaction#conditions} array.
	 * @return {Int} Length of array or null on failure.
	 */
	getConditionCount: function()
	{
		return this.getComponentItemCount(Kekule.ReactionComponent.CONDITION);
	},
	/**
	 * Get role map at index of {@link Kekule.Reaction#reactants}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object in array. Return null if not found.
	 */
	getReactantMapAt: function(index)
	{
		return this.getMapAt(Kekule.ReactionComponent.REACTANT, index);
	},
	/**
	 * Get role map at index of {@link Kekule.Reaction#products}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object in array. Return null if not found.
	 */
	getProductMapAt: function(index)
	{
		return this.getMapAt(Kekule.ReactionComponent.PRODUCT, index);
	},
	/**
	 * Get role map at index of {@link Kekule.Reaction#substances}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object in array. Return null if not found.
	 */
	getSubstanceMapAt: function(index)
	{
		return this.getMapAt(Kekule.ReactionComponent.SUBSTANCE, index);
	},
	/**
	 * Get role map at index of {@link Kekule.Reaction#conditions}.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object in array. Return null if not found.
	 */
	getConditionMapAt: function(index)
	{
		return this.getMapAt(Kekule.ReactionComponent.CONDITION, index);
	},
	/**
	 * Get map item at index of a {@link Kekule.Reaction#reactants} array.
	 * @param {Int} index Index in array.
	 * @return {Variant} Item in map object or null on failure.
	 */
	getReactantItemAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.REACTANT, index);
	},
	/**
	 * Get item at index of a {@link Kekule.Reaction#reactants} array.
	 * Same as {@like Kekule.Reaction#getReactantItemAt}.
	 * @param {Int} index Index in array.
	 * @return {Object} Reactant or null.
	 */
	getReactantAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.REACTANT, index);
	},
	/**
	 * Get map item at index of a {@link Kekule.Reaction#products} array.
	 * @param {Int} index Index in array.
	 * @return {Variant} Item in map object or null on failure.
	 */
	getProductItemAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.PRODUCT, index);
	},
	/**
	 * Get item at index of a {@link Kekule.Reaction#products} array.
	 * Same as {@like Kekule.Reaction#getProductItemAt}.
	 * @param {Int} index Index in array.
	 * @return {Object} Product or null.
	 */
	getProductAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.PRODUCT, index);
	},
	/**
	 * Get map item at index of a {@link Kekule.Reaction#substances} array.
	 * @param {Int} index Index in array.
	 * @return {Variant} Item in map object or null on failure.
	 */
	getSubstanceItemAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.SUBSTANCE, index);
	},
	/**
	 * Get item at index of a {@link Kekule.Reaction#substances} array.
	 * Same as {@like Kekule.Reaction#getSubstanceItemAt}.
	 * @param {Int} index Index in array.
	 * @return {Object} Product or null.
	 */
	getSubstanceAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.SUBSTANCE, index);
	},
	/**
	 * Get map item at index of a {@link Kekule.Reaction#conditions} array.
	 * @param {Int} index Index in array.
	 * @return {Variant} Item in map object or null on failure.
	 */
	getConditionItemAt: function(index)
	{
		return this.getMapItemAt(Kekule.ReactionComponent.CONDITION, index);
	},
	/**
	 * Get index of map object in {@link Kekule.Reaction#reactants} array.
	 * @param {Hash} map Map to find.
	 * @returns {Int} Index of map or -1 on failure.
	 */
	indexOfReactantMap: function(map)
	{
		return this.indexOfMap(Kekule.ReactionComponent.REACTANT, map);
	},
	/**
	 * Get index of map object in {@link Kekule.Reaction#products} array.
	 * @param {Hash} map Map to find.
	 * @returns {Int} Index of map or -1 on failure.
	 */
	indexOfProductMap: function(map)
	{
		return this.indexOfMap(Kekule.ReactionComponent.PRODUCT, map);
	},
	/**
	 * Get index of map object in {@link Kekule.Reaction#substances} array.
	 * @param {Hash} map Map to find.
	 * @returns {Int} Index of map or -1 on failure.
	 */
	indexOfSubstanceMap: function(map)
	{
		return this.indexOfMap(Kekule.ReactionComponent.SUBSTANCE, map);
	},
	/**
	 * Get index of map object in {@link Kekule.Reaction#conditions} array.
	 * @param {Hash} map Map to find.
	 * @returns {Int} Index of map or -1 on failure.
	 */
	indexOfConditionMap: function(map)
	{
		return this.indexOfMap(Kekule.ReactionComponent.CONDITION, map);
	},
	/**
	 * Get index of itemm in {@link Kekule.Reaction#reactants} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Int} Index of item or -1 on failure.
	 */
	indexOfReactant: function(item, role)
	{
		return this.indexOfItem(Kekule.ReactionComponent.REACTANT, item, role);
	},
	/**
	 * Get index of itemm in {@link Kekule.Reaction#products} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Int} Index of item or -1 on failure.
	 */
	indexOfProduct: function(item, role)
	{
		return this.indexOfItem(Kekule.ReactionComponent.PRODUCT, item, role);
	},
	/**
	 * Get index of itemm in {@link Kekule.Reaction#substances} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Int} Index of item or -1 on failure.
	 */
	indexOfSubstance: function(item, role)
	{
		return this.indexOfItem(Kekule.ReactionComponent.SUBSTANCE, item, role);
	},
	/**
	 * Get index of itemm in {@link Kekule.Reaction#conditions} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Int} Index of item or -1 on failure.
	 */
	indexOfCondition: function(item, role)
	{
		return this.indexOfItem(Kekule.ReactionComponent.CONDITION, item, role);
	},
	/**
	 * Append map to the {@link Kekule.Reaction#reactants} array. If already exists, append will not be done.
	 * @param {Hash} map Map object to append.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendReactantMap: function(map)
	{
		return this.appendMap(Kekule.ReactionComponent.REACTANT, map);
	},
	/**
	 * Append map to the {@link Kekule.Reaction#products} array. If already exists, append will not be done.
	 * @param {Hash} map Map object to append.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendProductMap: function(map)
	{
		return this.appendMap(Kekule.ReactionComponent.PRODUCT, map);
	},
	/**
	 * Append map to the {@link Kekule.Reaction#substances} array. If already exists, append will not be done.
	 * @param {Hash} map Map object to append.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendSubstanceMap: function(map)
	{
		return this.appendMap(Kekule.ReactionComponent.SUBSTANCE, map);
	},
	/**
	 * Append map to the {@link Kekule.Reaction#conditions} array. If already exists, append will not be done.
	 * @param {Hash} map Map object to append.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendConditionMap: function(map)
	{
		return this.appendMap(Kekule.ReactionComponent.CONDITION, map);
	},
	/**
	 * Append reactant, role, amount information to {@link Kekule.Reaction#reactants} array.
	 * @param {Variant} item
	 * @param {String} role Can be null to indicate with no explicit role.
	 * @param {Num} amount Coefficients of reactant in reaction.
	 * @param {Hash} additionalInfo Any addition information need to be inserted.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendReactant: function(item, role, amount, additionalInfo)
	{
		var info = additionalInfo || {};
		if (amount)
			info.amount = amount;
		return this.appendItem(Kekule.ReactionComponent.REACTANT, item, role, info);
	},
	/**
	 * Append product, role, amount information to {@link Kekule.Reaction#products} array.
	 * @param {Variant} item
	 * @param {String} role Can be null to indicate with no explicit role.
	 * @param {Num} amount Coefficients of product in reaction.
	 * @param {Hash} additionalInfo Any addition information need to be inserted.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendProduct: function(item, role, amount, additionalInfo)
	{
		var info = additionalInfo || {};
		if (amount)
			info.amount = amount;
		return this.appendItem(Kekule.ReactionComponent.PRODUCT, item, role, info);
	},
	/**
	 * Append substance, role, amount information to {@link Kekule.Reaction#substances} array.
	 * @param {Variant} item
	 * @param {String} role Can be null to indicate with no explicit role.
	 * @param {Num} amount Amount of substances.
	 * @param {Hash} additionalInfo Any addition information need to be inserted.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendSubstance: function(item, role, amount, additionalInfo)
	{
		var info = additionalInfo || {};
		if (amount)
			info.amount = amount;
		return this.appendItem(Kekule.ReactionComponent.SUBSTANCE, item, role, info);
	},
	/**
	 * Append condition, role, amount information to {@link Kekule.Reaction#conditions} array.
	 * @param {Variant} item
	 * @param {String} role Can be null to indicate with no explicit role.
	 * @param {Hash} additionalInfo Any addition information need to be inserted.
	 * @returns {Int} Index of map in array after appending.
	 */
	appendCondition: function(item, role, additionalInfo)
	{
		return this.appendItem(Kekule.ReactionComponent.CONDITION, item, role, info);
	},
	/**
	 * remove reactant at index of {@link Kekule.Reaction#reactants} array.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object removed or null on failure.
	 */
	removeReactantAt: function(index)
	{
		return this.removeMapAt(Kekule.ReactionComponent.REACTANT, index);
	},
	/**
	 * remove product at index of {@link Kekule.Reaction#products} array.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object removed or null on failure.
	 */
	removeProductAt: function(index)
	{
		return this.removeMapAt(Kekule.ReactionComponent.PRODUCT, index);
	},
	/**
	 * remove substance at index of {@link Kekule.Reaction#substances} array.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object removed or null on failure.
	 */
	removeSubstanceAt: function(index)
	{
		return this.removeMapAt(Kekule.ReactionComponent.SUBSTANCE, index);
	},
	/**
	 * remove condition at index of {@link Kekule.Reaction#conditions} array.
	 * @param {Int} index Index in array.
	 * @return {Hash} Map object removed or null on failure.
	 */
	removeConditionAt: function(index)
	{
		return this.removeMapAt(Kekule.ReactionComponent.CONDITION, index);
	},
	/**
	 * Remove map object from {@link Kekule.Reaction#reactants} array.
	 * @param {Hash} map Map to remove.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeReactantMap: function(map)
	{
		return this.removeMap(Kekule.ReactionComponent.REACTANT, map);
	},
	/**
	 * Remove map object from {@link Kekule.Reaction#products} array.
	 * @param {Hash} map Map to remove.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeProductMap: function(map)
	{
		return this.removeMap(Kekule.ReactionComponent.PRODUCT, map);
	},
	/**
	 * Remove map object from {@link Kekule.Reaction#substances} array.
	 * @param {Hash} map Map to remove.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeSubstanceMap: function(map)
	{
		return this.removeMap(Kekule.ReactionComponent.SUBSTANCE, map);
	},
	/**
	 * Remove map object from {@link Kekule.Reaction#conditions} array.
	 * @param {Hash} map Map to remove.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeConditionMap: function(map)
	{
		return this.removeMap(Kekule.ReactionComponent.CONDITION, map);
	},
	/**
	 * Remove reactant from {@link Kekule.Reaction#reactants} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeReactant: function(item, role)
	{
		return this.removeItem(Kekule.ReactionComponent.REACTANT, item, role);
	},
	/**
	 * Remove product from {@link Kekule.Reaction#products} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeProduct: function(item, role)
	{
		return this.removeItem(Kekule.ReactionComponent.PRODUCT, item, role);
	},
	/**
	 * Remove substance from {@link Kekule.Reaction#substances} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeSubstance: function(item, role)
	{
		return this.removeItem(Kekule.ReactionComponent.SUBSTANCE, item, role);
	},
	/**
	 * Remove condition from {@link Kekule.Reaction#conditions} array.
	 * @param {Variant} item Item to find.
	 * @param {String} role Role of item, set it to undefined to ignore role in searching.
	 *   Note: role can be null (not undefined) to search item with no explicit role.
	 * @returns {Hash} Map object removed or null on failure.
	 */
	removeCondition: function(item, role)
	{
		return this.removeItem(Kekule.ReactionComponent.CONDITION, item, role);
	},
	/**
	 * Clear all reactants from reaction.
	 */
	clearReactants: function()
	{
		return this.clearComponent(Kekule.ReactionComponent.REACTANT);
	},
	/**
	 * Clear all products from reaction.
	 */
	clearProducts: function()
	{
		return this.clearComponent(Kekule.ReactionComponent.PRODUCT);
	},
	/**
	 * Clear all substances from reaction.
	 */
	clearSubstance: function()
	{
		return this.clearComponent(Kekule.ReactionComponent.SUBSTANCE);
	},
	/**
	 * Clear all conditions from reaction.
	 */
	clearConditions: function()
	{
		return this.clearComponent(Kekule.ReactionComponent.CONDITION);
	},
	/**
	 * Clear all molecule/condition info from reaction.
	 */
	clearAll: function()
	{
		this.clearProducts();
		this.clearProducts();
		this.clearSubstance();
		this.clearConditions();
	},


	/**
	 * Return all bonds in structure as well as in sub structure.
	 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
	 */
	getAllContainingConnectors: function()
	{
		var C = Kekule.ReactionComponent;
		var comps = [C.REACTANT, C.PRODUCT, C.SUBSTANCE];
		var result = [];
		for (var i = 0, l = comps.length; i < l; ++i)
		{
			var comp = comps[i];
			for (var j = 0, k = this.getComponentItemCount(comp); j < k; ++j)
			{
				var item = this.getMapItemAt(comp, j);
				if (item.getAllContainingConnectors)
				{
					var a = mols[i].getAllContainingConnectors();
					if (a && a.length)
						result = result.concat(a);
				}
			}
		}
		return result;
	}
});

/**
 * A list of reactions.
 * @class
 * @augments Kekule.ChemObjList
 * @param {String} id Id of list.
 */
Kekule.ReactionList = Class.create(Kekule.ChemObjList,
/** @lends Kekule.ReactionList# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ReactionList',
	/** @private */
	/** @constructs */
	initialize: function($super, id)
	{
		$super(id, Kekule.Reaction);
	}
});