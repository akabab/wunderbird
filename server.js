var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var debug = require('debug')('wunderfun:server');
var uuid = require('node-uuid');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var port = process.env.PORT || '8000';
app.set('port', port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


/**
 * Event listener for HTTP server "error" event.
 */

var onError = function(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

/**
 * Event listener for HTTP server "listening" event.
 */

var onListening = function() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
};

var server = http.createServer(app);

var io = require('socket.io')(server);

var _sockets = [];
io.on('connection', function (socket) {
    /* new player joined */
    socket.uuid = uuid.v4();
    console.log('new player connected: %s', socket.uuid);

    /* send to myself  */
    socket.emit('peer-list', _sockets.map(function (s) {
        return s.uuid;
    }));

    /* push socket */
    _sockets.push(socket);

    /* send peer event to others with his uuid */
    socket.broadcast.emit('peer-join', socket.uuid);

    /* player left */
    socket.on('disconnect', function () {
        /* remove socket */
        _sockets = _sockets.filter(function (s) { return s !== socket } );
        console.log('player disconnected: %s', socket.uuid);
        socket.broadcast.emit('peer-left', socket.uuid);
    });

    /* player set pseudo */
    socket.on('pseudo', function (pseudo) {
        console.log("player set pseudo: %s -> %s", socket.uuid, pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('peer-pseudo', {uuid: socket.uuid, pseudo: pseudo});
    });

    /* player jump */
    socket.on('jump', function () {
        socket.broadcast.emit('jump', socket.uuid);
    });

    /* player start */
    socket.on('start', function () {
        socket.broadcast.emit('start', socket.uuid);
    });

    /* player die */
    socket.on('die', function () {
        socket.broadcast.emit('die', socket.uuid);
    });

    /* player say something */
    socket.on('say', function (message) {
        console.log('message from %s: %s', socket.pseudo || '?', message);
        socket.broadcast.emit('say', {uuid: socket.uuid, message: message});
    });
});

var Relayr = require("./lib/Relayr");
Relayr.setIO(io);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

module.exports = app;
