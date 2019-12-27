/**
 * Some constants and utils functions for Moodle.
 * Created by ginger on 2016/9/21.
 */

(function(root)
{
	var KekuleMoodle = {
		// Widget wrapper, which may wrap widget data in content (not attribute) of element,
		WidgetDataWrapper: {
			WRAPPER_HTML_CLASS: 'KekuleMoodle-Widget-Data-Wrapper',
			WRAPPER_DATA_HTML_CLASS: 'KekuleMoodle-Widget-Data',

			// only can apply to these tag names and attribs, avoid security problem
			ALLOWED_TAGNAMES: ['div', 'span', 'img', 'p', 'section'],
			ALLOWED_ATTRIBS: ['class', 'style', 'id', 'name', 'width', 'height', /^data-/],

			_matchAttribPatterns: function(attribName, patterns)
			{
				for (var i = 0, l = patterns.length; i < l; ++i)
				{
					if (attribName.match(patterns[i]))
						return true;
				}
				return false;
			},

			convertWrapperElem: function(elem, autoLaunchWidget)
			{
				var content = Kekule.HtmlElementUtils.getInnerText(elem);
				//content = decodeHTMLEntities(content);
				try
				{
					var jsonObj = JSON.parse(content);
					if (jsonObj)
					{
						var tagName = jsonObj.tagName || elem.tagName;
						if (KekuleMoodle.WidgetDataWrapper.ALLOWED_TAGNAMES.indexOf(tagName.toLowerCase()) < 0)  // tag name not allowed
							return null;

						//console.log('wrapper', jsonObj);

						Kekule.DomUtils.clearChildContent(elem);
						var targetElem = elem;
						var newCreated = false;
						if (jsonObj.tagName)  // explicit set tagName, need to create new element
						{
							targetElem = elem.ownerDocument.createElement(jsonObj.tagName);
							newCreated = true;
						}
						for (var attrib in jsonObj)
						{
							if (attrib !== 'tagName' && KekuleMoodle.WidgetDataWrapper._matchAttribPatterns(attrib, KekuleMoodle.WidgetDataWrapper.ALLOWED_ATTRIBS))
							{
								var value = jsonObj[attrib];
								targetElem.setAttribute(attrib, value);
								console.log('set attrib', attrib, value);
							}
						}
						Kekule.HtmlElementUtils.removeClass(elem, KekuleMoodle.WidgetDataWrapper.WRAPPER_HTML_CLASS);
						if (newCreated)
							elem.appendChild(targetElem);
						if (autoLaunchWidget)
							Kekule.Widget.autoLauncher.execute(targetElem);
					}
				}
				catch(e)
				{

				}
			},

			// Check elem and its children, if it is a data wrapper, convert it into widget
			launchOnElem: function(elem)
			{
				if (elem.isContentEditable)
					return;
				// if elem already binded with a widget, do nothing
				if (Kekule.Widget.getWidgetOnElem(elem, true))  // retain placeholder
					return;
				// check if elem has widget specified attribute.
				if (Kekule.HtmlElementUtils.hasClass(elem, KekuleMoodle.WidgetDataWrapper.WRAPPER_HTML_CLASS))  // is a wrapper
				{
					KekuleMoodle.WidgetDataWrapper.convertWrapperElem(elem, true);
				}
				else
				{
					var children = Kekule.DomUtils.getDirectChildElems(elem);
					for (var i = 0, l = children.length; i < l; ++i)
					{
						var child = children[i];
						this.launchOnElem(child);
					}
				}
			},

			//
			launchOnDoc: function(doc)
			{
				if (!doc)
					doc = document;
				KekuleMoodle.WidgetDataWrapper.launchOnElem(doc.body);
			}
		}
	};

	root.KekuleMoodle = KekuleMoodle;

	Kekule.X.domReady(function(){
		KekuleMoodle.WidgetDataWrapper.launchOnDoc(document);
	});

})(this);