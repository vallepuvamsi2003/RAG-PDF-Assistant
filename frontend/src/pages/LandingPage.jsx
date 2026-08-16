import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUploadCloud, FiSearch, FiShield, FiCpu, FiArrowRight, 
  FiCheckCircle, FiPlay, FiMoon, FiZap, FiBook, FiMessageSquare, FiBookOpen,
  FiSun
} from 'react-icons/fi';

export default function LandingPage() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/10 dark:bg-purple-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-indigo-200/10 dark:bg-indigo-900/5 rounded-full blur-[130px] pointer-events-none"></div>
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-x-0 border-t-0 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-extrabold text-sm tracking-wider text-white">RAG</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-indigo-700 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
              PDF Assistant
            </span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 mr-4 border-r border-zinc-200 dark:border-zinc-800 pr-6">
              <a href="#about" className="text-sm font-medium text-zinc-650 dark:text-zinc-300 hover:text-indigo-600 transition-colors duration-200">Home</a>
              <a href="#features" className="text-sm font-medium text-zinc-650 dark:text-zinc-300 hover:text-indigo-600 transition-colors duration-200">Features</a>
              <a href="#workflow" className="text-sm font-medium text-zinc-650 dark:text-zinc-300 hover:text-indigo-600 transition-colors duration-200">Workflow</a>
            </div>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors mr-2 cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <FiMoon className="h-5 w-5 text-zinc-600" />
              ) : (
                <FiSun className="h-5 w-5 text-amber-500" />
              )}
            </button>
            <Link to="/login" className="text-sm font-medium text-zinc-650 dark:text-zinc-300 hover:text-indigo-650 transition-colors duration-200">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-50 font-medium text-sm text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 glow-hover">
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Banner Section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-purple-100 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-305 text-xs font-semibold mb-8">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          <span>AI-Powered Document Assistant</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6 text-zinc-900 dark:text-white">
          AI-Powered<br/>
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Document Question Answering System
          </span>
        </h1>
        
        <p className="max-w-2xl text-base md:text-lg text-zinc-600 dark:text-zinc-405 mb-10 leading-relaxed">
          Upload your PDF documents and ask questions. Our AI reads, understands and delivers accurate answers with source references.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none mx-auto">
          <Link to="/signup" className="w-full sm:w-auto px-8 h-12 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 glow-hover group">
            Get Started Free
            <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="w-full sm:w-auto px-8 h-12 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-55 dark:hover:bg-zinc-800/80 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm cursor-pointer">
            <FiPlay className="mr-2 h-4 w-4 text-indigo-650 dark:text-indigo-400" />
            View Demo
          </button>
        </div>

        {/* Feature Badges below CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 mt-14 text-xs font-semibold text-zinc-600 dark:text-zinc-400 max-w-4xl">
          <div className="flex items-center space-x-2.5">
            <FiCheckCircle className="h-5 w-5 text-emerald-500" />
            <div className="text-left">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Secure & Private</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450">100% safe & secure</p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <FiZap className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">AI-Powered</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450">Smart & Accurate</p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <FiBook className="h-5 w-5 text-amber-500" />
            <div className="text-left">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Source References</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450">Citations included</p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <FiUploadCloud className="h-5 w-5 text-purple-500" />
            <div className="text-left">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Multi-PDF Support</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450">Upload multiple files</p>
            </div>
          </div>
        </div>

        {/* About Project Section */}
        <section id="about" className="scroll-mt-32 w-full mt-28 max-w-4xl text-left border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-8 glass-panel glow-hover shadow-sm" style={{ scrollMarginTop: '130px' }}>
          <h2 className="text-xl font-bold mb-4 text-gradient inline-block">About the Project</h2>
          <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed mb-4">
            The <strong>RAG PDF Assistant</strong> is a document intelligence platform. Rather than manually reading dense reports, guides, or research papers, this tool allows you to upload documents and query them naturally.
          </p>
          <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
            It operates using a <strong>Retrieval-Augmented Generation (RAG)</strong> pipeline. This ensures that the generated responses are not based on generic training data (minimizing hallucinations), but are directly grounded in the exact facts, figures, and text parsed from your specific PDF pages.
          </p>
        </section>

        {/* Powerful Features Grid Section */}
        <section id="features" className="scroll-mt-32 w-full mt-28" style={{ scrollMarginTop: '130px' }}>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Powerful Features</span>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mt-2 mb-12">
            Everything You Need to Understand Your PDFs Better
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl text-left shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full border-b-4 border-b-purple-500">
              <div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-650 dark:text-purple-400 mb-5">
                  <FiUploadCloud className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-zinc-800 dark:text-zinc-200">Easy PDF Upload</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Upload single or multiple PDF files with drag & drop support.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl text-left shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full border-b-4 border-b-blue-500">
              <div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                  <FiMessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-zinc-800 dark:text-zinc-200">Ask Questions</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Ask anything in natural language and get instant, accurate answers.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl text-left shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full border-b-4 border-b-emerald-500">
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 mb-5">
                  <FiCheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-zinc-800 dark:text-zinc-200">Accurate Answers</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-405 leading-relaxed">
                  Our AI finds the most relevant information and gives precise answers.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl text-left shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full border-b-4 border-b-amber-500">
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                  <FiBookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-zinc-800 dark:text-zinc-200">Source References</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-405 leading-relaxed">
                  Get answers with page numbers and source references for better transparency.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl text-left shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full border-b-4 border-b-pink-500">
              <div>
                <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-650 dark:text-pink-400 mb-5">
                  <FiShield className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-zinc-800 dark:text-zinc-200">Secure & Private</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-405 leading-relaxed">
                  Your documents and data are 100% secure and never shared with anyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Diagram Mockup */}
        <section id="workflow" className="scroll-mt-32 w-full mt-28 max-w-4xl glass-panel p-8 rounded-3xl border border-indigo-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm" style={{ scrollMarginTop: '130px' }}>
          <h3 className="text-xl font-bold mb-6 text-gradient inline-block">System RAG Architecture</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <div className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300">PDF Upload</div>
            <FiArrowRight className="hidden md:block text-indigo-500" />
            <div className="px-4 py-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">PyMuPDF Text Extract</div>
            <FiArrowRight className="hidden md:block text-indigo-500" />
            <div className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300">Sentence Transformers</div>
            <FiArrowRight className="hidden md:block text-indigo-500" />
            <div className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300">FAISS Index DB</div>
            <FiArrowRight className="hidden md:block text-indigo-500" />
            <div className="px-4 py-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-305">Gemini LLM Generation</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-850 py-6 text-center text-sm text-zinc-500 mt-20 relative z-10 bg-white dark:bg-zinc-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 RAG PDF Assistant. Built with React, Python, FAISS, and Gemini.</p>
          <div className="flex space-x-4">
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
