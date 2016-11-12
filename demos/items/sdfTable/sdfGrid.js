// load data from SDF file
function loadSdfFile()
{
	var file = document.getElementById('inputFile').files[0];
	if (file)
	{
		Kekule.IO.loadFileData(file, function(molData, success)
		{
			// load SDF file and returns object list when succeed
			if (success && molData)
			{
				if (molData instanceof Kekule.ChemObjList)  // a molecule list
					fillGrid(molData);
				else if (molData instanceof Kekule.StructureFragment)  // a single molecule
				{
					var list = new Kekule.ChemObjList();
					list.append(molData);
					fillGrid(list);
				}
				else
					throw 'Not suitable data format';
			}
		});
	}
}


function fillGrid(molList)
{
	var grid = Kekule.Widget.getWidgetById('viewerGrid');
	grid.clearWidgets();
	for (var i = 0, l = molList.getChildCount(); i < l; ++i)
		grid.addChemObj(molList.getChildAt(i));
}

function init()
{
	var grid = Kekule.Widget.getWidgetById('viewerGrid');
	grid.setEnableRemove(false).setEnableAdd(false);
	document.getElementById('inputFile').addEventListener('change', function(){
		loadSdfFile();
	});
}
Kekule.X.domReady(init);