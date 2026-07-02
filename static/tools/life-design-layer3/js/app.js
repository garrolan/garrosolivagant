const STORE_KEY = 'meaningfulLifeToolkit.v1';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function loadData(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || initialData(); }
  catch(e){ return initialData(); }
}
function saveData(data){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function initialData(){ return {wonder:[], values:[], flow:[], community:[], lastUpdated:null}; }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function todayString(){ return new Date().toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'}); }
function setActiveNav(){
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });
}
function toast(msg){
  let t = $('#toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(61,58,50,.9);color:white;padding:11px 16px;border-radius:999px;z-index:99;box-shadow:0 12px 30px rgba(0,0,0,.18);opacity:0;transition:.2s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> t.style.opacity='0', 1800);
}

function initIndex(){
  const recommend = $('#recommendPath');
  if(!recommend) return;
  $$('.need-btn').forEach(btn => btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const names = {wonder:'Wonder｜重新看見', coherence:'Coherence｜重新對齊', flow:'Flow｜重新投入', community:'Community｜重新連結'};
    const links = {wonder:'wonder.html', coherence:'coherence.html', flow:'flow.html', community:'community.html'};
    recommend.innerHTML = `<div class="notice"><strong>今天可以從 ${names[target]} 開始。</strong><br>不用一次做完整套，選一個入口，留下一個小紀錄就很好。</div><div class="actions"><a class="btn" href="${links[target]}">前往練習</a></div>`;
  }));
}

