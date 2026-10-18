
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./src/config/db.js";
import Admin from "./src/modules/auth/admin.model.js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });

try {
  const email = "afeefmaliyekkal14@gmail.com";
  const password = await rl.question("New admin password: ");

  if (
    Buffer.byteLength(password, "utf8") < 6 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error("Password must be 6–72 bytes.");
  }

  await connectDB();

  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new Error("Admin email not found. No changes made.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.updateOne(
    { _id: admin._id },
    { $set: { passwordHash, passwordChangedAt: new Date() } }
  );

  console.log("Admin password updated successfully.");
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
