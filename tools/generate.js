var fs = require("fs");

var easyimage = require("easyimage");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;

// Setup mongodb

var mongoUri = "mongodb://pullist:C2E3t85K@linus.mongohq.com:10049/pullist"; // process.env.MONGO_URL;

// Parse JSON files and add to database

var files = fs.readdirSync(".cache/json/");

for(var ii = 0; ii < files.length; ii++){
    console.log("#" + f)
    // Read JSON file

    var f = files[ii];
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

             MongoClient.connect(mongoUri, function(error, db){
                if(error){ return console.log("MongoDB error", error); }

                var collection = db.collection("comics");
                collection.update({itemCode: data.itemCode}, data, {upsert: true}, function(error, result){
                    if(error){ return console.log("MongoDB error", error); }

                    console.log("Inserted record for", data.title);
                });
             });
        }
    }catch(e){
        console.log("Error parsing json for file", f, e);
    }
}

/*
fs.writeFileSync("site/data/comics.json", JSON.stringify(output));

var images = fs.readdirSync(".cache/images/");

var processImage = function(num){
    var image = images[num];
    if(!image){
        return;
    }

    console.log(num + "/" + images.length, image);

    easyimage.rescrop({
        src: ".cache/images/" + image,
        dst: "site/images/comics/" + image,
        width: 150,
        cropWidth: 150,
        fill: false
    }, function(error, image){
        if(error){
            console.log("error", error)
        }
        processImage(num + 1);
    });
}

processImage(0);
*/