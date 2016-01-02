var connectionType = "span"

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
		//var properties = new Properties();
		var uri = "ws://"+properties['host']+":"+properties['port']+"/";
		var ws = new WebSocket(uri);
		ws.onopen = function() {
			// Web Socket is connected, send data using send()
            console.log("Web Scoket is connected now");
            
            var decSuccess = new DecSuccess("0", "Successfully intialized the components and connected to span server");
            var callbackFn = drive.callback;
            
    		if(callbackFn != null) {
    			callbackFn(decSuccess);
    		}
    		
    		
    		/*var letRequest = {"dec.LetRequest":
    		{
    			  "request":
    			  {
    			    "data":"%7B%22component%22%3A%22sa%22%2C%22eventType%22%3A%22delete%22%2C%22method%22%3A%22clear%22%2C%22nameSpace%22%3A%22requests%22%2C%22options%22%3Anull%2C%22handle%22%3A0%7D",
    			    "receivers":
    			    [
    			      "ATT%20Drive%20HUB"
    			    ],
    			    "sender":"DECCore"
    			  }
    			}};
    		
    		console.log(JSON.stringify(letRequest));
    		console.log("Sending msg is ::: " + JSON.stringify(letRequest));
    		ws.send(JSON.stringify(letRequest));
    		console.log("Message is sent...");*/
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
