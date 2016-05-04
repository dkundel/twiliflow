'use strict';

const request = require('request');
const giphyApiUrl = 'http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=';
const Q = require('q');

module.exports = function (cmd, msg) {
  let deferred = Q.defer();
  
  request.get(giphyApiUrl + msg, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      deferred.reject(err);
      return;
    } 
    
    body = JSON.parse(body);
    
    deferred.resolve({
      body: `<img src="${body.data.image_original_url}">`,
      from: 'Giphy'
    });
  });
  
  return deferred.promise;
}