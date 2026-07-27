// ======================
// IMPORT
// ======================
import { FFmpeg } from "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js";
import { fetchFile, toBlobURL } from "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js";

// ======================
// UI ELEMENTS
// ======================
const UI = {
  videoInput: document.getElementById("videoInput"),
  uploadCard: document.getElementById("uploadCard"),
  fileInfo: document.getElementById("fileInfo"),
  processBtn: document.getElementById("processBtn"),
  progressWrap: document.getElementById("progressWrap"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  result: document.getElementById("result"),
  downloadBtn: document.getElementById("downloadBtn"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText")
};

// ======================
// STATE
// ======================
const state = {
  ffmpeg: new FFmpeg(),
  loaded: false,
  file: null,
  outputURL: null,
  processing: false
};

// ======================
// UI HELPERS
// ======================
const UIActions = {
  setFile(file) {
    state.file = file;
    UI.fileInfo.textContent = file.name;
    UI.fileInfo.style.display = "block";
    UI.processBtn.disabled = false;
    UI.processBtn.classList.add("active");
  },

  setProgress(percent, text) {
    const value = Math.max(0, Math.min(100, percent));
    UI.progressFill.style.width = value + "%";
    UI.progressText.textContent =
      text || `Processing... ${Math.round(value)}%`;
  },

  showProgress() {
    UI.progressWrap.style.display = "block";
  },

  showResult(url) {
    UI.downloadBtn.href = url;
    UI.result.style.display = "block";
  },

  cleanupURL() {
    if (state.outputURL) {
      URL.revokeObjectURL(state.outputURL);
    }
  }
};

// ======================
// FFMPEG
// ======================
async function loadFFmpeg() {
  if (state.loaded) return;

  UIActions.setProgress(0, "Loading engine...");

  const base =
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

  await state.ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm", "application/wasm`)
  });

  state.ffmpeg.on("progress", ({ progress }) => {
    UIActions.setProgress(progress * 100);
  });

  state.loaded = true;
}

async function processVideo() {
  if (!state.file || state.processing) return;

  state.processing = true;
  UI.processBtn.disabled = true;
  UIActions.showProgress();

  try {
    await loadFFmpeg();

    const input = "input.mp4";
    const output = "output.mp4";

    await state.ffmpeg.writeFile(input, await fetchFile(state.file));
    await state.ffmpeg.exec(["-i", input, output]);

    const data = await state.ffmpeg.readFile(output);

    UIActions.cleanupURL();

    const blob = new Blob([data.buffer], { type: "video/mp4" });
    state.outputURL = URL.createObjectURL(blob);

    UIActions.showResult(state.outputURL);
    UIActions.setProgress(100, "Done ✓");

  } catch (err) {
    console.error(err);
    UI.progressText.textContent = "Error processing video";
  } finally {
    state.processing = false;
  }
}

// ======================
// EVENTS
// ======================
function initFileEvents() {
  // input file
  UI.videoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) UIActions.setFile(file);
  });

  // click upload card
  UI.uploadCard.addEventListener("click", () => {
    UI.videoInput.click();
  });

  // drag
  ["dragenter", "dragover"].forEach(evt => {
    UI.uploadCard.addEventListener(evt, e => {
      e.preventDefault();
      UI.uploadCard.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    UI.uploadCard.addEventListener(evt, e => {
      e.preventDefault();
      UI.uploadCard.classList.remove("dragging");
    });
  });

  // drop file
  UI.uploadCard.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];

    if (!file || !file.type.startsWith("video/")) {
      alert("Masukkan file video!");
      return;
    }

    UIActions.setFile(file);
  });
}

function initProcess() {
  UI.processBtn.addEventListener("click", processVideo);
}

// ======================
// ACCORDION
// ======================
function initAccordion() {
  document.querySelectorAll(".accordion-head").forEach(head => {
    head.addEventListener("click", () => {
      const acc = head.parentElement;

      document.querySelectorAll(".accordion").forEach(a => {
        if (a !== acc) a.classList.remove("open");
      });

      acc.classList.toggle("open");
    });
  });
}

// ======================
// MODAL
// ======================
window.openModal = function (type) {
  UI.modal.classList.add("show");

  const content = {
    TikTok: "Follow TikTok creator kamu.",
    Channel: "Join channel untuk update.",
    Donate: "Support developer 🙌"
  };

  UI.modalTitle.textContent = type;
  UI.modalText.textContent = content[type] || "";
};

window.closeModal = function () {
  UI.modal.classList.remove("show");
};

// ======================
// INIT
// ======================
function init() {
  initFileEvents();
  initProcess();
  initAccordion();
}

init();