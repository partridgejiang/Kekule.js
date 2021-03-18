define('local_kekulejs/kekuleChemViewerInterceptor', ['kekule'], function(){

	function init()
	{
		if (typeof Kekule === 'undefined')
			return;

		// utils class to intercept quiz report page
		var KekuleQuizReportInterceptor = {
			matchPage: function(document)
			{
				var url = document.location.pathname.toLowerCase();
				var result = url.match(/quiz\/report.php/);
				return !!result;
			},
			getTargetElements: function(document)
			{
				return document.body.querySelectorAll('td[id^="mod-quiz-report-statistics-question-table"]');
			},
			handleElement: function(element)
			{
				var children = Kekule.DomUtils.getChildNodesOfTypes(element, Node.TEXT_NODE);
				if (children.length === 1 && !Kekule.DomUtils.getChildNodesOfTypes(element, Node.ELEMENT_NODE).length)  // only with one text node, may be the target
				{
					var content = (children[0].nodeValue || '').trim();
					if (content.indexOf('{') === 0 && content.lastIndexOf('}') === content.length - 1)  // wrapped with {}, possible a JSON string
					{
						try
						{
							var jsonObj = JSON.parse(content);
							if (jsonObj && jsonObj.molData)  // has mol data field
							{
								var chemObj = Kekule.IO.loadFormatData(jsonObj.molData, Kekule.IO.DataFormat.KEKULE_JSON);
								if (chemObj)  // chem object load successful, create viewer widget
								{
									Kekule.DomUtils.clearChildContent(element);
									var viewer = new Kekule.ChemWidget.Viewer2D(element.ownerDocument);
									viewer.setPredefinedSetting('basic');
									viewer.appendToElem(element);
									viewer.load(chemObj);
								}
							}
						}
						catch(e)
						{
							//console.error(e);
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