import assert from 'node:assert/strict';
import test from 'node:test';
import { DeepSeekClient, Type } from '../ai/deepseekClient.ts';

test('Flash defaults to non-thinking and keeps JSON responses supported', async () => {
  const originalFetch = globalThis.fetch;
  const requests: any[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: {
      content: body.response_format ? '{"ok":"yes"}' : 'OK',
    } }] }), { status: 200 });
  };
  try {
    const client = new DeepSeekClient('test-key');
    assert.equal((await client.generateContent({ contents: 'Reply OK' })).text, 'OK');
    await client.generateContent({ contents: 'Return JSON', config: {
      responseSchema: { type: Type.OBJECT, properties: { ok: { type: Type.STRING } }, required: ['ok'] },
    } });
    for (const request of requests) {
      assert.equal(request.model, 'deepseek-flash');
      assert.deepEqual(request.thinking, { type: 'disabled' });
    }
    assert.deepEqual(requests[1].response_format, { type: 'json_object' });
    const thinkingClient = new DeepSeekClient('test-key', 'deepseek-flash', 'enabled');
    await thinkingClient.generateContent({ contents: 'Reply OK' });
    assert.deepEqual(requests[2].thinking, { type: 'enabled' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('tool chat passes model tool calls/results then forces final answer with a two-call ceiling', async () => {
  const originalFetch = globalThis.fetch;
  const requests:any[] = [];
  let executions = 0;
  globalThis.fetch = async (_url,init) => {
    const body = JSON.parse(String(init?.body)); requests.push(body);
    return Response.json({choices:[{finish_reason: requests.length === 1 ? 'tool_calls' : 'stop',message: requests.length === 1
      ? {content:null,tool_calls:[{id:'call-1',type:'function',function:{name:'lookup',arguments:'{"query":"Hà Nội"}'}}]}
      : {content:'{"answer":"Đã tra cứu"}'}}]});
  };
  try {
    const result = await new DeepSeekClient('test-key').generateToolChat({systemInstruction:'Test',messages:[{role:'user',content:'Tra cứu'}],
      responseSchema:{type:Type.OBJECT,properties:{answer:{type:Type.STRING}},required:['answer']},
      tools:[{name:'lookup',description:'Read only',parameters:{type:'object'},execute:async args=>{assert.deepEqual(args,{query:'Hà Nội'});executions++;return {found:true};}}]});
    assert.equal(result.text,'{"answer":"Đã tra cứu"}');
    assert.equal(requests.length,2); assert.equal(executions,1);
    assert.equal(requests[0].tool_choice,'auto'); assert.equal(requests[1].tool_choice,'none');
    assert.ok(requests[1].messages.some((message:any)=>message.role==='tool' && message.tool_call_id==='call-1' && message.content.includes('found')));
  } finally {globalThis.fetch = originalFetch;}
});

test('direct answers need one call, malformed or unauthorized tools never execute', async () => {
  const originalFetch = globalThis.fetch;
  let calls=0, executions=0;
  const client=new DeepSeekClient('test-key');
  const request={systemInstruction:'Test',messages:[{role:'user' as const,content:'Hello'}],responseSchema:{type:Type.OBJECT,properties:{answer:{type:Type.STRING}},required:['answer']},
    tools:[{name:'safe',description:'safe',parameters:{type:'object'},execute:async()=>{executions++;return {};}}]};
  try {
    globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:'{"answer":"Hello"}'}}]});};
    await client.generateToolChat(request); assert.equal(calls,1);
    calls=0;
    globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:calls===1?{content:null,tool_calls:[
      {id:'a',type:'function',function:{name:'delete_data',arguments:'{}'}},{id:'b',type:'function',function:{name:'safe',arguments:'not-json'}}
    ]}:{content:'{"answer":"Không có dữ liệu"}'}}]});};
    await client.generateToolChat(request); assert.equal(executions,0);assert.equal(calls,2);
  } finally {globalThis.fetch=originalFetch;}
});

test('excess tool calls or a second tool round are rejected without unbounded execution', async () => {
  const originalFetch=globalThis.fetch;
  const request={systemInstruction:'Test',messages:[{role:'user' as const,content:'Test'}],tools:[],responseSchema:{type:Type.OBJECT}};
  const call={id:'test',type:'function',function:{name:'unknown',arguments:'{}'}};
  try {
    globalThis.fetch=async()=>Response.json({choices:[{message:{tool_calls:[call,call,call]}}]});
    await assert.rejects(new DeepSeekClient('test').generateToolChat(request),/giới hạn công cụ/);
    globalThis.fetch=async()=>Response.json({choices:[{message:{tool_calls:[call]}}]});
    await assert.rejects(new DeepSeekClient('test').generateToolChat(request),/giới hạn công cụ/);
  } finally {globalThis.fetch=originalFetch;}
});
