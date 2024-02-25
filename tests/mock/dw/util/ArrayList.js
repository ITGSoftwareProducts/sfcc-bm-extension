'use strict';

class ArrayList extends Array {

    add(item) {
        return this.push(item);
    }
    get(index) {
        return this[index];
    }
    size() {
        return this.length;
    }
}

module.exports = ArrayList;
