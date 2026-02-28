// MessageBubble.tsx
import React, { useState } from "react";
import { Check, CheckCheck, Pencil, X, Send } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { useQueryClient } from "@tanstack/react-query";

interface MessageProps {
  message: {
    _id: string;
    message: string;
    createdAt: string;
    read: boolean;
    isEdited?: boolean;
    senderId: any;
    isOptimistic?: boolean;
  };
  isSent: boolean;
  onMessageVisible?: (element: HTMLElement) => void;
}

const MessageBubble: React.FC<MessageProps> = ({ message, isSent, onMessageVisible }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayText, setDisplayText] = useState(message.message);
  const [displayEdited, setDisplayEdited] = useState(message.isEdited || false);
  const queryClient = useQueryClient();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canEdit = isSent && !message.read && !message.isOptimistic;

  const handleEdit = async () => {
    if (!editText.trim() || editText.trim() === displayText) {
      setIsEditing(false);
      setEditText(displayText);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/messages/message/${message._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: editText.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setDisplayText(editText.trim());
        setDisplayEdited(true);
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
    if (e.key === 'Escape') { setIsEditing(false); setEditText(displayText); }
  };

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} group`}
      ref={(el) => {
        if (el && !isSent && !message.read && onMessageVisible) {
          onMessageVisible(el);
        }
      }}
    >
      <div className={`flex items-end gap-1 max-w-[85%] ${isSent ? 'flex-row-reverse' : ''}`}>
        {/* Bubble */}
        <div className="relative min-w-0">
          {/* Tail */}
          {isSent ? (
            <div
              className="absolute top-0 -right-2 w-3 h-3"
              style={{
                background: '#dcf8c6',
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
            />
          ) : (
            <div
              className="absolute top-0 -left-2 w-3 h-3"
              style={{
                background: 'white',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
              }}
            />
          )}
          <div
            className={`relative rounded-lg px-3 py-1.5 shadow-sm ${
              isSent
                ? 'bg-[#dcf8c6] rounded-tr-none'
                : 'bg-white rounded-tl-none'
            }`}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2 py-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="font-roboto text-xs md:text-sm bg-black/5 rounded p-1.5 text-gray-900 resize-none outline-none min-h-[36px]"
                  autoFocus
                  disabled={isSubmitting}
                />
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => { setIsEditing(false); setEditText(displayText); }} className="p-1 rounded hover:bg-black/10 text-gray-600" disabled={isSubmitting} aria-label="Cancel edit"><X size={14} /></button>
                  <button onClick={handleEdit} className="p-1 rounded hover:bg-black/10 text-gray-600" disabled={isSubmitting} aria-label="Save edit"><Send size={14} /></button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-roboto text-[13px] md:text-[14px] text-gray-900 break-words leading-[19px]">
                  {displayText}
                  {/* Invisible spacer so text doesn't overlap the time */}
                  <span className={`inline-block align-bottom ${displayEdited ? 'w-[90px]' : 'w-[60px]'}`} />
                </p>
                <span className={`float-right -mt-4 ml-2 flex items-center gap-0.5 text-[10px] leading-none ${
                  isSent ? 'text-[#7d9b7d]' : 'text-[#8696a0]'
                }`}>
                  {displayEdited && <span className="italic mr-0.5">edited</span>}
                  {formatTime(new Date(message.createdAt))}
                  {isSent && (
                    message.read
                      ? <CheckCheck size={13} className="text-[#53bdeb] ml-0.5" />
                      : <Check size={13} className="text-[#7d9b7d] ml-0.5" />
                  )}
                </span>
              </>
            )}
          </div>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 text-gray-400 flex-shrink-0"
            aria-label="Edit message"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
