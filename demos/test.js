const { Kekule } = require("kekule")
require('./MolHydrogenIaController')

const CORRECT_MOL = `{"id":"m4","coordPos2D":0,"coordPos3D":0,"renderOptions":{"expanded":true,"__type__":"object"},"coord2D":{"x":14.423182679509424,"y":43.103551690568445,"__type__":"object"},"charge":0,"parity":null,"ctab":{"nodes":[{"__type__":"Kekule.Atom","id":"a36","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"coord2D":{"x":0,"y":0,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a37","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"coord2D":{"x":0,"y":-0.799982399806396,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a33","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"coord2D":{"x":0,"y":0.7999823998063889,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a41","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"coord2D":{"x":0,"y":-1.599964799612792,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a45","coordPos2D":0,"coordPos3D":0,"renderOptions":{"charDirection":1,"__type__":"object"},"overrideRenderOptionItems":[],"coord2D":{"x":-0.6928050808127786,"y":1.1999735997095868,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"O"}],"anchorNodes":[],"connectors":[{"__type__":"Kekule.Bond","id":"b34","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[0,1]},{"__type__":"Kekule.Bond","id":"b33","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"parity":0,"bondType":"covalent","bondOrder":2,"electronCount":4,"isInAromaticRing":false,"connectedObjs":[0,2]},{"__type__":"Kekule.Bond","id":"b38","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[1,3]},{"__type__":"Kekule.Bond","id":"b42","coordPos2D":0,"coordPos3D":0,"overrideRenderOptionItems":[],"parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[2,4]}],"__type__":"Kekule.StructureConnectionTable"},"__type__":"Kekule.Molecule"}`;
const INCORRECT_MOL = `{"id":"m1","renderOptions":{"expanded":true,"__type__":"object"},"charge":0,"parity":null,"ctab":{"nodes":[{"__type__":"Kekule.Atom","id":"a2","coord2D":{"x":10.499070323027551,"y":37.998333333333335,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a1","coord2D":{"x":9.80625,"y":37.598333333333336,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"}],"anchorNodes":[],"connectors":[{"__type__":"Kekule.Bond","id":"b1","parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[0,1]}],"__type__":"Kekule.StructureConnectionTable"},"__type__":"Kekule.Molecule"}`;
const CORRECT_MOL_WITH_ELECTRONS = `{"id":"m1","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"renderOptions":{"expanded":true,"__type__":"object"},"charge":0,"parity":null,"ctab":{"nodes":[{"__type__":"Kekule.Atom","id":"a1","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"coord2D":{"x":4.419551282051282,"y":13.478044871794872,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a2","attachedMarkers":[{"__type__":"Kekule.ChemMarker.UnbondedElectronSet","id":"marker1","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"isAttachedToParent":true,"coord2D":{"x":-0.03981831463115707,"y":0.14860397327524133,"__type__":"object"},"electronCount":2},{"__type__":"Kekule.ChemMarker.UnbondedElectronSet","id":"marker2","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"isAttachedToParent":true,"coord2D":{"x":0.03981831463115699,"y":-0.14860397327524136,"__type__":"object"},"electronCount":2}],"coordPos2D":0,"coordPos3D":0,"coord2D":{"x":5.112371605078833,"y":13.878044871794872,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"},{"__type__":"Kekule.Atom","id":"a3","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"coord2D":{"x":3.726730959023731,"y":13.878044871794872,"__type__":"object"},"charge":0,"parity":null,"isotopeId":"C"}],"anchorNodes":[],"connectors":[{"__type__":"Kekule.Bond","id":"b1","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[0,1]},{"__type__":"Kekule.Bond","id":"b2","attachedMarkers":[],"coordPos2D":0,"coordPos3D":0,"parity":null,"bondType":"covalent","bondOrder":1,"electronCount":2,"isInAromaticRing":false,"connectedObjs":[0,2]}],"__type__":"Kekule.StructureConnectionTable"},"__type__":"Kekule.Molecule"}`


var MySingleElectronAction = Kekule.Editor.createComposerIaControllerActionClass(
  'Kekule.Editor.ActionComposerSetAttachedMarkerIaControllerSingleElectron',
  'Single Electron',
  'Add single electron',
  'AttachedMarkerIaController',
  'AttachedMarkerIaController-SingleElectron',
  {
    'markerClass': Kekule.ChemMarker.UnbondedElectronSet,
    'targetClass': Kekule.AbstractAtom,
    'initialPropValues': {'electronCount': 1}
  },
  null, null,
  'singleElectron'
);

