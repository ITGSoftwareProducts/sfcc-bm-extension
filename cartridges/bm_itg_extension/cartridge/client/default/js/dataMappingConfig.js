'use strict';

import Sortable from 'sortablejs';
var toast = require('./components/toastNotification');
var formHelpers = require('./components/formHelpers');

// Document ready function to ensure the DOM is fully loaded
$(document).ready(function () {
    /**
     * Update dropdown options based on provided data.
     *
     * @param {jQuery} $dropdown - The dropdown element.
     * @param {Object} dataObjectAttributes - The data object attributes.
     */
    function updateDropdownOptions($dropdown, dataObjectAttributes) {
        $dropdown.empty();
        $('<option>', {
            value: '',
            disabled: true,
            selected: true,
            hidden: true,
            text: 'Select Attribute'
        }).appendTo($dropdown);

        $.each(dataObjectAttributes, function (key, value) {
            $('<option>', {
                value: key,
                text: value.displayName
            }).appendTo($dropdown);
        });
    }

    /**
     * Initialize sortable functionality for a given element.
     *
     * @param {string} elementId - The ID of the element to make sortable.
     */
    function initializeSortable(elementId) {
        var el = document.getElementById(elementId.replace('#', ''));
        Sortable.create(el, {
            handle: '.vdrag-icon',
            animation: 150
        });
    }

    function showMandatoryErrorMsg(response, parent) {
        var missedMandatoryAttributes = response.missedMandatoryAttributes;
        $.each(missedMandatoryAttributes, function (index, errorMessage) {
            parent.find('.error-badge').html(errorMessage);
        });
    }

    $(document).on('click', '.data-mapping-button', function (e) {
        e.preventDefault();
        var url = $(this).data('data-map-url');
        var dataMappingModal = $('#dataMapping');
        var type = 'store';
        if ($('.data-type-select').length > 0) {
            type = $('.csv-section.show .data-type-select').val();
        }
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        var processType = collapsedSection.find('[name=processType]').val();
        var dataMappingName = collapsedSection.find('input[name="dataMappingName"]').val();
        var data = {
            type: type,
            processType: processType
        };

        dataMappingModal.find('.modal-data').html('');
        dataMappingModal.spinner().start();

        $.ajax({
            url: url,
            type: 'get',
            data: data,
            success: function (response) {
                if (response.success) {
                    dataMappingModal.find('.modal-data').html(response.renderedTemplate);
                    if (dataMappingName && $('input[id="' + CSS.escape(dataMappingName)).length > 0) {
                        $('input[id="' + CSS.escape(dataMappingName)).attr('checked', true);
                    }
                    dataMappingModal.spinner().stop();
                } else {
                    dataMappingModal.find('.modal-data').html(response.errorMessage);
                    dataMappingModal.spinner().stop();
                    toast.show(toast.TYPES.ERROR, response.errorMessage);
                }
            }
        });
    });

    $(document).on('click', '.new-mapping-configuration', function (e) {
        e.preventDefault();
        var url = $(this).data('map-configuration-url');
        var type;
        var processType;
        var selectMenuItem = $('.import-export-container').data('select-menu-item');
        var newDataMappingModal = $('#newDataMapping');
        newDataMappingModal.removeClass('edit-modal');
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        if (collapsedSection.length > 0) {
            processType = collapsedSection.find('[name=processType]').val();
            if ($('.csv-section.show .data-type-select').length > 0) {
                type = $('.csv-section.show .data-type-select').val();
            } else {
                type = $('.store-type').data('select-type');
            }
        } else {
            var $dataTypeSelect = $('.data-type-select');
            var $storeType = $('.store-type');
            var dataType = $dataTypeSelect.length > 0 ? $dataTypeSelect.val() : $storeType.data('select-type');
            var mappingType = dataType.split('__');
            type = mappingType[0];
            processType = mappingType[1];
        }

        var data = {
            selectMenuItem: selectMenuItem,
            type: type,
            processType: processType
        };
        newDataMappingModal.spinner().start();

        $.ajax({
            url: url,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    newDataMappingModal.find('.modal-body').html(response.renderedTemplate);
                    var dataObjectAttributes = $('.mapping-table').data('object-attributes');
                    // Update dropdown options
                    updateDropdownOptions(newDataMappingModal.find('.object-attr'), dataObjectAttributes);
                    // Initialize sortable functionality for the mapping table
                    initializeSortable('#mappingTable');
                } else {
                    newDataMappingModal.find('.modal-body').html(response.errorMessage);
                    toast.show(toast.TYPES.ERROR, response.errorMessage);
                }
                newDataMappingModal.spinner().stop();
            }
        });
    });

    $('body').on('click', '.add-button', function (event) {
        event.preventDefault();
        var $newColumn = $('.new-mapping-record').clone(true, true);
        var mappingOptionsCount = $('.new-mapping-record .object-attr option:not(:disabled)').length;
        $newColumn.find('.csv-name').val('');
        $newColumn.find('.object-attr').val('');
        $newColumn.removeClass('new-mapping-record d-none');
        $('.mapping-table-content').append($newColumn);
        if ($('.mapping-table-content .object-attr').length >= mappingOptionsCount) {
            $(this).addClass('disabled');
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

    function checkAllCsvNames() {
        var errorFlag = false;

        $('.mapping-table-content .csv-name').each(function () {
            var csvName = $(this).val();

            if ($.trim(csvName) === '') {
                var msg = $(this).data('missing-error');
                $(this).addClass('is-invalid');
                $(this).closest('.input')
                    .find('.invalid-feedback')
                    .html(msg)
                    .show();
                errorFlag = true;
            }
        });

        return errorFlag;
    }

    $(document).on('submit', 'form.new-configuration-map-form', function (e) {
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');
        var newDataMappingModal = $('#newDataMapping');
        formHelpers.clearFormDataError(newDataMappingModal);
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        var type = 'store';
        var editMode = false;
        if ($('.mapping-table').data('edit-mode')) {
            editMode = true;
        }
        if (collapsedSection.length > 0) {
            if ($('.data-type-select').length > 0) {
                type = $('.csv-section.show .data-type-select').val();
            }
        } else {
            var $dataTypeSelect = $('.data-type-select');
            var $storeType = $('.store-type');
            var dataType = $dataTypeSelect.length > 0 ? $dataTypeSelect.val() : $storeType.data('select-type');
            var mappingType = dataType.split('__');
            type = mappingType[0];
            $(this).find('.mapping-type').val(type);
            var processType = mappingType[1];
            $(this).find('.process-type').val(processType);
        }
        $('.mapping-type').val(type);
        let errorFlag = false;
        if ($('.mapping-table-content .group').length) {
            var selectedAttrs = [];
            var hasDuplicateValues = false;
            $('.mapping-table-content .group').each(function (index, element) {
                var objectAttrVal = $(element).find('.object-attr').val();
                if (selectedAttrs.indexOf(objectAttrVal) !== -1) {
                    hasDuplicateValues = true;
                    errorFlag = true;
                } else {
                    selectedAttrs.push(objectAttrVal);
                }
            });

            errorFlag = errorFlag || checkAllCsvNames();

            if (hasDuplicateValues) {
                var duplicateMessage = $('.error-msg-duplicate-object').val();
                newDataMappingModal.find('.error-badge').html(duplicateMessage);
                newDataMappingModal.find('.error-badge').removeClass('d-none');
            }
        }
        if (!errorFlag) {
            form.spinner().start();
            newDataMappingModal.find('.error-badge').addClass('d-none');
            $.ajax({
                url: url,
                data: form.serialize(),
                type: 'post',
                success: function (response) {
                    if (response.success) {
                        form.spinner().stop();
                        if (!editMode) {
                            var newMappingName = response.responseJSON.newMappingName;
                            var newMappingEl = $('.global-configuration-template .form-check').clone();
                            newMappingEl.data('mapping-id', newMappingName);
                            newMappingEl.find('input[type="radio"]').attr('id', 'inventory-' + newMappingName);
                            newMappingEl.find('input[type="radio"]').val(newMappingName);
                            newMappingEl.find('input[type="radio"]').attr('checked', 'checked');
                            newMappingEl.find('span.saved-configration').text(newMappingName);

                            $('.saved-mapping-config').prepend(newMappingEl);
                        }
                        newDataMappingModal.find('.cancel').trigger('click');
                    } else if (!response.success && response.missedMandatoryIfOtherExist) {
                        form.spinner().stop();
                        formHelpers.loadFormDataError(newDataMappingModal, '.parent-group', response.missedMandatoryIfOtherExist);
                    } else {
                        form.spinner().stop();
                        newDataMappingModal.find('.error-badge').html(response.errorMessage);
                        newDataMappingModal.find('.error-badge').removeClass('d-none');
                        if (response.missedMandatoryAttributes) {
                            showMandatoryErrorMsg(response, newDataMappingModal);
                        }
                    }
                }
            });
        }
    });

    $('body').on('click', '.edit-map', function (e) {
        e.preventDefault();

        var newDataMappingModal = $('#newDataMapping');
        newDataMappingModal.addClass('edit-modal');
        var parent = $(this).closest('.data-mapping-id');
        var mappingId = parent.data('mapping-id');
        var dataObjectAttributes = $('.data-map-button').data('object-attributes');
        var collapsedSection = $('.import-export-wrapper').find('.collapse.show');
        var url = $('.new-mapping-configuration').data('map-configuration-url');
        var type;
        if ($('.csv-section.show .data-type-select').length > 0) {
            type = $('.csv-section.show .data-type-select').val();
        } else if ($('.data-type-select').length > 0) {
            type = $('.data-type-select').val();
        } else {
            type = $('.store-type').data('select-type');
        }
        var mappingType = type.split('__');
        var processType = mappingType[1];
        if (collapsedSection.length && !(processType)) {
            processType = collapsedSection.find('[name=processType]').val();
        }
        var data = {
            editMode: true,
            type: mappingType[0],
            processType: processType,
            mappingId: mappingId
        };

        newDataMappingModal.spinner().start();
        $.ajax({
            url: url,
            data: data,
            type: 'get',
            success: function (response) {
                if (response.success) {
                    newDataMappingModal.find('.modal-body').html(response.renderedTemplate);

                    updateDropdownOptions(newDataMappingModal.find('.object-attributes'), dataObjectAttributes);
                    updateDropdownOptions(newDataMappingModal.find('.object-attr'), dataObjectAttributes);

                    newDataMappingModal.find('.object-attributes').each(function () {
                        var selectedValue = $(this).parent('.selected-object-attr').data('selected-value');
                        $(this).find('option[value="' + selectedValue + '"]').prop('selected', true);
                    });
                    $('.mapping-table').attr('data-edit-mode', true);

                    initializeSortable('#mappingTable');
                }
                newDataMappingModal.spinner().stop();
            }
        });
    });
});
