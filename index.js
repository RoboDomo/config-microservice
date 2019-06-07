process.env.DEBUG = "config";
process.title = "config-microservice";

if (!process.env.ROBODOMO_MONGODB) {
  throw new Error("ENV ROBODOMO_MONGODB not set");
}

const fs = require("fs"),
  debug = require("debug")("config");

const MongoClient = require("mongodb").MongoClient,
  url = process.env.ROBODOMO_MONGODB;

const config = require("./Config.js"),
  macros = require("./macros.js");

const HostBase = require("microservice-core/HostBase");

const host = process.env.MQTT_HOST || "mqtt://robodomo",
  topic = process.env.MQTT_TOPIC || "settings";

class ConfigHost extends HostBase {
  constructor(config) {
    super(host, topic);
    this.config = config;
    this.state = config;
    //    console.log("state", this.state);
    this.state = { config: config };
  }
  async command() {}
}

const main = async () => {
  config._id = "config";
  macros._id = "macros";
  const configs = {};
  debug("connecting to ", url);
  MongoClient.connect(url, { useNewUrlParser: true }, async function(
    err,
    database
  ) {
    debug("Connected");
    await database
      .db("settings")
      .collection("config")
      .replaceOne({ _id: "config" }, config, { upsert: true });
    await database
      .db("settings")
      .collection("config")
      .replaceOne({ _id: "macros" }, macros, { upsert: true });
    configs["config"] = new ConfigHost(config);
  });

  // if a file in this director is changed on disk, exit/restart (forever)
  fs.watch("./", (eventType, filename) => {
    debug("eventType", eventType, "filename", filename);
    debug("restarting");
    process.exit(0);
  });
};
main();
