'use strict';

var prefs = require('~/cartridge/config/preferences');
var StringUtils = require('dw/util/StringUtils');

function ociRequestBuilder() {
    this.ociEndpoint = null;
    this.ociType = null;
    this.headers = null;
    this.parameters = [];
    this.body = null;
    this.sorts = [];
    this.expandToAttrs = [];
    return this;
}

ociRequestBuilder.prototype.setOciAction = function (ociEndpoint) {
    if (ociEndpoint) {
        this.ociEndpoint = ociEndpoint;
        return this;
    }
    throw new Error('Invalid OCI Endpoint.');
};

ociRequestBuilder.prototype.setHeader = function (name, value) {
    if (!empty(name) && !empty(value)) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers[name] = value;
        return this;
    }
    throw new Error('Invalid header.');
};

ociRequestBuilder.prototype.setBody = function (bodyStr) {
    if (!empty(bodyStr)) {
        this.body = JSON.stringify(bodyStr);
        return this;
    }
    throw new Error('Invalid body.');
};

ociRequestBuilder.prototype.build = function () {
    if (!this.ociEndpoint) {
        throw new Error('Invalid OCI Endpoint.');
    }
    var organizationId = prefs.organizationId;
    var ociVersion = prefs.ociVersion;
    var shortCode = prefs.shortCode;
    var type = this.ociEndpoint.type;

    var ociEndpointUrl = StringUtils.format('https://{0}.api.commercecloud.salesforce.com/inventory/{1}/v{2}/organizations/{3}/', shortCode, type, ociVersion, organizationId);

    this.setHeader('Content-Type', 'application/json');

    var ociEndpointApiWithParams = this.ociEndpoint.api;
    if (!empty(this.parameters)) {
        for (var i = 0; i < this.parameters.length; i++) {
            ociEndpointApiWithParams = ociEndpointApiWithParams.replace('{' + i + '}', this.parameters[i]);
        }
    }

    this.ociEndpointUrl = ociEndpointUrl + ociEndpointApiWithParams;

    this.httpMethod = this.ociEndpoint.method;

    return {
        ociEndpointUrl: this.ociEndpointUrl,
        httpMethod: this.httpMethod,
        headers: this.headers,
        parameters: this.parameters,
        body: this.body
    };
};

ociRequestBuilder.prototype.execute = function () {
    var ociServiceHelper = require('*/cartridge/scripts/util/ociUtils/ociServiceHelper');
    var ociReq = this.build();

    return ociServiceHelper.callOciService(ociReq);
};

module.exports = ociRequestBuilder;
