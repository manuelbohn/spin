'use strict';
var ad = require('../ad');
var base = require('./base');
var types = require('../types');
var util = require('../util');
var Uniform = require('./uniform').Uniform;
var Exponential = base.makeDistributionType({
    name: 'Exponential',
    desc: 'Distribution over ``[0, Infinity]``',
    params: [{
            name: 'a',
            desc: 'rate',
            type: types.positiveReal
        }],
    wikipedia: true,
    mixins: [base.continuousSupport],
    sample: function () {
        var u = util.random();
        return Math.log(u) / (-1 * ad.value(this.params.a));
    },
    score: function (val) {
        return ad.scalar.geq(val, 0) ? ad.scalar.sub(ad.scalar.log(this.params.a), ad.scalar.mul(this.params.a, val)) : ad.scalar.neg(Infinity);
    },
    base: function () {
        return new Uniform({
            a: 0,
            b: 1
        });
    },
    transform: function (x) {
        return ad.scalar.div(ad.scalar.log(x), ad.scalar.neg(this.params.a));
    },
    support: function () {
        return {
            lower: 0,
            upper: Infinity
        };
    }
});
module.exports = { Exponential: Exponential };