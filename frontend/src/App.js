import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Phone, PhoneCall, Users, MessageCircle, Brain, Heart, Edit3 } from 'lucide-react';



const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected
  const [sessionId, setSessionId] = useState('');
  const [userStats, setUserStats] = useState({ totalSessions: 0, totalMessages: 0 });
  const [phoneNumber, setPhoneNumber] = useState('+919829114409');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

   const messagesEndRef = useRef(null);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    fetchUserStats();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/stats');
      const stats = await response.json();
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: inputText, 
      timestamp: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText, sessionId })
      });

      const data = await response.json();
      
      if (data.success) {
        const botMessage = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
        fetchUserStats();
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: "Sorry, I couldn’t understand you. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice recording (placeholder)
  const toggleVoiceRecording = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log('🎤 Voice recording started...');
    } else {
      console.log('🛑 Voice recording stopped.');
    }
  };

  // Phone number validation
  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  // Phone number change
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  // Save phone number
  const savePhoneNumber = () => {
    if (validatePhoneNumber(phoneNumber)) {
      setIsEditingPhone(false);
      localStorage.setItem('userPhoneNumber', phoneNumber);
    } else {
      alert('Enter a valid international phone number (e.g., +919829114409)');
    }
  };

  // Load phone number from storage
  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhoneNumber');
    if (savedPhone) setPhoneNumber(savedPhone);
  }, []);

  // Initiate phone call
  const initiateCall = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      alert('Please enter a valid phone number before making a call');
      setIsEditingPhone(true);
      return;
    }

    setCallStatus('calling');
    try {
      console.log('📞 Initiating call to:', phoneNumber);
      
      const response = await fetch('http://localhost:3002/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (data.success) {
        setCallStatus('connected');
        alert(`Call initiated successfully to ${phoneNumber}!`);
        console.log('✅ Call SID:', data.callSid);
        setTimeout(() => setCallStatus('idle'), 30000);
      } else {
        setCallStatus('idle');
        alert(`Call failed: ${data.error}\nDetails: ${data.details || 'No extra details'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setCallStatus('idle');
      if (error.message.includes('fetch')) {
        alert('Network error: Make sure backend is running on http://localhost:3002');
      } else {
        alert(`Call failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ManMitra Assistant</h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{userStats.totalMessages} messages</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{userStats.totalSessions} sessions</span>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="flex items-center space-x-2">
                {isEditingPhone ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="+919829114409"
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
                      autoFocus
                    />
                    <button
                      onClick={savePhoneNumber}
                      className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-mono">{phoneNumber}</span>
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit phone number"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Call Button */}
              <button
                onClick={initiateCall}
                disabled={callStatus === 'calling'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  callStatus === 'idle' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : callStatus === 'calling' 
                    ? 'bg-yellow-500 text-white cursor-not-allowed' 
                    : 'bg-blue-500 text-white'
                }`}
              >
                {callStatus === 'idle' ? (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Call Now</span>
                  </>
                ) : callStatus === 'calling' ? (
                  <>
                    <PhoneCall className="w-5 h-5 animate-pulse" />
                    <span>Calling...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-5 h-5" />
                    <span>Connected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        {messages.length === 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-indigo-100">
              <div className="text-center">
                <div className="bg-gradient-to-r from-pink-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome! I am your Mental Health Assistant
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  You can freely share your thoughts and feelings here. I am here to support you with stress, anxiety, or any other mental health concerns.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Anxiety Support
                  </span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Stress Management
                  </span>
                  <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Emotional Guidance
                  </span>
                  <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    24/7 Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              <button
                onClick={toggleVoiceRecording}
                className={`flex-shrink-0 p-3 rounded-full ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="1"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="flex-shrink-0 p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-full"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 bg-white rounded-lg py-3 px-6 inline-block shadow-sm">
            This is an AI assistant. For serious mental health concerns, please consult a qualified professional.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;