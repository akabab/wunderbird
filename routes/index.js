var express = require('express');
var router = express.Router();

var Relayr = require('../lib/Relayr');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
  // res.render('index', { title: 'Express' });
});

router.get('/devices', function (req, res, next) {
  res.render('devices', { title: 'Devices', sensors: Relayr.getSensors() });
});

router.get('/setup', function (req, res, next) {
  res.render('setup');
});


module.exports = router;
