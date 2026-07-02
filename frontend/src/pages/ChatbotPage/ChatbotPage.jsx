import React from 'react';
import { useOutletContext } from 'react-router-dom';

const ChatbotPage = () => {
  const { user } = useOutletContext();
  const userId = user ? user.id : 'default';

  return (
    <div
      style={{
        margin: '-2rem', // Cancels the 2rem padding of .page-container
        height: 'calc(100vh - 70px)', // Full height minus navbar (70px)
        width: 'calc(100% + 4rem)', // Expands to full width
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <iframe
        src={`https://edubridge-chatbot.onrender.com/?userId=${userId}`}
        title="EduBridge AI Assistant Chatbot"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#212121'
        }}
      />
    </div>
  );
};

export default ChatbotPage;
