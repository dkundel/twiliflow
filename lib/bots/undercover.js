'use strict';

const request = require('request');
const randomUserApi = 'https://randomuser.me/api/';
const Q = require('q');

module.exports = function (cmd, msg) {
  let deferred = Q.defer();
  
  let apiUrl = msg ? randomUserApi + '?gender=' + msg : randomUserApi; 
  
  request.get(apiUrl, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      deferred.reject(err);
      return;
    } 
    
    body = JSON.parse(body);
    let name = body.results[0].name;
    deferred.resolve({
      body: `Your new identity: ${capitalize(name.title)} ${capitalize(name.first)} ${capitalize(name.last)}`,
      from: 'Agent'
    });
  });
  
  return deferred.promise;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}