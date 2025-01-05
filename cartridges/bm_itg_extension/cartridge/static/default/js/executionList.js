!function(e){var t={};function o(s){if(t[s])return t[s].exports;var n=t[s]={i:s,l:!1,exports:{}};return e[s].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.m=e,o.c=t,o.d=function(e,t,s){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(o.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)o.d(s,n,function(t){return e[t]}.bind(null,n));return s},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=1)}([function(e,t,o){"use strict";var s=function(){},n={0:"A new process has been initiated.",1:"Operation successful!",2:"This is a warning message.",3:"Oops! Something went wrong. Please try again."},a={0:"info",1:"success",2:"warning",3:"error"};s.TYPES={INFO:0,SUCCESS:1,WARNING:2,ERROR:3},s.show=function(e,t){var o='<div class="toast custom rounded-5 '+a[e]+'-toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-body d-flex align-items-center gap-5 justify-content-between"><p class="tost-msg mb-0 text-md black d-flex align-items-center gap-3">'+(t||n[e])+'</p><div class="separator"></div><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div></div>',s=$(".toast-messaging");s.html(o);var r=s.children().last();new bootstrap.Toast(r[0]).show()},e.exports=s},function(e,t,o){"use strict";var s=o(0),n=function(){var e=!1,t=$("#execution_history");if(t.length>0)var o,n=t.data("execution-list-data"),a=n.exportDetailsURL,r=n.showDownloadFile,i=n.downloadFileType,l=n.jobIds,d=n.impexPath,c=setInterval((function(){e||((o=t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]')).length>0?(e=!0,$.ajax(a,{data:{executionId:o.data("execution-id"),jobIds:l,serviceType:o.data("service-type")?o.data("service-type"):n.serviceType,downloadExportFile:r,downloadFileType:i,impexPath:d},dataType:"json",method:"GET",success:function(e){if(e.success){var n=$(e.renderedTemplate);-1===["PENDING","RUNNING"].indexOf(n.data("job-status"))&&(n.addClass("animate-slide-in-down"),clearInterval(c)),(o=t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]')).replaceWith(n),setTimeout((function(){t.find("tr").removeClass("animate-slide-in-down")}),1e3)}else e.serverErrors&&e.serverErrors.length>0&&s.show(s.TYPES.ERROR,e.serverErrors[0])},complete:function(){e=!1}})):clearInterval(c))}),3e4)};e.exports={checkProcessStatus:n,handleProcessLink:function(){$(document).on("click",".execution-modal-link",(function(e){e.preventDefault(),$(this).closest("tr").addClass("focused");var t=$(this).closest("tr"),o=$(t).data("job-status"),s=$("#executionModal");if("PENDING"!==o&&"RUNNING"!==o){s.modal("show"),t.closest("tr").addClass("focused");var n=t.find(".execution-modal-link").html(),a=t.closest("tr").data("execution-obj");s.find(".modal-body").spinner().start();var r=a.configurationUUID?a.configurationUUID:"";if(r){var i=$("#execution_history").data("job-logs-url"),l={JobConfigurationUUID:r};$.ajax({url:i,data:l,type:"get",success:function(e){var t,o=$(".log-messages"),r=s.find(".download-section"),i=$(e).find("textarea.inputfield_en").html();switch(""!==$.trim(i)&&o.empty().html(i).removeClass("d-none"),a.executionStatus){case"finished":"OK"===a.status?(t="Success",r.show(),s.find(".download-section a").attr("href",a.exportURL)):(t="Error",r.hide());break;case"aborted":t="Error",r.hide();break;default:t="In-progress",r.hide()}a.processType&&"Import"===a.processType?s.find(".download-section").addClass("d-none"):a.processType&&"Export"===a.processType&&s.find(".download-section").removeClass("d-none");var l='<span class="badge '+t.toLowerCase()+'-badge">'+t+"</span>";s.find(".file-name").empty().html(n.replace(/&lt;/g,"<br/>&lt;")),s.find(".status").empty().html(l),s.find(".time-section .time-message").empty().html(a.timeStatusMessage),s.find(".download-log").attr("href",a.logFileURL),s.find(".modal-body").spinner().stop()}}),s.on("hidden.bs.modal",(function(){$(".table-link").removeClass("focused")}))}}}))},handleCopyLink:function(){$("body").on("click",".log-file-section .copy",(function(e){e.preventDefault();const t=new bootstrap.Tooltip($(this),{trigger:"manual"}),o=$(".log-file-section .log-messages");if(o.length){const e=$(o).text();""!==$.trim(e)&&(navigator.clipboard.writeText(e),t.show(),setTimeout((function(){t.hide()}),1e3))}}))},refreshExecutionList:function(){$(document).on("click",".refresh-execution-list",(function(e){e.preventDefault();var t=$("#execution_history"),o=t.data("execution-list-data"),a=o.exportDetailsURL,r=o.showDownloadFile,i=o.downloadFileType,l=o.jobIds,d=o.impexPath,c=o.maxProcessNumber;t.spinner().start(),$.ajax(a,{data:{jobIds:l,serviceType:o.serviceType,downloadExportFile:r,downloadFileType:i,impexPath:d,maxProcessNumber:c},dataType:"json",method:"get",success:function(e){e.success?($(".execution-list").html(e.renderedTemplate),$(".execution-list").find("tr[data-job-status=RUNNING], tr[data-job-status=PENDING]")&&n(),t.spinner().stop()):e.serverErrors&&e.serverErrors.length>0&&(s.show(s.TYPES.ERROR,e.serverErrors[0]),t.spinner().stop())},complete:function(){$(".refresh-execution-list").blur()}}),$(".refresh-execution-list").blur()}))},validateNoRunningProcess:function(){var e=!0,t=$("#execution_history");if(t.find('[data-job-status="PENDING"], [data-job-status="RUNNING"]').length>0){var o=t.data("running-process-error");s.show(s.TYPES.INFO,o),e=!1}return e}}}]);