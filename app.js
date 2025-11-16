/* ==============================
   Learn English App – Simplified (No Progress Save)
   ============================== */

const levelFiles = {
  easy: ["easy1.json", "easy2.json", "easy3.json", "easy4.json", "easy5.json", "easy6.json", "easy7.json", "easy8.json"],
  medium: ["medium1.json", "medium2.json"],
  advanced: ["advanced1.json", "advanced2.json"]
};

const levelOrder = ["easy", "medium", "advanced"];

let username = "";
let selectedLevel = "";
let currentFileIndex = 0;
let phrases = [];
let index = 0;
let translationRevealed = false;
let voices = [];
let voicesLoaded = false;

/* =========================
   INITIALIZATION
   ========================= */
window.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const welcome = document.getElementById("welcome-screen");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark");

  // Start splash animation
  setTimeout(() => {
    splash.classList.add("rotate-out");
    setTimeout(() => {
      splash.style.display = "none";
      welcome.style.display = "flex";
      welcome.classList.add("rotate-in");
      
      // Check for saved progress
      checkSavedProgress();
    }, 600);
  }, 1500);

  loadVoices();
  
  // Register service worker and listen for updates
  registerServiceWorker();
});

/* =========================
   PROGRESS SAVE & RESTORE
   ========================= */
function saveProgress() {
  // Only save if user has actually started (not at phrase 0)
  if (!username || !selectedLevel) return;
  
  const progress = {
    username: username,
    level: selectedLevel,
    fileIndex: currentFileIndex,
    phraseIndex: index,
    timestamp: Date.now()
  };
  localStorage.setItem('learnEnglishProgress', JSON.stringify(progress));
  console.log('Progress saved:', progress);
}

