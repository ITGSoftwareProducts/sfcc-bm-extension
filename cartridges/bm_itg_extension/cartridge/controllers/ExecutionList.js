'use strict';

/**
 * @namespace ExecutionList
 */

var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var Resource = require('dw/web/Resource');
var app = require('*/cartridge/scripts/util/app');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var commonHelper = require('~/cartridge/scripts/helpers/commonFileHelper');
var File = require('dw/io/File');
var guard = require('~/cartridge/scripts/util/guard');


/**
 * Exports page details based on the specified job and execution IDs.
 */
function getExecutionDetails() {
    var params = app.getRequestFormOrParams();
    var executionId = params.executionId;
    var jobIds = params.jobIds;
    if (typeof jobIds === 'string') {
        jobIds = [jobIds];
    }
    var serviceType = params.serviceType;
    var downloadExportedFile = params.downloadExportFile;
    var downloadFileType = params.downloadFileType;
    var impexPath = params.impexPath;

    var responseObj = {
        success: false,
        serverErrors: [Resource.msg('error.technical', 'common', null)]
    };

    if (!empty(jobIds) && !empty(executionId) && !empty(serviceType)) {
        var jobResponse = jobServicesHelper.getJobExecutionDetails(jobIds, executionId, downloadExportedFile, downloadFileType, impexPath);
        if (jobResponse && !jobResponse.error) {
            var resultContext = {
                serviceType: serviceType,
                executionDetails: jobResponse
            };
            var resultTemplate = 'executionHistory/executionRow';
            var renderedTemplate = renderTemplateHelper.getRenderedHtml(
                resultContext,
                resultTemplate
            );
            responseObj = {
                success: true,
                renderedTemplate: renderedTemplate
            };
        } else if (jobResponse && jobResponse.data && jobResponse.data.errorMessage) {
            responseObj = {
                success: false,
                serverErrors: [jobResponse.data.errorMessage]
            };
        }
    }

    responseUtil.renderJSON(responseObj);
}

function downloadExportFile() {
    var params = app.getRequestFormOrParams();
    var exportFileName = params.exportFileName;
    var exportFileType = params.exportFileType;
    var impexPath = params.impexPath;
    var siteScope = Site.getCurrent().ID;

    if (params.siteScope && !empty(params.siteScope)) {
        siteScope = params.siteScope;
    }

    impexPath = StringUtils.format(impexPath, File.IMPEX, siteScope);
    commonHelper.downloadFile(impexPath, exportFileName, exportFileType);
    return;
}

/** Gets execution details.
 * @see module:controllers/ExecutionList~GetExecutionDetails */
exports.GetExecutionDetails = guard.ensure(['https', 'get', 'csrf'], getExecutionDetails);
/** Downloads the exported file of a specific execution.
 * @see module:controllers/ExecutionList~DownloadExportFile */
exports.DownloadExportFile = guard.ensure(['https', 'get', 'csrf'], downloadExportFile);
