'use strict';

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid.
 * @returns {boolean} - Flag to indicate if form is valid
 */
function validateForm(event) {
    var valid = true;
    if (this.checkValidity && !this.checkValidity()) {
        // safari
        valid = false;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        $(this).find('input, select, textarea').each(function () {
            if (!this.validity.valid) {
                $(this).trigger('invalid', this.validity);
            }
        });
    }
    return valid;
}

/**
 * Remove all validation. Should be called every time before revalidating form
 * @param {element} form - Form to be cleared
 * @returns {void}
 */
function clearForm(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid');
}

module.exports = {
    invalid: function () {
        $('body').on('invalid', 'form input, form select, form textarea', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                $(this).addClass('is-invalid');
                if (this.validity.patternMismatch && $(this).data('pattern-mismatch')) {
                    validationMessage = $(this).data('pattern-mismatch');
                }
                if ((this.validity.rangeOverflow || this.validity.rangeUnderflow)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if ((this.validity.tooLong || this.validity.tooShort)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    validationMessage = $(this).data('missing-error');
                }
                $(this).parents('.form-group').find('.invalid-feedback')
                    .text(validationMessage);
            }
        });
    },

    submit: function () {
        $('body').on('submit', 'form', function (e) {
            return validateForm.call(this, e);
        });
        $('body').on('blur', 'form input', function (e) {
            return validateForm.call(this, e);
        });
        $('body').on('input', 'form textarea', function (e) {
            return validateForm.call(this, e);
        });
        $('body').on('change', 'form select', function (e) {
            return validateForm.call(this, e);
        });
    },

    buttonClick: function () {
        $('form button[type="submit"], form input[type="submit"]').on('click', function () {
            // Clear all errors when trying to submit the form
            clearForm($(this).parents('form'));
        });
        $('body').on('blur', 'form input', function () {
            clearForm($(this).parent());
        });
        $('body').on('input', 'form textarea', function () {
            clearForm($(this).parent());
        });
        $('body').on('change', 'form select', function () {
            clearForm($(this).parent());
        });
    },

    functions: {
        validateForm: function (form, event) {
            validateForm.call($(form), event || null);
        },
        clearForm: clearForm
    }
};
