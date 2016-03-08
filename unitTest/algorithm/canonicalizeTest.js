/**
 * Created by ginger on 2016/3/6.
 */

describe('Test of canonicalization of molecule', function(){

	var testCanonicalization = function(title, fileUrl)
	{
		it(title, function(done){
			Kekule.IO.loadUrlData('data/' + fileUrl, function(mol, success){
				expect(mol).not.toBeNull();
				// try canonicalize mol first
				mol.canonicalize();
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
				// randomize node and connectors
				var nodes = Kekule.ArrayUtils.clone(mol.getNodes());
				var connectors = Kekule.ArrayUtils.clone(mol.getConnectors());
				var newNodes = Kekule.ArrayUtils.randomize(nodes);
				var newConnectors = Kekule.ArrayUtils.randomize(connectors);
				// replace
				mol.getCtab().setNodes(nodes);
				mol.getCtab().setConnectors(connectors);
				// canonicalize again
				mol.canonicalize();
				var newNodes = mol.getNodes();
				var newConnectors = mol.getConnectors();

				expect(newNodes.length).toEqual(nodes.length);
				expect(newConnectors.length).toEqual(connectors.length);

				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					expect(Kekule.UnivChemStructObjComparer.compare(nodes[i], newNodes[i])).toEqual(0);
				}
				for (var i = 0, l = nodes.length; i < l; ++i)
				{
					expect(Kekule.UnivChemStructObjComparer.compare(connectors[i], newConnectors[i])).toEqual(0);
				}

				done();
			});
		});
	};

	var srcUrls = [
		'mdl/aromatic1.mol', 'mdl/aromatic2.mol', 'mdl/aromatic3.mol', 'mdl/aromatic4.mol', 'mdl/aromatic5.mol', 'mdl/aromatic6.mol', 'mdl/aromatic7.mol',
		'mdl/azulene.mol', 'mdl/benzene.mol', 'mdl/choloylcoa.mol', 'mdl/dative.mol', 'mdl/github112_qry.mol', 'mdl/github112_tgt.mol',
		'mdl/linear.mol', 'mdl/monomer.mol', 'mdl/napthalene.mol', 'mdl/porphyrin.mol', 'mdl/quinone.mol' /*, 'mdl/ring_03419.mol'*/
	];
	srcUrls.forEach(function(url){
		testCanonicalization('Test on url: ' + url, url);
	});
});
