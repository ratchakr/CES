
var poiSubHandle = null;
var parkingSubHandle = null;
var notificationSubHandle = null;
var contactsSubHandle = null;
var calendarSubHandle = null;
var calendarParentSubHandle = null;
var saSubHandle = null;
var lightState = "on";

var allDevices = [{"action":"get","type":"resourcetype","id":"","siteIds":["home"]}];
var lightOFF = [{"requestId": "setLightOff", "action":"set","type":"resourcetype","id":"light","siteIds":["home"],"state":"off"}];
var lightON = [{"requestId": "setLightOn", "action":"set","type":"resourcetype","id":"light","siteIds":["home"],"state":"on"}];

var POI_SEARCH_DISPLAY = "POI SEARCH RESULTS";
var PARKING_SEARCH_DISPLAY = "PARKING SEARCH RESULTS";
var NOTIFICATION_DISPLAY = "NOTIFICATION RESULTS";
var CONTACT_SYNC_DISPLAY = "IDENTITY CURRENT USER CONTACTS RESULTS";
var CALENDAR_SYNC_DISPLAY = "CALENDAR CURRENT EVENTS RESULTS";
//var CALENDAR_SYNC_PARENT_DISPLAY = "CALENDAR RESULTS";


init("CESApp", decCallback, ["search","notification","identity","settings","calendar","sa"]);

function decCallback(value) {
	console.log("Inside DEC Callback :::: ", value);
	
	if(value instanceof DecError) {
		console.log("ErrorCode ::: " , value.getErrorCode());
		console.log("ErrorMessage ::: " , value.getErrorMessage());
	} else if(value instanceof DecSuccess) {
		console.log("SuccessCode ::: " , value.getSuccessCode());
		console.log("SuccessMessage ::: " , value.getSuccessMessage());

		alert("Subscribing...");
		subscribe();
		alert("Getting Light status for Notification...");
		getAllDevices();
		//alert("CES APP READY FOR USE");
		console.log("Storage after subscribe ::: ", storage);
		clearResults();
	}
};

function subscribe() {
	poiSubHandle = drive.search.results.subscribe(onPOISearch, {"requestId":"att.drive.search.poi.request1"});
	//poiSubHandle = drive.search.results.subscribe(onPOISearch);
	parkingSubHandle = drive.search.results.subscribe(onParkingSearch, {"requestId":"att.drive.search.parking.request1"});
	notificationSubHandle = drive.notification.messages.subscribe(onNotification);
	contactsSubHandle = drive.identity.currentUser.contacts.subscribe(onContactsSync);
	calendarSubHandle = drive.calendar.current.events.subscribe(onCalendarSync);
	//calendarParentSubHandle = drive.calendar.subscribe(onCalendarSyncParent);
	saSubHandle = drive.sa.results.subscribe(saResultsCallback);
	//usersSubHandle = drive.identity.users.contacts.firstName.subscribe (onContactSync);
}



function unSubscribe() {
	drive.search.results.unsubscribe(poiSubHandle);
	drive.search.results.unsubscribe(parkingSubHandle);
	drive.notification.messages.unsubscribe(notificationSubHandle);
	drive.identity.currentUser.unsubscribe(contactsSubHandle);
	drive.calendar.current.events.unsubscribe(calendarSubHandle);
	//drive.calendar.unsubscribe(calendarParentSubHandle);
	drive.sa.results.unsubscribe(saSubHandle);
}

function searchPOIForGivenPosition() {
	var request = {
	    "requestId": "att.drive.search.poi.request1",
	    "serviceType": "poi",
	    "contentType": "poi",
	    "query": "query=movie",
	    "maxItems": 1,
	    "metas": [
	        {
	            "radius": 5000,
	            "position": {
	                "latitude": 36.1699412,
	                "longitude": -115.1398296
	            }
	        }
	    ]
	};

	drive.search.requests.set(request);
}


function searchParkingForGivenPosition() {
	var request = {
	    "requestId": "att.drive.search.parking.request1",
	    "serviceType": "poi",
	    "contentType": "parking",
	    "maxItems": 1,
	    "metas": [
	        {
	            "position": {
	                "latitude": 33.0197,
	                "longitude": -96.6992
	            }
	        }
	    ]
	};

	drive.search.requests.set(request);
}

function syncContacts() {
	var settings = {
		"sync" : true
	};
	
	drive.settings.identity.currentUser.contacts.set(settings);
}

