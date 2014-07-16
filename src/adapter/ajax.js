var EMPTY = '';
var $ = require('jquery');
var util = require('util');
var events = require('events');
var attributes = require('attributes');
var _ = require('underscore');
var Errors = require('./errors');
var uuid = 0;
module.exports = AjaxUploader;

/**
 * @name AjaxUploader
 * @class ajax方案上传
 * @constructor
 * @requires UploadType
 */
function AjaxUploader(elem, config) {
  var self = this;
  elem = $(elem);
  var btn = AjaxUploader._renderButton(elem);

  this.files = [];
  this.set('config', config);
  btn.on('change', function (e) {
    for (var i = 0; i < this.files.length; i++) {
      var file = this.files[i];
      file.id = uuid++;
      self.files.push(file);
    }
    self.emit('select', {
      files: this.files
    });

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
}


AjaxUploader.prototype.upload = function (file) {
  var file = this.files[0];

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
  }
});