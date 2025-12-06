// src/audio.ts
async function uploadAudioTo3Speak(file, options) {
  const tus = await import("tus-js-client");
  const audioFile = file instanceof File ? file : new File([file], `audio-${Date.now()}.webm`, { type: file.type });
  return new Promise((resolve, reject) => {
    let playUrl = null;
    const upload = new tus.Upload(audioFile, {
      endpoint: "https://audio.3speak.tv/uploads",
      retryDelays: [0, 3e3, 5e3, 1e4, 2e4],
      metadata: {
        filename: audioFile.name,
        owner: options.owner,
        frontend_app: options.appName ?? "snapie",
        filetype: audioFile.type || "audio/webm"
      },
      headers: {
        "X-API-Key": options.apiKey
      },
      onError: (error) => {
        options.onProgress?.(0, "error");
        reject(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = bytesUploaded / bytesTotal * 100;
        options.onProgress?.(Math.round(percentage), "uploading");
      },
      onAfterResponse: (req, res) => {
        const url = res.getHeader("X-Play-URL");
        if (url) {
          playUrl = url;
        }
      },
      onSuccess: () => {
        if (playUrl) {
          options.onProgress?.(100, "complete");
          const audioId = extractAudioIdFromPlayUrl(playUrl);
          resolve({
            playUrl,
            audioId: audioId ?? ""
          });
        } else {
          options.onProgress?.(0, "error");
          reject(new Error("Failed to get play URL from server"));
        }
      }
    });
    upload.start();
  });
}
function extractAudioIdFromPlayUrl(playUrl) {
  try {
    const url = new URL(playUrl);
    const audioParam = url.searchParams.get("a");
    if (audioParam) {
      const parts = audioParam.split("/");
      return parts[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
function createAudioRecorder(options) {
  let mediaRecorder = null;
  let chunks = [];
  let stream = null;
  return {
    /**
     * Start recording audio
     */
    async start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = options?.mimeType ?? "audio/webm";
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            options?.onDataAvailable?.(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          options?.onStop?.(blob);
          stream?.getTracks().forEach((track) => track.stop());
          stream = null;
        };
        mediaRecorder.onerror = () => {
          options?.onError?.(new Error("Recording failed"));
        };
        mediaRecorder.start(1e3);
        options?.onStart?.();
      } catch (error) {
        options?.onError?.(error instanceof Error ? error : new Error("Failed to start recording"));
      }
    },
    /**
     * Stop recording and get the audio blob
     */
    stop() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    },
    /**
     * Cancel recording without saving
     */
    cancel() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      chunks = [];
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    },
    /**
     * Check if currently recording
     */
    isRecording() {
      return mediaRecorder?.state === "recording";
    }
  };
}
export {
  createAudioRecorder,
  extractAudioIdFromPlayUrl,
  uploadAudioTo3Speak
};
//# sourceMappingURL=audio.mjs.map