(function () {
  angular.module('app', ['ngAnimate', 'ngSanitize'])
    .controller('ChatController', ChatController)
    .filter('wrapImages', wrapImages);
    
  function wrapImages() {
    return function (input) {
      if (!input) {
        return;
      }
      var $dom = angular.element('<span />').html(jQuery.parseHTML(input));
      var $newdom = $dom.find('img').each(function (i, e) {
        var $img = angular.element(e);
        var src = $img.attr('src');
        $img.before('<span class="img-placeholder">[Image: '+src+']</span>')
      });
      
      return $dom.html();
    }
  }
    
  ChatController.$inject = ['$scope', '$http', '$window', '$sce', '$filter'];
  
  function ChatController($scope, $http, $window, $sce, $filter) {
    var vm = this;
    var accessManager;
    var client;
    var generalChannel;
    var roomName;
    var GIPHYREGEX = /^http:\/\/i\.giphy\.com\/[a-zA-Z0-9]+\.gif$/i
    
    vm.messages = [];
    vm.currentMessage = '';
    vm.activeThread = undefined;
    vm.connected = false;
    vm.colorMap = {};
    vm.loading = false;
    vm.hiddenImages = {};
    
    vm.signOut = function() {
      vm.connected = false;
      vm.messages = [];
      $window.localStorage.removeItem('username');
    }
    
    vm.keydown = function ($event) {
      if($event.which === 13) {
          vm.sendMessage();
          event.preventDefault();
      }
    }
    
    vm.toggleImages = function (sid) {
      vm.hiddenImages[sid] = !vm.hiddenImages[sid];
    }
    
    vm.signIn = function() {
      vm.connected = false;
      vm.messages = [];
      vm.activeThread = undefined;
      vm.colorMap = {};
      vm.currentMessage = '';
      vm.loading = true;
      
      var identity = vm.identity;
      roomName = $window.location.hash || '#general';
      $window.localStorage.setItem('username', identity);
      
      return getToken(identity)
        .then(getClient)
        .then(createIfNotExisting(roomName, 'Room ' + roomName))
        .then(joinChannel)
        .then(getPreviousMessages)
        .then(setupListeners);
    }
    
    vm.loadFiltered = function (threadId) {
      vm.filtered = vm.messages.filter(function (msg) {
        return msg.threadId === threadId;
      });
      vm.activeThread = threadId;
      angular.element('#messageInput').focus();
    }
    
    vm.sendMessage = function () {
      if (!generalChannel || !vm.currentMessage) return;
        
      var threadId = vm.activeThread || Date.now().toString(36);
      
      generalChannel.sendMessage('[' + threadId + ']' + vm.currentMessage).then(function () {
        $scope.$apply(function () {
          vm.currentMessage = '';
        });
      });
    }
    
    vm.closeFiltered = function () {
      vm.activeThread = undefined;
    }
    
    function onStartup() {
      if ($window.localStorage.getItem('username')) {
        vm.identity = $window.localStorage.getItem('username');
        roomName = $window.location.hash || '#general';
        if (!$window.location.hash) {
          $window.location.hash = 'general';
        }
        vm.signIn();
      }
    }
    
    onStartup();
    
    $window.addEventListener("hashchange", onStartup, false);
    
    function getToken(identity) {
      return $http.get('/token', {
        params: {
          device: 'browser',
          identity: identity
        }
      }).then(function (resp) {
        return resp.data;
      });
    }
    
    function addMessage(scroll) {
      return function(msg) { 
        $scope.$apply(function () {
          msg.threadId = msg.body.substr(1, msg.body.indexOf(']')-1);
          
          msg.content = $filter('wrapImages')(msg.body.substr(msg.body.indexOf(']')+1));
          msg.content = GIPHYREGEX.test(msg.content) ? '<img src="'+msg.content+'">' : msg.content; 
          
          if (!vm.colorMap[msg.threadId]) {
            vm.colorMap[msg.threadId] = getRandomColor();
          }
          
          vm.messages.push(msg);
          if (msg.threadId === vm.activeThread) {
            vm.filtered.push(msg);
          }
          
          if (scroll) {
            var $msgs = angular.element('#messages');
            $msgs.animate({scrollTop:$msgs.prop('scrollHeight')});
          }
        });
      }
    }
    
    function getClient(tokenData) {
      accessManager = new Twilio.AccessManager(tokenData.token);
      client = new Twilio.IPMessaging.Client(accessManager);
      
      return client;
    }
    
    function createIfNotExisting(id, name) {
      return function (client) {
        return client.getChannelByUniqueName(id).then(function (channel) {
          if (!channel) {
            return client.createChannel({
              uniqueName: id,
              friendlyName: name
            });
          }
          
          return channel;
        })
      }
    }
    
    function joinChannel(channel) {
      return channel.join().then(function (channel) {
        vm.connected = true;
        generalChannel = channel;
        vm.channelName = channel.friendlyName;
        
        return channel;
      });
    }
    
    function setupListeners(channel) {
      channel.on('messageAdded', function (message) {
        addMessage(true)(message);
      });
      return channel;
    }
    
    function getPreviousMessages(channel) {
      return channel.getMessages(99999).then(function (messages) {
        vm.loading = false;
        messages.forEach(addMessage(false));
        var $msgs = angular.element('#messages');
        $msgs.animate({scrollTop:$msgs.prop('scrollHeight')});
        return channel;
      })
    }
    
    function getRandomColor() {
      return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    }
  }
})();