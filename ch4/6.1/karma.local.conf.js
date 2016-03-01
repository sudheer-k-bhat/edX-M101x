module.exports = function(config){
	config.set({
		files: [
			'http://code.jquery.com/jquery-1.11.3.js',
			'https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0/angular.js',
			'https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0/angular-mocks.js',
			'./app.js',
			'./test.js',
			{pattern: './*.html', included: false, served: true}
		],
		frameworks: ['mocha', 'chai'],
		browsers: ['Chrome'],
		port: 9876,
		proxies: {
			'/ch4/6.1': 'http://localhost:9876/base'
		}
	});
};