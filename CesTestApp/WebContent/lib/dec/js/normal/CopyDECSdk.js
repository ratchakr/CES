/*
 * COPYRIGHT Ericsson 2014
 *
 * The copyright to the computer program(s) herein is the property of
 * Ericsson Inc. The programs may be used and/or copied only with written
 * permission from Ericsson Inc. or in accordance with the terms and
 * conditions stipulated in the agreement/contract under which the
 * program(s) have been supplied.
 * 
 * DEC javascript sdk library
 */
var userAgent = navigator.userAgent;
var Availability = {
	available : 0,
	readonly : 1,
	not_supported : 2,
	not_supported_yet : 3,
	not_supported_security : 4,
	not_supported_policy : 5,
	not_supported_other : 6
};

var DecErrorCodes = {
	invalid_parameter : {errorcode : "invalid_parameter", errormessage : "Invalid parameter"},
	not_authenticated : {errorcode : "not_authenticated", errormessage : "Not authenticated"},
	not_authorized : {errorcode : "not_authorized", errormessage : "Not authorized"},
	connection_timeout : {errorcode : "connection_timeout", errormessage : "Communication error"},
	not_subscribed : {errorcode : "not_subscribed", errormessage : "Not subscribed"},
	not_supported : {errorcode : "not_supported", errormessage : "Not Supported"},
	component_not_found: {errorcode : "component_not_found", errormessage : "Component not found"},
	span_not_found : {errorcode : "span_server_not_connected", errormessage : "Not connected to span server, Please check the configuration"}
};

/**
 * Event Type enum
 */
var EventType = {
	ALL : "all",
	CREATE : "create",
	ADD	: "add",
	UPDATE : "update",
	GET	: "get",
	DELETE : "delete"
};

var componentsArray = ["alertmanager","appmanager","calendar","commerce","connectivity","identity","media","navigation","notification","policy","sa",
                       "search","settings","sms","speech","va","vehicleinfo"];

/* Identify span / mbbridge usage */
var ws = null;
var connectionType = "";
console.log("User agent :: ", userAgent);
var pattern = userAgent.match(/Android/);
//console.log(pattern);
var version = null;
if (pattern!=null && pattern.length>0 
    && pattern[0]!=null && pattern[0].length>0) {
    version = pattern[0]; 
}
console.log("version", version);

connectionType = "span";

// uncomment the following after demo
/*if ( version!=null && (version == "Android") ) {    
    *//** Use mbbridge **//*
    console.log("Going to use MB Bridge")
    connectionType = "mbbridge"
} else {
    *//** Use SPAN **//*
    console.log("Going to use SPAN")
    connectionType = "span"
}*/





/*var pattern = userAgent.match(/Android/);
var version = null;
if (pattern!=null && pattern.length>0 
        && pattern[1]!=null && pattern[1].length>0) {
    version = pattern[0];
}
console.log("Android version: ", version);
if ( version!=null && (version.match(/4\.4/)==null) 
       && (version.match(/5/)==null) ) {
	connectionType = "mbbridge"
} else {
	connectionType = "span"
}*/

