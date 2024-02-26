'use strict';

var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var JobExecutionItem = require('~/cartridge/models/jobExecutionItem');
var constants = require('~/cartridge/scripts/helpers/constants');
var ocapi = require('~/cartridge/scripts/util/ocapi');

/**
 * Creates a job execution using the Open Commerce API (OCAPI).
 * @param {string} jobId - The id of the job to be executed
 * @param {Object} jobParams - Job parameters
* @param {boolean} showDownloadFile - A flag indicating whether to show XML file for download in the job execution details.
 * @param {boolean} downloadFileType - A flag indicating whether to include XML data in the job execution details.
 * @param {string} impexPath - File location in IMPEX.
 * @returns {Object} - The response object containing information about the job execution.
 *
 */
function executeJob(jobId, jobParams, showDownloadFile, downloadFileType, impexPath) {
    var fileNameMap = constants.GLOBAL.EXECUTION_LIST.FILES_MAP;
    var parameters = [];
    Object.keys(jobParams).forEach(function (key) {
        if (jobParams[key]) {
            var keyValue = {
                name: key,
                value: jobParams[key]
            };
            parameters.push(keyValue);
        }
    });
    var paramBody = { parameters: parameters };
    var jobResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.EXECUTE_JOB)
        .addParameters(encodeURI(jobId))
        .setBody(paramBody)
        .execute();

    if (!jobResponse.error && jobResponse.data) {
        var options = {
            processNameJobParam: fileNameMap[jobId]
        };
        if (('ProcessType' in jobParams && jobParams.ProcessType === 'Import')) {
            options.processNameJobParam = 'ImportFileName';
        }
        if (('ProcessType' in jobParams && jobParams.ProcessType !== 'Import') || !('ProcessType' in jobParams)) {
            options.showDownloadFile = showDownloadFile;
            options.downloadFileType = downloadFileType;
            options.impexPath = impexPath;
        }
        if ('ProcessType' in jobParams && !empty(jobParams.ProcessType)) {
            options.processType = {
                value: jobParams.ProcessType
            };
            options.impexType = {
                value: jobParams.ImpexType
            };
        }
        return new JobExecutionItem(jobResponse.data, options);
    }

    return jobResponse;
}


/**
 * Get recent Execution List.
 * @param {Array} jobIds - The list of job ids
 * @param {int} numOfExecutions - Number of job to retrieve in the last execution list
 * @param {boolean} showDownloadFile - A flag indicating whether to show XML file for download in the job execution details.
 * @param {boolean} downloadFileType - A flag indicating whether to include XML data in the job execution details.
 * @param {string} impexPath - File location in IMPEX.
 * @returns {Array} executionList
 */
