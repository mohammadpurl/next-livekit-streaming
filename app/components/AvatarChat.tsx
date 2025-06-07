import { useEffect, useRef, useState } from 'react';
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from '@heygen/streaming-avatar';
import { AudioRecorder } from '../audio-handler';

interface SessionData {
  id: string;
  status: string;
  [key: string]: any;
}

interface StreamEvent {
  detail: MediaStream;
}

export default function AvatarChat() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [inputText, setInputText] = useState('');
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const fetchAccessToken = async () => {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
      });
      const { token } = await response.json();
      return token;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  };

  const initializeAvatarSession = async () => {
    try {
      const token = await fetchAccessToken();
      const newAvatar = new StreamingAvatar({ token });

      newAvatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
      newAvatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);

      const session = await newAvatar.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: "Bryan_IT_Sitting_public",
        language: "Persian",
        voice: {
          voiceId: "508da0af14044417a916cba1d00f632a",
          rate: 1.0,
        },
      });

      setAvatar(newAvatar);
      setSessionData(session);
    } catch (error) {
      console.error('Failed to initialize avatar session:', error);
    }
  };

  const handleStreamReady = (event: StreamEvent) => {
    if (event.detail && videoRef.current) {
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  };

  const handleStreamDisconnected = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setAvatar(null);
    setSessionData(null);
  };

  const terminateAvatarSession = async () => {
    if (avatar && sessionData) {
      await avatar.stopAvatar();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setAvatar(null);
      setSessionData(null);
    }
  };

  const handleSpeak = async () => {
    if (!avatar || !inputText) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();
      
      if (data.response) {
        await avatar.speak({
          text: data.response,
          taskType: TaskType.TALK,
        });
      }
      
      setInputText('');
    } catch (error) {
      console.error('Error getting response:', error);
    }
  };

  const initializeAudioRecorder = () => {
    audioRecorderRef.current = new AudioRecorder(
      (status) => setStatus(status),
      async (text) => {
        if (avatar) {
          await avatar.speak({
            text: text,
            taskType: TaskType.TALK,
          });
        }
      }
    );
  };

  const toggleRecording = async () => {
    if (!audioRecorderRef.current) {
      initializeAudioRecorder();
    }

    if (!isRecording) {
      await audioRecorderRef.current?.startRecording();
      setIsRecording(true);
    } else {
      audioRecorderRef.current?.stopRecording();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      terminateAvatarSession();
    };
  }, []);

  return (
    <div className="container">
      <video
        ref={videoRef}
        id="avatarVideo"
        autoPlay
        playsInline
      />
      
      <div className="controls-section">
        <div className="button-group">
          <button
            onClick={initializeAvatarSession}
            disabled={!!avatar}
            className="contrast"
          >
            Start Session
          </button>
          
          <button
            onClick={terminateAvatarSession}
            disabled={!avatar}
            className="contrast"
          >
            End Session
          </button>
        </div>

        <div className="input-group">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={handleSpeak}
            disabled={!avatar || !inputText}
          >
            Speak
          </button>
        </div>

        <div className="button-group">
          <button
            onClick={toggleRecording}
            className={isRecording ? 'secondary' : 'primary'}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
        
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
} 