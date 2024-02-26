'use strict';

var StringUtils = require('dw/util/StringUtils');
var ocapiEnums = require('~/cartridge/scripts/util/ocapiUtils/ocapiEnums');
var OcapiRequest = require('~/cartridge/scripts/util/ocapiUtils/ocapiRequest');

var ocapiBatchRequestBuilder = function () {
    this.ocapiRequestList = [];
    this.reqSequenceNo = 0;
    return this;
};

/**
 * @description Connects sub requests using a seperator.
 * @param {Array} ocapiReq - Array of sub request bodies to be used in a batch request.
 * @param {Array} index - Request Number.
 * @returns {string} - Returns the connected sub requests.
 */
var connectSubBodyWithSubHeaders = function (ocapiReq, index) {
    var headers = '';
    if (ocapiReq.requestId) {
        headers += StringUtils.format('x-dw-content-id: {0}\n', ocapiReq.requestId);
    } else {
        headers += StringUtils.format('x-dw-content-id: req{0}\n', index);
    }
    if (!empty(ocapiReq.headers)) {
        Object.keys(ocapiReq.headers).forEach(function (key) {
            var headerValue = ocapiReq.headers[key];
            headers += StringUtils.format('{0}: {1}\n', key, headerValue);
        });
    }
    var result = StringUtils.format('\n{0}\n{1}{2}', ocapiEnums.OCAPI_BATCH_SEPARATOR, headers, ocapiReq.body || '');
    return result;
};

/**
 * @description Connects sub requests using a seperator.
 * @param {Array} ocapiRequestList - Array of sub request bodies to be used in a batch request.
 * @returns {string} - Returns the connected sub requests.
 */
var connectSubRequests = function (ocapiRequestList) {
    var textBody = '';
    for (var i = 0; i < ocapiRequestList.length; i++) {
        textBody += connectSubBodyWithSubHeaders(ocapiRequestList[i], i);
    }
    var bodyres = textBody + ocapiEnums.OCAPI_BATCH_SEPARATOR + '--';
    return bodyres;
};

ocapiBatchRequestBuilder.prototype.addRequest = function (req, requestId) {
    if (!empty(req)) {
        req.setOcapiType(ocapiEnums.TYPES.BATCH);
        if (requestId) {
            req.setRequestId(requestId);
        }
        this.ocapiRequestList.push(req.build());
        return this;
    }
    throw new Error('Invalid OCAPI Request.');
};

ocapiBatchRequestBuilder.prototype.build = function () {
    var System = require('dw/system/System');

    var ocapiRequestObj = new OcapiRequest();

    ocapiRequestObj.setOcapiEndpointUrl(StringUtils.format('https://{0}/s/-/dw/batch', System.getInstanceHostname()));
    ocapiRequestObj.setHttpMethod(ocapiEnums.HTTP_METHODS.POST);
    ocapiRequestObj.setBody(connectSubRequests(this.ocapiRequestList));
    ocapiRequestObj.setHeaders({ 'x-dw-http-method': 'POST' }, { 'x-dw-resource-path': '/' }, { 'Content-Type': 'multipart/mixed; boundary=#separator$_@' });

    return ocapiRequestObj;
};

ocapiBatchRequestBuilder.prototype.execute = function () {
    var ocapiServiceHelper = require('~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper');
    var ocapiBatchReq = this.build();

    if (!ocapiBatchReq) {
        throw new Error('Missing parameters.');
    }

    return ocapiServiceHelper.callOcapiService(ocapiBatchReq, true);
};

module.exports = ocapiBatchRequestBuilder;
