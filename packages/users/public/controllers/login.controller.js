(function(){

  'use strict';
  angular.module('mean.users')
         .controller('LoginCtrl', LoginCtrl);

      LoginCtrl.$inject = ['$rootScope', '$http', '$scope', '$location', 'MeanUser' ,'Session'];

      function LoginCtrl($rootScope, $http, $scope, $location, MeanUser, Session){
            //console.log('login.controller .LoginCtrl');
            //declare internal variables
            var vm = this;
            var baseUrl = 'http://localhost:3000/';
            var ip = window.ip;

            //declare scope variables
            vm.meanuser = MeanUser;
            vm.user = {};

            //declare scope methods controllers
            vm.login =  login;

            //declare logical scope methods controller
            function login(){
              //console.log('login.controller .login');
              $scope.UserLoginInJava(vm.user);
             // vm.meanuser.login(vm.user);
                
            }
            $scope.UserLoginInJava  = function (user) {

              var USERNAME  = user.USERNAME;
              var PASSWORD  = user.PASSWORD;

              var url       = 'http://'+ip+':8080/Anerve/anerveWs/AnerveService/loginservice/'+USERNAME+'/'+PASSWORD;
             // var postData  = {USERNAME:USERNAME,PASSWORD:PASSWORD};
              var configObj = { method: 'GET',url: url};

                  $http(configObj)
                    .then(function onFulfilled(response) {
                          var dataJson = JSON.parse(JSON.stringify(response.data));
                          console.log(dataJson);
                          if(dataJson !== undefined){
                            var key = dataJson.key;
                            var UserID = dataJson.usr.userid;
                            var img_loc = dataJson.usr.img_loc;
                            var givname = dataJson.usr.givname;
                            var surname = dataJson.usr.surname;
                            //console.log(key);
                              if(key !== undefined){
                                 Session.setItem('key_'+UserID, key);
                                 Session.setItem('UserID', UserID);
                                 Session.setItem('img_loc', img_loc);
                                 Session.setItem('givname', givname);
                                 Session.setItem('surname', surname);
                                    var url2 = baseUrl+'api/SaveUserKey';
                                    var postData2  =  {
                                      key:key,
                                      UserID:UserID
                                    };
                                    var configObj2 = { method: 'POST',url: url2, data: postData2};
                                        $http(configObj2)
                                            .then(function onFulfilled(response2) {
                                              console.log(response2);
                                              vm.meanuser.login(vm.user);
                                            }).catch( function onRejection(errorResponse2) {
                                                console.log('Error: ', errorResponse2.status);
                                                console.log(errorResponse2);
                                        }); 
                                    }
                          }
                          }).catch( function onRejection(errorResponse) {
                              console.log('Error: ', errorResponse.status);
                              console.log(errorResponse);
                      }); 

          };


      }

})();
