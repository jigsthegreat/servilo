app.factory("Home",["$firebaseObject" , "$firebaseAuth","$firebaseArray",
  function($firebaseObject ,$firebaseAuth, $firebaseArray){

  var restaurant = firebase.database().ref().child('restaurants');

  return {
    restaurants : function(){
      return $firebaseArray(restaurant);
    },
    getRestaurant : function(restaurantId){
      return $firebaseObject(restaurant.child(restaurantId));
    }
    // getUserName : function(uid) {
    //   var user = firebase.database().ref().child('users').child(uid);
    //   return $firebaseObject(user);
    // }

  }
}])
