import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Volume2,
  Square,
  Sparkles,
  X,
  FastForward,
  RotateCcw
} from 'lucide-react';
import { TopicAudioMemo } from '../../types/syllabus';
import { saveAudioToStorage, getAudioBlobUrl, deleteAudioFromStorage, downloadAudioFile } from '../../utils/audioStorage';
import { soundManager } from '../../utils/soundEffects';

interface TopicAudioMemosSectionProps {
  topicId: string;
  topicName: string;
  audioMemos?: TopicAudioMemo[];
  onAddAudioMemo: (memo: {
    title: string;
    durationSeconds: number;
    storageKey?: string;
    audioDataUrl?: string;
    transcript?: string;
  }) => void;
  onDeleteAudioMemo: (memoId: string) => void;
  onInsertTranscriptToNotes?: (text: string) => void;
}

export const TopicAudioMemosSection: React.FC<TopicAudioMemosSectionProps> = ({
  topicId,
  topicName,
  audioMemos = [],
  onAddAudioMemo,
  onDeleteAudioMemo,
  onInsertTranscriptToNotes
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingTranscript, setRecordingTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  
  // Recorded Audio Review State
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  // Active playing memo ID & state
  const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Track Blob URLs loaded from IndexedDB for each memo
  const [loadedAudioUrls, setLoadedAudioUrls] = useState<Record<string, string>>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Recording Audio
  const handleStartRecording = async () => {
    try {
      soundManager.playClick();
      setErrorMessage(null);
      setRecordingTranscript('');
      setRecordingTitle(`Voice Memo #${audioMemos.length + 1} - ${topicName}`);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        const previewUrl = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl(previewUrl);
        // Stop media tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Optional Web Speech API for live speech-to-text transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Supports English / Hinglish

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
            setRecordingTranscript(currentTranscript.trim());
          };

          recognition.onerror = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // Speech recognition optional fallback
        }
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMessage('Microphone access denied. Please grant microphone permissions in your browser.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Stop Recording Audio
  const handleStopRecording = () => {
    soundManager.playClick();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Cancel & Discard Recording
  const handleDiscardRecording = () => {
    soundManager.playClick();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordedBlob(null);
    setPreviewAudioUrl(null);
    setRecordingSeconds(0);
    setRecordingTranscript('');
  };

  // Save Recorded Voice Note to IndexedDB & Context
  const handleSaveVoiceNote = async () => {
    if (!recordedBlob) return;

    try {
      const memoId = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const finalTitle = recordingTitle.trim() || `Voice Memo #${audioMemos.length + 1}`;

      // Save to IndexedDB
      await saveAudioToStorage(memoId, recordedBlob, finalTitle, recordingSeconds);

      onAddAudioMemo({
        title: finalTitle,
        durationSeconds: recordingSeconds,
        storageKey: memoId,
        transcript: recordingTranscript.trim() || undefined
      });

      soundManager.playCompleteChime();
      setSuccessNotice(`Saved voice note: "${finalTitle}"`);
      setTimeout(() => setSuccessNotice(null), 3000);

      // Reset state
      setRecordedBlob(null);
      setPreviewAudioUrl(null);
      setRecordingSeconds(0);
      setRecordingTranscript('');
    } catch (err) {
      console.error('Failed to save audio memo:', err);
      setErrorMessage('Failed to save audio memo to storage.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Play Audio Memo
  const handleTogglePlayMemo = async (memo: TopicAudioMemo) => {
    if (playingMemoId === memo.id) {
      // Pause
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
      }
      setPlayingMemoId(null);
      return;
    }

    soundManager.playClick();

    // Get Blob URL
    let url = loadedAudioUrls[memo.id];
    if (!url) {
      if (memo.audioDataUrl) {
        url = memo.audioDataUrl;
      } else if (memo.storageKey) {
        const fetchedUrl = await getAudioBlobUrl(memo.storageKey);
        if (fetchedUrl) {
          url = fetchedUrl;
          setLoadedAudioUrls(prev => ({ ...prev, [memo.id]: fetchedUrl }));
        }
      }
    }

    if (!url) {
      setErrorMessage('Audio file not found.');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    activeAudioElementRef.current = audio;

    audio.onended = () => {
      setPlayingMemoId(null);
    };

    audio.onerror = () => {
      setPlayingMemoId(null);
      setErrorMessage('Failed to play audio memo.');
      setTimeout(() => setErrorMessage(null), 2500);
    };

    audio.play();
    setPlayingMemoId(memo.id);
  };

  // Change Playback Speed
  const handleCyclePlaybackSpeed = () => {
    soundManager.playClick();
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.playbackRate = nextSpeed;
    }
  };

  // Download Memo Audio File
  const handleDownloadMemo = async (e: React.MouseEvent, memo: TopicAudioMemo) => {
    e.stopPropagation();
    let url = loadedAudioUrls[memo.id];
    if (!url && memo.storageKey) {
      url = (await getAudioBlobUrl(memo.storageKey)) || '';
    }
    if (url) {
      downloadAudioFile(url, `${memo.title}.webm`);
    }
  };

  // Delete Voice Note
  const handleDeleteMemo = async (e: React.MouseEvent, memoId: string, storageKey?: string) => {
    e.stopPropagation();
    if (storageKey) {
      await deleteAudioFromStorage(storageKey);
    }
    onDeleteAudioMemo(memoId);
    setDeletingId(null);
    if (playingMemoId === memoId && activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      setPlayingMemoId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. HEADER & RECORD BUTTON */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Mic className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                Voice Notes & Audio Memos
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-[#EEEEE8] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA]">
                {audioMemos.length} {audioMemos.length === 1 ? 'Memo' : 'Memos'}
              </span>
            </div>
          </div>
        </div>

        {!isRecording && !recordedBlob && (
          <button
            onClick={handleStartRecording}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Mic className="w-4 h-4 stroke-[2.5]" />
            <span>Record Voice Note</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. LIVE VOICE RECORDING ACTIVE STUDIO */}
      {isRecording && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#18181D] to-rose-950/30 border-2 border-purple-500/50 shadow-xl space-y-4 animate-fade-in">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                Recording Live Audio...
              </span>
            </div>
            <span className="text-lg sm:text-xl font-mono font-black text-[#F5F5F7]">
              {formatTime(recordingSeconds)}
            </span>
          </div>

          {/* Pulsing Audio Wave Animation */}
          <div className="flex items-center justify-center gap-1.5 py-4">
            {[40, 75, 55, 95, 60, 85, 45, 90, 70, 100, 65, 80, 50].map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-purple-500 to-rose-400 rounded-full animate-pulse"
                style={{
                  height: `${height * 0.4}px`,
                  animationDuration: `${0.4 + (i % 4) * 0.2}s`
                }}
              />
            ))}
          </div>

          {/* Live Speech-to-Text Transcript Preview if available */}
          {recordingTranscript && (
            <div className="p-3 rounded-xl bg-white/5 border border-purple-500/20 text-xs text-purple-200 leading-relaxed max-h-24 overflow-y-auto">
              <span className="text-[11px] font-bold text-purple-400 uppercase block mb-0.5">
                💬 Live Speech-to-Text:
              </span>
              "{recordingTranscript}"
            </div>
          )}

          {/* Recording Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDiscardRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] text-xs font-semibold cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
              <span>Discard</span>
            </button>

            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Review</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. RECORDED AUDIO PREVIEW & SAVE FORM */}
      {!isRecording && recordedBlob && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#1C1C22] border-2 border-purple-500/40 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#272730]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#191A17] dark:text-[#F5F5F7]">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Review Voice Note ({formatTime(recordingSeconds)})</span>
            </div>
            <button
              type="button"
              onClick={handleDiscardRecording}
              className="p-1 rounded-lg text-[#85877E] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Audio Player Preview */}
          {previewAudioUrl && (
            <div className="p-3 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730]">
              <audio controls src={previewAudioUrl} className="w-full h-9" />
            </div>
          )}

          {/* Voice Memo Title */}
          <div>
            <label className="block text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] mb-1">
              Voice Memo Title
            </label>
            <input
              type="text"
              value={recordingTitle}
              onChange={e => setRecordingTitle(e.target.value)}
              placeholder="e.g. Important Theorem Shortcut / Exceptions"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Speech-to-Text Transcript if captured */}
          {recordingTranscript && (
            <div>
              <label className="block text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] mb-1">
                Captured Transcript (Speech-to-Text)
              </label>
              <textarea
                value={recordingTranscript}
                onChange={e => setRecordingTranscript(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#272730]">
            <button
              type="button"
              onClick={handleDiscardRecording}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#23232A] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSaveVoiceNote}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Voice Note</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SAVED VOICE NOTES LIST */}
      <div className="space-y-3">
        {audioMemos.length > 0 ? (
          audioMemos.map((memo, index) => {
            const isPlaying = playingMemoId === memo.id;

            return (
              <div
                key={memo.id}
                className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181D] border transition-all shadow-subtle-depth flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 ${
                  isPlaying
                    ? 'border-purple-500 dark:border-purple-500 ring-1 ring-purple-500/30'
                    : 'border-[#E2E8F0] dark:border-[#272730] hover:border-purple-500/50'
                }`}
              >
                {/* Left: Play/Pause Button & Memo Title */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  
                  {/* Play / Pause Circular Button */}
                  <button
                    onClick={() => handleTogglePlayMemo(memo)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer active:scale-90 ${
                      isPlaying
                        ? 'bg-purple-600 text-white shadow-purple-600/30 animate-pulse'
                        : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                    }`}
                    title={isPlaying ? 'Pause Audio' : 'Play Voice Memo'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Title & Metadata */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                        🎙️ Voice Memo #{index + 1}
                      </span>
                      <span className="text-[11px] font-bold font-mono text-[#2563EB] dark:text-[#8B5CF6]">
                        {formatTime(memo.durationSeconds)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-[#191A17] dark:text-[#F5F5F7] truncate">
                      {memo.title}
                    </h4>

                    {memo.transcript && (
                      <p className="text-[11px] text-[#65675F] dark:text-[#A1A1AA] italic line-clamp-1">
                        "{memo.transcript}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#85877E] dark:text-[#71717A] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Recorded {memo.recordedAt}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Tools */}
                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E2E8F0] dark:border-[#272730] justify-end">
                  
                  {/* Playback Speed Controller */}
                  {isPlaying && (
                    <button
                      onClick={handleCyclePlaybackSpeed}
                      className="px-2.5 py-1 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-purple-400 text-xs font-mono font-bold border border-[#272730] cursor-pointer"
                      title="Cycle playback speed"
                    >
                      {playbackSpeed}x
                    </button>
                  )}

                  {/* Insert Transcript to Notes Button */}
                  {memo.transcript && onInsertTranscriptToNotes && (
                    <button
                      onClick={() => onInsertTranscriptToNotes(`\n> 🎙️ **Voice Memo (${memo.title})**:\n> ${memo.transcript}\n`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#23232A] hover:bg-purple-500/15 dark:hover:bg-purple-500/20 text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white border border-[#E2E8F0] dark:border-[#272730] text-xs font-semibold transition-colors cursor-pointer"
                      title="Insert Transcript into Topic Notes"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add to Notes</span>
                    </button>
                  )}

                  {/* Download Audio */}
                  <button
                    onClick={(e) => handleDownloadMemo(e, memo)}
                    className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#23232A] hover:bg-[#EEEEE8] dark:hover:bg-[#2D2D35] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-colors cursor-pointer"
                    title="Download Audio (.webm)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  {deletingId === memo.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteMemo(e, memo.id, memo.storageKey)}
                        className="px-2 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1 rounded-lg text-[#85877E] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(memo.id)}
                      className="p-2 rounded-xl text-[#85877E] hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Voice Memo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          !isRecording && !recordedBlob && (
            <div className="py-10 sm:py-12 px-4 text-center rounded-2xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto shadow-sm">
                <Mic className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                  No Voice Notes Recorded Yet
                </h4>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleStartRecording}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Record First Voice Memo</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
};

