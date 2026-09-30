import { useCallback, useEffect, useRef, useState } from "react";

const speechLangByAdvisoryLanguage = {
  te: "te-IN",
  en: "en-IN"
};

const normalizeText = (value) => (value || "").toString().toLowerCase();

export function useSpeechAdvisory({ text, language }) {
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const playbackSessionRef = useRef(0);

  const stopSpeechPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    window.speechSynthesis?.cancel?.();
    setSpeaking(false);
  }, []);

  const getVoicesAsync = useCallback(() => new Promise((resolve) => {
    const speech = window.speechSynthesis;
    const existingVoices = speech?.getVoices?.() ?? [];

    if (existingVoices.length > 0) {
      resolve(existingVoices);
      return;
    }

    const cleanup = () => {
      if (typeof speech.removeEventListener === "function") {
        speech.removeEventListener("voiceschanged", handleVoicesChanged);
      } else {
        speech.onvoiceschanged = null;
      }
    };

    const handleVoicesChanged = () => {
      const loadedVoices = speech?.getVoices?.() ?? [];
      if (loadedVoices.length > 0) {
        cleanup();
        resolve(loadedVoices);
      }
    };

    if (typeof speech.addEventListener === "function") {
      speech.addEventListener("voiceschanged", handleVoicesChanged, { once: true });
    } else {
      speech.onvoiceschanged = handleVoicesChanged;
    }

    setTimeout(() => {
      cleanup();
      resolve(speech?.getVoices?.() ?? []);
    }, 1500);
  }), []);

  const pickTeluguVoice = useCallback((voices) => {
    const voicedList = voices.map((voice) => ({
      voice,
      lang: normalizeText(voice.lang),
      name: normalizeText(voice.name)
    }));

    return (
      voicedList.find(({ lang, name }) => lang.startsWith("te") || name.includes("telugu"))?.voice ||
      null
    );
  }, []);

  const toggleSpeech = useCallback(async () => {
    setVoiceError("");

    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceError("Voice playback is not supported in this browser.");
      return;
    }

    if (speaking) {
      stopSpeechPlayback();
      return;
    }

    const nextSessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = nextSessionId;
    setSpeaking(true);

    const sourceText = (text || "No advisory available.").trim() || "No advisory available.";

    try {
      const voices = await getVoicesAsync();
      const matchingVoice = language === "te"
        ? pickTeluguVoice(voices)
        : voices.find((voice) => normalizeText(voice.lang).startsWith("en")) ?? null;

      if (language === "te" && !matchingVoice) {
        setVoiceError("Telugu voice not installed on this device. Add it in Windows Settings > Time & Language > Speech, or switch to English.");
        setSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sourceText);
      utterance.lang = matchingVoice?.lang || speechLangByAdvisoryLanguage[language] || "en-IN";
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      utterance.rate = language === "te" ? 0.92 : 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => {
        if (nextSessionId === playbackSessionRef.current) {
          setSpeaking(false);
        }
      };
      utterance.onerror = () => {
        if (nextSessionId === playbackSessionRef.current) {
          setSpeaking(false);
          setVoiceError("Voice playback failed. Please try again.");
        }
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("HydroSentinel TTS playback failed:", error);
      setVoiceError("Voice playback failed. Please try again.");
      if (nextSessionId === playbackSessionRef.current) {
        setSpeaking(false);
      }
    }
  }, [getVoicesAsync, language, pickTeluguVoice, speaking, stopSpeechPlayback, text]);

  useEffect(() => () => {
    stopSpeechPlayback();
  }, [stopSpeechPlayback]);

  return {
    speaking,
    voiceError,
    stopSpeechPlayback,
    toggleSpeech
  };
}