function checkSavedProgress() {
  const saved = localStorage.getItem('learnEnglishProgress');
  console.log('Checking saved progress:', saved);
  if (!saved) {
    console.log('No saved progress found');
    return;
  }
  
  const progress = JSON.parse(saved);
  console.log('Progress loaded:', progress);
  
  // Check if progress is less than 7 days old
  const daysSince = (Date.now() - progress.timestamp) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) {
    console.log('Progress expired (older than 7 days)');
    localStorage.removeItem('learnEnglishProgress');
    return;
  }
  
  // Show resume banner
  const welcomeScreen = document.getElementById('welcome-screen');
  const usernameField = document.getElementById('username');
  
  // Pre-fill username
  if (progress.username) {
    usernameField.value = progress.username;
  }
  
  // Create resume banner
  const resumeBanner = document.createElement('div');
  resumeBanner.id = 'resume-banner';
  resumeBanner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1em; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 0.8em; flex: 1; min-width: 200px;">
        <span style="font-size: 1.8em;">📖</span>
        <div>
          <strong style="display: block; margin-bottom: 0.2em; font-size: 1.1em;">Continue Learning?</strong>
          <span style="font-size: 0.9em; opacity: 0.9;">
            ${capitalize(progress.level)} Level - File ${progress.fileIndex + 1} - Phrase ${progress.phraseIndex + 1}
          </span>
        </div>
      </div>
      <div style="display: flex; gap: 0.8em; flex-wrap: wrap;">
        <button onclick="resumeProgress()" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; padding: 0.7em 1.5em; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95em; box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3); transition: all 0.3s ease; white-space: nowrap;">
          ▶️ Resume
        </button>
        <button onclick="clearProgress()" style="background: rgba(255, 107, 107, 0.2); color: #ff6b6b; border: 2px solid #ff6b6b; padding: 0.7em 1.5em; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95em; transition: all 0.3s ease; white-space: nowrap;">
          🔄 Start Fresh
        </button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #resume-banner {
      margin: 1.5em 0;
      padding: 1.2em;
      background: linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%);
      border: 2px solid rgba(17, 153, 142, 0.3);
      border-radius: 16px;
      animation: slideIn 0.5s ease;
    }
    
    body.dark #resume-banner {
      background: linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%);
      border-color: rgba(17, 153, 142, 0.4);
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #resume-banner button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    #resume-banner button:active {
      transform: translateY(0);
    }
    
    @media (max-width: 600px) {
      #resume-banner {
        padding: 1em;
      }
      #resume-banner > div {
        flex-direction: column;
        align-items: stretch !important;
      }
      #resume-banner button {
        width: 100%;
        padding: 0.8em;
      }
    }
  `;
  
  // Insert style in head
  document.head.appendChild(style);
  
  // Insert banner after the welcome subtitle
  const subtitle = welcomeScreen.querySelector('.welcome-subtitle');
  if (subtitle && subtitle.parentElement) {
    subtitle.parentElement.insertBefore(resumeBanner, subtitle.nextSibling);
  } else {
    // Fallback: insert at the beginning of welcome screen
    welcomeScreen.insertBefore(resumeBanner, welcomeScreen.children[2]);
  }
}

async function resumeProgress() {
  const saved = localStorage.getItem('learnEnglishProgress');
  if (!saved) return;
  
  const progress = JSON.parse(saved);
  console.log('Resuming progress:', progress);
  
  username = progress.username;
  selectedLevel = progress.level;
  currentFileIndex = progress.fileIndex;
  index = progress.phraseIndex;
  
  unlockSpeech();
  await loadVoices();
  
  const welcome = document.getElementById("welcome-screen");
  const phrase = document.getElementById("phrase-screen");
  
  welcome.classList.add("rotate-out");
  setTimeout(() => {
    welcome.style.display = "none";
    
    // Clear any vocabulary content and restore phrase screen structure
    phrase.innerHTML = `
      <div id="loader" class="spinner" style="display:none;"></div>
      <div id="hinglish-phrase" aria-live="polite">...</div>
      <div id="english-translation" aria-live="polite"></div>
      <div id="progress-container">
        <div id="progress-text">Progress: 0 / 0</div>
        <div id="progress-bar"></div>
      </div>
      <div class="controls">
        <button onclick="revealTranslation()">Reveal</button>
        <button onclick="nextPhrase()">Next</button>
        <button onclick="exitApp()">Exit</button>
      </div>
    `;
    
    phrase.style.display = "flex";
    phrase.classList.add("rotate-in");
    document.getElementById("loader").style.display = "block";
    loadPhrases(levelFiles[selectedLevel][currentFileIndex]);
  }, 600);
}

function clearProgress() {
  localStorage.removeItem('learnEnglishProgress');
  const banner = document.getElementById('resume-banner');
  if (banner) {
    banner.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => banner.remove(), 300);
  }
}

/* =========================
   SERVICE WORKER & UPDATE NOTIFICATION
   ========================= */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered');
        
        // Check for updates every 30 seconds when app is active
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateNotification();
            }
          });
        });
      })
      .catch(err => console.log('Service Worker registration failed:', err));
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'APP_UPDATED') {
        showUpdateNotification();
      }
    });
  }
}

function showUpdateNotification() {
  // Create update banner if it doesn't exist
  let banner = document.getElementById('update-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1em;">
        <div style="display: flex; align-items: center; gap: 0.8em;">
          <span style="font-size: 1.5em;">🎉</span>
          <div>
            <strong style="display: block; margin-bottom: 0.2em;">New Update Available!</strong>
            <span style="font-size: 0.9em; opacity: 0.9;">Refresh to get the latest features and content</span>
          </div>
        </div>
        <button onclick="reloadApp()" style="background: white; color: #667eea; border: none; padding: 0.6em 1.2em; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95em; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease;">
          Refresh Now
        </button>
      </div>
    `;
    document.body.appendChild(banner);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #update-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1em 1.5em;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideDown 0.5s ease;
      }
      
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      #update-banner button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      @media (max-width: 600px) {
        #update-banner {
          padding: 0.8em 1em;
          font-size: 0.9em;
        }
        #update-banner button {
          padding: 0.5em 1em;
          font-size: 0.85em;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function reloadApp() {
  window.location.reload();
}

