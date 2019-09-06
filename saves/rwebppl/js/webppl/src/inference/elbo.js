'use strict';
var ad = require('../ad');
var _ = require('lodash');
var assert = require('assert');
var fs = require('fs');
var util = require('../util');
var paramStruct = require('../params/struct');
var guide = require('../guide');
var graph = require('./elbograph');
var RootNode = graph.RootNode;
var SampleNode = graph.SampleNode;
var FactorNode = graph.FactorNode;
var SplitNode = graph.SplitNode;
var JoinNode = graph.JoinNode;
module.exports = function (env) {
    function makeELBOEstimator(options) {
        options = util.mergeDefaults(options, {
            samples: 1,
            avgBaselines: true,
            avgBaselineDecay: 0.9,
            dumpGraph: false,
            debugWeights: false
        }, 'ELBO');
        return function (wpplFn, s, a, state, step, cont) {
            return new ELBO(wpplFn, s, a, options, state, step, cont).run();
        };
    }
    function ELBO(wpplFn, s, a, options, state, step, cont) {
        this.opts = options;
        this.step = step;
        this.state = state;
        this.cont = cont;
        this.wpplFn = wpplFn;
        this.s = s;
        this.a = a;
        this.guideRequired = true;
        this.isParamBase = true;
        this.mapDataStack = [{ multiplier: 1 }];
        this.mapDataIx = {};
        if (!_.has(this.state, 'baselines')) {
            this.state.baselines = {};
        }
        this.baselineUpdates = {};
        this.oldCoroutine = env.coroutine;
        env.coroutine = this;
    }
    function top(stack) {
        return stack[stack.length - 1];
    }
    function checkScoreIsFinite(score, source) {
        var _score = ad.value(score);
        if (!isFinite(_score)) {
            var msg = 'ELBO: The score of the previous sample under the ' + source + ' program was ' + _score + '.';
            if (_.isNaN(_score)) {
                msg += ' Reducing the step size may help.';
            }
            throw new Error(msg);
        }
    }
    ELBO.prototype = {
        run: function () {
            var elbo = 0;
            var grad = {};
            return util.cpsLoop(this.opts.samples, function (i, next) {
                this.iter = i;
                return this.estimateGradient(function (g, elbo_i) {
                    paramStruct.addEq(grad, g);
                    elbo += elbo_i;
                    return next();
                });
            }.bind(this), function () {
                paramStruct.divEq(grad, this.opts.samples);
                elbo /= this.opts.samples;
                this.updateBaselines();
                env.coroutine = this.oldCoroutine;
                return this.cont(grad, elbo);
            }.bind(this));
        },
        estimateGradient: function (cont) {
            this.paramsSeen = {};
            this.nodes = [];
            var root = new RootNode();
            this.prevNode = root;
            this.nodes.push(root);
            return this.wpplFn(_.clone(this.s), function () {
                graph.propagateWeights(this.nodes);
                if (this.step === 0 && this.iter === 0 && this.opts.dumpGraph) {
                    var dot = graph.generateDot(this.nodes);
                    fs.writeFileSync('deps.dot', dot);
                }
                var ret = this.buildObjective();
                if (ad.isLifted(ret.objective)) {
                    ret.objective.backprop();
                }
                var grads = _.mapValues(this.paramsSeen, ad.derivative);
                return cont(grads, ret.elbo);
            }.bind(this), this.a);
        },
        buildObjective: function () {
            var rootNode = this.nodes[0];
            assert.ok(rootNode instanceof RootNode);
            assert.ok(_.isNumber(rootNode.weight));
            var objective = this.nodes.reduce(function (acc, node) {
                if (node instanceof SampleNode && node.reparam) {
                    return ad.scalar.add(acc, ad.scalar.mul(node.multiplier, ad.scalar.sub(node.logq, node.logp)));
                } else if (node instanceof SampleNode) {
                    var weight = node.weight;
                    assert.ok(_.isNumber(weight));
                    var b = this.computeBaseline(node.address, weight);
                    return ad.scalar.add(acc, ad.scalar.mul(node.multiplier, ad.scalar.sub(ad.scalar.mul(node.logq, ad.scalar.sub(weight, b)), node.logp)));
                } else if (node instanceof FactorNode) {
                    return ad.scalar.sub(acc, ad.scalar.mul(node.multiplier, node.score));
                } else {
                    return acc;
                }
            }.bind(this), 0);
            var elbo = ad.scalar.neg(rootNode.weight);
            return {
                objective: objective,
                elbo: elbo
            };
        },
        computeBaseline: function (address, weight) {
            if (!this.opts.avgBaselines) {
                return 0;
            }
            var baselines = this.state.baselines;
            var baselineUpdates = this.baselineUpdates;
            if (!_.has(baselineUpdates, address)) {
                baselineUpdates[address] = {
                    n: 1,
                    mean: weight
                };
            } else {
                var prev = baselineUpdates[address];
                var n = prev.n + 1;
                var mean = (prev.n * prev.mean + weight) / n;
                baselineUpdates[address].n = n;
                baselineUpdates[address].mean = mean;
            }
            return _.has(baselines, address) ? baselines[address] : weight * 0.99;
        },
        updateBaselines: function () {
            var decay = this.opts.avgBaselineDecay;
            var baselines = this.state.baselines;
            _.each(this.baselineUpdates, function (obj, address) {
                baselines[address] = _.has(baselines, address) ? decay * baselines[address] + (1 - decay) * obj.mean : obj.mean;
            }, this);
        },
        sample: function (s, k, a, dist, options) {
            options = options || {};
            return guide.getDist(options.guide, options.noAutoGuide, dist, env, s, a, function (s, guideDist) {
                if (!guideDist) {
                    throw new Error('ELBO: No guide distribution to optimize.');
                }
                var ret = this.sampleGuide(guideDist, options);
                var val = ret.val;
                var logp = dist.score(val);
                var logq = guideDist.score(val);
                checkScoreIsFinite(logp, 'target');
                checkScoreIsFinite(logq, 'guide');
                var m = top(this.mapDataStack).multiplier;
                var node = new SampleNode(this.prevNode, logp, logq, ret.reparam, a, dist, guideDist, val, m, this.opts.debugWeights);
                this.prevNode = node;
                this.nodes.push(node);
                return k(s, val);
            }.bind(this));
        },
        sampleGuide: function (dist, options) {
            var val, reparam;
            if ((!_.has(options, 'reparam') || options.reparam) && dist.base && dist.transform) {
                var baseDist = dist.base();
                var z = baseDist.sample();
                val = dist.transform(z);
                reparam = true;
            } else if (options.reparam && !(dist.base && dist.transform)) {
                throw dist + ' does not support reparameterization.';
            } else {
                val = dist.sample();
                reparam = false;
            }
            if (dist.isContinuous && (!dist.base || !dist.transform)) {
                var msg = 'Warning: Continuous distribution ' + dist.meta.name + ' does not support reparameterization.';
                util.warn(msg, true);
            }
            return {
                val: val,
                reparam: reparam
            };
        },
        factor: function (s, k, a, score, name) {
            if (!isFinite(ad.value(score))) {
                throw new Error('ELBO: factor score is not finite.');
            }
            var m = top(this.mapDataStack).multiplier;
            var node = new FactorNode(this.prevNode, score, m, this.opts.debugWeights);
            this.prevNode = node;
            this.nodes.push(node);
            return k(s);
        },
        mapDataFetch: function (data, opts, address) {
            var batchSize = opts.batchSize !== undefined ? opts.batchSize : data.length;
            var minBatchSize = _.isEmpty(data) ? 0 : 1;
            var maxBatchSize = data.length;
            if (!(util.isInteger(batchSize) && minBatchSize <= batchSize && batchSize <= maxBatchSize)) {
                throw new Error('ELBO: Invalid batchSize.');
            }
            var ix;
            if (_.has(this.mapDataIx, address)) {
                ix = this.mapDataIx[address];
            } else {
                if (batchSize === data.length) {
                    ix = null;
                } else {
                    ix = _.times(batchSize, function () {
                        return Math.floor(util.random() * data.length);
                    });
                }
                this.mapDataIx[address] = ix;
            }
            var batch = ix === null ? data : _.at(data, ix);
            if (batchSize > 0) {
                var joinNode = new JoinNode();
                var splitNode = new SplitNode(this.prevNode, batchSize, data.length, joinNode);
                this.nodes.push(splitNode);
                var thisM = data.length / batchSize;
                var prevM = top(this.mapDataStack).multiplier;
                var multiplier = thisM * prevM;
                this.mapDataStack.push({
                    splitNode: splitNode,
                    joinNode: joinNode,
                    multiplier: multiplier
                });
            } else {
                this.mapDataStack.push(null);
            }
            return {
                data: batch,
                ix: ix
            };
        },
        mapDataEnter: function () {
            this.prevNode = top(this.mapDataStack).splitNode;
        },
        mapDataLeave: function () {
            top(this.mapDataStack).joinNode.parents.push(this.prevNode);
        },
        mapDataFinal: function (address) {
            var top = this.mapDataStack.pop();
            if (top !== null) {
                var joinNode = top.joinNode;
                this.prevNode = joinNode;
                this.nodes.push(joinNode);
            }
        },
        incrementalize: env.defaultCoroutine.incrementalize,
        constructor: ELBO
    };
    return makeELBOEstimator;
};