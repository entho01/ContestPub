const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let twilioClient = null;
if (accountSid && authToken && fromNumber) {
  try {
    twilioClient = require('twilio')(accountSid, authToken);
    console.log('Twilio initialized. OTPs will be sent via real SMS.');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log('Twilio credentials missing. Running in Developer OTP Simulation mode.');
}

async function sendOtp(phone, otp) {
  const message = `Your ContestPub verification code is: ${otp}. Valid for 5 minutes.`;
  
  if (twilioClient) {
    try {
      // Add country code if not present. Let's assume standard formatting or leave it to input.
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      await twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: formattedPhone
      });
      return { success: true, mode: 'twilio' };
    } catch (error) {
      console.error('Twilio SMS error:', error.message);
      return { success: false, error: error.message, mode: 'simulator', otp }; // Fallback to simulator on error
    }
  } else {
    console.log(`\n==================================================`);
    console.log(`[SIMULATED SMS] Sent to: ${phone}`);
    console.log(`Message: ${message}`);
    console.log(`==================================================\n`);
    return { success: true, mode: 'simulator', otp };
  }
}

module.exports = { sendOtp };
