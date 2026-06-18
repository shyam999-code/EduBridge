// EduBridge AI Assistant (ChatGPT Style) Client Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const sidebar = document.getElementById('app-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
  
  const btnNewChat = document.getElementById('btn-new-chat');
  const mobileNewChat = document.getElementById('mobile-new-chat');
  const sessionsList = document.getElementById('sessions-list');
  
  const gradeSelect = document.getElementById('grade-select');
  const languageSelect = document.getElementById('language-select');
  const clearAllChatsBtn = document.getElementById('clear-all-chats');
  
  const subjectSelect = document.getElementById('subject-select');
  
  const welcomeScreen = document.getElementById('welcome-screen');
  const suggestionBox = document.getElementById('suggestion-box');
  const messagesList = document.getElementById('messages-list');
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const typingIndicator = document.getElementById('typing-indicator');
  
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  
  const pillSubject = document.getElementById('pill-subject');
  const pillGrade = document.getElementById('pill-grade');
  const pillLang = document.getElementById('pill-lang');

  // --- State Manager ---
  let state = {
    sessions: [],
    activeSessionId: null
  };

  // Get User ID from query parameters to partition sessions per student
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || 'default';
  const sessionsKey = `eb_sessions_${userId}`;
  const activeIdKey = `eb_active_session_id_${userId}`;

  // Load from LocalStorage
  function loadState() {
    try {
      const savedSessions = localStorage.getItem(sessionsKey);
      const savedActiveId = localStorage.getItem(activeIdKey);
      
      if (savedSessions) {
        state.sessions = JSON.parse(savedSessions);
      }
      
      if (savedActiveId && state.sessions.some(s => s.id === savedActiveId)) {
        state.activeSessionId = savedActiveId;
      } else if (state.sessions.length > 0) {
        state.activeSessionId = state.sessions[0].id;
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      createNewSession();
    }
  }

  function saveState() {
    localStorage.setItem(sessionsKey, JSON.stringify(state.sessions));
    localStorage.setItem(activeIdKey, state.activeSessionId);
  }

  // Create a brand new chat session
  function createNewSession(subject = 'General Academic') {
    const defaultGrade = gradeSelect ? gradeSelect.value : 'Class 8';
    const defaultLang = languageSelect ? languageSelect.value : 'English';
    
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: 'New Chat',
      subject: subject,
      grade: defaultGrade,
      language: defaultLang,
      history: [],
      createdAt: new Date().toISOString()
    };
    
    state.sessions.unshift(newSession); // Add to the top of list
    state.activeSessionId = newSession.id;
    saveState();
    
    renderSessionsList();
    renderActiveSession();
    
    chatInput.focus();
  }

  // --- Suggestions Database ---
  const suggestions = {
    'General Academic': [
      { text: 'Give me 5 study tips for exams', icon: 'fa-lightbulb' },
      { text: 'Create a simple daily study timetable', icon: 'fa-calendar-days' },
      { text: 'Tell me a funny science joke!', icon: 'fa-face-laugh-beam' },
      { text: 'How do I focus better on study?', icon: 'fa-brain' }
    ],
    'Mathematics': [
      { text: 'Explain Pythagoras Theorem', icon: 'fa-triangle-exclamation' },
      { text: 'Solve step-by-step: 3x + 7 = 22', icon: 'fa-square-root-variable' },
      { text: 'What are prime numbers?', icon: 'fa-arrow-1-9' },
      { text: 'Explain fractions with an example', icon: 'fa-pizza-slice' }
    ],
    'Science': [
      { text: 'Why is the sky blue?', icon: 'fa-cloud-sun' },
      { text: 'Explain Photosynthesis simply', icon: 'fa-leaf' },
      { text: 'What is Newton\'s Third Law?', icon: 'fa-meteor' },
      { text: 'How do solar eclipses happen?', icon: 'fa-moon' }
    ],
    'Social Studies': [
      { text: 'What was the French Revolution?', icon: 'fa-monument' },
      { text: 'Tell me about the Solar System', icon: 'fa-globe' },
      { text: 'Explain what is Democracy', icon: 'fa-users' },
      { text: 'Why is water conservation important?', icon: 'fa-droplet' }
    ],
    'English': [
      { text: 'Active vs Passive Voice rules', icon: 'fa-volume-high' },
      { text: 'Give 5 examples of Metaphors', icon: 'fa-quote-left' },
      { text: 'Write a format for formal letter', icon: 'fa-envelope-open' },
      { text: 'What is a pronoun with examples?', icon: 'fa-font' }
    ],
    'Hindi': [
      { text: 'संज्ञा (Noun) की परिभाषा क्या है?', icon: 'fa-language' },
      { text: 'हिंदी में 5 मुहावरे अर्थ सहित बताएं', icon: 'fa-quote-right' },
      { text: 'विलोम शब्द क्या होते हैं?', icon: 'fa-arrow-right-arrow-left' }
    ],
    'Telugu': [
      { text: 'తెలుగు భాష గురించి వివరించండి', icon: 'fa-language' },
      { text: 'భాషాభాగాలు (Parts of Speech) అనగా నేమి?', icon: 'fa-quote-right' },
      { text: 'తెలుగులో కొన్ని నీతి పద్యాలు చెప్పండి', icon: 'fa-book' }
    ],
    'Computer Basics': [
      { text: 'What is the CPU and how does it work?', icon: 'fa-microchip' },
      { text: 'What is the difference between RAM and ROM?', icon: 'fa-memory' },
      { text: 'How does the internet work?', icon: 'fa-wifi' },
      { text: 'What is computer coding?', icon: 'fa-code' }
    ],
    'career': [
      { text: 'What streams can I take after 10th class?', icon: 'fa-graduation-cap' },
      { text: 'Tell me about Polytechnic engineering diploma', icon: 'fa-screwdriver-wrench' },
      { text: 'How can I become a Software Engineer?', icon: 'fa-terminal' },
      { text: 'What is the path to become a Doctor?', icon: 'fa-stethoscope' }
    ]
  };

  // Configure marked options
  if (window.marked) {
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });
  }

  // --- Render Helpers ---

  function renderSessionsList() {
    sessionsList.innerHTML = '';
    
    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = `session-item ${session.id === state.activeSessionId ? 'active' : ''}`;
      
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'session-title-wrapper';
      titleWrapper.innerHTML = `
        <i class="fa-regular fa-message"></i>
        <span class="session-title">${escapeHTML(session.title)}</span>
      `;
      titleWrapper.addEventListener('click', () => {
        state.activeSessionId = session.id;
        saveState();
        renderSessionsList();
        renderActiveSession();
        if (window.innerWidth <= 900) {
          toggleSidebar();
        }
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-session';
      deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
      deleteBtn.setAttribute('aria-label', `Delete Chat: ${session.title}`);
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(session.id);
      });
      
      item.appendChild(titleWrapper);
      item.appendChild(deleteBtn);
      sessionsList.appendChild(item);
    });
  }

  function renderActiveSession() {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (!activeSession) return;

    // Set configuration controls to match active session settings
    subjectSelect.value = activeSession.subject;
    gradeSelect.value = activeSession.grade;
    languageSelect.value = activeSession.language;

    // Update Input Context Pills
    updateContextPills(activeSession);
    
    // Render suggestion chips
    renderSuggestions(activeSession.subject);

    // Render message bubbles
    messagesList.innerHTML = '';
    
    if (activeSession.history.length === 0) {
      welcomeScreen.style.display = 'flex';
      messagesList.style.display = 'none';
    } else {
      welcomeScreen.style.display = 'none';
      messagesList.style.display = 'flex';
      
      activeSession.history.forEach(msg => {
        appendMessageUI(msg.sender, msg.text, false);
      });
    }
    
    scrollToBottom();
    validateSendButton();
  }

  function updateContextPills(session) {
    // Subject Pill Icon/Text
    let subjText = 'General';
    let iconClass = 'fa-book';
    
    switch(session.subject) {
      case 'Mathematics': subjText = 'Math'; iconClass = 'fa-calculator'; break;
      case 'Science': subjText = 'Science'; iconClass = 'fa-flask'; break;
      case 'Social Studies': subjText = 'Social Studies'; iconClass = 'fa-earth-americas'; break;
      case 'English': subjText = 'English'; iconClass = 'fa-spell-check'; break;
      case 'Hindi': subjText = 'Hindi'; iconClass = 'fa-language'; break;
      case 'Telugu': subjText = 'Telugu'; iconClass = 'fa-language'; break;
      case 'Computer Basics': subjText = 'Computers'; iconClass = 'fa-laptop-code'; break;
      case 'career': subjText = 'Career Guide'; iconClass = 'fa-compass'; break;
    }
    
    pillSubject.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${subjText}`;
    pillGrade.innerHTML = `<i class="fa-solid fa-user-graduate"></i> ${session.grade}`;
    pillLang.innerHTML = `<i class="fa-solid fa-earth-asia"></i> ${session.language}`;
  }

  function renderSuggestions(subject) {
    suggestionBox.innerHTML = '';
    const key = subject === 'career' ? 'career' : subject;
    const items = suggestions[key] || suggestions['General Academic'];
    
    items.slice(0, 4).forEach(item => {
      const card = document.createElement('button');
      card.className = 'suggestion-chip';
      card.setAttribute('aria-label', `Ask: ${item.text}`);
      card.innerHTML = `
        <i class="fa-solid ${item.icon}"></i>
        <span>${item.text}</span>
      `;
      suggestionBox.appendChild(card);
    });
  }

  function appendMessageUI(sender, text, animate = true) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-bubble-wrapper ${sender}`;
    if (!animate) {
      wrapper.style.animation = 'none';
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (sender === 'user') {
      bubble.textContent = text;
    } else {
      // ChatGPT style layout features a robot avatar next to the bot message
      const avatar = document.createElement('div');
      avatar.className = 'assistant-avatar';
      avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
      wrapper.appendChild(avatar);
      
      if (window.marked) {
        bubble.innerHTML = marked.parse(text);
      } else {
        bubble.textContent = text;
      }
    }
    
    wrapper.appendChild(bubble);
    messagesList.appendChild(wrapper);
    scrollToBottom();
  }

  // --- Core Actions ---

  async function sendMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Get active session
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (!activeSession) return;

    // Reset input text
    chatInput.value = '';
    chatInput.style.height = 'auto';
    validateSendButton();

    // Generate Session Title if this is the first message
    if (activeSession.history.length === 0) {
      welcomeScreen.style.display = 'none';
      messagesList.style.display = 'flex';
      
      // Auto-title from first query (truncate to 28 characters)
      activeSession.title = query.length > 28 ? query.substring(0, 25) + '...' : query;
      renderSessionsList();
    }

    // Add user message to history
    const userMsg = { sender: 'user', text: query };
    activeSession.history.push(userMsg);
    saveState();

    // Render User bubble
    appendMessageUI('user', query);

    // Show typing indicator
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          subject: activeSession.subject,
          studentClass: activeSession.grade,
          language: activeSession.language,
          history: activeSession.history.slice(0, -1) // preceding history
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      
      typingIndicator.style.display = 'none';

      const botMsgText = data.response || 'I apologize, I could not generate a response. Please try again.';
      const botMsg = { sender: 'assistant', text: botMsgText };
      
      activeSession.history.push(botMsg);
      saveState();

      appendMessageUI('assistant', botMsgText);

    } catch (error) {
      console.error('Chat API Error:', error);
      typingIndicator.style.display = 'none';
      
      let errorText = 'I am having trouble reaching the server. Please check your internet connection or make sure the chatbot backend is running.';
      if (activeSession.language === 'Hindi') {
        errorText = 'सर्वर से संपर्क करने में समस्या आ रही है। कृपया जांचें कि सर्वर चल रहा है या नहीं।';
      } else if (activeSession.language === 'Telugu') {
        errorText = 'సర్వర్‌ను సంప్రదించడంలో సమస్య ఏర్పడింది. సర్వర్ నడుస్తుందో లేదో సరిచూసుకోండి.';
      }

      appendMessageUI('assistant', `⚠️ **Error:** ${errorText}`);
    }
  }

  function deleteSession(sessionId) {
    state.sessions = state.sessions.filter(s => s.id !== sessionId);
    
    if (state.activeSessionId === sessionId) {
      if (state.sessions.length > 0) {
        state.activeSessionId = state.sessions[0].id;
      } else {
        createNewSession();
        return;
      }
    }
    
    saveState();
    renderSessionsList();
    renderActiveSession();
  }

  function clearAllChats() {
    if (confirm('Are you sure you want to delete all recent chats? This cannot be undone.')) {
      state.sessions = [];
      state.activeSessionId = null;
      localStorage.removeItem(sessionsKey);
      localStorage.removeItem(activeIdKey);
      createNewSession();
    }
  }

  // --- Helper UI controls ---

  function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
  }

  function scrollToBottom() {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function validateSendButton() {
    const hasText = chatInput.value.trim().length > 0;
    btnSend.disabled = !hasText;
    if (hasText) {
      btnSend.classList.add('enabled');
    } else {
      btnSend.classList.remove('enabled');
    }
  }

  // --- Dynamic settings changes (Applies changes to current active session) ---

  subjectSelect.addEventListener('change', (e) => {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (activeSession) {
      activeSession.subject = e.target.value;
      saveState();
      updateContextPills(activeSession);
      renderSuggestions(activeSession.subject);
      
      // Update welcome tagline description if chat is empty
      if (activeSession.history.length === 0) {
        renderActiveSession();
      }
    }
  });

  gradeSelect.addEventListener('change', (e) => {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (activeSession) {
      activeSession.grade = e.target.value;
      saveState();
      updateContextPills(activeSession);
    }
  });

  languageSelect.addEventListener('change', (e) => {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (activeSession) {
      activeSession.language = e.target.value;
      saveState();
      updateContextPills(activeSession);
    }
  });

  // Textarea auto-resize and validation
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight - 12) + 'px';
    validateSendButton();
  });

  // Send Actions
  btnSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Suggestion card clicks
  suggestionBox.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-chip');
    if (!card) return;
    
    const text = card.querySelector('span').textContent;
    chatInput.value = text;
    sendMessage();
  });

  // Sidebar controls
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', toggleSidebar);
  
  if (desktopSidebarToggle) {
    desktopSidebarToggle.addEventListener('click', () => {
      // Toggle visibility on desktop
      const isHidden = sidebar.style.display === 'none';
      sidebar.style.display = isHidden ? 'flex' : 'none';
    });
  }

  btnNewChat.addEventListener('click', () => {
    createNewSession();
    if (window.innerWidth <= 900) {
      toggleSidebar();
    }
  });

  mobileNewChat.addEventListener('click', () => {
    createNewSession();
  });

  clearAllChatsBtn.addEventListener('click', clearAllChats);

  // --- Launch App ---
  loadState();
});
