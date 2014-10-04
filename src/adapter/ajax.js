var EMPTY = '';
var $ = require('zepto');
var util = require('util');
var events = require('events');
var attributes = require('attributes');
var _ = require('underscore');
var mime = require('simple-mime')('application/octect-stream');
var Errors = require('../errors');
var uuid = 0;
module.exports = AjaxUploader;

/**
 * @name AjaxUploader
 * @class ajax方案上传
 * @constructor
 * @requires UploadType
 */
function AjaxUploader(elem, config) {
  elem = $(elem);
  var self = this;
  var btn = this._btn = AjaxUploader._renderButton(elem);

  this.files = [];
  this.set('config', config);
  btn.on('click',function(){
    if(self.get("isDisabled")){
      return false;
    }
  });
  btn.on('change', function (e) {
    for (var i = 0; i < this.files.length; i++) {
      var file = this.files[i];
      file.id = uuid++;
      self.files.push(file);
    }

    self.emit('select', {
      files: self.files
    });
    btn.val("");
  });

  setTimeout(function () {
    self.emit('load');
  });

}

util.inherits(AjaxUploader, events);

AjaxUploader._renderButton = function (elem, config) {
  var self = this;
  var btn = $("<input multiple type='file' />");
  elem.css("position", "relative");
  btn.css({
    "position": "absolute",
    "top": 0,
    "left": 0,
    "opacity": 0,
    "width": elem.width(),
    "height": elem.height()
  });
  btn.appendTo(elem);
  return btn;
};


AjaxUploader.prototype.setDisabled = function(isDisabled){
  this.set("isDisabled",isDisabled);
};

AjaxUploader.prototype.setFileTypes = function(extensions) {
  var accept = _.map(extensions, function(ext){
    return mime(ext);
  }).join(",");
  this._btn.attr("accept", accept);
};

AjaxUploader.prototype.upload = function (file) {
  var file = _.filter(this.files,function(file){
    return file.status == "waiting";
  })[0];

  var config = this.get('config');
  var data = this.get('data');
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', config.action, true);

  var formData = new FormData();
  formData.append(config.name, file);
  for (var key in data) {
    formData.append(key, data[key]);
  }

  xhr.upload.addEventListener('progress', function (e) {
    self.emit('progress', {
      file: file,
      uploaded: e.loaded,
      total: e.total
    });
  });

  xhr.addEventListener('load', function (e) {
    var isSuccess = _.isFunction(config.isSuccess) ? config.isSuccess : function () {
      return true;
    };
    var error = null;
    var data = xhr.responseText;
    self.files.shift();

    function emitErr(key){
      self.emit("error",{
        file:file,
        code: Errors[key],
        message: key
      });
    }

    if(xhr.status !== 200){
      return emitErr("HTTP_ERROR");
    }

    try {
      data = JSON.parse(data);
    } catch (e) {
      return emitErr("JSON_PARSE_FAILED");
    }

    if (!isSuccess(data)) {
      return emitErr("CUSTOM_DEFINED_ERROR");
    }

    self.emit("success", {
      file: file,
      data: data
    });

  });

  xhr.addEventListener('error', function (e) {
    self.emit('error', {
      file:file,
      code: Errors.UPLOAD_FAILED,
      message: "UPLOAD_FAILED"
    });
  });

  xhr.send(formData);
};

AjaxUploader.prototype.setData = function (data) {
  this.set('data', data);
};

attributes.patch(AjaxUploader, {
  config: {
    value: {}
  },
  data: {
    value: {}
  },
  isDisabled:{
    value: false
  }
});