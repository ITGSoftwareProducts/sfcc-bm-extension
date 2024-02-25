'use strict';

$(document).ready(function () {
    $('body').on('submit', 'form.customer-productlist-form', function (e) {
        var form = $(this);
        var container = $('.result-table');
        e.preventDefault();
        var url = form.attr('action');
        container.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            data: form.serialize(),
            success: function (response) {
                form.spinner().stop();
                if (response.success) {
                    $('.results .search-result').html(response.renderedTemplate);
                }
            },
            error: function () {
                container.spinner().stop();
            }
        });
    });

    $(document).on('change', '#filterList', function (e) {
        e.preventDefault();
        var container = $('.result-table');
        var $productListForm = $('.customer-productlist-form');
        var actionUrl = $productListForm.attr('action');
        var searchTerm = $productListForm.find('.customer-productlist').data('search-term');
        var productListType = $('.productlist_type').val();
        var productListId = $('.product-list-name').val();
        var data = {
            searchTerm: searchTerm,
            productListType: productListType,
            listId: productListId
        };
        container.spinner().start();
        $.ajax({
            url: actionUrl,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    $('.customer-productlist').html(response.renderedTemplate);
                    container.spinner().stop();
                }
            },
            error: function () {
                container.spinner().stop();
            }
        });
    });
});
