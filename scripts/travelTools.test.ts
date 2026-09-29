import test from 'node:test';
import assert from 'node:assert/strict';
import { createTravelTools } from '../ai/travelTools.ts';

test('knowledge search is executed only when called, with bounded output and source propagation', async () => {
  let calls = 0;
  const registry = createTravelTools(async query => { calls++;assert.equal(query,'Món ăn Hà Nội');return {context:'x'.repeat(9000),sourceKind:'supabase_catalog',sources:[{id:'test',title:'Nguồn mẫu',sourceUrl:''}]};});
  assert.equal(calls,0);
  const tool = registry.tools.find(item=>item.name==='search_tourism_knowledge')!;
  const result=await tool.execute({query:'Món ăn Hà Nội'}) as any;
  assert.equal(calls,1);assert.equal(result.context.length,5000);assert.equal(registry.sources.size,1);
  await assert.rejects(tool.execute({query:'x'.repeat(241)}));
  assert.equal(calls,1);
});

test('catalog city paths and category are allowlisted and unsupported cities return no invented records', async () => {
  const registry=createTravelTools();const tool=registry.tools.find(item=>item.name==='search_place_catalog')!;
  const unknown=await tool.execute({city:'../../.env',query:'tham quan',category:'all'}) as any;
  assert.deepEqual(unknown.places,[]);assert.equal(registry.verifiedPlaces.size,0);
  await assert.rejects(tool.execute({city:'Hà Nội',query:'tham quan',category:'sql'}));
  await assert.rejects(tool.execute(null));
  const data=await tool.execute({city:'Đà Lạt',query:'tham quan Đà Lạt',category:'sightseeing'}) as any;
  assert.ok(data.places.length>0 && data.places.length<=12);
  assert.ok(data.places.every((item:any)=>item.cityId==='da-lat' && ['sightseeing','culture'].includes(item.categoryGroup)));
  assert.equal(registry.verifiedPlaces.size,data.places.length);
});
