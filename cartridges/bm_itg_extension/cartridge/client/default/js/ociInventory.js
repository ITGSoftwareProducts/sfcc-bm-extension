'use strict';
window.jQuery = window.$ = require('jquery');

var formHelpers = require('./components/formHelpers');
var toast = require('./components/toastNotification');

require('jquery-ui-dist/jquery-ui');
require('jquery-ui-timepicker-addon');

function validateRecordValues(formSelector) {
    var valid = true;
    var formNumberFields = $(formSelector + ' .oci-record input[type="number"]');
    var invalidFields = [];
    formNumberFields.each(function () {
        if ($(this).val() && $(this).val() < 0) {
            valid = false;
            var negativeValueMsg = $(this).data('negative-value-error');
            $(this).parents('.form-group').find('.invalid-feedback').text(negativeValueMsg);
            $(this).parents('.form-group').find('.invalid-feedback').show();
            invalidFields.push($(this)[0].name);
        } else {
            $(this).parents('.form-group').find('.invalid-feedback').text('');
        }
    });

    var mandatoryIfExistFields = $(formSelector + ' .oci-record input[data-mandatory-if-exist]');
    mandatoryIfExistFields.each(function () {
        var mandatoryField = $(this).data('mandatory-if-exist');
        var mandatoryFieldValue = $(formSelector + ' input[name="' + mandatoryField + '"]').val();
        if ($(this).val() === '' && mandatoryFieldValue !== '') {
            valid = false;
            $(this).parents('.form-group').find('.invalid-feedback').text('Please fill out this field.');
            $(this).parents('.form-group').find('.invalid-feedback').show();
        } else if (invalidFields.indexOf($(this)[0].name) < 0) {
            $(this).parents('.form-group').find('.invalid-feedback').text('');
        }
    });
    return valid;
}

