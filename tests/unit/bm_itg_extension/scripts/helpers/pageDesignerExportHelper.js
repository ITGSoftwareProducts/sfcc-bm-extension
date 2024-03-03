/* eslint-disable no-unused-vars */
var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Site = require('../../../../mock/dw/system/Site');
var StringUtils = require('../../../../mock/dw/util/StringUtils');
var ContentMgr = require('../../../../mock/dw/content/ContentMgr');

describe('PageDesignerExportHelper', function () {
    let jobServicesHelperStub = {
        executeJob: sinon.stub()
    };
    let constantsStub = {
        PAGE_DESIGNER_EXPORT: {
            JOB_ID: 'BM Extension - Page Designer Export',
            RECENT_PROCESSES_NUMBER: 5,
            IMPEX_PATH: '{0}/src/bm-extension/PDPageExport/{1}/Output/',
            EXPORT_PATH_URL: '/bm-extension/PDPageExport/{0}',
            HASH_MAP_MAX_SIZE: 11999
        }
    };
    const pageDesignerExportHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/pageDesignerExportHelper', {
        'dw/system/Site': Site,
        'dw/util/StringUtils': StringUtils,
        'dw/util/Calendar': sinon.stub(),
        'dw/content/ContentMgr': ContentMgr,
        '~/cartridge/scripts/helpers/constants': constantsStub,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelperStub
    });
    describe('#executePageDesignerExportJob', function () {
        it('should execute successfully with valid input parameters', () => {
            jobServicesHelperStub.executeJob.returns({ error: null, jobIds: [constantsStub.PAGE_DESIGNER_EXPORT.JOB_ID] });

            const result = pageDesignerExportHelper.executePageDesignerExportJob('exportFileName.xml', ['pageId1', 'pageId2']);

            assert.deepEqual(result, { error: null, jobIds: [constantsStub.PAGE_DESIGNER_EXPORT.JOB_ID] });
            assert.strictEqual(jobServicesHelperStub.executeJob.calledOnce, true);
        });
        it('should return an error if the job execution fails', () => {
            jobServicesHelperStub.executeJob.returns({ error: 'Job execution failed' });

            const result = pageDesignerExportHelper.executePageDesignerExportJob('exportFileName.xml', ['pageId1', 'pageId2']);
            assert.deepEqual(result, { error: 'Job execution failed' });
        });
    });
});
