const axios = require('axios');
const db = require('../db');

/**
 * Sends a WhatsApp message using the self-hosted WAHA (WhatsApp HTTP API) service.
 * Falls back to console simulation if the WAHA API call fails or is not running.
 * 
 * @param {string} to - Recipient phone number (with country code, e.g., '918081012213')
 * @param {object|string} content - Message text string
 * @param {string} type - Message type: 'text' or 'template'
 * @returns {Promise<object>} - API response details
 */
async function sendWhatsApp(to, content, type = 'text') {
  // Clean the phone number (remove +, spaces, ensure country code)
  let cleanNumber = to.replace(/[\s+]/g, '');
  if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber; // default to India country code
  }

  // Fetch settings dynamically from system_settings
  let wahaApiUrl = 'http://localhost:3000';
  let botNumber = '6386434561';
  let wahaApiKey = '';
  try {
    const settingsRes = await db.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('waha_api_url', 'bot_whatsapp_number', 'waha_api_key')"
    );
    settingsRes.rows.forEach(row => {
      if (row.setting_key === 'waha_api_url') wahaApiUrl = row.setting_value;
      if (row.setting_key === 'bot_whatsapp_number') botNumber = row.setting_value;
      if (row.setting_key === 'waha_api_key') wahaApiKey = row.setting_value;
    });
  } catch (err) {
    console.warn('[WhatsApp Integration] Error reading settings from database, using defaults:', err.message);
  }

  const messageText = typeof content === 'object' 
    ? (content.text || JSON.stringify(content)) 
    : content;

  try {
    const url = `${wahaApiUrl.replace(/\/$/, '')}/api/sendText`;
    const payload = {
      chatId: `${cleanNumber}@c.us`,
      text: messageText,
      session: 'default'
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (wahaApiKey) {
      headers['x-api-key'] = wahaApiKey;
    }

    console.log(`[WhatsApp Waha API] Sending message via Waha (${url}) to +${cleanNumber} using bot session for number ${botNumber}...`);
    
    const response = await axios.post(url, payload, {
      headers,
      timeout: 5000 // 5 seconds timeout
    });

    console.log(`[WhatsApp Waha API] Success! Message sent via Waha.`);
    return {
      success: true,
      message_id: response.data.id || 'waha-msg-id',
      data: response.data
    };
  } catch (error) {
    console.warn(`[WhatsApp Waha API] Waha API call failed or timed out: ${error.message}`);
    console.log(`[WHATSAPP SIMULATION ALERT] 📱 (Waha API Offline Fallback)
Sender Bot: ${botNumber}
Recipient: +${cleanNumber}
Content: ${messageText}
--------------------------------------------------
To activate real delivery, ensure the Waha server is running at ${wahaApiUrl} and has an active session named 'default'.
`);
    return {
      success: true,
      simulated: true,
      message: 'Simulated WhatsApp message sent in local development mode (Waha server offline).'
    };
  }
}

module.exports = {
  sendWhatsApp
};
