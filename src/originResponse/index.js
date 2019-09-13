"use strict";

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  signatureVersion: "v4"
});
const Sharp = require("sharp");

const BUCKET = "demo-cdn-bucket";

const errorResponse = (message, response, callback) => {
  response.status = 500;
  response.headers["content-type"] = [
    { key: "Content-Type", value: "text/html" }
  ];
  response.body = `<!DOCTYPE html>
  <html>
  <body>
    <h1>Something went wrong</h1>
    <pre>${message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")}</pre>
  </body>
  </html>`;
  callback(null, response);
  return;
};

const getResponseType = (sourceFormat, requestedFormat) => {
  switch (requestedFormat) {
    case "webp":
      return "webp";
    case "png":
      return "png";
    case "jpeg":
    default:
      return "jpeg";
  }
};

exports.handler = async (event, context, callback) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;

  if (response.status == 404 || response.statusDescription === "Forbidden") {
    const { uri } = request;

    if (!uri.includes("_")) {
      callback(null, response);
      return;
    }

    const parts = uri.substring("/p/".length).split("_");

    const transformParams = parts
      .filter(ent => ent.includes(","))
      .map(ent => ent.split(","))
      .reduce((p, c) => ({ ...p, [c[0]]: c[1] }), {});

    const key = parts[0];

    try {
      const obj = await s3.getObject({ Bucket: BUCKET, Key: key }).promise();

      // disabling this for now, a lot of images are tagged as text/plain
      // const mimeParts = (obj.ContentType || "").split("/");
      // if (mimeParts[0] !== "image") {
      //   // this is not an image, do not process
      //   callback(null, response);
      //   return;
      // }

      const format = getResponseType(obj.ContentType, transformParams.f);

      const buffer = await Sharp(obj.Body)
        .resize(
          transformParams.w ? parseInt(transformParams.w) : null,
          transformParams.h ? parseInt(transformParams.h) : null,
          { fit: "contain" }
        )
        .toFormat(format)
        .toBuffer();

      await s3
        .putObject({
          Body: buffer,
          Bucket: BUCKET,
          ContentType: `image/${format}`,
          CacheControl: "max-age=31536000",
          Key: uri.replace(/^\/+/, ""),
          StorageClass: "STANDARD"
        })
        .promise();

      response.status = 200;
      response.body = buffer.toString("base64");
      response.bodyEncoding = "base64";
      response.headers["content-type"] = [
        { key: "Content-Type", value: `image/${format}` }
      ];
      callback(null, response);
    } catch (ex) {
      return errorResponse(
        JSON.stringify({ ex, stack: ex.stack }, null, 2),
        response,
        callback
      );
    }
  } else {
    callback(null, response);
  }
};
