const freq = {
  1:163,2:158,3:171,4:175,5:162,6:178,7:170,8:181,9:166,10:174,
  11:179,12:183,13:160,14:172,15:168,16:190,17:177,18:196,19:165,20:185,
  21:173,22:188,23:182,24:176,25:193,26:187,27:169,28:195,29:180,30:184,
  31:178,32:171,33:167,34:192,35:176,36:189,37:162,38:197,39:174,40:186,
  41:170,42:183,43:177,44:168,45:161
};

const vals = Object.values(freq);
const maxF = Math.max(...vals), minF = Math.min(...vals);
const range = maxF - minF;

function freqClass(f) {
  const p = (f - minF) / range;
  if (p < 0.2)  return 'freq-vlow';
  if (p < 0.4)  return 'freq-low';
  if (p < 0.6)  return 'freq-mid';
  if (p < 0.8)  return 'freq-high';
  return 'freq-vhigh';
}

function initHeatmap() {
  const hm = document.getElementById('heatmap');
  hm.innerHTML = '';
  for (let i = 1; i <= 45; i++) {
    const d = document.createElement('div');
    d.className = 'hcell ' + freqClass(freq[i]);
    d.textContent = i;
    d.setAttribute('data-tip', i + '번: ' + freq[i] + '회');
    hm.appendChild(d);
  }
}

function initHotCold() {
  const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
  const hotNums = sorted.slice(0,10).map(x=>+x[0]);
  const coldNums = sorted.slice(-10).map(x=>+x[0]);

  const hb = document.getElementById('hot-balls');
  hb.innerHTML = '';
  hotNums.forEach(n => {
    hb.innerHTML += `<div class="ball hot">${n}</div>`;
  });

  const cb = document.getElementById('cold-balls');
  cb.innerHTML = '';
  coldNums.forEach(n => {
    cb.innerHTML += `<div class="ball cold">${n}</div>`;
  });

  const bl = document.getElementById('bar-list');
  bl.innerHTML = '';
  const top20 = sorted.slice(0,20);
  const bmax = +top20[0][1];
  top20.forEach(([n,c]) => {
    const pct = Math.round(c/bmax*100);
    bl.innerHTML += `<div class="bar-item">
      <span class="bn">${n}</span>
      <div class="btrack"><div class="bfill" style="width:${pct}%"></div></div>
      <span class="bcnt">${c}회</span>
    </div>`;
  });
}

// 번호 생성
function weightedPick(excl) {
  const pool = [];
  for (let n=1;n<=45;n++) {
    if (excl.includes(n)) continue;
    const w = Math.round((freq[n]-minF)/range*4)+1;
    for (let j=0;j<w;j++) pool.push(n);
  }
  return pool[Math.floor(Math.random()*pool.length)];
}

function pickSet() {
  const picks=[];
  while(picks.length<6) picks.push(weightedPick(picks));
  return picks.sort((a,b)=>a-b);
}

function score(picks) {
  const avg = picks.reduce((s,n)=>s+freq[n],0)/picks.length;
  return Math.round((avg-minF)/range*100);
}

const ballClass = ['r1','r2','r3','r4','r5','r6'];

function generate() {
  const res = document.getElementById('results');
  res.innerHTML = '';
  for (let i=0;i<5;i++) {
    const picks = pickSet();
    const sc = score(picks);
    const stars = sc>=75?'★★★':sc>=50?'★★☆':'★☆☆';
    const balls = picks.map((n,idx)=>`<div class="rball ${ballClass[idx]}">${n}</div>`).join('');
    const row = document.createElement('div');
    row.className = 'result-row';
    row.style.animationDelay = (i*0.07)+'s';
    row.innerHTML = `
      <span class="rlabel">${i+1}번</span>
      <div class="rballs">${balls}</div>
      <div class="rscore">${stars}<span>${sc}점</span></div>`;
    res.appendChild(row);
  }
}

function generateHot() {
  const res = document.getElementById('results');
  res.innerHTML = '';
  for (let i=0;i<5;i++) {
    let picks, sc, tries=0;
    do { picks=pickSet(); sc=score(picks); tries++; } while(sc<70 && tries<500);
    const stars = sc>=75?'★★★':'★★☆';
    const balls = picks.map((n,idx)=>`<div class="rball ${ballClass[idx]}">${n}</div>`).join('');
    const row = document.createElement('div');
    row.className = 'result-row';
    row.style.animationDelay = (i*0.07)+'s';
    row.style.borderColor = 'rgba(239,124,58,0.35)';
    row.innerHTML = `
      <span class="rlabel" style="color:var(--hot)">${i+1}번</span>
      <div class="rballs">${balls}</div>
      <div class="rscore" style="color:var(--hot)">${stars}<span style="color:var(--hot)">${sc}점</span></div>`;
    res.appendChild(row);
  }
}

function initMailForm() {
  const btn = document.getElementById('mail-btn');
  const form = document.getElementById('mail-form');
  const input = document.getElementById('mail-input');
  const submit = form.querySelector('.mail-submit');
  const status = document.getElementById('mail-status');

  btn.addEventListener('click', () => {
    const open = !form.hidden;
    form.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
    if (!open) setTimeout(() => input.focus(), 50);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'mail-status';
    status.textContent = '전송 중...';
    submit.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      if (res.ok) {
        status.textContent = '✅ 구독 신청 완료! 매주 추천번호를 보내드릴게요.';
        status.classList.add('success');
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = (data.errors && data.errors.map(x => x.message).join(', ')) || '전송에 실패했습니다.';
        status.textContent = '⚠️ ' + msg;
        status.classList.add('error');
      }
    } catch (err) {
      status.textContent = '⚠️ 네트워크 오류로 전송에 실패했습니다.';
      status.classList.add('error');
    } finally {
      submit.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeatmap();
  initHotCold();
  initMailForm();

  document.getElementById('generate-btn').addEventListener('click', generate);
  document.getElementById('hot-btn').addEventListener('click', generateHot);

  // Initial generation
  generate();
});