const createHydrogenButton = (composer, addOrRemove) => ({
  id: `${addOrRemove}Hydrogen`,
  widget: Kekule.Widget.RadioButton,
  actionClass: Kekule.Editor.createComposerIaControllerActionClass(
    'Kekule.Editor.ActionComposerSetElementController',
    addOrRemove === 'add' ? '+H' : '-H',
    `${addOrRemove} Hydrogen from Molecule`,
    'MolHydrogenIaController',
    `${addOrRemove}-hydrogen-button`,
    null,
    null,
    {
      doExecute: function($super) {
        const controller = composer.getEditor().getIaController('MolHydrogenIaController')
        controller.setPropValues({ addOrRemove })
        composer
          .getSelection()
          .filter(obj => obj instanceof Kekule.Atom)
          // .forEach(obj => obj.setSymbol(elementType))
        $super()
      }
    }
  )
})

export const RemoveHydrogen = (composer) => createHydrogenButton(composer, 'remove')
export const AddHydrogen = (composer) => createHydrogenButton(composer, 'add')

var composer;

// initialize Composer
Kekule.X.domReady(function(){
  var composerEl = document.getElementById('composer');
  if (composerEl != null) {
    composer = new Kekule.Editor.Composer(composerEl)
    setUpComposer(composer)
    let validKekule = Kekule.IO.loadFormatData(CORRECT_MOL, 'Kekule-JSON');
    composer.setChemObj(validKekule)

    var skeletalDisplay = document.getElementById('skeletal-switch')
    skeletalDisplay.addEventListener('change', function changeSkeletalDisplay (event) {
      let renderConfigs = composer.getRenderConfigs()
      let newDisplayType = 2 //2 is CONDENSED
      if(event.target.checked){
        newDisplayType = 1 //1 is SKELETAL
      }
      renderConfigs.getMoleculeDisplayConfigs().setDefMoleculeDisplayType(newDisplayType)
      composer.getEditor().repaint()
    })
  }

  var btnCompare = document.getElementById('btnCompare')
  if (btnCompare) {
    var chemComposer0 = document.getElementById('chemComposer0')
    var chemComposer1 = document.getElementById('chemComposer1')
    composer = new Kekule.Editor.Composer(chemComposer0)
    var composer0 = composer;
    //setUpComposer(composer)
    composer = new Kekule.Editor.Composer(chemComposer1)
    var composer1 = composer;
    //setUpComposer(composer)
    btnCompare.addEventListener('click', function compareMolecules () {
      var mol1 = composer0.exportObj(Kekule.StructureFragment);
      var mol2 = composer1.exportObj(Kekule.StructureFragment);
      var isSame = mol1 && mol2 && mol1.isSameStructureWith(mol2, { lonePair: true,
        hydrogen_display_type: "IMPLICIT",
        compareStereo: false,
        skeletalMode: true });
      var sResult = isSame? 'Same molecules': 'Different molecules';
      var sClass = isSame? 'Same': 'Diff';
      var elem = document.getElementById('labelResult');
      elem.className = sClass;
      elem.innerHTML = sResult;
    })
  }
})

function setUpComposer(composer) {
  var BNS = Kekule.ChemWidget.ComponentWidgetNames;
  console.log('BNS', BNS)
  composer.setCommonToolButtons([BNS.saveData, BNS.loadData, BNS.undo, BNS.redo, BNS.zoomIn, BNS.reset, BNS.zoomOut, BNS.objInspector]).setChemToolButtons([
    BNS.manipulate,
    BNS.erase,
    {'name': 'Custom', 'actionClass': Kekule.Editor.ActionOnComposerAdv,
      'text': 'Create', 'hint': 'My create button', 'id': 'btnMyCreate', 'htmlClass': 'MYBUTTON',
      'widget': Kekule.Widget.RadioButton,
      'attached': [
        BNS.molBondSingle, BNS.molBondDouble, BNS.molBondTriple, BNS.molRepFischer2, //only show single, double and triple bounds

      //{'name': BNS.molAtom, 'actionClass': Kekule.Editor.ActionComposerSetAtomController}
      BNS.molAtom
    ]},
    //BNS.molAtom,
    BNS.molFormula,
    BNS.molRing,
    {
      'name': BNS.molCharge,
      'attached': [
        BNS.molChargeClear,
        BNS.molChargePositive,
        BNS.molChargeNegative,
        BNS.molElectronLonePair,
        {
          'name': 'singleElectron', 'actionClass': MySingleElectronAction
        },
        AddHydrogen(composer),
        RemoveHydrogen(composer)
      ]
    }
    // BNS.molCharge,
    // BNS.textImage
  ]);
}

function validateKekule (kekuleJSON) {
    let validKekule = false;
    try {
      validKekule = Kekule.IO.loadFormatData(kekuleJSON, 'Kekule-JSON');
    } catch (err) {
      console.log(err)
    }
    return validKekule;
}

const validCriteria = validateKekule(CORRECT_MOL_WITH_ELECTRONS);
const validStudentResponse = validateKekule(CORRECT_MOL_WITH_ELECTRONS);
let isTheSame = false
if (validCriteria && validStudentResponse) {
    isTheSame = validCriteria.isSameStructureWith(validStudentResponse, {lonePair: true});
    console.log('valid stuff');
  } else {
    console.log('invalid stuff');
}

console.log('isthesame', isTheSame);
