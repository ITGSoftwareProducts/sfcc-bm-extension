'use strict';
class FileReader {
    constructor() {
        this.base = {};
    }

    readN() {
        return true;
    }
    getString() {
        return JSON.stringify({ groups: [
            { id: '1', name: 'group1' },
            { id: '2', name: 'group2' }
        ],
            downloadTime: '2024-01-31T12:00:00Z' });
    }
    close() {
        return true;
    }
    readLine() {
        return this.getString();
    }
}

module.exports = FileReader;
