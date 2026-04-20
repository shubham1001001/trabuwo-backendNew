require("dotenv").config();
const config = require("config");

try {
  const db = config.get("db");
  console.log("DB Config Name:", db.name);
  console.log("DB Config User:", db.user);
  console.log("DB Config Host:", db.host);
  console.log("DB Config Port:", db.port);
  console.log("DB Config Password Length:", db.password ? db.password.length : 0);

  if (db.user === "myuser") {
    console.log("Matches 'myuser'");
  } else {
    console.log("DOES NOT MATCH 'myuser'. Found:", db.user);
  }

} catch (err) {
  console.error("Verification failed:", err.message);
  process.exit(1);
}
