var app=angular.module('leaveApp',['ui.router','ngCookies','ui.materialize']);
               //.directive('select', materialSelect);

/*materialSelect.$inject = ['$timeout'];

function materialSelect($timeout){
    var directive = {
        link: link,
        restrict: 'E',
        require: '?ngModel'
    };

    function link(scope, element, attrs, ngModel) {
        if (ngModel) {
            ngModel.$render = create;
        }else {
            $timeout(create);   
        }

        function create() {
            element.material_select();
        }

        //if using materialize v0.96.0 use this
        element.one('$destroy', function () {
            element.material_select('destroy');
        });
        
        //not required in materialize v0.96.0
        element.one('$destroy', function () {
            var parent = element.parent();
            if (parent.is('.select-wrapper')) {
                var elementId = parent.children('input').attr('data-activates');
                if (elementId) {
                    $('#' + elementId).remove();
                }
                parent.remove();
                return;
            }

            element.remove();
        });
    }

    return directive;
}*/

app.config(function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/');
    
    $stateProvider
        .state('/', {
            url: '/',
            templateUrl: '/views/login.html',
            controller: 'loginController'
        })
        .state('/managerDashboard', {
            // we'll get to this in a bit     
            url: '/manager',
            templateUrl: '/views/managerDashboard.html',
            controller: 'managerController'
        })
        .state('/employeeDashboard', {
            // we'll get to this in a bit     
            url: '/employee',
            templateUrl: '/views/employeeDashboard.html',
            controller: 'employeeController'  
        });
 
});

app.controller('loginController',['$scope','$state','$http','$cookies',function($scope,$state,$http,$cookies){
    $scope.managerEmailId = '';
    $scope.managerPassword = '';
    $scope.showErrorManager= false;
    $scope.errorManager= '';

    $scope.employeeEmailId = '';
    $scope.employeePassword = '';
    $scope.showErrorEmployee= false;
    $scope.errorEmployee= '';

    $scope.newManagerEmailId = '';
    $scope.newManagerPassword = '';
    $scope.newManagerName= '';
    $scope.showErrorNewManager= false;
    $scope.errorNewManager= '';

    $scope.newEmployeeEmailId = '';
    $scope.newEmployeePassword = '';
    $scope.newEmployeeName= '';
    $scope.showErrorNewEmployee= false;
    $scope.errorNewEmployee= '';

    $scope.loginToManager=function(){
        $http({
            method: 'POST',
            url: '/users/loginManager',
            data: {emailId: $scope.managerEmailId, password: $scope.managerPassword}        
        }).success(function(data, status, headers, config) {
            $state.go('/managerDashboard');
            $cookies.put('user',data.token);    
        }).error(function(data, status, headers, config) {
            $scope.errorManager= data.msg;
            $scope.showErrorManager = true;
        }).catch(function(error){
            console.log('catch', error);
        });
    };
    $scope.loginToEmployee=function(){
        $http({
            method: 'POST',
            url: '/users/loginEmployee',
            data: {emailId: $scope.employeeEmailId, password: $scope.employeePassword}        
        }).success(function(data, status, headers, config) {
            $state.go('/employeeDashboard');
            $cookies.put('user',data.token);    
        }).error(function(data, status, headers, config) {
            $scope.errorEmployee= data.msg;
            $scope.showErrorEmployee = true;
        }).catch(function(error){
            console.log('catch', error);
        });
    };
    $scope.signupToManager=function(){
        $http({
            method: 'POST',
            url: '/users/newManager',
            data: {emailId: $scope.newManagerEmailId, password: $scope.newManagerPassword, name: $scope.newManagerName}        
        }).success(function(data, status, headers, config) {
            $state.go('/managerDashboard');    
            $cookies.put('user',data.token);
        }).error(function(data, status, headers, config) {
            $scope.errorNewManager= data.msg;
            $scope.showErrorNewManager = true;
        }).catch(function(error){
            console.log('catch', error);
        });
    };
    $scope.signupToEmployee=function(){
        $http({
            method: 'POST',
            url: '/users/newEmployee',
            data: {emailId: $scope.newEmployeeEmailId, password: $scope.newEmployeePassword, name: $scope.newEmployeeName}        
        }).success(function(data, status, headers, config) {
            $state.go('/employeeDashboard');    
            $cookies.put('user',data.token);    
        }).error(function(data, status, headers, config) {
            $scope.errorNewEmployee= data.msg;
            $scope.showErrorNewEmployee = true;
        }).catch(function(error){
            console.log('catch', error);
        });
    };
}]);

