var express = require("express");
var http = require("http");
var path = require("path");
var passport = require("passport");
var moment = require("moment");

var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var GoogleStrategy = require("passport-google").Strategy;
var MongoStore = require("connect-mongo-store")(express);

var fs = require("fs");
var sys = require("sys");
var util = require("util");
    
// Initialize app
    
var app = express();

// Setup mongodb

var mongoUri = process.env.MONGO_PATH || "mongodb://pullist:C2E3t85K@linus.mongohq.com:10049/pullist"; // process.env.MONGO_URL;

var mongoDb;
var mongo = function(callback){
    if(!mongoDb){
        console.log("Initializing mongodb connection");
        MongoClient.connect(mongoUri, function(error, db){
            console.log("Connected...");
            if(error){ callback(error, null); }
            mongoDb = db;
            callback(null, mongoDb);
        });
    }else{
        callback(null, mongoDb);
    }
};

// Authentication configuration

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(obj, done){
    done(null, obj);
});

passport.use(new GoogleStrategy({
        returnURL: (process.env.BASE_PATH || "http://localhost:5000") + "/auth/google/return",
        realm: process.env.BASE_PATH || "http://localhost:5000"
    },
    function(identifier, profile, done){
        process.nextTick(function(){
            profile.identifier = identifier;
            return done(null, profile);
        });
    }
));

var ensureAuthenticated = function(req, res, next) {
    if(req.isAuthenticated()){ return next(); }
    res.redirect("#/login")
}

// App configuration

app.configure(function(){
    app.set("port", process.env.PORT || 5000);
    app.use(express.static(path.join(__dirname, "static")));
    app.use(express.favicon());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(express.session({
        store: new MongoStore(mongoUri),
        secret: "FIXME: This secret is not secret",
        cookie: {
            maxAge: 604800 * 100 // One week
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
}).listen(process.env.PORT || 5000, function(){});

// Authentication

app.get("/auth/google", passport.authenticate("google", { failureRedirect: "/" }), function(req, res){
    res.redirect("/");
});

app.get("/user", function(req, res){
    if(req.user){
        res.json(200, req.user);
    }else{
        res.json(500, {error: "Not logged in"});
    }
});

app.get("/auth/google/return", passport.authenticate('google', { failureRedirect: "/" }), function(req, res){
    res.redirect("/");
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

// Get pull list for a user

app.get("/list", function(req, res){
    if(req.user && req.user.identifier){
        mongo(function(error, db){
            var collection = db.collection("lists");

            collection.findOne({userIdentifier: req.user.identifier}, function(error, result){
                if(result){
                    res.json(result.list);
                }else{
                    res.json(404, []);
                }
            });
        });
    }else{
        res.json(401, {error: "Not logged in"});
    }
});

// Add an item to a user's pull list

app.put("/list/add/:id", function(req, res){
    if(req.user && req.user.identifier){
        mongo(function(error, db){
            var lists = db.collection("lists");
            var comics = db.collection("comics");

            lists.findOne({userIdentifier: req.user.identifier}, function(error, list){
                if(list){
                    comics.findOne({_id: new ObjectID(req.params.id)}, function(error, comic){
                        if(comic){
                            lists.findAndModify({userIdentifier: req.user.identifier}, null, {$addToSet: {list: {$each: [comic]}}}, {update: true, "new": true}, function(error, updatedList){
                                if(error){ console.log("error", error)}
                                res.json(updatedList.list);
                            });
                        }else{
                            res.json(list.list);
                        }
                    });
                }else{
                    comics.findOne({_id: new ObjectID(req.params.id)}, function(error, comic){
                        if(comic){
                            lists.insert({userIdentifier: req.user.identifier, list: [comic]}, function(error, updatedList){
                                res.json(updatedList.list);
                            });
                        }else{
                            res.json(list.list);
                        }
                    });
                }

            });
        });
    }else{
        res.json(401, {error: "Not logged in"});
    }
});

// Delete an item from a user's pull list

app.delete("/list/:id", function(req, res){
    if(req.user && req.user.identifier){
        mongo(function(error, db){
            var lists = db.collection("lists");

            lists.findOne({userIdentifier: req.user.identifier}, function(error, list){
                if(list){
                    lists.findAndModify({userIdentifier: req.user.identifier}, null, {$pull: {list: {_id: new ObjectID(req.params.id)}}}, {update: true, "new": true}, function(error, updatedList){
                        res.json(updatedList.list);
                    });
                }else{
                    res.json(404, []);
                }

            });
        });
    }else{
        res.json(401, {error: "Not logged in"});
    }
});

// Get a list of weeks we have data for

app.get("/weeks", function(req, res){
    mongo(function(error, db){
        var collection = db.collection("comics");

        collection.distinct("sellDate", function(error, dates){
            dates.sort(function(a, b){
                return a > b ? 1 : a < b ? -1 : 0;
            });

            var weeks = [];

            for(var ii = 0; ii < dates.length; ii++){
                var weekStart = moment(dates[ii]).startOf("week").format("MMM DD/YY");
                var weekEnd = moment(dates[ii]).endOf("week").format("MMM DD/YY");
                var weekLabel = weekStart + " to " + weekEnd;
                var weekValue = moment(dates[ii]).startOf("week").toString();
                var exists = false;
                for(var jj = 0; jj < weeks.length; jj++){
                    if(weeks[jj].label == weekLabel){
                        exists = true;
                    }
                }
                if(!exists){
                    weeks.push({
                        label: weekLabel,
                        value: weekValue
                    });
                }
            }

            res.json(weeks);
        });
   }); 
});

// Get a list of all comics

app.get("/comics/:month/:day/:year", function(req, res){
    mongo(function(error, db){
        var collection = db.collection("comics");

        var startDate = moment(new Date(req.params.year, req.params.month - 1, req.params.day)).toDate();
        var endDate = moment(new Date(req.params.year, req.params.month - 1, req.params.day)).add(1, "weeks").toDate();

        collection.find({sellDate: {$gte: startDate, $lte: endDate}}, function(error, comics){
            comics.toArray(function(error, comics){
                res.end(JSON.stringify(comics));
            });
        });
    });
});