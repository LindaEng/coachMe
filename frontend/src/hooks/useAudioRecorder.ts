import { useState, useRef } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

const uploadAudio = async(blob: Blob) => {
    try{
        const initRes = await fetch("http://localhost:3000/upload/init", {
            method: "POST",
        });

        const { uploadUrl, s3Key, jobId } = await initRes.json();

        //upload to s3
        await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: {
                "Content-Type": "audio/webm"
            }
        });

        //tell backend upload is completed
        await fetch("http://localhost:3000/upload/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobId, s3Key })
        })

        console.log("UPLOAD COMPLETED AND JOB QUEUED ", jobId);
    } catch (err) {
        console.error("Upload failed:", err);
    }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if(event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    }
    mediaRecorder.start();
    console.log("Recording started");
    setIsRecording(true);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);

      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      await uploadAudio(blob);
    };
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }



  return {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording
  }
}


