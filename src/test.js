'use strict';

module.exports.handler = async event => {
  console.log(JSON.stringify(event, null, 2));
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  headers['x-time-now'] = [
      { key: 'x-time-now', value: Date.now().toString() },
  ];

  return response;
};