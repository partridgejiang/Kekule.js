/**
 * @fileoverview
 * A default implementation of 3D molecule renderer.
 * @author Partridge Jiang
 */


/*
 * requires /core/kekule.common.js
 * requires /data/kekule.dataUtils.js
 * requires /utils/kekule.utils.js
 * requires /core/kekule.structures.js
 * requires /render/kekule.render.base.js
 * requires /render/kekule.render.utils.js
 * requires /localization/
 */

(function(){

var OU = Kekule.ObjUtils;
var BU = Kekule.BoxUtils;
var MDM = Kekule.Render.Molecule3DDisplayType;
var BRM = Kekule.Render.Bond3DRenderMode;
var BRT = Kekule.Render.Bond3DRenderType;
var BSM = Kekule.Render.Bond3DSpliceMode;
var NRM = Kekule.Render.Node3DRenderMode;
var oneOf = Kekule.oneOf;

/**
 * Different renderer should provide different methods to draw element on context.
 * Those different implementations are wrapped in draw bridge classes.
 * Concrete bridge classes do not need to deprived from this class, but they
 * do need to implement all those essential methods.
 *
 * In all drawXXX methods, parameter options contains the style information to draw color and so on.
 * It may contain the following fields:
 *   {
 *     color: String, '#rrggbb',
 *     opacity: Float, 0-1,
 *     lineWidth: Int (in drawLine method),
 *     withEndCaps: Bool (in drawCylinderEx)
 *   }
 *
 * In all drawXXX methods, coord are based on context (not directly on screen).
 *
 * @class
 */
Kekule.Render.Abstract3DDrawBridge = Class.create(
/** @lends Kekule.Render.Abstract3DDrawBridge# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Abstract3DDrawBridge',

	getGraphicQualityLevel: function()
	{
		return null;
	},
	setGraphicQualityLevel: function(value)
	{

	},
	/**
	 * Transform a 3D context based coord to screen based one (usually 2D in pixel).
	 * @param {Object} context
	 * @param {Hash} coord
	 * @return {Hash}
	 */
	transformContextCoordToScreen: function(context, coord)
	{
		return {x: coord.x, y: coord.y};
	},

	/**
	 * Indicate whether this bridge and context can change glyph content or position after drawing it.
	 * Raphael is a typical environment of this type while canvas should returns false.
	 * @param {Object} context
	 * @returns {Bool}
	 */
	canModifyGraphic: function(context)
	{
		return false;
	},

	/**
	 * Create a context element for drawing.
	 * @param {Element} parentElem
	 * //@param {Int} contextOffsetX X coord of top-left corner of context, in px.
	 * //@param {Int} contextOffsetY Y coord of top-left corner of context, in px.
	 * @param {Int} width Width of context, in px.
	 * @param {Int} height Height of context, in px.
	 * @returns {Object} Context used for drawing.
	 */
	createContext: function(parentElem, width, height)
	{
		return null;
	},

	/**
	 * Get width and height of context.
	 * @param {Object} context
	 * @returns {Hash} {width, height}
	 */
	getContextDimension: function(context)
	{
		return {};
	},

	/**
	 * Set new width and height of context.
	 * @param {Object} context
	 * @param {Int} width
	 * @param {Int} height
	 */
	setContextDimension: function(context, width, height)
	{
		return null;
	},

	/**
	 * Clear the whole context.
	 * @param {Object} context
	 */
	clearContext: function(context)
	{
		return null;
	},

	/**
	 * Set background color of content.
	 * @param {Object} context
	 * @param {String} color Color in '#RRGGBB' mode. Null means transparent.
	 */
	setClearColor: function(context, color)
	{

	},

	drawSphere: function(context, coord, radius, options)
	{

	},
	drawCylinder: function(context, coord1, coord2, radius, options)
	{

	},
	/*
	drawParallelCylinders: function(context, cylinderInfos, drawEndCaps)
	{

	},
	*/
	drawLine: function(context, coord1, coord2, options)
	{

	},
	/*
	drawParallelLines: function(context, lineInfos)
	{

	}
	*/
	createDrawGroup: function(context)
	{

	},
	addToDrawGroup: function(elem, group)
	{

	},
	removeFromDrawGroup: function(elem, group)
	{

	},
	/**
	 * Returns properties of current camera, including position(coord), fov, aspect and so on.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	getCameraProps: function(context)
	{

	},
	/**
	 * Set properties of current camera, including position(coord), fov, aspect and so on.
	 * @param {Object} context
	 * @param {Hash} props
	 */
	setCameraProps: function(context, props)
	{

	},

	/**
	 * Export drawing content to a data URL for <img> tag to use.
	 * @param {Object} context
	 * @param {String} dataType Type of image data, e.g. 'image/png'.
	 * @param {Hash} options Export options, usually this is a number between 0 and 1
	 *   indicating image quality if the requested type is image/jpeg or image/webp.
	 * @returns {String}
	 */
	exportToDataUri: function(context, dataType, options)
	{

	}
});

/**
 * A base implementation of 2D chem object renderer.
 * You can call renderer.draw(context, chemObj, baseCoord, options) to draw the 2D structure,
 * where options can contain the settings of drawing style (strokeWidth, color...) and tranform params
 * (including scale, zoom, translate, rotateAngle, cameraPos...). The options can also have a autoCamera (Bool) field,
 * if autoCamera is true, the cameraPos value will be determinate by renderer.
 * Note: zoom is not the same as scale. When scale is set or calculated, zoom will multiply on it and get the actual scale ratio.
 *   for example, scale is 100 and zoom is 1.5, then the actual scale value will be 150.
 *
 * @augments Kekule.Render.AbstractRenderer
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Hash} options Options to draw object.
 * //@param {Object} renderConfigs Global configuration for rendering.
 * //  This property should be an instance of {@link Kekule.Render.Render3DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 *
 * @property {Object} drawBridge A object that implements the actual draw job. Read only.
 * @class
 */
Kekule.Render.Base3DRenderer = Class.create(Kekule.Render.AbstractRenderer,
/** @lends Kekule.Render.Base3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.Base3DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, /*renderConfigs,*/ parent)
	{
		$super(chemObj, drawBridge, /*renderConfigs,*/ parent);
		/*
		if (!renderConfigs)
			this.setRenderConfigs(Kekule.Render.getRender3DConfigs());  // use default config
		*/
		//this.setRenderConfigs(null);
	},
	/** @private */
	getRendererType: function()
	{
		return Kekule.Render.RendererType.R3D;
	},

	/** @private */
	getActualTargetContext: function(context)
	{
		return this.getRedirectContext() || context;
	},

	/**
	 * Returns properties of current camera, including position(coord), fov, aspect and so on.
	 * @param {Object} context
	 * @returns {Hash}
	 */
	getCameraProps: function(context)
	{
		return this.getDrawBridge().getCameraProps(context);
	},
	/**
	 * Set properties of current camera, including position(coord), fov, aspect and so on.
	 * @param {Object} context
	 * @param {Hash} props
	 */
	setCameraProps: function(context, props)
	{
		return this.getDrawBridge().setCameraProps(context, props);
	},

	/** @private */
	getInitialLightPositions: function(context)
	{
		return this.getDrawBridge().getInitialLightPositions && this.getDrawBridge().getInitialLightPositions(context);
	},
	/**
	 * Returns count of lights in context.
	 * @param {Object} context
	 * @returns {Int}
	 */
	getLightCount: function(context)
	{
		return this.getDrawBridge().getLightCount && this.getDrawBridge().getLightCount(context);
	},
	/**
	 * Get properties of light at index.
	 * @param {Object} context
	 * @param {Int} lightIndex
	 * @returns {Hash}
	 */
	getLightProps: function(context, lightIndex)
	{
		return this.getDrawBridge().getLightProps && this.getDrawBridge().getLightProps(context, lightIndex);
	},
	/**
	 * Get properties of light at index.
	 * @param {Object} context
	 * @param {Int} lightIndex
	 * @param {Hash} props
	 */
	setLightProps: function(context, lightIndex, props)
	{
		return this.getDrawBridge().setLightProps(context, lightIndex, props);
	},


	drawSphere: function(context, coord, radius, options)
	{
		return this.getDrawBridge().drawSphere(this.getActualTargetContext(context), coord, radius, options);
	},
	drawCylinder: function(context, coord1, coord2, radius, options)
	{
		var b = this.getDrawBridge();
		return b? b.drawCylinder(this.getActualTargetContext(context), coord1, coord2, radius, options): null;
	},
	drawCylinderEx: function(context, coord1, coord2, radius, options)
	{
		var result = null;
		var elem = this.drawCylinder(context, coord1, coord2, radius, options);
		if (elem && options.withEndCaps)
		{
			result = this.createDrawGroup(context);
			var cap = this.drawSphere(context, coord1, radius);
			this.addToDrawGroup(cap, result);
			var cap = this.drawSphere(context, coord2, radius);
			this.addToDrawGroup(cap, result);
		}
		return result || elem;
	},
	/**
	 * Draw a group of parallel cylinders.
	 * @param {Object} context
	 * @param {Object} cylinderInfos Information of each cylinder.
	 *   Contains fields: {coord1, coord2, radius, color}
	 * @param {Bool} drawEndCaps Whether draw small sphere cap at end of cylinder
	 *   TODO: this param currently not fully implemented
	 * @returns {Variant}
	 * @private
	 */
	drawParallelCylinders: function(context, cylinderInfos, drawEndCaps)
	{
		var b = this.getDrawBridge();
		if (b.drawParallelCylinders)
		{
			return b.drawParallelCylinders(this.getActualTargetContext(context), cylinderInfos, drawEndCaps);
		}
		else //if (b.drawCylinder)
		{
			var result = this.createDrawGroup(context);
			for (var i = 0, l = cylinderInfos.length; i < l; ++i)
			{
				var info = cylinderInfos[i];
				var obj = this.drawCylinderEx(context, info.coord1, info.coord2, info.radius,
					{'color': info.color, 'withEndCaps': drawEndCaps});
				this.addToDrawGroup(obj, result);
			}
			return result;
		}
	},

	drawLine: function(context, coord1, coord2, options)
	{
		var b = this.getDrawBridge();
		return b? b.drawLine(this.getActualTargetContext(context), coord1, coord2, options): null;
	},
	/**
	 * Draw a group of parallel lines.
	 * @param {Object} context
	 * @param {Object} lineInfos Information of each cylinder.
	 *   Contains fields: {coord1, coord2, lineWidth, color}
	 * @returns {Variant}
	 * @private
	 */
	drawParallelLines: function(context, lineInfos)
	{
		var b = this.getDrawBridge();
		if (b.drawParallelLines)
		{
			return b.drawParallelLines(this.getActualTargetContext(context), lineInfos, drawEndCaps);
		}
		else if (b.drawLine)
		{
			var count = lineInfos.length;
			/*
			if (count <= 0)
				return null;
			else if (count <= 1)
			{
				var info = lineInfos[0];
				return this.drawLine(context, info.coord1, info.coord2,
					{
						'lineWidth': info.lineWidth,
						'color': info.color
					});
			}
			else*/
			{
				var result = [];  //this.createDrawGroup(context);
				for (var i = 0; i < count; ++i)
				{
					var info = lineInfos[i];
					var elem = this.drawLine(context, info.coord1, info.coord2,
						{
							'lineWidth': info.lineWidth,
							'color': info.color,
							'opacity': info.opacity
						});
					//this.addToDrawGroup(elem, result);
					result.push(elem);
				}
				return result;
			}
		}
	},
	createDrawGroup: function(context)
	{
		return this.getDrawBridge().createGroup(this.getActualTargetContext(context));
	},
	addToDrawGroup: function(elem, group)
	{
		return this.getDrawBridge().addToGroup(elem, group);
	},
	removeFromDrawGroup: function(elem, group)
	{
		return this.getDrawBridge().removeFromGroup(elem, group);
	},

	/**
	 * Remove an element in context.
	 * @param {Object} context
	 * @param {Object} elem
	 */
	removeDrawnElem: function(context, elem)
	{
		// TODO: unfinished to remove drawn elem in 3D context
	}
});

