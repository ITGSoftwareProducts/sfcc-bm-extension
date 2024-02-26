const assert = require('chai').assert;


describe('productListHelper', function () {
    const productListHelper = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/productListHelper');

    it('should return the correct product list when listId is provided', function () {
        var productLists = {
            IDs: [{ ID: '1' }, { ID: '2' }, { ID: '3' }],
            iterator: function () {
                var index = 0;
                return {
                    hasNext: function () {
                        return index < productLists.IDs.length;
                    },
                    next: function () {
                        return productLists.IDs[index++];
                    }
                };
            },
            length: 3
        };
        const listId = '2';

        const result = productListHelper.getSelectedProductList(productLists, listId);

        assert.deepEqual(result, { ID: '2' });
    });

    it('should return the first product list when only one list is provided', function () {
        const productLists = [{ ID: '1' }];
        const result = productListHelper.getSelectedProductList(productLists);
        assert.deepEqual(result, { ID: '1' });
    });

    it('should return the first product list when listId is empty', function () {
        const productLists = [{ ID: '1' }, { ID: '2' }, { ID: '3' }];
        const result = productListHelper.getSelectedProductList(productLists, '');
        assert.deepEqual(result, { ID: '1' });
    });
});
