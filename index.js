const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: "*/*" }));

const FRAPPE_URL = "https://tghtech.m.frappe.cloud";
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

// 🔁 Device user_id → Employee mapping
const db = {
  Tgh016: "HR-EMP-00007",
};

// 📍 Default Kochi location
const DEFAULT_LAT = 9.9312;
const DEFAULT_LNG = 76.2673;

app.all("/iclock/cdata.aspx", async (req, res) => {
  try {
    console.log("Query:", req.query);

    const { table } = req.query;

    // ✅ Only process attendance logs
    if (table === "ATTLOG") {
      console.log("✅ Attendance log received");

      const rawData = req.body;

      if (typeof rawData === "string") {
        const lines = rawData.trim().split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;

          const [user_id, timestamp, status, punch] = line.split("\t");

          const employee = db[user_id];

          console.log("Parsed:", {
            user_id,
            employee,
            timestamp,
            punch,
          });

          // ❗ Skip if mapping not found
          if (!employee) {
            console.warn(`⚠️ No mapping for user_id: ${user_id}`);
            continue;
          }

          try {
            await axios.post(
              `${FRAPPE_URL}/api/resource/Employee Checkin`, // ✅ FIXED
              {
                employee: employee,
                time: timestamp,
                log_type: punch === "0" ? "IN" : "OUT",

                // 📍 Kochi default location
                latitude: DEFAULT_LAT,
                longitude: DEFAULT_LNG,


              },
              {
                headers: {
                  Authorization: `token ${API_KEY}:${API_SECRET}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(`✅ Synced: ${employee} at ${timestamp}`);
          } catch (error) {
            console.error(
              "❌ Frappe error:",
              error.response?.data || error.message
            );
          }
        }
      }
    } else {
      console.log("⏩ Non-ATTLOG request (ignored)");
    }

    // ✅ MUST respond OK (device requirement)
    res.send("OK");
  } catch (error) {
    console.error("❌ Server error:", error.message);

    // ⚠️ Always send OK to stop retries
    res.send("OK");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});