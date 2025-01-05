
'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const OCAPI = require('../../mock/util/OCAPI');
const StringUtils = require('../../mock/dw/util/StringUtils');
const Site = require('../../mock/dw/system/Site');
const Calendar = require('../../mock/dw/util/Calendar');
const Resource = require('../../mock/dw/web/Resource');
const Logger = require('../../mock/dw/system/Logger');
const Response = require('../../mock/util/Response');
const URLUtils = require('../../mock/dw/web/URLUtils');
const DW = require('../../mock/dw');
const ISML = require('../../mock/dw/template/ISML');
const PaginationModel = require('../../mock/models/paginationModel');
const {
    jobExecutionSearchResponseMock,
    searchJobResponseMock,
    AppUtil,
    executeJobResponseMock,
    RenderTemplateHelper
} = require('../../mock/controllers');

let RequestBuilderStub = sinon.stub();
let BatchBuilderStub = sinon.stub();
var ismlRender;
var resRenderJsonSpy;
var getRenderHtmlSpy;

const couponReplicatorHelperMock = {
    getCouponList: sinon.stub(),
    getCouponReplicationData: sinon.stub(),
    runCouponReplicatorJob: sinon.stub()
};

var constants = {
    COUPON_REPLICATOR: {
        FIRST_JOB_ID: 'firstJobId',
        SECOND_JOB_ID: 'secondJobId',
        IMPEX_PATH: '/path/to/impex/',
        RECENT_PROCESSES_NUMBER: 5
    },
    GLOBAL: {
        EXECUTION_LIST: {
            FILES_MAP: {
                'BM Extension - Coupon Replicator: Producer': 'CouponId'
            }
        }
    },
    CSV_IMPORT_EXPORT: {
        JOB_ID: 'JOB_ID'
    }
};

