import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  FiLogOut, FiUploadCloud, FiFileText, FiTrash2, FiSend,
  FiCornerDownRight, FiUser, FiDownload, FiInfo,
  FiChevronDown, FiChevronUp, FiEye, FiGrid, FiMessageSquare,
  FiFolder, FiSearch, FiClock, FiSun, FiMoon, FiMoreVertical,
  FiMessageCircle, FiPlus
} from 'react-icons/fi';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  /* ── Theme ── */
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  /* ── Nav ── */
  const [activeTab, setActiveTab] = useState('chat');

  /* ── Documents ── */
  const [documents, setDocuments]     = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Chat ── */
  const [chatHistories, setChatHistories] = useState({});
  const [question, setQuestion]           = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [expandedRefs, setExpandedRefs]   = useState({});

  /* ── Chat history sessions (persisted) ── */
  const [chatSessions, setChatSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ragChatSessions') || '[]'); }
    catch { return []; }
  });
  const [openMenuId, setOpenMenuId]   = useState(null);
  const currentSessionRef             = useRef(null);

  /* ── Upload ── */
  const [dragActive, setDragActive]       = useState(false);
  const [uploadStatus, setUploadStatus]   = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]     = useState('');

  /* ── Profile ── */
  const [profileData, setProfileData] = useState(null);

  /* ── Refs ── */
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const menuRef        = useRef(null);

  /* ══════════════ Effects ══════════════ */
  useEffect(() => { fetchDocuments(); }, []);

  useEffect(() => {
    localStorage.setItem('ragChatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, selectedDoc, loadingAnswer]);

  useEffect(() => {
    if (activeTab === 'profile' && !profileData) fetchProfile();
  }, [activeTab]);

  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ══════════════ Data Fetchers ══════════════ */
  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/documents');
      setDocuments(res.data);
    } catch (err) { console.error('Failed to load documents', err); }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      setProfileData(res.data);
    } catch (err) { console.error('Failed to fetch profile', err); }
  };

  /* ══════════════ Handlers ══════════════ */
  const handleNewChat = () => {
    currentSessionRef.current = null;
    setSelectedDoc(null);
    setQuestion('');
    setActiveTab('chat');
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleMultipleFilesUpload(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) handleMultipleFilesUpload(Array.from(e.target.files));
  };

  const handleMultipleFilesUpload = async (files) => {
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) {
      setUploadStatus('error'); setUploadError('Only PDF files are supported.');
      setTimeout(() => setUploadStatus('idle'), 4000); return;
    }
    setUploadStatus('uploading'); setUploadError(''); setUploadProgress(10);
    try {
      for (let i = 0; i < pdfs.length; i++) {
        setUploadStatus('indexing');
        setUploadProgress(Math.floor(((i + 0.5) / pdfs.length) * 100));
        const form = new FormData();
        form.append('file', pdfs[i]);
        const res = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (i === pdfs.length - 1) setSelectedDoc(res.data);
        await fetchDocuments();
      }
      setUploadProgress(100); setUploadStatus('success');
      setTimeout(() => { setUploadStatus('idle'); setUploadProgress(0); setActiveTab('chat'); }, 1500);
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err.response?.data?.error || 'Indexing failed. Please try again.');
      setTimeout(() => setUploadStatus('idle'), 5000);
      await fetchDocuments();
    }
  };

  const handleDeleteDoc = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/api/document/${docId}`);
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      const h = { ...chatHistories }; delete h[docId]; setChatHistories(h);
      fetchDocuments();
    } catch (err) { console.error('Delete failed:', err); alert('Failed to delete.'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedDoc || loadingAnswer) return;
    const q = question.trim(); setQuestion(''); 
    const docId = selectedDoc.id;
    const history = chatHistories[docId] || [];
    if (history.length === 0) currentSessionRef.current = null;

    const userMsg = { sender: 'user', text: q, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updated = [...history, userMsg];
    setChatHistories(p => ({ ...p, [docId]: updated }));
    setLoadingAnswer(true);

    try {
      const res = await api.post('/api/chat', { document_id: docId, question: q });
      const aiMsg = {
        sender: 'ai',
        text: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        references: res.data.references || []
      };
      const final = [...updated, aiMsg];
      setChatHistories(p => ({ ...p, [docId]: final }));
      saveSession(docId, selectedDoc.filename, final);
    } catch (err) {
      const errMsg = { sender: 'ai', text: err.response?.data?.error || 'Failed to get answer.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true };
      setChatHistories(p => ({ ...p, [docId]: [...updated, errMsg] }));
    } finally { setLoadingAnswer(false); }
  };

  const toggleReferences = (key) => setExpandedRefs(p => ({ ...p, [key]: !p[key] }));

  /* ── Session management ── */
  const saveSession = (docId, docName, messages) => {
    if (!messages?.length) return;
    const title = (messages.find(m => m.sender === 'user')?.text || 'Chat Session').slice(0, 60);

    // If no current session ref, always create a brand-new unique ID
    // (never reuse an ID that may have been deleted)
    if (!currentSessionRef.current) {
      currentSessionRef.current = `${docId}_${Date.now()}`;
    }
    const sid = currentSessionRef.current;

    setChatSessions(prev => {
      const idx = prev.findIndex(s => s.id === sid);
      if (idx !== -1) {
        // Update existing session in place
        const u = [...prev]; u[idx] = { ...u[idx], messages, title }; return u;
      }
      // Create new session entry
      const newS = { id: sid, docId, docName, title, messages, createdAt: new Date().toISOString() };
      return [newS, ...prev].slice(0, 50);
    });
  };

  const handleRestoreSession = (session) => {
    const doc = documents.find(d => d.id === session.docId);
    currentSessionRef.current = session.id;
    setSelectedDoc(doc || { id: session.docId, filename: session.docName, _orphaned: true });
    setChatHistories(p => ({ ...p, [session.docId]: session.messages }));
    setActiveTab('chat');
  };

  const handleDeleteSession = (sid, e) => {
    e.stopPropagation();
    setOpenMenuId(null);

    // If the user is deleting the currently active session, clear the ref
    // so that sending a new message creates a fresh entry instead of
    // resurrecting the just-deleted session.
    if (currentSessionRef.current === sid) {
      currentSessionRef.current = null;
      // Also wipe the in-memory chat so the restored view is clean
      // (the messages that were part of the deleted session should not auto-save again)
      const docId = selectedDoc?.id;
      if (docId) {
        setChatHistories(prev => {
          const updated = { ...prev };
          delete updated[docId];
          return updated;
        });
        setSelectedDoc(null);
      }
    }

    setChatSessions(p => p.filter(s => s.id !== sid));
  };

  /* ── Utils ── */
  const formatBytes = (b) => {
    if (!b) return '0 B';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };
  const formatDate = (s) => new Date(s).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const groupSessionsByDate = () => {
    const now = Date.now();
    const todayStart = new Date().setHours(0,0,0,0);
    const yesterdayStart = todayStart - 86400000;
    const weekStart     = todayStart - 7 * 86400000;
    const g = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };
    chatSessions.forEach(s => {
      const t = new Date(s.createdAt).getTime();
      if (t >= todayStart) g.Today.push(s);
      else if (t >= yesterdayStart) g.Yesterday.push(s);
      else if (t >= weekStart) g['Previous 7 Days'].push(s);
      else g.Older.push(s);
    });
    return g;
  };

  /* ── Derived ── */
  const currentMessages    = selectedDoc ? chatHistories[selectedDoc.id] || [] : [];
  const totalChunks        = documents.reduce((a, d) => a + (d.chunks || 0), 0);
  const filteredDocuments  = documents.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  const sessionGroups      = groupSessionsByDate();

  /* ══════════════════════════════════════════
     SHARED HEADER for non-chat tabs
  ══════════════════════════════════════════ */
  const TabHeader = ({ title }) => (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-900 flex-shrink-0 shadow-sm">
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{title}</h3>
      <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" title="Toggle theme">
        {theme === 'light' ? <FiMoon className="h-4 w-4 text-zinc-500" /> : <FiSun className="h-4 w-4 text-amber-500" />}
      </button>
    </header>
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">

      {/* ════════════════ ChatGPT-style LEFT SIDEBAR ════════════════ */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col bg-zinc-50 dark:bg-[#111111] border-r border-zinc-200 dark:border-zinc-800 transition-colors duration-200 z-20">

        {/* Brand */}
        <div className="h-14 flex items-center px-4 gap-2.5 flex-shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
            <span className="font-extrabold text-[11px] text-white tracking-wide">RAG</span>
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-zinc-900 to-indigo-700 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
            PDF Assistant
          </span>
        </div>

        {/* ── New Chat Button ── */}
        <div className="px-3 pb-3 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-zinc-700 dark:text-zinc-300 text-sm font-semibold transition-all duration-200 cursor-pointer group shadow-sm"
          >
            <FiPlus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200 flex-shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* ── Chat History List ── */}
        <div className="flex-grow overflow-y-auto px-2 py-1 min-h-0" ref={menuRef}>
          {chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-3">
              <FiMessageCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                No conversations yet.<br />Click <strong>New Chat</strong> to begin.
              </p>
            </div>
          ) : (
            Object.entries(sessionGroups).map(([group, sessions]) =>
              sessions.length > 0 && (
                <div key={group} className="mb-3">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1.5 sticky top-0 bg-zinc-50 dark:bg-[#111111]">
                    {group}
                  </p>
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleRestoreSession(session)}
                      className={`relative group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                        currentSessionRef.current === session.id
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <FiMessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-[13px] truncate flex-grow leading-tight">{session.title}</span>

                      {/* Three-dot button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(p => p === session.id ? null : session.id); }}
                        className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                      >
                        <FiMoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown */}
                      {openMenuId === session.id && (
                        <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>

        {/* ── Bottom Nav (icon + label rows) ── */}
        <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-3 pt-2 space-y-0.5">
          {[
            { icon: FiGrid,        label: 'Dashboard',  tab: 'dashboard' },
            { icon: FiUploadCloud, label: 'Upload PDF', tab: 'upload'    },
            { icon: FiFolder,      label: 'Documents',  tab: 'documents' },
            { icon: FiUser,        label: 'Profile',    tab: 'profile'   },
          ].map(({ icon: Icon, label, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ── User card & Sign Out ── */}
        <div className="flex-shrink-0 px-3 pt-2 pb-3 border-t border-zinc-200 dark:border-zinc-800 mt-1">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
              title="Toggle theme"
            >
              {theme === 'light' ? <FiMoon className="h-3.5 w-3.5 text-zinc-500" /> : <FiSun className="h-3.5 w-3.5 text-amber-500" />}
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <FiLogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ════════════════ MAIN CONTENT ════════════════ */}
      <main className="flex-grow flex flex-col overflow-hidden">

        {/* ╔══════════════════════════════╗
            ║   TAB: CHAT ASSISTANT        ║
            ╚══════════════════════════════╝ */}
        {activeTab === 'chat' && (
          selectedDoc ? (
            /* ─── Active Chat Window ─── */
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">

              {/* Chat Header */}
              <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-5 flex items-center justify-between bg-white dark:bg-zinc-900 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <FiFileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[300px]">
                    {selectedDoc.filename}
                  </span>
                  {selectedDoc._orphaned && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-full font-semibold flex-shrink-0">
                      Document deleted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!selectedDoc._orphaned && (
                    <>
                      <a
                        href={`/api/document/${selectedDoc.id}/view`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FiEye className="h-3.5 w-3.5" /> View PDF
                      </a>
                      <a
                        href={`/api/document/${selectedDoc.id}/download`}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FiDownload className="h-3.5 w-3.5" /> Download
                      </a>
                    </>
                  )}
                  <button
                    onClick={handleNewChat}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <FiPlus className="h-3.5 w-3.5" /> New Chat
                  </button>
                </div>
              </header>

              {/* Messages List */}
              <div className="flex-grow overflow-y-auto bg-white dark:bg-zinc-950 px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {currentMessages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 flex items-center justify-center mb-4 shadow-sm">
                        <FiMessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">Start asking questions</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-6">
                        Ask anything about <strong className="text-zinc-700 dark:text-zinc-300">{selectedDoc.filename}</strong>.
                        The AI will search through the document and reply with page citations.
                      </p>
                      <div className="w-full max-w-md space-y-2">
                        {[
                          'Provide a detailed summary of this document.',
                          'What are the core topics or key findings?',
                          'List the main conclusions or recommendations.',
                        ].map(q => (
                          <button
                            key={q}
                            onClick={() => setQuestion(q)}
                            className="w-full p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
                          >
                            "{q}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    currentMessages.map((msg, index) => {
                      const isUser   = msg.sender === 'user';
                      const msgKey   = `${selectedDoc.id}_${index}`;
                      const isExpanded = expandedRefs[msgKey];

                      return (
                        <div key={index} className="w-full">
                          {/* Sender row */}
                          <div className={`flex items-center gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-bold text-white">AI</span>
                              </div>
                            )}
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isUser ? 'text-zinc-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                              {isUser ? 'You' : 'Assistant'}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">· {msg.timestamp}</span>
                            {isUser && (
                              <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                <FiUser className="h-3 w-3 text-zinc-500" />
                              </div>
                            )}
                          </div>

                          {/* Bubble */}
                          <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                            <div
                              className={`rounded-2xl px-5 py-3.5 text-base leading-relaxed max-w-[85%] ${
                                isUser
                                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/15'
                                  : msg.isError
                                  ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-tl-sm w-full'
                                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-tl-sm w-full'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              {/* Source references */}
                              {!isUser && msg.references?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                  <button
                                    onClick={() => toggleReferences(msgKey)}
                                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold cursor-pointer transition-colors"
                                  >
                                    {isExpanded ? 'Hide Sources' : `Show Sources (${msg.references.length})`}
                                    {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-3 space-y-2">
                                      {msg.references.map(ref => (
                                        <div key={ref.source_id || ref.id} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                                            <span className="flex items-center gap-1.5">
                                              <FiCornerDownRight className="h-3 w-3" /> Source {ref.source_id || ref.id}
                                            </span>
                                            <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2 py-0.5 rounded-lg font-bold">
                                              Page {ref.page}
                                            </span>
                                          </div>
                                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">"{ref.text}"</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {loadingAnswer && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">AI</span>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Assistant</span>
                        <span className="text-[10px] text-zinc-400">· Thinking...</span>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl rounded-tl-sm px-5 py-4 inline-flex">
                        <div className="flex items-center space-x-1.5">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── Input bar ── */}
              <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex items-center">
                  <input
                    type="text"
                    placeholder={selectedDoc._orphaned ? 'This document has been deleted.' : `Message about "${selectedDoc.filename}"...`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loadingAnswer || !!selectedDoc._orphaned}
                    className="w-full h-12 pl-5 pr-14 rounded-2xl text-base text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-zinc-400 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || loadingAnswer || !!selectedDoc._orphaned}
                    className="absolute right-2.5 h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FiSend className="h-3.5 w-3.5" />
                  </button>
                </form>
                <p className="text-center text-[11px] text-zinc-400 mt-2">
                  AI may not always be accurate. Verify important information from sources.
                </p>
              </div>
            </div>

          ) : (
            /* ─── No doc selected: Welcome + Doc Selection ─── */
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
              <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-5 flex items-center justify-between bg-white dark:bg-zinc-900 flex-shrink-0 shadow-sm">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Chat Assistant</span>
                <button onClick={handleNewChat}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
                  <FiPlus className="h-3.5 w-3.5" /> New Chat
                </button>
              </header>

              <div className="flex-grow overflow-y-auto flex flex-col items-center justify-center p-8">
                <div className="max-w-2xl w-full text-center">
                  {/* Logo */}
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 mx-auto mb-5">
                    <span className="font-extrabold text-xl text-white">RAG</span>
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    What would you like to explore?
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                    Select a document below to start a conversation, or upload a new PDF.
                  </p>

                  {documents.length === 0 ? (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center">
                      <FiUploadCloud className="h-10 w-10 text-zinc-400 mb-3" />
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No documents yet</p>
                      <p className="text-xs text-zinc-500 mb-4">Upload a PDF to start chatting</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-md"
                      >
                        Upload PDF
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {documents.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => { currentSessionRef.current = null; setSelectedDoc(doc); }}
                          className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer flex items-start gap-3 transition-all group shadow-sm"
                        >
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/40 transition-colors">
                            <FiFileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-grow">
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{doc.filename}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{formatBytes(doc.file_size)} · {doc.chunks || 0} chunks</p>
                          </div>
                          <FiChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-indigo-600 -rotate-90 flex-shrink-0 mt-1.5 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length > 0 && (
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-5 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold mx-auto transition-colors cursor-pointer"
                    >
                      <FiUploadCloud className="h-4 w-4" /> Upload another PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* ╔══════════════════════════════╗
            ║   TAB: DASHBOARD             ║
            ╚══════════════════════════════╝ */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col min-h-0">
            <TabHeader title="Dashboard Overview" />
            <div className="flex-grow overflow-y-auto px-8 py-8 space-y-8 max-w-5xl bg-zinc-50 dark:bg-zinc-950">
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100/60 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                  Welcome back, {user?.name}! 👋
                </h2>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-2 max-w-xl leading-relaxed">
                  Unlock deeper insights from your documents using Retrieval-Augmented Generation. Index PDFs, query them with AI, and view references instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Uploaded Files', value: documents.length },
                  { label: 'Vector Chunks', value: totalChunks },
                  { label: 'Chat Sessions', value: chatSessions.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{label}</span>
                    <p className="text-2xl font-black mt-1.5 text-gradient">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={handleNewChat} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-between group">
                    <div><h4 className="font-bold text-zinc-800 dark:text-zinc-200">New Chat</h4><p className="text-xs text-zinc-500 mt-1">Start a fresh AI conversation</p></div>
                    <FiPlus className="h-6 w-6 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div onClick={() => setActiveTab('upload')} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-between group">
                    <div><h4 className="font-bold text-zinc-800 dark:text-zinc-200">Upload PDF</h4><p className="text-xs text-zinc-500 mt-1">Index files into FAISS vector store</p></div>
                    <FiUploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <FiInfo className="text-indigo-500" /> Getting Started
                </h4>
                <ul className="text-xs text-zinc-500 space-y-3 list-disc pl-4 leading-relaxed">
                  <li>Go to <strong className="text-zinc-700 dark:text-indigo-400">Upload PDF</strong> to index your documents into the FAISS vector database.</li>
                  <li>Click <strong className="text-zinc-700 dark:text-indigo-400">New Chat</strong> and select a document to start asking AI questions.</li>
                  <li>Expand <strong className="text-zinc-700 dark:text-indigo-400">Source References</strong> below answers to see exact page citations.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ╔══════════════════════════════╗
            ║   TAB: UPLOAD               ║
            ╚══════════════════════════════╝ */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col min-h-0">
            <TabHeader title="PDF Upload Workspace" />
            <div className="flex-grow overflow-y-auto flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full bg-zinc-50 dark:bg-zinc-950">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Upload PDF Documents</h3>
                <p className="text-xs text-zinc-500 mt-2">Index multiple PDF documents into your secure FAISS vector store.</p>
              </div>

              <div
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[300px] ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} multiple className="hidden" />
                {uploadStatus === 'idle' && (
                  <>
                    <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-zinc-800 border border-indigo-100 dark:border-zinc-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                      <FiUploadCloud className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Drag & Drop PDF files here</p>
                    <p className="text-xs text-zinc-500 mt-1">or click to browse (supports multi-upload)</p>
                  </>
                )}
                {(uploadStatus === 'uploading' || uploadStatus === 'indexing') && (
                  <div className="w-full max-w-sm space-y-4">
                    <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto"></div>
                    <p className="text-sm font-semibold text-indigo-600 capitalize">
                      {uploadStatus === 'uploading' ? 'Uploading files...' : 'Running vector indexing pipeline...'}
                    </p>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="space-y-2">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto text-lg">✓</div>
                    <p className="text-sm font-semibold text-emerald-600">Successfully Indexed!</p>
                    <p className="text-xs text-zinc-500">Redirecting to chat...</p>
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="space-y-2">
                    <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto text-lg">!</div>
                    <p className="text-sm font-semibold text-red-600">Processing Failed</p>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">{uploadError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ╔══════════════════════════════╗
            ║   TAB: DOCUMENTS            ║
            ╚══════════════════════════════╝ */}
        {activeTab === 'documents' && (
          <div className="flex-1 flex flex-col min-h-0">
            <TabHeader title="Document Management" />
            <div className="flex-grow overflow-y-auto px-8 py-8 space-y-6 max-w-5xl bg-zinc-50 dark:bg-zinc-950">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Indexed Files Catalog</p>
                  <p className="text-xs text-zinc-500 mt-1">View, download, chat with, or delete indexed documents.</p>
                </div>
                <div className="relative w-full sm:w-72 flex items-center">
                  <FiSearch className="absolute left-3 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text" placeholder="Search files..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 transition-all placeholder-zinc-400 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900">
                  <FiFileText className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">{searchQuery ? 'No matching documents' : 'No documents uploaded yet'}</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4 pl-6">Document Name</th>
                        <th className="p-4">File Size</th>
                        <th className="p-4">Upload Date</th>
                        <th className="p-4">FAISS Index</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map(doc => (
                        <tr key={doc.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-4 pl-6 font-semibold text-zinc-800 dark:text-zinc-200">
                            <div className="flex items-center gap-3">
                              <FiFileText className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                              <span className="truncate max-w-xs">{doc.filename}</span>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-500">{formatBytes(doc.file_size)}</td>
                          <td className="p-4 text-zinc-500">
                            <div className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {formatDate(doc.uploaded_at)}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded">
                              {doc.chunks || 0} Chunks
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { currentSessionRef.current = null; setSelectedDoc(doc); setActiveTab('chat'); }}
                                className="px-2.5 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                              >Chat</button>
                              <a href={`/api/document/${doc.id}/view`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 transition-colors">
                                <FiEye className="h-3.5 w-3.5" />
                              </a>
                              <a href={`/api/document/${doc.id}/download`}
                                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 transition-colors">
                                <FiDownload className="h-3.5 w-3.5" />
                              </a>
                              <button onClick={(e) => handleDeleteDoc(e, doc.id)}
                                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-600 dark:text-red-400 border border-zinc-200 dark:border-zinc-700 hover:border-red-200 transition-colors cursor-pointer">
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ╔══════════════════════════════╗
            ║   TAB: PROFILE              ║
            ╚══════════════════════════════╝ */}
        {activeTab === 'profile' && (
          <div className="flex-1 flex flex-col min-h-0">
            <TabHeader title="User Profile" />
            <div className="flex-grow overflow-y-auto px-8 py-8 space-y-6 max-w-4xl bg-zinc-50 dark:bg-zinc-950">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center space-y-4 shadow-sm">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">{user?.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{user?.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-full uppercase tracking-wider">
                    Member: Active
                  </span>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Account Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                      {[
                        { label: 'Full Name', value: user?.name },
                        { label: 'Email Address', value: user?.email },
                        { label: 'Joined Date', value: profileData?.created_at ? formatDate(profileData.created_at) : 'Retrieving...' },
                        { label: 'Status', value: '✓ Verified', green: true },
                      ].map(({ label, value, green }) => (
                        <div key={label}>
                          <span className="text-zinc-500 block font-semibold uppercase tracking-wider text-[10px]">{label}</span>
                          <span className={`font-bold mt-1 block ${green ? 'text-emerald-600' : 'text-zinc-800 dark:text-zinc-200'}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Usage Stats</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { label: 'Documents', value: documents.length },
                        { label: 'Vector Chunks', value: totalChunks },
                        { label: 'Chat Sessions', value: chatSessions.length },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
                          <p className="text-xl font-bold mt-1 text-indigo-700 dark:text-indigo-400">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
