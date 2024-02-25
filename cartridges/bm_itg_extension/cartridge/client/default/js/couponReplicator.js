'use strict';
var executionList = require('./executionList');
// var formValidation = require('../components/formValidation');
var toast = require('./components/toastNotification');


// Document ready function to ensure the DOM is fully loaded
$(document).ready(function () {
    $('form.search-coupon').on('submit', function (e) {
        var form = $(this);
        e.preventDefault();

        var actionUrl = form.attr('action');
        $('body').spinner().start();

        $.ajax({
            url: actionUrl,
            data: form.serialize(),
            type: 'get',
            success: function (response) {
                form.spinner().stop();
                var couponTable = $('.coupon-list-table');
                if (response.success) {
                    couponTable.html(response.renderedTemplate);
                } else if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, error) {
                        toast.show(toast.TYPES.ERROR, error);
                    });
                }
                $('#nav-coupons-tab').tab('show');
            },
            error: function () {
                $('body').spinner().stop();
            }
        });
    });

    // Handle the selection of a coupon
    $(document).on('click', '.select-coupon', function (e) {
        var form = $('.coupon-list-form');
        e.preventDefault();
        $('body').spinner().start();
        var actionUrl = form.data('action-url');
        var data = $(this).closest('.coupon-item').data('coupon-json');
        if (!data) {
            return;
        }
        $('#replicate-coupon-modal .modal-body').empty();
        $.ajax({
            url: actionUrl,
            data: data,
            type: 'get',
            success: function (response) {
                $('body').spinner().stop();
                if (response.success) {
                    $('#replicate-coupon-modal .modal-body').html(response.renderedTemplate);
                    const hasActiveSite = !!$('#replicate-coupon-modal .site-name .site-id:not(.disable)').length;
                    if (!hasActiveSite) {
                        $('#replicate-coupon-modal .replication-coupon').addClass('disabled');
                    }
                    if ($('#replicate-coupon-modal .site-name .site-id:checked').length === 0) {
                        $('#replicate-coupon-modal .replication-coupon').addClass('disabled');
                    }
                } else if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, element) {
                        toast.show(toast.TYPES.ERROR, element);
                    });
                }
            },
            error: function () {
                $('body').spinner().stop();
            }
        });
    });

    const replicationCallback = function () {
        $('#replicate-coupon-modal').modal('hide');

        const replicationTab = new bootstrap.Tab('#nav-replications-tab'); // eslint-disable-line
        replicationTab.show();
    };

    // Replicate a coupon to selected sites
    $(document).on('click', '.replication-coupon', function (e) {
        e.preventDefault();

        var $couponForm = $('.replication-coupon-form');
        var caseInsensitive = $couponForm.data('case-insensitive');
        var multipleCodesPerBasket = $couponForm.data('multiple-codes');
        var couponType = $couponForm.data('coupon-type');
        var actionUrl = $couponForm.data('action-url');
        var couponId = $couponForm.data('coupon-id');
        var couponDescription = $couponForm.data('coupon-description');
        var siteIds = $('.site-id.selected');
        var siteIdsArray = [];

        for (var i = 0; i < siteIds.length; i++) {
            siteIdsArray.push($(siteIds[i]).val());
        }

        var data = {
            couponId: couponId,
            siteIdsArray: JSON.stringify(siteIdsArray),
            caseInsensitive: caseInsensitive,
            multipleCodesPerBasket: multipleCodesPerBasket,
            couponType: couponType,
            couponDescription: couponDescription
        };
        var noRunningProcess = executionList.validateNoRunningProcess();
        if (noRunningProcess) {
            $('#execution_history').spinner().start();
            $.ajax({
                url: actionUrl,
                data: data,
                type: 'post',
                success: function (response) {
                    $('#execution_history').spinner().stop();
                    var dataTable = $('#execution_history').find('.table');
                    var renderedTemplate = response.renderedTemplate;
                    if (response.success) {
                        if (dataTable.find('tbody tr').length >= 5) {
                            dataTable.find('tbody tr:last').remove();
                        }
                        dataTable.find('tbody').prepend(renderedTemplate);
                        executionList.checkProcessStatus();
                    } else if (response.serverErrors && response.serverErrors.length) {
                        $.each(response.serverErrors, function (index, element) {
                            toast.show(toast.TYPES.ERROR, element);
                        });
                    }
                    replicationCallback();
                },
                error: function () {
                    $('#execution_history').spinner().stop();
                }
            });
        }
    });

    // Add 'selected' class to site IDs when clicked
    $('body').on('click', '.site-id', function () {
        $(this).toggleClass('selected');
        $('#replicate-coupon-modal .replication-coupon').toggleClass('disabled', !$(this).closest('.items').find('.site-id:checked').length);
    });

    // Handle sorting columns by coupon ID, description, type, and enable status
    $(document).on('click', '.coupon-id-column, .coupon-description-column, .coupon-type-column, .coupon-enable-column', function (e) {
        e.preventDefault();

        var $couponForm = $('.search-coupon');
        var actionUrl = $couponForm.attr('action');
        var couponTable = $('.coupon-table');
        var couponId = couponTable.data('coupon-id');
        var pageSize = $('#pageSize');
        var count = pageSize.find(':selected').val();

        var sortRule = 'asc';
        if (couponTable.hasClass('sorting')) {
            sortRule = couponTable.data('sort-rule') === 'asc' ? 'desc' : 'asc';
        }

        var data = {
            couponSearchTerm: couponId,
            count: count,
            sortRule: sortRule,
            sortBy: $(this).data('sort-type')
        };
        $('.coupon-list-table').spinner().start();
        $.ajax({
            url: actionUrl,
            data: data,
            type: 'get',
            success: function (response) {
                $('.coupon-list-table').spinner().stop();
                if (response.success) {
                    $('.coupon-list-table').html(response.renderedTemplate);
                } else if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, element) {
                        toast.show(toast.TYPES.ERROR, element);
                    });
                }
            },
            error: function () {
                $('.coupon-list-table').spinner().stop();
            }
        });
    });
});
