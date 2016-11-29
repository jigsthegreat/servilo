app.controller("ProfileCtrl", ["$scope", "User", "$ionicLoading", "$ionicPopover", "$ionicModal", "Database", "$cordovaCamera", "Upload", "Auth", "Restaurant",
  function($scope, User, $ionicLoading, $ionicPopover, $ionicModal, Database, $cordovaCamera, Upload, Auth, Restaurant) {


    $ionicPopover.fromTemplateUrl('app/profile/_popover.html', {
      scope: $scope
    }).then(function(optionsPopover) {
      $scope.optionsPopover = optionsPopover;
    });

    $ionicModal.fromTemplateUrl('app/profile/_edit-profile.html', function(editProfileModal) {
      $scope.editProfileModal = editProfileModal;
    }, {
      scope: $scope
    });

    $ionicModal.fromTemplateUrl('app/profile/_edit-photo.html', function(editPhotoModal) {
      $scope.editPhotoModal = editPhotoModal;
    }, {
      scope: $scope
    });

    User.getAuthFavorites().$loaded()
      .then((favs) => {
        $scope.usrFavs = favs;
        $scope.$watchCollection('usrFavs', function(favorites) {
          $scope.userFavorites = favorites.map(function(restaurant) {
            var r = {
              restaurant : restaurant,
              get : function() {
                Restaurant.get(restaurant.$id).$loaded()
                  .then((res) => {
                    r.name = res.name
                  })
              }()
            }
            return r;
          })
        })
      })



    $scope.remove = function(restaurant) {
      console.log(JSON.stringify(restaurant, null, 4));
      console.log(restaurant.name);
      console.log(restaurant.restaurant.$id);
      User.removeFromFavorites(restaurant);
    }

    Auth.$onAuthStateChanged(function(firebaseUser) {
      if (firebaseUser) {
        // $scope.firebaseUser = User.auth();
        User.auth().$loaded().then(function(data) {
            $scope.firebaseUser = data;
            if (data.photoURL) {
              $scope.photoURL = data.photoURL;
            }
          })
          // if(firebaseUser.displayName) {
          //   //it means all social logins
          // }
      }
    });

    $scope.openEditProfile = function() {
      $scope.currentUser = User.auth();
      //   $scope.currentUser = User.auth();
      $scope.editProfileModal.show();
      $scope.closePopover();
    };
    $scope.openEditPhoto = function() {
      $scope.editPhotoModal.show();
      $scope.closePopover();
    }
    $scope.closeEditPhoto = function() {
      // $scope.photoURL = null;
      $scope.progress = null;
      $scope.editPhotoModal.hide();
    }
    $scope.openPopover = function($event, user) {
      $scope.photoURL = user.photoURL;
      $scope.optionsPopover.show($event);
    };
    $scope.closePopover = function() {
      $scope.optionsPopover.hide();
    };

    $scope.upload = function(index) {
      var source = Upload.getSource(index);
      var options = Upload.getOptions(source);
      $cordovaCamera.getPicture(options).then(function(imageData) {
        var profileRef = Upload.profile(imageData);
        $scope.progress = 1;
        profileRef.on('state_changed', function(snapshot){
        var progress = Upload.getProgress(snapshot);
        console.log('Upload is ' + progress + '% done');
        $scope.progress = progress;
      }, function(error) {
        console.log("error in uploading." + error);
      }, function() {
        $scope.photoURL = profileRef.snapshot.downloadURL;
        $scope.$apply();
      });

      }, function(error) {
        console.error(error);
      });
    }

    // $scope.editProfile = function(user) {
    //   $scope.optionsPopover.hide();
    //   var userRef = Database.usersReference().child(User.auth().$id);
    //   console.log(user.firstName)
    //   console.log(user.lastName)
    //   console.log(user.descriptionName)
    //   userRef.set({
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     displayName: user.displayName,
    //     description: user.description,
    //     // image: $scope.imageURL
    //   })
    //   $scope.editProfileModal.hide();
    // }

    $scope.editProfile = function(user) {
      $scope.optionsPopover.hide();

      var userRef = Database.usersReference().child(User.auth().$id);
      userRef.update({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        description: user.description
      })

      $scope.editProfileModal.hide();
    }

    $scope.editPhoto = function() {
      $scope.optionsPopover.hide();
      var userRef = Database.usersReference().child(User.auth().$id);
      userRef.update({
        photoURL: $scope.photoURL
      })
      $scope.progress = null;
      $scope.editPhotoModal.hide();
    }


  }
]);
