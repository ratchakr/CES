
function decCallback(value) {
	console.log("Inside DEC Callback :::: ", value);

	if (value instanceof DecError) {
		console.log("ErrorCode ::: ", value.getErrorCode());
		console.log("ErrorMessage ::: ", value.getErrorMessage());
	} else if (value instanceof DecSuccess) {
		console.log("SuccessCode ::: ", value.getSuccessCode());
		console.log("SuccessMessage ::: ", value.getSuccessMessage());
		subscribeToVehicleInfo();
	}
};

function resolve(res) {
	console.log("RESOLVE", res);
}

function reject(error) {
	console.log(error);
}

function testCallback(results, eventType) {
	alert("... Subscription CallBack Rcvd ...");
	// var jsonText = JSON.stringify(results);
	// alert("jsonText = "+ jsonText);
	// displayResults(jsonText);
	logResultInHtml(results);
	// unsubscribe();
}

function unSubscribe() {
	drive.vehicleinfo.unsubscribe(sHandle);
}

function logResultInHtml(attrVal) {
	try {
		if (attrVal instanceof Array) {
			var arrayValJson = JSON.parse(JSON.stringify(attrVal));
			var item = JSON.parse(arrayValJson[0]);
			// var status = item["enabled"]; // for polices type
			console.log("GET Array Value: " + item);
		} else {
			var value = JSON.stringify(attrVal);
		}

		var newElement = document.createElement('div');
		newElement.innerHTML = "<br /> <span style='color:#0000FF;font-weight:bold;font-style:italic'>"
				+ "Results" + "</span>";
		document.getElementById('output').appendChild(newElement);

		newElement = document.createElement('div');
		newElement.innerHTML = value;
		document.getElementById('output').appendChild(newElement);

	} catch (e) {
		// alert (" === NOT NICE === "+ e.description);
	}

}