console.log("Using Connection Type: ", connectionType);
var DecCommon = function() {
	this.callback = null;
	this.isMap = false;
	this.appId = "DECJSSDK";

	var nodeLevel = "";
	var leaf = false;
	var availableStatus = Availability.available;
	var isArray = false;

	this.setAppId = function(myAppId) {
		this.appId = myAppId;
	}

	this.getAppId = function() {
		return this.appId;
	}

	this.setNodeLevel = function(myNodeLevel) {
		this.nodeLevel = myNodeLevel;
	}

	this.getNodeLevel = function() {
		return this.nodeLevel;
	}

	this.setLeafStatus = function(status) {
		this.leaf = status;
	}

	this.isLeaf = function() {
		return this.leaf;
	}

	this.setAvailableStatus = function(status) {
		this.availableStatus = status;
	}

	this.getAvailableStatus = function() {
		return this.availableStatus;
	}

	this.subscribe = function(subscriptionCallBack, options) {
		console.log("Processing subscribe functionality");
		this.availableStatus = Availability.available;
		var operation = "READ";
		var handle = this.nodeLevel;
		console.log("HANDLE is :::" + handle);
		var subscriptionHandle = createSubscriptionHandle(handle);
		console.log("SUBSCRIPTION HANDLE " + subscriptionHandle);
		var isAlreadySubscribed = checkLocalSubscriptions(subscriptionHandle, subscriptionCallBack, options);

		if (!isAlreadySubscribed) {
			console.log("Adding subscriptions");
			var subscriptionAdded = addLocalSubscriptions(subscriptionHandle, subscriptionCallBack, options);

			if(subscriptionAdded != null) {
				console.log("Is already subscribed ::: false");
				console.log("Subscription is done");

				var data = {
					'component' : getComponent(handle),
					'namespace' : getNameSpace(handle),
					'method'	: "subscribe",
					'eventType'	: EventType.GET,
					'value'		: {}
				};

				console.log("Notifying Systems");
				notifySystems(data);
			} else {
				console.log("Is already subscribed ::: true");
			}
		} else {
			console.log("Is already subscribed ::: true");
		}

		return subscriptionHandle;
	}

	this.unsubscribe = function(handle) {
		// localStorage.removeItem(handle);
		var subscriptionHandle = handle;

		if(handle == null) {
			subscriptionHandle = createSubscriptionHandle(handle);
		}

		storage[subscriptionHandle] = null;
		console.log("Unsubscribed...");

		/*
		 * var handle = this.nodeLevel; console.log("HANDLE is :::" + handle);
		 * 
		 * var data = { 'component' : getComponent(handle), 'namespace' :
		 * getNameSpace(handle), 'method' : "unsubscribe", 'eventType' :
		 * EventType.DELETE, 'value' : {} };
		 * 
		 * console.log("Notifying Systems"); notifySystems(data);
		 */

		this.availableStatus = Availability.not_supported;
	}

	this.get = function(options) {

		if (this.availableStatus === Availability.not_supported) {
			console.log("Not Supported!");

			return new Promise(function(resolve, reject) {
				var errorObj = JSON.stringify(DecErrorCodes.not_supported);
				reject(Error(errorObj));
			});
		}

		var attrName = options || null;
		var attrVal = "";

		console.log("Get Called for NodeLevel = " + this.nodeLevel + ", leaf = " + this.isLeaf());

		if (attrName) {
			if (this.isLeaf()) {
				attrVal = localStorage.getItem(this.nodeLevel);
			} else {
				var keys = Object.keys(localStorage);
				var vals = new Array();

				var itemsArrayStr = localStorage.getItem(this.nodeLevel);
				var itemsArray = JSON.parse(itemsArrayStr);

				if (this.isArray) {
					console.log("JSON: " + options);
					var JsonString = JSON.stringify(options);
					var attrObj = JSON.parse(JsonString);
					console.log("json parse" + attrObj);

					var attrKeys = new Array();
					var attrVals = new Array();
					var keycount = 0;
					for (attrKey in attrObj) {
						attrKeys[keycount] = attrKey;
						attrVals[keycount] = attrObj[attrKey];
						keycount++;
					}

					var arrayVal = new Array();
					var arrayIndex = 0;

					for (var counter = 0; counter < itemsArray.length; counter++) {
						var found = true;
						for (var n = 0; n < keycount; n++) {
							var key = attrKeys[n];
							var val = attrVals[n];
							var arrItem = itemsArray[counter];

							if (arrItem[key] !== val) {
								found = false;
								break;
							}
						}

						if (found) {
							arrayVal[arrayIndex] = JSON.stringify(itemsArray[counter]);
							arrayIndex++;
						}
					}

					console.log("GET Array Result: " + arrayVal);

					return new Promise(function(resolve, reject) {
						resolve(arrayVal);
					});

				} else if (this.isMap) {
					var attrObj = JSON.parse(options);

					var resultObj = new Object();
					for (var n = 0; n < attrObj.length; n++) {
						var val = attrObj[n];

						if (itemsArray[val] !== null)
							resultObj[val] = itemsArray[val];

					}
					attrVal = JSON.stringify(resultObj);

				} else {
					attrVal = "{";
					if (attrName instanceof Array) {
						var foundCount = 0;
						for (var i = 0; i < attrName.length; i++) {
							if (foundCount !== 0) {
								attrVal += ",";
							}
							attrVal += "'"
								+ this.nodeLevel
								+ "."
								+ attrName[i]
							+ "':'"
							+ localStorage.getItem(this.nodeLevel + "."
									+ (attrName[i])) + "'";
							foundCount++;
						}
					} else {
						var foundCount = 0;
						for (var j = 0; j < keys.length; j++) {
							if (isNaN(parseInt(keys[j]))
									&& keys[j].indexOf(this.nodeLevel) != -1) {
								if (foundCount !== 0) {
									attrVal += ",";
								}
								attrVal += keys[j] + ":'" + localStorage.getItem(keys[j]) + "'";
								foundCount++;
							}
						}
					}
					attrVal += "}";
				}
				console.log("GET Result: " + attrVal);
				console.log("GET Result: " + attrVal.length);
				return new Promise(function(resolve, reject) {
					resolve(attrVal);
				});
			}

		} else {
			// get called without options
			attrVal = getValueForHandle(this.isLeaf(), this.isArray, this.isMap, this.nodeLevel);
		}

		console.log("Retreived JSON: " + attrVal);
		return new Promise(function(resolve, reject) {
			resolve(attrVal);
		});
	}

	this.set = function(options, filter) {
		var filterOptions = filter || null;
		var attrName = options || null;
		if (attrName === null) {
			console.log("Set called without options!");
			return new Promise(function(resolve, reject) {
				var errorObj = JSON.stringify(DecErrorCodes.invalid_parameter);
				reject(Error(errorObj));
			});
		} else {
			try {
				console.log("JSON: " + options);
				console.log("NodeLevel: " + this.nodeLevel);

				var eventType = null;

				if(filterOptions == null) {
					eventType = EventType.ADD;
				} else {
					eventType = EventType.UPDATE;
				}

				if (this.isLeaf() && !(this.isArray || this.isMap)) {
					console.log("Set called at leaf level");

					localStorage.setItem(this.nodeLevel, options);

					var nodeLevel = this.nodeLevel;
					var attrKey = nodeLevel.substring(nodeLevel.lastIndexOf(".") + 1);

					var valueToSend = {};
					valueToSend[attrKey] = options;

					var data = {
						'component' : getComponent(nodeLevel),
						'namespace' : nodeLevel.substring(nodeLevel.indexOf(".") + 1, nodeLevel.lastIndexOf(".")),
						'method'	: "set",
						'eventType'	: eventType,
						'value' : valueToSend,
						'options' : filterOptions
					};

					console.log("Executing Subscription callback method");

					var mNodeLevel = nodeLevel.substring(0, nodeLevel.lastIndexOf("."));
					executeSubscriptionCallbackForParentChild(mNodeLevel, valueToSend, eventType);
					console.log("Notifying Systems");
					notifySystems(data);

				} else {
					if (this.isArray) {
						console.log("Set called for array types");
						setItemsOfArrayType(this.nodeLevel, options, filterOptions);

						var valueToSend = null;

						if(options instanceof Array) {
							// options is already passed as an array.
							// dont have to do anything
							valueToSend = options;
						} else {
							var itemsArray = [];
							itemsArray[0] = options;
							valueToSend = itemsArray;
						}

						var data = {
							'component' : getComponent(this.nodeLevel),
							'namespace' : getNameSpace(this.nodeLevel),
							'method'	: "set",
							'eventType'	: eventType,
							'value' : valueToSend,
							'options' : filterOptions
						};

						console.log("Executing Subscription callback method");
						executeSubscriptionCallbackForParentChild(this.nodeLevel, valueToSend, eventType);
						console.log("Notifying Systems");
						notifySystems(data);

					} else if (this.isMap) {
						console.log("Set called at parent level for map type");
						setItemsOfMapType(this.nodelLevel, options, filterOptions);

						var data = {
							'component' : getComponent(this.nodeLevel),
							'namespace' : getNameSpace(this.nodeLevel),
							'method'	: "set",
							'eventType'	: eventType,
							'value' : options,
							'options' : filterOptions
						};

						console.log("Executing Subscription callback method");
						executeSubscriptionCallbackForParentChild(this.nodeLevel, options, eventType);
						console.log("Notifying Systems");
						notifySystems(data);

					} else {
						console.log("Set called at parent level for non-array types");
						var itemsAddedToStorage = false;

						var JsonString = JSON.stringify(options);
						var attrObj = JSON.parse(JsonString);

						console.log("json parse" + attrObj);

						for (attrKey in attrObj) {
							attrKey = attrKey;
							attrVal = attrObj[attrKey];

							console.log("ATTRIBUTE KEY::  " + attrKey);
							console.log("ATTRIBUTE VALUE::  " + attrVal);

							if(this[attrKey].isArray) {
								var thisNodeLevel = this.nodeLevel + "." + attrKey;
								var itemsArray = setItemsOfArrayType(thisNodeLevel, attrVal, filterOptions);

								if(itemsArray != null) {
									itemsAddedToStorage = true;
								}
							} else {
								itemsAddedToStorage = setItemsOfLeafOrNonLeafType(this, attrKey, attrVal);
							}
						}

						if(itemsAddedToStorage) {
							var nodeLevel = this.nodeLevel;

							// Add a "." to the nodelevel if the set is on the
							// component level
							if(nodeLevel.indexOf(".") == -1) {
								nodeLevel = nodeLevel + ".";
							}

							var data = {
								'component' : getComponent(nodeLevel),
								'namespace' : getNameSpace(nodeLevel),
								'method'	: "set",
								'eventType'	: eventType,
								'value' : options,
								'options' : filterOptions
							};

							console.log("Executing Subscription callback method");
							executeSubscriptionCallbackForParentChild(this.nodeLevel, options, eventType);
							console.log("Notifying Systems");
							notifySystems(data);
						}
					}
				}

			} catch (err) {
				console.log("Exception: " + err.message);
				return new Promise(function(resolve, reject) {
					reject(Error("Error: " + err.message));
				});
			}

			return new Promise(function(resolve, reject) {
				resolve("success");
			});
		}

	}

	this.delete = function(options) {
		var filter = options || null;
		console.log("Delete Called for NodeLevel = " + this.nodeLevel + ", leaf = " + this.isLeaf());

		// DO NOT DELETE the items here.
		// Send the message to Span. The receiveMessage in the SpanMessageBroker
		// or mbbridge would
		// delete the items on receiving the notifications.

		/*
		 * if (filter) { // Delete called with options var deletedItem =
		 * handleDeleteWithOptions(this.nodeLevel, options, this.isLeaf(),
		 * this.isArray, this.isMap); console.log("Deleted Item ::: ",
		 * deletedItem); } else { // Delete called without options var
		 * deletedItem = handleDeleteWithNoOptions(this.nodeLevel,
		 * this.isLeaf(), this.isArray, this.isMap); console.log("Deleted Item
		 * ::: ", deletedItem); }
		 */

		var data = {
			'component' : getComponent(this.nodeLevel),
			'namespace' : getNameSpace(this.nodeLevel),
			'method'	: "clear",
			'eventType'	: EventType.DELETE,
			'options' : filter
		};

		console.log("Notifying Systems");
		notifySystems(data);

		return new Promise(function(resolve, reject) {
			resolve("Successfully removed");
		});
	}

};