describe('CouponReplicator', function () {
    const ocapiServiceHelper = proxyquire('../../../cartridges/bm_itg_extension/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper', {
        'dw/system/Logger': Logger,
        'dw/web/Resource': Resource
    });

    const dateUtil = proxyquire('../../../cartridges/bm_itg_extension/cartridge/scripts/util/dateUtil.js', {
        'dw/system/Site': Site,
        'dw/system/System': DW.system.System,
        'dw/util/StringUtils': StringUtils
    });

    const JobExecutionItem = proxyquire('../../../cartridges/bm_itg_extension/cartridge/models/jobExecutionItem', {
        'dw/util/StringUtils': StringUtils,
        'dw/util/Calendar': Calendar,
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        '~/cartridge/scripts/helpers/constants': constants,
        '~/cartridge/scripts/util/dateUtil': dateUtil
    });

    var jobServicesHelper = proxyquire('../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/jobServicesHelper', {
        'dw/util/Calendar': sinon.stub(),
        'dw/util/StringUtils': StringUtils,
        'dw/customer/ProductList': {},
        '~/cartridge/models/jobExecutionItem': JobExecutionItem,
        '~/cartridge/scripts/helpers/constants': constants,
        '~/cartridge/scripts/util/ocapi': OCAPI,
        '~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper': ocapiServiceHelper
    });

    var responseUtil = require('../../../cartridges/bm_itg_extension/cartridge/scripts/util/responseUtil');

    var { Start: start,
          GetCouponList: getCouponList,
          RunReplicationJob: runReplicationJob,
          ReplicationPage: replicationPage
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/CouponReplicator', {
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        'dw/template/ISML': ISML,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelper,
        '*/cartridge/scripts/helpers/constants': constants,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '*/cartridge/scripts/util/app': AppUtil,
        '*/cartridge/scripts/helpers/couponReplicatorHelper': couponReplicatorHelperMock,
        '*/cartridge/scripts/util/responseUtil': responseUtil,
        '*/cartridge/models/paginationModel': PaginationModel,
        'dw/system/Logger': Logger,
        '~/cartridge/models/jobExecutionItem': JobExecutionItem,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }

    });

    before(() => {
        sinon.replace(OCAPI.RequestBuilder.prototype, 'execute', RequestBuilderStub);
        sinon.replace(OCAPI.BatchBuilder.prototype, 'execute', BatchBuilderStub);
    });

    after(() => {
        sinon.restore();
    });

    beforeEach(function () {
        global.empty = function (value) { return value == null || value === ''; };
        global.response = Response;
        global.dw = DW;
        resRenderJsonSpy = sinon.spy(responseUtil, 'renderJSON');
        getRenderHtmlSpy = sinon.spy(RenderTemplateHelper, 'getRenderedHtml');
        ismlRender = sinon.spy(ISML, 'renderTemplate');
    });

    afterEach(function () {
        // Cleanup after each test
        resRenderJsonSpy.restore();
        getRenderHtmlSpy.restore();
        ismlRender.restore();
    });

    describe('#start', function () {
        it('start function should render the template with the correct parameters', function () {
            // Mock data
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            var mockedActionUrl = URLUtils.url('CouponReplicator-GetCouponList').toString();
            RequestBuilderStub.returns(searchJobResponseMock);
            BatchBuilderStub.returns(jobExecutionSearchResponseMock);

            start();

            assert.include(mockedActionUrl, 'CouponReplicator-GetCouponList', 'URLUtilsMock.url should include "CouponReplicator-GetCouponList"');
            assert.include(Resource.msg('test'), 'test', 'Resource.msg should include "test"');
            assert.isTrue(ismlRender.calledOnce);
            assert.isTrue(ismlRender.calledWith('couponReplicator/couponReplicator', {
                actionUrl: sinon.match.string,
                executionList: sinon.match.array,
                executionListData: {
                    exportDetailsURL: sinon.match.string,
                    maxProcessNumber: sinon.match.number,
                    serviceType: sinon.match.string,
                    jobIds: sinon.match.array
                },
                breadcrumbs: sinon.match.array
            }));
        });

        it('start function should render errorPage template with errorMessage', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            RequestBuilderStub.returns({ error: true, data: { errorMessage: 'ERROR MESSAGE' } });

            start();

            assert.isTrue(ismlRender.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
        });

        it('start function should render errorPage template empty errorMessage', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            RequestBuilderStub.returns({ error: true, data: { } });

            start();

            assert.isTrue(ismlRender.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: undefined,
                currentUrl: sinon.match.string
            }));
        });


        it('start function should render errorPage template when error is thrown', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            RequestBuilderStub.throws(new Error('ERROR MESSAGE'));

            start();

            assert.isTrue(ismlRender.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
        });
    });


    describe('#getCouponList', function () {
        it('should handle successful coupon list retrieval', () => {
            // Setup
            couponReplicatorHelperMock.getCouponList.returns({
                error: false,
                data: {
                    hits: [/* mocked coupon data */],
                    total: 1
                }
            });
            AppUtil.getRequestFormOrParams.returns({ couponSearchTerm: 'test', pageSize: 10, pageNumber: 1, sortBy: 'test', sortRule: 'test' });
            // Invoke the function to be tested
            getCouponList();

            var resultContext = {
                actionUrl: sinon.match.string,
                couponList: sinon.match.array,
                paginationModel: new PaginationModel(),
                couponId: sinon.match.string,
                sortRule: sinon.match.string,
                sortBy: sinon.match.string,
                totalCount: sinon.match.number
            };
            var resultTemplate = 'couponReplicator/couponsSearchResults';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });

        it('should retrieve coupon list with valid search term, page size, page number, sort by and sort rule', () => {
            const couponSearchForm = {
                couponSearchTerm: 'valid search term',
                pageSize: '10',
                pageNumber: '1',
                sortBy: 'valid sort by',
                sortRule: 'valid sort rule'
            };

            const couponListResult = {
                error: false,
                data: {
                    hits: ['coupon1', 'coupon2'],
                    total: 2
                }
            };
            AppUtil.getRequestFormOrParams.returns(couponSearchForm);
            couponReplicatorHelperMock.getCouponList.returns(couponListResult);


            getCouponList();

            var resultContext = {
                actionUrl: 'CouponReplicator-ReplicationPage',
                couponList: ['coupon1', 'coupon2'],
                paginationModel: new PaginationModel(),
                couponId: 'valid search term',
                sortRule: 'valid sort rule',
                sortBy: 'valid sort by',
                totalCount: 2
            };
            var resultTemplate = 'couponReplicator/couponsSearchResults';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });


        it('should retrieve coupon list with invalid search term', () => {
            const couponSearchForm = {};
            const couponListResult = {
                error: true,
                data: {
                    errorMessage: 'error'
                }
            };
            AppUtil.getRequestFormOrParams.returns(couponSearchForm);
            couponReplicatorHelperMock.getCouponList.returns(couponListResult);


            getCouponList();


            assert.isFalse(getRenderHtmlSpy.called);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: false,
                serverErrors: sinon.match.array
            }));
        });

        it('should retrieve coupon list with invalid search term', () => {
            const couponSearchForm = {};
            const couponListResult = { error: true };
            AppUtil.getRequestFormOrParams.returns(couponSearchForm);
            couponReplicatorHelperMock.getCouponList.returns(couponListResult);


            getCouponList();


            assert.isFalse(getRenderHtmlSpy.called);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: false,
                serverErrors: sinon.match.array
            }));
        });
    });


    describe('#ReplicationPage', function () {
        it('should initiate successful replication and return JSON response with \'success\' and \'renderedTemplate\' fields when all required parameters are present', () => {
            const params = {
                coupon_id: 'couponId',
                case_insensitive: true,
                multiple_codes_per_basket: true,
                description: 'couponDescription',
                type: 'couponType'
            };

            const replicationData = {
                availableSites: ['site1', 'site2']
            };

            AppUtil.getRequestFormOrParams.returns(params);
            couponReplicatorHelperMock.getCouponReplicationData.returns(replicationData);

            const resultTemplate = 'couponReplicator/replicationPage';
            const resultContext = {
                actionUrl: 'CouponReplicator-RunReplicationJob',
                availableSites: replicationData.availableSites,
                couponId: params.coupon_id,
                couponDescription: params.description,
                availableSitesCount: replicationData.availableSites.length,
                caseInsensitive: params.case_insensitive,
                multipleCodesPerBasket: params.multiple_codes_per_basket,
                couponType: params.type
            };
            const responseObj = {
                success: true,
                renderedTemplate: sinon.match.string
            };


            replicationPage();

            assert.isTrue(getRenderHtmlSpy.called);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith(responseObj));
        });
        it('should return error message when the replication process fails', () => {
            const params = {
                coupon_id: 'couponId',
                case_insensitive: true,
                multiple_codes_per_basket: true,
                type: 'couponType'
            };

            const replicationData = {
                error: true,
                data: { errorMessage: 'ERROR MESSAGE' }
            };

            AppUtil.getRequestFormOrParams.returns(params);
            couponReplicatorHelperMock.getCouponReplicationData.returns(replicationData);


            const responseObj = {
                success: false,
                serverErrors: [replicationData.data.errorMessage]
            };

            replicationPage();

            assert.isFalse(getRenderHtmlSpy.called);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith(responseObj));
        });

        it('should return server errors when the replication process fails', () => {
            const params = {
                coupon_id: 'couponId',
                case_insensitive: true,
                multiple_codes_per_basket: true,
                type: 'couponType'
            };

            const replicationData = { error: true };

            AppUtil.getRequestFormOrParams.returns(params);
            couponReplicatorHelperMock.getCouponReplicationData.returns(replicationData);


            const responseObj = {
                success: false,
                serverErrors: [sinon.match.string]
            };

            replicationPage();

            assert.isFalse(getRenderHtmlSpy.called);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith(responseObj));
        });
    });

    describe('#RunReplicationJob', function () {
        var params;
        var executionJobParams;
        this.beforeEach(() => {
            params = {
                couponId: 'couponId',
                caseInsensitive: true,
                multipleCodesPerBasket: true,
                description: 'couponDescription',
                couponType: 'couponType',
                siteIdsArray: JSON.stringify(['site1', 'site2'])
            };


            var currentSiteID = '1001';
            executionJobParams = {
                ReplicatedCouponId: params.couponId,
                SiteID: currentSiteID,
                CouponId: params.couponId,
                CaseInsensitive: params.caseInsensitive + '',
                CouponCodeType: params.couponType,
                MultipleCodesPerBasket: params.multipleCodesPerBasket + '',
                SiteScope: JSON.stringify({ named_sites: [currentSiteID] }),
                SitesScope: JSON.stringify({ named_sites: JSON.parse(params.siteIdsArray) }),
                ExportFileName: 'impex/site/coupon_codes'
            };
        });
        it('should execute replication job successfully', () => {
            AppUtil.getRequestFormOrParams.returns(params);

            RequestBuilderStub.returns(executeJobResponseMock);

            var jobExecution = jobServicesHelper.executeJob('BM Extension - Coupon Replicator: Producer', executionJobParams);
            couponReplicatorHelperMock.runCouponReplicatorJob.returns(jobExecution);

            runReplicationJob();

            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith({
                executionListData: {
                    serviceType: 'service.type'
                },
                executionDetails: jobExecution
            }, 'executionHistory/executionRow'));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: true, renderedTemplate: 'rendered html' }));
        });

        it('should return server errors when the replication job fails', () => {
            AppUtil.getRequestFormOrParams.returns(params);

            RequestBuilderStub.returns({ error: true, data: { errorMessage: 'ERROR MESSAGE' } });

            var jobExecution = jobServicesHelper.executeJob('BM Extension - Coupon Replicator: Producer', executionJobParams);
            couponReplicatorHelperMock.runCouponReplicatorJob.returns(jobExecution);

            runReplicationJob();

            assert.isFalse(getRenderHtmlSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: false, serverErrors: ['ERROR MESSAGE'] }));
        });
        it('should return technical errors when the replication job fails without server error', () => {
            AppUtil.getRequestFormOrParams.returns(params);

            RequestBuilderStub.returns({ error: true });

            var jobExecution = jobServicesHelper.executeJob('BM Extension - Coupon Replicator: Producer', executionJobParams);
            couponReplicatorHelperMock.runCouponReplicatorJob.returns(jobExecution);

            runReplicationJob();

            assert.isFalse(getRenderHtmlSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: false, serverErrors: ['error.technical'] }));
        });
    });
});
