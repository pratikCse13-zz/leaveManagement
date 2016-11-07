var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var connection = mongoose.createConnection('mongodb://localhost:27017/leaveManagement');

var holidaySchema = new Schema({
	day: String,
	occassion: String 
});

module.exports = connection.model('holiday',holidaySchema);