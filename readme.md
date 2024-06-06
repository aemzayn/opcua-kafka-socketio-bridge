# OPC + Kafka + Websockets

Subscribe data from opcua and distribute the data to web socket client through kafka

# Requirements

1. Kafka installed
2. OPC server connection (you can make your own server! see [here](##Creating-your-own-opc-server))
3. Postgres database to stored subscribed node Ids
   Table structure:
   - `id` primary key
   - `node_id` string unique

## Architecture

1. Kafka
   Used as data streaming platform to send data from opc to kafka consumers
2. Websocket
   Data from kafka are distributed to clients using websocket

## File structures

1. `index.js`  
   Contain OPC client, pg client and kafka producer
2. `kafka-client.js`  
   Kafka client which subscribe from topic and send data to websocket
3. `socket-server.js`  
   The main socket server, distributed data based on dataid to each rooms
4. `socket-client.js`  
   Act as client for simple presentation, even though there are multiple dataid coming from opcua, this client will only get the client requested dataid's data

## How to start

1. Start your zookeeper and kafka
2. Start `index.js` file => `node index.js`
3. Start `socket-server.js` => `node socket-server.js`
4. Start `socket-client.js` => `node socket-client.js`
5. Finally start `kafka-client.js` => `node kafka-client.js`

You can change, or add the node id in socket-client to whatever you want.

## Creating your own opc server

You can create your own opc server, see the example in [server.js](server.js)
