const ProductInventoryMgr = {
    getInventoryList: () => {
        return {
            getID: () => '1',
            productName: 'Mock Product',
            quantity: 100,
            location: 'Mock Warehouse',
            lastUpdated: '2024-01-31T12:00:00Z'
        };
    },
    getInventoryIntegrationMode: () => {
        return 'OCI_CACHE';
    },
    INTEGRATIONMODE_OCI_CACHE: 'OCI_CACHE',
    INTEGRATIONMODE_OCI: 'OCI_CACHE'
};

module.exports = ProductInventoryMgr;
