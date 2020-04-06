/**
 * @fileoverview
 * Utils to manage the external resources possiblely required by Kekule.js (e.g., Three.js, Raphael.js).
 * @author Partridge Jiang
 */


/*
 * requires /lan/classes.js
 * requires /core/kekule.root.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 */

(function(){

"use strict";

/**
 * Enumeration of external resource types.
 * @enum
 */
Kekule.ExternalResourceType = {
	JS_OBJ: 'jsObject',  // JavaScript Object
	STYLESHEET: 'stylesheet',
	DATA: 'data',
	OTHER: 'other'
};
Kekule.ExternalResourceType.DEFAULT = Kekule.ExternalResourceType.JS_OBJ;

/**
 * Internal manager of external resources.
 * User should not create instance of this class directly, use Kekule.ExternalResourceManager.getInstance() instead.
 * @class
 * @augments ObjectEx
 */
/**
 * Invoked when a new resource has been registered.
 * Event has field: {name, resource, resourceType}.
 * @name Kekule.ExternalResourceManager#resourceRegistered
 * @event
 */
/**
 * Invoked when a new resource has been unregistered.
 * Event has field: {name, resource, resourceType}.
 * @name Kekule.ExternalResourceManager#resourceUnregistered
 * @event
 */
Kekule.ExternalResourceManager = Class.create(ObjectEx,
/** @lends Kekule.ExternalResourceManager# */
{
	/** @private */
	CLASS_NAME: 'Kekule.ExternalResourceManager',
	/** @constructs */
	initialize: function(/*$super*/)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this.setPropStoreFieldValue('resources', {});
	},
	/** @private */
	doFinalize: function(/*$super*/)
	{
		this.setPropStoreFieldValue('resources', null);
		this.tryApplySuper('doFinalize')  /* $super() */;
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('resources', {
			'dataType': DataType.HASH, 'serializable': false,
			'setter': null,
		});  // private
	},

	/**
	 * Register an external resource.
	 * @param {String} name
	 * @param {Variant} resource
	 * @param {String} resourceType
	 * @param {Hash} options
	 */
	register: function(name, resource, resourceType, options)
	{
		var res = this.getResources();
		var old = res[name];
		if (old)  // already exists
		{
			this.unregister(name);   // unregister old first
		}
		res[name] = {'name': name, 'resource': resource, 'resourceType': resourceType || Kekule.ExternalResourceType.DEFAULT};

		this.invokeEvent('resourceRegistered', {'name': name, 'resource': resource, 'resourceType': resourceType});
		this.invokeEvent(name + 'Registered', {'name': name, 'resource': resource, 'resourceType': resourceType});
	},
	/**
	 * Unregister an external resource.
	 * @param name
	 */
	unregister: function(name)
	{
		var res = this.getResources();
		var old = res[name];
		if (old)  // already exists
		{
			var info = res[name];
			this.invokeEvent('resourceUnregistered', info);
			this.invokeEvent(name + 'Unregistered', info);
			delete res[name];
		}
	},

	/**
	 * Returns details of a resource item.
	 * @param {String} name
	 * @returns {Hash}
	 */
	getResourceDetails: function(name)
	{
		return this.getResources()[name];
	},
	/**
	 * Returns resource object of name.
	 * @param {String} name
	 * @returns {Variant}
	 */
	getResource: function(name)
	{
		var details = this.getResourceDetails(name);
		return details && details.resource;
	}
});


Kekule.ClassUtils.makeSingleton(Kekule.ExternalResourceManager);
Kekule.externalResourceManager = Kekule.ExternalResourceManager.getInstance();

})();