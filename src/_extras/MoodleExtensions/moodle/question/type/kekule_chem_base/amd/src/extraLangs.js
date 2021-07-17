define(/*'qtype_kekule_chem_base/extraLangs',*/ ['kekule'], function()
{

	function init()
	{
		//console.log('initial language', Kekule);
		if (Kekule)
		{
			Kekule.Localization.setCurrModule('kekuleMoodle');
			Kekule.Localization.addResource('en', 'KekuleMoodleTexts', {
				CAPTION_COPY_QUESTION_STRUCTURE: 'Copy Structure',
				HINT_COPY_QUESTION_STRUCTURE: 'Copy structure from question body'
			});
			Kekule.Localization.addResource('zh', 'KekuleMoodleTexts', {
				CAPTION_COPY_QUESTION_STRUCTURE: '复制分子结构',
				HINT_COPY_QUESTION_STRUCTURE: '自题干复制分子结构'
			});
		}
	}


	return {
		'init': function(){
			Kekule._ready(init);
		}
	};
});


