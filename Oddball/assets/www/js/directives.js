angular.module('dials.directives', ['ngAnimate'])
.directive('myShow', function($animate) {
  return {
    scope: {
      'myShow': '='
    },
    link: function(scope, element) {   
      scope.$watch('myShow', function(show, oldShow) {        
        if (show) {
          $animate.removeClass(element, 'ng-hide');
        }
        if (!show) {
          $animate.addClass(element, 'ng-hide');
        }
      });
    }
  };
});