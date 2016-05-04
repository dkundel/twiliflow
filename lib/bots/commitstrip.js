'use strict';

const fastFeed = require('fast-feed');
const request = require('request')
const Q = require('q');
const commitStripFeed = 'http://www.commitstrip.com/en/feed/';

module.exports = function (cmd, msg) {
  let deferred = Q.defer();
  
  request.get(commitStripFeed, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      deferred.reject(err);
      return;
    }
    
    fastFeed.parse(body, function(err, feed) {
      if (err) {
        deferred.reject(err);
        return;
      }
      
      let content = feed.items[0].content;
      let imgSrcStart = content.indexOf('src="') + 4;
      let imgSrcEnd = content.indexOf('"', imgSrcStart+1);
      content = content.substr(imgSrcStart+1, imgSrcEnd - imgSrcStart);
      
      deferred.resolve({
        from: 'CommitStrip',
        body: `<img src="${content}">`
      });
    });
    
  });
  
  return deferred.promise;
}