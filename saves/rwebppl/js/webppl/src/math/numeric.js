'use strict';
var ad = require('../ad');
var _ = require('lodash');
var LOG_PI = 1.1447298858494002;
var LOG_2PI = 1.8378770664093453;
function sum(xs) {
    return xs.reduce(function (a, b) {
        return ad.scalar.add(a, b);
    }, 0);
}
function _sum(xs) {
    if (xs.length === 0) {
        return 0;
    } else {
        var total = _.reduce(xs, function (a, b) {
            return a + b;
        });
        return total;
    }
}
function product(xs) {
    var result = 1;
    for (var i = 0, n = xs.length; ad.scalar.lt(i, n); i++) {
        result = ad.scalar.mul(result, xs[i]);
    }
    return result;
}
function fact(x) {
    var t = 1;
    while (ad.scalar.gt(x, 1)) {
        t = ad.scalar.mul(t, x);
        x = ad.scalar.sub(x, 1);
    }
    return t;
}
function lnfact(x) {
    if (ad.scalar.lt(x, 1)) {
        x = 1;
    }
    if (ad.scalar.lt(x, 12)) {
        return ad.scalar.log(fact(ad.scalar.round(x)));
    }
    var invx = ad.scalar.div(1, x);
    var invx2 = ad.scalar.mul(invx, invx);
    var invx3 = ad.scalar.mul(invx2, invx);
    var invx5 = ad.scalar.mul(invx3, invx2);
    var invx7 = ad.scalar.mul(invx5, invx2);
    var sum = ad.scalar.sub(ad.scalar.mul(ad.scalar.add(x, 0.5), ad.scalar.log(x)), x);
    sum = ad.scalar.add(sum, ad.scalar.div(ad.scalar.log(ad.scalar.mul(2, ad.scalar.PI)), 2));
    sum = ad.scalar.add(sum, ad.scalar.sub(ad.scalar.div(invx, 12), ad.scalar.div(invx3, 360)));
    sum = ad.scalar.add(sum, ad.scalar.sub(ad.scalar.div(invx5, 1260), ad.scalar.div(invx7, 1680)));
    return sum;
}
function squishToProbSimplex(x) {
    var d = ad.value(x).dims[0];
    var u = ad.tensor.reshape(ad.tensor.concat(x, ad.tensor.fromScalars(0)), [
        d + 1,
        1
    ]);
    return ad.tensor.softmax(u);
}
function logaddexp(a, b) {
    if (ad.scalar.peq(a, ad.scalar.neg(Infinity))) {
        return b;
    } else if (ad.scalar.peq(b, ad.scalar.neg(Infinity))) {
        return a;
    } else if (ad.scalar.gt(a, b)) {
        return ad.scalar.add(ad.scalar.log(ad.scalar.add(1, ad.scalar.exp(ad.scalar.sub(b, a)))), a);
    } else {
        return ad.scalar.add(ad.scalar.log(ad.scalar.add(1, ad.scalar.exp(ad.scalar.sub(a, b)))), b);
    }
}
function _logsumexp(a) {
    var m = Math.max.apply(null, a);
    var sum = 0;
    for (var i = 0; i < a.length; ++i) {
        sum += a[i] === -Infinity ? 0 : Math.exp(a[i] - m);
    }
    return m + Math.log(sum);
}
module.exports = {
    LOG_PI: LOG_PI,
    LOG_2PI: LOG_2PI,
    sum: sum,
    _sum: _sum,
    product: product,
    fact: fact,
    lnfact: lnfact,
    squishToProbSimplex: squishToProbSimplex,
    logaddexp: logaddexp,
    _logsumexp: _logsumexp
};