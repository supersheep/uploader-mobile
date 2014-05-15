var events = require("events");
var util = require("util");
var attributes = require("attributes");
var uid = require("./uid");

module.exports = Queue;


function Queue(){

}

util.inherits(Queue,events);
attributes.patch(Queue,{
    uploader:{value:{}},
    files:{value:[]}
});

Queue.prototype.add = function(file){
    var files = this.get('files');
    var uploader = this.get('uploader');
    files.push(file);
    this.emit("add",{
        file:file
    });
}

