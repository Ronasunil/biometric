const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: "*/*" }));

const FRAPPE_URL = "https://tghtech.m.frappe.cloud";
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const db = {
  Tgh016: "HR-EMP-00007",
};

app.all("/iclock/cdata.aspx", async (req, res) => {
  try {
    console.log("Query:", req.query);

    const { table } = req.query;

    // ✅ Only process attendance logs
    if (table === "ATTLOG") {
      console.log("✅ Attendance log received");

      // Device sends raw text like:
      // 1\t2026-03-31 10:30:00\t0\t1
      const rawData = req.body;

      if (typeof rawData === "string") {
        const lines = rawData.trim().split("\n");

        for (const line of lines) {
          const [user_id, timestamp, status, punch] = line.split("\t");

          console.log("Parsed:", {
            user_id,
            timestamp,
            punch,
            mapped_employee: db[user_id],
          });

          try {
            await axios.post(
              `${FRAPPE_URL}/api/resource/Checkin`,
              {
                employee: db[user_id] || user_id, // map properly in real case
                time: timestamp,
                log_type: punch === "0" ? "IN" : "OUT",
              },
              {
                headers: {
                  Authorization: `token ${API_KEY}:${API_SECRET}`,
                  "Content-Type": "application/json",
                },
              },
            );
          } catch (error) {
            console.error("Mapping error for user_id:", error.message, error.response ? error.response.data : null);
          }
          // Example mapping
        }
      }
    } else {
      console.log("⏩ Non-ATTLOG request (ignore)");
    }

    // ✅ ALWAYS respond OK (very important)
    res.send("OK");
  } catch (error) {
    console.error("Error:", error.message);

    // ⚠️ Still respond OK to stop retry loop
    res.send("OK");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
