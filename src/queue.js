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

Queue.prototype.getFileById = function (id) {
    var self = this;
    var files = self.get('files');
    return _.filter(files,function(file){
        return file.id == id;
    })[0];
};

Queue.prototype.getFilesByStatus = function(status){
    var files = this.get("files");
    function matchStatus(file){
        return file.status == status;
    }

    return _.filter(files,matchStatus);
};

Queue.prototype.remove = function(id){
    var files = this.get("files");
    if(!files){return;}
    if(!id){id = files[0].id}
    var new_files = [];
    var file;
    _.forEach(files,function(f){
        if(f.id == id){
            file = f;
        }else{
            new_files.push(f);
        }
    });

    if(file){
        this.set("files",new_files);
        this.emit("remove",{
            file:file
        });
    }
}

Queue.prototype.updateFileStatus = function(file,status){
    file = this.getFileById(file.id);
    if(file){
        file.status = status;
    }
    return true;
}

Queue.prototype.clear = function(){
    var self = this;

    function _remove(){
        var files = self.get("files");
        if(files.length){
            self.remove();
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

