var express = require("express");
var http = require("http");
var path = require("path");
var passport = require("passport");

var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var GoogleStrategy = require("passport-google").Strategy;

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
    app.use(express.session({ secret: "FIXME: This is a secret" }));
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
    if(req.user){
        mongo(function(error, db){
            var collection = db.collection("lists");

            collection.findAndModify({userIdentifier: req.user.identifer}, null, {userIdentifier: req.user.identifier, list: []}, {upsert: true, "new": true}, function(error, result){
                res.json(result);
            });
        });
    }else{
        res.json(401, {error: "Not logged in"});
    }
});

// Get a list of all comics

app.get("/comics", function(req, res){
    mongo(function(error, db){
        var collection = db.collection("comics");

        collection.find({}, function(error, comics){
            comics.toArray(function(error, comics){
                res.end(JSON.stringify(comics));
            });
        });
    });
});