function getRecentProcessList(jobIds, numOfExecutions, showDownloadFile, downloadFileType, impexPath) {
    var ocapiServiceHelper = require('~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper');
    var executionListResult = {
        success: true
    };
    var result = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.JOB_EXECUTION_SEARCH)
        .setPageSize(numOfExecutions)
        .setQuery(
        {
            bool_query: {
                must: [
                        { term_query: { fields: ['job_id'], operator: 'one_of', values: [jobIds[0]] } }
                ]
            }
        }
        )
        .selectOnlySpecificAttributes('search', ['id', 'job_id', 'execution_status', 'exit_status', 'step_executions.(**)'])
        .sortBy({
            field: 'start_time',
            sort_order: 'desc'
        })
        .execute();

    var executionList = [];
    var ocapiError = ocapiServiceHelper.getOcapiResponseError(result);
    if (ocapiError) {
        return ocapiError;
    }
    if (!result.error && !empty(result.data) && !empty(result.data.hits)) {
        var ocapiBatchRequest = new ocapi.BatchBuilder();
        var jobExecutions = result.data.hits;
        var fileNameMap = constants.GLOBAL.EXECUTION_LIST.FILES_MAP;

        jobExecutions.forEach(function (execution) {
            if (!empty(execution)) {
                ocapiBatchRequest.addRequest(new ocapi.RequestBuilder()
                    .setRequestId('req' + execution.id)
                    .setOcapi(ocapi.ENDPOINTS.EXECUTION_DETAILS)
                    .addParameters(execution.job_id, execution.id));
                if (jobIds.length > 1 && execution.exit_status && execution.exit_status.status === 'ok') {
                    var lastStepExecution = execution.step_executions[execution.step_executions.length - 1];
                    var secondExecutionId;
                    if (lastStepExecution && lastStepExecution.exit_status && lastStepExecution.exit_status.message) {
                        secondExecutionId = lastStepExecution.exit_status.message;
                    }
                    if (secondExecutionId) {
                        ocapiBatchRequest.addRequest(new ocapi.RequestBuilder()
                            .setRequestId('req' + secondExecutionId)
                            .setOcapi(ocapi.ENDPOINTS.EXECUTION_DETAILS)
                            .addParameters(jobIds[1], secondExecutionId));
                    }
                }
            }
        });

        var ocapiBatchResponse = ocapiBatchRequest.execute();
        var ocapiBatchError = ocapiServiceHelper.getOcapiResponseError(result);
        if (ocapiBatchError) {
            return ocapiBatchError;
        }
        if (!ocapiBatchResponse.error && ocapiBatchResponse.responseList) {
            var resList = ocapiBatchResponse.responseList;
            jobExecutions.forEach(function (executionHit) {
                if (!empty(executionHit)) {
                    var execution = resList['req' + executionHit.id];
                    if (execution && !execution.error) {
                        execution = execution.data;
                        var secondExecution;
                        if (jobIds.length > 1 && execution.exit_status && execution.exit_status.status === 'ok') {
                            var lastStepExecution = execution.step_executions[execution.step_executions.length - 1];
                            if (lastStepExecution && lastStepExecution.exit_status && lastStepExecution.exit_status.message) {
                                var secondExecutionId = lastStepExecution.exit_status.message;
                                secondExecution = resList['req' + secondExecutionId];
                            }
                        }
                        var processTypeParam = null;
                        var impexTypeParam = null;
                        if ('parameters' in execution) {
                            var jobParams = execution.parameters;
                            for (var i = 0; i < jobParams.length; i++) {
                                if (jobParams[i].name === 'ProcessType') {
                                    processTypeParam = jobParams[i];
                                } else if (jobParams[i].name === 'ImpexType') {
                                    impexTypeParam = jobParams[i];
                                }
                                if (!empty(processTypeParam) && !empty(impexTypeParam)) {
                                    break;
                                }
                            }
                        }
                        var options = {
                            processNameJobParam: fileNameMap[jobIds[0]]
                        };
                        if (!empty(processTypeParam) && processTypeParam.value === 'Import') {
                            options.processNameJobParam = 'ImportFileName';
                        }
                        if (empty(processTypeParam) || processTypeParam.value !== 'Import') {
                            options.showDownloadFile = showDownloadFile;
                            options.downloadFileType = downloadFileType;
                            options.impexPath = impexPath;
                        }
                        if (!empty(processTypeParam) || !empty(impexTypeParam)) {
                            options.processType = processTypeParam;
                            options.impexType = impexTypeParam;
                        }
                        executionList.push(new JobExecutionItem(execution, options, secondExecution && !secondExecution.error ? [secondExecution.data] : []));
                    }
                }
            });
        }
    }
    executionListResult.executionList = executionList;
    return executionListResult;
}

/**
 * Retrieves job execution details by making a call to the specified OCAPI service.
 *
 * @param {string} jobIds - Job id
 * @param {string} executionId - Execution id
 * @param {boolean} showDownloadFile - A flag indicating whether to show XML file for download in the job execution details.
 * @param {boolean} downloadFileType - A flag indicating whether to include XML data in the job execution details.
 * @param {string} impexPath - File location in IMPEX.
* @returns {Object} - An object containing the job execution details.
 */
