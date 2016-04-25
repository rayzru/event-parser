module.exports = function (config) {
	config.set({
		basePath: '..',
		frameworks: ['jasmine'],
		files: [
			'src/event-parser.js',
			'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.12.0/moment-with-locales.min.js',
			'test/unit/*.spec.js'
		],
		exclude: [],
		preprocessors: {},
		reporters: ['progress'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: ['Chrome'],
		singleRun: false,
		concurrency: Infinity
	})
};