function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById("theme-icon");
  body.classList.toggle("dark");
  const darkMode = body.classList.contains("dark");
  icon.textContent = darkMode ? "☀️" : "🌙";
  localStorage.setItem("theme", darkMode ? "dark" : "light");
}

/* =========================
   START TEST / LOAD PHRASES
   ========================= */
async function startTest(level) {
  unlockSpeech();
  await loadVoices();

  username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter your name to begin.");
    return;
  }

  selectedLevel = level;
  currentFileIndex = 0;
  index = 0;

  const welcome = document.getElementById("welcome-screen");
  const phrase = document.getElementById("phrase-screen");

  welcome.classList.add("rotate-out");
  setTimeout(() => {
    welcome.style.display = "none";
    
    // Clear any vocabulary content and restore phrase screen structure
    phrase.innerHTML = `
      <div id="loader" class="spinner" style="display:none;"></div>
      <div id="hinglish-phrase" aria-live="polite">...</div>
      <div id="english-translation" aria-live="polite"></div>
      <div id="progress-container">
        <div id="progress-text">Progress: 0 / 0</div>
        <div id="progress-bar"></div>
      </div>
      <div class="controls">
        <button onclick="revealTranslation()">Reveal</button>
        <button onclick="nextPhrase()">Next</button>
        <button onclick="exitApp()">Exit</button>
      </div>
    `;
    
    phrase.style.display = "flex";
    phrase.classList.add("rotate-in");
    document.getElementById("loader").style.display = "block";
    loadPhrases(levelFiles[level][currentFileIndex]);
  }, 600);
}

function unlockSpeech() {
  if (!("speechSynthesis" in window)) return;
  const dummy = new SpeechSynthesisUtterance("");
  speechSynthesis.speak(dummy);
}

function loadPhrases(fileName) {
  console.log("Loading file:", fileName);
  fetch(fileName)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("Data loaded successfully:", data);
      const allPhrases = data.categories
        ? data.categories.flatMap(cat => cat.phrases)
        : data.phrases;
      
      if (!allPhrases || allPhrases.length === 0) {
        throw new Error("No phrases found in file");
      }
      
      phrases = shuffleArray(allPhrases);
      setTimeout(() => {
        document.getElementById("loader").style.display = "none";
        showPhrase();
      }, 400);
    })
    .catch(err => {
      console.error("Error loading phrases:", err);
      document.getElementById("loader").style.display = "none";
      
      // Better error message
      const errorMsg = `Could not load phrases from "${fileName}".
      
Possible solutions:
1. Make sure you're opening the app through a web server (not file://)
2. Try using: python -m http.server 8080
3. Or use Live Server extension in VS Code
4. Check browser console (F12) for details

Error: ${err.message}`;
      
      alert(errorMsg);
      
      // Return to welcome screen
      document.getElementById("phrase-screen").style.display = "none";
      document.getElementById("welcome-screen").style.display = "flex";
    });
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* =========================
   PHRASE DISPLAY & CONTROL
   ========================= */
function showPhrase() {
  translationRevealed = false;
  
  // Re-enable Reveal button for new phrase
  const revealBtn = document.querySelector(".controls button:nth-child(1)");
  if (revealBtn) revealBtn.disabled = false;
  
  const nextBtn = document.querySelector(".controls button:nth-child(2)");
  if (nextBtn) nextBtn.disabled = true;

  const phrase = phrases[index];
  const hinglish = document.getElementById("hinglish-phrase");
  const english = document.getElementById("english-translation");

  english.style.display = "none";
  english.classList.remove("phrase-flip");

  // Store current phrase for replay
  window.currentPhrase = phrase;
  window.currentPhraseType = phrase.type;

  // Determine what to show based on level
  // Easy/Medium: Show Hindi first
  // Advanced: Show English question first
  let displayText, language;
  
  if (phrase.hindi) {
    // Easy or Medium level - show Hindi
    displayText = phrase.hindi;
    language = "hi-IN";
  } else {
    // Advanced level - show English question
    displayText = phrase.english;
    language = "en-IN";
  }
  
  hinglish.innerHTML = `
    ${displayText}
    <button onclick="replayCurrentPhrase()" style="margin-left: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2em; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4); transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;" title="Play audio">🔊</button>
  `;
  speak(displayText, language);

  hinglish.classList.remove("phrase-flip");
  void hinglish.offsetWidth;
  hinglish.classList.add("phrase-flip");

  document.getElementById("progress-text").textContent =
    `Progress: ${index + 1} / ${phrases.length}`;
  document.documentElement.style.setProperty(
    "--progress-width",
    `${((index + 1) / phrases.length) * 100}%`
  );
}

