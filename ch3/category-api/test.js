var express = require('express');
var wagner = require('wagner-core');
var assert = require('assert');
var superagent = require('superagent');
var status = require('http-status');
var bodyparser = require('body-parser');

var URL_ROOT = "http://localhost:3000";

describe('Category API', function() {
	var server;

	var PRODUCT_ID = '000000000000000000000001';

	var categories = [{
		_id: 'Electronics'
	}, {
		_id: 'Phones',
		parent: 'Electronics'
	}, {
		_id: 'Laptops',
		parent: 'Electronics'
	}, {
		_id: 'Bacon'
	}];

	var products = [{
		name: 'LG G4',
		category: {
			_id: 'Phones',
			ancestors: ['Electronics', 'Phones']
		},
		price: {
			amount: 300,
			currency: 'USD'
		}
	}, {
		_id: PRODUCT_ID,
		name: 'Asus Zenbook Prime',
		category: {
			_id: 'Laptops',
			ancestors: ['Electronics', 'Laptops']
		},
		price: {
			amount: 2000,
			currency: 'USD'
		}
	}, {
		name: 'Flying Pigs Farm Pasture Raised Pork Bacon',
		category: {
			_id: 'Bacon',
			ancestors: ['Bacon']
		},
		price: {
			amount: 20,
			currency: 'USD'
		}
	}];

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

	var deps;

	before(function() {
		var app = express();

		// Bootstrap server
		require('./models')(wagner);
		require('./dependencies')(wagner);

		// Make models available in tests
		deps = wagner.invoke(function(Category, Product, Stripe, User){
			return {
				Category: Category,
				Product: Product,
				Stripe: Stripe,
				User: User
			}
		});

		app.use(function(req, res, next) {
			deps.User.findOne({}, function(error, user) {
				assert.ifError(error);
				req.user = user;
				next();
			});
		});

		app.use(require('./api')(wagner));

		server = app.listen(3000);
	});

	after(function() {
		server.close();
	});

	beforeEach(function(done) {
		//Make sure categories are empty before each test
		deps.Category.remove({}, function(error) {
			assert.ifError(error);
			deps.Product.remove({}, function(error) {
				assert.ifError(error);
				deps.User.remove({}, function(error) {
					assert.ifError(error);
					deps.User.create(users, function(error, user) {
						assert.ifError(error);
						deps.Category.create(categories, function(error, categories) {
							assert.ifError(error);
							deps.Product.create(products, function(error, products) {
								assert.ifError(error);
								done();
							});
						});
					});
				});
			});
		});
	});

	it('can search by text', function(done){
		var url = URL_ROOT + '/product/text/asus';
		superagent.get(url, function(error, res){
			assert.ifError(error);
			assert.equal(res.status, status.OK);

			var results;
			assert.doesNotThrow(function(){
				results = JSON.parse(res.text).products;
			});

			assert.equal(results.length, 1);
			assert.equal(results[0]._id, PRODUCT_ID);
			assert.equal(results[0].name, 'Asus Zenbook Prime');
			done();
		});
	});

	it('can checkout', function(done){
		this.timeout(10000);
		var url = URL_ROOT + '/checkout';

		deps.User.findOne({}, function(error, user){
			assert.ifError(error);
			user.data.cart = [{product: PRODUCT_ID, quantity: 1}];
			user.save(function(error){
				assert.ifError(error);
				superagent.post(url).send({
					stripeToken:{
						number: '4242424242424242',
						cvc: '123',
						exp_month: '12',
						exp_year: '2016'
					}
				}).end(function(error, res){
					assert.ifError(error);
					assert.equal(res.status, 200);
					var result;
					assert.doesNotThrow(function(){
						result = JSON.parse(res.text);
					});
					assert.ok(result.id);
					deps.Stripe.charges.retrieve(result.id, function(error, charge){
						assert.ifError(error);
						assert.ok(charge);
						assert.equal(charge.amount, 2000 * 100);
						done();
					});
				});
			});
		});
	});

	it('can save users cart', function(done) {
		var url = URL_ROOT + '/me/cart';
		superagent.put(url)
			.send({
				data: {
					cart: [{
						product: PRODUCT_ID,
						quantity: 1
					}]
				}
			})
			.end(function(error, res) {
				assert.ifError(error);
				assert.equal(res.status, status.OK);
				deps.User.findOne({}, function(error, user) {
					assert.ifError(error);
					assert.equal(user.data.cart.length, 1);
					assert.equal(user.data.cart[0].product, PRODUCT_ID);
					assert.equal(user.data.cart[0].quantity, 1);
					done();
				});
			});
	});

	it('can load users cart', function(done) {
		var url = URL_ROOT + '/me';
		deps.User.findOne({}, function(error, user) {
			assert.ifError(error);
			user.data.cart = [{
				product: PRODUCT_ID,
				quantity: 1
			}];
			user.save(function(error) {
				assert.ifError(error);
				superagent.get(url, function(error, res) {
					assert.ifError(error);
					assert.equal(res.status, status.OK);
					var result;
					assert.doesNotThrow(function() {
						result = JSON.parse(res.text).user;
					});
					//console.log(result);
					assert.equal(result.data.cart.length, 1);
					assert.equal(result.data.cart[0].product.name, 'Asus Zenbook Prime');
					assert.equal(result.data.cart[0].quantity, 1);
					done();
				});
			});
		});
	});

	it('can load a category by id', function(done) {
		var url = URL_ROOT + '/category/id/Electronics';
		superagent.get(url, function(error, res) {
			assert.ifError(error);
			var result;
			assert.doesNotThrow(function() {
				result = JSON.parse(res.text);
			});
			assert.ok(result.category);
			assert.equal(result.category._id, 'Electronics');
			done();
		});
	});

	it('can load all categories that have a certain parent', function(done) {
		var url = URL_ROOT + '/category/parent/Electronics';
		superagent.get(url, function(error, res) {
			assert.ifError(error);
			var result;
			assert.doesNotThrow(function() {
				result = JSON.parse(res.text);
			});
			assert.equal(result.categories.length, 2);
			assert.equal(result.categories[0]._id, 'Laptops');
			assert.equal(result.categories[1]._id, 'Phones');
			done();
		});
	});

	it('can load a product by id', function(done) {
		var URL = URL_ROOT + '/product/id/' + PRODUCT_ID;
		superagent.get(URL, function(error, res) {
			assert.ifError(error);
			var result;
			assert.doesNotThrow(function() {
				result = JSON.parse(res.text);
			});
			assert.ok(result.product);
			assert.equal(result.product._id, PRODUCT_ID);
			assert.equal(result.product.name, 'Asus Zenbook Prime');
			done();
		});
	});

	it('can load all products in a category with sub-categories', function(done) {
		var url = URL_ROOT + '/product/category/Electronics';
		superagent.get(url, function(error, res) {
			assert.ifError(error);
			var result;
			assert.doesNotThrow(function() {
				result = JSON.parse(res.text);
			});
			assert.equal(result.products.length, 2);
			assert.equal(result.products[0].name, 'Asus Zenbook Prime');
			assert.equal(result.products[1].name, 'LG G4');

			superagent.get(url + '?price=1', function(error, res) {
				assert.ifError(error);
				var result;
				assert.doesNotThrow(function() {
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