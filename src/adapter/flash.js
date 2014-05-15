var $ = require("jquery");
var SWFUpload = require("swfuploader");
var events = require("events");
var _ = require("underscore");
var util = require("util");
var JSON = require("json");


var default_options = require("./flash_default_options");

module.exports = FlashUploader;
function FlashUploader(elem,config){
    var self = this;

    var handlers = {
        file_dialog_complete_handler:function(numFilesSelected, numFilesQueued, numFilesInQueue){
            var stats = this.getStats();
            var files = [];
            for(var i = 0; i < numFilesSelected; i++){
                files.push(this.getFile(i));
            }
            self.emit("select",{
                files:files
            });
        },
        upload_start_handler:function(file){
            self.emit("start",{
                file:file
            });
        },
        file_queued_handler:function(file){},
        file_queue_error_handler:function(file,code,message){},
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
            self.emit("success",{
                file:file,
                data:JSON.parse(data),
                res:response
            });
        },
        upload_complete_handler:function(file){}
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


FlashUploader.prototype.upload = function(index){

    this.swfu.startUpload();
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