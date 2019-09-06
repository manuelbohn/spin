'use strict';

/*global QUnit webppl util _*/

QUnit.test('run', function(test) {
  var done = test.async();
  webppl.run('Infer({model: flip})', function(s, dist) {
    test.ok(_.isEqual([false, true], dist.support().sort()));
    done();
  });
});

QUnit.test('run twice', function(test) {
  var done = test.async(2);
  _.times(2, function() {
    webppl.run('Infer({model: flip})', function(s, dist) {
      test.ok(_.isEqual([false, true], dist.support().sort()));
      done();
    });
  });
});

QUnit.test('run resets env', function(test) {
  var done = test.async();
  try {
    webppl.run('Infer({model() { assert.ok(false); }})');
  } catch (e) {
  }
  // Attempting to sample from a continuous distribution will raise an
  // error if Enumerate is still installed as the current coroutine.
  webppl.run('gaussian(0, 1)', function(s, val) {
    test.ok(_.isNumber(val));
    done();
  });
});

function errorTest(code, debug, performChecks) {
  return function(test) {
    var done = test.async();
    var handler = function(error) {
      performChecks(done, test, error);
    };
    // Have the runner yield frequently to be sure the error occurs from
    // a setTimeout.
    var runner = util.trampolineRunners.web(1);
    var allCode = 'Infer({model: flip, method: "MCMC", samples: 1000});\n' + code;
    webppl.run(allCode, null, {runner: runner, debug: debug, errorHandlers: [handler]});
  };
}

QUnit.test(
    'handling throw Error, debug=true',
    errorTest('null[0]', true, function(done, test, error) {
      test.ok(error instanceof Error);
      test.ok(error.wpplRuntimeError);
      done();
    }));

QUnit.test(
    'handling throw Error, debug=false',
    errorTest('null[0]', false, function(done, test, error) {
      test.ok(error instanceof Error);
      test.ok(error.wpplRuntimeError);
      done();
    }));

QUnit.test(
    'handling throw string, debug=true',
    errorTest('util.jsthrow("fail")', true, function(done, test, error) {
      test.ok(typeof error === 'string');
      test.ok(error === 'fail');
      done();
    }));

QUnit.test(
    'handling throw string, debug=false',
    errorTest('util.jsthrow("fail")', false, function(done, test, error) {
      test.ok(typeof error === 'string');
      test.ok(error === 'fail');
      done();
    }));

QUnit.test('compile', function(test) {
  var codeAndMap = webppl.compile('1 + 1');
  test.ok(_.isString(codeAndMap.code));
  test.ok(_.isObject(codeAndMap.sourceMap));
});

QUnit.test('cps', function(test) {
  var code = webppl.cps('100');
  eval(code)(function(val) {
    test.strictEqual(100, val);
  });
});

QUnit.test('naming', function(test) {
  var code = webppl.naming('100');
  test.strictEqual(100, eval(code)());
});
