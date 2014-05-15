'use strict';

var events = require("events");
var util = require("util");
var $ = require("jquery");
var Queue = require("./queue");
var _ = require("underscore");
var attributes = require("attributes");
var Theme = require("./template/default");

module.exports = Uploader;

var adapters = {
    flash : require("./adapter/flash"),
    ajax : require("./adapter/ajax"),
    iframe: require("./adapter/iframe")
}


function Uploader(element,config){
    var self = this;

    this.type = config.type || "flash";
    var adapter = new adapters[this.type](element,config);

    // 初始化上传队列

    this._initQueue();

    adapter.on("select",function(e){
        var queue = self.get('queue');
        self.emit("select",e);
        _.forEach(e.files,function(file){
            queue.add(file);
        });
    });

    adapter.on("success",function(e){
        self.emit("success",e);
    });

    adapter.on("progress",function(e){
        self.emit("progress",e);
    });

    adapter.on("error",function(e){
        self.emit("error",e);
    });

    this.set("adapter",adapter);

    this.theme(new Theme("#queue"));
}

util.inherits(Uploader,events);
attributes.patch(Uploader,{
    queue:{value:{}},
    adapter:{value:{}}
});

Uploader.prototype.upload = function(index){
    var type = this.type = this._getType();

    this.emit("start");
    this.get("adapter").upload(index);
}


Uploader.prototype._initQueue = function () {
    var self = this, queue = new Queue();
    //将上传组件实例传给队列，方便队列内部执行取消、重新上传的操作
    queue.set('uploader', self);

    queue.on('add',function(ev){
        self.emit("add",ev);
    });

    //监听队列的删除事件
    queue.on('remove', function (ev) {
        self.emit("remove",ev);
    });
    self.set('queue', queue);
    return queue;
};


Uploader.prototype.theme = function(theme){
    var self = this;
    var queue = this.get('queue');
    self.on('add',function(file){
        theme._createItem(file);
    });

    self.on('remove',function(file){
        theme._removeItem(file);
    })

    _.forEach(['add','remove','start','progress','success','error','complete'],function(ev){
        self.on(ev,function(e){
            var func = theme["_" + ev + "Handler"];
            func && func.call(self,e);;
        });
    });
}

Uploader.prototype._getType = function(){
    return "flash";
}

