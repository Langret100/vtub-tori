// 기본화면 보내기 버튼 길게 누르기 음성 입력
(function () {
  "use strict";

  var HOLD_MS = 420;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function show(message) {
    if (!message) return;
    try {
      if (typeof window.showBubble === "function") window.showBubble(message);
    } catch (e) {}
  }

  function pauseAlwaysListen() {
    try {
      if (window.AlwaysListen && typeof window.AlwaysListen.pauseForVoiceInput === "function") {
        return window.AlwaysListen.pauseForVoiceInput();
      }
    } catch (e) {}
    return false;
  }

  function resumeAlwaysListen(wasPaused) {
    if (!wasPaused) return;
    try {
      if (window.AlwaysListen && typeof window.AlwaysListen.resumeAfterVoiceInput === "function") {
        window.AlwaysListen.resumeAfterVoiceInput();
      }
    } catch (e) {}
  }

  function setup() {
    var button = document.getElementById("sendBtn");
    var input = document.getElementById("userInput");
    if (!button || !input || button.__voiceHoldBound) return;
    button.__voiceHoldBound = true;

    var holdTimer = null;
    var pointerHeld = false;
    var recognition = null;
    var listening = false;
    var longPressTriggered = false;
    var suppressClickUntil = 0;
    var baseText = "";
    var finalText = "";
    var interimText = "";
    var pausedAlwaysListen = false;

    function mergeText() {
      var spoken = (finalText + (interimText ? (finalText ? " " : "") + interimText : "")).trim();
      input.value = ((baseText ? baseText + " " : "") + spoken).trim();
    }

    function finishAndSend() {
      listening = false;
      button.classList.remove("voice-listening");
      resumeAlwaysListen(pausedAlwaysListen);
      pausedAlwaysListen = false;

      var text = String(input.value || "").trim();
      if (text && longPressTriggered) {
        // click 이벤트를 다시 발생시키지 않고 실제 전송 함수를 직접 호출한다.
        try {
          if (typeof window.handleUserSubmit === "function") window.handleUserSubmit();
        } catch (e) {
          console.warn("Voice submit failed:", e);
        }
      }
      try { input.focus(); } catch (e2) {}
    }

    function startRecognition() {
      if (!pointerHeld || listening) return;
      longPressTriggered = true;
      suppressClickUntil = Date.now() + 900;

      if (!SpeechRecognition) {
        show("이 브라우저에서는 음성 인식을 지원하지 않아요.");
        return;
      }

      pausedAlwaysListen = pauseAlwaysListen();
      baseText = String(input.value || "").trim();
      finalText = "";
      interimText = "";

      try {
        recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
      } catch (e) {
        resumeAlwaysListen(pausedAlwaysListen);
        pausedAlwaysListen = false;
        show("음성 인식을 시작할 수 없어요.");
        return;
      }

      recognition.onstart = function () {
        listening = true;
        button.classList.add("voice-listening");
        show("🎤 듣는 중… 버튼에서 손을 떼면 전송해요.");
      };

      recognition.onresult = function (event) {
        interimText = "";
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var result = event.results[i];
          if (!result || !result[0]) continue;
          var text = String(result[0].transcript || "").trim();
          if (!text) continue;
          if (result.isFinal) finalText += (finalText ? " " : "") + text;
          else interimText += (interimText ? " " : "") + text;
        }
        mergeText();
      };

      recognition.onerror = function (event) {
        var code = event && event.error ? event.error : "";
        if (code === "not-allowed" || code === "service-not-allowed") {
          show("마이크 권한이 막혀 있어요. 주소창 옆 마이크 설정에서 허용해 주세요.");
        } else if (code === "audio-capture") {
          show("마이크를 찾지 못했어요. 기기 마이크 설정을 확인해 주세요.");
        } else if (code !== "aborted" && code !== "no-speech") {
          show("음성 인식이 끊겼어요. 다시 길게 눌러 주세요.");
        }
      };

      recognition.onend = finishAndSend;

      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognition.start();
      } catch (e) {
        listening = false;
        button.classList.remove("voice-listening");
        resumeAlwaysListen(pausedAlwaysListen);
        pausedAlwaysListen = false;
        show("음성 인식을 시작하지 못했어요. HTTPS와 마이크 권한을 확인해 주세요.");
      }
    }

    function pressStart(event) {
      if (event && event.button != null && event.button !== 0) return;
      if (pointerHeld) return;
      pointerHeld = true;
      longPressTriggered = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(startRecognition, HOLD_MS);
      try { button.setPointerCapture && event.pointerId != null && button.setPointerCapture(event.pointerId); } catch (e) {}
    }

    function pressEnd() {
      if (!pointerHeld && !listening) return;
      pointerHeld = false;
      clearTimeout(holdTimer);
      if (listening && recognition) {
        try { recognition.stop(); } catch (e) {}
      }
    }

    button.addEventListener("pointerdown", pressStart);
    button.addEventListener("pointerup", pressEnd);
    button.addEventListener("pointercancel", pressEnd);
    // pointerleave에서는 중지하지 않는다. 손가락이 조금 벗어나도 길게 누르기가 유지돼야 한다.

    button.addEventListener("click", function (event) {
      if (!longPressTriggered && Date.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      longPressTriggered = false;
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
