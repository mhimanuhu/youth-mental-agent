require('dotenv').config();
const twilio = require('twilio');


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const fromNumber = '+18326622172'; 
const toNumber = '+918875363677'; 


client.calls
  .create({
    url: 'https://2b959c9f890b.ngrok-free.app/voice',
    to: toNumber,
    from: fromNumber,
  })
  .then(call => {
    console.log('Call initiated, SID:', call.sid);
  })
  .catch(err => {
    console.error('Call failed:', err.message);
  });
