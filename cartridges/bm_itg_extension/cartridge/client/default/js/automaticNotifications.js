/* eslint-disable require-jsdoc */
'use strict';

var toast = require('./components/toastNotification');

$(document).ready(function () {
    var onloadErrorMsgs = $('.invalid-feedback.display-error-msg, .warning-feedback.display-error-msg');
    if (onloadErrorMsgs && onloadErrorMsgs.length) {
        onloadErrorMsgs.each(function () {
            $(this).show();
        });
    }

    function validateEmail(emailValue) {
        // eslint-disable-next-line no-useless-escape
        var emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegEx.test(emailValue);
    }

    function validateSenderEmail(senderEmail) {
        const senderEmailVal = senderEmail.val();
        const senderEmailContainer = $(senderEmail).parent();
        senderEmailContainer.removeClass('has-error');
        senderEmailContainer.find('.invalid-feedback').hide();
        if (!validateEmail($.trim(senderEmailVal)) || $.trim(senderEmailVal) === '') {
            senderEmailContainer.addClass('has-error');
            senderEmailContainer.find('.invalid-feedback').show();
            return false;
        }
        return true;
    }

    function validateRecipientEmails($form, recipientEmails) {
        if (!recipientEmails.length) {
            $form.find('.recipient-emails-form').addClass('has-error');
            $form.find('.recipient-emails-form .invalid-feedback').show();
        }

        if (!validateSenderEmail($('input#senderEmail')) || $form.find('.form-group').hasClass('has-error')) {
            window.scrollTo({
                top: $('.invalid-feedback:visible:first').parent().find('input').offset().top - 100,
                behavior: 'smooth'
            });
            $('.invalid-feedback:visible:first').parent().find('input').focus();
            return false;
        }
        return true;
    }

    function clearFormErrors($form) {
        $form.find('.form-group').removeClass('has-error');
        $form.find('.invalid-feedback').hide();
        $form.find('.warning-feedback').hide();
    }

    function showCampainErrorMsg(resp) {
        var faultyCampaigns = resp.faultyCampaigns;
        var faultyCampaignsMap = {};
        $.each(faultyCampaigns, function (_, obj) {
            faultyCampaignsMap[obj.campaignId] = obj.msg;
        });
        $('.campaign-list .campaign').each(function () {
            var currentCampainId = $(this).find('input#campaignId').val();
            var invalidFeedback = $(this).find('.invalid-feedback');
            if (currentCampainId in faultyCampaignsMap && faultyCampaignsMap[currentCampainId]) {
                invalidFeedback.html(faultyCampaignsMap[currentCampainId]);
                invalidFeedback.show();
            } else {
                invalidFeedback.hide();
                invalidFeedback.html(resp.mainErrorMsg);
            }
        });
    }

    function showCampaginWarningMsg(resp) {
        var warningCampaigns = resp.warningCampaigns;
        var warningCampaignsMap = {};
        $.each(warningCampaigns, function (_, obj) {
            warningCampaignsMap[obj.campaignId] = obj.msg;
        });
        $('.campaign-list .campaign').each(function () {
            var currentCampainId = $(this).find('input#campaignId').val();
            var warningFeedback = $(this).find('.warning-feedback');
            if (currentCampainId in warningCampaignsMap && warningCampaignsMap[currentCampainId]) {
                warningFeedback.html(warningCampaignsMap[currentCampainId]);
                warningFeedback.show();
            }
        });
    }

    $('#saveOOSNotificationSettings').on('click', function (e) {
        e.preventDefault();
        var $form = $('form.oos-notification');
        var recipientEmails = [];
        var products = [];

        $form.find('.recipient-emails-form .list-item').each(function () {
            recipientEmails.push($(this).find('.value').text());
        });
        $form.find('.oos-notification-product-ids .list-item').each(function () {
            products.push($(this).find('.value').text());
        });


        clearFormErrors($form);
        if (!validateRecipientEmails($form, recipientEmails)) return;

        var data = {
            recipientEmails: recipientEmails,
            products: products
        };

        clearFormErrors($form);
        $form.spinner().start();

        $.ajax({
            url: $form.attr('action'),
            data: { data: JSON.stringify(data) },
            type: 'post',
            success: function (resp) {
                if (resp && resp.success) {
                    $('.oos-error-msg').html('');
                } else if (resp.errorMsg) {
                    $('.oos-error-msg').html(resp.errorMsg);
                    $('.oos-error-msg').show();
                    toast.show(toast.TYPES.ERROR, resp.errorMsg);
                }
                $form.spinner().stop();
            }
        });
    });

    $('#saveOrderIntervalAlertSettings').on('click', function (e) {
        e.preventDefault();
        var $form = $('form.order-interval-alert');

        var recipientEmails = [];
        $form.find('.list-item').each(function () {
            recipientEmails.push($(this).find('.value').text());
        });

        clearFormErrors($form);
        if (!validateRecipientEmails($form, recipientEmails)) return;

        var interval = {
            days: $form.find('input#days').val() || 0,
            hours: $form.find('input#hours').val() || 0,
            minutes: $form.find('input#minutes').val() || 0
        };

        var data = {
            recipientEmails: recipientEmails,
            interval: interval
        };

        clearFormErrors($form);
        $form.spinner().start();
        $.ajax({
            url: $form.attr('action'),
            data: { data: JSON.stringify(data) },
            type: 'post',
            success: function (resp) {
                if (resp && resp.success) {
                    $form.find('.order-interval-alert').empty();
                    if (resp.orderIntervalValue !== '') {
                        $form.find('.order-interval-alert').append('<span class="order-interval-value d-flex align-items-center">' + resp.orderIntervalValue + '<span>');
                        $('.order-interval-alert').removeClass('d-none');
                    }
                } else if (resp.errorMsg) {
                    $('.order-interval-error-msg').html(resp.errorMsg);
                    $('.order-interval-error-msg').show();
                    toast.show(toast.TYPES.ERROR, resp.errorMsg);
                }
                $form.spinner().stop();
            }
        });
    });

    $('#saveFailedOrderAlertSettings').on('click', function (e) {
        e.preventDefault();
        var $form = $('form.failed-order-alert');
        var countThreshold = $form.find('input#countThreshold').val();

        var recipientEmails = [];
        $form.find('.list-item').each(function () {
            recipientEmails.push($(this).find('.value').text());
        });

        clearFormErrors($form);
        if (!validateRecipientEmails($form, recipientEmails)) return;

        var interval = {};
        interval.days = $form.find('input#failedDays').val() || 0;
        interval.hours = $form.find('input#failedHours').val() || 0;
        interval.minutes = $form.find('input#failedMinutes').val() || 0;

        var data = {
            recipientEmails: recipientEmails,
            interval: interval,
            countThreshold: countThreshold
        };

        // Validate countThreshold input
        var countThresholdValue = $('#countThreshold').val();
        if ($.trim(countThresholdValue) === '') {
            $('#countThreshold').addClass('is-invalid');
            $('.failed-order-alert-threshold .invalid-feedback').show();
            return;
        }

        clearFormErrors($form);
        $form.spinner().start();

        $.ajax({
            url: $('form.failed-order-alert').attr('action'),
            data: { data: JSON.stringify(data) },
            type: 'post',
            success: function (resp) {
                if (resp && resp.success) {
                    $form.find('.order-interval-alert').empty();
                    if (resp.orderIntervalValue !== '') {
                        $form.find('.order-interval-alert').append('<span class="order-interval-value d-flex align-items-center">' + resp.orderIntervalValue + '<span>');
                        $('.order-interval-alert').removeClass('d-none');
                    }
                } else if (resp.errorMsg) {
                    $('.failed-order-error-msg').html(resp.errorMsg);
                    $('.failed-order-error-msg').show();
                    toast.show(toast.TYPES.ERROR, resp.errorMsg);
                }
                $form.spinner().stop();
            }
        });
    });

    $('#saveCampaignNotificationSettings').on('click', function (e) {
        e.preventDefault();
        $('.suggestion-list').empty();
        var $form = $('form.content-notification');
        var recipientEmails = [];
        $form.find('.list-item').each(function () {
            recipientEmails.push($(this).find('.value').text());
        });
        var campaignRecords = [];
        $('.campaign-list .campaign').each(function () {
            var campaignRecord = {};
            campaignRecord.campaignId = $(this).find('input#campaignId').val();
            if ($.trim($(this).find('input[name="days"]').val()) !== '' || $.trim($(this).find('input[name="hours"]').val()) !== '' || $.trim($(this).find('input[name="minutes"]').val()) !== '') {
                if (campaignRecord.campaignId === '') {
                    $(this).remove();
                    return;
                }
            }
            campaignRecord.days = $(this).find('input[name="days"]').val() || 0;
            campaignRecord.hours = $(this).find('input[name="hours"]').val() || 0;
            campaignRecord.minutes = $(this).find('input[name="minutes"]').val() || 0;
            campaignRecords.push(campaignRecord);
        });

        clearFormErrors($form);
        if (!validateRecipientEmails($form, recipientEmails)) return;


        var data = {
            recipientEmails: recipientEmails,
            campaignRecords: campaignRecords
        };

        clearFormErrors($form);
        $form.spinner().start();
        $.ajax({
            url: $form.attr('action'),
            data: { data: JSON.stringify(data) },
            type: 'post',
            success: function (resp) {
                if (resp && resp.success) {
                    $('.campaign-error-msg').html('');
                    if (resp.warningCampaigns) {
                        showCampaginWarningMsg(resp);
                    }
                } else if (resp.faultyCampaigns) {
                    showCampainErrorMsg(resp);
                    var toastError;
                    if (resp.errorMsg) {
                        toastError = resp.errorMsg;
                    }
                    toast.show(toast.TYPES.ERROR, toastError);
                }
                $form.spinner().stop();
            }
        });
    });

    $('body').on('change', '.automatic-notification-toggle input', function () {
        const notificationRightSection = $(this).parents('form').find('.notification-form');
        const $form = $(this).parents('form');
        const senderEmailContainer = $('input#senderEmail').parent();
        if ($(this).prop('checked')) {
            notificationRightSection.removeClass('disabled');
            notificationRightSection.find('button').removeClass('disabled');
            notificationRightSection.find('input').prop('disabled', false);
        } else {
            notificationRightSection.addClass('disabled');
            notificationRightSection.find('button').addClass('disabled');
            notificationRightSection.find('input').prop('disabled', true);
            senderEmailContainer.removeClass('has-error');
            senderEmailContainer.find('.invalid-feedback').hide();
            clearFormErrors($form);
        }
    });

    $('.notification-modal').on('hidden.bs.modal', function () {
        $('.list-container').removeClass('current-list-container');
    });

    $('.recipient-emails-input, #productIDs').on('keypress', function (e) {
        const key = e.which;
        const input = $(this);
        const inputValue = $(this).val();
        const parentElement = $(this).parent();
        const itemContainer = parentElement.find('.list-container');
        const itemList = parentElement.find('.list');
        const modalTarget = input.hasClass('recipient-emails-input') ? '#recipientEmailsModal' : '#productsIdsModal';
        const maxNo = input.hasClass('recipient-emails-input') ? 3 : 4;

        if (key === 13) {
            e.preventDefault();
            if ($.trim(inputValue) !== '') {
                const newItemValues = inputValue.split(/,| /).map((item) => item.trim()).filter(Boolean);
                input.val('');
                parentElement.find('.invalid-feedback').hide();
                parentElement.removeClass('has-error');

                // eslint-disable-next-line consistent-return
                $.each(newItemValues, function (_, newItemValue) {
                    if (input.hasClass('recipient-emails-input') && !validateEmail(newItemValue.trim())) {
                        parentElement.addClass('has-error');
                        parentElement.find('.invalid-feedback').show();
                        return false;
                    }
                    const emails = [];
                    // eslint-disable-next-line no-shadow
                    $('.list-item', parentElement).each((_, element) => {
                        emails.push(`${$(element).data('value')}`);
                    });
                    if (emails.includes(newItemValue)) {
                        return true;
                    }
                    const listItem = '<div class="list-item bg-slate-3 rounded-2 d-inline-flex justify-content-center align-items-center me-2 mt-2" data-value="' + newItemValue + '"><span class="value text-sm">' + newItemValue + '</span><span class="remove-item"></span></div>';
                    const count = itemContainer.find('.list-item').length - (maxNo - 1);

                    if (itemContainer.find('.list-item').length < maxNo) {
                        itemList.append(listItem);
                    } else {
                        const parsedElement = $(listItem);
                        parsedElement.addClass('d-none');
                        itemContainer.find('.list').append(parsedElement);
                    }

                    parentElement.find('.list-count').text(count);

                    if (itemContainer.find('.list-item').length === (maxNo + 1) && itemContainer.find('.btn-more').length === 0) {
                        itemContainer.append('<button type="button" class="btn btn-link btn-more text-lowercase small" data-bs-toggle="modal" data-bs-target="' + modalTarget + '"><span class="list-count pe-1"> ' + count + ' </span> more</button>');
                    }
                });
            }
        }
    });

    $('body').on('click', '.btn-more', function () {
        $(this).parent().addClass('current-list-container');
        const modalId = $(this).attr('data-bs-target');
        var listContent = $(this).parent('.current-list-container').find('.list').clone();
        listContent.find('.list-item.d-none').removeClass('d-none');
        $(modalId).find('.modal-body .list-container').html(listContent);
        const productCount = $(modalId).find('.modal-body .list-container .list-item').length;
        $('.product-id-count').text(productCount);
    });

    $('body').on('input', '#productSearch', function () {
        var searchTerm = $(this).val().toLowerCase();
        const products = $(this).parents('.modal-body').find('.list-item');
        products.each(function () {
            const content = $(this).text().toLowerCase();
            if (content.includes(searchTerm)) {
                $(this).removeClass('d-none');
            } else {
                $(this).addClass('d-none');
            }
        });
    });

    $('body').on('click', '.remove-item', function () {
        const $parent = $(this).parent();
        const listValue = $parent.attr('data-value');
        const listItem = $parent.parent();
        const listContainer = listItem.parent();
        const maxNo = listContainer.hasClass('emails-list') ? 3 : 4;
        const count = $('#productsIdsModal .modal-body .list-container .list-item').length - 1;
        var isHiddenItem = true;

        $('.product-id-count').text(count);

        listItem.find('.list-item[data-value="' + listValue + '"]').remove();
        if ($('.modal.show').length) {
            const removedItem = $('.current-list-container').find('.list-item[data-value="' + listValue + '"]');
            removedItem.remove();
            if (removedItem.hasClass('d-none')) isHiddenItem = false;
        } else {
            listContainer.addClass('current-list-container');
        }

        const btnMore = $('.current-list-container').find('.btn-more');
        const firstHiddenListItem = $('.current-list-container').find('.d-none:first');

        if (btnMore.length) {
            const listCount = $('.current-list-container').find('.list-count');
            if (listContainer.find('.list-item').length <= maxNo) {
                btnMore.remove();
            } else {
                listCount.text(parseInt(listCount.text(), 10) - 1);
            }
        }

        if (listContainer.find('.list-item').length > (maxNo - 1) && isHiddenItem) {
            firstHiddenListItem.removeClass('d-none');
        }

        if (!$('.modal.show').length) listContainer.removeClass('current-list-container');
    });

    $('.add-button').on('click', function () {
        $('.campaign-list').append($('.campaign-record').html());
    });

    $('body').on('click', '.remove-button', function () {
        var campaignRecord = $(this).parent();
        campaignRecord.remove();
    });

    $(document).on('input', 'input[name="days"]', function () {
        const minValue = 0;
        const maxValue = 99;
        // eslint-disable-next-line radix
        let enteredValue = parseInt($(this).val());
        if (enteredValue < minValue || isNaN(enteredValue)) {
            enteredValue = '';
        }
        if (enteredValue > maxValue) {
            enteredValue = maxValue;
        }
        $(this).val(enteredValue);
    });


    function displaySuggestions(suggestionList, suggestions) {
        suggestionList.empty();
        suggestions.forEach(function (suggestion) {
            suggestionList.append('<li class="suggestion-list-item p-3" data-suggestion-id="' + suggestion.campaignId + '"><div class="campaign-id">' + suggestion.campaignId + '</div><div class="expire-date">' + suggestionList.data('expiry-date-prefix') + ' ' + suggestion.campaignEndDate + '</div></li>');
        });
    }

    $('body').on('mousedown', '.suggestion-list li', function () {
        const inputValue = $(this).data('suggestion-id');
        const correspondingInput = $(this).parents('.content-notification-campaign').find('input');
        correspondingInput.val(inputValue);
        $(this).parent().empty();
    });

    $('body').on('focusout', 'input[name="campaignId"]', function () {
        const suggestionList = $(this).parent().find('.suggestion-list');
        suggestionList.empty();
    });

    $('body').on('input', 'input[name="campaignId"]', function () {
        var campaignSuggestionsURL = $('#campaignSuggestionsURL').val();
        const suggestionList = $(this).parent().find('.suggestion-list');
        var searchPhrase = $(this).val().trim();
        if (searchPhrase && searchPhrase !== '') {
            suggestionList.empty();
            $.ajax({
                url: campaignSuggestionsURL,
                data: { searchPhrase: searchPhrase },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.success) {
                        var campaignDetails = resp.campaignDetails;
                        displaySuggestions(suggestionList, campaignDetails);
                    } else if (resp.serverErrors && resp.serverErrors.length) {
                        $.each(resp.serverErrors, function (_, error) {
                            toast.show(toast.TYPES.ERROR, error);
                        });
                    }
                }
            });
        }
    });

    $('input[name="enableFeature"]').on('change', function () {
        var enablementURL = $('#enablementURL').val();
        var enabled = $(this)[0].checked;
        var prefId = $(this).data('pref-id');
        const $form = $(this).parents('form');
        $form.spinner().start();
        var data = {
            enabled: enabled,
            prefId: prefId
        };
        $.ajax({
            url: enablementURL,
            data: { data: JSON.stringify(data) },
            type: 'post',
            complete: function () {
                $form.spinner().stop();
            }
        });
    });
    $('#senderEmail').on('blur', function () {
        if (validateSenderEmail($('input#senderEmail'))) {
            var url = $(this).closest('.sender-email').data('save-sender-email-url');
            var data = {};
            var customObjectIds = $(this).closest('.sender-email').data('custom-object');
            data.customObjectIds = JSON.stringify(customObjectIds.split('__'));
            data.senderEmail = $(this).val();
            $.ajax({
                url: url,
                data: data,
                type: 'post'
            });
        }
    });
});
