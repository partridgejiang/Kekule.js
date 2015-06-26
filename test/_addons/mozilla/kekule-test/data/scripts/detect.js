/**
 * Created by Partridge on 2015/5/11.
 * File to detect select or focus event in page.
 */

(function(){

	function selectionChange()
	{
		self.port.emit("select");
	}
	function focusChange(e)
	{
		self.port.emit('focus', {'targetElem': e.target, 'targetElemTag': e.target.tagName});
	}
	function activeElemChange(e)
	{
		console.log('[active element may change]',  document.activeElement.tagName,  document.activeElement);
		self.port.emit('activeElemChange',
			{'targetElem': e.target, 'targetElemTag': e.target.tagName, 'activeElem': document.activeElement});
	}

	document.addEventListener('select', selectionChange);
	document.body.addEventListener('focus', focusChange, true);
	document.addEventListener('mouseup', activeElemChange);
	document.addEventListener('keyup', activeElemChange);

})();