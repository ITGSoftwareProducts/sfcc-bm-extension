'use strict';
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var Resource = require('dw/web/Resource');
var System = require('dw/system/System');
let duration = 0;


/**
 * Retrieves a report of job executions within a specified time range, including details such as job ID,
 * start time, end time, duration, and status.
 *
 * @param {Date} startTime - The start date of the time range for job executions.
 * @param {Date} endTime - The end date of the time range for job executions.
 * @param {number} pageNumber - The index of the starting record for pagination.
 * @param {boolen} isLastFourHours - Falg to indecate if we selecte that last 4 hours
 * @returns {Object} - A map containing job execution details organized by job ID, with additional metadata
 *                  such as the beginDate and lastDate of the report.
 */
function getJobExecutionReport(startTime, endTime, pageNumber, isLastFourHours) {
    var jobExecutionList;
    var allData = true;
    var start;
    var end;
    var result = {
        total: 0,
        responseMessage: Resource.msg('job.execution.no.executions.found.message', 'jobExecutionReport', null)
    };
    if (isLastFourHours === 'true') {
        var currentTime = new Date();
        var fourHoursAgo = new Date();
        fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
        start = fourHoursAgo;
        end = currentTime;
        jobExecutionList = jobServicesHelper.getAllJobsExecutions(fourHoursAgo, currentTime, pageNumber);
    } else {
        jobExecutionList = jobServicesHelper.getAllJobsExecutions(startTime, endTime, pageNumber);
        start = startTime;
        end = endTime;
    }
    if (jobExecutionList.error) {
        result = jobExecutionList;
    } else {
        var jobExecutionMap = {};
        var data = jobExecutionList.data;
        if (data.hits) {
            data.hits.forEach(function (job) {
                var jobRecord = jobExecutionMap[job.job_id];
                if (empty(jobRecord)) {
                    jobExecutionMap[job.job_id] = [(job)];
                } else {
                    jobRecord.push(job);
                }
            });
            var page = (data.start / data.count);
            page = data.start === 0 ? page += 1 : page;
            if ((page * data.count) < data.total) {
                allData = false;
            }
            result = {
                timeZone: System.getInstanceTimeZone(),
                jobExecutionObj: jobExecutionMap,
                allData: allData,
                count: data.count,
                start: data.start,
                total: data.total
            };
        }

        result.startTime = start;
        result.endTime = end;
    }

    return result;
}

/**
 * Calculates the ratio of cumulative job execution duration to the total time duration within a specified time range.
 *
 * @param {Date} startTime - The start date of the time range for job executions.
 * @param {Date} endTime - The end date of the time range for job executions.
 * @param {number} pageNumber - The index of the starting record for pagination.
 * @returns {number} - The calculated ratio of cumulative job execution duration to the total time duration.
 */
function getJobRatio(startTime, endTime, pageNumber) {
    var result = {
        success: false
    };
    var jobExecutionList = jobServicesHelper.getAllJobsExecutions(startTime, endTime, pageNumber);
    if (jobExecutionList.error && jobExecutionList.data && jobExecutionList.data.errorMessage) {
        return jobExecutionList;
    }
    var ratio = 0;
    if (jobExecutionList.data.hits) {
        jobExecutionList.data.hits.forEach(function (job) {
            duration += job.duration;
        });

        if (jobExecutionList.data.total > jobExecutionList.data.start) {
            getJobExecutionReport(startTime, endTime, jobExecutionList.data.start + jobExecutionList.data.count);
        }
        ratio = duration / (24 * 60 * 60 * 1000);
        var jobRatio = ratio.toFixed(3);
        result = {
            success: true,
            jobRatio: jobRatio,
            warning: jobRatio > 0.2
        };
    }
    return result;
}

module.exports = {
    getJobExecutionReport: getJobExecutionReport,
    getJobRatio: getJobRatio
};
