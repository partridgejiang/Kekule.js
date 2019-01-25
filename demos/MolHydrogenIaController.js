import { Kekule, Class, DataType } from 'kekule'

function isHydrogenOrCarbon (isotopeId) {
	const isotope = isotopeId.toUpperCase()
  return isotope === 'C' || isotope === 'H'
}

/**
 * Controller to add bond or change bond property.
 * @class
 * @augments Kekule.Editor.BasicMolManipulationIaController
 *
 * @property {String} bondType
 */

Kekule.Editor.MolHydrogenIaController = Class.create(Kekule.Editor.BasicMolManipulationIaController,
/** @lends Kekule.Editor.MolHydrogenIaController# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Editor.MolHydrogenIaController',
	/** @construct */
	initialize: function($super, editor) {
		$super(editor)
		this.setState(HC.State.INITIAL)
	},

	/** @private */
	initProperties: function() {
		this.defineProp('state', { 'dataType': DataType.INT, 'serializable': false })
		this.defineProp('addOrRemove', {'dataType': DataType.STRING, 'serializable': false})
	},
	/** @private */
	react_mousedown: function(e) {
		if (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT) {
			const S = HC.State
			const state = this.getState()

			if (state === S.INITIAL) {
				const editor = this.getEditor()
				const screenCoord = this._getEventMouseCoord(e)
				const addOrRemove = this.getAddOrRemove()
				const obj = editor.getTopmostBasicObjectAtCoord(screenCoord)
				if (obj && obj instanceof Kekule.Atom && !isHydrogenOrCarbon(obj.isotopeId)) {
					const oldHydrogenCount = obj.getExplicitHydrogenCount() || 0
					let newHydrogenCount  = 0
					if (addOrRemove === 'remove' && oldHydrogenCount > 0) {
						newHydrogenCount = oldHydrogenCount - 1
					} else if (addOrRemove === 'add') {
						newHydrogenCount = oldHydrogenCount + 1
					}
					obj.setExplicitHydrogenCount(newHydrogenCount)

					return true
				}
			}
		}
	},
	/** @private */
	react_mouseup: function($super, e) {
		const state = this.getState()
		const S = Kekule.Editor.BasicManipulationIaController.State
		if ((state === S.MANIPULATING) && (e.getButton() === Kekule.X.Event.MOUSE_BTN_LEFT)) {
			this.stopManipulate()
			this.setState(S.NORMAL)
			return true
		}
		return $super(e)  // finish move operation first
	}
})

Kekule.Editor.MolHydrogenIaController.State = {
	/** Normal state. */
	INITIAL: 0
}

const HC = Kekule.Editor.MolHydrogenIaController

// register
Kekule.Editor.IaControllerManager.register(Kekule.Editor.MolHydrogenIaController, Kekule.Editor.ChemSpaceEditor)
