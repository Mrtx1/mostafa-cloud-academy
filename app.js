/* ============================================================================
   Mostafa Cloud Academy v6.0.0 - app.js
   Learning-platform redesign: sidebar course navigation + lesson workspace.
   Content consumed unchanged from data.js (window.MCA_DATA); state schema
   preserved (mca_v5_state) so existing progress/notes carry over untouched.
   ========================================================================== */
(function () {
'use strict';

var UNITS = window.MCA_DATA.UNITS_DATA;
var FREE_TOOLS = window.MCA_DATA.FREE_TOOLS_DIRECTORY;
var TIPS = window.MCA_DATA.MCA_MASCOT_TIPS;
var STORAGE_KEY = 'mca_v5_state';
var APP_VERSION = '6.0.0';

/* ---------- inline SVG icon set (no emoji reliance) ---------- */
var IC = {
  home:'<svg class="icon" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  book:'<svg class="icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  cal:'<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  chart:'<svg class="icon" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  gift:'<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8s-1.5-5-4.5-5S5 8 12 8zm0 0s1.5-5 4.5-5S19 8 12 8z"/></svg>',
  doc:'<svg class="icon" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h7M9 17h7"/></svg>',
  play:'<svg class="icon lg" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>',
  check:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>',
  clock:'<svg class="icon sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  flame:'<svg class="icon" viewBox="0 0 24 24"><path d="M12 22c4 0 7-2.8 7-6.5 0-3-2-5.5-3.5-7C14 7 13 5.5 13 3c-3 2-4.5 4.5-4.5 7 0 0-2-1-2.5-3C4.6 9 5 11 5 13.5 5 19.2 8 22 12 22z"/></svg>',
  note:'<svg class="icon" viewBox="0 0 24 24"><path d="M4 20l1.2-4.8L16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2z"/><path d="M14.5 5.9l3 3"/></svg>',
  flask:'<svg class="icon" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.5 14h9"/></svg>',
  sun:'<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg class="icon" viewBox="0 0 24 24"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
  search:'<svg class="icon sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  menu:'<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  chev:'<svg class="icon sm chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  ext:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4 11 13M18 13v7H5V6h7"/></svg>',
  video:'<svg class="icon sm" viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
  tool:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0-5.6 5.6L3 18l3 3 5.9-5.9a4 4 0 0 0 5.6-5.6l-2.8 2.8-2.1-2.1z"/></svg>',
  cap:'<svg class="icon sm" viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/></svg>',
  monitor:'<svg class="icon sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8m-4-4v4"/></svg>',
  globe:'<svg class="icon sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>',
  laptop:'<svg class="icon sm" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/></svg>',
  target:'<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  map:'<svg class="icon" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  next:'<svg class="icon sm" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  plus:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  dl:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/></svg>',
  ul:'<svg class="icon sm" viewBox="0 0 24 24"><path d="M12 21V9m0 0 4 4m-4-4-4 4M4 3h16"/></svg>',
  copy:'<svg class="icon sm" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  back:'<svg class="icon" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>'
};
function ic(n, cls){ return '<span class="ic">'+(IC[n]||'')+'</span>'; }

/* ---------- state (schema preserved from v5) ---------- */
function getDefaultState(){
  return { theme:'dark', unitStatus:{}, completedResources:{}, unitNotes:{}, streakDays:0, lastStudyDate:null, studyHistory:[] };
}
var appState = getDefaultState();
function loadState(){
  try{ var raw = localStorage.getItem(STORAGE_KEY); if(raw) appState = Object.assign(getDefaultState(), JSON.parse(raw)); }
  catch(e){ console.warn('state load failed', e); }
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); }
  catch(e){ console.warn('state save failed', e); }
}
function getTodayISO(){ var n=new Date(); return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'); }
function getUnitStatus(id){ return appState.unitStatus[id]||'not_started'; }
function isResDone(id){ return !!appState.completedResources[id]; }

/* ---------- labs dataset (content unchanged; Packet Tracer = desktop simulator) ---------- */
  var LABS_BY_UNIT = {
          1: [{n: 'Cisco Packet Tracer - مسارات NetAcad المجانية', u: 'https://www.netacad.com/catalogs/learn/cisco-packet-tracer', type: 'desktop', req: 'account', task: 'نزّل المحاكي وثبّته، ثم ابنِ شبكة من راوتر وجهازين وشغّل ping بينهما', note: 'برنامج تدريب يُثبَّت على الجهاز وليس معمل متصفح؛ حساب NetAcad مجاني؛ مثبّت لينكس موجّه لأوبونتو (على فيدورا خطوات إضافية)'}],
          2: [{n: 'AWS Educate - Getting Started with Compute', u: 'https://aws.amazon.com/education/awseducate/', type: 'web', req: 'account', task: 'أنشئ أول EC2 instance في بيئة التدريب المستضافة', note: 'تسجيل بالبريد فقط؛ اللابات مستضافة مجانًا عند AWS'}],
          3: [{n: 'OverTheWire Bandit', u: 'https://overthewire.org/wargames/bandit/', type: 'web', req: 'none', task: 'المستويات 0-10: أوامر لينكس الأساسية عبر SSH'}],
          4: [{n: 'SadServers', u: 'https://sadservers.com/', type: 'web', req: 'account', task: 'حل سيناريو troubleshooting واحد (systemd أو تخزين)', note: 'الخطة المجانية: سيناريوهات مختارة بحد يومي'}, {n: 'تمرين LVM على خادم Rocky', u: null, type: 'local', req: 'none', task: 'أنشئ logical volume جديدًا وأضفه إلى fstab ثم راقب الحالة بـ systemctl'}],
          5: [{n: 'CMD Challenge', u: 'https://cmdchallenge.com/', type: 'web', req: 'none', task: 'حل 10 تحديات أوامر في المتصفح'}, {n: 'سكربت نسخ احتياطي مجدول', u: null, type: 'local', req: 'none', task: 'اكتب سكربت backup وجدوله بـ cron على خادم Rocky'}],
          6: [{n: 'Learn Git Branching', u: 'https://learngitbranching.js.org/', type: 'web', req: 'none', task: 'أكمل مستويات Introduction Sequence'}, {n: 'GitHub Skills: Introduction to Git', u: 'https://github.com/skills/introduction-to-git', type: 'web', req: 'account', task: 'أكمل الكورس التفاعلي داخل مستودع خاص بك'}],
          7: [{n: 'تحليل تقدمك بـ Python', u: null, type: 'local', req: 'none', task: 'سكربت يقرأ ملف JSON المُصدَّر من التطبيق ويحسب ساعاتك ونسبة إنجازك (Colab موجود في المصادر)'}],
          8: [{n: 'AWS Educate - Networking (VPC)', u: 'https://aws.amazon.com/education/awseducate/', type: 'web', req: 'account', task: 'أكمل لاب Getting Started with Networking المستضاف'}],
          9: [{n: 'iximiuz Docker Playground', u: 'https://labs.iximiuz.com/playgrounds/docker/', type: 'web', req: 'account', task: 'شغّل أول حاوية واكتب Dockerfile بسيطًا', note: 'دخول بحساب GitHub؛ ساعة لعب يوميًا مجانًا'}],
          10: [{n: 'Kubernetes Basics - التوثيق الرسمي التفاعلي', u: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', type: 'web', req: 'account', task: 'أكمل الوحدات 1-3: إنشاء cluster ونشر أول تطبيق', note: 'الجزء التفاعلي يعمل عبر Killercoda بعضوية مجانية'}, {n: 'k3s على خادم Rocky', u: null, type: 'local', req: 'none', task: 'ثبّت k3s (خفيف يناسب 4GB) وانشر أول Pod وService'}],
          11: [{n: 'HashiCorp: Terraform Get Started - Docker', u: 'https://developer.hashicorp.com/terraform/tutorials/docker-get-started', type: 'local', req: 'none', task: 'apply ثم destroy لبنية Docker محلية عبر Terraform', note: 'يعمل محليًا بالكامل بدون حساب سحابي'}, {n: 'Killercoda: Terraform Fundamentals', u: 'https://killercoda.com/online-marathon/scenario/Terraform', type: 'web', req: 'account', task: 'انشر Nginx في Docker عبر Terraform في المتصفح'}],
          12: [{n: 'AWS Educate - Cloud Operations', u: 'https://aws.amazon.com/education/awseducate/', type: 'web', req: 'account', task: 'أكمل لاب العمليات السحابية وتقدير التكاليف'}, {n: 'تصميم معماري محلي', u: null, type: 'local', req: 'none', task: 'صمّم معمارية 3-tier على draw.io واكتب تقدير تكاليفها'}],
          13: [{n: 'GitHub Skills: Hello GitHub Actions', u: 'https://github.com/skills/hello-github-actions', type: 'web', req: 'account', task: 'أنشئ وشغّل أول workflow في مستودعك', note: 'Actions مجاني للمستودعات العامة (وللخاصة 2000 دقيقة/شهر)'}, {n: 'Jenkins في حاوية محلية', u: null, type: 'local', req: 'none', task: 'شغّل Jenkins في Docker على فيدورا (~2GB) واصنع أول pipeline - أوقف الحاوية بعد التدريب'}],
          14: [{n: 'GitLab.com - الخطة المجانية', u: 'https://about.gitlab.com/pricing/', type: 'web', req: 'account', task: 'حوّل workflow الوحدة السابقة إلى .gitlab-ci.yml وشغّله', note: 'بدون كارت؛ 400 دقيقة CI شهريًا'}],
          15: [{n: 'Killercoda: Monitoring Kubernetes with Prometheus', u: 'https://killercoda.com/chadmcrowell/scenario/prometheus', type: 'web', req: 'account', task: 'طبّق سيناريو مراقبة K8s بـ Prometheus'}, {n: 'Prometheus + Grafana محليًا', u: null, type: 'local', req: 'none', task: 'شغّلهما بـ docker-compose على فيدورا واربط مصدر البيانات'}],
          16: [{n: 'Killercoda: Ansible Handson', u: 'https://killercoda.com/ansible', type: 'web', req: 'account', task: 'اكتب وشغّل أول playbook'}, {n: 'Ansible من فيدورا إلى Rocky', u: null, type: 'local', req: 'none', task: 'playbook لإعداد خادم Rocky (طبولوجيا مختبرك الحالية)'}],
          17: [{n: 'مشروع محلي متكامل', u: null, type: 'local', req: 'none', task: 'ابنِ البنية كاملة محليًا: k3s + GitHub Actions + Trivy بدون أي خدمة مدفوعة'}],
          18: [{n: 'خريطة خدمات متعددة السحابات', u: null, type: 'local', req: 'none', task: 'ابنِ جدول مقابلة بين خدمات AWS وAzure وGCP (حوسبة، تخزين، شبكات، قواعد بيانات) في ملف Markdown داخل مستودعك', note: 'تمرين بحثي محلي بدون حساب؛ مسار AZ-900 على Microsoft Learn يصلح قراءة مرجعية مجانية له'}],
          19: [{n: 'TryHackMe - الغرف المجانية', u: 'https://tryhackme.com/free-rooms', type: 'web', req: 'account', task: 'ابدأ غرفة Introduction to Cyber Security', note: 'بيئة تدريبية مخصصة ومصرّح بها'}, {n: 'فحص محلي مصرّح به', u: null, type: 'local', req: 'none', task: 'nmap -sV من فيدورا على خادم Rocky ووثّق المنافذ المفتوحة'}],
          20: [{n: 'picoCTF (CyLab Security Academy)', u: 'https://www.picoctf.org/', type: 'web', req: 'account', task: 'حل تحديات General Skills للمبتدئين', note: 'منصة جامعة Carnegie Mellon التدريبية المجانية'}, {n: 'تقوية Rocky (أساسيات CIS)', u: null, type: 'local', req: 'none', task: 'طبّق ssh hardening + firewalld على خادمك'}],
          21: [{n: 'تصميم سياسات IAM', u: null, type: 'local', req: 'none', task: 'اكتب 3 سياسات least-privilege بصيغة JSON وتحقق منها نحويًا محليًا'}],
          22: [{n: 'Vault dev server محلي', u: null, type: 'local', req: 'none', task: 'شغّل Vault OSS محليًا وخزّن واقرأ أول secret بأوامر CLI'}],
          23: [{n: 'Semgrep على مستودعك', u: null, type: 'local', req: 'none', task: 'نزّل Semgrep وافحص مستودعك: semgrep scan --config auto (مجاني OSS بدون حساب)'}],
          24: [{n: 'Trivy + Checkov محليًا', u: null, type: 'local', req: 'none', task: 'افحص صورة Docker بـ Trivy وملفات Terraform بـ Checkov (أدوات OSS بدون حساب)'}],
          25: [{n: 'Juice Shop + OWASP ZAP', u: null, type: 'local', req: 'none', task: 'شغّل Juice Shop في حاوية محلية وافحصه بـ ZAP (تطبيق تدريبي مخصص)'}],
          26: [{n: 'Falco محلي', u: null, type: 'local', req: 'none', task: 'ثبّت Falco على فيدورا واكتب قاعدة تنبيه لمراقبة shell داخل حاوية'}],
          27: [{n: 'Pipeline آمن على مستودعك العام', u: null, type: 'local', req: 'none', task: 'GitHub Actions + Trivy + Semgrep - كلها مجانية للمستودعات العامة'}]
        };

;

/* ---------- shared helpers ---------- */
var PHASE_NAMES = {1:'المرحلة 1: أساسيات DevOps وAWS (9 أشهر)', 2:'المرحلة 2: التخصص DevSecOps'};
var phases = []; UNITS.forEach(function(u){ if(phases.indexOf(u.phase)===-1) phases.push(u.phase); });
var RES_TYPE = {video:['فيديو','video','video'], course:['مسار منظم','course','cap'], tool:['أداة مجانية','tool','tool'], playlist:['قائمة تشغيل','playlist','video'], lab:['معمل','lab','flask']};
var LANG_LABEL = {ar:'عربي', en:'English', free:'مجاني'};
var LAB_TYPE = {web:['معمل متصفح','web','globe'], desktop:['محاكي سطح مكتب','desk','monitor'], local:['تمرين محلي','local','laptop']};

function unitResDone(u){ var d=0; u.resources.forEach(function(r){ if(isResDone(r.id)) d++; }); return d; }
function unitResPct(u){ return Math.round(100*unitResDone(u)/u.resources.length); }
function overallDone(){ var c=0; UNITS.forEach(function(u){ if(getUnitStatus(u.id)==='completed') c++; }); return c; }
function overallPct(){ return Math.round(100*overallDone()/UNITS.length); }
function calcMetrics(){
  var m={totalUnits:UNITS.length, completed:0, inProgress:0, notStarted:0, p1TotalHours:0, p1DoneHours:0, totalRes:0, doneRes:0};
  UNITS.forEach(function(u){
    var st=getUnitStatus(u.id);
    if(st==='completed') m.completed++; else if(st==='in_progress') m.inProgress++; else m.notStarted++;
    if(u.phase===1){ m.p1TotalHours+=u.hours; if(st==='completed') m.p1DoneHours+=u.hours; }
    u.resources.forEach(function(r){ m.totalRes++; if(isResDone(r.id)) m.doneRes++; });
  });
  m.p1Pct = m.p1TotalHours? Math.round(100*m.p1DoneHours/m.p1TotalHours):0;
  return m;
}
function continueUnit(){
  var inprog = UNITS.filter(function(u){ return getUnitStatus(u.id)==='in_progress'; });
  if(inprog.length) return inprog[0];
  var first = UNITS.filter(function(u){ return getUnitStatus(u.id)!=='completed'; });
  return first.length? first[0] : UNITS[UNITS.length-1];
}
function showToast(msg, type){
  var c=document.getElementById('toast-container'); if(!c) return;
  var t=document.createElement('div');
  t.className='toast '+(type==='success'?'ok':type==='warning'?'warn':'info');
  t.innerHTML='<span>'+msg+'</span><button type="button" aria-label="إغلاق">✕</button>';
  t.querySelector('button').addEventListener('click', function(){ if(t.parentNode) t.parentNode.removeChild(t); });
  c.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); },300); }, 4000);
}
function stripGlyphs(t){ return t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}]/gu,'').replace(/\s{2,}/g,' ').trim(); }
function shortTitle(u){ return u.title.replace(/^الوحدة \d+: /,''); }