// Function to replay current phrase audio
function replayCurrentPhrase() {
  if (!window.currentPhrase) return;
  
  const phrase = window.currentPhrase;
  
  // Replay based on what's shown
  if (phrase.hindi) {
    speak(phrase.hindi, "hi-IN");
  } else {
    speak(phrase.english, "en-IN");
  }
}

function revealTranslation() {
  const phrase = phrases[index];
  const english = document.getElementById("english-translation");

  // Determine what to reveal based on level
  // Easy/Medium: Show English translation
  // Advanced: Show English answer
  const translationText = phrase.answer || phrase.english;
  window.currentTranslation = translationText;
  
  english.innerHTML = `
    ${translationText}
    <button onclick="replayTranslation()" style="margin-left: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2em; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4); transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;" title="Play audio">🔊</button>
  `;
  english.style.display = "block";
  void english.offsetWidth;
  english.classList.add("phrase-flip");

  setTimeout(() => speak(translationText, "en-IN"), 400);
  translationRevealed = true;

  // Disable Reveal button after first click
  const revealBtn = document.querySelector(".controls button:nth-child(1)");
  if (revealBtn) revealBtn.disabled = true;

  const nextBtn = document.querySelector(".controls button:nth-child(2)");
  if (nextBtn) nextBtn.disabled = false;
}

// Function to replay translation audio
function replayTranslation() {
  if (!window.currentTranslation) return;
  speak(window.currentTranslation, "en-IN");
}

function nextPhrase() {
  if (!translationRevealed) return;
  index++;
  
  if (index >= phrases.length) {
    setTimeout(celebrate, 400);
    return;
  }
  
  // Save progress after moving to next phrase
  saveProgress();
  showPhrase();
}

/* =========================
   CELEBRATION / MOVE ON
   ========================= */
function celebrate() {
  const phrase = document.getElementById("phrase-screen");
  const celebration = document.getElementById("celebration");
  const cheer = document.getElementById("cheer-sound");

  phrase.classList.add("rotate-out");
  setTimeout(() => {
    phrase.style.display = "none";
    phrase.classList.remove("rotate-out");

    celebration.style.display = "flex";
    celebration.classList.add("rotate-in");

    const nameSpan = document.getElementById("user-name");
    const moveBtn = document.getElementById("move-on-btn");
    const statusMsg = document.getElementById("level-status");

    if (!statusMsg || !moveBtn) return;
    if (nameSpan) nameSpan.textContent = username || "Learner";

    if (cheer) {
      cheer.currentTime = 0;
      cheer.play().catch(err => console.warn("Audio play failed:", err));
      launchConfetti();
    }

    const levelFilesArray = levelFiles[selectedLevel];
    const totalFiles = levelFilesArray.length;
    const nextFileExists = currentFileIndex + 1 < totalFiles;
    const currentLevelIndex = levelOrder.indexOf(selectedLevel);
    const nextLevelExists = currentLevelIndex + 1 < levelOrder.length;

    moveBtn.style.display = "none";

    if (nextFileExists) {
      statusMsg.textContent = `You’ve completed ${capitalize(selectedLevel)} ${currentFileIndex + 1} of ${totalFiles}!`;
      moveBtn.textContent = `➡️ Move On to ${capitalize(selectedLevel)} ${currentFileIndex + 2}`;
      moveBtn.style.display = "inline-block";
    } else if (nextLevelExists) {
      statusMsg.textContent = `🎯 ${capitalize(selectedLevel)} level completed!`;
      const nextLevelName = capitalize(levelOrder[currentLevelIndex + 1]);
      moveBtn.textContent = `➡️ Move On to ${nextLevelName} Level`;
      moveBtn.style.display = "inline-block";
    } else {
      statusMsg.textContent = `🏆 You’ve completed all levels! Fantastic job!`;
    }
  }, 600);
}

