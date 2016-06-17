var express = require('express'),
	app = express();
	// expressLayouts = require('express-ejs-layouts');

/**
 * https://github.com/winstonjs/winston
 */
var winston = require('winston');

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

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// app.use(expressLayouts);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// app.set('layout', __dirname +  '/layouts/single'); // defaults to 'layout'

app.get('/', function(req, res) {
	res.render('pages/index');
});

app.post('/results', urlencodedParser, function(req, res){
	if (!req.body) return res.sendStatus(400);

	var shopVolts = req.body.optionsShopVoltage;
	var motorVolts = req.body.inputMotorVoltage;
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

	//Start checking that motor.
	var phaseTestResults = testPhase(phase);

	winston.info(phaseTestResults);

	var messages = {
		'phase': phaseTestResults.response
	};

	winston.info(messages.length);
	winston.info(messages.phase);

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
		gearServiceClass: gearServiceClass,

		messages: messages
	});
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

/**
 * The phase test checks to see if the motor phase will work with the shop outlet.
 * Formula:
 * Single phase motors will work with 110V - 220V (common plugs).
 * 3 phase motors need a special plug
 * @param shopVolts
 * @param phase
 * @return object (See buildResponse)
 */
function testPhase(phase){
	var message = "";
	var status = false;
	winston.info(phase);
	if(phase === "3"){
		message = "Your motor will need a special industrial plug. It will NOT work in a common household plug without some hacking. Are you ready? Check out this link for more.";
	}
	return buildResponse(status, message);
}

/**
 * This is a helper method that builds a proper response.
 * @param status
 * @param data
 * @return array
 */
function buildResponse(status, data){
	return {
		status: status,
		response: data
	};
}
