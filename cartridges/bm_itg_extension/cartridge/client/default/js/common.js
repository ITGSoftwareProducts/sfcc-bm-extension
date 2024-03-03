'use strict';
var $ = jQuery;

function handleInputMinMax($input, minValue, maxValue) {
    // eslint-disable-next-line radix
    let enteredValue = parseInt($input.val());

    if (enteredValue < minValue || isNaN(enteredValue)) {
        enteredValue = '';
    }
    if (enteredValue > maxValue) {
        enteredValue = maxValue;
    }
    $input.val(enteredValue);
}

$(document).ready(function () {
    $(document).on('wheel', 'input[type=number]', function () {
        $(this).trigger('blur');
    });

    $(document).on('input', 'input[name="minutes"]', function () {
        handleInputMinMax($(this), 0, 59);
    });

    $(document).on('input', 'input[name="hours"]', function () {
        let minValue = 0;
        let maxValue = 23;

        if ($(this).attr('id') === 'startHours' || $(this).attr('id') === 'endHours') {
            minValue = 1;
            maxValue = 12;
        }

        handleInputMinMax($(this), minValue, maxValue);
    });

    var textarea = $('textarea');
    var initialHeight = textarea.height();
    // eslint-disable-next-line radix
    var lineHeight = parseInt(textarea.css('line-height'));
    var maxLines = 8;
    var maxHeight = lineHeight * maxLines;

    $('textarea').on('input', function () {
        textarea.css('height', initialHeight);
        textarea.css('height', Math.min(this.scrollHeight, maxHeight) + 'px');
        textarea.css(
            'overflow-y',
            this.scrollHeight > maxHeight ? 'auto' : 'hidden'
        );
    });


    $(document).on('input', 'input[name="countThreshold"]', function () {
        const minValue = 1;
        // eslint-disable-next-line radix
        let enteredValue = parseInt($(this).val());
        if (enteredValue < minValue || isNaN(enteredValue)) {
            enteredValue = '';
        }
        $(this).val(enteredValue);
    });

    $(document).on('input', 'input[name="exportFileName"]', function () {
        var inputValue = $(this).val();
        var pattern = /^[a-zA-Z0-9\-_]+$/;

        if (!pattern.test(inputValue)) {
          // If the entered value does not match the pattern, remove the invalid characters
            var sanitizedValue = inputValue.replace(/[^a-zA-Z0-9\-_]+/g, '');
            $(this).val(sanitizedValue);
        }
    });

    $('.oci-modal').on('shown.bs.modal', function () {
        // Add a small delay to ensure the modal has fully rendered
        $('.modal-content').animate({ scrollTop: 0 }, '500');
    });

    $('#executionModal').on('shown.bs.modal', function () {
        // Add a small delay to ensure the modal has fully rendered
        $('.modal-content .log-messages').animate({ scrollTop: 0 }, '500');
    });

    $(document).on('input', 'input[name="mappingName"]', function () {
        var inputValue = $(this).val();
        var pattern = /^[a-zA-Z0-9\-_]+$/;

        if (!pattern.test(inputValue)) {
          // If the entered value does not match the pattern, remove the invalid characters
            var sanitizedValue = inputValue.replace(/[^a-zA-Z0-9\-_]+/g, '');
            $(this).val(sanitizedValue);
        }
    });

    $('#recipientEmailsModal').on('shown.bs.modal', function () {
        // Add a small delay to ensure the modal has fully rendered
        $('.modal-content').animate({ scrollTop: 0 }, '500');
    });
});