function moveToNextFile() {
  const moveBtn = document.getElementById("move-on-btn");
  const celebration = document.getElementById("celebration");

  const levelFilesArray = levelFiles[selectedLevel];
  const nextFileExists = currentFileIndex + 1 < levelFilesArray.length;
  const currentLevelIndex = levelOrder.indexOf(selectedLevel);
  const nextLevelExists = currentLevelIndex + 1 < levelOrder.length;

  if (nextFileExists) {
    currentFileIndex++;
  } else if (nextLevelExists) {
    selectedLevel = levelOrder[currentLevelIndex + 1];
    currentFileIndex = 0;
  } else {
    alert("You’ve already completed all available levels!");
    moveBtn.style.display = "none";
    // Clear progress when all levels completed
    localStorage.removeItem('learnEnglishProgress');
    return;
  }

  index = 0;
  
  // Save progress when moving to next file
  saveProgress();
  
  celebration.style.display = "none";
  document.getElementById("phrase-screen").style.display = "flex";
  document.getElementById("loader").style.display = "block";
  loadPhrases(levelFiles[selectedLevel][currentFileIndex]);
}

/* =========================
   CONFETTI ANIMATION
   ========================= */
function launchConfetti() {
  const duration = 4000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 40 * (timeLeft / duration);
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: ["#0078D4", "#FFD700", "#32CD32", "#FF69B4"],
    });
  }, 250);
}

/* =========================
   UTILITIES & SPEECH
   ========================= */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function restartApp() {
  // Restart and keep the username filled in (for trying another level)
  const celebration = document.getElementById("celebration");
  const welcomeScreen = document.getElementById("welcome-screen");
  
  celebration.classList.add("rotate-out");
  setTimeout(() => {
    celebration.style.display = "none";
    celebration.classList.remove("rotate-out");
    welcomeScreen.style.display = "flex";
    welcomeScreen.classList.add("rotate-in");
  }, 600);
  
  // Keep username - user wants to try another level
  // Don't clear the input field
}

function exitApp() {
  const phraseScreen = document.getElementById("phrase-screen");
  const welcomeScreen = document.getElementById("welcome-screen");
  const celebration = document.getElementById("celebration");
  const usernameField = document.getElementById("username");

  // Hide any visible screens except welcome
  celebration.style.display = "none";
  phraseScreen.classList.remove("rotate-in", "rotate-out");
  phraseScreen.style.display = "none";
  phraseScreen.style.transform = "none"; // reset any visual shifts

  // Show welcome screen cleanly (centered)
  welcomeScreen.classList.remove("rotate-in", "rotate-out");
  welcomeScreen.style.display = "flex";
  void welcomeScreen.offsetWidth; // reflow for safe animation
  welcomeScreen.classList.add("rotate-in");

  // Keep username so user can change level without re-entering name
  // usernameField.value remains unchanged
}


function loadVoices() {
  return new Promise(resolve => {
    const fetchVoices = () => {
      voices = speechSynthesis.getVoices();
      if (voices.length) {
        voicesLoaded = true;
        resolve(voices);
      }
    };
    fetchVoices();
    speechSynthesis.onvoiceschanged = fetchVoices;
  });
}

