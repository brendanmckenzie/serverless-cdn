"use strict";

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function querystring(qs, sep, eq, options) {
  sep = sep || "&";
  eq = eq || "=";
  var obj = {};

  if (typeof qs !== "string" || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === "number") {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, "%20"),
      idx = x.indexOf(eq),
      kstr,
      vstr,
      k,
      v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = "";
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
}

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const params = querystring(request.querystring);

  const { uri } = request;

  console.log("params", params);

  if (Object.keys(params).length === 0) {
    callback(null, request);
    return;
  }

  const parts = [uri];

  const part = (part, value) => `${part},${value}`;

  if (params.w) {
    parts.push(part("w", params.w));
  }
  if (params.h) {
    parts.push(part("h", params.h));
  }

  const accept = headers["accept"] ? headers["accept"][0].value : "";
  if (accept.includes("webp")) {
    parts.push(part("f", "webp"));
  }

  request.uri = '/p' + parts.join("_");

  callback(null, request);
};
