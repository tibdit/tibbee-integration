/*! * $script.js JS loader & dependency manager * https://github.com/ded/script.js * (c) Dustin Diaz 2014 | License MIT */
(function(e,t){typeof module!="undefined"&&module.exports?module.exports=t():typeof define=="function"&&define.amd?define(t):this[e]=t()})("$script",function(){function p(e,t){for(var n=0,i=e.length;n<i;++n)if(!t(e[n]))return r;return 1}function d(e,t){p(e,function(e){return t(e),1})}function v(e,t,n){function g(e){return e.call?e():u[e]}function y(){if(!--h){u[o]=1,s&&s();for(var e in f)p(e.split("|"),g)&&!d(f[e],g)&&(f[e]=[])}}e=e[i]?e:[e];var r=t&&t.call,s=r?t:n,o=r?e.join(""):t,h=e.length;return setTimeout(function(){d(e,function t(e,n){if(e===null)return y();!n&&!/^https?:\/\//.test(e)&&c&&(e=e.indexOf(".js")===-1?c+e+".js":c+e);if(l[e])return o&&(a[o]=1),l[e]==2?y():setTimeout(function(){t(e,!0)},0);l[e]=1,o&&(a[o]=1),m(e,y)})},0),v}function m(n,r){var i=e.createElement("script"),u;i.onload=i.onerror=i[o]=function(){if(i[s]&&!/^c|loade/.test(i[s])||u)return;i.onload=i[o]=null,u=1,l[n]=2,r()},i.async=1,i.src=h?n+(n.indexOf("?")===-1?"?":"&")+h:n,t.insertBefore(i,t.lastChild)}var e=document,t=e.getElementsByTagName("head")[0],n="string",r=!1,i="push",s="readyState",o="onreadystatechange",u={},a={},f={},l={},c,h;return v.get=m,v.order=function(e,t,n){(function r(i){i=e.shift(),e.length?v(i,r):v(i,t,n)})()},v.path=function(e){c=e},v.urlArgs=function(e){h=e},v.ready=function(e,t,n){e=e[i]?e:[e];var r=[];return!d(e,function(e){u[e]||r[i](e)})&&p(e,function(e){return u[e]})?t():!function(e){f[e]=f[e]||[],f[e][i](t),n&&n(r)}(e.join("|")),v},v.done=function(e){v([null],e)},v})

// Takes a JS object as a parameter
function tibInit(globalParams){
    var bd;

    var scriptsToImport = [];
    $script('https://widget.tibit.local/assets/platforms/tumblr/crypto-sha256.js', 'cryptojs');
    scriptsToImport.push('cryptojs');

    $script.ready(scriptsToImport, function () {

        bd = new TibHandler(globalParams);

        if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', function(){
               bd.initButtons();
            });
        }
        else{
            bd.initButtons();
        }

        return bd;

    });
}

/**********
TIB HANDLER
**********/

// Our TibHandler object, concerned with initialising our buttons and processing relevant local
// storage entries. We also initialise our defaultTibParams object using the parameters fed to
// the tibInit function.
function TibHandler(globalParams){

    this.initButtons = function(){
        var that = this;
        this.sweepOldTibs(globalParams.DUR);

        var buttons = document.getElementsByClassName('bd-tib-btn');
        for(var i = 0, n = buttons.length; i < n; i++){
            // Save current button to e for simpler reference
            var e = buttons[i];

            // Generate TibInitiator for button, feeding in global/default params + local params
            e.tibButton = new TibButton(globalParams, e);
            if ( localStorage["bd-subref-" + e.tibButton.initiator.params.SUB] && JSON.parse(localStorage.getItem('bd-subref-' + e.tibButton.initiator.params.SUB)).ISS ){
                e.tibButton.acknowledgeTib();
            }
        }

        // Localstorage event listener - watches for changes to bd-subref-x items in localStorage
        window.addEventListener('storage', function(e){
           if(e.newValue && e.key.substr(0,10) === "bd-subref-"){
               that.ackElementsInClass(e.key);
           }
        });
    };

}

TibHandler.prototype.ackElementsInClass= function ( key ) {
    // Attempt to grab QTY from localStorage item matching passed key
    var QTY = JSON.parse( localStorage.getItem(key)).QTY;
    var buttons = document.getElementsByClassName(key);
    for (var j = 0, m = buttons.length; j < m; j++) {
        var e = buttons[j];
        e.tibButton.acknowledgeTib();
        // If QTY obtained from storage, and button has a counter, write to it
        e.tibButton.writeCounter(QTY);
    }
};

TibHandler.prototype.sweepOldTibs= function( DUR ){

    for(var key in localStorage){
        if ( key.substr(0,10) === "bd-subref-" ) {
            var item = JSON.parse(localStorage.getItem(key))
            var EXP = new Date(item.EXP)
            if ( Date.now() >  EXP.getTime()) {
                // If sufficient time has passed, mark the localStorage item to be removed
                localStorage.removeItem(key);
            }
        }
    }
};


/*********
TIB BUTTON
*********/

// Our TibButton object, concerned with the behaviour of our tibbing buttons - here we
// assign our onclick events, write our counters, and interact with the DOM element
function TibButton(globalParams, e){

    this.domElement = e;

    this.initiator = new TibInitiator(globalParams, this.domElement);
    this.params = new TibButtonParams(globalParams, this.domElement);


    if (! document.getElementById('bd-css-tib-btn')) {
        // needs to accomodate different CSS by button type.
        this.injectCss();
    }
    

    this.loadElementParams(e);


    this.loadButton();

    e.classList.add('bd-tib-btn-' + this.params.BTN);

    if ( this.isTestnet() ) this.domElement.classList.add("testnet");
    // Add subref class for easier reference later
    e.classList.add("bd-subref-" + this.initiator.params.SUB);

    e.addEventListener("click", this.initateTib());
}


TibButton.prototype.injectCss = function(){
        var headElement= document.getElementsByTagName('head')[0];
        var linkElement= document.createElement('link');
        linkElement.id= 'bd-css-tib-btn';
        linkElement.rel= 'stylesheet';
        linkElement.type= 'text/css';
        linkElement.href= 'https://widget.tibit.com/assets/css/tib.css';
        // linkElement.href= 'css/tib.css';
        headElement.appendChild(linkElement);
};


TibButton.prototype.loadElementParams = function(){
    for ( var paramName in this.params ){
        if ( this.domElement.getAttribute('data-bd-' + paramName) ){
            this.params[paramName] = this.domElement.getAttribute('data-bd-' + paramName) || this.params[paramName];
        }
    }
    this.initiator.loadElementParams(this.domElement);
};


TibButton.prototype.acknowledgeTib = function( ){
    this.domElement.classList.add('tibbed');
};


TibButton.prototype.isTestnet= function() {
    return this.initiator.isTestnet();
};


TibButton.prototype.initateTib = function(){
    return function(){
        // "this" context is the button element, since this occurs in the context of an onclick event
        this.tibButton.initiator.tib();   
        // if class 'tibbed' do something different maybe     
    };
};


TibButton.prototype.writeCounter= function( QTY){
    var c= this.domElement.getElementsByClassName('bd-btn-counter')[0];
    // If the button has a counter and the counter has been marked pending, replace
    // the counter content with the retrieved QTY
    if(c && QTY){
        c.textContent = QTY;
    }
};


TibButton.prototype.loadButton= function(){

    var buttonFile = this.params.BTN || "default";
    var buttonLocation = this.params.BTS || "https://widget.tibit.com/buttons/";


    var tibbtn = new XMLHttpRequest();
    tibbtn.open("GET", buttonLocation + "tib-btn-" + buttonFile + ".svg", true);
    tibbtn.send();

    var that = this;

    tibbtn.onreadystatechange = function(){
        if (tibbtn.readyState == 4 && tibbtn.status == 200 && tibbtn.responseXML) {
            that.writeButton(this.responseXML, that.params.BTN);
        }
    };
};


TibButton.prototype.writeButton= function( source, BTN){

    var content= source.getElementById("tib-btn-" + BTN);

    // Inject the button, either as a new child of the container element or a replacement
    // for the immediate child
    if (this.domElement.children.length === 0) {
        this.domElement.appendChild(document.importNode(content, true));
    } else {
        // target <button> element should have <object> as first or only child
        this.domElement.replaceChild(document.importNode(content, true), this.domElement.children[0]);
    }

    // prevent default submit type/action if placed within a form
    if (this.domElement.tagName === 'BUTTON' && !this.domElement.getAttribute('type') ) {
        this.domElement.setAttribute('type','button'); // prevents default submit type/action if placed withing form
    }

    var bg = this.domElement.getElementsByClassName('bd-btn-backdrop')[0];

    if(bg && this.params.BTC) {

        bg.style.fill = this.params.BTC;
    }

    if(this.params.BTH){
        this.domElement.style.height = this.params.BTH + "px";
    }

    // Removing potential duplicate SVG ID's
    var s = this.domElement.children[0];
    s.removeAttribute("id");

    if (s.style.width === "") { // width of SVG element needs to be set for MSIE/EDGE
        s.style.width=(s.getBBox().width*(s.parentNode.clientHeight / s.getBBox().height )).toString()+"px";
    }

    var btnLinkCss= source.getElementById( "tib-btn-" + BTN + "-css");
    if (btnLinkCss) {
        var headElement= document.getElementsByTagName('head')[0];
        var tibCssElement= document.getElementById('bd-css-tib-btn');
        headElement.insertBefore(btnLinkCss, tibCssElement.nextSibling);
    }


    this.initiator.getQty(this.writeCounter.bind(this));

};


function TibButtonParams( copyFrom){

    this.BTN = "default";  // Name of the button style to retreive/inject
    this.BTC = "";  // Colour for the face of the button
    this.BTH = "";  // Height in pixels

    if (typeof copyFrom !== "undefined") {
        for (var p in this) this[p] = copyFrom[p] || this[p];
    }
}


/************
TIB INITIATOR
************/


// Our Tib Initiator object, concerned with the interactions with the tibbing app. We can use this
// to open our tibbing window, retrieve counters, and validate our tib params.
function TibInitiator( globalParams, e){


    this.params = new TibInitiatorParams( globalParams);
    
    if ( !this.params.TIB ) {
        // If no TIB specified, assume the current page URL

        this.params.TIB = window.location.hostname + window.location.pathname; // + window.location.search??

    }

    if ( !this.params.SUB ) {
        // If no SUB is provided, use a hash of the TIB url
        this.params.SUB=  this.getSub();
    }
}


TibInitiator.prototype.getSub= function() {
    // generate SHA256 hash, truncate to 10 chars, and use this for the SUB.
    // potential to overload with platform specific code, but that will require DOM element (as argument?)
    hash = this.params.TIB.replace(/^(https?:)?(\/\/)?(www.)?/g, '');  // remove generic url prefixes
    hash = Crypto.SHA256(hash);   // possibly move to https://github.com/garycourt/murmurhash-js/blob/master/murmurhash3_gc.js
    hash = hash.substr(0, 10);
    return "TIB-SHA256-" + hash;
};


TibInitiator.prototype.tib= function() {
    // initiate the tib by opening the tib.me popup window 
    var tibWindowName= "tibit";
    var tibWindowOptions= "height=721,width=640,menubar=no,location=no,resizable=no,status=no";
    // Use initiator params to generate URL, and open in new window
    window.open( "https://tib.me/" + this.querystring(), tibWindowName, tibWindowOptions);
};


TibInitiator.prototype.querystring= function() {
    // assembles tib initiator parameters into URL querystring 
    var querystring = "?";
    for ( var param in this.params ) {
        querystring += param;
        querystring += "=";
        querystring += encodeURIComponent(this.params[param]);
        querystring += "&";
    }
    return querystring.substr(0,querystring.length);  // truncate trailing ampersand
};


TibInitiator.prototype.getQty= function( callback){
    // retreive the current tib count for this initiator
    var qtyHttp= new XMLHttpRequest();
    var initiatorUrl= "https://tib.me/getqty/" + this.querystring();
    console.log(initiatorUrl);
    qtyHttp.open('GET', initiatorUrl, true);
    qtyHttp.onreadystatechange= function(){
        if ( qtyHttp.readyState === 4 && qtyHttp.status === 200 ) {
            callback( JSON.parse(qtyHttp.response).QTY);
        }
    };
    qtyHttp.send();
};


TibInitiator.prototype.isTestnet= function(){
    // true if PAD set and first character not 'm', 'n', or '2'
    return this.params.PAD && ( "mn2".search(this.params.PAD.substr(0,1)) !== -1 );
};


TibInitiator.prototype.loadElementParams= function(e) {
    for ( var p in this.params){
        if ( e.getAttribute('data-bd-' + p) ){
            this.params[p] = e.getAttribute('data-bd-' + p) || this.params[p];
        }
    }
};


// Our parameters object - currently just recieves an object and returns a new object with
// the relevant properties, but this gives us room to apply data validation etc inside of the
// object as a later date.
function TibInitiatorParams( copyFrom) {

    this.PAD = "";  // Payment Address - Bitcoin address tib value will be sent to 
    this.SUB = "";  // Subreference - Identifies the specific item being tibbed for any counter 
    this.CBK = "";  // Callback - If specified, the users browser will be redirected here after the tib is confirmed
    this.ASN = "";  // Assignee - 3rd party that tib value will be sent to.  Only valid if PAD not specified
    this.TIB = "";  // URL used to retreive the snippet telling the user what they are tibbing

    if (typeof copyFrom !== "undefined") {
        for ( var p in this) this[p] = copyFrom[p] || this[p];
    }
}



