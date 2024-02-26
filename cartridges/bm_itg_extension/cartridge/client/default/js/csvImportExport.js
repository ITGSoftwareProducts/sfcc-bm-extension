
'use strict';
var $ = jQuery;
var executionList = require('./executionList');
var toast = require('./components/toastNotification');

function resetCsvImportExportForm(collapsedSection) {
    $('form.execute-import-export').trigger('reset');
    var define = collapsedSection.data('define');
    collapsedSection.find('.btn-text').text(define);
    collapsedSection.find('input[name=dataMappingName]').val('');
    var fileInput = $('.csv-file-input');
    fileInput.val('');
    $('.file-name').text(fileInput.data('csv-placeholder'));
    collapsedSection.find('.submit-import-button, .export-button').addClass('disabled');
    collapsedSection.find('.select-price-book-id').addClass('d-none');
    collapsedSection.find('.select-inventory-list-ids').addClass('d-none');
    collapsedSection.find('.data-mapping-button').addClass('disabled');
}


// Document ready function to ensure the DOM is fully loaded
$(document).ready(function () {
    $(document).on('change', '.csv-file-input', function () {
        var placeholder = 'Upload CSV File ...';
        var fileName = $(this).val().split('\\').pop();
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        var btnEl = collapsedSection.find('.btn-primary');
        var dataMappingVal = collapsedSection.find('input[name=dataMappingName]').val();
        var selectNode = $('.data-selection .select-ids');
        var selectNodeVal = selectNode.not('.d-none').find('.select-ids-list').val();

        if (fileName !== '') {
            $('.file-name').text(fileName);
            if (dataMappingVal) {
                if (selectNodeVal !== null && selectNodeVal !== '') {
                    btnEl.removeClass('disabled');
                } else {
                    btnEl.addClass('disabled');
                }
            }
        } else {
            $('.file-name').text(placeholder);
            btnEl.addClass('disabled');
        }
    });

    $(document).on('change', '.select-ids-list', function () {
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        var dataMappingButton = collapsedSection.find('.data-mapping-button .btn-text').text();
        var btnEl = collapsedSection.find('.btn-primary');

        if (collapsedSection.find('[name=processType]').val() === 'Import') {
            if ($('.csv-file-input').val() !== '' && dataMappingButton !== 'Define') {
                btnEl.removeClass('disabled');
            } else {
                btnEl.addClass('disabled');
            }
        } else if (dataMappingButton !== 'Define') {
            btnEl.removeClass('disabled');
        } else {
            btnEl.addClass('disabled');
        }
    });


    $('body').on('click', '.remove-button', function (event) {
        event.preventDefault();
        $(this).closest('.group').remove();
        var mappingOptionsCount = $('.new-mapping-record .object-attr option:not(:disabled)').length;
        if ($('.mapping-table-content .object-attr').length <= mappingOptionsCount) {
            $('.mapping-table .add-button').removeClass('disabled');
        }
    });

    $('body').on('click', '.import-export-buttons .selector-button', function () {
        var collapsedSection = $('.import-export-wrapper').find('.csv-section.collapsing');
        $('.selector-button').not(this).removeClass('selected');
        $(this).toggleClass('selected');
        collapsedSection.each(function (index, item) {
            resetCsvImportExportForm($(item));
        });
    });

    $('body').on('change', '.data-type-select', function () {
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        if ($(this).val() === 'priceBook') {
            collapsedSection.find('.select-price-book-id').removeClass('d-none');
            collapsedSection.find('.select-inventory-list-ids').addClass('d-none');
        } else if ($(this).val() === 'inventory') {
            collapsedSection.find('.select-inventory-list-ids').removeClass('d-none');
            collapsedSection.find('.select-price-book-id').addClass('d-none');
        }

        var selectIds = $(this).parents('.data-selection').find('.select-ids:not(.d-none)');
        var selectIdsList = selectIds.find('.select-ids-list');
        var selectedValue = selectIdsList.val();
        if (selectedValue === null || selectedValue === '') {
            selectIdsList.parents('.collapse').find('.data-mapping-button').addClass('disabled');
        }
        $(this).parents('.collapse').find('.data-mapping-button')
            .find('.btn-text')
            .text('Define');
        collapsedSection.find('input[name=dataMappingName]').empty();
        $(this).parents('.collapse').find('.data-mapping-button').removeClass('disabled');
        var btnEl = collapsedSection.find('.btn-primary');
        btnEl.addClass('disabled');
    });

    $('body').on('click', '.apply-configuration', function () {
        var dataMappingModal = $('#dataMapping');
        var savedMappingConfiguration = dataMappingModal.find('.saved-mapping-config');
        var checkedRadio = savedMappingConfiguration.find('input[name="data-mapping"]:checked');
        var selectNode = $('.data-selection .select-ids');
        var selectNodeVal = selectNode.not('.d-none').find('.select-ids-list').val();

        if (checkedRadio.length) {
            var checkedValue = checkedRadio.val();
            $('.submit-import-button').attr('data-selected-data-mapping', checkedValue);
            var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
            var btnEl = collapsedSection.find('.btn-primary');
            collapsedSection.find('.btn-text').text(checkedValue);
            collapsedSection.find('input[name=dataMappingName]').val(checkedValue);
            dataMappingModal.modal('hide');
            if (collapsedSection.find('[name=processType]').val() === 'Import') {
                if ($('.csv-file-input').val() === '' || (selectNodeVal === null || selectNodeVal === '')) {
                    btnEl.addClass('disabled');
                } else {
                    btnEl.removeClass('disabled');
                }
            } else if (collapsedSection.find('[name=processType]').val() === 'Export') {
                if (selectNodeVal === null || selectNodeVal === '') {
                    btnEl.addClass('disabled');
                } else {
                    btnEl.removeClass('disabled');
                }
            }
        } else {
            toast.show(toast.TYPES.ERROR, $('.apply-configuration').attr('data-missing-data'));
        }
    });

    $(document).on('submit', 'form.execute-import-export', function (e) {
        e.preventDefault();
        var form = $(this);
        var formData = new FormData(form[0]);
        var actionUrl = form.attr('action');
        var noRunningProcess = executionList.validateNoRunningProcess();
        if (noRunningProcess) {
            var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
            resetCsvImportExportForm(collapsedSection);
            $('body').spinner().start();

            $.ajax({
                url: actionUrl,
                data: formData,
                type: 'post',
                contentType: false,
                processData: false,
                success: function (response) {
                    $('#execution_history').spinner().stop();
                    var dataTable = $('#execution_history').find('.table');
                    var renderedTemplate = response.renderedTemplate;
                    if (response.success) {
                        if (dataTable.find('tbody tr').length >= 5) {
                            dataTable.find('tbody tr:last').remove();
                        }
                        dataTable.find('tbody').prepend(renderedTemplate);
                    } else {
                        toast.show(toast.TYPES.ERROR, response.errorMessage);
                    }
                    executionList.checkProcessStatus();
                },
                complete: function () {
                    $('body').spinner().stop();
                }
            });
        }
    });
});
