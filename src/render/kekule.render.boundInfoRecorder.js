/**
 * @fileoverview
 * This file contains a helper class to record all bound infos of basic object
 * during the rendering of chem object.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.common.js
 * requires /utils/kekule.utils.js
 * requires /render/kekule.render.utils.js
 * requires /render/kekule.render.base.js
 */

/**
 * A helper class to record all bound info during the renderering of a renderer or painter.
 *
 * NOTE: current implementation of this class use may hidden details of TwoTupleMapEx.
 * Should changed in the future.
 * @class
 * @augments ObjectEx
 * @param {Object} rendererOrPainter Renderer or painter that do the actual render job.
 *
 * @property {Array} boundInfos Bound infos recorded.
 * @property {Object} targetContext If this property is set, only bound info on this context will be recorded.
 */
/**
 * Invoked when a basic object (node, connector, glyph...) is drawn, updated or removed by renderer.
 *   event param of it has fields: {obj, parentObj, boundInfo, updateType}
 *   where boundInfo provides the bound box information of this object on context. It has the following fields:
 *   {
 *     context: drawing context object
 *     obj: drawn object
 *     parentObj: parent of drawn object
 *     boundInfo: a hash containing info of bound, including fields:
 *     {
	 *     shapeType: value from {@link Kekule.Render.MetaShapeType} or {@link Kekule.Render.Meta3DShapeType}.
 *     coords: [Array of coords]
 *   }
 *     updateType: add, modify or remove
 *   }
 *   boundInfo may also be a array for complex situation (such as multicenter bond): [boundInfo1, boundInfo2, boundInfo3...].
 *   Note that in removed event, boundInfo may be null.
 * @name Kekule.Render.BoundInfoRecorder#updateBasicDrawObject
 * @event
 */
