import { useState, useRef } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

const uploadAudio = async(blob: Blob) => {
    try{
        const initRes = await fetch("http://localhost:3001/upload/init", {
            method: "POST",
        });

        const { uploadUrl, s3Key, jobId } = await initRes.json();

        // upload to s3
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: {
                "Content-Type": "audio/webm"
            }
        });

        console.log("S3 status:", uploadRes.status);

        if (!uploadRes.ok) {
            throw new Error(`S3 upload failed with status ${uploadRes.status}`);
        }

        //tell backend upload is completed
        await fetch("http://localhost:3001/upload/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobId, s3Key })
        })

        console.log("UPLOAD COMPLETED AND JOB QUEUED ", jobId);
        await pollJob(jobId)
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

const pollJob = async (jobId: string) => {
    const res = await fetch(`http://localhost:3001/jobs/${jobId}`);
    const job = await res.json();

    const status = job.status;
    console.log("Job Status: ", status);

    if(status !== "SUCCEEDED" && status !== "FAILED") {
        setTimeout(() => pollJob(jobId), 2000);
    } else {
        console.log("Final Transcript: ", job.transcript);
        console.log("Final result:", job.result);
    }
}



  return {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording
  }
}


