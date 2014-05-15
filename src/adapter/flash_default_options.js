var SWFUpload = require("swfuploader");
module.exports = {
    flash_url : "http://www.dianping.com/shoppic/res/swfupload.swf",
    post_params: {},
    file_size_limit : "100 MB",
    file_types : "*.jpg;*.png;*.bmp",
    file_types_description : "All Files",
    file_post_name: "file",
    file_upload_limit : 0,
    custom_settings : {
        progressTarget : "fsUploadProgress",
        cancelButtonId : "btnCancel"
    },
    debug: false,

    // Button settings
    // button_image_url: "images/TestImageNoText_65x29.png",
    button_cursor : SWFUpload.CURSOR.HAND,
    button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
    // button_text: '<span class="theFont">Hello</span>',
    // button_text_style: ".theFont { font-size: 16; }",
    button_text_left_padding: 12,
    button_text_top_padding: 3
};
