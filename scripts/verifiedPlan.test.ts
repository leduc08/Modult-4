import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepSeekClient } from '../ai/deepseekClient.ts';
import { createVerifiedPlan } from '../backend/verifiedPlanRoute.ts';

const body = {destination:'da-lat',days:3,peopleCount:3,budget:10000000,style:'Khám phá văn hóa',companions:'Gia đình'};
test('DeepSeek selects verified itinerary IDs with customer parameters and unchanged response structure', async () => {
  const ai = new DeepSeekClient('test-key');let calls=0;
  ai.generateContent = async request => {
    calls++;
    assert.match(String(request.contents),/"guests":3/);
    assert.match(String(request.contents),/"budget":10000000/);
    assert.match(String(request.contents),/Khám phá văn hóa/);
    assert.ok(request.config?.responseSchema?.required?.includes('days'));
    const candidates=JSON.parse(String(request.contents).split('Danh sách địa điểm: ')[1]);
    const sights=candidates.filter((p:any)=>['sightseeing','culture'].includes(p.category));
    const foods=candidates.filter((p:any)=>['food','cafe'].includes(p.category));
    return {text:JSON.stringify({days:Array.from({length:3},(_,i)=>({sightId:sights[i].id,foodId:foods[i].id}))})};
  };
  const result=await createVerifiedPlan(body,ai);assert.equal(calls,1);assert.equal(result.status,200);
  assert.ok('plan' in result);
  if ('plan' in result) {
    assert.match(result.plan.summaryAI,/DeepSeek chọn/);assert.equal(result.plan.peopleCount,3);
    assert.equal(result.plan.totalBudget,10000000);assert.equal(result.plan.days.length,3);
    assert.equal(new Set(result.plan.days.flatMap(day=>day.items.map(item=>item.placeId))).size,6);
    assert.ok(result.plan.days.every(day=>day.items.every(item=>item.coordinates && item.address && item.estimatedCost===null)));
  }
});
test('invalid, duplicate or wrong-category model IDs fall back to local verified places', async () => {
  for (const invalid of ['unknown','duplicate','category']) {
    const ai=new DeepSeekClient('test-key');
    ai.generateContent=async request=>{
      const candidates=JSON.parse(String(request.contents).split('Danh sách địa điểm: ')[1]);
      const sight=candidates.find((p:any)=>p.category==='sightseeing'||p.category==='culture').id;
      const food=candidates.find((p:any)=>p.category==='food'||p.category==='cafe').id;
      return {text:JSON.stringify({days:Array.from({length:3},()=>({sightId:invalid==='unknown'?'invented-id':invalid==='category'?food:sight,foodId:invalid==='category'?sight:food}))})};
    };
    const result=await createVerifiedPlan(body,ai);assert.ok('plan' in result);
    if ('plan' in result) {assert.match(result.plan.summaryAI,/không dùng kết quả DeepSeek/);assert.ok(!result.plan.days.flatMap(day=>day.items).some(item=>item.id==='invented-id'));}
  }
});
test('provider failure, missing key and unsupported destinations keep the existing safe behavior', async () => {
  const ai=new DeepSeekClient('test-key');ai.generateContent=async()=>{throw new Error('DeepSeek API (401)');};
  for (const client of [ai,null]) {const result=await createVerifiedPlan(body,client);assert.equal(result.status,200);if('plan' in result)assert.match(result.plan.summaryAI,/không dùng kết quả DeepSeek/);}
  const unsupported=await createVerifiedPlan({...body,destination:'ha-giang'},ai);assert.equal(unsupported.status,422);
});
