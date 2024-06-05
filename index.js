const {
  AttributeIds,
  ClientSubscription,
  OPCUAClient,
  TimestampsToReturn,
} = require("node-opcua");
const dayjs = require("dayjs");
const { Client } = require("pg");

function formatTime(time) {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

function makeCallback(nodeId) {
  return function (dataValue) {
    const time = formatTime(dataValue.serverTimestamp);
    console.log(
      nodeId.toString(),
      "\t\t\t time: ",
      time,
      "\t\t\t value: ",
      dataValue.value.value.toString()
    );
  };
}

const endpoint = "opc.tcp://172.19.8.71:4841";

async function getNodeIds(nodeLimit = 10) {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "npm_opcua",
    password: "postgres",
    port: 5433,
  });
  await client.connect();

  const res = await client.query(
    `SELECT name, node_id FROM opc_subscriber ORDER BY id LIMIT ${nodeLimit}`
  );
  await client.end();
  return res.rows;
}

async function main() {
  const ids = await getNodeIds(100);
  const client = OPCUAClient.create({
    endpointMustExist: false,
  });
  await client.connect(endpoint);
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
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10,
      },
      TimestampsToReturn.Both
    );
    monitoredItem.on("changed", makeCallback(item.name));
  });

  console.log("subscription created");
}

main().catch((err) => {
  console.error(err);
});
