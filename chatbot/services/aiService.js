const dotenv = require('dotenv');
dotenv.config();

/**
 * Service to interact with the Google Gemini API.
 */
class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
  }

  /**
   * Generates a response from the configured AI provider.
   */
  async generateResponse(query, subject, studentClass, language, history = []) {
    const hasGeminiKey = this.geminiApiKey && this.geminiApiKey.trim() !== '' && this.geminiApiKey !== 'your_gemini_api_key_here';

    if (hasGeminiKey) {
      return this.generateGeminiResponse(query, subject, studentClass, language, history);
    } else {
      return this.getSetupInstructions(language);
    }
  }

  /**
   * Generates a response from Google Gemini API.
   */
  async generateGeminiResponse(query, subject, studentClass, language, history = []) {
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite'
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const systemInstruction = this.buildSystemInstruction(subject, studentClass, language);
        const contents = [];
        const relevantHistory = history.slice(-10);
        
        relevantHistory.forEach(msg => {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });

        contents.push({
          role: 'user',
          parts: [{ text: `[Context: Subject/Area: ${subject}, Grade: ${studentClass}, Preferred Language: ${language}] Student Query: ${query}` }]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `HTTP status ${response.status}`;
          throw new Error(errMsg);
        }

        const responseData = await response.json();
        
        if (
          responseData.candidates &&
          responseData.candidates[0] &&
          responseData.candidates[0].content &&
          responseData.candidates[0].content.parts &&
          responseData.candidates[0].content.parts[0]
        ) {
          return responseData.candidates[0].content.parts[0].text;
        }

        throw new Error('Unexpected response structure from Gemini API');
      } catch (error) {
        console.warn(`[CHATBOT] Failed to get response using model ${model}:`, error.message);
        lastError = error;
        // If it's a validation error (like invalid API key), don't bother trying other models
        if (error.message.includes('API key') || error.message.includes('Key not valid')) {
          break;
        }
      }
    }

    console.error('Error querying Gemini API (all models failed):', lastError);
    // Instead of raw error box, return the rule-based mock response to prevent crashing
    return this.getMockResponse(query, subject, studentClass, language);
  }

  /**
   * Generates a rule-based mock response based on common queries.
   */
  getMockResponse(query, subject, studentClass, language) {
    const q = query.toLowerCase().trim();
    
    // English responses
    if (language === 'English' || !language) {
      if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
        return `💡 **Quick Answer**: Hello! I am your EduBridge AI Assistant.
🔍 **Step-by-Step**:
- How can I help you learn today?
- Select a subject or ask me a doubt in Math, Science, Social Studies, English, Hindi, or Telugu.
📝 **Example**: You can ask: "What is photosynthesis?" or "How do I solve a quadratic equation?"`;
      }
      if (q.includes('what happened') || q.includes('error') || q.includes('issue') || q.includes('problem')) {
        return `💡 **Quick Answer**: The AI models are currently busy or experiencing high demand, but I am still here to help you!
🔍 **Step-by-Step**:
- You can ask me standard subject questions.
- I will do my best to provide a quick answer from my offline knowledge base.
📝 **Example**: Ask me about formulas in Math, definitions in Science, or historical dates!`;
      }
      if (q.includes('career') || q.includes('job') || q.includes('future') || q.includes('become')) {
        return `🎯 **Career Goal**: Planning your future path!
📚 **What to Study**:
   *Class 10* -> *Select Stream (MPC/BiPC/CEC)* -> *College Degree* -> *Dream Job*
- MPC is excellent for Engineering & Technology.
- BiPC is key for Medicine & Biology.
- CEC/HEC are great for Finance, Commerce, and Humanities.
🛠️ **Key Subjects & Skills**: Hard work, regular practice, and curiosity!
🚀 **Next Step**: Focus on scoring well in your Class 10 board exams.`;
      }
      
      return `💡 **Quick Answer**: I'm in offline mode right now because the AI service is experiencing high demand.
🔍 **Step-by-Step**:
- To ask this academic doubt, please wait a moment and try again.
- Make sure to review your notes or textbooks.
📝 **Example**: If you need help with "${subject}", we can review the core definitions together.`;
    }
    
    // Hindi responses
    if (language === 'Hindi') {
      if (q.includes('hi') || q.includes('hello') || q.includes('namaste')) {
        return `💡 **त्वरित उत्तर**: नमस्ते! मैं आपका एडुब्रिज एआई सहायक हूँ।
🔍 **चरण-दर-चरण**:
- आज मैं आपको सीखने में कैसे मदद कर सकता हूँ?
- किसी विषय का चयन करें या गणित, विज्ञान, सामाजिक विज्ञान, अंग्रेजी, हिंदी या तेलुगु में कोई प्रश्न पूछें।
📝 **उदाहरण**: आप पूछ सकते हैं: "प्रकाश संश्लेषण क्या है?" या "द्विघात समीकरण कैसे हल करें?"`;
      }
      return `💡 **त्वरित उत्तर**: एआई मॉडल वर्तमान में बहुत व्यस्त हैं, लेकिन मैं आपकी मदद के लिए यहाँ हूँ।
🔍 **चरण-दर-चरण**:
- कृपया थोड़ी देर बाद पुनः प्रयास करें।
- तब तक, अपने पाठ्यपुस्तकों का अध्ययन करें।
📝 **उदाहरण**: आप अपने विषय "${subject || 'सामान्य'}" से जुड़े मुख्य परिभाषाओं को पढ़ सकते हैं।`;
    }

    // Telugu responses
    return `💡 **త్వరిత సమాధానం**: నమస్తే! నేను మీ ఎడుబ్రిడ్జ్ AI సహాయకుడిని.
🔍 **దశల వారీగా**:
- ఈ రోజు నేను మీకు చదువులో ఎలా సహాయపడగలను?
- ఏదైనా సబ్జెక్ట్ ఎంచుకోండి లేదా ప్రశ్న అడగండి.
📝 **ఉదాహరణ**: మీరు అడగవచ్చు: "కిరణజన్య సంయోగ క్రియ అంటే ఏమిటి?"`;
  }

  /**
   * Builds the system instructions prompt.
   */
  buildSystemInstruction(subject, studentClass, language) {
    return `You are "EduBridge AI Assistant", a friendly, patient, and highly encouraging virtual AI tutor.
Your target audience is school students in Classes 6 to 10 (ages 11 to 16).

PRIMARY ROLES & RESPONSIBILITIES:
1. Academic Tutor:
   - Answer student doubts in: Mathematics, Science, Social Studies, English, Hindi, Telugu, and Computer Basics.
   - If a student asks questions outside these school subjects (or general queries), politely redirect them back to school subjects or career guidance.
2. Career Guidance Advisor:
   - Help students understand career options after completing 10th class.
   - Outline clear, step-by-step paths on what they need to study, covering options like: Engineering, Doctor, Polytechnic, Diploma, Government Jobs, Defence, Teaching, and Software Jobs.

STRICT FORMATTING & RESPONSE STYLE:
- **No dense paragraphs**: Never write more than 2 short sentences in a single paragraph. Keep text blocks short and highly readable.
- **Use visual structure**: Break down all explanations using bullet points, numbered lists, bold text, or markdown tables.
- **Tone**: Extremely friendly, encouraging, and supportive. Use expressions like "Excellent question!", "Let's explore this together step-by-step!", or "You're doing great!".
- **Language Preference**: ${language || 'English'}. Respond fully in the chosen language (English, Hindi, or Telugu).
  - If the student inputs a message in a specific language (Hindi/Telugu/English), respond in that matching language regardless of the selector.

STRUCTURE FOR SUBJECT DOUBTS:
When answering academic questions, always format your response using these sections:
1. 💡 **Quick Answer**: Direct, clear answer in 1-2 sentences.
2. 🔍 **Step-by-Step**: Bullet points breaking down the logic or math steps.
3. 📝 **Example**: A simple real-life analogy or concrete example.

STRUCTURE FOR CAREER GUIDANCE:
When a student asks for career advice, always format your response using these sections:
1. 🎯 **Career Goal**: What this job does (1 sentence).
2. 📚 **What to Study**: First, write a clear, visual text-based arrow flow on its own line:
   * **Class 10** -> **[11th/12th Stream]** -> **[Entrance Exam / College Degree]** -> **[Job / Career]**
   Then, provide a brief bulleted list explaining each step of that journey.
3. 🛠️ **Key Subjects & Skills**: Specific subjects or technical skills they should focus on.
4. 🚀 **Next Step**: What the student should do right now or after Class 10.

CONTEXT FOR THIS SESSION:
- Student Grade level: ${studentClass || 'Class 8'} (Tailor concept complexity to this grade level).
- Selected Subject focus: ${subject || 'General Academic'}.
- Language Preference: ${language || 'English'}.`;
  }

  /**
   * Returns setup instructions if keys are missing.
   */
  getSetupInstructions(language) {
    if (language === 'Hindi') {
      return `### 💡 सेटअप आवश्यक है
**EduBridge AI Assistant** तैयार है, लेकिन इसके लिए Gemini API कुंजी की आवश्यकता है।

1. \`chatbot/.env\` फ़ाइल खोलें।
2. \`GEMINI_API_KEY\` में अपनी Gemini API कुंजी दर्ज करें।
3. सर्वर को पुनः आरंभ करें।`;
    } else if (language === 'Telugu') {
      return `### 💡 సెటప్ అవసరం
**EduBridge AI Assistant** సిద్ధంగా ఉంది, కానీ దీనికి Gemini API కీ అవసరం.

1. \`chatbot/.env\` ఫైల్ తెరవండి.
2. \`GEMINI_API_KEY\` లో మీ Gemini API కీని నమోదు చేయండి.
3. సర్వర్ రీస్టార్ట్ చేయండి.`;
    } else {
      return `### 💡 API Key Configuration Required
**EduBridge AI Assistant** is ready, but it requires an API Key to answer your questions.

**How to set it up:**
1. Open the file \`chatbot/.env\`.
2. Enter your API key under \`GEMINI_API_KEY\` (for Google Gemini).
3. Restart the chatbot server (\`npm start\`).`;
    }
  }

  /**
   * Returns a friendly error message when api communication fails.
   */
  getErrorMessage(language, errorText) {
    if (language === 'Hindi') {
      return `💬 **अरे नहीं!** उत्तर प्राप्त करने में कोई समस्या हुई। कृपया कुछ समय बाद पुनः प्रयास करें।
*(त्रुटि विवरण: ${errorText})*`;
    } else if (language === 'Telugu') {
      return `💬 **ఓహో!** సమాధానం పొందడంలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించు.
*(లోపం వివరాలు: ${errorText})*`;
    } else {
      return `💬 **Oops!** I ran into a small issue getting an answer. Please try again in a moment.
*(Error Details: ${errorText})*`;
    }
  }
}

module.exports = new AIService();
