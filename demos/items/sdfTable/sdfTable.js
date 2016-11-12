// dataset: store all data items
var dataset = new Kekule.Widget.ArrayDataSet();
// dataPager: controls data items displayed per page
var dataPager = new Kekule.Widget.DataPager(dataset);

var pageNav, dataTable;  // widgets, will be initialized in function init()

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
					fillTable(molData);
				else if (molData instanceof Kekule.StructureFragment)  // a single molecule
				{
					var list = new Kekule.ChemObjList();
					list.append(molData);
					fillTable(list);
				}
				else
					throw 'Not suitable data format';
			}
		});
	}
}


// fill data table (actually dataset) from loaded SDF data
function fillTable(molList)
{
	var dataArray = [];
	var dataFields = [];
	var ignoredFields = ['generator', 'date', 'author', 'comment']; // those fields will not be displayed
	/*
	 prepare an array in form of [
	   {'Molecule': molecule1, 'field1': value11, 'field2': value12...}
	   {'Molecule': molecule2, 'field1': value21, 'field2': value22...}
	   ...
	 ]
	*/
	for (var i = 0, l = molList.getChildCount(); i < l; ++i)
	{
		var mol = molList.getChildAt(i);
		var info = mol.getInfo() || {};
		var curr = {'Molecule': mol};
		for (var propName in info)
		{
			if (ignoredFields.indexOf(propName) < 0)
			{
				Kekule.ArrayUtils.pushUnique(dataFields, propName);
				var strValue = info[propName];
				var numValue = Number(strValue);
				curr[propName] = isNaN(numValue)? strValue: numValue;
			}
		}
		dataArray.push(curr);
	}

	// set columns of data table, the molecule column should be unsortable
	var columns = [{'name': 'Molecule', 'text': 'Molecule', 'disableInteract': true}];
	for (var i = 0, l = dataFields.length; i < l; ++i)
	{
		columns.push({'name': dataFields[i]});  // other columns are sortable by value
	}
	dataTable.setColumns(columns);

	// set dataset data
	dataset.setData(dataArray);
	dataPager.setPageSize(5);
	dataPager.setDataSet(dataset);
}

function init()
{
	// use data pager to control items per page in data table
	pageNav = Kekule.Widget.getWidgetById('pageNav');
	pageNav.setDataPager(dataPager);
	dataTable = Kekule.Widget.getWidgetById('dataTable');
	dataTable.setDataPager(dataPager);

	// overwrite method to create chem viewer widget inside the cell of data table
	dataTable.overwriteMethod('doCreateDataCellContent', function($old, parentElem, options)
	{
		var key = options.cellKey;
		if (key === 'Molecule')
		{
			var value = options.cellValue;  // molecule in cell
			var viewer = new Kekule.ChemWidget.Viewer2D(this, value); // user viewer to draw it
			viewer.setAutoSize(true);
			viewer.appendToElem(parentElem);
			viewer.removeClassName(Kekule.Widget.HtmlClassNames.NORMAL_BACKGROUND);
		}
		else
		{
			return $old(parentElem, options);
		}
	});

	document.getElementById('inputFile').addEventListener('change', function(){
		loadSdfFile();
	});
}
Kekule.X.domReady(init);