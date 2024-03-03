'use strict';

var executionList = require('./executionList');
var toast = require('./components/toastNotification');

const cleanEmptyLines = (field) => {
    const cleanTerm = $.trim(field.val());
    $(field).val(cleanTerm);
    return cleanTerm;
};

var exportPage = function () {
    $('form.select-page-form').on('submit', function (e) {
        e.preventDefault();
        var pageID = cleanEmptyLines($('#pageDesignerSearchTerm'));
        if (pageID) {
            var filenames = pageID.split('\n').map(function (filename) {
                return filename.trim();
            });
            var pageIDs = filenames.join('\n');
            filenames = filenames.join(', ');
            var filenamesString = '(' + filenames + ')';
            $('#exportModal').find('.files-name').text(filenamesString);
            $('#exportModal').find('#selectedContentIds').val(pageIDs);
            $('#exportModal').modal('show');
        }
    });
    var initialHeight = $('#pageDesignerSearchTerm').outerHeight();
    $('form.export-file-form').on('submit', function (e) {
        var form = $(this);
        e.preventDefault();

        // Validate file name input
        var fileName = $('#exportFileName').val();
        if ($.trim(fileName) !== '') {
            var url = form.attr('action');
            var noRunningProcess = executionList.validateNoRunningProcess();
            if (noRunningProcess) {
                $('body').spinner().start();

                $.ajax({
                    url: url,
                    data: form.serialize(),
                    type: 'post',
                    success: function (response) {
                        $('body').spinner().stop();
                        var dataTable = $('#execution_history').find('.table');
                        if (response.success) {
                            var renderedTemplate = response.renderedTemplate;
                            if (dataTable.find('tbody tr').length >= 5) {
                                dataTable.find('tbody tr:last').remove();
                            }
                            dataTable.find('tbody').prepend(renderedTemplate);
                            executionList.checkProcessStatus();
                            executionList.refreshExecutionList();
                        } else if (response.serverErrors && response.serverErrors.length) {
                            $.each(response.serverErrors, function (index, element) {
                                toast.show(toast.TYPES.ERROR, element);
                            });
                        }
                        $('.export-file-form .invalid-feedback').text('');
                        $('#exportModal').modal('hide');
                        $('#exportFileName').val('');
                        $('#pageDesignerSearchTerm').val('');
                        $('#pageDesignerSearchTerm').css('height', initialHeight);
                        $('#pageDesignerSearchTerm').css('overflow-y', 'hidden');
                    },
                    error: function () {
                        $('body').spinner().stop();
                    }
                });
            }
        }
    });
};

var clearErrors = function (clickedElement) {
    if (clickedElement.closest('.form-group').hasClass('has-error')) {
        clickedElement.closest('.form-group').find('.invalid-feedback').hide();
        clickedElement.closest('.form-group').removeClass('has-error');
        clickedElement.removeClass('is-invalid');
    }
};

var validateForms = function () {
    $('.pagedesigner-form .form-control').on('input', function () {
        clearErrors($(this));
    });
};

$(document).ready(function () {
    exportPage();
    validateForms();
});
