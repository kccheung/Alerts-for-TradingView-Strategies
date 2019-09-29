// 2019   https://puvox.software  (T.Todua)

/*
//@version=4
strategy("Strategy - Alerts", overlay=true, overlay=true, calc_on_every_tick=true)

longCondition = close<open
shortCondition = close>open

plotchar(barstate.islast and longCondition,   title="long",   char="long", color=#AA22E1)
plotchar(barstate.islast and shortCondition,   title="short",   char="short", color=#AA22E2)
*/


function TradingViewStrategyMonitor()
{
	// options:
	this.enable_sound = true;
	
	// ==================== helpers =========================//
	this_MAIN = this;
	this.document_ = document;
	
	//i.e.  rgbToHex(0, 51, 255); // #0033ff
	this.componentToHex	= function(color){ var hex = color.toString(16); return hex.length == 1 ? "0" + hex : hex; };
	this.rgbToHex 		= function(r, g, b) { return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);  }; 
	
	this.playSound= function(){
		var sound = this.document_.getElementById("TVSM_ALERT");
		if (!sound)
		{
			var sound	= this.document_.createElement("audio"); sound.id="TVSM_ALERT"; sound.preload="auto";
			sound.src	="https://freesound.org/data/previews/380/380482_6512973-lq.mp3";
			this.document_.body.appendChild(sound);
		}
		sound.play();
	};
	// ======================================================//
	
	
	
	// ============== OBSERVER ============== //
	this.observer = null; // main observer
	this.start = function()
	{
		var targetNode = this.document_.getElementsByTagName("body")[0];			// Select the node that will be observed
		var config = { attributes: true, childList: true, subtree: true };	// Options - which mutations to observe
		
		this.observer = new MutationObserver(this.myCallback);				// Create an observer instance linked to the callback function
		this.observer.observe(targetNode, config); 							// Start observing the target node for configured mutations 
		
		this.MouseOverChart();
		this.createWindows();
	};
	
	this.stop = function()
	{
		this.observer.disconnect();	// Stop observer whenever needed	
	};
	 
	// Callback function to execute when mutations are observed
	this.myCallback = function(mutationsList, observer) {
		for(let mutation of mutationsList) {
			//if (mutation.type === "childList")  console.log("A child node has been added or removed."); 
			if (mutation.type === "attributes") {
				if (mutation.target.className == "pane-legend")
				{
					mutation.target.childNodes.forEach( function(node){
						if (node.className.indexOf(" study") > -1)
						{
							this_MAIN.fallbackFunctionForNode(node);
						}
					});
					
				}
			} 
		}
	};
	//  =============== end of OBSERVER =============== 
	

	
	// ==============   MAIN  ============== //
	// array of filled ones
	this.TRIGGERED_NODES = [];
	
	this.TVSM_tvStrategyCallbacks = {};

	this.fallbackFunctionForNode = function(node)
	{
		var studyNameEl=node.getElementsByClassName("pane-legend-title__wrap-text")[0];
		var studyName = studyNameEl.innerText || studyNameEl.textContent;
		var itemsContainer = node.getElementsByClassName("pane-legend-item-value-container")[0];
		var allItemsInContainer = itemsContainer.getElementsByClassName("pane-legend-item-value-wrap");
		for(var i=0; i<allItemsInContainer.length; i++)
		{
			this.fallbackFunctionForItem(studyName, allItemsInContainer[i]);
		}
	};
	
	
	this.fallbackFunctionForItem = function(studyName, item)
	{
		if (!this.enable_alert_on_mouseover_chart && this.mouseIsOverChart) return;
		
		var itemValueElement = item.getElementsByClassName("pane-legend-item-value")[0];
		var rgb_color = itemValueElement.style.color.replace(/ /g, "");
		var RGBs= rgb_color.replace(/[^\d,]/g, "").split(",");
		var hexColor = this.rgbToHex( parseInt(RGBs[0]), parseInt(RGBs[1]), parseInt(RGBs[2]) );
		var itemValueValue = itemValueElement.innerText || itemValueElement.textContent; 
		for (var title in this_MAIN.TVSM_tvStrategyCallbacks) {
			if (this_MAIN.TVSM_tvStrategyCallbacks.hasOwnProperty(title)) 
			{
				if (title==studyName)
				{
					var strategy_obj = this_MAIN.TVSM_tvStrategyCallbacks[title];
					for (var color in strategy_obj)
					{
						if (color.toLowerCase()==hexColor.toLowerCase())
						{
							// if value is 1
							if (itemValueValue==1.0)
							{
								// if it is new occurence, then trigger function
								if ( ! this.TRIGGERED_NODES.includes(item))
								{
									this.TRIGGERED_NODES.push(item);
									this_MAIN.TVSM_tvStrategyCallbacks[title][color](title, color);
									if (this.enable_sound)
									{
										this.playSound();
									}
								}
								// if it is just next re-trigger, do nothing
								else {  } //console.log("retrigger");
							}
							// if value is 0
							else
							{
								//remove item from array, and wait for next occurence	
								var index = this.TRIGGERED_NODES.indexOf(item);
								if (index > -1) {
									this.TRIGGERED_NODES.splice(index, 1);
								}
							}
						}
						
					}
				}
			}
		}
	};
	//  =============== end of MAIN =============== 






	//  ========= Inject small windows on right bottom corner ========//
	this.createWindows = function() {
		var mainID= "TV_s_alert_container";
		
		var content = '\
			<div id="'+mainID+'">\
				<style>\
				#TV_s_alert_container{position:fixed; bottom:10px; right:10px; background:pink; width:300px; display:flex; flex-direction:column; border:2px solid black; z-index:222; }\
				#TV_s_alert_container .modal-content{ padding:2px; width:99%;}\
				#TV_s_alert_container .close { color:#aaa; float:right; font-size:28px; font-weight:bold; border:1px solid black; }\
				</style>\
				<div class="myModal modal">\
				  <div class="modal-content">\
					<!-- <span class="close">&times;</span>-->\
					<B style="background:#e7e7e7; padding:1px; display: block;">Check the plot-colors to monitor for changes (from 0 to 1)</B>\
					<div class="content"></div>\
				  </div>\
				  <div><input type="checkbox" id="use_mouseover_alerts" onchange="this_MAIN.enable_alert_on_mouseover_chart=this.checked;" />Enable when mouseover on chart</div>\
				  <button class="myReload" onclick="this_MAIN.reFillCheckboxes();">Relist strategy names</button>\
				</div>\
				<button class="myBtn">SHOW/HIDE ALERTS WINDOW</button>\
			</div>';

		var existing = this.document_.getElementById(mainID);
		if(existing) existing.remove();
		
		this.document_.body.insertAdjacentHTML("beforeend",content );

		// elements
		main_container = this.document_.getElementById(mainID);
		var modal = main_container.getElementsByClassName("myModal")[0];
		var btn = main_container.getElementsByClassName("myBtn")[0];
		btn.onclick = function() { if (modal.style.display=="none") modal.style.display = "block"; else modal.style.display = "none";  };
		//main_container.getElementsByClassName("close")[0].onclick = function() {  modal.style.display = "none";};
		this.reFillCheckboxes();
		
	};


	// set interval for adding studies/strategies into the list
	this.reFillCheckboxes =function() {
		main_container.getElementsByClassName("content")[0].innerHTML="";
		var x= this.document_.getElementsByClassName("chart-widget")[0];
		var studies= x.getElementsByClassName("pane-legend-wrap study");
		for(var i=0; i<studies.length; i++)
		{
			var node =studies[i];
			var studyNameEl=node.getElementsByClassName("pane-legend-title__wrap-text")[0]; 
			var studyName = studyNameEl.innerText || studyNameEl.textContent;
			var itemsContainer = node.getElementsByClassName("pane-legend-item-value-container")[0];
			var allItemsInContainer = itemsContainer.getElementsByClassName("pane-legend-item-value-wrap");
			var checkboxes = "";
			for(var i=0; i<allItemsInContainer.length; i++)
			{
				var item=allItemsInContainer[i];
				var itemValueElement = item.getElementsByClassName("pane-legend-item-value")[0];
				var rgb_color = itemValueElement.style.color.replace(/ /g, "");
				var RGBs= rgb_color.replace(/[^\d,]/g, "").split(",");
				var hexColor = this.rgbToHex( parseInt(RGBs[0]), parseInt(RGBs[1]), parseInt(RGBs[2]) );
				checkboxes += '<input style="margin:1px; outline-offset:-4px; outline: 4px solid '+hexColor+';" type="checkbox" onchange="this_MAIN.TVSM_checkbox_changed(event)" name="'+studyName+'" plot="'+hexColor+'" />';
			}
		}
		
		var content = '<div class="c_container">'+studyName+" "+checkboxes+'</div>';
		main_container.getElementsByClassName("content")[0].insertAdjacentHTML('beforeend', content );
	};

	// =============================================================== //
	
	
	
	this.TVSM_checkbox_changed = function(event)
	{
		var el = event.target;
		var study_name= el.getAttribute("name");
		var hexColor= el.getAttribute("plot");
		if (! this_MAIN.TVSM_tvStrategyCallbacks.hasOwnProperty(study_name))
			this_MAIN.TVSM_tvStrategyCallbacks[study_name]={};
			
		if(!el.checked){
			this_MAIN.TVSM_tvStrategyCallbacks[study_name][hexColor]= null;
		}
		else{
			this_MAIN.TVSM_tvStrategyCallbacks[study_name][hexColor]= function(title, color){  console.log("%c Triggers : " + title + "; "+color, "color: "+color);   };
		}
	};

	
	this.enable_alert_on_mouseover_chart = false;
	this.mouseIsOverChart = false;
	this.MouseOverChart=function(){
		var chartPanels = this.document_.getElementsByClassName("chart-markup-table pane");
		if (chartPanels.length>0)
		{
			chartPanels[0].addEventListener("mouseenter", function(  )	{ this_MAIN.mouseIsOverChart=true;} );
			chartPanels[0].addEventListener("mouseout", function(  ) 	{ this_MAIN.mouseIsOverChart=false;});
		}
	};

}






//================ INJECT =======================//
var storage = chrome.storage.sync;
var all_opts =[];

storage.get("enabled", function(data){
	all_opts["enabled"] = data["enabled"];
});


window.onload= function(){
	if(is_allowed_site()){
		if(all_opts["enabled"])
		{ 
			//window.setTimeout( function(){
				// https://stackoverflow.com/questions/9515704/insert-code-into-the-page-context-using-a-content-script/9517879#9517879
				// https://stackoverflow.com/questions/4532236/how-to-access-the-webpage-dom-rather-than-the-extension-page-dom
				var actualCode =  ''+TradingViewStrategyMonitor + '; TVSM_myAlert = new TradingViewStrategyMonitor(document); TVSM_myAlert.start();';
				var script = document.createElement('script');
				script.textContent = actualCode;
				(document.head||document.documentElement).appendChild(script);
				//script.remove();
			//}, 1000);
		}
	}
};

function is_allowed_site(){ return (location.host).indexOf("tradingview.") > -1; }
