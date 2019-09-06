'use strict';
var ad = require('../ad');
var base = require('./base');
var types = require('../types');
var util = require('../util');
var numeric = require('../math/numeric');
var gamma = require('./gamma');
var binomial = require('./binomial');
function sample(mu) {
    var k = 0;
    while (mu > 10) {
        var m = Math.floor(7 / 8 * mu);
        var x = gamma.sample(m, 1);
        if (x >= mu) {
            return k + binomial.sample(mu / x, m - 1);
        } else {
            mu -= x;
            k += m;
        }
    }
    var emu = Math.exp(-mu);
    var p = 1;
    do {
        p *= util.random();
        k++;
    } while (p > emu);
    return k - 1;
}
var Poisson = base.makeDistributionType({
    name: 'Poisson',
    desc: 'Distribution over integers.',
    params: [{
            name: 'mu',
            desc: 'mean',
            type: types.positiveReal
        }],
    wikipedia: true,
    sample: function () {
        return sample(ad.value(this.params.mu));
    },
    score: function (val) {
        return ad.scalar.sub(ad.scalar.sub(ad.scalar.mul(val, ad.scalar.log(this.params.mu)), this.params.mu), numeric.lnfact(val));
    }
});
module.exports = {
    Poisson: Poisson,
    sample: sample
};