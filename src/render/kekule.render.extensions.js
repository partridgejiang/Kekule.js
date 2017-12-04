/**
 * @fileoverview
 * Extend some core classes for displaying purpose.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /core/kekule.structures.js
 * requires /core/kekule.chemUtils.js
 * requires /data/kekule.dataUtils.js
 * requires /render/kekule.render.utils.js
 */

(function()
{
	var K = Kekule;
	var NL = Kekule.ChemStructureNodeLabels;
	var CM = Kekule.CoordMode;
	//var C = Kekule.Render.getRenderConfigs();

	/** @ignore */
	ClassEx.extend(Kekule.ChemObject,
	/** @lends Kekule.ChemObject# */
	{
		/**
		 * Returns default coord position of this object.
		 * Descendants may override this method
		 * @param {Int} coordMode
		 * @returns {Int} Value from {@link Kekule.Render.CoordPos}
		 */
		getDefCoordPos: function(coordMode)
		{
			return Kekule.Render.CoordPos.CENTER;
		},
		/**
		 * Returns the actual base coord position of this object.
		 * @param {Int} coordMode
		 * @returns {Int} Value from {@link Kekule.Render.CoordPos}
		 */
		getCoordPos: function(coordMode)
		{
			var result = (coordMode === Kekule.CoordMode.COORD3D)?
					this.getPropStoreFieldValue('coordPos3D'): this.getPropStoreFieldValue('coordPos2D');
			if (Kekule.ObjUtils.isUnset(result))  // not explict set, use default value
				result = this.getDefCoordPos(coordMode);
			return result;
		},
		/**
		 * @property {Hash} renderOptions Options to render this chem object in 2D.
		 * This property may has the following fields:
		 *   moleculeDisplayType: Value from {@link Kekule.Render.MoleculeDisplayType}.
		 *     If object is a structure fragment, this value will determinate the display type of molecule.
		 *   renderType: Value from {@link Kekule.Render.BondRenderType}.
		 *     If object is a connector, this value determinates its outlook shape.
		 *   nodeDisplayMode: Value from {@link Kekule.Render.NodeLabelDisplayMode}
		 *     If object is a node, this value will determinate its display mode, shown or hidden.
		 *   hydrogenDisplayLevel: Value from {@link Kekule.Render.HydrogenDisplayLevel}.
		 *     Not used yet.
		 *   showCharge: Boolean value. Determinte whether a node should show charge.
		 *   chargeMarkType: Int, value from {@link Kekule.Render.ChargeMarkRenderType}.
		 *   chargeMarkFontSize: Float.
		 *   chargeMarkMargin: Float.
		 *   chargeMarkCircleWidth: Float.
		 *   fontSize, fontFamily, supFontSizeRatio, subFontSizeRatio,
		 *	 superscriptOverhang, subscriptOversink, textBoxXAlignment, textBoxYAlignment:
		 *	   Those values can adjust the outlook of node labels.
		 *	 customLabel: Custom label (string) to display for chem node. For instance, to a 18O- atom,
		 *	   if customLabel is set to 'oxygen', then 18oxygen- will be displayed instead.
		 *   bondLineWidth, boldBondLineWidth, hashSpacing, multipleBondSpacingRatio,
		 *	 multipleBondSpacingAbs, multipleBondMaxAbsSpacing, bondArrowLength, bondArrowWidth,
		 *   bondWedgeWidth, bondWedgeHashMinWidth:
		 *     Those values are for drawing connectors.
		 *   bondLengthScaleRatio: The actual bond length will be scaled according to this value.
		 *   color: String. Color for drawing node label or connector shape.
		 *     If this value is set, atomColor/bondColor/useAtomSpecifiedColor will be ignored.
		 *   //  If atomColor or bondColor is set, this value is ignored.
		 *   atomColor: String. Color used for node / atom.
		 *   bondColor: String. Color used for connector / bond.
		 *   useAtomSpecifiedColor Whether use different color on different atoms.
		 *   atomRadius: Int, when an atom is draw without a label (e.g., C in skeletal mode), a cicle of atomRadius will be drawn.
		 *     0 will draw nothing in atom's location.
		 *   expanded: Boolean. Whether a subgroup has been expanded to display all its children.
		 *
		 *   strokeWidth, strokeColor: stroke property when drawing glyph.
		 *   fillColor: fill color when drawing glyph.
		 *   color: stroke and fill color to draw glyph. If strokeColor and fillColor is set, this
		 *     property is ignored.
		 *
		 * @property {Array} overrideRenderOptionItems: array of hash objects. Render options appointed by them has the highest priority
		 *   (even override the settings of object itself).
		 *
		 * @property {Hash} render3DOptions Options to render this chem object in 3D.
		 * This property may has the following fields:
		 *   bondSpliceMode: Value from {@link Kekule.Render.Bond3DSpliceMode}.
		 *   displayMultipleBond: Boolean. Whether display double or triple bond in multi-line.
		 *     This property is used in whole structure. Individual bond can not has different settings.
		 *   useVdWRadius: Boolean. Whether use atom's von dar Waals radius to draw 3D model.
		 *   nodeRadius: Float. Explicitly set the node's radius.
		 *   connectorRadius: Float. Explicitly set the connector's radius.
		 *   nodeRadiusRatio: Float.
		 *   connectorRadiusRatio: Float.
		 *   connectorLineWidth: Float.
		 *   color: String. Color for drawing node or connector shape.
		 *   //  If atomColor or bondColor is set, this value is ignored.
		 *     If this value is set, atomColor/bondColor/useAtomSpecifiedColor will be ignored.
		 *   atomColor: String. Color used for node / atom.
		 *   bondColor: String. Color used for connector / bond.
		 *   useAtomSpecifiedColor Whether use different color on different atoms.
		 *   hideHydrogens: Bool. Whether hide hydrogen atoms in 3D model.
		 *
		 * @property {Array} overrideRender3DOptionItems: array of hash objects. Render options appointed by them has the highest priority
		 *     (even override the settings of object itself).
		 *
		 * //@property {String} interactState State of object in interaction with user.
		 * //  Values from {@link Kekule.Render.InteractState}.
		 */
		/*
		initProperties: function($origin)
		{
			$origin();
			// new property, decide the 2D render style of a object (node or connector)
			this.defineProp('renderOptions', {'dataType': DataType.OBJECT});
			// new property, decide the 3D render style of a object (node or connector)
			this.defineProp('render3DOptions', {'dataType': DataType.OBJECT});
			// new property, decide the interaction state of a object (node or connector)
			this.defineProp('interactState', {'dataType': DataType.STRING});
		},
		*/

		/**
		 * Get total override render options appointed by overrideOptionItems.
		 */
		getOverrideRenderOptions: function(overrideItems)
		{
			if (overrideItems && overrideItems.length)
			{
				var result = {};
				for (var i = 0, l = overrideItems.length; i < l; ++i)
				{
					result = Object.extend(result, overrideItems[i]);
				}
				return result;
			}
			return null;
		},

		/** @private */
		_appendOverrideRenderOptionItem: function(item, targetPropName)
		{
			var targetItemArray = this.getPropStoreFieldValue(targetPropName);
			if (!targetItemArray)
			{
				targetItemArray = [];
				this.setPropStoreFieldValue(targetPropName, targetItemArray);
			}
			// check if already exists, if so, remove the old one and append the new one (to have higher priority).
			var index = targetItemArray.indexOf(item);
			if (index >= 0)
				targetItemArray.splice(index, 1);
			targetItemArray.push(item);
			this.notifyPropSet(targetPropName, targetItemArray);
			//Kekule.ArrayUtils.pushUnique(targetItemArray, item);
			return this;
		},
		/** @private */
		_deleteOverrideRenderOptionItem: function(item, targetPropName)
		{
			var targetItemArray = this.getPropStoreFieldValue(targetPropName);
			if (!targetItemArray)
			{
				return;
			}
			var index = targetItemArray.indexOf(item);
			if (index >= 0)
			{
				//Kekule.ArrayUtils.remove(targetItemArray, item);
				targetItemArray.splice(index, 1);
				this.notifyPropSet(targetPropName, targetItemArray);
			}
			return this;
		},
		/**
		 * Add an override render option hash object to overrideRenderOptionItems.
		 * @param {Hash} item
		 */
		addOverrideRenderOptionItem: function(item)
		{
			return this._appendOverrideRenderOptionItem(item, 'overrideRenderOptionItems');
		},
		/**
		 * Add an override render 3D option hash object to overrideRender3DOptionItems.
		 * @param {Hash} item
		 */
		addOverrideRender3DOptionItem: function(item)
		{
			return this._appendOverrideRenderOptionItem(item, 'overrideRender3DOptionItems');
		},
		/**
		 * Remove an override render option hash object from overrideRenderOptionItems.
		 * @param {Hash} item
		 */
		removeOverrideRenderOptionItem: function(item)
		{
			return this._deleteOverrideRenderOptionItem(item, 'overrideRenderOptionItems');
		},
		/**
		 * Remove an override render option hash object from overrideRender3DOptionItems.
		 * @param {Hash} item
		 */
		removeOverrideRender3DOptionItem: function(item)
		{
			return this._deleteOverrideRenderOptionItem(item, 'overrideRender3DOptionItems');
		},

		/**
		 * Returns actual render settings, considering of overrideOptionItems.
		 * @return {Hash}
		 */
		getOverriddenRenderOptions: function()
		{
			var result = Object.create(this.getRenderOptions() || null);
			var overrideOptions = this.getOverrideRenderOptions(this.getOverrideRenderOptionItems());
			if (overrideOptions)
			{
				result = Object.extend(result, overrideOptions);
			}
			return result;
		},
		/**
		 * Returns actual 3D render settings, considering of overrideOptionItems.
		 * @return {Hash}
		 */
		getOverriddenRender3DOptions: function()
		{
			var result = Object.create(this.getRender3DOptions() || null);
			var overrideOptions = this.getOverrideRenderOptions(this.getOverrideRender3DOptionItems());
			if (overrideOptions)
			{
				result = Object.extend(result, overrideOptions);
			}
			return result;
		},
		/**
		 * Set value of a render option.
		 * @param {String} prop
		 * @param {Variant} value
		 */
		setRenderOption: function(prop, value)
		{
			var o = this.getRenderOptions();
			if (!o)
				this.setRenderOptions({});
			var o = this.getRenderOptions();
			if (o[prop] !== value)
			{
				o[prop] = value;
				//console.log('render option set', prop);
				// notify change
				this.notifyPropSet('renderOptions', o);
			}
		},
		/**
		 * Set value of a 3D render option.
		 * @param {String} prop
		 * @param {Variant} value
		 */
		setRender3DOption: function(prop, value)
		{
			var o = this.getRender3DOptions();
			if (!o)
				this.setRender3DOptions({});
			var o = this.getRender3DOptions();
			if (o[prop] !== value)
			{
				o[prop] = value;
				// notify change
				this.notifyPropSet('render3DOptions', o);
			}
		},
		/**
		 * Returns one render option value set by self only.
		 * @param {String} prop
		 * @returns {Variant}
		 */
		getRenderOption: function(prop)
		{
			var o = this.getOverriddenRenderOptions();
			var result = (o? o[prop]: undefined); // || parentOpsValue;
			return result;
		},
		/**
		 * Returns one render 3D option value set by self only.
		 * @param {String} prop
		 * @returns {Variant}
		 */
		getRender3DOption: function(prop)
		{
			var o = this.getOverriddenRender3DOptions();
			var result = (o? o[prop]: undefined); // || parentOpsValue;
			return result;
		},
		/**
		 * Returns one render option value set by self or inherited from parent.
		 * @param {String} prop
		 * @returns {Variant}
		 */
		getCascadedRenderOption: function(prop)
		{
			var o = this.getOverriddenRenderOptions();
			var result = (o? o[prop]: undefined); // || parentOpsValue;
			if (Kekule.ObjUtils.isUnset(result))
			{
				var parent = this.getParent? this.getParent(): null;
				var parentOpsValue = parent && parent.getCascadedRenderOption? parent.getCascadedRenderOption(prop): undefined;
				result = parentOpsValue;
			}
			return result;
		},
		/**
		 * Returns one render 3D option value set by self or inherited from parent.
		 * @param {String} prop
		 * @returns {Variant}
		 */
		getCascadedRender3DOption: function(prop)
		{
			var o = this.getOverriddenRender3DOptions();
			var result = (o? o[prop]: undefined); // || parentOpsValue;
			if (Kekule.ObjUtils.isUnset(result))
			{
				var parent = this.getParent? this.getParent(): null;
				var parentOpsValue = parent && parent.getCascadedRender3DOption? parent.getCascadedRender3DOption(prop): undefined;
				result = parentOpsValue;
			}
			return result;
		},
		/**
		 * Get base coord (coord that deciding the position) of object. Param coordMode determinate which coord (2D or 3D) will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBaseCoord: function(coordMode, allowCoordBorrow)
		{
			var coordPos = this.getCoordPos(coordMode);
			var result = this.getCoordOfMode? this.getCoordOfMode(coordMode, allowCoordBorrow): null;
			if (result && coordPos !== Kekule.Render.CoordPos.CENTER)
			{
				if (coordPos === Kekule.Render.CoordPos.CORNER_TL)  // now only handles 2D situation
				{
					var box = this.getExposedContainerBox(coordMode, allowCoordBorrow);
					var delta = {x: (box.x2 - box.x1) / 2, y: (box.y2 - box.y1) / 2};
					if (coordMode === CM.COORD3D)
						delta.z = (box.z2 - box.z1) / 2;
					if (coordMode === CM.COORD3D)
						result = Kekule.CoordUtils.add(result, delta);
					else  // 2D
					{
						result.x += delta.x;
						result.y -= delta.y;
					}
				}
			}
			return result;
		},
		/**
		 * Get center 2D coord of object.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBaseCoord2D: function(allowCoordBorrow)
		{
			return this.getBaseCoord(Kekule.CoordMode.COORD2D, allowCoordBorrow);
		},
		/**
		 * Get center 2D coord of object.
		 * @param {Bool}
		 * @returns {Hash}
		 */
		getBaseCoord3D: function(allowCoordBorrow)
		{
			return this.getBaseCoord(Kekule.CoordMode.COORD3D, allowCoordBorrow);
		},
		/**
		 * Get absolute center coord of object. Param coordMode determinate which coord (2D or 3D) will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returs {Hash}
		 */
		getAbsBaseCoord: function(coordMode, allowCoordBorrow)
		{
			var coordPos = this.getCoordPos(coordMode);
			var result = this.getAbsCoordOfMode? this.getAbsCoordOfMode(coordMode, allowCoordBorrow): null;
			if (result && coordPos !== Kekule.Render.CoordPos.CENTER)
			{
				if (coordPos === Kekule.Render.CoordPos.CORNER_TL)  // now only handles 2D situation
				{
					var box = this.getExposedContainerBox(coordMode, allowCoordBorrow);
					var delta = {x: (box.x2 - box.x1) / 2, y: (box.y2 - box.y1) / 2};
					if (coordMode === CM.COORD3D)
						delta.z = (box.z2 - box.z1) / 2;
					if (coordMode === CM.COORD3D)
						result = Kekule.CoordUtils.add(result, delta);
					else  // 2D
					{
						result.x += delta.x;
						result.y -= delta.y;
					}
				}
			}
			return result;
		},
		/**
		 * Get absolute center 2D coord of object.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getAbsBaseCoord2D: function(allowCoordBorrow)
		{
			return this.getAbsBaseCoord(Kekule.CoordMode.COORD2D, allowCoordBorrow);
		},
		/**
		 * Get absolute center 3D coord of object.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getAbsBaseCoord3D: function(allowCoordBorrow)
		{
			return this.getAbsBaseCoord(Kekule.CoordMode.COORD3D, allowCoordBorrow);
		},
		/**
		 * Set absolute center coord of object.
		 * @param {Hash} value
		 * @param {Int} coordMode
		 */
		setAbsBaseCoord: function(value, coordMode, allowCoordBorrow)
		{
			var coordPos = this.getCoordPos(coordMode);
			var coord = Object.extend({}, value);
			if (value && coordPos !== Kekule.Render.CoordPos.CENTER)
			{
				if (coordPos === Kekule.Render.CoordPos.CORNER_TL)  // now only handles 2D situation
				{
					var box = this.getExposedContainerBox(coordMode, allowCoordBorrow);
					var delta = {x: (box.x2 - box.x1) / 2, y: (box.y2 - box.y1) / 2};
					if (coordMode === CM.COORD3D)
						delta.z = (box.z2 - box.z1) / 2;
					if (coordMode === CM.COORD3D)
						coord = Kekule.CoordUtils.substract(coord, delta);
					else  // 2D
					{
						coord.x -= delta.x;
						coord.y += delta.y;
					}
				}
			}
			if (this.setAbsCoordOfMode)
				this.setAbsCoordOfMode(coord, coordMode);
			else if (this.setCoordOfMode)
				this.setCoordOfMode(coord, coordMode);
			return this;
		},
		setAbsBaseCoord2D: function(value, allowCoordBorrow)
		{
			return this.setAbsCoordOfMode(value, Kekule.CoordMode.COORD2D, allowCoordBorrow);
		},
		setAbsBaseCoord3D: function(value, allowCoordBorrow)
		{
			return this.setAbsCoordOfMode(value, Kekule.CoordMode.COORD3D, allowCoordBorrow);
		},
		/*
		 * Returns abs center coord of object.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returs {Hash}
		 */
		/*
		getAbsCenterCoord: function(coordMode, allowCoordBorrow)
		{
			var baseCoordPos = this.getCoordPos(coordMode);
			if (coordMode === Kekule.CoordMode.COORD2D && baseCoordPos === Kekule.Render.CoordPos.CORNER_TL)
			{
				var box = this.getExposedContainerBox(coordMode, allowCoordBorrow);
				var result = {'x': (box.x1 + box.x2) / 2, 'y': (box.y1 + box.y2) / 2};
				return result;
			}
			else  // center
				return getAbsBaseCoord(coordMode, allowCoordBorrow);
		},
		*/
		/*
		 * Set the abs center coord of object.
		 * @param {Hash} value
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 */
		/*
		setAbsCenterCoord: function(value, coordMode, allowCoordBorrow)
		{
			var baseCoordPos = this.getCoordPos(coordMode);
			if (coordMode === Kekule.CoordMode.COORD2D && baseCoordPos === Kekule.Render.CoordPos.CORNER_TL)
			{
				var oldCenterCoord = this.getAbsCenterCoord(coordMode, allowCoordBorrow);
				var delta = Kekule.CoordUtils.substract(value, oldCoord);
				var oldBaseCoord = this.getAbsBaseCoord(coordMode, allowCoordBorrow);
				var newBaseCoord = Kekule.CoordUtils.add(oldBaseCoord, delta);
				this.setAbsBaseCoord(newBaseCoord, coordMode);
			}
			else  // center
			{
				this.setAbsBaseCoord(value, coordMode);
			}
			return this;
		},
		*/

		/**
		 * If object is a child of subgroup, this function will return the nearest visible (displayed) ancestor.
		 * @returns {Kekule.ChemStructureObject}
		 */
		getExposedAncestor: function()
		{
			var p = this.getParent();
			if (!p)
				return this;
			else
			{
				if (p.isExpanded())  // parent is expanded, and its child are visible
					return this;
				else
					return p.getExposedAncestor();
			}
		},
		/**
		 * If object is a child of subgroup, check if the subgroup is expanded and the object can be seen.
		 * @returns {Bool}
		 */
		isExposed: function()
		{
			var p = this.getParent();
			return (!p) || (p.isExpanded())
		},
		/**
		 * If object is a sub group, check if it has expanded all its children to render.
		 * @return {Bool}
		 */
		isExpanded: function()
		{
			return true;  // normal atoms or connectors are always expanded (has no child structures)
		},
		setExpanded: function(value)
		{
			//this.setRenderOption('expanded', value);
			// do nothing with normal atoms or connectors
		},
		/**
		 * Similiar to getLinkedObjs, but only with exposed ones.
		 * @returns {Array}
		 */
		getLinkedExposedObjs: function()
		{
			var result = [];
			for (var i = 0, l = this.getLinkedConnectorCount(); i < l; ++i)
			{
				var connector = this.getLinkedConnectorAt(i);
				if (!connector.isExposed())
					continue;
				var objs = connector.getConnectedExposedObjs();
				for (var j = 0, k = objs.length; j < k; ++j)
				{
					if (objs[j] !== this)
						Kekule.ArrayUtils.pushUnique(result, objs[j]);
				}
			}
			return result;
		},
		/**
		 * Returns container box to contain this object with all its exposed children.
		 * Descendants may override this method.
		 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
		 */
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			var result = this.getContainerBox(coordMode, allowCoordBorrow);
			return result;
		},

		/**
		 * Returns all length factors in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the all of bond lengths.
		 * If no length can be found in this object, [] will be returned.
		 * @param {Int} coordMode
		 * @param {Bool}
		 * @returns {Array}
		 */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			return [];
		},
		/**
		 * Return all bonds in structure as well as in sub structure.
		 * @returns {Array} Array of {Kekule.ChemStructureConnector}.
		 */
		getAllContainingConnectors: function()
		{
			if (this.getAllChildConnectors)
				return this.getAllChildConnectors();
			else
				return [];
		},
		/**
		 * Returns median of all connector lengths.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @return {Float}
		 */
		getConnectorLengthMedian: function(coordMode, allowCoordBorrow)
		{
			var connectors = this.getAllContainingConnectors();
			return Kekule.ChemStructureUtils.getConnectorLengthMedian(connectors, coordMode, allowCoordBorrow);
		}
	});

	ClassEx.defineProps(Kekule.ChemObject, [
		// explict set the coord position
		{'name': 'coordPos2D', 'dataType': DataType.INT, 'scope':  Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getCoordPos(Kekule.CoordMode.COORD2D); }
		},
		{'name': 'coordPos3D', 'dataType': DataType.INT, 'scope':  Class.PropertyScope.PUBLIC,
			'getter': function() { return this.getCoordPos(Kekule.CoordMode.COORD3D); }
		},
		// new property, decide the 2D render style of a object (node or connector)
		{'name': 'renderOptions', 'dataType': DataType.OBJECT},
		// new property, decide the 3D render style of a object (node or connector)
		{'name': 'render3DOptions', 'dataType': DataType.OBJECT},

		{'name': 'overrideRenderOptionItems', 'dataType': DataType.ARRAY, 'scope': Class.PropertyScope.PUBLIC},
		{'name': 'overrideRender3DOptionItems', 'dataType': DataType.ARRAY, 'scope': Class.PropertyScope.PUBLIC}

		// new property, decide the interaction state of a object (node or connector), deprecated now
		//{'name': 'interactState', 'dataType': DataType.STRING}
	]);

	ClassEx.extend(Kekule.ChemObjList,
	/** @lends Kekule.ChemObjList# */
	{
		/** @ignore */
		getAllContainingConnectors: function()
		{
			var result = [];
			for (var i = 0, l = this.getItemCount(); i < l; ++i)
			{
				var o = this.getItemAt(i);
				if (o.getAllContainingConnectors)
					result = result.concat(o.getAllContainingConnectors());
			}
			return result;
		},
		/** @ignore */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			var result = [];
			for (var i = 0, l = this.getItemCount(); i < l; ++i)
			{
				var o = this.getItemAt(i);
				if (o.getAllAutoScaleRefLengths)
					result = result.concat(o.getAllAutoScaleRefLengths(coordMode, allowCoordBorrow));
			}
			return result;
		},

		/**
		 * Calculate the box to contain the exposed objects in list.
		 * Descendants may override this method.
		 * @param {Int} coordMode Determine to calculate 2D or 3D box. Value from {@link Kekule.CoordMode}.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash} Box information. {x1, y1, z1, x2, y2, z2} (in 2D mode z1 and z2 will not be set).
		 */
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			var result;
			var childObjs = this.toArray();
			for (var i = 0, l = childObjs.length; i < l; ++i)
			{
				var obj = childObjs[i];
				if (!obj.isExposed())
					continue;
				var box = obj.getExposedContainerBox? obj.getExposedContainerBox(coordMode, allowCoordBorrow):
					obj.getContainerBox? obj.getContainerBox(coordMode, allowCoordBorrow):
					null;
				if (box)
				{
					if (!result)
						result = Object.extend({}, box);
					else
						result = Kekule.BoxUtils.getContainerBox(result, box);
				}
			}
			return result;
		}
	});
	Kekule.ClassDefineUtils.addStandardCoordSupport(Kekule.ChemObjList);

	ClassEx.extend(Kekule.ChemSpaceElement,
	/** @lends Kekule.ChemSpaceElement# */
	{
		/** @ignore */
		getAllContainingConnectors: function()
		{
			return this.getChildren().getAllContainingConnectors();
		},
		/** @ignore */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			return this.getChildren().getAllAutoScaleRefLengths(coordMode, allowCoordBorrow);
		}
	});

	ClassEx.extend(Kekule.ChemSpace,
	/** @lends Kekule.ChemSpace# */
	{
		/** @ignore */
		getAllContainingConnectors: function()
		{
			return this.getRoot().getAllContainingConnectors();
		},
		/** @ignore */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			var result;
			if (this.getDefAutoScaleRefLength())
				result = [this.getDefAutoScaleRefLength()];
			else
				result = this.getRoot().getAllAutoScaleRefLengths(coordMode, allowCoordBorrow);
			/*
			if (!result || !result.length)  // no length found use default one
			{
				result = [this.getAutoScaleRefLength()];
			}
			*/
			return result;
		}
	});

	ClassEx.defineProps(Kekule.ChemObject, [
		{'name': 'defAutoScaleRefLength', 'dataType': DataType.NUMBER}
	]);

	ClassEx.extend(Kekule.BaseStructureConnector,
	/** @lends Kekule.BaseStructureConnector# */
	{
		/**
		 * Get center coord of object. Param coordMode determinate which coord (2D or 3D) will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBaseCoord: function(coordMode, allowCoordBorrow)
		{
			var M = Kekule.CoordMode;
			var result = null;
			var coordCount = 0;
			var sum = (coordMode === M.COORD2D)? {'x': 0, 'y': 0}: {'x': 0, 'y': 0, 'z': 0};
			for (var i = 0, l = this.getConnectedObjCount(); i < l; ++i)
			{
				var obj = this.getConnectedObjAt(i);
				var coord = obj.getBaseCoord? obj.getBaseCoord(coordMode, allowCoordBorrow): null;
				if (coord)
				{
					sum = Kekule.CoordUtils.add(sum, coord);
					++coordCount;
				}
			}
			if (coordCount)
				result = Kekule.CoordUtils.divide(sum, coordCount);
			return result;
		},
		/**
		 * Get center absolute coord of object.
		 * @param {Int} coordMode
		 * @param {Bool}
		 * @returns {Hash}
		 */
		getAbsBaseCoord: function(coordMode, allowCoordBorrow)
		{
			var M = Kekule.CoordMode;
			var result = null;
			var coordCount = 0;
			var sum = (coordMode === M.COORD2D)? {'x': 0, 'y': 0}: {'x': 0, 'y': 0, 'z': 0};
			for (var i = 0, l = this.getConnectedObjCount(); i < l; ++i)
			{
				var obj = this.getConnectedObjAt(i);
				var coord = obj.getAbsBaseCoord? obj.getAbsBaseCoord(coordMode, allowCoordBorrow): null;
				if (coord)
				{
					sum = Kekule.CoordUtils.add(sum, coord);
					++coordCount;
				}
			}
			if (coordCount)
				result = Kekule.CoordUtils.divide(sum, coordCount);
			return result;
		},

		/**
		 * Returns only connected objects exposed to renderer.
		 * @returns {Array}
		 */
		getConnectedExposedObjs: function()
		{
			var objs = this.getConnectedObjs();
			//return objs;
			var result = [];
			for (var i = 0, l = objs.length; i < l; ++i)
			{
				var obj = objs[i].getExposedAncestor();
				if (result.indexOf(obj) < 0)
					result.push(obj);
			}
			return result;
		},

		/**
		 * Return distance between two connected object.
		 * If more than two objects are connected, this function will return null.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float}
		 */
		getLength: function(coordMode, allowCoordBorrow)
		{
			var objs = this.getConnectedObjs();
			if (objs.length !== 2)
				return null;
			else
			{
				var coord1 = objs[0].getAbsBaseCoord? objs[0].getAbsBaseCoord(coordMode, allowCoordBorrow): null;
				var coord2 = objs[1].getAbsBaseCoord? objs[1].getAbsBaseCoord(coordMode, allowCoordBorrow): null;
				return Kekule.CoordUtils.getDistance(coord1, coord2);
			}
		},
		/**
		 * Return 2D distance between two connected object.
		 * If more than two objects are connected, this function will return null.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float}
		 */
		getLength2D: function(allowCoordBorrow)
		{
			return this.getLength(Kekule.CoordMode.COORD2D, allowCoordBorrow);
		},
		/**
		 * Return 3D distance between two connected object.
		 * If more than two objects are connected, this function will return null.
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float}
		 */
		getLength3D: function(allowCoordBorrow)
		{
			return this.getLength(Kekule.CoordMode.COORD3D, allowCoordBorrow);
		}
	});

	ClassEx.extend(Kekule.ChemStructureConnector,
	/** @lends Kekule.ChemStructureConnector# */
	{
		/**
		 * Returns all length factors in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the all of bond lengths.
		 * If no length can be found in this object, [] will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Array}
		 */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			return [this.getLength(coordMode, allowCoordBorrow)];
		}
	});

	ClassEx.extend(Kekule.BaseStructureNode,
	/** @lends Kekule.BaseStructureNode# */
	{
		/**
		 * Get center coord of object.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getBaseCoord: function(coordMode, allowCoordBorrow)
		{
			return this.getCoordOfMode(coordMode, allowCoordBorrow);
		},
		/**
		 * Get absolute center coord of object.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Hash}
		 */
		getAbsBaseCoord: function(coordMode, allowCoordBorrow)
		{
			return this.getAbsCoordOfMode(coordMode, allowCoordBorrow);
		},

		// Calculate the box to fit this object.
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			var result = this.getContainerBox(coordMode, allowCoordBorrow);
			return result;
		},
		getExposedContainerBox2D: function(allowCoordBorrow)
		{
			var result = this.getExposedContainerBox(Kekule.CoordMode.COORD2D, allowCoordBorrow);
			result.width = result.x2 - result.x1;
			result.height = result.y2 - result.y1;
			return result;
		},
		getExposedContainerBox3D: function(allowCoordBorrow)
		{
			var result = this.getExposedContainerBox(Kekule.CoordMode.COORD3D, allowCoordBorrow);
			result.deltaX = result.x2 - result.x1;
			result.deltaY = result.y2 - result.y1;
			result.deltaZ = result.z2 - result.z1;
			return result;
		}
	});

	ClassEx.extend(Kekule.ChemStructureNode,
	/** @lends Kekule.ChemStructureNode# */
	{
		/**
		 * Get label to display the atom.
		 * @param {Int} hydrogenDisplayLevel Value from {@link Kekule.Render.HydrogenDisplayLevel}.
		 * @param {Bool} showCharge Whether display charge of node.
		 * @param {Kekule.Render.DisplayLabelConfigs} displayLabelConfigs
		 */
		getDisplayRichText: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength, chargeMarkType)
		{
			var R = Kekule.Render;
			if (Kekule.ObjUtils.isUnset(showCharge))
				showCharge = true;

			var result = R.RichTextUtils.create();
			var coreItem;
			var customLabel = this.getRenderOption('customLabel');
			if (customLabel)
			{
				coreItem = R.RichTextUtils.strToRichText(customLabel);
			}
			else
			{
				coreItem = this.getCoreDisplayRichTextItem(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength);
			}
			if (coreItem)
			{
				//var coreAnchorItem = coreItem.anchorItem;  // preserve previous core anchor
				if (showCharge)
				{
					coreItem = this.appendElectronStateDisplayText(coreItem, partialChargeDecimalsLength, chargeMarkType);
				}
				if (coreItem)
				{
					R.RichTextUtils.append(result, coreItem);
					//result.anchorItem = coreItem.anchorItem || coreItem;
					//result.anchorItem = coreAnchorItem || coreItem;
					result.anchorItem = coreItem;
				}
			}

			/*
			var charge = this.getCharge();
			if (showCharge && charge)
			{
				var sCharge = '';
				var chargeSign = (charge > 0)? '+': '-';
				var chargeAmount = Math.abs(charge);
				if (chargeAmount != 1)
					sCharge += chargeAmount;
				sCharge += chargeSign;
				R.RichTextUtils.appendText(result, sCharge, {'textType': R.RichText.SUP});
			}
			*/
			/*
			if (showCharge)
				result = this.appendElectronStateDisplayText(result);
			*/

			//console.log('rich text', result);

			return result;
		},
		/** @private */
		getCoreDisplayRichTextItem: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength){
			// do nothing here, descendants need to override this method.
			return null;
		},

		appendElectronStateDisplayText: function(coreItem, partialChargeDecimalsLength, chargeMarkType)
		{
			var R = Kekule.Render;
			var charge = this.getCharge();
			var radical = this.getRadical();
			var section = R.ChemDisplayTextUtils.createElectronStateDisplayTextSection(charge, radical, partialChargeDecimalsLength, chargeMarkType);
			if (section)
			{
				//richText = R.RichTextUtils.append(richText, section);
				var group = R.RichTextUtils.createGroup();
				R.RichTextUtils.append(group, coreItem);
				R.RichTextUtils.append(group, section);
				group.charDirection = Kekule.Render.TextDirection.LTR;
				group.anchorItem = coreItem;
				return group;
			}
			else
				return coreItem;
		}
	});

	ClassEx.extend(Kekule.AbstractAtom,
	/** @lends Kekule.AbstractAtom# */
	{
		/**
		 * Get label to display the atom.
		 * @param {Int} hydrogenDisplayLevel Value from {@link Kekule.Render.HydrogenDisplayLevel}.
		 * @param {Bool} showCharge Whether display charge of node.
		 */
		getDisplayRichText: function($super, hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength, chargeMarkType)
		{
			var R = Kekule.Render;
			if (!hydrogenDisplayLevel)
				hydrogenDisplayLevel = R.HydrogenDisplayLevel.DEFAULT;
			/*
			//var result = this.getCoreDisplayRichText() || R.RichTextUtils.create();
			var result = R.RichTextUtils.create();
			var coreGroup = this.getCoreDisplayRichTextItem();
			if (coreGroup)
			{
				R.RichTextUtils.append(result, coreGroup);
				result.anchorItem = coreGroup.anchorItem || coreGroup;
			}
			*/
			var result = $super(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength, chargeMarkType);

			var hcount = 0;
			switch (hydrogenDisplayLevel)
			{
				case R.HydrogenDisplayLevel.NONE:
					hcount = 0;
					break;
				case R.HydrogenDisplayLevel.ALL:
					hcount = this.getHydrogenCount();
					break;
				case R.HydrogenDisplayLevel.EXPLICIT:
					hcount = this.getExplicitHydrogenCount();
					break;
				case R.HydrogenDisplayLevel.UNMATCHED_EXPLICIT:
				{
					if (this.getImplicitHydrogenCount && (this.getImplicitHydrogenCount() !== this.getExplicitHydrogenCount()))
						hcount = this.getExplicitHydrogenCount();
					break;
				}
			}
			if (hcount)
			{
				result = this.appendHydrogenDisplayText(result, hcount
					/*
					{'textType': R.RichText.SUB, 'charDirection': Kekule.Render.TextDirection.LTR}
					*/
				);
			}
			return result;
		},
		/** @private */
		appendHydrogenDisplayText: function(richText, hcount)
		{
			var R = Kekule.Render;
			if (hcount)
			{
				if (hcount > 1)
				{
					var group = R.RichTextUtils.createGroup();
					group.charDirection = Kekule.Render.TextDirection.LTR;
					// TODO: 'H' is fixed here, but actually it should be read from element symbol database.
					var item = R.RichTextUtils.appendText2(group, 'H');

					R.RichTextUtils.appendText(group, hcount.toString(), {
						'textType': R.RichText.SUB, 'refItem': item
					});
					R.RichTextUtils.append(richText, group);
				}
				else  // hcount == 1
					R.RichTextUtils.appendText(richText, 'H');
			}
			return richText;
		}
	});

	ClassEx.extend(Kekule.Atom,
	/** @lends Kekule.Atom# */
	{
		getCoreDisplayRichTextItem: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength)
		{
			var R = Kekule.Render;
			var result = R.RichTextUtils.createGroup();
			// if isotope is assigned, use <sup>13</sup>C form or isotope alias (such as D), otherwise, use atom symbol only.
			var isotopeAlias = this.getIsotopeAlias();
			var symbol = this.getSymbol();

			if (isotopeAlias || this.getSymbol() !== K.Element.UNSET_ELEMENT)
			{
				var section;
				if (isotopeAlias && Kekule.ChemStructureNodeLabels.ENABLE_ISOTOPE_ALIAS)
				{
					section = R.RichTextUtils.createSection(this.getIsotopeAlias(), {'charDirection': Kekule.Render.TextDirection.LTR});
					result = R.RichTextUtils.append(result, section);
					result.anchorItem = section;
				}
				else
				{
					section = R.RichTextUtils.createSection(this.getSymbol(), {'charDirection': Kekule.Render.TextDirection.LTR});
					result = R.RichTextUtils.append(result, section);
					result.anchorItem = section;
					if (this.getMassNumber() !== Kekule.Isotope.UNSET_MASSNUMBER)
					{
						// mass number as superscript
						result = R.RichTextUtils.insertText(result, 0, this.getMassNumber().toString(), {
							'textType': R.RichText.SUP,
							'charDirection': Kekule.Render.TextDirection.LTR,
							'refItem': result.anchorItem
						});
						result.charDirection = Kekule.Render.TextDirection.LTR;
					}
				}
			}
			else // no element assigned
 				result = R.RichTextUtils.appendText(result, (displayLabelConfigs && displayLabelConfigs.getUnsetElement()) || NL.UNSET_ELEMENT);
			return result;
		}
	});

	ClassEx.extend(Kekule.Pseudoatom,
	/** @lends Kekule.Pseudoatom# */
	{
		/** @ignore */
		getCoreDisplayRichTextItem: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength)
		{
			var R = Kekule.Render;
			var s;
			var D = displayLabelConfigs;
			/*
			switch (this.getAtomType())
			{
				case Kekule.PseudoatomType.DUMMY: s = (D && D.getDummyAtom()) || NL.DUMMY_ATOM; break;
				case Kekule.PseudoatomType.ANY: s = (D && D.getAnyAtom()) || NL.ANY_ATOM; break;
				case Kekule.PseudoatomType.HETERO: s = (D && D.getHeteroAtom()) || NL.HETERO_ATOM; break;
				default:   // user custom
					s = this.getSymbol();
			}
			*/
			s = this.getLabel();
			if (!s)
				s = (D && D.getUnsetElement()) || NL.UNSET_ELEMENT;
			//return R.RichTextUtils.strToRichText(s);
			/*
			var result = R.RichTextUtils.createGroup();
			R.RichTextUtils.appendText(result, s, null, true);  // anchorItem
			*/
			var result = R.RichTextUtils.createSection(s, {'charDirection': Kekule.Render.TextDirection.LTR});
			return result;
		}
	});

	// turn a H2 like isotope id to display label rich text
	var appendIsotopeIdToRichText = function(richText, isotopeId, isAnchor)
		{
			var R = Kekule.Render;
			var detail = Kekule.IsotopesDataUtil.getIsotopeIdDetail(isotopeId);
			var massSection;
			if (detail.massNumber)
				massSection = R.RichTextUtils.appendText2(richText, detail.massNumber.toString(),
					{'textType': Kekule.Render.RichText.SUP, 'charDirection': Kekule.Render.TextDirection.LTR});
			var symbolSection = R.RichTextUtils.appendText2(richText, detail.symbol, {'charDirection': Kekule.Render.TextDirection.LTR}, isAnchor);
			if (massSection)
				massSection.refItem = symbolSection;
			richText.charDirection = Kekule.Render.TextDirection.LTR;
			return richText;
		};

	ClassEx.extend(Kekule.VariableAtom,
	/** @lends Kekule.VariableAtom# */
	{
		/** @ignore */
		getCoreDisplayRichTextItem: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength)
		{
			var R = Kekule.Render;
			var D = displayLabelConfigs;
			var result;
			if (this.isListEmpty())
			{
				result = R.RichTextUtils.strToRichText((D && D.getVariableAtom()) || NL.VARIABLE_ATOM);
				result.charDirection = Kekule.Render.TextDirection.LTR;
				return result;
			}

			var isotopeIds = this.getAllowedIsotopeIds() || this.getDisallowedIsotopeIds();
			var isDisallowed = this.isDisallowedList();
			//var result = R.RichTextUtils.create();
			result = R.RichTextUtils.createGroup();
			result.charDirection = Kekule.Render.TextDirection.LTR;
			if (isDisallowed)
				result = R.RichTextUtils.appendText(result, D.getIsoListDisallowPrefix());
			result = R.RichTextUtils.appendText(result, D.getIsoListLeadingBracket());
			if (isotopeIds && isotopeIds.length)
			{
				for (var i = 0, l = isotopeIds.length; i < l; ++i)
				{
					var id = isotopeIds[i];
					if (id)
					{
						if (i != 0)  // not leading isotope, append delimiter
							result = R.RichTextUtils.appendText(result, D.getIsoListDelimiter());
						result = appendIsotopeIdToRichText(result, id, i == 0);  // first isotope is the anchor
					}
				}
			}
			result = R.RichTextUtils.appendText(result, D.getIsoListTailingBracket());
			return result;
		}
	});

	ClassEx.extend(Kekule.StructureConnectionTable,
	/** @lends Kekule.StructureConnectionTable# */
	{
		// check if nodes inside has 2D coords
		exposedNodesHasCoord2D: function(allowCoordBorrow)
		{
			var nodes = this.getExposedNodes();
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				if (nodes[i].hasCoord2D(allowCoordBorrow))
					return true;
			}
			return false;
		},
		exposedNodesHasCoord3D: function(allowCoordBorrow)
		{
			var nodes = this.getExposedNodes();
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				if (nodes[i].hasCoord3D(allowCoordBorrow))
					return true;
			}
			return false;
		},
		// return all exposed nodes (including ones inside subgroups)
		getExposedNodes: function()
		{
			var result = [];
			var nodes = this.getNodes();
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				if (node.getExposedNodes && node.isExpanded())  // is sub group and expanded
				{
					var subNodes = node.getExposedNodes();
					result = result.concat(subNodes);
				}
				else if (node.isExposed())
					result.push(node);
			}
			return result;
		},
		// return all exposed connectors (including ones inside subgroups)
		getExposedConnectors: function()
		{
			var result = this.getConnectors();
			var nodes = this.getNodes();
			for (var i = 0, l = nodes.length; i < l; ++i)
			{
				var node = nodes[i];
				if (node.getConnectors && node.isExpanded())
				{
					var subConnectors = node.getExposedConnectors();
					result = result.concat(subConnectors);
				}
			}
			return result;
		},
		// Calculate the box to fit all exposed nodes in CTable.
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			//console.log(this.getExposedNodes());
			var nodes = this.getExposedNodes();
			if (nodes.length)
				return this.getNodesContainBox(nodes, coordMode, allowCoordBorrow);
			else  // no exposed nodes
				return null;
		},
		getExposedContainerBox2D: function(allowCoordBorrow)
		{
			var result = this.getExposedContainerBox(Kekule.CoordMode.COORD2D, allowCoordBorrow);
			result.width = result.x2 - result.x1;
			result.height = result.y2 - result.y1;
			return result;
		},
		getExposedContainerBox3D: function(allowCoordBorrow)
		{
			var result = this.getExposedContainerBox(Kekule.CoordMode.COORD3D, allowCoordBorrow);
			result.deltaX = result.x2 - result.x1;
			result.deltaY = result.y2 - result.y1;
			result.deltaZ = result.z2 - result.z1;
			return result;
		},
		/**
		 * Returns median of all connector lengths.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @return {Float}
		 */
		getConnectorLengthMedian: function(coordMode, allowCoordBorrow)
		{
			var connectors = this.getAllContainingConnectors();
			/*
			var lengths = [];
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				if (connector && connector.getLength)
				{
					var length = connector.getLength(coordMode, allowCoordBorrow);
					if (length)
						lengths.push(length);
				}
			}
			if (l === 0)  // no connectors at all
				return 1;  // TODO: this value should be calculated
			if (l <= 1)
				return lengths[0];
			else
			{
				// sort lengths to find the median one
				lengths.sort();
				var count = lengths.length;
				return (count % 2)? lengths[(count + 1) >> 1]: (lengths[count >> 1] + lengths[(count >> 1) + 1]) / 2;
			}
			*/
			return Kekule.ChemStructureUtils.getConnectorLengthMedian(connectors, coordMode, allowCoordBorrow);
		},

		/**
		 * Returns all length factors in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the all of bond lengths.
		 * If no length can be found in this object, [] will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Array}
		 */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			var connectors = this.getAllContainingConnectors();
			var result = [];
			for (var i = 0, l = connectors.length; i < l; ++i)
			{
				var connector = connectors[i];
				if (connector && connector.getAllAutoScaleRefLengths)
				{
					var lengths = connector.getAllAutoScaleRefLengths(coordMode, allowCoordBorrow);
					if (lengths)
						result = result.concat(lengths);
				}
			}
			return result;
		}
	});

	ClassEx.extend(Kekule.ContentBlock, {
		/** @ignore */
		getDefCoordPos: function($super, coordMode)
		{
			if (coordMode !== CM.COORD3D)
				return Kekule.Render.CoordPos.CORNER_TL;
			else
				return $super(coordMode);
		}
	});

	ClassEx.extend(Kekule.StructureFragment,
	/** @lends Kekule.StructureFragment# */
	{
		// StructureFragment may has child nodes and can be expanded
		isExpanded: function()
		{
			var o = this.getOverriddenRenderOptions();
			return o? (!!o.expanded): false;
		},
		setExpanded: function(value)
		{
			this.setRenderOption('expanded', value);
		},
		// return all exposed nodes (including ones inside subgroups)
		getExposedNodes: function()
		{
			if (this.hasCtab())
				return this.getCtab().getExposedNodes();
			else
				return [];
		},
		// return all exposed connectors (including ones inside subgroups)
		getExposedConnectors: function()
		{
			if (this.hasCtab())
				return this.getCtab().getExposedConnectors();
			else
				return [];
		},
		// check if nodes inside has 2D coords
		exposedNodesHasCoord2D: function(allowCoordBorrow)
		{
			if (this.hasCtab())
				return this.getCtab().exposedNodesHasCoord2D(allowCoordBorrow);
			else
				return false;
		},
		exposedNodesHasCoord3D: function(allowCoordBorrow)
		{
			if (this.hasCtab())
				return this.getCtab().exposedNodesHasCoord3D(allowCoordBorrow);
			else
				return false;
		},

		// Calculate the box to fit all exposed nodes in CTable.
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			if (this.hasCtab())
			{
				var box = this.getCtab().getExposedContainerBox(coordMode, allowCoordBorrow);
				if (!box)  // may be all sub nodes are not exposed
					box = this.getContainerBox(coordMode, allowCoordBorrow);
				return box;
			}
			else /*  if (this.hasFormula()) */
			{
				//return this.getFormula().getExposedContainerBox(coordMode);
				return this.getContainerBox(coordMode, allowCoordBorrow);
			}
		},

		/**
		 * Returns median of all connector lengths.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @return {Float}
		 */
		getConnectorLengthMedian: function(coordMode, allowCoordBorrow)
		{
			if (this.hasCtab())
				return this.getCtab().getConnectorLengthMedian(coordMode, allowCoordBorrow);
			else
				return null;
		},
		/**
		 * Returns length factor in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the median of bond length.
		 * If no length can be found in this object, null will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Float}
		 */
		getAutoScaleRefLength: function(coordMode, allowCoordBorrow)
		{
			return this.getConnectorLengthMedian(coordMode, allowCoordBorrow);
		},

		/**
		 * Returns all length factors in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the all of bond lengths.
		 * If no length can be found in this object, [] will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Array}
		 */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			if (this.hasCtab())
				return this.getCtab().getAllAutoScaleRefLengths(coordMode, allowCoordBorrow);
			else
				return null;
		}
	});

	ClassEx.extend(Kekule.SubGroup,
	/** @lends Kekule.SubGroup# */
	{
		/** @ignore */
		getCoreDisplayRichTextItem: function(hydrogenDisplayLevel, showCharge, displayLabelConfigs, partialChargeDecimalsLength)
		{
			var R = Kekule.Render;
			//var result = R.RichTextUtils.create();
			/*
			var result = R.RichTextUtils.createGroup();
			result = R.RichTextUtils.appendText(result, C.getDisplayLabelConfigs.getRgroup(), null, true);
			*/
			var formula = null;
			var caption = this.getAbbr();
			if (!caption)  // caption not set, use formula as display text
			{
				if (this.getFormulaText())
					formula = Kekule.FormulaUtils.textToFormula(this.getFormulaText());
				else
					formula = this.getFormula(false) || this.calcFormula();
				if (!formula || formula.isEmpty())  // formula empty, use default caption
					caption = (displayLabelConfigs && displayLabelConfigs.getRgroup()) || NL.SUBGROUP;
			}
			var result;
			if (caption)
			{
				if (caption.length <= 3)  // to short caption, e.g. Me, all regard as one section and aligns to the center
				{
					result = R.RichTextUtils.createSection(caption);
					result.charDirection = Kekule.Render.TextDirection.LTR;
				}
				else // to long, e.g. t-Bu, usually the first uppercase letter (or first letter) should be the anchor section
				{
					var anchorIndex = this._indexOfFirstUppercaseLetter(caption);
					if (anchorIndex < 0)  // no uppercase, use first letter
						anchorIndex = 0;
					result = R.RichTextUtils.createGroup();
					result.charDirection = Kekule.Render.TextDirection.LTR;
					// heading section
					if (anchorIndex > 0)
					{
						section = R.RichTextUtils.createSection(caption.substring(0, anchorIndex));
						section.charDirection = Kekule.Render.TextDirection.INHERIT;
						result = R.RichTextUtils.append(result, section);
					}
					// anchor section
					var section = R.RichTextUtils.createSection(caption.charAt(anchorIndex));
					result = R.RichTextUtils.append(result, section);
					result.anchorItem = section;
					// tailing section
					if (anchorIndex < caption.length - 1)
					{
						section = R.RichTextUtils.createSection(caption.substring(anchorIndex + 1));
						section.charDirection = Kekule.Render.TextDirection.INHERIT;
						result = R.RichTextUtils.append(result, section);
					}
					//console.log(caption, result);
				}
			}
			else if (formula)
			{
				result = formula.getDisplayRichText(showCharge, displayLabelConfigs, partialChargeDecimalsLength);
				// first normal section of result usually should be the anchor section
				var section = R.RichTextUtils.getFirstNormalTextSection(result);
				if (!section)
					section = result.items[0];

				result.anchorItem = /* anchorItem; // */ section;
			}
			return result;
		},

		/** @private */
		_indexOfFirstUppercaseLetter: function(str)
		{
			for (var i = 0, l = str.length; i < l; ++i)
			{
				var sChar = str.charAt(i);
				if (sChar >= 'A' && sChar <= 'Z')
					return i;
			}
			return -1;
		},

		/** @private */
		_autoSetSelfCoord: function(coordMode, allowCoordBorrow)
		{
			if (this._isAutoSettingSelfCoord)
				return;
			if (this.getCoordOfMode(coordMode, allowCoordBorrow))
				return;
			var count = this.getAnchorNodeCount();
			if (count <= 0)
				return;
			this.beginUpdate();
			try
			{
				this._isAutoSettingSelfCoord = true;
				var coordSum = {};
				for (var i = 0; i < count; ++i)
				{
					var node = this.getAnchorNodeAt(i);
					if (node._autoSetSelfCoord)
						node._autoSetSelfCoord(coordMode, allowCoordBorrow);
					var coord = node.getAbsCoordOfMode(coordMode, allowCoordBorrow);
					if (coord)
						coordSum = Kekule.CoordUtils.add(coordSum, coord);
				}
				var newCoord = Kekule.CoordUtils.divide(coordSum, count);
				// change self
				this.setAbsCoordOfMode(newCoord, coordMode);
				//console.log('auto set', this.getId(), newCoord, this.getCoordOfMode(coordMode));
				var coordDelta = this.getCoordOfMode(coordMode) || {};
				// change children
				var count = this.getNodeCount();
				for (var i = 0; i < count; ++i)
				{
					var node = this.getNodeAt(i);
					var coord = node.getCoordOfMode(coordMode, allowCoordBorrow);
					//console.log(coord, coordDelta);
					if (coord)  // if coord not set, node is in default pos (0,0), do not change it.
					{
						coord = Kekule.CoordUtils.substract(coord, coordDelta);
						node.setCoordOfMode(coord, coordMode);
					}
				}
			}
			finally
			{
				this._isAutoSettingSelfCoord = false;
				this.endUpdate();
			}
		},

		/** @ignore */
		/*
		getAbsCoordOfMode: function($super, coordMode, allowCoordBorrow)
		{
			if (!this.getCoordOfMode(coordMode, allowCoordBorrow))  // coord not set, need to auto set it
				this._autoSetSelfCoord(coordMode, allowCoordBorrow);
			return $super(coordMode, allowCoordBorrow);
		},
		*/
		/** @ignore */
		/*
		setAbsCoordOfMode: function($super, coord, coordMode)
		{
			if (!this.getCoordOfMode(coordMode))  // coord not set, need to auto set it
				this._autoSetSelfCoord(coordMode);
			return $super(coord, coordMode);
		}
		*/
		/** @ignore */
		doGetAbsCoord2D: function($super, allowCoordBorrow)
		{
			this._autoSetSelfCoord(Kekule.CoordMode.COORD2D, allowCoordBorrow);
			return $super(allowCoordBorrow);
		},
		/** @ignore */
		doGetAbsCoord3D: function($super, allowCoordBorrow)
		{
			this._autoSetSelfCoord(Kekule.CoordMode.COORD3D, allowCoordBorrow);
			return $super(allowCoordBorrow);
		},
		/** @ignore */
		doSetAbsCoord2D: function($super, value)
		{
			this._autoSetSelfCoord(Kekule.CoordMode.COORD2D);
			return $super(value);
		},
		/** @ignore */
		doSetAbsCoord3D: function($super, value)
		{
			this._autoSetSelfCoord(Kekule.CoordMode.COORD3D);
			return $super(value);
		}
	});

	ClassEx.extend(Kekule.MolecularFormula,
	/** @lends Kekule.MolecularFormula# */
	{
		getDisplayRichText: function(showCharge, displayLabelConfigs, partialChargeDecimalsLength, chargeMarkType)
		{
			var R = Kekule.Render;
			if (Kekule.ObjUtils.isUnset(showCharge))
				showCharge = true;
			return R.ChemDisplayTextUtils.formulaToRichText(this, showCharge, null, partialChargeDecimalsLength, displayLabelConfigs, chargeMarkType);
		},
		/**
		 * Return plain text to represent formula.
		 * @return {String}
		 */
		getDisplayText: function(showCharge, displayLabelConfigs, partialChargeDecimalsLength)
		{
			var richText = this.getDisplayRichText();
			return Kekule.Render.RichTextUtils.toText(richText);
		}
	});

	ClassEx.extend(Kekule.Molecule,
	/** @lends Kekule.Molecule# */
	{
		/*
		 * IMPORTANT: YUI Compressor will change $origin to a dump var name, so ClassEx.extend is unable to find
		 * suitable original function!!!!!
		 * TODO: need to find a solution later.
		 */
		/*
		initialize: function($origin, id, name)
		{
			$origin(id, name);
			this.setExpanded(true);  // molecule is defaultly expanded
		}
		*/
		afterInitialization: function()
		{
			this.setExpanded(true);  // molecule is defaultly expanded
		}
	});

	ClassEx.extend(Kekule.CompositeMolecule,
	/** @lends Kekule.CompositeMolecule# */
	{
		// Calculate the box to fit all exposed nodes in CTable.
		getExposedContainerBox: function(coordMode, allowCoordBorrow)
		{
			var result = null;
			var subMols = this.getPropStoreFieldValue('subMolecules');
			if (subMols)
			{
				for (var i = 0, l = subMols.length; i < l; ++i)
				{
					var mol = subMols[i];
					var box = mol.getExposedContainerBox(coordMode, allowCoordBorrow);
					if (box)
					{
						if (!result)
							result = Object.extend({}, box);
						else
							result = Kekule.BoxUtils.getContainerBox(result, box);
					}
				}
			}
			return result;
		},

		/**
		 * Returns all length factors in object to help the scale ratio in autoscale mode.
		 * To molecule, typically this is the all of bond lengths.
		 * If no length can be found in this object, [] will be returned.
		 * @param {Int} coordMode
		 * @param {Bool} allowCoordBorrow
		 * @returns {Array}
		 */
		getAllAutoScaleRefLengths: function(coordMode, allowCoordBorrow)
		{
			var result = [];
			var subMols = this.getPropStoreFieldValue('subMolecules');
			if (subMols)
			{
				for (var i = 0, l = subMols.getItemCount(); i < l; ++i)
				{
					var mol = subMols.getObjAt(i);
					var lens = mol.getAllAutoScaleRefLengths(coordMode, allowCoordBorrow);
					if (lens)
					{
						result = result.concat(lens);
					}
				}
			}
			return result;
		}
	});
})();
