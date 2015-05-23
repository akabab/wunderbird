var socket = io();

/* set pseudo and notify peers */
$('#set-pseudo').submit(function () {
    var p = $('#pseudo-input');
    socket.emit('pseudo', p.val());
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
socket.on('color', function (color) {
    /* change sky color */
    var bg_col = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    $("#sky").css("background-color", bg_col);
    // console.log(color);
});

var _crazyModeNoiseLevel = 300;
var _baseDelay = _crazyModeNoiseLevel * 250;
var _strobe = new Strobe();
socket.on('noiseLevel', function (noise) {
    console.log(noise);
    if (noise > _crazyModeNoiseLevel) {
        _strobe.update(_baseDelay / noise);
    }
    else
        _strobe.stop();
});

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
