const STORE_KEY = 'garro.lifeDesignLayer2.v2';
const OLD_STORE_KEY = 'garro.lifeDesignLayer2.v1';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const defaultOdysseys = () => [
  {
    kind:'Odyssey A',
    label:'目前人生延伸版',
    guide:'如果你大致維持目前的身份、工作、生活條件與資源，接下來五年可以怎麼自然演化？這不是保守版本，而是把「現在這條路」設計得更好。',
    name:'', description:'', years:['','','','',''], scene:'', resources:[], fears:[], excitement:[], scales:{like:3, coherence:3, feasible:3, energy:3}
  },
  {
    kind:'Odyssey B',
    label:'替代路線版',
    guide:'如果目前這條路不能走、不想走，或你需要暫時離開原本軌道，還有哪一種可行人生？重點不是逃跑，而是看見自己不只一種活法。',
    name:'', description:'', years:['','','','',''], scene:'', resources:[], fears:[], excitement:[], scales:{like:3, coherence:3, feasible:3, energy:3}
  },
  {
    kind:'Odyssey C',
    label:'自由想像版',
    guide:'如果暫時不把金錢、他人眼光、身份期待放在第一順位，你真正想嘗試的是什麼？它可以大膽，但仍要能讓你看見某種真實渴望。',
    name:'', description:'', years:['','','','',''], scene:'', resources:[], fears:[], excitement:[], scales:{like:3, coherence:3, feasible:3, energy:3}
  }
];

const defaultData = () => ({
  map: { centerTopic:'', nodes: [], links: [], directions: ['', '', ''] },
  odysseys: defaultOdysseys(),
  prototypes: [],
  conversations: [],
  review: { scores:{}, selectedId:'', selectedType:'', experiment:'', duration:'', learn:'' },
  updatedAt: new Date().toISOString()
});

