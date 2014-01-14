var express = require("express");
var http = require("http");
var path = require("path");

var fs = require("fs");
var sys = require("sys")

var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
    
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

// App configuration

app.configure(function(){
    app.set("port", process.env.PORT || 5000);
    app.use(express.static(path.join(__dirname, "static")));
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
}).listen(process.env.PORT || 5000, function(){
    console.log("App started");
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