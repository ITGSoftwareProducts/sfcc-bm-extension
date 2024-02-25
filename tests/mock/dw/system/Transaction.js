'use strict';

function wrap(fn) {
    return fn();
}

module.exports = {
    wrap: wrap
};
