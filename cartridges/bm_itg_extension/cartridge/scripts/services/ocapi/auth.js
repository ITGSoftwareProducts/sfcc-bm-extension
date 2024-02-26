'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');

/**
 * @description Create OCAPI auth service.
 * @returns {Object} - Return service response
 */
const ocapiAuth = LocalServiceRegistry.createService('bmextension.ocapidata.auth', {

    createRequest: function (service) {
        service.addHeader('Accept', '*/*');
        service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        return 'grant_type=client_credentials';
    },
    parseResponse: function (service, httpClient) {
        var result = {
            error: true
        };
        if (httpClient.statusCode === 200) {
            try {
                var res = JSON.parse(httpClient.text);
                res.issued_at = Date.now();
                res.expires_at = res.issued_at + (res.expires_in * 1000);
                result = {
                    tokenObj: res
                };
            } catch (e) {
                Logger.error('Error while parsing ocapi auth response: {0}#{1}\n{2}\n{3}', e.fileName, e.lineNumber, e.message, e.stack);
            }
        }
        return result;
    },
    filterLogMessage: function () {
        return '';
    }
});

module.exports = ocapiAuth;
