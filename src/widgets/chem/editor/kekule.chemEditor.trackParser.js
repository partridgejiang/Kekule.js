/**
 * @fileoverview
 * Input chem structure by touch or mouse track.
 * @author Partridge Jiang
 */


/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /algorithm/kekule.graph.js
 * requires /widgets/chem/editor/kekule.chemEditor.baseEditors.js
 * requires /widgets/chem/editor/kekule.chemEditor.configs.js
 */

(function(){
"use strict";

var AU = Kekule.ArrayUtils;
var CU = Kekule.CoordUtils;

/**
 * An enumeration of constraint when refining a track.
 * Indicating whether the end of track points is fixed to an existing node.
 * @type {enum}
 */
Kekule.Editor.PointerTrackConstraint = {
	/** The track is totally free, not linked to any existing nodes. **/
	NONE: 0,
	/** The leading point is binding to a node. **/
	LEADING: 1,
	/** The leading and ending points are binding to two different nodes. **/
	BOTH: 2,
	/** The leading and ending points are binding to one nodes, forming a circle. **/
	CIRCLE: 5
};

/**
 * A class to parse the touch/mouse track and generate corresponding chem structure.
 * @class
 * @augments ObjectEx
 */
Kekule.Editor.TrackParser = Class.create(ObjectEx,
/** @lends Kekule.Editor.TrackParser# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.TrackParser',

	/**
	 * Simplify curve to line segments using Ramer–Douglas–Peucker algorithm.
	 * @param {Array} curvePoints Array of {x, y} coords to define a curve.
	 * @param {Float} distanceThreshold
	 * @returns {Array} Array of {x, y} coords, every two points define a line segment.
	 * @private
	 */
	simplifyCurveToLineSegments: function(curvePoints, distanceThreshold)
	{
		return Kekule.GeometryUtils.simplifyCurveToLineSegments(curvePoints, distanceThreshold);
		/*
		//distanceThreshold = distanceThreshold || this.getLineSimplificationDistanceThreshold();
		if (!distanceThreshold)
			return curvePoints;

		if (curvePoints.length <= 2)
			return AU.clone(curvePoints);
		return this._simplifyCurvePartToLineSegments(curvePoints, 0, curvePoints.length - 1, distanceThreshold);
		*/
	},
	/* @private */
	/*
	_simplifyCurvePartToLineSegments: function(curvePoints, startIndex, endIndex, distanceThreshold)
	{
		var startCoord = curvePoints[startIndex];
		var endCoord = curvePoints[endIndex];

		if (endIndex - startIndex <= 1)
		{
			return [startCoord, endCoord];
		}

		var maxDistance = distanceThreshold, maxIndex = null;
		for (var i = startIndex + 1; i < endIndex; ++i)
		{
			var d = Kekule.GeometryUtils.getDistanceFromPointToLine(curvePoints[i], startCoord, endCoord);
			if (d > maxDistance)
			{
				maxDistance = d;
				maxIndex = i;
			}
		}
		if (maxIndex === null)  // no max distance point
		{
			return [startCoord, endCoord];
		}
		else  // split track to two
		{
			var lines1 = this._simplifyCurvePartToLineSegments(curvePoints, startIndex, maxIndex, distanceThreshold);
			var lines2 = this._simplifyCurvePartToLineSegments(curvePoints, maxIndex, endIndex, distanceThreshold);
			lines2.shift();  // remove the common point between lines1 and lines2
			var result = [].concat(lines1).concat(lines2);
			return result;
		}
	},
	*/

	/**
	 * Add cross points of line segments. Those points should be regarded as node in structure.
	 * @param {Array} linePoints
	 * @returns {Array} New line points with cross points.
	 */
	addLineCrossPoints: function(linePoints)
	{
		var crossPoints = [];

		var length = linePoints.length;
		for (var i = 0; i < length - 1; ++i)
		{
			var currLine = {'coord1': linePoints[i], 'coord2': linePoints[i + 1]};
			for (var j = i + 2; j < length - 1; ++j)
			{
				var testLine = {'coord1': linePoints[j], 'coord2': linePoints[j + 1]};
				// test cross point
				var crossPoint = Kekule.GeometryUtils.getCrossPointOfLines(currLine.coord1, currLine.coord2, testLine.coord1, testLine.coord2);
				if (crossPoint)
				{
					//console.log('cross at', i, j);
					this._addInsertedPoint(i, crossPoint, crossPoints);
					this._addInsertedPoint(j, crossPoint, crossPoints);
				}
			}
		}
		//console.log('crossPoints', crossPoints);
		// sort cross points
		for (var i = 0; i < length - 1; ++i)
		{
			if (crossPoints[i])
			{
				this._sortInsertedPointsInLine(crossPoints[i], linePoints[i], linePoints[i + 1]);
				/*
				var currLine = {'coord1': linePoints[i], 'coord2': linePoints[i + 1]};
				crossPoints[i].sort(function(p1, p2){
					var deltaX = currLine.coord2.x - currLine.coord1.x;
					var deltaY = currLine.coord2.y - currLine.coord1.y;
					if (Math.abs(deltaY) > Math.abs(deltaX))
					{
						return -(p2.y - p1.y) * deltaY;
					}
					else
					{
						return -(p2.x - p1.x) * deltaX;
					}
				});
				*/
			}
		}

		// add those cross points
		var result = [];
		for (var i = 0; i < length - 1; ++i)
		{
			result.push(linePoints[i]);
			if (crossPoints[i])
			{
				for (var j = 0, k = crossPoints[i].length; j < k; ++j)
					result.push(crossPoints[i][j]);
			}
		}
		result.push(linePoints[length - 1]);
		return result;
	},

	/**
	 * If a point is very close to line (distance less than threshold), this point should be considered
	 * on the line.
	 * @param {Array} linePoints
	 * @param {Float} distanceThreshold
	 * @returns {Array}
	 */
	addVertexToLineMergePoint: function(linePoints, distanceThreshold)
	{
		//distanceThreshold = distanceThreshold || this.getVertexMergeRadius();
		if (distanceThreshold <= 0)
			return linePoints;

		var length = linePoints.length;
		var insertedPoints = [];

		for (var i = 0; i < length - 1; ++i)
		{
			var currPoint = linePoints[i];
			for (var j = 0; j < length - 1; ++j)
			{
				if (j < i - 1 || j > i + 1)  // point i is not in line j
				{
					var perpendicularPoint = Kekule.GeometryUtils.getPerpendicularCrossPointFromCoordToLine(currPoint, linePoints[j], linePoints[j + 1], false);
					if (perpendicularPoint)
					{
						var d = Kekule.CoordUtils.getDistance(currPoint, perpendicularPoint);
						if (d <= distanceThreshold)  // linePoints[i] very close to line j - j+1, add merge point
						{
							currPoint.x = perpendicularPoint.x;
							currPoint.y = perpendicularPoint.y;
							this._addInsertedPoint(j, currPoint, insertedPoints);
						}
					}
				}
			}
		}
		// at last add all insertedPoints to result
		var result = [];
		for (var i = 0; i < length - 1; ++i)
		{
			result.push(linePoints[i]);
			if (insertedPoints[i])
			{
				this._sortInsertedPointsInLine(insertedPoints[i], linePoints[i], linePoints[i + 1]);
				for (var j = 0, k = insertedPoints[i].length; j < k; ++j)
					result.push(insertedPoints[i][j]);
			}
		}
		result.push(linePoints[length - 1]);
		return result;
	},

	/** @private */
	_addInsertedPoint: function(index, point, points)
	{
		if (!points[index])
			points[index] = [];
		points[index].push(point);
	},
	/** @private */
	_sortInsertedPointsInLine: function(insertedPoints, lineCoord1, lineCoord2)
	{
		if (!insertedPoints)
			return;

		var deltaX = lineCoord2.x - lineCoord1.x;
		var deltaY = lineCoord2.y - lineCoord1.y;

		insertedPoints.sort(function(p1, p2){
			if (Math.abs(deltaY) > Math.abs(deltaX))
			{
				return -(p2.y - p1.y) * deltaY;
			}
			else
			{
				return -(p2.x - p1.x) * deltaX;
			}
		});
	},

	/**
	 * Merge some near points in line segments.
	 * @param {Kekule.Graph} graph
	 * @param {Float} distanceThreshold
	 */
	mergeNearbyTrackPoints: function(trackPoints, distanceThreshold)
	{
		//console.log('merge point', distanceThreshold);
		if (distanceThreshold <= 0)
			return trackPoints;

		var HANDLED_FLAG_FIELD = '__$merge_handled__';
		var WEIGHT_FIELD = '__$merge_weight__';
		var length = trackPoints.length;
		var result = trackPoints.concat([]);
		for (var i = 0; i < length; ++i)
		{
			var basePoint = result[i];
			if (!basePoint[HANDLED_FLAG_FIELD])
			{
				//basePoint.__index__ = i;  // debug flag
				for (var j = i + 1; j < length; ++j)
				{
					var currPoint = result[j];
					if (!currPoint[HANDLED_FLAG_FIELD])
					{
						var baseWeight = basePoint[WEIGHT_FIELD] || 1;
						var currWeight = currPoint[WEIGHT_FIELD] || 1;
						var d = Kekule.CoordUtils.getDistance(basePoint, currPoint);
						if (d <= distanceThreshold)  // need merge
						{
							//console.log('distance of ', i, j, 'is', d);
							var newCoord;
							var newWeight = baseWeight + currWeight;
							basePoint[WEIGHT_FIELD] = newWeight;
							if (basePoint.boundObj)  // basePoint bounded to an existing node, should not change its coord
								newCoord = basePoint;
							else if (currPoint.boundObj)  // should use currPoint coord
							{
								newCoord = currPoint;
								basePoint.boundObj = currPoint.boundObj;  // important, do not lose bound obj info
							}
							else  // no bound node, calculate new coord
							{
								newCoord = (baseWeight === 1) ? basePoint : CU.multiply(basePoint, baseWeight);
								newCoord = CU.add(newCoord, (currWeight === 1) ? currPoint : CU.multiply(currPoint, currWeight));
								newCoord = CU.divide(newCoord, newWeight);
							}
							// assign new coord value to old point
							basePoint.x = newCoord.x;
							basePoint.y = newCoord.y;
							//basePoint.boundObj = basePoint.boundObj || currPoint.boundObj;  // important, do not lose bound obj info
							// replace currPoint with basePoint
							result.splice(j, 1, basePoint);
						}
					}
				}
			}
			basePoint[HANDLED_FLAG_FIELD] = true;
		}
		//console.log('track after merge', result);
		return result;
	},

	/**
	 * Merge some near vertexes in graph.
	 * @param {Kekule.Graph} graph
	 * @param {Float} distanceThreshold
	 */
	mergeCloseVertexes: function(graph, distanceThreshold)
	{
		distanceThreshold = distanceThreshold || this.getVertexMergeRadius();
		if (distanceThreshold <= 0)
			return graph;

		return this._doMergeCloseVertexes(graph, distanceThreshold);
	},
	/** @private */
	_doMergeCloseVertexes: function(graph, distanceThreshold)
	{
		var vertexes = graph.getVertexes();
		var length = vertexes.length;
		var hasNewMerge = false;
		for (var i = 0; i < length; ++i)
		{
			var baseVertex = vertexes[i];
			var baseCoord = vertexes[i].getData('coord');
			for (var j = i + 1; j < length; ++j)
			{
				var currVertex = vertexes[j];
				var currCoord = currVertex.getData('coord');
				var d = Kekule.CoordUtils.getDistance(baseCoord, currCoord);
				if (d <= distanceThreshold)  // need merge
				{
					this._doMergeVertex(graph, baseVertex, currVertex);
					hasNewMerge = true;
					break;
				}
			}
			if (hasNewMerge)
				break;
		}

		if (hasNewMerge)  // need to check if further merge is needed
			return this._doMergeCloseVertexes(graph, distanceThreshold);
		else  // no new merge, return the old graph
			return graph;
	},
	/** @private */
	_doMergeVertex: function(graph, baseVertex, mergedVertex)
	{
		var baseVertexCoord = baseVertex.getData('coord');
		var baseVertexWeight = baseVertex.getData('weight') || 1;
		var mergedVertexCoord = mergedVertex.getData('coord');
		var mergedVertexWeight = mergedVertex.getData('weight') || 1;

		var mergingEdges = AU.clone(mergedVertex.getEdges());

		for (var i = 0, l = mergingEdges.length; i < l; ++i)
		{
			var edge = mergingEdges[i];
			edge.replaceVertex(mergedVertex, baseVertex);
		}
		graph.removeVertex(mergedVertex);

		/*
		console.log('merged edges', mergingEdges.length);
		var neighborVertexes = [];
		for (i = 0, l = mergingEdges.length; i < l; ++i)
		{
			var vertex = mergedVertex.getNeighborOnEdge(mergingEdges[i]);
			neighborVertexes.push(vertex);
		}

		graph.removeVertex(mergedVertex);
		for (var i = 0, l = mergingEdges.length; i < l; ++i)
		{
			var edge = mergingEdges[i];
			var neighborVertex = neighborVertexes[i];
			if (neighborVertex !== baseVertex)
				graph.addEdge(edge, baseVertex, neighborVertex);
		}
		*/

		// change coord
		var newCoord = (baseVertexWeight === 1)? baseVertexCoord: CU.multiply(baseVertexCoord, baseVertexWeight);
		newCoord += (mergedVertexWeight === 1)? mergedVertexCoord: CU.multiply(mergedVertexCoord, mergedVertexWeight);
		newCoord = CU.divide(newCoord, baseVertexWeight + mergedVertexWeight);
		baseVertex.setData('coord', newCoord);
	},

	/**
	 * Remove continuous coord sequence caused by nearby point merging.
	 * @param {Array} trackCoords
	 * @returns {Array}
	 */
	removeRepetitivePoints: function(trackCoords)
	{
		var result = [];
		var lastCoord = null;
		for (var i = 0, l = trackCoords.length; i < l; ++i)
		{
			if (trackCoords[i] !== lastCoord)
			{
				result.push(trackCoords[i]);
				lastCoord = trackCoords[i];
			}
		}
		return result;
	},

	/**
	 * Simplify and standardize a track
	 * @param {Hash} trackCoords
	 * @returns {Hash}
	 */
	refineTrack: function(trackCoords, simplifyDistanceThreshold, mergeDistanceThreshold)
	{
		var result = this.simplifyCurveToLineSegments(trackCoords, simplifyDistanceThreshold);
		result = this.addLineCrossPoints(result);
		//console.log('1', result);
		result = this.addVertexToLineMergePoint(result, mergeDistanceThreshold);
		//console.log('2', result);
		result = this.mergeNearbyTrackPoints(result, mergeDistanceThreshold);
		//console.log('3', result);
		result = this.removeRepetitivePoints(result);
		//console.log('4', result);
		return result;
	},

	/**
	 * Convert track coord sequence to a chem structure fragment.
	 * @param {Kekule.Editor.BaseEditor} editor The target editor widget.
	 * @param {Array} trackCoords Screen coords of track.
	 * @param {String} defIsotopeId
	 * @param {Kekule.StructureFragment} structFragment Optional. If not set, a new structure fragment will be created and returned.
	 * @returns {Kekule.StructureFragment}
	 */
	convertTrackToStructure: function(editor, trackCoords, defIsotopeId, structFragment)
	{
		if (!trackCoords || !trackCoords.length)
			return null;

		var length = trackCoords.length;
		if (length < 2)  // at least we need two coords to form a bond
			return null;

		var result = structFragment || new Kekule.StructureFragment();
		var NODE_FIELD = '__$structure_node__';
		var lastNode;

		for (var i = 0; i < length; ++i)
		{
			var coord = trackCoords[i];
			var node = coord[NODE_FIELD];
			if (!node)  // haven't added to structure yet
			{
				// add new node
				node = new Kekule.Atom();  //null, defIsotopeId);  // add C atom
				node.setIsotopeId(defIsotopeId);
				editor.setObjectScreenCoord(node, coord);
				coord[NODE_FIELD] = node;
				result.appendNode(node);
			}

			if (lastNode && lastNode !== node)  // add edge from the second line point
			{
				if (!node.getConnectorTo(lastNode))
				{
					var connector = new Kekule.Bond(null, [lastNode, node]);
					connector.setBondOrder(1);
					result.appendConnector(connector);
				}
			}
			lastNode = node;
		}

		return result;
	},

	/**
	 * Convert line point sequence to a graph.
	 * @param {Array} linePoints
	 * @returns {Kekule.Graph}
	 */
	convertLinesToGraph: function(linePoints)
	{
		if (!linePoints || !linePoints.length)
			return null;
		else
		{
			var VERTEX_FIELD = '__$graph_vertex__';
			var result = new Kekule.Graph();
			var length = linePoints.length;
			var vertex, lastVertex;
			// add vertexes first
			for (var i = 0; i < length; ++i)
			{
				var point = linePoints[i];
				var vertex = point[VERTEX_FIELD];
				if (!vertex)  // haven't added to graph yet
				{
					// add new vertex
					vertex = new Kekule.GraphVertex();
					vertex.setData('coord', point);
					point[VERTEX_FIELD] = vertex;
					result.addVertex(vertex);
				}

				if (lastVertex)  // add edge from the second line point
				{
					if (!vertex.getEdgeTo(lastVertex))
					{
						var edge = new Kekule.GraphEdge();
						result.addEdge(edge, lastVertex, vertex);
					}
				}
				lastVertex = vertex;
			}
			return result;
		}
	}
});

/**
 * A class to parse the touch/mouse track and generate corresponding chem structure.
 * @class
 * @augments ObjectEx
 */
Kekule.Editor.TrackLayoutOptimizer = Class.create(ObjectEx,
/** @lends Kekule.Editor.TrackLayoutOptimizer# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.TrackLayoutOptimizer',
	/** @private */
	OPTIMIZED_COORD_FIELD: '__$optimizedCoord__',
	/** @private */
	COORD_INDEX_FIELD: '__$coordIndex__',
	/** @private */
	RING_END_INDEX_FIELD: '__$ringEndIndex__',
	/** @constructs */
	initialize: function($super)
	{
		$super();
	},
	/** @ignore */
	initProperties: function()
	{

	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
	},

	/**
	 * Split track to chain and ring parts.
	 * @param {Array} track A series of track coor
	 * ds.
	 * @returns {Array} splitted tracks
	 */
	splitTrackByRings: function(track)
	{
		var ringRanges = [];
		var allNodesNotOccupied = function(startIndex, endIndex)
		{
			for (var i = 0, l = ringRanges.length; i < l; ++i)
			{
				var range = ringRanges[i];
				if (range.startIndex > endIndex || range.endIndex < startIndex)  // not interseted, bypass
					continue;
				else  // has intersection
					return false;
			}
			return true;
		};
		// assign index to all coords in track and check for rings
		for (var i = 0, l = track.length; i < l; ++i)
		{
			var coord = track[i];
			if (coord[this.COORD_INDEX_FIELD] === undefined)
				coord[this.COORD_INDEX_FIELD] = i;
			else  // this coord may forms a ring
			{
				var startIndex = coord[this.COORD_INDEX_FIELD];
				var endIndex = i;
				coord[this.RING_END_INDEX_FIELD] = endIndex;
				// check if all coord from startIndex and endIndex are not be occupied by other rings
				if (allNodesNotOccupied(startIndex, endIndex))  // add to ring record
				{
					ringRanges.push({'startIndex': startIndex, 'endIndex': endIndex});
				}
			}
		}
		//console.log('found ring ranges', ringRanges, track);
		// split ring and chains
		var result = [];
		var ringCount = ringRanges.length;
		if (ringCount > 0)
		{
			var lastRingEndIndex = 0;
			// the nodes brfore the first ring
			for (var i = 0; i < ringCount; ++i)
			{
				var currRingRange = ringRanges[i];
				// nodes before curr ring, as chain, not, the intersection point is included
				if (currRingRange.startIndex > lastRingEndIndex)
				{
					result.push({
						'track': track.slice(lastRingEndIndex, currRingRange.startIndex + 1),
						'isRing': false
					});
				}
				// curr ring
				result.push({
					'track': track.slice(currRingRange.startIndex, currRingRange.endIndex + 1),
					'isRing': true
				});
				lastRingEndIndex = currRingRange.endIndex;
			}
			// at last, the remaining points
			if (lastRingEndIndex < track.length - 1)
				result.push({
					'track': track.slice(lastRingEndIndex, track.length),
					'isRing': false
				});
			return result;
		}
		else
			return [{
				'track': track,
				'isRing': false
			}];
	},

	/**
	 * Optimize the layout of a hand-input track.
	 * @param {Array} track A series of track coords.
	 * @param {Hash} options Optimization params.
	 */
	optimize: function(track, options)
	{
		var currTrack = track;

		var C = Kekule.Editor.PointerTrackConstraint;
		var constraint;
		// determinate the constraint first
		var pointLeading = track[0];
		var boundLeading = pointLeading.boundObj;
		var pointTailing = track[track.length - 1];
		var boundTailing = pointTailing.boundObj;
		if (boundLeading && boundTailing)
		{
			constraint = (boundLeading === boundTailing)? C.CIRCLE: C.BOTH;
		}
		else if (boundLeading || boundTailing)
		{
			constraint = C.LEADING;
			if (boundTailing)  // if bound on tailing, just reverse the track to put it on head
			{
				currTrack = AU.reverse(track);
				//console.log('REVERSE TRACK', currTrack);
			}
		}
		else // !boundLeading && !boundTailing, no bound, but keep the leading coord unchanged
		{
			if (pointLeading === pointTailing)  // a closed track, both end should be unmodified
				constraint = C.CIRCLE;
			else
				constraint = C.LEADING;
		}

		// calculate some common data
		var op = Object.extend({}, options);
		op.preferredStartingAngles = options.preferredStartingAngles || [0];  // preferred direction angle of first line segment
		op.segmentsInfo = this._calcTrackSegmentsInfo(currTrack);
		op.distanceMedian = AU.getMedian(op.segmentsInfo.distances);

		//console.log('constraint', constraint, pointLeading, pointTailing, track);
		// debug

		/*
		if (constraint === C.LEADING)
			constraint = C.BOTH;
		*/

		// do actual optimization
		var newTrack = (constraint === C.CIRCLE)? this.doOptimizeOnCircleConstraint(currTrack, op):
				(constraint === C.BOTH)? this.doOptimizeOnBothConstraint(currTrack, op):
				this.doOptimizeOnLeadingConstraint(currTrack, op);

		//console.log('optimized track', newTrack);
		return newTrack;
	},
	/**
	 * Calculate the detailed data of each segment in a track.
	 * @param {Array} track
	 * @returns {Array}
	 * @private
	 */
	_calcTrackSegmentsInfo: function(track)
	{
		var distances = [], angles = [];
		for (var i = 0, l = track.length; i < l - 1; ++i)
		{
			var coord1 = track[i];
			var coord2 = track[i + 1];
			var distance = CU.getDistance(coord1, coord2);
			var delta = CU.substract(coord2, coord1);
			var angle = Math.atan2(delta.y, delta.x);
			distances.push(distance);
			angles.push(angle);
		}
		return {
			'distances': distances,
			'angles': angles
		}
	},

	// actual optimization method on different constraint
	/** @private */
	doOptimizeOnLeadingConstraint: function(track, options, isBasicPart)
	{
		var GU = Kekule.GeometryUtils;
		var result = [];

		if (isBasicPart)  // track is not splitted into chain and ring yet, do a split first
		{
			var C = Kekule.Editor.PointerTrackConstraint;
			var trackParts = this.splitTrackByRings(track);
			if (trackParts.length === 1)  // only one part
				return trackParts[i].isRing?
						this.doOptimizeOnCircleConstraint(childTrack, options, true):
						this.doOptimizeOnLeadingConstraint(childTrack, options, true);

			var lastEndCoord;
			for (var i = 0, l = trackParts.length; i < l; ++i)
			{
				//console.log(i, trackParts[i]);
				var childTrack = trackParts[i].track;
				//var constraint = trackParts[i].isRing? C.CIRCLE: C.LEADING;
				var optimizedChildTrack = trackParts[i].isRing?
						this.doOptimizeOnCircleConstraint(childTrack, options, true):
						this.doOptimizeOnLeadingConstraint(childTrack, options, true);
				// align to lastEndCoord
				if (!lastEndCoord)  // first part
				{
					lastEndCoord = optimizedChildTrack[optimizedChildTrack.length - 1];
					result = result.concat(optimizedChildTrack);
				}
				else  // the following part
				{
					var currFirstCoord = optimizedChildTrack[0];
					var delta = CU.substract(lastEndCoord, currFirstCoord);
					//var transformMatrix = CU.calcTransform2DMatrix({'translateX': delta.x, 'translateY': delta.y});
					for (var j = 0, k = optimizedChildTrack.length; j < k; ++j)
					{
						optimizedChildTrack[j] = CU.add(optimizedChildTrack[j], delta);
					}
					lastEndCoord = optimizedChildTrack[optimizedChildTrack.length - 1];
					optimizedChildTrack.shift();  // the first coord is the same to last one of prev track part, erase it
					result = result.concat(optimizedChildTrack);
				}
			}
			return result;
		}

		var baseAngles = options.preferredStartingAngles;
		var lastAngle;
		// put first fixed coord
		result.push(track[0]);
		var preferredIncludeAngles = [options.preferredIncludeAngle, -options.preferredIncludeAngle];
		for (var i = 1, l = track.length; i < l; ++i)
		{
			if (track[i][this.OPTIMIZED_COORD_FIELD])  // already optimized
			{
				result.push(track[i][this.OPTIMIZED_COORD_FIELD]);
			}
			else
			{
				//var coord1 = result[i - 1]; // new baseCoord
				var coord1 = track[i - 1];
				var newCoord1 = result[i - 1];
				var coord2 = track[i];
				var delta = CU.substract(coord2, coord1);
				var oldDistance = CU.getDistance(coord1, coord2);
				var newDistance = this._optimizeLineSegmentDistance(oldDistance, options);  // temp
				var oldAngle = Math.atan2(delta.y, delta.x);
				var newAngle;
				/*
				 if (i > 2) // calc include angle
				 {
				 var coord0 = track[i - 2];
				 var vector1 = CU.substract(coord0, coord1);
				 var vector2 = CU.substract(coord2, coord1);
				 var oldIncludeAngle = GU.getVectorIncludedAngle2(vector1, vector2);
				 var newIncludeAngle = this._optimizeIncludeAngle(oldIncludeAngle, preferredIncludeAngles, options);
				 //newAngle = -(Math.PI - (oldAngle + newIncludeAngle));
				 newAngle = - (Math.PI - GU.standardizeAngle(newIncludeAngle - oldAngle));
				 console.log('angle calc', oldIncludeAngle * 180 / Math.PI, newIncludeAngle * 180 / Math.PI, oldAngle * 180 / Math.PI, newAngle * 180 / Math.PI);
				 }
				 else
				 */
				{
					newAngle = this._optimizeDirectionAngle(oldAngle, baseAngles, options, lastAngle);
				}
				lastAngle = newAngle;
				//baseAngle = newAngle + Math.PI / 3 * 2;  // temp, fixed next baseAngle
				var a = Math.PI - options.preferredIncludeAngle;
				//var a = options.preferredIncludeAngle;
				var baseAngles = [GU.standardizeAngle(newAngle - a), GU.standardizeAngle(newAngle + a)];
				var newCoordDelta = {x: newDistance * Math.cos(newAngle), 'y': newDistance * Math.sin(newAngle)};
				var newCoord2 = CU.add(newCoord1, newCoordDelta);
				result.push(newCoord2);
				track[i][this.OPTIMIZED_COORD_FIELD] = newCoord2;
			}
		}
		return result;
	},
	/** @private */
	doOptimizeOnBothConstraint: function(track, options, isBasicPart)
	{
		var trackLength = track.length;
		// do a leading optimization first
		var track1 = this.doOptimizeOnLeadingConstraint(track, options, isBasicPart);
		// then compare the end poisition of original constraint and newly optimized track1
		var endCoord1 = track1[trackLength - 1];
		var endCoordOld = track[trackLength - 1];
		/*
		// compare two end coords, try to transform them to one (rotate and scale)
		var startCoord = track[0];
		var deltaOld = CU.substract(endCoordOld, startCoord);
		var delta1 = CU.substract(endCoord1, startCoord);
		var rotateAngle = Math.atan2(deltaOld.y, deltaOld.x) - Math.atan2(delta1.y, delta1.x);
		var scale = CU.getDistance(deltaOld) / CU.getDistance(delta1);
		// at last, transform each coord in track1
		var result = [track1[0]]; // track1[0] need not to be changed
		var transformOptions = {'scale': scale, 'rotateAngle': rotateAngle, 'center': startCoord};
		var transformMatrix = CU.calcTransform2DMatrix(transformOptions);
		for (var i = 1; i < trackLength; ++i)
		{
			result.push(CU.transform2DByMatrix(track1[i], transformMatrix));
		}
		*/


		var startCoord = track[0];
		var deltaOld = CU.substract(endCoordOld, startCoord);
		var angleOld = Math.atan2(deltaOld.y, deltaOld.x);
		var delta1 = CU.substract(endCoord1, startCoord);
		var angle1 = Math.atan2(delta1.y, delta1.x);
		var scale = CU.getDistance(deltaOld) / CU.getDistance(delta1);
		if (scale <= 2)  // Too large scale will cause layout error, todo: this threshold is currently fixed
		{
			// rotate track1 to x axis, then scale, then rotate to angleOld
			var transformMatrix1 = CU.calcTransform2DMatrix({'rotateAngle': -angle1, 'center': startCoord});
			var transformMatrix2 = CU.calcTransform2DMatrix({'scale': scale, 'center': startCoord});
			var transformMatrix3 = CU.calcTransform2DMatrix({'rotateAngle': angleOld, 'center': startCoord});
			var transformMatrix = Kekule.MatrixUtils.multiply(transformMatrix1, transformMatrix2);
			transformMatrix = Kekule.MatrixUtils.multiply(transformMatrix, transformMatrix3);
			var result = [track1[0]]; // track1[0] need not to be changed
			for (var i = 1; i < trackLength - 1; ++i)
			{
				result.push(CU.transform2DByMatrix(track1[i], transformMatrix));
			}
			result.push(track[trackLength - 1]);
		}
		else
		{

			var deltaStep = CU.divide(CU.substract(endCoordOld, endCoord1), trackLength - 1);
			var result = [track1[0]]; // track1[0] need not to be changed
			//var result = [];
			var currDelta = {'x': 0, 'y': 0};
			for (var i = 0; i < trackLength - 1; ++i)
			{
				currDelta = CU.add(currDelta, deltaStep);
				result.push(CU.add(track1[i], currDelta));
			}
			result.push(track[trackLength - 1]);
		}

		return result; //.concat(track1);
	},
	/** @private */
	doOptimizeOnCircleConstraint: function(track, options, isBasicPart)
	{
		var edgeCount = track.length - 1;
		//console.log('edge', edgeCount);
		var op = Object.create(options);
		if (edgeCount <= 8)  // to small rings, bond angle is (1 - 2/n) * pi
		{
			var preferredIncludeAngle = (1 - 2 / edgeCount) * Math.PI;
			var op = Object.create(options);
			op.preferredIncludeAngle = preferredIncludeAngle;
		}

		var trackLength = track.length;
		// do a leading optimization first
		var track1 = this.doOptimizeOnLeadingConstraint(track, op, isBasicPart);
		// then compare the end poisition of original constraint and newly optimized track1
		var endCoord1 = track1[trackLength - 1];
		var endCoordOld = track[trackLength - 1];

		var deltaStep = CU.divide(CU.substract(endCoordOld, endCoord1), trackLength - 1);
		var result = [track1[0]]; // track1[0] need not to be changed
		//var result = [];
		var currDelta = {'x': 0, 'y': 0};
		for (var i = 1; i < trackLength - 1; ++i)
		{
			currDelta = CU.add(currDelta, deltaStep);
			result.push(CU.add(track1[i], currDelta));
		}
		result.push(track[trackLength - 1]);

		return result; //.concat(track1);
	},
	/** @private */
	_optimizeIncludeAngle: function(oldAngle, preferredIncludeAngles, options)
	{
		return this._optimizeDirectionAngle(oldAngle, preferredIncludeAngles, options);
	},
	/** @private */
	_optimizeDirectionAngle: function(oldAngle, baseAngles, options, prevAngle)
	{
		var GU = Kekule.GeometryUtils;
		var result = null, closetBaseAngle = null;

		if (baseAngles && baseAngles.length)
		{
			// find closet base angle
			var minDelta = null;
			for (var i = 0, l = baseAngles.length; i < l; ++i)
			{
				var deltaAngle = Math.abs(GU.standardizeAngle(oldAngle) - baseAngles[i]);
				if (minDelta === null || deltaAngle < minDelta)
				{
					closetBaseAngle = baseAngles[i];
					minDelta = deltaAngle;
				}
			}
			//return closetBaseAngle;
			if (minDelta <= Math.PI / 6)  // TODO: temp fixed, +-30 degree all aligns to base angle
			  result = closetBaseAngle;
		}

		if (result === null)  // not close to base angle, need further calculation
		{
			var angleConstraint = options.angleConstraint;
			if (!angleConstraint)
				return oldAngle;
			if (closetBaseAngle === null)
				closetBaseAngle = 0;

			var deltaAngle = oldAngle - closetBaseAngle;
			var times = Math.round(deltaAngle / angleConstraint);
			result = closetBaseAngle + times * angleConstraint;

			if (prevAngle)  // if prevAngle is set, we must ensure that result is not at the same line of prev segment
			{
				var threshold = 5 * Math.PI / 180;  // angle diff threshold, currently fixed
				var diff = Math.abs(GU.standardizeAngle(result - prevAngle, -Math.PI));
				if (Kekule.NumUtils.isFloatEqual(diff, 0, threshold) || Kekule.NumUtils.isFloatEqual(diff, Math.PI, threshold))
				{
					// adjust
					var anglePlus = result + angleConstraint;
					var angleMinus = result - angleConstraint;
					if (Math.abs(oldAngle - anglePlus) < Math.abs(oldAngle - angleMinus))
						result = anglePlus;
					else
						result = angleMinus;
				}
			}
		}

		return result;

		/*
		var angleConstraint = options.angleConstraint;
		if (!angleConstraint)
			return oldAngle;
		var deltaAngle = oldAngle - (baseAngle || 0);
		var times = Math.round(deltaAngle / angleConstraint);
		return (baseAngle || 0) + times * angleConstraint;
		*/
	},
	/** @private */
	_optimizeLineSegmentDistance: function(oldDistance, options)
	{
		var defBondScreenLength = options.defBondScreenLength;
		var distanceConstraints = options.distanceConstraints || [];
		if (!distanceConstraints)
			return oldDistance;

		var maxConstraintDistance = distanceConstraints[distanceConstraints.length - 1] * defBondScreenLength;
		if (oldDistance > maxConstraintDistance)  // large than the max constraint, use default method to calculate
		{
			var times = Math.round(oldDistance / defBondScreenLength);
			return times * defBondScreenLength;
		}
		else
		{
			/*
			var minDiff = null, closetIndex;
			for (var i = 0, l = distanceConstraints.length; i < l; ++i)
			{
				var constraint = distanceConstraints[i];
				var diff = Math.abs(oldDistance - constraint * defBondScreenLength);
				if (minDiff === null || diff < minDiff)
				{
					minDiff = diff;
					closetIndex = i;
				}
			}
			*/
			var primaryConstraintDistance = options.primaryDistanceConstraint;
			var constraintCount = distanceConstraints.length;
			var primaryIndex = distanceConstraints.indexOf(primaryConstraintDistance);
			if (primaryIndex < 0)  // no primary
				primaryIndex = 0;
			var currDistance;
			for (var i = constraintCount- 1; i >= primaryIndex; --i)
			{
				var constraint = distanceConstraints[i];
				currDistance = constraint * defBondScreenLength;
				if (oldDistance > currDistance)
					return currDistance;
			}
			for (var i = 0; i <= primaryIndex; ++i)
			{
				currDistance = constraint * defBondScreenLength;
				if (oldDistance < currDistance)
					return currDistance;
			}
			//return distanceConstraints[closetIndex] * defBondScreenLength;
			return currDistance;  // defaultly returns primaryConstraintDistance
		}
	}
});

