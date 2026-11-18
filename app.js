(function(){
  'use strict';
  var K = {prog:'atima-prog', bm:'atima-bm', last:'atima-last', theme:'atima-theme', fs:'atima-fs2'};
  function get(k, d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
  function set(k, v){try{localStorage.setItem(k, JSON.stringify(v));}catch(e){}}
  function del(k){try{localStorage.removeItem(k);}catch(e){}}
  var page = document.body.dataset.page;
  var $ = function(s){return document.querySelector(s);};
  var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};

  function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove();},1800);}

  /* menu */
  var mb=$('#menuBtn');
  function closeNav(){document.body.classList.remove('nav-open');mb&&mb.setAttribute('aria-expanded','false');}
  mb&&mb.addEventListener('click',function(){var o=document.body.classList.toggle('nav-open');mb.setAttribute('aria-expanded',o);});
  $('#scrim').addEventListener('click',closeNav);
  var on=$('.side .on'); if(on) on.scrollIntoView({block:'center'});

  /* panels */
  function closePanels(){$$('.panel').forEach(function(p){p.hidden=true;});}
  function toggle(id){var p=$(id),h=p.hidden;closePanels();p.hidden=!h;if(!p.hidden&&id==='#bmPanel')renderBm();}
  $('#bmOpen').addEventListener('click',function(){toggle('#bmPanel');});
  $('#setBtn').addEventListener('click',function(){toggle('#setPanel');});
  $$('[data-close]').forEach(function(b){b.addEventListener('click',closePanels);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closePanels();closeNav();}});

  /* settings */
  $$('[data-fs]').forEach(function(b){b.addEventListener('click',function(){
    var cur=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs'))||18;
    var n=Math.max(14,Math.min(28,cur+parseInt(b.dataset.fs,10)));
    document.documentElement.style.setProperty('--fs',n+'px');set(K.fs,n);});});
  function isDark(){var t=document.documentElement.dataset.theme;if(t==='dark')return true;if(t==='light'||t==='sepia')return false;return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;}
  function setTheme(t){document.documentElement.dataset.theme=t;try{sessionStorage.setItem(K.theme,t);}catch(e){}paintTheme();}
  function paintTheme(){var d=isDark(),b=$('#themeBtn');if(!b)return;b.textContent=d?'☀':'☾';b.setAttribute('aria-label',d?'Passer en mode clair':'Passer en mode sombre');
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#141816':'#1f4b43');}
  $('#themeBtn').addEventListener('click',function(){setTheme(isDark()?'light':'dark');toast(isDark()?'Mode sombre':'Mode clair');});
  if(window.matchMedia)try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',paintTheme);}catch(e){}
  paintTheme();
  $$('[data-th]').forEach(function(b){b.addEventListener('click',function(){setTheme(b.dataset.th);});});
  var pending=null, msgs={prog:'Effacer toute la progression de lecture ?',bm:'Supprimer tous les marque-pages ?',all:'Tout réinitialiser (progression, marque-pages et réglages) ?'};
  $$('[data-reset]').forEach(function(b){b.addEventListener('click',function(){pending=b.dataset.reset;$('#confirmTxt').textContent=msgs[pending];$('#confirm').hidden=false;});});
  $('#confirmNo').addEventListener('click',function(){$('#confirm').hidden=true;pending=null;});
  $('#confirmYes').addEventListener('click',function(){
    if(pending==='prog'||pending==='all'){del(K.prog);del(K.last);}
    if(pending==='bm'||pending==='all'){del(K.bm);}
    if(pending==='all'){try{sessionStorage.removeItem(K.theme);}catch(e){}del(K.fs);document.documentElement.dataset.theme='auto';document.documentElement.style.removeProperty('--fs');paintTheme();}
    $('#confirm').hidden=true;pending=null;markNav();renderBm();toast('Réinitialisation effectuée');});

  /* reading progress */
  function markNav(){
    var pr=get(K.prog,{});
    $$('[data-f]').forEach(function(a){var v=pr[a.dataset.f]||0;a.classList.toggle('done',v>=0.97);a.classList.toggle('started',v>0.02&&v<0.97);
      var st=a.querySelector('.st');if(st)st.setAttribute('data-p',Math.round(v*100)+' %');});
    var last=get(K.last,null),cta=$('#cta');
    if(cta&&last){cta.href=last.f+'#reprise';cta.textContent='Reprendre la lecture';}
  }
  markNav();
  var heads=$$('main .mk');
  function currentHead(){var y=window.scrollY+90,c=null;for(var i=0;i<heads.length;i++){if(heads[i].offsetTop<=y)c=heads[i];else break;}return c;}
  var ticking=false;
  var userScrolled=false;
  function onScroll(){
    var h=document.documentElement.scrollHeight-window.innerHeight;var r=h>0?Math.min(1,window.scrollY/h):1;
    $('#progBar').style.width=(r*100)+'%';
    if(page==='index.html')return;
    var pr=get(K.prog,{});if(!pr[page]||r>pr[page]){pr[page]=r;set(K.prog,pr);}
    if(!userScrolled)return;
    var c=currentHead();set(K.last,{f:page,id:c?c.id:'',t:c?c.textContent.replace('🔖',''):'',y:window.scrollY,d:Date.now()});
  }
  ['wheel','touchmove','keydown','mousedown'].forEach(function(ev){window.addEventListener(ev,function(){userScrolled=true;},{passive:true});});
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;onScroll();});}},{passive:true});
  // ouvrir un chapitre depuis un titre = toujours au début ; la reprise se fait via les boutons « Reprendre »
  try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(e){}
  function goStart(){if(location.hash==='#reprise'){var l=get(K.last,null);if(l&&l.f===page){window.scrollTo(0,l.y);toast('Lecture reprise');}else window.scrollTo(0,0);try{history.replaceState(null,'',location.pathname);}catch(e){}return;}
    if(!location.hash)window.scrollTo(0,0);else{var t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView();}}
  goStart();window.addEventListener('pageshow',function(e){if(e.persisted)goStart();});
  onScroll();

  /* bookmarks */
  function bms(){return get(K.bm,[]);}
  function addBm(id,title){
    var b=bms();if(b.some(function(x){return x.f===page&&x.id===id;})){toast('Déjà dans vos marque-pages');return;}
    var sec=(document.title.split(' — ')[0]);
    b.unshift({f:page,id:id,t:title,s:sec,d:Date.now()});set(K.bm,b);toast('Marque-page ajouté');paintBm();
  }
  function paintBm(){var b=bms();$$('.bmk').forEach(function(x){x.classList.toggle('has',b.some(function(m){return m.f===page&&m.id===x.dataset.id;}));});}
  heads.forEach(function(h){var b=document.createElement('button');b.className='bmk';b.type='button';b.textContent='🔖';b.dataset.id=h.id;b.title='Ajouter un marque-page ici';b.setAttribute('aria-label','Marquer cette section');
    b.addEventListener('click',function(){addBm(h.id,h.textContent.replace('🔖','').trim());});h.appendChild(b);});
  paintBm();
  $('#bmAdd').addEventListener('click',function(){
    if(page==='index.html'){toggle('#bmPanel');return;}
    var c=currentHead();addBm(c?c.id:'',c?c.textContent.replace('🔖','').trim():document.title.split(' — ')[0]);});
  function renderBm(){
    var ul=$('#bmList'),b=bms(),l=get(K.last,null);ul.innerHTML='';
    $('#resume').innerHTML=l?'<a href="'+l.f+'#reprise">▶ Reprendre : '+esc(l.t||l.f)+'</a>':'';
    if(!b.length){ul.innerHTML='<li class="empty">Aucun marque-page pour l’instant. Touchez 🔖 pour marquer le passage en cours.</li>';return;}
    b.forEach(function(m,i){var li=document.createElement('li');
      li.innerHTML='<a href="'+m.f+(m.id?'#'+m.id:'')+'">'+esc(m.t)+'<small>'+esc(m.s)+' · '+new Date(m.d).toLocaleDateString('fr-FR')+'</small></a><button aria-label="Supprimer">✕</button>';
      li.querySelector('button').addEventListener('click',function(){var a=bms();a.splice(i,1);set(K.bm,a);renderBm();paintBm();});ul.appendChild(li);});
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* close nav on link click (mobile) */
  $$('.side a').forEach(function(a){a.addEventListener('click',closeNav);});

  /* offline */
  if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){var hadCtl=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadCtl&&!reloaded){reloaded=true;location.reload();}});navigator.serviceWorker.register('sw.js').catch(function(){});}
})();
