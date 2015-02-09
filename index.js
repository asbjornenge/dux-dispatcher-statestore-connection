var ddc = require('dux-dispatcher-connection')
var dsa = require('dux-statestore-api-client')
var EE  = require('events').EventEmitter

var DispatcherStatestoreConnection = function(options) {
    this.dispatcher    = options.dispatcher || {}
    this.statestore    = options.statestore || {}
    this.interval      = options.interval   || 5000
    this.timeout       = options.timeout    || 500
    this.subscriptions = []
}
DispatcherStatestoreConnection.prototype = {

    start : function() {
        this.ddc = ddc({
            host     : this.dispatcher.host,
            port     : this.dispatcher.port,
            interval : this.interval,
            timeout  : this.timeout
        })
        this.dsa = dsa({
            host     : this.statestore.host,
            port     : this.statestore.port
        })
        this.ddc.on('up', this.handleUp.bind(this))
        this.ddc.on('down', this.handleDown.bind(this))
        this.ddc.listen()
    },

    handleUp : function() {
        this.subscribeAll()
    },

    handleDown : function(issue) {
        this.unsubscribeAll()
    },

    on : function(channel, fn, options) {
        options = options || { queryStateStore : true }
        this.subscriptions.push({ channel : channel, callback : fn, options : options })
    },

    off : function(channel, fn) {
        this.subscriptions = this.subscriptions.filter(function(sub) {
            return sub.channel != channel
        })
    },

    subscribeAll : function() {
        this.subscriptions.forEach(function(sub) {
            sub.subscription = this.ddc.subscribe(sub.channel, function(data) { sub.callback(null, data) })
            if (sub.channel.indexOf('/state') == 0 && sub.options.queryStateStore) this.queryStateStore(sub.channel, sub.callback)
        }.bind(this))
    },

    unsubscribeAll : function() {
        this.subscriptions.forEach(function(sub) {
            if (sub.subscription) sub.subscription.cancel()
        }.bind(this))
    },

    queryStateStore : function(state, fn) {
        state = state.split('/state')[1]
        this.dsa.getState(state, function(err, currentState) {
            fn(err, currentState)
        })
    }

}

module.exports = function(options) { return new DispatcherStatestoreConnection(options)  }
