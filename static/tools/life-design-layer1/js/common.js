const STORAGE_KEY = 'garro_life_design_layer1_v2';
const LEGACY_KEY = 'garro_life_design_layer1_v1';
function loadState(){
  try{
    const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(v2) return v2;
    const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY));
    return v1 || {};
  }catch(e){return {}}
}
function setState(next){localStorage.setItem(STORAGE_KEY, JSON.stringify(next))}
function updateState(patch){const s=loadState(); const n={...s,...patch}; setState(n); return n}
function escapeHtml(str=''){
  return String(str).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));
}
function $(sel, root=document){return root.querySelector(sel)}
function $$(sel, root=document){return [...root.querySelectorAll(sel)]}
function setActiveNav(){const page = location.pathname.split('/').pop() || 'index.html'; $$('[data-nav]').forEach(a=>{ if(a.getAttribute('href')===page) a.classList.add('active') })}
function toast(msg){let el=document.createElement('div'); el.textContent=msg; el.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#2c3a4f;color:#fff;padding:10px 16px;border-radius:999px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.2);font-size:14px'; document.body.appendChild(el); setTimeout(()=>el.remove(),1800)}
function renderStars(container, value=3, onChange){container.innerHTML=''; container.classList.add('star-rating'); for(let i=1;i<=5;i++){const span=document.createElement('span'); span.className='star'+(i<=value?' active':''); span.textContent='★'; span.title=String(i); span.addEventListener('click',()=>{value=i; renderStars(container,value,onChange); onChange && onChange(value)}); container.appendChild(span)}}
function selectedValues(name){return $$(`[data-group="${name}"].selected`).map(x=>x.dataset.value || x.textContent.trim())}
function setupChips(root=document){
  $$('[data-group]', root).forEach(chip=>{
    chip.addEventListener('click',()=>{
      const group=chip.dataset.group;
      const single=chip.dataset.single==='true';
      const max=Number(chip.dataset.max || 0);
      if(single){$$(`[data-group="${group}"]`, root).forEach(c=>c.classList.remove('selected')); chip.classList.add('selected'); return}
      if(!chip.classList.contains('selected') && max && $$(`[data-group="${group}"].selected`, root).length>=max){toast(`最多選 ${max} 個`); return}
      chip.classList.toggle('selected');
    })
  })
}
function saveCustomList(key, value){if(!value) return; const s=loadState(); const list=new Set(s[key] || []); list.add(value.trim()); updateState({[key]: [...list]})}
function removeCustomListItem(key,value){const s=loadState(); updateState({[key]:(s[key]||[]).filter(x=>x!==value)})}
function quadrantOf(engagement, energy){const highE=Number(energy)>=4; const highG=Number(engagement)>=4; if(highG&&highE)return 'flow'; if(highG&&!highE)return 'burn'; if(!highG&&highE)return 'restore'; return 'drain'}
const quadrantMeta={flow:{name:'心流區',desc:'高投入 × 高能量：值得保留、擴大或重新安排優先順序。'},burn:{name:'燃燒區',desc:'高投入 × 低能量：有價值但消耗，需要邊界、節奏與恢復。'},restore:{name:'恢復區',desc:'低投入 × 高能量：不一定有成果，但能補電，值得被保護。'},drain:{name:'消耗區',desc:'低投入 × 低能量：優先檢查能否減少、替代或重新設計。'}};
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function copyText(text){navigator.clipboard?.writeText(text).then(()=>toast('已複製'))}
document.addEventListener('DOMContentLoaded', setActiveNav);