/**
 * 
 * @param thisNodeLevel
 * @param options
 * @param filterOptions
 */
function handleDeleteWithOptions(thisNodeLevel, options, isLeaf, isArray, isMap) {
	console.log("Entering handleDeleteWithOptions for nodelevel " + thisNodeLevel);

	var attrVal = "";

	// Delete items at the leaf level and that are of non array types
	if (isLeaf && !(isArray || isMap)) {
		console.log("Delete items at the leaf level for non array types");
		var deletedItem = getValueForHandle(isLeaf, isArray, isMap, thisNodeLevel);

		attrVal = localStorage.removeItem(thisNodeLevel);

		return deletedItem;
	} else {
		if (isArray) {
			// Handle deletion of array types
			return handleDeleteOfArrayTypes(thisNodeLevel, options);
		} else if (isMap) {
			// Handle deletion of Map types
			return handleDeleteOfMapTypes(thisNodeLevel, options);
		} else {
			// Handle deletion at parent level
			// e.g. drive.navigation.delete({"pois":{"type": "parking"}});
			console.log("Delete items at the parent level");
			console.log("JSON: " + options);
			var JsonString = JSON.stringify(options);
			var attrObj = JSON.parse(JsonString);
			console.log("json parse" + attrObj);

			for (attrKey in attrObj) {
				attrKey = attrKey;
				attrVal = attrObj[attrKey];

				console.log("ATTRIBUTE KEY::  " + attrKey);
				console.log("ATTRIBUTE VALUE::  " + attrVal);

				var nodeLevel = thisNodeLevel + "." + attrKey;
				var currentObject = getCurrentObject(getComponent(nodeLevel), getNameSpace(nodeLevel));

				if(currentObject !=null && currentObject.isArray) {
					return handleDeleteOfArrayTypes(nodeLevel, attrVal);
				}
			}
		}
	}
}

/**
 * 
 * @param thisNodeLevel
 * @param options
 */
function handleDeleteOfArrayTypes(thisNodeLevel, options) {
	console.log("Entering handleDeleteOfArrayTypes for nodelevel " + thisNodeLevel);
	var itemsArrayStr = localStorage.getItem(thisNodeLevel);

	if(itemsArrayStr == null) {
		return;
	}

	var itemsArray = JSON.parse(itemsArrayStr);

	console.log("JSON: " + options);
	var JsonString = JSON.stringify(options);
	var attrObj = JSON.parse(JsonString);
	console.log("json parse" + attrObj);

	var attrKeys = new Array();
	var attrVals = new Array();
	var keycount = 0;

	for (attrKey in attrObj) {
		attrKeys[keycount] = attrKey;
		attrVals[keycount] = attrObj[attrKey];
		keycount++;
	}

	var arrayVal = new Array();
	var arrayIndex = 0;
	var deletedItems = [];
	var count = 0;

	for (var counter = 0; counter < itemsArray.length; counter++) {
		var found = true;
		for (var n = 0; n < keycount; n++) {
			var key = attrKeys[n];
			var val = attrVals[n];
			var arrItem = itemsArray[counter];

			if (arrItem[key] === val) {
				console.log("Item matches, deleting from the array");
				deletedItems[count] = itemsArray[counter];
				count++;

				delete itemsArray[counter];
			}
		}
	}

	itemsArray = itemsArray.filter(function(item) {
		return item !== null;
	});

	localStorage.setItem(thisNodeLevel, JSON.stringify(itemsArray));
	return deletedItems;
}

/**
 * 
 * @param thisNodeLevel
 * @param options
 */
function handleDeleteOfMapTypes(thisNodeLevel, options) {
	var itemsArrayStr = localStorage.getItem(thisNodeLevel);
	var itemsArray = JSON.parse(itemsArrayStr);

	var attrObj = JSON.parse(options);
	var resultObj = new Object();
	var deletedItem = null;

	for (var n = 0; n < attrObj.length; n++) {
		var val = attrObj[n];
		if (itemsArray[val] !== null) {
			deletedItem = itemsArray[val];
			delete itemsArray[val];
		}
	}

	return deletedItem;
}

/**
 * 
 * @param thisNodeLevel
 * @param options
 * @param filterOptions
 */
function handleDeleteWithNoOptions(thisNodeLevel, isLeaf, isArray, isMap) {
	var attrVal = "";
	// console.log("Deleted item :: " + getValueForHandle(isLeaf, isArray, isMap, thisNodeLevel));
	var deletedItem = getValueForHandle(isLeaf, isArray, isMap, thisNodeLevel);

	if (isLeaf) {
		// Delete called at leaf level
		console.log("Delete called at leaf level with no options");
		attrVal = localStorage.removeItem(thisNodeLevel);
	} else {
		// Delete called at parent level
		console.log("Delete called at parent level with no options");

		var keys = Object.keys(localStorage);
		var vals = new Array();

		for (var j = 0; j < keys.length; j++) {
			if (isNaN(parseInt(keys[j])) && keys[j].indexOf(thisNodeLevel) != -1) {
				localStorage.removeItem(keys[j]);
			}
		}
	}

	return deletedItem;
}

var Drive = function() {
	this.policy = null;
};

var Storage = function() {

};

var drive = new Drive();
var storage = new Storage();

function DecError(pErrorCode, pErrorMsg) {
	this.errorCode = pErrorCode;
	this.errorMessage = pErrorMsg;

	this.getErrorCode = function() {
		return this.errorCode;
	}

	this.getErrorMessage = function() {
		return this.errorMessage;
	}
}

function DecSuccess(pSuccessCode, pSuccessMsg) {
	this.successCode = pSuccessCode;
	this.successMessage = pSuccessMsg;

	this.getSuccessCode = function() {
		return this.successCode;
	}

	this.getSuccessMessage = function() {
		return this.successMessage;
	}
}

function contains(obj) {
	var i = componentsArray.length;
	while (i--) {
		if (componentsArray[i] === obj) {
			return true;
		}
	}
	return false;
}

function checkForComponentsValidity(components) {
	for (var index = 0; index < components.length; index++) {
		var component = components[index];

		if(!contains(component)) {
			return component;
		} 
	}

	return null;
}

/**
 * init method to accept arguments of below types
 * 
 * init(callback, components, applicationId) 
 * init(applicationId, callback, components)
 * 
 */
init = function(arg1, arg2, arg3) {
	console.log("Entering init method");

	if(arg2 instanceof Array) {
		initialize(arg1, arg2, arg3);
	} else {
		initialize(arg2, arg3, arg1);
	}
};

/**
 * 
 * @param callbackFn
 * @param components
 * @param applicationId
 */
