var _ = require('underscore');
module.exports = Validator;


function convertSize(size){
    size = (size).trim();
    var num = parseFloat(size);
    var unit = size.split(num)[1];
    var timesMap = {};
    unit = unit.trim();
    if(unit){
        _.forEach(["KB","MB","GB"],function(un,i){
            timesMap[un] = Math.pow(1024,i+1);
        });
        return (timesMap[unit.toUpperCase()] || 1) * num;
    }else{
        return num;
    }
}

function Validator(uploader){
    this.uploader = uploader;

    uploader.on("add",function(file){

    });
    uploader.on("remove",function(file){

    });
    uploader.on("success",function(){
        // allow Max
    });
    uploader.on("error",function(){
        // 阻止后续文件上传
        uploader.set('isAllowUpload', true);
    });
}

Validator.prototype.testExt = function(file){};
Validator.prototype.testMax = function(){

    var uploader = this.uploader;
    var max = uploader.get("max");
    if(!this.allowMax){return true;}
    return this.allowMax > uploader.get("queue").getFiles("success").length;
};
Validator.prototype.testMaxSize = function(file){
    var maxSize = uploader.get("maxSize");
    return file.size < convertSize(this.maxSize);
};