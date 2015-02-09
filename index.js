var assign  = Object.assign || require('object.assign')
var faye    = require('faye')
var retry   = require('retry-connection')
var EE      = require('events').EventEmitter

var DispatcherConnection = function(options) {
    this.ready         = false
    this.client        = null
    this.host          = options.host
    this.port          = options.port
    this.interval      = options.interval   || 5000
    this.timeout       = options.timeout    || 500
    this.statestore    = options.statestore || {}
    this.subscriptions = []
}
DispatcherConnection.prototype =  assign({

    listen : function() {
        this.connection = retry({ 
            host     : this.host, 
            port     : this.port,
            interval : this.interval,
            timeout  : this.timeout
        })
        this.connection.on('ready', this.handleReady.bind(this))
        this.connection.on('issue', this.handleIssue.bind(this))
        this.connection.connect()
    },

    handleReady : function() {
        if (this.ready) return
        this.ready  = true
        this.client = new faye.Client(this.getURI())
        this.subscripeAll()
        this.emit('up')
    },

    handleIssue : function(issue) {
        console.log(issue.message)
        if (!this.ready) return
        this.ready  = false
        this.unsubscribeAll()
        this.client = null 
        this.emit('down')
    },

    getURI : function() {
        return 'http://'+this.host+':'+this.port
    },

    on : function(channel, fn, options) {
        options = options || { queryStateStore : true }
        this.subscriptions.push({ channel : channel, callback : fn, options : options  }
    },

    off : function(channel, fn) {
        this.subscriptions = this.subscriptions.filter(function(sub) {
            return sub.channel != channel
        })
    },

    subscribeAll : function() {
        this.subscribeAll.forEach(function(sub) {
            sub.subscription = this.client.subscribe(sub.channel, sub.callback)
            if (sub.channel.indexOf('/state') == 0 && sub.options.queryStateStore) this.queryStateStore(sub.channel, sub.callback)
        }.bind(this))
    },

    unsubscribeAll : function() {
        this.subscribeAll.forEach(function(sub) {
            if (sub.subscription) sub.subscription.cancel()
        }.bind(this))
    },

    queryStateStore : function(state, fn) {
        if (!this.statestore.host) return
        if (!this.statestore.port) return
        state = state.split('/state')[1]
        require('dux-statestore-api-client')({
            host : this.statestore.host,
            port : this.statestore.port
        }).getState(state, function(err, currentState) {
            if (err) { console.error(err); return }
            fn(currentState)
        })
    }

}, EE.prototype)

module.exports = function(options) { return new DispatcherConnection(options)  }
