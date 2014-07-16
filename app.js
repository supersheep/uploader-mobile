var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var multipart = require('connect-multiparty');
var fs = require('fs');

var upload = express();

upload.use(bodyParser({
    keepExtensions: true,
    uploadDir: path.join(__dirname,'/files')
}));
upload.get('/crossdomain.xml', function(req, res){
    res.sendfile('crossdomain.xml');
});


var count = 0;
upload.all('/',multipart(),function(req,res){
    res.header('Access-Control-Allow-Origin','*');

    if(req.method.toLowerCase() == 'options'){
        return res.send('ok');
    }

    var file = req.files.key;
    var tmp_path = file.path;
    var target_path = './res/' + file.name;

    count++;
    if(count%3 == 0){
        return res.send(200,{
            code: 500,
            message: "something wrong happened"
        });
    }else if(count%3 == 1){
        return res.send(500,"oops");
    }
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) return res.send(500,err);
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) return res.send(500,err);
            setTimeout(function(){
                res.send({
                    code: 200,
                    path: "/res/" + file.name,
                    size: file.size
                });
            });
        });
    });
});

upload.listen(1339);

console.log("upload server started at 1339");


var web = express();
web.use(express.static(__dirname))
web.listen(1234);
console.log("upload server started at 1234");

