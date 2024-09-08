"use client";

import React, { useState, useEffect } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const APP_ID = "d6bb2f08fa174c33968711845279fce6"; // Replace with your Agora App ID
const TOKEN = "007eJxTYKhydWyPvdoZEBCbGu825/Xi7kV7d9ufn/dsztqDNf87JNkVGFLMkpKM0gws0hINzU2SjY0tzSzMDQ0tTEyNzC3TklPNdnjeTWsIZGSw2MbBxMgAgSA+C0NJanEJAwMAlxUgMQ=="; // Replace with your Agora Token
const CHANNEL = "test"; // Replace with your channel name
const HOST_UID = "UID"; // Use a unique identifier for the host (perhaps Firebase auth UID)

type RemoteTracks = {
  videoTrack: IRemoteVideoTrack | null;
  audioTrack: IRemoteAudioTrack | null;
};

const DoctorMeeting: React.FC = () => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<
    [IMicrophoneAudioTrack, ICameraVideoTrack] | null
  >(null);
  const [remoteTracks, setRemoteTracks] = useState<{ [uid: string]: RemoteTracks }>({});
  const [micOn, setMicOn] = useState<boolean>(true);
  const [camOn, setCamOn] = useState<boolean>(true);
  const [isHost, setIsHost] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initClient = async () => {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);
        await startCall(agoraClient);
      };

      initClient();
    }
  }, []);

  const startCall = async (agoraClient: IAgoraRTCClient) => {
    try {
      // Check if current user is the host
      const userId = "UID"; // Fetch from auth or context
      setIsHost(userId === HOST_UID);

      // Ensure media permissions are granted
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Join the Agora channel
      await agoraClient.join(APP_ID, CHANNEL, TOKEN);

      // Create local audio and video tracks
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks(tracks);

      const [audioTrack, videoTrack] = tracks;

      // Play the local video
      videoTrack.play("local-video");

      // Publish the local tracks
      await agoraClient.publish(tracks);

      // Handle remote user publishing their stream
      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);

        setRemoteTracks((prev) => {
          const newState = { ...prev };

          if (mediaType === "video") {
            newState[user.uid] = {
              videoTrack: user.videoTrack ?? null,
              audioTrack: newState[user.uid]?.audioTrack ?? null,
            };
            // Play the remote video
            if (user.videoTrack) user.videoTrack.play(`remote-video-${user.uid}`);
          }

          if (mediaType === "audio") {
            newState[user.uid] = {
              videoTrack: newState[user.uid]?.videoTrack ?? null,
              audioTrack: user.audioTrack ?? null,
            };
            // Play the remote audio
            if (user.audioTrack) user.audioTrack.play();
          }

          return newState;
        });
      });

      // Handle user unpublishing their stream
      agoraClient.on("user-unpublished", (user, mediaType) => {
        setRemoteTracks((prev) => {
          const newState = { ...prev };

          if (mediaType === "video") {
            newState[user.uid] = { ...newState[user.uid], videoTrack: null };
          }

          if (mediaType === "audio") {
            newState[user.uid] = { ...newState[user.uid], audioTrack: null };
          }

          return newState;
        });
      });
    } catch (error) {
      console.error("Failed to start Agora video call:", error);
    }
  };

  const toggleMic = () => {
    if (localTracks) {
      const [audioTrack] = localTracks;
      audioTrack.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (localTracks) {
      const [, videoTrack] = localTracks;
      videoTrack.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };

  const leaveCall = async () => {
    if (!client || !localTracks) return;

    try {
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      Object.values(remoteTracks).forEach((track) => {
        if (track.videoTrack) track.videoTrack.stop();
        if (track.audioTrack) track.audioTrack.stop();
      });

      await client.leave();

      setLocalTracks(null);
      setMicOn(true);
      setCamOn(true);

      console.log("Left the call and closed local tracks");
    } catch (error) {
      console.error("Failed to leave call and close media tracks:", error);
    }

    // Navigate back to previous page or end the call
    router.back();
  };

  const handleEndMeeting = async () => {
    // Forcefully end the call for everyone if the user is the host
    if (isHost && client) {
      await client.leave();
      console.log("Host has ended the call.");
      // Navigate back to previous page or perform necessary actions
      router.back();
    }
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <div className="flex w-full h-full">
        {/* Local video display */}
        <div
          id="local-video"
          className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative"
        >
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <FaVideoSlash className="text-white text-4xl" />
            </div>
          )}
        </div>

        {/* Remote videos display */}
        {Object.keys(remoteTracks).map((uid) => (
          <div
            key={uid}
            id={`remote-video-${uid}`}
            className={`flex-1 bg-gray-800 rounded-lg overflow-hidden relative ${
              remoteTracks[uid]?.videoTrack ? "" : "hidden"
            }`}
          >
            {/* Remote video will be played here */}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4 mt-4 fixed bottom-4">
        <button
          onClick={toggleMic}
          className={`p-2 rounded-full ${
            micOn ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {micOn ? (
            <FaMicrophone className="text-xl" />
          ) : (
            <FaMicrophoneSlash className="text-xl" />
          )}
        </button>
        <button
          onClick={toggleCam}
          className={`p-2 rounded-full ${
            camOn ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {camOn ? <FaVideo className="text-xl" /> : <FaVideoSlash className="text-xl" />}
        </button>
        {isHost ? (
          <button
            onClick={handleEndMeeting}
            className="p-2 rounded-full bg-red-500 text-white"
          >
            <FaPhoneSlash className="text-xl" />
          </button>
        ) : (
          <button
            onClick={leaveCall}
            className="p-2 rounded-full bg-red-500 text-white"
          >
            <FaPhoneSlash className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DoctorMeeting;