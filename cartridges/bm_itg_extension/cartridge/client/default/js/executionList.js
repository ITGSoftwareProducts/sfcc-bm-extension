'use strict';
var toast = require('./components/toastNotification');

var checkProcessStatus = function () {
    var isAjaxInProgress = false;
    var isTableEmpty = false;
    var executionHistory = $('#execution_history');
    if (executionHistory.length > 0) {
        var executionListData = executionHistory.data('execution-list-data');
        var checkProcessStatusURL = executionListData.exportDetailsURL;
        var downloadExportFile = executionListData.showDownloadFile;
        var downloadFileType = executionListData.downloadFileType;
        var jobIds = executionListData.jobIds;
        var impexPath = executionListData.impexPath;
        var pendingProcess;
        var interval = setInterval(function () {
            if (isAjaxInProgress || isTableEmpty) {
                return;
            }
            pendingProcess = executionHistory.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]');
            if (pendingProcess.length > 0) {
                isAjaxInProgress = true;
                $.ajax(checkProcessStatusURL, {
                    data: {
                        executionId: pendingProcess.data('execution-id'),
                        jobIds: jobIds,
                        serviceType: pendingProcess.data('service-type') ? pendingProcess.data('service-type') : executionListData.serviceType,
                        downloadExportFile: downloadExportFile,
                        downloadFileType: downloadFileType,
                        impexPath: impexPath
                    },
                    dataType: 'json',
                    method: 'GET',
                    success: function (res) {
                        if (res.success) {
                            var updatedProcess = $(res.renderedTemplate);
                            if (['PENDING', 'RUNNING'].indexOf(updatedProcess.data('job-status')) === -1) {
                                updatedProcess.addClass('animate-slide-in-down');
                                clearInterval(interval);
                            }
                            pendingProcess = executionHistory.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]');
                            pendingProcess.replaceWith(updatedProcess);
                            setTimeout(function () { executionHistory.find('tr').removeClass('animate-slide-in-down'); }, 1000);
                        } else if (res.serverErrors && res.serverErrors.length > 0) {
                            toast.show(toast.TYPES.ERROR, res.serverErrors[0]);
                        }
                    },
                    complete: function () {
                        isAjaxInProgress = false;
                    }
                });
            } else {
                clearInterval(interval);
            }
        }, 30000);
    }
};

var handleProcessLink = function () {
    $(document).on('click', '.execution-modal-link', function (e) {
        e.preventDefault();
        $(this).closest('tr').addClass('focused');
        var parent = $(this).closest('tr');
        var jobStatus = $(parent).data('job-status');
        var $modal = $('#executionModal');
        if (jobStatus !== 'PENDING' && jobStatus !== 'RUNNING') {
            $modal.modal('show');

            parent.closest('tr').addClass('focused');
            var linkText = parent.find('.execution-modal-link').html();
            var jobExecutionDetails = parent.closest('tr').data('execution-obj');

            $modal.find('.modal-body').spinner().start();
            var uuid = jobExecutionDetails.configurationUUID ? jobExecutionDetails.configurationUUID : '';
            if (uuid) {
                var url = $('#execution_history').data('job-logs-url');
                var data = {
                    JobConfigurationUUID: uuid
                };
                $.ajax({
                    url: url,
                    data: data,
                    type: 'get',
                    success: function (response) {
                        var $logMessages = $('.log-messages');
                        var $modalDownloadSection = $modal.find('.download-section');
                        var htmlContent = $(response).find('textarea.inputfield_en').html();
                        if ($.trim(htmlContent) !== '') {
                            $logMessages.empty().html(htmlContent).removeClass('d-none');
                        }
                        var statusText;

                        switch (jobExecutionDetails.executionStatus) {
                            case 'finished':
                                if (jobExecutionDetails.status === 'OK') {
                                    statusText = 'Success';
                                    $modalDownloadSection.show();
                                    $modal.find('.download-section a')
                                        .attr('href', jobExecutionDetails.exportURL);
                                } else {
                                    statusText = 'Error';
                                    $modalDownloadSection.hide();
                                }
                                break;
                            case 'aborted':
                                statusText = 'Error';
                                $modalDownloadSection.hide();
                                break;
                            default:
                                statusText = 'In-progress';
                                $modalDownloadSection.hide();
                                break;
                        }

                        if (jobExecutionDetails.processType && jobExecutionDetails.processType === 'Import') {
                            $modal.find('.download-section').addClass('d-none');
                        } else if (jobExecutionDetails.processType && jobExecutionDetails.processType === 'Export') {
                            $modal.find('.download-section').removeClass('d-none');
                        }

                        var statusBadge =
                            '<span class="badge ' + statusText.toLowerCase() + '-badge">' +
                            statusText + '</span>';
                        $modal.find('.file-name').empty().html(linkText.replace(/&lt;/g, '<br/>&lt;'));
                        $modal.find('.status').empty().html(statusBadge);
                        $modal.find('.time-section .time-message').empty().html(jobExecutionDetails.timeStatusMessage);
                        $modal.find('.download-log').attr('href', jobExecutionDetails.logFileURL);
                        $modal.find('.modal-body').spinner().stop();
                    }
                });
                $modal.on('hidden.bs.modal', function () {
                    $('.table-link').removeClass('focused');
                });
            }
        }
    });
};

