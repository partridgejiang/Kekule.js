#coding=utf-8
import os,shutil

def writeAllFilesInPath(rootDir, outputPath, outputFile):
	for file in os.listdir(rootDir):
		srcFileName = rootDir + '/' + file  #os.path.join(rootDir, file)
		outputSrcFileName = outputPath + '/' + file
		if os.path.isdir(srcFileName):
			writeAllFilesInPath(srcFileName, outputSrcFileName, outputFile)
		elif os.path.isfile(srcFileName):
			print(srcFileName)
			outputFile.write('"' + outputSrcFileName + '",\n')
			
outputFileName = 'allFiles.txt'
rootDir = '_common/data/styles/kekule'
relDir = 'data/styles/kekule'
outputFile = open(outputFileName, 'w')
writeAllFilesInPath(rootDir, relDir, outputFile)
outputFile.close()