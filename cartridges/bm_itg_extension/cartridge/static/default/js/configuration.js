!function(e){var t={};function n(s){if(t[s])return t[s].exports;var o=t[s]={i:s,l:!1,exports:{}};return e[s].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(s,o,function(t){return e[t]}.bind(null,o));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=13)}({0:function(e,t,n){"use strict";var s=function(){},o={0:"A new process has been initiated.",1:"Operation successful!",2:"This is a warning message.",3:"Oops! Something went wrong. Please try again."},a={0:"info",1:"success",2:"warning",3:"error"};s.TYPES={INFO:0,SUCCESS:1,WARNING:2,ERROR:3},s.show=function(e,t){var n='<div class="toast custom rounded-5 '+a[e]+'-toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-body d-flex align-items-center gap-5 justify-content-between"><p class="tost-msg mb-0 text-md black d-flex align-items-center gap-3">'+(t||o[e])+'</p><div class="separator"></div><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div></div>',s=$(".toast-messaging");s.html(n);var r=s.children().last();new bootstrap.Toast(r[0]).show()},e.exports=s},13:function(e,t,n){"use strict";var s=n(0);$(document).ready((function(){$("body").on("input",".preferences-data",(function(){var e=!1;$(".preferences-data").each((function(){if(""!==$(this).val())return e=!0,!1})),$(".configuration__header button").prop("disabled",!e)})),$("body").on("click",".show-data-mapping",(function(e){e.preventDefault();var t=$("#dataMapping"),n=($(".data-type-select").length>0?$(".data-type-select").val():"store").split("__"),s=$(this).data("mapping-url"),o={type:n[0],processType:n[1],editMode:!0};t.spinner().start(),$.ajax({url:s,data:o,type:"get",success:function(e){e.success&&(t.find(".modal-data").html(e.renderedTemplate),t.spinner().stop())}})})),$("body").on("click",".delete-map",(function(){$(this).closest(".form-check").find(".delete-map-wrapper").show().animate({width:"100%"}).addClass("shown")})),$("body").on("click",".delete-map-wrapper .no",(function(){$(this).closest(".form-check").find(".delete-map-wrapper").removeClass("shown").animate({width:"0"},(function(){$(this).hide()}))})),$("body").on("click",".delete-map-confirmation",(function(e){e.preventDefault();var t=$(".data-mapping-section").data("delete-data-map-url"),n=$("#dataMapping"),s=($(".data-type-select").length>0?$(".data-type-select").val():"store").split("__"),o=$(this).closest(".data-mapping-id").data("mapping-id"),a={type:s[0],processType:s[1],editMode:!0,mappingId:o};n.spinner().start(),$.ajax({url:t,data:a,type:"post",success:function(e){e.success&&($(this).closest(".data-mapping-id").remove(),n.spinner().stop())}.bind(this)})})),$("body").on("click",".close-configuration",(function(){$("#dataMapping").modal("hide")})),$(document).on("submit","form.configration-form",(function(e){e.preventDefault();var t=$(this),n=t.attr("action");t.spinner().start(),$.ajax({url:n,data:t.serialize(),type:"post",success:function(e){e.success?(t.spinner().stop(),$(".configuration__header  button").attr("disabled",!0)):e.errorMessage&&console.log(e.errorMessage)},error:function(){t.spinner().stop()}})})),$("body").on("change",".data-type-select",(function(){$(".show-data-mapping").prop("disabled")&&$(".show-data-mapping").removeAttr("disabled")})),$(document).on("click",".sync-locations-groups",(function(e){e.preventDefault(),function e(t){var n=$(".sync-locations-section").data("sync-locations-url");$(".sync-locations-groups").spinner().start();var o={};o.exportId=t||"",$.ajax({url:n,data:o,type:"get",success:function(t){t.success?t.responseJSON&&(t.responseJSON.exportCompleted?($(".sync-locations-groups").spinner().stop(),$(".last-locations-sync .value").text(t.responseJSON.locationsDownloadTime)):t.responseJSON.exportId&&setTimeout((function(){$(".sync-locations-groups").spinner().stop(),e(t.responseJSON.exportId)}),1e4)):(t.serverErrors&&t.serverErrors.length&&$.each(t.serverErrors,(function(e,t){s.show(s.TYPES.ERROR,t)})),$(".sync-locations-groups").spinner().stop())},error:function(){$(".sync-locations-groups").spinner().stop()}})}()}))}))}});