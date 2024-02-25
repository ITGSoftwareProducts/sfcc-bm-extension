'use strict';

var scrollAnimate = require('../components/scrollAnimate');

/**
 * Display error messages and highlight form fields with errors.
 * @param {string} parentSelector - The form which contains the fields
 * @param {Object} fieldErrors - The fields with errors
 */
function loadFormErrors(parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    $.each(fieldErrors, function (attr) {
        $('*[name=' + attr + ']', parentSelector)
            .addClass('is-invalid')
            .siblings('.invalid-feedback')
            .html(fieldErrors[attr]);
    });
    // Animate to top of form that has errors
    scrollAnimate($(parentSelector));
}

/**
 * Display error messages and highlight form fields with errors.
 * @param {jQuery} form - The jQuery object representing the form element.
 * @param {string} parentSelector - The selector for the parent element containing form fields.
 * @param {Array} fieldErrors - An array of objects containing error information for form fields.
 */
function loadFormDataError(form, parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    fieldErrors.forEach(function (attr) {
        var selectInput = form.find("select option[value='" + attr.attrId + "']:selected");
        var dataMappingRow = selectInput.closest(parentSelector);
        dataMappingRow.addClass('is-invalid')
            .siblings('.invalid-feedback').addClass('mb-3')
            .html(attr.errorMessage);
    });
}

/**
 * Clear the form errors.
 * @param {string} parentSelector - The parent form selector.
 */
function clearPreviousErrors(parentSelector) {
    $(parentSelector).find('.form-control.is-invalid').removeClass('is-invalid');
    $('.error-message').hide();
}

/**
 * Clear the form errors.
 * @param {string} parentSelector - The parent form selector.
 */
function clearFormDataError(parentSelector) {
    var rowError = $(parentSelector).find('.parent-group.is-invalid');
    rowError.removeClass('is-invalid');
    rowError.siblings('.invalid-feedback').empty();
}

module.exports = {
    loadFormErrors: loadFormErrors,
    clearPreviousErrors: clearPreviousErrors,
    loadFormDataError: loadFormDataError,
    clearFormDataError: clearFormDataError
};