/**
 * Controller to input chem structure by touch or mouse track.
 * @class
 * @augments Kekule.Editor.StructureInsertIaController
 *
 */
Kekule.Editor.TrackInputIaController = Class.create(Kekule.Editor.StructureInsertIaController,
/** @lends Kekule.Editor.TrackInputIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.TrackInputIaController',
	/** @construct */
	initialize: function($super, editor)
	{
		$super(editor);
		this.setEnableSelect(false);
		this._isTracking  = false;
		this._trackCoordToObjBindings = null;
		this._trackParser = new Kekule.Editor.TrackParser();
		this._trackLayoutOptimizer = new Kekule.Editor.TrackLayoutOptimizer();
		this._addStructureOperation = null;

		this._editorScaled = false;
		this._editorOriginalZoomLevel = 1;

		this._lastRenderedMarkerCoord = null;
		// debug
		this._debugMarkers = {};
	},
	/** @ignore */
	doFinalize: function($super)
	{
		this._trackLayoutOptimizer.finalize();
		this._trackParser.finalize();
		var trackMarker = this.getPropStoreFieldValue('trackMarker');
		if (trackMarker)
			trackMarker.finalize();
		/*
		var boundMarkers = this.getBoundChemObjMarkers();
		for (var i = boundMarkers.length - 1; i >= 0; --i)
			boundMarkers[i].finalize();
		*/
		$super();
	},
	/** @private */
	initProperties: function()
	{
		// marker to display the track path
		this.defineProp('trackMarker', {'dataType': DataType.OBJECT, 'serializable': false,
			'setter': null,
			'getter': function()
			{
				var result = this.getPropStoreFieldValue('trackMarker');
				if (!result)
				{
					result = new Kekule.ChemWidget.MetaShapeUIMarker({'shapeType': Kekule.Render.MetaShapeType.POLYLINE, 'coords': []});
					//result.__$$$$$__ = 'trackMarker';
					this.setPropStoreFieldValue('trackMarker', result);
				}
				return result;
			}
		});
		/*
		// markers to display the bound chem nodes in track
		this.defineProp('boundChemObjMarkers', {'dataType': DataType.ARRAY, 'serializable': false,'setter': null});
		*/
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		//this.setPropStoreFieldValue('boundChemObjMarkers', []);
	},

	/** @private */
	getEditorUiMarkers: function()
	{
		return this.getEditor().getUiMarkers();
	},

	/**
	 * Refine and simplify track, split it to several tracks according to merging dest,
	 * for further operations.
	 */
	refineTrackCoords: function(trackCoords)
	{
		var editor = this.getEditor();
		var configs = this.getEditorConfigs();
		var optimizationOptions = {
			'angleConstraint': configs.getInteractionConfigs().getTrackOptimizationAngleConstraint(),
			'distanceConstraints': configs.getInteractionConfigs().getTrackOptimizationDistanceConstraints(),
			'primaryDistanceConstraint': configs.getInteractionConfigs().getTrackOptimizationPrimaryDistanceConstraint(),
			'preferredIncludeAngle': Math.PI * 2 / 3  // TODO: currently fixed
		};
		var defBondLength = editor.getDefBondLength? editor.getDefBondLength(): configs.getStructureConfigs().getDefBondLength();
		// calc def bond length in screen coord system
		var coord1 = editor.objCoordToScreen({'x': 0, 'y': 0});
		var coord2 = editor.objCoordToScreen({'x': defBondLength, 'y': 0});
		var defBondScreenLength = CU.getDistance(coord1, coord2);
		optimizationOptions.defBondScreenLength = defBondScreenLength;

		var simpilifyDistanceThreshold = this.getEditorConfigs().getInteractionConfigs().getTrackSimplifierDistanceThreshold();
		var mergeDistanceThreshold = this.getEditorConfigs().getInteractionConfigs().getTrackMergeDistanceThreshold();
		var splittedTracks = this._mergeCoordsToBoundNodesAndSplitTrack(trackCoords);
		var refinedTracks = [];
		for (var i = 0, l = splittedTracks.length; i < l; ++i)
		{
			var track = splittedTracks[i];
			track = this._trackParser.refineTrack(track, simpilifyDistanceThreshold, mergeDistanceThreshold);
			var startingObj = track[0].obj || track[track.length - 1].obj;
			var preferredStartingAngle = startingObj? configs.getStructureConfigs.getNewBondDefAngle(startingObj, 1): -Math.PI / 6; // TODO: currently fix bond order to 1
			optimizationOptions.preferredStartingAngles = [preferredStartingAngle];
			track = this._trackLayoutOptimizer.optimize(track, optimizationOptions);
			refinedTracks.push(track);
		}
		//console.log('splitted', splittedTracks);
		// debug
		/*
		var totalTracks = [];
		for (var i = 0, l = refinedTracks.length; i < l; ++i)
		{
			totalTracks = totalTracks.concat(refinedTracks[i]);
		}
		if (this._debugMarkers.refinedTracks)
			this.getEditor().getUiMarkers().removeMarker(this._debugMarkers.refinedTracks);
		this._debugMarkers.refinedTracks = new Kekule.ChemWidget.MetaShapeUIMarker({'shapeType': Kekule.Render.MetaShapeType.POLYLINE, 'coords': totalTracks});
		var drawStyles = {
			'strokeColor': 'red',
			'strokeWidth': 1,
			'strokeDash':  false,
			'opacity': 1
		};
		this._debugMarkers.refinedTracks.setDrawStyles(drawStyles);
		this._debugMarkers.refinedTracks.setVisible(true);
		this.getEditor().getUiMarkers().addMarker(this._debugMarkers.refinedTracks);
    */
		return refinedTracks;
	},
	/** @private */
	_mergeCoordsToBoundNodesAndSplitTrack: function(trackCoords)
	{
		var boundRecs = this._trackCoordToObjBindings;
		//console.log('original coords', trackCoords, boundRecs);
		//console.log(boundRecs);
		var length = boundRecs.length;
		if (length)
		{
			var editor = this.getEditor();
			var trackParts = [];   // split track to parts seperated by bound items

			var currBoundObj = boundRecs[0].obj;
			var startIndex = boundRecs[0].coordIndex;
			/*
			if (startIndex > 0)
				trackParts.push(trackCoords.slice(0, startIndex));
			*/
			var lastEndIndex = 0;

			for (var i = 1; i <= length; ++i)
			{
				var rec = boundRecs[i];
				if ((i < length && rec && (currBoundObj !== rec.obj || (rec.coordIndex - startIndex > 10)) || i === length))  // meet a new binding, or the last item
				{
					// put prev unbounded coords first
					if (startIndex > lastEndIndex)
						//trackParts.push(trackCoords.slice(lastEndIndex, startIndex + 1));
						trackParts.push(trackCoords.slice(lastEndIndex, startIndex));
					// then replace trackCoords item startIndex to endIndex with a new coord
					var objScreenCoord = editor.getObjectScreenCoord(currBoundObj);
					objScreenCoord.boundObj = currBoundObj;  // store obj field
					var endIndex = boundRecs[i - 1].coordIndex;
					lastEndIndex = endIndex + 1;
					trackParts.push([objScreenCoord]);
					//trackCoords.splice(startIndex, endIndex - startIndex + 1, objScreenCoord);
					if (i !== length)
					{
						currBoundObj = rec.obj;
						startIndex = rec.coordIndex;
					}
				}
			}
			if (trackCoords.length - 1 > boundRecs[length - 1].coordIndex)
			{
				trackParts.push(trackCoords.slice(boundRecs[length - 1].coordIndex));
			}

			//console.log('here', trackParts);
			// Put to result
			var lastPart = [];
			var result = [];
			for (var i = 0, l = trackParts.length; i < l; ++i)
			{
				var currPart = trackParts[i];
				lastPart = lastPart.concat(currPart);
				if (i === l - 1)  // last part
				{
					result.push(lastPart);
				}
				else
				{
					if (currPart[0].boundObj && i > 0) // is bound item
					{
						result.push(lastPart);
						lastPart = currPart;
					}
				}
			}
			//console.log('split', result);
			return result;
		}
		else
			return [trackCoords];
	},
	/** @private */
	convertTracksToStructure: function(tracks, defIsotopeId)
	{
		var result = new Kekule.Molecule();
		result.setCoord2D({'x': 0, 'y': 0});
		var editor = this.getEditor();
		for (var i = 0, l = tracks.length; i < l; ++i)
		{
			this._trackParser.convertTrackToStructure(editor, tracks[i], defIsotopeId, result);
		}
		if (result.getNodeCount() < 2)  // at least we should have two nodes to form a structure
			return null;
		else
			return result;
	},
	/** @private */
	getStructureSelectableChildren: function(structure)
	{
		return [].concat(structure.getNodes()).concat(structure.getConnectors());
	},

	/** @private */
	addStructureToEditor: function(structure)
	{
		var editor = this.getEditor();
		this._addStructureOperation = null;

		editor.beginUpdateObject();
		try
		{
			var oper;
			var chemSpace = editor.getChemSpace();
			if (this._targetMol)
			{
				oper = new Kekule.ChemStructOperation.MergeStructFragment(structure, this._targetMol, editor);
				this._targetMol = null;
			}
			else
				oper = new Kekule.ChemObjOperation.Add(structure, chemSpace, null, editor);
			oper.execute();
			this._addStructureOperation = oper;
		}
		finally
		{
			editor.endUpdateObject();
		}
	},

	/**
	 * Returns coords of track ui marker.
	 * @returns {Array}
	 * @private
	 */
	getTrackCoords: function()
	{
		return this.getTrackMarker().getShapeInfo().coords;
	},
	/**
	 * Clear coords of track ui marker.
	 * @private
	 */
	clearTrackCoords: function()
	{
		var marker = this.getTrackMarker();
		marker.getShapeInfo().coords = [];
		//this.setPropStoreFieldValue('boundChemObjMarkers', []);
	},
	/** @private */
	startTracking: function(event, startScreenCoord)
	{
		this._targetMol = null;
		var editor = this.getEditor();

		var startObj = this._getMergeDestObjAtCoord(startScreenCoord);

		if (!editor.canCreateNewChild() && !startObj)  // can not create a standalone child
		{
			if (!editor.canAddUnconnectedStructFragment())
				return null;
			else
			{
				var blankMol = editor.getOnlyOneBlankStructFragment();
				this._targetMol = blankMol;
			}
		}

		this._isTracking = true;
		this._trackCoordToObjBindings = [];

		/*
		var marker = this.getTrackMarker();
		marker.getShapeInfo().coords = [];
		*/
		this.setManuallyHotTrack(true);  // manually use hot track to mark mergable nodes
		this.clearTrackCoords();
		//console.log('before add', this.getEditorUiMarkers().getMarkerCount());
		var marker = this.getTrackMarker();
		this.getEditorUiMarkers().addMarker(marker);
		//console.log('add', this.getEditorUiMarkers().getMarkerCount(), this.getEditorUiMarkers());

		var styleConfigs = this.getEditorConfigs().getUiMarkerConfigs();
		var drawStyles = {
			'strokeColor': styleConfigs.getTrackMarkerStrokeColor(),
			'strokeWidth': styleConfigs.getTrackMarkerStrokeWidth(),
			'strokeDash':  styleConfigs.getTrackMarkerStrokeDash(),
			'opacity': styleConfigs.getTrackMarkerOpacity()
		};
		marker.setDrawStyles(drawStyles);
		marker.setVisible(true);

		// save the first coord and the possible merge target obj
		// If autoscale, the merge obj may be disconnected after enlarge, so save it here first
		this.addTrackCoord(startScreenCoord, false);  // do not repaint marker

		if (this.getEditorConfigs().getInteractionConfigs().getAutoAdjustZoomLevelOnTrackTouching())
		{
			var editor = this.getEditor();
			var refLengthRatio = this.getEditorConfigs().getInteractionConfigs().getTrackTouchRefLength();
			if (refLengthRatio)
			{
				var doc = editor.getDocument();
				var bondScreenLength = editor.getDefBondScreenLength();
				var minLength = Kekule.DocumentUtils.getDevicePPI(doc) * refLengthRatio / Kekule.DocumentUtils.getClientScaleLevel(doc);
				var scaleRatio = minLength / bondScreenLength;
				//console.log(bondScreenLength, scaleRatio);
				if (scaleRatio > 0.9)  // TODO: current fixed
				{
					var currZoomLevel = editor.getCurrZoom();
					editor.setZoomCenter(startScreenCoord);
					editor.zoomTo(currZoomLevel * scaleRatio);

					// since we change the zoom, coord should be recalculated
					var coord = this._getEventMouseCoord(event);
					// and update the coord info prev added to coords array
					var coords = this.getTrackCoords();
					var recCoord = coords[coords.length - 1];
					startScreenCoord = coord;
					Object.extend(recCoord, coord);

					this._editorScaled = true;
					this._editorOriginalZoomLevel = currZoomLevel;
					this._autoScaleStartCoord = coord;
					// repaint hot track marker in editor
					// editor.recalcHotTrackMarker();
				}
				else
				{
					this._editorScaled = false;
					this._editorOriginalZoomLevel = null;
				}
			}
		}
		this.repaintMarker();
		this._lastRenderedMarkerCoord = startScreenCoord;
	},
	/** @private */
	endTracking: function(endScreenCoord)
	{
		var defIsotopeId = this.getEditorConfigs().getStructureConfigs().getDefIsotopeId() || 'C';

		this._isTracking = false;
		this.addTrackCoord(endScreenCoord);
		//this.getEditorUiMarkers().removeMarker(this.getTrackMarker());

		var tracks = this.refineTrackCoords(this.getTrackCoords());
		//console.log('tracks', tracks.length, tracks);
		if (tracks.length)
		{
			var mol = this.convertTracksToStructure(tracks, defIsotopeId);
			if (mol)
			{
				this.addStructureToEditor(mol);
				/*
				var children = this.getStructureSelectableChildren(mol);
				this.getEditor().select(children);
				*/
				this.startDirectManipulate(null, mol, endScreenCoord);
				this.moveManipulatedObjs(endScreenCoord);  // force a "move" action, to apply possible merge
				this.stopManipulate();

				var children = this.getStructureSelectableChildren(mol);
				this.doneInsertOrModifyBasicObjects(children);
			}
		}

		this.doneTracking();
	},
	/** @private */
	cancelTracking: function()
	{
		this._isTracking = false;
		this.getEditorUiMarkers().removeMarker(this.getTrackMarker());

		this.doneTracking();
	},
	/** @private */
	doneTracking: function()
	{

		if (this._editorScaled)
		{
			var coords = this.getTrackCoords();
			var lastCoord = coords[coords.length - 1];
			this._editorScaled = false;
			//this.getEditor().setZoomCenter(lastCoord);
			this.getEditor().zoomTo(this._editorOriginalZoomLevel, null, this._autoScaleStartCoord);
			this._editorOriginalZoomLevel = null;
			this._autoScaleStartCoord = null;
		}

		this.setManuallyHotTrack(false);
		this.getEditor().hideHotTrack();
		this.clearTrackCoords();
		this.repaintMarker();
	},
	/** @private */
	_getMergeDestObjAtCoord: function(screenCoord)
	{
		/*
		var obj = this.getEditor().getTopmostBasicObjectAtCoord(screenCoord, this.getCurrBoundInflation());
		if (this.isValidMergeDestObj(obj))
			return obj;
		else
			return null;
		*/
		var objs = this.getEditor().getBasicObjectsAtCoord(screenCoord, this.getCurrBoundInflation());
		for (var i = 0, l = objs.length; i < l; ++i)
		{
			var obj = objs[i];
			if (this.isValidMergeDestObj(obj))
				return obj;
		}
		return null;
	},
	/** @private */
	addTrackCoord: function(screenCoord, doNotRepaint)
	{
		//console.log('add track coord', screenCoord);
		// var objCoord = this.getEditor().screenCoordToObj(screenCoord);
		var coords = this.getTrackCoords();
		var lastCoord = coords && coords[coords.length - 1];
		if (lastCoord && Kekule.CoordUtils.isEqual(screenCoord, lastCoord))  // avoid adding duplicate coord
		{
			//console.log('equal', lastCoord);
			return;
		}

		/*
		var obj = this.getEditor().getTopmostBasicObjectAtCoord(screenCoord, this.getCurrBoundInflation());
		if (this.isValidMergeDestObj(obj))
		*/
		var obj = this._getMergeDestObjAtCoord(screenCoord);
		if (obj)
		{
			// bind coord to obj
			this._trackCoordToObjBindings.push({'coord': screenCoord, 'obj': obj, 'coordIndex': this.getTrackCoords().length});
			this.getEditor().addHotTrackedObj(obj);
		}

		// coords.push(objCoord);
		coords.push(screenCoord);

		// console.log(this.getTrackMarker(), this.getEditor().getUiMarkers());
		if (!doNotRepaint)
		{
			var distance;
			if (this._lastRenderedMarkerCoord)
			{
				distance = Kekule.CoordUtils.getDistance(this._lastRenderedMarkerCoord, screenCoord);
				if (distance > 5)  // reduce the repaint count
				{
					this.repaintMarker();
					this._lastRenderedMarkerCoord = screenCoord;
				}
				/*
				else
					console.log('bypass');
				*/
			}
			else
			{
				this.repaintMarker();
				this._lastRenderedMarkerCoord = screenCoord;
			}
		}
	},

	/** @private */
	repaintMarker: function()
	{
		//console.log(this.getEditor().isUpdatingUiMarkers());
		this.getEditor().repaintUiMarker();
	},

	/**
	 * Whether obj can be a merging destination node.
	 * @private
	 */
	isValidMergeDestObj: function(obj)
	{
		return obj instanceof Kekule.ChemStructureNode;
	},
	/** @ignore */
	canInteractWithObj: function(obj)
	{
		return obj instanceof Kekule.ChemStructureNode;
	},
	/** @ignore */
	getAllObjOperations: function($super, isTheFinalOperationToEditor)
	{
		var result = $super(isTheFinalOperationToEditor) || [];
		var op = this._addStructureOperation;
		if (op)
			result.unshift(op);
		//console.log('operation', result);
		return result;
	},

	/** @private */
	react_pointerdown: function($super, e)
	{
		//$super(e);
		// important, since we did not call $super, a bound inflation should be done manually here
		//this.updateCurrBoundInflation(e);
		this.setActivePointerType(e.pointerType);
		//this.getEditor().setCurrPointerType(e.pointerType);
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			var coord = this._getEventMouseCoord(e);

			this.startTracking(e, coord);
			e.preventDefault();
		}
		else if (e.getButton() === Kekule.X.Event.MouseButton.RIGHT)
		{
			this.cancelTracking();
			e.preventDefault();
		}
	},
	/** @private */
	react_pointerup: function($super, e)
	{
		//$super(e);
		if (e.getButton() === Kekule.X.Event.MouseButton.LEFT)
		{
			if (this._isTracking)
			{
				var coord = this._getEventMouseCoord(e);
				// console.log(this._trackCoordToObjBindings);
				this.endTracking(coord);
				this.addOperationToEditor();
			}
			this.setState(Kekule.Editor.BasicManipulationIaController.State.NORMAL);
			e.preventDefault();
		}
	},
	/** @private */
	react_pointermove: function($super, e)
	{
		$super(e);
		if (this._isTracking)
		{
			var coord = this._getEventMouseCoord(e);
			this.addTrackCoord(coord);
			e.preventDefault();
		}
	}
});
// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.TrackInputIaController, Kekule.Editor.ChemSpaceEditor);


})();
