
const assert = require('chai').assert;

const {
    apply,
    append
} = require('../../../../mock/util');
describe('#applyFunction', () => {
    it('should append elements to the input array', function () {
        const inputArray = [1, 2, 3];
        const elementsToAppend = [4, 5, 6];
        const expectedResult = [1, 2, 3, 4, 5, 6];

        const result = apply(inputArray, elementsToAppend);
        assert.deepEqual(result, expectedResult);
    });

    it('should return the original array when splitParams is an empty array', function () {
        const inputArray = ['a', 'b', 'c'];
        const elementsToAppend = [];

        const result = apply(inputArray, elementsToAppend);

        assert.deepEqual(result, inputArray);
    });
    it('should handle string input and append elements correctly', function () {
        const inputString = 'Hello';
        const elementsToAppend = [' ', 'World', '!'];
        const expectedResult = 'Hello World!';

        const result = apply(inputString, elementsToAppend);

        assert.strictEqual(result, expectedResult);
    });
    it('should handle Unsupported data type for value', function () {
        const inputString = 1;
        const elementsToAppend = [];

        assert.throws(() => {
            apply(inputString, elementsToAppend);
        }, /Unsupported data type for value/);
    });
});
describe('#appendFunction', function () {
    it('should return an object with an apply method', function () {
        const result = append();
        assert.isObject(result);
        assert.property(result, 'apply');
        assert.isFunction(result.apply);
    });
});
