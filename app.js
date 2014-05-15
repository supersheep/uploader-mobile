var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var multipart = require('connect-multiparty');

var upload = express();

upload.use(bodyParser({
    keepExtensions: true,
    uploadDir: path.join(__dirname,'/files')
}));
upload.get('/crossdomain.xml', function(req, res){
    res.sendfile('crossdomain.xml');
});


upload.all('/',multipart(),function(req,res){
    res.send(req.files);
});

upload.listen(1339);




var web = express();
web.use(express.static(__dirname))
web.listen(1234);

