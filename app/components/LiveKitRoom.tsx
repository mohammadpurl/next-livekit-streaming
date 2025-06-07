'use client';

import { useEffect, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, VideoPresets } from 'livekit-client';
import { LIVEKIT_URL } from '../config/livekit';

interface LiveKitRoomProps {
  roomName: string;
  token: string;
}

export default function LiveKitRoom({ roomName, token }: LiveKitRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  useEffect(() => {
    const connectToRoom = async () => {
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });
      
      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
      });

      try {
        await newRoom.connect(LIVEKIT_URL, token);
        setRoom(newRoom);
        setLocalParticipant(newRoom.localParticipant);
        setParticipants(Array.from(newRoom.remoteParticipants.values()));
      } catch (error) {
        console.error('Failed to connect to room:', error);
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomName, token]);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {localParticipant && (
        <div className="relative">
          <video
            ref={el => {
              if (el) {
                localParticipant.enableCameraAndMicrophone();
              }
            }}
            className="w-full rounded-lg"
            autoPlay
            muted
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>
      )}
      
      {participants.map(participant => (
        <div key={participant.sid} className="relative">
          <video
            ref={el => {
              if (el) {
                participant.getTrackPublications().forEach(publication => {
                  if (publication.kind === 'video' && publication.isSubscribed) {
                    publication.track?.attach(el);
                  }
                });
              }
            }}
            className="w-full rounded-lg"
            autoPlay
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {participant.identity}
          </div>
        </div>
      ))}
    </div>
  );
} 