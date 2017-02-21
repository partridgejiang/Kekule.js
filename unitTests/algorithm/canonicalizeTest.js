/**
 * Created by ginger on 2016/3/6.
 */

describe('Test of canonicalization of molecule', function(){

	var testCanonicalization = function(title, fileUrl)
	{
		it(title, function(done){
			Kekule.IO.loadUrlData('data/' + fileUrl, function(mol, success){
				expect(mol).not.toBeNull();

				/*
				// clear coord info of each node
				mol.cascadeOnChildren(function(obj){
					if (obj.setCoord2D)
						obj.setCoord2D({'x': 0, 'y': 0});
					if (obj.setCoord3D)
						obj.setCoord3D({'x': 0, 'y': 0, 'z': 0});
				});
        */


				// assign Id
				/*
				for (var i = 0, l = mol.getNodeCount(); i < l; ++i)
				{
					var node = mol.getNodeAt(i);
					node.setId('node' + i);
				}
				for (var i = 0, l = mol.getConnectorCount(); i < l; ++i)
				{
					var connector = mol.getConnectorAt(i);
					connector.setId('connector' + i);
				}
				*/
				/*
				var dupData = Kekule.IO.saveFormatData(mol, 'Kekule-JSON');
				mol = Kekule.IO.loadFormatData(dupData, 'Kekule-JSON');
				*/

				var randomizeChildren = function(mol)
				{
					var nodes = mol.getNodes();
					var connectors = mol.getConnectors();

					var newNodes = Kekule.ArrayUtils.randomize(nodes);
					var newConnectors = Kekule.ArrayUtils.randomize(connectors);
					// replace
					mol.getCtab().setNodes(newNodes);
					mol.getCtab().setConnectors(newConnectors);
					// recurse to sub groups
					for (var i = 0, l = mol.getNodeCount(); i < l; ++i)
					{
						var node = mol.getNodeAt(i);
						if (node instanceof Kekule.StructureFragment)
							randomizeChildren(node);
					}
				}

				var newMol = mol.clone(true);  // clone with id
				// randomize node and connectors
				randomizeChildren(newMol);

				var standardizeOptions = {
					unmarshalSubFragments: false,
					doCanonicalization: true,
					doAromaticPerception: true,
					doStereoPerception: false
				};

				// try canonicalize mol first
				//mol.standardize(standardizeOptions);
				mol.canonicalize();
				var nodes = mol.getNodes();
				var connectors = mol.getConnectors();

				// canonicalize on newMol again
				//newMol.standardize(standardizeOptions);
				newMol.canonicalize();
				var newNodes = newMol.getNodes();
				var newConnectors = newMol.getConnectors();

				expect(newNodes.length).toEqual(nodes.length);
				expect(newConnectors.length).toEqual(connectors.length);

				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					//var compareValue = Kekule.UnivChemStructObjComparer.compare(nodes[i], newNodes[i]);
					var compareValue = Kekule.ObjComparer.compareStructure(nodes[i], newNodes[i]);
					expect(compareValue).toEqual(0);
					/*
					if (compareValue !== 0)
					{
						console.log('node1', Kekule.UnivChemStructObjComparer.getCompareValue(nodes[i]), 'node2', Kekule.UnivChemStructObjComparer.getCompareValue(newNodes[i]));
					}
					*/
				}
				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					//var compareValue = Kekule.UnivChemStructObjComparer.compare(connectors[i], newConnectors[i]);
					var compareValue = Kekule.ObjComparer.compareStructure(connectors[i], newConnectors[i]);
					expect(compareValue).toEqual(0);
					/*
					if (compareValue !== 0)
					{
						console.log('conn1', Kekule.UnivChemStructObjComparer.getCompareValue(connectors[i]), 'conn2', Kekule.UnivChemStructObjComparer.getCompareValue(newConnectors[i]));
					}
					*/
				}

				var formats = ['mol', /*'cml',*/ 'Kekule-JSON', 'Kekule-XML'];
				for (var i = 0, l = formats.length; i < l; ++i)
				{
					var fmt = formats[i];
					var molData = Kekule.IO.saveFormatData(mol, fmt);
					var newMolData = Kekule.IO.saveFormatData(newMol, fmt);
					if (molData !== newMolData)
					{
						console.log('molData', molData);
						console.log('newMolData', newMolData);
					}
					expect(molData).toEqual(newMolData);
				}

				done();
			});
		}, 50000);
	};

	var srcUrls = [

		'mdl/aromatic1.mol', 'mdl/aromatic2.mol', 'mdl/aromatic3.mol', 'mdl/aromatic4.mol', 'mdl/aromatic5.mol', 'mdl/aromatic6.mol', 'mdl/aromatic7.mol',
		'mdl/azulene.mol', 'mdl/benzene.mol', 'mdl/choloylcoa.mol', 'mdl/dative.mol', 'mdl/github112_qry.mol', 'mdl/github112_tgt.mol',
		'mdl/linear.mol', 'mdl/monomer.mol', 'mdl/napthalene.mol', 'mdl/porphyrin.mol', 'mdl/quinone.mol', /*, 'mdl/ring_03419.mol' */
		'json/PhCOOH.kcj', 'json/PhCOOEtCOOH.kcj', 'json/subgroups.kcj'
	];
	srcUrls.forEach(function(url){
		testCanonicalization('Test on url: ' + url, url);
	});
});
