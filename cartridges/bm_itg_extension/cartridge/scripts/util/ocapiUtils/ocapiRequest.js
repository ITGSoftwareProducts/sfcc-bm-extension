'use strict';

var ocapiRequest = function () {
    this.id = null;
    this.ocapiEndpointUrl = null;
    this.httpMethod = null;
    this.headers = null;
    this.body = null;
    return this;
};

ocapiRequest.prototype.setRequestId = function (id) {
    if (!empty(id)) {
        this.id = id;
        return this;
    }
    throw new Error('Invalid request id.');
};

ocapiRequest.prototype.setOcapiEndpointUrl = function (ocapiEndpointUrl) {
    if (!empty(ocapiEndpointUrl)) {
        this.ocapiEndpointUrl = ocapiEndpointUrl;
        return this;
    }
    throw new Error('Invalid endpoint.');
};

ocapiRequest.prototype.setHttpMethod = function (httpMethod) {
    if (!empty(httpMethod)) {
        this.httpMethod = httpMethod;
        return this;
    }
    throw new Error('Invalid http method.');
};

ocapiRequest.prototype.setHeader = function (name, value) {
    if (!empty(name) && !empty(value)) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers[name] = value;
        return this;
    }
    throw new Error('Invalid header.');
};

ocapiRequest.prototype.setHeaders = function () {
    if (!empty(arguments) && arguments.length > 0) {
        if (!this.headers) {
            this.headers = {};
        }
        for (var i = 0; i < arguments.length; i++) {
            var header = arguments[i];
            var key = Object.keys(header)[0];
            this.headers[key] = header[key];
        }
        return this;
    }
    throw new Error('Invalid headers.');
};

ocapiRequest.prototype.setBody = function (bodyObj) {
    if (!this.body) {
        this.body = '';
    }
    if (!empty(bodyObj)) {
        this.body = bodyObj;
        return this;
    }
    throw new Error('Invalid body.');
};

module.exports = ocapiRequest;
