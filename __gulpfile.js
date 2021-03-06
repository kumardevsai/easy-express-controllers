'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var gulp = require('gulp'),
    rename = require('gulp-rename'),
    mocha = require('gulp-mocha'),
    gprint = require('gulp-print'),
    babel = require('gulp-babel'),
    karma = require("gulp-karma"),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    fs = require('fs');

gulp.task('transpile-all', function () {
	gulp.src('**/**-es6.js').pipe(babel({ presets: ['babel-preset-es2015'], plugins: ['transform-decorators-legacy'] })).pipe(rename(function (path) {
		path.basename = path.basename.replace(/-es6$/, '');
	})).pipe(gulp.dest('')).pipe(gprint(function (filePath) {
		return "File processed: " + filePath;
	}));
});

gulp.task('transpile-watch', function () {
	return gulp.watch('**/**-es6.js', function (obj) {
		if (obj.type === 'changed') {
			gulp.src(obj.path, { base: './' }).pipe(plumber({
				errorHandler: function errorHandler(error) {
					//babel error - dev typed in in valid code
					if (error.fileName) {
						var fileParts = error.fileName.split('\\');
						try {
							notify.onError(error.name + ' in ' + fileParts[fileParts.length - 1])(error);
						} catch (e) {} //gulp-notify may break if not run in Win 8
						console.log(error.name + ' in ' + error.fileName);
					} else {
						notify.onError('Oh snap, file system error! :(')(error);
					}

					console.log(error.message);
					this.emit('end');
				}
			})).pipe(babel({ presets: ['babel-preset-es2015'], plugins: ['transform-decorators-legacy'] })).pipe(rename(function (path) {
				path.basename = path.basename.replace(/-es6$/, '');
			})).pipe(gulp.dest('')).pipe(gprint(function (filePath) {
				return "File processed: " + filePath;
			}));
		}
	});
});

gulp.task('test', function () {
	require('./testUtil/testSetup');
	easyControllers.createController(app, 'person');
	easyControllers.createController(app, 'newRouting');
	easyControllers.createController(app, 'globalcontroller');
	easyControllers.createController(app, 'publisher/publisherDetails');
	easyControllers.createController(app, 'books/book');
	easyControllers.createController(app, 'books/bookDefaultPost');

	gulp.src('tests/**/!(*-es6.js)') //we don't want es6 files - just the transpiled results
	.pipe(mocha()).on('end', mochaTestsDone);

	function mochaTestsDone() {
		var filesToLoad = ['testUtil/jquery-2.1.4.min.js', //for $.ajax
		'testUtil/karmaTestSetup.js' //resets my utils global with client-side code to run and verify my paths with $.ajax
		],
		    blackList = ['parameterSnifferTests.js', 'requestDiscoveryTests.js', 'sinonDiscoveryTests.js', 'createAllControllersTests.js'].map(function (f) {
			return f.toLowerCase();
		});

		var allTestFiles = fs.readdirSync('./tests');
		filesToLoad.push.apply(filesToLoad, _toConsumableArray(allTestFiles.filter(function (f) {
			return !/-es6.js$/.test(f) && blackList.indexOf(f.toLowerCase()) < 0;
		}).map(function (f) {
			return './tests/' + f;
		})));

		//now re-run the relevant tests in an actual browser with acctual ajax calls
		gulp.src(filesToLoad).pipe(karma({
			configFile: __dirname + "/karma.conf.js",
			action: "run"
		})).on('end', function () {
			server.close();
		});
	}
});