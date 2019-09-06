'use strict';

var _ = require('lodash');
var open = require('open');
var child_process = require('child_process');
var path = require('path');
var fs = require('fs');

function isCodeGenFile(fn) {
  return isPlainJsFile(fn) && fs.existsSync(adSource(fn));
}

function isPlainJsFile(fn) {
  return path.extname(fn) === '.js' &&
         path.extname(path.parse(fn).name) !== '.ad';
}

function adSource(fn) {
  return fn.slice(0, -3) + '.ad.js';
}

module.exports = function(grunt) {
  grunt.initConfig({
    nodeunit: {
      all: ['tests/test-*.js']
    },
    eslint: {
      lib: {
        src: [
          'Gruntfile.js',
          'src/**/*.js'
        ],
        filter: _.negate(isCodeGenFile)
      },
      test: {
        src: ['tests/**/*.js']
      },
      wppl: {
        src: [
          'src/header.wppl',
          'examples/*.wppl',
          'tests/test-data/**/*.wppl'
        ],
        options: {
          configFile: '.eslintrc.wppl.js'
        }
      },
      options: {fix: "<%= grunt.option('fix') %>"}
    },
    jshint: {
      all: {
        src: [
          'Gruntfile.js',
          'src/header.wppl',
          'src/**/*.js',
          'tests/**/*.js'
        ],
        filter: _.negate(isCodeGenFile)
      },
      options: {
        maxerr: 500,
        camelcase: true,
        nonew: true,
        curly: true,
        noarg: true,
        trailing: true,
        forin: true,
        noempty: true,
        node: true,
        eqeqeq: true,
        strict: false,
        evil: true,
        undef: true,
        bitwise: true,
        browser: true,
        gcl: true,
        newcap: false
      }
    },
    clean: ['bundle/*.js'],
    watch: {
      ad: {
        files: ['**/*.ad.js'],
        tasks: ['build-ad']
      },
      dist: {
        files: ['src/dists.ad.js'],
        tasks: ['build-dist-header']
      }
    }
  });

  function browserifyArgs(args) {
    var pkgArg = '';
    var requires = _.chain(_.toArray(args))
        .map(function(name) { return ['--require', name]; })
        .flatten().value();
    pkgArg = ' -t [' + ['./src/bundle.js'].concat(requires).join(' ') + ']';
    // We don't want to browserify the mongodb package, so we mark it as "external"
    return pkgArg + ' -t brfs src/browser.js -o bundle/webppl.js -x mongodb';
  }

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['eslint', 'nodeunit']);
  grunt.registerTask('test', ['nodeunit']);
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('travis-phantomjs', ['bundle', 'test-phantomjs']);

  grunt.registerTask('build-ad', function() {
    var output = child_process.execSync('scripts/adify');
    grunt.log.writeln(output);
  });

  grunt.registerTask('build-dist-header', function() {
    var output = child_process.execSync('scripts/distHeader');
    grunt.log.writeln(output);
  });

  grunt.registerTask('build', 'Build WebPPL', ['build-ad', 'build-dist-header']);
  grunt.registerTask('build-watch', 'Run the build task on fs changes.', ['watch']);

  grunt.registerTask('bundle', 'Create browser bundle.', function() {
    var taskArgs = (arguments.length > 0) ? ':' + _.toArray(arguments).join(':') : '';
    grunt.task.run('browserify' + taskArgs, 'uglify');
  });

  grunt.registerTask('browserify', 'Generate "bundle/webppl.js".', function() {
    child_process.execSync('mkdir -p bundle');
    child_process.execSync('browserify' + browserifyArgs(arguments));
  });

  grunt.registerTask('browserify-watch', 'Run the browserify task on fs changes.', function() {
    var done = this.async();
    child_process.execSync('mkdir -p bundle');
    var args = '-v' + browserifyArgs(arguments);
    var p = child_process.spawn('watchify', args.split(' '));
    p.stdout.on('data', grunt.log.writeln);
    p.stderr.on('data', grunt.log.writeln);
    p.on('close', done);
  });

  grunt.registerTask('uglify', 'Generate "bundle/webppl.min.js".', function() {
    child_process.execSync('mkdir -p bundle');
    child_process.execSync('uglifyjs bundle/webppl.js -b ascii_only=true,beautify=false > bundle/webppl.min.js');
  });

  grunt.registerTask('test-browser', 'Run browser tests in default browser.', function() {
    open('tests/browser/index.html', process.env.BROWSER);
  });

  grunt.registerTask('test-phantomjs', 'Run browser tests in phantomjs.', function() {
    var timeout = 10; // seconds
    try {
      var cmd = 'phantomjs node_modules/qunit-phantomjs-runner/runner-list.js tests/browser/index.html ' + timeout;
      var output = child_process.execSync(cmd);
      grunt.log.writeln(output);
    } catch (e) {
      grunt.log.writeln(e.output.join('\n'));
      throw e;
    }
  });

  grunt.registerTask('generate-docs', 'Generate documentation.', function() {
    var output = child_process.execSync('scripts/distributionDocs > docs/primitive-distributions.txt');
    grunt.log.writeln(output);
  });
};
