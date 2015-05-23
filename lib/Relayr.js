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

module.exports = {
    setIO: function(io) {
        _io = io;
    }
};

var relayr = new Relayr(app_id);

/* connections */
devices.forEach(function (dev) {
    /* connect devices */
    relayr.connect(token, dev.id);

    /* show devices infos */
    relayr.deviceModel(token, dev.id, function (err, model) {
        console.log(err || "Connecting " + model.name + "..");
    });
});

// relayr.user(token, function(err, user) {
//     console.log(err || user);
// });

// relayr.devices(user_id, token, function(err, devices) {
//     console.log(err || devices);
// });

/* recover sensors data */
relayr.on('data', function (topic, data) {
    // console.log(data);
    if (_io) {
        handleReadings(data.readings);
    }
});

var handleReadings = (function () {
    var _sensor = {
        "proximity"    : { name: "proximity"    , active: false , method: parseProximity    , value: null , type: "percent" , tolerance: 10 },
        "luminosity"   : { name: "luminosity"   , active: true  , method: parseLuminosity   , value: null , type: "percent" , tolerance: 10 },
        "color"        : { name: "color"        , active: true  , method: parseColor        , value: null , type: "{r,g,b}" , tolerance: 10 },
        "temperature"  : { name: "temperature"  , active: true  , method: parseTemperature  , value: null , type: "percent" , tolerance: 10 },
        "humidity"     : { name: "humidity"     , active: true  , method: parseHumidity     , value: null , type: "percent" , tolerance: 10 },
        "acceleration" : { name: "acceleration" , active: false , method: parseAcceleration , value: null , type: "?"       , tolerance: 10 },
        "angularSpeed" : { name: "angularSpeed" , active: false , method: parseAngularSpeed , value: null , type: "?"       , tolerance: 10 },
        "noiseLevel"   : { name: "noiseLevel"   , active: true  , method: parseNoiseLevel   , value: null , type: "number"  , tolerance: 10 }
    };

    return function (readings) {

        readings.forEach(function (r) {
            var sensor = _sensor[r.meaning];

            if (sensor.active) {
                var value = sensor.method(r.value);

                if (value && value != sensor.value) { //&& toleranceOk(sensor, value)) {
                    sensor.value = value;
                    // if (sensor.name == "luminosity")
                        console.log("Emit: '%s' -> %s", sensor.name, sensor.value);
                    _io.emit(sensor.name, sensor.value);
                }
            }
        });
    };

    /* tmp */
    function toleranceOk (sensor, value) {
        var prevValue = sensor.value;

        if (sensor.name == "color") {

        } else {
        }
    }

    /* clean raws sensors values */
    function parseProximity (value) { return Math.floor(value / 2048 * 100); }

    function parseLuminosity (value) { return Math.floor(value / 2048 * 100); }

    function parseColor(value) {
        var red = value.red;
        var green = value.green;
        var blue = value.blue;

        if (!red && !green && !blue)
            return null;

        red *= 2 / 3;
        var max = Math.max(red, Math.max(green, blue));
        return {
            r: red ? parseInt(red / max * 255): 0,
            g: green ? parseInt(green / max * 255) : 0,
            b: blue ? parseInt(blue / max * 255) : 0
        };
    }

    function parseTemperature (value) { return value; }

    function parseHumidity (value) { return value; }

    function parseAcceleration (value) { return value; }

    function parseAngularSpeed (value) { return value; }

    function parseNoiseLevel (value) { return value; }

})();

function wtfColor(color) {
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
