var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var connection = mongoose.createConnection('mongodb://localhost:27017/leaveManagement');

var leaveSchema = new Schema({
	start: Date,
	end: Date,
	leaveDays: Number,
	interimHolidays: Array,
	reason: String,
	employee: Schema.Types.ObjectId,
	manager: Schema.Types.ObjectId,
	employeeName: String
});

module.exports.leaveSchema = leaveSchema;
module.exports.leaveModel = connection.model('leaves',leaveSchema);