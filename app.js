// JARVIS Configuration
const config = {
  name: "JARVIS",
  creator: "Armin Arbshahi",
  version: "2.1.0",
  defaultLang: "en-US",
  ttsSettings: {
    rate: 1,
    volume: 100,
    pitch: 1
  }
};

// DOM Elements
const elements = {
  voiceBtn: document.getElementById('voiceBtn'),
  responseText: document.getElementById('responseText'),
  voiceStatus: document.getElementById('voiceStatus'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  recognitionStatus: document.getElementById('recognitionStatus'),
  responseTime: document.getElementById('responseTime'),
  currentMode: document.getElementById('currentMode'),
  loader: document.getElementById('loader'),
  mainContent: document.getElementById('main-content')
};

// System State
const systemState = {
  isListening: false,
  isSpeaking: false,
  currentMode: "normal", // normal, silent, sleep
  userPreferences: {
    darkMode: true,
    voiceGender: "male"
  },
  interactionHistory: []
};

// Initialize Speech Synthesis
function initSpeechSynthesis() {
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(true);
        };
      } else {
        resolve(true);
      }
    } else {
      resolve(false);
    }
  });
}

// Text-to-Speech Function
async function speak(text, settings = {}) {
  return new Promise((resolve) => {
    if (systemState.currentMode === "silent") {
      updateResponseText(text);
      return resolve();
    }

    window.speechSynthesis.cancel();
    systemState.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, {
      ...config.ttsSettings,
      ...settings
    });

    // Select appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices.find(v => 
        v.lang.includes(config.defaultLang) && 
        v.name.toLowerCase().includes(systemState.userPreferences.voiceGender)
      ) || voices[0];
    }

    // Events
    utterance.onend = () => {
      systemState.isSpeaking = false;
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      systemState.isSpeaking = false;
      showError('Speech synthesis error');
      resolve();
    };

    updateResponseText(text);
    window.speechSynthesis.speak(utterance);
  });
}

// Update response text
function updateResponseText(text) {
  elements.responseText.textContent = text;
  addToHistory(text, 'response');
}

// Show error message
function showError(message) {
  elements.voiceStatus.textContent = message;
  elements.voiceStatus.style.color = '#ef4444';
  setTimeout(() => {
    elements.voiceStatus.textContent = 'Ready';
    elements.voiceStatus.style.color = '';
  }, 3000);
}

// Add interaction to history
function addToHistory(content, type) {
  const timestamp = new Date().toLocaleTimeString();
  const historyItem = {
    content,
    type,
    timestamp
  };
  
  systemState.interactionHistory.push(historyItem);
  renderHistoryItem(historyItem);
}

// Render history item
function renderHistoryItem(item) {
  const historyItem = document.createElement('div');
  historyItem.className = `history-item ${item.type}`;
  
  historyItem.innerHTML = `
    <i class="fas ${item.type === 'command' ? 'fa-microphone' : 'fa-robot'}"></i>
    <div class="history-item-content">
      <div class="history-item-text">${item.content}</div>
      <div class="history-item-time">${item.timestamp}</div>
    </div>
  `;
  
  elements.historyList.prepend(historyItem);
}

// Clear history
function clearHistory() {
  systemState.interactionHistory = [];
  elements.historyList.innerHTML = '';
}

// Set Reminder function
const reminders = [];
function setReminder(time, text) {
  reminders.push({ time, text });
  return `Reminder set for ${time}: ${text}`;
}

// Calculator function
function calculate(expression) {
  try {
    // Replace words with operators
    const cleanedExp = expression
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times/g, '*')
      .replace(/divided by/g, '/');
    
    // Safe evaluation
    const result = Function(`return (${cleanedExp})`)();
    return result.toString();
  } catch {
    return null;
  }
}