Kekule.Render.BoundInfoRecorder = Class.create(ObjectEx,
/** @lends Kekule.Render.BoundInfoRecorder# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.BoundInfoRecorder',
	/** @constructs */
	initialize: function($super, rendererOrPainter)
	{
		$super();
		this.setPropStoreFieldValue('boundInfos', new Kekule.TwoTupleMapEx(true));
		this._renderer = rendererOrPainter;  // used internally
		//console.log('boundInfoCreated', rendererOrPainter);
		this.installEventListener(rendererOrPainter);
	},
	/** @ignore */
	finalize: function($super)
	{
		var infos = this.getPropStoreFieldValue('boundInfos');
		if (infos)
			infos.clear();
		$super();
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('boundInfos', {'dataType': 'Kekule.TwoTupleMapEx', 'serializable': false, 'setter': null});
		this.defineProp('targetContext', {'dataType': DataType.OBJECT, 'serializable': false});
	},

	/** @private */
	needRecordOnContext: function(context)
	{
		var target = this.getTargetContext();
		return (!target) || (target === context);
	},

	/** @private */
	installEventListener: function(renderer)
	{
		renderer.addEventListener('updateBasicDrawObject', function(e)
			{
				var OT = Kekule.Render.ObjectUpdateType;
				if (this.needRecordOnContext(e.context))
				{
					var utype = e.updateType;
					if (utype === OT.ADD)
						this.add(e.context, e.obj, e.parentObj, e.boundInfo, e.target);
					else if (utype === OT.MODIFY)
						this.modify(e.context, e.obj, e.parentObj, e.boundInfo, e.target);
					else if (utype === OT.REMOVE)
					{
						//console.log('object removed', e.obj.getClassName());
						this.remove(e.context, e.obj);
					}
					else if (utype === OT.CLEAR)
						this.clear(e.context);
					//console.log(utype, e.context.canvas.parentNode.className, e.obj.getClassName(), e.parentObj.getClassName(), e.boundInfo);
					/*
					if (!e.boundInfo)
						console.log('no boundInfo', e);
					*/
					this.invokeEvent('updateBasicDrawObject', e);
				}
			}, this
		);
		renderer.addEventListener('clear', function(e)
			{
				//console.log('[RECEIVE CLEAR]', e.target.getClassName());
				if (this.needRecordOnContext(e.context))
					//this.clear(e.context);
					this.clearOnRenderer(e.context, e.target);
				var infos = this.getAllRecordedInfoOfContext(e.context);
				//console.log(infos.length, infos);
			}, this
		);
	},

	/**
	 * Returns recorded info item of obj in context.
	 * @param {Object} context
	 * @param {Object} obj
	 * @returns {Object}
	 */
	getInfo: function(context, obj)
	{
		return this.getBoundInfos().get(context, obj);
	},
	/**
	 * Returns recorded info items based on object, or based on all children of parent object.
	 * @param {Object} context
	 * @param {Object} objOrParentObj
	 * @returns {Array}
	 */
	getBelongedInfos: function(context, objOrParentObj)
	{
		var info = this.getInfo(context, objOrParentObj);
		if (info)
			return [info];
		else  // info map to obj not found, search all infos and check parent objects
		{
			var result = [];
			var infos = this.getAllRecordedInfoOfContext(context);
			for (var i = 0, l = infos.length; i < l; ++i)
			{
				var info = infos[i];
				var currObj = info.obj;
				if (currObj.isChildOf(objOrParentObj))
				{
					result.push(info);
				}
			}
			return result;
		}
	},
	/**
	 * Returns recorded bound info of obj in context.
	 * If direct bound not found, this method will return the container box of all bound info of obj's children.
	 * @param {Object} context
	 * @param {Object} obj
	 * @returns {Object}
	 */
	getBound: function(context, obj)
	{
		var info = this.getInfo(context, obj);
		var result = info? info.boundInfo: null;

		if (!result)
		{
			var BU = Kekule.BoxUtils;
			var MU = Kekule.Render.MetaShapeUtils;
			var infos = this.getBelongedInfos(context, obj);
			var containerBox = null;
			for (var i = 0, l = infos.length; i < l; ++i)
			{
				var info = infos[i];
				var box = MU.getContainerBox(info.boundInfo, 0);
				containerBox = containerBox? BU.getContainerBox(containerBox, box): box;
			}
			if (containerBox)
			{
				result = MU.createShapeInfo(Kekule.Render.MetaShapeType.RECT,
					[{'x': containerBox.x1, 'y': containerBox.y1},
					{'x': containerBox.x2, 'y': containerBox.y2}]
				);
				//console.log(containerBox, result, MU.getContainerBox(result, 0));
			}
		}

		return result;
	},

	/**
	 * Clear recorded info of renderer on context.
	 * @param {Object} context
	 * @param {Object} renderer
	 */
	clearOnRenderer: function(context, renderer)
	{
		var infos = this.getBoundInfos();
		var map = infos.getSecondLevelMap(context);
		if (map)
		{
			var objs = map.getKeys();
			var infos = map.getValues();
			//console.log('before remove: ', objs.length);
			//var count = 0;
			for (var i = objs.length - 1; i >= 0; --i)
			{
				var obj = objs[i];
				var info = infos[i];
				if (info.renderer === renderer)
				{
					map.remove(obj);
					//++count;
					//console.log('<clear info on renderer>', renderer.getClassName(), obj.getClassName());
				}
			}
			//console.log('after remove: ', objs.length, count);
		}
	},
	/**
	 * Clear bound infos in a context.
	 * @param {Object} context
	 */
	clear: function(context)
	{
		var infos = this.getBoundInfos();
		var map = infos.getSecondLevelMap(context);
		if (map)
			map.clear();
		return this;
	},
	/**
	 * Clear bound infos in all context.
	 */
	clearAll: function()
	{
		this.getBoundInfos().clear();  // clear all info
		return this;
	},
	/**
	 * Add an info item to list.
	 * @param {Object} context
	 * @param {Object} obj
	 * @param {Object} parentObj
	 * @param {Object} boundInfo
	 * @param {Object} renderer
	 */
	add: function(context, obj, parentObj, boundInfo, renderer)
	{
		this.getBoundInfos().set(context, obj, {'obj': obj, 'parentObj': parentObj, 'boundInfo': boundInfo, 'renderer': renderer});
		return this;
	},
	/**
	 * Modify bound info in list.
	 * @param {Object} context
	 * @param {Object} obj
	 * @param {Object} parentObj
	 * @param {Object} boundInfo
	 * @param {Object} renderer
	 */
	modify: function(context, obj, parentObj, boundInfo, renderer)
	{
		var item = this.getBoundInfos().get(context, obj);
		if (!item)
		{
			item = {};
			this.getBoundInfos.set(context, obj, item);
		}
		//this.getBoundInfos().set(context, obj, boundInfo);
		var notUnset = Kekule.ObjUtils.notUnset;
		if (notUnset(parentObj))
			item.parentObj = parentObj;
		if (notUnset(boundInfo))
			item.boundInfo = boundInfo;
		if (notUnset(renderer))
			item.renderer = renderer;
		return this;
	},
	/**
	 * Remove an info item in map.
	 * @param {Object} context
	 * @param {Object} obj
	 * @param {Object} parentObj
	 */
	remove: function(context, obj, parentObj)
	{
		this.getBoundInfos().remove(context, obj);
		return this;
	},

	/**
	 * Returns an array that contains bound / obj / parentObj / renderer information in a certain context.
	 * @param {Object} context
	 * @returns {Array}
	 */
	getAllRecordedInfoOfContext: function(context)
	{
		var infos = this.getBoundInfos();
		var map = infos.getSecondLevelMap(context);
		if (!map)
			return [];
		else
		{
			// since this is not a weak map, we can get its array properties
			return map.values; // TODO: here we use the internal structure of map, should change in the future
		}
	},
	/**
	 * Returns an bound info array in a certain context.
	 * @param {Object} context
	 * @returns {Array}
	 */
	getAllBoundInfosOfContext: function(context)
	{
		var infos = this.getAllRecordedInfoOfContext(context);
		var result = [];
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var boundInfo = infos[i].boundInfo;
			if (boundInfo)
				result.push(boundInfo);
		}
		return result;
	},
	/**
	 * Returns a minimal box that can contains all drawn elements in context.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	getContainerBox: function(context)
	{
		var BU = Kekule.BoxUtils;
		var MU = Kekule.Render.MetaShapeUtils;
		var result = null;
		var infos = this.getAllBoundInfosOfContext(context);
		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var box = MU.getContainerBox(info[i], 0);
			result = BU.getContainerBox(result, box);
		}
		return result;
	},

	/**
	 * Get all intersected bound and related informations on coord.
	 * @param {Object} context
	 * @param {Hash} coord
	 * @param {Hash} refCoord This value is used in 3D mode. Passes null to it in 2D mode.
	 * @param {Int} inflation
	 * @returns {Array}
	 */
	getIntersectionInfos: function(context, coord, refCoord, inflation, filterFunc)
	{
		var result = [];
		// TODO: now only handles 2D itersection
		var infos = this.getAllRecordedInfoOfContext(context);

		for (var i = 0, l = infos.length; i < l; ++i)
		{
			var bound = infos[i].boundInfo;
			if (filterFunc && !filterFunc(infos[i]))
			{
				//console.log('filtered out', infos[i]);
				continue;
			}
			if (bound)
			{
				if (Kekule.Render.MetaShapeUtils.isCoordInside(coord, bound, inflation))
					result.push(infos[i]);
			}
		}
		return result;
	}
});