app.controller('managerController',['$scope','$cookies','$http','$state',function($scope,$cookies,$http,$state){
    $scope.pendingLeaves = [];
    $scope.approvedLeaves = [];
    $scope.name = '';
    $scope.holidayDate = '';
    $scope.holidayOccassion = '';
    $scope.managerId = '';

    $scope.logout = function(){
        $state.go('/');
        $cookies.remove('user');
    };

    /*$scope.load = function(){
        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 15 // Creates a dropdown of 15 years to control year
        });
    };*/

    $scope.initialize = function(){
        var token = $cookies.get('user');
        $http.post('/users/getManager',{token: token}).then(function(res){
            for(var i=0;i<res.data.pendingLeaves.length;i++)
            {
                var leave = res.data.pendingLeaves[i];
                leave.start = res.data.pendingLeaves[i].start.substring(0,10);
                leave.end = res.data.pendingLeaves[i].end.substring(0,10);
                $scope.pendingLeaves.push(leave);
            }
            for(var i=0;i<res.data.approvedLeaves.length;i++)
            {
                var leave = res.data.approvedLeaves[i];
                leave.start = res.data.approvedLeaves[i].start.substring(0,10);
                leave.end = res.data.approvedLeaves[i].end.substring(0,10);
                $scope.approvedLeaves.push(leave);
            }
            $scope.name = res.data.name;
            $scope.managerId = res.data.id;
        });
    };

    $scope.approveLeave = function(leave){
        $scope.approvedLeaves.push(leave);
        $scope.pendingLeaves.splice($scope.pendingLeaves.indexOf(leave),1); 
        $http.post('/approveLeave',{manager: leave.manager, employee: leave.employee, leave: leave}).then(function(res){

        });
    };

    $scope.denyLeave = function(leave){
        $scope.pendingLeaves.splice($scope.pendingLeaves.indexOf(leave),1);
        $http.post('/declineLeave',{manager: leave.manager, employee: leave.employee, leave: leave}).then(function(res){

        });  
    };
    $scope.addHoliday = function(value){
        var day = new Date($scope.holidayDate);
        var holidayDay = day.getDate();
        if(holidayDay<10)
        {
            console.log('0 to day added');
            holidayDay = '0'+holidayDay;
        }
        var holidayMonth = day.getMonth()+1;
        if(holidayMonth<10)
        {
            console.log('0 to month added');
            holidayMonth = '0'+holidayMonth;
        }
        $http.post('/addHoliday',{date: holidayDay, month: holidayMonth, occassion: $scope.holidayOccassion}).then(function(res){

        });
    };
    // $scope.load();
}]);

app.controller('employeeController',['$scope','$cookies','$http','$state',function($scope,$cookies,$http,$state){
    $scope.appliedLeaves = [];
    $scope.approvedLeaves = [];
    $scope.name = '';
    $scope.declinedLeaves = [];
    $scope.holidays = [];
    $scope.managers = null;
    $scope.selectedManagerId;
    $scope.startDate = '';
    $scope.endDate = '';
    $scope.reason = '';
    $scope.error= '';
    $scope.employeeId = '';
    $scope.showError = false;

    $scope.changeManager = function(managerId){
        $scope.selectedManagerId = managerId;
    };

    $scope.load = function(){
        $('select').material_select();
        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 15 // Creates a dropdown of 15 years to control year
        });
    };

    $scope.logout = function(){
        $state.go('/');
        $cookies.remove('user');
    };  

    $scope.initialize = function(){
        var token = $cookies.get('user');
        $http.post('/users/getEmployee',{token: token}).then(function(res){
            for(var i=0;i<res.data.appliedLeaves.length;i++)
            {
                var leave = res.data.appliedLeaves[i];
                leave.start = res.data.appliedLeaves[i].start.substring(0,10);
                leave.end = res.data.appliedLeaves[i].end.substring(0,10);
                $scope.appliedLeaves.push(leave);
            }
            for(var i=0;i<res.data.approvedLeaves.length;i++)
            {
                var leave = res.data.approvedLeaves[i];
                leave.start = res.data.approvedLeaves[i].start.substring(0,10);
                leave.end = res.data.approvedLeaves[i].end.substring(0,10);
                $scope.approvedLeaves.push(leave);
            }
            for(var i=0;i<res.data.declinedLeaves.length;i++)
            {
                var leave = res.data.declinedLeaves[i];
                leave.start = res.data.declinedLeaves[i].start.substring(0,10);
                leave.end = res.data.declinedLeaves[i].end.substring(0,10);
                $scope.declinedLeaves.push(leave);
            }
            $scope.name = res.data.name;
            $scope.employeeId = res.data.id;
        });

        $http.get('/getHolidays').then(function(res){
            $scope.holidays = res.data.holidays;
        });

        $http.get('/users/getManagers').then(function(res){
            $scope.managers = res.data.managers;
        });
    };

    $scope.apply = function(){
        var a = moment($scope.startDate);
        var b = moment($scope.endDate);
        var diffDays = b.diff(a, 'days')+1;
        if(diffDays>15)
        {
            $scope.error = 'the leave period cannot be more than 15 days';
            $scope.showError = true;
        }
        else
        {    
            if(diffDays<=0)
            {
                $scope.error = 'the leave period is not valid';
                $scope.showError = true;   
            }
            else
            {   
                $scope.showError = false;    
                var leave = {
                    startDate: $scope.startDate,
                    endDate: $scope.endDate,
                    employeeId: $scope.employeeId,
                    managerId: $scope.selectedManagerId,
                    employeeName: $scope.name,
                    reason: $scope.reason
                };
                $http.post('/requestLeave',leave).then(function(res){
                    var leave = res.data;
                    leave.start = res.data.start.substring(0,10);
                    leave.end = res.data.end.substring(0,10);
                    $scope.appliedLeaves.push(leave);
                });
            }    
        }    
    };

    $scope.load();
}]);