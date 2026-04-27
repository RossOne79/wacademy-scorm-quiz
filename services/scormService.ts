import { VideoData, QuizQuestion, SCORMSettings } from '../types';

declare const JSZip: any;

interface ScormPackageData {
  videoData: VideoData;
  learningObjectives: string[];
  quizBank: QuizQuestion[];
  settings: SCORMSettings;
  generateQuiz?: boolean; // Flag per includere o meno il quiz nel pacchetto
}

interface ScormPackageMetadata {
  packageId: string;
  packageVersion: string;
  reportingEndpoint: string;
}

// ---- SCORM File Templates ----

const slugifyValue = (value: string): string => {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "scorm-package";
};

const buildPackageMetadata = (data: ScormPackageData): ScormPackageMetadata => {
    const reportingEndpoint = (import.meta.env.VITE_SCORM_REPORTING_ENDPOINT || "").trim();
    return {
        packageId: slugifyValue(data.settings.courseTitle),
        packageVersion: new Date().toISOString(),
        reportingEndpoint
    };
};

const getPackagedVideoFileName = (fileName: string): string => {
    const match = fileName.match(/\.[a-zA-Z0-9]+$/);
    const extension = match ? match[0].toLowerCase() : ".mp4";
    return `video${extension}`;
};

const getImsmanifestXML = (data: ScormPackageData): string => {
    const { settings } = data;
    const courseIdentifier = `com.v-scorm.course.${Date.now()}`;
    const escapedTitle = settings.courseTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const packagedVideoFileName = getPackagedVideoFileName(data.videoData.file.name);

    if (settings.scormVersion === '1.2') {
        return `<?xml version="1.0" standalone="no" ?>
<manifest identifier="${courseIdentifier}" version="1.1" 
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${escapedTitle}</title>
      <item identifier="item_1" identifierref="res_1" isvisible="true">
        <title>${escapedTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="${packagedVideoFileName}"/>
    </resource>
  </resources>
</manifest>`;
    } else { // SCORM 2004 3rd Ed.
        return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseIdentifier}" version="1.0" 
          xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3" 
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 3rd Edition</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${escapedTitle}</title>
      <item identifier="item_1" identifierref="res_1">
        <title>${escapedTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="${packagedVideoFileName}"/>
    </resource>
  </resources>
</manifest>`;
    }
};

/**
 * ⚠️ REGOLA CRITICA: In questo template HTML, usa SEMPRE virgolette doppie (") per le stringhe JavaScript.
 * NON usare MAI apostrofi singoli (') per le stringhe JavaScript - causano errori di sintassi!
 * 
 * Esempi CORRETTI:
 *   document.getElementById("id") ✅
 *   video.addEventListener("click", ...) ✅
 *   console.warn("messaggio", e) ✅
 * 
 * Esempi SBAGLIATI:
 *   document.getElementById('id') ❌
 *   video.addEventListener('click', ...) ❌
 *   console.warn('messaggio', e) ❌
 */
const getIndexHTML = (data: ScormPackageData, isTestMode = false, packageMetadata?: ScormPackageMetadata): string => {
    const { videoData, learningObjectives, quizBank, settings, generateQuiz = true } = data;
    const metadata = packageMetadata || buildPackageMetadata(data);
    const packagedVideoFileName = getPackagedVideoFileName(videoData.file.name);

    // Filtra domande non supportate o malformate (solo se generateQuiz è true)
    const validQuizBank = generateQuiz ? quizBank.filter((q) => {
        // Normalizza il tipo (case insensitive)
        const qType = (q.type || "").toLowerCase();
        
        // Scarta domande short_answer (non supportate nel quiz interattivo)
        if (qType === "short_answer") {
            console.warn("Scartata domanda short_answer (non supportata):", q.stem);
            return false;
        }
        
        // Verifica che MCQ abbia choices valide
        if (qType === "mcq") {
            if (!q.choices || !Array.isArray(q.choices) || q.choices.length === 0 || !q.choices[0]) {
                console.warn("Scartata domanda MCQ senza choices:", q.stem);
                return false;
            }
            const c = q.choices[0];
            if (!c.A || !c.B || !c.C || !c.D) {
                console.warn("Scartata domanda MCQ con choices incomplete:", q.stem);
                return false;
            }
        }
        
        // Accetta solo mcq e true_false
        if (qType !== "mcq" && qType !== "true_false") {
            console.warn("Scartata domanda con tipo non supportato:", qType, q.stem);
            return false;
        }
        
        return true;
    }) : [];

    const finalQuiz = generateQuiz ? validQuizBank.slice(0, settings.numQuestions) : [];

    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.courseTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: sans-serif; }
      .quiz-choice:hover { background-color: #f0f0f0; }
      .quiz-choice.selected { background-color: #dbeafe; border-color: #3b82f6; }
      .quiz-choice.correct { background-color: #dcfce7; border-color: #22c55e; }
      .quiz-choice.incorrect { background-color: #fee2e2; border-color: #ef4444; }
    </style>
</head>
<body class="bg-gray-100">

    <!-- SCORM API Wrapper -->
    <script type="text/javascript">
      // Standard SCORM API Wrapper - simplified for brevity
      var API = null;
      function findAPI(win) {
        let findAPITries = 0;
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
          findAPITries++;
          if (findAPITries > 7) {
            console.warn("Error finding API -- too deeply nested.");
            return null;
          }
          win = win.parent;
        }
        return win.API;
      }

      function init() {
        if ((window.parent) && (window.parent != window)) {
          API = findAPI(window.parent);
        }
        if ((API == null) && (window.opener)) {
          API = findAPI(window.opener);
        }
        if (API == null) {
          console.warn("SCORM API not found.");
          ${isTestMode ? `API = new MockAPI(); console.log("Using Mock API for testing.")` : ''}
        } else {
          ${settings.scormVersion === '1.2' ? 'API.LMSInitialize("");' : 'API.Initialize("");'}
        }
      }

      ${isTestMode ? `
      class MockAPI {
        constructor() { this.data = {}; console.log("Mock LMS Initialized."); }
        LMSInitialize() { console.log('LMSInitialize("")'); return "true"; }
        Initialize() { console.log('Initialize("")'); return "true"; }
        LMSGetValue(key) { console.log('LMSGetValue("' + key + '") ->', this.data[key] || ""); return this.data[key] || ""; }
        GetValue(key) { return this.LMSGetValue(key); }
        LMSSetValue(key, value) { console.log('LMSSetValue("' + key + '", "' + value + '")'); this.data[key] = value; return "true"; }
        SetValue(key, value) { return this.LMSSetValue(key, value); }
        LMSCommit() { console.log('LMSCommit("")'); return "true"; }
        Commit() { return this.LMSCommit(); }
        LMSFinish() { console.log('LMSFinish("")'); return "true"; }
        Terminate() { return this.LMSFinish(); }
      }
      ` : ''}

      function setSessionTime() {
        if (!API) return;
        const now = new Date();
        const sessionDurationMs = now - sessionStartTime;
        const totalSeconds = Math.floor(sessionDurationMs / 1000);

        if (courseData.settings.scormVersion === "1.2") {
          const hours = Math.min(99, Math.floor(totalSeconds / 3600));
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const timeString = String(hours).padStart(2, "0") + ":" +
                           String(minutes).padStart(2, "0") + ":" +
                           String(seconds).padStart(2, "0");
          API.LMSSetValue("cmi.core.session_time", timeString);
        } else {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const timeString = "PT" + hours + "H" + minutes + "M" + seconds + "S";
          API.SetValue("cmi.session_time", timeString);
        }
      }

      window.addEventListener("load", init);
      window.addEventListener("beforeunload", function() {
        if (typeof window.persistVideoExitTimestamp === "function") {
          try {
            window.persistVideoExitTimestamp();
          } catch (e) {
            console.warn("[SCORM] Exit timestamp save failed:", e);
          }
        }
        if (API) {
          setSessionTime();
          ${settings.scormVersion === '1.2' ? 'API.LMSFinish("");' : 'API.Terminate("");'}
        }
      });
    </script>

    <div id="app" class="max-w-4xl mx-auto p-4 sm:p-8"></div>

    <script type="text/javascript">
      const courseData = {
        title: "${settings.courseTitle.replace(/"/g, '\\"')}",
        objectives: ${JSON.stringify(learningObjectives)},
        quiz: ${JSON.stringify(finalQuiz)},
        settings: ${JSON.stringify(settings)},
        duration: ${videoData.duration},
        generateQuiz: ${generateQuiz},
        packageId: "${metadata.packageId}",
        packageVersion: "${metadata.packageVersion}",
        reporting: {
          endpoint: "${metadata.reportingEndpoint.replace(/"/g, '\\"')}"
        }
      };
      
      const app = document.getElementById('app');
      let currentPage = 'start';
      let currentQuestionIndex = 0;
      let userAnswers = {};
      let quizStartTime;
      let sessionStartTime = new Date();
      let suspendData = {
        maxWatched: 0,
        videoStartTimestamp: "",
        videoEndTimestamp: "",
        attemptId: ""
      };
      let latestAttemptState = {
        completionStatus: "",
        successStatus: "",
        rawScore: null,
        maxScore: null,
        scaledScore: null,
        passed: null
      };
      let lastProgressEventSecond = 0;
      let reportingStatusMessage = "";

      function render() {
        if (currentPage === 'start') renderStartPage();
        else if (currentPage === 'video') renderVideoPage();
        else if (currentPage === 'quiz' && courseData.generateQuiz) renderQuizPage();
        else if (currentPage === 'results' && courseData.generateQuiz) renderResultsPage();
      }

      function generateAttemptId() {
        return "attempt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
      }

      function getLearnerInfo() {
        if (!API) {
          return { learnerId: "", learnerName: "" };
        }

        const getMethod = courseData.settings.scormVersion === "1.2" ? "LMSGetValue" : "GetValue";
        const learnerIdKey = courseData.settings.scormVersion === "1.2" ? "cmi.core.student_id" : "cmi.learner_id";
        const learnerNameKey = courseData.settings.scormVersion === "1.2" ? "cmi.core.student_name" : "cmi.learner_name";

        try {
          return {
            learnerId: API[getMethod](learnerIdKey) || "",
            learnerName: API[getMethod](learnerNameKey) || ""
          };
        } catch (e) {
          console.warn("[SCORM REPORTING] Unable to read learner info:", e);
          return { learnerId: "", learnerName: "" };
        }
      }

      function persistSuspendData() {
        if (!API) return;
        try {
          const suspendKey = "cmi.suspend_data";
          const setValueMethod = courseData.settings.scormVersion === "1.2" ? "LMSSetValue" : "SetValue";
          const commitMethod = courseData.settings.scormVersion === "1.2" ? "LMSCommit" : "Commit";
          const data = JSON.stringify({
            maxWatched: suspendData.maxWatched,
            videoStartTimestamp: suspendData.videoStartTimestamp,
            videoEndTimestamp: suspendData.videoEndTimestamp,
            attemptId: suspendData.attemptId
          });
          API[setValueMethod](suspendKey, data);
          API[commitMethod]("");
        } catch (e) {
          console.warn("Errore nel salvataggio del progresso:", e);
        }
      }

      function ensureAttemptId() {
        if (!suspendData.attemptId) {
          suspendData.attemptId = generateAttemptId();
          persistSuspendData();
        }
        return suspendData.attemptId;
      }

      function buildReportingPayload(eventType, extraData) {
        const learnerInfo = getLearnerInfo();
        return {
          eventType: eventType,
          eventTimestamp: new Date().toISOString(),
          packageId: courseData.packageId,
          packageTitle: courseData.title,
          packageVersion: courseData.packageVersion,
          learnerId: learnerInfo.learnerId,
          learnerName: learnerInfo.learnerName,
          attemptId: ensureAttemptId(),
          scormVersion: courseData.settings.scormVersion,
          lastLocation: currentPage,
          videoStartTimestamp: suspendData.videoStartTimestamp || null,
          videoEndTimestamp: suspendData.videoEndTimestamp || null,
          sessionTimeSeconds: Math.floor((new Date() - sessionStartTime) / 1000),
          maxWatchedSeconds: suspendData.maxWatched || 0,
          completionStatus: latestAttemptState.completionStatus,
          successStatus: latestAttemptState.successStatus,
          rawScore: latestAttemptState.rawScore,
          maxScore: latestAttemptState.maxScore,
          scaledScore: latestAttemptState.scaledScore,
          passed: latestAttemptState.passed,
          suspendData: suspendData,
          ...extraData
        };
      }

      function sendReportingEvent(eventType, extraData = {}, preferBeacon = false) {
        const endpoint = courseData.reporting && courseData.reporting.endpoint;
        if (!endpoint) {
          return;
        }

        try {
          const payload = buildReportingPayload(eventType, extraData);
          const body = JSON.stringify(payload);

          if (preferBeacon && navigator.sendBeacon) {
            const blob = new Blob([body], { type: "application/json" });
            navigator.sendBeacon(endpoint, blob);
            return;
          }

          fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body,
            keepalive: preferBeacon
          }).catch((error) => {
            console.warn("[SCORM REPORTING] Failed to send event:", error);
          });
        } catch (e) {
          console.warn("[SCORM REPORTING] Failed to build event payload:", e);
        }
      }

      async function runReportingDiagnostic() {
        const endpoint = courseData.reporting && courseData.reporting.endpoint;
        if (!endpoint) {
          reportingStatusMessage = "Reporting non configurato nel pacchetto.";
          render();
          return;
        }

        try {
          const payload = buildReportingPayload("diagnostic_ping", {
            diagnostic: true,
            source: "manual_test_button"
          });

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }

          reportingStatusMessage = "Test reporting inviato con successo.";
        } catch (e) {
          console.warn("[SCORM REPORTING] Diagnostic ping failed:", e);
          reportingStatusMessage = "Errore nel test reporting: " + (e && e.message ? e.message : "richiesta bloccata");
        }

        render();
      }

      window.runReportingDiagnostic = function() {
        runReportingDiagnostic();
      };

      function loadSuspendData() {
        if (!API) return;
        try {
          const suspendKey = "cmi.suspend_data";
          const getValueMethod = courseData.settings.scormVersion === "1.2" ? "LMSGetValue" : "GetValue";
          const rawData = API[getValueMethod](suspendKey);

          if (!rawData || rawData.trim() === "") {
            return;
          }

          const parsedData = JSON.parse(rawData);
          if (!parsedData || typeof parsedData !== "object") {
            return;
          }

          suspendData.maxWatched = typeof parsedData.maxWatched === "number" && isFinite(parsedData.maxWatched)
            ? parsedData.maxWatched
            : 0;
          suspendData.videoStartTimestamp = typeof parsedData.videoStartTimestamp === "string"
            ? parsedData.videoStartTimestamp
            : "";
          suspendData.videoEndTimestamp = typeof parsedData.videoEndTimestamp === "string"
            ? parsedData.videoEndTimestamp
            : "";
          suspendData.attemptId = typeof parsedData.attemptId === "string"
            ? parsedData.attemptId
            : "";
        } catch (e) {
          console.warn("Errore nel caricamento del progresso:", e);
        }
      }

      function markVideoStartTimestamp() {
        const shouldStartNewSession = !suspendData.videoStartTimestamp || !!suspendData.videoEndTimestamp;
        if (!shouldStartNewSession) {
          return;
        }

        suspendData.videoStartTimestamp = new Date().toISOString();
        suspendData.videoEndTimestamp = "";
        suspendData.attemptId = generateAttemptId();
        persistSuspendData();
        sendReportingEvent("attempt_started");
      }

      function markVideoEndTimestamp() {
        if (!suspendData.videoStartTimestamp || suspendData.videoEndTimestamp) {
          return;
        }

        suspendData.videoEndTimestamp = new Date().toISOString();
        persistSuspendData();
      }

      window.persistVideoExitTimestamp = function() {
        markVideoEndTimestamp();
        sendReportingEvent("attempt_ended", {}, true);
      };

      function setLocation(page) {
        const previousPage = currentPage;
        currentPage = page;
        if(API) {
          const key = courseData.settings.scormVersion === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location';
          API.${settings.scormVersion === '1.2' ? 'LMSSetValue' : 'SetValue'}(key, page);
        }
        if (page === "video" && previousPage === "start") {
          ensureAttemptId();
          sendReportingEvent("session_started");
        }
        render();
      }
      
      function renderStartPage() {
        const objectivesSection = courseData.objectives && courseData.objectives.length > 0 ? \`
          <h2 class="text-xl font-semibold mb-2">Obiettivi di Apprendimento</h2>
          <ul class="text-left list-disc list-inside mb-6">
            \${courseData.objectives.map(o => \`<li>\${o}</li>\`).join('')}
          </ul>
        \` : '';
        const reportingSection = courseData.reporting && courseData.reporting.endpoint ? \`
          <div class="mt-6 border border-gray-200 rounded-lg p-4 text-left bg-gray-50">
            <p class="text-sm font-semibold text-gray-800 mb-2">Diagnostica Reporting</p>
            <p class="text-xs text-gray-600 break-all mb-3">\${courseData.reporting.endpoint}</p>
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button onclick="runReportingDiagnostic()" class="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-900">Test reporting</button>
              <p class="text-sm text-gray-600">\${reportingStatusMessage || "Nessun test eseguito."}</p>
            </div>
          </div>
        \` : \`
          <div class="mt-6 border border-yellow-200 rounded-lg p-4 text-left bg-yellow-50">
            <p class="text-sm font-semibold text-yellow-800">Reporting non configurato</p>
            <p class="text-sm text-yellow-700 mt-1">Questo pacchetto non ha un endpoint di reporting incorporato.</p>
          </div>
        \`;

        app.innerHTML = \`
          <div class="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 class="text-3xl font-bold mb-2">\${courseData.title}</h1>
            <img src="${videoData.thumbnail}" alt="Course thumbnail" class="mx-auto my-4 rounded-md w-1/2"/>
            <p class="text-gray-600 mb-4">Durata: \${Math.ceil(courseData.duration/60)} minuti</p>
            \${objectivesSection}
            <button onclick="setLocation('video')" class="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700">Inizia Corso</button>
            \${reportingSection}
          </div>
        \`;
      }

      function renderVideoPage() {
        const showControls = courseData.settings.showVideoControls !== false;
        const controlsAttr = showControls ? "controls" : "";
        const customControlsHTML = showControls ? "" : \`
              <div class="mt-4 flex items-center justify-between">
                <button id="playPauseBtn" class="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 flex items-center gap-2">
                  <span id="playPauseText">Play</span>
                </button>
                <div class="text-sm text-gray-600">
                  <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
                </div>
              </div>
              \`;

        const quizButtonHTML = courseData.generateQuiz ? \`
          <div class="flex justify-end">
            <button id="quizBtn" onclick="startQuiz()" class="bg-gray-400 text-white px-8 py-3 rounded-md font-semibold cursor-not-allowed" disabled>Inizia Quiz</button>
          </div>
        \` : \`
          <div class="flex justify-end">
            <p id="completionMsg" class="text-gray-600 italic">Guarda il video per completare il corso</p>
          </div>
        \`;

        app.innerHTML = \`
          <div class="bg-white p-8 rounded-lg shadow-lg">
            <h1 class="text-3xl font-bold mb-4">\${courseData.title}</h1>
            <div class="relative mb-6">
              <video id="courseVideo" src="${packagedVideoFileName}" class="w-full rounded-md" playsinline \${controlsAttr}></video>
              \${customControlsHTML}
            </div>
            \${quizButtonHTML}
          </div>
        \`;

        // Initialize video player
        initVideoPlayer();
      }
      
      function initVideoPlayer() {
        const video = document.getElementById("courseVideo");
        const playPauseBtn = document.getElementById("playPauseBtn");
        const playPauseText = document.getElementById("playPauseText");
        const quizBtn = document.getElementById("quizBtn");
        const completionMsg = document.getElementById("completionMsg");
        const currentTimeSpan = document.getElementById("currentTime");
        const totalTimeSpan = document.getElementById("totalTime");

        if (!video) return;
        // quizBtn può essere null se generateQuiz è false
        
        const showControls = courseData.settings.showVideoControls !== false;
        
        let maxWatched = 0;        // Tempo massimo visto dall'utente
        let lastValidTime = 0;      // Ultimo tempo valido (per bloccare seek)
        let isSeeking = false;      // Flag per evitare loop durante il blocco
        
        // Formatta il tempo in mm:ss
        function formatTime(seconds) {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return mins + ':' + secs.toString().padStart(2, '0');
        }
        
        // Carica il progresso salvato da SCORM
        function loadProgress() {
          loadSuspendData();
          if (typeof suspendData.maxWatched === "number" && suspendData.maxWatched > 0) {
            maxWatched = suspendData.maxWatched;
            lastValidTime = maxWatched;
            video.currentTime = maxWatched;
          }
        }
        
        // Salva il progresso in SCORM
        function saveProgress() {
          suspendData.maxWatched = maxWatched;
          persistSuspendData();
        }
        
        // Aggiorna il tempo visualizzato
        function updateTimeDisplay() {
          if (!showControls && currentTimeSpan) {
            currentTimeSpan.textContent = formatTime(video.currentTime);
          }
          if (!showControls && totalTimeSpan && video.duration) {
            totalTimeSpan.textContent = formatTime(video.duration);
          }
        }
        
        // Event listener per il tempo corrente
        video.addEventListener("timeupdate", () => {
          const currentTime = video.currentTime;
          
          // Aggiorna il tempo massimo visto
          // Se i controlli sono visibili, aggiorna sempre
          // Se i controlli sono nascosti, aggiorna solo se non stiamo facendo seek
          if (showControls || !isSeeking) {
            if (currentTime > maxWatched) {
              maxWatched = currentTime;
              if (!showControls) {
                lastValidTime = currentTime;
              }
              saveProgress();
            }
          }

          const currentSecond = Math.floor(maxWatched);
          if (currentSecond > 0 && currentSecond - lastProgressEventSecond >= 15) {
            lastProgressEventSecond = currentSecond;
            sendReportingEvent("progress_updated");
          }
          
          updateTimeDisplay();
        });

        video.addEventListener("play", () => {
          markVideoStartTimestamp();
        });
        
        // Blocca qualsiasi tentativo di seek (avanti o indietro) solo se i controlli sono nascosti
        if (!showControls) {
          video.addEventListener("seeking", () => {
            isSeeking = true;
            const currentTime = video.currentTime;
            
            // Blocca qualsiasi movimento indietro
            if (currentTime < lastValidTime - 0.5) {
              video.currentTime = lastValidTime;
              return;
            }
            
            // Blocca qualsiasi movimento avanti oltre il massimo visto
            if (currentTime > maxWatched + 0.5) {
              video.currentTime = maxWatched;
              return;
            }
            
            // Permetti solo piccole variazioni dovute al normale avanzamento
            if (Math.abs(currentTime - lastValidTime) > 1.0) {
              video.currentTime = lastValidTime;
            }
          });
          
          video.addEventListener("seeked", () => {
            isSeeking = false;
            const currentTime = video.currentTime;
            
            // Assicurati che siamo ancora nella posizione valida
            if (currentTime < lastValidTime - 0.5) {
              video.currentTime = lastValidTime;
            } else if (currentTime > maxWatched + 0.5) {
              video.currentTime = maxWatched;
            } else {
              // Aggiorna lastValidTime solo se siamo in una posizione valida
              lastValidTime = currentTime;
            }
          });
        }
        
        // Blocca anche i tentativi tramite la barra di progresso (se presente)
        video.addEventListener("loadedmetadata", () => {
          updateTimeDisplay();
          // Imposta i controlli in base all'impostazione
          video.controls = showControls;
          // Disabilita Picture-in-Picture se supportato
          if (video.disablePictureInPicture !== undefined) {
            video.disablePictureInPicture = true;
          }
        });
        
        // Blocca i tasti freccia e altri tasti di navigazione video solo se i controlli sono nascosti
        if (!showControls) {
          video.addEventListener("keydown", (e) => {
            // Blocca freccia sinistra/destra (seek), spazio (play/pause gestito dal nostro bottone)
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
            }
          });
          
          // Blocca anche i click diretti sulla barra di progresso (se dovesse apparire)
          video.addEventListener("click", (e) => {
            // Se il click è sulla parte inferiore del video (dove potrebbe esserci la barra di progresso)
            const rect = video.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const videoHeight = rect.height;
            // Se il click è nell'ultimo 10% del video (dove di solito c'è la barra di progresso)
            if (clickY > videoHeight * 0.9) {
              e.preventDefault();
              e.stopPropagation();
            }
          });
          
          // Gestione play/pausa con controlli custom
          if (playPauseBtn) {
            playPauseBtn.addEventListener("click", () => {
              if (video.paused) {
                video.play()
                  .then(() => {
                    if (playPauseText) playPauseText.textContent = "Pausa";
                  })
                  .catch((error) => {
                    console.warn("Errore avvio video:", error);
                    alert("Impossibile avviare il video. Verifica formato file e console browser.");
                  });
              } else {
                video.pause();
                if (playPauseText) playPauseText.textContent = "Play";
              }
            });
            
            // Aggiorna il testo del pulsante quando il video cambia stato
            video.addEventListener("play", () => {
              if (playPauseText) playPauseText.textContent = "Pausa";
            });
            
            video.addEventListener("pause", () => {
              if (playPauseText) playPauseText.textContent = "Play";
            });
          }
        }
        
        // Abilita il quiz solo quando il video è completato
        video.addEventListener("ended", () => {
          if (!showControls && playPauseBtn && playPauseText) {
            playPauseText.textContent = "Completato";
            playPauseBtn.disabled = true;
            playPauseBtn.classList.add("opacity-50", "cursor-not-allowed");
          }

          if (courseData.generateQuiz) {
            // Abilita il pulsante quiz se presente
            if (quizBtn) {
              quizBtn.disabled = false;
              quizBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
              quizBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
            }
          } else {
            // Senza quiz: mostra messaggio di completamento
            if (completionMsg) {
              completionMsg.textContent = "Video completato! Il corso è terminato.";
              completionMsg.classList.remove("text-gray-600");
              completionMsg.classList.add("text-green-600", "font-semibold");
            }

            latestAttemptState.completionStatus = "completed";
            latestAttemptState.successStatus = "passed";
            latestAttemptState.rawScore = 100;
            latestAttemptState.maxScore = 100;
            latestAttemptState.scaledScore = 1;
            latestAttemptState.passed = true;
            markVideoEndTimestamp();

            // Segna il corso come completato in SCORM (senza quiz)
            if (API) {
              try {
                if (courseData.settings.scormVersion === "1.2") {
                  API.LMSSetValue("cmi.core.lesson_status", "completed");
                  API.LMSSetValue("cmi.core.score.raw", "100");
                  API.LMSCommit("");
                } else {
                  API.SetValue("cmi.completion_status", "completed");
                  API.SetValue("cmi.success_status", "passed");
                  API.SetValue("cmi.score.scaled", "1");
                  API.Commit("");
                }
              } catch (e) {
                console.warn("Errore nell\\'aggiornamento dello stato SCORM:", e);
              }
            }
            sendReportingEvent("attempt_ended");
          }
        });
        
        // Carica il progresso all'inizio
        video.addEventListener("loadeddata", () => {
          loadProgress();
          updateTimeDisplay();
        });
        
        // Aggiorna il tempo totale quando disponibile
        video.addEventListener("durationchange", () => {
          updateTimeDisplay();
        });
      }

      function startQuiz() {
          if (courseData.settings.randomizeOrder) {
            courseData.quiz.sort(() => Math.random() - 0.5);
          }
          quizStartTime = new Date();
          setLocation('quiz');
      }

      function renderQuizPage() {
          const q = courseData.quiz[currentQuestionIndex];
          let choicesHTML = '';
          const qType = (q.type || "").toLowerCase();
          
          if (qType === 'mcq') {
            // Verifica che choices esista e sia valido
            if (q.choices && q.choices[0] && q.choices[0].A) {
              choicesHTML = Object.entries(q.choices[0]).map(([key, value]) => \`
                <div onclick="selectAnswer('\${key}')" class="quiz-choice border-2 border-gray-300 p-4 rounded-md cursor-pointer" data-choice="\${key}">
                  <strong>\${key}.</strong> \${value}
                </div>
              \`).join('');
            } else {
              // Fallback: mostra errore
              choicesHTML = '<div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md">Errore: opzioni non disponibili per questa domanda.</div>';
            }
          } else if (qType === 'true_false') {
            choicesHTML = ['True', 'False'].map(val => \`
              <div onclick="selectAnswer('\${val}')" class="quiz-choice border-2 border-gray-300 p-4 rounded-md cursor-pointer" data-choice="\${val}">\${val}</div>
            \`).join('');
          } else {
            // Tipo di domanda non riconosciuto
            choicesHTML = '<div class="p-4 bg-gray-100 border border-gray-300 text-gray-600 rounded-md">Tipo di domanda: ' + q.type + '</div>';
          }

          app.innerHTML = \`
          <div class="bg-white p-8 rounded-lg shadow-lg">
            <p class="text-gray-600 mb-2">Domanda \${currentQuestionIndex + 1} di \${courseData.quiz.length}</p>
            <p class="text-xl font-semibold mb-6">\${q.stem}</p>
            <div class="space-y-4">\${choicesHTML}</div>
            <div class="mt-8 flex justify-between">
              <button \${currentQuestionIndex === 0 ? 'disabled' : ''} onclick="prevQuestion()" class="bg-gray-200 px-6 py-2 rounded-md disabled:opacity-50">Indietro</button>
              <button onclick="nextQuestion()" class="bg-blue-600 text-white px-6 py-2 rounded-md">\${currentQuestionIndex === courseData.quiz.length - 1 ? 'Invia Risposte' : 'Avanti'}</button>
            </div>
          </div>
        \`;

        // Reselect answer if exists
        if(userAnswers[currentQuestionIndex]) {
          const selected = app.querySelector('[data-choice="' + userAnswers[currentQuestionIndex] + '"]');
          if(selected) selected.classList.add('selected');
        }
      }

      function selectAnswer(answer) {
        userAnswers[currentQuestionIndex] = answer;
        document.querySelectorAll('.quiz-choice').forEach(el => el.classList.remove('selected'));
        const selectedEl = document.querySelector('[data-choice="' + answer + '"]');
        if (selectedEl) selectedEl.classList.add('selected');
      }
      
      function nextQuestion() {
        if (currentQuestionIndex < courseData.quiz.length - 1) {
          currentQuestionIndex++;
          renderQuizPage();
        } else {
          finishQuiz();
        }
      }

      function prevQuestion() {
        if (currentQuestionIndex > 0) {
          currentQuestionIndex--;
          renderQuizPage();
        }
      }

      function finishQuiz() {
          let score = 0;
          courseData.quiz.forEach((q, i) => {
              if (userAnswers[i] === q.correct_answer) {
                  score++;
              }
          });
          
          const rawScore = score;
          const maxScore = courseData.quiz.length;
          const scaledScore = (rawScore / maxScore) * 100;
          const passed = scaledScore >= courseData.settings.passingScore;

          latestAttemptState.completionStatus = "completed";
          latestAttemptState.successStatus = passed ? "passed" : "failed";
          latestAttemptState.rawScore = rawScore;
          latestAttemptState.maxScore = maxScore;
          latestAttemptState.scaledScore = Number((scaledScore / 100).toFixed(2));
          latestAttemptState.passed = passed;
          markVideoEndTimestamp();
          
          if(API) {
            if(courseData.settings.scormVersion === '1.2') {
              API.LMSSetValue('cmi.core.score.raw', rawScore);
              API.LMSSetValue('cmi.core.score.max', maxScore);
              API.LMSSetValue('cmi.core.score.min', 0);
              API.LMSSetValue('cmi.core.lesson_status', passed ? 'passed' : 'failed');
              API.LMSCommit('');
              API.LMSSetValue('cmi.core.exit', 'suspend');
            } else { // 2004
              API.SetValue('cmi.score.raw', rawScore);
              API.SetValue('cmi.score.max', maxScore);
              API.SetValue('cmi.score.min', 0);
              API.SetValue('cmi.score.scaled', scaledScore / 100);
              API.SetValue('cmi.success_status', passed ? 'passed' : 'failed');
              API.SetValue('cmi.completion_status', 'completed');
              API.Commit('');
              API.SetValue('cmi.exit', 'suspend');
            }
          }

          sendReportingEvent("quiz_completed");
          sendReportingEvent("attempt_ended");
          
          setLocation('results');
      }

      function renderResultsPage() {
        let score = 0;
        courseData.quiz.forEach((q, i) => {
            if (userAnswers[i] === q.correct_answer) score++;
        });

        const percentage = Math.round((score / courseData.quiz.length) * 100);
        const passed = percentage >= courseData.settings.passingScore;

        app.innerHTML = \`
          <div class="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 class="text-3xl font-bold mb-4">Quiz Completato!</h1>
            <p class="text-5xl font-bold \${passed ? 'text-green-600' : 'text-red-600'}">\${percentage}%</p>
            <p class="text-gray-600 mb-6">Hai ottenuto un punteggio di \${score} su \${courseData.quiz.length}</p>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div class="\${passed ? 'bg-green-500' : 'bg-red-500'} h-4 rounded-full" style="width: \${percentage}%"></div>
            </div>
            \${passed 
              ? '<p class="text-lg text-green-700">Congratulazioni, hai superato il test!</p>' 
              : '<p class="text-lg text-red-700">Non hai raggiunto il punteggio di superamento del ' + courseData.settings.passingScore + '%.</p>'}
          </div>
        \`;
      }

      // Initial render
      if (API) {
        const location = API.${settings.scormVersion === '1.2' ? 'LMSGetValue' : 'GetValue'}(courseData.settings.scormVersion === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location');
        if (location && ['start', 'video', 'quiz'].includes(location)) {
          currentPage = location;
        }
      }
      window.addEventListener("load", function() {
        sendReportingEvent("package_loaded");
      });
      render();
    </script>
</body>
</html>
    `;
};


export const createScormPackage = async (data: ScormPackageData) => {
    const zip = new JSZip();
    const packageMetadata = buildPackageMetadata(data);
    const packagedVideoFileName = getPackagedVideoFileName(data.videoData.file.name);

    // 1. Add imsmanifest.xml
    zip.file("imsmanifest.xml", getImsmanifestXML(data));

    // 2. Add index.html (the SCO)
    zip.file("index.html", getIndexHTML(data, false, packageMetadata));
    
    // 3. Add video file
    zip.file(packagedVideoFileName, data.videoData.file);

    // 4. Generate and download zip
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    const safeTitle = data.settings.courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}_scorm_${data.settings.scormVersion}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const testInBrowser = async (data: ScormPackageData) => {
    const packageMetadata = buildPackageMetadata(data);
    const htmlContent = getIndexHTML(data, true, packageMetadata);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const videoBlob = new Blob([data.videoData.file], { type: data.videoData.file.type });
    const videoUrl = URL.createObjectURL(videoBlob);
    
    // As we can't directly link to the video blob from another blob URL due to security,
    // we open the content in a new window and inject the video URL.
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
        newWindow.onload = () => {
            const videoElement = newWindow.document.querySelector('#courseVideo');
            if (videoElement) {
                videoElement.src = videoUrl;
                // Assicurati che il video sia inizializzato correttamente
                videoElement.load();
            }
        };
    } else {
      alert("Popup bloccato. Per favore, consenti i popup per questo sito per testare il corso.");
    }
};
