!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=7)}({7:function(e,t,n){"use strict";var r=jQuery;const o=function(e){return{hours:parseInt(r("#"+e+"Hours").val())||0,minutes:parseInt(r("#"+e+"Minutes").val())||0,toggle:r("#"+e+"Toggle").text()}},u=function(e,t){var n=parseInt(e);return"PM"===t&&n<12?n+=12:"AM"===t&&12===n&&(n=0),n};var a=function(e){var t=parseInt(e);return t>12?t-=12:0===t&&(t=12),t};const i=function(e){var t=r("#customTimeFrame").datepicker("getDate"),n=new Date(t);if(e){n.setDate(t.getDate()+1);var o=n.toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric"});r(".new-day").html("( "+o+" )")}else r(".new-day").empty();r("#nextDay").val(n)};e.exports={getTimeValues:o,convert12To24:u,convert24To12:a,checkTimeDifference:function(){var e=o("start"),t=o("end"),n=u(e.hours,e.toggle),r=u(t.hours,t.toggle);return(r<n||r===n&&t.minutes<e.minutes?60*(r+24)+t.minutes-(60*n+e.minutes):60*r+t.minutes-(60*n+e.minutes))>240},updateEndTime:function(){var e=o("start"),t=u(e.hours,e.toggle);i(t>=20);var n=(t+4)%24,s=a(n),l=n>=12?"PM":"AM",c=e.minutes;e.hours>0&&(r("#endHours").val(s),r("#endMinutes").val(c),0===e.minutes&&r("#startMinutes").val("0")),r("#endToggle").text(l)},updateNextDay:i,handleNextDay:function(){var e=o("start"),t=o("end"),n=u(t.hours,t.toggle),r=u(e.hours,e.toggle);n<r||n===r&&t.minutes<e.minutes?i(!0):i(!1)},formatDateTime:function(e,t,n,r){return e.getMonth()+1+"/"+e.getDate()+"/"+e.getFullYear()+" "+(t+":"+(n<10?"0":"")+n+" "+r)}}}});