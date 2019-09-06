'use strict';
var ad = require('../ad');
var base = require('./base');
var types = require('../types');
var util = require('../util');
var numeric = require('../math/numeric');
var LOG_2PI = numeric.LOG_2PI;
function sample(mu, sigma) {
    var u, v, x, y, q;
    do {
        u = 1 - util.random();
        v = 1.7156 * (util.random() - 0.5);
        x = u - 0.449871;
        y = Math.abs(v) + 0.386595;
        q = x * x + y * (0.196 * y - 0.25472 * x);
    } while (q >= 0.27597 && (q > 0.27846 || v * v > -4 * u * u * Math.log(u)));
    return mu + sigma * v / u;
}
function score(mu, sigma, x) {
    return ad.scalar.mul(ad.scalar.neg(0.5), ad.scalar.add(ad.scalar.add(LOG_2PI, ad.scalar.mul(2, ad.scalar.log(sigma))), ad.scalar.div(ad.scalar.mul(ad.scalar.sub(x, mu), ad.scalar.sub(x, mu)), ad.scalar.mul(sigma, sigma))));
}
var Gaussian = base.makeDistributionType({
    name: 'Gaussian',
    desc: 'Distribution over reals.',
    params: [
        {
            name: 'mu',
            desc: 'mean',
            type: types.unboundedReal
        },
        {
            name: 'sigma',
            desc: 'standard deviation',
            type: types.positiveReal
        }
    ],
    wikipedia: 'Normal_distribution',
    mixins: [base.continuousSupport],
    sample: function () {
        return sample(ad.value(this.params.mu), ad.value(this.params.sigma));
    },
    score: function (x) {
        return score(this.params.mu, this.params.sigma, x);
    },
    base: function () {
        return new Gaussian({
            mu: 0,
            sigma: 1
        });
    },
    transform: function (x) {
        var mu = this.params.mu;
        var sigma = this.params.sigma;
        return ad.scalar.add(ad.scalar.mul(sigma, x), mu);
    }
});
module.exports = {
    Gaussian: Gaussian,
    sample: sample,
    score: score
};