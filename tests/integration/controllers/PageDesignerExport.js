'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const StringUtils = require('../../mock/dw/util/StringUtils');
const Resource = require('../../mock/dw/web/Resource');
const Logger = require('../../mock/dw/system/Logger');
const URLUtils = require('../../mock/dw/web/URLUtils');
const ISML = require('../../mock/dw/template/ISML');
const Site = require('../../mock/dw/system/Site');
const Calendar = require('../../mock/dw/util/Calendar');
const DW = require('../../mock/dw');
const {
    AppUtil,
    RenderTemplateHelper,
    executeJobResponseMock
} = require('../../mock/controllers');

const pageDesignerExportHelper = {
    executePageDesignerExportJob: sinon.stub()
};
const constants = {
    COUPON_REPLICATOR: {
        FIRST_JOB_ID: 'firstJobId',
        SECOND_JOB_ID: 'secondJobId',
        IMPEX_PATH: '/path/to/impex/'
    },
    PAGE_DESIGNER_EXPORT: {
        JOB_ID: 'BM Extension - Page Designer Export',
        RECENT_PROCESSES_NUMBER: 5,
        IMPEX_PATH: '{0}/src/bm-extension/PDPageExport/{1}/Output/',
        EXPORT_PATH_URL: '/bm-extension/PDPageExport/{0}',
        HASH_MAP_MAX_SIZE: 11999
    },
    GLOBAL: {
        EXECUTION_LIST: {
            FILES_MAP: {
                'BM Extension - Page Designer Export': 'ExportFileName'
            }
        }
    },
    CSV_IMPORT_EXPORT: {
        JOB_ID: 'JOB_ID'
    }
};

describe('PageDesignerExport', function () {
    const jobServicesHelper = { getRecentProcessList: sinon.stub() };

    var responseUtil = { renderJSON: sinon.stub() };

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

    var { Start: start,
        ExportPages: exportPages
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/PageDesignerExport', {
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        'dw/template/ISML': ISML,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelper,
        '*/cartridge/scripts/helpers/constants': constants,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '*/cartridge/scripts/util/app': AppUtil,
        '~/cartridge/scripts/helpers/pageDesignerExportHelper': pageDesignerExportHelper,
        '*/cartridge/scripts/util/responseUtil': responseUtil,
        '~/cartridge/models/jobExecutionItem': JobExecutionItem,
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }

    });

    beforeEach(function () {
        sinon.spy(RenderTemplateHelper, 'getRenderedHtml');
        sinon.spy(ISML, 'renderTemplate');
    });

    afterEach(function () {
        // Cleanup after each test
        responseUtil.renderJSON.reset();
        sinon.restore();
    });

    describe('#start', function () {
        it('start function should render the template with the correct parameters', function () {
            global.request = {
                httpParameterMap: {
                    errorMessage: { value: 'ERROR_MESSAGE' }
                }
            };
            jobServicesHelper.getRecentProcessList.returns({
                success: true,
                executionList: {
                    FILES_MAP: {}
                }
            });

            start();

            assert.isTrue(ISML.renderTemplate.calledOnce);
            assert.isTrue(ISML.renderTemplate.calledWith('pageDesignerExport/pageDesignerExportForm', {
                actionUrl: sinon.match.string,
                executionList: sinon.match.object,
                errorMessage: sinon.match.string,
                executionListData: {
                    exportDetailsURL: sinon.match.string,
                    showDownloadFile: sinon.match.bool,
                    downloadFileType: sinon.match.string,
                    impexPath: sinon.match.string,
                    maxProcessNumber: sinon.match.number,
                    serviceType: sinon.match.string,
                    jobIds: sinon.match.array
                },
                breadcrumbs: sinon.match.array
            }));
        });

        it('start function should render errorPage template with errorMessage', function () {
            global.request = {
                httpParameterMap: {
                    errorMessage: { value: 'ERROR_MESSAGE' }
                }
            };
            jobServicesHelper.getRecentProcessList.returns({
                success: false,
                errorMessage: 'ERROR MESSAGE'
            });

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
        });

        it('start function should render errorPage template when error is thrown', function () {
            global.request = {
                httpParameterMap: {
                    errorMessage: { value: 'ERROR_MESSAGE' }
                }
            };
            jobServicesHelper.getRecentProcessList.throws(new Error('ERROR MESSAGE'));

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
        });
    });

    describe('#exportPages', () => {
        it('should successfully export pages with valid input', () => {
            AppUtil.getRequestFormOrParams.returns({
                exportFileName: 'file_name',
                selectedContentIds: '1,2'
            });

            var options = {
                processNameJobParam: 'Export',
                showDownloadFile: true,
                downloadFileType: 'xml',
                impexPath: '',
                processType: { value: 'type' }
            };

            var jobExecution = new JobExecutionItem(executeJobResponseMock, options);
            pageDesignerExportHelper.executePageDesignerExportJob.returns(jobExecution);
            exportPages();

            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledOnce);
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith({
                executionListData: {
                    showDownloadFile: true,
                    downloadFileType: 'xml',
                    serviceType: sinon.match.string
                },
                executionDetails: sinon.match.object
            }, 'executionHistory/executionRow'));
            assert.isTrue(responseUtil.renderJSON.calledOnce);
            assert.isTrue(responseUtil.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
        });

        it('should return server errors when the replication job fails', () => {
            AppUtil.getRequestFormOrParams.returns({
                exportFileName: 'file_name',
                selectedContentIds: '1,2'
            });


            pageDesignerExportHelper.executePageDesignerExportJob.returns({ error: true, data: { errorMessage: 'ERROR MESSAGE' } });
            exportPages();
            assert.isFalse(RenderTemplateHelper.getRenderedHtml.calledOnce);
            assert.isTrue(responseUtil.renderJSON.calledOnce);
            assert.isTrue(responseUtil.renderJSON.calledWith({ success: false, serverErrors: ['ERROR MESSAGE'] }));
        });
        it('should return technical errors when the replication job fails without server error', () => {
            AppUtil.getRequestFormOrParams.returns({
                exportFileName: 'file_name',
                selectedContentIds: '1,2'
            });


            pageDesignerExportHelper.executePageDesignerExportJob.returns({ error: true, data: { } });
            exportPages();

            assert.isFalse(RenderTemplateHelper.getRenderedHtml.calledOnce);
            assert.isTrue(responseUtil.renderJSON.calledOnce);
            assert.isTrue(responseUtil.renderJSON.calledWith({ success: false, serverErrors: ['error.technical'] }));
        });
    });
});
