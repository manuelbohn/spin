'use strict';
var ad = require('../ad');
var assert = require('assert');
var _ = require('lodash');
var dists = require('../dists');
var util = require('../util');
var numeric = require('../math/numeric');
var ScoreAggregator = function () {
    this.dist = {};
};
Object.defineProperties(ScoreAggregator.prototype, {
    size: {
        get: function () {
            return _.size(this.dist);
        }
    }
});
ScoreAggregator.prototype.add = function (value, score) {
    if (ad.scalar.peq(score, ad.scalar.neg(Infinity))) {
        return;
    }
    var key = util.serialize(value);
    if (ad.scalar.peq(this.dist[key], undefined)) {
        this.dist[key] = {
            score: ad.scalar.neg(Infinity),
            val: value
        };
    }
    this.dist[key].score = numeric.logaddexp(this.dist[key].score, score);
};
function normalize(dist) {
    var logNorm = _.reduce(dist, function (acc, obj) {
        return numeric.logaddexp(acc, obj.score);
    }, ad.scalar.neg(Infinity));
    return _.mapValues(dist, function (obj) {
        return {
            val: obj.val,
            prob: ad.scalar.exp(ad.scalar.sub(obj.score, logNorm))
        };
    });
}
ScoreAggregator.prototype.toDist = function () {
    return new dists.Marginal({ dist: normalize(this.dist) });
};
module.exports = ScoreAggregator;