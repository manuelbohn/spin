'use strict';
var ad = require('../ad');
var _ = require('lodash');
var util = require('../util');
var inspect = require('util').inspect;
function Distribution() {
}
Distribution.prototype = {
    toJSON: function () {
        throw new Error('Not implemented');
    },
    inspect: function (depth, options) {
        if (_.has(this, 'params')) {
            if (this.print) {
                return this.print();
            } else {
                return [
                    this.meta.name,
                    '(',
                    inspect(this.params),
                    ')'
                ].join('');
            }
        } else {
            var opts = options ? _.clone(options) : {};
            opts.customInspect = false;
            return inspect(this, opts);
        }
    },
    toString: function () {
        return this.inspect();
    },
    isContinuous: false,
    constructor: Distribution
};
function isDist(x) {
    return x instanceof Distribution;
}
function clone(dist) {
    return new dist.constructor(dist.params);
}
var finiteSupport = {
    MAP: function () {
        var map = { score: -Infinity };
        this.support().forEach(function (val) {
            var score = this.score(val);
            if (score > map.score) {
                map = {
                    val: val,
                    score: score
                };
            }
        }, this);
        return map;
    },
    entropy: function () {
        return _.reduce(this.support(), function (memo, x) {
            var score = this.score(x);
            return ad.scalar.sub(memo, ad.scalar.peq(score, ad.scalar.neg(Infinity)) ? 0 : ad.scalar.mul(ad.scalar.exp(score), score));
        }.bind(this), 0);
    },
    toJSON: function () {
        var support = this.support();
        var probs = support.map(function (s) {
            return Math.exp(this.score(s));
        }, this);
        return {
            probs: probs,
            support: support
        };
    }
};
var continuousSupport = { isContinuous: true };
var noHMC = { noHMC: true };
var methodNames = [
    'sample',
    'score',
    'support',
    'print',
    'base',
    'transform'
];
function makeDistributionType(options) {
    options = util.mergeDefaults(options, { mixins: [] });
    [
        'name',
        'params'
    ].forEach(function (name) {
        if (!_.has(options, name)) {
            console.log(options);
            throw new Error('makeDistributionType: ' + name + ' is required.');
        }
    });
    if (options.score) {
        var originalScoreFn = options.score;
        options.score = function (val) {
            if (arguments.length !== 1) {
                throw new Error('The score method of ' + this.meta.name + ' expected 1 argument but received ' + arguments.length + '.');
            }
            return originalScoreFn.call(this, val);
        };
    }
    var parameterNames = _.map(options.params, 'name');
    var parameterTypes = _.map(options.params, function (param) {
        if (_.has(param, 'type') && !(param.type && param.type.check)) {
            throw new Error('Invalid type given for parameter ' + param.name + ' of ' + options.name + '.');
        }
        return param.type;
    });
    var parameterOptionalFlags = _.map(options.params, 'optional');
    var extraConstructorFn = options.constructor;
    var dist = function (params, skipParamChecks) {
        params = params || {};
        if (!skipParamChecks) {
            parameterNames.forEach(function (p, i) {
                if (params.hasOwnProperty(p)) {
                    var type = parameterTypes[i];
                    if (type && !type.check(ad.valueRec(params[p]))) {
                        throw new Error('Parameter "' + p + '" should be of type "' + type.desc + '".');
                    }
                } else {
                    if (!parameterOptionalFlags[i]) {
                        throw new Error('Parameter "' + p + '" missing from ' + this.meta.name + ' distribution.');
                    }
                }
            }, this);
        }
        this.params = params;
        if (extraConstructorFn !== undefined) {
            extraConstructorFn.call(this);
        }
    };
    dist.prototype = Object.create(Distribution.prototype);
    dist.prototype.constructor = dist;
    dist.prototype.meta = _.pick(options, 'name', 'desc', 'params', 'nodoc', 'nohelper', 'wikipedia');
    _.assign.apply(_, [dist.prototype].concat(options.mixins));
    _.assign(dist.prototype, _.pick(options, methodNames));
    [
        'sample',
        'score'
    ].forEach(function (method) {
        if (!dist.prototype[method]) {
            throw new Error('makeDistributionType: method "' + method + '" not defined for ' + options.name);
        }
    });
    return dist;
}
module.exports = {
    makeDistributionType: makeDistributionType,
    finiteSupport: finiteSupport,
    continuousSupport: continuousSupport,
    noHMC: noHMC,
    isDist: isDist,
    clone: clone
};