var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');
var karma = require('karma').Server;


gulp.task('js', function () {
	return gulp.src('src/*.js')
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

gulp.task('default', ['js', 'watch']);