var app=angular.module('leaveApp',['ui.router','ngCookies','angularMaterializeDatePicker'])
               .directive('select', materialSelect);

materialSelect.$inject = ['$timeout'];

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
}

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
    $scope.logout = function(){
        $state.go('/');
        $cookies.remove('user');
    };

    $scope.load = function(){
        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 15 // Creates a dropdown of 15 years to control year
        });
    };

    $scope.initialize = function(){
        var token = $cookies.get('user');
        $http.post('/users/getManager',{token: token}).then(function(res){
            $scope.pendingLeaves = res.data.pendingLeaves;
            $scope.approvedLeaves = res.data.approvedLeaves;
            $scope.name = res.data.name;
        });
    };

    $scope.load();
}]);

app.controller('employeeController',['$scope','$cookies','$http','$state',function($scope,$cookies,$http,$state){
    $scope.appliedLeaves = [];
    $scope.approvedLeaves = [];
    $scope.name = '';
    $scope.declinedLeaves = [];
    $scope.holidays = [];
    $scope.managers = null;
    $scope.selectedManager;
    $scope.startDate;
    $scope.endDate;
    $scope.reason = '';

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

    $scope.changeManager = function(manager){
        $scope.selectedManager = manager;
    };

    $scope.changeStartDate = function(startDate){
        console.log(startDate);
        $scope.startDate = startDate;
    };

    $scope.initialize = function(){
        var token = $cookies.get('user');
        $http.post('/users/getEmployee',{token: token}).then(function(res){
            $scope.appliedLeaves = res.data.pendingLeaves;
            $scope.approvedLeaves = res.data.approvedLeaves;
            $scope.declinedLeaves = res.data.declinedLeaves;
            $scope.name = res.data.name;
        });

        $http.get('/getHolidays').then(function(res){
            $scope.holidays = res.data.holidays;
        });

        $http.get('/users/getManagers').then(function(res){
            console.log(res.data.managers);
            $scope.managers = res.data.managers;
        });
    };

    $scope.apply = function(){
        console.log($scope.selectedManager);
        console.log($scope.startDate);
        console.log($scope.endDate);
        console.log($scope.reason);
    };

    $scope.load();
}]);