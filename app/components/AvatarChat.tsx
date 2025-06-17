import { useEffect, useRef, useState, useCallback } from 'react';
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType, StartAvatarResponse, VoiceChatTransport, STTProvider, VoiceEmotion, ElevenLabsModel } from '@heygen/streaming-avatar';
import { AudioRecorder } from '../audio-handler';
import { askQuestion } from '../services/api';
import { StreamingAvatarSessionState, useStreamingAvatarSession } from './logic';
import { AvatarVideo } from './AvatarSession/AvatarVideo';
import { AvatarControls } from './AvatarSession/AvatarControls';
import { Button } from './Button';
import { LoadingIcon } from './Icons';
import { MessageHistory } from './AvatarSession/MessageHistory';
import { AvatarConfig } from './AvatarConfig';
import { ExtendedStartAvatarRequest } from './logic/ExtendedTypes';
import { AVATARS } from '../lib/constants';
import { useMemoizedFn } from 'ahooks';

interface SessionData extends StartAvatarResponse {
  id: string;
  status: string;
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

  const avatarRef = useRef<any>(null);

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
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
  useStreamingAvatarSession();

  const DEFAULT_CONFIG: ExtendedStartAvatarRequest = {
    quality: AvatarQuality.Low,
    avatarName: AVATARS[0].avatar_id,
    voice: {
      voiceId: "508da0af14044417a916cba1d00f632a",
      rate: 1.0,
      emotion: VoiceEmotion.EXCITED,
      model: ElevenLabsModel.eleven_flash_v2_5,
    },
    language: "fa",
    knowledgeBase: "",
    knowledgeId: "1629692875c84134abd4e37325cf7535",
    voiceChatTransport: VoiceChatTransport.WEBSOCKET,
    sttSettings: {
      provider: STTProvider.GLADIA,
    },
    version: "v2",
    useSilencePrompt: true,
  };
  
  const [config, setConfig] =
    useState<ExtendedStartAvatarRequest>(DEFAULT_CONFIG);
  const mediaStream = useRef<HTMLVideoElement>(null);

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
      setSessionData({
        ...session,
        id: session.session_id,
        status: 'active'
      });
    } catch (error) {
      console.error('Failed to initialize avatar session:', error);
    }
  };

  const startSessionV2 = useMemoizedFn(async () => {
    try {
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatarRef.current = avatar;

      avatar.on(StreamingEvents.AVATAR_START_TALKING, console.log);
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, console.log);
      // avatar.on(StreamingEvents.STREAM_DISCONNECTED, stopFiltering);
      // avatar.on(StreamingEvents.STREAM_READY, () => {
      //   if (isVoiceChat) startFiltering();
      // });
      // avatar.on(StreamingEvents.USER_START, handleUserStart);
      // avatar.on(StreamingEvents.USER_STOP, handleUserStop);

      await startAvatar(config);
      setAvatar(avatar);
      await toggleRecording();
      // if (isVoiceChat) {
      //   await startVoiceChat(true); // قطع STT پیش‌فرض
      //   initGladiaSocket();
      //   startMicrophoneStream();
      // }
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

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

  const terminateAvatarSession = useCallback(async () => {
    if (avatar && sessionData) {
      await avatar.stopAvatar();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setAvatar(null);
      setSessionData(null);
    }
  }, [avatar, sessionData]);

  useEffect(() => {
    return () => {
      terminateAvatarSession();
    };
  }, [terminateAvatarSession]);

  const handleSpeak = async () => {
    if (!avatar || !inputText) return;

    try {
      const response = await askQuestion(inputText);
      
      if (response.answer || response.answer) {
        await avatar.speak({
          text: response.answer ,
          taskType: TaskType.REPEAT,
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
          try {
            const response = await askQuestion(text);
            if (response.answer || response.text) {
              await avatar.speak({
                text: response.answer || response.text,
                taskType: TaskType.REPEAT,
              });
            }
          } catch (error) {
            console.error('Error processing transcribed text:', error);
          }
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

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo ref={mediaStream} />
          ) : (
            <AvatarConfig config={config} onConfigChange={setConfig} />
          )}
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-row gap-4">
              <Button onClick={() => startSessionV2()}>
                Start Voice Chat
              </Button>
              <Button onClick={() => startSessionV2()}>
                Start Text Chat
              </Button>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )}
    </div>
  );
} 