var ddsc = require('./index')({
    dispatcher : {
        host : 'dux-dispatcher.dux.test',
        port : 8000
    },
    statestore : {
        host : 'dux-statestore.dux-test',
        port : 8000
    }
})
ddsc.on('/state/containers', function(err, containers) {
    console.log(err, containers)
    process.exit(0)
})
ddsc.start()
