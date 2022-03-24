/**
 * @fileoverview
 * 3D renderer using three.js library.
 * @author Partridge Jiang
 */

/*
 * requires three.js
 * requires /render/kekule.utils.js
 * requires /render/kekule.render.base.js
 * requires /render/2d/kekule.render.renderer3D.js
 * requires /xbrowsers/kekule.x.js
 */
(function(){
"use strict";

var THREE_MODULE_NAME = 'three.js';
var THREE;

/** @ignore */
Kekule.Render.ThreeObjectCache = Class.create(
/** @lends Kekule.Render.ThreeObjectCache# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ThreeObjectCache',
	/**
	 * @ignore
	 */
	initialize: function()
	{
		this.cache = new Kekule.MapEx(true);  // non-weak, to keep objects
	},
	finalize: function()
	{
		this.cache.finalize();
		this.cache = null;
	},
	/** @private */
	createInstance: function(objClass, params)
	{
		return null;  // descendant need to override
	},
	/** @private */
	isSameParams: function(params1, params2)
	{
		if (params1.length !== params2.length)
		{
			return false;
		}
		for (var i = 0, l = params1.length; i < l; ++i)
		{
			if (!this.isParamEqual(params1[i], params2[i]))
			{
				return false;
			}
		}
		return true;
	},
	/** @private */
	isParamEqual: function(param1, param2)
	{
		var result = (param1 === param2);
		if (!result)
		{
			if (DataType.isObjectValue(param1) && DataType.isObjectValue(param2))
				result = Kekule.ObjUtils.equal(param1, param2);
		}
		return result;
	},
	/**
	 * add(geometryClass, scene, param1, param2...)
	 * @ignore
	 */
	add: function()
	{
		var a = Array.prototype.slice.call(arguments);
		var gClass = a.shift();
		var items = this.cache.get(gClass);
		if (!items)
		{
			items = [];
			this.cache.set(gClass, items);
		}
		var item = {'params': a};
		item.instance = this.createInstance(gClass, a);
		items.push(item);
		return item.instance;
	},
	/**
	 * get(geometryClass, scene, param1, param2...)
	 * @ignore
	 */
	get: function()
	{
		/*
		 * IMPORTANT: different Three scene must use different object cache!!!!
		 */
		var a = Array.prototype.slice.call(arguments);
		var gClass = a[0];
		var items = this.cache.get(gClass);
		if (items)
		{
			a.shift();
			for (var i = 0, l = items.length; i < l; ++i)
			{
				var params = items[i].params;
				if (this.isSameParams(params, a))
				{
					return items[i].instance;
				}
			}
			a.unshift(gClass);
		}

		// not found, create new
		return this.add.apply(this, a);
	}
});

/** @ignore */
Kekule.Render.ThreeGeometryCache = Class.create(Kekule.Render.ThreeObjectCache, {
	/** @private */
	CLASS_NAME: 'Kekule.Render.ThreeGeometryCache',
	/** @private */
	createInstance: function(objClass, params)
	{
		var instance = null;
		var a = params;
		// unshift scene param
		//var scene = a.shift();
		var scene = a[0];
		switch (objClass)
		{
			case THREE.SphereGeometry:
				//instance = new THREE.SphereGeometry(a[0], a[1], a[2]);
				instance = new THREE.SphereGeometry(a[1], a[2], a[3]);
				break;
			case THREE.CylinderGeometry:
				//instance = new THREE.CylinderGeometry(a[0], a[1], a[2], a[3], a[4], a[5]);
				instance = new THREE.CylinderGeometry(a[1], a[2], a[3], a[4], a[5], a[6]);
				break;
		}
		//a.unshift(scene);
		return instance;
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Render.ThreeGeometryCache);

/** @ignore */
Kekule.Render.ThreeMaterialCache = Class.create(Kekule.Render.ThreeObjectCache, {
	/** @private */
	CLASS_NAME: 'Kekule.Render.ThreeMaterialCache',
	/** @private */
	createInstance: function(objClass, params)
	{
		//return new objClass(params[0]);
		// param[0] is scene data, param[1] is material data
		return new objClass(params[1]);
	}
});
Kekule.ClassUtils.makeSingleton(Kekule.Render.ThreeMaterialCache);

/**
 * A combination of context, camera and renderer of three.js.
 * @class
 */
Kekule.Render.ThreeContext = Class.create(ObjectEx,
/** @lends Kekule.Render.ThreeContext# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ThreeContext',
	/** @constructs */
	initialize: function(/*$super, */scene, camera, lights, renderer)
	{
		this.tryApplySuper('initialize')  /* $super() */;
		this.setScene(scene);
		this.setCamera(camera);
		this.setLights(lights);
		this.setRenderer(renderer);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('scene', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('camera', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('lights', {'dataType': DataType.ARRAY, 'serializable': false});
		this.defineProp('renderer', {'dataType': DataType.OBJECT, 'serializable': false});
		this.defineProp('width', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
		this.defineProp('height', {'dataType': DataType.INT, 'serializable': false, 'setter': null});
	},

	/**
	 * Get width and height of context.
	 * @returns {Hash} {width, height}
	 */
	getDimension: function()
	{
		return {'width': this.getWidth(), 'height': this.getHeight()};
	},

	/**
	 * Set width and height of context.
	 * @param {Int} width
	 * @param {Int} height
	 */
	setDimension: function(width, height)
	{
		this.setPropStoreFieldValue('width', width);
		this.setPropStoreFieldValue('height', height);
		this.getRenderer().setSize(width, height);

		var c = this.getCamera();

		if (c instanceof THREE.OrthographicCamera)
		{
			c.left = width / -2;
			c.right = width / 2;
			c.top = height / 2;
			c.bottom = height / -2;
		}
		else  // c instanceof THREE.PerspectiveCamera
		{
			c.aspect = width / height;
		}
		c.updateProjectionMatrix();  // IMPORTANT, otherwise there may be stretch in drawing
		// TODO:  need to repaint?
		//this.getRenderer().render(this.getScene(), this.getCamera());
	}
});

/**
 * Render bridge class of three.js.
 * In this bridge, context is a {@link Kekule.Render.ThreeContext} object, thus we can handle both scene and camera at the same time.
 * @argument {Kekule.Render.Abstract3DDrawBridge}
 * @class
 */
Kekule.Render.ThreeRendererBridge = Class.create(Kekule.Render.Abstract3DDrawBridge,
/** @lends Kekule.Render.ThreeRendererBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ThreeRendererBridge',
	/** @private */
	_qualitySettings: [
		null,
		// EXTREME_LOW
		{
			'sphereSegments': 6,
			'sphereRings': 6,
			'cylinderSegmentsRadius': 6
		},
		// LOW
		{
			'sphereSegments': 8,
			'sphereRings': 8,
			'cylinderSegmentsRadius': 8
		},
		// MEDIUM
		{
			'sphereSegments': 16,
			'sphereRings': 16,
			'cylinderSegmentsRadius': 16
		},
		// HIGH
		{
			'sphereSegments': 32,
			'sphereRings': 32,
			'cylinderSegmentsRadius': 32
		},
		// EXTREME_HIGH
		{
			'sphereSegments': 64,
			'sphereRings': 64,
			'cylinderSegmentsRadius': 64
		}
	],
	/** @constructs */
	initialize: function()
	{
		this.geometryCache = Kekule.Render.ThreeGeometryCache.getInstance();
		this.materialCache = Kekule.Render.ThreeMaterialCache.getInstance();
		this._quality = null;  // used internally
		this._modelParams = {};
		this._webglEnabled = true;  // assume first
	},
	/** @ignore */
	finalize: function()
	{
		//this.geometryCache.finalize();
		this.geometryCache = null;
		//this.materialCache.finalize();
		this.materialCache = null;
	},

	getGraphicQualityLevel: function()
	{
		return this._quality;
	},
	setGraphicQualityLevel: function(value)
	{
		if (this._webglEnabled)
			this._quality = value;
		else
			this._quality = Kekule.Render.Render3DGraphicQuality.EXTREME_LOW;  // always use low quality when webgl is not available
		this._modelParams = this.calcModelParams(this._quality);
	},
	/** @private */
	_updateGraphicQualityLevel: function()
	{
		if (!this._webglEnabled)
			this.setGraphicQualityLevel(Kekule.Render.Render3DGraphicQuality.EXTREME_LOW);  // always use low quality when webgl is not available
	},
	calcModelParams: function(qualityLevel)
	{
		var result = this._qualitySettings[qualityLevel];
		if (!result)
			result = this._qualitySettings[Kekule.Render.Render3DGraphicQuality.MEDIUM];  // default setting
		return result;
	},

	/** @private */
	getInitialLightPositions: function(context)
	{
		return [{'x': 5, 'y': 5, 'z': 10}];
	},

	/**
	 * Create a context element for drawing.
	 * @param {Element} parentElem
	 * @param {Int} width Width of context, in px.
	 * @param {Int} height Height of context, in px.
	 * @param {Hash} params Additional WebGL or 2DCanvas params, e.g. {antialias: true}
	 * @returns {Object} Context used for drawing.
	 */
	createContext: function(parentElem, width, height, params)
	{
		var BF = Kekule.BrowserFeature;
		var createOps = {
			preserveDrawingBuffer: true,  // use to enable screenshot
			alpha: true,
			antialias: true
		};
		if (params)
		{
			createOps = Object.extend(createOps, params);
		}

		var renderer = BF.webgl?
				new THREE.WebGLRenderer(createOps):
			BF.canvas?
				new THREE.CanvasRenderer(createOps):
				new THREE.SVGRenderer(createOps);

		var camera =
			new THREE.PerspectiveCamera();
		camera.fov = 5;  // very small fov to avoid too much morphs

		this._webglEnabled = (renderer instanceof THREE.WebGLRenderer);
		this._updateGraphicQualityLevel();

		// TODO: OrthographicCamera currently unavailable, as left/right/top/bottom need further calculation
		/*
		var camera =
			new THREE.OrthographicCamera();
		*/

		var scene = new THREE.Scene();
		scene.add(camera);
		renderer.setSize(width, height);

		// TODO: now light is fixed
		var lightPositions = this.getInitialLightPositions();
		var lights = [];
		for (var i = 0, l = lightPositions.length; i < l; ++i)
		{
			var alight = new THREE.DirectionalLight(0xcccccc, 1, 10, true);
			var lightCoord = lightPositions[i];
			alight.position.set(lightCoord.x, lightCoord.y, lightCoord.z);
			scene.add(alight);
			lights.push(alight);
		}

		/*
		var alight = new THREE.DirectionalLight(0xcccccc, 1, 10, true);
		alight.position.set(-5, -5, -10);
		scene.add(alight);
		*/

		var alight = new THREE.AmbientLight( 0x202020 ); // soft white light
		scene.add(alight);

		parentElem.appendChild(renderer.domElement);

		var result = new Kekule.Render.ThreeContext(scene, camera, lights, renderer);
		/*
		result.setWidth(width);
		result.setHeight(height);
		*/
		result.setDimension(width, height);

		return result;
	},

	/**
	 * Destroy context created.
	 * @param {Object} context
	 */
	releaseContext: function(context)
	{
		var elem = this.getContextElem(context);
		context.finalize();
		if (elem)
			elem.parentNode.removeChild(elem);
	},

	/**
	 * Get context related element.
	 * @param {Object} context
	 */
	getContextElem: function(context)
	{
		return context? context.getRenderer().domElement: null;
	},

	/**
	 * Get width and height of context.
	 * @param {Object} context
	 * @returns {Hash} {width, height}
	 */
	getContextDimension: function(context)
	{
		return {'width': context.getWidth(), 'height': context.getHeight()};
	},

	/**
	 * Set new width and height of context.
	 * Note in canvas, the content should be redrawn after resizing.
	 * @param {Object} context
	 * @param {Int} width
	 * @param {Int} height
	 */
	setContextDimension: function(context, width, height)
	{
		context.setDimension(width, height);
	},

	/**
	 * Transform a context based coord to screen based one (usually in pixel).
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformContextCoordToScreen: function(context, coord)
	{
		var dim = context.getDimension();
		// TODO: need 3D projector calculation
		return {'x': coord.x + dim.width / 2, 'y': coord.y + dim.height / 2};
	},
	/**
	 * Transform a screen based coord to context based one.
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformScreenCoordToContext: function(context, coord)
	{
		var dim = context.getDimension();
		// TODO: need 3D projector calculation
		return {'x': coord.x - dim.width / 2, 'y': coord.y - dim.height / 2, 'z': 0};
	},

	/**
	 * Clear the whole context.
	 * @param {Object} context
	 */
	/*
	clearContext: function(context)
	{
		context.clear();
	},
	*/

	/**
	 * Indicate whether this bridge and context can change glyph content or position after drawing it.
	 * Raphael is a typical environment of this type while canvas should returns false.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyGraphic: function(context)
	{
		return true;
	},

	/**
	 * @private
	 */
	colorStrToHex: function(str)
	{
		return Kekule.StyleUtils.colorStrToValue(str);
	},
	/** @private */
	createGroup: function(context)
	{
		var r = new THREE.Object3D();
		r.__objGroup__ = true;
		context.getScene().add(r);
		return r;
	},
	/** @private */
	addToGroup: function(elem, group)
	{
		group.add(elem);
		return group;
	},
	/** @private */
	removeFromGroup: function(elem, group)
	{
		group.remove(elem);
	},

	/** @private */
	setClearColor: function(context, color)
	{
		var r = context.getRenderer();
		if (r)
		{
			// TODO: now the clear color opacity is always 1
			if (r.setClearColor)   // in new version, setClearColorHex method has been removed
			{
				if (color)
					context.getRenderer().setClearColor(new THREE.Color(color), 1);
				else // color not set, transparent
					context.getRenderer().setClearColor(new THREE.Color(), 0);
			}
			else if (r.setClearColorHex)
			{
				if (color)
					context.getRenderer().setClearColorHex(this.colorStrToHex(color), 1);
				else // color not set, transparent
					context.getRenderer().setClearColorHex(null, 0);
			}
		}
	},

	/** @private */
	clearContext: function(context)
	{
	 	context.getScene().clearMesh();
	 	this.renderContext(context);
	},
	/** @private */
	renderContext: function(context)
	{
		context.getRenderer().render(context.getScene(), context.getCamera());
	},

	/** @private */
	drawSphere: function(context, coord, radius, options)
	{
		// DONE: seqments and rings are fixed now
		var segments = this._modelParams.sphereSegments;  //16;
		var rings = this._modelParams.sphereRings;   //16;

		// create a sphere mesh
		var geometry = this.geometryCache.get(THREE.SphereGeometry, context.getScene(), /*radius*/1, segments, rings);
		var material = this.materialCache.get(THREE.MeshLambertMaterial, context.getScene(),
			{'color': this.colorStrToHex(options.color), 'opacity': options.opacity || 1});
		var result = new THREE.Mesh(geometry,	material);

		result.scale.x = radius;
		result.scale.y = radius;
		result.scale.z = radius;

		result.position.x = coord.x;
		result.position.y = coord.y;
		result.position.z = coord.z;
		context.getScene().add(result);

		return result;
	},

	/** @private */
	drawLine: function(context, coord1, coord2, options)
	{
		var icolor = this.colorStrToHex(options.color);

		var lineMat = this.materialCache.get(THREE.LineBasicMaterial, context.getScene(),
			{ 'color': this.colorStrToHex(options.color), 'opacity': options.opacity || 1, linewidth: options.lineWidth || 1});

		var geom = new THREE.Geometry();
		geom.vertices.push(new THREE.Vector3(coord1.x, coord1.y, coord1.z));
		geom.vertices.push(new THREE.Vector3(coord2.x, coord2.y, coord2.z));

		var line = new THREE.Line(geom, lineMat);
		context.getScene().add(line);
		return line;
	},

	/** @private */
	drawCylinder: function(context, coord1, coord2, radius, options)
	{
		//console.log('Draw sphere at', coord1, coord2);
		var C = Kekule.CoordUtils;
		var segmentsRadius = this._modelParams.cylinderSegmentsRadius; //16;
		var segmentsHeight = 1;
		var height = C.getDistance(coord1, coord2);
		//var geometry = this.geometryCache.get(THREE.CylinderGeometry, context.getScene(), radius, radius, 1/*height*/, segmentsRadius, segmentsHeight, true);  // open ended
		var geometry = this.geometryCache.get(THREE.CylinderGeometry, context.getScene(), 1, 1, 1/*height*/, segmentsRadius, segmentsHeight, true);  // open ended
		var material = this.materialCache.get(THREE.MeshLambertMaterial, context.getScene(),
			{'color': this.colorStrToHex(options.color), 'opacity': options.opacity || 1});
		var result = new THREE.Mesh(geometry,	material);
		// adjust length
		result.scale.y = height;

		result.scale.x = radius;
		result.scale.z = radius;


		// adjust rotation
		var quaternion = Kekule.ObjUtils.isUnset(options.quaternion)? this._calcQuaternion(coord1, coord2): options.quaternion;

		if (quaternion)
		{
			if (result.applyQuaternion)  // new version of THREE
				result.applyQuaternion(quaternion);
			else  // old version
			{
				result.useQuaternion = true;
				result.quaternion = quaternion;
				result.updateMatrix();
			}
		}

		// adjust position
		result.position.x = (coord1.x + coord2.x) / 2;
		result.position.y = (coord1.y + coord2.y) / 2;
		result.position.z = (coord1.z + coord2.z) / 2;

		context.getScene().add(result);
		return result;
	},

	/** @private */
	drawParallelCylinders: function(context, cylinderInfos, drawEndCaps)
	{
		var C = Kekule.CoordUtils;
		// calculate rotation quaternion for all cylinders
		var first = cylinderInfos[0];
		var quaternion = this._calcQuaternion(first.coord1, first.coord2);
		// since all cylinders are parallel, quaternion are all the same
		// just calc once will save a lot of time
		var result = this.createGroup(context);
		for (var i = 0, l = cylinderInfos.length; i < l; ++i)
		{
			var info = cylinderInfos[i];
			var obj = this.drawCylinder(context, info.coord1, info.coord2, info.radius,
				{'color': info.color, 'quaternion': quaternion, 'opacity': info.opacity});
			//result.push(obj);
			this.addToGroup(obj, result);
		}

		// then draw small caps of cylinder if needed
		if (drawEndCaps)
		{
			var capCoords;
			for (var i = 0, l = cylinderInfos.length; i < l; ++i)
			{
				var info = cylinderInfos[i];
				if (Kekule.ObjUtils.isUnset(info.jointCoordIndex))  // both end need cap
					capCoords = [info.coord1, info.coord2];
				else
				{
					capCoords = (info.jointCoordIndex === 1)? [info.coord2]: [info.coord1];
				}
				// draw small spheres at end of cylinder
				for (var j = 0, k = capCoords.length; j < k; ++j)
				{
					var obj = this.drawSphere(context, capCoords[j], info.radius, {'color': info.color, 'opacity': info.opacity});
					//result.push(obj);
					this.addToGroup(obj, result);
				}
			}
		}

		return result;
	},

	/** @private */
	removeDrawnElem: function(context, elem)
	{
		if (elem.parent && elem.parent.remove)
			elem.parent.remove(elem);
	},

	/** @private */
	_calcQuaternion: function(coord1, coord2)
	{
		var C = Kekule.CoordUtils;
		var alignVector = C.substract(coord2, coord1);  // direction vector of cylinder
		if (alignVector.x || alignVector.z)  // not to y-axis direction
		{
			var crossVector = {'x': alignVector.z, 'y': 0, 'z': -alignVector.x};
			crossVector = C.standardize(crossVector);
			var angle = Math.atan2(Math.sqrt(Math.sqr(alignVector.x) + Math.sqr(alignVector.z)), alignVector.y);
			var halfAngle = angle / 2;
			var cosHalf = Math.cos(halfAngle);
			var sinHalf = Math.sin(halfAngle);
			var quaternion = new THREE.Quaternion(sinHalf * crossVector.x, sinHalf * crossVector.y,
				sinHalf * crossVector.z, cosHalf);
			return quaternion;
		}
		else
			return null;
	},

	// methods about light
	/**
	 * Returns count of lights in context.
	 * @param {Object} context
	 * @returns {Int}
	 */
	getLightCount: function(context)
	{
		var ls = context.getLights();
		return ls? (ls.length || 0): 0;
	},
	/**
	 * Get properties of light at index.
	 * @param {Object} context
	 * @param {Int} lightIndex
	 * @returns {Hash}
	 */
	getLightProps: function(context, lightIndex)
	{
		var light = context.getLights()[lightIndex];
		return {'position': light.position};
	},
	/**
	 * Get properties of light at index.
	 * @param {Object} context
	 * @param {Int} lightIndex
	 * @param {Hash} props
	 */
	setLightProps: function(context, lightIndex, props)
	{
		var light = context.getLights()[lightIndex];
		var p = props.position;
		if (p)
		{
			light.position.x = p.x;
			light.position.y = p.y;
			light.position.z = p.z;
		}
		light.updateMatrix();
	},

	// methods about camera
	/**
	 * Returns properties of current camera, including position(coord), fov, aspect and so on.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	getCameraProps: function(context)
	{
		var c = context.getCamera();
		// the fov of Three is based on height (vertical), so we need to calc and report fov of other directions
		var fovVertical = c.fov * Math.PI / 180;
		var fovHorizontal = fovVertical * (c.aspect || 1);
		var fovMin = Math.min(fovVertical, fovHorizontal);
		return {'position': c.position,	'fov': fovVertical,	'aspect': c.aspect,
			'fovVertical': fovVertical, 'fovHorizontal': fovHorizontal, 'fovMin': fovMin,
			'left': c.left, 'right': c.right, 'top': c.top, 'bottom': c.bottom,
			'lookAtVector': c.lookAtVector, 'upVector': c.up};
		/*
		return {'position': c.position,	'fov': c.fov * Math.PI / 180,	'aspect': c.aspect,
			'left': c.left, 'right': c.right, 'top': c.top, 'bottom': c.bottom,
			'lookAtVector': c.lookAtVector, 'upVector': c.up};
		*/
	},
	/**
	 * Set properties of current camera, including position(coord), fov, aspect, lookAtVector and so on.
	 * @param {Object} context
	 * @param {Hash} props
	 */
	setCameraProps: function(context, props)
	{
		//console.log(props);

		var c = context.getCamera();
		var notUnset = Kekule.ObjUtils.notUnset;
		var p = props.position;

		if (p)
		{
			c.position.x = p.x;
			c.position.y = p.y;
			c.position.z = p.z;
		}

		if (notUnset(props.near))
			c.near = props.near;
		if (notUnset(props.far))
			c.far = props.far;

		// for perspective projection
		if (props.fov)
			c.fov = props.fov * 180 / Math.PI;
		if (props.aspect)
			c.aspect = props.aspect;
		// for orthographic projection
		if (notUnset(props.left))
			c.left = props.left;
		if (notUnset(props.top))
			c.top = props.top;
		if (notUnset(props.bottom))
			c.bottom = props.bottom;
		if (notUnset(props.right))
			c.right = props.right;
		if (notUnset(props.upVector))
		{
			var v = props.upVector;
			c.up = new THREE.Vector3(v.x, v.y, v.z);
		}
		if (notUnset(props.lookAtVector))
		{
			var v = props.lookAtVector;
			c.lookAt(new THREE.Vector3(v.x, v.y, v.z));
		}
		c.updateMatrix();
	},

	/** @ignore */
	exportToDataUri: function(context, dataType, options)
	{
		var renderer = context.getRenderer();
		if (THREE.SVGRenderer && (renderer instanceof THREE.SVGRenderer))
		{
			var domElem = context.getRenderer().domElement;
			//var svg = (new XMLSerializer()).serializeToString(domElem);
			var svg = DataType.XmlUtility.serializeNode(domElem);
			return 'data:image/svg+xml;base64,' + btoa(svg);
		}
		else  // canvas or webgl
		{
			var domElem = context.getRenderer().domElement;
			return domElem? domElem.toDataURL(dataType, options): null;
		}
	}
});
/**
 * Check if current environment supports Three.js drawing.
 * @returns {Bool}
 * @deprecated
 */
Kekule.Render.ThreeRendererBridge.isSupported = function()
{
	//var result = (typeof(Kekule.$jsRoot.THREE) !== 'undefined');
	var result = (typeof(Kekule.Render.getExternalModule(THREE_MODULE_NAME)) !== 'undefined');
	if (result)
	{
		var F = Kekule.BrowserFeature;
		result = F.webgl || F.canvas || F.svg;
	}
	return !!result;
	//return Kekule.Render.ThreeRendererBridge.CheckSupporting().isSupported;
};
/**
 * Returns the availability information of Three.js renderer.
 * @returns {Hash}
 */
Kekule.Render.ThreeRendererBridge.getAvailabilityInformation = function()
{
	var available = false;
	var threeLoaded = (typeof(Kekule.Render.getExternalModule(THREE_MODULE_NAME)) !== 'undefined');
	var F = Kekule.BrowserFeature;
	var webglAvailable = F.webgl;
	var fallbackAvailable = (F.canvas || F.svg);
	var msg = null;
	if (!threeLoaded)
	{
		msg = Kekule.$L('ErrorMsg.THREEJS_LIB_NOT_UNAVAILABLE');
	}
	else if (!webglAvailable && !fallbackAvailable)
	{
		msg = Kekule.$L('ErrorMsg.THREEJS_DRAWING_NOT_UNAVAILABLE');
	}
	else
		available = true;

	return {
		'available': available,
		'message': msg
	}
};

Kekule.Render.DrawBridge3DMananger.register(Kekule.Render.ThreeRendererBridge, 20);

/*
 * Check if current environment supports Three.js drawing.
 * This function will returns more detailed information than {@link Kekule.Render.ThreeRendererBridge.isSupported}.
 * @returns {Object} Info about supporting, including:
 *   {
 *     isSupported: Bool,
 *     message: If not supported, provides error message.
 *   }
 */
/*
Kekule.Render.ThreeRendererBridge.CheckSupporting = function()
{
	var msg;
	var isSupported = (typeof($jsRoot.THREE) !== 'undefined');
	if (!isSupported)  // Three.js lib not loaded
	{
		msg = Kekule.$L('ErrorMsg.LIB_THREE_JS_NOT_LOADED');
	}
	else  // lib loaded, check if 3D context is supported
	{
		var F = Kekule.BrowserFeature;
		isSupported = F.webgl || F.canvas || F.svg;
		if (!supported)
			msg = Kekule.$L('ErrorMsg.BROWSER_3D_DRAWING_NOT_SUPPORTED');
	}
	return {'isSupported': isSupported, 'message': msg};
};
*/

//Kekule.ClassUtils.makeSingleton(Kekule.Render.ThreeRendererBridge);


var _threeRegistered = function(){
	THREE = Kekule.externalResourceManager.getResource(THREE_MODULE_NAME);  // set the global variable used by classes
	//if (Kekule.$jsRoot.THREE)
	if (THREE)
	{
		if (!THREE.Object3D.prototype.clear)
			/** @ignore */
			THREE.Object3D.prototype.clear = function(){
				var children = this.children;
				for (var i = children.length - 1; i >= 0; i--)
				{
					var child = children[i];
					child.clear();
					this.remove(child);
				}
			};

		if (!THREE.Scene.prototype.clearMesh)
			/** @ignore */
			THREE.Scene.prototype.clearMesh = function()
			{
				var children = this.children;
				for (var i = children.length - 1; i >= 0; i--)
				{
					var child = children[i];
					if ((child instanceof THREE.Mesh) || (child instanceof THREE.Line)
						|| (child.__objGroup__))  // a special flag to indicate that this is a object created by createGroup
					{
						child.clear();
						this.remove(child);
					}
				}
			};
		Kekule.Render.DrawBridge3DMananger.register(Kekule.Render.ThreeRendererBridge, 20);
	}
};
var _threeUnregistered = function()
{
	//Kekule.Render.DrawBridge3DMananger.unregister(Kekule.Render.ThreeRendererBridge);
};

var _registerThree = function(threeRoot)
{
	Kekule.Render.registerExternalModule(THREE_MODULE_NAME, threeRoot);
};

var _tryRegisterThree = function()
{
	if (!_tryRegisterThree.registered)
	{
		if (Kekule.$jsRoot.THREE && Kekule.$jsRoot.THREE.Object3D)  // Three.js loaded
		{
			_registerThree(Kekule.$jsRoot.THREE);
			_tryRegisterThree.registered = true;
		}
	}
};

Kekule.externalResourceManager.on(THREE_MODULE_NAME + 'Registered', _threeRegistered);
Kekule.externalResourceManager.on(THREE_MODULE_NAME + 'Unregistered', _threeUnregistered);

// try register Three.js on execute and on DOM load
_tryRegisterThree();
Kekule.X.domReady(_tryRegisterThree);

})();