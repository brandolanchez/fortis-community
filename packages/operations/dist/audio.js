"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/audio.ts
var audio_exports = {};
__export(audio_exports, {
  createAudioRecorder: () => createAudioRecorder,
  extractAudioIdFromPlayUrl: () => extractAudioIdFromPlayUrl,
  uploadAudioTo3Speak: () => uploadAudioTo3Speak
});
module.exports = __toCommonJS(audio_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAudioRecorder,
  extractAudioIdFromPlayUrl,
  uploadAudioTo3Speak
});
//# sourceMappingURL=audio.js.map