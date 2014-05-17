var $ = require("jquery");
var SWFUpload = require("swfuploader");
var events = require("events");
var _ = require("underscore");
var util = require("util");
var JSON = require("json");

var ERRORS = {
    "-200" : "HTTP_ERROR"                  ,
    "-210" : "MISSING_UPLOAD_URL"          ,
    "-220" : "IO_ERROR"                    ,
    "-230" : "SECURITY_ERROR"              ,
    "-240" : "UPLOAD_LIMIT_EXCEEDED"       ,
    "-250" : "UPLOAD_FAILED"               ,
    "-260" : "SPECIFIED_FILE_ID_NOT_FOUND" ,
    "-270" : "FILE_VALIDATION_FAILED"      ,
    "-280" : "FILE_CANCELLED"              ,
    "-290" : "UPLOAD_STOPPED"              ,
    "-300" : "JSON_PARSE_FAILED"           ,
    "-310" : "CUSTOM_DEFINED_ERROR"
};

var default_options = require("./flash_default_options");

module.exports = FlashUploader;
FlashUploader.errors = ERRORS;
function FlashUploader(elem, config){
    var self = this;
    var isSuccess = _.isFunction(config.isSuccess) ? config.isSuccess : function(){return true;};

    var handlers = {
        file_dialog_complete_handler:function(numFilesSelected, numFilesQueued, numFilesInQueue){
            console.log(arguments);
            var files = [];
            var stats = this.getStats();
            var total = _.reduce(_.values(stats),function(a,b){
                return a+b;
            },0);
            for(var i = total - numFilesSelected; i < total; i++){
                files.push(this.getFile(i));
            }


            console.log("stats",stats);
            console.log("total",total);
            console.log("args",arguments);


            self.emit("select",{
                files:files
            });
        },
        upload_start_handler:function(file){
            self.emit("start",{
                file:file
            });
        },
        file_queued_handler:function(file){
            console.log("queued",file);
        },
        file_queue_error_handler:function(file,code,message){

            console.log("queued error",file);
        },
        upload_progress_handler:function(file,uploaded,total){
            self.emit("progress",{
                file:file,
                uploaded:uploaded,
                total:total
            });
        },
        upload_error_handler:function(file,code,message){
            self.emit("error",{
                file:file,
                code:code,
                message:message
            });
        },
        // file:
        // The file object that was successfully uploaded
        // data:
        // The data that was returned by the server-side script (anything that was echoed by the file)
        // response:
        // The response returned by the server—true on success or false if no response.
        // If false is returned, after the successTimeout option expires, a response of true is assumed.
        upload_success_handler:function(file,data,response){
            var data;


            try{
                data = JSON.parse(data);
            }catch(e){
                self.emit("error",{
                    file:file,
                    code:"-300",
                    message:"error parsing JSON"
                });
                return;
            }

            if(!isSuccess(data)){
                self.emit("error",{
                    file:file,
                    code:"-310",
                    message:"error custom",
                    data:data
                })
            }else{
                self.emit("success",{
                    file:file,
                    data:data,
                    res:response
                });
            }
        },
        upload_complete_handler:function(){}
    };


    elem = $(elem);
    var id = FlashUploader._renderButton(elem);

    var custom_configs = {
        upload_url: config.action,
        file_queue_limit : config.limit,
        button_placeholder_id: id,
        button_width: elem.width(),
        button_height: elem.height()
    }


    var swf_config;
    swf_config = _.extend({},default_options);
    swf_config = _.extend(swf_config,handlers);
    swf_config = _.extend(swf_config,custom_configs);
    swf_config = _.extend(swf_config,config.swf_config);

    this.swfu = new SWFUpload(swf_config);
};

util.inherits(FlashUploader,events);
FlashUploader.instanceCount = 0;


FlashUploader.prototype.upload = function(indexOrId){

    this.swfu.startUpload(indexOrId);
}

FlashUploader.prototype.cancel = function(){

};

FlashUploader._renderButton = function(elem){

    var id = "swfu_holder_" + (FlashUploader.instanceCount+1);
    var holder = $("<div class='swfu_wrapper'><div id='" + id + "' /></div>");

    elem.css("position","relative");
    holder.css({
        "position":"absolute",
        "top":0,
        "left":0,
        "width": elem.width(),
        "height": elem.height()
    });
    holder.appendTo(elem);
    return id;
};