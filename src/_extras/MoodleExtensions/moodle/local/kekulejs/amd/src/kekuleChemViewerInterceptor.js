define(/*'local_kekulejs/kekuleChemViewerInterceptor',*/ ['kekule'], function(){

	function init()
	{
		if (typeof Kekule === 'undefined')
			return;

		// utils class to intercept quiz report page
		var KekuleQuizReportInterceptor = {
			matchPage: function(document)
			{
				var url = document.location.pathname.toLowerCase();
				//var result = url.match(/quiz\/report.php/) || url.match(/question/);
				var result = url.match('quiz') || url.match('question');
				return !!result;
			},
			getTargetElements: function(document)
			{
				var result = [].concat(Array.prototype.slice.call(document.body.querySelectorAll('td[id^="mod-quiz-report-statistics-question-table"]') || [], 0));
				result = result.concat(Array.prototype.slice.call(document.body.querySelectorAll('div[class^="responsehistoryheader"] tbody tr td') || [], 0));
				result = result.concat(Array.prototype.slice.call(document.body.querySelectorAll('div[id^="techinfo_inner"] p') || [], 0));
				return result;
			},
			_extractMolJsonInfo: function(content)
			{
				var startPos = content.indexOf('{"');
				var endPos = content.lastIndexOf('"}');
				var mayBeMolJson = (startPos >= 0) && (endPos >= content.length - 3); // end with "} or "};				if (mayBeMolJson)
				if (mayBeMolJson)
				{
					var nonJsonContent = content.substring(0, startPos);
					var jsonContent = content.substring(startPos, endPos + 2);
					var molJsonSep = '"}; {"';  // maybe multiple mol JSON inside
					var jsonStrs = [];
					var currStartPos = 0;
					var sepPos = jsonContent.indexOf(molJsonSep, currStartPos);
					while (sepPos >= 0)
					{
						var currJsonStr = jsonContent.substring(currStartPos, sepPos + 2);
						jsonStrs.push(currJsonStr);
						currStartPos = sepPos + 4;
						sepPos = jsonContent.indexOf(molJsonSep, currStartPos);
					}
					jsonStrs.push(jsonContent.substring(currStartPos, endPos + 2));
					//console.log('jsonStrs count', jsonStrs.length);
					return {'nonJsonContent': nonJsonContent, 'jsonContents': jsonStrs};
				}
				else
				{
					//console.log('non JSONStr', startPos, endPos, content.length, content);
					return null;
				}
				//return mayBeMolJson? {'jsonContent': content.substring(startPos, endPos + 2), 'jsonPos': startPos, 'nonJsonContent': content.substring(0, startPos)}: null;
			},
			handleElement: function(element)
			{
				var children = Kekule.DomUtils.getChildNodesOfTypes(element, Node.TEXT_NODE);
				if (children.length === 1 && !Kekule.DomUtils.getChildNodesOfTypes(element, Node.ELEMENT_NODE).length)  // only with one text node, may be the target
				{
					var content = (children[0].nodeValue || '').trim();
					var molJsonContentInfo = KekuleQuizReportInterceptor._extractMolJsonInfo(content);
					//if (content.indexOf('{') === 0 && content.lastIndexOf('}') === content.length - 1)  // wrapped with {}, possible a JSON string
					if (molJsonContentInfo)
					{
						Kekule.DomUtils.clearChildContent(element);
						if (molJsonContentInfo.nonJsonContent)
							Kekule.DomUtils.setElementText(element, molJsonContentInfo.nonJsonContent);
						// may need to create multiple viewers
						//let viewers = [];
						for (var i = 0, l = molJsonContentInfo.jsonContents.length; i < l; ++i)
						{
							var jsonStr = molJsonContentInfo.jsonContents[i];
							var currViewer = null;
							try
							{
								//var jsonObj = JSON.parse(content);
								var jsonObj = JSON.parse(jsonStr);
								if (jsonObj && jsonObj.molData)  // has mol data field
								{
									var chemObj = Kekule.IO.loadFormatData(jsonObj.molData, Kekule.IO.DataFormat.KEKULE_JSON);
									if (chemObj)  // chem object load successful, create viewer widget
									{
										var viewer = new Kekule.ChemWidget.Viewer2D(element.ownerDocument);
										viewer.setPredefinedSetting('basic');
										viewer.appendToElem(element);
										viewer.load(chemObj);
										currViewer = viewer;
										//console.log('insert viewer', jsonStr);
									}
								}
							} catch (e)
							{
								//console.error(e);
							}
							if (!currViewer)  // not valid mol json, display text only
							{
								var textNode = element.ownerDocument.createTextNode(jsonStr);
								element.appendChild(textNode);
								//console.log('none viewer', jsonStr);
							}
						}
					}
				}
			},
			execute: function(doc)
			{
				if (!doc)
					doc = document;
				if (KekuleQuizReportInterceptor.matchPage(doc))
				{
					var targetElems = KekuleQuizReportInterceptor.getTargetElements(doc);
					if (targetElems)
					{
						for (var i = targetElems.length - 1; i >= 0; --i)
						{
							KekuleQuizReportInterceptor.handleElement(targetElems[i]);
						}
					}
				}
			}
		};

		Kekule.X.domReady(KekuleQuizReportInterceptor.execute);
	}

	return {
		'init': function(){
			//console.log('Kekule', Kekule);
			Kekule._ready(init);
		}
	}
});