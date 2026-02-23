import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatApi } from '../services/api';
import { Send, User, Bot, MessageSquare } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6 animate-fade-in">
      {/* Channel List */}
      <div className="w-80 card flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-display font-semibold text-lg text-gray-900">Channels</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {channels.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No channels available</p>
            </div>
          ) : (
            channels.map(ch => (
              <a
                key={ch.id}
                href={`/chat/${ch.id}`}
                className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-smooth ${
                  channelId === ch.id ? 'bg-primary-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    channelId === ch.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      channelId === ch.id ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {ch.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{ch.type}</p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col">
        {!channelId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">Select a channel</h3>
              <p className="text-gray-600">Choose a channel from the list to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.fromMe
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content || msg.message}</p>
                      <p className={`text-xs mt-2 ${msg.fromMe ? 'text-primary-200' : 'text-gray-500'}`}>
                        {msg.timestamp || new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 input resize-none"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="btn btn-primary px-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
