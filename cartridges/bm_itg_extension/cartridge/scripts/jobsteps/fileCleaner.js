'use strict';

var File = require('dw/io/File');
var constants = require('*/cartridge/scripts/helpers/constants');
var filesCount = constants.GLOBAL.FILE_RETENTION_COUNT;

function cleanFolder(rootFolder) {
    // get all files inside the directory
    var files = rootFolder.listFiles(function (file) {
        return file.isFile();
    });

    if (files.size() > filesCount) {
        // sort files according to their last modeified time ins ascending order
        files.sort(function (lhs, rhs) {
            return lhs.lastModified() - rhs.lastModified();
        });
        var filesToDelete = files.slice(0, -1 * filesCount);
        var fileIt = filesToDelete.iterator();
        while (fileIt.hasNext()) {
            var fileToDelete = fileIt.next();
            if (fileToDelete.exists()) {
                fileToDelete.remove();
            }
        }
    }

    // get all sub-directories in the directory
    var subDirs = rootFolder.listFiles(function (file) {
        return file.isDirectory();
    });

    var dirIt = subDirs.iterator();
    while (dirIt.hasNext()) {
        cleanFolder(dirIt.next());
    }
}

function execute(params) {
    var rootFolder = new File(File.IMPEX + File.SEPARATOR + params.WorkingFolder);
    if (params.AllowedFilesCountPerFolder) {
        filesCount = params.AllowedFilesCountPerFolder;
    }
    if (rootFolder.isDirectory()) {
        cleanFolder(rootFolder);
    }
}

exports.execute = execute;
