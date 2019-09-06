'use strict';
var ad = require('../ad');
var _ = require('lodash');
var PriorityQueue = require('priorityqueuejs');
var util = require('../util');
var ScoreAggregator = require('../aggregation/ScoreAggregator');
module.exports = function (env) {
    function Enumerate(store, k, a, wpplFn, options) {
        options = util.mergeDefaults(options, {
            maxExecutions: Infinity,
            strategy: undefined,
            throwOnError: true,
            maxRuntimeInMS: Infinity,
            maxEnumTreeSize: Infinity
        }, 'Enumerate');
        this.throwOnError = options.throwOnError;
        this.maxRuntimeInMS = options.maxRuntimeInMS;
        this.startTime = Date.now();
        this.firstPath = true;
        this.levelSizes = [];
        this.maxExecutions = options.maxExecutions;
        this.score = 0;
        this.marginal = new ScoreAggregator();
        this.numCompletedExecutions = 0;
        this.store = store;
        this.k = k;
        this.a = a;
        this.wpplFn = wpplFn;
        var strategy = strategies[options.strategy] || defaultStrategy(options.maxExecutions);
        this.queue = strategy.makeQ();
        this.oldCoroutine = env.coroutine;
        env.coroutine = this;
    }
    Enumerate.prototype.run = function () {
        return this.wpplFn(_.clone(this.store), env.exit, this.a);
    };
    Enumerate.prototype.error = function (errType) {
        var err = new Error(errType);
        if (this.throwOnError) {
            throw err;
        } else {
            return this.k(this.store, err);
        }
    };
    Enumerate.prototype.nextInQueue = function () {
        var nextState = this.queue.deq();
        this.score = nextState.score;
        return nextState.continuation(nextState.store, nextState.value);
    };
    Enumerate.prototype.enqueueContinuation = function (continuation, value, score, store) {
        var state = {
            continuation: continuation,
            value: value,
            score: score,
            store: _.clone(store)
        };
        this.queue.enq(state);
    };
    var getSupport = function (dist, cont) {
        if (dist.isContinuous || !dist.support) {
            console.error(dist);
            return env.coroutine.error('Enumerate can only be used with distributions that have finite support.');
        }
        var supp = dist.support();
        if (ad.scalar.peq(supp.length, 0)) {
            console.error(dist);
            return env.coroutine.error('Enumerate encountered a distribution with empty support.');
        }
        return cont(supp);
    };
    Enumerate.prototype.sample = function (store, k, a, dist) {
        return getSupport(dist, function (support) {
            if (isFinite(this.maxRuntimeInMS)) {
                if (ad.scalar.gt(ad.scalar.sub(Date.now(), this.startTime), this.maxRuntimeInMS)) {
                    return this.error(ad.scalar.add('Enumerate timeout: max time was set to ', this.maxRuntimeInMS));
                }
            }
            if (isFinite(this.maxEnumTreeSize)) {
                this.levelSizes.push(support.length);
            }
            _.each(support, function (value) {
                this.enqueueContinuation(k, value, ad.scalar.add(this.score, dist.score(value)), store);
            }.bind(this));
            return this.nextInQueue();
        }.bind(this));
    };
    Enumerate.prototype.factor = function (s, k, a, score) {
        this.score = ad.scalar.add(this.score, score);
        if (ad.scalar.peq(this.score, ad.scalar.neg(Infinity))) {
            return this.exit();
        }
        return k(s);
    };
    Enumerate.prototype.sampleWithFactor = function (store, k, a, dist, scoreFn) {
        return getSupport(dist, function (support) {
            return util.cpsForEach(function (value, i, support, nextK) {
                return scoreFn(store, function (store, extraScore) {
                    var score = ad.scalar.add(ad.scalar.add(env.coroutine.score, dist.score(value)), extraScore);
                    env.coroutine.enqueueContinuation(k, value, score, store);
                    return nextK();
                }, a, value);
            }, function () {
                return env.coroutine.nextInQueue();
            }, support);
        });
    };
    var estimateEnumTreeSize = function (sizes) {
        var numNodes = 1;
        var enumTreeSize = 1;
        for (var i in sizes) {
            numNodes = ad.scalar.mul(numNodes, sizes[i]);
            enumTreeSize = ad.scalar.add(enumTreeSize, numNodes);
        }
        return enumTreeSize;
    };
    Enumerate.prototype.exit = function (s, retval) {
        if (isFinite(this.maxEnumTreeSize)) {
            if (this.firstPath) {
                this.firstPath = false;
                var estimatedTreeSize = estimateEnumTreeSize(this.levelSizes);
                if (ad.scalar.gt(estimatedTreeSize, this.maxEnumTreeSize)) {
                    return this.error(ad.scalar.add(estimatedTreeSize, ' computations ahead.'));
                }
            }
        }
        this.marginal.add(retval, this.score);
        this.numCompletedExecutions = ad.scalar.add(this.numCompletedExecutions, 1);
        if (ad.scalar.gt(this.queue.size(), 0) && ad.scalar.lt(this.numCompletedExecutions, this.maxExecutions)) {
            return this.nextInQueue();
        } else {
            if (ad.scalar.peq(this.marginal.size, 0)) {
                return this.error('All paths explored by Enumerate have probability zero.');
            }
            env.coroutine = this.oldCoroutine;
            return this.k(this.store, this.marginal.toDist());
        }
    };
    Enumerate.prototype.incrementalize = env.defaultCoroutine.incrementalize;
    var strategies = {
        'likelyFirst': {
            makeQ: function () {
                return new PriorityQueue(function (a, b) {
                    return ad.scalar.sub(a.score, b.score);
                });
            }
        },
        'depthFirst': {
            makeQ: function () {
                var q = [];
                q.size = function () {
                    return q.length;
                };
                q.enq = q.push;
                q.deq = q.pop;
                return q;
            }
        },
        'breadthFirst': {
            makeQ: function () {
                var q = [];
                q.size = function () {
                    return q.length;
                };
                q.enq = q.push;
                q.deq = q.shift;
                return q;
            }
        }
    };
    function defaultStrategy(maxExecutions) {
        return strategies[_.isFinite(maxExecutions) ? 'likelyFirst' : 'depthFirst'];
    }
    return {
        Enumerate: function (s, k, a, wpplFn, options) {
            return new Enumerate(s, k, a, wpplFn, options).run();
        }
    };
};