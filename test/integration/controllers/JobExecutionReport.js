'use strict';

var assert = require('chai').assert;
const sinon = require('sinon');
const StringUtils = require('../../mock/dw/util/StringUtils');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Resource = require('../../mock/dw/web/Resource');
const URLUtils = require('../../mock/dw/web/URLUtils');
const DW = require('../../mock/dw');
const ISML = require('../../mock/dw/template/ISML');
const Logger = require('../../mock/dw/system/Logger');
const { AppUtil } = require('../../mock/controllers');

const jobExecutionHelper = {
    getJobExecutionReport: sinon.stub(),
    getJobRatio: sinon.stub()
};

describe('JobExecutionReport', function () {
    var responseUtil = { renderJSON: sinon.stub() };
    var { Start: start,
        GetJobReport: getJobReport,
        GetJobRatio: getJobRatio
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/JobExecutionReport', {
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        'dw/template/ISML': ISML,
        'dw/system/System': DW.system.System,
        '~/cartridge/scripts/util/app': AppUtil,
        '~/cartridge/scripts/helpers/jobExecutionHelper': jobExecutionHelper,
        '~/cartridge/scripts/util/responseUtil': responseUtil,
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }
    });

    afterEach(function () {
        AppUtil.getRequestFormOrParams.reset();
        jobExecutionHelper.getJobRatio.reset();
        responseUtil.renderJSON.reset();
        sinon.restore();
    });

    describe('#start', function () {
        beforeEach(function () {
            global.dw = DW;
            sinon.stub(ISML, 'renderTemplate');
        });
        it('Should render the template with the correct parameters', function () {
            start();
            assert.isTrue(ISML.renderTemplate.calledOnce, 'ISML.renderTemplate should be called once');
            assert.isTrue(ISML.renderTemplate.calledWith('jobExecutionReport/jobExecutionLandingPage', {
                jobReportUrl: sinon.match.string,
                jobRatioUrl: sinon.match.string,
                breadcrumbs: sinon.match.array,
                instanceTimeZone: sinon.match.any
            }), 'ISML.renderTemplate should be called with correct data');
        });

        it('Should render errorPage template when error is thrown', function () {
            global.request = request;
           // ISML.renderTemplate.throws(new Error('Error'));
            DW.system.System.getInstanceTimeZone = sinon.stub().throws(new Error('Error'));
            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
            DW.system.System.getInstanceTimeZone.reset();
        });
    });
    describe('#getJobReport', function () {
        it('should render JSON response with mock data when isMockData is true', function () {
            AppUtil.getRequestFormOrParams.returns({
                startTime: '2023-12-13T16:04:00.954Z',
                endTime: '2023-12-13T16:08:00.954Z',
                startIndex: 0,
                lastFourHours: true
            });

            jobExecutionHelper.getJobExecutionReport.returns({});
            getJobReport();
            assert.isTrue(responseUtil.renderJSON.calledOnce, 'responseUtil.renderJSON should be called once');
            assert.isTrue(responseUtil.renderJSON.calledWith({}), 'responseUtil.renderJSON should be called with correct data');
        });
    });
    describe('#getJobRatio', function () {
        it('should render JSON response with success when jobRatio is less than or equal to 0.2', function () {
            AppUtil.getRequestFormOrParams.returns({ ratioDate: '2024-01-22' });
            jobExecutionHelper.getJobRatio.returns(0.1);
            getJobRatio();

            assert.isTrue(responseUtil.renderJSON.calledOnce, 'responseUtil.renderJSON should be called once');
            assert.isTrue(responseUtil.renderJSON.calledWith(0.1), 'responseUtil.renderJSON should be called with correct data');
        });

        it('should render JSON response with warning when jobRatio is greater than 0.2', function () {
            AppUtil.getRequestFormOrParams.returns({ ratioDate: '2024-01-22' });
            jobExecutionHelper.getJobRatio.returns(0.3);
            getJobRatio();

            assert.isTrue(responseUtil.renderJSON.calledOnce, 'responseUtil.renderJSON should be called once');
            assert.isTrue(responseUtil.renderJSON.calledWith(0.3), 'responseUtil.renderJSON should be called with correct data');
        });
    });
});
