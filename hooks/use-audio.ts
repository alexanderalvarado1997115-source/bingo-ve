"use client";
import { useCallback, useRef, useState, useEffect } from 'react';

export const useAudio = () => {
    const [isMuted, setIsMuted] = useState(false);

    // Load mute preference from storage
    useEffect(() => {
        const saved = localStorage.getItem('bingove_muted');
        if (saved === 'true') setIsMuted(true);
    }, []);

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        localStorage.setItem('bingove_muted', newState.toString());
    };

    const playSound = useCallback((soundName: 'draw' | 'bingo' | 'win' | 'click') => {
        if (isMuted) return;

        const audioPath = {
            draw: '/sounds/ball-draw.mp3',
            bingo: '/sounds/bingo-alert.mp3',
            win: '/sounds/win-fanfare.mp3',
            click: '/sounds/click.mp3'
        }[soundName];

        const audio = new Audio(audioPath);
        audio.volume = 0.5;
        audio.play().catch(err => {
            // Browsers block autoplay sound unless user interacts first
            // We silent fail or log it
            console.warn("Audio play blocked by browser. User needs to interact first.", err);
        });
    }, [isMuted]);

    return { playSound, isMuted, toggleMute };
};
