'use strict';

// 매주 월요일 09:00 KST 에 GitHub Actions 가 호출하는 발송 스크립트.
// 의존성 0 — Node 20 내장 fetch 만 사용.
//
// 환경변수:
//   RESEND_API_KEY     — Resend API 키 (필수)
//   FROM_EMAIL         — 발신자 주소. 미설정 시 'onboarding@resend.dev' (테스트 한정)
//   SUBSCRIBER_EMAILS  — 구독자 이메일 콤마 구분 목록
//   DRY_RUN            — '1' 이면 실제 발송 없이 로그만 출력

// ─────────────────────────────────────────────────────────────
// 1) 빈도 데이터 + 가중치 추첨 로직 (main.js 와 동일)
// ─────────────────────────────────────────────────────────────
const freq = {
  1:163,2:158,3:171,4:175,5:162,6:178,7:170,8:181,9:166,10:174,
  11:179,12:183,13:160,14:172,15:168,16:190,17:177,18:196,19:165,20:185,
  21:173,22:188,23:182,24:176,25:193,26:187,27:169,28:195,29:180,30:184,
  31:178,32:171,33:167,34:192,35:176,36:189,37:162,38:197,39:174,40:186,
  41:170,42:183,43:177,44:168,45:161,
};

const vals = Object.values(freq);
const maxF = Math.max(...vals);
const minF = Math.min(...vals);
const range = maxF - minF;

function weightedPick(excl) {
  const pool = [];
  for (let n = 1; n <= 45; n++) {
    if (excl.includes(n)) continue;
    const w = Math.round(((freq[n] - minF) / range) * 4) + 1;
    for (let j = 0; j < w; j++) pool.push(n);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickSet() {
  const picks = [];
  while (picks.length < 6) picks.push(weightedPick(picks));
  return picks.sort((a, b) => a - b);
}

function score(picks) {
  const avg = picks.reduce((s, n) => s + freq[n], 0) / picks.length;
  return Math.round(((avg - minF) / range) * 100);
}

function generateNormal() {
  return Array.from({ length: 5 }, () => {
    const picks = pickSet();
    return { picks, sc: score(picks) };
  });
}

function generateHot() {
  const out = [];
  for (let i = 0; i < 5; i++) {
    let picks; let sc; let tries = 0;
    do {
      picks = pickSet();
      sc = score(picks);
      tries++;
    } while (sc < 70 && tries < 500);
    out.push({ picks, sc });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 2) HTML 메일 본문 빌더
// ─────────────────────────────────────────────────────────────
const BALL_COLORS = ['#ffc400', '#5b8cee', '#e8453c', '#3ecf8e', '#c08aff', '#ef7c3a'];

function ballHtml(n, idx) {
  const c = BALL_COLORS[idx % BALL_COLORS.length];
  return `<span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:${c}1f;color:${c};border:1.5px solid ${c}55;font-weight:700;font-size:14px;margin:2px;font-family:Arial,sans-serif;">${n}</span>`;
}

function rowHtml(idx, set, hot) {
  const stars = set.sc >= 75 ? '★★★' : set.sc >= 50 ? '★★☆' : '★☆☆';
  const balls = set.picks.map((n, i) => ballHtml(n, i)).join('');
  const accent = hot ? '#ef7c3a' : '#f5c842';
  return `
    <tr>
      <td style="padding:10px 8px;color:#888;font-size:12px;width:34px;">${idx + 1}번</td>
      <td style="padding:10px 8px;">${balls}</td>
      <td style="padding:10px 8px;text-align:right;color:${accent};font-size:12px;font-weight:700;white-space:nowrap;">${stars}<br>${set.sc}점</td>
    </tr>`;
}

function buildHtml(normal, hot, dateStr) {
  const normalRows = normal.map((s, i) => rowHtml(i, s, false)).join('');
  const hotRows = hot.map((s, i) => rowHtml(i, s, true)).join('');
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>주간 로또 추천</title></head>
<body style="background:#0a0a12;color:#f0eee8;font-family:Arial,sans-serif;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#12121e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:0.2em;color:#f5c842;text-transform:uppercase;margin-bottom:8px;">WEEKLY LOTTO PICKS</div>
      <h1 style="font-size:26px;margin:0;color:#f5c842;">🎱 이번 주 추천 번호</h1>
      <p style="margin:8px 0 0;color:#888;font-size:13px;">${dateStr}</p>
    </div>

    <h2 style="font-size:13px;color:#f5c842;margin:24px 0 10px;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(245,200,66,0.2);padding-bottom:8px;">🎱 가중치 추천 5세트</h2>
    <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden;">${normalRows}</table>

    <h2 style="font-size:13px;color:#ef7c3a;margin:28px 0 10px;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(239,124,58,0.2);padding-bottom:8px;">🔥 자주 나오는 번호 5세트</h2>
    <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden;">${hotRows}</table>

    <p style="margin:28px 0 0;color:#666;font-size:11px;text-align:center;line-height:1.6;">
      이 메일은 <strong style="color:#888;">로또 6/45 번호 분석기</strong> 주간 구독자에게 발송됩니다.<br>
      구독을 해지하려면 이 메일에 회신해 주세요.
    </p>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// 3) Resend 발송
// ─────────────────────────────────────────────────────────────
async function sendOne(to, html, subject) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey) throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// 4) main
// ─────────────────────────────────────────────────────────────
async function main() {
  const subscribersRaw = process.env.SUBSCRIBER_EMAILS || '';
  const subscribers = subscribersRaw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (subscribers.length === 0) {
    console.log('SUBSCRIBER_EMAILS 가 비어 있습니다. 발송 대상이 없어 종료합니다.');
    return;
  }

  const normal = generateNormal();
  const hot = generateHot();
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const html = buildHtml(normal, hot, dateStr);
  const subject = `🎱 ${dateStr} 주간 로또 추천번호 (5+5)`;

  console.log(`발송 대상: ${subscribers.length}명`);
  console.log(`제목: ${subject}`);
  console.log('가중치 추천:', normal.map((s) => `[${s.picks.join(',')}]=${s.sc}`).join(' '));
  console.log('HOT 추천:    ', hot.map((s) => `[${s.picks.join(',')}]=${s.sc}`).join(' '));

  if (process.env.DRY_RUN === '1') {
    console.log('DRY_RUN=1 — 실제 발송은 건너뜁니다.');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const email of subscribers) {
    try {
      await sendOne(email, html, subject);
      console.log(`  ✓ ${email}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${email}: ${e.message}`);
      fail++;
    }
  }
  console.log(`완료. ok=${ok} fail=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
