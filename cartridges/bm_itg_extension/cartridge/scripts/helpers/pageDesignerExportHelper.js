'use strict';

var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var constants = require('~/cartridge/scripts/helpers/constants');


/**
 * Execute Page Designer Export Job.
 * @param {string} exportFileName - ExecutionID.
 * @param {string} pageIds - ExecutionID.
 * @returns {Object} responseObj
 */
function executePageDesignerExportJob(exportFileName, pageIds) {
    var siteLibrary = ContentMgr.getSiteLibrary().getID();
    var siteId = Site.getCurrent().getID();
    var now = new Calendar();
    var formattedTime = StringUtils.formatCalendar(now, 'yyyyMMddHHmmss');
    var fileName = StringUtils.format('{0}_{1}', exportFileName.replace(/\.xml/g, ''), formattedTime);
    var jobParams = {
        SiteScope: JSON.stringify({ named_sites: [siteId] }),
        PageIds: JSON.stringify(pageIds),
        ExportFileName: fileName,
        LibraryId: siteLibrary,
        SiteLibraryId: siteLibrary,
        ExportFile: StringUtils.format(constants.PAGE_DESIGNER_EXPORT.EXPORT_PATH_URL, siteLibrary)
    };
    var jobExecution = jobServicesHelper.executeJob(constants.PAGE_DESIGNER_EXPORT.JOB_ID, jobParams, true, 'xml', constants.PAGE_DESIGNER_EXPORT.IMPEX_PATH);
    if (!jobExecution.error) {
        jobExecution.jobIds = [constants.PAGE_DESIGNER_EXPORT.JOB_ID];
    }
    return jobExecution;
}

module.exports = {
    executePageDesignerExportJob: executePageDesignerExportJob
};