async function speak(text, lang) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported");
    return;
  }
  
  if (!voicesLoaded) await loadVoices();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Enhanced voice matching with multiple fallbacks
  let matchedVoice = null;
  
  if (lang.includes("hi")) {
    // For Hindi, try multiple variations
    matchedVoice = 
      voices.find(v => v.lang === "hi-IN") ||
      voices.find(v => v.lang === "hi_IN") ||
      voices.find(v => v.lang.startsWith("hi")) ||
      voices.find(v => v.name.toLowerCase().includes("hindi")) ||
      voices.find(v => v.name.toLowerCase().includes("lekha")) || // Common Hindi voice on Android
      voices.find(v => v.name.toLowerCase().includes("nishi")) || // Another Hindi voice
      // Fallback to any Indian language voice
      voices.find(v => v.lang.includes("IN")) ||
      // Last resort: use default voice but set lang to Hindi
      voices[0];
    
    // Log available voices for debugging (only in development)
    if (!matchedVoice) {
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      console.warn("No Hindi voice found, using default");
    }
  } else {
    // For English, try multiple variations
    matchedVoice =
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang === "en_IN") ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang === "en-GB") ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices.find(v => v.name.toLowerCase().includes("english")) ||
      voices[0];
  }
  
  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  } else {
    // Force the language even without a specific voice
    utterance.lang = lang;
  }
  
  // Adjust speech parameters for better clarity
  utterance.rate = 0.9; // Slightly slower for better understanding
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Error handling
  utterance.onerror = (event) => {
    console.warn("Speech synthesis error:", event.error);
    // Show visual feedback if speech fails
    if (event.error === "not-allowed" || event.error === "canceled") {
      console.log("Speech was blocked or canceled");
    }
  };
  
  // Cancel any ongoing speech
  speechSynthesis.cancel();
  
  // Small delay to ensure cancel completes
  setTimeout(() => {
    try {
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis failed:", err);
    }
  }, 150);
}

/* ==========================
   Vocabulary Feature
   ========================== */

// Vocabulary database - loaded from external JSON file
let vocabularyDatabase = null;

// Track used words to prevent repetition
let usedWords = new Set();

// Load vocabulary progress from localStorage
function loadVocabularyProgress() {
  const saved = localStorage.getItem('vocabularyProgress');
  if (saved) {
    try {
      const wordsArray = JSON.parse(saved);
      usedWords = new Set(wordsArray);
      console.log('Vocabulary progress loaded:', usedWords.size, 'words learned');
    } catch (e) {
      console.error('Error loading vocabulary progress:', e);
    }
  }
}

// Save vocabulary progress to localStorage
function saveVocabularyProgress() {
  const wordsArray = Array.from(usedWords);
  localStorage.setItem('vocabularyProgress', JSON.stringify(wordsArray));
  console.log('Vocabulary progress saved:', usedWords.size, 'words');
}

async function loadVocabulary() {
  const phraseScreen = document.getElementById("phrase-screen");
  const welcomeScreen = document.getElementById("welcome-screen");

  // Load saved vocabulary progress
  loadVocabularyProgress();

  // Add transition effect
  welcomeScreen.classList.add("rotate-out");
  
  setTimeout(() => {
    welcomeScreen.style.display = "none";
    welcomeScreen.classList.remove("rotate-out");
    phraseScreen.style.display = "flex";
    phraseScreen.innerHTML = "";
  }, 600);

  try {
    // Load vocabulary database if not already loaded
    if (!vocabularyDatabase) {
      const response = await fetch("vocabulary-data.json");
      if (!response.ok) {
        throw new Error(`Failed to load vocabulary: ${response.status}`);
      }
      vocabularyDatabase = await response.json();
      console.log("Vocabulary database loaded:", vocabularyDatabase);
    }

    // Combine all difficulty levels
    const allWords = [
      ...vocabularyDatabase.beginner,
      ...vocabularyDatabase.intermediate,
      ...vocabularyDatabase.advanced
    ];

    // Filter out already used words
    const availableWords = allWords.filter(word => !usedWords.has(word.english));
    
    // If all words have been used, reset
    if (availableWords.length < 10) {
      usedWords.clear();
      availableWords.push(...allWords);
    }

    // Shuffle and select 10 random words
    const shuffled = availableWords.sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 10);

    // Mark these words as used
    selectedWords.forEach(word => usedWords.add(word.english));
    
    // Save vocabulary progress
    saveVocabularyProgress();

    // Wait for transition to complete before showing vocabulary
    setTimeout(() => {
      showVocabulary(selectedWords);
      phraseScreen.classList.add("rotate-in");
      setTimeout(() => phraseScreen.classList.remove("rotate-in"), 800);
    }, 600);

  } catch (err) {
    console.error("Error loading vocabulary:", err);
    alert("Unable to load vocabulary. Please try again.");
    welcomeScreen.style.display = "flex";
    phraseScreen.style.display = "none";
  }
}


