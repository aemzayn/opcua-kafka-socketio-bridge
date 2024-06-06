const {
  AttributeIds,
  ClientSubscription,
  OPCUAClient,
  TimestampsToReturn,
} = require("node-opcua");
const dayjs = require("dayjs");
const { Client } = require("pg");
const { Kafka } = require("kafkajs");
require("dotenv").config();

const opcEndpoint = process.env.OPC_ENDPOINT;
const kafkaTopic = process.env.KAFKA_TOPIC;
const kafkaBroker = process.env.KAFKA_BROKER;
const kafkaClientId = process.env.KAFKA_CLIENT_ID;

const pgHost = process.env.PG_HOST;
const pgDatabase = process.env.PG_DATABASE;
const pgUser = process.env.PG_USER;
const pgPassword = process.env.PG_PASSWORD;
const pgPort = process.env.PG_PORT;
const pgTable = process.env.PG_TABLE;

// connect to kafka
const kafka = new Kafka({
  clientId: kafkaClientId,
  brokers: [kafkaBroker],
});

const producer = kafka.producer();
(async () => {
  await producer.connect();
  console.log("kafka connected");
})();

// callback function for data change from opcua
function makeCallback({ id, name }) {
  return function (dataValue) {
    const time = formatTime(dataValue.serverTimestamp);
    const value = Number(dataValue.value.value.toString());
    if (isNaN(value)) return;

    // send to kafka
    producer
      .send({
        topic: kafkaTopic,
        messages: [
          {
            value: JSON.stringify({
              dataid: id,
              ze1: time,
              value: value,
              interval: "0",
              type: "0",
            }),
          },
        ],
      })
      .then(() => {
        console.log(name, "\t\t\t time: ", time, "\t\t\t value: ", value);
      });
  };
}

async function getNodeIds(nodeLimit = 10) {
  const client = new Client({
    user: pgUser,
    host: pgHost,
    database: pgDatabase,
    password: pgPassword,
    port: pgPort,
  });
  await client.connect();

  const res = await client.query(
    `SELECT name, node_id FROM "${pgTable}" ORDER BY id LIMIT ${nodeLimit}`
  );
  await client.end();
  return res.rows;
}

async function main() {
  const ids = await getNodeIds(100);
  const client = OPCUAClient.create({
    endpointMustExist: false,
  });
  await client.connect(opcEndpoint);
  const session = await client.createSession();

  const subscription = ClientSubscription.create(session, {
    requestedPublishingInterval: 150,
    requestedLifetimeCount: 10 * 60 * 10,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 2,
    publishingEnabled: true,
    priority: 6,
  });

  subscription.on("terminated", () => {
    console.log("subscription terminated");
  });

  ids.forEach(async (item) => {
    const id = item.node_id;
    const monitoredItem = await subscription.monitor(
      {
        nodeId: id,
        attributeId: AttributeIds.Value,
      },
      {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10,
      },
      TimestampsToReturn.Both
    );
    monitoredItem.on("changed", makeCallback({ id: id, name: item.name }));
  });

  console.log("subscription created");
}

main().catch((err) => {
  console.error(err);
});

function formatTime(time) {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}
