'use strict';
var ad = require('../ad');
var base = require('./base');
var util = require('../util');
var types = require('../types');
var Bernoulli = base.makeDistributionType({
    name: 'Bernoulli',
    desc: 'Distribution over ``{true, false}``',
    params: [{
            name: 'p',
            desc: 'success probability',
            type: types.unitInterval
        }],
    wikipedia: true,
    mixins: [base.finiteSupport],
    sample: function () {
        return util.random() < ad.value(this.params.p);
    },
    score: function (val) {
        if (ad.scalar.pneq(val, true) && ad.scalar.pneq(val, false)) {
            return ad.scalar.neg(Infinity);
        }
        return val ? ad.scalar.log(this.params.p) : ad.scalar.log(ad.scalar.sub(1, this.params.p));
    },
    support: function () {
        return [
            true,
            false
        ];
    }
});
module.exports = { Bernoulli: Bernoulli };