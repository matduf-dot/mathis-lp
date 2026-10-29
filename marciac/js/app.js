(function(){
  var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var L=['fr','en','es'], cur='fr';
  function tr(k){var v=(window.I18N||{})[k];return v?v[L.indexOf(cur)]:null}
  /* textes sans clé : dictionnaire I18N_TXT indexé sur le français, heures 18h30 converties */
  var TX=window.I18N_TXT||{}, relang=[], H=/\b(\d{1,2})h(\d{2})?\b/g;
  function key(s){return s.replace(/\s+/g," ").trim()}
  function hour(s){
    if(cur==="fr")return s;
    return s.replace(H,function(m,h,mn){h=+h;mn=mn||"00";
      if(cur==="es")return h+":"+mn;
      return (h%12||12)+(mn==="00"?"":":"+mn)+(h<12?" am":" pm")});
  }
  function has(s){var k=key(s);H.lastIndex=0;var r=!!TX[k]||H.test(k);H.lastIndex=0;return r}
  function tt(s){if(cur==="fr"||s==null)return s;var k=key(s),v=TX[k];return hour(v?s.replace(s.trim(),v[L.indexOf(cur)-1]):s)}
  var WEEK={fr:["L","M","M","J","V","S","D"],en:["M","T","W","T","F","S","S"],es:["L","M","X","J","V","S","D"]};
  var MONTH={fr:"novembre",en:"November",es:"noviembre"};
  function dayLabel(d){return cur==="en"?MONTH.en+" "+d:cur==="es"?d+" de "+MONTH.es:d+" "+MONTH.fr}
  function relangAll(){
    var w=document.createTreeWalker(document.body,4),n;
    while(n=w.nextNode()){var pe=n.parentElement;if(!pe||pe.closest("script,style,[data-i18n]"))continue;
      if(n.__fr==null){if(!has(n.nodeValue))continue;n.__fr=n.nodeValue}
      n.nodeValue=tt(n.__fr)}
    $$("[alt],[aria-label],[title],[placeholder]").forEach(function(el){
      ["alt","aria-label","title","placeholder"].forEach(function(a){
        if(!el.hasAttribute(a)||(a==="placeholder"&&el.hasAttribute("data-i18n-ph")))return;
        el.__fra=el.__fra||{};if(el.__fra[a]==null){var v=el.getAttribute(a);if(!has(v)&&!/^\d+ novembre$/.test(key(v)))return;el.__fra[a]=v}
        var o=el.__fra[a],m=/^(\d+) novembre$/.exec(key(o));el.setAttribute(a,m?dayLabel(m[1]):tt(o))})});
    if(document.__frt==null)document.__frt=document.title;document.title=tt(document.__frt);
    $$("table thead tr").forEach(function(r){var th=$$("th",r);if(th.length===7)th.forEach(function(c,i){c.textContent=WEEK[cur][i]})});
  }

  /* ---------- langue ---------- */
  function setLang(l){
    cur=l;document.documentElement.lang=l;
    $$('[data-i18n]').forEach(function(el){var v=tr(el.getAttribute('data-i18n'));if(v)el.textContent=v});
    $$('[data-i18n-ph]').forEach(function(el){var v=tr(el.getAttribute('data-i18n-ph'));if(v)el.placeholder=v});
    $$('[data-lang]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-lang')===l)});
    relangAll();relang.forEach(function(f){f()});
    try{localStorage.setItem('aug-lang',l)}catch(e){}
  }
  $$('[data-lang]').forEach(function(b){b.addEventListener('click',function(){setLang(b.getAttribute('data-lang'))})});

  /* ---------- menu mobile ---------- */
  var bg=$('[data-burger]'), nav=$('#nav');
  if(bg)bg.addEventListener('click',function(){var on=nav.classList.toggle('on');bg.setAttribute('aria-expanded',on)});

  /* ---------- recherche ---------- */
  var S=$('#search'), inp=S&&$('input',S), res=S&&$('.res',S);
  function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  function render(v){
    var n=norm(v||''), out=(window.IDX||[]).filter(function(x){return !n||norm(x.t+' '+x.s+' '+x.ty+' '+tt(x.t)+' '+tt(x.s)+' '+tt(x.ty)).indexOf(n)>-1}).slice(0,8);
    res.innerHTML=out.map(function(x){return '<a role="listitem" href="'+x.h+'"><span class="ty">'+tt(x.ty)+'</span><span><b>'+tt(x.t)+'</b><br><small style="color:#6E5F63">'+tt(x.s)+'</small></span></a>'}).join('')||'<p style="padding:14px;color:#6E5F63">'+tt('Aucun résultat.')+'</p>';
  }
  function openS(){S.classList.add('on');render('');setTimeout(function(){inp.focus()},30)}
  function closeS(){S.classList.remove('on')}
  $$('[data-search]').forEach(function(b){b.addEventListener('click',openS)});
  if(S){
    $('[data-close]',S).addEventListener('click',closeS);
    S.addEventListener('click',function(e){if(e.target===S)closeS()});
    inp.addEventListener('input',function(){render(inp.value)});
    $$('[data-q]',S).forEach(function(c){c.addEventListener('click',function(){inp.value=tt(c.getAttribute('data-q'));render(inp.value)})});
  }
  var hs=$('[data-hero-search]');
  if(hs)hs.addEventListener('submit',function(e){e.preventDefault();var v=$('input',hs).value;openS();inp.value=v;render(v)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeS();if(e.key==='/'&&S&&!S.classList.contains('on')&&document.activeElement.tagName!=='INPUT'){e.preventDefault();openS()}});

  /* ---------- univers ---------- */
  var tabs=$$('[data-u]');
  function showU(i){
    tabs.forEach(function(b,j){b.setAttribute('aria-selected',i===j)});
    $$('[data-ui]').forEach(function(el){el.classList.toggle('on',+el.getAttribute('data-ui')===i)});
    var u=(window.UNI||[])[i];if(!u)return;
    var t=$('[data-cap-t]'),d=$('[data-cap-d]');
    t.setAttribute('data-i18n','u.'+u.k+'.t');d.setAttribute('data-i18n','u.'+u.k+'.d');
    t.textContent=tr('u.'+u.k+'.t');d.textContent=tr('u.'+u.k+'.d');
    $('[data-cap-tags]').innerHTML=u.tags.map(function(x){return '<span class="tag">'+tt(x)+'</span>'}).join('');
  }
  tabs.forEach(function(b,i){['mouseenter','focus','click'].forEach(function(ev){b.addEventListener(ev,function(){showU(i)})})});
  if(tabs.length&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var auto=0,timer=setInterval(function(){auto=(auto+1)%tabs.length;showU(auto)},4200);
    tabs.forEach(function(b){b.addEventListener('mouseenter',function(){clearInterval(timer)})});
  }

  /* ---------- apparition ---------- */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    $$('.rv').forEach(function(el,i){el.style.transitionDelay=(i%4)*80+'ms';io.observe(el)});
  }else $$('.rv').forEach(function(el){el.classList.add('in')});

  /* ---------- agenda ---------- */
  var list=$('#list');
  if(list){
    var fc='all', fp='', fd='';
    function apply(){
      var n=0;
      $$('.ev',list).forEach(function(e){
        var ok=(fc==='all'||e.getAttribute('data-cat')===fc)&&(!fp||e.getAttribute('data-pub').indexOf(fp)>-1)&&(!fd||e.getAttribute('data-d')===fd);
        e.style.display=ok?'':'none';if(ok)n++;
      });
      $$('.day',list).forEach(function(d){d.style.display=$$('.ev',d).some(function(e){return e.style.display!=='none'})?'':'none'});
      $('.empty').style.display=n?'none':'block';
      var dn=fd?+fd.slice(-2):0;
      $('[data-count]').textContent=cur==='en'?n+(n>1?' events':' event')+(fd?' on '+dayLabel(dn):' coming up')
        :cur==='es'?n+(n>1?' citas':' cita')+(fd?' el '+dayLabel(dn):(n>1?' próximas':' próxima'))
        :n+' rendez-vous'+(fd?' le '+dn+' novembre':' à venir');
    }
    relang.push(apply);
    $$('[data-f]').forEach(function(c){c.addEventListener('click',function(){fc=c.getAttribute('data-f');$$('[data-f]').forEach(function(x){x.setAttribute('aria-pressed',x===c)});apply()})});
    var dd=$('[data-dd]');
    if(dd){
      var btn=$('.dd-btn',dd), opts=$$('[role=option]',dd), ai=0;
      function openDD(o){dd.classList.toggle('on',o);btn.setAttribute('aria-expanded',o);if(o){ai=Math.max(0,opts.findIndex(function(x){return x.getAttribute('aria-selected')==='true'}));hl()}}
      function hl(){opts.forEach(function(x,i){x.classList.toggle('act',i===ai)})}
      function pick(i){opts.forEach(function(x,j){x.setAttribute('aria-selected',i===j)});$('[data-dd-label]',dd).textContent=opts[i].textContent;fp=opts[i].getAttribute('data-v');openDD(false);btn.focus();apply()}
      btn.addEventListener('click',function(){openDD(!dd.classList.contains('on'))});
      opts.forEach(function(o,i){o.addEventListener('click',function(){pick(i)})});
      btn.addEventListener('keydown',function(e){
        var on=dd.classList.contains('on');
        if(e.key==='ArrowDown'){e.preventDefault();if(!on)openDD(true);else{ai=Math.min(opts.length-1,ai+1);hl()}}
        else if(e.key==='ArrowUp'){e.preventDefault();if(on){ai=Math.max(0,ai-1);hl()}}
        else if((e.key==='Enter'||e.key===' ')&&on){e.preventDefault();pick(ai)}
        else if(e.key==='Escape'){openDD(false)}
      });
      document.addEventListener('click',function(e){if(!dd.contains(e.target))openDD(false)});
    }
    $$('[data-date]').forEach(function(b){b.addEventListener('click',function(){var d=b.getAttribute('data-date');fd=(fd===d)?'':d;$$('[data-date]').forEach(function(x){x.classList.toggle('sel',x.getAttribute('data-date')===fd)});apply()})});
    var pc=new URLSearchParams(location.search).get('cat'), pcb=pc&&$('[data-f="'+pc+'"]');
    if(pcb)pcb.click();else apply();
  }

  /* ---------- copier le lien ---------- */
  $$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(location.href)}catch(e){}b.style.background='#E3A84B'})});

  /* ---------- carrousels mobiles ---------- */
  $$('.m-nav').forEach(function(nav){
    var st=$(nav.getAttribute('data-for'));if(!st)return;
    var cards=[].filter.call(st.children,function(c){return c.nodeType===1});
    var dots=$$('.m-dots i',nav),btns=$$('.m-btn',nav);
    function gap(){return cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:cards[0].offsetWidth}
    function idx(){return Math.round(st.scrollLeft/gap())}
    function maj(){var i=Math.min(cards.length-1,idx());dots.forEach(function(d,k){d.classList.toggle('on',k===i)});
      btns[0].disabled=st.scrollLeft<=4;btns[1].disabled=st.scrollLeft+st.clientWidth>=st.scrollWidth-4}
    btns.forEach(function(b){b.addEventListener('click',function(){var i=Math.max(0,Math.min(cards.length-1,idx()+ +b.getAttribute('data-dir')));st.scrollTo({left:i*gap(),behavior:'smooth'})})});
    st.addEventListener('scroll',function(){requestAnimationFrame(maj)},{passive:true});
    addEventListener('resize',maj);maj();
  });

  /* ---------- calendrier repliable (mobile) ---------- */
  var ct=$('.cal-toggle'),cb=$('#calbox');
  if(ct&&cb){ct.addEventListener('click',function(){var on=cb.classList.toggle('open');ct.setAttribute('aria-expanded',on);if(on)cb.scrollIntoView({behavior:'smooth',block:'nearest'})})}
  $$('[data-date]').forEach(function(b){b.addEventListener('click',function(){
    var l=$('[data-cal-label]');if(!l)return;
    var sel=$('[data-date].sel');l.textContent=sel?dayLabel(+sel.getAttribute('data-date').slice(-2)):(tr('ag.date')||'Choisir une date');
    if(sel&&cb&&window.innerWidth<=900){cb.classList.remove('open');ct.setAttribute('aria-expanded',false)}
  })});

  /* ---------- barre de progression des pastilles ---------- */
  (function(){var hc=document.getElementById('hchips'),hb=document.querySelector('.hbar i');if(!hc||!hb)return;
    function up(){var max=hc.scrollWidth-hc.clientWidth,w=Math.max(18,Math.min(100,hc.clientWidth/hc.scrollWidth*100));hb.style.width=w+'%';hb.style.left=(max>0?hc.scrollLeft/max*(100-w):0)+'%';hb.parentNode.style.visibility=max>2?'visible':'hidden'}
    hc.addEventListener('scroll',function(){requestAnimationFrame(up)},{passive:true});addEventListener('resize',up);up()})();
  /* ---------- langue au chargement (après la mise en place de l'agenda) ---------- */
  var q=new URLSearchParams(location.search).get('lang'), saved=null;
  try{saved=localStorage.getItem('aug-lang')}catch(e){}
  if(q&&L.indexOf(q)>-1)setLang(q);else if(saved&&saved!=='fr')setLang(saved);
  window.augSetLang=setLang;
})();
