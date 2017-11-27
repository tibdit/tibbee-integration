var TIBIT = (function(tibit) {


    var generateSub = function(){
    // Overwrites tibit.generateSub, which is in turn imported as Initiator.generateSub - executes in 'this' context of Initiator

        var e = this.domElement,
            SUB;

        // Search parents for a container <article> tag - if found, use the ID of this as the SUB
        if (findParentByTag(e, 'ARTICLE')) {
            SUB = findParentByTag(e, 'ARTICLE').id;
        }

        // Search upwards for a <body> tag - if found, and the body has an ID, use this as the SUB, otherwise
        // just use 'sqs-site' as the SUB
        else {
            var parentBody = findParentByTag(e, 'BODY');
            SUB = parentBody.id || 'sqs-site';
        }

        return SUB;

    };

    var findParentByTag = function(e, tag){
    // Search upwards through parents of e for an element with the specified tag name, and return this element if found

        tibit.CONSOLE_OUTPUT && console.log('findParentByTag searching for parent with ' + tag + ' for element: \n \t', e);

        // Iterate 10 levels up
        for(var i = 0; i < 10; i++){
            // If e has no parentNode, give up
            if(!e.parentNode) return false;
            // set e to it's parent element
            e = e.parentNode;

            // Check if e has the specified tagName property - if so, return this element
            if(e.tagName === tag){
                tibit.CONSOLE_OUTPUT && console.log('findParentByTag found parent element with tag ' + tag + ': \t \n', e);
                return e;
            }
        }

        tibit.CONSOLE_OUTPUT && console.log('findParentByTag found no parent with tag ' + tag);

        // If we've iterated 10 times and not found the tag, return false
        return false;

    };

    tibit.generateSub = generateSub;

    tibit.CONSOLE_OUTPUT && console.log('successfully loaded squarespace module');

    return tibit;

})(TIBIT || {});