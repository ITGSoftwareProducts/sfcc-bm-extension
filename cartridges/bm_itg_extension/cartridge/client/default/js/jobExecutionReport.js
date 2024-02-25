'use strict';
window.jQuery = window.$ = require('jquery');
var datepickerWithTime = require('./datepickerWithTime');
var chart = require('./chartJS');
var toast = require('./components/toastNotification');


require('jquery-ui-dist/jquery-ui');
/**
 * Sends an AJAX request to retrieve job execution data.
 *
 * @param {string} url - The URL of the API endpoint.
 * @param {number} index - The starting index for fetching data.
 * @param {string} startTime - The start time for filtering data (optional).
 * @param {string} endTime - The end time for filtering data (optional).
 * @param {boolean} lastFourHours - Flag indicating whether to fetch data for the last four hours (optional).
 * @returns {Promise} - A Promise that resolves with the fetched data or rejects with an error.
 */
function getJobExecution(url, index, startTime, endTime, lastFourHours) {
    return new Promise(function (resolve, reject) {
        var data = {
            startIndex: index,
            startTime: startTime,
            endTime: endTime,
            lastFourHours: lastFourHours || false
        };

        $.ajax({
            url: url,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.error && response.data && response.data.errorMessage) {
                    toast.show(toast.TYPES.ERROR, response.data.errorMessage);
                    $('.job-execution-wrapper').spinner().stop();
                    $('.job-execution-wrapper-actions .selector-button').removeClass('selected');
                } else {
                    resolve(response);
                }
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

var getInstanceTimeZone = function () {
    var container = $('.job-execution-buttons');
    var timeZone = container.data('instance-time-zone');
    return timeZone;
};

function changeTimezone(date, instanceTimeZone) {
    var invdate = new Date(date.toLocaleString('en-US', {
        timeZone: instanceTimeZone
    }));
    var diff = invdate.getTime() - date.getTime();

    return new Date(date.getTime() - diff);
}

function convertUTCToInstanceTimeZone(date, instanceTimeZone) {
    var invdate = new Date(date.toLocaleString('en-US', {
        timeZone: instanceTimeZone
    }));
    var diff = date.getTime() - invdate.getTime();

    return new Date(date.getTime() - diff);
}

/**
 * Fetches all job execution data recursively until no more data is available.
 *
 * @param {string} url - The URL of the API endpoint.
 * @param {number} index - The starting index for fetching data.
 * @param {string} startTime - The start time for filtering data (optional).
 * @param {string} endTime - The end time for filtering data (optional).
 * @param {boolean} lastFourHours - Flag indicating whether to fetch data for the last four hours (optional).
 * @returns {Promise} - A Promise that resolves with all the fetched data or rejects with an error.
 */
function fetchAllData(url, index, startTime, endTime, lastFourHours) {
    /**
    * Recursive function to fetch job execution data.
    *
    * @param {string} url - The URL of the API endpoint.
    * @param {number} index - The starting index for fetching data.
    * @param {string} startTime - The start time for filtering data (optional).
    * @param {string} endTime - The end time for filtering data (optional).
    * @param {boolean} lastFourHours - Flag indicating whether to fetch data for the last four hours (optional).
    * @param {Object}  jobExecutionObj - Object to store data.
    * @returns {Promise} - A Promise that resolves with all the fetched data or rejects with an error.
    */
    // eslint-disable-next-line no-shadow
    function recursiveFetch(url, index, startTime, endTime, lastFourHours) {
        return getJobExecution(url, index, startTime, endTime, lastFourHours)
            .then(function (response) {
                var jobExecutionObj = response;

                if (jobExecutionObj) {
                    if (jobExecutionObj.total === 0 && startTime !== null && endTime !== null) {
                        var instanceTimeZone = getInstanceTimeZone();
                        jobExecutionObj.startTime = convertUTCToInstanceTimeZone(new Date(startTime), instanceTimeZone);
                        jobExecutionObj.endTime = convertUTCToInstanceTimeZone(new Date(endTime), instanceTimeZone);
                    }
                    var mappedData = chart.mapChartData(jobExecutionObj);
                    chart.updateChart(mappedData);
                }

                if (jobExecutionObj.total === 0) {
                    return jobExecutionObj;
                }

                if (!response.allData) {
                    var newIndex = response.count + 1;
                    return recursiveFetch(url, newIndex, startTime, endTime, lastFourHours, jobExecutionObj);
                }
                return jobExecutionObj;
            })
            .catch(function (error) {
                throw error;
            });
    }

    return recursiveFetch(url, index, startTime, endTime, lastFourHours);
}

var closeAction = function () {
    var savedDate = $('#startDate').val();
    var newDate = new Date(savedDate);
    $('.time-inputs-wrapper .invalid-feedback').hide();

    $('#customTimeFrame').datepicker('setDate', newDate);
    $('#startHours').val($('#startHoursHidden').val());
    $('#startMinutes').val($('#startMinutesHidden').val());
    $('#startToggle').text($('#startToggleHidden').val() || 'AM');

    $('#endHours').val($('#endHoursHidden').val());
    $('#endMinutes').val($('#endMinutesHidden').val());
    $('#endToggle').text($('#endToggleHidden').val() || 'AM');
};


$(document).ready(function () {
    $(document).on('change', '#startHours, #startMinutes', function () {
        datepickerWithTime.updateEndTime();
    });

    $(document).on('click', '.toggle-time', function () {
        var currentText = $(this).text();
        $(this).text(currentText === 'AM' ? 'PM' : 'AM');
    });

    $(document).on('click', '#startToggle', function () {
        datepickerWithTime.updateEndTime();
    });

    $(document).on('click', '#endToggle', function () {
        datepickerWithTime.handleNextDay();
    });

    $(document).on('change', '#endHours, #endMinutes', function () {
        datepickerWithTime.handleNextDay();
    });

    $(document).on('click', '.ui-datepicker-header .ui-icon', function (event) {
        event.stopPropagation();
    });

    $(document).on('click', function (event) {
        var calendarWrapper = $('.calendar-wrapper');
        var showButton = $('.custom-time-frame-btn');

        // Check if the click target is outside the div and the showButton
        if (!calendarWrapper.is(event.target) && !showButton.is(event.target) && calendarWrapper.has(event.target).length === 0) {
            calendarWrapper.fadeOut();
        }
    });

    $('#saveButton').on('click', function () {
        var startHoursInput = $('#startHours').val().trim();
        if (!startHoursInput) {
            $(this).closest('.time-inputs-wrapper').find('.time-error-msg').show();
            return;
        }

        if (datepickerWithTime.checkTimeDifference()) {
            $(this).closest('.time-inputs-wrapper').find('.error-msg').show();
            return;
        }
        $('.calendar-wrapper').fadeOut();
        $('.time-inputs-wrapper .invalid-feedback').hide();
        var startTime = datepickerWithTime.getTimeValues('start');
        var endTime = datepickerWithTime.getTimeValues('end');
        var selectedDate = $('#customTimeFrame').datepicker('getDate');

        var startDate = new Date(selectedDate);
        startDate.setHours(startTime.hours, startTime.minutes);

        var endDateString = $('#nextDay').val();
        var endDate = new Date(endDateString);
        endDate.setHours(endTime.hours, endTime.minutes);

        var formattedResult = datepickerWithTime.formatDateTime(startDate, startTime.hours, startTime.minutes, startTime.toggle) +
            ' - ' +
            datepickerWithTime.formatDateTime(endDate, endTime.hours, endTime.minutes, endTime.toggle);
        $('.time-value').text(formattedResult);
        $('.job-execution-generate').removeClass('disabled');
        $('#startDate').val(startDate);
        $('#startHoursHidden').val(startTime.hours);
        $('#endHoursHidden').val(endTime.hours);
        $('#startMinutesHidden').val(startTime.minutes);
        $('#endMinutesHidden').val(endTime.minutes);
        $('#startToggleHidden').val(startTime.toggle);
        $('#endToggleHidden').val(endTime.toggle);
    });

    $('#datepicker').datepicker({
        changeMonth: false,
        changeYear: false,
        showButtonPanel: false,
        dayNamesMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        showOtherMonths: true,
        selectOtherMonths: true
    });

    $('#customTimeFrame').datepicker({
        changeMonth: false,
        changeYear: false,
        showButtonPanel: false,
        dayNamesMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        showOtherMonths: true,
        selectOtherMonths: true,
        onSelect: function () {
            if ($('.new-day').text() !== '') {
                datepickerWithTime.updateNextDay(true);
            } else {
                datepickerWithTime.updateNextDay(false);
            }
        }
    });

    $(document).on('click', '.custom-time-frame-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('.calendar-wrapper').fadeToggle();
        closeAction();
    });

    $('#closeDatePicker').on('click', function () {
        $('.calendar-wrapper').fadeOut();
        closeAction();
    });

    $(document).on('click', '.last-four-hour', function (e) {
        e.preventDefault();
        $(this).addClass('selected');
        $('.job-execution-wrapper').spinner().start();
        var container = $('.job-execution-buttons');
        var url = container.data('job-report-url');
        chart.checkChart();
        fetchAllData(url, 0, null, null, true).then(() => {
            $('.job-execution-wrapper').spinner().stop();
            $('.job-execution-wrapper-actions .selector-button').removeClass('selected');
        });
    });

    $(document).on('click', '.job-execution-generate', function (e) {
        e.preventDefault();
        var container = $('.job-execution-buttons');
        var url = container.data('job-report-url');
        var instanceTimeZone = getInstanceTimeZone();
        $('.custom-time-frame-btn').addClass('selected');
        $('.job-execution-wrapper').spinner().start();
        var timeValue = $('.time-value').text();
        let startDate;
        let endDate;
        if (timeValue) {
            var timeValues = timeValue.split('-');
            startDate = changeTimezone(new Date(timeValues[0].trim()), instanceTimeZone);
            endDate = changeTimezone(new Date(timeValues[1].trim()), instanceTimeZone);
        }
        chart.checkChart();
        fetchAllData(url, 0, startDate, endDate, false).then(() => {
            $('.job-execution-wrapper').spinner().stop();
            $('.job-execution-wrapper-actions .selector-button').removeClass('selected');
        });
    });

    $('#jobRatioModal .form-control').on('change', function () {
        if ($(this).parent().hasClass('has-error')) {
            $(this).parent().find('.invalid-feedback').hide();
            $(this).parent().removeClass('has-error');
        }
    });

    $(document).on('click', '.check-jobs-ratio', function (e) {
        e.preventDefault();
        let $modal = $('#jobRatioModal .modal-dialog');
        let $errorMessage = $modal.find('.error-message');
        let $ratioValue = $modal.find('.ratio-value');
        var instanceTimeZone = getInstanceTimeZone();

        let inputValue = $('#datepicker').val();
        var ratioDate = changeTimezone(new Date($('.job-ratio-date').val()), instanceTimeZone);
        var url = $(this).data('job-ratio-url');
        var data = {
            ratioDate
        };
        $modal.find('.invalid-feedback').hide();
        $modal.find('.form-group').removeClass('has-error');
        if (!inputValue.length) {
            $('#datepicker').parent().addClass('has-error');
            $('#datepicker').parent().find('.invalid-feedback').show();
            return;
        }
        $modal.spinner().start();

        $.ajax({
            url: url,
            data: data,
            type: 'get',

            success: function (response) {
                if (response.success) {
                    if (response.jobRatio && response.jobRatio.error && response.jobRatio.data) {
                        toast.show(toast.TYPES.ERROR, response.jobRatio.data.errorMessage);
                        $modal.spinner().stop();
                    } else {
                        $('.result-section').removeClass('d-none');
                        $errorMessage.hide();
                        $ratioValue.show();
                        let jopRatio = response.jobRatio;
                        if (jopRatio === '0.000') { jopRatio = parseFloat(jopRatio).toFixed(1); }
                        $('.ratio-value').html(jopRatio);
                        if (response.warning) {
                            $('.warning-message').removeClass('d-none');
                            $('.safe-message').addClass('d-none');
                        } else {
                            $('.warning-message').addClass('d-none');
                            $('.safe-message').removeClass('d-none');
                        }
                        $modal.spinner().stop();
                    }
                } else {
                    $('.result-section').removeClass('d-none');
                    $ratioValue.hide();
                    $('.safe-message').addClass('d-none');
                    $errorMessage.show();
                    $modal.spinner().stop();
                }
            }
        });
    });
});
