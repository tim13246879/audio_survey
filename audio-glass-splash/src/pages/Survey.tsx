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
  const [initialInteraction, setInitialInteraction] = useState(true);
  const [hadConversation, setHadConversation] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  
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
        // Mark that we've had audio data - a conversation is happening
        if (!hadConversation) {
          setHadConversation(true);
        }
      }
    };
    
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
      
      // If this is the first connection, trigger the model to start
      if (initialInteraction) {
        client.send({
          text: "Please begin the conversation."
        });
        console.log("First connection - model should start speaking");
        setInitialInteraction(false);
      }
    } else {
      audioRecorder.stop();
    }
    
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder, initialInteraction, hadConversation]);
  
  // Listen for text chunks from the model
  useEffect(() => {
    if (!client) return;
    
    const handleContent = (content: any) => {
      // Store text chunks if they contain transcript data
      if (content && content.text) {
        setTranscript(prev => (prev || '') + content.text);
      }
    };
    
    client.on('content', handleContent);
    
    return () => {
      client.off('content', handleContent);
    };
  }, [client]);
  
  // Send final transcript request when stopping the mic
  const requestTranscript = () => {
    if (client && connected && hadConversation) {
      console.log("Requesting final transcript...");
      
      try {
        // Add a special instruction to the transcript display
        setTranscript(prev => {
          const separator = "\n\n----- CONVERSATION ENDED -----\n\n";
          return (prev || '') + separator + "Generating final transcript...\n";
        });
        
        // Send a text message explicitly asking for a transcript
        client.send({
          text: "Please provide a complete transcript of our conversation so far."
        });
        
        // Wait a bit before disconnecting to allow the model to respond
        setTimeout(() => {
          console.log("Transcript request completed");
        }, 2000);
      } catch (err) {
        console.error("Error requesting transcript:", err);
      }
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !client || !connected) return;

    // Ensure we're connected
    if (!connected) {
      connect().then(() => {
        sendTextInput(textInput);
      }).catch(err => console.error("Connection error:", err));
    } else {
      sendTextInput(textInput);
    }
  };

  // Send text input to the model
  const sendTextInput = (text: string) => {
    try {
      if (!client || !connected) return;
      
      // Use the send method with text part
      client.send({
        text: text
      });
      
      // Add the user's message to the transcript
      setTranscript(prev => {
        const userMessage = `You: ${text}\n`;
        return (prev || '') + userMessage;
      });
      
      // Clear the input field
      setTextInput("");
      
      // Mark that we've had a conversation
      if (!hadConversation) {
        setHadConversation(true);
      }
    } catch (err) {
      console.error("Error sending text input:", err);
    }
  };
  
  // Connect to AI service if not connected when unmuting
  const toggleMicrophone = () => {
    if (muted) {
      if (!connected) {
        connect().then(() => {
          console.log("Connected to AI service");
          // The model should automatically start speaking once connected
          // We don't need to send an initial message
        }).catch(err => {
          console.error("Connection error:", err);
        });
      }
      setMuted(false);
    } else {
      // When turning off microphone, first request a transcript
      requestTranscript();
      setMuted(true);
    }
  };
  
  return (
    <div className="flex flex-col justify-center items-center w-full max-w-3xl">
      {/* Microphone Button */}
      <button
        className={cn(
          "w-64 h-64 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 mb-6",
          muted ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600 animate-pulse"
        )}
        onClick={toggleMicrophone}
      >
        <span className="material-symbols-outlined text-white text-9xl">
          {muted ? "mic" : "mic_off"}
        </span>
      </button>
      
      {/* Text Input Section */}
      <form onSubmit={handleTextSubmit} className="w-full max-w-2xl mb-6">
        <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-md bg-white">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your response here..."
            className="flex-grow px-4 py-3 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 px-6"
            disabled={!connected || !textInput.trim()}
          >
            Send
          </button>
        </div>
      </form>
      
      {/* Transcript Display */}
      {transcript && (
        <div className="mt-2 p-4 bg-white rounded-lg shadow-md w-full max-w-2xl">
          <h3 className="text-lg font-semibold mb-2">Conversation:</h3>
          <div className="whitespace-pre-wrap text-gray-700">{transcript}</div>
        </div>
      )}
    </div>
  );
}

export default Survey;