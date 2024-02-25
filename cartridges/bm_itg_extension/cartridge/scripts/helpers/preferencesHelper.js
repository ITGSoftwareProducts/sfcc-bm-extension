'use strict';
var Site = require('dw/system/Site');
var constants = require('~/cartridge/scripts/helpers/constants');


/**
 * Gets the custom preference attribute definitions
 * @returns {Array} - Array of attribute ID
 */
function getPreferenceAttributes() {
    var customPreferences = Site.getCurrent() ? Site.getCurrent().getPreferences().describe() : null;
    var attributesObj = {};
    var attributeGroups;
    var iterator;
    if (customPreferences.attributeGroups && !customPreferences.attributeGroups.isEmpty()) {
        iterator = customPreferences.attributeGroups.iterator();
        while (iterator.hasNext()) {
            attributeGroups = iterator.next();
            if (attributeGroups.ID === constants.GLOBAL.BM_EXTENSION.ATTRIBUTE_GROUP) {
                var attributeDefinistions = attributeGroups.attributeDefinitions;
                if (!attributeDefinistions.isEmpty()) {
                    var attributeDefinistionsIterator = attributeGroups.attributeDefinitions.iterator();
                    var attribute;
                    while (attributeDefinistionsIterator.hasNext()) {
                        attribute = attributeDefinistionsIterator.next();
                        Site.getCurrent().getCustomPreferenceValue(attribute.ID);
                        attributesObj[attribute.ID] = Site.getCurrent().getCustomPreferenceValue(attribute.ID);
                    }
                }
                break;
            }
        }
    }
    return attributesObj;
}

/**
 * Retrieves the value of a preference based on the provided key from the given attributes object.
 *
 * @param {string} key - The key of the preference to retrieve.
 * @param {Object} attributesObj - The object containing preference attributes.
 * @returns {string} - The value associated with the specified key in the attributes object, or null if the key is not found.
 */
function getPreferenceValue(key, attributesObj) {
    var customPreferenceValue = null;
    if (key in attributesObj) {
        customPreferenceValue = attributesObj[key] || '';
    }
    return customPreferenceValue;
}

function convertToPrefValue(value) {
    switch (value.toLowerCase()) {
        case 'true':
        case 'yes':
            return true;
        case 'false':
        case 'no':
            return false;
        default:
            return value;
    }
}

/**
 * Sets the custom preference value for a specified key on the current site.
 *
 * @param {string} key - The key of the custom preference.
 * @param {string} val - The value to set for the custom preference. Should be a JSON string.
 */
function setPreferenceValue(key, val) {
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
        var value = convertToPrefValue(val);
        Site.getCurrent().setCustomPreferenceValue(key, value);
    });
}


module.exports = {
    getPreferenceValue: getPreferenceValue,
    setPreferenceValue: setPreferenceValue,
    getPreferenceAttributes: getPreferenceAttributes
};
