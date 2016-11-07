var express = require('express');
var moment = require('moment');
var weekend = require('moment-weekend');
var holidays = require('./config/holiday');
var routes = require('./routes/routes');
var users = require('./routes/users');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname,'/client')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.use('/',routes);
app.use('/users',users);

app.listen(3000,function(){
	console.log('server listening at port 3000');
});