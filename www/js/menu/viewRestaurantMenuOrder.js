app.controller("ViewRestaurantMenuOrder",["$scope","$state","restaurantMenus","restaurantId", "CartData","$ionicModal","Cart","Restaurant",
  function($scope ,$state , restaurantMenus,restaurantId,CartData,$ionicModal,Cart,Restaurant){

$scope.restaurantId = restaurantId
$scope.restaurantMenus = restaurantMenus;


$scope.restaurantStatus = Restaurant.getRestaurantStatus(Restaurant.get($scope.restaurantId).owner_id);

$scope.restaurantStatus.on('value' , function(snap){
    $scope.getRestaurantStatus = snap.val() ? true : false;
    $scope.status = Restaurant.get(restaurantId).name + " is " + (snap.val() ? "Online" : "Offline");

})
console.log($scope.status)


  $scope.addToCart = function(menu) {
    if($scope.getRestaurantStatus){
      console.log("Cliked!!");
      $scope.id = menu.$id;
      $scope.menuName = menu.name;
      $scope.menuPrice = menu.price;
      $scope.addToCartModal.show();
    }
    else{
      alert('sorry the restaurant is offline')
    }

  };

  $scope.viewCart = function(){
    if(CartData.get().length <= 0 ){
      alert("No food in your cart");
    }else {
      $state.go("tabs.cart",{restaurantId:$scope.restaurantId})
    }
  }

  $scope.back = function(){
    if(CartData.get().length > 0 ){
      var confirmation = confirm("Leaving this restaurant will cancel all your orders, Are you sure you want to leave?")
      if(confirmation === true){
        CartData.get().length = 0;
        CartData.totalPrice().length = 0;
        $state.go("tabs.home");
      }
    }
    else{
        $state.go("tabs.home");
    }
  }


  var closeModal = function(){
    $state.go("tabs.restaurantMenus");
    $scope.addToCartModal.hide();
  }

  $scope.sendToCart = function(menu){
    var menuOrder = Cart.menuId(CartData.get(),"id",$scope.id);

    if( menuOrder === null){
      var menuCart = { id:$scope.id, name:$scope.menuName, price : $scope.menuPrice ,
        quantity:menu.quantity};
      CartData.add(menuCart);
      $state.go("tabs.restaurantMenus");
      closeModal();
    }
    else {
      var cartMenu = CartData.get()[menuOrder];
      cartMenu.quantity = cartMenu.quantity + menu.quantity;
      closeModal();
    }
  }

  $ionicModal.fromTemplateUrl('templates/add-to-cart-modal.html', function(addToCartModal) {
    $scope.addToCartModal = addToCartModal;
  }, {
    scope: $scope
  });



}]);
