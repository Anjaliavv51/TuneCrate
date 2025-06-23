
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Upload, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AudioPlayerProps {
  darkMode: boolean;
  onThemeToggle: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ darkMode, onThemeToggle }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentSong, setCurrentSong] = useState<string>('');
  const [songTitle, setSongTitle] = useState<string>('No song selected');
  const [fileUrl, setFileUrl] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isMuted, isLooping]);

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) {
      toast.error('Please select an audio file first');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Playback failed:', error);
        toast.error('Failed to play audio. Please check the file format.');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentSong(url);
      setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
      setIsPlaying(false);
      setCurrentTime(0);
      toast.success(`Loaded: ${file.name}`);
    }
  };

  const handleUrlLoad = () => {
    if (!fileUrl.trim()) {
      toast.error('Please enter a valid file URL');
      return;
    }

    setCurrentSong(fileUrl.trim());
    setSongTitle(fileUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Audio File');
    setIsPlaying(false);
    setCurrentTime(0);
    toast.success('Audio URL loaded successfully');
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  return (
    <div className="space-y-6">
      {/* Theme Toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={onThemeToggle}
          className="music-button text-white hover:bg-white/20"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* File Input Section */}
      <Card className="music-card p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="text-lg font-semibold mb-3 block">
              Upload Audio File
            </Label>
            <div className="flex gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="music-button bg-gradient-to-r from-music-purple to-music-pink text-white hover:from-music-purple-dark hover:to-music-pink-dark"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-1" />
            <span className="text-sm text-muted-foreground px-3">OR</span>
            <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-1" />
          </div>

          <div>
            <Label htmlFor="url-input" className="text-lg font-semibold mb-3 block">
              Enter Audio URL
            </Label>
            <div className="flex gap-3">
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/audio.mp3"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button
                onClick={handleUrlLoad}
                className="music-button bg-gradient-to-r from-music-blue to-music-purple text-white hover:from-music-blue-dark hover:to-music-purple-dark"
              >
                Load
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Music Player */}
      <Card className="music-card p-8">
        <div className="space-y-6">
          {/* Song Info */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-music-purple to-music-pink flex items-center justify-center animate-pulse-music">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/30" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{songTitle}</h2>
            <p className="text-white/70">Chrome Audio Explorer Plus</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="progress-bar w-full h-2 bg-white/30 rounded-lg outline-none slider-thumb"
            />
            <div className="flex justify-between text-sm text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLooping(!isLooping)}
              className={`music-button w-12 h-12 rounded-full ${
                isLooping 
                  ? 'bg-gradient-to-r from-music-purple to-music-pink text-white' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              onClick={togglePlay}
              className="music-button w-16 h-16 rounded-full bg-gradient-to-r from-music-purple to-music-pink text-white hover:from-music-purple-dark hover:to-music-pink-dark shadow-lg hover:shadow-xl"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="music-button w-12 h-12 rounded-full text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <VolumeX className="h-4 w-4 text-white/60" />
            <input
              type="range"
              min="0"
              max="100"
              value={volumePercentage}
              onChange={handleVolumeChange}
              className="progress-bar flex-1 h-2 bg-white/30 rounded-lg outline-none"
            />
            <Volume2 className="h-4 w-4 text-white/60" />
          </div>

          {/* Loop Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="loop-toggle" className="text-white font-medium">
              Loop Mode
            </Label>
            <Switch
              id="loop-toggle"
              checked={isLooping}
              onCheckedChange={setIsLooping}
            />
          </div>
        </div>
      </Card>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={currentSong} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;
