var express = require("express");
var proxy = require("http-proxy");
var path = require("path");

var publicPath = path.resolve(process.argv[2] || '.');
var port = process.argv[3] || 3000;

var server = express();

server.use(express.errorHandler());
server.use(express.methodOverride());
server.use(server.router);
server.use(express.static(publicPath));
server.use(express.directory(publicPath));

server.listen(port);