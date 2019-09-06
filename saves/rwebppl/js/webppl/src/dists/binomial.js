'use strict';
var ad = require('../ad');
var _ = require('lodash');
var base = require('./base');
var types = require('../types');
var util = require('../util');
var beta = require('./beta');
function lnfactExact(x) {
    if (ad.scalar.lt(x, 0)) {
        throw new Error(ad.scalar.add('lnfactExact called on negative argument ', x));
    }
    if (ad.scalar.lt(x, 1)) {
        x = 1;
    }
    var t = 0;
    while (ad.scalar.gt(x, 1)) {
        t = ad.scalar.add(t, ad.scalar.log(x));
        x = ad.scalar.sub(x, 1);
    }
    return t;
}
function sample(p, n) {
    var k = 0;
    var N = 10;
    var a, b;
    while (n > N) {
        a = Math.floor(1 + n / 2);
        b = 1 + n - a;
        var x = beta.sample(a, b);
        if (x >= p) {
            n = a - 1;
            p /= x;
        } else {
            k += a;
            n = b - 1;
            p = (p - x) / (1 - x);
        }
    }
    var u;
    for (var i = 0; i < n; i++) {
        u = util.random();
        if (u < p) {
            k++;
        }
    }
    return k || 0;
}
var Binomial = base.makeDistributionType({
    name: 'Binomial',
    desc: 'Distribution over the number of successes for ``n`` independent ``Bernoulli({p: p})`` trials.',
    params: [
        {
            name: 'p',
            desc: 'success probability',
            type: types.unitInterval
        },
        {
            name: 'n',
            desc: 'number of trials',
            type: types.positiveInt
        }
    ],
    wikipedia: true,
    mixins: [base.finiteSupport],
    sample: function () {
        return sample(ad.value(this.params.p), this.params.n);
    },
    score: function (val) {
        var p = this.params.p;
        var n = this.params.n;
        if (!(ad.scalar.peq(typeof val, 'number') && ad.scalar.geq(val, 0) && ad.scalar.leq(val, n) && ad.scalar.peq(val % 1, 0))) {
            return ad.scalar.neg(Infinity);
        }
        var logNumPermutations = 0;
        var m, o;
        if (ad.scalar.lt(val, ad.scalar.sub(n, val))) {
            m = val;
            o = ad.scalar.sub(n, val);
        } else {
            m = ad.scalar.sub(n, val);
            o = val;
        }
        for (var i = ad.scalar.add(o, 1); ad.scalar.leq(i, n); i++) {
            logNumPermutations = ad.scalar.add(logNumPermutations, ad.scalar.log(i));
        }
        logNumPermutations = ad.scalar.sub(logNumPermutations, lnfactExact(m));
        return ad.scalar.add(ad.scalar.add(logNumPermutations, ad.scalar.eq(val, 0) ? 0 : ad.scalar.mul(val, ad.scalar.log(p))), ad.scalar.eq(ad.scalar.sub(n, val), 0) ? 0 : ad.scalar.mul(ad.scalar.sub(n, val), ad.scalar.log(ad.scalar.sub(1, p))));
    },
    support: function () {
        return _.range(0, this.params.n + 1);
    }
});
module.exports = {
    Binomial: Binomial,
    sample: sample
};