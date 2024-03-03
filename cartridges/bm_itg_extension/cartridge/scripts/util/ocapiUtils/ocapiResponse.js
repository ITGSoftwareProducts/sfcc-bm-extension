'use strict';

var ocapiResponse = function (data, code, responseId) {
    if (responseId) {
        this.setResponseId(responseId);
    }

    if (code) {
        this.setStatusCode(code);
    }

    if (data) {
        this.setData(data);
    }

    return this;
};

ocapiResponse.prototype.setResponseId = function (responseId) {
    if (!empty(responseId)) {
        this.responseId = responseId;
        return this;
    }
    throw new Error('Invalid response id.');
};

ocapiResponse.prototype.setStatusCode = function (code) {
    if (!empty(code)) {
        this.code = code;
        return this;
    }
    throw new Error('Invalid status code.');
};

ocapiResponse.prototype.setData = function (data) {
    if (!empty(data)) {
        this.data = data;
        return this;
    }
    throw new Error('Invalid data.');
};

ocapiResponse.prototype.isOk = function () {
    return !this.code || ['200', '201', '204'].indexOf(this.code) !== -1 || (this.code === '404' && this.data.fault && this.data.fault.type.indexOf('NotFoundException') !== -1);
};

ocapiResponse.prototype.getObject = function () {
    if (this.code === '404') {
        return null;
    } else if (this.isOk()) {
        return this.data;
    }
    return this.data && this.data.fault ? { error: true, errorCode: this.code, errorType: this.data.fault.type, errorMessage: this.data.fault.message } : '';
};

module.exports = ocapiResponse;
