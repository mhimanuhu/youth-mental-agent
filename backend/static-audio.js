require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ElevenLabs Setup
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi';

// Audio folder
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
  console.log('✅ Created audio directory');
}

// Simple texts (without SSML for now)
const audioTexts = {
  welcome: "Namaste! Main aapka Mental Health Assistant hun. Aap apne mann ki baat freely share kar sakte hain. Main yahan aapki madad ke liye hun.",
  
  followup: "Kya aapko aur kisi cheez mein help chahiye? Yaad rakho, aap strong hain aur main yahan hun aapki madad ke liye.",
  
  relisten: "Aapki awaaz clear nahi aayi. Kya aap please dobara bolenge?",
  
  sorry: "Mujhe afsos hai, lekin main aapki madad nahi kar paya. Please try again ya kisi professional se contact kariye."
};

// Test API key first
async function testAPIKey() {
  try {
    console.log('🔑 Testing ElevenLabs API key...');
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenApiKey
      }
    });
    console.log('✅ API key is valid');
    console.log(`📊 Available voices: ${response.data.voices.length}`);
    return true;
  } catch (error) {
    console.error('❌ API key test failed:', error.response?.data || error.message);
    return false;
  }
}

// TTS function with better error handling
async function generateAudio(text, filename) {
  const outputPath = path.join(audioDir, `${filename}.mp3`);

  try {
    console.log(`🎵 Generating audio: ${filename}.mp3`);
    console.log(`📝 Text: ${text.substring(0, 50)}...`);
    
    const requestData = {
      text: text,
      model_id: 'eleven_monolingual_v1', // Changed to more stable model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: requestData,
      responseType: 'arraybuffer', // Changed from 'stream'
      headers: {
        'xi-api-key': elevenApiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      timeout: 30000 // 30 second timeout
    });

    // Write the audio data directly
    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Saved: ${filename}.mp3 (${response.data.length} bytes)`);
    
  } catch (error) {
    console.error(`❌ Error generating ${filename}.mp3:`);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', error.response?.data?.toString() || error.message);
    
    // Create a placeholder file so the app doesn't crash
    const placeholderText = `Sorry, audio file ${filename} could not be generated.`;
    fs.writeFileSync(outputPath.replace('.mp3', '_placeholder.txt'), placeholderText);
    console.log(`📝 Created placeholder for ${filename}`);
    
    throw error;
  }
}

// Main runner
async function main() {
  try {
    console.log('🎤 Starting audio generation...\n');
    
    // Validate environment
    if (!elevenApiKey) {
      console.error('❌ ELEVENLABS_API_KEY is not set in .env file');
      console.error('Please check your .env file and make sure the API key is correct');
      process.exit(1);
    }
    
    if (!voiceId) {
      console.error('❌ ELEVENLABS_VOICE_ID is not set');
      process.exit(1);
    }
    
    console.log(`📝 Using Voice ID: ${voiceId}`);
    console.log(`🔑 API Key: ${elevenApiKey.substring(0, 8)}...${elevenApiKey.substring(elevenApiKey.length - 4)}\n`);
    
    // Test API key
    const apiValid = await testAPIKey();
    if (!apiValid) {
      console.error('❌ Cannot proceed with invalid API key');
      process.exit(1);
    }
    
    console.log(''); // Empty line for better formatting
    
    // Generate audio files
    let successCount = 0;
    let failCount = 0;
    
    for (const [filename, text] of Object.entries(audioTexts)) {
      try {
        await generateAudio(text, filename);
        successCount++;
        
        // Add delay between requests to respect rate limits
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        failCount++;
        console.log(`⏭️ Skipping to next file...\n`);
      }
    }
    
    console.log('\n📊 Generation Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Audio files location: ${audioDir}`);
    
    if (successCount > 0) {
      console.log('\n🎉 At least some audio files were generated successfully!');
      
      // List generated files
      const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
      if (files.length > 0) {
        console.log('\n📋 Generated MP3 files:');
        files.forEach(file => {
          const filePath = path.join(audioDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
      }
    }
    
    if (failCount > 0) {
      console.log('\n⚠️ Some files failed to generate. The app will still work, but voice responses may not be available for all scenarios.');
    }
    
  } catch (error) {
    console.error('\n❌ Audio generation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();