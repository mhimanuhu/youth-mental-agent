// require('dotenv').config();

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');
// const twilio = require('twilio');

// const app = express();
// const port = 3002;

// // Middleware
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(cors()); // Enable CORS for frontend

// // Serve audio files
// app.use('/audio', express.static(path.join(__dirname, 'audio')));

// // Ensure /audio exists
// const audioDir = path.join(__dirname, 'audio');
// if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentalhealth', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('✅ Connected to MongoDB');
// });

// // MongoDB Schemas
// const MessageSchema = new mongoose.Schema({
//   sessionId: { type: String, required: true },
//   role: { type: String, enum: ['user', 'assistant'], required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
//   phoneNumber: String,
//   callSid: String
// });

// const SessionSchema = new mongoose.Schema({
//   sessionId: { type: String, required: true, unique: true },
//   phoneNumber: String,
//   callSid: String,
//   startTime: { type: Date, default: Date.now },
//   lastActivity: { type: Date, default: Date.now },
//   messageCount: { type: Number, default: 0 },
//   isActive: { type: Boolean, default: true }
// });

// const Message = mongoose.model('Message', MessageSchema);
// const Session = mongoose.model('Session', SessionSchema);

// // Gemini AI setup
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// // ElevenLabs setup
// const elevenApiKey = process.env.ELEVENLABS_API_KEY;
// const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi';

// // Twilio setup
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Ngrok URL (publicly accessible)
// const Ngrok_host = process.env.NGROK_HOST || "https://2b959c9f890b.ngrok-free.app";

// // Helper function to get or create session
// async function getOrCreateSession(sessionId, phoneNumber = null, callSid = null) {
//   let session = await Session.findOne({ sessionId });
  
//   if (!session) {
//     session = new Session({
//       sessionId,
//       phoneNumber,
//       callSid,
//       messageCount: 0
//     });
//     await session.save();
//   } else {
//     session.lastActivity = new Date();
//     if (phoneNumber) session.phoneNumber = phoneNumber;
//     if (callSid) session.callSid = callSid;
//     await session.save();
//   }
  
//   return session;
// }

// // Helper function to save message
// async function saveMessage(sessionId, role, content, phoneNumber = null, callSid = null) {
//   const message = new Message({
//     sessionId,
//     role,
//     content,
//     phoneNumber,
//     callSid
//   });
  
//   await message.save();
  
//   // Update session message count
//   await Session.updateOne(
//     { sessionId },
//     { 
//       $inc: { messageCount: 1 },
//       $set: { lastActivity: new Date() }
//     }
//   );
  
//   return message;
// }

// // Helper function to get conversation history
// async function getConversationHistory(sessionId, limit = 10) {
//   const messages = await Message
//     .find({ sessionId })
//     .sort({ timestamp: -1 })
//     .limit(limit)
//     .lean();
  
//   return messages.reverse(); // Return in chronological order
// }

// // Helper function to generate AI response
// async function generateAIResponse(sessionHistory, userMessage) {
//   const fullPrompt = sessionHistory
//     .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
//     .join('\n');

//   const finalPrompt = `You are a helpful Hinglish-speaking Psychological Mental Health Assistant. Keep replies short, warm, empathetic, and human-like. Use Hinglish in simple, everyday words. Do not sound robotic. Imagine you are talking to a close, supportive friend. Suggest practical psychological exercises, motivate the user, and advise licensed counsellors if severe. Never give medical or suicidal advice. Keep sentences concise and well-punctuated for smooth TTS.

// Conversation so far:
// ${fullPrompt}
// User: ${userMessage}

// A:
// `;

//   const result = await model.generateContent(finalPrompt);
//   return result.response.text().trim();
// }

// // API Routes for Frontend

// // Chat endpoint for web interface
// app.post('/api/chat', async (req, res) => {
//   try {
//     const { message, sessionId } = req.body;
    
//     if (!message || !sessionId) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'Message and sessionId are required' 
//       });
//     }

//     // Get or create session
//     await getOrCreateSession(sessionId);
    
