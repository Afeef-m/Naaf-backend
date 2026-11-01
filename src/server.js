import dns from "node:dns";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
}

startServer();