function mergeDefaults(base, data){
  if(Array.isArray(base)) return Array.isArray(data) ? data : base;
  if(base && typeof base === 'object'){
    const out = {...base};
    Object.keys(data || {}).forEach(k => {
      out[k] = base[k] === undefined ? data[k] : mergeDefaults(base[k], data[k]);
    });
    return out;
  }
  return data === undefined ? base : data;
}
function normalizeData(data){
  data = mergeDefaults(defaultData(), data || {});
  // 舊版曾經有 seeds；第二版刪除種子頁，但保留資料不顯示，避免舊資料造成錯誤。
  data.odysseys = data.odysseys.map((o, i) => ({...defaultOdysseys()[i], ...o, scales:{...defaultOdysseys()[i].scales, ...(o.scales || {})}}));
  data.map = {...defaultData().map, ...(data.map || {})};
  return data;
}
function loadData(){
  try{
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(OLD_STORE_KEY);
    return normalizeData(raw ? JSON.parse(raw) : defaultData());
  }catch(e){
    console.warn('load failed', e);
    return defaultData();
  }
}
function saveData(data){
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
function toast(msg){
  let el = $('#toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999;background:#f19a45;color:#160c07;padding:10px 16px;border-radius:999px;font-weight:900;box-shadow:0 12px 30px rgba(0,0,0,.35);opacity:0;transition:.2s';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(()=> el.style.opacity = '0', 1700);
}
function escapeHtml(str=''){
  return String(str).replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
}
function setActiveNav(){
  const page = document.body.dataset.page || 'index';
  $$('.nav a').forEach(a => { if(a.dataset.page === page) a.classList.add('active'); });
}
function chipGroup(root, items, selected, onChange){
  if(!root) return;
  root.innerHTML = items.map(x => `<button type="button" class="chip clickable ${selected.includes(x) ? 'selected':''}" data-value="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('');
  $$('.chip', root).forEach(chip => chip.addEventListener('click', () => {
    const value = chip.dataset.value;
    const next = selected.includes(value) ? selected.filter(x => x !== value) : [...selected, value];
    onChange(next);
  }));
}
function renderTagPicker(root, defaults, selected, onChange, placeholder='自訂標籤'){
  if(!root) return;
  const all = [...new Set([...defaults, ...(selected || [])])];
  root.innerHTML = `<div class="chips tag-choice"></div><div class="input-row custom-tag-row"><input class="input" data-custom-tag placeholder="${escapeHtml(placeholder)}"><button class="btn small ghost" data-add-tag type="button">加入</button></div>`;
  chipGroup($('.chips', root), all, selected || [], onChange);
  const add = () => {
    const input = $('[data-custom-tag]', root);
    const value = input.value.trim();
    if(!value) return;
    if(!(selected || []).includes(value)) onChange([...(selected || []), value]);
    input.value = '';
  };
  $('[data-add-tag]', root).addEventListener('click', add);
  $('[data-custom-tag]', root).addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); add(); }});
}
function bindText(el, obj, key, data){
  el.value = obj[key] || '';
  el.addEventListener('input', () => { obj[key] = el.value; saveData(data); });
}
function bindScale(el, obj, key, label, data){
  el.value = obj[key] || 3;
  label.textContent = el.value;
  el.addEventListener('input', () => { obj[key] = Number(el.value); label.textContent = el.value; saveData(data); });
}
function copyText(text){
  navigator.clipboard?.writeText(text).then(()=>toast('已複製')).catch(()=>{
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('已複製');
  });
}
function getCandidateSources(data){
  const center = data.map.centerTopic ? [{ id:'map-center', text:data.map.centerTopic, detail:'思維圖中心主題', type:'思維圖' }] : [];
  const dirs = (data.map.directions || []).filter(Boolean).map((d,i) => ({ id:`direction-${i}`, text:d, detail:'來自思維圖方向', type:'思維圖' }));
  const odys = data.odysseys.map((o,i) => ({ id:`odyssey-${i}`, text:o.name || o.label, detail:o.description || o.scene || '', type:'奧德賽' }));
  return [...center, ...dirs, ...odys].filter(x => x.text && x.text.trim());
}

function initIndex(){
  const data = loadData();
  const box = $('#statusBox');
  if(box){
    const directionCount = (data.map.directions || []).filter(Boolean).length;
    box.innerHTML = `
      <div class="grid three">
        <div class="panel"><strong>${data.map.nodes.length}</strong><br><span class="muted">思維圖卡片</span></div>
        <div class="panel"><strong>${directionCount}</strong><br><span class="muted">可能方向</span></div>
        <div class="panel"><strong>${data.prototypes.length + data.conversations.length}</strong><br><span class="muted">原型測試／訪談</span></div>
      </div>`;
  }
}

function initMindMap(){
  const data = loadData();
  const stage = $('#mapStage'); const svg = $('#linkSvg');
  let linkStart = null; let dragging = null; let pointerOffset = {x:0,y:0};

  function setCenterTopic(text){
    text = (text || '').trim();
    if(!text) return;
    data.map.centerTopic = text;
    let core = data.map.nodes.find(n => n.core);
    if(core){ core.text = text; core.type = '中心主題'; }
    else{
      const rect = stage.getBoundingClientRect();
      data.map.nodes.push({id:uid(), text, type:'中心主題', x: Math.max(40, rect.width/2 - 90), y: Math.max(40, rect.height/2 - 50), core:true});
    }
    saveData(data); renderMap(); toast('已設定中心主題');
  }
  function addNode(text, type='聯想卡', core=false){
    if(!text.trim()) return;
    const rect = stage.getBoundingClientRect();
    data.map.nodes.push({ id:uid(), text:text.trim(), type, x: Math.max(30, Math.min(rect.width-210, 80 + Math.random()*520)), y: Math.max(30, Math.min(rect.height-120, 80 + Math.random()*360)), core });
    saveData(data); renderMap();
  }
  function renderMap(){
    $$('.map-node', stage).forEach(n=>n.remove());
    data.map.nodes.forEach(node => {
      const el = document.createElement('div');
      el.className = 'map-node' + (node.core ? ' core':'') + (linkStart === node.id ? ' connecting':'');
      el.style.left = `${node.x}px`; el.style.top = `${node.y}px`; el.dataset.id = node.id;
      el.innerHTML = `<div class="node-text">${escapeHtml(node.text)}</div><div class="node-tools"><button data-act="link">連結</button><button data-act="copy">複製</button><button data-act="del">刪除</button></div>`;
      el.addEventListener('pointerdown', e => {
        if(e.target.tagName === 'BUTTON') return;
        dragging = node.id; const r = el.getBoundingClientRect(); pointerOffset = {x:e.clientX-r.left,y:e.clientY-r.top}; el.setPointerCapture(e.pointerId);
      });
      $('.node-tools', el).addEventListener('click', e => {
        const act = e.target.dataset.act; if(!act) return;
        e.stopPropagation();
        if(act === 'link'){
          if(!linkStart){ linkStart = node.id; toast('已設為連線起點，再點另一張卡的「連結」'); }
          else if(linkStart !== node.id){
            const exists = data.map.links.some(l => (l.from===linkStart && l.to===node.id)||(l.from===node.id&&l.to===linkStart));
            if(!exists) data.map.links.push({id:uid(), from:linkStart, to:node.id, label:''});
            linkStart = null; saveData(data);
          }else linkStart = null;
          renderMap();
        }
        if(act === 'copy'){ addNode(node.text, node.type, false); }
        if(act === 'del'){
          if(node.core) data.map.centerTopic = '';
          data.map.nodes = data.map.nodes.filter(n => n.id !== node.id);
          data.map.links = data.map.links.filter(l => l.from !== node.id && l.to !== node.id);
          saveData(data); renderMap();
        }
      });
      stage.appendChild(el);
    });
    renderLinks();
  }
  function renderLinks(){
    svg.innerHTML = '';
    const nodeMap = Object.fromEntries(data.map.nodes.map(n => [n.id,n]));
    data.map.links.forEach(link => {
      const a = nodeMap[link.from], b = nodeMap[link.to]; if(!a || !b) return;
      const x1 = a.x + 89, y1 = a.y + 41, x2 = b.x + 89, y2 = b.y + 41;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',x1); line.setAttribute('y1',y1); line.setAttribute('x2',x2); line.setAttribute('y2',y2);
      svg.appendChild(line);
    });
  }
  stage?.addEventListener('pointermove', e => {
    if(!dragging) return;
    const rect = stage.getBoundingClientRect();
    const node = data.map.nodes.find(n => n.id === dragging); if(!node) return;
    node.x = Math.max(0, Math.min(rect.width-180, e.clientX - rect.left - pointerOffset.x));
    node.y = Math.max(0, Math.min(rect.height-90, e.clientY - rect.top - pointerOffset.y));
    const el = $(`.map-node[data-id="${dragging}"]`, stage);
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
    renderLinks();
  });
  stage?.addEventListener('pointerup', () => { if(dragging){ dragging = null; saveData(data); } });

  $('#centerTopic').value = data.map.centerTopic || '';
  $('#setCenterBtn')?.addEventListener('click', () => setCenterTopic($('#centerTopic').value));
  $('#centerTopic')?.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); $('#setCenterBtn').click(); }});
  $$('#topicExamples .chip').forEach(chip => chip.addEventListener('click', () => { $('#centerTopic').value = chip.textContent.trim(); setCenterTopic(chip.textContent.trim()); }));
  $('#addNodeBtn')?.addEventListener('click', () => { addNode($('#nodeText').value); $('#nodeText').value=''; });
  $('#nodeText')?.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); $('#addNodeBtn').click(); }});
  $('#clearMapBtn')?.addEventListener('click', () => { if(confirm('清空思維圖卡片與連線？')){ data.map.centerTopic=''; data.map.nodes=[]; data.map.links=[]; saveData(data); $('#centerTopic').value=''; renderMap(); }});
  $$('[data-direction]').forEach((ta,i) => {
    ta.value = data.map.directions[i] || '';
    ta.addEventListener('input', () => { data.map.directions[i] = ta.value; saveData(data); });
  });
  renderMap();
}

function initOdyssey(){
  const data = loadData();
  const wrap = $('#odysseyWrap');
  const resourceChips = ['時間','金錢','技能','健康','空間','人脈','家人支持','工具','作品集','穩定收入'];
  const fearChips = ['太花錢','太孤單','太累','不穩定','做不出成果','別人不理解','影響健康','失去餘裕'];
  const exciteChips = ['更自由','更有創造力','更安靜','更多旅行','更像自己','能幫助他人','有學習感','身體更舒服'];
  function render(){
    wrap.innerHTML = data.odysseys.map((o,i) => `
      <article class="card odyssey-card" data-i="${i}">
        <div class="odyssey-head">
          <div class="odyssey-title"><div class="number-medal">${String.fromCharCode(65+i)}</div><div><div class="tool-no">${escapeHtml(o.kind)}</div><h2>${escapeHtml(o.label)}</h2></div></div>
          <span class="chip">五年可能人生</span>
        </div>
        <p class="notice odyssey-guide">${escapeHtml(o.guide)}</p>
        <div class="form-grid">
          <div class="field"><label>替這個人生版本取名</label><input class="input" data-field="name" placeholder="例如：穩定教師＋自由創作版"></div>
          <div class="field"><label>一句話描述</label><input class="input" data-field="description" placeholder="這是一種怎樣的生活？它想保留什麼、改變什麼？"></div>
        </div>
        <div class="field"><label>五年時間軸：每年 1～2 個重要畫面</label><div class="timeline">${[0,1,2,3,4].map(y=>`<textarea class="textarea mini" data-year="${y}" placeholder="Year ${y+1}\n我在哪裡？正在累積什麼？"></textarea>`).join('')}</div></div>
        <div class="field"><label>一個日常畫面：我在哪裡？做什麼？身體感如何？</label><textarea class="textarea" data-field="scene" placeholder="不用宏大，寫一個普通日子裡最能代表這種人生的畫面。"></textarea></div>
        <div class="form-grid">
          <div class="field"><label>需要資源</label><div data-tag-picker="resources"></div></div>
          <div class="field"><label>我害怕什麼</label><div data-tag-picker="fears"></div></div>
        </div>
        <div class="field"><label>我興奮什麼</label><div data-tag-picker="excitement"></div></div>
        <div class="panel">
          <h3>四個感覺儀表</h3>
          ${[['like','喜歡程度'],['coherence','一致性'],['feasible','可行性'],['energy','能量感']].map(([k,l])=>`<div class="scale-row"><span>${l}</span><input type="range" min="1" max="5" data-scale="${k}"><strong data-scale-label="${k}">3</strong></div>`).join('')}
        </div>
      </article>`).join('');
    $$('.odyssey-card', wrap).forEach(card => {
      const i = Number(card.dataset.i); const o = data.odysseys[i];
      $$('[data-field]', card).forEach(el => bindText(el, o, el.dataset.field, data));
      $$('[data-year]', card).forEach(el => { const y=Number(el.dataset.year); el.value=o.years[y]||''; el.addEventListener('input',()=>{o.years[y]=el.value; saveData(data);}); });
      renderTagPicker($('[data-tag-picker="resources"]', card), resourceChips, o.resources || [], next=>{o.resources=next; saveData(data); render();}, '自訂資源');
      renderTagPicker($('[data-tag-picker="fears"]', card), fearChips, o.fears || [], next=>{o.fears=next; saveData(data); render();}, '自訂擔心');
      renderTagPicker($('[data-tag-picker="excitement"]', card), exciteChips, o.excitement || [], next=>{o.excitement=next; saveData(data); render();}, '自訂興奮點');
      $$('[data-scale]', card).forEach(el => bindScale(el, o.scales, el.dataset.scale, $(`[data-scale-label="${el.dataset.scale}"]`, card), data));
    });
  }
  render();
}

function initPrototype(){
  const data = loadData();
  const directionChips = ['創作者生活','半退休節奏','旅居實驗','教學設計','地方散步書寫','工具網頁開發'];
  const actionChips = ['做一篇文章','拍一支短影片','安排一次半日體驗','上一堂課','做一個小作品','試行一週生活節奏','閱讀三個案例','拜訪一個地方','開一個小頁面','整理一份清單'];
  const timeChips = ['30 分鐘','2 小時','半天','一天','一週','一個月'];
  const moneyChips = ['0 元','低成本','需要小額付費','需要預算規劃'];
  const riskChips = ['低','中','高'];
  let draft = { direction:'', assumption:'', action:'', timeCost:'', moneyCost:'', energyRisk:'', observe:'', learn:'', recovery:'' };
  function setInput(id, value){ const el = $('#'+id); if(el) el.value = value || ''; }
  function renderChips(){
    chipGroup($('#directionChips'), directionChips, draft.direction?[draft.direction]:[], next=>{draft.direction=next.at(-1)||''; setInput('prototypeDirection', draft.direction); renderChips();});
    chipGroup($('#actionChips'), actionChips, draft.action?[draft.action]:[], next=>{draft.action=next.at(-1)||''; setInput('prototypeAction', draft.action); renderChips();});
    chipGroup($('#timeChips'), timeChips, draft.timeCost?[draft.timeCost]:[], next=>{draft.timeCost=next.at(-1)||''; setInput('prototypeTime', draft.timeCost); renderChips();});
    chipGroup($('#moneyChips'), moneyChips, draft.moneyCost?[draft.moneyCost]:[], next=>{draft.moneyCost=next.at(-1)||''; setInput('prototypeMoney', draft.moneyCost); renderChips();});
    chipGroup($('#riskChips'), riskChips, draft.energyRisk?[draft.energyRisk]:[], next=>{draft.energyRisk=next.at(-1)||''; setInput('prototypeRisk', draft.energyRisk); renderChips();});
  }
  function syncDraft(){
    draft.direction = $('#prototypeDirection').value.trim();
    draft.assumption = $('#prototypeAssumption').value.trim();
    draft.action = $('#prototypeAction').value.trim();
    draft.timeCost = $('#prototypeTime').value.trim();
    draft.moneyCost = $('#prototypeMoney').value.trim();
    draft.energyRisk = $('#prototypeRisk').value.trim();
    draft.observe = $('#prototypeObserve').value.trim();
    draft.learn = $('#prototypeLearn').value.trim();
    draft.recovery = $('#prototypeRecovery').value.trim();
  }
  function renderSaved(){
    const list = $('#prototypeList');
    if(!data.prototypes.length){ list.innerHTML = '<p class="muted">尚未建立原型測試卡。</p>'; return; }
    list.innerHTML = data.prototypes.map(p=>`
      <article class="saved-item">
        <h3>${escapeHtml(p.action || '未命名測試')}</h3>
        <div class="meta">測試方向：${escapeHtml(p.direction || p.sourceText || '未指定')}｜時間：${escapeHtml(p.timeCost || '未填')}｜成本：${escapeHtml(p.moneyCost || '未填')}｜能量風險：${escapeHtml(p.energyRisk || '未填')}</div>
        <p><strong>假設：</strong>${escapeHtml(p.assumption || '—')}</p>
        <p><strong>觀察：</strong>${escapeHtml(p.observe || '—')}</p>
        <p><strong>恢復設計：</strong>${escapeHtml(p.recovery || '—')}</p>
        <div class="item-actions"><button class="btn small ghost" data-del="${p.id}">刪除</button></div>
      </article>`).join('');
    $$('[data-del]', list).forEach(btn=>btn.addEventListener('click',()=>{ data.prototypes=data.prototypes.filter(p=>p.id!==btn.dataset.del); saveData(data); renderSaved(); }));
  }
  ['prototypeDirection','prototypeAction','prototypeTime','prototypeMoney','prototypeRisk'].forEach(id => $(`#${id}`)?.addEventListener('input',()=>{syncDraft(); renderChips();}));
  $('#savePrototypeBtn')?.addEventListener('click',()=>{
    syncDraft();
    if(!draft.direction && !draft.action && !draft.assumption){ toast('至少填一個方向、測試行動或假設'); return; }
    data.prototypes.push({...draft, id:uid(), createdAt:new Date().toISOString()}); saveData(data); toast('已儲存原型測試');
    ['prototypeDirection','prototypeAssumption','prototypeAction','prototypeTime','prototypeMoney','prototypeRisk','prototypeObserve','prototypeLearn','prototypeRecovery'].forEach(id=>setInput(id,''));
    draft={ direction:'', assumption:'', action:'', timeCost:'', moneyCost:'', energyRisk:'', observe:'', learn:'', recovery:'' }; renderChips(); renderSaved();
  });
  renderChips(); renderSaved();
}

function initConversation(){
  const data = loadData();
  const categories = {
    '日常型':'你普通一天怎麼過？哪些時刻讓你最有感？',
    '轉折型':'你怎麼走到現在這裡？中間最重要的轉折是什麼？',
    '代價型':'這種生活最辛苦、最容易被外人低估的代價是什麼？',
    '誤解型':'外人最容易誤會這條路的地方是什麼？',
    '建議型':'如果我想小規模試試，你建議我第一步做什麼？',
    '身體感型':'這樣生活後，你的精神、時間、身體有什麼變化？'
  };
  let selectedQs = [];
  function renderSource(){
    const sources = getCandidateSources(data);
    $('#conversationSource').innerHTML = '<option value="">選擇想訪談的可能人生，也可不選</option>' + sources.map(s=>`<option value="${s.id}">${escapeHtml(s.type)}｜${escapeHtml(s.text)}</option>`).join('');
  }
  function renderQuestions(){
    const bank = $('#questionBank');
    bank.innerHTML = Object.entries(categories).map(([k,q])=>`<button type="button" class="question-card ${selectedQs.includes(k)?'selected':''}" data-q="${k}"><h4>${k}</h4><p>${q}</p></button>`).join('');
    $$('[data-q]', bank).forEach(btn=>btn.addEventListener('click',()=>{
      const k = btn.dataset.q; selectedQs = selectedQs.includes(k) ? selectedQs.filter(x=>x!==k) : [...selectedQs,k]; renderQuestions(); renderSelectedQuestions();
    }));
  }
  function renderSelectedQuestions(){ $('#selectedQuestions').value = selectedQs.map(k=>`【${k}】${categories[k]}`).join('\n'); }
  function renderSaved(){
    const list = $('#conversationList');
    if(!data.conversations.length){ list.innerHTML = '<p class="muted">尚未建立原型訪談。</p>'; return; }
    list.innerHTML = data.conversations.map(c=>`
      <article class="saved-item">
        <h3>${escapeHtml(c.person || '未命名訪談對象')}</h3>
        <div class="meta">方向：${escapeHtml(c.sourceText || '未指定')}</div>
        <p><strong>想知道：</strong>${escapeHtml(c.want || '—')}</p>
        <p><strong>問題：</strong><br>${escapeHtml(c.questions || '—').replace(/\n/g,'<br>')}</p>
        <p><strong>訪談後：</strong>${escapeHtml(c.after || '—')}</p>
        <div class="item-actions"><button class="btn small ghost" data-del="${c.id}">刪除</button></div>
      </article>`).join('');
    $$('[data-del]', list).forEach(btn=>btn.addEventListener('click',()=>{ data.conversations=data.conversations.filter(c=>c.id!==btn.dataset.del); saveData(data); renderSaved(); }));
  }
  $('#inviteTemplateBtn')?.addEventListener('click',()=>{
    const sources = Object.fromEntries(getCandidateSources(data).map(s=>[s.id,s]));
    const source = sources[$('#conversationSource').value]?.text || '這種生活／工作型態';
    const person = $('#personName').value || '您';
    $('#inviteText').value = `您好，${person}。我最近在做一個人生設計練習，想了解「${source}」這種生活或工作型態。因為我注意到您有相關經驗，想請教您 20～30 分鐘。這不是求職，也不是要請您替我做決定，只是希望透過真實經驗校準自己的想像。若您方便，我會很感謝。`;
  });
  $('#saveConversationBtn')?.addEventListener('click',()=>{
    const sources = Object.fromEntries(getCandidateSources(data).map(s=>[s.id,s]));
    const sid = $('#conversationSource').value;
    const c = { id:uid(), sourceId:sid, sourceText:sources[sid]?.text || '', person:$('#personName').value.trim(), want:$('#conversationWant').value.trim(), questions:$('#selectedQuestions').value.trim(), invite:$('#inviteText').value.trim(), after:$('#conversationAfter').value.trim(), createdAt:new Date().toISOString() };
    if(!c.person && !c.want){ toast('至少填訪談對象或想知道的事'); return; }
    data.conversations.push(c); saveData(data); toast('已儲存原型訪談');
    ['personName','conversationWant','selectedQuestions','inviteText','conversationAfter'].forEach(id=>$('#'+id).value=''); $('#conversationSource').value=''; selectedQs=[]; renderQuestions(); renderSaved();
  });
  renderSource(); renderQuestions(); renderSaved();
}

function initReview(){
  const data = loadData();
  const dims = [['cheap','低成本'],['safe','低風險'],['learning','高學習'],['energy','高能量'],['coherence','高一致'],['space','高餘裕']];
  function candidates(){
    const ps = data.prototypes.map(p=>({id:p.id,type:'prototype',title:p.action || p.assumption || p.direction || '原型測試',detail:p.assumption || p.observe || p.direction || ''}));
    const cs = data.conversations.map(c=>({id:c.id,type:'conversation',title:`訪談：${c.person || c.sourceText || '未命名'}`,detail:c.want || c.questions || ''}));
    return [...ps,...cs];
  }
  function computeTotal(score){ return dims.reduce((sum,[k])=>sum + Number(score[k]||3),0); }
  function render(){
    const list = $('#scoreList'); const items = candidates();
    if(!items.length){ list.innerHTML = '<p class="muted">還沒有可比較的原型。請先建立原型測試或原型訪談。</p>'; return; }
    list.innerHTML = items.map(item => {
      const key = `${item.type}:${item.id}`; const score = data.review.scores[key] || Object.fromEntries(dims.map(([k])=>[k,3]));
      data.review.scores[key] = score;
      const total = computeTotal(score);
      return `<article class="score-card" data-key="${key}">
        <h3>${escapeHtml(item.title)}</h3><p class="muted">${escapeHtml(item.detail)}</p><div class="tag" data-total>總分 ${total}</div>
        ${dims.map(([k,l])=>`<div class="scale-row"><span>${l}</span><input type="range" min="1" max="5" data-dim="${k}" value="${score[k]||3}"><strong data-val="${k}">${score[k]||3}</strong></div>`).join('')}
        <button class="btn small primary" data-select="${key}">選為本月小實驗</button>
      </article>`;
    }).join('');
    saveData(data);
    $$('[data-dim]', list).forEach(slider=>slider.addEventListener('input',()=>{
      const card = slider.closest('[data-key]'); const key = card.dataset.key;
      data.review.scores[key] = data.review.scores[key] || {};
      data.review.scores[key][slider.dataset.dim] = Number(slider.value);
      $(`[data-val="${slider.dataset.dim}"]`, card).textContent = slider.value;
      $('[data-total]', card).textContent = `總分 ${computeTotal(data.review.scores[key])}`;
      saveData(data);
    }));
    $$('[data-select]', list).forEach(btn=>btn.addEventListener('click',()=>{
      const [type,id] = btn.dataset.select.split(':');
      const item = candidates().find(x=>x.type===type && x.id===id);
      data.review.selectedType=type; data.review.selectedId=id; data.review.experiment=item?.title || ''; saveData(data); fillSelected(); toast('已選為本月小實驗');
    }));
  }
  function fillSelected(){
    $('#selectedExperiment').value = data.review.experiment || '';
    $('#selectedDuration').value = data.review.duration || '';
    $('#selectedLearn').value = data.review.learn || '';
  }
  ['selectedExperiment','selectedDuration','selectedLearn'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{
    data.review.experiment = $('#selectedExperiment').value; data.review.duration=$('#selectedDuration').value; data.review.learn=$('#selectedLearn').value; saveData(data);
  }));
  render(); fillSelected();
}

function initSummary(){
  const data = loadData();
  function buildSummary(){
    const lines = [];
    lines.push('第二層｜Designing Your Life：發想與測試可能人生');
    lines.push('');
    lines.push('一、思維圖');
    lines.push(`中心主題：${data.map.centerTopic || '尚未設定'}`);
    const nodes = data.map.nodes.filter(n => !n.core).map(n => n.text);
    if(nodes.length) lines.push(`聯想卡：${nodes.join('、')}`);
    lines.push('');
    lines.push('二、思維圖整理出的可能方向');
    (data.map.directions || []).filter(Boolean).forEach((d,i)=>lines.push(`方向 ${String.fromCharCode(65+i)}：${d}`));
    if(!(data.map.directions||[]).some(Boolean)) lines.push('- 尚未整理方向');
    lines.push('');
    lines.push('三、奧德賽計畫');
    data.odysseys.forEach((o,i)=>{
      lines.push(`${String.fromCharCode(65+i)}. ${o.label}｜${o.name || '尚未命名'}`);
      if(o.description) lines.push(`   描述：${o.description}`);
      if(o.scene) lines.push(`   畫面：${o.scene}`);
      if(o.resources?.length) lines.push(`   資源：${o.resources.join('、')}`);
      if(o.excitement?.length) lines.push(`   興奮：${o.excitement.join('、')}`);
      if(o.fears?.length) lines.push(`   害怕：${o.fears.join('、')}`);
    });
    lines.push('');
    lines.push('四、原型測試');
    if(data.prototypes.length) data.prototypes.forEach(p=>{
      lines.push(`- ${p.action || '未命名行動'}｜方向：${p.direction || p.sourceText || '未填'}｜${p.timeCost || '未填時間'}｜${p.moneyCost || '未填成本'}｜風險：${p.energyRisk || '未填'}`);
      if(p.assumption) lines.push(`  假設：${p.assumption}`);
      if(p.observe) lines.push(`  觀察：${p.observe}`);
      if(p.recovery) lines.push(`  恢復設計：${p.recovery}`);
    }); else lines.push('- 尚未建立');
    lines.push('');
    lines.push('五、原型訪談');
    if(data.conversations.length) data.conversations.forEach(c=>{
      lines.push(`- ${c.person || '未命名對象'}｜方向：${c.sourceText || '未指定'}`);
      if(c.want) lines.push(`  想知道：${c.want}`);
      if(c.after) lines.push(`  訪談後：${c.after}`);
    }); else lines.push('- 尚未建立');
    lines.push('');
    lines.push('六、本月小實驗');
    lines.push(`我選擇先測試：${data.review.experiment || '尚未選擇'}`);
    if(data.review.duration) lines.push(`時間：${data.review.duration}`);
    if(data.review.learn) lines.push(`我想知道：${data.review.learn}`);
    return lines.join('\n');
  }
  function render(){ $('#summaryText').textContent = buildSummary(); }
  $('#copySummaryBtn')?.addEventListener('click',()=>copyText(buildSummary()));
  $('#printBtn')?.addEventListener('click',()=>window.print());
  $('#exportJsonBtn')?.addEventListener('click',()=>{
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'life-design-layer2.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  $('#clearBtn')?.addEventListener('click',()=>{ if(confirm('確定清除第二層本機資料？')){ localStorage.removeItem(STORE_KEY); localStorage.removeItem(OLD_STORE_KEY); location.reload(); }});
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  const page = document.body.dataset.page;
  if(page === 'index') initIndex();
  if(page === 'mind-map') initMindMap();
  if(page === 'odyssey') initOdyssey();
  if(page === 'prototype') initPrototype();
  if(page === 'conversation') initConversation();
  if(page === 'review') initReview();
  if(page === 'summary') initSummary();
});
