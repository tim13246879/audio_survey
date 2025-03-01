import { useRef, useState, useEffect } from "react";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import cn from "classnames";
import { AudioRecorder } from "../lib/audio-recorder";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { Altair } from "../components/altair/Altair";

const API_KEY = "AIzaSyCaBhSLtr-ArpJvZM5U74TlUaMDABCN-Uw";
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function Survey() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1F0FB] to-white text-dark-text flex items-center justify-center">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <SurveyContent />
      </LiveAPIProvider>
    </div>
  );
}

function SurveyContent() {
  const [muted, setMuted] = useState(true);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [inVolume, setInVolume] = useState(0);
  const { setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are acting as Prof to seek feedback about your course. You will be speaking with a student who took it. You will ask the following questions in a casual, natural and informal way. You may ask the questions in any order. Sometimes, the student might even answer multiple questions together without you asking them explicitly. In this case, you don't have to ask the question again.

You should aim to get elaborate and detailed answers from the student so you can improve your course in the future. If the student gives short answers, ask followup questions to gain more insight into their experience.

Once you gather all answers for the questions, you should thank the student and end the conversation.

Here are the questions:

How was course difficulty (rate from 1 to 10 and explain why)
what is something that the prof could have done better?
what was effective and not effective in the prof's teaching styles?
were the assessments fair? rate 1 to 10 and explain.`,
          },
        ],
      },
    });
  }, [setConfig]);

  return (
    <MicrophoneButton 
      muted={muted} 
      setMuted={setMuted} 
      audioRecorder={audioRecorder}
      setInVolume={setInVolume}
    />
  );
}

interface MicrophoneButtonProps {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  audioRecorder: AudioRecorder;
  setInVolume: (volume: number) => void;
}

function MicrophoneButton({ muted, setMuted, audioRecorder, setInVolume }: MicrophoneButtonProps) {
  const { client, connected, connect, disconnect } = useLiveAPIContext();
  
  // Handle audio recording and sending to API
  useEffect(() => {
    const onData = (base64: string) => {
      if (client && connected) {
        client.sendRealtimeInput([
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ]);
      }
    };
    
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);
  
  // Connect to AI service if not connected when unmuting
  const toggleMicrophone = () => {
    if (muted && !connected) {
      connect();
    }
    setMuted(!muted);
  };
  
  return (
    <div className="flex justify-center items-center">
      <button
        className={cn(
          "w-64 h-64 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105",
          muted ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600 animate-pulse"
        )}
        onClick={toggleMicrophone}
      >
        <span className="material-symbols-outlined text-white text-9xl">
          {muted ? "mic" : "mic_off"}
        </span>
      </button>
    </div>
  );
}

export default Survey;