import { useAudioRecorder } from '../../hooks/useAudioRecorder';


function AudioRecorder() {
  const {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording
  } = useAudioRecorder();

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

export default AudioRecorder