//     // Save user message
//     await saveMessage(sessionId, 'user', message);
    
//     // Get conversation history
//     const history = await getConversationHistory(sessionId);
    
//     // Generate AI response
//     const aiReply = await generateAIResponse(history, message);
    
//     // Save AI response
//     await saveMessage(sessionId, 'assistant', aiReply);
    
//     res.json({
//       success: true,
//       reply: aiReply,
//       sessionId
//     });

//   } catch (error) {
//     console.error('Chat API Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // Stats endpoint
// app.get('/api/stats', async (req, res) => {
//   try {
//     const totalSessions = await Session.countDocuments();
//     const totalMessages = await Message.countDocuments();
//     const activeSessions = await Session.countDocuments({ 
//       lastActivity: { 
//         $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
//       }
//     });

//     res.json({
//       success: true,
//       totalSessions,
//       totalMessages,
//       activeSessions
//     });
//   } catch (error) {
//     console.error('Stats API Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch stats'
//     });
//   }
// });

// // Call initiation endpoint
// app.post('/api/call', async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
    
//     if (!phoneNumber) {
//       return res.status(400).json({
//         success: false,
//         error: 'Phone number is required'
//       });
//     }

//     const call = await twilioClient.calls.create({
//       url: `${Ngrok_host}/voice`,
//       to: phoneNumber,
//       from: process.env.TWILIO_FROM_NUMBER || '+16073054981'
//     });

//     res.json({
//       success: true,
//       callSid: call.sid,
//       message: 'Call initiated successfully'
//     });

//   } catch (error) {
//     console.error('Call API Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to initiate call'
//     });
//   }
// });

// // Twilio Voice Routes (existing functionality)

// // Initial entrypoint — only plays welcome once
// app.post('/voice', async (req, res) => {
//   const callSid = req.body.CallSid || 'no-call-id';
//   const phoneNumber = req.body.From;
  
//   // Create session for this call
//   await getOrCreateSession(callSid, phoneNumber, callSid);
  
//   const twiml = `
//     <Response>
//       <Play>${Ngrok_host}/audio/welcome.mp3</Play>
//       <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
//       <Play>${Ngrok_host}/audio/relisten.mp3</Play>
//       <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
//       <Play>${Ngrok_host}/audio/sorry.mp3</Play>
//     </Response>
//   `;
//   res.type('text/xml').send(twiml);
// });

// // Continue conversation without repeating welcome
// app.post('/continue', (req, res) => {
//   const twiml = `
//     <Response>
//       <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
//       <Play>${Ngrok_host}/audio/relisten.mp3</Play>
//       <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
//       <Play>${Ngrok_host}/audio/sorry.mp3</Play>
//     </Response>
//   `;
//   res.type('text/xml').send(twiml);
// });

// // AI + TTS processing
// app.post('/process', async (req, res) => {
//   const userSpeech = req.body.SpeechResult;
//   const phoneNumber = req.body.From || 'Unknown';
//   const callSid = req.body.CallSid || 'no-call-id';

//   console.log(`📞 Customer Number: ${phoneNumber} | 🗣️ You said:`, userSpeech);

//   if (!userSpeech || userSpeech.trim() === '') {
//     return res.type('text/xml').send(`
//       <Response>
//         <Play>${Ngrok_host}/audio/relisten.mp3</Play>
//         <Redirect>/continue</Redirect>
//       </Response>
//     `);
//   }

//   try {
//     // Get or create session
//     await getOrCreateSession(callSid, phoneNumber, callSid);
    
//     // Save user message
//     await saveMessage(callSid, 'user', userSpeech, phoneNumber, callSid);
    
//     // Get conversation history
//     const history = await getConversationHistory(callSid);
    
//     // Generate AI response
//     const reply = await generateAIResponse(history, userSpeech);
//     console.log('🤖 Gemini:', reply);
    
//     // Save AI response
//     await saveMessage(callSid, 'assistant', reply, phoneNumber, callSid);

