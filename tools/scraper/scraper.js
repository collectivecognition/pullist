var fs = require("fs");

var request = require ("request");
var cheerio = require("cheerio");
var hash = require("MD5");
var http = require("http-get");

fs.exists(".cache", function(exists){
    if(!exists){
        fs.mkdirSync(".cache");
        fs.mkdirSync(".cache/html");
        fs.mkdirSync(".cache/images");
        fs.mkdirSync(".cache/json");
    }
});

var fetch = function(url, callback){
    fs.exists(".cache/html/" + hash(url), function(exists){
        if(exists){
            console.log("loading from cache");
            fs.readFile(".cache/html/" + hash(url), "utf-8", function(error, cache){
                callback(cache);
            });
        }else{
            console.log("loading from web")
            request(url, function(error, response, body){
                fs.writeFile(".cache/html/" + hash(url), body, function(){
                    callback(body);
                });
            });
        }
    });
};

var getProduct = function(href){
    fetch(href, function(html){
        $ = cheerio.load(html);

        var product = {
            title: $(".StockCodeDescription a").html(),
            publisher: $(".StockCodePublisher").text().replace(/Publisher:\W+/, ""),
            itemCode: $(".StockCodeDiamdNo").text().replace(/Item Code:\W+/, ""),
            sellDate: $(".StockCodeInShopsDate").text().replace(/In Shops:\W+/, ""),
            price: $(".StockCodeSrp").text().replace(/(SRP:\W+)|\s+/g, ""),
            description: $(".PreviewsHtml").text(),
            creators: $(".StockCodeCreators").text()
        };

        console.log("Saving json for " + product.title);
        fs.writeFileSync(".cache/json/" + product.itemCode + ".json", JSON.stringify(product));

        var imageHREF = baseHREF + "/" + $(".FancyPopupImage").attr("href");

        fs.exists(".cache/images/" + product.itemCode + ".jpg", function(exists){
            if(!exists){
                console.log("fetching image");
                http.get(imageHREF, ".cache/images/" + product.itemCode + ".jpg", function(error, result){
                    console.log("fetched image and saved in cache");
                });
            }
        });
    });
};

var productHREFs = [];
var processProductHREF = function(num){
    if(!productHREFs[num]){
        return;
    }

    console.log("Fetching href #" + num);

    var href = productHREFs[num];

    var exists = fs.existsSync(".cache/html/" + hash(href));

    getProduct(href);

    if(exists){
        processProductHREF(num + 1);
    }else{
        var wait = 5000;
        console.log("Waiting for " + wait + "ms");
        setTimeout(function(){
            processProductHREF(num + 1);
        }, wait);
    }
}

var baseHREF = "http://www.previewsworld.com";

fetch(baseHREF, function(html){
    var $ = cheerio.load(html);

    var newReleasesHREF = baseHREF + $("a").filter(function(){
        return $(this).text() == "New Releases";
    }).attr("href");

    fetch(newReleasesHREF, function(html){
        $ = cheerio.load(html);

        $("a").each(function(index, anchor){
            if($(this).attr("href") && $(this).attr("href").indexOf("stockItemID") > -1){
                productHREFs.push($(this).attr("href"));
            }
        });

        console.log(productHREFs.length + " products found");

        processProductHREF(0);
    });
});