describe('Test of some util function of widget systems', function(){
	it('KeyboardUtils shortcut label conversion test', function(){
		// each sub items is [shorcutLabel, paramInStrictMode, paramInNonStrictMode(optional)]
		var cases = [
			['a', {key: 'a'}, {key: 'A'}],
			['Z', {key: 'Z'}],
			['Shift+a', {key: 'a', 'shiftKey': true}, {key: 'A', 'shiftKey': true}],
			['Shift-A', {key: 'A', 'shiftKey': true}],
			['Shift-^', {key: '^', 'shiftKey': true}, {key: '^', 'shiftKey': true}],
			['Ctrl+Shift+A', {key: 'A', 'shiftKey': true, 'ctrlKey': true}],
			['Ctrl+Shift+Ins', {key: 'Insert', 'shiftKey': true, 'ctrlKey': true}],
			['Ctrl-Alt-Del', {key: 'Delete', 'ctrlKey': true, 'altKey': true}],
			['Ctrl+Alt+Esc', {key: 'Escape', 'ctrlKey': true, 'altKey': true}],
			['Ctrl+Alt+Shift+PgUp', {key: 'PageUp', 'shiftKey': true, 'altKey': true, 'ctrlKey': true}],
			['Ctrl+Alt+Shift+PgDn', {key: 'PageDown', 'shiftKey': true, 'altKey': true, 'ctrlKey': true}],
			['Ctrl+Shift', {key: 'Shift', 'ctrlKey': true, 'shiftKey': true}],
			['Shift+Ctrl', {key: 'Control', 'ctrlKey': true, 'shiftKey': true}],
			['Ctrl++', {key: '+', 'ctrlKey': true}],
			['Ctrl+-', {key: '-', 'ctrlKey': true}]
		];
		//cases = [cases[0]];
		var shorcutToParam = Kekule.Widget.KeyboardUtils.shortcutLabelToKeyParams;
		var paramToShortcut = Kekule.Widget.KeyboardUtils.keyParamsToShortcutLabel;
		cases.forEach(function(item){
			var shortcut = item[0];
			var paramStrict = item[1];
			var paramNonStrict = item[2] || item[1];
			// test
			//console.log(shorcutToParam(shortcut, '+', !true), paramNonStrict, Kekule.ObjUtils.equal(shorcutToParam(shortcut, '+', !true), paramNonStrict));
			expect(Kekule.ObjUtils.equal(shorcutToParam(shortcut, null, true), paramStrict)).toBeTruthy();
			expect(Kekule.ObjUtils.equal(shorcutToParam(shortcut, null, false), paramNonStrict)).toBeTruthy();
			var convShortcutStrict = paramToShortcut(paramStrict, '+', true);
			var convShortcutNonStrict = paramToShortcut(paramNonStrict, '+', false);
			expect(Kekule.ObjUtils.equal(shorcutToParam(convShortcutStrict, '+', true), paramStrict)).toBeTruthy();
			expect(Kekule.ObjUtils.equal(shorcutToParam(convShortcutNonStrict, '+', false), paramNonStrict)).toBeTruthy();
		});
	});
});
