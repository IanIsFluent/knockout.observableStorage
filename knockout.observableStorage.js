(function(ko){
  // Wrap ko.observable and ko.observableArray
  var methods = ['observable', 'observableArray'];

  //Wrap the observable functions with one of our own that takes care 
  //of persistance
  ko.utils.arrayForEach(methods, function(method){
    var saved = ko[method];
    
    ko[method] = function(initialValue, options){
      options = options || {};
      options.persist = options.persist || {};

      //Create observable from saved method
      var observable = saved(initialValue);
      var key;

      //Persist the observable depending on the specified options
      if(options.persist.local) {
        //Only persist if the browser supports local storage
        if(localStorage) {
          //Get the storage key from the persist options
          key = options.persist.local;

          //Create the persist to storage functionality
          persistToStorage(observable, getLocalStorage(key), setLocalStorage(key),
            setLocalStorageChangeCallback(key));
        }
      }
      else if(options.persist.session) {
        //Only persist if the browser supports session storage
        if(sessionStorage) {
          //Get the storage key from the persist options
          key = options.persist.session;

          //Create the persist to storage functionality
          persistToStorage(observable, getSessionStorage(key), setSessionStorage(key),
            setSessionStorageChangeCallback(key));
        }
        
      }
      else if(options.persist.get || options.persist.set) {
        var get = options.persist.get;
        var set = options.persist.set;
        var setChangeCallback = option.persist.setChangeCallback;

        //Create the custom persist to storage functionality
        persistToStorage(observable, get, set, setChangeCallback);
      }

      return observable;
    };
  });

  //Returns a curried function that gets a value wit a particular key from local storage
  function getLocalStorage(key) {
    var getFunction = function getLocalStorageFunction() {
      var storedValue;

      //Retrieve the value from storage, if it exists
      if(key && localStorage.hasOwnProperty(key)){
        try{
          storedValue = JSON.parse(localStorage.getItem(key));
        }catch(e){}
      }

      return storedValue;      
    };

    return getFunction;
  }

  //Returns a curried function that gets a value with a particular key from session storage
  function getSessionStorage(key) {
    var getFunction = function getSessionStorageFunction() {
      var storedValue;

      //Retrieve the value from storage, if it exists
      if(key && sessionStorage.hasOwnProperty(key)){
        try{
          storedValue = JSON.parse(sessionStorage.getItem(key));
        }catch(e){}
      }

      return storedValue;      
    };

    return getFunction;
  }

  // //Persists the observable to local storage
  // //Parameters:
  // //  observable: the observable that is to be synchronized
  // //  key: the storage key
  // function persistToLocalStorage(observable, key) {
  //     var storedValue = undefined;

  //     //If there is an existing value, load that value from storage
  //     if(key && localStorage.hasOwnProperty(key)){
  //       try{
  //         storedValue = JSON.parse(localStorage.getItem(key));
  //       }catch(e){};
  //     }

  //     //If the stored value exists, assign it to the observable
  //     if(storedValue !== undefined) {
  //       observable(storedValue);
  //     }

  //     //Subscribe to the observable, persisting any changes to storage
  //     if(key){
  //       observable.subscribe(function(newValue){
  //         localStorage.setItem(key, ko.toJSON(newValue));
  //       });

  //       addEventListener("storage", function(event) {
  //         if(event.key === key) {

  //         }
  //       });
  //     }
  // }

  // //Persists the observable to session storage
  // //Parameters:
  // //  observable: the observable that is to be synchronized
  // //  key: the storage key
  // function persistToSessionStorage(observable, key) {

  // }

  //This method is called when 
  //Persists the observable using get and set functions. A set callback
  //function can also be provided to be able to notify the observable
  //that the data in the storage backend has been changed.
  //Doing so generically like this allows us to pass to use a single
  //persistToStorage function, passing in the functions that do the
  //work of interacting with the storage.
  //Parameters:
  //  observable: the observable that is to be synchronized
  //  get: the function to get the persisted value. 
  //  set: the function to set the persisted value.
  //  setChangeCallback: the function to set the callback that gets 
  //    called when a change event occurs in the storage backend. 
  //    The change callback is expecting to receive the new value
  //    as the first parameter. 
  function persistToStorage(observable, get, set, setChangeCallback) {
    var storedValue;
    var observableSubscription;

    //Define a function that gets called when the observable is changed
    var onObservableChanged = function observableChanged(newValue) {
      set(newValue);
    };

    //If a get function is defined, get the value
    if(get) {
      storedValue = get();
    }
    
    //If the stored value exists, assign it to the observable
    if(storedValue !== undefined) {
      observable(storedValue);
    }

    //If we have a set function, call it when the observable's value is changed
    if(set) {
      observableSubscription = observable.subscribe(onObservableChanged);        
    }

    //If we have a change callback function and a get function, 
    //set the change callback to a function that retrieves the new value 
    //whenever there's a change
    if(setChangeCallback) {
      setChangeCallback(function(newValue) {
        //We only need to do something if the new value is different than the value
        //in the observable. 
        if(observable() !== newValue) {
          //We have to break the "storage changed event -> observable is updated ->
          //update storage on change -> storage changed event" cycle, so we'll
          //unsubscribe from the observable change event, set the the new value, 
          //and then resubscribe.

          //Unsubscribe from the observable change event
          if(observableSubscription) {
            observableSubscription.dispose();
          }
          
          //Set the observable to the new value
          observable(newValue);

          //Resubscribe to the observable change event
          if(observableSubscription) {
            observableSubscription = observable.subscribe(onObservableChanged);
          } 
        }   
      });
    }
  }

  //Returns a curried function that sets a value with a particular key in local storage
  function setLocalStorage(key) {
    var setFunction = function setLocalStorageFunction(value) {
      localStorage.setItem(key, ko.toJSON(newValue));      
    };

    return setFunction;
  }

  //Returns a function that sets a callback that gets called when a local storage
  //value is changed. The new value is passed as the first parameter to the 
  //callback.
  function setLocalStorageChangeCallback(key) {
    var setFunction = function setLocalStorageChangeCallbackFunction(callback) {
      addEventListener("storage", function(event) {
        if(event.key === key && event.storageArea === localStorage) {
          callback(event.newValue);
        }
      });     
    };

    return setFunction;
  }

  //Returns a curried function that sets a value with particular key in session storage
  function setSessionStorage(key) {
    var setFunction = function setSessionStorageFunction(value) {
      sessionStorage.setItem(key, ko.toJSON(newValue));      
    };

    return setFunction;
  }

  //Returns a function that sets a callback that gets called when a session storage
  //value is changed. The new value is passed as the first parameter to the 
  //callback.
  function setSessionStorageChangeCallback(key) {
    var setFunction = function setSessionStorageChangeCallbackFunction(callback) {
      addEventListener("storage", function(event) {
        if(event.key === key && event.storageArea === sessionStorage) {
          callback(event.newValue);
        }
      });     
    };

    return setFunction;
  }
})(ko);
