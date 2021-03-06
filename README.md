# dux-dispatcher-statestore-connection

This is a convenience wrapper for [dux-dispatcher-connection](https://github.com/asbjornenge/dux-dispatcher-connection) and [dux-statestore-api-client](https://github.com/asbjornenge/dux-statestore-api-client) keeping track of dispatcher connection state and querying the statestore for current value on initial connection(s). It simplifies building out dux services relying on statestore data.

## Install

    npm install dux-dispatcher-statestore-connection

## Use

    var ddsc = require('dux-dispatcher-statestore-connection')({
        dispatcher : {
            host : 'dux-dispatcher.dux.test',
            port : 8000
        },
        statestore : {
            host : 'dux-statestore.dux.test',
            port : 8000
        }
    })
    ddsc.on('/state/hosts', function() {
        // As soon as dispatcher is ready this function will be called with the current value in the statestore
        // .on also acts as a normal dispatcher subscription meaning this function will be called when the state value changes
    })
    ddsc.listen()

## Changelog

### 1.0.0

* Initial release :tada:
