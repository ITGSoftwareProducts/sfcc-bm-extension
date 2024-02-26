'use strict';

class File {
    constructor() {
        this.path = 'mockedFilePath';
        this.name = 'mockedFileName.csv';
        this.IMPEX = 'impex';
    }
    isDirectory() {
        return true;
    }
    exists() {
        return true;
    }
    mkdir() {
        return true;
    }
    mkdirs() {
        return true;
    }
    list() {
        return ['GroupsAndLocations.json'];
    }
}
module.exports = File;
