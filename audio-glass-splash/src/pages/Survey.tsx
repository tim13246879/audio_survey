import { useRef, useState, useEffect } from "react";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import cn from "classnames";
import { AudioRecorder } from "../lib/audio-recorder";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { Altair } from "../components/altair/Altair";
import { useParams } from "react-router-dom";

const API_KEY = "AIzaSyCaBhSLtr-ArpJvZM5U74TlUaMDABCN-Uw";
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function Survey() {
    const { id } = useParams();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
    
    useEffect(() => {
      const fetchSurveyData = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/survey/${id}`);
          const data = await response.json();
          console.log('Survey data:', data);
          
          // Create the full system prompt by appending questions
          let fullSystemPrompt = data.survey?.system_prompt || '';
          
          // Check if questions array exists and has items
          if (data.survey?.questions && data.survey.questions.length > 0) {
            // Add a line break before questions if needed
            if (fullSystemPrompt && !fullSystemPrompt.endsWith('\n')) {
              fullSystemPrompt += '\n\n';
            }
            
            // Loop through each question and append to the system prompt
            data.survey.questions.forEach((questionObj: any, index: number) => {
              if (questionObj.question) {
                fullSystemPrompt += `${index + 1}. ${questionObj.question} ${questionObj.elaborate ? '(elaborate)' : ''}\n`;
              }
            });
          }
          
          console.log('System prompt:', fullSystemPrompt);
          setSystemPrompt(fullSystemPrompt);
        } catch (error) {
          console.error('Error fetching survey data:', error);
        }
      };
      
      if (id) {
        fetchSurveyData();
      }
    }, [id]);
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1F0FB] to-white text-dark-text flex items-center justify-center">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <SurveyContent systemPrompt={systemPrompt} />
      </LiveAPIProvider>
    </div>
  );
}

function SurveyContent({ systemPrompt }: { systemPrompt?: string }) {
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
            text: systemPrompt,
          },
        ],
      },
    });
  }, [setConfig, systemPrompt]);

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