var $ = require("jquery");
var _ = require('underscore');
var attributes = require('attributes');
var EMPTY='';


module.exports = Template;

function Template(container){
    this.container = $(container);

    var self = this;

    var tpl = "<li id='J_upload_item_<%=id%>'><%=name%>"
        +"<div class='progress'>"
            +"<div class='percent' style='background-color:#39d;'></div>"
        "</div>"
    +"</li>";


    this.set('tpl',tpl);
}

attributes.patch(Template,{
    uploader:{value:{}},
    tpl:{value:EMPTY}
});


Template.prototype._createItem = function(event){
    var container = this.container;
    var file = event.file;
    var item = $(_.template(this.get('tpl'),file));
    file.block = item;
    item.appendTo(container);
};

Template.prototype._removeItem = function(file){
    file.block && file.block.remove();
}

Template.prototype._progressHandler = function(file){
    var elem = $(".J_upload_item_"+file.id);
    elem.find(".percent");
}

Template.prototype._successHandler = function(){

}

Template.prototype._completeHandler = function(){

}

Template.prototype._errorHandler = function(){

}