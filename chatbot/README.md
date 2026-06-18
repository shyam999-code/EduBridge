# EduBridge AI Assistant 🚀

An educational chatbot module designed for students from **Classes 6 to 10** to solve subject-related doubts and provide career roadmaps. It is a completely independent module designed for future integration into the EduBridge Smart School ERP platform.

---

## Features

1. **Academic Doubt Solver**
   - Assists students in: **Mathematics, Science, Social Studies, English, Hindi, Telugu, and Computer Basics**.
   - Customizes explanations based on the student's grade level (Class 6 to 10).
2. **Career Guidance**
   - Outlines clear, step-by-step career path roadmaps for post-10th options including: **Engineering, Doctor, Polytechnic, Diploma, Government Jobs, Defence, Teaching, and Software Jobs**.
3. **Friendly Response Style**
   - Uses simple language suitable for students.
   - Provides direct, step-by-step answers and examples.
   - Highly encouraging and supportive tone.
4. **Multilingual Support**
   - Can interact and translate in **English, Hindi (हिंदी), and Telugu (తెలుగు)**.
5. **Modern User Interface**
   - Premium dark-glassmorphism theme.
   - Collapsible sidebar for grade/subject/language controls.
   - Interactive prompt suggestions chip grid.
   - Mobile-responsive layout (adapted for phones and tablets).
   - Local chat history persistence.

---

## Technology Stack

- **Backend:** Node.js, Express, CORS, Dotenv, Native Fetch API.
- **Frontend:** HTML5 (Semantic Structure), CSS3 (Vanilla glassmorphism & gradients), Javascript (ES6), FontAwesome (Icons), Marked.js (Markdown parser).
- **AI Core:** Google Gemini API (`gemini-1.5-flash` model).

---

## Setup Instructions

### 1. Prerequisite
Ensure that Node.js (v18+) is installed on your system.

### 2. Install Dependencies
Navigate to the `chatbot/` folder and install the required NPM packages:
```bash
cd chatbot
npm install
```

### 3. Add Google Gemini API Key
1. Create a Google Gemini API Key at [Google AI Studio](https://aistudio.google.com/).
2. Open the `chatbot/.env` file.
3. Replace the key field with your actual API key:
   ```env
   PORT=5005
   GEMINI_API_KEY=AIzaSyYourActualKeyHere...
   ```

### 4. Run the Chatbot
To start the server in development mode (using nodemon):
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

### 5. Access the Web Application
Open your browser and navigate to:
[http://localhost:5005](http://localhost:5005)

---

## Integration Details
This module is built for zero side-effects. It does not alter any existing EduBridge database schemas, routes, or frontends. When you are ready to integrate it into the main app:
- Embed the frontend widget or page via an `<iframe>` pointing to the chatbot port (`5005`).
- Or migrate the routes from `server.js` and `public/` files into the main Express/Vite configurations.
