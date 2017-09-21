/**
 * Created by ginger on 2017/3/1.
 */
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
				BNS.molBondCloser, BNS.molBondWedgeUp, BNS.molBondWedgeDown,
				BNS.molRepSubBondMark,
				BNS.molRepMethane,
				BNS.molRepFischer1, BNS.molRepFischer2,
				BNS.molRepSawhorseStaggered, BNS.molRepSawhorseEclipsed
			]},
			BNS.molAtom,
			BNS.molFormula,
			{'name': BNS.molRing, 'attached': [
				BNS.molRing3, BNS.molRing4, BNS.molRing5, BNS.molRing6, BNS.molRing7, BNS.molRing8, BNS.molRingAr6,
				BNS.molRepCyclopentaneHaworth1, BNS.molRepCyclopentaneHaworth2,
				BNS.molRepCyclohexaneHaworth1, BNS.molRepCyclohexaneHaworth2,
				BNS.molRepCyclohexaneChair1, BNS.molRepCyclohexaneChair2
			]},
			BNS.molCharge,
			BNS.glyph,
			BNS.textImage
		]);

	var SM = Kekule.ObjPropSettingManager;
	if (SM)
	{
		// overwrite molOnly setting of composer
		SM.register('Kekule.Editor.Composer.molOnly', {  // composer that can only edit molecule
			enableStyleToolbar: true,
			enableOperHistor: true,
			enableLoadNewFile: true,
			enableCreateNewDoc: true,
			allowCreateNewChild: true,
			commonToolButtons: null,   // create all default common tool buttons
			chemToolButtons: [
				BNS.manipulate,
				BNS.erase,
				{'name': BNS.molBond, 'attached': [
					BNS.molBondSingle, BNS.molBondDouble, BNS.molBondTriple,
					BNS.molBondCloser, BNS.molBondWedgeUp, BNS.molBondWedgeDown,
					BNS.molRepSubBondMark,
					BNS.molRepMethane,
					BNS.molRepFischer1, BNS.molRepFischer2,
					BNS.molRepSawhorseStaggered, BNS.molRepSawhorseEclipsed
				]},
				BNS.molAtom,
				BNS.molFormula,
				{'name': BNS.molRing, 'attached': [
					BNS.molRing3, BNS.molRing4, BNS.molRing5, BNS.molRing6, BNS.molRing7, BNS.molRing8, BNS.molRingAr6,
					BNS.molRepCyclopentaneHaworth1, BNS.molRepCyclopentaneHaworth2,
					BNS.molRepCyclohexaneHaworth1, BNS.molRepCyclohexaneHaworth2,
					BNS.molRepCyclohexaneChair1, BNS.molRepCyclohexaneChair2
				]},
				BNS.molCharge
			],   // create only chem tool buttons related with molecule
			styleToolComponentNames: null  // create all default style components
		});
	}
}