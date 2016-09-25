app.controller('HomeTabCtrl',
  ["$scope","$ionicModal","$firebaseArray","currentAuth", "Restaurant", "Home" ,"$stateParams", "$state", "User", "$firebaseObject", "ionicMaterialInk", "MenusWithAvg", "$ionicPopup", "$cordovaGeolocation", "$ionicLoading", "$cordovaImagePicker", "Database", "Review",
function($scope, $ionicModal, $firebaseArray, currentAuth, Restaurant, Home, $stateParams, $state, User, $firebaseObject, ionicMaterialInk, MenusWithAvg, $ionicPopup, $cordovaGeolocation, $ionicLoading, $cordovaImagePicker, Database, Review) {
  console.log('HomeTabCtrl');

  $scope.usersRefObj = Database.users(); //new
  $scope.restaurants = Database.restaurants(); //new
  $scope.getAvg = Restaurant.getAveragePrice;
  $scope.getAvgRating = Restaurant.getAverageRating;
  $scope.getReviewer = Review.reviewer;
  // $scope.openRestaurant = Restaurant.getRestaurantOpenStatus;
  $scope.RestaurantService = Restaurant;

  User.setOnline();

  function setNull(){

  }


  $scope.signOut = function(callback) {
    User.auth.online = null;
    Auth.$signOut();
    console.log("bye");
    $state.go("tabs.login");
  }

  ionicMaterialInk.displayEffect();

  $scope.rating = {
    rate : 0,
    max: 5
  }

  if ($state.is("tabs.viewRestaurant")) {
    var id = $stateParams.restaurantId;
    var userReviewsRef = Database.usersReference().child(User.auth().$id).child('reviewed_restaurants').child(id); //new subs below
    var restaurantReviewsRef = Database.reviewsReference().orderByChild('restaurant_id').equalTo(id); //new subs above

    $scope.isAlreadyReviewed = function() {
      userReviewsRef.once('value', function(snapshot) {
        $scope.exists = (snapshot.val() !=null );
        $scope.review = $firebaseObject(Database.reviewsReference().child(snapshot.val()));
      })
    }

    $scope.restaurant = Restaurant.get(id);
    $scope.getRestaurantStatus = Restaurant.getRestaurantStatus(Restaurant.get(id).owner_id);
    $scope.restaurantService = Restaurant.getRestaurantOpenStatus(id)
    $scope.isAlreadyReviewed();
    $scope.restaurantReviews = $firebaseArray(restaurantReviewsRef);
  }

  $scope.images = [];
  // $scope.editImages = [];

  $scope.selImages = function() {
    var options = {
      maximumImagesCount: 10,
      width: 800,
      height: 800,
      quality: 80
    };
    window.imagePicker.getPictures(
        function(results) {
            for (var i = 0; i < results.length; i++) {
                console.log('Image URI: ' + results[i]);
                window.plugins.Base64.encodeFile(results[i], function(base64){
                    $scope.images.push(base64);
                    $scope.$apply();
                });
            }
        }, function (error) {
            console.log('Error: ' + error);
        }, {
            maximumImagesCount: 10,
            width: 800,
            quality: 80,
          // output type, defaults to FILE_URIs.
          // available options are
          // window.imagePicker.OutputType.FILE_URI (0) or
          // window.imagePicker.OutputType.BASE64_STRING (1)
            // outputType: window.imagePicker.OutputType.BASE64_STRING
        }
    );

    // $cordovaImagePicker.getPictures(options)
    // .then(function (results) {
    //   for (var i = 0; i < results.length; i++) {
    //     window.plugins.Base64.encodeFile(results[i], function(base64){
    //       $scope.images.push(base64);
    //       $scope.$apply();
    //     });
    //     console.log('Image URI: ' + results[i]);
    //   }
    // }, function(error) {
    //   // error getting photos
    // });
  };

  $scope.addReview = function(review) {
    $ionicLoading.show();
    console.log("wewewe");
    var reviewRating = review.rating;
    Database.reviews().$add({
      content: review.content,
      rating: review.rating,
      prevRating: review.rating,
      reviewer_id: User.auth().$id,
      restaurant_id : id,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(function(review) {
      $ionicLoading.hide();
      var newImages = Database.reviewsReference().child(review.key).child('images');
      var list = $firebaseArray(newImages);
      for (var i = 0; i < $scope.images.length; i++) {
        list.$add({ image: $scope.images[i] }).then(function(ref) {
          console.log("added..." + ref);
        });
      }
      console.log("add review done");
      Database.usersReference().child(User.auth().$id).child('reviewed_restaurants').child(id).set(review.key);
      $scope.isAlreadyReviewed();
      $scope.reviewModal.hide();
      review.content = '';
      $scope.review.rating = 0;
      $scope.rating.rate = 0;
      $scope.images = [];
    })
  }

  $scope.updateReview = function(review) {
    // console.log("hiiii");
    var reviewRef = Database.reviewsReference().child(review.$id);
    var reviewRating = review.rating;
    reviewRef.update({
      content: review.content,
      rating: review.rating
    }).then(function() {
      console.log("finished updating review.");
      // var newImages = newReviewRef.child(review.$id).child('images');
      // var list = $firebaseArray(newImages);
      // for (var i = 0; i < $scope.images.length; i++) {
      //   list.$add({ image: $scope.images[i] }).then(function(ref) {
      //     console.log("added..." + ref);
      //   });
      // }
    })
    review.content = '';
    $scope.review.rating = 0;
    $scope.rating.rate = 0;
    $scope.editReviewModal.hide();
    $scope.isAlreadyReviewed();
    $scope.images = [];
  };

  $ionicModal.fromTemplateUrl('templates/new-review.html', function(reviewModal) {
    $scope.reviewModal = reviewModal;
  }, {
    scope: $scope
  });
  $ionicModal.fromTemplateUrl('templates/edit-review.html', function(editReviewModal) {
    $scope.editReviewModal = editReviewModal;
  }, {
    scope: $scope
  });

  $ionicModal.fromTemplateUrl('templates/edit-review.html', function(editModalReview) {
    $scope.editReviewModal = editModalReview;
  }, {
    scope: $scope
  });

  $scope.showConfirmDelete = function(review) {
    var reviewObj = review;
    var reviewRating = review.rating;
    var reviewContent = review.content;
    var confirmDelete = $ionicPopup.confirm({
      title: "Delete Review",
      template: "Delete '" + reviewContent +"'?"
    })

    confirmDelete.then(function(res) {
      var reviewsDeleteRef = firebase.database().ref().child('reviews').child(review.$id);
      if(res){
        reviewsDeleteRef.remove();
        userReviewsRef.remove();
        $scope.isAlreadyReviewed();
        $scope.review = {};
        $scope.rating.rate = 0;

      }
      else {
        console.log("delete failed");
      }
    })
  }
  $scope.direction =[];
  $scope.currentLocation ={};
  $scope.markers =[];
  $scope.restaurantMarkers =[];
  $scope.map =  {center: { latitude: 10.729984, longitude: 122.549298 }, zoom: 12, options: {scrollwheel: false}, bounds: {}};

  var options = {timeout: 10000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){
    $scope.currentLocation = {latitude: position.coords.latitude,longitude: position.coords.longitude};
  });

  $scope.setMap = function(restaurant){
      $scope.map =  {center:{latitude: restaurant.latitude, longitude: restaurant.longitude}, zoom: 14, options: {scrollwheel: false}, bounds: {}};
      $scope.restaurantMarkers.push({id: Date.now(),
        coords:{latitude:restaurant.latitude, longitude:restaurant.longitude}
      });
  };

  $scope.addMarker = function(restaurant){
    $scope.markers.push({id: restaurant.$id,
      coords: {latitude:restaurant.latitude, longitude:restaurant.longitude}
    });
  };

  $scope.markerEvents = {
    click: function(marker, eventName, model){
        $state.go("tabs.viewRestaurant",{restaurantId:model.id});
    }
  };

  $scope.showPath =  function(restaurant){
    var direction = new google.maps.DirectionsService();
    $scope.map.zoom = 12;
    var request = {
      origin: {lat:$scope.currentLocation.latitude,lng:$scope.currentLocation.longitude},
      destination: {lat: restaurant.latitude, lng: restaurant.longitude},
      travelMode: google.maps.DirectionsTravelMode['DRIVING'],
      optimizeWaypoints: true
    };

    $scope.restaurantMarkers.push({id: Date.now(),
      coords:{latitude:$scope.currentLocation.latitude, longitude:$scope.currentLocation.longitude}
    });
    direction.route(request, function(response, status){
      var steps = response.routes[0].legs[0].steps;
      var distance =response.routes[0].legs[0].distance.value/1000;
      for(i=0; i<steps.length; i++){
        var strokeColor = '#049ce5';
        if((i%2)==0){
          strokeColor = '#FF9E00';
        }
        $scope.direction.push({id:i,paths:steps[i].path, stroke: {
            color: strokeColor,
            weight: 5
        }});
        }
        $scope.restaurantMarkers[0].icon = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_bubble_icon_texts_big&chld=restaurant|edge_bc|FFBB00|000000|'
            + restaurant.name +'|Distance: '+ distance + 'km');

        $scope.$apply();
    });
  };

  $scope.CallNumber = function(number){
    //  var number = '09772475405' ;
     window.plugins.CallNumber.callNumber(function(){
      //success logic goes here
      console.log("call success");
     }, function(){
       console.log("call failed");
      //error logic goes here
     }, number)
   };

}]);
