'use strict';
var ad = require('../ad');
var _ = require('lodash');
var base = require('./base');
var types = require('../types');
var numeric = require('../math/numeric');
var discrete = require('./discrete');
function zeros(n) {
    var a = new Array(n);
    for (var i = 0; i < n; i++) {
        a[i] = 0;
    }
    return a;
}
function sample(theta, n) {
    var a = zeros(theta.length);
    for (var i = 0; i < n; i++) {
        a[discrete.sample(theta)]++;
    }
    return a;
}
var Multinomial = base.makeDistributionType({
    name: 'Multinomial',
    desc: 'Distribution over counts for ``n`` independent ``Discrete({ps: ps})`` trials.',
    params: [
        {
            name: 'ps',
            desc: 'probabilities',
            type: types.probabilityArray
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
        return sample(this.params.ps.map(ad.value), this.params.n);
    },
    score: function (val) {
        if (ad.scalar.pneq(numeric.sum(val), this.params.n)) {
            return ad.scalar.neg(Infinity);
        }
        var x = [];
        var y = [];
        for (var i = 0; ad.scalar.lt(i, this.params.ps.length); i++) {
            x[i] = numeric.lnfact(val[i]);
            y[i] = ad.scalar.peq(val[i], 0) ? 0 : ad.scalar.mul(val[i], ad.scalar.log(this.params.ps[i]));
        }
        return ad.scalar.add(ad.scalar.sub(numeric.lnfact(this.params.n), numeric.sum(x)), numeric.sum(y));
    },
    support: function () {
        var combinations = allDiscreteCombinations(this.params.n, this.params.ps, [], 0);
        var toHist = function (l) {
            return buildHistogramFromCombinations(l, this.params.ps);
        }.bind(this);
        var hists = combinations.map(toHist);
        return hists;
    }
});
function allDiscreteCombinations(k, states, got, pos) {
    var support = [];
    if (got.length == k) {
        return [_.clone(got)];
    }
    for (var i = pos; i < states.length; i++) {
        got.push(i);
        support = support.concat(allDiscreteCombinations(k, states, got, i));
        got.pop();
    }
    return support;
}
function buildHistogramFromCombinations(samples, states) {
    var stateIndices = _.range(states.length);
    var zeroHist = _.chain(stateIndices).map(function (i) {
        return [
            i,
            0
        ];
    }).object().value();
    var hist = _.defaults(_.countBy(samples), zeroHist);
    var array = _.sortBy(hist, function (val, key) {
        return key;
    });
    return array;
}
module.exports = { Multinomial: Multinomial };