function showVocabulary(words) {
  const phraseScreen = document.getElementById("phrase-screen");
  const totalLearned = usedWords.size;
  const totalAvailable = vocabularyDatabase.beginner.length + 
                         vocabularyDatabase.intermediate.length + 
                         vocabularyDatabase.advanced.length;
  
  phraseScreen.innerHTML = `
    <h2 style="font-size: 1.6em; margin-bottom: 0.2em; margin-top: 0;">📘 Vocabulary Builder</h2>
    <p class="vocab-subtitle" style="font-size: 0.85em; margin: 0 0 0.15em 0;">Learn 10 new words at a time</p>
    <p class="vocab-progress" style="font-size: 0.8em; margin: 0 0 0.6em 0;">
      📊 Progress: ${totalLearned} / ${totalAvailable} words learned
    </p>
    <ul style="display: grid; gap: 0.2em;">
      ${words.map((w, i) => `
        <li style="padding: 0.4em 0.7em; margin: 0; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; display: flex; align-items: center; gap: 0.5em; min-width: 0;">
            <strong style="font-size: 1em; white-space: nowrap; flex-shrink: 0;">${i + 1}. ${w.english}</strong>
            <em class="vocab-hindi" style="flex: 1; min-width: 0;">${w.hindi}</em>
          </div>
          <div style="display: flex; gap: 0.3em; flex-shrink: 0; margin-left: 0.5em;">
            <button onclick="showUsage('${w.english.replace(/'/g, "\\'")}', '${w.hindi.replace(/'/g, "\\'")}')" style="width: 60px; height: 30px; font-size: 0.75em; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; border: none; border-radius: 15px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);" title="Show usage">Usage</button>
            <button onclick="speakWord('${w.english}')" style="width: 30px; height: 30px; font-size: 0.9em;">🔊</button>
          </div>
        </li>
      `).join("")}
    </ul>
    <div class="vocab-controls" style="margin-top: 1em; display: flex; gap: 0.6em; justify-content: center; flex-wrap: wrap;">
      <button id="new-words-btn" class="vocab-btn" style="padding: 0.8em 1.4em; font-size: 0.9em; flex: 1.5; min-width: 130px;">🔄 New Words</button>
      <button id="reset-progress-btn" class="vocab-btn" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 0.8em 1.2em; font-size: 0.9em; flex: 1; min-width: 100px;">🔄 Reset</button>
      <button class="vocab-btn" onclick="exitApp()" style="padding: 0.8em 1.2em; font-size: 0.9em; flex: 1; min-width: 100px;">🏠 Home</button>
    </div>
  `;

  // Rebind buttons
  document.getElementById("new-words-btn").addEventListener("click", loadVocabulary);
  document.getElementById("reset-progress-btn").addEventListener("click", () => {
    if (confirm("Reset your vocabulary progress? This will allow you to see all words again.")) {
      usedWords.clear();
      localStorage.removeItem('vocabularyProgress');
      console.log('Vocabulary progress reset');
      loadVocabulary();
    }
  });
}

