var express = require('express');
var app = express();
var router = express.Router();
var util = require('util');
var path = require('path');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var bodyParser = require('body-parser');
var validator = require('express-validator');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var JWT_SECRET = "flamingo";

var managerSchema = require('../schemas/manager.js');
var employeeSchema = require('../schemas/employee.js');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));

router.use(validator());

router.post('/newManager',function(req,res){

	var name = req.body.name;
	var emailId = req.body.emailId;
	var password = req.body.password;

	console.log(req.body);

	managerSchema.findOne({emailId: emailId}).exec(function(err,user){
		if(user!=null)
		{
			res.status(300);
			res.json({msg:"email is already registered"});
		}
		if(user==null)
		{
			req.check('password','password should be atleast 6 charaters ').isLength({min:6,max:20});
			req.check('emailId','email is not valid').isEmail();
			var errors = req.validationErrors();
			var msg = "";
			if(errors)
			{
				for(var i=0;i<errors.length;i++)
				{
					if(errors[i].param=="emailId")
						msg = msg + errors[i].msg;
					if(errors[i].param=="password")
						msg = msg + errors[i].msg;
				}
				res.status(300);
				res.json({msg:msg});
			}
			else
			{
				if(req.body.name=='')
				{
					res.status(300);
					res.json({msg:'name cannot be blank'});
				}
				else
				{
					bcrypt.genSalt(3,function(err,salt){
						bcrypt.hash(password,salt,function(err,hash){
							var newManager = new managerSchema({
								name : name,
								emailId : emailId,
								password : hash
							});
							var promise = newManager.save();
							promise.then(function(manager){
								var tokenPayload = {
									name: manager.name,
									emailId: manager.emailId, 
								};
								var token = jwt.encode(tokenPayload,JWT_SECRET);
								res.status(200);
								res.json({msg:"successful registration",token:token});
							})
							.catch(function(err){
								res.status(300);
								res.json({msg:"unsuccessful registration try again"});
								console.log('error saving new manager: '+err);
							});
						});
					});	
				}
			}
		}
		if(err)
		{
			res.status(300);
			res.json({msg:'unsuccessful registration try again'});
		}
	});
			
});

router.post('/newEmployee',function(req,res){

	var name = req.body.name;
	var emailId = req.body.emailId;
	var password = req.body.password;

	employeeSchema.findOne({emailId: emailId}).exec(function(err,user){
		if(user!=null)
		{
			res.status(300);
			res.json({msg:"email is already registered"});
		}
		if(user==null)
		{
			req.check('password','password should be atleast 6 charaters ').isLength({min:6,max:20});
			req.check('emailId','email is not valid').isEmail();
			var errors = req.validationErrors();
			var msg = "";
			if(errors)
			{
				for(var i=0;i<errors.length;i++)
				{
					if(errors[i].param=="emailId")
						msg = msg + errors[i].msg;
					if(errors[i].param=="password")
						msg = msg + errors[i].msg;
				}
				res.status(300);
				res.json({msg:msg});
			}
			else
			{
				if(req.body.name=='')
				{
					res.status(300);
					res.json({msg:'name cannot be blank'});
				}
				else
				{
					bcrypt.genSalt(3,function(err,salt){
						bcrypt.hash(password,salt,function(err,hash){
							var newEmployee = new employeeSchema({
								name : name,
								emailId : emailId,
								password : hash
							});
							var promise = newEmployee.save();

							promise.then(function(employee){
								var tokenPayload = {
									name: employee.name,
									emailId: employee.emailId, 
								};
								var token = jwt.encode(tokenPayload,JWT_SECRET);
								res.status(200);
								res.json({msg:"successful registration",token:token});
							})
							.catch(function(err){
								res.status(300);
								res.json({msg:"unsuccessful registration try again"});
								console.log('error while saving new employee: '+err);
							});
						});
					});
				}		
			}
		}
		if(err)
		{
			res.status(300);
			res.json({msg:'unsuccessful registration try again'});
		}
	});
			
});

