import test from 'node:test';
import assert from 'node:assert/strict';
import '../extension/connection.js';
test('native diagnostics distinguish registration, allowed origin and launch failures',()=>{
  const cases=[
    ['Specified native messaging host not found.','not registered'],
    ['Access to the specified native messaging host is forbidden.','allowlist'],
    ['Failed to start native messaging host.','Could not launch'],
    ['Native host has exited.','exited before']
  ];
  for(const [message,expected] of cases){
    const output=HWConnection.explain(new Error(message));
    assert(output.includes(expected));assert(output.includes(message));
  }
});
