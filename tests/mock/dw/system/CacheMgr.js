'use strict';

module.exports = {
    caches: [
        {
            id: 'UnlimitedTestCache'
        },
        {
            id: 'TestCacheWithExpiration',
            expireAfterSeconds: 10
        }
    ],
    getCache: function () {
        return {
            get: function (key, loader) {
                return loader();
            },
            invalidate: function (key) {
                return `Invalidate Cache value: ${key}`;
            }

        };
    }
};
