define('local_kekulejs/kekuleInitials', ['kekule'], function(){

	function init()
	{
		if (Kekule.Widget.AutoLauncher)
		{
			Kekule.Widget.AutoLauncher.deferring = true;
			Kekule.Widget.AutoLauncher.placeHolderStrategy = Kekule.Widget.AutoLauncher.PlaceHolderStrategies.IMPLICIT;
		}
		if (Kekule.globalOptions && Kekule.ChemWidget)
		{
			var BNS = Kekule.ChemWidget.ComponentWidgetNames;
			Kekule.globalOptions.add('chemWidget.composer.chemToolButtons',
				[
					BNS.manipulate,
					BNS.erase,
					{'name': BNS.molBond, 'attached': [
							BNS.molBondSingle, BNS.molBondDouble, BNS.molBondTriple,
							/*BNS.molBondCloser,*/ BNS.molBondWedgeUp, BNS.molBondWedgeDown,
							BNS.molChain,
							BNS.trackInput,
							/*
							BNS.molRepSubBondMark,
							BNS.molRepMethane,
							*/
							BNS.molRepFischer1, BNS.molRepFischer2,
							BNS.molRepSawhorseStaggered, BNS.molRepSawhorseEclipsed
						]},
					BNS.molAtomAndFormula,
					{'name': BNS.molRing, 'attached': [
							BNS.molRing3, BNS.molRing4, BNS.molRing5, BNS.molRing6,
							BNS.molFlexRing,
							BNS.molRingAr6,
							BNS.molRepCyclopentaneHaworth1, /* BNS.molRepCyclopentaneHaworth2,*/
							BNS.molRepCyclohexaneHaworth1, /* BNS.molRepCyclohexaneHaworth2, */
							BNS.molRepCyclohexaneChair1, BNS.molRepCyclohexaneChair2
						]},
					BNS.molCharge,
					BNS.glyph,
					BNS.textImage
				]);

			var SM = Kekule.ObjPropSettingManager;
			if (SM)
			{
				var EMC = Kekule.Editor.ObjModifier.Category;
				// overwrite molOnly setting of composer
				SM.register('Kekule.Editor.Composer.molOnly', {  // composer that can only edit molecule
					//enableStyleToolbar: true,
					enableObjModifierToolbar: true,
					enableOperHistor: true,
					enableLoadNewFile: true,
					enableCreateNewDoc: true,
					allowCreateNewChild: true,
					commonToolButtons: [
						BNS.newDoc,
						BNS.loadData,
						BNS.saveData,
						BNS.undo,
						BNS.redo,
						BNS.zoomIn,
						BNS.zoomOut,
						BNS.issueInspector
					],
					chemToolButtons: [
						BNS.manipulate,
						BNS.erase,
						{'name': BNS.molBond, 'attached': [
								BNS.molBondSingle, BNS.molBondDouble, BNS.molBondTriple,
								/*BNS.molBondCloser,*/ BNS.molBondWedgeUp, BNS.molBondWedgeDown,
								BNS.molChain,
								BNS.trackInput,
								/*
								BNS.molRepSubBondMark,
								BNS.molRepMethane,
								*/
								BNS.molRepFischer1, BNS.molRepFischer2,
								BNS.molRepSawhorseStaggered, BNS.molRepSawhorseEclipsed
							]},
						BNS.molAtom,
						/*BNS.molFormula,*/
						{'name': BNS.molRing, 'attached': [
								BNS.molRing3, BNS.molRing4, BNS.molRing5, BNS.molRing6,
								BNS.molFlexRing,
								BNS.molRingAr6,
								BNS.molRepCyclopentaneHaworth1, /* BNS.molRepCyclopentaneHaworth2,*/
								BNS.molRepCyclohexaneHaworth1, /* BNS.molRepCyclohexaneHaworth2, */
								BNS.molRepCyclohexaneChair1, BNS.molRepCyclohexaneChair2
							]},
						//BNS.molCharge
						{
							'name': BNS.molCharge, 'attached': [
								BNS.molChargeClear, BNS.molChargePositive, BNS.molChargeNegative,
								BNS.molRadicalDoublet, BNS.molElectronLonePair
							]
						}
					],   // create only chem tool buttons related with molecule
					styleToolComponentNames: null,  // create all default style components
					allowedObjModifierCategories: [EMC.GENERAL, EMC.CHEM_STRUCTURE]  // only all chem structure modifiers
				});
			}
		}
	}

	return {
		'init': function(){
			//console.log('Kekule', Kekule);
			Kekule._ready(init);
		}
	}
});