function initialize(callbackFn, components, applicationId) {
	console.log("Components passed ::: ", components);

	if(applicationId == null) {
		var msg = "Cannot Initialize the component as Application Id is not provided.";
		console.log(msg);
		throw msg;
	}

	var inValidComponent = checkForComponentsValidity(components);

	if(inValidComponent != null) {
		console.log("Cannot Initialize... " + inValidComponent + " is not a valid component");
		var decError = new DecError(DecErrorCodes.component_not_found.errorcode, DecErrorCodes.component_not_found.errormessage);

		if(callbackFn != null) {
			callbackFn(decError);
		}

		return;
	}

	drive.callback = callbackFn;

	for (var index = 0; index < components.length; index++) {
		var component = components[index];
		console.log("Initializing " + component);

		drive[component] = new DecCommon();
		drive[component].setLeafStatus(false);
		drive[component].setNodeLevel(components[index]);
		drive[component].setAvailableStatus(Availability.available);

		if(applicationId != null) {
			drive[component].setAppId(applicationId);
		}

		var jsonComp = eval("(" + component + ")");
		initializeComponents(drive[component], jsonComp);

	}

	if (connectionType == "span") {
		console.log("Connection Type is Span. Initializing Web Socket");
		// start the span message
		RunSpanMessageBroker();
	} else {
		console.log("Connection Type is MB bridge");

		var decSuccess = new DecSuccess("0", "Successfully Initialized the components");

		if(callbackFn != null) {
			callbackFn(decSuccess);
		}
	}

};

function showLocalStorage() {
	var key = "";
	var pairs = "<table><tr><th>Name</th><th>Value</th></tr>";
	var i = 0;
	console.log("Local Storage length is" + localStorage.length);
	for (i = 0; i <= localStorage.length - 1; i++) {
		key = localStorage.key(i);
		pairs += "<tr><td>" + key + "</td><td>" + localStorage.getItem(key)
		+ "</td></tr>";
	}
	pairs += "</table>";
	document.write(pairs);
}

/**
 * Operation enum type
 */
var Operation = {
	READ : "read",
	WRITE : "write",
	PRIVATE : "private",
	POLICY : "policy"
};

/**
 * This method is to check the permissions of the client app id for further
 * processing
 * 
 * @param clientAppId
 * @param component
 * @param namespace
 * @param operation
 * @returns {Boolean}
 */
function checkPermissions(clientAppId, component, namespace, operation) {
	console.log(clientAppId + component + namespace + operation);
	var key = clientAppId + namespace;

	localStorage.setItem(key, operation);
	var keyId = localStorage.getItem(key);
	console.log("keyid from localstorage" + keyId);

	// TODO : remove it later as it is hardcoded
	// var keyId = "abcPosition.latitude";
	if (keyId != null) {
		return true;
	}
	// always to make the permission true
	return true;

}

/**
 * This method is to create the hashcode to be used to append in the handle
 * 
 * @param str
 * @returns {Number}
 */
