// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")
const { CustomQuestionAnswering } = require('botbuilder-ai');

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.QnAMaker = new CustomQuestionAnswering(configuration.QnAConfiguration, qnaOptions);
       
        // create a DentistScheduler connector
        this.dentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration);
      
        // create a IntentRecognizer connector
        this.intentRecognizer = new IntentRecognizer(configuration.CLUConfiguration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.QnAMaker.getAnswers(context);

            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const cluResult = await this.intentRecognizer.executeCluQuery(context);
                     
            // determine which service to respond with based on the results from LUIS //

            if(cluResult.result.prediction.topIntent === "GetAvailability") {
                const availability = await this.dentistScheduler.getAvailability();
                await context.sendActivity("We have the following appointments available today." + availability);
            } else if(cluResult.result.prediction.topIntent === "ScheduleAppointment") {
                const time = this.intentRecognizer.getTimeEntity(cluResult);
                if(!time) {
                    await context.sendActivity("Please specify a time that is available to schedule your appointment.");    
                } else {
                    const response = await this.dentistScheduler.scheduleAppointment(time);
                    await context.sendActivity(response);
                }
            } else {
                //No intent recognized.
                await context.sendActivity("No intent recognized.");
            }
            
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Hello, welcome to the Dental offices of Contoso.  You can check availability for appointments and you can also schedule appointments.';
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
