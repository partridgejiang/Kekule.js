define(/*'qtype_kekule_mol_naming/extraLangs',*/ ['kekule'], function()
{

	function init()
	{
		//console.log('initial language', Kekule);
		if (Kekule)
		{
			Kekule.Localization.setCurrModule('kekuleMoodle');
			Kekule.Localization.addResource('en', 'KekuleMoodleTexts', {
				CAPTION_SELECTOR_MOL_NAMING_CHAR: 'Select Naming Character',
				HINT_SELECTOR_MOL_NAMING_CHAR: 'Open a panel for selecting characters for molecule naming'
			});
			Kekule.Localization.addResource('en', 'KekuleMoodleTexts', {
				CAPTION_SELECTOR_MOL_NAMING_CHAR: '选择命名字符',
				HINT_SELECTOR_MOL_NAMING_CHAR: '选择命名字符面板'
			});
		}
	}


	return {
		'init': function(){
			Kekule._ready(init);
		}
	};
});


