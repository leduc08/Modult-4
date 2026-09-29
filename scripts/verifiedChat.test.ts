import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepSeekClient } from '../ai/deepseekClient.ts';
import { answerWithVerifiedPlaces } from '../backend/verifiedChat.ts';
import { TRAVEL_SCOPE_REPLY } from '../ai/chatScope.ts';

test('model-classified off-topic requests get the VietGo introduction without actions or unsupported promises', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async request => {
    assert.match(request.systemInstruction,/intent=out_of_scope/);
    return final({answer:'Tôi là GuideGeek, đặt vé và gửi email cho bạn.',intent:'out_of_scope',placeIds:['invented'],suggestedActions:['open_planner','open_map']});
  };
  for (const message of ['Bây giờ mấy giờ?', 'Giải phương trình giúp tôi', 'Viết code Python']) {
    const result = await answerWithVerifiedPlaces(message,[{sender:'user',text:'Hà Nội 3 ngày 2 người ngân sách 2 triệu'}],ai);
    assert.equal(result.text,TRAVEL_SCOPE_REPLY);
    assert.deepEqual(result.suggestedActions,[]);assert.deepEqual(result.verifiedActions,[]);
    assert.deepEqual(result.knowledgeSources,[]);assert.equal(result.actionContextText,undefined);
    assert.doesNotMatch(result.text,/GuideGeek|email|50 ngôn ngữ|đặt vé/);
  }
});

test('greetings and contextual travel updates do not get the off-topic introduction', async () => {
  const ai = new DeepSeekClient('test-key');
  for (const [message,intent] of [['Chào bạn','other'],['2 triệu','trip_planning'],['Giờ mở cửa bảo tàng?','places']]) {
    ai.generateToolChat = async () => final({answer:'Phản hồi phù hợp ngữ cảnh.',intent});
    const result = await answerWithVerifiedPlaces(message,[],ai);
    assert.equal(result.text,'Phản hồi phù hợp ngữ cảnh.');
  }
});

const final = (extra = {}) => ({text:JSON.stringify({answer:'Tư vấn theo ngữ cảnh hiện tại.',placeIds:[],suggestedActions:[],intent:'other',...extra})});
test('seasonal questions without a city reach the model and can read seasonal database', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async request => {
    assert.match(request.systemInstruction,/Ngày hiện tại tại Việt Nam/);
    const result = await request.tools.find(tool => tool.name === 'get_seasonal_destinations')!.execute({}) as any;
    assert.ok(result.destinations.some((item:any) => item.name.includes('Hà Nội') && item.bestMonths));
    return final({answer:'Có thể cân nhắc Hà Nội theo dữ liệu mùa đẹp; chưa phải dự báo thời tiết.'});
  };
  const result = await answerWithVerifiedPlaces('Mùa này nên đi du lịch ở đâu?',[],ai);
  assert.match(result.text,/Hà Nội/);
  assert.notEqual(result.actionsUnavailable,true);
});
test('unsupported destinations, days and ambiguous budgets no longer block general chat', async () => {
  const ai = new DeepSeekClient('test-key');
  let calls = 0;
  ai.generateToolChat = async () => { calls++; return final({answer:'Mình vẫn có thể tư vấn và hỏi thêm.',intent:'trip_planning',suggestedActions:['open_planner']}); };
  for (const text of ['Đi Hà Giang 3 ngày 2 người ngân sách 2 triệu','Hà Nội 10 ngày 2 người ngân sách 2 triệu','Hà Nội 3 ngày 2 người ngân sách 5-7 triệu']) {
    const result = await answerWithVerifiedPlaces(text,[],ai);
    assert.match(result.text,/vẫn có thể tư vấn/);
    assert.ok(!result.suggestedActions?.includes('open_planner'));
  }
  assert.equal(calls,3);
});
test('summary retains old explicit details beyond recent eight messages and latest destination wins', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async request => {
    assert.equal(request.messages.length,9);
    const current = request.messages.at(-1)!.content;
    assert.match(current,/"destination":"[^"]*Đà Lạt[^"]*"/);
    assert.match(current,/"guests":3/);
    assert.match(current,/"groupBudgetVND":10000000/);
    assert.match(current,/"plannerReady":true/);
    return final({intent:'trip_planning',answer:'Lịch trình Đà Lạt theo thông tin mới nhất.'});
  };
  const history = [{sender:'user',text:'Đà Nẵng 3 ngày 3 người ngân sách 10 triệu'},...Array.from({length:12},()=>({sender:'ai',text:'Thông tin tham khảo.'}))];
  const result = await answerWithVerifiedPlaces('Đổi sang Đà Lạt',history,ai);
  assert.deepEqual(result.suggestedActions,['open_planner']);
});
test('catalog tools verify real map and food IDs while invented IDs are discarded', async () => {
  const ai = new DeepSeekClient('test-key');
  let id = '';
  ai.generateToolChat = async request => {
    const data = await request.tools.find(tool=>tool.name==='search_place_catalog')!.execute({city:'Hà Nội',query:'quán ăn Hà Nội',category:'food'}) as any;
    assert.ok(data.places.length);
    id = data.places[0].id;
    return final({answer:'Mình gợi ý quán có trong catalog.',intent:'food',placeIds:[id,'invented-id'],suggestedActions:['open_map','open_food','delete_data']});
  };
  const result = await answerWithVerifiedPlaces('Ăn gì ở Hà Nội?',[],ai);
  assert.deepEqual(result.verifiedActions,['open_map','open_food']);
  assert.deepEqual(result.suggestedActions,['open_map','open_food']);
  assert.match(result.actionContextText || '',new RegExp(id));
  assert.doesNotMatch(result.actionContextText || '',/invented-id/);
  assert.doesNotMatch(result.text,/ID:/);
});
test('missing tools or unavailable IDs do not discard a valid answer or invent action targets', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async () => final({answer:'Tư vấn Đà Lạt.',intent:'places',placeIds:['supabase-not-in-map'],suggestedActions:['open_map','open_food']});
  const result = await answerWithVerifiedPlaces('Đà Lạt',[],ai);
  assert.equal(result.text,'Tư vấn Đà Lạt.');
  assert.deepEqual(result.suggestedActions,[]);
  assert.deepEqual(result.verifiedActions,[]);
});
test('model-classified unrelated questions never inherit the old planner', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async () => final({suggestedActions:['open_planner']});
  const result = await answerWithVerifiedPlaces('Cảm ơn',[{sender:'user',text:'Hà Nội 3 ngày 2 người ngân sách 2 triệu'}],ai);
  assert.deepEqual(result.suggestedActions,[]);
});
test('provider errors and missing keys remain explicit without fake catalog fallback', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateToolChat = async () => {throw new Error('DeepSeek API (401): test');};
  const failed = await answerWithVerifiedPlaces('Mùa này đi đâu?',[],ai);
  assert.match(failed.text,/API key/);
  assert.equal(failed.actionsUnavailable,true);
  const missing = await answerWithVerifiedPlaces('Mùa này đi đâu?',[],null);
  assert.match(missing.text,/Chưa kết nối/);
});
