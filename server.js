const { OPCUAServer, Variant, DataType, StatusCodes } = require("node-opcua");
const os = require("os");

function availableMemory() {
  const percentageMemUsed = (os.freemem() / os.totalmem()) * 100;
  return percentageMemUsed;
}

async function runServer() {
  const server = new OPCUAServer({
    port: 4841,
    resourcePath: "/UA/AhmadServer",
    hostname: "localhost",
    allowAnonymous: true,
    buildInfo: {
      productName: "AhmadServer",
      buildNumber: "1",
      buildDate: new Date(1999, 2, 22),
    },
  });
  await server.initialize();

  const addressSpace = server.engine.addressSpace;
  const namespace = addressSpace.getOwnNamespace();

  const device = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    browseName: "Device",
  });

  let variable1 = 1;
  setInterval(() => {
    variable1 += 1;
  }, 500);

  namespace.addVariable({
    componentOf: device,
    browseName: "Variable1",
    dataType: "Double",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: variable1 }),
    },
  });

  let variable2 = 10.0;
  namespace.addVariable({
    componentOf: device,
    nodeId: "ns=1;s=Variable2",
    browseName: "Variable2",
    dataType: "Double",
    minimumSamplingInterval: 1000,
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: variable2 }),
      set: (variant) => {
        variable2 = parseFloat(variant.value);
        return StatusCodes.Good;
      },
    },
  });

  namespace.addVariable({
    componentOf: device,
    nodeId: "ns=1;s=Memory",
    browseName: "Memory",
    dataType: "Double",
    value: {
      get: () =>
        new Variant({ dataType: DataType.Double, value: availableMemory() }),
    },
  });

  server.start(() => {
    console.log(`Server is now listening on port ${server.endpoints[0].port}`);
    const endpointUrl =
      server.endpoints[0].endpointDescriptions()[0].endpointUrl;
    console.log("The primary server endpoint url is ", endpointUrl);
  });
}

runServer().catch((err) => {
  console.error(err);
});