/**
 * A base class to render a chem object in 3D.
 * @class
 * @augments Kekule.Render.Base3DRenderer
 */
Kekule.Render.ChemObj3DRenderer = Class.create(Kekule.Render.Base3DRenderer,
/** @lends Kekule.Render.ChemObj3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObj3DRenderer',

	/** @constructs */
	initialize: function($super, chemObj, drawBridge, parent)
	{
		$super(chemObj, drawBridge, parent);
		this._enableTransformByCamera = true;  // private flag, if rotation/zoom transform is achieved by camera position
	},

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		var o = this.getChemObj();
		if (o.getExposedContainerBox3D)
			return o.getExposedContainerBox3D(allowCoordBorrow);
		else if (o.getContainerBox3D)
			return o.getContainerBox3D(allowCoordBorrow);
		else
			return null;
	},

	/** @private */
	doEstimateRenderBox: function(context, baseCoord, options, allowCoordBorrow)
	{
		var objBox = this.estimateObjBox(context, options, allowCoordBorrow);
		if (objBox)  // a general approach is to scale the chem object box to context's scope
		{
			var p = this.prepareTransformParams(context, baseCoord, options, objBox);
			//var transformParams = this.getFinalTransformParams(context, p);
			var transformParams = p;  //.transformParams;
			return BU.transform3D(objBox, transformParams);
		}
		else
			return null;
	},

	/** @private */
	beginDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);
		//console.log('draw options', options);
		if (this.isRootRenderer())  // set graphic quality
		{
			var b = this.getDrawBridge();
			if (b && b.setGraphicQualityLevel)
			{
				//var level = oneOf(options.graphicQuality, this.getRenderConfigs().getEnvironmentConfigs().getGraphicQuality());
				var level = options.graphicQuality;
				//console.log(level, this.getRenderConfigs().getEnvironmentConfigs().getGraphicQuality());
				b.setGraphicQualityLevel(level);
			}
		}
	},
	/** @private */
	endDraw: function($super, context, baseCoord, options)
	{
		if (this.isRootRenderer())  // need to adjust camera pos
		{
			this.adjustCamera(context, options.transformParams);
		}
		$super(context, baseCoord, options);
	},

	/** @ignore */
	doDraw: function($super, context, baseCoord, options)
	{
		// since options passed by draw method is already proteced, we are not worry about change it here.
		this.prepareTransformParams(context, baseCoord, options);
		var result = $super(context, baseCoord, options);
	},

	/**
	 * Repaint with only geometry options changes (without the modification of chemobj or draw color/length settings).
	 * Sometimes this repainting can be achieved by the modify of camera position (without recalc the position of node and connectors)
	 * so that the speed may enhance greatly.
	 * @param {Object} context
	 * @param {Hash} newOptions
	 */
	changeGeometryOptions: function(context, baseCoord, newOptions)
	{
		var ops = Object.create(newOptions);
		var params = this.prepareTransformParams(context, baseCoord, ops);
		if (params.pureCameraTransform)  // now only adjust camera pos
		{
			//this.adjustCamera(context, params);
			this.endDraw(context, baseCoord, ops);
		}
		else
		{
			this.getDrawBridge().clearContext(context);
			this.draw(context, baseCoord, newOptions);
		}
	},

	/**
	 * Prepare 3D transform params from baseCoord and drawOptions.
	 * If drawOptions.transformParams already set, this method will do nothing.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @param {Hash} objBox
	 * @returns {Hash}
	 */
	prepareTransformParams: function(context, baseCoord, drawOptions, objBox)
	{
		var result;
		if (drawOptions.transformParams)
			result = drawOptions.transformParams;
		else
		{
			var p = this.generateTransformParams(context, baseCoord, drawOptions, objBox);
			drawOptions.transformParams = p;
			result = p;
		}

		var transformMatrix = Kekule.CoordUtils.calcTransform3DMatrix(result);
		var invTransformMatrix = Kekule.CoordUtils.calcInverseTransform3DMatrix(result);

		drawOptions.transformParams.transformMatrix = transformMatrix;
		drawOptions.transformParams.invTransformMtrix = invTransformMatrix;

		this.getRenderCache(context).transformParams = result;
		this.getRenderCache(context).transformMatrix = transformMatrix;
		this.getRenderCache(context).invTransformMatrix = invTransformMatrix;

		this.getRenderCache(context).transformParams = result;
		return result;
	},

	/** @private */
	canDoPureCameraTransform: function(context, transformParams)
	{
		var doCameraTransform = this._enableTransformByCamera
			&& (transformParams.scaleX === transformParams.scaleY) && (transformParams.scaleY === transformParams.scaleZ)
			&& (!transformParams.rotateAngle) && (!transformParams.rotateX) && (!transformParams.rotateY) && (!transformParams.rotateZ);
			//&& (!transformParams.translateX) && (!transformParams.translateY) && (!transformParams.translateZ);
		return doCameraTransform;
	},

	/**
	 * Calculate the coordinate transform options from drawOptions.
	 * Descendants can override this method.
	 * Note that unit length and zoom is not take into consideration in this method.
	 * @param {Object} context
	 * @param {Hash} baseCoord
	 * @param {Hash} drawOptions
	 * @param {Hash} objBox
	 * @returns {Hash}
	 */
	generateTransformParams: function(context, baseCoord, drawOptions, objBox)
	{
		//console.log('generate transform based on', baseCoord);
		var result = {};

		//var generalConfigs = this.getRenderConfigs().getGeneralConfigs();
		result.allowCoordBorrow = oneOf(drawOptions.allowCoordBorrow, /*generalConfigs.getAllowCoordBorrow(),*/ false);

		//var lengthConfigs = this.getRenderConfigs().getLengthConfigs();
		//var unitLength = lengthConfigs.getUnitLength() || drawOptions.unitLength;
		//result.unitLength = unitLength;
		result.unitLength = drawOptions.unitLength || 1;

		if (!objBox)
		{
			objBox = this.estimateObjBox(context, drawOptions, result.allowCoordBorrow);
			//console.log('OBJ BOX CALC', objBox);
		}
		var boxCenter = {'x': (objBox.x1 + objBox.x2) / 2, 'y': (objBox.y1 + objBox.y2) / 2, 'z': (objBox.z1 + objBox.z2) / 2};

		var O = Kekule.ObjUtils;

		if (O.isUnset(drawOptions.translateX) && O.isUnset(drawOptions.translateY) && O.isUnset(drawOptions.translateZ))  // if translate is set, baseCoord will be ignored
		{
			if (baseCoord)
			{
				result.translateX = baseCoord.x - boxCenter.x;
				result.translateY = baseCoord.y - boxCenter.y;
				result.translateZ = baseCoord.z || 0 - boxCenter.z || 0;
			}
		}
		else
		{
			result.translateX = drawOptions.translateX || 0;
			result.translateY = drawOptions.translateY || 0;
			result.translateZ = drawOptions.translateZ || 0;
		}

		result.zoom = drawOptions.zoom || 1;

		result.scaleX = oneOf(drawOptions.scaleX, drawOptions.scale, 1);
		result.scaleY = oneOf(drawOptions.scaleY, drawOptions.scale, 1);
		result.scaleZ = oneOf(drawOptions.scaleZ, drawOptions.scale, 1);

		//result.scaleY = -result.scaleY;

		var autoCalcScale = !(drawOptions.scaleX || drawOptions.scaleY || drawOptions.scaleZ || drawOptions.scale);

		// rotation
		if (OU.notUnset(drawOptions.rotateMatrix))
		{
			result.rotateMatrix = drawOptions.rotateMatrix;
		}
		else if (OU.notUnset(drawOptions.rotateAngle) && OU.notUnset(drawOptions.rotateAxisVector))
		{
			/*
			result.rotateAngle = drawOptions.rotateAngle;
			result.rotateAxisVector = drawOptions.rotateAxisVector;
			*/
			result.rotateMatrix = Kekule.CoordUtils.calcRotate3DMatrix({
				'rotateAngle': drawOptions.rotateAngle,
				'rotateAxisVector': drawOptions.rotateAxisVector
			});
		}
		else if (result.rotateX || result.rotateY || result.rotateZ)
		{
			/*
			result.rotateX = drawOptions.rotateX || 0;
			result.rotateY = drawOptions.rotateY || 0;
			result.rotateZ = drawOptions.rotateZ || 0;
			*/
			result.rotateMatrix = Kekule.CoordUtils.calcRotate3DMatrix({
				'rotateX': drawOptions.rotateX || 0,
				'rotateY': drawOptions.rotateY || 0,
				'rotateZ': drawOptions.rotateZ || 0
			});
		}

		if (O.isUnset(drawOptions.center))  // center not set, use center coord of Ctab
		{
			result.center = boxCenter;  // rotation center
		}

		// indicate the absolute center of drawn object
		if (baseCoord)
			result.drawBaseCoord = baseCoord;
		else
		{
			result.drawBaseCoord = Kekule.CoordUtils.transform3D(boxCenter, result);
		}

		var initialTransformOptions = Object.extend({}, result);
		result = this.getFinalTransformParams(context, result);
		result.initialTransformOptions = initialTransformOptions;

		var doCameraTransform = this.canDoPureCameraTransform(context, result);
		result.pureCameraTransform = doCameraTransform;

		if (this.isRootRenderer())  // is root renderer, have to calc camera info
		{
			if (drawOptions.autofit || (!drawOptions.cameraPos))
			{
				// TODO: now only consider autofit
				var inflation = this.getAutofitObjBoxInflation(context, this.getChemObj(), drawOptions);
				var obox = Kekule.BoxUtils.inflateBox(objBox, inflation.x, inflation.y, inflation.z);
				//var obox = objBox;
				//calculate camera position
				var w = Math.max(obox.x2 - obox.x1, obox.y2 - obox.y1);
				var cameraInfo = this.getCameraProps(context);

				var l = w / 2 / Math.tan(cameraInfo.fov / 2);
				var dis = Math.sqrt(Math.sqr(l) - Math.sqr(w / 2));

				//var doCameraRotation = false;
				// rotation and zoom can be done by the proper camera position adjustment
				if (doCameraTransform)   // adjust camera and lights
				{

					//console.log(dis, dis / result.zoom);
					dis = dis / result.scaleX;  // since camera transform is confirmed in prev code, we are sure scaleX=scaleY=scaleZ

					result.cameraWidth = w / result.scaleX;
					result.cameraHeight = result.cameraWidth;

					// calculate camera pos and up direction
					var vBaseCameraPos = Kekule.MatrixUtils.create(4, 1, [0, 0, 1, 1]);
					var vBaseCameraUp = Kekule.MatrixUtils.create(4, 1, [0, 1, 1, 1]);
					var vCameraPos, coordCameraPos;
					var vCameraUp, coordCameraUp;
					if (result.rotateMatrix)
					{
						// since result.rotateMatrix is based on object, camera rotation should be in opposite direction,
						// so the rotateMatrix should be transposed.
						var cameraRotateMatrix = Kekule.MatrixUtils.transpose(result.rotateMatrix);
						vCameraPos = Kekule.MatrixUtils.multiply(cameraRotateMatrix, vBaseCameraPos);
						vCameraUp = Kekule.MatrixUtils.multiply(cameraRotateMatrix, vBaseCameraUp);
						coordCameraPos = {'x': vCameraPos[0], 'y': vCameraPos[1], 'z': vCameraPos[2]};
						coordCameraUp = {'x': vCameraUp[0], 'y': vCameraUp[1], 'z': vCameraUp[2]};
					}
					else
					{
						coordCameraPos = {'x': 0, 'y': 0, 'z': 1};
						coordCameraUp = {'x': 0, 'y': 1, 'z': 1};
					}
					coordCameraPos = Kekule.CoordUtils.multiply(coordCameraPos, dis);
					result.cameraPos = {
						'x': coordCameraPos.x,  // + result.drawBaseCoord.x,
						'y': coordCameraPos.y,  // + result.drawBaseCoord.y,
						'z': coordCameraPos.z  // + result.drawBaseCoord.z
					};

					/*
					result.cameraLookAtVector = Kekule.CoordUtils.add(result.drawBaseCoord,
						{'x': result.translateX, 'y': result.translateY, 'z': result.translateZ});
					result.cameraPos = Kekule.CoordUtils.add(result.cameraPos, result.cameraLookAtVector);
					*/
					result.cameraPos = Kekule.CoordUtils.add(result.cameraPos, result.drawBaseCoord);
					result.cameraUp = coordCameraUp;

					// clear zoom/scale, translate and rotate info in transformParams
					//result.zoom = 1;
					result.scaleX = result.scaleY = result.scaleZ = 1;

					// lights
					// TODO: now just change light direction but not distance
					var initialLightPositions = this.getInitialLightPositions(context);
					if (cameraRotateMatrix)  // Ambient light only need to rotate with camera
					{
						var lightCount = this.getLightCount(context);
						//console.log('need adjust light', lightCount, initialLightPositions);
						if (initialLightPositions && initialLightPositions.length && lightCount)
						{
							var count = Math.min(initialLightPositions.length, lightCount);
							var newLightPositions = [];
							for (var i = 0; i < count; ++i)
							{
								var pos = initialLightPositions[i];
								if (pos)
								{
									var vOldPos = Kekule.MatrixUtils.create(4, 1, [pos.x, pos.y, pos.z, 1]);
									var vNewPos = Kekule.MatrixUtils.multiply(cameraRotateMatrix, vOldPos);
									var newPos = {'x': vNewPos[0], 'y': vNewPos[1], 'z': vNewPos[2]};
									//this.setLightProps(context, i, {'position': newPos});
									newLightPositions.push(newPos);
								}
							}
						}
					}
					result.lightPositions = newLightPositions || initialLightPositions;

					// do not transform objects, but just camera and lights
					result.rotateMatrix = null;
				}
				else
				{
					// now cameraPos do not consider baseCoord, it will be taken into consideration in getFinalTransformParams
					result.cameraPos = {
						'x': result.drawBaseCoord.x,
						'y': result.drawBaseCoord.y,
						'z': dis + result.drawBaseCoord.z
					};
					result.cameraUp = {'x': 0, 'y': 1, 'z': 1};
				}

				result.cameraLookAtVector = result.drawBaseCoord || {'x': 0, 'y': 0, 'z': 0};

				// consider translate
				var translateCoord = {'x': -result.translateX, 'y': -result.translateY, 'z': -result.translateZ};
				result.translateX = result.translateY = result.translateZ = 0;
				result.cameraPos = Kekule.CoordUtils.add(result.cameraPos, translateCoord);
				result.cameraLookAtVector = Kekule.CoordUtils.add(result.cameraLookAtVector, translateCoord);
			}
		}

		return result;
	},

	/**
	 * Calculate the final params for translation. Zoom and unit length are taken into consideration.
	 * @param {Object} context
	 * @param {Hash} transformParams
	 * @returns {Hash}
	 */
	getFinalTransformParams: function(context, transformParams)
	{
		var result = Object.create(transformParams);
		if (result.zoom)
		{
			result.scaleX *= result.zoom;
			result.scaleY *= result.zoom;
			result.scaleZ *= result.zoom;
		}
		if (result.unitLength !== 1)
		{
			result.translateX *= result.unitLength;
			result.translateY *= result.unitLength;
			result.translateZ *= result.unitLength;

			if (result.drawBaseCoord)
			{
				result.drawBaseCoord = Kekule.CoordUtils.multiply(result.drawBaseCoord, result.unitLength);
			}
		}
		return result;
	},

	/** @ignore */
	getRenderFinalTransformParams: function(context)
	{
		return this.getRenderCache(context).transformParams;
	},
	/** @ignore */
	getRenderInitialTransformOptions: function(context)
	{
		var p = this.getRenderFinalTransformParams(context);
		return p? p.initialTransformOptions: null;
	},

	/**
	 * Returns a automatic inflation value in autofit drawing.
	 * Usually a radius of atom ball.
	 * Descendants may override this method.
	 * @param {Object} context
	 * @param {Kekule.ChemObject} chemObj
	 * @param {Object} drawOptions
	 * @returns {Hash} {x, y, z}
	 */
	getAutofitObjBoxInflation: function(context, chemObj, drawOptions)
	{
		var r = drawOptions.fixedNodeRadius || 0; // || this.getRenderConfigs().getLengthConfigs().getFixedNodeRadius();
		return {'x': r, 'y': r, 'z': r};
	},

	/** @private */
	adjustCamera: function(context, transformParams)
	{
		var w = transformParams.cameraWidth;
		var h = transformParams.cameraHeight;
		var options = {
			'position': transformParams.cameraPos,
			'upVector': transformParams.cameraUp,
			'lookAtVector': transformParams.cameraLookAtVector
		};

		if (w && h)
		{
			var hw = w / 2;
			var hh = h / 2;
			options.left = -hw;
			options.right = hw;
			options.top = hh;
			options.bottom = -hh;
		}
		this.setCameraProps(context, options);

		this.adjustLights(context, transformParams);
		//console.log(transformParams.cameraPos);
	},
	/** @private */
	adjustLights: function(context, transformParams)
	{
		var positions = transformParams.lightPositions || [];
		for (var i = 0, l = positions.length; i < l; ++i)
		{
			var pos = positions[i];
			if (pos)
			{
				//console.log('set light new pos', i, pos);
				this.setLightProps(context, i, {'position': pos});
			}
		}
	}
});

