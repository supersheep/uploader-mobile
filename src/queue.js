var events = require("events");
var util = require("util");
var attributes = require("attributes");
var uid = require("./uid");
var _ = require("underscore");

module.exports = Queue;


function Queue(){

}

util.inherits(Queue,events);
attributes.patch(Queue,{
    uploader:{value:{}},
    files:{value:[]}
});

Queue.prototype.getFile = function (indexOrId) {
    var self = this;
    var file;
    var files = self.get('files');
    if(_.isNumber(indexOrId)){
        file = files[indexOrId];
    }else{
        _.forEach(files, function (f) {
            if (f.id == indexOrId) {
                file = f;
                return true;
            }
        });
    }
    return file;
};

Queue.prototype.getIndexes = function(status){
    var files = this.get("files");
    function matchStatus(file){
        return file.status == status;
    }

    function getIdOrIndex(file){
        return file.id || file.index;
    }

    return _.map(_.filter(files,matchStatus),getIdOrIndex);
};

Queue.prototype.remove = function(indexOrId){
    var files = this.get("files");
    var index;
    if(_.isString(indexOrId)){
        index = this.getFileIndex(indexOrId);
    }
}

Queue.prototype.getFileIndex = function(id){
    var files = this.get("files");
    return _.filter(files,function(file){
        return file.id == id;
    })[0];
}

Queue.prototype.updateFileStatus = function(file,status){
    var id = file.id || file.index;
    file = this.getFile(id);
    file.status = status;
}

Queue.prototype.clear = function(){
    var self = this;

    function _remove(){
        var files = self.get("files");
        if(files.length){
            self.remove(0);
            _remove();
        }else{
            self.fire("clear");
        }
    }
    _remove();
}

Queue.prototype.add = function(file){
    var files = this.get('files');
    var uploader = this.get('uploader');
    file.status = "waiting";
    files.push(file);
    this.emit("add",{
        file:file
    });
};

