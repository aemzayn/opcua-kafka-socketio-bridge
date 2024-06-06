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

const dataid = [
  "ns=2;s={60327ECD-4EAC-4C32-8671-368665DF2FBE}",
  "ns=2;s={6138CE1D-ABF1-4635-B8E1-2C3FCC4992F6}",
  "ns=2;s={998AD6B2-9FC2-4439-BA26-13F76009AC6E}",
  "ns=2;s={A6D7DDEE-D95E-4E69-8F27-6CE98E22B261}",
  "ns=2;s={E15A467D-0591-4674-8489-089CC15E3E22}",
  "ns=2;s={3732841C-E846-438A-93EC-D73F986174D4}",
  "ns=2;s={CC07B88F-DD99-4C1F-99AB-A867B6393308}",
];

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