/**
 * A default implementation of 3D a molecule's CTable renderer.
 * @class
 * @augments Kekule.Render.ChemObj3DRenderer
 */
Kekule.Render.ChemCtab3DRenderer = Class.create(Kekule.Render.ChemObj3DRenderer,
/** @lends Kekule.Render.ChemCtab3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemCtab3DRenderer',

	/** @private */
	TRANSFORM_COORD_FIELD: '__$transCoord3D__',
	/** @private */
	DRAW_ELEM_FIELD: '__$drawElem__',
	/** @private */
	DRAW_COLOR_FIELD: '__$drawColor__',
	/** @private */
	BASE_RADIUS_FIELD: '__$baseRadius__',
	/** @private */
	TRANSFORM_MATRIX_FIELD: '__$transMatrix__',
	/** @private */
	INV_TRANSFORM_MATRIX_FIELD: '__$inverseTransMatrix__',
	/** @private */
	CHILD_TRANSFORM_MATRIX_FIELD: '__$childTransMatrix__',
	/** @private */
	HIDDEN_NODES_FIELD: '__$hiddenNodes__',
	/** @private */
	HIDDEN_CONNECTORS_FIELD: '__$hiddenConnectors__',

	/** @private */
	getObjDrawElem: function(context, obj)
	{
		return this.getExtraProp2(context, obj, this.DRAW_ELEM_FIELD);
	},
	/** @private */
	setObjDrawElem: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.DRAW_ELEM_FIELD, value);
	},
	/** @private */
	getObjDrawColor: function(context, obj)
	{
		return this.getExtraProp2(context, obj, this.DRAW_COLOR_FIELD);
	},
	/** @private */
	setObjDrawColor: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.DRAW_COLOR_FIELD, value);
	},
	/** @private */
	getNodeBaseRadius: function(context, obj)
	{
		return this.getExtraProp2(context, obj, this.BASE_RADIUS_FIELD);
	},
	/** @private */
	setNodeBaseRadius: function(context, obj, value)
	{
		this.setExtraProp2(context, obj, this.BASE_RADIUS_FIELD, value);
	},
	/** @private */
	getHiddenNodes: function(context)
	{
		return this.getExtraProp(context, this.HIDDEN_NODES_FIELD) || [];
	},
	/** @private */
	setHiddenNodes: function(context, value)
	{
		return this.setExtraProp(context, this.HIDDEN_NODES_FIELD, value);
	},
	/** @private */
	getHiddenConnectors: function(context)
	{
		return this.getExtraProp(context, this.HIDDEN_CONNECTORS_FIELD) || [];
	},
	/** @private */
	setHiddenConnectors: function(context, value)
	{
		return this.setExtraProp(context, this.HIDDEN_CONNECTORS_FIELD, value);
	},

	/** @private */
	doEstimateObjBox: function(context, options, allowCoordBorrow)
	{
		// TODO: just a rough calc
		var box = this.getChemObj().getExposedContainerBox3D(allowCoordBorrow);
		return box;
	},

	/** @private */
	doPrepare: function(context, chemObj, baseCoord, options)
	{
		/*
		var op = this.getGlobalOptions(this.getRenderConfigs());
		op = Object.extend(op, options);
		*/
		//var op = Object.create(options);
		var op = options;
		var c = this.getRenderCache(context);
		var nodeMode, connectorMode;
		switch (op.moleculeDisplayType)
		{
			case MDM.WIRE:
				nodeMode = NRM.NONE;
				connectorMode = op.displayMultipleBond? BRM.MULTI_WIRE: BRM.WIRE;
				break;
			case MDM.STICKS:
				nodeMode = NRM.NONE; //NRM.SMALL_CAP;
				connectorMode = op.displayMultipleBond? BRM.MULTI_CYLINDER: BRM.CYLINDER;
				break;
			case MDM.SPACE_FILL:
				nodeMode = NRM.SPACE;
				connectorMode = BRM.NONE;
				break;
			case MDM.BALL_STICK:
			default:
				nodeMode = NRM.BALL;
				connectorMode = op.displayMultipleBond? BRM.MULTI_CYLINDER: BRM.CYLINDER;
				break;
		}
		c.nodeRenderMode = nodeMode;
		c.connectorRenderMode = connectorMode;
		c.options = op;

		var nodes = chemObj.getExposedNodes();
		var connectors = chemObj.getExposedConnectors();

		//console.log('prepare options', op);

		this.prepareHiddenObjects(context, nodes, connectors, op);
		this.prepareNodesDrawColor(context, nodes, op);
		this.prepareNodeBaseRadii(context, nodes, op);

		return op;
	},

	/*
	 * Retrieve render options from global renderConfigs object.
	 * @param {Object} renderConfigs
	 * @returns {Hash}
	 * @private
	 */
	/*
	getGlobalOptions: function(renderConfigs)
	{
		if (renderConfigs)
		{
			var r = renderConfigs.getMoleculeDisplayConfigs().toHash() || {};
			r.displayMultipleBond = r.defDisplayMultipleBond;
			r.bondSpliceMode = r.defBondSpliceMode;
			r.moleculeDisplayType = r.defMoleculeDisplayType;
			r = Object.extend(r, renderConfigs.getModelConfigs().toHash() || {});
			r = Object.extend(r, renderConfigs.getLengthConfigs().toHash() || {});
			r.opacity = renderConfigs.getGeneralConfigs().getDrawOpacity();
			return r;
		}
		else
			return {};
	},
	*/

	/**
	 * Mark if node or connector need not to be drawn.
	 * @private
	 */
	prepareHiddenObjects: function(context, nodes, connectors, renderOptions)
	{
		var hiddenNodes = [];
		this.setHiddenNodes(context, hiddenNodes);
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			// check if node is hydrogen atom and need to be hidden
			if (renderOptions.hideHydrogens && (node instanceof Kekule.Atom) && (node.getAtomicNumber() === 1))
			{
				hiddenNodes.push(node);
			}
		}

		var hiddenConnectors = [];
		this.setHiddenConnectors(context, hiddenConnectors);
		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			// check if connector connected to a hidden node and should not be drawn
			var connectedObjs = connector.getConnectedExposedObjs();
			var shownObjs = Kekule.ArrayUtils.exclude(connectedObjs, hiddenNodes);
			if (shownObjs < 2)
			{
				hiddenConnectors.push(connector);
			}
		}

		//console.log('prepare hide', hiddenNodes, hiddenConnectors);
	},
	/**
	 * Calculate colors need for drawing a series of node.
	 * @param {Array} nodes
	 * @param {Object} renderOptions
	 * @private
	 */
	prepareNodesDrawColor: function(context, nodes, renderOptions)
	{
		var globalUseAtomSpecifiedColor = renderOptions.useAtomSpecifiedColor;
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			var localOptions = node.getOverriddenRender3DOptions() || {};
			// get color
			/*
			var defColor = renderOptions.useAtomSpecifiedColor?
				Kekule.Render.RenderColorUtils.getColor(atomicNumber,  this.getRendererType()):
				renderOptions.atomColor;
			var color = oneOf(localOptions.atomColor, localOptions.color,
				renderOptions.atomColor,  renderOptions.color,
				defColor);
			*/
			//var color = localOptions.atomColor || localOptions.color;
			var color = localOptions.color || localOptions.atomColor;
			//console.log(renderOptions, localOptions, globalUseAtomSpecifiedColor);
			if (color && (!localOptions.useAtomSpecifiedColor))  // local color set
			{
				// do nothing, color already set
			}
			else
			{
				if (globalUseAtomSpecifiedColor || localOptions.useAtomSpecifiedColor)
				{
					var atomicNumber = node.getAtomicNumber? node.getAtomicNumber(): 0;
					if (atomicNumber >= 0)
						color = Kekule.Render.RenderColorUtils.getColor(atomicNumber,  this.getRendererType());
					else  // may be subgroup or other none-atom node
						color = Kekule.Render.RenderColorUtils.getColor(node.getClassLocalName(),  this.getRendererType());
				}
				else  // use global color/atom color settings
					//color = oneOf(renderOptions.atomColor || localOptions.color);
					color = oneOf(localOptions.color || renderOptions.atomColor);
			}
			/*
			if (renderOptions.useAtomSpecifiedColor || localOptions.useAtomSpecifiedColor)
			{
				var defColor = Kekule.Render.RenderColorUtils.getColor(atomicNumber,  this.getRendererType());
			}
			*/
			//console.log('color', color);
			this.setObjDrawColor(context, node, color);
		}
	},

	/**
	 * Calculate base radii need for drawing a series of node
	 * @param {Array} nodes
	 * @param {Object} renderOptions
	 * @private
	 */
	prepareNodeBaseRadii: function(context, nodes, renderOptions)
	{
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var radius;
			var node = nodes[i];
			radius = this.calcNodeBaseRadius(node, renderOptions);
			this.setNodeBaseRadius(context, node, radius);
		}
	},
	/** @private */
	calcNodeBaseRadius: function(node, renderOptions)
	{
		var localOptions = node.getOverriddenRender3DOptions() || {};
		var atomicNumber = node.getAtomicNumber? node.getAtomicNumber(): null;
		if (localOptions.nodeRadius || renderOptions.nodeRadius)  // radius explicitly set
			radius = localOptions.nodeRadius || renderOptions.nodeRadius;
		else if (oneOf(localOptions.useVdWRadius, renderOptions.useVdWRadius) && atomicNumber) // use vdW radius and is atom
		{
			var radiusVdw = Kekule.ChemicalElementsDataUtil.getElementProp(atomicNumber, 'radiiVdw')
				|| localOptions.fixedNodeRadius || renderOptions.fixedNodeRadius;
			radius = radiusVdw;
		}
		else // use fixed radius
		{
			radius = oneOf(localOptions.fixedNodeRadius, renderOptions.fixedNodeRadius);
		}
		return radius;
	},

	/** @private */
	doDraw: function($super, context, baseCoord, options)
	{
		$super(context, baseCoord, options);

		var chemObj = this.getChemObj();

		//var transformOptions = this.getFinalTransformParams(context, options.transformParams);
		var transformOptions = options.transformParams;
		this.getRenderCache(context).transformOptions = transformOptions;
		this.transformCtabCoords3DToContext(context, chemObj, transformOptions);
		var op = this.doPrepare(context, chemObj, baseCoord, options);  // return prepared options

		return this.doDrawCore(context, chemObj, op, transformOptions);
	},
	/** @private */
	doRedraw: function(context)
	{
		var p = this.getRenderCache(context);
		//this.clear(context);
		// no need to prepare, draw directly
		return this.doDrawCore(context, this.getChemObj(), p.options, p.transformOptions);
		//return this.doDraw(context, p.baseCoord, p.options);
	},
	/** @private */
	doDrawCore: function(context, chemObj, options, finalTransformOptions)
	{
		// create a new group to contain whole ctab
		var group = this.createDrawGroup(context);
		this.doDrawConnectors(context, group, chemObj, options, finalTransformOptions);
		this.doDrawNodes(context, group, chemObj, options, finalTransformOptions);
		this.setObjDrawElem(context, chemObj, group);
		return group;
	},

	/**
	 * Transform each 3D coordinates of objects in CTab to current render space.
	 * This function should be called before the whole draw phrase.
	 * @private
	 */
	transformCtabCoords3DToContext: function(context, ctab, transformOptions)
	{
		var allowCoordBorrow = transformOptions.allowCoordBorrow;

		transformOptions.scaleX = transformOptions.scaleX || transformOptions.scale;
		transformOptions.scaleY = (transformOptions.scaleY || transformOptions.scale);
		transformOptions.scaleZ = (transformOptions.scaleZ || transformOptions.scale);
		var childTransformOptions = Object.extend({}, transformOptions);
		childTransformOptions.centerX = 0;
		childTransformOptions.centerY = 0;
		var coord;
		var coordTransformMatrix = transformOptions.transformMatrix;
			//Kekule.CoordUtils.calcTransform3DMatrix(transformOptions);
		this.setExtraProp2(context, ctab, this.TRANSFORM_MATRIX_FIELD, coordTransformMatrix);
		//var childCoordTransformMatrix = Kekule.CoordUtils.calcTransform3DMatrix(childTransformOptions);
		var childCoordTransformMatrix = coordTransformMatrix;
		this.setExtraProp2(context, ctab, this.CHILD_TRANSFORM_MATRIX_FIELD, coordTransformMatrix);
		// also calc for inversed transform matrix
		var invMatrix = transformOptions.invTransformMatrix;
			//Kekule.CoordUtils.calcInverseTransform3DMatrix(transformOptions);
		//console.log('INV CHECK', Kekule.MatrixUtils.multiply(this._coordTransformMatrix, invMatrix));
		this.setExtraProp2(context, ctab, this.INV_TRANSFORM_MATRIX_FIELD, invMatrix);

		for (var i = 0, l = ctab.getNodeCount(); i < l; ++i)
		{
			var node = ctab.getNodeAt(i);
			//this.transformObjCoord2D(node, transformOptions, childTransformOptions);
			this.transformObjCoord3DToContext(context, node, coordTransformMatrix, childCoordTransformMatrix, allowCoordBorrow);
		}
	},
	/**
	 * Transform 3D coordinates of node or connector to current render space.
	 * This function should be called by transformCtabCoords3D before the whole draw phrase.
	 * @private
	 */
	transformObjCoord3DToContext: function(context, obj, transformMatrix, childTransformMatrix, allowCoordBorrow)
	{
		if (obj && obj.getAbsBaseCoord3D)
		{
			coord = obj.getAbsBaseCoord3D(allowCoordBorrow);
			if (coord)
			{
				var newCoord = Kekule.CoordUtils.transform3DByMatrix(coord, transformMatrix);
				this.setTransformedCoord3D(context, obj, newCoord);
			}
			if (obj.getNodes)  // has child nodes
			{
				// Done: not handle nested structure yet
				for (var i = 0, l = obj.getNodeCount(); i < l; ++i)
					this.transformObjCoord3DToContext(context, obj.getNodeAt(i), childTransformMatrix, childTransformMatrix, allowCoordBorrow);
			}
		}
	},

	/**
	 * Get transformed coord.
	 * @param {Object} context
	 * @param {Object} obj
	 * @private
	 */
	getTransformedCoord3D: function(context, obj, allowCoordBorrow)
	{
		if (Kekule.ObjUtils.isUnset(allowCoordBorrow))
			allowCoordBorrow = this.getRenderCache(context).options.transformParams.allowCoordBorrow;
		var isNode = obj instanceof Kekule.BaseStructureNode;
		var result = isNode && this.getExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD);
			// IMPORTANT: connector center coord is based on node and should not be cached
		if (!result)
		{
			var ctab = this.getChemObj();
			var transformMatrix = this.getExtraProp2(context, ctab, this.TRANSFORM_MATRIX_FIELD);
			var childTransformMatrix = this.getExtraProp2(context, ctab, this.CHILD_TRANSFORM_MATRIX_FIELD);

			//this.transformObjCoord3DToContext(obj, transformMatrix, childTransformMatrix);
			if (ctab && (ctab.hasNode(obj, false) || ctab.hasConnector(obj, false)))  // is direct child of ctab
			{
				this.transformObjCoord3DToContext(obj, transformMatrix, childTransformMatrix, allowCoordBorrow);
			}
			else  // is nested child
				this.transformObjCoord3DToContext(obj, childTransformMatrix, childTransformMatrix, allowCoordBorrow);
		}
		return this.getExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD);
	},
	/**
	 * Set transformed coord.
	 * @param {Object} context
	 * @param {Object} obj
	 * @param {Hash} coord
	 * @private
	 */
	setTransformedCoord3D: function(context, obj, coord)
	{
		this.setExtraProp2(context, obj, this.TRANSFORM_COORD_FIELD, coord);
	},

	/** @private */
	doTransformCoordToObj: function(context, chemObj, coord)
	{
		var matrix = this.getExtraProp2(context, chemObj, this.INV_TRANSFORM_MATRIX_FIELD);
		return Kekule.CoordUtils.transform3DByMatrix(coord, matrix);
	},
	/** @private	 */
	doTransformCoordToContext: function(context, chemObj, coord)
	{
		var matrix = this.getExtraProp2(context, chemObj, this.TRANSFORM_MATRIX_FIELD);
		return Kekule.CoordUtils.transform3DByMatrix(coord, matrix);
	},

	/**
	 * Draw all nodes in ctab on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} ctab
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawNodes: function(context, group, ctab, options, finalTransformOptions)
	{
		var nodes = ctab.getExposedNodes();
		var hiddenNodes = this.getHiddenNodes(context);
		for (var i = 0, l = nodes.length; i < l; ++i)
		{
			var node = nodes[i];
			// check if node is hydrogen atom and need to be hidden
			if (hiddenNodes.indexOf(node) >= 0)
				continue;
			var elem = this.doDrawNode(context, group, node, ctab, options, finalTransformOptions);
		}
	},
	/**
	 * Draw a node on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} node
	 * @param {Object} parentChemObj
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawNode: function(context, group, node, parentChemObj, options, finalTransformOptions)
	{
		var result;
		var nodeRenderMode = this.getRenderCache(context).nodeRenderMode;
		if (nodeRenderMode === NRM.NONE)  // do not need to render node
			return null;
		else // draw node ball
		{
			//op = Object.extend(op, node.getRender3DOptions());
			op = Kekule.Render.RenderOptionUtils.mergeObjLocalRender3DOptions(node, options);

			var ballRadius;
			// calc node ball radius
			{
				ballRadius = this.getNodeBaseRadius(context, node);
				if (Kekule.ObjUtils.isUnset(ballRadius))
					ballRadius = this.calcNodeBaseRadius(node, options);
				if (nodeRenderMode === NRM.SPACE)
					ballRadius *= finalTransformOptions.scaleX;  // TODO: Y/Z scale is not considered yet, we can only draw ball now
				else // ball stick mode
					ballRadius *= op.nodeRadiusRatio * finalTransformOptions.scaleX;
			}

			var color = this.getObjDrawColor(context, node);
			// store the color for bond draw usage
			// draw ball
			var coord = this.getTransformedCoord3D(context, node, finalTransformOptions.allowCoordBorrow);
			result = this.drawSphere(context, coord, ballRadius, {'color': color, 'opacity': op.opacity});
			var boundInfo = this.createSphereBoundInfo(coord, ballRadius);
			this.basicDrawObjectUpdated(context, node, parentChemObj, boundInfo, Kekule.Render.ObjectUpdateType.ADD);
		}

		if (result)
		{
			this.setObjDrawElem(context, node, result);
			if (group)
			{
				this.addToDrawGroup(result, group);
			}
		}
	},

	/**
	 * Draw all connectors in ctab on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} ctab
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @private
	 */
	doDrawConnectors: function(context, group, ctab, options, finalTransformOptions)
	{
		if (this.getRenderCache(context).connectorRenderMode === BRM.NONE)
			return null;
		var connectors = ctab.getExposedConnectors();
		var hiddenConnectors = this.getHiddenConnectors(context);

		for (var i = 0, l = connectors.length; i < l; ++i)
		{
			var connector = connectors[i];
			if (hiddenConnectors.indexOf(connector) >= 0)
				continue;
			var elem = this.doDrawConnector(context, group, connector, ctab, options, finalTransformOptions);
		}
	},
	/**
	 * Draw a connector on context.
	 * @param {Object} context
	 * @param {Object} group
	 * @param {Object} connector
	 * @param {Object} options
	 * @param {Object} finalTransformOptions
	 * @returns {Object} A rendered object.
	 * @private
	 */
	doDrawConnector: function(context, group, connector, parentChemObj, options, finalTransformOptions)
	{
		var op = Object.create(options);
		//op = Object.extend(op, connector.getRender3DOptions());
		op = Kekule.Render.RenderOptionUtils.mergeObjLocalRender3DOptions(connector, options);

		// draw connector shape between every two connected objects
		var hiddenNodes = this.getHiddenNodes(context);
		var objs = connector.getConnectedExposedObjs();
		objs = Kekule.ArrayUtils.exclude(objs, hiddenNodes);
		var objCount = objs.length;
		var obj1, obj2;
		var coord1, coord2;
		var subGroup = (objCount > 2)? this.createDrawGroup(context): null;
		var elem;
		for (var i = 0; i < objCount; ++i)
		{
			obj1 = objs[i];
			coord1 = this.getTransformedCoord3D(context, obj1, finalTransformOptions.allowCoordBorrow);
			if (coord1)
			{
				for (var j = i + 1; j < objCount; ++j) // do not draw on self
 				{
					obj2 = objs[j];
					coord2 = this.getTransformedCoord3D(context, obj2, finalTransformOptions.allowCoordBorrow);
					if (coord2)
					{
						elem = this.doDrawConnectorShape(context, connector, obj1, obj2, parentChemObj, coord1, coord2, op, finalTransformOptions);
						if (elem && subGroup)
							this.addToDrawGroup(elem, subGroup);
					}
				}
			}
		}
		if (subGroup)
			this.addToDrawGroup(subGroup, group);
		else
			this.addToDrawGroup(elem, group);
		return subGroup || elem;
	},

	/**
	 * Draw a connector (bond) connecting node1 and node2 with a specified shape on context.
	 * @param {Object} context
	 * @param {Kekule.ChemStructureConnector} connector
	 * @param {Kekule.ChemStructureNode} node1
	 * @param {Kekule.ChemStructureNode} node2
	 * @param {Object} parentChemObj
	 * @param {Hash} coord1
	 * @param {Hash} coord2
	 * @param {Hash} options
	 * @param {Object} finalTransformOptions
	 * @private
	 */
	doDrawConnectorShape: function(context, connector, node1, node2, parentChemObj, coord1, coord2, options, finalTransformOptions)
	{
		var C = Kekule.CoordUtils;
		var localOptions = connector.getOverriddenRender3DOptions() || {};
		var unitLength = options.unitLength;

		var spliceMode = oneOf(localOptions.bondSpliceMode, options.bondSpliceMode/*, options.defBondSpliceMode*/);

		var splicePosRatio = (spliceMode === BSM.MID_SPLIT)? 0.5: null;
			//(spliceMode === BSM.WEIGHTING_SPLIT)? 0.5:  // TODO: need calculate weight
			//null;  // no splice
		if (spliceMode === BSM.WEIGHTING_SPLIT)
		{
			var r1 = this.getNodeBaseRadius(context, node1);
			var r2 = this.getNodeBaseRadius(context, node2);
			if (r1 && r2)
				splicePosRatio = r1 / (r1 + r2);
			else
				splicePosRatio = 0.5;
		}
		var spliceCoord = null;
		var needSplit = false;

		// colors to draw different part of bond
		var colors = [];
		if (splicePosRatio)  // may need splice
		{
			//var defColor = oneOf(options.bondColor, options.color/*, options.defBondColor*/);
			var defColor = oneOf(options.color || options.bondColor/*, options.defBondColor*/);
			//var color = oneOf(localOptions.bondColor, localOptions.color);
			var color = oneOf(localOptions.color || localOptions.bondColor);
			needSplit = false;
			if (color)  // color set by bond object itself
				colors.push(color);
			else  // color decided by node
			{
				var color1 = oneOf(this.getObjDrawColor(context, node1), defColor);
				var color2 = oneOf(this.getObjDrawColor(context, node2), defColor);
				if (color1 !== color2)
				{
					colors.push(color1);
					colors.push(color2);
					needSplit = true;
				}
				else  // same color, no need to split
				{
					//colors.push(oneOf(color1,	options.bondColor, options.color, options.defBondColor));
					colors.push(oneOf(color1,	options.color, options.bondColor, options.defBondColor));
				}
			}
		}
		else
		{
			/*
			colors.push(oneOf(localOptions.bondColor, localOptions.color,
				options.bondColor, options.color, options.defBondColor));
			*/
			colors.push(oneOf(localOptions.color, localOptions.bondColor,
				options.color, options.bondColor, options.defBondColor));
		}
		if (splicePosRatio && needSplit)
		{
			var dx = coord2.x - coord1.x;
			var dy = coord2.y - coord1.y;
			var dz = coord2.z - coord1.z;
			spliceCoord= {};
			spliceCoord.x = coord1.x + dx * splicePosRatio;
			spliceCoord.y = coord1.y + dy * splicePosRatio;
			spliceCoord.z = coord1.z + dz * splicePosRatio;
		}
		// coords to draw different part of bond
		var geometryCoords = needSplit? [[coord1, spliceCoord], [spliceCoord, coord2]]: [[coord1, coord2]];

		var connectorRenderMode = this.getRenderCache(context).connectorRenderMode;
		var renderType = this._getBondRenderType(connector, connectorRenderMode);
		var isMultiCylinder = false;
		// cylinder radius and line width
		var cylinderRadius = oneOf(localOptions.connectorRadius, options.connectorRadius/*, options.baseConnectorRadius*/)
			* oneOf(localOptions.connectorRadiusRatio, options.connectorRadiusRatio) * options.unitLength;
		cylinderRadius *= finalTransformOptions.scaleX;
   	var lineWidth = oneOf(localOptions.connectorLineWidth, options.connectorLineWidth) * options.unitLength;

		if ((renderType !== BRT.SINGLE) && (renderType !== BRT.DASH))
		{
			cylinderRadius *= oneOf(localOptions.multiConnectorRadiusRatio, options.multiConnectorRadiusRatio);
			isMultiCylinder = (connectorRenderMode === BRM.MULTI_CYLINDER);
		}
		else
			isMultiCylinder = false;

		// fill shape infos, prepare to draw
		var connectorShapeInfos = [];

		// get 3D shape needed for drawing
		var shapeCount = 1, lineCount = 0;
		switch (renderType)
		{
			case BRT.SINGLE: shapeCount = 1; break;
			case BRT.DOUBLE: shapeCount = 2; break;
			case BRT.TRIPLE: shapeCount = 3; break;
			case BRT.DASH: case BRT.SOLID_DASH:  // TODO: dash not handled
		}
		lineCount = shapeCount;
		var offsetStart = null;
		if (lineCount > 1)
		{
			var shapeOffsetLen = oneOf(localOptions.multiConnectorMarginRatio, options.multiConnectorMarginRatio) * cylinderRadius;
			if (isMultiCylinder)
				shapeOffsetLen += cylinderRadius * 2;
			// calculate offset on x/y direction
			var connectorLength = C.getDistance(coord1, coord2);
			var sub = C.substract(coord2, coord1);
			var sinAngle = sub.y / connectorLength;
			var cosAngle = sub.x / connectorLength;
			var shapeOffset = {'x': -shapeOffsetLen * sinAngle, 'y': shapeOffsetLen * cosAngle, 'z': 0};
			offsetStart = ((lineCount % 2) ? 0 : 0.5) - Math.floor(lineCount / 2);
			var startOffset = C.multiply(shapeOffset, offsetStart);
		}
		for (var i = 0, l = geometryCoords.length; i < l; ++i)
		{
			// if needSplit, the second coord of item 0 and first coord of item 1 is join point.
			if (lineCount === 1) // single line, no bond offset
			{
				var shapeInfo = {};
				shapeInfo.coord1 = geometryCoords[i][0];
				shapeInfo.coord2 = geometryCoords[i][1];
				if (needSplit)
					shapeInfo.jointCoordIndex = (i === 0)? 2: 1;
				shapeInfo.color = colors[i];
				shapeInfo.radius = cylinderRadius;
				shapeInfo.lineWidth = lineWidth;
				shapeInfo.opacity = options.opacity;
				connectorShapeInfos.push(shapeInfo);
			}
			else  // multipline or bond
			{

				var currCoord1 = C.add(geometryCoords[i][0], startOffset);
				var currCoord2 = C.add(geometryCoords[i][1], startOffset);
				for (var j = 0; j < lineCount; ++j)
				{
					var shapeInfo = {};
					shapeInfo.coord1 = currCoord1;
					shapeInfo.coord2 = currCoord2;
					currCoord1 = C.add(currCoord1, shapeOffset);
					currCoord2 = C.add(currCoord2, shapeOffset);
					if (needSplit)
						shapeInfo.jointCoordIndex = (i === 0)? 2: 1;
					shapeInfo.color = colors[i];
					shapeInfo.radius = cylinderRadius;
					shapeInfo.lineWidth = lineWidth;
					shapeInfo.opacity = options.opacity;
					connectorShapeInfos.push(shapeInfo);
				}
			}
		}

		var renderMode = connectorRenderMode;
		// add bound info
		var boundInfo;
		if ((renderMode === BRM.WIRE) || (renderMode === BRM.MULTI_WIRE))  // draw wire
		{
			boundInfo = this.createLineBoundInfo(coord1, coord2, {width: lineWidth});
		}
		else
		{
			boundInfo = this.createCylinderBoundInfo(coord1, coord2, {radius: cylinderRadius});
		}
		this.basicDrawObjectUpdated(context, connector, parentChemObj, boundInfo, Kekule.Render.ObjectUpdateType.ADD);

		//return this.doDrawConnectorSet(context, geometryCoords, colors, cylinderRadius, this._connectorRenderMode, renderType, options);
		return this.doDrawConnectorSet(context, connectorShapeInfos, renderMode, renderType, options);
	},
	/** @private */
	doDrawConnectorSet: function(context, connectorShapeInfos, renderMode, renderType, options)
	{
		if ((renderMode === BRM.WIRE) || (renderMode === BRM.MULTI_WIRE))  // draw wire
		{
			return this.drawParallelLines(context, connectorShapeInfos);
		}
		else  // draw cylinder
		{
			var drawEndCaps = this.getRenderCache(context).nodeRenderMode === NRM.NONE;
			return this.drawParallelCylinders(context, connectorShapeInfos, drawEndCaps);
		}
	},
	/** @private */
	_getBondRenderType: function(connector, renderMode)
	{
		var localRenderOptions = connector.getOverriddenRender3DOptions() || {};
		var rt = Kekule.Render.Render3DOptionUtils.getConnectorRenderType(localRenderOptions);
		if (rt)
			return rt;
		else
			return Kekule.Render.ConnectorDrawUtils.getConnectorRender3DType(connector, renderMode);
	}
});
Kekule.ClassDefineUtils.addExtraTwoTupleObjMapSupport(Kekule.Render.ChemCtab3DRenderer);


