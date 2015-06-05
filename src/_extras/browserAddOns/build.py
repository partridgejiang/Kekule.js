# A simple Pythone program to analysis addon _common directory and copy each files to firefox or chrome directory to form different addons

#coding=utf-8
import os,shutil
import sys
import datetime

SOURCE_DIR = '_common'

# Different build target configs
# file mark is used to set file specified to single platform. e.g. myscript.fx.js will only be copied to Firefox dir and the name will be changed to myscript.js
class TargetConfig:
	name = ''
	directory = ''
	fileMark = ''
	def __init__(self, name, dir, fileMark):
		self.name = name
		self.directory = dir
		self.fileMark = fileMark
		
	def getExtMark(self):
		return '.' + self.fileMark

ignoreConfig = TargetConfig('ignore', '', 'ignore')  #special, ignore config, do not need to copy
firefoxConfig = TargetConfig('firefox', os.path.join('firefox', 'kekule'), 'fx')
chromeConfig = TargetConfig('chrome', os.path.join('chrome', 'kekule'), 'cr')
allConfigs = [ignoreConfig, firefoxConfig, chromeConfig]

#builder class
class Builder:
	srcDir = ''
	targets = []
	
	def __init__(self, srcDir, targets):
		self.srcDir = srcDir
		self.targets = targets
		
	# build all targets	
	def build(self):
		allExtMarks = self.getAllTargetExtMarks()
		for t in self.targets:
			print('handle target', t.name)
			self.iteratePath(self.srcDir, t.directory, t.getExtMark(), allExtMarks)		
	
	# Copy files to a specified target
	def buildTarget(self, targetConfig, allTargetExtMarks):
		srcRootDir = self.srcDir
		targetRootDir = targetConfig.directory
		
		if not os.path.isdir(srcRootDir) or not os.path.isdir(targetRootDir):
			return False
			
		self.iteratePath(srcRootDir, targetRootDir, targetConfig.getExtMark(), allTargetExtMarks)
		
	def getAllTargetExtMarks(self):
		global allConfigs
		result = []
		for c in allConfigs:
			result.append(c.getExtMark())
		return result
		
	
	# extract all exts from file name, returns an array. e.g. 'file.ext1.ext2' will returns ['file', 'ext1', 'ext2']
	def splitAllExts(self, filename):
		result = os.path.splitext(filename)
		ext = result[1]
		if ext == '':  # no ext			
			ret = [result[0]]
		else:
			ret = self.splitAllExts(result[0])
			ret.append(ext)
		#print('split', filename, ret)
		return ret
			
		
	# Analysis target mark of a file, returns a tuple (fileNameWithoutMark, extMark). If no mark found, extMark will be set to None.
	def analysisFileExtMark(self, filename, allTargetExtMarks):
		result = self.splitAllExts(filename)
		length = len(result)
		if length == 1:  # no ext
			return (filename, None)					
		elif length == 2:  # only one ext, usually not marked
			ext = result[1]
			try:
				index = allTargetExtMarks.index(ext)
			except:
				index = -1
			if index >= 0:
				return (result[0], ext)
			else:
				return (filename, None)
		else:  # more than one, usually regard the second ext to the end as mark
			print('result', result)
			extIndex = len(result) - 2
			ext = result[extIndex]
			try:
				index = allTargetExtMarks.index(ext)
			except:
				index = -1
			if index >= 0:	
				result.pop(extIndex)
				fname = ''
				for s in result:
					fname = fname + s
				return (fname, ext)
			else:
				return (filename, None)
				
				
	def iteratePath(self, srcDir, targetDir, targetExtMark, allExtMarks):
		print('iterate path', srcDir, targetDir)
		if not os.path.isdir(targetDir):  # target not exists, create
			print('create target path', targetDir)
			os.makedirs(targetDir)
			
		for file in os.listdir(srcDir):
			fileAnalysisResult = self.analysisFileExtMark(file, allExtMarks)
			extMark = fileAnalysisResult[1]
			coreFileName = fileAnalysisResult[0]
			srcFileName = os.path.join(srcDir, file)
			print('curr file', file, extMark, coreFileName)
			if extMark != None: # has ext mark, handle
				if targetExtMark != extMark:  # not for this target, bypass
					continue
			if os.path.isdir(srcFileName):
				newSrcDir = srcFileName
				newTargetDir = os.path.join(targetDir, coreFileName)
				print('copy path', newSrcDir, newTargetDir)
				self.iteratePath(newSrcDir, newTargetDir, targetExtMark, allExtMarks)				
			elif os.path.isfile(srcFileName):				
				targetFileName = os.path.join(targetDir, coreFileName)
				# if os.path.isfile(targetFileName)  # file already exists
				shutil.copy(srcFileName, targetFileName)
				print('copy file', srcFileName, targetFileName)
				
				
# run
print('====begin======')

# get args
argCount = len(sys.argv)
configs = []
if (argCount <= 1):  # no extra arg
	configs = allConfigs
else:  # specified the target
	targetName = sys.argv[1]
	for c in allConfigs:
		if c.name == targetName:
			configs = [c]
			break

#print('curr targets', configs)			
builder = Builder(SOURCE_DIR, configs)
builder.build()

#print(builder.analysisFileExtMark('chemObjImport.addon.fx.js', ['.fx', '.cr']))

print('====end======')