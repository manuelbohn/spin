'use strict';
var ad = require('../ad');
var _ = require('lodash');
var base = require('./base');
var types = require('../types');
var util = require('../util');
var RandomInteger = base.makeDistributionType({
    name: 'RandomInteger',
    desc: 'Uniform distribution over ``{0,1,...,n-1}``',
    params: [{
            name: 'n',
            desc: 'number of possible values',
            type: types.positiveInt
        }],
    wikipedia: 'Uniform_distribution_(discrete)',
    mixins: [base.finiteSupport],
    sample: function () {
        return Math.floor(util.random() * this.params.n);
    },
    score: function (val) {
        var inSupport = ad.scalar.peq(val, ad.scalar.floor(val)) && ad.scalar.leq(0, val) && ad.scalar.lt(val, this.params.n);
        return inSupport ? ad.scalar.neg(ad.scalar.log(this.params.n)) : ad.scalar.neg(Infinity);
    },
    support: function () {
        return _.range(this.params.n);
    }
});
module.exports = { RandomInteger: RandomInteger };