'use strict';
var toast = require('./components/toastNotification');

// Document ready function to ensure the DOM is fully loaded
$(document).ready(function () {
    $('body').on('input', '.preferences-data', function () {
        var isAnySelectChanged = false;

        // eslint-disable-next-line consistent-return
        $('.preferences-data').each(function () {
            if ($(this).val() !== '') {
                isAnySelectChanged = true;
                return false;
            }
        });

        $('.configuration__header button').prop('disabled', !isAnySelectChanged);
    });

    $('body').on('click', '.show-data-mapping', function (e) {
        e.preventDefault();
        var dataMappingModal = $('#dataMapping');
        var type = $('.data-type-select').length > 0 ? $('.data-type-select').val() : 'store';
        var mappingType = type.split('__');
        var url = $(this).data('mapping-url');
        var data = {
            type: mappingType[0],
            processType: mappingType[1],
            editMode: true
        };
        dataMappingModal.spinner().start();
        $.ajax({
            url: url,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    // Update modal content with the rendered template
                    dataMappingModal.find('.modal-data').html(response.renderedTemplate);
                    dataMappingModal.spinner().stop();
                }
            }
        });
    });

    $('body').on('click', '.delete-map', function () {
        var row = $(this).closest('.form-check');
        row.find('.delete-map-wrapper').show().animate({ width: '100%' }).addClass('shown');
    });

    $('body').on('click', '.delete-map-wrapper .no', function () {
        var row = $(this).closest('.form-check');

        row.find('.delete-map-wrapper').removeClass('shown').animate({ width: '0' }, function () {
            $(this).hide();
        });
    });

    $('body').on('click', '.delete-map-confirmation', function (e) {
        e.preventDefault();

        var dataMappingSection = $('.data-mapping-section');
        var url = dataMappingSection.data('delete-data-map-url');
        var dataMappingModal = $('#dataMapping');
        var type = $('.data-type-select').length > 0 ? $('.data-type-select').val() : 'store';
        var mappingType = type.split('__');

        var mappingId = $(this).closest('.data-mapping-id').data('mapping-id');

        var data = {
            type: mappingType[0],
            processType: mappingType[1],
            editMode: true,
            mappingId: mappingId
        };

        dataMappingModal.spinner().start();
        $.ajax({
            url: url,
            data: data,
            type: 'post',
            success: function (response) {
                if (response.success) {
                    $(this).closest('.data-mapping-id').remove();
                    dataMappingModal.spinner().stop();
                }
            }.bind(this)
        });
    });

    $('body').on('click', '.close-configuration', function () {
        var dataMappingModal = $('#dataMapping');
        dataMappingModal.modal('hide');
    });

    $(document).on('submit', 'form.configration-form', function (e) {
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');
        form.spinner().start();

        $.ajax({
            url: url,
            data: form.serialize(),
            type: 'post',
            success: function (response) {
                if (response.success) {
                    form.spinner().stop();
                    $('.configuration__header  button').attr('disabled', true);
                } else if (response.errorMessage) {
                    // eslint-disable-next-line no-console
                    console.log(response.errorMessage);
                }
            },
            error: function () {
                form.spinner().stop();
            }
        });
    });

    $('body').on('change', '.data-type-select', function () {
        if ($('.show-data-mapping').prop('disabled')) {
            $('.show-data-mapping').removeAttr('disabled');
        }
    });

    /**
     * Synchronize the locations Impex file with the latest locations and groups of the current organization.
     *
     * @param {string} exportId - Export ID.
     */
    function syncLocationsAndGroups(exportId) {
        var url = $('.sync-locations-section').data('sync-locations-url');
        var loadingMessage = $('.sync-locations-section').data('loading-message');
        $('.sync-locations-section').spinner().start(loadingMessage);
        var data = {};
        data.exportId = exportId || '';
        $.ajax({
            url: url,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    if (response.responseJSON) {
                        if (response.responseJSON.exportCompleted) {
                            $('.sync-locations-section').spinner().stop();
                            $('.last-locations-sync .value').text(response.responseJSON.locationsDownloadTime);
                        } else if (response.responseJSON.exportId) {
                            setTimeout(function () { $('.sync-locations-section').spinner().stop(); syncLocationsAndGroups(response.responseJSON.exportId); }, 10000);
                        }
                    }
                } else {
                    if (response.serverErrors && response.serverErrors.length) {
                        $.each(response.serverErrors, function (index, error) {
                            toast.show(toast.TYPES.ERROR, error);
                        });
                    }
                    $('.sync-locations-section').spinner().stop();
                }
            },
            error: function () {
                $('.sync-locations-section').spinner().stop();
            }
        });
    }
    $(document).on('click', '.sync-locations-groups', function (e) {
        e.preventDefault();
        syncLocationsAndGroups();
    });
});
