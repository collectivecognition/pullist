angular.module("Pull", ["ngCookies", "ngRoute"]).
    
    config(["$provide", "$routeProvider", "$httpProvider", function($provide, $routeProvider, $httpProvider){
        // Handle application routes

        $routeProvider.

            when("/logout", {
                template: " ",
                controller: "LogoutCtrl",
                title: "Logged Out"
            });
    }]).

    run(["$window", "$rootScope", "$location", "$http", function($window, $rootScope, $location, $http){
        top.appScope = $rootScope; // Expose app scope for debugging

    }]).

    controller("PullCtrl", ["$scope", "$http", function($scope, $http){
        top.pullScope = $scope;

        $scope.publishers = [];

        $http.get("/comics").
            success(function(comics){
                $scope.comics = comics;

                angular.forEach(comics, function(comic){
                    if($scope.publishers.indexOf(comic.publisher) === -1){
                        $scope.publishers.push(comic.publisher);
                    }
                });
            });

        $http.get("/user").
            success(function(user){
                $scope.user = user;
            }).
            error(function(error){
                delete $scope.user;
                console.log(error.error);
            });

        $http.get("/list").
            success(function(list){
                $scope.list = list;
            });

        $scope.addToList = function(id){
            $http.put("/list/add/" + id).
                success(function(updatedList){
                    console.log("added to list", updatedList);
                }).
                error(function(error){
                    // TODO
                });
        };

        $scope.comicsThisWeek = function(){
            var comics = [];

            angular.forEach($scope.comics, function(comic){
                if(comic.title.indexOf("#") > -1){
                    var sellDate = moment(comic.sellDate);
                    if(sellDate >= moment().startOf("week") && sellDate <= moment().endOf("week")){
                        comics.push(comic);
                    }
                }
            });

            return comics;
        };
    }]);