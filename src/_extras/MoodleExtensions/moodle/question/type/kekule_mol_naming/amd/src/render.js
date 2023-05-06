define(/*'qtype_kekule_mol_naming/render',*/ ['kekule', 'qtype_kekule_mol_naming/extraWidgets', 'core/str'], function($K, $EW, Str){
	var initParams;

	function init() {

		function findInputControls() {
			var elems = document.querySelectorAll('.kekule_mol_naming input[type=text][data-enable-char-selector]');
			return elems;
		}

		function createAssocWidgets(inputControls) {
			for (var i = 0, l = inputControls.length; i < l; ++i) {
				var inputControl = inputControls[i];
				if (inputControl.__bindCharSelector__)  // already created selector
					continue;
				if (inputControl.hasAttribute('readonly'))   // readonly input control in review page, do not create button
					continue;
				var parentNode = inputControl.parentNode;
				var doc = inputControl.ownerDocument;
				var selectorElem = doc.createElement('span');
				selectorElem.className = 'KM-MolNamingCharSelectorWrapper';

				var btn = new KekuleMoodle.Widget.CharSelectorGropButton(doc);
				btn.setShowText(false);
				btn.setChars(initParams.charselectorcontent);
				var stringkeys = [
					{
						key: 'captionSelectorMolNamingChar',
						component: 'qtype_kekule_mol_naming'
					},
					{
						key: 'hintSelectorMolNamingChar',
						component: 'qtype_kekule_mol_naming',
					}
				];
				Str.get_strings(stringkeys).then(function(strings) {
					btn.setText(strings[0]).setHint(strings[1]);
				});

				//btn.setText(Str.get_string('captionSelectorMolNamingChar', 'qtype_kekule_mol_naming'))  /*Kekule.$L('KekuleMoodleTexts.CAPTION_SELECTOR_MOL_NAMING_CHAR')*/)
				//	.setHint(Str.get_string('hintSelectorMolNamingChar', 'qtype_kekule_mol_naming'))  /*Kekule.$L('KekuleMoodleTexts.HINT_SELECTOR_MOL_NAMING_CHAR')*/)

				btn.__targetInputControl__ = inputControl;
				btn.addEventListener('valueChange', function(e) {
					var value = e.value;
					var widget = e.widget;
					if (value)
					{
						var inputControl = widget.__targetInputControl__;
						inputControl.value += value;
						inputControl.focus();
					}
				})
				inputControl.__bindCharSelector__ = true;
				inputControl.className = (inputControl.className || '') + ' KM-TextboxWithCharSelector'
				btn.appendToElem(selectorElem);
				parentNode.insertBefore(selectorElem, inputControl);
			}
		}

		function init() {
			var inputControls = findInputControls();
			createAssocWidgets(inputControls);
		}

		//console.log('prepare question init');
		Kekule.X.domReady(init);

	}

	return {
		'init': function(params){
			initParams = params;
			//console.log('render.js initial', params);
			Kekule._ready(init);
		}
	};

});