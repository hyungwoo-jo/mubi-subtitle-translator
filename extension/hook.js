(() => {
  'use strict';
  if (window.__hwSubsHook) return;
  Object.defineProperty(window,'__hwSubsHook',{value:true});
  const MAX = 4*1024*1024;
  const recent = new Map();
  const captured = new Set();
  const recovered = new Set();
  const state={observed:0,tracks:0,recoveryAttempts:0,discovered:0,manifests:[],failures:0,recoveries:[],recent:[]};
  let enabled = true;
  const likely = (url,type) => /vtt|ttml|dfxp|subrip|subtitle|timedtext|caption|\.mpd(?:[?#]|$)|\.m3u8(?:[?#]|$)|\.(srt|ass|ssa)(?:[?#]|$)/i.test(url)||/vtt|ttml|dfxp|subrip|text\/srt|dash\+xml|mpegurl/i.test(type);
  const candidate=(url,type)=>likely(url,type)||(/text\/plain|(?:application|text)\/(?:[^;]+\+)?xml|application\/json|octet-stream/i.test(type)&&!/\.(m4s|mp4|m4a|ts|aac|webm|png|jpe?g|js|css|woff2?)(?:[?#]|$)/i.test(url));
  function report(){window.postMessage({source:'hw-subtitles',kind:'capture-state',state},location.origin);}
  function note(url,type,via,status=0){
    state.observed++;
    let hostname='';try{hostname=new URL(url,location.href).hostname;}catch{}
    const extension=new URL(url,location.href).pathname.match(/\.([a-z0-9]{1,8})$/i)?.[1]||'';
    const entry={hostname,extension,mime:type,responseType:via,status};
    state.recent.push(entry);
    if(via!=='text'&&via!=='fetch'&&/fetch/.test(via)){state.recoveries.push(entry);if(state.recoveries.length>12)state.recoveries.shift();}
    if(state.recent.length>12) state.recent.shift();
    report();
  }
  function publish(body,url,type,origin='live',segment=null) {
    if (!enabled || typeof body!=='string' || body.length>MAX) return;
    const embedded=body.match(/<(?:\w+:)?tt[\s>][\s\S]*?<\/(?:\w+:)?tt\s*>/i);
    if(embedded)body=embedded[0];
    discover(body,url);
    if (!/\d{1,3}:\d{2}(?:[.,]\d+)?\s*-->|<(?:\w+:)?tt[\s>]|"tStartMs"|^Dialogue:/m.test(body)) return;
    captured.add(url);state.tracks++;
    const key = segment?.key||url.split('?')[0];
    recent.set(key,{body,type,key,origin,segment});
    if (recent.size>8) recent.delete(recent.keys().next().value);
    window.postMessage({source:'hw-subtitles',kind:'track',body,type,key,origin,segment}, location.origin);report();
  }
  const discovered=new Set();
  const segmentedManifests=new Map();
  const requests=[];let inflight=0;
  function drain(){
    while(enabled&&inflight<4&&requests.length){
      const {url,segment}=requests.shift();inflight++;
      Reflect.apply(originalFetch,window,[url]).then(r=>readResponse(r,'discovered',true,segment))
        .catch(()=>{state.failures++;report();}).finally(()=>{inflight--;drain();});
    }
  }
  function fetchCaption(value,base,segment=null){
    let url;try{url=new URL(value,base);if(!['http:','https:'].includes(url.protocol))return;}catch{return;}
    if(discovered.has(url.href)||requests.length>=240) return;
    if(discovered.size>=2000)discovered.delete(discovered.values().next().value);
    discovered.add(url.href);state.discovered++;report();
    requests.push({url:url.href,segment});drain();
  }
  function discover(body,url){
    if(/^[\s\uFEFF]*[\[{]/.test(body)){
      try{
        const walk=(node,caption=false,depth=0)=>{
          if(!node||typeof node!=='object'||depth>8)return;
          if(Array.isArray(node)){for(const item of node.slice(0,100))walk(item,caption,depth+1);return;}
          const isCaption=caption||/subtitle|caption|text\//i.test(String(node.kind||node.type||node.mime_type||node.mimeType||''));
          for(const [key,value]of Object.entries(node)){
            const relevant=isCaption||/subtitle|caption|text_track|remoteTextTrack/i.test(key);
            if(relevant&&typeof value==='string'&&(/^(?:https?:)?\/\//.test(value)||value.startsWith('/'))&&(/url|src|file/i.test(key)||likely(value,'')))fetchCaption(value,url);
            else if(typeof value==='object')walk(value,relevant,depth+1);
          }
        };walk(JSON.parse(body));
      }catch{}return;
    }
    if(/<(?:\w+:)?MPD[\s>]/i.test(body)){
      const xml=new DOMParser().parseFromString(body,'application/xml');
      const child=(node,name)=>[...node.children].find(n=>n.localName===name);
      const baseFor=node=>{let base=url;for(const n of [xml.documentElement,...(node.parentElement?.localName==='Period'?[node.parentElement]:[]),node]){const b=child(n,'BaseURL');if(b)base=new URL(b.textContent.trim(),base).href;}return base;};
      for(const adaptation of xml.getElementsByTagNameNS('*','AdaptationSet')){
        const representations=[...adaptation.children].filter(n=>n.localName==='Representation');
        const type=adaptation.getAttribute('contentType')||adaptation.getAttribute('mimeType')||'';
        if(!/text|ttml|vtt|subtitle/i.test(type)&&!representations.some(r=>/text|ttml|vtt|stpp|wvtt/i.test((r.getAttribute('mimeType')||'')+' '+(r.getAttribute('codecs')||''))))continue;
        const segmented=!!adaptation.getElementsByTagNameNS('*','SegmentTemplate').length||!!adaptation.getElementsByTagNameNS('*','SegmentList').length;
        state.manifests.push({format:'dash',mime:type,segmented,representations:representations.length});
        if(state.manifests.length>12)state.manifests.shift();
        if(segmented){segmentedManifests.set(url,{body,url});prefetchSegments(xml,adaptation,baseFor(adaptation),url);}
        if(!segmented){
          const base=baseFor(adaptation);
          if(representations.length)for(const rep of representations){const b=child(rep,'BaseURL');if(b)fetchCaption(b.textContent.trim(),base);}
          else if(child(adaptation,'BaseURL'))fetchCaption(base,url);
        }
      }report();
    }
    if(/^#EXTM3U/m.test(body)){
      for(const line of body.split('\n')){
        if(/^#EXT-X-MEDIA:.*TYPE=SUBTITLES/.test(line)){const uri=line.match(/URI="([^"]+)"/);if(uri)fetchCaption(uri[1],url);}
        else if(!line.startsWith('#')&&/\.(vtt|srt|ttml)(?:[?#]|$)/i.test(line.trim()))fetchCaption(line.trim(),url);
      }
    }
  }
  function prefetchSegments(xml,adaptation,base,manifestUrl){
    const period=adaptation.parentElement;
    const templateAt=node=>[...node.children].find(n=>n.localName==='SegmentTemplate');
    const periodStart=period.getAttribute('start')||'PT0S';
    const iso=periodStart.match(/PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?/);
    const start=iso?(+iso[1]||0)*3600+(+iso[2]||0)*60+(+iso[3]||0):0;
    const position=Math.max(0,(document.querySelector('video')?.currentTime||0)-start);
    const inherited=templateAt(adaptation)||templateAt(period);
    for(const rep of [...adaptation.children].filter(n=>n.localName==='Representation')){
      const local=templateAt(rep),template=local||inherited;if(!template)continue;
      const attr=name=>local?.getAttribute(name)||inherited?.getAttribute(name);
      const media=attr('media');if(!media)continue;
      const timescale=Number(attr('timescale'))||1,offset=Number(attr('presentationTimeOffset'))||0;
      const first=Number(attr('startNumber'))||1,duration=Number(attr('duration'))||0;
      const key=manifestUrl.split('?')[0]+'#text-'+(adaptation.getAttribute('id')||adaptation.getAttribute('lang')||'')+'-'+(rep.getAttribute('id')||'');
      let repBase=base;const b=[...rep.children].find(n=>n.localName==='BaseURL');if(b)repBase=new URL(b.textContent.trim(),base).href;
      const timeline=[...template.children].find(n=>n.localName==='SegmentTimeline')||[...(inherited?.children||[])].find(n=>n.localName==='SegmentTimeline');
      const expand=(time,number)=>media.replace(/\$RepresentationID\$/g,rep.getAttribute('id')||'').replace(/\$Bandwidth\$/g,rep.getAttribute('bandwidth')||'').replace(/\$(Time|Number)(?:%0(\d+)d)?\$/g,(_m,key,width)=>String(key==='Time'?time:number).padStart(Number(width)||0,'0'));
      let count=0;
      if(timeline){
        let time=0,number=first;
        for(const segment of timeline.children){
          if(segment.localName!=='S')continue;
          if(segment.hasAttribute('t'))time=Number(segment.getAttribute('t'));
          const d=Number(segment.getAttribute('d'));if(!(d>0))break;
          const r=Number(segment.getAttribute('r'))||0;
          const repeat=r<0?Math.max(0,Math.ceil(((position+300)*timescale+offset-time)/d)):r;
          for(let i=0;i<=Math.min(repeat,20000);i++,time+=d,number++){
            const begin=(time-offset)/timescale;
            if(begin>=position+300)break;
            if(begin+d/timescale>position&&count++<60)fetchCaption(expand(time,number),repBase,{key,start:start+begin,duration:d/timescale});
          }
          if(count>=60)break;
        }
      }else if(duration>0){
        const index=Math.max(0,Math.floor((position*timescale+offset)/duration));
        for(let i=index;i<index+60&&i*duration/timescale<position+300;i++)fetchCaption(expand(i*duration,first+i),repBase,{key,start:start+(i*duration-offset)/timescale,duration:duration/timescale});
      }
    }
  }
  setInterval(()=>{
    if(!enabled)return;
    for(const {body,url}of segmentedManifests.values())discover(body,url);
  },10000);
  window.addEventListener('message',e=> {
    if(e.source!==window || e.data?.source!=='hw-subtitles-control') return;
    if(e.data.kind==='stop') {enabled=false; recent.clear();requests.length=0;discovered.clear();}
    if(e.data.kind==='start'){enabled=true;captured.clear();recovered.clear();recover();}
    if(e.data.kind==='replay'){
      for(const item of recent.values()) window.postMessage({source:'hw-subtitles',kind:'track',...item},location.origin);
      recover();report();
    }
  });
  const originalFetch = window.fetch;
  async function readResponse(response,origin='live',forced=false,segment=null){
    const type=response.headers.get('content-type') || '';
    const size=Number(response.headers.get('content-length'));
    if(!enabled||(!forced&&!candidate(response.url,type))||(size&&size>MAX)||/event-stream|video\/|audio\//i.test(type)) return;
    note(response.url,type,origin==='live'?'fetch':origin+'-fetch',response.status);
    const reader=response.clone().body?.getReader();
    if(!reader) return;
    const decoder=new TextDecoder();let body='',count=0;
    try{
      while(true){
        const {done,value}=await reader.read();
        if(done) break;
        count+=value.length;
        if(count>MAX){await reader.cancel();return;}
        body+=decoder.decode(value,{stream:true});
      }
      publish(body+decoder.decode(),response.url,type,origin,segment);
    }catch{ /* The player can cancel in-flight resources. */ }
  }
  window.fetch = async function(...args) {
    const response = await Reflect.apply(originalFetch,this,args);
    readResponse(response).catch(()=>{});
    return response;
  };
  const open=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(...args) {
    this.addEventListener('load',()=> {
      if(!enabled) return;
      const type=this.getResponseHeader('content-type') || '';
      if(!candidate(this.responseURL,type)) return;
      note(this.responseURL,type,this.responseType||'text',this.status);
      if(!this.responseType||this.responseType==='text') publish(this.responseText,this.responseURL,type);
      else if(this.responseType==='arraybuffer'&&this.response?.byteLength<=MAX) publish(new TextDecoder().decode(this.response),this.responseURL,type);
      else if(this.responseType==='json') publish(JSON.stringify(this.response),this.responseURL,type);
      else if(this.responseType==='blob'&&this.response?.size<=MAX) this.response.text().then(text=>publish(text,this.responseURL,type)).catch(()=>{});
    },{once:true});
    return Reflect.apply(open,this,args);
  };
  async function recover(extra=[]){
    if(!enabled) return;
    const urls=[...new Set([...performance.getEntriesByType('resource').map(e=>e.name),...extra])]
      .filter(url=>likely(url,'')&&!captured.has(url)&&!recovered.has(url)).slice(-8).reverse();
    for(const url of urls){
      if(!enabled) break;
      if(captured.has(url)||recovered.has(url)) continue;
      recovered.add(url);state.recoveryAttempts++;report();
      try{await readResponse(await Reflect.apply(originalFetch,window,[url]),'recovered');}catch{state.failures++;report();}
    }
  }
  const observer=new PerformanceObserver(entries=>recover(entries.getEntries().map(e=>e.name)));
  observer.observe({type:'resource',buffered:true});
})();
