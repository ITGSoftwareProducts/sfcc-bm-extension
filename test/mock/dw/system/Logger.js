'use strict';


function error(text) {
    return text;
}

function debug(text) {
    return text;
}
function info(text) {
    return text;
}
// dw.system.Logger methods
function getLogger() {
    return {
        error: error,
        debug: debug,
        info: info
    };
}

module.exports = {
    getLogger: getLogger,
    error: error,
    debug: debug,
    info: info
};
