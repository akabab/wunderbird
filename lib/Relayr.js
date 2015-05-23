var Relayr = require('relayr');

var app_id = "ebbfdbc5-bd8c-4f8b-ace8-bd47eb148032";
var token = "s6a5iDII7mgyiTDP1QBhWGChc-GSWLJA";
var user_id = "6ab28983-f8b9-43b1-8f5c-82f3ec65f851";
var devices = [
    {name: "light", id: "ea3dba60-09c5-47a9-b52d-9ac6160565e1"},
    {name: "temp", id: "562ed140-19df-410e-972b-8ad8b07eec31"},
    {name: "sound", id: "9e3ca624-ce2b-43bf-a2cd-db7d62a780b1"},
    {name: "accel", id: "7543f039-d69d-4944-b8cf-7301791c6ec7"}
];

var dev_id = "ea3dba60-09c5-47a9-b52d-9ac6160565e1";

var relayr = new Relayr(app_id);

devices.forEach(function (dev) {
    console.log("Connecting %s..", dev.name);
    relayr.connect(token, dev.id);

    // relayr.deviceModel(token, dev.id, function (err, model) {
    //     console.log(err || model);
    // });
});

relayr.on('data', function (topic, data) {
    // console.log(data);

    if (_io) {
        var readings = data.readings;
        readings.forEach(function (r) {
            if (r.meaning === "color") {
                var c = wunderColor(data);
                // console.log(c);
                _io.emit('color', c);
            }
            if (r.meaning === "temperature") {
                _io.emit('temp', r.value);
            }
        });
    }
    else {
        console.error("NO IO");
    }
});

// relayr.user(token, function(err, user) {
//     console.log(err || user);
// });

// relayr.devices(user_id, token, function(err, devices) {
//     console.log(err || devices);
// });

function wunderColor(data) {
    var color = data.readings[1].value;

    var r = color.red,
        g = color.green,
        b = color.blue;
    r *= 2 / 3;
    var max = Math.max(r, Math.max(g, b));
    r = parseInt(r / max * 255);
    g = parseInt(g / max * 255);
    b = parseInt(b / max * 255);
    return {
        r: r,
        g: g,
        b: b
    };
}

function wtfColor(data) {
    var color = data.readings[1].value;
    console.log(color);

    var r = color.red;
    var g = color.green;
    var b = color.blue;

    r = parseInt(r * 7.0 / 10.0);

    while (r > 255 || g > 255 || b > 255) {
        r = r >> 1;
        g = g >> 1;
        b = b >> 1;
    }

    var threshold = 16;
    var increment = [100, 50];

    var r = Math.round(color.red / threshold);
    var g = Math.round(color.green / threshold);
    var b = Math.round(color.blue / threshold);

    var max = Math.max(Math.max(r, g), b);
    if (max == r) {
        r = calibrate(r, increment[0]);
    } else if (max == g) {
        g = calibrate(g, increment[0] + 20);
    } else {
        b = calibrate(b, increment[0] + 50);
    }

    return {
        r: calibrate(r, increment[1]),
        g: calibrate(g, increment[1]),
        b: calibrate(b, increment[1])
    };

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function calibrate(value, inc) {
        if (value < 255 && (value + inc) < 255) {
            value = value + inc;
        } else
            value = 255;
        return value;
    }
};




module.exports = {
    setIO: function(io) {
        _io = io;
    }
};
