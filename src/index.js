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
    ajax : require("./adapter/ajax")
};


function Uploader(element,config){
    var theme = config.theme || require("./theme/default");
    var self = this;

    this.type = config.type || this._getType();

    this.set('autoUpload',config.autoUpload);
    this.set('queueTarget',config.queueTarget || "#queue");
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

        _.forEach(e.files,function(file){
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
        self._continue();
    });

    this.set("adapter",adapter);

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
    var queue = this.get('queue');
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
    var file = queue.getFilesByStatus("waiting")[0];
    if(file){
        this.upload(file);
    }else{
        this.set('currentId',null);
    }
}

Uploader.prototype._getType = function(){
    return "ajax";
}