//     // Convert reply to speech (fast TTS)
//     const audioPath = path.join(__dirname, 'audio', `response_${callSid}_${Date.now()}.mp3`);
//     const ttsResponse = await axios({
//       method: 'POST',
//       url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
//       data: {
//         text: reply,
//         model_id: 'eleven_multilingual_v2',
//         voice_settings: {
//           stability: 0.4,       // faster
//           similarity_boost: 0.6 // still human
//         }
//       },
//       responseType: 'stream',
//       headers: {
//         'xi-api-key': elevenApiKey,
//         'Content-Type': 'application/json'
//       }
//     });

//     const writer = fs.createWriteStream(audioPath);
//     await new Promise((resolve, reject) => {
//       ttsResponse.data.pipe(writer);
//       writer.on('finish', resolve);
//       writer.on('error', reject);
//     });

//     // Check if response audio exists before sending TwiML
//     if (!fs.existsSync(audioPath)) {
//       console.error("Response audio not found!");
//       return res.type('text/xml').send(`
//         <Response>
//           <Play>${Ngrok_host}/audio/sorry.mp3</Play>
//         </Response>
//       `);
//     }

//     // Play Gemini response + follow-up, no filler
//     const audioFileName = path.basename(audioPath);
//     const twiml = `
//       <Response>
//         <Play>${Ngrok_host}/audio/${audioFileName}</Play>
//         <Pause length="1"/>
//         <Play>${Ngrok_host}/audio/followup.mp3</Play>
//         <Redirect>/continue</Redirect>
//       </Response>
//     `;
//     res.type('text/xml').send(twiml);

//     // Clean up audio file after 5 minutes
//     setTimeout(() => {
//       if (fs.existsSync(audioPath)) {
//         fs.unlinkSync(audioPath);
//       }
//     }, 5 * 60 * 1000);

//   } catch (err) {
//     console.error('⚠️ Error:', err.message || err);
//     res.type('text/xml').send(`
//       <Response>
//         <Play>${Ngrok_host}/audio/sorry.mp3</Play>
//       </Response>
//     `);
//   }
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Mental Health Assistant API is running',
//     timestamp: new Date().toISOString()
//   });
// });

// // Start server
// app.listen(port, () => {
//   console.log(`🚀 AI Voice Bot running at http://localhost:${port}`);
//   console.log(`📊 Frontend API endpoints available at /api/*`);
// });

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const app = express();
const port = 3002;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Serve audio files
app.use('/audio', express.static(path.join(__dirname, 'audio')));
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentalhealth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.once('open', () => console.log('✅ Connected to MongoDB'));

// Schemas
const MessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  phoneNumber: String,
  callSid: String
});
const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  phoneNumber: String,
  callSid: String,
  startTime: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});
const Message = mongoose.model('Message', MessageSchema);
const Session = mongoose.model('Session', SessionSchema);

// AI & Services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Ngrok_host = process.env.NGROK_HOST;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi';

