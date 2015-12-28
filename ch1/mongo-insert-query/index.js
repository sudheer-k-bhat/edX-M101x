var mongodb = require('mongodb');

var url = 'mongodb://localhost:27017/example'

mongodb.MongoClient.connect(url, function(err, db){
	if(err){
		console.log(err);
		process.exit(1);
	}

	var doc = {
		title: 'Jaws',
		year: 1975,
		director: 'Steven Spielberg',
		rating: 'PG',
		ratings: {
			critics: 80,
			audience: 97
		},
		screenplay: ['Peter Benchley', 'Carl Gotlieb']
	};

	db.collection('movies').insert(doc, function(err, result){
		if(err){
			console.log(err);
			process.exit(1);
		}

		var query = {'ratings.audience': {'$gte': 90}}
		db.collection('movies').find(query).toArray(function(err, docs){
			if(err){
				console.log(err);
				process.exit(1);
			}

			console.log(docs);
			process.exit(0);
		});		
	});
});