function speakWord(word) {
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

/* ==========================
   Usage Modal Feature
   ========================== */

async function showUsage(word, hindi) {
  const modal = document.getElementById("usage-modal");
  const content = document.getElementById("usage-content");
  
  // Show modal with loading state
  modal.style.display = "flex";
  content.innerHTML = `
    <h2 style="margin-top: 0; color: #667eea;">${word}</h2>
    <p style="font-size: 1.1em; color: #764ba2; font-weight: 600;">${hindi}</p>
    <div class="spinner" style="margin: 2em auto;"></div>
    <p style="text-align: center; color: #666;">Fetching usage examples...</p>
  `;
  
  try {
    // Fetch from Merriam-Webster Collegiate Dictionary API
    // Get your free API key from: https://dictionaryapi.com/register/index
    const apiKey = '9ea19909-060f-490b-9619-d85980c08d58';
    
    const response = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error("API request failed");
    }
    
    const data = await response.json();
    
    // Check if word was found (API returns array of strings if not found)
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] === 'string') {
      throw new Error("Word not found");
    }
    
    const entry = data[0];
    
    // Extract definitions and examples
    let usageHTML = `
      <h2 class="usage-title" style="margin-top: 0;">${word}</h2>
      <p class="usage-hindi" style="font-size: 1.1em; font-weight: 600; margin-bottom: 1.5em;">${hindi}</p>
    `;
    
    // Add pronunciation if available
    if (entry.hwi && entry.hwi.prs && entry.hwi.prs[0]) {
      const pronText = entry.hwi.prs[0].mw || entry.hwi.prs[0].ipa || '';
      if (pronText) {
        usageHTML += `<p class="usage-phonetic" style="font-style: italic; margin-bottom: 1em;">\\${pronText}\\</p>`;
      }
    }
    
    // Add definitions with examples
    if (entry.shortdef && entry.shortdef.length > 0) {
      // Get part of speech
      const partOfSpeech = entry.fl || '';
      
      usageHTML += `<div style="margin-bottom: 1.5em;">`;
      if (partOfSpeech) {
        usageHTML += `<h3 class="usage-pos" style="font-size: 1em; margin-bottom: 0.5em;">${partOfSpeech}</h3>`;
      }
      
      // Show up to 3 definitions
      entry.shortdef.slice(0, 3).forEach((def, idx) => {
        usageHTML += `<p class="usage-definition" style="margin: 0.5em 0;"><strong>${idx + 1}.</strong> ${def}</p>`;
        
        // Try to find examples for this definition
        if (entry.def && entry.def[0] && entry.def[0].sseq) {
          const senses = entry.def[0].sseq.flat(2);
          senses.forEach(sense => {
            if (sense.dt) {
              sense.dt.forEach(item => {
                if (item[0] === 'vis' && item[1] && item[1][0]) {
                  const exampleText = item[1][0].t
                    .replace(/{it}/g, '')
                    .replace(/{\/it}/g, '')
                    .replace(/{bc}/g, '')
                    .replace(/{wi}/g, '')
                    .replace(/{\/wi}/g, '')
                    .replace(/{phrase}/g, '')
                    .replace(/{\/phrase}/g, '')
                    .replace(/{ldquo}/g, '"')
                    .replace(/{rdquo}/g, '"');
                  if (exampleText && idx < 3) {
                    usageHTML += `<p class="usage-example" style="margin: 0.3em 0 0.5em 1.5em; font-style: italic; padding: 0.5em; border-radius: 8px;">💬 "${exampleText}"</p>`;
                  }
                }
              });
            }
          });
        }
      });
      
      usageHTML += `</div>`;
    }
    
    content.innerHTML = usageHTML;
    
  } catch (error) {
    console.error("Error fetching usage:", error);
    content.innerHTML = `
      <h2 class="usage-title" style="margin-top: 0;">${word}</h2>
      <p class="usage-hindi" style="font-size: 1.1em; font-weight: 600; margin-bottom: 1.5em;">${hindi}</p>
      <p class="usage-error" style="text-align: center;">❌ Unable to fetch usage examples.</p>
      <p class="usage-error-msg" style="text-align: center; font-size: 0.9em;">The word might not be available in the dictionary or there's a network issue.</p>
    `;
  }
}

function closeUsageModal() {
  const modal = document.getElementById("usage-modal");
  modal.style.display = "none";
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById("usage-modal");
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeUsageModal();
      }
    });
  }
});
