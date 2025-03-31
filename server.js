const mongoose = require("mongoose");

// Check Node version
const [major, minor] = process.versions.node.split(".").map(parseFloat);
if (major < 10 || (major === 10 && minor <= 0)) {
  console.log("Please go to nodejs.org and download version 10 or greater. 👌\n ");
  process.exit();
}

// Load environment variables
require("dotenv").config({ path: ".variables.env" });

// Connect to MongoDB (clean version)
async function connectToDB() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
}

connectToDB();

mongoose.Promise = global.Promise;
mongoose.connection.on("error", (err) => {
  console.error(`🚫 Error → : ${err.message}`);
});

// Load all models
const glob = require("glob");
const path = require("path");

glob.sync(path.join(__dirname, "models", "*.js")).forEach((file) => {
  require(file);
});
console.log("✅ All Mongoose models loaded.");
// Start app
const app = require("./app");
app.set("port", process.env.PORT || 80);
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});
