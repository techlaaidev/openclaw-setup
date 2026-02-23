import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatApi } from '../services/api';
import { Send, User, Bot } from 'lucide-react';

export default function Chat() {
  const { channelId } = useParams();
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (channelId) {
      loadMessages(channelId);
    }
  }, [channelId]);

  const loadChannels = async () => {
    try {
      const { data } = await chatApi.getChannels();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id) => {
    try {
      const { data } = await chatApi.getMessages(id, 50);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !channelId) return;

    setSending(true);
    try {
      await chatApi.sendMessage(channelId, input);
      setInput('');
      loadMessages(channelId);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Channel List */}
      <div className="w-64 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Channels</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {channels.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No channels available</p>
          ) : (
            channels.map(ch => (
              <a
                key={ch.id}
                href={`/chat/${ch.id}`}
                className={`block p-4 border-b hover:bg-gray-50 ${channelId === ch.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{ch.type}</p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!channelId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${msg.fromMe ? 'bg-blue-600 text-white' : 'bg-white shadow'}`}>
                    <p className="whitespace-pre-wrap">{msg.content || msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.fromMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.timestamp || new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex space-x-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-xl px-4 py-2 resize-none"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
