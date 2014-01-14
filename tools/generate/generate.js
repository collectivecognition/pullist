var fs = require("fs");

var easyimage = require("easyimage");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var S3Client = require("knox").createClient({
    key:    "AKIAITU5O47QFXQ2QS3A",
    secret: "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",
    bucket: "pullist"
});

// Setup mongodb

var mongoUri = "mongodb://pullist:C2E3t85K@linus.mongohq.com:10049/pullist"; // process.env.MONGO_URL;

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

// Parse JSON files and add to database

var files = fs.readdirSync(".cache/json/");

var processFile = function(num){
    if(num >= files.length){ 
        console.log("Done");
        process.exit();
        return;
    }

    // Read JSON file

    var f = files[num];
    var data = fs.readFileSync(".cache/json/" + f, "utf-8");

    try{
        // Parse JSON

        var data = JSON.parse(data);
        
        // Strip mature flag and add to JSON

        if(data.title.match(/\(mr\)/i)){
            data.title = data.title.replace(/\(mr\)/i, "");
            data.mature = true;
        }

        // Fix ampersands

        data.title = data.title.replace(/\&amp\;/gi, "&");

        // Reformat series strings

        data.title = data.title.replace(/(\d+)\s+\(?of\s*\(?(\d+)\)/gi, "$1 OF $2");

        // Strip some random strings

        data.title = data.title.replace(/\(C\: .+\)/gi, "");

        // Skip titles with no # symbol (it's assumed that these aren't comics)

        if(data.title.match(/\#/)){
             // Insert or update record for title

             mongo(function(error, db){
                var collection = db.collection("comics");
                collection.update({itemCode: data.itemCode}, data, {upsert: true}, function(error, result){
                    if(error){ console.log("MongoDB error", error); }

                    console.log("Inserted record for", num, data.title);

                    collection.findOne({itemCode: data.itemCode}, function(error, result){
                        // Process and upload image

                        processImage(".cache/images/" + data.itemCode + ".jpg", result._id, function(){
                            processFile(num + 1);
                        });
                    });
                });
             });
        }else{
            processFile(num + 1);
        }
    }catch(e){
        console.log("Error parsing json for file", f, e);
        processFile(num + 1);
    }
};

mongo(function(error, db){
    if(!error){
        processFile(0);
    }
});

// Resize images and upload to S3

var processImage = function(filename, id, callback){
    easyimage.rescrop({
        src: filename,
        dst: "/tmp/" + id + ".jpg",
        width: 300,
        cropWidth: 300,
        fill: false
    }, function(error, image){
        if(error){
            console.log("Error when resizing image", error)
            callback();
        }else{
            S3Client.putFile("/tmp/" + id + ".jpg", "/comics/" + id + ".jpg", {"x-amz-acl": "public-read"}, function(res){
                console.log("Uploaded image to S3");
                callback();
            });
        }
    });
}