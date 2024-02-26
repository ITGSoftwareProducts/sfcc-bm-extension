/* eslint-disable no-mixed-operators */
/* eslint-disable radix */
'use strict';
var $ = jQuery;

const getTimeValues = function (prefix) {
    var hours = parseInt($('#' + prefix + 'Hours').val()) || 0;
    var minutes = parseInt($('#' + prefix + 'Minutes').val()) || 0;
    var toggle = $('#' + prefix + 'Toggle').text();

    return { hours: hours, minutes: minutes, toggle: toggle };
};

const convert12To24 = function (hours, toggle) {
    var hours12Int = parseInt(hours);
    if (toggle === 'PM' && hours12Int < 12) {
        hours12Int += 12;
    } else if (toggle === 'AM' && hours12Int === 12) {
        hours12Int = 0;
    }

    return hours12Int;
};

var convert24To12 = function (hours) {
    var hours24Int = parseInt(hours);

    // Convert 24-hour format to 12-hour format
    if (hours24Int > 12) {
        hours24Int -= 12;
    } else if (hours24Int === 0) {
        hours24Int = 12;
    }

    return hours24Int;
};

const checkTimeDifference = function () {
    var startTime = getTimeValues('start');
    var endTime = getTimeValues('end');

    var startHours24Int = convert12To24(startTime.hours, startTime.toggle);
    var endHours24Int = convert12To24(endTime.hours, endTime.toggle);

    var timeDifferenceInMinutes;

    if (endHours24Int < startHours24Int || (endHours24Int === startHours24Int && endTime.minutes < startTime.minutes)) {
        // Adjust for the time difference across days
        timeDifferenceInMinutes = (endHours24Int + 24) * 60 + endTime.minutes - (startHours24Int * 60 + startTime.minutes);
    } else {
        // Same day calculation
        timeDifferenceInMinutes = (endHours24Int * 60 + endTime.minutes) - (startHours24Int * 60 + startTime.minutes);
    }
    return timeDifferenceInMinutes > 240;
};

const updateNextDay = function (isNewDay) {
    var selectedDate = $('#customTimeFrame').datepicker('getDate');
    var nextDayDate = new Date(selectedDate);

    if (isNewDay) {
        nextDayDate.setDate(selectedDate.getDate() + 1);
        var formattedNextDay = nextDayDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        $('.new-day').html('( ' + formattedNextDay + ' )');
    } else {
        $('.new-day').empty();
    }

    $('#nextDay').val(nextDayDate);
};

const updateEndTime = function () {
    var startTime = getTimeValues('start');

    var startHours24Int = convert12To24(startTime.hours, startTime.toggle);

    if (startHours24Int >= 20) {
        updateNextDay(true);
    } else {
        updateNextDay(false);
    }

    var endHours = (startHours24Int + 4) % 24;

    var endHours12Int = convert24To12(endHours);
    var endToggle = endHours >= 12 ? 'PM' : 'AM';

    var endMinutes = startTime.minutes;
    if (startTime.hours > 0) {
        $('#endHours').val(endHours12Int);
        $('#endMinutes').val(endMinutes);
        if ((startTime.minutes === 0)) {
            $('#startMinutes').val('0');
        }
    }
    $('#endToggle').text(endToggle);
};

const handleNextDay = function () {
    var startTime = getTimeValues('start');
    var endTime = getTimeValues('end');

    var endHours24Int = convert12To24(endTime.hours, endTime.toggle);
    var startHours24Int = convert12To24(startTime.hours, startTime.toggle);
    if (endHours24Int < startHours24Int || (endHours24Int === startHours24Int && endTime.minutes < startTime.minutes)) {
        updateNextDay(true);
    } else {
        updateNextDay(false);
    }
};

const formatDateTime = function (date, hours, minutes, toggle) {
    const formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    const formattedTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + toggle;
    return formattedDate + ' ' + formattedTime;
};

module.exports = {
    getTimeValues: getTimeValues,
    convert12To24: convert12To24,
    convert24To12: convert24To12,
    checkTimeDifference: checkTimeDifference,
    updateEndTime: updateEndTime,
    updateNextDay: updateNextDay,
    handleNextDay: handleNextDay,
    formatDateTime: formatDateTime
};