function initWonder(){
  const input = $('#wonderPhoto');
  const zone = $('#uploadZone');
  const canvas = $('#wonderCanvas');
  if(!input || !canvas) return;
  const ctx = canvas.getContext('2d');
  let imageData = null;
  let selectedFeeling = '';
  let selectedTemplate = 'mist';

  function drawCard(){
    const w=1080, h=1350;
    canvas.width=w; canvas.height=h;
    const text = ($('#wonderText')?.value || '').trim() || '這一刻很普通，但我想把它留下來。';
    const place = ($('#wonderPlace')?.value || '').trim();
    const date = todayString();
    ctx.clearRect(0,0,w,h);
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'#F7F3EA'); bg.addColorStop(.55,'#EFF4EA'); bg.addColorStop(1,'#DDE9E4');
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);

    const img = new Image();
    img.onload = () => {
      ctx.save();
      if(selectedTemplate==='full'){
        coverImage(ctx,img,0,0,w,h);
        ctx.fillStyle='rgba(44,50,39,.28)'; ctx.fillRect(0,0,w,h);
        roundedRect(ctx,86,830,908,330,44); ctx.fillStyle='rgba(255,253,247,.72)'; ctx.fill();
        writeCardText(ctx,{x:132,y:905,width:816,text,feeling:selectedFeeling,place,date,dark:true});
      }else if(selectedTemplate==='journal'){
        roundedRect(ctx,76,76,928,700,52); ctx.clip(); coverImage(ctx,img,76,76,928,700); ctx.restore();
        ctx.save(); roundedRect(ctx,86,815,908,405,48); ctx.fillStyle='rgba(255,253,247,.88)'; ctx.fill();
        writeCardText(ctx,{x:132,y:900,width:816,text,feeling:selectedFeeling,place,date,dark:true});
        ctx.restore();
      }else{
        ctx.save(); roundedRect(ctx,92,92,896,900,58); ctx.clip(); coverImage(ctx,img,92,92,896,900); ctx.restore();
        ctx.fillStyle='rgba(255,253,247,.84)'; roundedRect(ctx,132,840,816,310,44); ctx.fill();
        writeCardText(ctx,{x:172,y:918,width:736,text,feeling:selectedFeeling,place,date,dark:true});
      }
      ctx.fillStyle='rgba(79,111,82,.88)'; ctx.font='28px "Noto Sans TC", sans-serif'; ctx.textAlign='center';
      ctx.fillText('Wonder｜今日重新看見的片刻', w/2, 1270);
    };
    if(imageData) img.src=imageData; else drawPlaceholder(ctx,w,h,text,selectedFeeling,place,date,selectedTemplate);
  }

  function drawPlaceholder(ctx,w,h,text,feeling,place,date,template){
    ctx.fillStyle='#F7F3EA'; ctx.fillRect(0,0,w,h);
    for(let i=0;i<14;i++){
      ctx.beginPath();
      ctx.fillStyle = i%2 ? 'rgba(156,175,136,.18)' : 'rgba(217,182,111,.16)';
      const x=120+Math.random()*820, y=120+Math.random()*920, r=45+Math.random()*110;
      ctx.ellipse(x,y,r,r*.45,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='rgba(255,253,247,.78)'; roundedRect(ctx,132,760,816,360,48); ctx.fill();
    writeCardText(ctx,{x:172,y:840,width:736,text,feeling,place,date,dark:true});
    ctx.fillStyle='rgba(79,111,82,.88)'; ctx.font='28px "Noto Sans TC", sans-serif'; ctx.textAlign='center';
    ctx.fillText('Wonder｜今日重新看見的片刻', w/2, 1270);
  }

  function writeCardText(ctx,{x,y,width,text,feeling,place,date,dark}){
    ctx.fillStyle = dark ? '#3D3A32' : '#fff';
    ctx.textAlign='left';
    ctx.font='34px "Noto Sans TC", sans-serif';
    if(feeling){
      ctx.fillStyle='rgba(79,111,82,.9)';
      ctx.fillText(`# ${feeling}`, x, y-54);
    }
    ctx.fillStyle = dark ? '#3D3A32' : '#fff';
    ctx.font='48px "Noto Serif TC", "Noto Sans TC", serif';
    wrapText(ctx, text, x, y, width, 68, 4);
    ctx.font='26px "Noto Sans TC", sans-serif';
    ctx.fillStyle='rgba(61,58,50,.68)';
    ctx.fillText([place,date].filter(Boolean).join(' · '), x, y+250);
  }

  zone.addEventListener('click', ()=> input.click());
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      imageData = ev.target.result;
      zone.classList.add('has-image');
      zone.innerHTML = `<img src="${imageData}" alt="上傳的照片">`;
      drawCard();
    };
    reader.readAsDataURL(file);
  });
  $$('.feeling-chip').forEach(chip => chip.addEventListener('click',()=>{
    $$('.feeling-chip').forEach(c=>c.classList.remove('selected'));
    chip.classList.add('selected'); selectedFeeling=chip.dataset.value; drawCard();
  }));
  $$('.template-option').forEach(opt => opt.addEventListener('click',()=>{
    $$('.template-option').forEach(o=>o.classList.remove('selected'));
    opt.classList.add('selected'); selectedTemplate=opt.dataset.template; drawCard();
  }));
  ['wonderText','wonderPlace'].forEach(id => $('#'+id)?.addEventListener('input', drawCard));
  $('#saveWonder')?.addEventListener('click',()=>{
    const data=loadData();
    data.wonder.unshift({id:uid(),date:todayString(),image:imageData,text:($('#wonderText')?.value||'').trim(),feeling:selectedFeeling,place:($('#wonderPlace')?.value||'').trim(),card:canvas.toDataURL('image/png')});
    data.lastUpdated=new Date().toISOString(); saveData(data); toast('已收藏到意義地圖');
  });
  $('#downloadWonder')?.addEventListener('click',()=> downloadDataURL(canvas.toDataURL('image/png'),`wonder-${Date.now()}.png`));
  $('#copyWonder')?.addEventListener('click', async()=>{
    const text = `Wonder｜${todayString()}\n${selectedFeeling?`#${selectedFeeling}\n`:''}${($('#wonderText')?.value||'').trim()}`;
    await navigator.clipboard.writeText(text); toast('文字已複製');
  });
  drawCard();
}
function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function coverImage(ctx,img,x,y,w,h){const s=Math.max(w/img.width,h/img.height);const nw=img.width*s,nh=img.height*s;ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh)}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){const chars=[...text];let line='',lines=[];chars.forEach(ch=>{const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test});if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));}
function downloadDataURL(dataURL, filename){const a=document.createElement('a');a.href=dataURL;a.download=filename;a.click();}

