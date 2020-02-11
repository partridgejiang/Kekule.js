var cssRootPath = __dirname +  '/../../../src/widgets/themes/default/';
var cssRootFileName = cssRootPath + 'kekule.css';
var cssDestFileName = 'kekule.css';

var fs = require('fs');
var path = require('path');
var minify = require('node-minify');
var CleanCSS = require('clean-css');

const defMinifierName = 'clean-css';
const defMinifierOptions = {
	'clean-css': {
		level: 2
	}
};

var LINE_BREAK = /\r\n|\r|\n/;

var CssCompressor = class {
	constructor (destPath, minifierName, minifierOptions)
	{
		this._sourceLineMap = {};
		this._externalImgFileNames = [];
		this._externalImgRuleInfo = {};
		this._fileEncoding = 'utf8';
		this._rootPath = cssRootPath;
		this._rootFiles = [cssRootFileName];
		this.destPath = destPath;
		this.destFileName = cssDestFileName;
		this.minifierName = minifierName || defMinifierName;
		this.minifierOptions = minifierOptions || defMinifierOptions[this.minifierName];
	}

	// Combine all @import files to one
	_fetchImportFilesInline(cssSrcLines, cssPath)
	{
		var resultLines = [];
		var pattern = /@import url\([\'\"](.*)[\'\"]\)/;
		var lines = cssSrcLines;
		var self = this;
		lines.forEach(function(line){
			var matchResult = line.match(pattern);
			if (matchResult && matchResult[1])  // matched, an @import command
			{
				var fileName = path.resolve(cssPath, matchResult[1]);
				if (fs.existsSync(fileName))
				{
					var rawContent = fs.readFileSync(fileName, self._fileEncoding);
					var childPath = path.dirname(fileName);
					var content = self._fetchImportFilesInline(rawContent.split(LINE_BREAK), childPath);
					if (content)
						resultLines = resultLines.concat(content);
				}
			}
			else
				resultLines.push(line);
		});
		return resultLines;
	}

	//
	_getLastUnemptyLineIndex(cssLines, index)
	{
		var currIndex = index - 1;
		var currLine = (cssLines[currIndex] || '').trim();
		while (!currLine && currIndex >= 0)
		{
			--currIndex;
			currLine = cssLines[currIndex].trim();
		}
		if (currIndex < 0)
			return -1;
		else
			return currIndex;
	}
	_getNextUnemptyLineIndex(cssLines, index)
	{
		var currIndex = index + 1;
		var currLine = (cssLines[currIndex] || '').trim();
		var totalLineCount = cssLines.length;
		while (!currLine && currIndex < totalLineCount)
		{
			++currIndex;
			currLine = cssLines[currIndex].trim();
		}
		if (currIndex >= totalLineCount)
			return -1;
		else
			return currIndex;
	}

	_getBackgroundImageRuleInfo(cssLines, bgImagePropertyLineIndex)
	{
		var selector, selectorLineIndexBegin, selectorLineIndexEnd, leadingBracketLineIndex, tailingBracketLineIndex;
		// find the leading '{' and the selector line
		var lastLineIndex = this._getLastUnemptyLineIndex(cssLines, bgImagePropertyLineIndex);
		if (lastLineIndex >= 0)
		{
			var lastLine = cssLines[lastLineIndex].trim();
			if (lastLine === '{')  // found '{'
			{
				leadingBracketLineIndex = lastLineIndex;
				selectorLineIndexEnd = this._getLastUnemptyLineIndex(cssLines, lastLineIndex);
				if (selectorLineIndexEnd >= 0)
				{
					selectorLineIndexBegin = selectorLineIndexEnd;
					var i = selectorLineIndexEnd;
					do
					{
						var lastSelectorLineIndex = this._getLastUnemptyLineIndex(cssLines, i);
						if (lastSelectorLineIndex >= 0)
						{
							var lastSelectorLine = cssLines[lastSelectorLineIndex].trim();
							if (lastSelectorLine.lastIndexOf(',') === lastSelectorLine.length - 1)
							{
								selectorLineIndexBegin = lastSelectorLineIndex;
								--i;
							}
							else
								break;
						}
						else
							break;
					}
					while (true)
				}
			}
		}
		// find tailing bracket
		var nextLineIndex = this._getNextUnemptyLineIndex(cssLines, bgImagePropertyLineIndex);
		if (nextLineIndex >= 0)
		{
			var nextLine = cssLines[nextLineIndex].trim();
			if (nextLine === '}')
			{
				tailingBracketLineIndex = nextLineIndex;
			}
		}

		if (selectorLineIndexBegin >= 0 && selectorLineIndexEnd >= 0)
		{
			var result = {
				'selectorLines': cssLines.slice(selectorLineIndexBegin, selectorLineIndexEnd + 1), 'selectorLineIndexBegin': selectorLineIndexBegin, 'selectorLineIndexEnd': selectorLineIndexEnd,
				'leadingBracketLineIndex': leadingBracketLineIndex, 'tailingBracketLineIndex': tailingBracketLineIndex
			};
			//console.log(result.selectorLines[result.selectorLines.length - 1] == cssLines[selectorLineIndexEnd], result.selectorLines, cssLines[selectorLineIndexEnd]);

			return result;
		}
		else
			return null;
	}

	// turn external background image to base64 string
	_imgToBase64DataString(imgFileName)
	{
		if (fs.existsSync(imgFileName))
		{
			var buffer = fs.readFileSync(imgFileName);
			var strBase64 = buffer.toString('base64');
			var fileExt = path.extname(imgFileName).substr(1).toLowerCase();
			var mimeType = fileExt === 'cur'? 'x-icon': fileExt;
			var dataType = 'data:image/' + mimeType + ';base64,';
			return dataType + strBase64;
		}
		return null;
	}

	_convertExternalCursorImageInline(cssLines, cssPath)
	{
		var propertyPattern = /(.*)cursor:\s*(url\(["'](.*)["']\))+/g;
		var urlPattern = /url\(["'](.*?)["']\)+/g;
		var result = [];
		var self = this;
		cssLines.forEach(function(line){
			var propMatch = line.match(propertyPattern);
			if (propMatch)
			{
				var newLine = line;
				var matches = line.matchAll(urlPattern);
				for (const match of matches) {
					var url = match[1];
					if (url)
					{
						if (url.indexOf('data:') !== 0)  // not already base64
						{
							var imgFileName = path.resolve(cssPath, url);
							var strBase64 = self._imgToBase64DataString(imgFileName);
							if (strBase64)
							{
								newLine = newLine.replace(url, strBase64);
							}
						}
					}
				}
				//console.log('convert to new cursor line', newLine);
				result.push(newLine);
			}
			else
				result.push(line);
		});
		return result;
	}

	_convertExternalBackgroundImageInline(cssLines, cssPath)
	{
		var self = this;
		var pattern = /(.*)background-image:\s*url\(["'](.*)["']\)/;
		var result = [];
		//cssLines.forEach(function(line){
		var i = 0, l = cssLines.length;
		//for (var i = 0, l = cssLines.length; i < l; ++i)
		while (i < l)
		{
			var line = cssLines[i];
			var matchResult = line.match(pattern);
			if (matchResult && matchResult[2])  // matched, an background image property
			{
				var strLeading = matchResult[1];
				var url = matchResult[2];
				if (url.indexOf('data:') !== 0)  // not already base64
				{
					var ruleInfo = self._getBackgroundImageRuleInfo(cssLines, i);
					if (!ruleInfo)
						console.warn('Can not found rule info', url);
					//console.log('find', url);
					var imgFileName = path.resolve(cssPath, url);
					var prevRuleInfo = self._externalImgRuleInfo[imgFileName];
					//if (self._externalImgFileNames.indexOf(imgFileName) >= 0)  // has duplication, try merge rules
					if (prevRuleInfo)
					{
						//console.warn('Duplicated background image resource: ' + imgFileName + '!');
						// combine selector
						var currSelector = ruleInfo.selectorLines.join(' ');
						var prevSelectorLineIndex = prevRuleInfo.selectorLineIndexEnd;
						prevSelectorLineIndex = self._sourceLineMap[prevSelectorLineIndex] || prevSelectorLineIndex;
						//console.log('[prev]', prevRuleInfo, currSelector);  //, result[prevSelectorLineIndex]);
						//console.log(prevSelectorLineIndex, result.length, prevSelectorLineIndex < result.length);
						result[prevSelectorLineIndex] = result[prevSelectorLineIndex] + ', ' + currSelector;
						//console.log('[NEW]');
						//console.log(result[prevSelectorLineIndex].trim());

						// erase prev selector lines
						var eraseLineCount = i - ruleInfo.selectorLineIndexBegin;
						result.splice(result.length - eraseLineCount, eraseLineCount);
						//console.log('erase', eraseLineCount);

						//console.log('merge rules', url, result[prevSelectorLineIndex]);

						// skip current rule lines
						i = ruleInfo.tailingBracketLineIndex + 1;
						continue;
					}
					else
					{
						self._externalImgRuleInfo[imgFileName] = ruleInfo;
					}
					var strBase64 = self._imgToBase64DataString(imgFileName);
					if (strBase64)
					{
						var newLine = strLeading + 'background-image: url("' + strBase64 + '");';
						result.push(newLine);
						//console.log('toBase64', line, newLine);
						self._externalImgFileNames.push(imgFileName);  // register already handled image file names, avoid duplication
						self._sourceLineMap[i] = result.length - 1;
					}
				}
			}
			else
			{
				result.push(line);
				self._sourceLineMap[i] = result.length - 1;
			}

			++i;
		}
		//});
		return result;
	}

	prepareCssContent(targetCssFiles, cssPath)
	{
		var self = this;
		var result = [];
		targetCssFiles.forEach(function(fileName){
			//console.log('handle', fileName);
			// test
			if (fs.existsSync(fileName))
			{
				var rawContent = fs.readFileSync(fileName, self._fileEncoding);
				var rawLines = rawContent.split(LINE_BREAK);
				//var rawLines = rawContent.split('\n');
				var lines = self._fetchImportFilesInline(rawLines, cssPath);
				lines = self._convertExternalBackgroundImageInline(lines, cssPath);
				lines = self._convertExternalCursorImageInline(lines, cssPath);
				if (lines && lines.length)
					result = result.concat(lines);
			}
		});
		//console.log('rule info', this._externalImgRuleInfo);
		return result.join('\n');
	}

	minimize(cssString, callback)
	{
		var input = this._rootFiles[0];
		//console.log('input', input);
		minify.minify({
			'compressor': this.minifierName,
			//'content': cssString,
			'input': cssString,
			'output': './output.css',
			'callback': callback
		});
	}

	execute(destPath)
	{
		this._externalImgFileNames = [];
		this._externalImgRuleInfo = {};
		this._sourceLineMap = {};
		var self = this;
		var rootFiles = this._rootFiles;
		var outputPath = destPath || this.destPath;
		var destFileName = path.resolve(outputPath, this.destFileName);
		var preparedCssString = this.prepareCssContent(rootFiles, this._rootPath);

		/*
		this.minimize(preparedCssString, function(err, min){
			if (err)
				console.error(err);
			else
			{
				console.log('minimized: ', min);
			}
		});
		*/
		// TODO: currently fixed to CSS Clean
		var options = this.minifierOptions[this.minifierName];
		var output = new CleanCSS(options).minify(preparedCssString);
		if (output.errors && output.errors.length)
			console.warn(output.errors);
		if (output.warnings && output.warnings.length)
			console.warn(output.warnings);

		var result = output.styles;

		if (result && outputPath && destFileName)
		{
			if (!fs.existsSync(outputPath)){
				fs.mkdirSync(outputPath, {recursive: true});
			}
			console.log('Min CSS file ' + this.destFileName + ' created');
			fs.writeFileSync(destFileName, result, 'utf-8');
		}

		return result;
	}
};

exports.CssCompressor = CssCompressor;