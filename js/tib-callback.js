TibCallback= function(url){
    
    this.url= url;
    this.DUR= 1;  // multiplier to persist tib acknowedgement (1= 1-day or 5-mins for testnet)

    try {
        this.extractUrlToken();
        this.generateExpiry();
        if ( localStorageAvailable() ) this.persistAck();
        this.closeWindow();
    }

    catch (e) {
        var msg=  document.createElement('p');
        msg.appendChild(document.createTextNode( e.message + "<br>" + e.stack ));
        msg.appendChild(document.createTextNode( "bd: tib callback - tib paid but cannot persist"));
        throw "bd: tib callback - tib paid but cannot persist";
    }
};


TibCallback.prototype.extractUrlToken= function(url){
    var re= "[^\?]*\?.*tibtok=([^&]*)"; 
    var token= url.match(re)[1]; // extract the value of the tibtok= querystring parameter
    token= decodeURIComponent(token); // convert any percent-encoded characters
    token= atob(token); // base64 decode the token
    token= JSON.parse(token); // convert the serialised json token string into js object
    this.token= token;
};


TibCallback.prototype.generateExpiry= function() {
    // set the EXP param to the expiry of the tib acknowledgement
    var issue = new Date( token.ISS).getTime();
    var duration= this.DUR * ( this.isTestnet() ? 300000 : 86400000 );
    // 300000   = 1000 * 60 * 5        (5 mins)
    // 86400000 = 1000 * 60 * 60 * 24  (24 hours)
    this.EXP= new Date( issue + DUR);
};


TibCallback.prototype.isTestnet= function(){
    // true if PAD set and first character not 'm', 'n', or '2'
    return this.token.PAD && ( "mn2".search(this.token.PAD.substr(0,1)) !== -1 );
};


TibCallback.prototype.persistAck= function(){
    var tibDetails = {
        ISS: new Date(this.token.ISS), 
        QTY: this.token.QTY, 
        EXP: this.EXP()};
    localStorage.setItem("bd-subref-" + this.token.SUB, JSON.stringify(tibDetails));
};

TibCallback.prototype.storageAvailable= function(type) {

    // test for available browser localStorage
    // developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API


};

TibCallback.prototype.closeWindow= function( ) {

    //add noclose to querystring of tib initiator to prevent popup tib window from closing

    if ( URI(window.location).query(true).noclose ) {
        return false;
    }

    try {
        var tibWindow= window.open('','_self');
        tibWindow.close();
    }
    catch(ex) {
        console.error( "bd: attempt to close callback window failed");
    }

    return false;
    // function should never return, since window is gone
};


function localStorageAvailable() {
    try {   
        x = '__storage_test__';
        window.localStorage.setItem(x, x);
        window.localStorage.removeItem(x);
        return true;
    }
    catch(e) {
        return false;
    }
}
