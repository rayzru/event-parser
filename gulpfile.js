var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');
var eslint = require('gulp-eslint');
var karma = require('karma').Server;

gulp.task('js', ['lint'], function () {
	return gulp.src('src/*.js')
		.pipe(concat('event-parser.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
	gulp.watch('src/**/*.js', ['js']);
});

gulp.task('test', function (done) {
	new karma({
		configFile: __dirname + '/test/karma.conf.js',
		singleRun: true
	}, done).start();
});

gulp.task('lint', function () {
	var options = {
		configFile: '.eslintrc'
	};
	return gulp.src(['src/*.js'])
		.pipe(eslint(options))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
		.on('error', notify.onError(function (error) {
			return '\nJS linting error occured.\nLook in the console for details.\n' + error.message;
		}));
});

gulp.task('default', ['js', 'watch']);