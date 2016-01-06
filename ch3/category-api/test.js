var express = require('express');
var wagner = require('wagner-core');
var assert = require('assert');
var superagent = require('superagent');
var status = require('http-status');

var URL_ROOT = "http://localhost:3000";

describe('Category API', function(){
	var server;
	var Category;
	var Product;
	var User;

	var PRODUCT_ID = '000000000000000000000001';

	var categories = [
		{_id: 'Electronics'},
		{_id: 'Phones', parent: 'Electronics'},
		{_id: 'Laptops', parent: 'Electronics'},
		{_id: 'Bacon'}
	];

	var products = [
	{
		name: 'LG G4',
		category: {_id: 'Phones', ancestors: ['Electronics', 'Phones']},
		price: {
			amount: 300,
			currency: 'USD'
		}
	},
	{
		name: 'Asus Zenbook Prime',
		category: {_id: 'Laptops', ancestors: ['Electronics', 'Laptops']},
		price: {
			amount: 2000,
			currency: 'USD'
		}
	},
	{
		name: 'Flying Pigs Farm Pasture Raised Pork Bacon',
		category: {_id: 'Bacon', ancestors: ['Bacon']},
		price: {
			amount: 20,
			currency: 'USD'
		}
	}
	];

	var users = [{
		profile: {
			username: 'vkarpov15',
			picture: 'http://pbs.twimg.com/profile_images/550304223036854272/Wwmwuh2t.png'
		},
		data: {
			oauth: 'invalid',
			cart: []
		}
	}];

	before(function(){
		var app = express();

		//Bootstrap the server
		models = require('./models')(wagner);

		//Make Category model available to tests
		Category = models.Category;
		Product = models.Product;
		User = models.User;

		app.use(function(req, res, next){
			User.findOne({}, function(error, user){
				assert.ifError(error);
				req.user = user;
				next();
			});
		});

		app.use(require('./api')(wagner));

		server = app.listen(3000);
	});

	after(function(){
		server.close();
	});

	beforeEach(function(done){
		//Make sure categories are empty before each test
		Category.remove({}, function(error){
			assert.ifError(error);
			Product.remove({}, function(error){
				assert.ifError(error);
				done();
			});
		});
	});

	it('can save users cart', function(done){
		var url = URL_ROOT + '/me/cart';
		superagent.put(url)
			.send({
				data: {
					cart: [{product: PRODUCT_ID, quantity: 1}]
				}
			})
			.end(function(error, res){
				assert.ifError(error);
				assert.equal(res.status, status.OK);
				User.findOne({}, function(error, user){
					assert.ifError(error);
					assert.equal(user.data.cart.length, 1);
					assert.equal(user.data.cart[0].product, PRODUCT_ID);
					assert.equal(user.data.cart[0].quantity, 1);
					done();
				});
			});
	});

	it('can load users cart', function(done){
		var url = URL_ROOT + '/me';
		User.findOne({}, function(error, user){
			assert.ifError(error);
			user.data.cart = [{product: PRODUCT_ID, quantity: 1}];
			user.save(function(error){
				assert.ifError(error);
				superagent.get(url, function(error, res){
					assert.ifError(error);
					assert.equal(res.status, status.OK);
					var result;
					assert.doesNotThrow(function(){
						result = JSON.parse(res.text).user;
					});
					assert.equal(result.data.cart.length, 1);
					assert.equal(result.data.cart[0].product.name, 'Asus Zenbook Prime');
					assert.equal(result.data.cart[0].quantity, 1);
					done();
				});
			});
		});
	});

	it('can load a category by id', function(done){
		Category.create( {_id: 'Electronics'} , function(error, doc){
			assert.ifError(error);
			var url = URL_ROOT + '/category/id/Electronics';
			superagent.get(url, function(error, res){
				assert.ifError(error);
				var result;
				assert.doesNotThrow(function(){
					result = JSON.parse(res.text);
				});
				assert.ok(result.category);
				assert.equal(result.category._id, 'Electronics');
				done();
			});
		});
	});

	it('can load all categories that have a certain parent', function(done){

		Category.create(categories, function(error, categories){
			var url = URL_ROOT + '/category/parent/Electronics';
			superagent.get(url, function(error, res){
				assert.ifError(error);
				var result;
				assert.doesNotThrow(function(){
					result = JSON.parse(res.text);
				});
				assert.equal(result.categories.length, 2);
				assert.equal(result.categories[0]._id, 'Laptops');
				assert.equal(result.categories[1]._id, 'Phones');
				done();
			});
		});
	});

	it('can load a product by id', function(done){
		var product = {
			name: 'LG G4',
			_id: PRODUCT_ID,
			price: {
				amount: 300,
				currency: 'USD'
			}
		};
		Product.create(product, function(error, doc){
			assert.ifError(error);
			var URL = URL_ROOT + '/product/id/' + PRODUCT_ID;
			superagent.get(URL, function(error, res){
				assert.ifError(error);
				var result;
				assert.doesNotThrow(function(){
					result = JSON.parse(res.text);
				});
				assert.ok(result.product);
				assert.equal(result.product._id, PRODUCT_ID);
				assert.equal(result.product.name, 'LG G4');
				done();
			});
		});
	});

	it('can load all products in a category wit sub-categories', function(done){
		Category.create(categories, function(error, categories){
			assert.ifError(error);
			Product.create(products, function(error, products){
				assert.ifError(error);
				var url = URL_ROOT + '/product/category/Electronics';
				superagent.get(url, function(error, res){
					assert.ifError(error);
					var result;
					assert.doesNotThrow(function(){
						result = JSON.parse(res.text);
					});
					assert.equal(result.products.length, 2);
					assert.equal(result.products[0].name, 'Asus Zenbook Prime');
					assert.equal(result.products[1].name, 'LG G4');

					superagent.get(url + '?price=1', function(error, res){
						assert.ifError(error);
						var result;
						assert.doesNotThrow(function(){
							result = JSON.parse(res.text);
						});
						assert.equal(result.products.length, 2);
						assert.equal(result.products[1].name, 'Asus Zenbook Prime');
						assert.equal(result.products[0].name, 'LG G4');
						done();
					});
				});
			});
		});
	});
});