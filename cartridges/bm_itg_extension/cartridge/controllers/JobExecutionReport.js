'use strict';

/**
 * @namespace JobExecutionReport
 */

var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var ISML = require('dw/template/ISML');
var jobExecutionHelper = require('~/cartridge/scripts/helpers/jobExecutionHelper');
var responseUtil = require('~/cartridge/scripts/util/responseUtil');
var app = require('~/cartridge/scripts/util/app');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var guard = require('~/cartridge/scripts/util/guard');
var System = require('dw/system/System');

/**
 * Show the main page
 */
function start() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.administration.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowAdministrationOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.operations.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'operations')
        },
        {
            htmlValue: Resource.msg('feature.title', 'jobExecutionReport', null)
        }
    ];
    try {
        var jobReportUrl = URLUtils.url('JobExecutionReport-GetJobReport');
        var jobRatioUrl = URLUtils.url('JobExecutionReport-GetJobRatio');
        ISML.renderTemplate('jobExecutionReport/jobExecutionLandingPage', {
            jobReportUrl: jobReportUrl,
            jobRatioUrl: jobRatioUrl,
            breadcrumbs: breadcrumbs,
            instanceTimeZone: System.getInstanceTimeZone()
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('JobExecutionReport-Start').toString(), request.httpQueryString)
        });
    }
}

/**
 * Get Job Report
 */
function getJobReport() {
    var params = app.getRequestFormOrParams();
    var startTime = params.startTime;
    var endTime = params.endTime;
    var startIndex = params.startIndex;
    var isLastFourHours = params.lastFourHours;
    var jobExecutionObj;
    jobExecutionObj = jobExecutionHelper.getJobExecutionReport(startTime, endTime, startIndex, isLastFourHours);

    responseUtil.renderJSON(jobExecutionObj);
}

/**
 * Get Job Ratio
 */
function getJobRatio() {
    var params = app.getRequestFormOrParams();
    var ratioDate = params.ratioDate;

    var startOfDay = new Date(ratioDate);

    var endOfDay = new Date(ratioDate);
    endOfDay.setDate(startOfDay.getDate() + 1);

    var result = jobExecutionHelper.getJobRatio(startOfDay, endOfDay, 0);

    responseUtil.renderJSON(result);
}

/** Renders the landing page of "Job Execution Report" module.
 * @see module:controllers/JobExecutionReport~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Gets the job report for a specific period.
 * @see module:controllers/JobExecutionReport~GetJobReport */
exports.GetJobReport = guard.ensure(['https', 'get', 'csrf'], getJobReport);
/** Gets a job Ratio for a specific date.
 * @see module:controllers/JobExecutionReport~GetJobRatio */
exports.GetJobRatio = guard.ensure(['https', 'get', 'csrf'], getJobRatio);
