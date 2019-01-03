'use strict';
const AWS = require('aws-sdk');
const Alexa = require("alexa-sdk");
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = "amzn1.ask.skill.6e3048e3-c33b-4927-a0d1-ceaf64f6f0d4";
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'LaunchRequest': function () {
    this.emit(':ask',"Do you want to add, retrieve or delete any Event for today?");
  },
  'Unhandled': function () {
    this.emit('AMAZON.HelpIntent');
  },
  'Add': function(){
    this.emit(':ask','Okay, Cool. Go ahead.');
    this.emit('AddEvent');
  },
  'Retrieve': function(){
    this.emit(':ask','Okay, Cool. Go ahead.');
    this.emit('RetrieveEvent');
  },
  'Delete': function(){
    this.emit(':ask','Okay, Cool. Go ahead.');
    this.emit('DeleteEvent');
  },
  'AddEvent': function () {

    var event = this.event.request.intent.slots.event.value;
    var person = this.event.request.intent.slots.person.value;
    var date = this.event.request.intent.slots.date.value;
    var duration =  this.event.request.intent.slots.duration.value;
    var time =  this.event.request.intent.slots.time.value;
    
    if((typeof(event) != "undefined") || (typeof(date) != "undefined")){

      const dynamodbParams = {
        TableName: 'Event_Table',
        Key: 'event',
        Item: {
          event: event,
          person: person,
          date: date,
          duration: duration,
          time: time,
          
        },
      };

    console.log('Attempting to add expense', dynamodbParams);  
      
    dynamoDb.put(dynamodbParams).promise()
    .then(data => {
      this.emit(':ask', 'Event Saved Successfully. Do you have more to add?');
      this.emit('AddEvent');
    })
    .catch(err => {
      console.error(err);
      this.emit(':tell', 'Sad, we have a problem.'+err);
    });

    }else{
      this.emit('NoMatch');
    }
  },
  
  'RetrieveEvent': function(){
    var event = this.event.request.intent.slots.event.value;
    var date = this.event.request.intent.slots.date.value;
    var duration =  this.event.request.intent.slots.duration.value;
    const dynamodbParams = {
        TableName: 'Event_Table',
        Key: {
          'event':event,
        },
        AttributesToGet: [
        'event',
        'person',
        'date',
        'duration',
        'time',
      ],
      };
      dynamoDb.get(dynamodbParams).promise()
      .then(data => {
      const e = data.Item;
      if((typeof(e.person) != "undefined") && (typeof(e.date) != "undefined")){
      this.emit(':ask', 'Here is the Event: '+e.event+' of '+e.person+' on '+e.date+' .Do you want to retrieve something else?' );
      }
      else if((typeof(e.date) != "undefined")){
        this.emit(':ask', 'Here is the Event: '+e.event+' on '+e.date+' .Do you want to retrieve something else?' );
      }
      else if((typeof(e.person) != "undefined")){
      this.emit(':ask', 'Here is the Event: '+e.event+' of '+e.person+' .Do you want to retrieve something else?' );  
      }
      else{
      this.emit(':ask', 'Here is the Event: '+e.event+' .Do you want to retrieve something else?' );
      }
      this.emit('RetrieveEvent');
      })
      .catch(err => {
      console.error(err);
      this.emit(':tell', 'Sad, we have a problem.'+err);
      });
},
    
  'DeleteEvent': function(){
     var event = this.event.request.intent.slots.event.value;
      const dynamodbParams = {
        TableName: 'Event_Table',
        Key: {
          'event':event,
        }
      };
      dynamoDb.delete(dynamodbParams).promise()
      .then(data => {
      this.emit(':ask', 'Event deleted successfully. Do you want to delete something else?');
      this.emit('DeleteEvent');
      })
      .catch(err => {
      console.error(err);
      this.emit(':tell', 'Sad, we have a problem.'+err);
      });
  },
      
  'AMAZON.YesIntent': function () {
    this.emit('Prompt');
  },
  'AMAZON.NoIntent': function () {
    this.emit('AMAZON.StopIntent');
  },
  'Prompt': function () {
    this.emit(':ask', 'Please say me an Event to add', 'Please say that again?');
  },
  'NoMatch': function () {
    this.emit(':ask', 'Sorry, I couldn\'t understand.', 'Please say that again?');
  },
  'AMAZON.HelpIntent': function () {
    const speechOutput = 'You need to mention the Event to add, retrieve or to delete. You can say something like: I am going for wedding today for adding. Retrieve wedding to retrieve. Delete wedding to delete it';
    const reprompt = 'Say hello, to hear me speak.';

    this.response.speak(speechOutput).listen(reprompt);
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak('Goodbye!');
    this.emit(':responseReady');
  },
  'AMAZON.StopIntent': function () {
    this.response.speak('See you later!');
    this.emit(':responseReady');
  }
};