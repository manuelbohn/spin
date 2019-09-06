'use strict';
var ad = require('../ad');
var _ = require('lodash');
var assert = require('assert');
var util = require('../util');
var paramStruct = require('../params/struct');
var guide = require('../guide');
module.exports = function (env) {
    function makeEUBOEstimator(options) {
        options = util.mergeDefaults(options, {
            batchSize: 1,
            traces: undefined
        }, 'EUBO');
        if (!options.traces) {
            throw 'Example traces required.';
        }
        if (options.batchSize <= 0 || options.batchSize > options.traces.length) {
            throw 'Invalid batchSize.';
        }
        return function (wpplFn, s, a, state, step, cont) {
            return new EUBO(wpplFn, s, a, options, state, step, cont).run();
        };
    }
    function EUBO(wpplFn, s, a, options, state, step, cont) {
        this.opts = options;
        this.traces = this.opts.traces;
        this.cont = cont;
        this.wpplFn = wpplFn;
        this.s = s;
        this.a = a;
        this.guideRequired = true;
        this.isParamBase = true;
        this.oldCoroutine = env.coroutine;
        env.coroutine = this;
    }
    EUBO.prototype = {
        run: function () {
            var eubo = 0;
            var grad = {};
            var traces = sampleMiniBatch(this.traces, this.opts.batchSize);
            return util.cpsForEach(function (trace, i, traces, next) {
                return this.estimateGradient(trace, function (g, eubo_i) {
                    paramStruct.addEq(grad, g);
                    eubo += eubo_i;
                    return next();
                });
            }.bind(this), function () {
                paramStruct.divEq(grad, traces.length);
                eubo /= traces.length;
                env.coroutine = this.oldCoroutine;
                return this.cont(grad, eubo);
            }.bind(this), traces);
        },
        estimateGradient: function (trace, cont) {
            this.trace = trace;
            this.paramsSeen = {};
            this.logq = 0;
            return this.wpplFn(_.clone(this.s), function () {
                var objective = ad.scalar.neg(this.logq);
                objective.backprop();
                var grads = _.mapValues(this.paramsSeen, ad.derivative);
                var logp = ad.value(trace.score);
                var logq = ad.value(this.logq);
                return cont(grads, ad.scalar.sub(logp, logq));
            }.bind(this), this.a);
        },
        sample: function (s, k, a, dist, options) {
            options = options || {};
            return guide.getDist(options.guide, options.noAutoGuide, dist, env, s, a, function (s, guideDist) {
                if (!guideDist) {
                    throw new Error('EUBO: No guide distribution to optimize.');
                }
                var rel = util.relativizeAddress(this.a, a);
                var guideVal = this.trace.findChoice(ad.scalar.add(this.trace.baseAddress, rel)).val;
                assert.notStrictEqual(guideVal, undefined);
                var _guideVal = ad.value(guideVal);
                this.logq = ad.scalar.add(this.logq, guideDist.score(_guideVal));
                return k(s, _guideVal);
            }.bind(this));
        },
        factor: function (s, k, a, score) {
            return k(s);
        },
        incrementalize: env.defaultCoroutine.incrementalize,
        constructor: EUBO
    };
    function sampleMiniBatch(data, batchSize) {
        if (data.length === batchSize) {
            return data;
        } else {
            var miniBatch = [];
            _.times(batchSize, function () {
                var ix = Math.floor(util.random() * data.length);
                miniBatch.push(data[ix]);
            });
            return miniBatch;
        }
    }
    return makeEUBOEstimator;
};