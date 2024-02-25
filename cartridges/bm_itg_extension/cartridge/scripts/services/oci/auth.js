'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var prefs = require('~/cartridge/config/preferences');

/**
 * @description Create OCI auth service.
 * @returns {Object} - Return service response
 */
const ociAuth = LocalServiceRegistry.createService('bmextension.oci.auth', {

    createRequest: function (service) {
        service.addHeader('Accept', 'application/json');
        service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        var realmId = prefs.realmId;
        var instanceId = prefs.instanceId;
        var scopes = [
            'SALESFORCE_COMMERCE_API:' + realmId + '_' + instanceId,
            'sfcc.inventory.impex-graphs',
            'sfcc.inventory.availability',
            'sfcc.inventory.availability.rw'
        ];
        var scope = scopes.join(' ');
        var bodyArray = [];
        bodyArray.push('grant_type=client_credentials');
        bodyArray.push('scope=' + encodeURIComponent(scope));
        var body = bodyArray.join('&');

        return body;
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
                Logger.error('Error while parsing oci auth response: {0}#{1}\n{2}\n{3}', e.fileName, e.lineNumber, e.message, e.stack);
            }
        }
        return result;
    },
    filterLogMessage: function () {
        return null;
    }
});

module.exports = ociAuth;

