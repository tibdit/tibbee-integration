// Takes a JS object as a parameter
function tibInit(globalParams){
    var bd;


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
            var item = JSON.parse(localStorage.getItem(key));
            var EXP = new Date(item.EXP);
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


    this.params = {

        BTN : "",  // Name of the button style to retreive/inject
        BTC : "",  // Colour for the face of the button
        BTH : ""  // Height in pixels

    };


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
TibButton.prototype.setParams = function(source){
    if (typeof source !== "undefined") {
        for (var p in this.params) this[p] = this.params[p] || source[p];
    }
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
    if(c && QTY % 1 === 0){
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


/************
TIB INITIATOR
************/


// Our Tib Initiator object, concerned with the interactions with the tibbing app. We can use this
// to open our tibbing window, retrieve counters, and validate our tib params.
function TibInitiator( globalParams, domElement){

    this.params = {

            PAD : "",  // Payment Address - Bitcoin address tib value will be sent to
            SUB : "",  // Subreference - Identifies the specific item being tibbed for any counter
            CBK : "",  // Callback - If specified, the users browser will be redirected here after the tib is confirmed
            ASN : "",  // Assignee - 3rd party that tib value will be sent to.  Only valid if PAD not specified
            TIB : ""  // URL used to retreive the snippet telling the user what they are tibbing
    };

    this.setParams(globalParams);
    
    if ( !this.params.TIB ) {
        // If no TIB specified, assume the current page URL

        this.params.TIB = window.location.hostname + window.location.pathname; // + window.location.search??

    }

    if ( !this.params.SUB ) {
        // If no SUB is provided, use a hash of the TIB url
        this.params.SUB=  this.getSub();
    }
}

// Given an object, populate the existing properties of this.params
TibInitiator.prototype.setParams= function(source){
    if (typeof source !== "undefined") {
        for ( var p in this.params) this.params[p] = source[p] || this.params[p];
    }
};

TibInitiator.prototype.getSub= function() {
    // generate SHA256 hash, truncate to 10 chars, and use this for the SUB.
    // potential to overload with platform specific code, but that will require DOM element (as argument?)
    hash = this.params.TIB.replace(/^(https?:)?(\/\/)?(www.)?/g, '');  // remove generic url prefixes
    hash = murmurhash3_32_gc(hash, 0);   // possibly move to
    // https://github.com/garycourt/murmurhash-js/blob/master/murmurhash3_gc.js
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


/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}