/**
 * Copyright 2013 dc-square GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author: Christoph Schäbel
 */
 /* Modified for Outsystems by Barduino  */

var mqttClient = {
    'client': null,
    'lastMessageId': 1,
    'lastSubId': 1,
    'subscriptions': [],
    'connected': false,

    'connect': function (host,port,clientId,username,password,keepAlive,timeout,cleanSession,lwTopic,lwQos,lwRetain,lwMessage,ssl,path) {

        if(path.length > 0){
        mqttClient.client = new Paho.MQTT.Client(host, Number(port), path, clientId);
        } else {
        mqttClient.client = new Paho.MQTT.Client(host, Number(port), clientId);
        }
        //mqttClient.client = new Paho.MQTT.Client(host, Number(port), clientId);
        mqttClient.client.onConnectionLost = mqttClient.onConnectionLost;
        mqttClient.client.onMessageArrived = mqttClient.onMessageArrived;

        var options = {
            timeout: timeout,
            keepAliveInterval: keepAlive,
            cleanSession: Boolean(cleanSession == 'True'),
            useSSL: Boolean(ssl == 'True'),
            invocationContext: {host : host, port: port, path: mqttClient.client.path, clientId: clientId},
            onSuccess: mqttClient.onConnect,
            onFailure: mqttClient.onFail
        };

        if (username.length > 0) {
            options.userName = username;
        }
        if (password.length > 0) {
            options.password = password;
        }
        if (lwTopic.length > 0) {
            var willmsg = new Paho.MQTT.Message(lwMessage);
            willmsg.qos = Number(lwQos);
            willmsg.destinationName = lwTopic;
            willmsg.retained = Boolean(lwRetain == 'True');
            options.willMessage = willmsg;
        }

        mqttClient.client.connect(options);
    },

    'onConnect': function (context) {
        mqttClient.connected = true;
        console.log("Connected to: "+context.invocationContext.host+":"+context.invocationContext.port);
        console.log(context);   // debug

    },

    'onFail': function (context) {
        mqttClient.connected = false;
        console.log("Fail to connect: " + context.errorMessage);

    },

    'onConnectionLost': function (responseObject) {
        mqttClient.connected = false;
        if (responseObject.errorCode !== 0) {
            console.log("Connection Lost: " + responseObject.errorMessage);
        }

        //Cleanup subscriptions
        mqttClient.subscriptions = [];
    },

    'onMessageArrived': function (message) {
//        console.log("onMessageArrived:" + message.payloadString + " qos: " + message.qos);

        var subscription = mqttClient.getSubscriptionForTopic(message.destinationName);

        var messageObj = {
            'topic': message.destinationName,
            'retained': message.retained,
            'qos': message.qos,
            'payload': message.payloadString,
            'timestamp': new Date().toISOString(),
            'subscriptionId': subscription.id
            // ,'color': mqttClient.getColorForSubscription(subscription.id)
        };

        console.log(messageObj);
        if(subscription){
            console.log(subscription);
            // TODO: Execute callback of specific subscription
            subscription.callback(messageObj);
        }else {
            console.log('Subscription topic not found:'+message.destinationName);
        }
    },

    'disconnect': function () {
        mqttClient.client.disconnect();
        console.log('Disconnected');
    },

    'publish': function (topic, payload, qos, retain) {

        if (!mqttClient.connected) {
            console.log("Not connected");
            return false;
        }

        var message = new Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = Boolean(retain == 'True');
        mqttClient.client.send(message);
        console.log('Message sent to '+message.destinationName +':'+payload );
        console.log(message);   //debug
    },

    'subscribe': function (topic, qosNr, callback) {

        if (!mqttClient.connected) {
            console.log("Not connected");
            return false;
        }

        if (topic.length < 1) {
            console.log("Topic cannot be empty");
            return false;
        }

        if (_.find(mqttClient.subscriptions, { 'topic': topic })) {
            console.log('You are already subscribed to this topic');
            return false;
        }

        mqttClient.client.subscribe(topic, {qos: qosNr});

        var subscription = {'topic': topic, 'qos': qosNr, 'callback': callback};
        subscription.id = mqttClient.render.subscription(subscription);
        mqttClient.subscriptions.push(subscription);
        
        console.log('Subscribed to: '+subscription.topic);
        console.log(subscription);  // debug
        
        return true;
    },

    'unsubscribe': function (topic) {
        
        var subs = _.find(mqttClient.subscriptions, {'topic': topic});
        mqttClient.client.unsubscribe(subs.topic);
        mqttClient.subscriptions = _.filter(mqttClient.subscriptions, function (item) {
            return item.id != subs.id;
        });
        console.log('Topic unsubscribed: '+ subs.topic);
        console.log(subs);  //debug
    },

    'getSubscriptionForTopic': function (topic) {
        var i;
        for (i = 0; i < mqttClient.subscriptions.length; i++) {
            if (mqttClient.compareTopics(topic, mqttClient.subscriptions[i].topic)) {
                return mqttClient.subscriptions[i];
            }
        }
        return false;
    },

    'compareTopics': function (topic, subTopic) {
        var pattern = subTopic.replace("+", "(.+?)").replace("#", "(.*)");
        var regex = new RegExp("^" + pattern + "$");
        return regex.test(topic);
    },

    'render': {

        'subscriptions': function () {
            mqttClient.render.clearSubscriptions();
            _.forEach(mqttClient.subscriptions, function (subs) {
                subs.id = mqttClient.render.subscription(subs);
            });
        },

        'subscription': function (subscription) {
            var largest = mqttClient.lastSubId++;
            return largest;
        }

    }
};