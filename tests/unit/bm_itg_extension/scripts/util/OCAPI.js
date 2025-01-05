'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const StringUtils = require('../../../../mock/dw/util/StringUtils');
const Resource = require('../../../../mock/dw/web/Resource');
const Site = require('../../../../mock/dw/system/Site');
const Logger = require('../../../../mock/dw/system/Logger');
const DW = require('../../../../mock/dw');
const CacheMgr = require('../../../../mock/dw/system/CacheMgr');

describe('OCAPI Util', () => {
    const ocapiService = {
        call: sinon.stub()
    };
    const ocapiAuthService = {
        call: sinon.stub()
    };
    const ocapiEnums = {
        HTTP_METHODS: {
            GET: 'GET',
            POST: 'POST'
        },
        ENDPOINTS: {
            COUPON_GET_BY_ID: {
                api: 'coupons/{0}',
                method: 'GET',
                siteSpecific: false,
                type: 'data'
            }
        },
        TYPES: {
            BATCH: 'batch',
            DATA: 'data'
        },
        OCAPI_BATCH_SEPARATOR: '-'
    };
    const validAuthToken = {
        error: false,
        object: {
            tokenObj: {
                access_token: 'token123',
                issued_at: Date.now()
            }
        }
    };
    const OcapiRequest = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiRequest');
    const OcapiResponse = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiResponse', {
        'dw/web/Resource': Resource
    });
    const ocapiServiceHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper', {
        'dw/svc/Result': {
            SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
        },
        'dw/system/Logger': Logger,
        'dw/web/Resource': Resource,
        'dw/system/CacheMgr': CacheMgr,
        '~/cartridge/scripts/util/ocapiUtils/ocapiResponse': OcapiResponse,
        '~/cartridge/scripts/services/ocapi/rest': ocapiService,
        '~/cartridge/scripts/services/ocapi/auth': ocapiAuthService
    });

    const ocapiBatchRequestBuilder = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiBatchRequestBuilder', {
        'dw/util/StringUtils': StringUtils,
        'dw/system/System': DW.system.System,
        '~/cartridge/scripts/util/ocapiUtils/ocapiEnums': ocapiEnums,
        '~/cartridge/scripts/util/ocapiUtils/ocapiRequest': OcapiRequest,
        '~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper': ocapiServiceHelper
    });

    const ocapiRequestBuilder = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiRequestBuilder', {
        'dw/system/Site': Site,
        'dw/util/StringUtils': StringUtils,
        'dw/system/System': DW.system.System,
        '~/cartridge/scripts/util/ocapiUtils/ocapiEnums': ocapiEnums,
        '~/cartridge/scripts/util/ocapiUtils/ocapiRequest': OcapiRequest,
        '~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper': ocapiServiceHelper
    });

    const ocapiHelper = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiHelper');

    var ocapiUtil = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapi', {
        '~/cartridge/scripts/util/ocapiUtils/ocapiBatchRequestBuilder': ocapiBatchRequestBuilder,
        '~/cartridge/scripts/util/ocapiUtils/ocapiEnums': ocapiEnums,
        '~/cartridge/scripts/util/ocapiUtils/ocapiRequestBuilder': ocapiRequestBuilder,
        '~/cartridge/scripts/util/ocapiUtils/ocapiHelper': ocapiHelper
    });

    beforeEach(() => {
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('#ocapiBatchRequestBuilder', () => {
        it('should add the request properly', () => {
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            var couponId = '123';
            const ocapiRequest = new ocapiUtil.RequestBuilder()
                .setRequestId(Site.getCurrent().getID())
                .setOcapi(ocapiEnums.ENDPOINTS.COUPON_GET_BY_ID)
                .addParameters(Site.getCurrent().getID(), couponId);


            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            ocapiBuilder.addRequest(ocapiRequest, 1);


            var result = ocapiBuilder.execute();
            assert.deepEqual(result, { responseList: { data: 'response_data' } });
        });

        it('should throw an exception if Null Request.', () => {
            var ocapiBuilder = new ocapiUtil.BatchBuilder();

            assert.throws(() => {
                ocapiBuilder.addRequest(null, 1);
            }, /Invalid OCAPI Request./, 'Should throw an exception');
        });

        it('should add the request properly with valid null request Id.', () => {
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            var couponId = '123';
            const ocapiRequest = new ocapiUtil.RequestBuilder()
                .setOcapi(ocapiEnums.ENDPOINTS.COUPON_GET_BY_ID)
                .addParameters(Site.getCurrent().getID(), couponId);


            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            ocapiBuilder.addRequest(ocapiRequest);


            var result = ocapiBuilder.execute();
            assert.deepEqual(result, { responseList: { data: 'response_data' } });
        });
        it('should return error message', () => {
            const response = {
                ok: false,
                status: 'ERROR',
                error: '500',
                errorMessage: '{ "fault": {"type": "SERVER_ERROR", "message": "server error" }}'
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);


            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            var result = ocapiBuilder.execute();
            assert.deepEqual(result, {
                error: true,
                errorCode: '500',
                errorType: 'SERVER_ERROR',
                data: {
                    errorMessage: 'error.ocapi.message'
                }
            });
        });
        it('should return service unavailable error message', () => {
            const response = {
                ok: false,
                status: 'SERVICE_UNAVAILABLE',
                error: '500',
                errorMessage: 'error.ocapi.time.out'
            };

            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            var result = ocapiBuilder.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: {
                    errorMessage: response.errorMessage
                }
            });
        });

        it('should return token not valid error message', () => {
            const invalidAuthToken = {
                error: true,
                object: {}
            };

            ocapiAuthService.call.returns(invalidAuthToken);
            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            var result = ocapiBuilder.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: { errorMessage: Resource.msgf('error.ocapi.message', 'common', null) }
            });
        });

        it('should log error while parsing invalid error message', () => {
            const response = {
                ok: false,
                status: 'ERROR',
                error: '500',
                errorMessage: 'ERROR'
            };

            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            var result = ocapiBuilder.execute();
            assert.deepEqual(result, '');
        });

        it('should return token not valid error message', () => {
            const authToken = {
                error: true
            };

            ocapiAuthService.call.returns(authToken);
            var ocapiBuilder = new ocapiUtil.BatchBuilder();
            var result = ocapiBuilder.execute();
            assert.deepEqual(result, {
                error: true,
                serviceError: true,
                data: { errorMessage: Resource.msgf('error.ocapi.message', 'common', null) }
            });
        });

        it('should throw an error if required input parameters are missing', () => {
            // Stub the build function
            const buildStub = sinon.stub(ocapiUtil.BatchBuilder.prototype, 'build').returns(null);

            var ocapiBuilder = new ocapiUtil.BatchBuilder();

            assert.throws(() => {
                ocapiBuilder.execute();
            }, /Missing parameters./, 'Should throw an exception');

            // Restore stubs
            buildStub.restore();
        });
    });
    describe('#ocapiRequestBuilder', () => {
        it('should add the request properly for GET request', () => {
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            // Set up test data
            const reqId = 'reqId';
            const ocapiEndpoint = {
                type: 'type',
                api: 'api',
                method: 'GET',
                siteSpecific: true,
                supportsPagination: true
            };
            const parameters = ['param1', 'param2'];
            const pageSize = 10;
            const pageNumber = 1;
            const selectedAttrs = ['attr3', 'attr4'];
            const sorts = ['sort1', 'sort2'];
            const query = 'query';
            const body = 'body';


            const reqBuilder = new ocapiUtil.RequestBuilder();
            reqBuilder.setRequestId(reqId);
            reqBuilder.setOcapi(ocapiEndpoint);
            reqBuilder.addParameters(parameters);
            reqBuilder.setPageSize(pageSize);
            reqBuilder.setPageNumber(pageNumber);
            reqBuilder.expandToMoreAttributes('attr1', 'attr2');
            reqBuilder.selectOnlySpecificAttributes('search', selectedAttrs);
            reqBuilder.sortBy(sorts);
            reqBuilder.setQuery(query);
            reqBuilder.setBody(body);


            var result = reqBuilder.execute();
            assert.deepEqual(result, { data: { data: 'response_data' } });
        });

        it('should add the request properly for POST request', () => {
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            // Set up test data
            const reqId = 'reqId';
            const ocapiEndpoint = {
                type: 'type',
                api: 'api',
                method: 'POST',
                siteSpecific: true,
                supportsPagination: true
            };
            const parameters = ['param1', 'param2'];
            const pageSize = 10;
            const pageNumber = 1;
            const selectedAttrs = ['attr3', 'attr4'];
            const sorts = ['sort1', 'sort2'];
            const query = 'query';


            const reqBuilder = new ocapiUtil.RequestBuilder();
            reqBuilder.setRequestId(reqId);
            reqBuilder.setOcapi(ocapiEndpoint);
            reqBuilder.addParameters(parameters);
            reqBuilder.setPageSize(pageSize);
            reqBuilder.setPageNumber(pageNumber);
            reqBuilder.expandToMoreAttributes('attr1', 'attr2');
            reqBuilder.selectOnlySpecificAttributes('search', selectedAttrs);
            reqBuilder.sortBy(sorts);
            reqBuilder.setQuery(query);


            var result = reqBuilder.execute();
            assert.deepEqual(result, { data: { data: 'response_data' } });
        });

        it('should add the request properly with empty request', () => {
            const response = {
                ok: true,
                object: {
                    data: 'response_data'
                }
            };
            ocapiAuthService.call.returns(validAuthToken);
            ocapiService.call.returns(response);

            // Set up test data
            const reqId = 'reqId';
            const ocapiEndpoint = { };
            const pageSize = 10;
            const pageNumber = 1;
            const selectedAttrs = ['attr3', 'attr4'];
            const sorts = ['sort1', 'sort2'];
            const query = 'query';


            const reqBuilder = new ocapiUtil.RequestBuilder();
            reqBuilder.setRequestId(reqId);
            reqBuilder.setOcapi(ocapiEndpoint);
            reqBuilder.setPageSize(pageSize);
            reqBuilder.setPageNumber(pageNumber);
            reqBuilder.expandToMoreAttributes('attr1', 'attr2');
            reqBuilder.selectOnlySpecificAttributes('search', selectedAttrs);
            reqBuilder.sortBy(sorts);
            reqBuilder.setQuery(query);

            var result = reqBuilder.execute();
            assert.deepEqual(result, { data: { data: 'response_data' } });
        });

        it('should throw an error if required input parameters are missing', () => {
            // Stub the build function
            const buildStub = sinon.stub(ocapiUtil.RequestBuilder.prototype, 'build').returns(null);

            const reqBuilder = new ocapiUtil.RequestBuilder();

            assert.throws(() => {
                reqBuilder.execute();
            }, /Missing parameters./, 'Should throw an exception');

            // Restore stubs
            buildStub.restore();
        });

        it('should throw an exception if Null Endpoint.', () => {
            const reqBuilder = new ocapiUtil.RequestBuilder();

            assert.throws(() => {
                reqBuilder.build();
            }, /Invalid OCAPI Endpoint./, 'Should throw an exception');
        });

        it('Should throw an exception if null request parameters', () => {
            const reqBuilder = new ocapiUtil.RequestBuilder();
            assert.throws(() => {
                reqBuilder.setRequestId(null);
            }, /Invalid OCAPI RequestId./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setOcapi(null);
            }, /Invalid OCAPI Endpoint./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setBody(null);
            }, /Invalid body./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setQuery(null);
            }, /Invalid query./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.addParameters();
            }, /Invalid parameters./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.expandToMoreAttributes();
            }, /Invalid expand parameters./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.selectOnlySpecificAttributes(null, null);
            }, /Invalid select parameters./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.selectOnlySpecificAttributes(null, ['1', '2']);
            }, /Invalid select parameters./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setPageSize(null);
            }, /Invalid page size./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setOcapiType(null);
            }, /Invalid ocapi type./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.setPageNumber(null);
            }, /Invalid page number./, 'Should throw an exception');
            assert.throws(() => {
                reqBuilder.sortBy();
            }, /Invalid sort by parameters./, 'Should throw an exception');
        });
    });

    describe('#ocapiRequest', () => {
        it('should update the id field and return the instance when setting a valid request id', () => {
            const request = new OcapiRequest();
            const id = '12345';
            const result = request.setRequestId(id);
            assert.equal(result.id, id);
            assert.equal(result, request);
        });
        it('should raise an error when setting an empty request id', () => {
            const ocapiReq = new OcapiRequest();
            assert.throws(() => {
                ocapiReq.setRequestId(null);
            }, /Invalid request id./, 'Should throw an exception');
        });
        it('should raise an error when setting an empty ocapi endpoint url', () => {
            const ocapiReq = new OcapiRequest();
            assert.throws(() => {
                ocapiReq.setOcapiEndpointUrl(null);
            }, /Invalid endpoint./, 'Should throw an exception');
        });
        it('should raise an error when setting an empty http method', () => {
            const ocapiReq = new OcapiRequest();
            assert.throws(() => {
                ocapiReq.setHttpMethod(null);
            }, /Invalid http method./, 'Should throw an exception');
        });

        it('should raise an error when setting an empty header', () => {
            const ocapiReq = new OcapiRequest();
            assert.throws(() => {
                ocapiReq.setHeader(null);
            }, /Invalid header./, 'Should throw an exception');
        });

        it('should raise an error when setting an empty headers', () => {
            const ocapiReq = new OcapiRequest();
            assert.throws(() => {
                ocapiReq.setHeaders();
            }, /Invalid headers./, 'Should throw an exception');
        });
        it('should raise an error when setting an empty body', () => {
            const ocapiReq = new OcapiRequest();

            assert.throws(() => {
                ocapiReq.setBody(null);
            }, /Invalid body./, 'Should throw an exception');
        });
    });
    describe('#ocapiResponse', () => {
        it('should return successful response', () => {
            var data = { 'key': 'value' };
            var code = '200';
            var responseId = 1;
            var ocapiResponse = new OcapiResponse(data, code, responseId);
            var result = ocapiResponse.getObject();

            assert.equal(result, data);
        });
        it('should return null when response has empty data', () => {
            var data = {};
            var code = '404';
            var responseId = 1;
            var ocapiResponse = new OcapiResponse(data, code, responseId);
            var result = ocapiResponse.getObject();

            assert.isNull(result);
        });
        it('should return null when response code is 404', () => {
            var data = { fault: { type: 'NotFoundException', message: 'server error' } };
            var code = '404';
            var responseId = 1;
            var ocapiResponse = new OcapiResponse(data, code, responseId);

            var isOk = ocapiResponse.isOk();
            assert.isTrue(isOk);

            var result = ocapiResponse.getObject();
            assert.isNull(result);
        });
        it('should throw exception when code is null', () => {
            var ocapiResponse = new OcapiResponse();

            assert.throws(() => {
                ocapiResponse.setStatusCode(null);
            }, /Invalid status code./, 'Should throw an exception');
            assert.throws(() => {
                ocapiResponse.setResponseId(null);
            }, /Invalid response id./, 'Should throw an exception');
            assert.throws(() => {
                ocapiResponse.setData(null);
            }, /Invalid data./, 'Should throw an exception');
        });
    });
});
