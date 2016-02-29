var superagent = require('superagent');
var _ = require('underscore');

module.exports = function() {
	var url = 'https://openexchangerates.org/api/latest.json?app_id=' + process.env.OPEN_EXCHANGE_RATES_KEY;
	var rates = {
		USD: 1,
		EUR: 1.1,
		GBP: 1.5
	};

	var ping = function(callback) {
		superagent.get(url, function(error, res) {
			if (error) {
				if (callback) {
					callback(error);
				}
				return;
			}

			var results;
			try {
				results = JSON.parse(res.text);
				//console.log(results.rates);
				_.each(results.rates || {}, function(value, key) {
					rates[key] = value;
				});
				if (callback) {
					callback(null, rates);
				}
			} catch (e) {
				if (callback) {
					callback(e);
				}
			}
		});
	};

	setInterval(ping, 60 * 60 * 1000);
	ping();

	var ret = function() {
		return rates;
	};
	ret.ping = ping;
	return ret;
};