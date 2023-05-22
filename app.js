const express = require("express");
const twilio = require("twilio");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio_number = process.env.TWILIO_NUMBER;

// Constants
const MAPS_API_KEY = process.env.MAP_API_KEY; // Your Google Maps API key
const MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap"; // Google Maps Static API URL

app.use(express.json());
app.use(cors());

// Handle the request to initiate the SOS
app.post("/send-sos", async (req, res) => {
  const { contacts, location, username } = req.body;
  const { latitude, longitude } = location;

  const mapLink = location
    ? `${MAPS_URL}?center=${latitude},${longitude}&zoom=16&size=600x300&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${MAPS_API_KEY}`
    : null;

  const client = twilio(accountSid, authToken);

  try {
    for (const contact of contacts) {
      const formattedPhoneNumber = contact.replace(
        /^(\+\d{3})(\d{3})(\d{3})(\d{4})$/,
        "$1 $2 $3 $4"
      );

      // Make the call
      await client.calls.create({
        twiml: `<Response><Say>This is a SOS call from ${username}. Please check your sms for more details"</Say></Response>`,
        to: formattedPhoneNumber,
        from: twilio_number,
      });

      // Send the SMS
      await client.messages.create({
        body: `This is a SOS call from ${username} Location:${mapLink || "Unknown"}`,
        to: formattedPhoneNumber,
        from: twilio_number,
      });
    }

    res.status(200).json({ message: "SOS sent successfully" });
  } catch (error) {
    console.error("Error sending SOS:", error);
    res.status(500).json({ error: "Failed to send SOS" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
