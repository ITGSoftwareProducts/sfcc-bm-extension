/* eslint-disable radix */
'use strict';

var pagination = function (container, url, options) {
    var noAnimation = options && options.noAnimation;
    if (!noAnimation) {
        $('body').spinner().start();
    }
    $.ajax({
        url: url,
        success: function (response) {
            if (response.success) {
                if (!noAnimation) {
                    window.scrollTo({
                        top: container.offset().top - 100,
                        behavior: 'smooth'
                    });
                }
                container.html(response.renderedTemplate);
                if ($('[data-bs-toggle="tooltip"]').length > 0) {
                    $('[data-bs-toggle="tooltip"]').tooltip();
                }
                $('body').spinner().stop();
            } else {
                container.html(response.errorMessage);
                $('body').spinner().stop();
            }
        }
    });
};

$(document).ready(function () {
    $(document).on('click', '.pagination-button, .next, .previous, .last, .start', function (e, options) {
        e.preventDefault();

        var container = $('.result-table');
        var url = $(this).data('pagination-url');
        pagination(container, url, options);
    });

    $(document).on('change', '.page-input', function (e) {
        e.preventDefault();

        var minValue = 1;
        var maxValue = parseInt($(this).data('page-count'));
        var currentPage = parseInt($(this).data('current-page'));
        let enteredValue = parseInt($(this).val());
        if (enteredValue < minValue || isNaN(enteredValue)) {
            enteredValue = currentPage;
        }
        if (enteredValue > maxValue) {
            enteredValue = maxValue;
        }
        $(this).val(enteredValue);

        var container = $('.result-table');
        var url = $(this).data('pagination-url');
        var pageUrl = url + '&pageNumber=' + $(this).val();
        pagination(container, pageUrl);
    });

    $(document).on('change', '#pageSize', function (e) {
        e.preventDefault();

        var container = $('.result-table');
        var url = $(this).find(':selected').data('pagination-url');
        pagination(container, url);
    });
    $(document).on('keypress', '.page-input', function (e) {
        if (e.which === 13) {  // 13 is the key code for Enter key
            e.preventDefault();
            $(this).trigger('blur');
        }
    });
});
