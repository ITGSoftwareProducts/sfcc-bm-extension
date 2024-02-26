'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');

/**
 * @description Create OCI Service.
 * @returns {Object} - Return service Response
 */
const ociService = LocalServiceRegistry.createService('bmextension.oci.rest.all', {
    createRequest: function (service, args) {
        service.setURL(args.ociEndpointUrl)
        .addHeader('Authorization', 'Bearer ' + args.accessToken)
        .addHeader('Accept', '*/*');
        if (!empty(args.headers)) {
            Object.keys(args.headers).forEach(function (key) {
                var headerValue = args.headers[key];
                service.addHeader(key, headerValue);
            });
        }
        if (args.requestMethod) {
            service.setRequestMethod(args.requestMethod);
        }
        return args.request;
    },
    parseResponse: function (service, httpClient) {
        var result = '';
        var successfulStatusCodes = [200, 204];
        if (successfulStatusCodes.indexOf(httpClient.statusCode) !== -1) {
            try {
                result = !empty(httpClient.text) ? JSON.parse(httpClient.text) : '';
            } catch (e) {
                Logger.error('Error while parsing oci response: {0}#{1}\n{2}\n{3}', e.fileName, e.lineNumber, e.message, e.stack);
            }
        }
        return result;
    },
    filterLogMessage: function (msg) {
        return msg;
    }
});


module.exports = ociService;
