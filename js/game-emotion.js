// game-emotion.js v2
// [독립 모듈] 게임 전용 감정 반응 모듈
// v2 변경사항:
//   - game-ghost.js LINES 와 완전히 동일한 대사로 통일 (TTS/말풍선 불일치 해소)
//   - hit(피격), lowHp(저체력), wrong(오답), chest(보물상자), boss, bossClear 이벤트 추가
//   - postMessage 에서 line 필드를 받으면 해당 대사로 TTS 재생 (말풍선과 완전 일치)

(function(){
  const REACTIONS = {
    start: {
      emotions: ["만세","기쁨","신남"],
      lines: [
        "게임 모드 돌입! 준비되셨나요?",
        "좋아요! 한 번 신나게 해볼까요?",
        "이번 판은 왠지 좋은 느낌인데요?",
        "집중, 집중! 제가 응원할게요!",
        "손가락 풀기 끝났죠? 이제 시작!"
      ]
    },
    good: {
      emotions: ["기쁨","신남","만세"],
      lines: [
        "좋아요! 방금 플레이 정말 멋졌어요!",
        "오, 이대로 쭉쭉 가봅시다!",
        "역시 오늘의 실력자!",
        "집중한 만큼 결과가 바로 나오네요!",
        "지금 텐션 그대로 유지해봐요!"
      ]
    },
    miss: {
      emotions: ["당황","불안"],
      lines: [
        "괜찮아요, 지금은 감 잡는 중이에요.",
        "한 번 더 해보면 분명 더 좋아질 거예요.",
        "실수도 연습의 일부니까요.",
        "어디가 헷갈렸는지 같이 다시 볼까요?"
      ]
    },
    wrong: {
      emotions: ["당황","불안"],
      lines: [
        "아, 아쉬워요! 다시 한 번 생각해봐요.",
        "틀렸지만 괜찮아요, 다시 도전!",
        "조금만 더 집중하면 맞출 수 있어요!",
        "이 문제, 같이 다시 봐볼까요?",
        "실수 괜찮아요! 다음엔 꼭 맞춰봐요.",
        "잠깐, 천천히 다시 풀어봐요!"
      ]
    },
    hit: {
      emotions: ["당황","불안"],
      lines: [
        "앗, 맞았어요! 조심하세요!",
        "피격! 잘 피해야 해요~",
        "아야! 체력 챙겨요, 얼른!",
        "으악, 맞으면 안 돼요! 더 피해봐요!",
        "조심! 적이 너무 가까워요!",
        "어, 맞았네요. 더 조심해야 해요~",
        "앗! 한 번 더 맞으면 위험할 수도 있어요!"
      ]
    },
    lowHp: {
      emotions: ["불안","당황","슬픔"],
      lines: [
        "체력이 얼마 없어요! 서둘러요!!",
        "위험해요! 체력이 너무 낮아요!",
        "빨리 회복해야 해요, 지금 당장!",
        "이러다 끝날 수 있어요! 조심조심!!",
        "체력 빨간불! 정신 바짝 차려요!",
        "살아남아야 해요! 피하고 또 피해요!",
        "지금 진짜 위험해요... 집중하세요!!"
      ]
    },
    gameover: {
      emotions: ["당황","피곤"],
      lines: [
        "수고했어요! 한 판 제대로 했네요.",
        "이번 판은 여기까지! 다음에 기록 다시 노려봐요.",
        "어디서 막혔는지 같이 되돌아봐도 좋겠어요.",
        "충분히 잘했어요. 잠깐 쉬었다가 다시 할까요?",
        "게임 오버지만, 이 경험이 다음 판을 더 잘하게 해줄 거예요.",
        "아쉽지만 괜찮아요. 한 번만 더 해봐요!"
      ]
    },
    exit: {
      emotions: ["미소","평온"],
      lines: [
        "게임 끝! 다시 이야기 모드로 돌아왔어요.",
        "재밌었어요. 이제 천천히 대화해볼까요?",
        "게임 정리 완료! 이어서 뭐 하고 싶어요?",
        "좋아요, 이제 다른 이야기도 해봐요."
      ]
    },
    boss: {
      emotions: ["불안","당황"],
      lines: [
        "보스 등장! 긴장 늦추지 마세요!",
        "강적이 나타났어요! 잘 피하면서 싸워봐요!",
        "보스예요! 패턴 잘 보고 공격하세요!",
        "이런, 보스 등장! 집중해요!",
        "보스가 나타났어요. 침착하게 대응해봐요!"
      ]
    },
    levelup: {
      emotions: ["기쁨","신남","만세"],
      lines: [
        "레벨업! 점점 강해지고 있어요! 😊",
        "레벨 올랐어요! 스킬 잘 골라봐요!",
        "성장했네요! 어떤 능력을 키울 거예요?",
        "와, 레벨업! 계속 이렇게 해줘요!",
        "레벨업 축하해요! 더 강해질 수 있어요!",
        "오르고 또 오르고! 정말 잘하고 있어요!",
        "레벨이 올랐어요! 이제 더 강해졌죠?",
        "성장하는 속도가 대단한데요? 멋져요!",
        "레벨업 완료! 어떤 스킬로 더 강해질까요?",
        "쑥쑥 크고 있어요! 이 느낌 유지해봐요!"
      ]
    },
    bossClear: {
      emotions: ["기쁨","신남","만세"],
      lines: [
        "보스 처치! 정말 대단한데요?!",
        "해냈어요! 보스를 무찔렀어요!",
        "보스 격파! 역시 믿었다고요!",
        "보스 처치 성공! 정말 잘했어요!",
        "완벽해요! 다음 보스도 이길 수 있어요!"
      ]
    },
    reward: {
      emotions: ["기쁨","신남","기대"],
      lines: [
        "보상을 골라봐요! 신중하게!",
        "어떤 걸 선택할 거예요? 기대되는데요!",
        "보상 시간! 뭐가 제일 좋을까요~?",
        "이것도 좋고 저것도 좋은데… 잘 골라봐요!",
        "보상 선택! 전략적으로 생각해봐요!",
        "자, 보상이에요! 지금 제일 필요한 게 뭐예요?",
        "골라골라! 이 순간이 게임의 하이라이트죠~",
        "신중하게 골라요. 제가 어떤 걸 택할지 궁금한데요!",
        "보상을 고를 수 있다는 게 설레지 않아요?",
        "좋은 선택을 해봐요! 응원하고 있어요~"
      ]
    },
    chest: {
      emotions: ["기대","기쁨"],
      lines: [
        "보물 상자다! 문제 풀면 아이템이 나와요!",
        "상자를 열 기회예요! 집중해서 풀어봐요!",
        "오, 보물 상자 등장! 정답 맞히면 보상이 있어요!",
        "문제를 풀면 뭔가 좋은 게 나올 것 같은데요?",
        "상자 문제예요! 꼭 맞혀봐요~"
      ]
    }
  };

  let lastGameEmotion = null;

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickEmotion(type) {
    const cfg = REACTIONS[type];
    if (!cfg || !cfg.emotions || !cfg.emotions.length) return null;
    if (cfg.emotions.length === 1) return cfg.emotions[0];

    let candidate = cfg.emotions[Math.floor(Math.random() * cfg.emotions.length)];
    if (candidate === lastGameEmotion) {
      candidate = cfg.emotions[Math.floor(Math.random() * cfg.emotions.length)];
    }
    return candidate;
  }

  // ★ line 파라미터: game-ghost.js 가 선택한 대사를 직접 전달받으면 그대로 사용 (TTS 일치)
  function gameReactCore(type, line) {
    const cfg = REACTIONS[type];
    if (!cfg) return;

    const emo  = pickEmotion(type);
    // line이 전달됐으면 그 대사 사용, 없으면 자체 랜덤 선택 (fallback)
    const text = (typeof line === "string" && line.trim()) ? line : (pickRandom(cfg.lines || []) || "");

    if (emo) {
      lastGameEmotion = emo;
    }

    if (emo && typeof setEmotion === "function") {
      try { setEmotion(emo, text); } catch(e) {}
    }
  }

  // 전역 노출: game-manager.js 및 각 게임 iframe에서 사용
  window.gameReact = function(type, line){
    try {
      gameReactCore(type, line);
    } catch(e){}
  };
})();
