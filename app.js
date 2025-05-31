// JARVIS Configuration
const config = {
  name: "JARVIS",
  creator: "Armin Arbshahi",
  version: "2.1.0",
  defaultLang: "en-US",
  ttsSettings: {
    rate: 1,
    volume: 80,
    pitch: 1
  }
};

// DOM Elements (minimal for audio-only)
const elements = {
  voiceBtn: document.getElementById('voiceBtn'),
  voiceStatus: document.getElementById('voiceStatus'),
  recognitionStatus: document.getElementById('recognitionStatus'),
  loader: document.getElementById('loader'),
  mainContent: document.getElementById('main-content')
};

// System State
const systemState = {
  isListening: false,
  isSpeaking: false,
  currentMode: "normal", // normal, silent, sleep
  userPreferences: {
    voiceGender: "male"
  }
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

// Text-to-Speech Function (audio only)
async function speak(text, settings = {}) {
  return new Promise((resolve) => {
    if (systemState.currentMode === "silent") {
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

    utterance.onend = () => {
      systemState.isSpeaking = false;
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      systemState.isSpeaking = false;
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

// Show error message (audio only)
function showError(message) {
  speak(message);
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
    const cleanedExp = expression
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times/g, '*')
      .replace(/divided by/g, '/');
    
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

// Process user command (audio only)
async function processCommand(command) {
  const startTime = performance.now();
  
  for (const [pattern, action] of Object.entries(commands)) {
    const regex = new RegExp(`^${pattern}$`, 'i');
    if (regex.test(command)) {
      const response = await action();
      return response;
    }
  }
  
  for (const [pattern, action] of Object.entries(commands)) {
    const regex = new RegExp(pattern, 'i');
    const match = command.match(regex);
    if (match) {
      const response = await action(...match.slice(1));
      return response;
    }
  }
  
  return "I didn't understand that. Try saying 'What can you do?' for a list of commands.";
}

// Initialize Voice Recognition
function initVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speak('Voice recognition not supported');
    elements.voiceBtn.disabled = true;
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = config.defaultLang;

  recognition.onstart = () => {
    systemState.isListening = true;
    elements.voiceBtn.classList.add('listening');
    document.getElementById('activationSound').play();
  };

  recognition.onend = () => {
    systemState.isListening = false;
    elements.voiceBtn.classList.remove('listening');
  };

  recognition.onerror = (event) => {
    console.error('Recognition error:', event.error);
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
  // Hide loader after initialization
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
    speak('Speech synthesis not supported');
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

  // Initial greeting
  await speak(`${config.name} initialized. Version ${config.version}. How can I assist you?`);
}

// Start the application
window.addEventListener('load', initializeSystem);
