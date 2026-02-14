import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState("Idle");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  return (
    <>
      <div>
        <h1>Audio transcription pipeline</h1>
        <div className="card">
          <div className="row">
            <button
              onClick={startRecording}
              disabled={isRecording}
            >Start Recording</button>
            <button
              onClick={stopRecording}
              disabled={!isRecording}
            >Stop Recording</button>
            <p>{isRecording ? "recording..." : ""}</p>
            <p>{audioUrl && <audio controls src={audioUrl} />}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
