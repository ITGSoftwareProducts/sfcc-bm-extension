'use strict';

var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var dateUtil = require('~/cartridge/scripts/util/dateUtil');

/**
 * Get the execution duration
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {string} duration - Execution duration
 */
function getJobDuration(jobExecutionOcapiObj, otherConnectedExecutions) {
    var duration = jobExecutionOcapiObj.duration;
    if (!empty(otherConnectedExecutions)) {
        for (var i = 0; i < otherConnectedExecutions.length; i++) {
            duration += otherConnectedExecutions[i].duration;
        }
    }
    duration /= 1000;
    var hours = StringUtils.formatNumber(Math.floor(duration / 3600), '00');
    var minutes = StringUtils.formatNumber(Math.floor((duration - (hours * 3600)) / 60), '00');
    var seconds = StringUtils.formatNumber(Math.floor(duration - (hours * 3600) - (minutes * 60)), '00');
    duration = hours + ':' + minutes + ':' + seconds;
    return duration;
}

/**
 * Get the job configuration UUID for the given execution
 * @param {Object} jobExecutionOcapiObj - The current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {string} jobConfigurationUUID - The job configuration uuid
 */
function getJobConfigurationUUID(jobExecutionOcapiObj, otherConnectedExecutions) {
    var logFilePath = '';
    if (jobExecutionOcapiObj.status === 'OK' && !empty(otherConnectedExecutions)) {
        var finalExecution = otherConnectedExecutions[otherConnectedExecutions.length - 1];
        if (finalExecution) {
            logFilePath = otherConnectedExecutions[otherConnectedExecutions.length - 1].log_file_path;
        }
    }
    if (!logFilePath && jobExecutionOcapiObj.log_file_path) {
        logFilePath = jobExecutionOcapiObj.log_file_path;
    }
    return logFilePath.replace(/(.*Job-.*-)|(\.log)/g, '');
}

/**
 * Get the execution start time
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @returns {Date} processStartTime - Execution start time
 */
function getJobStartTime(jobExecutionOcapiObj) {
    var date = dateUtil.convertUTCToSiteTimezone(jobExecutionOcapiObj.start_time);
    var calendar = new Calendar(date);

    var executionDate = StringUtils.formatCalendar(calendar, request.locale, Calendar.INPUT_DATE_PATTERN);
    var executionTime = StringUtils.formatCalendar(calendar, request.locale, Calendar.TIME_PATTERN);

    var processStartTime = executionDate + ' ' + executionTime;
    return processStartTime;
}

/**
 * Get the execution end time
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {Date} processEndTime - Execution end time
 */
function getJobEndTime(jobExecutionOcapiObj, otherConnectedExecutions) {
    var process;
    if (!empty(otherConnectedExecutions) && otherConnectedExecutions.length > 0) {
        process = otherConnectedExecutions[otherConnectedExecutions.length - 1];
    } else {
        process = jobExecutionOcapiObj;
    }

    var date = dateUtil.convertUTCToSiteTimezone(process.end_time);
    var calendar = new Calendar(date);
    var executionDate = StringUtils.formatCalendar(calendar, request.locale, Calendar.INPUT_DATE_PATTERN);
    var executionTime = StringUtils.formatCalendar(calendar, request.locale, Calendar.TIME_PATTERN);

    return executionDate + ' ' + executionTime;
}

/**
 * Get the execution end time
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {string} - Job execution status
 */
function getJobExecutionStatus(jobExecutionOcapiObj, otherConnectedExecutions) {
    var executionStatus = jobExecutionOcapiObj.execution_status;
    if (executionStatus === 'finished' && !empty(otherConnectedExecutions)) {
        var finalExecution = otherConnectedExecutions[otherConnectedExecutions.length - 1];
        if (finalExecution) {
            executionStatus = otherConnectedExecutions[otherConnectedExecutions.length - 1].execution_status;
        }
    }
    return executionStatus;
}

/**
 * Get the execution status
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {string} - Process status
 */
function getStatus(jobExecutionOcapiObj, otherConnectedExecutions) {
    var status = jobExecutionOcapiObj.status;
    if (status === 'OK' && !empty(otherConnectedExecutions)) {
        var finalExecution = otherConnectedExecutions[otherConnectedExecutions.length - 1];
        if (finalExecution) {
            status = otherConnectedExecutions[otherConnectedExecutions.length - 1].status;
        }
    }
    return status;
}

/**
 * Get the execution end time
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Object} processNameJobParam - Job execution details retrieved by OCAPI
 * @param {string} fileName - File name if exists
 * @returns {Date} processEndTime - Execution end time
 */
function getExportFileOrProcessName(jobExecutionOcapiObj, processNameJobParam, fileName) {
    var exportFileOrProcessName;
    if (fileName) {
        exportFileOrProcessName = fileName;
    } else if (jobExecutionOcapiObj.parameters) {
        jobExecutionOcapiObj.parameters.forEach(function (param) {
            if (param.name === processNameJobParam) {
                exportFileOrProcessName = param.value;
            }
        });
    }
    return exportFileOrProcessName;
}

/**
 * Get the execution end time
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @returns {Array} jobIds - Execution end time
 */
