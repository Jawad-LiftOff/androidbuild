angular.module('dials', ['ionic', 'dials.controllers'])

  .run(function ($ionicPlatform, $ionicPopup, $ionicLoading) {

  $ionicPlatform.ready(function () {
    
    if(typeof analytics != 'undefined') {
        analytics.startTrackerWithId('UA-65990540-1');
        analytics.debugMode();
    } 
    else {
        console.log("Google Analytics Unavailable");
    }
    
    if (window.Connection) {
      if (navigator.connection.type == Connection.NONE) {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "Internet Disconnected",
          content: "Please check your network connection!.",
          cssClass: 'white-bg'
        }).then(function (result) {
          ionic.Platform.exitApp();
        });
      }
    }
    
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if (window.StatusBar) {
      StatusBar.styleLightContent();
    }        
    
  });
})

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.backButton.previousTitleText(false).text('');

  $stateProvider
    .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })
    .state('app.event', {
    url: "/event",
    views: {
      'menuContent': {
        templateUrl: "templates/eventlayout.html",
        controller: 'EventCtrl'
      }
    }
  }).state('app.about', {
    url: "/about",
    views: {
      'menuContent': {
        templateUrl: "templates/about.html"
      }
    }
  }).state('endoftour', {
    url: "/endoftour",
    templateUrl: "templates/endoftour.html",
    controller: 'AppCtrl'
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/event');
});
