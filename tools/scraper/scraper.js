var fs = require("fs");

var request = require ("request");
var cheerio = require("cheerio");
var hash = require("MD5");

var fetch = function(url, callback){
    fs.exists(".cache", function(exists){
        if(!exists){
            fs.mkdirSync(".cache");
        }

        fs.exists(".cache/" + hash(url), function(exists){
            if(exists){
                fs.readFile(".cache/" + hash(url), "utf-8", function(error, cache){
                    callback(cache);
                });
            }else{
                request(url, function(error, response, body){
                    fs.writeFile(".cache/" + hash(url), body, function(){
                        callback(body);
                    });
                });
            }
        });
    });
};

var baseHREF = "http://www.previewsworld.com/"

fetch(baseHREF, function(html){
    var $ = cheerio.load(html);

    var newReleasesHREF = baseHREF + $("a").filter(function(){
        return $(this).text() == "New Releases";
    }).attr("href");

    fetch(newReleasesHREF, function(html){
        $ = cheerio.load(html);

        var productHREFs = [];

        $("a").each(function(index, anchor){
            if($(this).attr("href").indexOf("stockItemID") > -1){
                productHREFs.push($(this).attr("href"));
            }
        });

        fetch(productHREFs[0], function(html){
            $ = cheerio.load(html);

            var product = {
                title: $(".StockCodeDescription a").html(),
                publisher: $(".StockCodePublisher").text().replace(/Publisher:\W+/, ""),
                itemCode: $(".StockCodeDiamdNo").text().replace(/Item Code:\W+/, ""),
                sellDate: $(".StockCodeInShopsDate").text().replace(/In Shops:\W+/, ""),
                price: $(".StockCodeSrp").text().replace(/SRP:\W+/, ""),
                description: $(".PreviewsHtml").text(),
                creators: creators
            };

            console.log(product);
        });
    });
});