function initCoherence(){
  const valuesRoot = $('#valuesRoot');
  if(!valuesRoot) return;
  const data = loadData();
  const defaultValues = ['自由','餘裕','安全','健康','創作','學習','成長','關係','安靜','探索','貢獻','美感','穩定','誠實','獨立','愛','自然','金錢安全','專業','被看見','身體感','精神自主','內在成就感'];
  if(!data.values.length){ data.values=[]; }
  function renderChips(){
    const garden = $('#valueGarden'); garden.innerHTML='';
    defaultValues.forEach(v=>{
      const chip=document.createElement('button');chip.type='button';chip.className='chip water';chip.textContent=v;
      if(data.values.find(item=>item.name===v)) chip.classList.add('selected');
      chip.addEventListener('click',()=>toggleValue(v));garden.appendChild(chip);
    });
  }
  function toggleValue(name){
    const idx=data.values.findIndex(v=>v.name===name);
    if(idx>=0) data.values.splice(idx,1); else data.values.push({id:uid(),name,definition:'',importance:4,living:3,evidence:'',gap:''});
    saveData(data); render();
  }
  function renderSelected(){
    const box=$('#selectedValueBox'); box.innerHTML='';
    if(!data.values.length){ box.innerHTML='<span class="empty">請先選擇 3～5 個價值種子。</span>'; return; }
    data.values.forEach(v=>{
      const tag=document.createElement('span');tag.className='tag';tag.textContent=v.name;box.appendChild(tag);
    });
  }
  function renderValueItems(){
    const root=$('#valueItems'); root.innerHTML='';
    data.values.forEach((v,idx)=>{
      const el=document.createElement('div');el.className='value-item';
      el.innerHTML=`
        <div class="value-item-header"><div class="value-name">${idx+1}. ${v.name}</div><button class="btn ghost small" data-remove="${v.id}">移除</button></div>
        <div class="field"><label>對我來說，「${v.name}」是：</label><input type="text" data-def="${v.id}" value="${escapeHtml(v.definition||'')}" placeholder="用一句自己的話定義它"></div>
        <div class="slider-line"><label>我有多重視它？</label><input type="range" min="1" max="5" value="${v.importance||3}" data-importance="${v.id}"><span class="score-pill">${v.importance||3}</span></div>
        <div class="slider-line"><label>最近有多活出它？</label><input type="range" min="1" max="5" value="${v.living||3}" data-living="${v.id}"><span class="score-pill">${v.living||3}</span></div>
        <div class="grid two">
          <div class="field"><label>最近哪一刻有活出它？</label><input type="text" data-evidence="${v.id}" value="${escapeHtml(v.evidence||'')}" placeholder="可留空"></div>
          <div class="field"><label>哪裡和它有落差？</label><input type="text" data-gap="${v.id}" value="${escapeHtml(v.gap||'')}" placeholder="可留空"></div>
        </div>`;
      root.appendChild(el);
    });
  }
  function bind(){
    $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const i=data.values.findIndex(v=>v.id===b.dataset.remove);if(i>=0)data.values.splice(i,1);saveData(data);render();}));
    $$('[data-def]').forEach(inp=>inp.addEventListener('input',()=>{findVal(inp.dataset.def).definition=inp.value;saveData(data)}));
    $$('[data-evidence]').forEach(inp=>inp.addEventListener('input',()=>{findVal(inp.dataset.evidence).evidence=inp.value;saveData(data);renderResults(false)}));
    $$('[data-gap]').forEach(inp=>inp.addEventListener('input',()=>{findVal(inp.dataset.gap).gap=inp.value;saveData(data);renderResults(false)}));
    $$('[data-importance]').forEach(sl=>sl.addEventListener('input',()=>{findVal(sl.dataset.importance).importance=Number(sl.value);saveData(data);renderResults();sl.nextElementSibling.textContent=sl.value}));
    $$('[data-living]').forEach(sl=>sl.addEventListener('input',()=>{findVal(sl.dataset.living).living=Number(sl.value);saveData(data);renderResults();sl.nextElementSibling.textContent=sl.value}));
  }
  function findVal(id){return data.values.find(v=>v.id===id)}
  function renderResults(scroll=false){
    const box=$('#coherenceResult');
    if(!data.values.length){box.innerHTML='<span class="empty">選擇價值後，這裡會出現你的對齊摘要。</span>';return;}
    const highHigh=data.values.filter(v=>(v.importance||0)>=4&&(v.living||0)>=4).map(v=>v.name);
    const highLow=data.values.filter(v=>(v.importance||0)>=4&&(v.living||0)<=3).sort((a,b)=>(b.importance-b.living)-(a.importance-a.living)).map(v=>v.name);
    const lowHigh=data.values.filter(v=>(v.importance||0)<=3&&(v.living||0)>=4).map(v=>v.name);
    box.innerHTML=`
      <div class="result-box"><strong>正在對齊：</strong>${highHigh.length?highHigh.join('、'):'暫時還不明顯。'}<br><span class="help">這些價值最近有被生活接住，值得保留。</span></div>
      <div class="result-box"><strong>需要照顧：</strong>${highLow.length?highLow.join('、'):'目前沒有明顯落差。'}<br><span class="help">這不是失敗，而是提醒：重要的東西需要更多空間。</span></div>
      <div class="result-box"><strong>可能被外界佔用：</strong>${lowHigh.length?lowHigh.join('、'):'暫時沒有。'}<br><span class="help">如果某件事不重要卻佔很多生活，也許可以重新調整。</span></div>`;
    if(scroll) box.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function render(){renderChips();renderSelected();renderValueItems();bind();renderResults();}
  $('#addCustomValue')?.addEventListener('click',()=>{
    const name=($('#customValue')?.value||'').trim(); if(!name) return;
    if(!data.values.find(v=>v.name===name)) data.values.push({id:uid(),name,definition:'',importance:4,living:3,evidence:'',gap:''});
    $('#customValue').value=''; saveData(data); render();
  });
  $('#saveValues')?.addEventListener('click',()=>{data.lastUpdated=new Date().toISOString();saveData(data);toast('價值與一致性已保存');renderResults(true);});
  render();
}
function escapeHtml(str){return String(str).replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}

