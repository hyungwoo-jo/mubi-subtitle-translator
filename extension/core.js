(function (root) {
  'use strict';
  const MAX_CUES = 20000;
  function clean(value) {
    return String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => {
        if (e[0] === '#') {
          const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
          return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
        }
        return ({amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' '})[e.toLowerCase()] ?? m;
      }).replace(/\r/g, '').trim().slice(0, 4000);
  }
  function time(value, frameRate = 30, tickRate = 1) {
    const s = String(value ?? '').trim();
    const unit = s.match(/^(\d+(?:\.\d+)?)(ms|h|m|s|f|t)$/);
    if (unit) return Number(unit[1]) * ({ms:0.001,h:3600,m:60,s:1,f:1/frameRate,t:1/tickRate})[unit[2]];
    const frame = s.match(/^(\d+):(\d{2}):(\d{2}):(\d+)$/);
    if (frame) return +frame[1]*3600 + +frame[2]*60 + +frame[3] + +frame[4]/frameRate;
    const parts = s.replace(',', '.').split(':');
    return s && parts.every(x => /^\d+(?:\.\d+)?$/.test(x)) ? parts.reduce((n,x) => n*60 + Number(x), 0) : NaN;
  }
  function normalize(items) {
    const seen = new Set();
    return items.slice(0, MAX_CUES).map(c => ({start:Number(c.start),end:Number(c.end),text:clean(c.text)}))
      .filter(c => Number.isFinite(c.start) && c.start >= 0 && Number.isFinite(c.end) && c.end > c.start && c.text)
      .sort((a,b) => a.start-b.start || a.end-b.end).filter(c => {
        const key = JSON.stringify([c.start,c.end,c.text]);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
  }
  function parse(body) {
    if (typeof body !== 'string' || body.length > 4*1024*1024) return [];
    const s = body.trim();
    let cues = [];
    if (/^[{[]/.test(s) && !/^\[Script Info\]|^Dialogue:/m.test(s)) {
      try {
        const obj = JSON.parse(s);
        if (Array.isArray(obj.events)) {
          cues = obj.events.filter(e => e.segs && e.dDurationMs > 0).map(e => ({
            start:e.tStartMs/1000, end:(e.tStartMs+e.dDurationMs)/1000, text:e.segs.map(x=>x.utf8 || '').join('')
          }));
        }
      } catch { return []; }
    } else if (s.includes('-->')) {
      for (const block of s.replace(/\r/g,'').split(/\n{2,}/)) {
        if (/^(NOTE|STYLE|REGION)(\s|$)/.test(block)) continue;
        const lines = block.split('\n');
        const i = lines.findIndex(l=>l.includes('-->'));
        if (i < 0) continue;
        const [a,b] = lines[i].split('-->');
        cues.push({start:time(a.trim()), end:time(b.trim().split(/\s/)[0]), text:lines.slice(i+1).join('\n')});
      }
    } else if (/<(?:\w+:)?tt[\s>]/i.test(s) && typeof DOMParser !== 'undefined') {
      const xml = new DOMParser().parseFromString(s, 'application/xml');
      if (xml.querySelector('parsererror')) return [];
      const tt = xml.documentElement;
      const attr = (el,name) => [...el.attributes].find(a=>a.localName===name)?.value;
      const fps = Number(attr(tt,'frameRate')) || 30;
      const tick = Number(attr(tt,'tickRate')) || 1;
      for (const p of xml.getElementsByTagNameNS('*','p')) {
        const start = time(p.getAttribute('begin'),fps,tick);
        const end = p.hasAttribute('end') ? time(p.getAttribute('end'),fps,tick) : start+time(p.getAttribute('dur'),fps,tick);
        const clone = p.cloneNode(true);
        for (const br of clone.getElementsByTagNameNS('*','br')) br.replaceWith('\n');
        cues.push({start,end,text:clone.textContent});
      }
    } else if (/^Dialogue:/m.test(s)) {
      const format = s.match(/^Format:\s*(.*\bText\s*)$/im)?.[1].toLowerCase().split(',').map(x=>x.trim())
        || ['layer','start','end','style','name','marginl','marginr','marginv','effect','text'];
      for (const line of s.split('\n')) {
        const m = line.match(/^Dialogue:\s*(.*)$/);
        if (!m) continue;
        const cols = m[1].split(',');
        cues.push({start:time(cols[format.indexOf('start')]),end:time(cols[format.indexOf('end')]),
          text:cols.slice(format.length-1).join(',').replace(/\{[^}]*\}/g,'').replace(/\\[Nn]/g,'\n')});
      }
    }
    return normalize(cues);
  }
  function active(cues, position) { return cues.filter(c=>c.start<=position && c.end>position); }
  function isCaptionText(value){
    const text=clean(value);
    if(!text) return false;
    const withoutClocks=text.replace(/[−–-]?(?:\d{1,3}:)?\d{1,2}:\d{2}(?:[.,]\d+)?/g,'').replace(/[\s/|()[\]−–-]/g,'');
    return !!withoutClocks;
  }
  function upcoming(cues, position, limit=12) {
    return cues.filter(c=>c.end>position && c.start<position+300).slice(0,limit);
  }
  function validateTranslations(rows, expected) {
    if (!Array.isArray(rows) || rows.length !== expected.length) throw new Error('번역 줄 수가 원문과 다릅니다.');
    const byId = new Map();
    for (const row of rows) {
      if (!Number.isInteger(row.id) || byId.has(row.id) || typeof row.text!=='string' || !row.text.trim() || row.text.length>8000) {
        throw new Error('번역 응답 형식이 잘못되었습니다.');
      }
      byId.set(row.id,row.text.trim());
    }
    return expected.map((_,id)=> {
      if (!byId.has(id)) throw new Error('번역된 자막 번호가 누락되었습니다.');
      return byId.get(id);
    });
  }
  root.HWSubs = {clean,time,normalize,parse,active,upcoming,validateTranslations,isCaptionText};
})(globalThis);
