import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

const AudioReader = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Only set up voices when component mounts
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1.0;
    utteranceRef.current.pitch = 1.0;
    
    // Pick a decent voice
    const setVoice = () => {
      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(v => v.lang.includes('en-'));
      if (englishVoice) {
        utteranceRef.current.voice = englishVoice;
      }
    };

    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }

    utteranceRef.current.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utteranceRef.current.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current.onpause = () => {
      setIsPaused(true);
      setIsPlaying(false);
    };

    utteranceRef.current.onresume = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    return () => {
      synthRef.current.cancel();
    };
  }, [text]);

  const handlePlayPause = () => {
    if (isPlaying) {
      synthRef.current.pause();
    } else if (isPaused) {
      synthRef.current.resume();
    } else {
      synthRef.current.speak(utteranceRef.current);
    }
  };

  const handleStop = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="audio-reader-widget glass">
      <div className="audio-icon-wrapper">
        <Volume2 size={24} color="var(--primary)" className={isPlaying ? 'pulse' : ''} />
      </div>
      
      <div className="audio-controls">
        <span className="audio-label">Listen to this article</span>
        
        <div className="button-group">
          <button 
            onClick={handlePlayPause}
            className="audio-btn primary-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button 
            onClick={handleStop}
            className="audio-btn secondary-btn"
            aria-label="Stop"
            disabled={!isPlaying && !isPaused}
          >
            <Square size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioReader;
