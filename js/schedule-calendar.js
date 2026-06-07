// schedule-calendar.js v4

(function () {
  const STORAGE_KEY = "broadcastSchedule";
  function loadData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); } catch(e) { return {}; } }
  function saveData(d) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); } catch(e) {} }
  function dateKey(y,m,d) { return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0"); }

  function injectStyles() {
    if (document.getElementById("sc-style")) return;
    const s = document.createElement("style");
    s.id = "sc-style";
    s.textContent = `
      #scBtn {
        position:absolute; top:52px; right:14px;
        width:42px; height:42px;
        background:none !important;
        border:none !important; outline:none;
        box-shadow:none !important;
        backdrop-filter:none !important;
        cursor:pointer; z-index:15;
        display:flex; align-items:center; justify-content:center;
        transition:transform .2s, opacity .2s;
        opacity:0.82;
        padding:0;
      }
      #scBtn:hover { transform:scale(1.12); opacity:1; }
      #scBtn svg { filter: drop-shadow(0 0 7px rgba(100,220,255,.7)); }

      #scCal {
        position:absolute; top:50%; left:50%;
        width:min(700px,93vw);
        background:transparent;
        backdrop-filter:none;
        -webkit-backdrop-filter:none;
        border:none !important;
        border-radius:26px;
        box-shadow:none !important;
        padding:24px 22px 22px;
        color:rgba(210,248,255,.97);
        font-family:inherit; z-index:50;
        transform:translate(-50%,-50%) scale(1);
        opacity:1; pointer-events:auto;
        transition:transform .35s cubic-bezier(.34,1.24,.64,1),opacity .28s;
      }
      #scCal.sc-off {
        transform:translate(calc(-50% + 50vw - 55px),calc(-50% - 50vh + 55px)) scale(0.04) !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      /* PC 방송방: 달력 기본 열림, 닫으면 아이콘 표시 */

      @media (max-width:768px) {
        body.broadcast-room-mode #scBtn { display:flex; }
        #scCal { width:min(420px,98vw); padding:15px 13px 13px; }
      }

      /* 헤더 */
      .sc-hd {
        display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;
        background:rgba(30,120,210,0.38); backdrop-filter:blur(24px) saturate(1.5);
        border-radius:10px; padding:5px 10px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.22);
      }
      .sc-title { font-size:17px; font-weight:700; letter-spacing:.05em;
        color:#fff; text-shadow:0 1px 6px rgba(0,40,120,.7); }
      .sc-navg { display:flex; gap:6px; }
      .sc-nav,.sc-x {
        width:28px; height:28px; border-radius:8px; font-size:14px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition:background .14s,transform .1s; border:1px solid;
      }
      .sc-nav { background:rgba(40,160,240,.2); border-color:rgba(120,220,255,.32); color:rgba(190,240,255,.9); }
      .sc-nav:hover { background:rgba(60,190,255,.38); transform:scale(1.1); }
      .sc-x   { background:rgba(220,60,60,.18); border-color:rgba(255,130,130,.28); color:rgba(255,180,180,.88); }
      .sc-x:hover { background:rgba(255,70,70,.36); transform:scale(1.1); }

      /* 요일 */
      .sc-wds {
        display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-bottom:6px;
        background:rgba(30,110,200,0.28); backdrop-filter:blur(16px);
        border-radius:10px; padding:4px 2px;
      }
      .sc-wd { text-align:center; font-size:10px; font-weight:800; padding:2px 0;
        color:rgba(255,255,255,.95); letter-spacing:.04em; }
      .wd-sun { color:rgba(240,100,100,.9); }
      .wd-sat { color:rgba(120,150,255,.9); }

      /* 그리드: 날짜 칸만, 빈 칸 없음 */
      .sc-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; position:relative; }

      .sc-cell {
        aspect-ratio:1/1; min-height:0; border-radius:12px;
        background:rgba(180,225,255,0.18);
        backdrop-filter:none;
        border:none !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.35),
          0 2px 10px rgba(0,60,140,0.12),
          0 1px 3px rgba(0,40,100,0.08);
        padding:6px 6px 5px; cursor:pointer; position:relative;
        transition:background .15s, box-shadow .15s; overflow:hidden;
      }
      .sc-cell:hover {
        background:rgba(180,225,255,0.28);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.4),
          0 4px 16px rgba(0,60,160,0.18),
          0 1px 4px rgba(0,40,100,0.1);
      }
      .sc-cell.sc-today {
        background:rgba(100,195,255,0.30);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.45),
          0 0 0 1.5px rgba(140,230,255,0.55),
          0 4px 16px rgba(0,100,220,0.18);
      }
      .sc-cell.sc-mt {
        background:transparent !important; box-shadow:none !important;
        border:none !important; cursor:default; pointer-events:none;
      }
      .sc-cell.sc-om .sc-dn { opacity:.22; }

      .sc-dn { font-size:11px; font-weight:800; color:rgba(10,40,90,.95);
        display:block; margin-bottom:2px; line-height:1;
        text-shadow:0 1px 2px rgba(255,255,255,.4); }
      .sc-cell.sc-sun .sc-dn { color:rgba(200,50,50,.85); }
      .sc-cell.sc-sat .sc-dn { color:rgba(50,80,200,.85); }

      .sc-prev { font-size:8px; color:rgba(10,40,90,.92); line-height:1.28;
        overflow:hidden; display:-webkit-box; -webkit-line-clamp:3;
        -webkit-box-orient:vertical; word-break:break-all; white-space:pre-wrap; }

      /* 확장 패널 */
      #scExp {
        position:absolute;
        width:260px;
        background:rgba(15,80,160,0.55);
        backdrop-filter:blur(32px) saturate(1.6);
        -webkit-backdrop-filter:blur(32px) saturate(1.6);
        border:none !important;
        border-radius:18px;
        box-shadow:0 8px 32px rgba(0,40,120,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
        padding:16px 16px 54px;
        z-index:100;
        animation:scpop .18s cubic-bezier(.34,1.3,.64,1);
      }
      @keyframes scpop { from{transform:scale(.86);opacity:0} to{transform:scale(1);opacity:1} }
      #scExp .sc-edn {
        font-size:15px; font-weight:700; color:rgba(220,245,255,.98);
        margin-bottom:10px; display:block;
        text-shadow:0 1px 6px rgba(0,60,180,.4);
      }
      #scExp textarea {
        width:100%; min-height:110px;
        background:rgba(4,28,58,.5);
        border:1px solid rgba(100,210,255,.32);
        border-radius:8px; color:rgba(215,248,255,.95);
        font-size:12px; line-height:1.5; padding:6px 8px;
        resize:none; outline:none; box-sizing:border-box;
        font-family:inherit; display:block;
      }
      #scExp textarea::placeholder { color:rgba(120,200,240,.38); }
      #scExp textarea:focus { border-color:rgba(140,230,255,.58); }
      #scExp .sc-acts {
        position:absolute; bottom:12px; right:14px; left:14px;
        display:flex; justify-content:flex-end; gap:7px;
      }
      #scExp .sc-save,#scExp .sc-del {
        height:30px; border-radius:10px; font-size:11px; font-weight:600; cursor:pointer;
        display:flex; align-items:center; padding:0 14px; gap:4px; border:none !important;
        transition:background .14s, transform .1s;
        letter-spacing:.03em;
      }
      #scExp .sc-save { background:rgba(40,160,255,.55); color:#fff; box-shadow:0 2px 10px rgba(0,80,200,.25); }
      #scExp .sc-save:hover { background:rgba(60,185,255,.72); transform:translateY(-1px); }
      #scExp .sc-del  { background:rgba(220,60,60,.35); color:rgba(255,200,200,.95); }
      #scExp .sc-del:hover  { background:rgba(255,70,70,.5); transform:translateY(-1px); }

      #scExpBg { position:absolute; inset:0; z-index:99; }
    `;
    document.head.appendChild(s);
  }

  let cy,cm,expKey=null;
  const cal  = () => document.getElementById("scCal");
  const grid = () => document.getElementById("scGrid");

  function render() {
    const c=cal(); if(!c) return;
    closeExp(true);
    const data=loadData(), now=new Date();
    const fd=new Date(cy,cm,1).getDay();
    const dim=new Date(cy,cm+1,0).getDate();
    const dip=new Date(cy,cm,0).getDate();
    const MN=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    const WD=[["일","wd-sun"],["월",""],["화",""],["수",""],["목",""],["금",""],["토","wd-sat"]];

    let h=`<div class="sc-hd">
      <button class="sc-nav" id="scPrev">&#8249;</button>
      <span class="sc-title">${cy}년 ${MN[cm]}</span>
      <div class="sc-navg">
        <button class="sc-nav" id="scNext">&#8250;</button>
        <button class="sc-x" id="scX">✕</button>
      </div>
    </div>
    <div class="sc-wds">${WD.map(([w,c])=>`<div class="sc-wd ${c}">${w}</div>`).join("")}</div>
    <div class="sc-grid" id="scGrid">`;

    for(let i=0;i<fd;i++) h+=`<div class="sc-cell sc-mt sc-om"><span class="sc-dn">${dip-fd+1+i}</span></div>`;
    for(let d=1;d<=dim;d++){
      const key=dateKey(cy,cm,d);
      const today=d===now.getDate()&&cm===now.getMonth()&&cy===now.getFullYear();
      const dow=new Date(cy,cm,d).getDay();
      const note=data[key]||"";
      h+=`<div class="sc-cell${today?" sc-today":""}${dow===0?" sc-sun":""}${dow===6?" sc-sat":""}" data-key="${key}">
        <span class="sc-dn">${d}</span>
        ${note?`<div class="sc-prev">${note.replace(/</g,"&lt;")}</div>`:""}
      </div>`;
    }
    const rem=(fd+dim)%7; const fill=rem?7-rem:0;
    for(let i=1;i<=fill;i++) h+=`<div class="sc-cell sc-mt sc-om"><span class="sc-dn">${i}</span></div>`;
    h+=`</div>`;
    c.innerHTML=h;

    document.getElementById("scPrev").onclick=e=>{e.stopPropagation();cm--;if(cm<0){cm=11;cy--;}render();};
    document.getElementById("scNext").onclick=e=>{e.stopPropagation();cm++;if(cm>11){cm=0;cy++;}render();};
    document.getElementById("scX").onclick   =e=>{e.stopPropagation();closeCal();};

    grid().querySelectorAll(".sc-cell:not(.sc-mt)").forEach(cell=>{
      cell.addEventListener("click",e=>{
        e.stopPropagation();
        const key=cell.dataset.key;
        if(expKey===key){closeExp();return;}
        openExp(cell,key);
      });
    });
  }

  function openExp(cellEl,key){
    closeExp(true);
    expKey=key;
    const data=loadData(), note=data[key]||"";
    const c=cal();
    const ccr=cellEl.getBoundingClientRect(), calcr=c.getBoundingClientRect();
    const W=210,H=170;
    let left=(ccr.left-calcr.left)+ccr.width+5;
    let top=(ccr.top-calcr.top);
    if(left+W>c.offsetWidth-6) left=(ccr.left-calcr.left)-W-5;
    if(left<4) left=4;
    if(top+H>c.offsetHeight-6) top=c.offsetHeight-H-6;
    if(top<4) top=4;

    const bg=document.createElement("div"); bg.id="scExpBg";
    bg.onclick=e=>{e.stopPropagation();closeExp();};
    c.appendChild(bg);

    const [mon,day]=key.match(/\d+/g).slice(1);
    const p=document.createElement("div"); p.id="scExp";
    p.style.left=left+"px"; p.style.top=top+"px";
    p.innerHTML=`<span class="sc-edn">${parseInt(mon)}월 ${parseInt(day)}일</span>
      <textarea placeholder="일정을 입력하세요...">${note}</textarea>
      <div class="sc-acts">
        ${note?`<button class="sc-del">🗑 삭제</button>`:""}
        <button class="sc-save">✓ 저장</button>
      </div>`;
    p.querySelector("textarea").addEventListener("click",e=>e.stopPropagation());
    p.querySelector("textarea").addEventListener("keydown",e=>e.stopPropagation());
    p.querySelector(".sc-save").onclick=e=>{
      e.stopPropagation();
      const val=p.querySelector("textarea").value.trim();
      const d2=loadData(); if(val)d2[key]=val;else delete d2[key]; saveData(d2);
      closeExp(); render();
    };
    const db=p.querySelector(".sc-del");
    if(db) db.onclick=e=>{e.stopPropagation();const d2=loadData();delete d2[key];saveData(d2);closeExp();render();};
    c.appendChild(p);
    setTimeout(()=>p.querySelector("textarea").focus(),30);
  }

  function closeExp(silent){
    const p=document.getElementById("scExp");
    if(p){
      if(silent){
        const ta=p.querySelector("textarea");
        if(ta&&expKey){const d2=loadData();const v=ta.value.trim();if(v)d2[expKey]=v;else delete d2[expKey];saveData(d2);}
      }
      p.remove();
    }
    const bg=document.getElementById("scExpBg"); if(bg)bg.remove();
    expKey=null;
  }

  function openCal(){ const c=cal();if(c)c.classList.remove("sc-off"); }
  function closeCal(){
    closeExp(true);
    const c=cal(); if(!c) return;
    c.classList.add("sc-off");
    // 닫히면 아이콘 버튼 표시 (PC 방송방 포함)
    const btn=document.getElementById("scBtn");
    if(btn) btn.style.display="flex";
  }

  function init(){
    injectStyles();
    const now=new Date(); cy=now.getFullYear(); cm=now.getMonth();
    const cw=document.getElementById("canvasWrapper"); if(!cw)return;
    if(!document.getElementById("scCal")){
      const c=document.createElement("div"); c.id="scCal"; c.className="sc-off";
      cw.appendChild(c);
    }
    render();
    if(!document.getElementById("scBtn")){
      const b=document.createElement("button"); b.id="scBtn"; b.title="스케줄";
      b.innerHTML=`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="16" rx="3" fill="rgba(180,235,255,0.18)" stroke="rgba(160,230,255,0.7)" stroke-width="1.4"/>
        <rect x="3" y="5" width="18" height="5" rx="3" fill="rgba(80,180,255,0.35)"/>
        <rect x="3" y="8" width="18" height="2" fill="rgba(80,180,255,0.35)"/>
        <line x1="8" y1="3" x2="8" y2="7" stroke="rgba(160,230,255,0.85)" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="16" y1="3" x2="16" y2="7" stroke="rgba(160,230,255,0.85)" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="6.5" y="12" width="3" height="2.5" rx="0.7" fill="rgba(190,240,255,0.78)"/>
        <rect x="10.5" y="12" width="3" height="2.5" rx="0.7" fill="rgba(190,240,255,0.78)"/>
        <rect x="14.5" y="12" width="3" height="2.5" rx="0.7" fill="rgba(190,240,255,0.78)"/>
        <rect x="6.5" y="16" width="3" height="2.5" rx="0.7" fill="rgba(190,240,255,0.78)"/>
        <rect x="10.5" y="16" width="3" height="2.5" rx="0.7" fill="rgba(190,240,255,0.78)"/>
      </svg>`;
      b.onclick=()=>cal().classList.contains("sc-off")?openCal():closeCal();
      cw.appendChild(b);
    }
    window.addEventListener("ghost:broadcast-mode-changed",e=>{
      if(!e.detail||!e.detail.active){const c=cal();if(c)c.classList.add("sc-off");}
    });

    // 기본 상태: 닫힘 — 버튼 눌러야 열림
  }

  if(document.readyState==="complete"||document.readyState==="interactive") setTimeout(init,120);
  else window.addEventListener("DOMContentLoaded",()=>setTimeout(init,120));
  window.ScheduleCalendar={open:openCal,close:closeCal,rebuild:render};
})();
