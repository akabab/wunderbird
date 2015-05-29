var Relayr = require('relayr');

var app_id = "ebbfdbc5-bd8c-4f8b-ace8-bd47eb148032";
var token = "s6a5iDII7mgyiTDP1QBhWGChc-GSWLJA";
var user_id = "6ab28983-f8b9-43b1-8f5c-82f3ec65f851";

var devices = [
    {name: "light", id: "d59fd4d9-e2b0-4ce5-9f62-076845fadf95"},
    {name: "temp", id: "2f79f0c1-10df-4950-9b67-bc3c80bb3ae1"},
    {name: "sound", id: "4500d880-02f2-4bb9-a4e1-0af540ed69a7"},
    {name: "accel", id: "b5b98a5b-731c-40da-81b6-3c8dc2742e5d"}
];

var _sensor = {
    "proximity"    : { name: "proximity"    , active: false , method: parseProximity    , value: null , type: "percent" , tolerance: 10 },
    "luminosity"   : { name: "luminosity"   , active: true  , method: parseLuminosity   , value: null , type: "percent" , tolerance: 10 },
    "color"        : { name: "color"        , active: true  , method: parseColor        , value: null , type: "{r,g,b}" , tolerance: 10 },
    "temperature"  : { name: "temperature"  , active: true  , method: parseTemperature  , value: null , type: "percent" , tolerance: 10 },
    "humidity"     : { name: "humidity"     , active: true  , method: parseHumidity     , value: null , type: "percent" , tolerance: 10 },
    "acceleration" : { name: "acceleration" , active: true  , method: parseAcceleration , value: null , type: "?"       , tolerance: 10 },
    "angularSpeed" : { name: "angularSpeed" , active: false , method: parseAngularSpeed , value: null , type: "?"       , tolerance: 10 },
    "noiseLevel"   : { name: "noiseLevel"   , active: true  , method: parseNoiseLevel   , value: null , type: "number"  , tolerance: 10 }
};

module.exports = {
    setIO: function(io) {
        _io = io;
    },

    getIO: function () {
        return _io;
    },

    getSensors: function () {
        return _sensor;
    },

    toggleSensor: function (name) {
        if (_sensor[name]) {
            return _sensor[name].active = !_sensor[name].active;
        }
    },

    emitAll: function () {
        if (_io) {
            for (var key in _sensor) {
                var s = _sensor[key];
                if (s.active && s.value !== null) {
                    _io.emit(s.name, s.value);
                }
            }
        }
    },

    start: start
};

var relayr = new Relayr(app_id);

function start ()  {
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
};


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

var handleReadings = function (readings) {
    readings.forEach(function (r) {
        var sensor = _sensor[r.meaning];

        if (sensor.active) {
            var value = sensor.method(r.value);

            if (value) {// && value != sensor.value) { //&& toleranceOk(sensor, value)) {
                sensor.value = value;
                // console.log("Emit: '%s' -> %s", sensor.name, sensor.value);
                // if (sensor.name === "acceleration") {
                //     console.log(sensor.value);
                // }
                _io.emit(sensor.name, sensor.value);

                /* device page */
                _io.emit('device-value', {name: sensor.name, value: sensor.value});
            }
        }
    });

    /* tmp */
    function toleranceOk (sensor, value) {
        var prevValue = sensor.value;

        if (sensor.name == "color") {

        } else {
        }
    }
};

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
