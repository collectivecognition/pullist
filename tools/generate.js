var fs = require("fs");

var easyimage = require("easyimage");

var output = [];

var files = fs.readdirSync(".cache/json/");

for(var ii = 0; ii < files.length; ii++){
    var f = files[ii];
    var data = fs.readFileSync(".cache/json/" + f, "utf-8");
    try{
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

        if(data.title.match(/\#/)){
            output.push(data);    
        }
        
    }catch(e){
        console.log("error parsing json", e);
    }
}

fs.writeFileSync("site/data/comics.json", JSON.stringify(output));

/*
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
        width: 100,
        height: 150,
        cropWidth: 100,
        cropHeight: 150,
        fill: true
    }, function(error, image){
        if(error){
            console.log("error", error)
        }
        processImage(num + 1);
    });
}

processImage(0);
*/