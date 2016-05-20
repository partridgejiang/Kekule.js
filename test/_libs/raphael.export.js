/**
 * Raphael.Export https://github.com/ElbertF/Raphael.Export
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

(function(R) {
	/**
	* Escapes string for XML interpolation
	* @param value string or number value to escape
	* @returns string escaped
	*/
	function escapeXML(s) {
		if ( typeof s === 'number' ) return s.toString();

		var replace = { '<': 'lt', '>': 'gt', '"': 'quot', '\'': 'apos' };

		for ( var entity in replace ) {
			s = s.replace(new RegExp(entity, 'g'), '&' + replace[entity] + ';');
		}

		return s;
	}

	/**
	* Generic map function
	* @param iterable the array or object to be mapped
	* @param callback the callback function(element, key)
	* @returns array
	*/
	function map(iterable, callback) {
		var mapped = [],
			undef = 'undefined',
			i;

		// use an index iteration if we're dealing with an array
		if( typeof iterable.unshift != 'undefined'){
			var l = iterable.length;
			for ( i = 0; i < l; i++ ) {
				if( typeof iterable[i] != undef ){
					var value = callback.call(this, iterable[i], i);
					if( value !== null ) mapped.push(value);
				}
			}
		} else {
			for ( i in iterable ) {
				if ( iterable.hasOwnProperty(i) ) {
					var value = callback.call(this, iterable[i], i);
					if ( value !== null ) mapped.push(value);
				}
			}
		}

		return mapped;
	}

	/**
	* Generic reduce function
	* @param iterable array or object to be reduced
	* @param callback the callback function(initial, element, i)
	* @param initial the initial value
	* @return the reduced value
	*/
	function reduce(iterable, callback, initial) {
		for ( var i in iterable ) {
			if ( iterable.hasOwnProperty(i) ) {
				initial = callback.call(this, initial, iterable[i], i);
			}
		}

		return initial;
	}

	/**
	* Utility method for creating a tag
	* @param name the tag name, e.g., 'text'
	* @param attrs the attribute string, e.g., name1="val1" name2="val2"
	* or attribute map, e.g., { name1 : 'val1', name2 : 'val2' }
	* @param content the content string inside the tag
	* @returns string of the tag
	*/
	function tag(name, attrs, matrix, content) {
		if ( typeof content === 'undefined' || content === null ) {
			content = '';
		}

		if ( typeof attrs === 'object' ) {
			attrs = map(attrs, function(element, name) {
				switch ( name ) {
					case 'transform':
						return;

					case 'fill':
						if ( element.match(/^hsb/) ) {
							var hsb = element.replace(/^hsb\(|\)$/g, '').split(',');

							if ( hsb.length === 3 ) {
								element = R.hsb2rgb(hsb[0], hsb[1], hsb[2]).toString();
							}
						}
				}

				return name + '="' + escapeXML(element) + '"';
			}).join(' ');
		}

		return '<' + name + ( matrix ? ' transform="matrix(' + matrix.toString().replace(/^matrix\(|\)$/g, '') + ')" ' : ' ' ) + attrs + '>' +  content + '</' + name + '>';
	}

	/**
	* @return object the style object
	*/
	function extractStyle(node) {
		return {
			font: {
				family: node.attrs.font.replace(/^.*?"(\w+)".*$/, '$1'),
				size:   typeof node.attrs['font-size'] === 'undefined' ? null : parseInt( node.attrs['font-size'] ),
				style: typeof node.attrs['font-style'] === 'undefined' ? null : node.attrs['font-style'],
				weight: typeof node.attrs['font-weight'] === 'undefined' ? null : node.attrs['font-weight']
			},
			anchor: typeof node.attrs['text-anchor'] === 'undefined' ? null : node.attrs['text-anchor']
		};
	}

	/**
	* @param style object from style()
	* @return string
	*/
	function styleToString(style) {
		// TODO figure out what is 'normal'
		// Tyler: it refers to the default inherited from CSS. Order of terms here:
		// 		  http://www.w3.org/TR/SVG/text.html#FontProperty
		var norm = 'normal',
			textAnchor = 'text-anchor: ' + ( style.anchor || 'middle' ) + '; ',
			font = style.font;
		// return 'font: normal normal normal 10px/normal ' + style.font.family + ( style.font.size === null ? '' : '; font-size: ' + style.font.size + 'px' );
		return textAnchor + [ 'font:',
		         (font.style || norm), // font-style (e.g. italic)
		         norm, // font-variant
		         (font.weight || norm), // font-weight (e.g. bold)
		         (font.size ? font.size + 'px' : '10px') + '/normal', // font-size/IGNORED line-height!
		         font.family ].join(' ');
	}
	
	/**
	 * repairs the hex color which missed the '#'
	 * @param any string
	 * @return hexvalue of rgb
	 */
	function convertToHexColor(value) {
		
		if(/^[0-9A-F]{6}$/i.test(value)){
			value = '#' + value;
		}
		
		return value;
	}

	/**
	* Computes tspan dy using font size. This formula was empircally determined
	* using a best-fit line. Works well in both VML and SVG browsers.
	* @param fontSize number
	* @return number
	*/
	function computeTSpanDy(fontSize, line, lines) {
		if ( fontSize === null ) fontSize = 10;

		//return fontSize * 4.5 / 13
		return fontSize * 4.5 / 13 * ( line - .2 - lines / 2 ) * 3.5;
	}

	var serializer = {
		'text': function(node) {
			var style = extractStyle(node),
				tags = new Array,
				textLines = node.attrs['text'].toString().split('\n'),
				totalLines = textLines.length;
			
			map(textLines, function(text, line) {
				var attrs = reduce(
					node.attrs,
					function(initial, value, name) {
						if ( name !== 'text' && name !== 'w' && name !== 'h' ) {
							if ( name === 'font-size') value = parseInt(value) + 'px';

							if( name === 'stroke'){
								value = convertToHexColor(value);
							}
							
							initial[name] = escapeXML(value.toString());
						}

						return initial;
					},
					{ style: styleToString(style) + ';' }
				);
				/**
				 * if text node has a class set, apply it to the attrs object
				*/
				if (node.node.className.baseVal != "") {
					attrs["class"] = node.node.className.baseVal;
				}
                tags.push(tag(
					'text',
					attrs,
					node.matrix,
					tag('tspan', { dy: computeTSpanDy(style.font.size, line + 1, totalLines) }, null, text.replace(/&/g, "&amp;"))
				));
			});

			return tags;
		},
		'path' : function(node) {
			var initial = ( node.matrix.a === 1 && node.matrix.d === 1 ) ? {} : { 'transform' : node.matrix.toString() };

			return tag(
				'path',
				reduce(
					node.attrs,
					function(initial, value, name) {
						if ( name === 'path' ) name = 'd';
						
						if( name === 'stroke'){
							value = convertToHexColor(value);
						}
						
						initial[name] = value.toString();

						return initial;
					},
					{}
				),
				node.matrix
				);
		}
		// Other serializers should go here
	};

	R.fn.toSVG = function() {
		var
			paper   = this,
			restore = { svg: R.svg, vml: R.vml },
			svg     = '<svg style="overflow: hidden; position: relative;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + paper.width + '" version="1.1" height="' + paper.height + '">'
			;

		R.svg = true;
		R.vml = false;

		for ( var node = paper.bottom; node != null; node = node.next ) {
			if ( node.node.style.display === 'none' ) continue;

			var attrs = '';

			// Use serializer
			if ( typeof serializer[node.type] === 'function' ) {
				svg += serializer[node.type](node);

				continue;
			}

			switch ( node.type ) {
				case 'image':
					attrs += ' preserveAspectRatio="none"';
					break;
			}

			for ( i in node.attrs ) {
				var name = i;
				var value = '';

				switch ( i ) {
					case 'r':
						// see https://github.com/ElbertF/Raphael.Export/issues/40
						if (node.type != "rect") {
							break;
						}
						
						/**
						 * set 'rx' and 'ry' to 'r'
						*/
						value = node.attrs.r;
						node.attrs.rx = value;
						node.attrs.ry = value;
						
						/**
						 * skip adding the 'r' attribute
						*/
						continue;
					
					case 'src':
						name = 'xlink:href';

						break;
					case 'transform':
						name = '';

						break;

					case 'fill':
						//skip if there is any gradient
						if(node.attrs.gradient)
							continue;
						break;
					case 'gradient':
						//radial gradient
						var id = node.id;
						var gradient = node.attrs.gradient;
						var fx = 0.5, fy=0.5;
						gradient = String(gradient).replace(R._radial_gradient, function (all, _fx, _fy) {
			                type = "radial";
			                if (_fx && _fy) {
			                    fx = parseFloat(_fx);
			                    fy = parseFloat(_fy);
			                    var dir = ((fy > .5) * 2 - 1);
			                    Math.pow(fx - .5, 2) + Math.pow(fy - .5, 2) > .25 &&
			                        (fy = Math.sqrt(.25 - Math.pow(fx - .5, 2)) * dir + .5) &&
			                        fy != .5 &&
			                        (fy = fy.toFixed(5) - 1e-5 * dir);
			                }
			                return '';
			            });
						gradient = gradient.split(/\s*\-\s*/);
						if(node.attrs.gradient.match(/^r/g)){
							var dots = R._parseDots(gradient);
							if (!dots) {
				                continue;
				            }	
							svg += '<defs>';
							svg += '	    <radialGradient id="radialgradient'+id+'" fx="'+fx+'" fy="'+fy+'" >';

							for(var di = 0; di < dots.length; di++){
								var offset = (di/(dots.length-1) * 100)+'%';
								//if dot has an offset
								if(dots[di].offset)							
									offset = dots[di].offset;
								svg +=  '<stop stop-color="'+dots[di].color+'" offset="'+offset+'"/>';
							}
							svg += '    </radialGradient>';
							svg += '</defs>';

							name = 'fill';
							value = 'url(#radialgradient'+id+')';

						}else{//linear gradient

							//assuming gradient is validated already!!
							var angle = gradient.shift();
							angle = parseFloat(angle)*-1;
			                if (isNaN(angle)) {
			                   continue; 
			                }
							var dots = R._parseDots(gradient);
							if (!dots) {
				                continue;
				            }
				            var vector = [0, 0, Math.cos(R.rad(angle)), Math.sin(R.rad(angle))],
			                       max = 1 / (Math.max(Math.abs(vector[2]), Math.abs(vector[3])) || 1);
			                vector[2] *= max;
			                vector[3] *= max;
			                if (vector[2] < 0) {
			                    vector[0] = -vector[2];
			                    vector[2] = 0;
			                }
			                if (vector[3] < 0) {
			                    vector[1] = -vector[3];
			                    vector[3] = 0;
			                }

				            svg += '<defs>';
							svg += '	    <linearGradient id="lineargradient'+id+'" x1="'+vector[0]+'" y1="'+vector[1]+'" x2="'+vector[2]+'" y2="'+vector[3]+'">';

							for(var di = 0; di < dots.length; di++){
								var offset = (di/(dots.length-1) * 100)+'%';
								//if dot has an offset
								if(dots[di].offset)							
									offset = dots[di].offset;
								svg +=  '<stop stop-color="'+dots[di].color+'" offset="'+offset+'"/>';
							}
							svg += '    </linearGradient>';
							svg += '</defs>';

							name = 'fill';
							value = 'url(#lineargradient'+id+')';

						}
						break;
					case 'stroke':
						if(value){
							value = convertToHexColor(value);
						}else{
							value = convertToHexColor(node.attrs[i].toString());
						}
						break;
				}

				if ( name ) {
					if(value)
						attrs += ' ' + name + '="' + escapeXML(value) + '"';
					else
						attrs += ' ' + name + '="' + escapeXML(node.attrs[i].toString()) + '"';
				}
			}

			/**
			 * if node has a class set, append it to the attrs string
		    */
			if (node.node.className.baseVal != "") {
				attrs += ' ' + 'class="' + node.node.className.baseVal + '"';
			}

			svg += '<' + node.type + ' transform="matrix(' + node.matrix.toString().replace(/^matrix\(|\)$/g, '') + ')"' + attrs + '></' + node.type + '>';
		}

		svg += '</svg>';

		R.svg = restore.svg;
		R.vml = restore.vml;

		return svg;
	};
})(window.Raphael);
