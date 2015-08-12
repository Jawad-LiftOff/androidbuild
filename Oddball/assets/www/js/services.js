angular.module('dials.services', ['ngResource'])

  .factory('DataManager', function ($resource) {

  var url = "http://private-80fb5-oddballavatars.apiary-mock.com";//http://private-fd322-oddball.apiary-mock.com
  var service = $resource(url + "/:action/",
    { action: '@action', id: '@id' },
    {      
      'schedule': { method: 'GET', isArray: true, params: { action: 'schedule' } },      
      'promotions': { method: 'GET', isArray: true, params: { action: 'promotions' } }      
    });

  return service;
})

  .service('HttpServiceManager', function ($http) {
  this.getAll = function () {
    var url = "http://private-80fb5-oddballavatars.apiary-mock.com";
    return {
      getArtists: $http.get(url + '/artists', { timeout: 30000, cache: false }),
      getEvents: $http.get(url + '/events', { timeout: 30000, cache: false }),
      getMetadata: $http.get(url + '/metadata', { timeout: 30000, cache: false })
    };
  };
})

  .factory('$ImageCacheFactory', ['$q', function ($q) {
  return {
    Cache: function (urls) {
      var promises = [];
      for (var i = 0; i < urls.length; i++) {
        var deferred = $q.defer();
        var img = new Image();
        img.onload = (function (deferred) {
          return function () {
            deferred.resolve();
          }
        })(deferred);

        img.onerror = (function (deferred, url) {
          return function () {
            deferred.reject(url);
          }
        })(deferred, urls[i]);

        promises.push(deferred.promise);
        img.src = urls[i];
      }
      return $q.all(promises);
    }
  }
}]);;