/* ---------- navigation state ---------- */
var view = 'home';        // home | units | unit | plan | analysis | tools | report
var studyUnitId = null;
var unitTab = 'res';      // res | labs | notes
var searchQ = '';
function go(v, id){
  view = v;
  if(v==='unit'){ studyUnitId = id; unitTab='res'; }
  renderAll();
  document.getElementById('content').scrollIntoView();
  window.scrollTo({top:0});
}

/* ---------- chrome: sidebar, topbars, bottom nav ---------- */
function renderSidebar(){
  var pct = overallPct();
  var html =
    '<div class="brand"><span class="mark">'+IC.cap.replace('sm','lg')+'</span><div><b>أكاديمية مصطفى</b><small>مسار Cloud &amp; DevOps</small></div></div>'+
    '<div class="side-progress"><div class="row"><span>التقدم الكلي</span><span><bdi dir="ltr">'+overallDone()+' / '+UNITS.length+'</bdi> وحدة ('+pct+'%)</span></div>'+
    '<div class="bar"><i style="width:'+pct+'%"></i></div></div>'+
    '<nav class="nav">'+
      navBtn('home',IC.home+'متابعة التعلم')+
      navBtn('units',IC.book+'المنهج ('+UNITS.length+' وحدة)')+
      navBtn('plan',IC.cal+'خطة الـ 9 أشهر')+
      navBtn('analysis',IC.chart+'التحليل')+
      navBtn('tools',IC.gift+'أدوات مجانية')+
      navBtn('report',IC.doc+'التقرير')+
    '</nav>'+
    '<div class="outline">'+
      phases.map(function(p){
        return '<div class="phase">'+PHASE_NAMES[p]+'</div>'+
          UNITS.filter(function(u){return u.phase===p;}).map(function(u){
            var st=getUnitStatus(u.id);
            var cls=(st==='completed'?'done ':'')+((view==='unit'&&u.id===studyUnitId)?'current':'');
            return '<div class="u '+cls+'" data-open-unit="'+u.id+'"><span class="st">'+(st==='completed'?'✓':u.id)+'</span><span class="nm">'+shortTitle(u)+'</span></div>';
          }).join('');
      }).join('')+
    '</div>';
  document.getElementById('sidebar').innerHTML = html;
}
function navBtn(v, label){
  return '<button class="'+(view===v?'active':'')+'" data-go="'+v+'">'+label+'</button>';
}
function renderTopbar(){
  var crumbs = view==='unit' ? 'المنهج / <b>الوحدة '+studyUnitId+'</b>'
    : view==='home' ? '<b>متابعة التعلم</b>'
    : view==='units' ? '<b>المنهج</b>' : view==='plan' ? '<b>خطة الـ 9 أشهر</b>'
    : view==='analysis' ? '<b>التحليل</b>' : view==='tools' ? '<b>أدوات مجانية</b>' : '<b>التقرير</b>';
  document.getElementById('topbar').innerHTML =
    '<div class="crumbs">'+crumbs+'</div>'+
    '<label class="search">'+IC.search+'<input id="search-input" type="search" placeholder="ابحث في الوحدات والمصادر…" value="'+searchQ.replace(/"/g,'&quot;')+'"></label>'+
    '<button class="chip hot" data-log-streak title="تسجيل جلسة مذاكرة اليوم">'+IC.flame+' '+(appState.streakDays||0)+' يوم</button>'+
    '<button class="chip" data-theme title="تبديل المظهر">'+(appState.theme==='light'?IC.moon:IC.sun)+'</button>';
}
function renderMChrome(){
  document.getElementById('mtopbar').innerHTML =
    '<span class="mark">'+IC.cap+'</span><b>أكاديمية مصطفى</b>'+
    '<button class="chip hot" data-log-streak>'+IC.flame+' '+(appState.streakDays||0)+'</button>'+
    '<button class="chip" data-theme>'+(appState.theme==='light'?IC.moon:IC.sun)+'</button>'+
    '<button class="chip" id="m-menu" aria-label="القائمة">'+IC.menu+'</button>';
  document.getElementById('mbnav').innerHTML =
    '<button class="'+(view==='home'?'active':'')+'" data-go="home">'+IC.home+'الرئيسية</button>'+
    '<button class="'+(view==='units'?'active':'')+'" data-go="units">'+IC.book+'المنهج</button>'+
    '<button class="'+(view==='plan'?'active':'')+'" data-go="plan">'+IC.cal+'الخطة</button>'+
    '<button class="'+(view==='tools'?'active':'')+'" data-go="tools">'+IC.gift+'الأدوات</button>';
}

/* ---------- HOME: continue learning ---------- */
function renderHome(){
  var u = continueUnit();
  var st = getUnitStatus(u.id);
  var done = unitResDone(u), total = u.resources.length, pct = unitResPct(u);
  var started = st!=='not_started' || done>0;
  var m = calcMetrics();
  var tipText = u.labTip || '';
  var tipShort = tipText.length>90 ? tipText.slice(0,90)+'…' : tipText;
  var nextU = UNITS.filter(function(x){ return x.id===u.nextUnit; })[0];
  return ''+
  '<div class="hero">'+
    '<button class="play" data-open-unit="'+u.id+'" aria-label="أكمل الدراسة">'+IC.play+'</button>'+
    '<div style="flex:1;min-width:0">'+
      '<div class="sub">'+(started?'تابع من حيث توقفت':'ابدأ رحلتك من هنا')+'</div>'+
      '<h2 title="'+u.title.replace(/"/g,'&quot;')+'">'+u.title+'</h2>'+
      '<div class="meta"><span class="tag red">'+(st==='completed'?'مكتملة':st==='in_progress'?'قيد الدراسة':'لم تبدأ')+'</span>'+
      '<span class="tag">الشهر '+u.month+'</span><span class="tag">'+u.hours+' ساعة</span><span class="tag">'+u.difficulty+'</span></div>'+
      '<div class="prog"><div class="bar"><i style="width:'+pct+'%"></i></div>'+
      '<span class="sub">'+done+' من '+total+' مصادر ('+pct+'%) — إنجاز يدوي</span></div>'+
      '<div class="cta"><button class="btn" data-open-unit="'+u.id+'">'+(started?'أكمل الدراسة':'ابدأ الوحدة')+' '+IC.next+'</button>'+
      '<button class="btn ghost" data-go="units">كل الوحدات</button></div>'+
    '</div>'+
  '</div>'+

  '<div class="strip">'+
    '<div class="cell"><span class="ic red">'+IC.target+'</span><div><b>هدف الأسبوع: 17 ساعة</b><div class="lbl">'+(function(){var w=0;var now=new Date();(appState.studyHistory||[]).forEach(function(d){var dt=new Date(d+'T00:00:00');if((now-dt)<7*86400000)w++;});return w+' أيام مذاكرة مسجلة خلال آخر 7 أيام';})()+'</div></div></div>'+
    '<div class="cell"><span class="ic amber">'+IC.flame+'</span><div><b>'+(appState.streakDays||0)+' يوم متتالي</b><div class="lbl">الاستمرارية أهم من الكم</div></div></div>'+
    '<div class="cell strip-cta"><button class="btn sm ghost" data-log-streak>'+IC.plus+' سجّل جلسة اليوم</button></div>'+
  '</div>'+

  (tipShort? '<button class="labtip" data-open-unit="'+u.id+'" data-tab="labs"><span class="ic">'+IC.flask+'</span><span class="tt">تطبيق اليوم المقترح — وحدة '+u.id+'<small>'+tipShort+'</small></span><span class="go">افتح التطبيق العملي</span></button>':'')+

  '<div class="grid c2">'+
    '<div class="card"><h3>'+IC.map+' خريطة المسار</h3>'+
      '<div class="path">'+
      phases.map(function(p){
        return '<div class="ph"><h4>'+PHASE_NAMES[p]+'</h4><div class="mini">'+
          UNITS.filter(function(x){return x.phase===p;}).map(function(x){
            var st2=getUnitStatus(x.id);
            return '<b class="'+(st2==='completed'?'ok':st2!=='not_started'?'cur':'')+'" data-open-unit="'+x.id+'" title="'+x.title.replace(/"/g,'&quot;')+'">'+x.id+'</b>';
          }).join('')+'</div></div>';
      }).join('')+
      '</div></div>'+
    '<div class="card"><h3>'+IC.chart+' لمحة سريعة</h3>'+
      '<div style="display:flex;flex-direction:column;gap:9px;font-size:13px">'+
        '<div style="display:flex;justify-content:space-between"><span class="lbl">المرحلة 1 (خطة الـ 9 أشهر)</span><b style="color:var(--red)">'+m.p1Pct+'%</b></div>'+
        '<div class="bar"><i style="width:'+m.p1Pct+'%"></i></div>'+
        '<div style="display:flex;justify-content:space-between"><span class="lbl">مصادر مُنجزة يدويًا</span><b><bdi dir="ltr">'+m.doneRes+' / '+m.totalRes+'</bdi></b></div>'+
        '<div style="display:flex;justify-content:space-between"><span class="lbl">وحدات مكتملة</span><b><bdi dir="ltr">'+m.completed+' / '+m.totalUnits+'</bdi></b></div>'+
        '<div style="display:flex;justify-content:space-between"><span class="lbl">قيد الدراسة</span><b>'+m.inProgress+'</b></div>'+
      '</div>'+
      (nextU? '<div class="stitle" style="margin:16px 0 8px"><h3>'+IC.next+' التالية بعد وحدة '+u.id+'</h3></div>'+
      '<button class="ucard" data-open-unit="'+nextU.id+'" style="background:var(--panel2)"><span class="num">'+nextU.id+'</span>'+
      '<span class="t"><b>'+nextU.title+'</b><small>الشهر '+nextU.month+' • '+nextU.hours+' ساعة • '+nextU.difficulty+'</small></span></button>':'')+
    '</div>'+
  '</div>';
}

/* ---------- UNITS list ---------- */
var filterStatus='all', filterPhase='all';
function renderUnits(){
  var q = searchQ.trim();
  var list = UNITS.filter(function(u){
    if(filterPhase!=='all' && String(u.phase)!==filterPhase) return false;
    if(filterStatus!=='all' && getUnitStatus(u.id)!==filterStatus) return false;
    if(q){
      var hay = (u.title+' '+u.summary+' '+u.cloudFocus+' '+u.resources.map(function(r){return r.title+' '+r.description;}).join(' ')).toLowerCase();
      if(hay.indexOf(q.toLowerCase())===-1) return false;
    }
    return true;
  });
  return ''+
  '<h2 style="font-size:19px;margin-bottom:3px">المنهج الكامل</h2>'+
  '<p class="lbl" style="margin-bottom:4px">'+UNITS.length+' وحدة عبر مرحلتين — كل وحدة بمصادرها وتطبيقها العملي وملاحظاتك.</p>'+
  '<div class="filters">'+
    '<select id="f-phase"><option value="all">كل المراحل</option><option value="1"'+(filterPhase==='1'?' selected':'')+'>المرحلة 1</option><option value="2"'+(filterPhase==='2'?' selected':'')+'>المرحلة 2</option></select>'+
    '<select id="f-status"><option value="all">كل الحالات</option>'+
      '<option value="not_started"'+(filterStatus==='not_started'?' selected':'')+'>لم تبدأ</option>'+
      '<option value="in_progress"'+(filterStatus==='in_progress'?' selected':'')+'>قيد الدراسة</option>'+
      '<option value="completed"'+(filterStatus==='completed'?' selected':'')+'>مكتملة</option></select>'+
    (q? '<span class="chip">نتائج البحث: '+list.length+'</span>':'')+
  '</div>'+
  phases.map(function(p){
    var group = list.filter(function(u){return u.phase===p;});
    if(!group.length) return '';
    return '<div class="stitle"><h3 style="color:var(--amber);font-size:14px">'+PHASE_NAMES[p]+'</h3></div>'+
      '<div style="display:flex;flex-direction:column;gap:9px">'+
      group.map(function(u){
        var st=getUnitStatus(u.id); var done=unitResDone(u);
        return '<button class="ucard" data-open-unit="'+u.id+'">'+
          '<span class="num '+(st==='completed'?'done':'')+'">'+(st==='completed'?'✓':u.id)+'</span>'+
          '<span class="t"><b title="'+u.title.replace(/"/g,'&quot;')+'">'+u.title+'</b>'+
          '<small>الشهر '+u.month+' • '+u.hours+' ساعة • '+u.difficulty+' • '+u.resources.length+' مصادر'+(done?' • أُنجز '+done:'')+'</small></span>'+
          '<span class="pct"><b>'+(st==='completed'?'100%':st!=='not_started'||done?unitResPct(u)+'%':'—')+'</b><small>'+(st==='completed'?'مكتملة':st==='in_progress'?'قيد الدراسة':'لم تبدأ')+'</small></span></button>';
      }).join('')+'</div>';
  }).join('') +
  (list.length?'':'<div class="card"><p class="lbl">لا نتائج مطابقة — جرّب كلمة أخرى أو أعد ضبط المرشحات.</p></div>');
}

/* ---------- UNIT workspace ---------- */
function renderUnit(){
  var u = UNITS.filter(function(x){return x.id===studyUnitId;})[0];
  if(!u) return '<div class="card"><p class="lbl">الوحدة غير موجودة.</p></div>';
  var st = getUnitStatus(u.id);
  var done = unitResDone(u), pct = unitResPct(u);
  var labs = LABS_BY_UNIT[u.id]||[];
  var head =
  '<div class="uhead">'+
    '<div class="kick">الوحدة '+u.id+' • '+(PHASE_NAMES[u.phase]||'')+'</div>'+
    '<h2 id="u-title" title="'+u.title.replace(/"/g,'&quot;')+'">'+u.title+'</h2>'+
    '<button class="expand" id="u-title-expand">عرض العنوان كاملًا</button>'+
    '<div class="meta">'+
      '<span class="tag">الشهر '+u.month+'</span><span class="tag">'+u.hours+' ساعة</span>'+
      '<span class="tag">'+u.difficulty+'</span><span class="tag">'+u.cloudFocus+'</span>'+
      (u.courseraTag? '<span class="tag">'+u.courseraTag+'</span>':'')+
    '</div>'+
    '<div class="prog"><div class="bar"><i style="width:'+pct+'%"></i></div>'+
    '<span class="sub" style="font-size:12.5px;color:var(--muted)">'+done+' من '+u.resources.length+' مصادر ('+pct+'%) — تُعلَّم يدويًا</span></div>'+
    '<div class="statuspick">'+
      '<span class="lbl" style="font-size:12px">حالة الوحدة:</span>'+
      '<button class="opt '+(st==='in_progress'?'on-red':'')+'" data-set-status="in_progress">قيد الدراسة</button>'+
      '<button class="opt '+(st==='completed'?'on-green':'')+'" data-set-status="completed">مكتملة</button>'+
      (st!=='not_started'? '<button class="opt" data-set-status="not_started">إعادة ضبط</button>':'')+
    '</div>'+
  '</div>'+
  '<div class="tabs">'+
    '<button class="'+(unitTab==='res'?'active':'')+'" data-tab="res">'+IC.book+' المصادر ('+u.resources.length+')</button>'+
    '<button class="'+(unitTab==='labs'?'active':'')+'" data-tab="labs">'+IC.flask+' التطبيق العملي'+(labs.length?' ('+labs.length+')':'')+'</button>'+
    '<button class="'+(unitTab==='notes'?'active':'')+'" data-tab="notes">'+IC.note+' ملاحظاتي</button>'+
  '</div>';

  var body='';
  if(unitTab==='res'){
    body = '<p class="lbl" style="margin-bottom:10px;font-size:12px">المصادر متنوعة الأنواع (فيديو، مسارات منظمة، أدوات) — علّم ما أنجزته فعلًا بنفسك.</p>'+
    u.resources.map(function(r){
      var t = RES_TYPE[r.type]||['مصدر','course'];
      var isOpen = false;
      return '<div class="res" data-res="'+r.id+'">'+
        '<div class="head" data-toggle-res="'+r.id+'">'+
          '<button class="chk '+(isResDone(r.id)?'done':'')+'" data-check-res="'+r.id+'" aria-label="تعليم كمنجز">'+IC.check+'</button>'+
          '<div class="rt"><b>'+stripGlyphs(r.title)+'</b>'+
            '<div class="sub2"><span class="badge '+t[1]+'">'+IC[t[2]]+t[0]+'</span><span class="badge">'+LANG_LABEL[r.lang]+'</span>'+(r.isDolfined?'<span class="badge">DolfinED</span>':'')+'</div>'+
          '</div>'+IC.chev+
        '</div>'+
        '<div class="desc">'+r.description+
          '<br><a href="'+r.url+'" target="_blank" rel="noopener">فتح المصدر في علامة تبويب جديدة '+IC.ext+'</a></div>'+
      '</div>';
    }).join('');
  } else if(unitTab==='labs'){
    body = (u.labTip? '<div class="tip"><span class="ic">'+IC.flask+'</span><div>'+u.labTip+'</div></div>':'')+
      (labs.length? labs.map(function(l){
        var lt = LAB_TYPE[l.type]||LAB_TYPE.local;
        return '<div class="res"><div class="head" style="cursor:default;align-items:flex-start">'+
          '<div class="rt"><b>'+stripGlyphs(l.n)+(l.u?' <a href="'+l.u+'" target="_blank" rel="noopener" style="color:var(--blue)">'+IC.ext+'</a>':'')+'</b>'+
          '<div class="sub2"><span class="badge '+lt[1]+'">'+IC[lt[2]==='monitor'?'monitor':lt[2]==='globe'?'globe':'laptop']+lt[0]+'</span>'+
          '<span class="badge">'+(l.req==='account'?'حساب مجاني (بدون كارت)':'بدون حساب')+'</span></div>'+
          '<div class="labtask"><span class="ic">'+IC.target+'</span><span>'+l.task+'</span></div>'+
          (l.note? '<p class="lbl" style="margin-top:7px;font-size:11.5px">'+l.note+'</p>':'')+
          '</div></div></div>';
      }).join('') : '<div class="card"><p class="lbl">التطبيق العملي لهذه الوحدة داخل فيديوهاتها ومختبرك المحلي.</p></div>');
  } else {
    body = '<textarea class="notes" id="unit-notes" placeholder="اكتب هنا أهم الأوامر، روابط مشاريعك على GitHub، أو النقاط التي تود مراجعتها لاحقًا…">'+(appState.unitNotes[u.id]||'')+'</textarea>'+
      '<div class="savestate"><span class="dot"></span><span id="notes-state">'+(appState.unitNotes[u.id]?'محفوظة على جهازك':'جاهز للكتابة — حفظ تلقائي فوري')+'</span></div>';
  }
  var prevU = UNITS.filter(function(x){return x.id===u.id-1;})[0];
  var nextU = UNITS.filter(function(x){return x.id===u.nextUnit;})[0];
  return head+body+
  '<div class="unav">'+
    (prevU? '<button class="btn ghost" data-open-unit="'+prevU.id+'">السابقة: '+prevU.id+'</button>':'<span></span>')+
    (nextU? '<button class="btn" data-open-unit="'+nextU.id+'">التالية: '+nextU.id+' '+IC.next+'</button>':'')+
  '</div>';
}

/* ---------- PLAN (9 months) ---------- */
function renderPlan(){
  var months = []; UNITS.forEach(function(u){ if(months.indexOf(u.month)===-1) months.push(u.month); });
  months.sort(function(a,b){return a-b;});
  var rows = months.map(function(mn){
    var mUnits = UNITS.filter(function(u){return u.phase===1 && u.month===mn;});
    if(!mUnits.length) return '';
    var totalH = mUnits.reduce(function(a,u){return a+u.hours;},0);
    var weeklyH = (totalH/4).toFixed(1);
    var allDone = mUnits.every(function(u){return getUnitStatus(u.id)==='completed';});
    var anyStarted = mUnits.some(function(u){return getUnitStatus(u.id)!=='not_started';});
    return '<tr class="'+(allDone?'done-row':anyStarted?'cur-row':'')+'">'+
      '<td><b>الشهر '+mn+'</b></td>'+
      '<td>'+mUnits.map(function(u){return '<a data-open-unit="'+u.id+'" style="color:var(--blue);cursor:pointer">الوحدة '+u.id+'</a> ('+u.hours+' س)';}).join(' + ')+'</td>'+
      '<td style="white-space:nowrap">'+totalH+' ساعة</td>'+
      '<td style="white-space:nowrap">'+weeklyH+' س/أسبوع</td>'+
      '<td>'+(allDone?'مكتمل':anyStarted?'جارٍ':'—')+'</td></tr>';
  }).join('');
  return ''+
  '<h2 style="font-size:19px;margin-bottom:3px">خطة الـ 9 أشهر — المرحلة 1 (AWS)</h2>'+
  '<p class="lbl" style="margin-bottom:14px">الهدف الأسبوعي الثابت 17 ساعة؛ التوزيع مرن داخل الشهر.</p>'+
  '<div class="tablewrap"><table><thead><tr><th>الشهر</th><th>الوحدات</th><th>الإجمالي</th><th>المعدل الأسبوعي</th><th>الحالة</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
  '<div class="card" style="margin-top:14px"><h3>'+IC.note+' تذكير</h3><p class="lbl" style="font-size:13px">راجع خطتك كل أسبوع ووزّع ساعاتك الـ 17 حسب ظروفك — الخطة مرنة والهدف ثابت.</p></div>';
}

/* ---------- ANALYSIS ---------- */
function renderAnalysis(){
  var m = calcMetrics();
  var p1RemainingHours = m.p1TotalHours - m.p1DoneHours;
  var p1Weeks = (p1RemainingHours/17).toFixed(1);
  var doneU = UNITS.filter(function(u){return getUnitStatus(u.id)==='completed';});
  var curU = UNITS.filter(function(u){return getUnitStatus(u.id)==='in_progress';});
  return ''+
  '<h2 style="font-size:19px;margin-bottom:14px">التحليل</h2>'+
  '<div class="kpis">'+
    '<div class="kpi"><div class="v red">'+overallPct()+'%</div><div class="k">الإنجاز الكلي ('+m.completed+'/'+m.totalUnits+' وحدة)</div></div>'+
    '<div class="kpi"><div class="v red">'+m.p1Pct+'%</div><div class="k">المرحلة 1 ('+m.p1DoneHours+'/'+m.p1TotalHours+' ساعة)</div></div>'+
    '<div class="kpi"><div class="v green">'+m.doneRes+'</div><div class="k">مصادر مُنجزة من '+m.totalRes+'</div></div>'+
    '<div class="kpi"><div class="v amber">'+(appState.streakDays||0)+'</div><div class="k">أيام متتالية</div></div>'+
    '<div class="kpi"><div class="v">'+p1Weeks+'</div><div class="k">أسبوع متبقٍ للمرحلة 1 بمعدل 17 س/أسبوع</div></div>'+
    '<div class="kpi"><div class="v">'+(appState.studyHistory||[]).length+'</div><div class="k">أيام مذاكرة مسجلة</div></div>'+
  '</div>'+
  '<div class="card"><h3>'+IC.book+' حالة الوحدات</h3>'+
    '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13px">'+
    '<span class="chip ok">مكتملة: '+m.completed+'</span><span class="chip hot">قيد الدراسة: '+m.inProgress+'</span><span class="chip">لم تبدأ: '+m.notStarted+'</span></div>'+
    (curU.length? '<p class="lbl" style="margin-top:10px">تدرس الآن: '+curU.map(function(u){return 'الوحدة '+u.id;}).join('، ')+'</p>':'')+
  '</div>';
}

/* ---------- FREE TOOLS ---------- */
var toolCat='all';
function renderTools(){
  var cats=['all']; FREE_TOOLS.forEach(function(t){ if(cats.indexOf(t.category)===-1) cats.push(t.category); });
  var list = FREE_TOOLS.filter(function(t){ return toolCat==='all'||t.category===toolCat; });
  return ''+
  '<h2 style="font-size:19px;margin-bottom:3px">دليل الأدوات والمنصات المجانية</h2>'+
  '<p class="lbl" style="margin-bottom:12px">'+FREE_TOOLS.length+' منصة وأداة مجانية مصنفة حسب الغرض ومربوطة بوحدات المسار.</p>'+
  '<div class="filters"><select id="f-toolcat">'+cats.map(function(c){return '<option value="'+c+'"'+(toolCat===c?' selected':'')+'>'+(c==='all'?'كل التصنيفات':c)+'</option>';}).join('')+'</select></div>'+
  '<div class="toolgrid">'+
  list.map(function(t){
    return '<div class="tool"><b>'+stripGlyphs(t.name)+'</b><p>'+t.limits+'</p>'+
      '<p style="margin-top:6px;color:var(--text)">'+t.usage+'</p>'+
      '<div class="row2"><span class="badge">'+t.category+'</span><span class="badge">'+t.units+'</span></div>'+
      '<div style="margin-top:8px"><a class="btn sm ghost" href="'+t.url+'" target="_blank" rel="noopener">فتح '+IC.ext+'</a></div></div>';
  }).join('')+'</div>';
}

/* ---------- REPORT ---------- */
function renderReport(){
  var m = calcMetrics();
  var rows = UNITS.map(function(u){
    var st=getUnitStatus(u.id);
    var stLabel = st==='completed'?'مكتملة':st==='in_progress'?'قيد الدراسة':'لم تبدأ';
    var doneR=unitResDone(u);
    var note=(appState.unitNotes[u.id]||'').trim()||'—';
    return '<tr><td><b>'+u.id+'</b></td><td style="max-width:280px">'+u.title+'</td>'+
      '<td style="white-space:nowrap">'+(u.phase===1?'شهر '+u.month:'DevSecOps')+'</td>'+
      '<td style="white-space:nowrap">'+u.hours+' س</td><td style="white-space:nowrap">'+doneR+' / '+u.resources.length+'</td>'+
      '<td>'+stLabel+'</td><td style="max-width:220px;white-space:pre-wrap">'+note.replace(/</g,'&lt;')+'</td></tr>';
  }).join('');
  return ''+
  '<h2 style="font-size:19px;margin-bottom:3px">تقرير التقدم</h2>'+
  '<p class="lbl" style="margin-bottom:14px">تاريخ التقرير: '+getTodayISO()+'</p>'+
  '<div class="kpis">'+
    '<div class="kpi"><div class="v">'+overallPct()+'%</div><div class="k">الإنجاز الكلي ('+m.completed+'/27)</div></div>'+
    '<div class="kpi"><div class="v red">'+m.p1Pct+'%</div><div class="k">المرحلة 1 ('+m.p1DoneHours+'/'+m.p1TotalHours+' س)</div></div>'+
    '<div class="kpi"><div class="v green">'+m.doneRes+'/'+m.totalRes+'</div><div class="k">مصادر مُنجزة</div></div>'+
    '<div class="kpi"><div class="v amber">'+(appState.streakDays||0)+' يوم</div><div class="k">الاستمرارية</div></div>'+
  '</div>'+
  '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:16px">'+
    '<button class="btn sm" id="btn-export-md">'+IC.dl+' تصدير تقرير Markdown</button>'+
    '<button class="btn sm ghost" id="btn-export-json">'+IC.dl+' تصدير JSON</button>'+
    '<button class="btn sm ghost" id="btn-copy-json">'+IC.copy+' نسخ JSON</button>'+
    '<label class="btn sm ghost" style="cursor:pointer">'+IC.ul+' استيراد JSON<input type="file" id="import-file" accept=".json,application/json" hidden></label>'+
  '</div>'+
  '<div class="tablewrap"><table><thead><tr><th>#</th><th>الوحدة</th><th>المرحلة</th><th>الساعات</th><th>الموارد</th><th>الحالة</th><th>الملاحظات</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

/* ---------- actions ---------- */
function applyTheme(){
  var htmlEl=document.documentElement;
  if(appState.theme==='light'){ htmlEl.classList.remove('dark'); htmlEl.classList.add('light'); }
  else{ htmlEl.classList.remove('light'); htmlEl.classList.add('dark'); }
  var meta=document.getElementById('meta-theme-color');
  if(meta) meta.setAttribute('content', appState.theme==='light'?'#f8f5f6':'#140a0d');
}
function logStudySessionToday(){
  var today=getTodayISO();
  if(appState.lastStudyDate===today){ showToast('سجّلت جلسة مذاكرة اليوم بالفعل — استمر!', 'info'); return; }
  if(appState.lastStudyDate){
    var diff=Math.round((new Date(today+'T00:00:00')-new Date(appState.lastStudyDate+'T00:00:00'))/86400000);
    if(diff===1) appState.streakDays=(appState.streakDays||0)+1;
    else if(diff>1) appState.streakDays=1;
    else appState.streakDays=Math.max(1,appState.streakDays||1);
  } else appState.streakDays=1;
  appState.lastStudyDate=today;
  if(!Array.isArray(appState.studyHistory)) appState.studyHistory=[];
  if(appState.studyHistory.indexOf(today)===-1) appState.studyHistory.push(today);
  saveState(); renderAll();
  showToast('أحسنت! سُجّلت جلسة اليوم وتحدّثت سلسلة الاستمرارية.', 'success');
}
function setUnitStatus(id, st){
  appState.unitStatus[id]=st;
  if(st==='completed'){ var u=UNITS.filter(function(x){return x.id===id;})[0]; if(u) u.resources.forEach(function(r){ appState.completedResources[r.id]=true; }); }
  saveState(); renderAll();
  showToast(st==='completed'?'وحدة مكتملة — عمل رائع!':st==='in_progress'?'الوحدة الآن قيد الدراسة.':'أُعيد ضبط حالة الوحدة.','success');
}
function toggleResource(id){
  if(appState.completedResources[id]) delete appState.completedResources[id];
  else appState.completedResources[id]=true;
  saveState();
  // light re-render: update row + progress without losing scroll
  var row=document.querySelector('[data-res="'+id+'"]');
  if(row){ var chk=row.querySelector('.chk'); if(chk) chk.classList.toggle('done', isResDone(id)); }
  renderSidebar(); refreshUnitProgress();
}
function refreshUnitProgress(){
  var u=UNITS.filter(function(x){return x.id===studyUnitId;})[0]; if(!u) return;
  var bar=document.querySelector('.uhead .bar>i'); var lbl=document.querySelector('.uhead .prog .sub');
  if(bar) bar.style.width=unitResPct(u)+'%';
  if(lbl) lbl.textContent=unitResDone(u)+' من '+u.resources.length+' مصادر ('+unitResPct(u)+'%) — تُعلَّم يدويًا';
}
var notesTimer=null;
function bindNotes(){
  var ta=document.getElementById('unit-notes'); if(!ta) return;
  ta.addEventListener('input', function(){
    var st=document.getElementById('notes-state'); if(st) st.textContent='يكتب…';
    clearTimeout(notesTimer);
    notesTimer=setTimeout(function(){
      appState.unitNotes[studyUnitId]=ta.value; saveState();
      if(st) st.textContent='محفوظة على جهازك ✓';
    }, 400);
  });
}

/* ---------- export / import ---------- */
function downloadBlob(content, name, type){
  var blob=new Blob([content],{type:type}); var a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
}
function exportJSON(){
  var payload={app:'Mostafa Cloud Academy', version:APP_VERSION, exportedAt:new Date().toISOString(), state:appState};
  downloadBlob(JSON.stringify(payload,null,2),'mostafa-cloud-progress-'+getTodayISO()+'.json','application/json;charset=utf-8');
  showToast('صُدّر ملف التقدم (JSON) — يمكن نقله لأي جهاز.','success');
}
function copyJSON(){
  var payload=JSON.stringify({app:'Mostafa Cloud Academy',version:APP_VERSION,exportedAt:new Date().toISOString(),state:appState},null,2);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(payload).then(function(){showToast('نُسخ كود التقدم إلى الحافظة.','success');},function(){fallbackCopy(payload);});
  } else fallbackCopy(payload);
}
function fallbackCopy(text){
  var ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); showToast('نُسخ كود التقدم إلى الحافظة.','success'); }
  catch(e){ showToast('تعذر النسخ التلقائي — استخدم زر تصدير JSON.','warning'); }
  ta.remove();
}
function importJSON(file){
  if(!file) return;
  var reader=new FileReader();
  reader.onload=function(evt){
    try{
      var parsed=JSON.parse(evt.target.result);
      var incoming=parsed.state?parsed.state:parsed;
      if(typeof incoming!=='object'||incoming===null) throw new Error('bad');
      appState=Object.assign(getDefaultState(),incoming);
      saveState(); applyTheme(); renderAll();
      showToast('استُوردت بيانات التقدم والملاحظات بنجاح.','success');
    }catch(err){ showToast('الملف المختار ليس ملف JSON صالحًا للتقدم.','warning'); }
  };
  reader.readAsText(file);
}
function exportMarkdown(){
  var m=calcMetrics();
  var md='# تقرير التقدم الدراسي – مسار مصطفى السحابي (AWS & DevOps & DevSecOps)\n\n';
  md+='- **تاريخ التقرير:** '+getTodayISO()+'\n';
  md+='- **الإنجاز الكلي:** '+overallPct()+'% ('+m.completed+' من '+m.totalUnits+' وحدة)\n';
  md+='- **المرحلة 1 (خطة الـ 9 أشهر - AWS):** '+m.p1Pct+'% ('+m.p1DoneHours+' من '+m.p1TotalHours+' ساعة)\n';
  md+='- **سلسلة أيام المذاكرة:** '+(appState.streakDays||0)+' يوم\n\n## تفاصيل الوحدات والملاحظات\n\n';
  UNITS.forEach(function(u){
    var st=getUnitStatus(u.id);
    md+='### '+u.title+'\n- **الحالة:** '+(st==='completed'?'مكتملة':st==='in_progress'?'قيد الدراسة':'لم تبدأ')+' | **الساعات:** '+u.hours+'\n';
    var note=(appState.unitNotes[u.id]||'').trim(); if(note) md+='- **ملاحظات:** '+note+'\n';
    md+='\n';
  });
  downloadBlob(md,'mostafa-progress-report-'+getTodayISO()+'.md','text/markdown;charset=utf-8');
  showToast('صُدّر تقرير التقدم بصيغة Markdown.','success');
}

/* ---------- render orchestration + global events ---------- */
function renderAll(){
  renderSidebar(); renderTopbar(); renderMChrome();
  var C=document.getElementById('content');
  if(view==='home') C.innerHTML=renderHome();
  else if(view==='units') C.innerHTML=renderUnits();
  else if(view==='unit') C.innerHTML=renderUnit();
  else if(view==='plan') C.innerHTML=renderPlan();
  else if(view==='analysis') C.innerHTML=renderAnalysis();
  else if(view==='tools') C.innerHTML=renderTools();
  else if(view==='report') C.innerHTML=renderReport();
  bindNotes();
}
document.addEventListener('click', function(e){
  var t=e.target.closest('[data-go],[data-open-unit],[data-tab],[data-set-status],[data-check-res],[data-toggle-res],[data-log-streak],[data-theme],#m-menu,#u-title-expand,#btn-export-md,#btn-export-json,#btn-copy-json');
  if(!t) return;
  if(t.hasAttribute('data-go')){ go(t.getAttribute('data-go')); document.body.classList.remove('nav-open'); }
  else if(t.hasAttribute('data-open-unit')){
    var tab=t.getAttribute('data-tab'); go('unit', parseInt(t.getAttribute('data-open-unit'),10));
    if(tab){ unitTab=tab; renderAll(); }
    document.body.classList.remove('nav-open');
  }
  else if(t.hasAttribute('data-tab')){ unitTab=t.getAttribute('data-tab'); renderAll(); }
  else if(t.hasAttribute('data-set-status')){ setUnitStatus(studyUnitId, t.getAttribute('data-set-status')); }
  else if(t.hasAttribute('data-check-res')){ e.stopPropagation(); toggleResource(t.getAttribute('data-check-res')); }
  else if(t.hasAttribute('data-toggle-res')){
    if(e.target.closest('[data-check-res]')||e.target.closest('a')) return;
    var row=t.closest('.res'); if(row) row.classList.toggle('open');
  }
  else if(t.hasAttribute('data-log-streak')){ logStudySessionToday(); }
  else if(t.hasAttribute('data-theme')){ appState.theme=(appState.theme==='light'?'dark':'light'); saveState(); applyTheme(); renderAll(); }
  else if(t.id==='m-menu'){ document.body.classList.toggle('nav-open'); }
  else if(t.id==='u-title-expand'){ var h=document.getElementById('u-title'); if(h){ h.classList.toggle('expanded'); t.textContent=h.classList.contains('expanded')?'طي العنوان':'عرض العنوان كاملًا'; } }
  else if(t.id==='btn-export-md'){ exportMarkdown(); }
  else if(t.id==='btn-export-json'){ exportJSON(); }
  else if(t.id==='btn-copy-json'){ copyJSON(); }
});
document.addEventListener('change', function(e){
  if(e.target.id==='f-phase'){ filterPhase=e.target.value; renderAll(); }
  else if(e.target.id==='f-status'){ filterStatus=e.target.value; renderAll(); }
  else if(e.target.id==='f-toolcat'){ toolCat=e.target.value; renderAll(); }
  else if(e.target.id==='import-file'){ importJSON(e.target.files[0]); e.target.value=''; }
});
document.addEventListener('input', function(e){
  if(e.target.id==='search-input'){ searchQ=e.target.value; if(view!=='units') view='units'; renderAll(); var si=document.getElementById('search-input'); if(si){ si.focus(); si.setSelectionRange(si.value.length,si.value.length); } }
});
// drawer overlay click closes
document.getElementById('drawer').addEventListener('click', function(e){ if(e.target.id==='drawer') document.body.classList.remove('nav-open'); });

/* ---------- hardened PWA update path (v4.5.2 baseline, unchanged) ---------- */
var swRegistrationRef=null, swReloadPending=false, swAutoReloaded=false;
function showUpdateBanner(reg){
  if(document.getElementById('sw-update-banner')) return;
  var bar=document.createElement('div');
  bar.id='sw-update-banner'; bar.setAttribute('role','status');
  bar.style.cssText='position:fixed;bottom:14px;inset-inline-start:14px;z-index:70;max-width:320px;background:rgba(6,26,20,0.97);border:1px solid rgba(52,211,153,0.5);color:#a7f3d0;border-radius:14px;padding:10px 12px;font-size:12px;font-weight:700;line-height:1.6;box-shadow:0 10px 30px rgba(0,0,0,0.5);';
  bar.innerHTML='<div>وصل إصدار جديد من الموقع. تقدّمك وملاحظاتك محفوظة على جهازك ولن تُمسح بالتحديث.</div>'+
    '<div style="display:flex;gap:8px;margin-top:8px;">'+
    '<button id="sw-update-now" type="button" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;cursor:pointer;">تحديث الآن</button>'+
    '<button id="sw-update-later" type="button" style="background:transparent;color:#a7f3d0;border:1px solid rgba(52,211,153,0.4);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">لاحقًا</button></div>';
  document.body.appendChild(bar);
  document.getElementById('sw-update-later').addEventListener('click',function(){bar.remove();});
  document.getElementById('sw-update-now').addEventListener('click',function(){
    swReloadPending=true;
    if(reg&&reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); else location.reload();
  });
}
function setupVersionBadge(){
  if(document.getElementById('app-version-badge')) return;
  var badge=document.createElement('button');
  badge.id='app-version-badge'; badge.type='button';
  badge.title='إصدار الموقع الحالي - اضغط للتحقق من وجود تحديث';
  badge.style.cssText='position:fixed;bottom:4px;inset-inline-start:10px;z-index:59;font-size:10px;font-weight:700;color:#94a3b8;background:rgba(15,10,12,0.6);border:1px solid rgba(148,163,184,0.25);border-radius:8px;cursor:pointer;opacity:0.85;padding:2px 8px;';
  badge.textContent='v'+APP_VERSION;
  badge.addEventListener('click',function(){
    if(!swRegistrationRef){ showToast('الإصدار الحالي: v'+APP_VERSION,'info'); return; }
    badge.textContent='…';
    swRegistrationRef.update().then(function(){
      setTimeout(function(){ badge.textContent='v'+APP_VERSION;
        if(!document.getElementById('sw-update-banner')) showToast('أنت على أحدث إصدار: v'+APP_VERSION,'info'); },2000);
    }).catch(function(){ badge.textContent='v'+APP_VERSION; showToast('تعذّر التحقق من التحديثات الآن.','warning'); });
  });
  document.body.appendChild(badge);
}
function setupPWA(){
  try{
    if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
      var hadController=!!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange',function(){
        if(swAutoReloaded) return;
        if(swReloadPending||hadController){ swAutoReloaded=true; location.reload(); }
      });
      navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(function(reg){
        swRegistrationRef=reg;
        reg.update().catch(function(){});
        document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') reg.update().catch(function(){}); });
        if(reg.waiting&&navigator.serviceWorker.controller) showUpdateBanner(reg);
        reg.addEventListener('updatefound',function(){
          var nw=reg.installing; if(!nw) return;
          nw.addEventListener('statechange',function(){
            if(nw.state==='installed'&&navigator.serviceWorker.controller) showUpdateBanner(reg);
          });
        });
      }).catch(function(){});
    }
    setupVersionBadge();
    window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); });
  }catch(err){ console.warn('PWA init notice:', err); }
}

/* ---------- init ---------- */
loadState();
applyTheme();
var qv=new URLSearchParams(location.search).get('view');
var VIEW_MAP={dashboard:'home',curriculum:'units',plan9m:'plan',freefordev:'tools',analysis:'analysis',report:'report',home:'home',units:'units',plan:'plan',tools:'tools',unit:'unit'};
if(qv&&VIEW_MAP[qv]) view=VIEW_MAP[qv];
var qu=parseInt(new URLSearchParams(location.search).get('unit')||'',10);
if(qu) { view='unit'; studyUnitId=qu; }
var qt=new URLSearchParams(location.search).get('tab');
if(qt&&['res','labs','notes'].indexOf(qt)>-1) unitTab=qt;
if(view==='unit'&&!studyUnitId) studyUnitId=continueUnit().id;
renderAll();
setupPWA();
})();
