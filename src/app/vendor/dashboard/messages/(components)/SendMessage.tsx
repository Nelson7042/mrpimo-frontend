import { useState } from "react";

const SendMessage = ({ userId, onSend }: { userId: string, onSend: (message: string) => void }) => {
    const [message, setMessage] = useState("");
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim()) {
        onSend(message);
        setMessage("");
      }
    };
  
    return (
      <form 
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-3 bg-white flex items-center gap-2 rounded-b-2xl"
      >
        <button 
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button 
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full ${message.trim() ? 'bg-[#8baff9] text-white' : 'bg-gray-200 text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    );
  };

export default SendMessage
  