function getJobsIds(jobExecutionOcapiObj, otherConnectedExecutions) {
    var jobIds = [jobExecutionOcapiObj.job_id];
    if (!empty(otherConnectedExecutions)) {
        for (var i = 0; i < otherConnectedExecutions.length; i++) {
            jobIds.push(otherConnectedExecutions[i].job_id);
        }
    }
    return jobIds;
}

/**
 * Get Export File name
 * @param {Object} jobExecutionOcapiObj - Current execution
 * @param {Object} options - Options
 * @returns {string} exportFileName - Export file name
 */
function getExportFileName(jobExecutionOcapiObj, options) {
    var exportFileName = '';
    if (options.showDownloadFile) {
        if (!empty(jobExecutionOcapiObj.parameters)) {
            jobExecutionOcapiObj.parameters.forEach(function (parameter) {
                if (parameter.name === options.processNameJobParam) {
                    exportFileName = parameter.value;
                }
            });
        }
    }
    return exportFileName;
}

/**
 * Get Site Scope
 * @param {Object} jobExecutionOcapiObj - current execution
 * @return {string} siteScope - Site Scope
 */
function getSiteScope(jobExecutionOcapiObj) {
    var siteScope = '';
    if (!empty(jobExecutionOcapiObj.parameters)) {
        jobExecutionOcapiObj.parameters.forEach(function (parameter) {
            if (parameter.name === 'SiteScope') {
                var siteScopeObj = JSON.parse(parameter.value);
                if (siteScopeObj.named_sites) {
                    var siteScopeArray = siteScopeObj.named_sites;
                    siteScopeArray.forEach(function (siteName) {
                        siteScope = siteName;
                    });
                }
            }
        });
    }
    return siteScope;
}

/**
 * @param {Object} jobExecutionOcapiObj - Initial job execution object
 * @param {Object} options - Job execution options
 * @param {Array|null} otherConnectedExecutions - Other execution items for the case multiple jobs are used
 * @constructor
 */
function jobExecutionItem(jobExecutionOcapiObj, options, otherConnectedExecutions) {
    this.jobId = jobExecutionOcapiObj.job_id;
    this.configurationUUID = getJobConfigurationUUID(jobExecutionOcapiObj, otherConnectedExecutions);
    this.executionStatus = getJobExecutionStatus(jobExecutionOcapiObj, otherConnectedExecutions);
    this.startTime = getJobStartTime(jobExecutionOcapiObj);
    this.endTime = getJobEndTime(jobExecutionOcapiObj, otherConnectedExecutions);
    this.duration = getJobDuration(jobExecutionOcapiObj, otherConnectedExecutions);
    this.status = getStatus(jobExecutionOcapiObj, otherConnectedExecutions);
    this.id = jobExecutionOcapiObj.id;
    this.exportFileName = getExportFileName(jobExecutionOcapiObj, options);
    this.logFileURL = URLUtils.https('ViewImpexMonitor-DownloadLogFile', 'JobConfigurationUUID', this.configurationUUID).toString();

    if (options) {
        if (options.processNameJobParam || options.fileOrProcessName) {
            var processName = getExportFileOrProcessName(jobExecutionOcapiObj, options.processNameJobParam, options.fileOrProcessName) || '';
            this.processName = processName;
            if (processName.indexOf('.csv') === -1 && processName.indexOf('.xml') === -1) {
                var extention = '.xml';
                this.processName = processName + extention;
            }
        }

        if (options.showDownloadFile) {
            var siteScope = getSiteScope(jobExecutionOcapiObj);
            this.exportURL = URLUtils.https('ExecutionList-DownloadExportFile', 'exportFileName', this.exportFileName, 'exportFileType', options.downloadFileType, 'impexPath', options.impexPath, 'siteScope', siteScope).toString();
        }
        if (!empty(options.processType) && !empty(options.impexType)) {
            this.processType = options.processType.value;
            this.showCsv = true;
            this.serviceTypeLabel = Resource.msgf('lable.' + options.impexType.value, 'common', null, this.processType);
        }
    }
    this.jobIds = getJobsIds(jobExecutionOcapiObj, otherConnectedExecutions);
    var timeStatusMessage;
    var otherJobsStatus = true;
    if (otherConnectedExecutions) {
        otherConnectedExecutions.forEach(function (item) {
            otherJobsStatus = otherJobsStatus && (item.status === 'OK');
        });
    }
    if (jobExecutionOcapiObj.status === 'OK' && otherJobsStatus) {
        timeStatusMessage = Resource.msgf('modal.time.status.section.success.message', 'common', null, getJobStartTime(jobExecutionOcapiObj), getJobEndTime(jobExecutionOcapiObj, otherConnectedExecutions));
    } else if (jobExecutionOcapiObj.status === 'PENDING') {
        timeStatusMessage = Resource.msg('modal.process.is.running', 'common', null);
    } else {
        timeStatusMessage = Resource.msgf('modal.time.status.section.error.message', 'common', null, getJobStartTime(jobExecutionOcapiObj), getJobEndTime(jobExecutionOcapiObj, otherConnectedExecutions));
    }
    this.timeStatusMessage = timeStatusMessage;
    var runningJobStatuses = ['pending', 'running', 'pausing', 'paused', 'resuming', 'resumed', 'restarting', 'restarted', 'retrying', 'retried', 'aborting'];
    this.isRunning = runningJobStatuses.indexOf(this.executionStatus) !== -1;
}

module.exports = jobExecutionItem;
