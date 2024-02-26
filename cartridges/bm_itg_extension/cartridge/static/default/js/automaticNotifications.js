!function(t){var e={};function n(i){if(e[i])return e[i].exports;var a=e[i]={i:i,l:!1,exports:{}};return t[i].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=t,n.c=e,n.d=function(t,e,i){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)n.d(i,a,function(e){return t[e]}.bind(null,a));return i},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=12)}({0:function(t,e,n){"use strict";var i=function(){},a={0:"A new process has been initiated.",1:"Operation successful!",2:"This is a warning message.",3:"Oops! Something went wrong. Please try again."},s={0:"info",1:"success",2:"warning",3:"error"};i.TYPES={INFO:0,SUCCESS:1,WARNING:2,ERROR:3},i.show=function(t,e){var n='<div class="toast custom rounded-5 '+s[t]+'-toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-body d-flex align-items-center gap-5 justify-content-between"><p class="tost-msg mb-0 text-md black d-flex align-items-center gap-3">'+(e||a[t])+'</p><div class="separator"></div><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div></div>',i=$(".toast-messaging");i.html(n);var r=i.children().last();new bootstrap.Toast(r[0]).show()},t.exports=i},12:function(t,e,n){"use strict";var i=n(0);$(document).ready((function(){var t=$(".invalid-feedback.display-error-msg");function e(t){return/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(t)}function n(t){const n=t.val(),i=$(t).parent();return i.removeClass("has-error"),i.find(".invalid-feedback").hide(),!(!e($.trim(n))||""===$.trim(n))||(i.addClass("has-error"),i.find(".invalid-feedback").show(),!1)}function a(t,e){return e.length||(t.find(".recipient-emails-form").addClass("has-error"),t.find(".recipient-emails-form .invalid-feedback").show()),!(!n($("input#senderEmail"))||t.find(".form-group").hasClass("has-error"))||(window.scrollTo({top:$(".invalid-feedback:visible:first").parent().find("input").offset().top-100,behavior:"smooth"}),$(".invalid-feedback:visible:first").parent().find("input").focus(),!1)}function s(t){t.find(".form-group").removeClass("has-error"),t.find(".invalid-feedback").hide()}t&&t.length&&t.each((function(){$(this).show()})),$("#saveOOSNotificationSettings").on("click",(function(t){t.preventDefault();var e=$("form.oos-notification"),n=[],r=[];if(e.find(".recipient-emails-form .list-item").each((function(){n.push($(this).find(".value").text())})),e.find(".oos-notification-product-ids .list-item").each((function(){r.push($(this).find(".value").text())})),s(e),a(e,n)){var o={recipientEmails:n,products:r};s(e),e.spinner().start(),$.ajax({url:e.attr("action"),data:{data:JSON.stringify(o)},type:"post",success:function(t){t&&t.success?$(".oos-error-msg").html(""):t.errorMsg&&($(".oos-error-msg").html(t.errorMsg),$(".oos-error-msg").show(),i.show(i.TYPES.ERROR,t.errorMsg)),e.spinner().stop()}})}})),$("#saveOrderIntervalAlertSettings").on("click",(function(t){t.preventDefault();var e=$("form.order-interval-alert"),n=[];if(e.find(".list-item").each((function(){n.push($(this).find(".value").text())})),s(e),a(e,n)){var r={days:e.find("input#days").val()||0,hours:e.find("input#hours").val()||0,minutes:e.find("input#minutes").val()||0},o={recipientEmails:n,interval:r};s(e),e.spinner().start(),$.ajax({url:e.attr("action"),data:{data:JSON.stringify(o)},type:"post",success:function(t){t&&t.success?(e.find(".order-interval-alert").empty(),""!==t.orderIntervalValue&&(e.find(".order-interval-alert").append('<span class="order-interval-value d-flex align-items-center">'+t.orderIntervalValue+"<span>"),$(".order-interval-alert").removeClass("d-none"))):t.errorMsg&&($(".order-interval-error-msg").html(t.errorMsg),$(".order-interval-error-msg").show(),i.show(i.TYPES.ERROR,t.errorMsg)),e.spinner().stop()}})}})),$("#saveFailedOrderAlertSettings").on("click",(function(t){t.preventDefault();var e=$("form.failed-order-alert"),n=e.find("input#countThreshold").val(),r=[];if(e.find(".list-item").each((function(){r.push($(this).find(".value").text())})),s(e),a(e,r)){var o={};o.days=e.find("input#failedDays").val()||0,o.hours=e.find("input#failedHours").val()||0,o.minutes=e.find("input#failedMinutes").val()||0;var l={recipientEmails:r,interval:o,countThreshold:n},d=$("#countThreshold").val();if(""===$.trim(d))return $("#countThreshold").addClass("is-invalid"),void $(".failed-order-alert-threshold .invalid-feedback").show();s(e),e.spinner().start(),$.ajax({url:$("form.failed-order-alert").attr("action"),data:{data:JSON.stringify(l)},type:"post",success:function(t){t&&t.success?(e.find(".order-interval-alert").empty(),""!==t.orderIntervalValue&&(e.find(".order-interval-alert").append('<span class="order-interval-value d-flex align-items-center">'+t.orderIntervalValue+"<span>"),$(".order-interval-alert").removeClass("d-none"))):t.errorMsg&&($(".failed-order-error-msg").html(t.errorMsg),$(".failed-order-error-msg").show(),i.show(i.TYPES.ERROR,t.errorMsg)),e.spinner().stop()}})}})),$("#saveCampaignNotificationSettings").on("click",(function(t){t.preventDefault();var e=$("form.content-notification");let n=!0;var r=[];e.find(".list-item").each((function(){r.push($(this).find(".value").text())}));var o=[];if($(".campaign-list .campaign").each((function(){var t={};if(t.campaignId=$(this).find("input#campaignId").val(),(""!==$.trim($(this).find('input[name="days"]').val())||""!==$.trim($(this).find('input[name="hours"]').val())||""!==$.trim($(this).find('input[name="minutes"]').val()))&&""===t.campaignId)return n=!1,void $(this).find(".invalid-feedback").show();t.days=$(this).find('input[name="days"]').val()||0,t.hours=$(this).find('input[name="hours"]').val()||0,t.minutes=$(this).find('input[name="minutes"]').val()||0,o.push(t)})),s(e),a(e,r)&&n){var l={recipientEmails:r,campaignRecords:o};s(e),e.spinner().start(),$.ajax({url:e.attr("action"),data:{data:JSON.stringify(l)},type:"post",success:function(t){if(t&&t.success)$(".campaign-error-msg").html("");else if(t.faultyCampaigns){var n;!function(t){var e=t.faultyCampaigns,n={};$.each(e,(function(t,e){n[e.campaignId]=e.msg})),$(".campaign-list .campaign").each((function(){var e=$(this).find("input#campaignId").val(),i=$(this).find(".invalid-feedback");e in n&&n[e]?(i.html(n[e]),i.show()):(i.hide(),i.html(t.mainErrorMsg))}))}(t),t.errorMsg&&(n=t.errorMsg),i.show(i.TYPES.ERROR,n)}e.spinner().stop()}})}})),$("body").on("change",".automatic-notification-toggle input",(function(){const t=$(this).parents("form").find(".notification-form"),e=$(this).parents("form"),n=$("input#senderEmail").parent();$(this).prop("checked")?(t.removeClass("disabled"),t.find("button").removeClass("disabled"),t.find("input").prop("disabled",!1)):(t.addClass("disabled"),t.find("button").addClass("disabled"),t.find("input").prop("disabled",!0),n.removeClass("has-error"),n.find(".invalid-feedback").hide(),s(e))})),$(".notification-modal").on("hidden.bs.modal",(function(){$(".list-container").removeClass("current-list-container")})),$(".recipient-emails-input, #productIDs").on("keypress",(function(t){const n=t.which,i=$(this),a=$(this).val(),s=$(this).parent(),r=s.find(".list-container"),o=s.find(".list"),l=i.hasClass("recipient-emails-input")?"#recipientEmailsModal":"#productsIdsModal",d=i.hasClass("recipient-emails-input")?3:4;if(13===n&&(t.preventDefault(),""!==$.trim(a))){const t=a.split(/,| /).map(t=>t.trim()).filter(Boolean);i.val(""),s.find(".invalid-feedback").hide(),s.removeClass("has-error"),$.each(t,(function(t,n){if(i.hasClass("recipient-emails-input")&&!e(n.trim()))return s.addClass("has-error"),s.find(".invalid-feedback").show(),!1;const a=[];if($(".list-item",s).each((t,e)=>{a.push(""+$(e).data("value"))}),a.includes(n))return!0;const c='<div class="list-item bg-slate-3 rounded-2 d-inline-flex justify-content-center align-items-center me-2 mt-2" data-value="'+n+'"><span class="value text-sm">'+n+'</span><span class="remove-item"></span></div>',u=r.find(".list-item").length-(d-1);if(r.find(".list-item").length<d)o.append(c);else{const t=$(c);t.addClass("d-none"),r.find(".list").append(t)}s.find(".list-count").text(u),r.find(".list-item").length===d+1&&0===r.find(".btn-more").length&&r.append('<button type="button" class="btn btn-link btn-more text-lowercase small" data-bs-toggle="modal" data-bs-target="'+l+'"><span class="list-count pe-1"> '+u+" </span> more</button>")}))}})),$("body").on("click",".btn-more",(function(){$(this).parent().addClass("current-list-container");const t=$(this).attr("data-bs-target");var e=$(this).parent(".current-list-container").find(".list").clone();e.find(".list-item.d-none").removeClass("d-none"),$(t).find(".modal-body .list-container").html(e);const n=$(t).find(".modal-body .list-container .list-item").length;$(".product-id-count").text(n)})),$("body").on("input","#productSearch",(function(){var t=$(this).val().toLowerCase();$(this).parents(".modal-body").find(".list-item").each((function(){$(this).text().toLowerCase().includes(t)?$(this).removeClass("d-none"):$(this).addClass("d-none")}))})),$("body").on("click",".remove-item",(function(){const t=$(this).parent(),e=t.attr("data-value"),n=t.parent(),i=n.parent(),a=i.hasClass("emails-list")?3:4,s=$("#productsIdsModal .modal-body .list-container .list-item").length-1;var r=!0;if($(".product-id-count").text(s),n.find('.list-item[data-value="'+e+'"]').remove(),$(".modal.show").length){const t=$(".current-list-container").find('.list-item[data-value="'+e+'"]');t.remove(),t.hasClass("d-none")&&(r=!1)}else i.addClass("current-list-container");const o=$(".current-list-container").find(".btn-more"),l=$(".current-list-container").find(".d-none:first");if(o.length){const t=$(".current-list-container").find(".list-count");i.find(".list-item").length<=a?o.remove():t.text(parseInt(t.text(),10)-1)}i.find(".list-item").length>a-1&&r&&l.removeClass("d-none"),$(".modal.show").length||i.removeClass("current-list-container")})),$(".add-button").on("click",(function(){$(".campaign-list").append($(".campaign-record").html())})),$("body").on("click",".remove-button",(function(){$(this).parent().remove()})),$(document).on("input",'input[name="days"]',(function(){let t=parseInt($(this).val());(t<0||isNaN(t))&&(t=""),t>99&&(t=99),$(this).val(t)})),$("body").on("click",".suggestion-list li",(function(){const t=$(this).data("suggestion-id");$(this).parents(".content-notification-campaign").find("input").val(t),$(this).parent().empty()})),$("body").on("input",'input[name="campaignId"]',(function(){var t=$("#campaignSuggestionsURL").val();const e=$(this).parent().find(".suggestion-list");var n=$(this).val().trim();n&&""!==n&&(e.empty(),$.ajax({url:t,data:{searchPhrase:n},type:"get",success:function(t){if(t&&t.success){var n=t.campaignDetails;!function(t,e){t.empty(),e.forEach((function(e){t.append('<li class="suggestion-list-item p-3" data-suggestion-id="'+e.campaignId+'"><div class="campaign-id">'+e.campaignId+'</div><div class="expire-date">expires at '+e.campaignEndDate+"</div></li>")}))}(e,n)}else t.serverErrors&&t.serverErrors.length&&$.each(t.serverErrors,(function(t,e){i.show(i.TYPES.ERROR,e)}))}}))})),$('input[name="enableFeature"]').on("change",(function(){var t=$("#enablementURL").val(),e=$(this)[0].checked,n=$(this).data("pref-id");const i=$(this).parents("form");i.spinner().start();var a={enabled:e,prefId:n};$.ajax({url:t,data:{data:JSON.stringify(a)},type:"post",complete:function(){i.spinner().stop()}})})),$("#senderEmail").on("blur",(function(){if(n($("input#senderEmail"))){var t=$(this).closest(".sender-email").data("save-sender-email-url"),e={},i=$(this).closest(".sender-email").data("custom-object");e.customObjectIds=JSON.stringify(i.split("__")),e.senderEmail=$(this).val(),$.ajax({url:t,data:e,type:"post"})}}))}))}});