'use strict';

function ociResponse(data, code) {
    if (code) {
        this.setStatusCode(code);
    }

    if (data) {
        this.setData(data);
    }

    return this;
}

ociResponse.prototype.setStatusCode = function (code) {
    if (!empty(code)) {
        this.code = code;
        return this;
    }
    throw new Error('Invalid status code.');
};

ociResponse.prototype.setData = function (data) {
    if (!empty(data)) {
        this.data = data;
        return this;
    }
    throw new Error('Invalid data.');
};

ociResponse.prototype.isOk = function () {
    return ['200', '201', '204'].indexOf(this.code) !== -1;
};

ociResponse.prototype.getObject = function () {
    var responseObject = {};

    if (this.code === '404') {
        return null;
    } else if (this.code === '409') {
        return { error: true, errorCode: this.code };
    } else if (this.isOk()) {
        return this.data;
    }
    if (this.data && this.data.fault) {
        return { error: true, errorCode: this.code, errorType: this.data.fault.type, errorMessage: this.data.fault.message };
    } else if (this.data && this.data.detail) {
        return { error: true, errorCode: this.code, errorType: this.data.title, errorMessage: this.data.detail };
    }
    return responseObject;
};

module.exports = ociResponse;
