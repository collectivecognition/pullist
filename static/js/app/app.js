angular.module("Pull", ["ngCookies", "ngRoute"]).
    
    config(["$provide", "$routeProvider", "$httpProvider", function($provide, $routeProvider, $httpProvider){
        // Handle application routes

        $routeProvider.
            when("/", {
                templateUrl: "templates/comics.html",
                controller: "PullCtrl",
                title: "Comics"                
            }).

            when("/list", {
                templateUrl: "templates/list.html",
                controller: "ListCtrl",
                title: "Your List"
            });
    }]).

    run(["$window", "$rootScope", "$location", "$http", function($window, $rootScope, $location, $http){
        top.appScope = $rootScope; // Expose app scope for debugging

        $rootScope.$on("$routeChangeSuccess", function(event, current, previous){
            // Update some global values when the route changes

            $rootScope.controller = current.$$route.controller;
            $rootScope.title = current.$$route.title;
        });

        $rootScope.listContains = function(id){
            var contains = false;
            angular.forEach($rootScope.list, function(item){
                if(item._id == id){
                    contains = true;
                }
            });
            return contains
        };

        $rootScope.addToList = function(id){
            if($rootScope.user){
                $http.put("/list/add/" + id).
                    success(function(updatedList){
                        $rootScope.list = updatedList;
                    }).
                    error(function(error){
                        // TODO
                    });
            }
        };

        $rootScope.removeFromList = function(id){
            $http.delete("/list/" + id).
                success(function(updatedList){
                    $rootScope.list = updatedList;
                });
        };

        $rootScope.publishers = [];

        $rootScope.getComicsForWeek = function(){
            var weekPath = moment($rootScope.week.value).format("M/D/YYYY");
            $http.get("/comics/" + weekPath).
                success(function(comics){
                    $rootScope.comics = comics;

                    angular.forEach(comics, function(comic){
                        if($rootScope.publishers.indexOf(comic.publisher) === -1){
                            $rootScope.publishers.push(comic.publisher);
                        }
                    });
                });
        };

        // Retrieve a list of available weeks

        $http.get("/weeks").
            success(function(weeks){
                $rootScope.weeks = weeks;

                // Select this week if possible

                var now = moment();
                for(var ii = 0; ii < $rootScope.weeks.length; ii++){
                    if(now.isSame(moment($rootScope.weeks[ii].value).add(-1, "minute"), "week")){
                        $rootScope.week = $rootScope.weeks[ii];
                    }
                }

                // Default to last item in list

                if(!$rootScope.week){
                    $rootScope.week = $rootScope.weeks[$rootScope.weeks.length - 1];
                }
            });

        // When week changes, grab a new set of comics

        $rootScope.$watch("week", function(o, n){
            console.log("wdek changed")
            if($rootScope.week){
                $rootScope.getComicsForWeek();
            }
        }, true);
    }]).

    controller("LoginCtrl", ["$scope", "$rootScope", "$http", function($scope, $rootScope, $http){
        $http.get("/user").
            success(function(user){
                $rootScope.user = user;
            }).
            error(function(error){
                delete $scope.user;
            });

        $http.get("/list").
            success(function(list){
                $rootScope.list = list;
            });
    }]).

    controller("ListCtrl", ["$scope", "$rootScope", "$http", function($scope, $rootScope, $http){
        top.listScope = $scope;
    }]).

    controller("PullCtrl", ["$scope", "$rootScope", "$http", function($scope, $rootScope, $http){
        top.pullScope = $scope;
    }]);