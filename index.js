console.log("Loading event");
var aws = require('aws-sdk');
var iotData = new aws.IotData({endpoint: 'Your endpoint'});


/*
 *  The main
 */
exports.handler = function(event, context) {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
    if (event.session.new) {
        onSessionStarted({requestId: event.request.requestId}, event.session);
    }
    if (event.request.type === "LaunchRequest") {
        onLaunch(event.request,
                 event.session,
                 function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                 });
    }  else if (event.request.type === "IntentRequest") {
        onIntent(event.request,
                 event.session,
                 function callback(sessionAttributes, speechletResponse) {
                     context.succeed(buildResponse(sessionAttributes, speechletResponse));
                 });
    } else if (event.request.type === "SessionEndedRequest") {
        onSessionEnded(event.request, event.session);
        context.succeed();
    }
};


/*  **************************
 *      The differents functions called by alexa skills are here.
 *      I used getVolume with a connected coffee machine, on the shadow, 
 *      lastVolume is the last distance between the ultrasonic sensor in the water tank and the water 
 *  **************************/

function getVolume(intent, session, callback)
{
    // repromptText is the text that will be shown in the console front end console
    var repromptText = null;

    var sessionAttributes = {};

    // Here is a function that will say the amount of cups left in the coffee machine.


    iotData.getThingShadow({
        "thingName" : "coffeeMachine",
    }, function(err, data) {

        // speechOutput is the text that Alexa will say. In this case she will say the amount of cups
        var speechOutput;
        console.log("getVolume - ERROR:" , err);
        console.log("getVolume - DATA:" , JSON.stringify(data));

        // Very hard mathematics here, lastVolume is the distance between the sensor and the water level, 1 cup is equal to 1 cm
        // and the tank is empty at 18 cm. So 1 cup is equal to 18 - lastVolume.
        var cups = 18 - parseInt(JSON.parse(data.payload).state.reported.lastVolume);

        if (cups >= 1)
        {
           speechOutput = "There is " + cups + " lefts in the machine, bro.";
        }
        else
        {
            speechOutput = "I am sorry bro, the machine is empty , you should refill it.";
        }
        var shouldEndSession = true;
        //  The callback will finish the function and send the datas back to Alexa
        callback(sessionAttributes, buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    });
}

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
            ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
            ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the chef helper bro, ask me get the volume";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please ask me to get the volume";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
            ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("getVol" === intentName)
    {
        getVolume(intent, session, callback);
    }
    else if ("AMAZON.HelpIntent" === intentName) {
        onLaunch(intentRequest, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
            ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}


/*
 *  The following is the model of response that Alexa takes, it has to stay like that, I guess
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}