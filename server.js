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
	var urlParts = url.parse(req.url, true);
  var parameters = urlParts.query;
	MongoClient.connect(urlDB, { useNewUrlParser: true }, function(err, database) {
		if(err) throw err;

		const myDB = database.db('ORDERS');
		const myDBCollection = myDB.collection('orders');
		
  	if(JSON.stringify(parameters) === '{}' || parameters.address === '') {
			myDBCollection.find().toArray(function(err, results){
		    if(err) throw err;
		    res.json(results);
		  });
		} else {
			var address = parameters.address;
			myDBCollection.find({address: new RegExp(address,'i')}).toArray(function(err, results){
		    if(err) throw err;
		    res.json(results);
		  });
		}
		
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
		
		var latitude = dataObj.latitude;
		var longitude = dataObj.longitude;
		var id = dataObj.id;
		var photo = dataObj.photo;
		photo = photo.replace(/ /g, '+');

		for(var i = 0; i < orders.length; i++) {
			if(orders[i].id === id) {
				orders[i].waiting_time = 0;
				orders[i].status = "READY";
				orders[i].photo = photo;
				orders[i].lng = longitude;
				orders[i].lat = latitude;
				fs.writeFile("orders.json", JSON.stringify(orders), function(error){
					if(error) throw error;
				});
				myDBCollection.update({id : id}, {$set: {waiting_time : 0}});
				myDBCollection.update({id : id}, {$set: {status : "READY"}});
				myDBCollection.update({id : id}, {$set: {photo : photo}});
				myDBCollection.update({id : id}, {$set: {lng : longitude}});
				myDBCollection.update({id : id}, {$set: {lat : latitude}});

	    	res.json(orders[i]);
			}
		}

		database.close();
	});
});

app.post('/api/delete', urlencodedParser, (req, res) => {

	var dataStr = JSON.stringify(req.body);
	dataStr = dataStr.slice(2, -6).replace(/\\/g, '') + '}';
	var dataObj = JSON.parse(dataStr);

	MongoClient.connect(urlDB, { useNewUrlParser: true }, function(err, database) {
		if(err) throw err;

		const myDB = database.db('ORDERS');
		const myDBCollection = myDB.collection('orders');
		var id = dataObj.id;

		myDBCollection.remove({id: id});
		for(var i = 0; i < orders.length; i++) {
			if(orders[i].id === id) {
				orders.splice(i, 1);
				fs.writeFile("orders.json", JSON.stringify(orders), function(error){
					if(error) throw error;
				});
				break;
			}
		}
		
		database.close();
	});

	res.sendStatus(200);

});

app.listen(port, () => console.log(`Listening on port ${port}`));