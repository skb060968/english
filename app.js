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
    }, 600);
  }, 1500);

  loadVoices();
});

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
    <button onclick="replayCurrentPhrase()" style="margin-left: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;" title="Play audio">🔊</button>
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
    <button onclick="replayTranslation()" style="margin-left: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2em; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4); transition: all 0.3s ease;" title="Play audio">🔊</button>
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
    return;
  }

  index = 0;
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

async function loadVocabulary() {
  const phraseScreen = document.getElementById("phrase-screen");
  const welcomeScreen = document.getElementById("welcome-screen");
  const loader = document.getElementById("vocab-loader");

  // Hide welcome, show loader
  welcomeScreen.style.display = "none";
  phraseScreen.style.display = "flex";
  phraseScreen.innerHTML = "";
  loader.style.display = "block";

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

    loader.style.display = "none";
    showVocabulary(selectedWords);

  } catch (err) {
    loader.style.display = "none";
    console.error("Error loading vocabulary:", err);
    alert("Unable to load vocabulary. Please try again.");
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
    <p style="font-size: 0.85em; color: #666; margin: 0 0 0.15em 0;">Learn 10 new words at a time</p>
    <p style="font-size: 0.8em; color: #999; margin: 0 0 0.6em 0;">
      📊 Progress: ${totalLearned} / ${totalAvailable} words learned
    </p>
    <ul style="display: grid; gap: 0.5em;">
      ${words.map((w, i) => `
        <li style="padding: 0.5em 0.7em; margin: 0; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; display: flex; align-items: center; gap: 0.5em; min-width: 0;">
            <strong style="font-size: 1em; white-space: nowrap; flex-shrink: 0;">${i + 1}. ${w.english}</strong>
            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.12em 0.4em; border-radius: 6px; font-size: 0.65em; white-space: nowrap; flex-shrink: 0;">${w.category}</span>
            <em style="font-size: 0.9em; color: #555; flex: 1; min-width: 0;">${w.hindi}</em>
          </div>
          <button onclick="speakWord('${w.english}')" style="width: 30px; height: 30px; font-size: 0.9em; flex-shrink: 0; margin-left: 0.5em;">🔊</button>
        </li>
      `).join("")}
    </ul>
    <div class="controls" style="margin-top: 0.8em;">
      <button id="new-words-btn" class="vocab-btn" style="padding: 0.5em 1em; font-size: 0.85em;">🔄 New Words</button>
      <button id="reset-progress-btn" class="vocab-btn" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 0.5em 1em; font-size: 0.85em;">🔄 Reset</button>
      <button class="vocab-btn" onclick="exitApp()" style="padding: 0.5em 1em; font-size: 0.85em;">🏠 Home</button>
    </div>
  `;

  // Rebind buttons
  document.getElementById("new-words-btn").addEventListener("click", loadVocabulary);
  document.getElementById("reset-progress-btn").addEventListener("click", () => {
    if (confirm("Reset your vocabulary progress? This will allow you to see all words again.")) {
      usedWords.clear();
      loadVocabulary();
    }
  });
}

function speakWord(word) {
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}
