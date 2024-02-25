'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const CacheMgr = require('../../../../mock/dw/system/CacheMgr');
const Logger = require('../../../../mock/dw/system/Logger');
const StringUtils = require('../../../../mock/dw/util/StringUtils');
const DW = require('../../../../mock/dw');
const Resource = require('../../../../mock/dw/web/Resource');

describe('OCI Util', () => {
    var preferences = {
        organizationId: 'organizationId',
        ociVersion: '1',
        shortCode: 'shortcode'

    };
    const ociService = {
        call: sinon.stub()
    };
    const ociAuthService = {
        call: sinon.stub()
    };
    const OCIResponse = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ociUtils/ociResponse.js');
    const OCIEnums = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ociUtils/ociEnums.js');
    const OCIServiceHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ociUtils/ociServiceHelper.js', {
        'dw/system/CacheMgr': CacheMgr,
        'dw/system/Logger': Logger,
        '~/cartridge/scripts/services/oci/rest': ociService,
        '~/cartridge/scripts/util/ociUtils/ociResponse': OCIResponse,
        '~/cartridge/scripts/services/oci/auth': ociAuthService,
        'dw/svc/Result': DW.svc.Result,
        'dw/web/Resource': Resource


    });
    const OCIRequestBuilder = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ociUtils/ociRequestBuilder.js', {
        '~/cartridge/config/preferences': preferences,
        '*/cartridge/scripts/util/ociUtils/ociServiceHelper': OCIServiceHelper,
        'dw/util/StringUtils': StringUtils
    });
    const OCIUtil = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/oci', {
        '~/cartridge/scripts/util/ociUtils/ociEnums': OCIEnums,
        '~/cartridge/scripts/util/ociUtils/ociRequestBuilder': OCIRequestBuilder,
        '*/cartridge/scripts/util/ociUtils/ociServiceHelper': OCIServiceHelper
    });
    beforeEach(() => {
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('#ociRequestBulder.execute', () => {
        it('should return success response', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: false,
                object: {
                    tokenObj: {
                        access_token: 'token123',
                        issued_at: Date.now()
                    }
                }
            };
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };

            ociAuthService.call.returns(authToken);
            ociService.call.returns(response);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
          //  ociReq.addParameters('param1', 'param2');

            var result = ociReq.execute();
            assert.deepEqual(result, { 'data': response.object });
        });
        it('should return error message', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: false,
                object: {
                    tokenObj: {
                        access_token: 'token123',
                        issued_at: Date.now()
                    }
                }
            };
            const response = {
                ok: false,
                status: 'ERROR',
                error: '500',
                errorMessage: '{ "fault": {"type": "SERVER_ERROR", "message": "server error" }}'
            };

            ociAuthService.call.returns(authToken);
            ociService.call.returns(response);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
            var result = ociReq.execute();
            assert.deepEqual(result, {
                error: true,
                errorCode: '500',
                errorType: 'SERVER_ERROR',
                errorMessage: 'server error'
            });
        });
        it('should return service unavailable error message', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: false,
                object: {
                    tokenObj: {
                        access_token: 'token123',
                        issued_at: Date.now()
                    }
                }
            };
            const response = {
                ok: false,
                status: 'SERVICE_UNAVAILABLE',
                error: '500',
                errorMessage: '{ "fault": {"type": "SERVICE_UNAVAILABLE", "message": "service unavailable" }}'
            };

            ociAuthService.call.returns(authToken);
            ociService.call.returns(response);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
            var result = ociReq.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: {
                    errorMessage: 'error.oci.time.out'
                }
            });
        });
        it('should return token not valid error message', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: true };

            ociAuthService.call.returns(authToken);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
            var result = ociReq.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: { errorMessage: Resource.msg('error.oci.token.missing', 'common', null) }
            });
        });
        it('should log error while parsing invalid error message', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: false,
                object: {
                    tokenObj: {
                        access_token: 'token123',
                        issued_at: Date.now()
                    }
                }
            };
            const response = {
                ok: false,
                status: 'ERROR',
                error: '500',
                errorMessage: 'ERROR'
            };

            ociAuthService.call.returns(authToken);
            ociService.call.returns(response);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
            var result = ociReq.execute();
            assert.deepEqual(result, {});
        });

        it('should return token not valid error message', () => {
            var endpoint = {
                type: 'ocapi',
                api: 'ocapi/v1/organizations/123456/',
                method: 'GET'
            };
            const authToken = {
                error: true,
                object: {}
            };

            ociAuthService.call.returns(authToken);
            var ociReq = new OCIUtil.RequestBuilder();
            ociReq.setOciAction(endpoint);
            ociReq.setBody({});
            var result = ociReq.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: { errorMessage: Resource.msg('error.oci.token.missing', 'common', null) }
            });
        });

        it('should throw errors when parameters are null', () => {
            var ociReq = new OCIUtil.RequestBuilder();

            assert.throws(() => {
                ociReq.setOciAction(null);
            }, /Invalid OCI Endpoint./, 'Should throw an exception');
            assert.throws(() => {
                ociReq.setBody(null);
            }, /Invalid body./, 'Should throw an exception');
            /* assert.throws(() => {
                ociReq.addParameters();
            }, /Invalid parameters./, 'Should throw an exception');*/
            assert.throws(() => {
                ociReq.setHeader();
            }, /Invalid header./, 'Should throw an exception');

            assert.throws(() => {
                ociReq.execute();
            }, /Invalid OCI Endpoint./, 'Should throw an exception');
        });
    });
    describe('#ociResponse', () => {
        it('should return successful response', () => {
            var data = { 'key': 'value' };
            var code = '200';
            var responseId = 1;
            var ociResponse = new OCIResponse(data, code, responseId);
            var result = ociResponse.getObject();

            assert.equal(result, data);
        });
        it('should return null when response has empty data', () => {
            var data = {};
            var code = '404';
            var responseId = 1;
            var ociResponse = new OCIResponse(data, code, responseId);
            var result = ociResponse.getObject();

            assert.isNull(result);
        });
        it('should return null when response code is 404', () => {
            var data = { fault: { type: 'NotFoundException', message: 'server error' } };
            var code = '404';
            var responseId = 1;
            var ociResponse = new OCIResponse(data, code, responseId);
            var isOk = ociResponse.isOk();
            assert.isFalse(isOk);

            var result = ociResponse.getObject();
            assert.isNull(result);
        });
        it('should throw exception when code is null', () => {
            var ociResponse = new OCIResponse();

            assert.throws(() => {
                ociResponse.setStatusCode(null);
            }, /Invalid status code./, 'Should throw an exception');
            /* assert.throws(() => {
                ociResponse.setResponseId(null);
            }, /Invalid response id./, 'Should throw an exception');*/
            assert.throws(() => {
                ociResponse.setData(null);
            }, /Invalid data./, 'Should throw an exception');
        });
    });
});
