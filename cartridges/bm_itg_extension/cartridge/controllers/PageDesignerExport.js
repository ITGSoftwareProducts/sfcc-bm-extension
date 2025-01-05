/* eslint-disable no-undef */
'use strict';

var URLUtils = require('dw/web/URLUtils');
var ISML = require('dw/template/ISML');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var constants = require('*/cartridge/scripts/helpers/constants');
var app = require('*/cartridge/scripts/util/app');
var pageDesignerExportHelper = require('~/cartridge/scripts/helpers/pageDesignerExportHelper');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var guard = require('~/cartridge/scripts/util/guard');

/**
 * Show export main page
 */
function start() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.content.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'content')
        },
        {
            htmlValue: Resource.msg('feature.title', 'pageDesignerExport', null)
        }
    ];
    try {
        var params = request.httpParameterMap;
        var errorMessage = params.errorMessage.value;
        var actionUrl = URLUtils.https('PageDesignerExport-ExportPages');
        var jobIds = [constants.PAGE_DESIGNER_EXPORT.JOB_ID];
        var executionListResult = jobServicesHelper.getRecentProcessList(jobIds, constants.PAGE_DESIGNER_EXPORT.RECENT_PROCESSES_NUMBER, true, 'xml', constants.PAGE_DESIGNER_EXPORT.IMPEX_PATH);
        if (executionListResult.success) {
            ISML.renderTemplate('pageDesignerExport/pageDesignerExportForm', {
                actionUrl: actionUrl,
                executionList: executionListResult.executionList,
                errorMessage: errorMessage,
                executionListData: {
                    exportDetailsURL: URLUtils.https('ExecutionList-GetExecutionDetails').toString(),
                    showDownloadFile: true,
                    downloadFileType: 'xml',
                    impexPath: constants.PAGE_DESIGNER_EXPORT.IMPEX_PATH,
                    maxProcessNumber: constants.PAGE_DESIGNER_EXPORT.RECENT_PROCESSES_NUMBER,
                    serviceType: Resource.msg('service.type', 'pageDesignerExport', null),
                    jobIds: jobIds
                },
                breadcrumbs: breadcrumbs
            });
        } else {
            Logger.error(Resource.msgf('render.page.error', 'error', null, executionListResult.errorMessage));
            ISML.renderTemplate('common/errorPage', {
                breadcrumbs: breadcrumbs,
                message: executionListResult.errorMessage,
                currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('PageDesignerExport-Start').toString(), request.httpQueryString)
            });
        }
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('PageDesignerExport-Start').toString(), request.httpQueryString)
        });
    }
}

/**
 * Export page designer pages
 */
function exportPages() {
    var jobExecutionItem = require('~/cartridge/models/jobExecutionItem');
    var exportForm = app.getRequestFormOrParams();
    var exportFileName = exportForm.exportFileName;
    var responseObj;
    var contentIds = !empty(exportForm.selectedContentIds) ? exportForm.selectedContentIds.split('\n') : '';
    var uniqueContentIds = [];

    // remove duplicate IDs
    for (var i = 0; i < contentIds.length; i++) {
        var contnetId = contentIds[i].trim();
        if (!empty(contnetId) && uniqueContentIds.indexOf(contnetId) < 0) {
            uniqueContentIds.push(contnetId);
        }
    }

    var jobResult = pageDesignerExportHelper.executePageDesignerExportJob(exportFileName, uniqueContentIds);
    if (jobResult instanceof jobExecutionItem) {
        var resultContext = {
            executionListData: {
                showDownloadFile: true,
                downloadFileType: 'xml',
                serviceType: Resource.msg('service.type', 'pageDesignerExport', null)
            },
            executionDetails: jobResult
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
    } else if (jobResult.data && jobResult.data.errorMessage) {
        responseObj = {
            success: false,
            serverErrors: [jobResult.data.errorMessage]
        };
    } else {
        responseObj = {
            success: false,
            serverErrors: [Resource.msg('error.technical', 'common', null)]
        };
    }
    responseUtil.renderJSON(responseObj);
}

/** Renders the landing page of "Page Designer Export" module.
 * @see module:controllers/PageDesignerExport~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Exports page designer pages.
 * @see module:controllers/PageDesignerExport~ExportPages */
exports.ExportPages = guard.ensure(['https', 'post', 'csrf'], exportPages);

