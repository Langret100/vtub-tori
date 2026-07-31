// 실시간-챗(마이파이) 보내기 버튼 길게 누르기 음성 입력
(function () {
  "use strict";

  var HOLD_MS = 420;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function toast(text) {
    var el = document.getElementById("msgStatus");
    if (!el) return;
    el.textContent = text || "";
    el.classList.add("show");
    clearTimeout(el.__voiceToastTimer);
    el.__voiceToastTimer = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }

  function setup() {
    var button = document.getElementById("msgSendBtn");
    var input = document.getElementById("msgInput");
    if (!button || !input || button.__voiceHoldBound) return;
    button.__voiceHoldBound = true;

    var holdTimer = null;
    var held = false;
    var recognition = null;
    var listening = false;
    var longPressTriggered = false;
    var suppressClickUntil = 0;
    var baseText = "";
    var finalText = "";
    var interimText = "";

    function updateInput() {
      var spoken = (finalText + (interimText ? (finalText ? " " : "") + interimText : "")).trim();
      input.value = ((baseText ? baseText + " " : "") + spoken).trim();
    }

    function finish() {
      listening = false;
      button.classList.remove("voice-listening");
      var text = String(input.value || "").trim();
      if (text && longPressTriggered) {
        // 기존 실시간-챗 전송 핸들러를 한 번만 통과시킨다.
        button.__voiceProgrammaticSend = true;
        try { button.click(); } catch (e) {}
        setTimeout(function () { button.__voiceProgrammaticSend = false; }, 0);
      }
      try { input.focus(); } catch (e2) {}
    }

    function start() {
      if (!held || listening) return;
      longPressTriggered = true;
      suppressClickUntil = Date.now() + 900;

      if (!SpeechRecognition) {
        toast("이 브라우저에서는 음성 인식을 지원하지 않아요.");
        return;
      }

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
        toast("음성 인식을 시작할 수 없어요.");
        return;
      }

      recognition.onstart = function () {
        listening = true;
        button.classList.add("voice-listening");
        toast("🎤 듣는 중… 손을 떼면 전송해요.");
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
        updateInput();
      };
      recognition.onerror = function (event) {
        var code = event && event.error ? event.error : "";
        if (code === "not-allowed" || code === "service-not-allowed") toast("마이크 권한을 허용해 주세요.");
        else if (code === "audio-capture") toast("마이크 장치를 찾지 못했어요.");
        else if (code !== "aborted" && code !== "no-speech") toast("음성 인식이 끊겼어요.");
      };
      recognition.onend = finish;

      try { recognition.start(); }
      catch (e) { toast("음성 인식을 시작하지 못했어요. HTTPS와 권한을 확인해 주세요."); }
    }

    function pressStart(event) {
      if (event && event.button != null && event.button !== 0) return;
      if (held) return;
      held = true;
      longPressTriggered = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(start, HOLD_MS);
      try { button.setPointerCapture && event.pointerId != null && button.setPointerCapture(event.pointerId); } catch (e) {}
    }

    function pressEnd() {
      if (!held && !listening) return;
      held = false;
      clearTimeout(holdTimer);
      if (listening && recognition) {
        try { recognition.stop(); } catch (e) {}
      }
    }

    button.addEventListener("pointerdown", pressStart);
    button.addEventListener("pointerup", pressEnd);
    button.addEventListener("pointercancel", pressEnd);

    button.addEventListener("click", function (event) {
      if (button.__voiceProgrammaticSend) return;
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
