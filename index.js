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
	var gearRatioA = req.body.inputGearRatioA;
	var gearRatioB = req.body.inputGearRatioB;
	var gearServiceFactor = req.body.inputGearServiceFactor;
	var gearServiceClass = req.body.inputGearServiceClass;

	//This variable controls whether or not the motor will work.
	var status = true;

	//Start checking that motor.
	var phaseTestResults = testPhase(phase);

	var rpmTestResults = testRPM(RPM, gearRatioA, gearRatioB);

	var torqueTestResults = testTorque(torque);

	// winston.info(phaseTestResults);
	// winston.info(rpmTestResults);

	var messages = {
		'phase': phaseTestResults.response,
		'rpm': rpmTestResults.response,
		'torque': torqueTestResults.response
	};

	var statuses = {
		'phase': phaseTestResults.status,
		'rpm': rpmTestResults.status,
		'torque': torqueTestResults.status
	};

	status = checkStatuses(status, statuses);

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
		gearRatioA: gearRatioA,
		gearRatioB: gearRatioB,
		gearServiceFactor: gearServiceFactor,
		gearServiceClass: gearServiceClass,

		messages: messages,
		statuses: statuses
	});
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

/**
 * checkStatuses
 * Checks the statuses object to see if there are any false ones. False = Motor no worky
 * @param boolean status The current status
 * @param object statuses
 * @return boolean
 */
function checkStatuses(status, statuses){
	winston.info(statuses);
	for(var key in statuses){
		// skip loop if the property is from prototype
		if (!statuses.hasOwnProperty(key)) continue;

		winston.info(statuses[key]);
		if(statuses[key] === false){
			status = false;
		}
	}

	return status;
}

/**
 * testPhase
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
	var status = true;
	if(phase === "3"){
		message = "Your motor will need a special industrial plug. It will NOT work in a common household plug without some hacking. Are you ready? Check out this link for more.";
	}
	return buildResponse(status, message);
}

/**
 * testRPM
 * The RPM test checks to see if the motor is going to run within a range of acceptable values.
 * Formula:
 * Check to ensure the RPM (after gearbox, if exists, is considered) is going to run at an acceptable speed.
 * Acceptable speeds range from 60-80 RPM.
 * @param RPM
 * @param gearRatioA
 * @param gearRatioB
 * @return object (See buildResponse)
 */
function testRPM(RPM, gearRatioA, gearRatioB){
	var message = "";
	var acceptableRange = [60,80];
	var status = true;
	if(RPM < acceptableRange[0]){
		message = "This motor may work, but " + RPM + " RPMs is awfully slow. It may be too slow.";
		status = false;
	}
	if(RPM > acceptableRange[1]){
		message = "Unfortunately, " + RPM + " RPMs is too fast. You may want to look into getting a gearbox or possibly a different gearbox.";
		status = false;
	}

	//The RPMs are fine.
	if(RPM >= acceptableRange[0] && RPM <= acceptableRange[1]){
		message = "It seems like you might have found one. Running at " + RPM + " RPMs will totally work!";
		status = true;
	}

	//Test the RPM with gear ratio
	if(gearRatioB > 0 && gearRatioB !== ""){
		var withGearbox = (RPM/gearRatioB);
		if( withGearbox < acceptableRange[0]){
			message = "This motor may work. But even with the gearbox, the motor will be running at " + withGearbox + " RPMs, which is awfully slow. It may be too slow. We'd recommend trying another gearbox.";
			status = false;
		}
		if( withGearbox > acceptableRange[1]){
			message = "Bummer :( Even with the gearbox, the motor will be running at " + withGearbox + " RPMs, which is too fast. We'd recommend changing the gearbox.";
			status = false;
		}

		//The RPMs are fine.
		if(withGearbox >= acceptableRange[0] && withGearbox <= acceptableRange[1]){
			message = "It seems like you might have found one. Running at " + withGearbox + " RPMs will totally work!";
			status = true;
		}
	}
	return buildResponse(status, message);
}

/**
 * testMotorVoltage
 * This cheks to see if the motor is 3 phase or single phase based on the voltage. It'll also calculate RPMs based on the voltage.
 * @param
 * @return object (See buildResponse)
 */
 function testMotorVoltage(){

 }

/**
 * testTorque
 * Tests to see if the motor torque is within a desired range.
 * @param torque
 * @return
 */
function testTorque(torque){
	var message = "";
	var acceptableRange = [20,60];
	var status = true;
	if(torque < acceptableRange[0]){
		message = "A torque of " + torque + " Newton meters is too low. It may not have enough power.";
		status = false;
	}
	if(torque > acceptableRange[1]){
		message = "This motor is a beast. " + torque + " Newton meters of torque is plenty.";
		status = true;
	}

	//The RPMs are fine.
	if(torque >= acceptableRange[0] && torque <= acceptableRange[1]){
		message = "Great! This motor sits fine at " + torque + " Newton meters of torque. It's within the acceptable range of " + acceptableRange[0] + " to " + acceptableRange[1] + " Newton meters of torque.";
		status = true;
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
