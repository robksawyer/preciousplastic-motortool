var express = require('express'),
	app = express();
	// expressLayouts = require('express-ejs-layouts');

/*
 * body-parser is a piece of express middleware that
 *	 reads a form's input and stores it as a javascript
 *	 object accessible through `req.body`
 *
 * 'body-parser' must be installed (via `npm install --save body-parser`)
 * For more info see: https://github.com/expressjs/body-parser
 */
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser());

// app.use(expressLayouts);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// app.set('layout', __dirname +  '/layouts/single'); // defaults to 'layout'

app.get('/', function(request, response) {
	response.render('pages/index');
});

app.post('/', function(req, res){
	console.log(req.body);
	var shopVolts = req.body.optionsShopVoltage;
	var motorVolts = req.body.optionsMotorVoltage;
	var brand = req.body.inputBrand;
	var phase = req.body.optionsPhase;
	var RPM = req.body.inputRPM;
	var power = req.body.inputPower;
	var torque = req.body.inputTorque;
	var amps = req.body.inputAmps;
	var gearRatio = req.body.inputGearRatio;
	var gearServiceFactor = req.body.inputGearServiceFactor;
	var gearServiceClass = req.body.inputGearServiceClass;

	//This variable controls whether or not the motor will work.
	var status = false;

	res.render('pages/results', {
		status: status,
		shopVolts: shopVolts,
		motorVolts: motorVolts,
		brand: brand,
		phase: phase,
		RPM: RPM,
		power: power,
		torque: torque,
		amps: amps,
		gearRatio: gearRatio,
		gearServiceFactor: gearServiceFactor,
		gearServiceClass: gearServiceClass
	});
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
