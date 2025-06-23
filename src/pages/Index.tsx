
import React, { useState, useEffect } from 'react';
import AudioPlayer from '@/components/AudioPlayer';
import MusicIcon from '@/components/MusicIcon';

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen music-gradient-bg transition-all duration-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <MusicIcon size={64} className="animate-spin-slow" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Chrome Audio Explorer Plus
              </h1>
              <p className="text-xl text-white/80 font-medium">
                Your Ultimate Web-Based Music Player
              </p>
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <p className="text-white/70 text-lg leading-relaxed">
              Experience high-quality audio playback with advanced controls, 
              beautiful themes, and seamless file support. Play local files or stream from URLs 
              with our modern, responsive music player.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="music-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-music-purple to-music-pink flex items-center justify-center">
              <MusicIcon size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Format Support</h3>
            <p className="text-white/70">Play MP3, MP4, WAV, and other popular audio formats</p>
          </div>

          <div className="music-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-music-blue to-music-purple flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Controls</h3>
            <p className="text-white/70">Loop, volume control, progress tracking, and more</p>
          </div>

          <div className="music-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-music-pink to-music-blue flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Beautiful Themes</h3>
            <p className="text-white/70">Switch between dark and light modes seamlessly</p>
          </div>
        </div>

        {/* Main Audio Player */}
        <div className="max-w-2xl mx-auto">
          <AudioPlayer darkMode={darkMode} onThemeToggle={toggleTheme} />
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-white/60">
            <MusicIcon size={20} />
            <span className="text-sm">
              Built with React, Tailwind CSS, and modern web technologies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
