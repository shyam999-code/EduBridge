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

      const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
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
        throw new Error(errorData.error?.message || `HTTP status ${response.status}`);
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
      console.error('Error querying Gemini API:', error);
      return this.getErrorMessage(language, error.message);
    }
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
