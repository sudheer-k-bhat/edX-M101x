var mongoose = require('mongoose');
var Category = require('./category');
var fx = require(./fx);

var productSchema = {
	name: {required: true, type: String},
	pictures: [{type: String, match: /^http:\/\//i }],
	price: {
		amount: {
			type: Number,
			required: true,
			set: function(v){
				this.internal.approximatePriceUSD = v / (f(x)[this.price.currency] || 1);
				return v;
			}
		},
		currency: {
			type: String,
			enum: ['USD', 'EUR', 'GBP'],
			required: true,
			set: function(v){
				this.internal.approximatePriceUSD = this.price.amount / (f(x)[v] || 1);
				return v;
			}
		}
	},
	category: Category.categorySchema,
	internal: {
		approximatePriceUSD: Number
	}
};

module.exports = new mongoose.Schema(productSchema);
module.exports.productSchema = productSchema;

var currencySymbols = {
	'USD': '$',
	'GBP': '£',
	'EUR': '€'
}

/**
Human readable string form of price - "$25" rather than "USD 25"
*/
module.exports.virtual('displayPrice').get(function(){
	return currencySymbols[this.price.currency] + '' + this.price.amount;
});

module.exports.set('toJSON', {virtuals: true});