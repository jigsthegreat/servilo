app.factory("Order",["$firebaseAuth","$firebaseArray","$firebaseObject",
  function($firebaseAuth , $firebaseArray , $firebaseObject){

  var rootRef = firebase.database().ref();

  var orders = rootRef.child("orders");
  var restaurant = rootRef.child("restaurants")


  return {
    all : function() {
      return $firebaseArray(orders);
    },
    getOrder : function(restaurantId){
      return $firebaseArray(orders.orderByChild("restaurant_id").equalTo(restaurantId));
    }
  }
}]);