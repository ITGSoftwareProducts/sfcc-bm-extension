/* eslint-disable no-undef */
'use strict';

var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileWriter = require('dw/io/FileWriter');
var ArrayList = require('dw/util/ArrayList');
var StringUtils = require('dw/util/StringUtils');

/**
 * Download a file with specific path and pattern.
 * @param {string} impexPath - IMPEX Path.
 * @param {string} fileName - File name.
 * @param {string} fileType - File extension.
 * @returns {bool} success
 */
function downloadFile(impexPath, fileName, fileType) {
    var directory = new File(impexPath);
    var success = true;
    var filePattern = StringUtils.format('.{0}', fileType);
    if (directory != null && directory.isDirectory()) {
        var fileNameWithType = fileName.indexOf(fileType) === -1 ? fileName + filePattern : fileName;
        var fullFileName = impexPath + fileNameWithType;
        var file = new File(fullFileName);
        if (file.exists()) {
            var fileReader = new FileReader(file, 'UTF-8');
            response.setContentType(fileType === 'csv' ? 'text/csv' : 'application/xml');
            response.addHttpHeader(response.CONTENT_DISPOSITION, 'attachment; filename=' + fileNameWithType);
            try {
                var exitFlag = false;
                var contentArray = [];
                while (!exitFlag) {
                    var fileContent = fileReader.readN(29999);
                    if (!empty(fileContent)) {
                        contentArray.push(fileContent);
                    } else {
                        exitFlag = true;
                    }
                }
                for (var i = 0; i < contentArray.length; i++) {
                    response.getWriter().write(contentArray[i]);
                }
            } catch (e) {
                success = false;
                Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            }
        }
    }
    return success;
}

/**
 * Create file in Impex.
 * @param {string} content - File content.
 * @param {string} impexPath - IMPEX path.
 * @param {string} fileName - File name.
 * @param {string} filePattern - File extension.
 */
function createFileInImpex(content, impexPath, fileName, filePattern) {
    var directory = new File(impexPath);

    if (!directory.exists()) {
        directory.mkdirs();
    }
    var pdpath = impexPath + fileName + filePattern;
    var file = new File(pdpath);
    var fileWriter = new FileWriter(file, 'UTF-8');
    fileWriter.write(content);
    fileWriter.close();
}

/**
 * Gets the list of files from IMPEX path.
 * @param {string} directory - Path of the files
 * @param {string} patternString - The file extension.
 * @returns {Array} fileList
 */
function getFileList(directory, patternString) {
    var fileList = new ArrayList();
    var content = directory.list();
    if (content.length > 0) {
        if (!empty(patternString)) {
            for (var i = 0; i < content.length; i++) {
                var file = content[i];
                if (file.match(patternString)) {
                    fileList.add(file);
                }
            }
        }
    }
    return fileList;
}

/**
 * Create Directory
 * @param {string} dirPath - Directory path
 */
function createDirectory(dirPath) {
    var dir = new File(dirPath);
    if (!dir.exists()) {
        dir.mkdir();
    }
}

module.exports = {
    downloadFile: downloadFile,
    createFileInImpex: createFileInImpex,
    getFileList: getFileList,
    createDirectory: createDirectory
};
