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
var URLUtils = require('dw/web/URLUtils');


/**
 * Exports page details based on the specified job and execution IDs.
 */
function getExecutionDetails() {
    var params = app.getRequestFormOrParams();
    var executionId = params.executionId;
    var jobIds = params.jobIds;
    if (typeof jobIds === 'string') {
        jobIds = [jobIds];
    } else {
        jobIds = jobIds instanceof Array ? jobIds : jobIds.toArray();
    }
    var serviceType = params.serviceType;
    var downloadExportedFile = params.downloadExportFile;
    var downloadFileType = params.downloadFileType;
    var impexPath = params.impexPath;
    var maxProcessNumber = params.maxProcessNumber && !isNaN(params.maxProcessNumber) ? parseInt(params.maxProcessNumber, 10) : null;

    var responseObj = {
        success: false,
        serverErrors: [Resource.msg('error.technical', 'common', null)]
    };

    var resultTemplate;
    var resultContext;
    var renderedTemplate;

    if (!empty(jobIds) && !empty(serviceType)) {
        if (!empty(executionId)) {
            var jobResponse = jobServicesHelper.getJobExecutionDetails(jobIds, executionId, downloadExportedFile, downloadFileType, impexPath);
            resultTemplate = 'executionHistory/executionRow';
            if (jobResponse && !jobResponse.error) {
                resultContext = {
                    executionListData: {
                        serviceType: serviceType
                    },
                    executionDetails: jobResponse
                };
                renderedTemplate = renderTemplateHelper.getRenderedHtml(
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
        } else if (!empty(maxProcessNumber)) {
            var executionListResult = jobServicesHelper.getRecentProcessList(jobIds, maxProcessNumber, downloadExportedFile, downloadFileType, impexPath);
            resultTemplate = 'executionHistory/executionList';
            if (executionListResult && executionListResult.success) {
                resultContext = {
                    executionList: executionListResult.executionList,
                    executionListData: {
                        exportDetailsURL: URLUtils.https('ExecutionList-GetExecutionDetails').toString(),
                        showDownloadFile: downloadExportedFile,
                        downloadFileType: downloadFileType,
                        impexPath: impexPath,
                        maxProcessNumber: maxProcessNumber,
                        serviceType: serviceType,
                        jobIds: jobIds
                    }
                };
                renderedTemplate = renderTemplateHelper.getRenderedHtml(
                    resultContext,
                    resultTemplate
                );
                responseObj = {
                    success: true,
                    renderedTemplate: renderedTemplate
                };
            } else if (executionListResult && executionListResult.errorMessage) {
                if (executionListResult.errorMessage) {
                    responseObj = {
                        success: false,
                        serverErrors: [executionListResult.errorMessage]
                    };
                } else {
                    responseObj = {
                        success: false,
                        serverErrors: Resource.msg('error.technical', 'common', null)
                    };
                }
            }
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
