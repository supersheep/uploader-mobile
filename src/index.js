'use strict';

var events = require("events");
var util = require("util");
var $ = require("jquery");
var Queue = require("./queue");
var _ = require("underscore");
var attributes = require("attributes");
var Errors = require("./errors");

module.exports = Uploader;

var adapters = {
    flash : require("./adapter/flash"),
    ajax : require("./adapter/ajax")
};


function Uploader(element,config){
    var theme = config.theme || require("./theme/default");
    var self = this;

    this.type = config.type || this._getType();

    this.set('autoUpload',config.autoUpload);
    this.set('queueTarget',config.queueTarget || "#queue");
    this.set('multipleLen',config.multipleLen || -1 );
    this.set('beforeUpload',config.beforeUpload);
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

        _.forEach(files,function(file){
            queue.add(file);
        });
        if (!curId && self.get('autoUpload')) {
            self.upload();
        }
    });

    adapter.on('start',function(e){
        self.emit("start",e);
        self.set('currentId',e.file.id);
    });

    adapter.on("progress",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"progress");
        self.emit("progress",e);
    });

    adapter.on("success",function(e){
        self.emit("success",e);
    });

    adapter.on("error",function(e){
        self.emit("error",e);
    });

    self.on("success",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"success");
        self.emit("complete",e);
    });

    self.on("error",function(e){
        var queue = self.get("queue");
        queue.updateFileStatus(e.file,"error");
        self.emit("complete",e);
    });

    self.on("complete",function(e){
        var queue = self.get("queue");
        var file = e.file;
        self._continue();
    });

    self.on("enable",function(){
        adapter.setDisabled(false);
    });

    self.on("disable",function(){
        adapter.setDisabled(true);
    });

    this.set("adapter",adapter);

    this._auth(config);
    this._theme(theme);
}

util.inherits(Uploader,events);
attributes.patch(Uploader,{
    queueTarget:{
        setter: function(selector){
            return $(selector);
        }
    },
    beforeUpload:{value:function(){}},
    theme:{value:{}},
    data:{value:{}},
    /**
     * 是否自动上传
     * @type Boolean
     * @default true
     */
    autoUpload:{
        value:true,
        setter:function(v){
            if(v===undefined){
                return true
            }
        }
    },
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
    maxItems:{value:-1},
    /**
     *  当前上传的文件对应的在数组内的Id，如果没有文件正在上传，值为空
     *  @type Number
     *  @default ""
     */
    currentId:{value:''},
    isAllowUpload:{value:true},
    isSuccess:{value:function(){return true;}}
});

Uploader.prototype.upload = function(file){
    var self = this;
    var beforeUpload = this.get('beforeUpload');

    if(!file){
        this._continue();
    }else{
        file.ext = "." + _.chain(file.name.split(".")).reverse().value()[0];
        if(beforeUpload){
            beforeUpload.call(self, file, _.bind(this._upload,this,file));
        }else{
            this._upload(file);
        }
    }
}

Uploader.prototype._upload = function(file){
    var adapter = this.get("adapter");
    this.get("data") && adapter.setData(this.get("data"));
    adapter.upload(file);
}

Uploader.prototype.remove = function(file){
    this.get("queue").remove(file);
}

Uploader.prototype._convertSizeUnit = function(size){
    var match = size.match(/(\d+)(\w)/);
    var count = match[1];
    var unit = match[2];
    var units = ["K","M","G"];
    return count * Math.pow(1024, units.indexOf(unit) + 1);
}


Uploader.prototype._auth = function(config){
    var self = this;
    var maxItems = config.maxItems;
    var allowExtensions = config.allowExtensions;
    var maxSize = config.maxSize || -1;
    var adapter = this.get("adapter");

    maxItems && self.set("maxItems",maxItems);

    allowExtensions
    && self.on("load",function(){
        self.get("adapter").setFileTypes(allowExtensions);
    });

    this.on('add', function(e){
        var file = e.file;
        if(maxSize > 0 && self._convertSizeUnit(maxSize) < file.size){
            return self.emit("error",{
                file:file,
                code: Errors.UPLOAD_FAILED,
                message: "UPLOAD_FAILED"
            });
        }
    });

    this.on('success', function(){
        if(self.reachMax()){
            self.emit("disable");
        }
    });

    this.on("remove", function(){
        if(!self.reachMax()){
            self.emit("enable");
        }
    });
    return this;
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

Uploader.prototype._createItem = function (event) {
  var self = this;
  var container = this.get('queueTarget');
  var file = event.file;
  var item = $(_.template(this.get('theme').template, file));
  item.attr('id', 'J_upload_item_' + file.id);
  item.appendTo(container);

  item.find(".J_upload_remove").on("click", function () {
    self.remove(file);
  });
};

Uploader.prototype._theme = function(theme){
    var self = this;
    this.set('theme',theme);
    self.on('add',function(file){
        self._createItem(file);
    });

    _.forEach(['load','add','remove','start','progress','success','error','complete'],function(ev){
        self.on(ev,function(e){
            var func = theme[ev];
            if(e && _.isObject(e) && e.file){
                e.elem = $("#J_upload_item_" + e.file.id);
            }
            func && func.call(self,e);
        });
    });
}

Uploader.prototype._successCount = function(){
    return this.get("queue").getFilesByStatus("success").length;
}

Uploader.prototype.reachMax = function(){
    var maxItems = this.get("maxItems");
    return maxItems > 0 && maxItems <= this._successCount();
}

/**
 * 超过最大多选数予以截断
 */
Uploader.prototype._processExceedMultiple = function (files) {
    // var filesArr = [];
    var self = this,
        multipleLen = self.get('multipleLen'),
        maxItems = self.get("maxItems"),
        succeeded = self._successCount();

    if ( (multipleLen < 0 && maxItems < 0 ) || !files.length) return files;
    return _.filter(files, function (file, index) {
        if(maxItems < 0){
            return index < multipleLen;
        }

        if(multipleLen < 0){
            return index < maxItems - succeeded;
        }

        return index < multipleLen && index < maxItems - succeeded;
    });
};

Uploader.prototype._continue = function(){
    var queue = this.get("queue");
    var file = queue.getFilesByStatus("waiting")[0];
    if(file){
        this.upload(file);
    }else{
        this.set('currentId',null);
    }
}

Uploader.prototype._getType = function(){
    if (new XMLHttpRequest().upload) {
        return "ajax";
    } else {
        return "flash";
    }
}

