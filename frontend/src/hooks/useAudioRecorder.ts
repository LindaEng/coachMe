import { useState, useRef } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [email, setEmail] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

const uploadAudio = async(blob: Blob, email: string) => {
    try{
        const initRes = await fetch("http://localhost:3001/upload/init", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email })
        });
        const { uploadUrl, jobId } = await initRes.json();
        // upload to s3
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: {
                "Content-Type": "audio/webm"
            }
        });
        if (!uploadRes.ok) {
            throw new Error(`S3 upload failed with status ${uploadRes.status}`);
        }
        pollJob(jobId);
        setAudioBlob(null);
        setAudioUrl(null);
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

    };
  }

const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
}

const pollJob = async (jobId: string) => {
  const res = await fetch(`http://localhost:3001/jobs/${jobId}`);
  const job = await res.json();

  console.log("Job Status:", job.status);

  if (job.status === "SUCCEEDED") {
    console.log("Transcript:", job.transcript);
    console.log("Result:", job.result);
    return;
  }

  if (job.status === "FAILED") {
    console.log("Job failed.");
    return;
  }

  setTimeout(() => pollJob(jobId), 2000);
};



  return {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
    email,
    setEmail,
    uploadAudio,
  }
}


