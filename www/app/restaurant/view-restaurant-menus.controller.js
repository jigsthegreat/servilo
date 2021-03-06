app.controller("ViewRestaurantMenus", ["$scope", "$stateParams", "$state", "restaurantId", "CartData", "$ionicModal", "Cart", "Restaurant", "ionicToast", "Menu", "$ionicLoading",
  function($scope, $stateParams, $state, restaurantId, CartData, $ionicModal, Cart, Restaurant, ionicToast, Menu, $ionicLoading) {
    console.log("This is view restaurant menus");
    $ionicLoading.show();
    $scope.restaurantId = restaurantId
    $scope.restaurantMenus = Restaurant.getMenus(restaurantId);
    $scope.options = {
      loop: true,
      effect: 'slide',
      autoplay: 3000,
      speed: 500,
      paginationHide: true
    }
    $scope.data = {};
    $scope.$watch('data.slider', function(nv, ov) {
      $scope.slider = $scope.data.slider;
    })
    $scope.categories = Menu.getMenuCategories(restaurantId);

    $scope.promoFilter = function() {
      return function(promo) {
        var now = new Date();
        promo.start = new Date(promo.startDate)
        promo.end = new Date(promo.endDate)

        return promo.start.setHours(0) <= now.setHours(0) && promo.end.setHours(23) >= now.setHours(0)
      }
    }


    Restaurant.getCategories(restaurantId).$loaded()
      .then((categories) => {
        $scope.categories = categories.map(function(category) {
          var c = {
            name: category.name,
            getMenus: Menu.getMenusFromCategories(restaurantId, category.$id).$loaded()
              .then((menus) => {
                c.menus = menus.map(function(menu) {
                  var m = {
                    get: Menu.get(menu.$id).$loaded()
                      .then((menuObj) => {
                        m.details = menuObj
                      })
                  }
                  return m
                })
              })
          }
          return c
        })
      })

    Restaurant.getPromos(restaurantId).$loaded()
      .then((promos) => {
        $scope.promos = promos
      })
    Restaurant.getMenus(restaurantId).$loaded()
      .then((menus) => {
        if (menus.length == 0) {
          $ionicLoading.hide()
        }
        $scope.restaurantMenus = menus

        $scope.$watchCollection('restaurantMenus', function(newRestaurantMenus) {
          $scope.menus = newRestaurantMenus.map(function(menu) {
            var m = {
              get: Menu.get(menu.$id).$loaded()
                .then((menuObj) => {
                  $ionicLoading.hide();
                  m.details = menuObj;
                  m.ready = true
                })
            }
            return m;
          })
        })
      })

    // var restaurant = Restaurant.get(restaurantId);

    Restaurant.get(restaurantId).$loaded()
      .then(function(restaurant) {
        $scope.restaurant = restaurant;
        var restaurantStatus = Restaurant.getRestaurantStatus(restaurant.owner_id);
        $scope.restaurantOpenStatus = Restaurant.getRestaurantOpenStatus(restaurant);
        restaurantStatus.on('value', function(snap) {
          $scope.getRestaurantStatus = snap.val();
          $scope.status = restaurant.name + " is " + (snap.val() ? "Online" : "Offline");
          console.log("Status: " + $scope.getRestaurantStatus);
        })
      })


    // $scope.availability = function(menu) {
    //   return menu.availability ? "Add to cart" : "Currently not available"
    // }

    $scope.addToCart = function(menu) {
      console.log(menu.photoURL);
      if ($scope.getRestaurantStatus) {
        $scope.id = menu.$id;
        $scope.menuName = menu.name;
        $scope.menuPrice = menu.price;
        $scope.menuPhoto = menu.photoURL;
        $scope.addToCartModal.show();
      } else {
        ionicToast.show('Sorry the restaurant is offline', 'bottom', false, 2500);
        // alert('Sorry the restaurant is offline')
      }
      console.log('Scope photo: ' + $scope.menuPhoto);
    };

    $scope.viewCart = function() {
      if (!CartData.isEmpty()) {
        $scope.restaurantCart.show();
        console.log(JSON.stringify(CartData.get().menus, null, 4));
      } else {
        ionicToast.show('No food in your cart', 'bottom', false, 2500);
        // alert("No food in your cart");
      }
    }

    // $scope.back = function() {
    //   if (!CartData.isEmpty()) {
    //     let confirmation = confirm("Leaving this restaurant will cancel all your orders, Are you sure you want to leave?")
    //     if (confirmation === true) {
    //       CartData.setNull()
    //       $state.go("tabs.home");
    //     }
    //   } else {
    //     $state.go("tabs.home");
    //   }
    // }


    var closeModal = function() {
      $state.go("tabs.viewRestaurant.menus");
      $scope.addToCartModal.hide();
    }

    $scope.computeSubtotal = function(quantity) {
      $scope.subtotal = $scope.menuPrice * quantity;
    }

    $scope.sendToCart = function(menu) {

      let menuOrder = Cart.menuId(CartData.get().menus, "id", $scope.id);

      if (menu.quantity) {
        if (menu.quantity > 0) {
          let menuCart = {
            id: $scope.id,
            name: $scope.menuName,
            price: $scope.menuPrice,
            photoURL: $scope.menuPhoto,
            quantity: menu.quantity
          };
          console.log(menuCart)
          $scope.error = false;

          if (menuOrder === null) {
            CartData.addMenu(menuCart);
            console.log(CartData.get().menus)
            ionicToast.show('Added ' + $scope.menuName + ' to cart', 'bottom', false, 2500);
            closeModal();
            menu.quantity = 0;

          } else {
            var cartMenu = CartData.get().menus[menuOrder];
            cartMenu.quantity = cartMenu.quantity + menu.quantity;
            ionicToast.show('Added ' + $scope.menuName + ' to cart', 'bottom', false, 2500);
            closeModal();
            menu.quantity = 0;
          }
        } else {
          $scope.error = true;
          console.log("error : " + $scope.error)
          $scope.errorMessage = "Invalid Input "
        }

      } else {
        $scope.error = true;
        console.log("error : " + $scope.error)
        ionicToast.show('Quantity is undefined.', 'bottom', false, 2500);
        $scope.submitUndefined = true;
        $scope.errorMessage = "Quantity is undefined"
      }

    }

    $ionicModal.fromTemplateUrl('app/menu/_add-cart-modal.html', function(addToCartModal) {
      $scope.addToCartModal = addToCartModal;
    }, {
      scope: $scope
    });

    $ionicModal.fromTemplateUrl('app/cart/_cart.html', function(restaurantCart) {
      $scope.restaurantCart = restaurantCart;
    }, {
      scope: $scope
    });

    $scope.toggleGroup = function(group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };
    $scope.isGroupShown = function(group) {
      return $scope.shownGroup === group;
    };

  }
]);