function syncCalendar() {
	var settings = {
		"sync" : true
	};
	
	drive.settings.calendar.currentUser.set(settings);
}

function saResultsCallback(data) {
	console.log("::callback::", data);
	
	if(data instanceof Array) {
		var requests = [];
		requests = data;
		
		var request = requests[0];
		console.log("::callback result::", request);
		
		if(request.sites != null) {
			var sites = [];
			sites = request.sites;
			
			var site = sites[0];
			var resourceTypes = [];
			resourceTypes = site.resourcetypes;
			
			console.log("*************", JSON.stringify(resourceTypes));
			
			for (var counter = 0; counter < resourceTypes.length; counter++) {
				var resource = resourceTypes[counter];
				console.log("*************", JSON.stringify(resource.name));
		
				if(resource.name === "light") {
					var resourceDetails = [];
					resourceDetails = resource.resources;
					console.log("*************", JSON.stringify(resourceDetails));
					
					var resourceDetail = resourceDetails[0];
					lightState = resourceDetail.state;
					console.log("******state*******", JSON.stringify(lightState));
					
					if (lightState === "on") {
						$('#my_image').attr('src', 'images/LightsOn.png');
						$('#my_image').attr('data-toggle', 'tooltip');
						$('#my_image').attr('title', 'Click to turn OFF light and receive notifications');
					} else {
						$('#my_image').attr('src', 'images/LightsOff.png');
						$('#my_image').attr('data-toggle', 'tooltip');
						$('#my_image').attr('title', 'Click to turn ON light and receive notifications');
					}
				}
			}
			alert("CES APP READY FOR USE");
		} else if (request.requestId === "setLightOn") {
			if(request.status === "success") {
				lightState = "on";
				$('#my_image').attr('src', 'images/LightsOn.png');
				$('#my_image').attr('data-toggle', 'tooltip');
				$('#my_image').attr('title', 'Click to turn OFF light and receive notifications');
			}
		} else if (request.requestId === "setLightOff") {
			if(request.status === "success") {
				lightState = "off";
				$('#my_image').attr('src', 'images/LightsOff.png');
				$('#my_image').attr('data-toggle', 'tooltip');
				$('#my_image').attr('title', 'Click to turn ON light and receive notifications');
			}
		}
	}
}

function getAllDevices() {
	drive.sa.requests.set(allDevices);
}

function onLightClick() {
	if (lightState === "on") {
		drive.sa.requests.set(lightOFF);
	} else {
		drive.sa.requests.set(lightON);
	}
}

function onPOISearch(value) {
	console.log("INSIDE CALLBACK POI SEARCH FOR GIVEN POSITION", value);
	displayResult(value, POI_SEARCH_DISPLAY);
};

function onParkingSearch(value) {
	console.log("INSIDE CALLBACK PARKING SEARCH FOR GIVEN POSITION", value);
	displayResult(value, PARKING_SEARCH_DISPLAY);
};

function onNotification(value) {
	console.log("INSIDE CALLBACK NOTIFICATION MESSAGES", value);
	displayResult(value, NOTIFICATION_DISPLAY);
};

function onContactsSync(value) {
	alert("On Contacts Sync");
	console.log("INSIDE CALLBACK CONTACTS SYNC", value);
	displayResult(value, CONTACT_SYNC_DISPLAY);
};

function onCalendarSync(value) {
	alert("On Calendar Sync");
	console.log("INSIDE CALLBACK CALENDAR SYNC", value);
	displayResult(value, CALENDAR_SYNC_DISPLAY);
};

/*function onCalendarSyncParent(value) {
	console.log("INSIDE CALLBACK CALENDAR PARENT SYNC", value);
	displayResult(value, CALENDAR_SYNC_PARENT_DISPLAY);
};*/

function displayResult(value, header) {
	if (value != null) {
		var newElement = document.createElement('div');
		newElement.innerHTML = "<br /> <span style='color:#0000FF;font-weight:bold;font-style:italic'>" + header + "</span>";
		document.getElementById('right-component-results').appendChild(newElement);
		
		newElement = document.createElement('div');
		newElement.innerHTML = JSON.stringify(value);
		document.getElementById('right-component-results').appendChild(newElement);
	}
};

function resizeImg(img, height, width) {
    img.height = height;
    img.width = width;
}

function clearResults() {
	document.getElementById('right-component-results').innerHTML = "";
}

function clearStorage() {
	localStorage.clear();
}

function resolve(res) {
   console.log("RESOLVE", res);
}

function reject(error) {
   console.log(error);
}

