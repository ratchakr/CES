/**
 * Javascript test for useragent platform conditions
 * TODO: Moving to jsunit later stage * 
 */

var agent = "Mozilla/5.0 (Linux; Android 4.4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36";
//agent = navigator.userAgent;
console.log(agent)
var pattern = agent.match(/Android (.*);/);
console.log(pattern);
var version = null;
if (pattern!=null && pattern.length>0 
        && pattern[1]!=null && pattern[1].length>0) {
    version = pattern[1];    
}
console.log(version);
if ( version!=null && (version.match(/4\.4/)==null) 
       && (version.match(/5/)==null) ) {    
    /** Use mbbridge **/
    console.log("Going to use MB Bridge")
} else {
    /** Use SPAN **/
    console.log("Going to use SPAN")
}