"use client";

import { useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceNote(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const Ctor = getSpeechRecognitionCtor();
  const supported = !!Ctor;

  function start() {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => { const text = e.results?.[0]?.[0]?.transcript; if (text) onResult(text); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }
  function stop() { recRef.current?.stop(); setListening(false); }

  return { supported, listening, start, stop };
}
