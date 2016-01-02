var connectionType = "mbbridge"
mb.setReceiveCallback("receiveMessage");

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