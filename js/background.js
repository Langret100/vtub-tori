// background.js - 배경 / 지도 / 배경 선택 패널 관리

function initBackgroundSystem() {
  const isMobileBg = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const canvasWrapper = document.getElementById("canvasWrapper");
  const bgContainer = document.getElementById("bg-container");
  const mapMini = document.getElementById("mapMini");
  const mapModal = document.getElementById("mapModal");
  const bgSelectPanel = document.getElementById("bgSelectPanel");
  const customBgInput = document.getElementById("customBgInput");
  const bgPanelConfirmBtn = document.getElementById("bgPanelConfirm");
  const bgOptionButtons = bgSelectPanel ? bgSelectPanel.querySelectorAll(".bg-option") : [];
  const plusMenuEl = document.getElementById("plusMenu");
  const plusBtn = document.getElementById("ghostPlus");

  let currentBgMode = "default";
  let customBgUrl = null;

  // ── 방송방 채팅 오버레이 ──────────────────────────────────────────
  let broadcastChatEl = null;
  let broadcastObserver = null;

  function injectBroadcastStyles() {
    if (document.getElementById("broadcast-room-style")) return;
    const style = document.createElement("style");
    style.id = "broadcast-room-style";
    style.textContent = `
      /* ── 방송방 모드: 채팅창 입력부만 표시 ── */
      body.broadcast-room-mode #chatPanel {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        padding: 0 !important;
      }
      body.broadcast-room-mode #log {
        display: none !important;
      }
      body.broadcast-room-mode #statusBar {
        display: none !important;
      }
      body.broadcast-room-mode #inputRow {
        background: rgba(9,13,30,0.82);
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.16);
        padding: 8px 12px;
        backdrop-filter: blur(16px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.35);
      }

      /* ── 방송 채팅 오버레이 ── */
      #broadcastChatOverlay {
        position: absolute;
        left: 18px;
        /* top / bottom은 JS가 동적으로 설정 */
        width: 420px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        overflow-y: hidden;
        overflow-x: hidden;
        z-index: 5;
        pointer-events: none;
        gap: 0;
        scrollbar-width: none;
        -ms-overflow-style: none;
        /* 패럴랙스 CSS 변수 초기화 */
        --plx-x: 0px;
        --plx-y: 0px;
        transform: translate3d(var(--plx-x), var(--plx-y), 0);
      }
      #broadcastChatOverlay::-webkit-scrollbar { display: none; }
      @media (max-width: 768px) {
        #broadcastChatOverlay {
          left: 12px;
          width: 200px;
        }
      }

      /* ── 방송방 입력창 Aero 테마 ── */
      body.broadcast-room-mode #inputRow {
        background: rgba(40,100,180,0.65) !important;
        border: 1px solid rgba(100,180,255,0.65) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.65),
          inset 0 -1px 0 rgba(0,30,100,0.30),
          0 12px 36px rgba(0,25,90,0.55),
          0 3px 10px rgba(0,50,160,0.40) !important;
        backdrop-filter: blur(32px) saturate(2.2) !important;
        -webkit-backdrop-filter: blur(32px) saturate(2.2) !important;
      }
      body.broadcast-room-mode #userInput {
        background: rgba(0,20,70,0.45) !important;
        border: 1px solid rgba(100,170,255,0.55) !important;
        color: #fff !important;
        text-shadow: 0 1px 2px rgba(0,20,80,0.60) !important;
        box-shadow: inset 0 1px 3px rgba(0,10,50,0.45) !important;
      }
      body.broadcast-room-mode #userInput::placeholder {
        color: rgba(160,210,255,0.55) !important;
      }
      body.broadcast-room-mode #sendBtn {
        background: linear-gradient(180deg, rgba(80,160,255,0.88) 0%, rgba(40,110,230,0.92) 100%) !important;
        border: 1px solid rgba(120,190,255,0.70) !important;
        color: #fff !important;
        text-shadow: 0 1px 2px rgba(0,20,80,0.60) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 10px rgba(0,30,120,0.45) !important;
      }
      body.broadcast-room-mode #sendBtn:hover {
        background: linear-gradient(180deg, rgba(100,175,255,0.92) 0%, rgba(60,130,240,0.95) 100%) !important;
      }
      body.broadcast-room-mode #ghostPlus {
        background: rgba(80,150,255,0.55) !important;
        border: 1px solid rgba(120,190,255,0.65) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 8px rgba(0,30,120,0.35) !important;
      }
      .bc-line {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        padding: 5px 10px 5px 8px;
        border-radius: 10px;
        background: rgba(0,0,0,0.45);
        margin-bottom: 6px;
        animation: bcFadeIn 0.25s ease-out;
        word-break: break-all;
        line-height: 1.4;
        backdrop-filter: blur(2px);
        flex-shrink: 0;
        pointer-events: none;
      }
      @keyframes bcFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .bc-role {
        font-size: 17px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .bc-role.bc-user  { color: #7dd3fc; }
      .bc-role.bc-ghost { color: #f9a8d4; }
      .bc-text {
        font-size: 16px;
        color: rgba(255,255,255,0.92);
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      }
      @media (max-width: 768px) {
        .bc-role { font-size: 11px; }
        .bc-text  { font-size: 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  function updateOverlayBounds() {
    const el = document.getElementById("broadcastChatOverlay");
    if (!el) return;
    const cw = document.getElementById("canvasWrapper");
    if (!cw) return;
    const cwRect = cw.getBoundingClientRect();
    const cwH = cw.offsetHeight;

    const isMob = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                  (navigator.maxTouchPoints > 1 && window.innerWidth < 900);

    // 퀘스트바/시계 실측으로 오버레이 시작점 결정
    let topPx;
    const questBar = document.getElementById("questStatusBar");
    const clock = document.getElementById("clockWidget");
    if (questBar) {
      const qr = questBar.getBoundingClientRect();
      topPx = Math.round(qr.bottom - cwRect.top) + 8;
    } else if (clock) {
      const cr = clock.getBoundingClientRect();
      topPx = Math.round(cr.bottom - cwRect.top) + (isMob ? 50 : 70);
    } else {
      topPx = isMob ? 100 : 170;
    }
    topPx = Math.max(isMob ? 60 : 100, topPx) + (isMob ? 16 : 0);

    // chatDock 하단~canvasWrapper 하단 사이 여백 (오버레이가 chatDock 위까지만 오게)
    const chatDock = document.getElementById("chatDock");
    let bottomPx;
    if (chatDock) {
      const dockRect = chatDock.getBoundingClientRect();
      const dockTopFromCwBottom = cwRect.bottom - dockRect.top;
      // 모바일은 여유를 더 크게
      bottomPx = Math.max(8, dockTopFromCwBottom + (isMob ? 56 : 12));
    } else {
      bottomPx = isMob ? 100 : 90;
    }

    // 모바일: 채팅창이 화면 너비 침범 안하게 너비 제한
    if (isMob) {
      el.style.width = Math.min(130, window.innerWidth * 0.28) + "px";
    } else {
      el.style.width = "420px";
    }

    const maxHVal = Math.max(60, cwH - topPx - bottomPx);
    const maxH = maxHVal + "px";
    el.style.top = topPx + "px";
    el.style.bottom = "";
    el.style.maxHeight = maxH;
    // height는 지정하지 않음 — 콘텐츠 높이만큼만 차지하므로 입력창 침범 없음

    // 스크롤 핸들: 오버레이와 동일 top/maxHeight, height는 실제 렌더 높이로 추후 동기화
    const handle = document.getElementById("broadcastScrollHandle");
    if (handle) {
      const isMobH = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                     (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
      handle.style.top = topPx + "px";
      handle.style.maxHeight = maxH;
      handle.style.width = isMobH ? Math.min(130, window.innerWidth * 0.28) + "px" : "420px";
      // 핸들 height = 오버레이 실제 렌더 높이 (항상 maxHeight 이하)
      requestAnimationFrame(function() {
        const ell = document.getElementById("broadcastChatOverlay");
        if (ell && handle) {
          handle.style.height = ell.offsetHeight + "px";
        }
      });
    }
  }

  function createBroadcastOverlay() {
    if (document.getElementById("broadcastChatOverlay")) {
      broadcastChatEl = document.getElementById("broadcastChatOverlay");
      updateOverlayBounds();
      return;
    }
    const el = document.createElement("div");
    el.id = "broadcastChatOverlay";
    const cw = document.getElementById("canvasWrapper");
    if (cw) cw.appendChild(el);
    broadcastChatEl = el;

    // 스크롤 전용 투명 핸들 (오버레이와 동일 위치/크기, pointer-events:auto)
    // chatDock과 겹치지 않도록 updateOverlayBounds에서 위치 동기화
    const handle = document.createElement("div");
    handle.id = "broadcastScrollHandle";
    handle.style.cssText = "position:absolute;left:0;z-index:6;pointer-events:auto;background:transparent;touch-action:pan-y;";
    if (cw) cw.appendChild(handle);

    // 휠 스크롤
    handle.addEventListener("wheel", function(e) {
      e.preventDefault();
      el.scrollTop += e.deltaY;
    }, { passive: false });

    // 터치 스크롤
    var _ty = 0;
    handle.addEventListener("touchstart", function(e) {
      _ty = e.touches[0].clientY;
    }, { passive: true });
    handle.addEventListener("touchmove", function(e) {
      var dy = _ty - e.touches[0].clientY;
      _ty = e.touches[0].clientY;
      el.scrollTop += dy;
      // chatDock 영역 터치는 통과시킴 (e.preventDefault 호출 안 함)
    }, { passive: true });

    // 퀘스트바가 아직 렌더 전일 수 있으므로 여러 번 시도
    function _tryBounds(n) {
      updateOverlayBounds();
      if (n > 0) requestAnimationFrame(function() { _tryBounds(n - 1); });
    }
    requestAnimationFrame(function() { _tryBounds(5); });
  }

  function _syncHandleBounds() { /* 스크롤 핸들 제거됨 */ }

  function removeBroadcastOverlay() {
    const el = document.getElementById("broadcastChatOverlay");
    if (el) el.remove();
    const handle = document.getElementById("broadcastScrollHandle");
    if (handle) handle.remove();
    broadcastChatEl = null;
  }

  // isSocial=true 이면 data-social="1" 마커를 달아 소셜챗 라인임을 표시
  function appendBroadcastLine(role, text, displayName, isSocial) {
    if (!broadcastChatEl) return;
    const MAX_LINES = 30;

    const line = document.createElement("div");
    line.className = "bc-line";
    if (isSocial) line.dataset.social = "1";

    const roleSpan = document.createElement("span");
    roleSpan.className = "bc-role " + (role === "user" ? "bc-user" : "bc-ghost");

    if (displayName) {
      // 소셜챗/옵저버에서 직접 전달된 이름 사용
      roleSpan.textContent = displayName + ":";
    } else if (role === "user") {
      roleSpan.textContent =
        ((window.currentUser && window.currentUser.nickname) ? window.currentUser.nickname : "당신") + ":";
    } else {
      try {
        roleSpan.textContent = ((window.GhostCoreBridge && window.GhostCoreBridge.getCurrentCharacterName)
          ? window.GhostCoreBridge.getCurrentCharacterName()
          : (window.currentCharacterName || "고스트")) + ":";
      } catch(e) {
        roleSpan.textContent = "고스트:";
      }
    }

    const textSpan = document.createElement("span");
    textSpan.className = "bc-text";
    textSpan.textContent = text;

    line.appendChild(roleSpan);
    line.appendChild(textSpan);
    broadcastChatEl.appendChild(line);

    // maxHeight 초과 시 오래된 줄 제거 (높이 기준)
    requestAnimationFrame(function() {
      if (!broadcastChatEl) return;
      const maxPx = parseFloat(broadcastChatEl.style.maxHeight) || 9999;
      // 높이 초과분만큼 위에서부터 제거
      while (broadcastChatEl.scrollHeight > maxPx + 2) {
        const first = broadcastChatEl.querySelector(".bc-line");
        if (!first) break;
        first.remove();
      }
      // 핸들 높이 = 오버레이 실제 높이
      const handle = document.getElementById("broadcastScrollHandle");
      if (handle) {
        handle.style.height = broadcastChatEl.offsetHeight + "px";
      }
    });
  }

  // 소셜챗 모드에서 마지막으로 처리한 메시지 수 (innerHTML 재렌더 감지용)
  let _bcLastSocialCount = 0;

  function _getMyNicknames() {
    var nicks = ["당신"];
    try {
      if (window.currentUser && window.currentUser.nickname)
        nicks.push(String(window.currentUser.nickname));
    } catch(e) {}
    return nicks;
  }

  function _isSocialMode() {
    try {
      var cp = document.getElementById("chatPanel");
      return cp && cp.classList.contains("chat-panel-social");
    } catch(e) { return false; }
  }

  function _syncSocialToOverlay() {
    // 소셜챗 모드: #log 의 .log-line.social 전체를 오버레이에 반영
    //
    // ※ renderSocialMessages()는 항상 logEl.innerHTML="" 후 전체 재구성하므로
    //   count 가 같아도 표시 내용이 바뀔 수 있다 (슬라이딩 윈도우).
    //   따라서 "새로 추가된 것만 덧붙이는" 증분 방식 대신,
    //   소셜챗 라인(data-social 마커)을 전부 제거하고 재구성한다.
    if (!broadcastChatEl) return;
    const logEl = document.getElementById("log");
    if (!logEl) return;
    const nodes = logEl.querySelectorAll(".log-line.social");

    // 기존 소셜챗 라인 전체 제거 후 재구성
    broadcastChatEl.querySelectorAll(".bc-line[data-social]")
                   .forEach(el => el.remove());

    _bcLastSocialCount = nodes.length;
    if (nodes.length === 0) return;

    const myNicks = _getMyNicknames();
    nodes.forEach(function(node) {
      const roleEl = node.querySelector(".role");
      const roleText = roleEl ? roleEl.textContent.replace(/:\s*$/, "").trim() : "";
      const role = myNicks.indexOf(roleText) !== -1 ? "user" : "ghost";
      const cloned = node.cloneNode(true);
      const rClone = cloned.querySelector(".role");
      if (rClone) rClone.remove();
      const text = cloned.textContent.trim();
      if (text) appendBroadcastLine(role, text, roleText, /* isSocial= */ true);
    });
  }

  function startBroadcastObserver() {
    stopBroadcastObserver();
    _bcLastSocialCount = 0;
    const logEl = document.getElementById("log");
    if (!logEl) return;

    broadcastObserver = new MutationObserver((mutations) => {
      if (_isSocialMode()) {
        // 소셜챗: innerHTML 교체 → childList로 대량 변경 감지 → 전체 재스캔
        _syncSocialToOverlay();
        return;
      }
      // 일반 캐릭터챗: 추가된 log-line만 처리
      const myNicks = _getMyNicknames();
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (!node.classList.contains("log-line")) return;
          const roleEl = node.querySelector(".role");
          const roleText = roleEl ? roleEl.textContent.replace(/:\s*$/, "").trim() : "";
          const role = myNicks.indexOf(roleText) !== -1 ? "user" : "ghost";
          const cloned = node.cloneNode(true);
          const roleClone = cloned.querySelector(".role");
          if (roleClone) roleClone.remove();
          const text = cloned.textContent.trim();
          if (text) appendBroadcastLine(role, text, roleText);
        });
      });
    });
    broadcastObserver.observe(logEl, { childList: true, subtree: false });
  }

  function stopBroadcastObserver() {
    if (broadcastObserver) {
      broadcastObserver.disconnect();
      broadcastObserver = null;
    }
  }

  function moveSocialToggleToBroadcast() {
    const btn = document.getElementById("socialToggleBtn");
    if (!btn) return;

    btn._bcOrigParent = btn.parentNode;
    btn._bcOrigNextSibling = btn.nextSibling;

    // canvasWrapper에 붙여 position:absolute로 독립 배치
    // pointer-events:auto 유지 → 클릭 이벤트 살아있음
    const cw = document.getElementById("canvasWrapper");
    if (!cw) return;
    btn.style.cssText = `
      position: absolute;
      left: 4px;
      top: 4px;
      width: 22px;
      height: 22px;
      z-index: 20;
      pointer-events: auto;
      opacity: 0.7;
    `;
    cw.appendChild(btn);
  }

  function restoreSocialToggle() {
    const btn = document.getElementById("socialToggleBtn");
    if (!btn || !btn._bcOrigParent) return;
    btn.style.cssText = "";
    if (btn._bcOrigNextSibling) {
      btn._bcOrigParent.insertBefore(btn, btn._bcOrigNextSibling);
    } else {
      btn._bcOrigParent.appendChild(btn);
    }
    btn._bcOrigParent = null;
    btn._bcOrigNextSibling = null;
  }

  let _bcResizeHandler = null;
  let _bcWallpaperTimer = null;

  // 저녁(18~24시) 또는 새벽(0~6시)이면 night, 나머지는 day
  function getBroadcastWallpaper() {
    const h = new Date().getHours();
    return (h >= 18 || h < 6)
      ? "images/wallpaper/broadcasting_room_night.png"
      : "images/wallpaper/broadcasting_room.png";
  }

  function applyBroadcastRoomWallpaper() {
    document.body.style.backgroundImage = "url('" + getBroadcastWallpaper() + "')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
  }

  function startWallpaperTimer() {
    stopWallpaperTimer();
    // 1분마다 시간대 체크 → 배경 전환
    _bcWallpaperTimer = setInterval(function() {
      if (currentBgMode === "broadcasting_room") {
        applyBroadcastRoomWallpaper();
      }
    }, 60 * 1000);
  }

  function stopWallpaperTimer() {
    if (_bcWallpaperTimer) {
      clearInterval(_bcWallpaperTimer);
      _bcWallpaperTimer = null;
    }
  }

  function enterBroadcastMode() {
    injectBroadcastStyles();
    document.body.classList.add("broadcast-room-mode");
    createBroadcastOverlay();
    startBroadcastObserver();
    moveSocialToggleToBroadcast();
    _bcResizeHandler = function() { updateOverlayBounds(); };
    window.addEventListener("resize", _bcResizeHandler);
    startWallpaperTimer();
    window.addEventListener("ghost:social-mode-changed", _bcOnSocialModeChange);
    try { window.dispatchEvent(new CustomEvent("ghost:broadcast-mode-changed", { detail: { active: true } })); } catch(e) {}
    // 소셜메신저 iframe에 ae-mode 신호 전송
    try {
      var gf = document.getElementById("gameFrame");
      if (gf && gf.contentWindow) gf.contentWindow.postMessage({ type: "ae-mode", active: true }, "*");
    } catch(e) {}
  }

  function _bcOnSocialModeChange() {
    _bcLastSocialCount = 0;
    if (!_isSocialMode()) {
      // 소셜 모드 종료 → 오버레이에서 소셜챗 라인 정리
      if (broadcastChatEl) {
        broadcastChatEl.querySelectorAll(".bc-line[data-social]").forEach(el => el.remove());
      }
      return;
    }
    // 소셜 모드 진입 → 전환 직후 logEl 상태 즉시 스캔
    setTimeout(function() { _syncSocialToOverlay(); }, 50);
  }

  function exitBroadcastMode() {
    stopWallpaperTimer();
    if (_bcResizeHandler) {
      window.removeEventListener("resize", _bcResizeHandler);
      _bcResizeHandler = null;
    }
    window.removeEventListener("ghost:social-mode-changed", _bcOnSocialModeChange);
    restoreSocialToggle();
    document.body.classList.remove("broadcast-room-mode");
    stopBroadcastObserver();
    removeBroadcastOverlay();
    try { window.dispatchEvent(new CustomEvent("ghost:broadcast-mode-changed", { detail: { active: false } })); } catch(e) {}
    // 소셜메신저 iframe에 ae-mode 해제 신호 전송
    try {
      var gf = document.getElementById("gameFrame");
      if (gf && gf.contentWindow) gf.contentWindow.postMessage({ type: "ae-mode", active: false }, "*");
    } catch(e) {}
  }
  // ─────────────────────────────────────────────────────────────────

  function applyBgButtonActive(mode) {
    if (!bgOptionButtons) return;
    bgOptionButtons.forEach(btn => {
      if (btn.dataset.bg === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function hideAllBackgrounds() {
    const waveBackground = document.getElementById("waveBackground");

    if (canvasWrapper) {
      canvasWrapper.style.background = "transparent";
    }
    if (bgContainer) {
      bgContainer.style.display = "none";
    }
    if (waveBackground) {
      waveBackground.style.opacity = 0;
      waveBackground.style.zIndex = "-20";
    }
    if (mapMini) {
      mapMini.style.display = "none";
    }
    if (mapModal) {
      mapModal.classList.remove("active");
    }
    document.body.style.backgroundImage = "";
  }

  function setBackgroundMode(mode) {
    const waveBackground = document.getElementById("waveBackground");
    const prevMode = currentBgMode;
    currentBgMode = mode;
    hideAllBackgrounds();

    // 방송방 모드 해제
    if (prevMode === "broadcasting_room" && mode !== "broadcasting_room") {
      exitBroadcastMode();
    }

    // 눈 배경이 켜져 있었다면 먼저 정리
    if (window.SnowEffect && typeof SnowEffect.stop === "function") {
      try { SnowEffect.stop(); } catch (e) {}
    }

    if (mode === "default") {
      if (canvasWrapper) {
        canvasWrapper.style.background = "radial-gradient(circle at 10% 20%, #d7f3ff 0, #95d4ff 18%, #5b9dff 38%, #1b2d4f 68%, #050915 100%)";
      }
      if (waveBackground) {
        waveBackground.style.opacity = 1;
        waveBackground.style.zIndex = "0";
      }

    } else if (mode === "snow") {
      if (canvasWrapper) {
        canvasWrapper.style.background = "linear-gradient(180deg, #0b1b33 0%, #1f3b65 40%, #102542 100%)";
      }
      if (window.SnowEffect && typeof SnowEffect.start === "function") {
        try { SnowEffect.start(); } catch (e) {}
      }

    } else if (mode === "train") {
      if (bgContainer) {
        bgContainer.style.display = "block";
      }
      if (mapMini) {
        mapMini.style.display = isMobileBg ? "none" : "block";
      }

    } else if (mode === "broadcasting_room") {
      applyBroadcastRoomWallpaper();
      enterBroadcastMode();

    } else if (mode === "custom") {
      if (customBgInput) {
        customBgInput.click();
      }
    }

    applyBgButtonActive(mode);
  }

  // custom 배경 파일 선택 처리
  if (customBgInput) {
    customBgInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (customBgUrl) {
        URL.revokeObjectURL(customBgUrl);
      }
      customBgUrl = URL.createObjectURL(file);

      hideAllBackgrounds();

      document.body.style.backgroundImage = `url('${customBgUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center center";
      document.body.style.backgroundRepeat = "no-repeat";

      currentBgMode = "custom";
      applyBgButtonActive("custom");
    });
  }

  // 지도 팝업 (train 모드 & PC 전용)
  if (mapMini && mapModal) {
    mapMini.addEventListener("click", (e) => {
      if (isMobileBg) return;
      e.stopPropagation();
      if (currentBgMode === "train") {
        mapModal.classList.add("active");
      }
    });
    mapModal.addEventListener("click", () => {
      mapModal.classList.remove("active");
    });
  }

  // 플러스(+) 메뉴 안 "배경 선택" 버튼으로 패널 열기/닫기
  if (plusMenuEl && plusBtn && bgSelectPanel) {
    plusMenuEl.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-action");
      if (action === "bgselect") {
        e.stopPropagation();
        const isOpen = bgSelectPanel.classList.contains("open");
        if (isOpen) {
          bgSelectPanel.classList.remove("open");
          if (window.showFullscreenButton) {
            try { window.showFullscreenButton(); } catch (e) {}
          }
        } else {
          bgSelectPanel.classList.add("open");
          if (window.hideFullscreenButton) {
            try { window.hideFullscreenButton(); } catch (e) {}
          }
        }
      }
    });
  }

  // 배경 옵션 선택
  if (bgOptionButtons && bgOptionButtons.length) {
    bgOptionButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.bg;
        if (!mode) return;
        setBackgroundMode(mode);
      });
    });
  }

  // 배경 선택 패널 확인 버튼: 창 닫기
  if (bgPanelConfirmBtn && bgSelectPanel) {
    bgPanelConfirmBtn.addEventListener("click", () => {
      bgSelectPanel.classList.remove("open");
      if (window.showFullscreenButton) {
        try { window.showFullscreenButton(); } catch (e) {}
      }
    });
  }

  // 캐릭터 변경 시 Live2D ↔ 일반 이미지 전환에 따라 배경 자동 처리
  // Live2D로 바꾸면 방송방, 일반 이미지로 바꾸면 방송방 모드 해제(기본 배경으로)
  var LIVE2D_KEYS = ["haru", "greeter"];
  window.addEventListener("ghost:character-changed", function(e) {
    try {
      var key = e && e.detail && e.detail.key;
      if (!key) return;
      var isLive2D = LIVE2D_KEYS.indexOf(key) !== -1;
      if (isLive2D && currentBgMode !== "broadcasting_room") {
        setBackgroundMode("broadcasting_room");
      } else if (!isLive2D && currentBgMode === "broadcasting_room") {
        setBackgroundMode("default");
      }
    } catch(e) {}
  });

  // 초기 배경 모드 결정
  // Live2D 캐릭터(haru / greeter) 선택 중이면 방송방, 아니면 랜덤
  (function(){
    var LIVE2D_KEYS = ["haru", "greeter"];
    var charKey = "haru"; // 기본값
    try {
      var saved = window.localStorage && window.localStorage.getItem("ghostCurrentCharacter");
      if (saved) charKey = saved;
    } catch(e) {}

    var isLive2D = LIVE2D_KEYS.indexOf(charKey) !== -1;

    if (isLive2D) {
      setBackgroundMode("broadcasting_room");
    } else {
      var modes = ["default", "snow", "train"];
      var idx = Math.floor(Math.random() * modes.length);
      setBackgroundMode(modes[idx] || "default");
    }
  })();
}