var checkTokenManager = function(req,res,next){
		var token = req.body.token;
		var tokenUser = jwt.decode(token,JWT_SECRET);
		console.log(tokenUser);
		managerSchema.findOne({emailId:tokenUser.emailId}).exec(function(err,manager){
			console.log(manager);
			if(err)
			{
					res.status(300);
					res.send("error finding manager: "+err);
			}
			else
			{
				if(manager==null)
				{
					res.status(300);
					res.send("manager doesnt exist");
				}
				else
				{
					if(manager.emailId!=tokenUser.emailId)
					{
						res.status(300);
						res.json({msg: 'user could not be authenticated'});
					}
					else
						
					{
						app.locals.authenticated = manager;
						next();
					}
				}
			}	
		});
		
};

var checkTokenEmployee = function(req,res,next){
		var token = req.body.token;
		var tokenUser = jwt.decode(token,JWT_SECRET);
		console.log(tokenUser);
		employeeSchema.findOne({emailId:tokenUser.emailId}).exec(function(err,employee){
			console.log(employee);
			if(err)
			{
					res.status(300);
					res.send("error finding employee: "+err);
			}
			else
			{
				if(employee==null)
				{
					res.status(300);
					res.send("employee doesnt exist");
				}
				else
				{
					if(employee.emailId!=tokenUser.emailId)
					{
						res.status(300);
						res.json({msg: 'user could not be authenticated'});
					}
					else
						
					{
						app.locals.authenticated = employee;
						next();
					}
				}
			}	
		});
		
};

router.post('/loginManager',function(req,res){
		console.log('request received: ');
		console.log(req.body);
		managerSchema.findOne({emailId: req.body.emailId}).exec(function(err,user){
			if(err)
			{
				res.status(300);
				res.json({msg:"retry login"});
			}	
			if(user==null)
			{
				res.status(300);
				res.json({msg:"email doesnt exist"});
			}	
			else
			{
				bcrypt.compare(req.body.password,user.password,function(err,response){
					if(err)
					{
						res.status(300);
						res.json({msg:"retry login"});
					}
					else
						{
							if(response)
							{
								var token = jwt.encode(user,JWT_SECRET);
								res.json({msg:"login successful",token:token});
							}
							else
							{
								res.status(300);
								res.json({msg:"Password is wrong"});
							}
						}

				});
			}
		});
});

router.post('/loginEmployee',function(req,res){
		employeeSchema.findOne({emailId: req.body.emailId}).exec(function(err,user){
			if(err)
			{
				res.status(300);
				res.json({msg:"retry login"});
			}
			if(user==null)
			{
				res.status(300);
				res.json({msg:"email doesnt exist"});
			}
			else
			{
				bcrypt.compare(req.body.password,user.password,function(err,response){
					if(err)
					{
						res.status(300);
						res.json({msg:"retry login"});
					}	
					else
						{
							if(response)
							{
								var token = jwt.encode(user,JWT_SECRET);
								res.json({msg:"login successful",token:token});
							}
							else
							{	
								res.status(300);
								res.json({msg:"Password is wrong"});
							}
						}

				});
			}
		});
});

router.post('/getManager',checkTokenManager,function(req,res){
	var managerInfo = {
		name: app.locals.authenticated.name,
		pendingLeaves: app.locals.authenticated.pendingLeaves,
		approvedLeaves: app.locals.authenticated.approvedLeaves
	};
	res.json(managerInfo);	
});

router.post('/getEmployee',checkTokenEmployee,function(req,res){
	var employeeInfo = {
		id: app.locals.authenticated._id,
		name: app.locals.authenticated.name,
		appliedLeaves: app.locals.authenticated.appliedLeaves,
		approvedLeaves: app.locals.authenticated.approvedLeaves,
		declinedLeaves: app.locals.authenticated.declinedLeaves
	};
	res.json(employeeInfo);	
});

router.get('/getManagers',function(req,res){
	managerSchema.find({}).exec(function(err,managers){
		var managersName = [];
		for(var i=0;i<managers.length;i++)
		{
			managersName.push({name: managers[i].name, id: managers[i]._id});
		}
		res.json({managers: managersName}); 
	});
});

/*x*/

module.exports = router;