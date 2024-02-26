'use strict';
/**
 * Retrieves the selected product list from a collection of product lists based on the provided list ID.
 *
 * @param {Array} productLists - An array or collection of product lists.
 * @param {string} listId - The ID of the desired product list.
 * @returns {Object} - The selected product list. If no match is found, returns the first product list.
 */
function getSelectedProductList(productLists, listId) {
    var productList = productLists;
    if (productLists.length > 1 && !empty(listId)) {
        var iterator = productLists.iterator();
        while (iterator.hasNext()) {
            productList = iterator.next();
            if (productList.ID === listId) {
                break;
            }
        }
    } else if (productLists.length === 1 || empty(listId)) {
        productList = productLists[0];
    }
    return productList;
}

exports.getSelectedProductList = getSelectedProductList;