$(document).ready(function () {
    $('.futureQtyDate').datetimepicker({
        minDate: 0,
        format: 'm/d/yyyy hh:ii:ss a'
    });

    $('body').on('submit', 'form.oci-record-new', function (e) {
        e.preventDefault();
        var formSelector = '.oci-record-new';
        if (validateRecordValues(formSelector)) {
            var form = $(this);
            var url = form.attr('action');
            $('body').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (response) {
                    if (response.success) {
                        $('#ociNewRecordModal').modal('hide');
                        var newRecordFormFields = $('.oci-record-new input');
                        newRecordFormFields.each(function () {
                            $(this).val('');
                        });
                        form.find('.invalid-feedback').each(function () {
                            $(this).html('');
                        });
                        var activePagination = $('.pagination-button.active');
                        if (activePagination.length > 0) {
                            setTimeout(function () {
                                $('body').spinner().start();
                            }, 200);
                            setTimeout(function () {
                                activePagination.trigger('click', { noAnimation: true });
                            }, 2000);
                        }
                    } else if (response.serverErrors && response.serverErrors.length) {
                        $.each(response.serverErrors, function (index, error) {
                            toast.show(toast.TYPES.ERROR, error);
                        });
                    } else if (response.productErrorMessage) {
                        $('input[name="productId"').parents('.form-group').find('.invalid-feedback').text(response.productErrorMessage);
                        $('input[name="productId"').parents('.form-group').find('.invalid-feedback').show();
                    }
                },
                complete: function () {
                    $('body').spinner().stop();
                }
            });
        }
    });

    $('#ociNewRecordModal').on('hidden.bs.modal', function () {
        var form = $('form.oci-record-new');
        var newRecordFormFields = $('.oci-record-new input');
        newRecordFormFields.each(function () {
            $(this).val('');
            $(this).removeClass('is-invalid');
        });
        form.find('.invalid-feedback').each(function () {
            $(this).html('');
        });
    });

    $('body').on('submit', 'form.oci-record-edit', function (e) {
        e.preventDefault();
        var formSelector = '.oci-record-edit';
        if (validateRecordValues(formSelector)) {
            var form = $(this);
            var url = form.attr('action');
            $('body').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (response) {
                    if (response.serverErrors && response.serverErrors.length) {
                        $.each(response.serverErrors, function (index, error) {
                            toast.show(toast.TYPES.ERROR, error);
                        });
                    }
                },
                complete: function () {
                    $('body').spinner().stop();
                    $('#ociEditRecordModal').modal('hide');
                    var activePagination = $('.pagination-button.active');
                    if (activePagination.length > 0) {
                        $('body').spinner().start();
                        setTimeout(function () {
                            activePagination.trigger('click', { noAnimation: true });
                        }, 2000);
                    }
                }
            });
        }
    });

    $('body').on('submit', 'form.search-oci-inventory-form', function (e) {
        e.preventDefault();
        var form = $(this);

        form.find('#form-search-oci-error').each(function () {
            $(this).html('');
        });

        var url = form.attr('action');
        $('body').spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            data: form.serialize(),
            success: function (response) {
                $('.result-table').html(response.renderedTemplate);
                if (response.success) {
                    $('[data-bs-toggle="tooltip"]').tooltip();
                } else if (response.errorMessage) {
                    $('#form-search-oci-error').html(response.errorMessage);
                    $('#form-search-oci-error').show();
                }
            },
            complete: function () {
                $('body').spinner().stop();
            }
        });
    });

    // Handle the selection of a product-id
    $(document).on('click', '.oci-record-row', function (e) {
        var form = $('.product-inv-list-form');
        e.preventDefault();
        $('body').spinner().start();
        var actionUrl = form.data('action');
        var productId = $(this).closest('tr').data('product-id');
        if (!productId) {
            return;
        }
        $('#ociRecordModal .oci-product-info').empty();
        $('#ociRecordModal .oci-modal-product-id').html(productId);
        $.ajax({
            url: actionUrl,
            data: { productId: productId },
            type: 'get',
            success: function (response) {
                if (response.success) {
                    $('#ociRecordModal .oci-product-info').html(response.renderedTemplate);
                    $('.inventory-locations-list').val(response.inventoryId);
                    if (response.isGroup) {
                        $('.oci-edit-btn').addClass('d-none');
                    } else {
                        $('.oci-edit-btn').removeClass('d-none');
                    }
                } else if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, error) {
                        toast.show(toast.TYPES.ERROR, error);
                    });
                }
            },
            complete: function () {
                $('body').spinner().stop();
            }
        });
    });

    // Handle the selection of a product-id
    $(document).on('change', '.inventory-locations-list', function (e) {
        var form = $('.product-inv-list-form');
        e.preventDefault();
        $('#ociRecordModal .modal-dialog').spinner().start();
        var actionUrl = form.data('action');
        var productId = $('.oci-modal-product-id').text();
        var inventoryId = $('.inventory-locations-list').val();
        if (!productId || !inventoryId) {
            return;
        }
        $('#ociRecordModal .oci-product-info').empty();
        var data = {
            productId: productId,
            inventoryId: inventoryId
        };
        $.ajax({
            url: actionUrl,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    $('#ociRecordModal .oci-product-info').html(response.renderedTemplate);
                    $('.inventory-locations-list').val(response.inventoryId);
                    if (response.isGroup) {
                        $('.oci-edit-btn').addClass('d-none');
                    } else {
                        $('.oci-edit-btn').removeClass('d-none');
                    }
                }
            },
            complete: function () {
                $('#ociRecordModal .modal-dialog').spinner().stop();
            }
        });
    });

    $(document).on('click', 'button.oci-edit-btn', function () {
        var productId = $('.product-content-info').data('product-id');
        var location = $('.inventory-locations-list').val();
        if (!productId || !location) {
            return;
        }

        var ociRecordJson = $('.product-content-info').data('record-json');
        $('.oci-edit-modal-product-id').html(productId);
        var ociEditForm = $('form.oci-record-edit');
        formHelpers.clearPreviousErrors(ociEditForm);

        ociEditForm.find('.invalid-feedback').each(function () {
            $(this).html('');
        });

        ociEditForm.find('[name="productId"]').val(productId);
        ociEditForm.find('[name="location"]').val(location);
        ociEditForm.find('[name="onHandQty"]').val(ociRecordJson.onHand);
        ociEditForm.find('[name="safetyStock"]').val(ociRecordJson.safetyStockCount);
        var futures = ociRecordJson.futures;
        ociEditForm.find('[name="futureQty1"]').val('');
        ociEditForm.find('[name="futureQtyDate1"]').val('');
        ociEditForm.find('[name="futureQty2"]').val('');
        ociEditForm.find('[name="futureQtyDate2"]').val('');
        if (futures && futures.length !== 0) {
            if (futures.length > 0) {
                ociEditForm.find('[name="futureQty1"]').val(futures[0].quantity);
                ociEditForm.find('[name="futureQtyDate1"]').datetimepicker('setDate', futures[0].expectedDate);
                if (futures.length > 1) {
                    ociEditForm.find('[name="futureQty2"]').val(futures[1].quantity);
                    ociEditForm.find('[name="futureQtyDate2"]').datetimepicker('setDate', futures[1].expectedDate);
                }
            }
        }
    });

    $(document).on('click', 'button.add-record-btn', function () {
        formHelpers.clearPreviousErrors($('form.oci-record-new'));
    });

    $(document).on('click', '.delete-icon', function () {
        const dateTimeInput = $(this).parents('.futureQtyDate-container').find('.futureQtyDate');
        dateTimeInput.datetimepicker('setDate', null);
    });
});
