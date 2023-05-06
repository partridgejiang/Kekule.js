define(/*'qtype_kekule_mol_naming/extraWidgets',*/ ['kekule', 'local_kekulejs/kekuleMoodle'], function(){

	function init() {

		if (typeof(Kekule) === 'undefined' || typeof(Kekule.Widget) == 'undefined')
			return;

		if (typeof (KekuleMoodle) === 'undefined')
			KekuleMoodle = {};
		if (!KekuleMoodle.Widget)
			KekuleMoodle.Widget = {};

		KekuleMoodle.Widget.CharSelectorPanel = Class.create(Kekule.Widget.Panel, {
			CLASS_NAME: 'KekuleMoodle.Widget.CharSelectorPanel',
			initialize: function (parentOrElementOrDocument) {
				this.setPropStoreFieldValue('groupDelimiter', '\n');
				this.setPropStoreFieldValue('charDelimiter', ' ');
				this.tryApplySuper('initialize', [parentOrElementOrDocument]);
			},
			initProperties: function () {
				// chars need to be displayed in panel
				this.defineProp('chars', {
					'dataType': DataType.STRING,
					'setter': function (value) {
						this.setPropStoreFieldValue('chars', value || []);
						this.charsChanged();
					}
				});
				this.defineProp('groupDelimiter', {
					'dataType': DataType.STRING,
					'setter': function (value) {
						this.setPropStoreFieldValue('groupDelimiter', value || []);
						this.charsChanged();
					}
				});
				this.defineProp('charDelimiter', {
					'dataType': DataType.STRING,
					'setter': function (value) {
						this.setPropStoreFieldValue('charDelimiter', value || []);
						this.charsChanged();
					}
				});
			},
			doFinalize: function () {
				this.tryApplySuper('doFinalize');
			},
			/** @ignore */
			doGetWidgetClassName: function (/*$super*/) {
				return this.tryApplySuper('doGetWidgetClassName') + ' ' + 'KM-CharSelectorPanel';
			},

			/** @private */
			charsChanged: function ()  // update the whole panel
			{
				this._createCharContent(this.getDocument(), this.getChildrenHolderElement());
			},
			/** @private */
			_getCharGroups: function(charContent)
			{
				var groupDelimiter = this.getGroupDelimiter();
				var charDelimiter = this.getCharDelimiter();
				var lines = (charContent || '').split(groupDelimiter);

				var result = [];
				for (var i = 0, l = lines.length; i < l; ++i)
				{
					var chars = lines[i].split(charDelimiter);
					result.push(chars);
				}
				return result;
			},

			/** @ignore */
			doCreateSubElements: function(/*$super, */doc, rootElem)
			{
				this._createCharContent(doc, rootElem);
			},
			/** @private */
			_createCharContent: function(doc, parentElem)
			{
				if (this._charContentELem)  // release old
					this._charContentELem.parentNode.removeChild(this._charContentELem);

				var charGroups = this._getCharGroups(this.getChars());
				var result = doc.createElement('div');
				for (var i = 0, ii = charGroups.length; i < ii; ++i)
				{
					if (!charGroups[i].length)
						continue;
					var groupElem = doc.createElement('p');
					for (var j = 0, jj = charGroups[i].length; j < jj; ++j)
					{
						var s = (charGroups[i][j] || '').trim();
						if (s)
						{
							var charElem = doc.createElement('span');
							charElem.innerHTML = s;
							groupElem.appendChild(charElem);
						}
					}
					result.appendChild(groupElem);
				}
				parentElem.appendChild(result);
				this._charContentELem = result;
				Kekule.X.Event.addListener(this._charContentELem, 'click', this._reactCellClick.bind(this));
				return result;
			},

			_reactCellClick: function (e) {
				{
					var elem = e.getTarget();
					if (elem.tagName.toLowerCase() === 'span')
						this.invokeEvent('valueChange', {'value': elem.innerText});
				}
			}
		});

		KekuleMoodle.Widget.CharSelectorGropButton = Class.create(Kekule.Widget.DropDownButton,
			/** @lends Kekule.Moodle.Widget.CharSelectorGropButton# */
			{
				/** @private */
				CLASS_NAME: 'KekuleMoodle.Widget.CharSelectorGropButton',
				/** @constructs */
				initialize: function (parentOrElementOrDocument)
				{
					this.setPropStoreFieldValue('groupDelimiter', '\n');
					this.setPropStoreFieldValue('charDelimiter', ' ');
					this.tryApplySuper('initialize', [parentOrElementOrDocument])
					this.setButtonKind(Kekule.Widget.Button.Kinds.DROPDOWN);
				},
				initProperties: function () {
					this.defineProp('chars', {'dataType': DataType.STRING});
					this.defineProp('groupDelimiter', {'dataType': DataType.STRING});
					this.defineProp('charDelimiter', {'dataType': DataType.STRING});
					this.defineProp('selector', {'dataType': 'KekuleMoodle.Widget.CharSelectorPanel', 'setter': null, 'serializable': false,
						'scope': Class.PropertyScope.PUBLIC,
						'getter': function()
						{
							var result = this.getPropStoreFieldValue('selector');
							if (!result)
							{
								result = new KekuleMoodle.Widget.CharSelectorPanel(this);
								//console.log(result.getClassName(), result);
								result.setPropStoreFieldValue('groupDelimiter', this.getGroupDelimiter());
								result.setPropStoreFieldValue('charDelimiter', this.getCharDelimiter());
								result.setChars(this.getChars());  // update result
								result.setDisplayed(false);
								result.getElement().style.position = 'absolute';  // important, do not affect normal content flow
								result.addEventListener('valueChange', this.reactPanelValueChange, this);
								this.setPropStoreFieldValue('selector', result);
							}
							return result;
						}
					});
				},
				doFinalize: function(/*$super*/)
				{
					var selector = this.getPropStoreFieldValue('selector');
					if (selector)
						selector.finalize();
					this.tryApplySuper('doFinalize')  /* $super() */;
				},
				/** @ignore */
				doGetWidgetClassName: function(/*$super*/)
				{
					return this.tryApplySuper('doGetWidgetClassName')  + ' KM-CharSelectorGroupButton';
				},
				/** @ignore */
				doGetDropDownWidget: function()
				{
					return this.getSelector();
				},

				/** @private */
				reactPanelValueChange: function(e)
				{
					var value = e.value;
					this.invokeEvent('valueChange', {'value': value});
					e.stopPropagation();
				}
			});
	}

	return {
		'init': function(){
			Kekule._ready(init);
		}
	};

});