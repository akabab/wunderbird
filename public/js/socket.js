var socket = io();

/* set pseudo and notify peers */
$('#set-pseudo').submit(function () {
    var p = $('#pseudo-input');
    socket.emit('pseudo', p.val());
    _mainPlayer.setPseudo(p.val());
    p.val('');
    return false;
});

$('#chat').submit(function () {
    var p = $('#say');
    socket.emit('say', p.val());
    p.val('');
    return false;
});

/* received player message */
socket.on('say', function (o) {
    var uuid = o.uuid;
    var message = o.message;
    console.log("%s: %s", uuid, message);
});

/* Relayr events */

/* COLOR */
socket.on('color', function (color) {
    /* change sky color */
    var bg_col = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    $("#sky").css("background-color", bg_col);
    // console.log(color);
});

/* HUMIDITY */
var _water = $("#water");
var _waterLevel = 0; //[0-500]
socket.on('humidity', function (humidity) {
    // console.log("Humidity: %s", humidity);
    _waterLevel = humidity / 100 * 500;
    _water.css('height', _waterLevel);
});

/* NOISE */
var _crazyModeNoiseLevel = 500;
var _baseDelay = _crazyModeNoiseLevel * 250;
var _strobe = new Strobe();

var _ceiling = $("#ceiling");
var _ceilNoiseMin = 120; // noise start for ceil to get down
var _ceilNoiseMax = _crazyModeNoiseLevel;
var _ceilTopMin = -160;
var _ceilTopMax = -15;
var _ceilStep = Math.abs(_ceilTopMax - _ceilTopMin) / Math.abs(_ceilNoiseMax - _ceilNoiseMin);
socket.on('noiseLevel', function (noise) {
    // console.log("Noise: %s", noise);
    if (noise > _crazyModeNoiseLevel) {
        _strobe.update(_baseDelay / noise);
    }
    else {
        _strobe.stop();

        /* ceil */
        var topValue = _ceilTopMin + ((noise - _ceilNoiseMin) * _ceilStep);
        // console.log("noise: %s, topValue: %s", noise, topValue);
        if (topValue > _ceilTopMax)
            topValue = _ceilTopMax;
        if (topValue < _ceilTopMin)
            topValue = _ceilTopMin;
        _ceiling.css('top', topValue);
    }
});

/* Strobe */
function Strobe () {
    this.timeoutId = null;

    this.toggle = false;
    var gscreen = $("#gamescreen");
    this.toggleInvert = function (noChain) {
        var invert = this.toggle ? "invert(100%)" : "";
        gscreen.css("-webkit-filter", invert);
        gscreen.css("-moz-filter", invert);
        gscreen.css("filter", invert);
        this.toggle = !this.toggle;
        if (!noChain) {
            this.next();
        }
    }
}

Strobe.prototype.play = function () {
    this.toggleInvert.call(this);
}

Strobe.prototype.next = function () {
    this.timeoutId = setTimeout(this.toggleInvert.bind(this), this.repeatDelay);
};

Strobe.prototype.stop = function () {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
    if (!this.toggle) {
        this.toggleInvert(true);
    }
};

Strobe.prototype.update = function (value) {
    this.repeatDelay = value;
    if (this.timeoutId === null) {
        this.play();
    }
};
