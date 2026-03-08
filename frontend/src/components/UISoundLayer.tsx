'use client';

import { useEffect, useRef } from 'react';

const MIN_INTERVAL_MS = 45;

const isInteractiveButton = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  const button = target.closest('button, [data-click-sound="true"]');
  if (!button) return false;
  if ((button as HTMLButtonElement).disabled) return false;
  if (button.getAttribute('aria-disabled') === 'true') return false;
  return true;
};

export default function UISoundLayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getAudioContext = () => {
      if (audioContextRef.current) return audioContextRef.current;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      const context = new Ctx();
      audioContextRef.current = context;
      return context;
    };

    const playClick = () => {
      const now = performance.now();
      if (now - lastPlayedAtRef.current < MIN_INTERVAL_MS) return;
      lastPlayedAtRef.current = now;

      const context = getAudioContext();
      if (!context) return;

      if (context.state === 'suspended') {
        void context.resume();
      }

      const startAt = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(720, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(540, startAt + 0.045);

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.04, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.06);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.065);
    };

    const onPointerDown = (event: Event) => {
      if (!isInteractiveButton(event.target)) return;
      playClick();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!isInteractiveButton(event.target)) return;
      playClick();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return null;
}

