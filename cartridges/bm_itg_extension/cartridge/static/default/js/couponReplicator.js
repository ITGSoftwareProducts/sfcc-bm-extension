!function(e){var t={};function o(n){if(t[n])return t[n].exports;var a=t[n]={i:n,l:!1,exports:{}};return e[n].call(a.exports,a,a.exports,o),a.l=!0,a.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)o.d(n,a,function(t){return e[t]}.bind(null,a));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=14)}({0:function(e,t,o){"use strict";var n=function(){},a={0:"A new process has been initiated.",1:"Operation successful!",2:"This is a warning message.",3:"Oops! Something went wrong. Please try again."},s={0:"info",1:"success",2:"warning",3:"error"};n.TYPES={INFO:0,SUCCESS:1,WARNING:2,ERROR:3},n.show=function(e,t){var o='<div class="toast custom rounded-5 '+s[e]+'-toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-body d-flex align-items-center gap-5 justify-content-between"><p class="tost-msg mb-0 text-md black d-flex align-items-center gap-3">'+(t||a[e])+'</p><div class="separator"></div><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div></div>',n=$(".toast-messaging");n.html(o);var r=n.children().last();new bootstrap.Toast(r[0]).show()},e.exports=n},1:function(e,t,o){"use strict";var n=o(0);e.exports={checkProcessStatus:function(){var e=!1,t=$("#execution_history"),o=t.data("export-details-url"),n=t.data("show-download-file"),a=t.data("download-file-type"),s=t.data("impex-path"),r=t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]'),i=setInterval((function(){e||(r.length>0?(e=!0,$.ajax(o,{data:{executionId:r.data("execution-id"),jobIds:r.data("execution-obj").jobIds,serviceType:r.data("service-type"),downloadExportFile:n,downloadFileType:a,impexPath:s},dataType:"json",method:"GET",success:function(e){if(e.success){var o=$(e.renderedTemplate);-1===["PENDING","RUNNING"].indexOf(o.data("job-status"))&&(o.addClass("animate-slide-in-down"),clearInterval(i)),(r=t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]')).replaceWith(o),setTimeout((function(){t.find("tr").removeClass("animate-slide-in-down")}),1e3)}},complete:function(){e=!1}})):clearInterval(i))}),3e4)},handleProcessLink:function(){$(document).on("click",".execution-modal-link",(function(e){e.preventDefault(),$(this).closest("tr").addClass("focused");var t=$(this).closest("tr"),o=$(t).data("job-status"),n=$("#executionModal");if("PENDING"!==o&&"RUNNING"!==o){n.modal("show"),t.closest("tr").addClass("focused");var a=t.find(".execution-modal-link").html(),s=t.closest("tr").data("execution-obj");n.find(".modal-body").spinner().start();var r=s.configurationUUID?s.configurationUUID:"";if(r){var i=$("#execution_history").data("job-logs-url"),c={JobConfigurationUUID:r};$.ajax({url:i,data:c,type:"get",success:function(e){var t,o=$(".log-messages"),r=n.find(".download-section"),i=$(e).find("textarea.inputfield_en").html();switch(""!==$.trim(i)&&o.empty().html(i).removeClass("d-none"),s.status){case"OK":t="Success",r.show(),n.find(".download-section a").attr("href",s.exportURL);break;case"PENDING":t="In-progress",r.hide();break;default:t="Error",r.hide()}s.processType&&"Import"===s.processType?n.find(".download-section").addClass("d-none"):s.processType&&"Export"===s.processType&&n.find(".download-section").removeClass("d-none");var c='<span class="badge '+t.toLowerCase()+'-badge">'+t+"</span>";n.find(".file-name").empty().html(a.replace(/&lt;/g,"<br/>&lt;")),n.find(".status").empty().html(c),n.find(".time-section .time-message").empty().html(s.timeStatusMessage),n.find(".download-log").attr("href",s.logFileURL),n.find(".modal-title").text(s.modalTitle),n.find(".modal-body").spinner().stop()}}),n.on("hidden.bs.modal",(function(){$(".table-link").removeClass("focused")}))}}}))},handleCopyLink:function(){$("body").on("click",".log-file-section .copy",(function(e){e.preventDefault();const t=new bootstrap.Tooltip($(this),{trigger:"manual"}),o=$(".log-file-section .log-messages");if(o.length){const e=$(o).text();""!==$.trim(e)&&(navigator.clipboard.writeText(e),t.show(),setTimeout((function(){t.hide()}),1e3))}}))},refreshExecutionList:function(){$(document).on("click",".refresh-execution-list",(function(e){e.preventDefault();var t=$("#execution_history"),o=t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]');if(o.length>0){var n=t.data("export-details-url"),a=t.data("show-download-file"),s=t.data("download-file-type"),r=t.data("impex-path");t.spinner().start(),$.ajax(n,{data:{executionId:o.data("execution-id"),jobIds:o.data("execution-obj").jobIds,serviceType:o.data("service-type"),downloadExportFile:a,downloadFileType:s,impexPath:r},dataType:"json",method:"get",success:function(e){if(e.success){var n=$(e.renderedTemplate);-1===["PENDING","RUNNING"].indexOf(n.data("job-status"))&&n.addClass("animate-slide-in-down"),o.replaceWith(n),setTimeout((function(){t.find("tr").removeClass("animate-slide-in-down")}),1e3),t.spinner().stop()}},complete:function(){$(".refresh-execution-list").blur()}})}$(".refresh-execution-list").blur()}))},validateNoRunningProcess:function(){var e=!0,t=$("#execution_history");if(t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]').length>0){var o=t.data("running-process-error");n.show(n.TYPES.INFO,o),e=!1}return e}}},14:function(e,t,o){"use strict";var n=o(1),a=o(0);$(document).ready((function(){$("form.search-coupon").on("submit",(function(e){var t=$(this);e.preventDefault();var o=t.attr("action");$("body").spinner().start(),$.ajax({url:o,data:t.serialize(),type:"get",success:function(e){t.spinner().stop();var o=$(".coupon-list-table");e.success?o.html(e.renderedTemplate):e.serverErrors&&e.serverErrors.length&&$.each(e.serverErrors,(function(e,t){a.show(a.TYPES.ERROR,t)})),$("#nav-coupons-tab").tab("show")},error:function(){$("body").spinner().stop()}})})),$(document).on("click",".select-coupon",(function(e){var t=$(".coupon-list-form");e.preventDefault(),$("body").spinner().start();var o=t.data("action-url"),n=$(this).closest(".coupon-item").data("coupon-json");n&&($("#replicate-coupon-modal .modal-body").empty(),$.ajax({url:o,data:n,type:"get",success:function(e){if($("body").spinner().stop(),e.success){$("#replicate-coupon-modal .modal-body").html(e.renderedTemplate);!!$("#replicate-coupon-modal .site-name .site-id:not(.disable)").length||$("#replicate-coupon-modal .replication-coupon").addClass("disabled"),0===$("#replicate-coupon-modal .site-name .site-id:checked").length&&$("#replicate-coupon-modal .replication-coupon").addClass("disabled")}else e.serverErrors&&e.serverErrors.length&&$.each(e.serverErrors,(function(e,t){a.show(a.TYPES.ERROR,t)}))},error:function(){$("body").spinner().stop()}}))}));$(document).on("click",".replication-coupon",(function(e){e.preventDefault();for(var t=$(".replication-coupon-form"),o=t.data("case-insensitive"),s=t.data("multiple-codes"),r=t.data("coupon-type"),i=t.data("action-url"),c=t.data("coupon-id"),d=t.data("coupon-description"),l=$(".site-id.selected"),u=[],p=0;p<l.length;p++)u.push($(l[p]).val());var f={couponId:c,siteIdsArray:JSON.stringify(u),caseInsensitive:o,multipleCodesPerBasket:s,couponType:r,couponDescription:d};n.validateNoRunningProcess()&&($("#execution_history").spinner().start(),$.ajax({url:i,data:f,type:"post",success:function(e){$("#execution_history").spinner().stop();var t=$("#execution_history").find(".table"),o=e.renderedTemplate;e.success?(t.find("tbody tr").length>=5&&t.find("tbody tr:last").remove(),t.find("tbody").prepend(o),n.checkProcessStatus()):e.serverErrors&&e.serverErrors.length&&$.each(e.serverErrors,(function(e,t){a.show(a.TYPES.ERROR,t)})),function(){$("#replicate-coupon-modal").modal("hide");new bootstrap.Tab("#nav-replications-tab").show()}()},error:function(){$("#execution_history").spinner().stop()}}))})),$("body").on("click",".site-id",(function(){$(this).toggleClass("selected"),$("#replicate-coupon-modal .replication-coupon").toggleClass("disabled",!$(this).closest(".items").find(".site-id:checked").length)})),$(document).on("click",".coupon-id-column, .coupon-description-column, .coupon-type-column, .coupon-enable-column",(function(e){e.preventDefault();var t=$(".search-coupon").attr("action"),o=$(".coupon-table"),n=o.data("coupon-id"),s=$("#pageSize").find(":selected").val(),r="asc";o.hasClass("sorting")&&(r="asc"===o.data("sort-rule")?"desc":"asc");var i={couponSearchTerm:n,count:s,sortRule:r,sortBy:$(this).data("sort-type")};$(".coupon-list-table").spinner().start(),$.ajax({url:t,data:i,type:"get",success:function(e){$(".coupon-list-table").spinner().stop(),e.success?$(".coupon-list-table").html(e.renderedTemplate):e.serverErrors&&e.serverErrors.length&&$.each(e.serverErrors,(function(e,t){a.show(a.TYPES.ERROR,t)}))},error:function(){$(".coupon-list-table").spinner().stop()}})}))}))}});