function getHashCode(str) {
	var hash = 0;
	if (str.length == 0)
		return hash;
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

/**
 * This method is to create the handle for each subscription object and store it
 * in local storage
 * 
 * @param clientAppId
 * @param component
 * @param namespace
 * @param subscriptionCallback
 * @returns
 */
function createHandle(clientAppId, component, namespace, subscriptionCallback) {
	var hashToBeGenerated = clientAppId + namespace;
	var callbackIdentyHashCode = hashCode(hashToBeGenerated);
	console.log("callbackIdentyHashCode ::::::::::::: "
			+ callbackIdentyHashCode);
	var handle = clientAppId + component + namespace + callbackIdentyHashCode;
	console.log("handle ::::::::::::: " + handle);
	return handle;
}

/**
 * This method is to add local subscription object to local storage
 * 
 * @param clientAppId
 * @param component
 * @param namespace
 * @param handle
 * @param subscription
 */
function addLocalSubscriptions(handle, callbackFn, pOptions) {
	console.log("inside the addLocalSubscriptions method ::::::::::::::::::::::::::::::::::::::::::::");
	var filters = pOptions || null;
	
	var subscription = {};
	subscription.callback = callbackFn;
	subscription.options = filters;
	
	var subscriptionArray = storage[handle];

	if (subscriptionArray == null || subscriptionArray.length == 0) {
		console.log("SubscriptionArray is empty. Adding an entry");
		subscriptionArray = [];
		subscriptionArray[0] = subscription;
	} else {
		subscriptionArray[subscriptionArray.length] = subscription;
	}
	
	var beforeUniq = subscriptionArray.length;
	subscriptionArray = uniqBy(subscriptionArray, JSON.stringify);
	var afterUniq = subscriptionArray.length;
	
	storage[handle] = subscriptionArray;

	// If beforeUniq == 1 then this is the first subscription item, return subscription
	// If beforeUniq != afterUniq then this is a duplicate subscription, so return null
	if(beforeUniq != 1 && beforeUniq != afterUniq) {
		return null;
	}
	
	return subscription;
}

/**
 * This method is to check the subscription object from local storage using
 * handle
 * 
 * @param handle
 * @returns {Boolean}
 */
function checkLocalSubscriptions(handle, callbackFn, options) {
	console.log("Entering checkLocalSubscriptions for handle ::: " + handle);
	
	var subscriptionArray = storage[handle];
	
	if (subscriptionArray == null || subscriptionArray.length == 0) {
		// empty array. Return false to add subscriptions
		console.log("Empty array. Exiting checkLocalSubscriptions");
		return false;
	} 
	
	// If its an anonymous callback function, return false
	if(callbackFn.name == "") {
		console.log("Anonymous callback function. Exiting checkLocalSubscriptions");
		return false;
	}
	
	// Else part: Subscriptions already present. Check if the callback function matches
	for (var counter = 0; counter < subscriptionArray.length; counter++) {
		var subscriptionItem = subscriptionArray[counter];
		var subCallback = subscriptionItem.callback;
		var fn = eval('(' + subCallback + ')');
		
		if(fn.name == callbackFn.name) {
			// callback function matches. So already subscribed.
			return true;
		} 

		// If its an anonymous callback function, return false
		if(callbackFn.name == "") {
			return false;
		}

		// Else part: Subscriptions already present. Check if the callback
		// function matches
		for (var counter = 0; counter < subscriptionArray.length; counter++) {
			var subscriptionItem = subscriptionArray[counter];
			var subCallback = subscriptionItem.callback;
			var fn = eval('(' + subCallback + ')');

			if(fn.name == callbackFn.name) {
				// callback function matches. So already subscribed.
				return true;
			} 
		}
	}
	
	console.log("Exiting checkLocalSubscriptions");
	return false;
}

/**
 * 
 * @param handle
 * @param value
 * @returns {Array}
 */
function getMatchingSubscriptions(handle, value) {
	console.log("Inside getMatchingSubscriptions");
	
	var subscriptionArray = storage[handle];
	
	if (subscriptionArray == null || subscriptionArray.length == 0) {
		// empty array. Return null
		return null;
	}
	
	var subscriptions = [];
	var subCount = 0;
	
	for (var counter = 0; counter < subscriptionArray.length; counter++) {
		var subscriptionItem = subscriptionArray[counter];
		var subOptions = subscriptionItem.options;
		
		if(subOptions == null) {
			console.log("Options is null, adding subscription to the list");
			subscriptionItem.value = value;
			subscriptions[subCount] = subscriptionItem;
			subCount++;
		} else {
			// options present. Check if it matches with the value passed.
			for(key in subOptions);
			
			var subOptionsValue = subOptions[key];
			console.log("Options Key ::: " + key);
			console.log("Options Value ::: " + subOptionsValue);
			
			var matchFound = false;
			
			if(value instanceof Array) {
				console.log("value is of Array type");
				var matchingValues = [];
				var matchingValueCount = 0;
				
				for (var index = 0; index < value.length; index++) {
					var arrItem = value[index];
					
					for(attrKey in arrItem) {
						if(attrKey == key && arrItem[attrKey] == subOptionsValue) {
							// match found
							matchFound = true;
							
							matchingValues[matchingValueCount] = arrItem;
							matchingValueCount++;
							break;
						}
					}
				}
				
				if(matchFound) {
					subscriptionItem.value = matchingValues;
					subscriptions[subCount] = subscriptionItem;
					subCount++;
					console.log("Match found, Adding subscription to the list ");
				}
			} else {
				for(attrKey in value) {
					//console.log("Item Key ::: " + attrKey);
					//console.log("Item Value ::: " + value[attrKey]);
					
					if(attrKey == key && value[attrKey] == subOptionsValue) {
						// match found
						subscriptionItem.value = value;
						subscriptions[subCount] = subscriptionItem;
						subCount++;
						console.log("Match found, Adding subscription to the list... ");
						
						break;
					}
				}
			}
		}
	}
	
	console.log("Exiting getMatchingSubscriptions. Subcriptions List size " + subscriptions.length);
	return subscriptions;
}

/**
 * This function is used to log the success result
 * 
 * @param attrVal
 */
function logResult(attrVal) {
	if (attrVal instanceof Array) {
		var arrayValJson = JSON.parse(JSON.stringify(attrVal));
		var item = JSON.parse(arrayValJson[0]);
		// var status = item["enabled"]; // for polices type
		console.log("GET Array Value: " + item);
	}

	console.log("Success Result:::" + attrVal);
}

/**
 * This function is used to log the error result
 */
function logError(error) {
	console.log("Error:::" + error);
}

/**
 * Notify System based on the connection type
 * 
 * @param data
 */
function notifySystems(data) {
	if (connectionType == "span") {
		console.log("Connection Type is Span. Notify Span");
		notifySpan(data);
	} else {
		console.log("Connection Type is MB bridge. Notifying DEC Core about changes");
		notifyDECCore(data);
	}
}

/**
 * This function will be invoked from set request to notify span about the value
 * changes
 * 
 * @param data
 */
function notifySpan(data) {
	console.log("Notifying Span about change in property value");
	var dataHandle = createDataHandle(data['component'], data['namespace']);

	var spanMethod = data['method'];
	var senderAppId = getApplicationId(data['component']);
	console.log("senderAppId ::: " + senderAppId);

	if(spanMethod == "subscribe") {
		dataHandle = createDataHandleSubscription(data['component'], data['namespace'],senderAppId);
		console.log("notifySpan Subscription Handle" + dataHandle);
	}

	console.log("datahandle ::: " + dataHandle);

	var dataToSend = {
		"component" : data['component'],
		"nameSpace" : data['namespace'],
		"handle" : dataHandle,
		"method" : data['method'],
		"eventType"	: data['eventType'],
		"value" : data['value'],
		"options" : data['options']
	};
	var jsonStr = JSON.stringify(dataToSend);
	encodedData = encodeURI(jsonStr);

	var setRequest = {
		"dec.SetRequest" : {
			"sender" : {
				"sender" : senderAppId,
				"receivers" : [ "DECCore" ],
				"data" : encodedData
			}
		}
	}

	console.log(JSON.stringify(setRequest));
	console.log("Sending msg is ::: " + JSON.stringify(setRequest));
	ws.send(JSON.stringify(setRequest));
}

/**
 * Returns the application id.
 * 
 * @param handle
 * @returns
 */
function getApplicationId(component) {
	try {
		if(drive[component] != null) {
			return drive[component].getAppId();
		}
	} catch (e) {
	}

	// returns the default on error
	return "DECJSSDK";
}

/**
 * This will create subscription handle
 * 
 * @param subsHandle
 * @returns
 */
function createSubscriptionHandle(handle) {
	var subscriptionHandle = getHashCode(handle) + handle;
	return subscriptionHandle;
}

/**
 * This will create data handle
 * 
 * @param component
 * @param namespace
 * @returns {Number}
 */
function createDataHandle(component, namespace) {
	var dataHandle = component + "." + namespace;
	return getHashCode(dataHandle);
}

/**
 * This will create data handle
 * 
 * @param component
 * @param namespace
 * @returns {Number}
 */
function createDataHandleSubscription(component, namespace,appid) {
	var dataHandle = component + "." + namespace + "." + appid;
	return getHashCode(dataHandle);
}


/**
 * 
 * @param parent
 * @param component
 */
function initializeComponents(parent, component) {
	// console.log("Initializing the Components");

	for ( var attrKey in component) {
		parent[attrKey] = new DecCommon();

		var nodeLevel = parent.getNodeLevel();
		parent[attrKey].setNodeLevel("" + nodeLevel + "." + attrKey);

		var myNodeLevel = parent[attrKey].getNodeLevel();
		// console.log("Component " + myNodeLevel);

		if (component[attrKey].type === "java.util.Map") {
			parent[attrKey].isMap = true;
			// console.log("Setting isMap to true");
		} else if (component[attrKey].type === "java.util.List") {
			parent[attrKey].isArray = true;
			// console.log("Setting isArray to true");
		}

		if (component[attrKey].properties != null) {
			parent[attrKey].setLeafStatus(false);
			initializeComponents(parent[attrKey], component[attrKey].properties);
		} else {
			parent[attrKey].setLeafStatus(true);
		}
	}
}

/**
 * This function will notify DEC about changes
 * 
 * @param data
 */
function notifyDECCore(data) {
	console.log("Notifying DEC Core::::" + data);
	var sender = getApplicationId(data['component']);
	console.log("senderAppId ::: " + sender);

	var receivers = [ "DECCore" ];
	var dataHandle = createDataHandle(data['component'], data['namespace']);

	var spanMethod = data['method'];

	if(spanMethod == "subscribe") {
		dataHandle = createDataHandleSubscription(data['component'], data['namespace'],sender);
		console.log("NotifyDECCore Subscription Handle" + dataHandle);
	}

	console.log("datahandle ::: " + dataHandle);

	var dataToSend = {
		"component" : data['component'],
		"nameSpace" : data['namespace'],
		"handle" : dataHandle,
		"method" : data['method'],
		"eventType"	: data['eventType'],
		"value" : data['value'],
		"options" : data['options']
	};

	var jsonStr = JSON.stringify(dataToSend);
	encodedData = encodeURI(jsonStr);
	console.log("encodedData::::" + encodedData);
	sendMessage(sender, receivers, encodedData);

}

/*
 * The method can be used to display local storage for all components
 */
function showLocalStorageForData() {
	var key = "";
	var pairs = "<H3>Data Stored in local Storage for components</H3>\n<table><tr><th>Name</th><td><td><td><td></td></td></td></td><th>Value</th></tr>";
	var i = 0;
	console.log("Local Storage length is" + localStorage.length);
	for (i = 0; i <= localStorage.length - 1; i++) {
		key = localStorage.key(i);
		var regex = /\d/g;// Global check for numbers
		if (!regex.test(key)) {
			pairs += "<tr><td>" + key
			+ "</td><td><td><td><td></td></td></td></td><td>"
			+ localStorage.getItem(key) + "</td></tr>";
		}
	}
	pairs += "</table>";
	document.write(pairs);
}
/*
 * The method can be used to display local storage for only subscriptions
 */
function showLocalStorageForSubscriptions() {
	var key = "";
	var pairs = "<H3>Subscription Details Stored in local Storage for components</H3>\n<table><tr><th>Name</th><td><td><td><td></td></td></td></td><th>Value</th></tr>";
	var i = 0;
	console.log("Local Storage length is" + localStorage.length);
	for (i = 0; i <= localStorage.length - 1; i++) {
		key = localStorage.key(i);
		var regex = /\d/g;// Global check for numbers
		if (regex.test(key)) {
			pairs += "<tr><td>" + key
			+ "</td><td><td><td><td></td></td></td></td><td>"
			+ localStorage.getItem(key) + "</td></tr>";
		}
	}
	pairs += "</table>";
	document.write(pairs);
}

/**
 * 
 * @param thisNodeLevel
 * @param options
 * @param filterOptions
 * @returns
 */
function setItemsOfMapType(thisNodeLevel, options, filterOptions) {

	var attrObj = JSON.parse(options);
	var attrKeys = new Array();
	var attrVals = new Array();
	var keycount = 0;

	for (attrKey in attrObj) {
		attrKeys[keycount] = attrKey;
		attrVals[keycount] = attrObj[attrKey];
		keycount++;
	}
	var itemsArrayStr = localStorage.getItem(this.nodeLevel);

	var itemsArray = JSON.parse(itemsArrayStr);

	for (var keyCount = 0; keyCount < attrKeys.length; keyCount++) {
		var foundKey = false;
		var key = attrKeys[keyCount];
		var val = attrVals[keyCount];
		itemsArray[key] = val;
	}

	localStorage.setItem(this.nodeLevel, JSON.stringify(itemsArray));
	return itemsArray;
}

/**
 * 
 * @param thisNodeLevel
 * @param options
 * @param filterOptions
 * @returns {Array}
 */
function setItemsOfArrayType(thisNodeLevel, options, filterOptions) {
	console.log("Entering method setItemsOfArrayType");

	var found = false;
	var itemAddedToStorage = false;

	var JsonString = JSON.stringify(options);
	var attrObj = JSON.parse(JsonString);

	console.log("json parse" + attrObj);

	var itemsArrayStr = localStorage.getItem(thisNodeLevel);
	var itemsArray = JSON.parse(itemsArrayStr);

	if (itemsArray === null || itemsArray.length === 0) {
		console.log("Items Array is empty. Initialising and setting the values");
		itemsArray = [];

		if (options instanceof Array) {
			var currentLength = itemsArray.length;

			for (var item = 0; item < options.length; item++) {
				var arrItem = options[item];
				itemsArray[currentLength] = arrItem;
				currentLength++;
			}
		} else {
			itemsArray[0] = options;
		}

		itemsArray = uniqBy(itemsArray, JSON.stringify);
		localStorage.setItem(thisNodeLevel, JSON.stringify(itemsArray));
		itemAddedToStorage = true;
		console.log("Array length " + itemsArray.length);
	} else if (filterOptions == null) {
		console.log("No Filter options. Adding the item to array");

		if (options instanceof Array) {
			var currentLength = itemsArray.length;

			for (var item = 0; item < options.length; item++) {
				var arrItem = options[item];
				itemsArray[currentLength] = arrItem;
				currentLength++;
			}
		} else {
			itemsArray[itemsArray.length] = options;
		}

		itemsArray = uniqBy(itemsArray, JSON.stringify);
		localStorage.setItem(thisNodeLevel, JSON.stringify(itemsArray));
		itemAddedToStorage = true;
		console.log("Array length " + itemsArray.length);
	} else {
		console.log("Filter options present. Updating the Array");
		var filterString = JSON.stringify(filterOptions);
		var filterObj = JSON.parse(filterString);

		var filterKeys = new Array();
		var filterVals = new Array();
		var count = 0;

		for (filterKey in filterObj) {
			filterKeys[count] = filterKey;
			filterVals[count] = filterObj[filterKey];
			count++;
		}

		var searchKey = filterKeys[0];
		var searchVal = filterVals[0];

		for (var counter = 0; counter < itemsArray.length; counter++) {
			var arrItem = itemsArray[counter];

			if (arrItem[searchKey] === searchVal) {
				if(attrObj instanceof Array) {
					for (var arrIndex = 0; arrIndex < attrObj.length; arrIndex++) {
						var arrIndexItem = attrObj[arrIndex];

						for (attrKey in arrIndexItem) {
							var setKey = attrKey;
							var setVal = arrIndexItem[attrKey];

							arrItem[setKey] = setVal;
							itemsArray[counter] = arrItem;
							found = true;
						}
					}
				} else {
					for (attrKey in attrObj) {
						var setKey = attrKey;
						var setVal = attrObj[attrKey];

						arrItem[setKey] = setVal;
						itemsArray[counter] = arrItem;
						found = true;
					}
				}
			}
		}

		if (found) {
			itemsArray = uniqBy(itemsArray, JSON.stringify);
			localStorage.setItem(thisNodeLevel, JSON.stringify(itemsArray));
			itemAddedToStorage = true;
		}
	}

	return itemsArray;
}

/**
 * Remove Duplicates from array
 * 
 * @param arr
 * @param key
 */
function uniqBy(arr, key) {
	var items = {};
	return arr.filter(function(item) {
		var k = key(item);
		return items.hasOwnProperty(k) ? false : (items[k] = true);
	})
}

/**
 * 
 * @param thisNodeLevel
 * @param attrKey
 * @param attrVal
 * @returns {Boolean}
 */
function setItemsOfLeafOrNonLeafType(object, attrKey, attrVal) {
	console.log("Entering method setItemsOfLeafOrNonLeafType");

	var itemAddedToStorage = false;

	if(object[attrKey].isArray) {
		var thisNodeLevel = object.getNodeLevel() + "." + attrKey;
		var itemsArray = setItemsOfArrayType(thisNodeLevel, attrVal, null);
		itemAddedToStorage = true;
	} else if(object[attrKey].isLeaf()) {
		localStorage.setItem(object.getNodeLevel() + "." + attrKey, attrVal);
		itemAddedToStorage = true;
	} else {
		for (key in attrVal) {
			newKey = key;
			newVal = attrVal[key];

			console.log("ATTRIBUTE KEY::  " + newKey);
			console.log("ATTRIBUTE VALUE::  " + newVal);

			var newNodeLevel = object[attrKey];
			itemAddedToStorage = setItemsOfLeafOrNonLeafType(newNodeLevel, newKey, newVal);
		}
	}

	return itemAddedToStorage;
}

/**
 * 
 * @param nodeLevel
 * @param currentElement
 * @param attrObj
 * @param attrVal
 */
function getValueMatchingNodeLevel(nodeLevel, currentElement, attrObj, attrVal) {
	var parentNodeLevel = currentElement.substring(0, currentElement.lastIndexOf("."));

	if(parentNodeLevel == nodeLevel) {
		// nodelevel matches
		// get the key in the attrObj
		for (key in attrObj);

		attrVal[key] = attrObj[key];
		return attrVal;
	}

	var parentkey = parentNodeLevel.substring(parentNodeLevel.lastIndexOf(".") + 1);

	if(attrVal[parentkey] == null) {
		var newAttrVal = {};
		newAttrVal[parentkey] = attrObj;
		return getValueMatchingNodeLevel(nodeLevel, parentNodeLevel, newAttrVal, attrVal);
	} else {
		// element already present

		// get the key in the attrObj
		for (key in attrObj);

		attrVal[parentkey][key] = attrObj[key];
		return attrVal;
	}
}

/**
 * 
 * @param handle
 * @returns
 */
function getValueForHandle(isLeaf, isArray, isMap, nodeLevel) {
	console.log("Entering getValueForHandle for nodelevel " + nodeLevel + " And isLeaf " + isLeaf);

	if (isLeaf || isArray) {
		var attrVal = localStorage.getItem(nodeLevel);

		console.log("Exiting getValueForHandle for nodelevel " + nodeLevel);
		return JSON.parse(attrVal);
	} else {
		var keys = Object.keys(localStorage);
		var vals = new Array();
		var attrVal = {};
		var foundCount = 0;

		for (var j = 0; j < keys.length; j++) {
			if (isNaN(parseInt(keys[j])) && keys[j].indexOf(nodeLevel) != -1) {
				var attrObj = {};
				var attrKey = keys[j].substring(keys[j].lastIndexOf(".") + 1);

				var currentObject = getCurrentObject(getComponent(keys[j]), getNameSpace(keys[j]));

				if(currentObject.isArray) {
					attrObj[attrKey] = JSON.parse(localStorage.getItem(keys[j]));
				} else {
					attrObj[attrKey] = localStorage.getItem(keys[j]);
				}

				attrVal = getValueMatchingNodeLevel(nodeLevel, keys[j], attrObj, attrVal);

				foundCount++;
			}
		}

		console.log("Exiting getValueForHandle for nodelevel " + nodeLevel);

		if(foundCount == 0) {
			return null;
		}

		return attrVal;
	}
}

/**
 * 
 * @param myHandle
 * @returns
 */
function getComponent(myHandle) {
	if(myHandle.indexOf(".") != -1) {
		return myHandle.substring(0, myHandle.indexOf("."));
	} else {
		return myHandle;
	}
}

/**
 * 
 * @param myHandle
 * @returns
 */
function getNameSpace(myHandle) {
	if(myHandle.indexOf(".") != -1) {
		return myHandle.substring(myHandle.indexOf(".") + 1);
	} else {
		return "";
	}
}

/*
 * The method will be called to execute subscription call back after
 * setting the componet values
 */
function executeSubscriptionCallbackAfterSet(handle, value, eventType) {
	// execute subscription call back after setting the values.
	var subscriptionHandle = createSubscriptionHandle(handle);
	console.log("subscriptionHandle ::::::::::::::::::::::: "+subscriptionHandle);
	var subscriptionArray = getMatchingSubscriptions(subscriptionHandle, value);
	
	if (subscriptionArray == null || subscriptionArray.length == 0) {
		console.log("Component is not subscribed yet. So not sending subscription callback");
	} else {
		for (var counter = 0; counter < subscriptionArray.length; counter++) {
			var subscriptionItem = subscriptionArray[counter];
			console.log("subscriptionItem::::::::::::::::::: ", subscriptionItem);
			var subCallback = subscriptionItem.callback;
			//console.log("subCallback::::::::::::::::::: "+ subCallback);
			var subValue = subscriptionItem.value;
			console.log("subValue::::::::::::::::::: ", subValue);
			console.log("eventType ::::::::::::::::::: ", eventType);
			console.log("Calling subscription callback function");
			subCallback(subValue, eventType);
		}
	}

}

/**
 * The function which execute subscription call back for parent and all leaf nodes
 * 
 * @param node
 * @param options
 */
function executeSubscriptionCallbackForParentChild(node, options, eventType) {
	console.log("Executing executeSubscriptionCallbackForParentChild for node::::" + node);
	var childNodes = node.split(".");
	var nodeValue = "";
	var executeNode = "";

	var newValue = options;

	for (var i = childNodes.length - 1; i >= 0; i--) {
		console.log("Printing Node Value:::" + childNodes[i]);
		if (i == childNodes.length - 1) {// navigation.destination.display
			executeSubscriptionCallbackAfterSet(node, options, eventType);
			executeNode = node;
		} else {
			var attrKey = executeNode.substring(executeNode.lastIndexOf(".")+1);
			var valueToSend = {};
			valueToSend[attrKey] = newValue;
			// nodeValue = executeNode.substring(executeNode.lastIndexOf(".")+1)
			// + ":" + JSON.stringify(options);
			executeNode = executeNode.substring(0, executeNode.lastIndexOf("."));
			console.log("Execute Node :::::::" + executeNode);
			console.log("NODE value to be sent" + JSON.stringify(valueToSend));
			executeSubscriptionCallbackAfterSet(executeNode, valueToSend, eventType); 
			newValue = valueToSend;
		}
	}
}

/**
 * 
 * @param component
 * @param namespace
 * @returns
 */
function getCurrentObject(component, namespace) {
	var currentObject = drive[component];

	if(currentObject == null) {
		return null;
	}

	if(namespace == null || namespace.length == 0) {
		// namespace is empty
		return currentObject;
	}

	if(namespace.indexOf(".") == -1) {
		return currentObject[namespace];
	}

	var childObjects = namespace.split(".");

	for (var counter = 0; counter < childObjects.length; counter++) {
		var arrItem = childObjects[counter];
		currentObject = currentObject[arrItem];
	}

	return currentObject;
}

/**
 * * SPAN Message Broker Implementation  ** 
 */

/**
 * Get the properties from the properties file to open the websocket
 */
var properties = getProperties();

/**
 * Method used to run span message broker
 */
function RunSpanMessageBroker() {
	if ("WebSocket" in window) {
		console.log("WebSocket is supported by your Browser!");
		// Let us open a web socket
		var uri = "ws://"+properties['host']+":"+properties['port'];
		
		ws = new WebSocket(uri);
		ws.onopen = function() {
			// Web Socket is connected, send data using send()
			console.log("Web Socket is connected now");

			var decSuccess = new DecSuccess("0", "Successfully intialized the components and connected to span server");
			var callbackFn = drive.callback;

			if(callbackFn != null) {
				callbackFn(decSuccess);
			}


			
			 /** var letRequest = {"dec.LetRequest": { "request": {
			 * "data":"%7B%22component%22%3A%22sa%22%2C%22eventType%22%3A%22delete%22%2C%22method%22%3A%22clear%22%2C%22nameSpace%22%3A%22requests%22%2C%22options%22%3Anull%2C%22handle%22%3A0%7D",
			 * "receivers": [ "ATT%20Drive%20HUB" ], "sender":"DECCore" }
			 * }};
			 * 
			 * console.log(JSON.stringify(letRequest)); console.log("Sending
			 * msg is ::: " + JSON.stringify(letRequest));
			 * ws.send(JSON.stringify(letRequest)); console.log("Message is
			 * sent...");
*/			 
		};
		ws.onmessage = function(evt) {
			console.log("Received request from Span Server in onmessage method()");

			var received_msg = evt.data;
			console.log("Received msg from span is ::: " + received_msg);

			console.log("index of letrequest is::"+ received_msg.indexOf("dec.LetRequest"));

			if (received_msg.indexOf("dec.LetRequest") != -1) {
				var json = JSON.parse(received_msg);
				var req = json['dec.LetRequest'];

				decodedData = decodeURIComponent(req.request.data);
				console.log("DecodedData::::" + decodedData);

				var jsonData = JSON.parse(decodedData);
				var component = jsonData.component;
				var namespace = jsonData.nameSpace;
				var value = jsonData.value;
				var options = jsonData.options;
				var method = jsonData.method;
				var eventType = jsonData.eventType;

				console.log("component is:::: " + component);
				console.log("namespace is:::: " + namespace);
				console.log("value is:::: " + value);
				console.log("options is:::: " + options);
				console.log("method is:::: " + method);
				console.log("eventType is:::: " + eventType);

				var nodeLevel = "";

				if(namespace == null || namespace.length == 0) {
					nodeLevel = component;
				} else {
					nodeLevel = component + "." + namespace;
				}

				var currentObject = getCurrentObject(component, namespace);

				if(currentObject != null) {
					if(method != null && method === "clear") {
						var filter = options || null;
						console.log("Received Delete method call for NodeLevel = " + nodeLevel + ", leaf = " + currentObject.isLeaf());

						var deletedItems = null;

						if (filter) {
							// Delete called with options
							deletedItems = handleDeleteWithOptions(nodeLevel, options, currentObject.isLeaf(), currentObject.isArray, currentObject.isMap);
							console.log("Deleted Item ::: ", deletedItems);
						} else {
							// Delete called without options
							deletedItems = handleDeleteWithNoOptions(nodeLevel, currentObject.isLeaf(), currentObject.isArray, currentObject.isMap);
							console.log("Deleted Item ::: ", deletedItems);
						}

						if(value == null) {
							value = deletedItems;
						}
					} else {
						if (currentObject.isArray && value != null) {
							console.log("Received component is of Array Type");
							setItemsOfArrayType(nodeLevel, value, options);

						} else {
							console.log("Received component is of non Array Type");
							for (attrKey in value) {
								attrVal = value[attrKey];

								console.log("ATTRIBUTE KEY::  " + attrKey);
								console.log("ATTRIBUTE VALUE::  " + attrVal);

								var newNameSpace = "";

								if(namespace == null || namespace == "") {
									newNameSpace = attrKey;
								} else {
									newNameSpace = namespace + "." + attrKey;
								}

								var newCurrentObject = getCurrentObject(component, newNameSpace);

								if(newCurrentObject != null) {
									if(newCurrentObject.isArray) {
										var thisNodeLevel = nodeLevel + "." + attrKey;
										setItemsOfArrayType(thisNodeLevel, attrVal, options);
									} else {
										setItemsOfLeafOrNonLeafType(currentObject, attrKey, attrVal);
									}
								} else {
									console.log("Unable to get the current object for " + component + "." + newNameSpace);
								}
							}
						}
					}
				}

				executeSubscriptionCallbackForParentChild(nodeLevel, value, eventType);


			} else {
				console.log("Received Set dec request..ignoring...");
			}
		};
		ws.onclose = function() {
			// websocket is closed.
			console.log("Connection is closed...");
		};
		ws.onerror = function(err) {
			console.log("websocket connection to host " + properties['host'] + " port " + properties['port'] + " failed");
			console.log("error is::" + err);

			var decError = new DecError(DecErrorCodes.span_not_found.errorcode, DecErrorCodes.span_not_found.errormessage);
			var callbackFn = drive.callback;

			if(callbackFn != null) {
				var fn = eval('(' + callbackFn + ')');
				fn.call(null, decError);
			}
		};
	} else {
		// The browser doesn't support WebSocket
		console.log("WebSocket NOT supported by your Browser!");
	}
}

/**  
 * MB Bridge Implementation
 */
if (connectionType == "mbbridge") {
    mb.setReceiveCallback("receiveMessage");
}

/**
 * This method is to call send Message which is present in Message Broker SDK 
 * to DEC Core with sender, receivers and data part
 * 
 * @param sender
 * @param receivers 
 * @param data
 */
function sendMessage(sender, receivers, data) {
	var receiversStr = JSON.stringify(receivers);

	// "mb" will be received from webview
	mb.sendMessage(sender, receiversStr, data);
}

/**
 * This method will be invoked whenever msg is received from span server
 * 
 * @param sender
 * @param receivers 
 * @param data
 */

function receiveMessage(sender, receivers, data) {
	decodedData = decodeURIComponent(data);
	//decodedData = window.atob(data);
	console.log("DecodedData::::" + decodedData);

	var jsonData = JSON.parse(decodedData);
	var component = jsonData.component;
	var namespace = jsonData.nameSpace;
	var value = jsonData.value;
	var options = jsonData.options;
	var method = jsonData.method;
	var eventType = jsonData.eventType;

	console.log("component is::::" + component);
	console.log("namespace is::::" + namespace);
	console.log("value is:::: " + value);
	console.log("options is:::: " + options);
	console.log("method is:::: " + method);
	console.log("eventType is:::: " + eventType);

	var nodeLevel = "";

	if(namespace == null || namespace.length == 0) {
		nodeLevel = component;
	} else {
		nodeLevel = component + "." + namespace;
	}

	var currentObject = getCurrentObject(component, namespace);

	if(currentObject != null) {
		if(method != null && method === "clear") {
			var filter = options || null;
			console.log("Received Delete method call for NodeLevel = " + nodeLevel + ", leaf = " + currentObject.isLeaf());

			var deletedItems = null;

			if (filter) {
				// Delete called with options
				deletedItems = handleDeleteWithOptions(nodeLevel, options, currentObject.isLeaf(), currentObject.isArray, currentObject.isMap);
				console.log("Deleted Item ::: ", deletedItems);
			} else {
				// Delete called without options
				deletedItems = handleDeleteWithNoOptions(nodeLevel, currentObject.isLeaf(), currentObject.isArray, currentObject.isMap);
				console.log("Deleted Item ::: ", deletedItems);
			}

			if(value == null) {
				value = deletedItems;
			}
		} else {
			if (currentObject.isArray && value != null) {
				console.log("Received component is of Array Type");
				setItemsOfArrayType(nodeLevel, value, options);

			} else {
				console.log("Received component is of non Array Type");
				for (attrKey in value) {
					attrVal = value[attrKey];

					console.log("ATTRIBUTE KEY::  " + attrKey);
					console.log("ATTRIBUTE VALUE::  " + attrVal);

					var newNameSpace = "";

					if(namespace == null || namespace == "") {
						newNameSpace = attrKey;
					} else {
						newNameSpace = namespace + "." + attrKey;
					}

					var newCurrentObject = getCurrentObject(component, newNameSpace);

					if(newCurrentObject != null) {
						if(newCurrentObject.isArray) {
							var thisNodeLevel = nodeLevel + "." + attrKey;
							setItemsOfArrayType(thisNodeLevel, attrVal, options);
						} else {
							setItemsOfLeafOrNonLeafType(currentObject, attrKey, attrVal);
						}
					} else {
						console.log("Unable to get the current object for " + component + "." + newNameSpace);
					}
				}
			}
		}
	}

	executeSubscriptionCallbackForParentChild(nodeLevel, value, eventType);
}
