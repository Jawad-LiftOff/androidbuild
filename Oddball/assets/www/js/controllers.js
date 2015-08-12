angular.module('dials.controllers', ['ionic', 'dials.services','dials.directives'])

  .controller('AppCtrl', function ($scope, $location, $timeout, DataManager) {
      
  document.addEventListener("resume", function() {
    init(); 
  });
  
  var init = function () {
    $scope.views = [{template: 'templates/event.html', icon: 'menu-icon'}, {template: 'templates/eventlist.html', icon: 'menu-icon-circle'}];
    $scope.view = 1;
    $scope.dialsLink = ionic.Platform.isIOS() ? 'https://itunes.apple.com/app/id982837760' : 'http://dialsapp.com';
    getSchedule();  
  };
  
  $scope.logData = function (arg1, arg2, arg3) {            
    if(typeof analytics != 'undefined') {
      arg2 ? analytics.trackEvent(arg1, arg2, arg3) : analytics.trackView(arg1);    
    }
  };
  
  $scope.exturl = function(url, logData) { 
    if(logData) {
      $scope.logData('Powered By Dials', 'Clicked', '');
    }
    var holder = ionic.Platform.isIOS() ? '_blank' : '_system';
    window.open(url, holder);
  };

  $scope.setHeaders = function () {
    $scope.logData('Dial View');
    $scope.showInfoButton = true;
    $scope.showMenuButton = true;
    $location.path('/app/event');       
  };
  
  var getSchedule = function (res) {
    DataManager.schedule(function (res) { 
       $timeout(function () {
         if(navigator.splashscreen)    
          navigator.splashscreen.hide(); 
      }, 1000);         
      $scope.schedule = res;       
      var maxDate = _.max(res, function(data){ return moment(data.date); });
      if(moment().subtract(1, 'days').isAfter(maxDate.date, 'date')) {        
        $location.path('/endoftour');
      }
      else {      
        $scope.setHeaders();
        $scope.toggleView(); 
      }  
    });
  };

  $scope.toggleView = function () {
    $scope.fadeInMainView = false;
    $scope.view ^= 1;
    var pageName = $scope.view == 0 ? 'Dial View' : 'List View';
    $scope.logData(pageName);
    $scope.contentFilePath = $scope.views[$scope.view].template;
    $scope.menuIcon = $scope.views[$scope.view].icon;
    $timeout(function () {          
      $scope.fadeInMainView = true;         
    }, 100);
  };

  $scope.gotToAbout = function () {    
    $scope.showInfoButton = false;
    $scope.showMenuButton = false;    
    $location.path('/app/about');
  };

  init();
})

  .controller('EventCtrl', function ($scope, $q, $ionicPopup, $interval, $ionicLoading, $ionicSlideBoxDelegate, $timeout, $sce, $ionicPlatform, $ionicScrollDelegate, $ImageCacheFactory, DataManager, HttpServiceManager) {
  
  var imagesLoaded, eventsLoaded = false;   
  
  document.addEventListener("resume", function() {
    init(); 
  });
  
  var init = function () {    
    showLoading();    
    initVars();
    getData();
    getPromotions();
    resetTimeArc();    
    $interval(function () {
      $scope.date = new Date();
    }, 10000);
    $ionicPlatform.onHardwareBackButton(function() { 
      $scope.closePopup();    
    });        
  };
  
  var getData = function () {
    var service = HttpServiceManager.getAll();
    var metadata = service.getMetadata;
    var artists = service.getArtists;
    var events = service.getEvents;
    $q.all([metadata, artists, events]).then(
      function(data) {
        getMetaData(data[0].data);
        getArtists(data[1].data);
        getEvents(data[2].data);
      },
      function(reason) { console.log('Error: ' + reason); }
    );
  };  
  
  var getArtists = function (res) {
    $scope.artists = res;
    getAvatars(res);          
  };
  
  var initVars = function () {
    var momentToday = moment.utc();    
    $scope.today = new Date();
    $scope.moment = moment;
    $scope.hourEnd = 0;
    $scope.minuteEnd = 0;
    $scope.showEventDetails = false;    
    $scope.setDate = momentToday.format('MM/DD/YYYY');
    $scope.scrollLeft = 0;
    $scope.date = new Date();
    $scope.majors = new Array(12);
    $scope.minors = new Array(48);
    $scope.imagePath = 'img/ring.svg';
    $scope.hostImage = 'img/event-host.png';
    $scope.trust = $sce.trustAsResourceUrl;
    $scope.dialFilePath = 'templates/dial.html';
    $scope.showDial = true;
    $scope.showDetails = false;
    $scope.isDaySelected = true;   
    $scope.fadeIn = true; 
  };

  var showLoading = function () {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
    });
  };

  var hideLoading = function () {       
    if(imagesLoaded && eventsLoaded) {
      $ionicLoading.hide();
    }
  };

  $scope.showPopup = function (promo) { 
    $scope.logData(promo.promotion_name, 'Promotion_Tapped', $scope.setDate);   
    document.getElementsByTagName('ion-nav-view')[0].classList.add("doBlur");
      var url = $scope.promosBaseUrl + promo.image;    
    $scope.myPopup = $ionicPopup.show({
      template: '<img src="'+ url +'" class="full-image"><span class="close-popup" ng-click="closePopup()">Close</span>',
      scope: $scope
    });
  };

  $scope.closePopup = function () {
    document.getElementsByTagName('ion-nav-view')[0].classList.remove("doBlur");
    $scope.myPopup.close();
  };
  
  var enumerateDaysBetweenDates = function (startDate, endDate) {
    var currDate = startDate.clone().startOf('day');
    var lastDate = endDate.clone().startOf('day');
    var days = [];
    var index = 0;
    var weekArray = [];    
    var today = moment.utc();
  
    while (currDate.add(1, 'days').diff(lastDate) < 0) {
      var isCurrentDate = currDate.date() == today.date() && currDate.month() == today.month() && currDate.year() == today.year();
      
      var data = {
        month: currDate.month(), // [0, 11]
        monthName: currDate.format('MMM'),
        date: currDate.date(),
        day: currDate.format('ddd'),
        year: currDate.year(),
        formattedDate: currDate.format('MM/DD/YYYY'),
        // TODO: revisit this logic
        hasEvent: _.find($scope.eventDates, function(evt) {             
          if(moment(evt).format('MM/DD/YYYY') == currDate.format('MM/DD/YYYY')) {            
            return true;
          } }),
        isCurrentDate: isCurrentDate,
        isSelected: isCurrentDate,
        weekIndex: index
      };
      
      if(isCurrentDate) {
        $scope.currentDateIndex = index;
        $scope.header = data;
        $scope.currentDate = data;
      }
      
      days.push(data);
      if(days.length == 7){
        weekArray.push(days);
        index++;
        days = [];
      }        
    }

    return weekArray;
  };

  $scope.getWeekData = function () {
    var startDate = $scope.calendarStartDate || '6/27/2015';
    var endDate = $scope.calendarEndDate || '1/3/2016';    
    var fromDate = moment(startDate);
    var toDate   = moment(endDate);  
    $scope.weekArray = [];    
    
    $scope.weekArray = enumerateDaysBetweenDates(fromDate, toDate);
    $ionicSlideBoxDelegate.update();    
    $timeout(function () {
      $ionicSlideBoxDelegate.slide($scope.currentDateIndex);      
    }, 1000);

  };
  
  var onEventAndArtistLoadComplete = function (res) {
    _.each(res, function (data) {        
        var artist = _.find($scope.artists, function(art){                 
        return art.artist_id == data.artist_id; });
        angular.extend(data, artist);        
        var date = new Date(data.start_time);
        var momentDate = moment(data.start_time);
        data.date = momentDate.format('MM/DD/YYYY');
        data.hour = date.getHours() >= 12 ? date.getHours() - 12 : date.getHours();
        data.min = date.getMinutes();
        data.hideEvent = false;
      });      
      $scope.events = res;      
      countDown();
      setLayout();
  };

  var getEvents = function (res) {      
    $scope.eventDates = _.uniq(_.map(_.flatten(res), function(e) {
        return moment(e.start_time).format('MM/DD/YYYY');
    }));
    $scope.getWeekData();
    eventsLoaded = true;
    hideLoading();          
    onEventAndArtistLoadComplete(res);
  };

  $scope.resetDate = function (day, gotoIndex) {    
    $scope.fadeIn = false;
    $scope.selection ? $scope.selection.isSelected = false : '';    
    day.isSelected = true;
    $scope.setDate = day.formattedDate;
    $scope.header = day;
    $scope.selection = day;    
    if(gotoIndex) {
      $ionicSlideBoxDelegate.slide(day.weekIndex);
    } 
    if($scope.showDetails) {
      $scope.onViewClick(true);
    }
    if(!$scope.isDaySelected) {
      $scope.isDaySelected = true;      
    }
    if($scope.view == 1) {
      $ionicScrollDelegate.scrollTop();
    }
    $timeout(function () {          
      $scope.fadeIn = true;         
    }, 100);
  };

  var getDiffTime = function (date1, date2) {
    var minNextEventDuration = 48;
    var diff = (date2 - date1) / 1000;
    diff = Math.abs(Math.floor(diff));

    var days = Math.floor(diff / (24 * 60 * 60));
    var leftSec = diff - days * 24 * 60 * 60;

    var hours = Math.floor(leftSec / (60 * 60));
    leftSec = leftSec - hours * 60 * 60;
    hours = hours + (days * 24);
    hours = hours < 10 ? '0' + hours : hours;

    var minutes = Math.floor(leftSec / (60));
    minutes = minutes < 10 ? '0' + minutes : minutes;

    leftSec = leftSec - minutes * 60;
    leftSec = leftSec < 10 ? '0' + leftSec : leftSec;

    if (hours >= 48) {
      $scope.noEventsMessage = "NO EVENTS UNTIL THE NEXT " + minNextEventDuration + " HOURS";
      $scope.timeRemaining = null;
    }
    else {
      $scope.timeRemaining = hours + ":" + minutes + ":" + leftSec;
      $scope.noEventsMessage = null;
    }
  };

  var countDown = function () {
    var now = new Date();
    var comingEvents = _.filter($scope.events, function (data) {
      return new Date(data.start_time).getTime() > now.getTime();
    });    
    $scope.nextEvent = _.min(comingEvents, function (data) { return new Date(data.start_time); });
    $scope.nextEvent.start_time = new Date($scope.nextEvent.start_time);
    $scope.now = new Date().getTime();

    if (comingEvents && comingEvents.length > 0) {
      getDiffTime($scope.nextEvent.start_time, new Date().getTime());
      //TODO: try to use some directive here instead of calling function
      $interval(function () {
        getDiffTime($scope.nextEvent.start_time, new Date().getTime());
      }, 1000);
    }
  };  

  $scope.onEventClick = function (event) {
    $scope.logData(event.artist_name, 'Artist_Tapped', $scope.setDate);
    $scope.artistUrl = $scope.largeAvatarBaseUrl + event.artist_image;
    $scope.artistInfoUrl = event.artist_info;
    $scope.showDetails = true; 
    $scope.showDial = false;   
    $scope.hostImage = 'img/event-host.png';
    $scope.dialFilePath = 'templates/eventDetail.html';
    var c = document.getElementById("bar");   
    $scope.imagePath = 'img/ring-red.svg';    
    var eventStart = moment(event.start_time);    
    var eventEnd = moment(event.end_time);
    var startTime = eventStart.hour() + eventStart.minute() / 60;
    var endTime = eventEnd.hour() + eventEnd.minute() / 60;    
    draw(c, eventStart, eventEnd);    
    $scope.hourEnd = eventEnd.hour();
    $scope.minuteEnd = eventEnd.minute();
    event.showEvent = true;   
    $scope.showEventDetails = true;  
    $scope.selectedEvent = event;     
    var name = event.artist_name.split(' ');
    $scope.selectedEvent.artist_firstname = name[0];
    $scope.selectedEvent.artist_lastname = name[1];        
  };

  $scope.onEventListClick = function (event) {
    $scope.toggleView();
    $timeout(function () {
      $scope.selectedEvent ? $scope.selectedEvent.showEvent = null : '';       
      $scope.onEventClick(event);      
    }, 0);
  };
  
  var resetTimeArc = function () {
    var c = document.getElementById("bar");
    angular.element(c).attr('stroke-dashoffset', '195%');
  };
  
  $scope.onViewClick = function (ignoreCheck, evt) {
    if (ignoreCheck || !evt.target.classList.contains('event')) {
      $scope.showDial = true;
      $scope.showDetails = false;
      $scope.hostImage = '';       
      $scope.showEventDetails = false;           
      $scope.dialFilePath = 'templates/dial.html';    
      $scope.imagePath = 'img/ring.svg';        
      $scope.selectedEvent ? $scope.selectedEvent.showEvent = null : '';
      resetTimeArc();
    }
  };

  var draw = function (circle, startTime, endTime) {
    var totalVal = 195;
    
    var st = startTime.hour() + startTime.minute() / 60;
    var et = endTime.hour() + endTime.minute() / 60;
    st = st > 12 ? st - 12 : st;
    et = et > 12 ? et - 12 : et;    
    if(st != 12 && st > et) {
      et = et + 12;
    }
    var angle = Math.abs(et - (st % 12)) * 30; //If event start at 12
    var rotateAngle = -90 + (30 * startTime.hour() + startTime.minute() / 2);
    var offsetValue = (angle * totalVal) / 360;
    var offsetValueFinal = totalVal - offsetValue;
    angular.element(circle).attr('stroke-dashoffset', offsetValueFinal+'%');
    circle.style.webkitTransform = "rotate("+rotateAngle+"deg)";
    circle.style.MozTransform = "rotate("+rotateAngle+"deg)";
    circle.style.msTransform = "rotate("+rotateAngle+"deg)";
    circle.style.OTransform = "rotate("+rotateAngle+"deg)";
    circle.style.transform = "rotate("+rotateAngle+"deg)";
  };
  
  var setLayout = function () {
    var content = document.getElementById('content');
    var contentWidth = content.clientWidth;
    var contentHeight = content.clientHeight;    
    var logoHeight = document.getElementById('eventLogo').clientHeight;    
    $scope.layoutWidth = contentWidth;
    $scope.layoutHeight = contentHeight - logoHeight;
    $scope.listLayoutHeight = $scope.layoutHeight - 46 - 10;//46 is header height
  };  
  
  $scope.loadList = function (daySchedule) {
    var header = document.getElementById('header');
    var headerHeight = header.clientHeight;       
    $scope.listLayoutHeight = $scope.layoutHeight - headerHeight - 10;
    $scope.isDaySelected = daySchedule;
    $ionicScrollDelegate.scrollTop();
  };
  
  var getPromotions = function () {
    DataManager.promotions(function (res) { 
      _.each(res, function (data) {
        var date = new Date(data.start_time);
        var momentDate = moment(data.start_time);
        data.date = momentDate.format('MM/DD/YYYY');
        data.hour = date.getHours() >= 12 ? date.getHours() - 12 : date.getHours();
        data.min = date.getMinutes();
        data.hideEvent = false;
      });  
      $scope.promos = res;          
    });
  };
  
  var getMetaData = function (res) {        
    res.forEach(function(data) {
      $scope[data.name] = data.value;
    }); 
  };
  
  var onRequestComplete = function (data) {
    imagesLoaded = true;
    hideLoading();
    getLargeAvatars(data);
  };
  
  var getLargeAvatars = function (data) {
    var largeAvatars = [];
    for (var i = 0; i < data.length; i++) {
          var url1 = $scope.largeAvatarBaseUrl + data[i].artist_image;          
          largeAvatars.push(url1);
        }        
    $ImageCacheFactory.Cache(largeAvatars);
  };
  
  var getAvatars = function (data) {
    var smallAvatars = [];        
    for (var i = 0; i < data.length; i++) {
      var url = $scope.smallAvatarBaseUrl + data[i].artist_image;
      smallAvatars.push(url);
    }    
    $ImageCacheFactory.Cache(smallAvatars).then(onRequestComplete(data), onRequestComplete(data));    
  };   
  
  $scope.onSwipe = function (operation) {
    var newDate = moment(new Date($scope.setDate))[operation](1, 'days').format('MM/DD/YYYY');     
    var faltennedArray = _.flatten($scope.weekArray, true);    
    var data = _.find(faltennedArray, function(d){ return d.formattedDate ==  newDate; });
    if(data) {
      $scope.resetDate(data, true);
    }        
  };
  
  $scope.goToDay = function (date) {
    var newDate = moment(new Date(date)).format('MM/DD/YYYY');     
    var faltennedArray = _.flatten($scope.weekArray, true);    
    var data = _.find(faltennedArray, function(d){ return d.formattedDate ==  newDate; });
    if(data) {
      $scope.toggleView();      
      $scope.resetDate(data, true);
    }
  };
  
  init();

});