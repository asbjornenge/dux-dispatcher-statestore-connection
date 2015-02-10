var ddc = require('dux-dispatcher-connection')
var dsa = require('dux-statestore-api-client')
var EE  = require('events').EventEmitter

var DispatcherStatestoreConnection = function(options) {
    this.ddc_ready     = false
    this.dsa_ready     = false
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
            port     : this.statestore.port,
            interval : this.interval,
            timeout  : this.timeout
        })
        this.ddc.on('up',   function() { this.ddc_ready = true;  this.handleUp()   }.bind(this))
        this.ddc.on('down', function() { this.ddc_ready = false; this.handleDown() }.bind(this))
        this.ddc.listen()
        this.dsa.on('up',   function() { this.dsa_ready = true;  this.handleUp()   }.bind(this))
        this.dsa.on('down', function() { this.dsa_ready = false; this.handleDown() }.bind(this))
        this.dsa.listen()
    },

    isReady : function() {
        return this.ddc_ready && this.dsa_ready
    },

    handleUp : function() {
        if (this.isReady()) this.subscribeAll()
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