var handleCopyLink = function () {
    $('body').on('click', '.log-file-section .copy', function (e) {
        e.preventDefault();
        // eslint-disable-next-line no-undef
        const tooltip = new bootstrap.Tooltip($(this), {
            trigger: 'manual'
        });
        const logMsgElement = $('.log-file-section .log-messages');
        if (logMsgElement.length) {
            const logMsgContent = $(logMsgElement).text();
            if ($.trim(logMsgContent) !== '') {
                navigator.clipboard.writeText(logMsgContent);
                tooltip.show();

                setTimeout(function () {
                    tooltip.hide();
                }, 1000);
            }
        }
    });
};

var refreshExecutionList = function () {
    $(document).on('click', '.refresh-execution-list', function (e) {
        e.preventDefault();
        var executionHistory = $('#execution_history');
        var executionListData = executionHistory.data('execution-list-data');
        var checkProcessStatusURL = executionListData.exportDetailsURL;
        var downloadExportFile = executionListData.showDownloadFile;
        var downloadFileType = executionListData.downloadFileType;
        var jobIds = executionListData.jobIds;
        var impexPath = executionListData.impexPath;
        var maxProcessNumber = executionListData.maxProcessNumber;
        executionHistory.spinner().start();
        $.ajax(checkProcessStatusURL, {
            data: {
                jobIds: jobIds,
                serviceType: executionListData.serviceType,
                downloadExportFile: downloadExportFile,
                downloadFileType: downloadFileType,
                impexPath: impexPath,
                maxProcessNumber: maxProcessNumber
            },
            dataType: 'json',
            method: 'get',
            success: function (res) {
                if (res.success) {
                    $('.execution-list').html(res.renderedTemplate);
                    if ($('.execution-list').find('tr[data-job-status=RUNNING], tr[data-job-status=PENDING]')) {
                        checkProcessStatus();
                    }
                    executionHistory.spinner().stop();
                } else if (res.serverErrors && res.serverErrors.length > 0) {
                    toast.show(toast.TYPES.ERROR, res.serverErrors[0]);
                    executionHistory.spinner().stop();
                }
            },
            complete: function () {
                $('.refresh-execution-list').blur();
            }
        });
        $('.refresh-execution-list').blur();
    });
};

var validateNoRunningProcess = function () {
    var noRunningProcess = true;
    var executionHistory = $('#execution_history');
    var pendingProcess = executionHistory.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]');
    if (pendingProcess.length > 0) {
        var errorMessage = executionHistory.data('running-process-error');
        toast.show(toast.TYPES.INFO, errorMessage);
        noRunningProcess = false;
    }
    return noRunningProcess;
};

module.exports = {
    checkProcessStatus: checkProcessStatus,
    handleProcessLink: handleProcessLink,
    handleCopyLink: handleCopyLink,
    refreshExecutionList: refreshExecutionList,
    validateNoRunningProcess: validateNoRunningProcess
};
