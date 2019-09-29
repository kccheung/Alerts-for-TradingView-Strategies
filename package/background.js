// 2019   https://puvox.software  (T.Todua)


var storage = chrome.storage.sync;
var all_opts =[];

storage.get("enabled", function(data){
	var val= true;
	if(!data.hasOwnProperty("enabled")){
		storage.set( { "enabled" : val } );
	}
});

function updateStatus() {
	storage.get("enabled", function(data){
		if(data["enabled"]){
			storage.set( { "enabled" : false } );
			chrome.browserAction.setIcon({path:"icon-48-disabled.png"}); 
		}
		else{
			storage.set( { "enabled" : true } );
			chrome.browserAction.setIcon({path:"icon-48.png"});
		}
	});
//		chrome.tabs.executeScript(       null, {code:""}      	);
}

chrome.browserAction.onClicked.addListener(updateStatus);