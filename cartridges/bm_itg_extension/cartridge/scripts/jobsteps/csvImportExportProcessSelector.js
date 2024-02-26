'use strict';
var Status = require('dw/system/Status');

/**
 * Selects the Correct Process
 * @param {Object} params - Job params.
 * @returns {dw.system.Status} - Status.
*/
function execute(params) {
    var processMapping = {
        'Customer Import': 'Import_customer',
        'Customer Export': 'Export_customer',
        'Customer Group Import': 'Import_customer_group',
        'Customer Group Export': 'Export_customer_group',
        'PriceBook Import': 'Import_price_book',
        'PriceBook Export': 'Export_price_book',
        'InventoryList Import': 'Import_inventory_list',
        'InventoryList Export': 'Export_inventory_list',
        'Stores Import': 'Import_store',
        'Stores Export': 'Export_store'
    };
    var ProcessType = params.ProcessType;
    var ImpexType = params.ImpexType;
    var targetImpexProcessType = ProcessType + '_' + ImpexType;
    var ImpexProcessType = params.ImpexProcessType;

    if (processMapping[ImpexProcessType] !== targetImpexProcessType) {
        var STATUS = {
            STOP: 'STOP'
        };
        return new Status(Status.OK, STATUS.STOP);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
