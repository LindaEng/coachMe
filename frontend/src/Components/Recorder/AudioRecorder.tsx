import { useAudioRecorder } from '../../hooks/useAudioRecorder';


function AudioRecorder() {
  const {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
    email,
    setEmail,
    uploadAudio
  } = useAudioRecorder();

  const handleConfirm = async () => {
    if(!audioBlob) return;
    if(!email) {
      alert("Please enter an email")
      return;
    }
    await uploadAudio(audioBlob, email);
  }

  const handleReset = () => {
    window.location.reload();
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter recipient email'
              required
            />
            <p>{audioUrl && 
              <>
                <audio controls src={audioUrl} />
                <div>
                  <button onClick={handleConfirm}>Confirm & Send</button>
                  <button onClick={handleReset}>Reset</button>
                </div>
              </>
            }</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default AudioRecorder