/**
 * Class to render for {@link Kekule.StructureFragment}.
 * The class will use {@link Kekule.Render.ChemCtab3DRenderer} to draw actual structure.
 * Note that 3D formula form is not implemented yet.
 * @class
 * @augments Kekule.Render.ChemObj3DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render3DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 */
Kekule.Render.StructFragment3DRenderer = Class.create(Kekule.Render.ChemObj3DRenderer,
/** @lends Kekule.Render.StructFragment3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.StructFragment3DRenderer',
	/** @constructs */
	initialize: function($super, chemObj, drawBridge, /*renderConfigs,*/ parent)
	{
		$super(chemObj, drawBridge, /*renderConfigs,*/ parent);

		this._concreteRenderer = null;
		if (chemObj.hasCtab())
			this._concreteRenderer = new Kekule.Render.ChemCtab3DRenderer(chemObj.getCtab(), drawBridge, /*renderConfigs*/ this);
		else //if (chemObj.hasFormula())
		{
			//this._concreteRenderer = new Kekule.Render.Formula3DRenderer(chemObj.getFormula(), drawBridge, renderConfigs);
			this._concreteRenderer = null;
			Kekule.raise(/*Kekule.ErrorMsg.FORMULA_RENDERER_3D_NOT_AVAILABLE*/Kekule.$L('ErrorMsg.FORMULA_RENDERER_3D_NOT_AVAILABLE'));
		}
		this._concreteRenderer.setParentRenderer(this);
		//this.setMoleculeDisplayType(moleculeDisplayType || Kekule.Render.MoleculeDisplayType.BOND_LINE);
	},
	finalize: function($super)
	{
		$super();
		if (this._concreteRenderer)
			this._concreteRenderer.finalize();
	},
	//* @private */
	/*
	applyConfigs: function()
	{
		this._concreteRenderer.setRenderConfigs(this.getRenderConfigs());
		this._concreteRenderer.setDrawBridge(this.getDrawBridge());
	},
	*/

	/** @ignore */
	getRenderCache: function(context)
	{
		return this._concreteRenderer.getRenderCache(context);
	},

	/** @private */
	_getConcreteRendererDrawOptions: function(options)
	{
		var ops = Object.create(options);
		var chemObj = this.getChemObj();
		var objOptions = (this.getRendererType() === Kekule.Render.RendererType.R3D)?
			chemObj.getOverriddenRender3DOptions(): chemObj.getOverriddenRenderOptions();
		/*
		if (objOptions)
			console.log('OBJ options', objOptions);
		*/

		ops = Object.extend(ops, objOptions || {});
		return ops;
	},

	/** @ignore */
	isChemObjRenderedBySelf: function($super, context, obj)
	{
		var result = $super(context, obj) || (obj === this.getChemObj()) || this._concreteRenderer.isChemObjRenderedBySelf(context, obj);
		return result;
	},
	/** @ignore */
	isChemObjRenderedDirectlyBySelf: function($super, context, obj)
	{
		return $super(context, obj) || (obj === this.getChemObj());
	},

	/** @private */
	doSetRedirectContext: function($super, value)
	{
		$super(value);
		this._concreteRenderer.setRedirectContext(value);
	},

	/** @ignore */
	doDraw: function($super, context, baseCoord, options)
	{
		//this.applyConfigs();
		$super(context, baseCoord, options);

		return this._concreteRenderer.draw(context, baseCoord, this._getConcreteRendererDrawOptions(options));
	},
	/** @ignore */
	doRedraw: function(context)
	{
		return this._concreteRenderer.redraw(context);
	},
	/** @ignore */
	doUpdate: function(context, updatedObjDetails, updateType)
	{
		var objs = this._extractObjsOfUpdateObjDetails(updatedObjDetails);

		if (objs.indexOf(this.getChemObj()) >= 0)  // root object need to be updated
		{
			var p = this.getRenderCache(context);
			this.doClear(context);
			return this.draw(context, p.baseCoord, p.options);
		}

		return this._concreteRenderer.doUpdate(context, updatedObjDetails, updateType);
	},
	/** @ignore */
	estimateRenderBox: function(context, options, allowCoordBorrow)
	{
		return this._concreteRenderer.estimateRenderBox(context, this._getConcreteRendererDrawOptions(options), allowCoordBorrow);
	},
	/** @ignore */
	transformCoordToObj: function(context, chemObj, coord)
	{
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		return this._concreteRenderer.transformCoordToObj(context, obj, coord);
	},
	/** @ignore */
	transformCoordToContext: function(context, chemObj, coord)
	{
		var obj = (this.getChemObj() === chemObj)? this._concreteChemObj: chemObj;
		return this._concreteRenderer.transformCoordToContext(context, obj, coord);
	}
});

