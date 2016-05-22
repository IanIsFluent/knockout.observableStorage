# knockout.observableStorage

knockout.observableStorage is an extender for [Knockout.js](http://knockoutjs.com/) that allows you to persist observables to browser local storage, browser session storage, or to some other data store using custom functions to retrieve and set data.

## How It Works

The knockout.observableStorage extender allows you to have your observables automatically synchronize with browser local storage, browser session storage, or some other data source. 

Let's look at the example of browser local storage. When the observable is initialized, it will look for a particular value in the browser local storage, and if the value exists already, the observable will set its initial value to whatever is in local storage. If the observable is changed, it automatically saves the new value to local storage.

If you create two observables persisting to the same local storage data, they will be synchronized, which can be useful if you don't want to have to use the same observable in multiple places.

An observable listens to browser storage change events, so if you update some data in browser storage, the observable that is bound to that data will automatically update itself with the new value. This is true whether the value is changed on the current page (local and session storage) or on another page (local storage only). 

Persisting to another data source using customized functions can also be done. See the custom storage example below for more information on how to do this.

An observable extended with knockout.observableStorage will use the initial value passed into the observable function as the default value. If the data store already has a value (i.e., the value is not undefined), the initial value will be loaded from the data store. If the value in the data store is undefined, the value passed into the observable function will be made the initial value and persisted to the data store.

## Value Serialization

Values in an observable are serialized to JSON when they are saved and deserialized from JSON when they are retrieved. This allows us to store complex data.

## How to Use It

This extender uses the "persist" keyword, which is followed up by the options for persisting the observable. See the examples below.

### Persisting to Browser Local Storage

We can persist to browser local storage using "local" followed by the local storage key. Here's an example:

```Javascript
var localStorageObservable = ko.observable("Initial Value").extend({ persist: { local: "localKey" });
```

This will create an observable that is bound to the data in local storage with the key "localKey". You would of course replace "localKey" with the key of whatever data you want to store.

If the "localKey" data already existed in local storage, it would be loaded into the observable. If the "localKey" data did not exist, the observable would be initialized with a value of "Initial Value" and that value would be automatically persisted to local storage.

### Persisting to Browser Session Storage

Session storage is much the same as local storage, but with "session" followed by the session storage key. Here's an example:

```Javascript
var sessionStorageObservable = ko.observable("Initial Value").extend({ persist: { session: "sessionKey" });
```

The mechanism behind this is the same as local storage, but the value is being persisted into session storage instead of local storage.

### Persisting to Custom Storage

Persisting to custom storage is a bit different. knockout.observableStorage has no idea how you want to persist your data or how to tell if the data has changed, so you have to tell it how to do these things.

You will have to provide a function to save the data, a function to retrieve the data, and a function that receives a change callback function.

Let's look at an example:

```Javascript
function setData(value) {
	//Code to save the data goes here
}

function getData() {
	var data;
	
	//Code to retrieve the data goes here
	
	return data;
}

//knockout.observableStorage will pass us a callback function, which we will call 
//when the data has changed. You can use the callback within this function or
//save it to a variable and call it in some other code.
function setChangeCallback(callback) {
	//Code to deal with the call
	dataSource.on("change", function(newValue) {
		callback(newValue);
	});
}

//Here's the actual observable
var customStorageObservable = ko.observable("Initial Value")
	.extend({ persist: { get: getData, set: setData, setChangeCallback: setChangeCallback } });
```

When the observable wants to retrieve its persisted value, it will call the function passed to "get". When the observable wants to save its value, it will call the function passed to "set".

The observable will know when it's been updated, but it won't know that the data has been changed by some other means. If you want it to know if the data has been changed via some other means, you have to tell it so it can reload the value. You do this by passing a function to "setChangeCallback".

The function passed to "setChangeCallback" receives a callback function. This callback function is the key to telling the observable when the persisted data has been changed. So when you detect that the data has been changed (however that is done), you call the callback, passing in the new value.

Note that the setChangeCallback function is entirely optional. All that is required is a set or get function. You can specify only a get function or a set function, making the observable only persist in one direction, but you'll usually want to specify both a get and a set function.

Within the knockout.observableStorage internals, session and local storage persistence is handled in the same way as custom persistence. There are set, get, and setChangeCallback functions for session and local storage as well. Here's what the setChangeCallback for session storage looks like. It listens for the change event from the browser and then calls the callback to notify the observable that the data has changed.

```Javascript
function setSessionStorageChangeCallbackFunction(callback) {
	addEventListener("storage", function(event) {
		if(event.key === key && event.storageArea === sessionStorage) {
		  callback(event.newValue);
		}
}
```

Custom storage persistence could conceivably be used to persist values to a server, but at the moment this wouldn't work so well with asynchronous gets and sets, which are usually used to communicate with a server. I plan to implement asynchronous gets and sets, which will allow more effective persistence to a server.
 
## Example Page

Take a look at the [example page](http://maultasche.github.io/observableStorage/examples/) to see knockout.observableStorage in action. 

The fields bound to local and session storage will be persisted when the page is reloaded. Other fields will not. If you open multiple instances of the example page, the changing the field bound to local storage will cause the field in the other page instance to be updated. Session storage fields are not shared between pages, but will be persisted and survive page reloads until the page is closed.

The [source](./examples/index.html) for this example page can be found in the repository.

## History

I started using Jim Hoskin's [knockout.localStorage](https://github.com/jimrhoskins/knockout.localStorage), but I needed more than just the local storage binding it provided. So I created knockout.observableStorage. This project was originally intended to add additional functionality to knockout.localStorage, but ended up being a complete rewrite.

## To Do

There are still some things that can be done.

- Add build system to produced minified Javascript
- Add to npm
- Add the ability to specify asynchronous custom data saving and loading so that we can save and retrieve
data asynchronously
- Add AMD support
