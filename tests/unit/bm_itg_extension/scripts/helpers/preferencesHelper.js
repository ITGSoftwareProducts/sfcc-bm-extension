var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Site = require('../../../../mock/dw/system/Site');
const Transaction = require('../../../../mock/dw/system/Transaction');
let constants = { GLOBAL: {
    BM_EXTENSION: {
        ATTRIBUTE_GROUP: 'BM Extension'
    }
}
};
const sitePreferences = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/preferencesHelper', {
    'dw/system/Site': Site,
    'dw/system/Transaction': Transaction,
    '~/cartridge/scripts/helpers/constants': constants
});

describe('preferencesHelper', () => {
    describe('#getPreferenceValue', () => {
        it('should return the custom preference value when the site is available', () => {
            const key = 'someKey';
            const value = 'someValue';
            const attributesObj = { someKey: value };
            var siteStub = sinon.stub(Site, 'getCurrent').returns({
                getCustomPreferenceValue: sinon.stub().returns(value)
            });
            const result = sitePreferences.getPreferenceValue(key, attributesObj);
            assert.equal(result, value);
            siteStub.restore();
        });

        it('should return an empty string when the site is not available', () => {
            const key = 'someKey';
            var siteStub = sinon.stub(Site, 'getCurrent').returns(null);
            const attributesObj = { someKey: '' };
            const result = sitePreferences.getPreferenceValue(key, attributesObj);

            assert.equal(result, '');
            siteStub.restore();
        });
    });

    describe('#setPreferenceValue', () => {
        it('should set the custom preference value when the key exists', () => {
            const key = 'someKey';
            const val = 'VALUE';
            var siteStub = sinon.stub(Site, 'getCurrent').returns({
                setCustomPreferenceValue: sinon.stub()
            });
            sinon.spy(Transaction, 'wrap');

            sitePreferences.setPreferenceValue(key, val);

            assert.isTrue(Site.getCurrent.calledOnce);
            assert.isTrue(Site.getCurrent().setCustomPreferenceValue.calledOnce);
            assert.isTrue(Transaction.wrap.calledOnce);
            assert.isTrue(Transaction.wrap.calledWith(sinon.match.func));


            siteStub.restore();
            Transaction.wrap.restore();
        });
        it('should set the custom preference value when the value is True/Yes', () => {
            const key = 'someKey';
            const val = 'TRUE';
            var siteStub = sinon.stub(Site, 'getCurrent').returns({
                setCustomPreferenceValue: sinon.stub()
            });
            sinon.spy(Transaction, 'wrap');

            sitePreferences.setPreferenceValue(key, val);

            assert.isTrue(Site.getCurrent.calledOnce);
            assert.isTrue(Site.getCurrent().setCustomPreferenceValue.calledOnce);
            assert.isTrue(Transaction.wrap.calledOnce);
            assert.isTrue(Transaction.wrap.calledWith(sinon.match.func));


            siteStub.restore();
            Transaction.wrap.restore();
        });
        it('should set the custom preference value when the value is False/No', () => {
            const key = 'someKey';
            const val = 'False';
            var siteStub = sinon.stub(Site, 'getCurrent').returns({
                setCustomPreferenceValue: sinon.stub()
            });
            sinon.spy(Transaction, 'wrap');

            sitePreferences.setPreferenceValue(key, val);

            assert.isTrue(Site.getCurrent.calledOnce);
            assert.isTrue(Site.getCurrent().setCustomPreferenceValue.calledOnce);
            assert.isTrue(Transaction.wrap.calledOnce);
            assert.isTrue(Transaction.wrap.calledWith(sinon.match.func));


            siteStub.restore();
            Transaction.wrap.restore();
        });
    });

    describe('#getPreferenceAttributes', () => {
        it('should return an empty object when customPreferences.attributeGroups is null', () => {
            var customPreferences = {
                attributeGroups: null
            };
            var getCurrentStub = sinon.stub(Site, 'getCurrent').returns({
                getPreferences: () => ({
                    describe: () => customPreferences
                })
            });
            var result = sitePreferences.getPreferenceAttributes();
            assert.deepEqual(result, {});
            getCurrentStub.restore();
        });
        it('should return an empty object when attributeGroups.ID does not match constants.GLOBAL.BM_EXTENSION.ATTRIBUTE_GROUP', () => {
            var customPreferences = {
                attributeGroups: {
                    isEmpty: () => false,
                    iterator: () => ({
                        hasNext: function () {
                            this.hasReturnedOnce = this.hasReturnedOnce || false;
                            if (!this.hasReturnedOnce) {
                                this.hasReturnedOnce = true;
                                return true;
                            }
                            return false;
                        },
                        next: () => ({
                            ID: 'other_attribute_group'
                        })
                    })
                }
            };
            var getCurrentStub = sinon.stub(Site, 'getCurrent').returns({
                getPreferences: () => ({
                    describe: () => customPreferences
                })
            });
            var result = sitePreferences.getPreferenceAttributes();
            assert.deepEqual(result, {});
            getCurrentStub.restore();
        });
        it('should return an empty object when attributeGroups.attributeDefinitions is empty', () => {
            var customPreferences = {
                attributeGroups: {
                    isEmpty: () => false,
                    iterator: () => ({
                        hasNext: function () {
                            this.hasReturnedOnce = this.hasReturnedOnce || false;
                            if (!this.hasReturnedOnce) {
                                this.hasReturnedOnce = true;
                                return true;
                            }
                            return false;
                        },
                        next: () => ({
                            attributeDefinitions: {
                                isEmpty: sinon.stub()
                            }
                        })
                    })
                }
            };
            var getCurrentStub = sinon.stub(Site, 'getCurrent').returns({
                getPreferences: () => ({
                    describe: () => customPreferences
                })
            });
            var result = sitePreferences.getPreferenceAttributes();
            assert.deepEqual(result, {});
            getCurrentStub.restore();
        });
        it('should return an object with all custom preference attributes and their values when they exist', () => {
            var customPreferences = {
                attributeGroups: {
                    isEmpty: () => false,
                    iterator: () => ({
                        hasNext: function () {
                            return this.hasReturnedOnce || true;
                        },
                        next: () => ({
                            ID: 'BM Extension',
                            attributeDefinitions: {
                                isEmpty: () => false,
                                iterator: () => ({
                                    hasNext: function () {
                                        this.hasReturnedOnce = this.hasReturnedOnce || false;
                                        if (!this.hasReturnedOnce) {
                                            this.hasReturnedOnce = true;
                                            return true;
                                        }
                                        return false;
                                    },
                                    next: () => ({
                                        ID: 'attribute1'
                                    })
                                })
                            }
                        })
                    })
                }
            };
            var getCurrentStub = sinon.stub(Site, 'getCurrent').returns({
                getPreferences: () => ({
                    describe: () => customPreferences
                }),
                getCustomPreferenceValue: (attributeId) => attributeId + '_value'
            });
            var result = sitePreferences.getPreferenceAttributes();
            assert.deepEqual(result, {
                attribute1: 'attribute1_value'
            });
            assert.deepEqual(result, { 'attribute1': 'attribute1_value' });
            getCurrentStub.restore();
        });
    });
});