// Command Processing
const commands = {
  // Basic commands
  'hey jarvis|hello jarvis': () => `Hello, I'm ${config.name}. How can I assist you?`,
  'what can you do|help': () => "I can perform calculations, set reminders, tell jokes, and more. Try saying 'What can you do?' for options.",
  'what is your name': () => `I am ${config.name}, version ${config.version}`,
  'who made you': () => `I was created by ${config.creator}`,
  'time': () => `The current time is ${new Date().toLocaleTimeString()}`,
  'date': () => `Today is ${new Date().toLocaleDateString()}`,
  'thank you': () => "You're welcome!",
  'goodbye|exit': () => "Goodbye! Have a nice day!",
  
  // Advanced commands
  'set reminder (.+) at (.+)': (text, time) => setReminder(time, text),
  'calculate (.+)': (expression) => {
    const result = calculate(expression);
    return result ? `The result is ${result}` : "I couldn't calculate that";
  },
  'how do you feel': () => {
    const feelings = ["I'm functioning optimally", "All systems normal", "Ready to assist"];
    return feelings[Math.floor(Math.random() * feelings.length)];
  },
  'change mode to (.+)': (mode) => {
    const validModes = ["normal", "silent", "sleep"];
    if (validModes.includes(mode)) {
      systemState.currentMode = mode;
      elements.currentMode.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      return `Mode changed to ${mode}`;
    }
    return "Invalid mode. Please try normal, silent or sleep";
  },
  'tell me a joke': () => {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
      "Why don't skeletons fight each other? They don't have the guts!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
};

// Process user command
async function processCommand(command) {
  const startTime = performance.now();
  
  // Add command to history
  addToHistory(command, 'command');
  
  // Check for exact matches first
  for (const [pattern, action] of Object.entries(commands)) {
    const regex = new RegExp(`^${pattern}$`, 'i');
    if (regex.test(command)) {
      const response = await action();
      const endTime = performance.now();
      elements.responseTime.textContent = `${((endTime - startTime)/1000).toFixed(2)}s`;
      return response;
    }
  }
  
  // Check for partial matches
  for (const [pattern, action] of Object.entries(commands)) {
    const regex = new RegExp(pattern, 'i');
    const match = command.match(regex);
    if (match) {
      const response = await action(...match.slice(1));
      const endTime = performance.now();
      elements.responseTime.textContent = `${((endTime - startTime)/1000).toFixed(2)}s`;
      return response;
    }
  }
  
  // Default response for unknown commands
  return "I didn't understand that. Try saying 'What can you do?' for a list of commands.";
}

// Initialize Voice Recognition
function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showError('Voice recognition not supported');
    elements.voiceBtn.disabled = true;
    elements.recognitionStatus.textContent = 'Unsupported';
    elements.recognitionStatus.classList.remove('active');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = config.defaultLang;

  recognition.onstart = () => {
    systemState.isListening = true;
    elements.voiceBtn.classList.add('listening');
    elements.voiceStatus.textContent = "Listening...";
    document.getElementById('activationSound').play();
  };

  recognition.onend = () => {
    systemState.isListening = false;
    elements.voiceBtn.classList.remove('listening');
    elements.voiceStatus.textContent = "Ready";
  };

  recognition.onerror = (event) => {
    console.error('Recognition error:', event.error);
    showError(`Error: ${event.error}`);
    document.getElementById('errorSound').play();
    recognition.onend();
  };

  recognition.onresult = async (event) => {
    const command = event.results[0][0].transcript;
    document.getElementById('responseSound').play();
    const response = await processCommand(command);
    await speak(response);
  };

  return recognition;
}

// Initialize System
async function initializeSystem() {
  // Hide loader after 2 seconds
  setTimeout(() => {
    elements.loader.style.opacity = '0';
    setTimeout(() => {
      elements.loader.style.display = 'none';
      elements.mainContent.style.display = 'block';
    }, 500);
  }, 2000);

  // Initialize speech synthesis
  const ttsSupported = await initSpeechSynthesis();
  if (!ttsSupported) {
    showError('Speech synthesis not supported');
    elements.recognitionStatus.textContent = 'Limited';
    elements.recognitionStatus.classList.remove('active');
  }

  // Initialize voice recognition
  const recognition = initVoiceRecognition();
  
  // Set up event listeners
  if (recognition) {
    elements.voiceBtn.addEventListener('click', () => {
      if (!systemState.isListening && !systemState.isSpeaking) {
        recognition.start();
      }
    });
  }

  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // Initial greeting
  await speak(`${config.name} initialized. Version ${config.version}. How can I assist you?`);
}

// Start the application
window.addEventListener('load', initializeSystem);