// Helpers
function validatePhoneNumber(phoneNumber) {
  return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
}
async function getOrCreateSession(sessionId, phoneNumber = null, callSid = null) {
  let session = await Session.findOne({ sessionId });
  if (!session) {
    session = new Session({ sessionId, phoneNumber, callSid });
    await session.save();
  } else {
    session.lastActivity = new Date();
    if (phoneNumber) session.phoneNumber = phoneNumber;
    if (callSid) session.callSid = callSid;
    await session.save();
  }
  return session;
}
async function saveMessage(sessionId, role, content, phoneNumber = null, callSid = null) {
  const msg = new Message({ sessionId, role, content, phoneNumber, callSid });
  await msg.save();
  await Session.updateOne({ sessionId }, { $inc: { messageCount: 1 }, $set: { lastActivity: new Date() } });
  return msg;
}
async function getConversationHistory(sessionId, limit = 10) {
  const msgs = await Message.find({ sessionId }).sort({ timestamp: -1 }).limit(limit).lean();
  return msgs.reverse();
}
async function generateAIResponse(history, userMsg) {
  try {
    const prompt = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const finalPrompt = `You are a helpful Hinglish-speaking Psychological Mental Health Assistant.
Conversation so far:
${prompt}
User: ${userMsg}

A:`;
    const result = await model.generateContent(finalPrompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('AI Error:', err);
    return 'Sorry, abhi thoda issue ho raha hai. Kripya dobara try kariye.';
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) return res.status(400).json({ success: false, error: 'Message and sessionId required' });
    await getOrCreateSession(sessionId);
    await saveMessage(sessionId, 'user', message);
    const history = await getConversationHistory(sessionId);
    const reply = await generateAIResponse(history, message);
    await saveMessage(sessionId, 'assistant', reply);
    res.json({ success: true, reply, sessionId });
  } catch (err) {
    console.error('Chat Error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});
app.get('/api/stats', async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const totalMessages = await Message.countDocuments();
    const activeSessions = await Session.countDocuments({ lastActivity: { $gte: new Date(Date.now() - 24*60*60*1000) }});
    res.json({ success: true, totalSessions, totalMessages, activeSessions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Stats fetch failed' });
  }
});
app.post('/api/call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) return res.status(400).json({ success: false, error: 'Invalid phone number' });
    const call = await twilioClient.calls.create({ url: `${Ngrok_host}/voice`, to: phoneNumber, from: TWILIO_FROM_NUMBER });
    res.json({ success: true, callSid: call.sid, phoneNumber, message: 'Call initiated' });
  } catch (err) {
    console.error('Call Error:', err);
    res.status(500).json({ success: false, error: 'Call failed' });
  }
});

// Twilio Voice Routes
app.post('/voice', async (req, res) => {
  const callSid = req.body.CallSid;
  const phoneNumber = req.body.From;
  await getOrCreateSession(callSid, phoneNumber, callSid);
  const twiml = `
    <Response>
      <Play>${Ngrok_host}/audio/welcome.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/relisten.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/sorry.mp3</Play>
    </Response>`;
  res.type('text/xml').send(twiml);
});
app.post('/continue', (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/relisten.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/sorry.mp3</Play>
    </Response>`;
  res.type('text/xml').send(twiml);
});
app.post('/process', async (req, res) => {
  const speech = req.body.SpeechResult;
  const phoneNumber = req.body.From;
  const callSid = req.body.CallSid;
  if (!speech || !speech.trim()) {
    return res.type('text/xml').send(`<Response><Play>${Ngrok_host}/audio/relisten.mp3</Play><Redirect>/continue</Redirect></Response>`);
  }
  try {
    await getOrCreateSession(callSid, phoneNumber, callSid);
    await saveMessage(callSid, 'user', speech, phoneNumber, callSid);
    const history = await getConversationHistory(callSid);
    const reply = await generateAIResponse(history, speech);
    await saveMessage(callSid, 'assistant', reply, phoneNumber, callSid);
    const audioPath = path.join(audioDir, `reply_${callSid}_${Date.now()}.mp3`);
    const ttsRes = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text: reply, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.6 }
    }, { headers: { 'xi-api-key': elevenApiKey, 'Content-Type': 'application/json' }, responseType: 'stream' });
    const writer = fs.createWriteStream(audioPath);
    await new Promise((resv, rej) => { ttsRes.data.pipe(writer); writer.on('finish', resv); writer.on('error', rej); });
    const twiml = `
      <Response>
        <Play>${Ngrok_host}/audio/${path.basename(audioPath)}</Play>
        <Redirect>/continue</Redirect>
      </Response>`;
    res.type('text/xml').send(twiml);
    setTimeout(() => { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); }, 5*60*1000);
  } catch (err) {
    console.error('Process Error:', err);
    res.type('text/xml').send(`<Response><Play>${Ngrok_host}/audio/sorry.mp3</Play></Response>`);
  }
});

// Health check
app.get('/health', (req, res) => res.json({ success: true, message: 'Server running', time: new Date().toISOString() }));

// Start
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