function getJobExecutionDetails(jobIds, executionId, showDownloadFile, downloadFileType, impexPath) {
    var jobResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.EXECUTION_DETAILS)
        .addParameters(encodeURI(jobIds[0]), executionId)
        .execute();

    var fileNameMap = constants.GLOBAL.EXECUTION_LIST.FILES_MAP;
    var jobExecution;
    if (jobResponse && !jobResponse.error) {
        var execution = jobResponse.data;
        var secondExecution;
        if (jobIds.length > 1 && execution.exit_status && execution.exit_status.status === 'ok') {
            var lastStepExecution = execution.step_executions[execution.step_executions.length - 1];
            if (lastStepExecution && lastStepExecution.exit_status && lastStepExecution.exit_status.message) {
                var secondExecutionId = lastStepExecution.exit_status.message;
                secondExecution = new ocapi.RequestBuilder()
                .setOcapi(ocapi.ENDPOINTS.EXECUTION_DETAILS)
                .addParameters(encodeURI(jobIds[1]), secondExecutionId)
                .execute();
                jobExecution = new JobExecutionItem(execution, {
                    processNameJobParam: fileNameMap[jobIds[0]],
                    showDownloadFile: showDownloadFile,
                    downloadFileType: downloadFileType,
                    impexPath: impexPath
                }, secondExecution && !secondExecution.error ? [secondExecution.data] : []);
            }
        }
        if (!jobExecution) {
            var processTypeParam = null;
            var impexTypeParam = null;
            if ('parameters' in execution) {
                var jobParams = execution.parameters;
                for (var i = 0; i < jobParams.length; i++) {
                    if (jobParams[i].name === 'ProcessType') {
                        processTypeParam = jobParams[i];
                    } else if (jobParams[i].name === 'ImpexType') {
                        impexTypeParam = jobParams[i];
                    }
                    if (!empty(processTypeParam) && !empty(impexTypeParam)) {
                        break;
                    }
                }
            }
            var options = {
                processNameJobParam: fileNameMap[jobIds[0]]
            };
            if (!empty(processTypeParam) && processTypeParam.value === 'Import') {
                options.processNameJobParam = 'ImportFileName';
            }
            if (empty(processTypeParam) || processTypeParam.value !== 'Import') {
                options.showDownloadFile = showDownloadFile;
                options.downloadFileType = downloadFileType;
                options.impexPath = impexPath;
            }
            if (!empty(processTypeParam) || !empty(impexTypeParam)) {
                options.processType = processTypeParam;
                options.impexType = impexTypeParam;
            }
            jobExecution = new JobExecutionItem(execution, options);
            if (jobIds.length > 1) {
                jobExecution.jobIds = jobIds instanceof Array ? jobIds : jobIds.toArray();
            }
        }
    } else {
        jobExecution = jobResponse;
    }
    return jobExecution;
}
/**
 * Retrieves a list of job executions within a specified time range.
 *
 * @param {Date} start - The start date and time for the search range.
 * @param {Date} end - The end date and time for the search range.
 * @param {number} pageNumber - The page number for paginated results.
 * @returns {Object} - An object containing the result of the job execution search.
 */
function getAllJobsExecutions(start, end, pageNumber) {
    var startDate = new Calendar(new Date(start));
    var startTime = StringUtils.formatCalendar(startDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    var endDate = new Calendar(new Date(end));
    var endTime = StringUtils.formatCalendar(endDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    var result = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.JOB_EXECUTION_SEARCH)
        .setPageSize(200)
        .setPageNumber(pageNumber)
        .setQuery({ bool_query: { must: [{ term_query: { fields: ['start_time'], operator: 'greater', values: [startTime] } },
                { term_query: { fields: ['start_time'], operator: 'less', values: [endTime] } }],
            must_not: [{ text_query: { fields: ['job_id'], search_phrase: 'sfcc-' } }] }
        })
        .selectOnlySpecificAttributes('search', ['job_id', 'start_time', 'end_time', 'status', 'user_login', 'duration'])
        .sortBy({
            field: 'start_time',
            sort_order: 'desc'
        })
        .execute();

    return result;
}


module.exports = {
    getJobExecutionDetails: getJobExecutionDetails,
    getRecentProcessList: getRecentProcessList,
    executeJob: executeJob,
    getAllJobsExecutions: getAllJobsExecutions
};