function initFlow(){
  const root=$('#flowRoot'); if(!root) return;
  let selectedActivity='', selectedAttention='', timer=null, seconds=180;
  $$('.activity-choice').forEach(c=>c.addEventListener('click',()=>{ $$('.activity-choice').forEach(x=>x.classList.remove('selected')); c.classList.add('selected'); selectedActivity=c.dataset.value; $('#customActivityWrap').style.display= selectedActivity==='自訂'?'block':'none'; }));
  $$('.attention-choice').forEach(c=>c.addEventListener('click',()=>{ $$('.attention-choice').forEach(x=>x.classList.remove('selected')); c.classList.add('selected'); selectedAttention=c.dataset.value; }));
  $('#startTimer')?.addEventListener('click',()=>{seconds=180; updateTimer(); clearInterval(timer); timer=setInterval(()=>{seconds--; updateTimer(); if(seconds<=0){clearInterval(timer);toast('三分鐘到了，回來寫一句你注意到的事。')}},1000);});
  $('#pauseTimer')?.addEventListener('click',()=>{clearInterval(timer)});
  $('#resetTimer')?.addEventListener('click',()=>{clearInterval(timer);seconds=180;updateTimer();});
  function updateTimer(){const m=String(Math.floor(seconds/60)).padStart(2,'0'),s=String(seconds%60).padStart(2,'0');$('#timerDisplay').textContent=`${m}:${s}`;}
  $('#saveFlow')?.addEventListener('click',()=>{
    const data=loadData();
    const activity = selectedActivity==='自訂' ? ($('#customActivity')?.value||'').trim() : selectedActivity;
    if(!activity){toast('先選一件小事');return;}
    data.flow.unshift({id:uid(),date:todayString(),activity,attention:selectedAttention,note:($('#flowNote')?.value||'').trim(),level:$('#flowLevel')?.value||'一點點有感'});
    data.lastUpdated=new Date().toISOString(); saveData(data); renderFlowRecord(); toast('Flow 小記錄已保存');
  });
  function renderFlowRecord(){
    const data=loadData(); const box=$('#flowRecords');
    if(!data.flow.length){box.innerHTML='<span class="empty">尚未留下 Flow 紀錄。</span>';return;}
    box.innerHTML=data.flow.slice(0,4).map(r=>`<div class="result-box"><strong>${escapeHtml(r.activity)}</strong>｜${escapeHtml(r.attention||'未選注意力入口')}<br>${escapeHtml(r.note||'沒有文字紀錄')}<br><span class="help">${r.date} · ${escapeHtml(r.level||'')}</span></div>`).join('');
  }
  updateTimer(); renderFlowRecord();
}

