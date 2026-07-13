import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Send, Bot, User, Mic, MicOff, Copy, FileDown, 
  Trash2, Plus, PlusCircle, Paperclip, Loader2,
  Search, Edit, PanelLeftClose, PanelLeft, AlignRight,
  ArrowUp, Pin, MessageSquare, Star, MoreVertical
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  title: string;
  is_pinned: boolean;
  is_favorite: boolean;
  updated_at: string;
}

export default function Chat() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Dropdown & Rename State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleRename = async (id: string, newTitle: string) => {
    if (newTitle.trim()) {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${id}`, { title: newTitle });
        fetchConversations();
      } catch (e) {
        console.error('Failed to rename', e);
      }
    }
    setEditingId(null);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  };

  const loadConversation = async (id: string) => {
    setSessionId(id);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${id}`);
      setMessages(res.data);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) {
      console.error("Failed to load conversation", e);
    }
  };

  const createNewChat = () => {
    setSessionId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  useEffect(() => {
    // Setup Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Auto-detect Kannada text using Unicode range for Kannada (0C80-0CFF)
      const hasKannada = /[\u0C80-\u0CFF]/.test(text);
      if (language === 'kn' || hasKannada) {
        utterance.lang = 'kn-IN';
      } else {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    if (isListening) toggleListening();

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/chat/ask', {
        message: userMessage,
        conversation_id: sessionId,
        language: language
      });
      
      setSessionId(response.data.conversation_id);
      setMessages(response.data.history);
      speakText(response.data.message);
      
      // Refresh conversation list to get new titles
      fetchConversations();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the intelligence network.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = () => {
    if (messages.length === 0) {
      alert("No messages to export yet!");
      return;
    }
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;
      
      // Title
      pdf.setFontSize(18);
      pdf.setTextColor(11, 20, 38);
      pdf.text("CrimeVision Intelligence Brief", 14, yPos);
      yPos += 8;
      
      // Date and Session
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Exported on: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 15;
      
      // Messages
      pdf.setFontSize(12);
      
      messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        
        // Sender Header
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(isUser ? 30 : 59, isUser ? 64 : 130, isUser ? 175 : 246); // Blue vs Light Blue
        const senderText = isUser ? "You (User)" : "CrimeVision AI";
        
        // Check page boundary
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.text(senderText, 14, yPos);
        yPos += 7;
        
        // Content
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(40, 40, 40);
        
        // Handle potential long lines and markdown
        // Strip markdown bold/stars for simple text rendering
        const plainText = msg.content.replace(/\*\*/g, '');
        const lines = pdf.splitTextToSize(plainText, pageWidth - 28);
        
        lines.forEach((line: string) => {
          if (yPos > 280) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, 14, yPos);
          yPos += 6;
        });
        
        yPos += 10; // Space between messages
      });
      
      pdf.save(`CrimeVision_Brief_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF', error);
      alert("Failed to export PDF.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setActiveDropdown(null);
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${deleteConfirmId}`);
      fetchConversations();
      if (sessionId === deleteConfirmId) createNewChat();
    } catch (error) {
      console.error("Failed to delete", error);
    }
    setDeleteConfirmId(null);
  };

  const togglePin = async (id: string, currentPin: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${id}`, {
        is_pinned: !currentPin
      });
      fetchConversations();
    } catch (error) {
      console.error("Failed to pin", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages(prev => [...prev, { role: 'user', content: `Uploaded dataset: ${file.name}` }]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/dataset/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ Successfully processed and learned from ${response.data.records_processed} records in ${file.name}. You can now ask questions about this data.` 
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Failed to process dataset: ${error.response?.data?.detail || error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all user questions for the timeline
  const userQuestions = messages.filter(m => m.role === 'user');
  
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const pinnedConversations = filteredConversations.filter(c => c.is_pinned);
  const unpinnedConversations = filteredConversations.filter(c => !c.is_pinned);

  return (
    <div className="flex h-full bg-card text-foreground font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR (Collapsible) */}
      <div 
        className={`${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0'} 
        transition-all duration-300 ease-in-out bg-[#0B1426] flex flex-col flex-shrink-0 relative border-r border-border/50 overflow-hidden`}
      >
        <div className="p-3 flex items-center justify-between">
           <div className="flex items-center gap-2 text-foreground font-medium">
             <Bot size={20} className="text-blue-400" />
             <span className="whitespace-nowrap">CrimeVision</span>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(false)} 
             className="text-muted-foreground hover:text-foreground transition p-1 rounded-md hover:bg-secondary"
             title="Hide panel"
           >
             <PanelLeftClose size={20} />
           </button>
        </div>

        <div className="px-3 space-y-2 mt-2 z-10">
           <button onClick={createNewChat} className="flex items-center justify-between w-full p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition text-foreground shadow-sm">
             <div className="flex items-center gap-2">
               <Edit size={16} />
               New chat
             </div>
             <Plus size={16} />
           </button>
           
           <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search chats..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-secondary/80 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
             />
           </div>
        </div>
        
        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto mt-4 px-3 space-y-6 custom-scrollbar pb-6">
          {pinnedConversations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Pinned</div>
              <div className="space-y-1">
                {pinnedConversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group relative flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${sessionId === conv.id ? 'bg-secondary text-foreground' : 'hover:bg-secondary/60 text-foreground'}`}
                  >
                    <MessageSquare size={16} className={sessionId === conv.id ? 'text-blue-400 flex-shrink-0' : 'text-muted-foreground flex-shrink-0'} />
                    
                    {editingId === conv.id ? (
                      <input 
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(conv.id, editTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(conv.id, editTitle);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-background text-foreground text-sm border border-blue-500 rounded px-1 py-0.5 outline-none min-w-0 h-6"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-sm flex-1">{conv.title}</span>
                    )}
                    
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${sessionId === conv.id || activeDropdown === conv.id ? 'opacity-100' : ''}`}>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === conv.id ? null : conv.id);
                          }}
                          className="p-1 hover:text-blue-400 text-muted-foreground transition flex-shrink-0"
                          title="More options"
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        {activeDropdown === conv.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-secondary border border-border rounded-lg shadow-xl z-50 text-sm overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.is_pinned, e); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-foreground transition-colors">
                              <Pin size={14} className={conv.is_pinned ? "fill-current text-blue-400" : ""} /> {conv.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditTitle(conv.title); setEditingId(conv.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-foreground transition-colors">
                              <Edit size={14} /> Rename
                            </button>
                            <button onClick={(e) => confirmDelete(conv.id, e)} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-red-400 transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Recent</div>
            {unpinnedConversations.length === 0 ? (
               <div className="text-muted-foreground text-sm px-2 italic">No recent chats</div>
            ) : (
              <div className="space-y-1">
                {unpinnedConversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group relative flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${sessionId === conv.id ? 'bg-secondary text-foreground' : 'hover:bg-secondary/60 text-foreground'}`}
                  >
                    <MessageSquare size={16} className={sessionId === conv.id ? 'text-blue-400 flex-shrink-0' : 'text-muted-foreground flex-shrink-0'} />
                    
                    {editingId === conv.id ? (
                      <input 
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(conv.id, editTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(conv.id, editTitle);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-background text-foreground text-sm border border-blue-500 rounded px-1 py-0.5 outline-none min-w-0 h-6"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-sm flex-1">{conv.title}</span>
                    )}
                    
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${sessionId === conv.id || activeDropdown === conv.id ? 'opacity-100' : ''}`}>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === conv.id ? null : conv.id);
                          }}
                          className="p-1 hover:text-blue-400 text-muted-foreground transition flex-shrink-0"
                          title="More options"
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        {activeDropdown === conv.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-secondary border border-border rounded-lg shadow-xl z-50 text-sm overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); togglePin(conv.id, conv.is_pinned, e); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-foreground transition-colors">
                              <Pin size={14} /> Pin
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditTitle(conv.title); setEditingId(conv.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-foreground transition-colors">
                              <Edit size={14} /> Rename
                            </button>
                            <button onClick={(e) => confirmDelete(conv.id, e)} className="w-full text-left px-3 py-2 hover:bg-background flex items-center gap-3 text-red-400 transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#0B1426]">
        
        {/* Background Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          {/* Subtle Glow behind the logo */}
          <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
          <img 
            src="/logo.png?v=4" 
            alt="Watermark" 
            className="w-[85vw] max-w-[1200px] h-auto opacity-[0.4] blur-md mix-blend-screen z-0 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]"
            style={{ 
              animation: 'chatFloat 8s ease-in-out infinite'
            }}
          />
          <style>{`
            @keyframes chatFloat {
              0% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.3)); }
              50% { transform: translateY(-20px) scale(1.02); filter: drop-shadow(0 0 35px rgba(59, 130, 246, 0.6)); }
              100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.3)); }
            }
          `}</style>
        </div>

        {/* Header - shown only if sidebar is closed */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition bg-transparent border border-border/50 cursor-pointer backdrop-blur-sm"
              title="Open sidebar"
            >
              <PanelLeft size={20} strokeWidth={2} />
            </button>
          )}
          <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-sm ml-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            <span className="text-foreground text-sm font-medium">Gemini 2.5 Flash</span>
            <span className="text-muted-foreground text-xs">• RAG Active</span>
          </div>
        </div>

        {/* Action Header Tools (Export) */}
        <div className="absolute top-4 right-8 z-50 flex gap-2">
          <button onClick={exportPDF} className="p-2 bg-secondary/80 backdrop-blur-sm hover:border-border rounded-full transition-colors text-foreground shadow-md border border-border cursor-pointer" title="Export as PDF">
            <FileDown size={16} />
          </button>
        </div>

        {/* Chat Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-10 custom-scrollbar" ref={chatContainerRef}>
          
          <div className="max-w-3xl mx-auto space-y-6 pb-32 mt-12">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[40vh] animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center justify-center space-y-4 border-border/30 backdrop-blur-lg p-8 rounded-3xl border border-slate-600/50 shadow-2xl">
                  <Bot size={56} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  <h2 className="text-2xl font-semibold text-slate-100">How can I assist you today?</h2>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1 border border-border shadow-sm">
                    <Bot size={18} className="text-blue-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-secondary/90 backdrop-blur-sm text-slate-100 rounded-br-sm border border-border/50' 
                    : 'bg-[#151f32]/90 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed prose-p:text-foreground prose-headings:text-slate-100 prose-a:text-blue-400">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-[15px]">{msg.content}</div>
                  )}
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-start mt-2">
                      <button onClick={() => copyToClipboard(msg.content)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary">
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full border-border flex items-center justify-center flex-shrink-0 mt-1 border border-slate-600 shadow-sm">
                    <User size={18} className="text-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                  <Loader2 size={16} className="text-blue-400 animate-spin" />
                </div>
                <div className="text-muted-foreground text-sm py-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* RIGHT TIMELINE STRIP */}
        {userQuestions.length > 0 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2/3 flex items-center pr-1 z-20">
            {/* The horizontal lines strip */}
            <div 
              className="w-4 h-full flex flex-col justify-around py-4 cursor-pointer hover:bg-secondary/50 rounded-l-md transition group"
              onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            >
               {/* Generate visual horizontal lines proportional to questions */}
               {Array.from({length: Math.min(20, Math.max(5, userQuestions.length))}).map((_, i) => (
                 <div key={i} className="h-[2px] w-full bg-slate-600 group-hover:bg-slate-400 transition-colors"></div>
               ))}
            </div>

            {/* Timeline Popup Menu */}
            {isTimelineOpen && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 max-h-[80vh] overflow-y-auto bg-secondary border border-border rounded-xl shadow-2xl p-2 z-30 custom-scrollbar animate-in slide-in-from-right-4 fade-in">
                <div className="text-xs text-muted-foreground font-semibold mb-2 px-2 uppercase tracking-wider">Search Timeline</div>
                <div className="space-y-1">
                  {userQuestions.map((q, idx) => (
                    <div key={idx} className="text-sm text-foreground hover:text-foreground hover:border-border px-3 py-2 rounded-lg cursor-pointer truncate transition-colors" title={q.content}>
                      {q.content}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INPUT AREA */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0B1426] via-[#0B1426] to-transparent pt-6 pb-6 px-4 z-20">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <div className="relative flex items-center bg-secondary/90 backdrop-blur-md rounded-3xl pl-4 pr-2 py-2 shadow-2xl border border-border focus-within:border-slate-600 transition-colors">
              
              <label className="cursor-pointer text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors flex-shrink-0" title="Add File">
                <Paperclip size={20} />
                <input type="file" className="hidden" accept=".csv,.xlsx,.json" onChange={handleFileUpload} />
              </label>

              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Listening..." : "Ask CrimeVision..."}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-slate-100 placeholder-slate-400 text-base leading-tight py-2.5 px-2"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '150px' }}
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors ${
                    isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Voice Input"
                >
                  <Mic size={20} />
                </button>
                
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="p-2 ml-1 bg-white hover:bg-slate-200 text-slate-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center w-8 h-8"
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <Trash2 size={24} />
              <h3 className="text-xl font-semibold text-foreground">Delete Conversation?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this chat history? This action cannot be undone and you will lose all insights.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={performDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
