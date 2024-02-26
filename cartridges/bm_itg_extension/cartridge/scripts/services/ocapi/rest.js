'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var ocapiEnums = require('~/cartridge/scripts/util/ocapiUtils/ocapiEnums');
var OcapiResponse = require('~/cartridge/scripts/util/ocapiUtils/ocapiResponse');

var buildBatchResponseList = function (responseText) {
    var responseList = {};
    for (var i = 1; i < responseText.length; i++) {
        var subResponse = responseText[i].split('\n');
        var resId = 'req' + (i - 1);
        var resCode = '200';
        for (var j = 0; j < subResponse.length; j++) {
            if (subResponse[j].indexOf('x-dw-content-id') !== -1) {
                resId = subResponse[j].substr('x-dw-content-id: '.length);
            } else if (subResponse[j].indexOf('x-dw-status-code') !== -1) {
                resCode = subResponse[j].substr('x-dw-status-code: '.length);
            }
        }
        // eslint-disable-next-line no-useless-escape
        var resBody = responseText[i].split(/x-dw-status-code\:.*/g)[1];
        resBody = resBody.replace(ocapiEnums.OCAPI_BATCH_SEPARATOR + '--', '').replace(/[\n\r]/g, '');
        try {
            var res = JSON.parse(resBody);
            var ocapiRes = new OcapiResponse(res, resCode, resId);
            responseList[resId] = {
                error: !ocapiRes.isOk(),
                data: ocapiRes.getObject()
            };
        } catch (e) {
            Logger.error('Error while parsing ocapi response: {0}#{1}\n{2}\n{3}', e.fileName, e.lineNumber, e.message, e.stack);
        }
    }
    return responseList;
};

/**
 * @description Create OCAPI Service.
 * @returns {Object} - Return service Response
 */
const ocapiService = LocalServiceRegistry.createService('bmextension.ocapidata.rest.all', {
    createRequest: function (service, args) {
        this.ocapiType = null;
        service.setURL(args.ocapiEndpointUrl)
            .addHeader('Authorization', 'Bearer ' + args.accessToken)
            .addHeader('Accept', 'application/json');
        if (!empty(args.headers)) {
            Object.keys(args.headers).forEach(function (key) {
                var headerValue = args.headers[key];
                service.addHeader(key, headerValue);
            });
        }
        if (args.requestMethod) {
            service.setRequestMethod(args.requestMethod);
        }

        if (service.URL.indexOf(ocapiEnums.TYPES.BATCH) !== -1) {
            this.ocapiType = ocapiEnums.TYPES.BATCH;
        }

        return args.request;
    },
    parseResponse: function (service, httpClient) {
        var result;
        if (this.ocapiType !== ocapiEnums.TYPES.BATCH) {
            try {
                result = JSON.parse(httpClient.text);
            } catch (e) {
                Logger.error('Error while parsing ocapi response: {0}#{1}\n{2}\n{3}', e.fileName, e.lineNumber, e.message, e.stack);
            }
        } else {
            result = buildBatchResponseList(httpClient.text.split(ocapiEnums.OCAPI_BATCH_SEPARATOR + '\n'));
        }
        return result;
    },
    filterLogMessage: function (msg) {
        return msg;
    }
});

module.exports = ocapiService;