function initCommunity(){
  const root=$('#communityRoot'); if(!root) return;
  function render(){
    const data=loadData(); const garden=$('#connectionGarden');
    if(!data.community.length){garden.innerHTML='<span class="empty">你的連結花園還是空的。先新增一個讓你更靠近自己的連結。</span>';return;}
    garden.innerHTML=data.community.map(c=>{
      const cls=c.kind==='合作型'?'coop':(c.kind==='形成型'?'formative':'');
      return `<div class="plant ${cls}"><b>${escapeHtml(c.name)}</b><span>${escapeHtml(c.kind)} · ${escapeHtml(c.type)}</span><span>${escapeHtml(c.gift)}</span></div>`;
    }).join('');
  }
  $('#addConnection')?.addEventListener('click',()=>{
    const name=($('#connectionName')?.value||'').trim(); if(!name){toast('先寫下連結名稱');return;}
    const data=loadData();
    data.community.unshift({id:uid(),date:todayString(),name,type:$('#connectionType').value,kind:$('#connectionKind').value,gift:$('#connectionGift').value,keep:($('#connectionKeep')?.value||'').trim()});
    data.lastUpdated=new Date().toISOString(); saveData(data);
    ['connectionName','connectionKeep'].forEach(id=>$('#'+id).value=''); render(); toast('已種進連結花園');
  });
  $('#clearConnections')?.addEventListener('click',()=>{ if(confirm('確定要清空連結花園嗎？')){const data=loadData();data.community=[];saveData(data);render();} });
  render();
}

function initMeaningMap(){
  const root=$('#meaningMapRoot'); if(!root) return;
  const data=loadData();
  const latestWonder=data.wonder[0];
  $('#wonderSummary').innerHTML = latestWonder ? `<img src="${latestWonder.card||latestWonder.image}" alt="Wonder 小卡" style="border-radius:18px;margin-bottom:10px"><p>${escapeHtml(latestWonder.text||'留下了一個片刻。')}</p>` : '<span class="empty">還沒有 Wonder 小卡。</span>';
  const highLow=data.values.filter(v=>(v.importance||0)>=4&&(v.living||0)<=3).sort((a,b)=>(b.importance-b.living)-(a.importance-a.living));
  const highHigh=data.values.filter(v=>(v.importance||0)>=4&&(v.living||0)>=4);
  $('#coherenceSummary').innerHTML = data.values.length ? `<p><strong>需要照顧：</strong>${highLow.length?highLow.map(v=>v.name).join('、'):'目前沒有明顯落差。'}</p><p><strong>正在對齊：</strong>${highHigh.length?highHigh.map(v=>v.name).join('、'):'可再觀察。'}</p>` : '<span class="empty">尚未完成 Coherence 練習。</span>';
  $('#flowSummary').innerHTML = data.flow.length ? data.flow.slice(0,2).map(r=>`<p><strong>${escapeHtml(r.activity)}</strong><br>${escapeHtml(r.note||r.attention||'')}</p>`).join('') : '<span class="empty">尚未留下 Flow 紀錄。</span>';
  const formative=data.community.filter(c=>c.kind==='形成型');
  $('#communitySummary').innerHTML = data.community.length ? `<p><strong>形成型連結：</strong>${formative.length?formative.map(c=>c.name).join('、'):'尚未標記。'}</p><p>總共 ${data.community.length} 個連結。</p>` : '<span class="empty">尚未建立連結花園。</span>';
  $('#generateMeaningText')?.addEventListener('click',()=>{
    const text = `最近讓我感到有意義的，不是某個巨大的答案，而是 ${($('#meaningWonder')?.value||'＿＿＿')}。\n我發現自己在 ${($('#meaningFlow')?.value||'＿＿＿')} 時，比較靠近自己。\n接下來，我想為 ${($('#meaningValue')?.value||'＿＿＿')} 留下一點空間。`;
    $('#meaningTextResult').value=text;
  });
  $('#copyMeaningText')?.addEventListener('click',async()=>{await navigator.clipboard.writeText($('#meaningTextResult').value||'');toast('已複製整合文字');});
  $('#exportJson')?.addEventListener('click',()=>{downloadDataURL('data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2)),`meaning-map-${Date.now()}.json`)});
  $('#clearAllData')?.addEventListener('click',()=>{if(confirm('確定清空本網站儲存在此瀏覽器中的全部資料嗎？')){localStorage.removeItem(STORE_KEY);location.reload();}});
}

document.addEventListener('DOMContentLoaded',()=>{setActiveNav();initIndex();initWonder();initCoherence();initFlow();initCommunity();initMeaningMap();});
