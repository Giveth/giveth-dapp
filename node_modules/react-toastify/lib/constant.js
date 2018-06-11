"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var POSITION = exports.POSITION = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  TOP_CENTER: "top-center",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_CENTER: "bottom-center"
};

var TYPE = exports.TYPE = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  DEFAULT: "default"
};
var ACTION = exports.ACTION = {
  SHOW: "SHOW_TOAST",
  CLEAR: "CLEAR_TOAST",
  MOUNTED: "CONTAINER_MOUNTED"
};