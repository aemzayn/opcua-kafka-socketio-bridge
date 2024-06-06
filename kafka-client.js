/**
 * kafka client take data from topic and distributed to web socket rooms
 */
const { Kafka } = require("kafkajs");
const { io } = require("socket.io-client");
require("dotenv").config();

const socketEndpoint = process.env.SOCKET_ENDPOINT || "http://localhost:3001";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafkaTopic = process.env.KAFKA_TOPIC || "sdata";
const debugMode = process.env.DEBUG_MODE === "true";

// connect to socket
const socket = io(socketEndpoint);

// create kafka client
const kafka = new Kafka({
  clientId: "kafka2socket",
  brokers: [kafkaBroker],
});

// connect to kafka as consumer
const consumer = kafka.consumer({
  groupId: "kafka2socket-group",
});
(async () => {
  await consumer.connect();
  console.log("kafka consumer connected");
})();

const dataid = ["ns=2;s={60327ECD-4EAC-4C32-8671-368665DF2FBE}"];

(async () => {
  await consumer.subscribe({ topic: kafkaTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      if (debugMode) {
        if (dataid.includes(data.dataid)) {
          console.log(`received message ${data.dataid}`);
        }
      }
      socket.emit("data", data);
    },
  });
})();
