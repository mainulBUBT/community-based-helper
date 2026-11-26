// ফেসবুক পোস্টার HTML বানায়: node scripts/make-poster.mjs /tmp/dordam-poster/picks.json marketing/posters/x.html
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
const picks = JSON.parse(readFileSync(src, "utf8"));
const fmt = (n) => "৳" + n.toLocaleString("en-IN");

const card = (p) => `
  <div class="card">
    <div class="imgwrap"><img src="${p.img}" alt="" onerror="this.style.opacity=0"></div>
    <div class="pname">${p.name}</div>
    <div class="price">${fmt(p.price)}</div>
    <div class="meta">${p.shops} দোকানে</div>
  </div>`;

const phones = picks.filter((p) => p.cat === "mobile");
const macs = picks.filter((p) => p.cat === "laptop");

const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:linear-gradient(160deg,#0b2a28 0%,#134e4a 55%,#0f766e 100%);font-family:'Noto Sans Bengali','Kohinoor Bangla','Hind Siliguri',sans-serif;color:#fff;overflow:hidden;position:relative}
.glow{position:absolute;border-radius:50%;filter:blur(120px);opacity:.35}
.g1{width:520px;height:520px;background:#14b8a6;top:-160px;right:-120px}
.g2{width:420px;height:420px;background:#fbbf24;bottom:-140px;left:-140px;opacity:.18}
.wrap{position:relative;padding:44px 56px 36px;height:100%;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:42px;font-weight:800;letter-spacing:.5px}
.logo b{color:#fbbf24}
.date{font-size:20px;color:#a7f3d0;opacity:.85;background:rgba(255,255,255,.08);padding:7px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.15)}
h1{font-size:46px;font-weight:800;line-height:1.2;margin-top:24px}
h1 span{color:#fbbf24}
.sub{font-size:21px;color:#d1fae5;opacity:.85;margin-top:8px}
.sec{margin-top:18px}
.sec h2{font-size:23px;font-weight:700;color:#a7f3d0;display:flex;align-items:center;gap:12px;margin-bottom:12px}
.sec h2::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.18)}
.row{display:flex;gap:12px}
.card{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px 10px 12px;display:flex;flex-direction:column}
.imgwrap{height:118px;display:flex;align-items:center;justify-content:center}
.imgwrap img{max-height:112px;max-width:100%;object-fit:contain}
.pname{font-size:17px;font-weight:600;line-height:1.3;margin-top:8px;min-height:44px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.price{font-size:24px;font-weight:800;color:#fbbf24;margin-top:5px}
.meta{font-size:14px;color:#a7f3d0;opacity:.8;margin-top:3px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;padding-top:14px}
.foot .site{font-size:28px;font-weight:800;color:#fff}
.foot .site b{color:#fbbf24}
.foot .tag{font-size:18px;color:#d1fae5;opacity:.75;text-align:right;line-height:1.45}
</style></head><body>
<div class="glow g1"></div><div class="glow g2"></div>
<div class="wrap">
  <div class="top"><div class="logo">দর<b>দাম</b></div><div class="date">২৬ নভেম্বর ২০২৬</div></div>
  <h1>বাজেট ফোন ও সর্বশেষ <span>ম্যাকবুকের দাম</span></h1>
  <div class="sub">বাংলাদেশের ৫০+ বিশ্বস্ত দোকান থেকে — প্রতিদিন আপডেট হওয়া সর্বশেষ দাম</div>
  <div class="sec"><h2>বাজেট ফোন</h2><div class="row">${phones.map(card).join("")}</div></div>
  <div class="sec"><h2>সর্বশেষ ম্যাকবুক</h2><div class="row">${macs.map(card).join("")}</div></div>
  <div class="foot"><div class="site">dordam<b>.app</b></div><div class="tag">আগে দাম যাচাই,<br>তারপর স্মার্ট কেনা</div></div>
</div></body></html>`;

writeFileSync(out, html);
console.log("written", out);
