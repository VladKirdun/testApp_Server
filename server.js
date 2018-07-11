const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;
const url = require('url');

const { MongoClient } = require("mongodb");
const urlDB = "mongodb://localhost:27017";

var orders = require('./orders.json');

// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// __________________________ ORDERS __________________________ 
MongoClient.connect(urlDB, { useNewUrlParser: true }, function(err, database) {
	if(err) throw err;

	console.log('Connection established!');
	const myDB = database.db('ORDERS');
	const myDBCollection = myDB.collection('orders');

	//удаление коллекции из бд
	myDBCollection.remove({});

	//вставка нескольких строк(пар) в коллекцию
	myDBCollection.insertMany(orders, function(err, result){
		if(err) {
			console.log(err);
			return;
		}		
	});
	database.close();
});

app.get('/', (req, res) => {
	res.send('Hello, World!');
});

app.get('/api', (req, res) => {
	MongoClient.connect(urlDB, { useNewUrlParser: true }, function(err, database) {
		if(err) throw err;

		const myDB = database.db('ORDERS');
		const myDBCollection = myDB.collection('orders');
		
		myDBCollection.find().toArray(function(err, results){
	    if(err) throw err;
	    res.json(results);
	  });
		
		database.close();
	});
});

app.post('/api/addPhoto', urlencodedParser, (req, res) => {

	var dataStr = JSON.stringify(req.body);
	dataStr = dataStr.slice(2, -7).replace(/\\/g, '') + '}';
	var dataObj = JSON.parse(dataStr);

	MongoClient.connect(urlDB, { useNewUrlParser: true }, function(err, database) {
		if(err) throw err;

		const myDB = database.db('ORDERS');
		const myDBCollection = myDB.collection('orders');
		
		var id = dataObj.id;
		var photo = dataObj.photo;
		photo = photo.replace(/ /g, '+');

		for(var i = 0; i < orders.length; i++) {
			if(orders[i].id === id) {
				orders[i].waiting_time = 0;
				orders[i].status = "READY";
				orders[i].photo = photo;
				fs.writeFile("orders.json", JSON.stringify(orders), function(error){
					if(error) throw error;
				});
				myDBCollection.update({id : id}, {$set: {waiting_time : 0}});
				myDBCollection.update({id : id}, {$set: {status : "READY"}});
				myDBCollection.update({id : id}, {$set: {photo : photo}});

	    	res.json(orders[i]);
			}
		}

		database.close();
	});
});

app.listen(port, () => console.log(`Listening on port ${port}`));