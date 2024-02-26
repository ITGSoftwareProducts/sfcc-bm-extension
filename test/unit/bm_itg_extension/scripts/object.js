'use strict';
const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const HashMap = require('../../../mock/dw/util/HashMap');

describe('object', function () {
    const object = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/scripts/object', {
        'dw/util/HashMap': HashMap
    });

    it('should extend the target object with properties from the source object', function () {
        const target = { a: 1 };
        const source = { b: 2 };

        const result = object.extend(target, source);

        assert.deepEqual(result, { a: 1, b: 2 });
    });

    it('should return the source object if the target is not provided', function () {
        const source = { a: 1, b: 2 };

        const result = object.extend(null, source);

        assert.deepEqual(result, { a: 1, b: 2 });
    });

    it('should recursively extend the target object for non-API objects', function () {
        const target = { a: { b: 1 } };
        const source = { a: { c: 2 } };

        const result = object.extend(target, source);

        assert.deepEqual(result, { a: { b: 1, c: 2 } });
    });

    it('should return undefined if the nested property does not exist', function () {
        const objects = {
            a: {
                b: {
                    c: 42
                }
            }
        };
        const propertyString = 'a.b.d';

        const result = object.resolve(objects, propertyString);

        assert.strictEqual(result, undefined);
    });

    it('should handle property strings with single property', function () {
        const objects = {
            a: 10
        };
        const propertyString = 'a';

        const result = object.resolve(objects, propertyString);

        assert.strictEqual(result, 10);
    });

    it('should return an empty array for null input', function () {
        const result = object.values(null);

        assert.deepEqual(result, []);
    });

    it('should return an empty array for undefined input', function () {
        const result = object.values(undefined);

        assert.deepEqual(result, []);
    });

    it('should return an array of values for a non-empty object', function () {
        const input = {
            a: 1,
            b: 'hello',
            c: [1, 2, 3]
        };

        const result = object.values(input);

        assert.deepEqual(result, [1, 'hello', [1, 2, 3]]);
    });

    it('should return an empty array for null input', function () {
        const result = object.keys(null);

        assert.deepEqual(result, []);
    });

    it('should return an empty array for undefined input', function () {
        const result = object.keys(undefined);

        assert.deepEqual(result, []);
    });

    it('should return an array of keys for a non-empty object', function () {
        const input = {
            a: 1,
            b: 'hello',
            c: [1, 2, 3]
        };

        const result = object.keys(input);

        assert.deepEqual(result, ['a', 'b', 'c']);
    });

    it('should convert an object to a HashMap', function () {
        const inputObject = {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
        };
        const expectedHashMap = new HashMap();
        expectedHashMap.put('key1', 'value1');
        expectedHashMap.put('key2', 'value2');
        expectedHashMap.put('key3', 'value3');

        const result = object.toHashMap(inputObject);

        assert.deepEqual(result, expectedHashMap);
    });

    it('should handle empty object', function () {
        const inputObject = {};
        const result = object.toHashMap(inputObject);
        const expectedHashMap = new HashMap();

        assert.deepEqual(result, expectedHashMap);
    });

    it('should convert a non-empty Map to a plain object when given a non-empty Map', function () {
        const map = new Map();
        map.set('key1', 'value1');
        map.set('key2', 'value2');
        map.entrySet = function () {
            return map;
        };

        object.fromHashMap(map);
    });
});

