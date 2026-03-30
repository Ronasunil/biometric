const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.text({type:"*/*"}))

// Your Frappe config
const FRAPPE_URL = "https://tghtech.m.frappe.cloud";
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;


app.get("/", (req, res) => {
    console.log("working")
    res.status(200).json({message:"API is working"})
})

app.post("/checkin", async (req, res) => {
  try {
    const { user_id, latitude, longitude, log_type } = req.body;

  console.log(JSON.stringify(response.data, null, 2));
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Format time like: YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const formattedTime = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0") + " " +
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0") + ":" +
      String(now.getSeconds()).padStart(2, "0");

    const response = await axios.post(
      `${FRAPPE_URL}/api/resource/Checkin`,
      {
        employee: user_id,
        time: formattedTime,
        log_type: log_type || "IN",
        latitude: latitude || 9.9312,
        longitude: longitude || 76.2673
      },
      {
        headers: {
          "Authorization": `token ${API_KEY}:${API_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      frappe_response: response.data
    });

  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});