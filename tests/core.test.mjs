import test from 'node:test';
import assert from 'node:assert/strict';
import '../extension/core.js';
const C=globalThis.HWSubs;
test('DOM captions reject player clocks but preserve dialogue containing times',()=>{
  for(const clock of ['1:21:25','01:21:26 / 2:30:09','−01:08','1:21:31\n1:21:32']) assert.equal(C.isCaptionText(clock),false,clock);
  for(const dialogue of ['Merhaba.','Meet me at 12:30.','42']) assert.equal(C.isCaptionText(dialogue),true,dialogue);
});
test('VTT keeps timing, multiline text and entities, removes cue settings',()=> {
  assert.deepEqual(C.parse('WEBVTT\n\n1\n00:01.000 --> 00:03.500 align:start\n<v Alice>Hello &amp;\nworld</v>\n\nNOTE ignored --> line\nno cue'),
    [{start:1,end:3.5,text:'Hello &\nworld'}]);
});
test('SRT and ASS preserve timestamps and dialogue commas',()=> {
  assert.equal(C.parse('1\n00:00:01,250 --> 00:00:02,750\nHi')[0].start,1.25);
  assert.deepEqual(C.parse('[Script Info]\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.25,0:00:02.75,Default,,0,0,0,,{\\i1}Hi, you\\NAgain'),
    [{start:1.25,end:2.75,text:'Hi, you\nAgain'}]);
});
test('YouTube JSON3 includes automatic caption fragments',()=> {
  assert.deepEqual(C.parse(JSON.stringify({events:[{tStartMs:1000,dDurationMs:2500,segs:[{utf8:'Hello '},{utf8:'world'}]},{tStartMs:0}]})),
    [{start:1,end:3.5,text:'Hello world'}]);
});
test('invalid input and duplicate segments never corrupt the timeline',()=> {
  assert.deepEqual(C.parse('{broken'),[]);
  assert.deepEqual(C.normalize([{start:2,end:1,text:'bad'},{start:-1,end:2,text:'bad'},{start:1,end:2,text:'ok'},{start:1,end:2,text:'ok'}]),
    [{start:1,end:2,text:'ok'}]);
  assert.equal(C.clean('&#999999999; &amp; <script>x</script>'),'& x');
});
test('seek, overlap and exact end times use source timing',()=> {
  const cues=[{start:1,end:3,text:'a'},{start:2,end:4,text:'b'},{start:90,end:95,text:'c'}];
  assert.equal(C.active(cues,2).length,2);
  assert.deepEqual(C.active(cues,3).map(c=>c.text),['b']);
  assert.deepEqual(C.upcoming(cues,80).map(c=>c.text),['c']);
});
test('translation validation restores order and rejects missing/duplicate ids',()=> {
  assert.deepEqual(C.validateTranslations([{id:1,text:'나'},{id:0,text:'가'}],['a','b']),['가','나']);
  for(const rows of [[{id:0,text:'가'}],[{id:0,text:'가'},{id:0,text:'나'}],[{id:0,text:'가'},{id:2,text:'나'}]]){
    assert.throws(()=>C.validateTranslations(rows,['a','b']));
  }
});
