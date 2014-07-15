module.exports = {
    template: '<li>'
                +'<div class="pic" style="display:none"><img /></div>'
                +'<div class="name"><%=name%></div>'
                +'<div class="status"></div>'
                +'<div class="progress">'
                +    '<div class="percent" style="background-color:#39d;"></div>'
                +'</div>'
                +'<span class="J_upload_remove remove">x</span>'
            +'</li>',
    success: function(e){
        var elem = e.elem;
        elem.find(".pic").show();
        elem.find("img").attr("src",e.data.path);
        elem.find(".progress").hide();
        elem.find(".status").addClass("ok").html("成功");
    },
    remove: function(e){
        var elem = e.elem;
        elem && elem.remove();
    },
    progress: function(e){
        var elem = e.elem;
        elem.find(".percent").css("width", e.uploaded / e.total * 100 + "%");
    },
    error: function(e){
      var elem = e.elem;
      elem.find(".progress").hide();
      elem.find(".status").addClass("fail").html("失败");
    }
}