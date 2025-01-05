'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const OCAPI = require('../../mock/util/OCAPI');
const StringUtils = require('../../mock/dw/util/StringUtils');
const Resource = require('../../mock/dw/web/Resource');
const Site = require('../../mock/dw/system/Site');
const Logger = require('../../mock/dw/system/Logger');
const Response = require('../../mock/util/Response');
const URLUtils = require('../../mock/dw/web/URLUtils');
const DW = require('../../mock/dw');
const File = require('../../mock/dw/io/File');
const ISMLMock = require('../../mock/dw/template/ISML');
const Calendar = require('../../mock/dw/util/Calendar');

const {
    AppUtil,
    executeJobResponseMock,
    RenderTemplateHelper
} = require('../../mock/controllers');

let RequestBuilderStub = sinon.stub();
let BatchBuilderStub = sinon.stub();
var ismlRender;
var resRenderJsonSpy;
var getRenderHtmlSpy;

var constants = {
    COUPON_REPLICATOR: {
        FIRST_JOB_ID: 'firstJobId',
        SECOND_JOB_ID: 'secondJobId',
        IMPEX_PATH: '/path/to/impex/'
    },
    GLOBAL: {
        EXECUTION_LIST: {
            FILES_MAP: {
                'export_coupon': 'CouponId'
            }
        }
    },
    CSV_IMPORT_EXPORT: {
        JOB_ID: 'JOB_ID'
    }
};
const commonFileHelper = {
    downloadFile: sinon.stub()
};
describe('ExecutionList', function () {
    var responseUtil = require('../../../cartridges/bm_itg_extension/cartridge/scripts/util/responseUtil');

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
        '~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper.js': ocapiServiceHelper
    });
    var { GetExecutionDetails: getExecutionDetails,
        DownloadExportFile: downloadExportFile
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/ExecutionList', {
        'dw/web/Resource': Resource,
        'dw/web/URLUtils': URLUtils,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Site': Site,
        'dw/io/File': File,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelper,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '*/cartridge/scripts/util/app': AppUtil,
        '*/cartridge/scripts/util/responseUtil': responseUtil,
        '~/cartridge/scripts/helpers/commonFileHelper': commonFileHelper,
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
        ismlRender = sinon.spy(ISMLMock, 'renderTemplate');
    });

    afterEach(function () {
        // Cleanup after each test
        resRenderJsonSpy.restore();
        getRenderHtmlSpy.restore();
        ismlRender.restore();
    });

    describe('#GetExecutionDetails', function () {
        it('should render HTML and render JSON with success when valid parameters are provided', function () {
            var requestFormOrParams = {
                executionId: '123',
                jobIds: ['456', '789'],
                serviceType: 'someType',
                downloadExportFile: false,
                downloadFileType: 'csv',
                impexPath: 'path/to/impex/%s_%s'
            };
            AppUtil.getRequestFormOrParams.returns(requestFormOrParams);
            RequestBuilderStub.returns(executeJobResponseMock);

            getExecutionDetails();

            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith({
                executionListData: {
                    serviceType: 'someType'
                },
                executionDetails: sinon.match.any
            }, 'executionHistory/executionRow'));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: true, renderedTemplate: sinon.match.string }));
        });

        it('should not render HTML and render JSON with error message when jobServicesHelper returns null/undefined', function () {
            var requestFormOrParams = {
                executionId: '123',
                jobIds: '456',
                serviceType: 'someType',
                downloadExportFile: false,
                downloadFileType: 'csv',
                impexPath: 'path/to/impex/%s_%s'
            };
            const couponListResult = {
                error: true,
                data: {
                    errorMessage: 'error'
                }
            };
            AppUtil.getRequestFormOrParams.returns(requestFormOrParams);
            RequestBuilderStub.returns(couponListResult);

            getExecutionDetails();

            assert.isFalse(getRenderHtmlSpy.called);
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: false, serverErrors: [sinon.match.string] }));
        });

        it('should render HTML and render JSON with success when empty execution status parameters are provided', function () {
            var requestFormOrParams = {
                executionId: '123',
                jobIds: ['456', '789'],
                serviceType: 'someType',
                downloadExportFile: false,
                downloadFileType: 'csv',
                impexPath: 'path/to/impex/%s_%s'
            };
            const couponListResult = {
                ok: true,
                data: {

                    id: '1',
                    job_id: 'job1',
                    execution_status: 'completed',
                    exit_status: { },
                    step_executions: [{
                        message: 'test',
                        job_id: 'job1',
                        execution_status: 'completed',
                        exit_status: { status: 'ok', message: '1' }

                    }],
                    end_time: '2022-06-10T16:00:00.000Z',
                    parameters: [
                        {
                            name: 'ProcessType',
                            value: 'test'
                        }
                    ]
                }
            };
            AppUtil.getRequestFormOrParams.returns(requestFormOrParams);
            RequestBuilderStub.returns(couponListResult);

            getExecutionDetails();

            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith({
                executionListData: {
                    serviceType: 'someType'
                },
                executionDetails: sinon.match.any
            }, 'executionHistory/executionRow'));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({ success: true, renderedTemplate: sinon.match.string }));
        });
    });
    describe('#DownloadExportFile', function () {
        it('should downloads the exported file of a specific execution.', function () {
            const siteStub = sinon.stub(Site.getCurrent(), 'ID').returns('mockedSiteID');
            sinon.stub(StringUtils, 'format');
            var requestFormOrParams = {
                exportFileName: 'file_name',
                exportFileType: 'csv',
                impexPath: 'path/to/impex/%s_%s'
            };
            AppUtil.getRequestFormOrParams.returns(requestFormOrParams);
            downloadExportFile();

            assert.isTrue(StringUtils.format.calledOnce);
            assert.isTrue(StringUtils.format.calledWith(requestFormOrParams.impexPath, File.IMPEX, Site.getCurrent().ID));
            assert.isTrue(commonFileHelper.downloadFile.calledOnce);
            assert.isTrue(commonFileHelper.downloadFile.calledWith(
                StringUtils.format(), requestFormOrParams.exportFileName, requestFormOrParams.exportFileType));

            siteStub.restore();
            StringUtils.format.restore();
        });
    });
});
