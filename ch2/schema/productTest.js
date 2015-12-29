var mongoose = require('mongoose');
var productSchema = require('./product');

var Product = mongoose.model('Product', productSchema, 'products');

var p = new Product({
	name: 'test',
	price: {
		amount: 5,
		currency: 'USD'
	}
});

// p.name = 2;
// console.log(p.name);
// console.log(p.$isValid('name'));

// p.price.amount = 'Not a number';
// console.log(p.$isValid('price.amount'));
// p.validate(function(err){
// 	console.log(err);
// });

console.log(p.displayPrice);
console.log(JSON.stringify(p));


