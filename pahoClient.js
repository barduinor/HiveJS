/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 *
 * The Eclipse Public License is available at
 *    http://www.eclipse.org/legal/epl-v10.html
 * and the Eclipse Distribution License is available at
 *   http://www.eclipse.org/org/documents/edl-v10.php.
 *
 * Contributors:
 *    James Sutton - Initial Contribution
 *******************************************************************************
 * Modified for OutSystems by Barduino
 *******************************************************************************/

/*
Eclipse Paho MQTT-JS Utility
This utility can be used to test the Eclipse Paho MQTT Javascript client.
*/

// Create a client instance
pahoClient = null;
statusSpan = null;
connected = false;

messageCallBack = null;

// called when the client connects
function onConnect(context) {
  // Once a connection has been made, make a subscription and send a message.
  console.log("Client Connected");
  //var statusSpan = document.getElementById("connectionStatus");
  if(statusSpan)
    statusSpan.innerHTML = "Connected to: " + context.invocationContext.host + ':' + context.invocationContext.port + context.invocationContext.path + ' as ' + context.invocationContext.clientId;
  connected = true;
  //setFormEnabledState(true);


}

function onFail(context) {
  console.log("Failed to connect");
  //var statusSpan = document.getElementById("connectionStatus");
  if(statusSpan)
    statusSpan.innerHTML = "Failed to connect: " + context.errorMessage;
  connected = false;
  //setFormEnabledState(false);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Connection Lost: " + responseObject.errorMessage);
  }
  connected = false;
}

// called when a message arrives
function onMessageArrived(message) {
  console.log('Message Recieved: Topic: ', message.destinationName, '. Payload: ', message.payloadString, '. QoS: ', message.qos);
  console.log(message);
  
  if (messageCallBack)
    messageCallBack(message);
}

function connectionToggle(){

  if(connected){
    pahoDisconnect();
  } else {
    pahoConnect();
  }


}


function pahoConnect(hostname,port,clientId,path,user,pass,keepAlive,timeout,ssl,cleanSession,lastWillTopic,lastWillQos,lastWillRetain,lastWillMessage,statusSpanId){
    if(document.getElementById(statusSpanId))
        statusSpan = document.getElementById(statusSpanId);
    
    if(path.length > 0){
      pahoClient = new Paho.MQTT.Client(hostname, Number(port), path, clientId);
    } else {
      pahoClient = new Paho.MQTT.Client(hostname, Number(port), clientId);
    }
    console.info('Connecting to Server: Hostname: ', hostname, '. Port: ', port, '. Path: ', pahoClient.path, '. Client ID: ', clientId);

    // set callback handlers
    pahoClient.onConnectionLost = onConnectionLost;
    pahoClient.onMessageArrived = onMessageArrived;


    var options = {
      invocationContext: {host : hostname, port: port, path: pahoClient.path, clientId: clientId},
      timeout: timeout,
      keepAliveInterval:keepAlive,
      cleanSession: Boolean(cleanSession == 'True'),
      useSSL: Boolean(ssl == 'True'),
      onSuccess: onConnect,
      onFailure: onFail
    };



    if(user.length > 0){
      options.userName = user;
    }

    if(pass.length > 0){
      options.password = pass;
    }

    if(lastWillTopic.length > 0){
      var lastWillMessage = new Paho.MQTT.Message(lastWillMessage);
      lastWillMessage.destinationName = lastWillTopic;
      lastWillMessage.qos = lastWillQos;
      lastWillMessage.retained = Boolean(lastWillRetain == 'True');
      options.willMessage = lastWillMessage;
    }

    // connect the client
    pahoClient.connect(options);
    //var statusSpan = document.getElementById("connectionStatus");
    if(statusSpan)    
        statusSpan.innerHTML = 'Connecting...';
}

function pahoDisconnect(){
    console.info('Disconnecting from Server');
    pahoClient.disconnect();
    //var statusSpan = document.getElementById("connectionStatus");
    if(statusSpan)
        statusSpan.innerHTML = 'Connection - Disconnected.';
    connected = false;
    //setFormEnabledState(false);

}

function pahoPublish(topic,qos,message,retain){

    console.info('Publishing Message: Topic: ', topic, '. QoS: ' + qos + '. Message: ', message);
    message = new Paho.MQTT.Message(message);
    message.destinationName = topic;
    message.qos = Number(qos);
    message.retained = Boolean(retain == 'True');
    pahoClient.send(message);
}


function pahoSubscribe(topic,qos, subscribeCallback){

    console.info('Subscribing to: Topic: ', topic, '. QoS: ', qos);
     
    pahoClient.subscribe(topic, {qos: Number(qos)});
    messageCallBack = subscribeCallback;
    if(statusSpan)
        statusSpan.innerHTML = 'Subscribed to: Topic: '+ topic+ '. QoS: '+ qos;
}

function pahoUnsubscribe(topic){
    //var topic = document.getElementById("subscribeTopicInput").value;
    console.info('Unsubscribing from ', topic);
    if(statusSpan)
        statusSpan.innerHTML = 'Unsubscribing from '+ topic;
    pahoClient.unsubscribe(topic, {
         onSuccess: unsubscribeSuccess,
         onFailure: unsubscribeFailure,
         invocationContext: {topic : topic}
     });
}


function unsubscribeSuccess(context){
    console.info('Successfully unsubscribed from ', context.invocationContext.topic);
}

function unsubscribeFailure(context){
    console.info('Failed to  unsubscribe from ', context.invocationContext.topic);
}

// Just in case someone sends html
function safe_tags_regex(str) {
   return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
