var express = require('express');
var moment = require('moment');
var weekend = require('moment-weekend');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var path = require('path');

var ObjectID = require('mongodb').ObjectID;

var leaveSchema = require('../schemas/leave');
var holidaySchema = require('../schemas/holiday');
var managerSchema = require('../schemas/manager');
var employeeSchema = require('../schemas/employee');

var holidays = require("../config/holiday");

var router = express.Router();

router.get('/',function(req,res){
	res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});

router.use(bodyParser());
router.use(bodyParser.urlencoded({ extended: false }));

router.post('/requestLeave',function(req,res){
	console.log();
	var start = new Date(new Date(req.body.startDate).getTime() + 5.5*60*60*1000);
	var end = new Date(new Date(req.body.endDate).getTime() + 5.5*60*60*1000);
	var year = start.getFullYear();
	var employeeId = req.body.employeeId;
	var managerId = req.body.managerId;
	var employeeName = req.body.employeeName;

	var rangeOfLeave = weekend.diff(moment(start),moment(end).add(1,'days'));
	var leaveDays = rangeOfLeave;
	var publicHolidays = [];
	for(var i=0;i<holidays.length;i++)
	{
			var holiday = year+'-'+holidays[i].day;
			if(moment(holiday).isBetween(start,end)||moment(holiday).isSame(start)||moment(holiday).isSame(end))
			{
				if(!(moment(holiday).day()==0||moment(holiday).day()==6))
				{
					leaveDays--;
					publicHolidays.push({date: new Date(holiday), occassion: holidays[i].occassion});
				}
			}		
	}

	var leave = new leaveSchema.leaveModel({
		start: start,
		end: end,
		leaveDays: leaveDays,
		interimHolidays: publicHolidays,
		reason: req.body.reason,
		employee: employeeId,
		employeeName: employeeName,
		manager: managerId
	});

	var promise = leave.save();

	promise.then(function(leave){
		res.json(leave);

		var promise1 = managerSchema.findById(mongoose.Types.ObjectId(managerId));
		promise1.then(function(manager){
			manager.pendingLeaves.push(leave);
			return manager.save();		
		})
		.then(function(manager){
		})
		.catch(function(err){
			console.log('error in updating manager in leave request: '+err);
		});

		var promise2 = employeeSchema.findById(mongoose.Types.ObjectId(employeeId));
		promise2.then(function(employee){
			employee.appliedLeaves.push(leave);
			return employee.save();		
		})
		.then(function(employee){
		})
		.catch(function(err){
			console.log('error in updating employee in leave request: '+err);
		});

	})
	.catch(function(err){
		console.log('error in saving leave: '+err);
	});
	
});

router.post('/approveLeave',function(req,res){
	var leave = req.body.leave;
	var managerId = leave.manager;
	var employeeId = leave.employee;

	var promise = managerSchema.findById(mongoose.Types.ObjectId(managerId));

	promise.then(function(manager){
		manager.pendingLeaves.pull({_id: mongoose.Types.ObjectId(leave._id)});
		manager.approvedLeaves.push(leave);
		return managerSchema.findByIdAndUpdate(mongoose.Types.ObjectId(managerId),{$set: manager});
	}).then(function(updatedManager){
	}).catch(function(err){
		console.log('error in updating manager in leave accept: '+err);
	});
	
	var promise1 = employeeSchema.findById(mongoose.Types.ObjectId(employeeId));

	promise1.then(function(employee){
		employee.appliedLeaves.pull({_id: mongoose.Types.ObjectId(leave._id)});
		employee.approvedLeaves.push(leave);
		return employeeSchema.findByIdAndUpdate(mongoose.Types.ObjectId(employeeId),{$set: employee});
	}).then(function(updatedEmployee){
	}).catch(function(err){
		console.log('error in updating employee in leave accept: '+err);
	});
	
});

router.post('/declineLeave',function(req,res){
	var leave = req.body.leave;
	var managerId = leave.manager;
	var employeeId = leave.employee;

	var promise = managerSchema.findById(mongoose.Types.ObjectId(managerId));

	promise.then(function(manager){
		manager.pendingLeaves.pull({_id: mongoose.Types.ObjectId(leave._id)});
		return managerSchema.findByIdAndUpdate(mongoose.Types.ObjectId(managerId),{$set: manager});
	}).then(function(updatedManager){	
	}).catch(function(err){
		console.log('error in updating manager in leave decline: '+err);
	});
	
	var promise1 = employeeSchema.findById(mongoose.Types.ObjectId(employeeId));

	promise1.then(function(employee){
		employee.appliedLeaves.pull({_id: mongoose.Types.ObjectId(leave._id)});
		employee.declinedLeaves.push(leave);
		return employeeSchema.findByIdAndUpdate(mongoose.Types.ObjectId(employeeId),{$set: employee});
	}).then(function(updatedEmployee){
	}).catch(function(err){
		console.log('error in updating employee in leave decline: '+err);
	});
	
});

router.post('/addHoliday',function(req,res){
	var date = req.body.date;
	var month = req.body.month;
	var day = month+'-'+date;
	var occassion = req.body.occassion;

	var newHoliday = new holidaySchema({
		day: day,
		occassion: occassion
	}); 

	var promise = holidaySchema.find({day: day});

	promise.then(function(holiday){
		if(holiday.length==0)
		{
			var promise1 = newHoliday.save();

			promise1.then(function(savedHoliday){
				res.status(200);
				res.json({msg: "successfully created"});
			})
			.catch(function(err){
				console.log('error in saving holiday: '+err);
			});		
		}
		else
		{
			res.status(300);
			res.json({msg: "holiday already exists"});
		}
	});
	
});

router.get('/getHolidays',function(req,res){
	var promise = holidaySchema.find({});

	promise.then(function(holidays){
		res.json({holidays: holidays});
	})
	.catch(function(err){
		console.log('error in getting holidays: '+err);
	});
});

module.exports = router;