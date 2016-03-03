exports.userMenu = function(){
	return {
		controller: 'UserMenuController',
		templateUrl: '/ch4/7.navbar/templates/user_menu.html'
	}
};

exports.productDetails = function(){
	return {
		controller: 'ProductDetailsController',
		templateUrl: '/ch4/7.navbar/templates/product_details.html'
	};
};

exports.categoryProducts = function(){
	return {
		controller: 'CategoryProductsController',
		templateUrl: '/ch4/7.navbar/templates/category_products.html'
	}
};

exports.categoryTree = function(){
	return {
		controller: 'CategoryTreeController',
		templateUrl: '/ch4/7.navbar/templates/category_tree.html'
	}
};