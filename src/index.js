'use strict';

var events = require("events");
var util = require("util");
var $ = require("jquery");
var Queue = require("./queue");
var _ = require("underscore");
var attributes = require("attributes");

module.exports = Uploader;

var adapters = {
    flash : require("./adapter/flash"),
    ajax : require("./adapter/ajax"),
    iframe: require("./adapter/iframe")
}


function Uploader(element,config){

    var Theme = config.theme || require("./template/default");
    var self = this;

    this.type = config.type || "flash";

    this.set('autoUpload',config.autoUpload);
    this.set('queueTarget',config.queueTarget);
    this.set('data',config.data);

    var adapter = new adapters[this.type](element,config);

    // 初始化上传队列

    this._initQueue();

    adapter.on("load",function(){
        self.emit("load");
    });

    adapter.on("select",function(e){
        var queue = self.get('queue'),
            curId = self.get('currentId'),
            files = e.files;

        files = self._processExceedMultiple(files);
        self.emit("select",{files:files});

        _.forEach(e.files,function(file){
            queue.add(file);
        });
        if (!curId && self.get('autoUpload')) {
            self.upload();
        }
    });

    adapter.on('start',function(e){
        self.set('currentId',e.file.id);
    });

    adapter.on("progress",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"progress");
        self.emit("progress",e);
    });

    adapter.on("success",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"success");
        self.emit("success",e);
        self.emit("complete",e);
    });

    adapter.on("error",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"error");
        self.emit("error",e);
        self.emit("complete",e);
    });

    self.on("complete",function(e){
        var queue = self.get("queue");
        var file = e.file;
        if(self.get("autoUpload")){
            self._continue();
        }
    });

    this.set("adapter",adapter);

    this._theme(new Theme(this.get('queueTarget')));
}

util.inherits(Uploader,events);
attributes.patch(Uploader,{
    queueTarget:{value:'#queue'},
    data:{value:{}},
    /**
     * 是否自动上传
     * @type Boolean
     * @default true
     */
    autoUpload:{value:true},
    /**
     * Queue队列的实例
     * @type Queue
     * @default {}
     */
    queue:{value:{}},
    /**
     * 上传方式实例
     * @type UploaderType
     * @default {}
     */
    adapter:{value:{}},
    /**
     * 用于限制多选文件个数，值为负时不设置多选限制
     * @type Number
     * @default -1
     */
    multipleLen:{value:-1},
    /**
     *  当前上传的文件对应的在数组内的Id，如果没有文件正在上传，值为空
     *  @type Number
     *  @default ""
     */
    currentId:{value:''},
    isAllowUpload:{value:true},
    isSuccess:{value:function(){return true;}}
});

Uploader.prototype.upload = function(id){
    this.emit("start");
    var adapter = this.get("adapter");
    if(!id){
        this._continue();
    }else{
        adapter.setData(this.get("data"));
        adapter.upload(id);
    }
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


Uploader.prototype._theme = function(theme){
    var self = this;
    var queue = this.get('queue');
    theme.set('uploader',self);
    self.on('add',function(file){
        theme._createItem(file);
    });

    _.forEach(['load','add','remove','start','progress','success','error','complete'],function(ev){
        self.on(ev,function(e){
            var func = theme["_" + ev + "Handler"];
            func && func.call(self,e);;
        });
    });
}

/**
 * 超过最大多选数予以截断
 */
Uploader.prototype._processExceedMultiple = function (files) {
    var self = this, multipleLen = self.get('multipleLen');
    if (multipleLen < 0 || !_.isArray(files) || !files.length) return files;
    return S.filter(files, function (file, index) {
        return index < multipleLen;
    });
};

Uploader.prototype._continue = function(){
    var queue = this.get("queue");
    var id = queue.getIds("waiting")[0];
    if(id){
        this.upload(id);
    }else{
        this.set('currentId',null);
    }
}

Uploader.prototype._getType = function(){
    return "flash";
}