// Molecule renderer, actually an alias of structFragment renderer
Kekule.Render.Mol3DRenderer = Kekule.Render.StructFragment3DRenderer;

/**
 * Base class to render composite chem objects, such as composite molecule, chem space and so on.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.ChemObj3DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render3DConfigs}.
 * @param {Kekule.ObjectEx} parent Parent object of this renderer, usually another renderer or an instance of {@link Kekule.Render.ChemObjPainter}, or null.
 */
Kekule.Render.CompositeObj3DRenderer = Class.create(Kekule.Render.ChemObj3DRenderer,
/** @lends Kekule.Render.CompositeObj3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CompositeObj3DRenderer'
});
Kekule.Render.RendererDefineUtils.addCompositeRenderSupport(Kekule.Render.CompositeObj3DRenderer);

/**
 * Class to render composite molecule.
 * @class
 * @augments Kekule.Render.CompositeObj3DRenderer
 */
Kekule.Render.CompositeMolecule3DRenderer = Class.create(Kekule.Render.CompositeObj3DRenderer,
/** @lends Kekule.Render.CompositeMolecule3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.CompositeMolecule3DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var r = [];
		var group = this.getChemObj().getSubMolecules();
		for (var i = 0, l = group.getItemCount(); i < l; ++i)
		{
			var o = group.getObjAt(i);
			r.push(o);
		}
		return r;
	}
});

/**
 * Class to render ChemObjList or ChemStructureObjectGroup.
 * @class
 * @augments Kekule.Render.CompositeObj3DRenderer
 */
Kekule.Render.ChemObjGroupList3DRenderer = Class.create(Kekule.Render.CompositeObj3DRenderer,
/** @lends Kekule.Render.ChemObjGroupList3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemObjGroupList3DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		var obj = this.getChemObj();
		if (obj instanceof Kekule.ChemObjList)
		{
			var r = [];
			for (var i = 0, l = obj.getItemCount(); i < l; ++i)
			{
				r.push(obj.getItemAt(i));
			}
		}
		else if (obj instanceof Kekule.ChemStructureObjectGroup)
		{
			r = obj.getAllObjs();
		}

		return r;
	}
});

/**
 * Class to render ChemSpaceElement instance.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.CompositeObj3DRenderer
 *
 * @param {Kekule.ChemObject} chemObj Object to be drawn.
 * @param {Object} drawBridge A object that implements the actual draw job.
 * @param {Object} renderConfigs Global configuration for rendering.
 *   This property should be an instance of {@link Kekule.Render.Render2DConfigs}.
 */
Kekule.Render.ChemSpaceElement3DRenderer = Class.create(Kekule.Render.CompositeObj3DRenderer,
/** @lends Kekule.Render.ChemSpaceElement3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemSpaceElement3DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		return this.getChemObj().getChildren().toArray();
	}
});

/**
 * Class to render ChemSpace instance.
 * The class will use concrete renderer for each child object inside.
 * @class
 * @augments Kekule.Render.CompositeObj3DRenderer
 */
Kekule.Render.ChemSpace3DRenderer = Class.create(Kekule.Render.CompositeObj3DRenderer,
/** @lends Kekule.Render.ChemSpace3DRenderer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Render.ChemSpace3DRenderer',

	/** @ignore */
	getChildObjs: function()
	{
		//return this.getChemObj().getRoot().getChildren().toArray();
		return [this.getChemObj().getRoot()];
	}
});

// register renderers
Kekule.Render.Renderer3DFactory.register(Kekule.StructureFragment, Kekule.Render.StructFragment3DRenderer);
Kekule.Render.Renderer3DFactory.register(Kekule.CompositeMolecule, Kekule.Render.CompositeMolecule3DRenderer);
Kekule.Render.Renderer3DFactory.register(Kekule.ChemObjList, Kekule.Render.ChemObjGroupList3DRenderer);
Kekule.Render.Renderer3DFactory.register(Kekule.ChemStructureObjectGroup, Kekule.Render.ChemObjGroupList3DRenderer);
Kekule.Render.Renderer3DFactory.register(Kekule.ChemSpaceElement, Kekule.Render.ChemSpaceElement3DRenderer);
Kekule.Render.Renderer3DFactory.register(Kekule.ChemSpace, Kekule.Render.ChemSpace3DRenderer);

})();