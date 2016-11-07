var mongoose = require('mongoose');
var leaveSchema = require('./leave');
var Schema = mongoose.Schema;

var connection = mongoose.createConnection('mongodb://localhost:27017/leaveManagement');

var employeeSchema = new Schema({
	name: String,
	appliedLeaves: [leaveSchema.leaveSchema],
	approvedLeaves: [leaveSchema.leaveSchema],
	declinedLeaves: [leaveSchema.leaveSchema],
	emailId: String,
	password: String 
});

module.exports = connection.model('employee',employeeSchema);