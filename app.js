
    (function () {
      'use strict';

      // ---------------------------------------------------------------------------
      // 0. CONTENT DATASETS (loaded from data.js via window.MCA_DATA)
      // ---------------------------------------------------------------------------
      const UNITS_DATA = window.MCA_DATA.UNITS_DATA;
      const FREE_TOOLS_DIRECTORY = window.MCA_DATA.FREE_TOOLS_DIRECTORY;
      const MCA_MASCOT_TIPS = window.MCA_DATA.MCA_MASCOT_TIPS;

      // ---------------------------------------------------------------------------
      // 3. STATE MANAGEMENT & LOCALSTORAGE PERSISTENCE (SANDBOX-SAFE)
      // ---------------------------------------------------------------------------
      const STORAGE_KEY = 'mca_v5_state';

      function getDefaultState() {
        return {
          theme: 'dark',
          unitStatus: {},        // { [unitId]: 'not_started' | 'in_progress' | 'completed' }
          completedResources: {},// { [resourceId]: true }
          unitNotes: {},         // { [unitId]: string }
          streakDays: 0,
          lastStudyDate: null,   // 'YYYY-MM-DD'
          studyHistory: []       // ['YYYY-MM-DD']
        };
      }

      let appState = getDefaultState();

      function loadState() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            appState = Object.assign(getDefaultState(), parsed);
          }
        } catch (err) {
          console.warn('تعذر قراءة التخزين المحلي، يتم استخدام الحالة الافتراضية:', err);
        }
      }

      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        } catch (err) {
          console.warn('تعذر الحفظ في التخزين المحلي:', err);
        }
      }

      // ---------------------------------------------------------------------------
      // 4. UI FILTERS & NAVIGATION STATE
      // ---------------------------------------------------------------------------
      let currentView = 'dashboard';
      let filterState = {
        search: '',
        phase: 'all',
        status: 'all',
        difficulty: 'all',
        quick: 'all' // 'all' | 'dolfined' | 'aws' | 'multicloud' | 'hasnotes' | 'coursera'
      };

      // ---------------------------------------------------------------------------
      // 5. HELPER FUNCTIONS & CLEAR DISMISSIBLE TOASTS
      // ---------------------------------------------------------------------------
      function getTodayISO() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
      }

      function getUnitStatus(unitId) {
        return appState.unitStatus[unitId] || 'not_started';
      }

      function isResourceCompleted(resId) {
        return Boolean(appState.completedResources[resId]);
      }

      function showToast(message, type) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const isSuccess = type === 'success';
        const isWarning = type === 'warning' || type === 'error';

        const colorClasses = isSuccess
          ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
          : isWarning
          ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
          : 'bg-slate-900/95 border-brand-500/50 text-slate-100';

        const badgeTitle = isSuccess ? 'تم بنجاح' : isWarning ? 'تنبيه' : 'معلومة';

        toast.className = 'p-3.5 rounded-xl border shadow-2xl text-xs font-bold flex items-start justify-between gap-3 transition-all duration-300 ' + colorClasses;
        toast.innerHTML =
          '<div class="space-y-0.5">' +
            '<div class="text-[10px] underline opacity-80">' + badgeTitle + '</div>' +
            '<div class="leading-relaxed">' + message + '</div>' +
          '</div>' +
          '<button type="button" aria-label="إغلاق الإشعار" class="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] shrink-0">✖</button>';

        const closeBtn = toast.querySelector('button');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          });
        }

        container.appendChild(toast);
        setTimeout(function () {
          toast.style.opacity = '0';
          setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          }, 300);
        }, 4000);
      }

      // ---------------------------------------------------------------------------
      // 6. THEME MANAGEMENT (DARK / LIGHT MODE WITH PERSISTENCE)
      // ---------------------------------------------------------------------------
      function applyTheme() {
        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        const themeIcon = document.getElementById('theme-icon');
        const themeLabel = document.getElementById('theme-label');
        const metaTheme = document.getElementById('meta-theme-color');

        if (appState.theme === 'light') {
          htmlEl.classList.remove('dark');
          htmlEl.classList.add('light');
          bodyEl.className = 'bg-slate-50 text-slate-900 min-h-screen flex flex-col selection:bg-brand-500 selection:text-slate-950 transition-colors duration-200';
          if (themeIcon) themeIcon.textContent = '🌙';
          if (themeLabel) themeLabel.textContent = 'الوضع الليلي';
          if (metaTheme) metaTheme.setAttribute('content', '#f8fafc');
        } else {
          htmlEl.classList.remove('light');
          htmlEl.classList.add('dark');
          bodyEl.className = 'bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-brand-500 selection:text-slate-950 transition-colors duration-200';
          if (themeIcon) themeIcon.textContent = '☀️';
          if (themeLabel) themeLabel.textContent = 'الوضع النهاري';
          if (metaTheme) metaTheme.setAttribute('content', '#140a0d');
        }
      }

      function toggleTheme() {
        appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
        saveState();
        applyTheme();
        renderAll();
        showToast(
          appState.theme === 'dark'
            ? '🌙 تم تفعيل الوضع الليلي المريح لجلسات المذاكرة الطويلة'
            : '☀️ تم تفعيل الوضع النهاري عالي التباين',
          'info'
        );
      }

      // ---------------------------------------------------------------------------
      // 7. STREAK MANAGEMENT
      // ---------------------------------------------------------------------------
      function logStudySessionToday() {
        const today = getTodayISO();
        if (appState.lastStudyDate === today) {
          showToast('🔥 لقد سجّلت جلسة مذاكرة اليوم بالفعل! استمر في التقدم.', 'info');
          return;
        }

        if (appState.lastStudyDate) {
          const prev = new Date(appState.lastStudyDate + 'T00:00:00');
          const curr = new Date(today + 'T00:00:00');
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            appState.streakDays = (appState.streakDays || 0) + 1;
          } else if (diffDays > 1) {
            appState.streakDays = 1;
          } else {
            appState.streakDays = Math.max(1, appState.streakDays || 1);
          }
        } else {
          appState.streakDays = 1;
        }

        appState.lastStudyDate = today;
        if (!Array.isArray(appState.studyHistory)) appState.studyHistory = [];
        if (!appState.studyHistory.includes(today)) {
          appState.studyHistory.push(today);
        }
        saveState();
        updateDashboardStats();
        showToast('🔥 أحسنت يا مصطفى! تم تسجيل جلسة مذاكرة اليوم وتحديث سلسلة الاستمرارية.', 'success');
      }

      // ---------------------------------------------------------------------------
      // 8. PROGRESS CALCULATIONS & DASHBOARD STATS
      // ---------------------------------------------------------------------------
      function calculateMetrics() {
        const totalUnits = UNITS_DATA.length; // 27
        let completedCount = 0;
        let inProgressCount = 0;
        let notStartedCount = 0;

        let p1CompletedUnits = 0;
        let p1TotalHours = 0;
        let p1CompletedHours = 0;

        let totalResources = 0;
        let doneResources = 0;

        UNITS_DATA.forEach(function (u) {
          const st = getUnitStatus(u.id);
          const uResTotal = u.resources.length;
          let uResDone = 0;
          u.resources.forEach(function (r) {
            totalResources++;
            if (isResourceCompleted(r.id)) {
              doneResources++;
              uResDone++;
            }
          });

          if (st === 'completed') {
            completedCount++;
          } else if (st === 'in_progress') {
            inProgressCount++;
          } else {
            notStartedCount++;
          }

          if (u.phase === 1) {
            p1TotalHours += u.hours;
            if (st === 'completed') {
              p1CompletedUnits++;
              p1CompletedHours += u.hours;
            } else if (st === 'in_progress' && uResTotal > 0) {
              p1CompletedHours += Math.round(u.hours * (uResDone / uResTotal) * 0.7);
            }
          }
        });

        const overallPct = Math.round((completedCount / totalUnits) * 100);
        const p1Pct = Math.round((p1CompletedHours / p1TotalHours) * 100);
        const p1RemainingHours = Math.max(0, p1TotalHours - p1CompletedHours);
        const p1RemainingWeeks = (p1RemainingHours / 17).toFixed(1);
        const p1RemainingMonths = (p1RemainingHours / 68).toFixed(1);

        return {
          totalUnits: totalUnits,
          completedCount: completedCount,
          inProgressCount: inProgressCount,
          notStartedCount: notStartedCount,
          overallPct: overallPct,
          p1CompletedUnits: p1CompletedUnits,
          p1TotalHours: p1TotalHours,
          p1CompletedHours: p1CompletedHours,
          p1RemainingHours: p1RemainingHours,
          p1Pct: p1Pct,
          p1RemainingWeeks: p1RemainingWeeks,
          p1RemainingMonths: p1RemainingMonths,
          totalResources: totalResources,
          doneResources: doneResources
        };
      }

      function updateDashboardStats() {
        const m = calculateMetrics();

        const elOverallPct = document.getElementById('stat-overall-pct');
        const elOverallFrac = document.getElementById('stat-overall-fraction');
        const barOverall = document.getElementById('bar-overall-pct');
        const elResDone = document.getElementById('stat-resources-done');

        if (elOverallPct) elOverallPct.textContent = m.overallPct + '%';
        if (elOverallFrac) elOverallFrac.textContent = m.completedCount + ' / ' + m.totalUnits + ' وحدة';
        if (barOverall) barOverall.style.width = m.overallPct + '%';
        if (elResDone) elResDone.textContent = m.doneResources + ' من ' + m.totalResources + ' مصدر تعليمي وأداة مكتمل';

        const elP1Pct = document.getElementById('stat-p1-pct');
        const elP1Units = document.getElementById('stat-p1-units');
        const barP1 = document.getElementById('bar-p1-pct');
        const elP1Hours = document.getElementById('stat-p1-hours');

        if (elP1Pct) elP1Pct.textContent = m.p1Pct + '%';
        if (elP1Units) elP1Units.textContent = m.p1CompletedUnits + ' / 18 وحدة';
        if (barP1) barP1.style.width = m.p1Pct + '%';
        if (elP1Hours) {
          elP1Hours.textContent = 'متبقي ' + m.p1RemainingHours + ' ساعة من إجمالي ' + m.p1TotalHours + ' ساعة (9 أشهر)';
        }

        const elComp = document.getElementById('stat-count-completed');
        const elInProg = document.getElementById('stat-count-inprogress');
        const elNotSt = document.getElementById('stat-count-notstarted');
        if (elComp) elComp.textContent = String(m.completedCount);
        if (elInProg) elInProg.textContent = String(m.inProgressCount);
        if (elNotSt) elNotSt.textContent = String(m.notStartedCount);

        const elRemWeeks = document.getElementById('stat-remaining-weeks');
        const elP2Unlock = document.getElementById('stat-phase2-unlock');
        if (elRemWeeks) {
          elRemWeeks.textContent = m.p1RemainingWeeks + ' أسبوع دراسة متبقٍ ضمن 9 أشهر';
        }
        if (elP2Unlock) {
          if (m.p1CompletedUnits === 18) {
            elP2Unlock.textContent = '🔓 أحسنت! أتممت المرحلة 1 وأصبحت جاهزاً للمرحلة 2 (DevSecOps)';
            elP2Unlock.className = 'text-[11px] text-emerald-400 font-bold';
          } else {
            elP2Unlock.textContent = '🔒 المرحلة 2 (DevSecOps) تبدأ بعد إتمام وحدات المرحلة 1 الـ 18';
            elP2Unlock.className = 'text-[11px] text-slate-400';
          }
        }

        const elStreakDays = document.getElementById('stat-streak-days');
        const elStreakHeader = document.getElementById('streak-header-count');
        const elLastStudy = document.getElementById('stat-last-study');
        const today = getTodayISO();

        if (elStreakDays) elStreakDays.textContent = String(appState.streakDays || 0);
        if (elStreakHeader) elStreakHeader.textContent = (appState.streakDays || 0) + ' يوم';
        if (elLastStudy) {
          if (appState.lastStudyDate === today) {
            elLastStudy.textContent = '✅ تم تسجيل مذاكرة اليوم (' + today + ')';
            elLastStudy.className = 'text-[11px] text-emerald-400 mt-0.5 font-semibold';
          } else if (appState.lastStudyDate) {
            elLastStudy.textContent = 'آخر جلسة: ' + appState.lastStudyDate;
            elLastStudy.className = 'text-[11px] text-slate-400 mt-0.5';
          } else {
            elLastStudy.textContent = 'لم يتم تسجيل جلسة اليوم بعد';
            elLastStudy.className = 'text-[11px] text-slate-400 mt-0.5';
          }
        }
      }

      // ---------------------------------------------------------------------------
      // 9. FILTERING & RENDERING UNITS
      // ---------------------------------------------------------------------------
      function unitMatchesFilters(u) {
        const status = getUnitStatus(u.id);

        if (filterState.phase !== 'all' && String(u.phase) !== filterState.phase) {
          return false;
        }
        if (filterState.status !== 'all' && status !== filterState.status) {
          return false;
        }
        if (filterState.difficulty !== 'all' && u.difficulty !== filterState.difficulty) {
          return false;
        }

        if (filterState.quick === 'dolfined' && !u.hasDolfined) return false;
        if (filterState.quick === 'aws' && (u.phase !== 1 || u.id === 18)) return false;
        if (filterState.quick === 'multicloud' && u.id !== 18) return false;
        if (filterState.quick === 'hasnotes') {
          const note = (appState.unitNotes[u.id] || '').trim();
          if (!note) return false;
        }
        if (filterState.quick === 'coursera' && !u.courseraTag) return false;

        const q = filterState.search.trim().toLowerCase();
        if (q) {
          const haystack = [
            u.title,
            u.summary,
            u.cloudFocus,
            u.labTip,
            u.courseraTag,
            appState.unitNotes[u.id] || '',
            u.resources.map(function (r) { return r.title + ' ' + r.description + ' ' + (r.toolName || ''); }).join(' ')
          ].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      }

      function renderPlanGlance() {
        const strip = document.getElementById('plan-glance-strip');
        if (!strip) return;
        const countsEl = document.getElementById('plan-glance-counts');
        strip.innerHTML = '';
        let done = 0, doing = 0;
        UNITS_DATA.forEach(function (u) {
          const st = getUnitStatus(u.id);
          if (st === 'completed') done++;
          else if (st === 'in_progress') doing++;
          if (u.id === 19) {
            const sep = document.createElement('span');
            sep.style.cssText = 'width:1px;height:22px;background:#475569;margin:0 4px;';
            strip.appendChild(sep);
          }
          const tick = document.createElement('button');
          tick.type = 'button';
          tick.title = 'الوحدة ' + u.id + ' (الشهر ' + u.month + ') - ' + (st === 'completed' ? 'مكتملة ✅' : st === 'in_progress' ? 'قيد الدراسة 📖' : 'لم تبدأ');
          tick.setAttribute('aria-label', tick.title);
          tick.style.cssText = 'width:14px;height:' + (st === 'completed' ? '22px' : st === 'in_progress' ? '15px' : '9px') + ';border-radius:3px;border:none;cursor:pointer;padding:0;transition:transform 0.15s ease;' +
            (st === 'completed' ? 'background:#10b981;' : st === 'in_progress' ? 'background:#f59e0b;' : 'background:#334155;') +
            (u.phase === 2 ? 'opacity:0.55;' : '');
          tick.addEventListener('click', function () {
            openUnitStudy(u.id);
          });
          strip.appendChild(tick);
        });
        if (countsEl) countsEl.textContent = done + ' مكتملة • ' + doing + ' قيد الدراسة • ' + (UNITS_DATA.length - done - doing) + ' متبقية';
      }

      function setupQuickNav() {
        const nav = document.getElementById('quick-nav');
        if (!nav) return;
        nav.addEventListener('click', function (e) {
          const btn = e.target.closest('button[data-goto]');
          if (!btn) return;
          const target = btn.getAttribute('data-goto');
          if (target === 'plan9m' || target === 'report') {
            switchView(target);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          if (target === 'units') {
            switchView('curriculum');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          switchView('dashboard');
          setTimeout(function () {
            const el = document.getElementById('coursera-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        });
      }

      function renderUnits() {
        const container = document.getElementById('units-container');
        const emptyState = document.getElementById('units-empty-state');
        const counter = document.getElementById('search-results-counter');
        const resetBtn = document.getElementById('btn-reset-filters');
        if (!container) return;
        renderPlanGlance();
        renderContinueHero();

        const isFiltered =
          filterState.search.trim() !== '' ||
          filterState.phase !== 'all' ||
          filterState.status !== 'all' ||
          filterState.difficulty !== 'all' ||
          filterState.quick !== 'all';

        if (resetBtn) {
          if (isFiltered) resetBtn.classList.remove('hidden');
          else resetBtn.classList.add('hidden');
        }

        const filtered = UNITS_DATA.filter(unitMatchesFilters);

        if (counter) {
          counter.innerHTML = 'يتم عرض <strong class="text-brand-400">' + filtered.length + '</strong> من <strong class="text-white">' + UNITS_DATA.length + '</strong> وحدة تعليمية';
        }

        if (filtered.length === 0) {
          container.innerHTML = '';
          if (emptyState) emptyState.classList.remove('hidden');
          return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        // Group units into course modules (months 1-9, then DevSecOps phase)
        const moduleOrder = [];
        const moduleMap = {};
        filtered.forEach(function (u) {
          const key = u.phase === 1 ? 'm' + u.month : 'p2';
          if (!moduleMap[key]) { moduleMap[key] = []; moduleOrder.push(key); }
          moduleMap[key].push(u);
        });
        moduleOrder.sort(function (a, b) {
          if (a === 'p2') return 1;
          if (b === 'p2') return -1;
          return Number(a.slice(1)) - Number(b.slice(1));
        });

        // Default expansion: module of the first unfinished unit; all when filtering
        const firstOpen = UNITS_DATA.find(function (u) { return getUnitStatus(u.id) !== 'completed'; });
        const defaultKey = firstOpen ? (firstOpen.phase === 1 ? 'm' + firstOpen.month : 'p2') : moduleOrder[moduleOrder.length - 1];

        const moduleLabel = function (key) {
          return key === 'p2' ? 'مرحلة DevSecOps (المرحلة الثانية)' : 'الشهر ' + key.slice(1);
        };
        const moduleIcon = function (key) { return key === 'p2' ? '🛡️' : '📦'; };

        let html = '';
        moduleOrder.forEach(function (key) {
          const units = moduleMap[key];
          const allInModule = UNITS_DATA.filter(function (u) { return (u.phase === 1 ? 'm' + u.month : 'p2') === key; });
          const hours = allInModule.reduce(function (s, u) { return s + (u.hours || 0); }, 0);
          const done = allInModule.filter(function (u) { return getUnitStatus(u.id) === 'completed'; }).length;
          const doing = allInModule.filter(function (u) { return getUnitStatus(u.id) === 'in_progress'; }).length;
          const pct = allInModule.length ? Math.round(done / allInModule.length * 100) : 0;
          const isOpen = isFiltered ? true : (key === defaultKey);
          html += '<div class="kk-module' + (isOpen ? ' open' : '') + '" data-module="' + key + '">' +
            '<button type="button" class="kk-module-head" data-toggle-module="' + key + '" aria-expanded="' + isOpen + '">' +
              '<span class="kk-m-icon">' + moduleIcon(key) + '</span>' +
              '<span class="kk-m-body">' +
                '<span class="kk-m-title">' + moduleLabel(key) + '</span>' +
                '<span class="kk-m-meta">' + allInModule.length + ' وحدة • ' + hours + ' ساعة' + (done ? ' • ' + done + ' مكتملة ✅' : '') + (doing ? ' • ' + doing + ' قيد الدراسة' : '') + '</span>' +
                '<span class="kk-m-prog"><span style="width:' + pct + '%"></span></span>' +
              '</span>' +
              '<span class="kk-m-arrow"></span>' +
            '</button>' +
            '<div class="kk-lessons">' +
              units.map(function (u) {
                const st = getUnitStatus(u.id);
                const icon = st === 'completed' ? '✅' : st === 'in_progress' ? '📖' : '⭕';
                return '<button type="button" class="kk-lesson" data-study-unit="' + u.id + '">' +
                  '<span class="kk-l-status">' + icon + '</span>' +
                  '<span class="kk-l-title">' + u.title + '</span>' +
                  '<span class="kk-l-meta">⏱️ ' + u.hours + ' س • ' + u.difficulty + '</span>' +
                '</button>';
              }).join('') +
            '</div>' +
          '</div>';
        });

        container.innerHTML = html;

        if (currentView === 'unit' && studyUnitId !== null) renderUnitStudy();
      }

      // ---------------------------------------------------------------------------
      // 10b. UNIT STUDY MODE - focused single-unit learning view
      // ---------------------------------------------------------------------------
      let studyUnitId = null;

      function renderContinueHero() {
        const hero = document.getElementById('continue-hero');
        if (!hero) return;
        const next = UNITS_DATA.find(function (item) { return getUnitStatus(item.id) === 'in_progress'; }) ||
                     UNITS_DATA.find(function (item) { return getUnitStatus(item.id) !== 'completed'; });
        if (!next) { hero.style.display = 'none'; return; }
        hero.style.display = '';
        hero.innerHTML =
          '<span style="flex:0 0 auto;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);">▶</span>' +
          '<span style="flex:1 1 220px;min-width:0;">' +
            '<span style="display:block;font-size:11px;font-weight:800;color:#fca5a5;">' + (getUnitStatus(next.id) === 'in_progress' ? 'تابع من حيث توقفت' : 'الدرس التالي في خطتك') + '</span>' +
            '<span style="display:block;font-size:15px;font-weight:800;color:#f8fafc;margin-top:2px;">الوحدة ' + next.id + ': ' + next.title + '</span>' +
            '<span style="display:block;font-size:11px;color:#94a3b8;font-weight:700;margin-top:2px;">' + (next.phase === 1 ? 'الشهر ' + next.month : 'مرحلة DevSecOps') + ' • ⏱️ ' + next.hours + ' ساعة</span>' +
          '</span>' +
          '<button type="button" data-study-unit="' + next.id + '" style="flex:0 0 auto;padding:10px 20px;border-radius:14px;background:#ef4444;color:#0f172a;border:none;font-size:14px;font-weight:900;cursor:pointer;">ابدأ الدراسة ←</button>';
      }

      function openUnitStudy(id) {
        studyUnitId = id;
        renderUnitStudy();
        switchView('unit');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function renderUnitStudy() {
        const host = document.getElementById('unit-study-host');
        const navEl = document.getElementById('unit-study-nav');
        const u = UNITS_DATA.find(function (item) { return item.id === studyUnitId; });
        if (!u || !host) return;
        const isLight = appState.theme === 'light';
        const cardBg = isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900/90 border-slate-800 text-slate-100';
        const subBoxBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/75 border-slate-800/90';

        // Sibling lessons of the same module (course-content sidebar, KodeKloud style)
        const siblings = UNITS_DATA.filter(function (item) {
          return u.phase === 1 ? (item.phase === 1 && item.month === u.month) : item.phase === 2;
        });
        const sideTitle = u.phase === 1 ? 'دروس الشهر ' + u.month : 'دروس مرحلة DevSecOps';
        const sideHTML = '<div class="kk-side">' +
          '<button type="button" class="kk-side-head kk-side-toggle" data-toggle-side><span>📚 ' + sideTitle + ' (' + siblings.length + ' دروس)</span><span class="kk-side-caret">▾</span></button>' +
          '<div class="kk-side-list">' +
          siblings.map(function (item) {
            const st = getUnitStatus(item.id);
            const icon = st === 'completed' ? '✅' : st === 'in_progress' ? '📖' : '⭕';
            return '<button type="button" class="kk-lesson' + (item.id === u.id ? ' current' : '') + '" data-study-unit="' + item.id + '">' +
              '<span class="kk-l-status">' + icon + '</span>' +
              '<span class="kk-l-title">' + item.title + '</span>' +
              '<span class="kk-l-meta">⏱️ ' + item.hours + ' س</span>' +
            '</button>';
          }).join('') +
        '</div></div>';

        host.innerHTML = '<div class="kk-study-grid">' +
          sideHTML +
          '<div class="kk-main">' + buildUnitCardHTML(u, cardBg, subBoxBg, isLight) + '</div>' +
        '</div>';
        if (navEl) {
          const prev = UNITS_DATA.find(function (item) { return item.id === studyUnitId - 1; });
          const next = UNITS_DATA.find(function (item) { return item.id === studyUnitId + 1; });
          const mk = function (unit, label) {
            return unit
              ? '<button type="button" data-study-unit="' + unit.id + '" style="padding:8px 14px;border-radius:12px;background:rgba(239,68,68,0.12);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);font-size:12px;font-weight:800;cursor:pointer;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + label + ' الوحدة ' + unit.id + '</button>'
              : '<span></span>';
          };
          navEl.innerHTML = mk(prev, '→ السابقة:') + mk(next, 'التالية: ←');
        }
      }

      function buildUnitCardHTML(u, cardBg, subBoxBg, isLight) {
        const status = getUnitStatus(u.id);
        const noteText = appState.unitNotes[u.id] || '';
        const totalRes = u.resources.length;
        const doneRes = u.resources.filter(function (r) { return isResourceCompleted(r.id); }).length;
        const resPct = totalRes > 0 ? Math.round((doneRes / totalRes) * 100) : 0;

        const LABS_BY_UNIT = {
          1: [{n: 'Cisco Packet Tracer - مسارات NetAcad المجانية', u: 'https://www.netacad.com/catalogs/learn/cisco-packet-tracer', type: 'web', req: 'account', task: 'ابنِ شبكة من راوتر وجهازين وشغّل ping بينهما', note: 'حساب NetAcad مجاني؛ مثبّت لينكس موجّه لأوبونتو (على فيدورا خطوات إضافية)'}],
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

        const unitLabs = LABS_BY_UNIT[u.id] || [];
        const labsHTML = unitLabs.length ?
          '<div class="pt-3 space-y-2">' +
            '<div class="text-xs font-bold ' + (isLight ? 'text-emerald-700' : 'text-emerald-300') + '">🧪 تطبيق عملي مجاني - تمارين ومعامل تفتح على مواقعها أو محليًا على أجهزتك</div>' +
            unitLabs.map(function (l) {
              const typeBadge = l.type === 'web' ? '🌐 معمل متصفح' : '💻 تمرين محلي';
              const reqBadge = l.req === 'none' ? 'بدون حساب' : 'حساب مجاني (بدون كارت)';
              const nameHTML = l.u
                ? '<a href="' + l.u + '" target="_blank" rel="noopener noreferrer" class="font-bold underline decoration-dotted underline-offset-4 ' + (isLight ? 'text-emerald-700' : 'text-emerald-300') + '">' + l.n + ' ↗</a>'
                : '<span class="font-bold ' + (isLight ? 'text-slate-800' : 'text-slate-100') + '">' + l.n + '</span>';
              return '<div class="p-2.5 rounded-xl border text-xs space-y-1.5 ' + (isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-500/25') + '">' +
                '<div class="flex flex-wrap items-center gap-x-2 gap-y-1">' +
                  '<span style="flex:1 1 200px;">' + nameHTML + '</span>' +
                  '<span class="px-2 py-0.5 rounded-full border text-[10px] font-bold ' + (isLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-900/70 border-slate-700 text-slate-300') + '">' + typeBadge + '</span>' +
                  '<span class="px-2 py-0.5 rounded-full border text-[10px] font-bold ' + (isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300') + '">' + reqBadge + '</span>' +
                '</div>' +
                '<div class="' + (isLight ? 'text-slate-700' : 'text-slate-300') + '">🎯 ' + l.task + (l.note ? ' <span class="' + (isLight ? 'text-slate-500' : 'text-slate-400') + '">(' + l.note + ')</span>' : '') + '</div>' +
              '</div>';
            }).join('') +
          '</div>' : '';

        let statusBadge = '';
        let statusBorder = '';
        if (status === 'completed') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✅ مكتملة</span>';
          statusBorder = 'border-r-4 border-r-emerald-500';
        } else if (status === 'in_progress') {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">⏳ قيد الدراسة</span>';
          statusBorder = 'border-r-4 border-r-amber-500';
        } else {
          statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">⭕ لم تبدأ</span>';
          statusBorder = u.phase === 1 ? 'border-r-4 border-r-brand-500/60' : 'border-r-4 border-r-teal-500/60';
        }

        const diffColor =
          u.difficulty === 'مبتدئ'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : u.difficulty === 'متوسط'
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

        const prereqHTML = u.prerequisites.length === 0
          ? '<span class="text-emerald-400 font-semibold">لا توجد متطلبات سابقة (نقطة البداية)</span>'
          : u.prerequisites.map(function (pid) {
              return '<button type="button" data-scroll-unit="' + pid + '" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-slate-200 font-mono text-[11px] transition">الوحدة ' + pid + '</button>';
            }).join(' ');

        const nextUnitHTML = u.nextUnit
          ? '<button type="button" data-scroll-unit="' + u.nextUnit + '" class="px-2.5 py-0.5 rounded bg-brand-500/15 hover:bg-brand-500 hover:text-slate-950 text-brand-400 border border-brand-500/30 font-bold text-[11px] transition">الانتقال إلى الوحدة ' + u.nextUnit + ' ←</button>'
          : '<span class="text-emerald-400 font-bold">🎉 ختام المسار الكامل (جاهز لسوق العمل)</span>';

        const dolfinedAlertHTML = !u.hasDolfined
          ? '<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center gap-2">' +
              '<span>' + u.dolfinedNote + '</span>' +
              '<span class="text-slate-400 font-normal">— تم توفير بديل عربي احترافي ومجاني بالأسفل.</span>' +
            '</div>'
          : '<div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">' +
              '<span>🎥 يتوفر فيديو أساسي مباشر من قناة dolfined لهذه الوحدة</span>' +
            '</div>';

        const resourcesHTML = u.resources.map(function (r) {
          const checked = isResourceCompleted(r.id);
          let langBadge = '';
          if (r.lang === 'ar') {
            langBadge = '<span class="ar-tag">ar-tag • مصدر عربي' + (r.isDolfined ? ' (dolfined 🎥)' : '') + '</span>';
          } else if (r.lang === 'en') {
            langBadge = '<span class="en-tag">en-tag • English Resource</span>';
          } else {
            langBadge = '<span class="free-tag">free-for.dev • أداة مجانية</span>';
          }

          return '<div class="p-3.5 rounded-xl border transition ' + subBoxBg + ' ' + (checked ? 'border-emerald-500/40 bg-emerald-950/10' : '') + '">' +
            '<div class="flex items-start gap-3">' +
              '<input type="checkbox" id="chk-' + r.id + '" data-res-id="' + r.id + '" data-unit-id="' + u.id + '" ' + (checked ? 'checked' : '') + ' class="res-checkbox mt-1 w-4 h-4 rounded accent-brand-500 cursor-pointer shrink-0" />' +
              '<div class="flex-1 min-w-0 space-y-1">' +
                '<div class="flex flex-wrap items-center justify-between gap-2">' +
                  '<label for="chk-' + r.id + '" class="text-xs sm:text-sm font-bold cursor-pointer ' + (checked ? 'line-through text-slate-400' : (isLight ? 'text-slate-900' : 'text-white')) + '">' +
                    r.title +
                  '</label>' +
                  langBadge +
                '</div>' +
                '<p class="text-xs text-slate-400 leading-relaxed">' + r.description + '</p>' +
                sessionHintForResource(r) +
                '<div class="pt-1 flex items-center gap-3">' +
                  '<a href="' + r.url + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:underline">' +
                    '<span>فتح المصدر / الأداة في علامة تبويب جديدة</span>' +
                    '<span>↗</span>' +
                  '</a>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        return '<article id="unit-card-' + u.id + '" class="card-transition rounded-2xl border p-5 space-y-4 ' + cardBg + ' ' + statusBorder + '">' +
          '<div class="flex flex-col lg:flex-row lg:items-start justify-between gap-3">' +
            '<div class="space-y-1.5">' +
              '<div class="flex flex-wrap items-center gap-2">' +
                '<span class="px-2.5 py-0.5 rounded-lg bg-slate-800 text-brand-400 font-mono text-xs font-bold border border-slate-700">' +
                  (u.phase === 1 ? 'المرحلة 1 • الشهر ' + u.month : 'المرحلة 2 • DevSecOps') +
                '</span>' +
                '<span class="px-2.5 py-0.5 rounded-lg text-xs font-bold border ' + diffColor + '">' +
                  'المستوى: ' + u.difficulty +
                '</span>' +
                '<span class="px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-slate-200 text-xs font-mono border border-slate-700">' +
                  '⏱️ ' + u.hours + ' ساعة تدريبية' +
                '</span>' +
                '<span class="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/25">' +
                  '☁️ ' + u.cloudFocus +
                '</span>' +
                (u.courseraTag ? '<span class="px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-semibold border border-blue-500/30">🎓 ' + u.courseraTag + '</span>' : '') +
              '</div>' +
              '<h3 class="text-base sm:text-lg font-extrabold ' + (isLight ? 'text-slate-900' : 'text-white') + '">' + u.title + '</h3>' +
            '</div>' +

            '<div class="flex items-center gap-2 shrink-0 self-start">' +
              '<button type="button" data-study-unit="' + u.id + '" style="padding:6px 12px;border-radius:12px;background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.35);font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;">🎯 دراسة</button>' +
              statusBadge +
              '<label for="status-select-' + u.id + '" class="sr-only">تغيير حالة الوحدة ' + u.id + '</label>' +
              '<select id="status-select-' + u.id + '" data-unit-status="' + u.id + '" class="unit-status-select px-3 py-1.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-700 text-xs font-bold focus:border-brand-500 focus:outline-none cursor-pointer">' +
                '<option value="not_started" ' + (status === 'not_started' ? 'selected' : '') + '>تحديد: لم تبدأ</option>' +
                '<option value="in_progress" ' + (status === 'in_progress' ? 'selected' : '') + '>تحديد: قيد الدراسة</option>' +
                '<option value="completed" ' + (status === 'completed' ? 'selected' : '') + '>تحديد: مكتملة ✓</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<p class="text-xs sm:text-sm text-slate-300 leading-relaxed">' + u.summary + '</p>' +

          '<div class="p-3 rounded-xl bg-blue-950/30 border border-blue-500/25 text-xs text-blue-200 flex items-start gap-2.5">' +
            '<span class="text-base shrink-0">🛠️</span>' +
            '<div><strong class="text-blue-300">تطبيق على عتاد مصطفى (Fedora Workstation & Rocky Linux Lab):</strong> ' + u.labTip + '</div>' +
          '</div>' +

          dolfinedAlertHTML +

          '<div class="space-y-2.5 pt-1">' +
            '<div class="flex items-center justify-between text-xs">' +
              '<span class="font-bold text-slate-300">📚 المصادر التعليمية وأداة free-for.dev المخصصة للوحدة (' + doneRes + ' / ' + totalRes + ' مكتمل)</span>' +
              '<span class="font-mono text-brand-400">' + resPct + '%</span>' +
            '</div>' +
            '<div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">' +
              '<div class="h-full bg-emerald-500 transition-all duration-300" style="width: ' + resPct + '%"></div>' +
            '</div>' +
            '<div class="grid grid-cols-1 gap-2.5 pt-1">' +
              resourcesHTML +
            '</div>' +
          '</div>' +

          labsHTML +

          '<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-800/80 items-start">' +
            '<div class="lg:col-span-7 space-y-1.5">' +
              '<div class="flex items-center justify-between text-xs">' +
                '<label for="note-unit-' + u.id + '" class="font-bold text-slate-300 flex items-center gap-1.5">' +
                  '<span>📝</span>' +
                  '<span>ملاحظات وتلخيصات مصطفى لهذه الوحدة (حفظ تلقائي فوري)</span>' +
                '</label>' +
                '<span id="note-status-' + u.id + '" class="text-[11px] text-emerald-400 font-medium">' +
                  (noteText.trim() ? '✓ محفوظة محلياً' : 'جاهز للكتابة') +
                '</span>' +
              '</div>' +
              '<textarea id="note-unit-' + u.id + '" data-unit-note="' + u.id + '" rows="2" placeholder="اكتب هنا أهم الأوامر، روابط مشاريعك على GitHub، أو النقاط التي تود مراجعتها لاحقاً..." class="unit-note-textarea w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-brand-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500">' +
                escapeHTML(noteText) +
              '</textarea>' +
            '</div>' +

            '<div class="lg:col-span-5 p-3 rounded-xl ' + subBoxBg + ' border space-y-2 text-xs">' +
              '<div class="flex items-center justify-between gap-2">' +
                '<span class="text-slate-400 font-semibold">المتطلبات السابقة:</span>' +
                '<div class="flex flex-wrap gap-1">' + prereqHTML + '</div>' +
              '</div>' +
              '<div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">' +
                '<span class="text-slate-400 font-semibold">الوحدة التالية الموصى بها:</span>' +
                '<div>' + nextUnitHTML + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</article>';
      }

      function parseResourceHours(title) {
        const t = String(title || '');
        let m = t.match(/(\d+)\s*ساعات?\s*و\s*(\d+)\s*دقيقة|(\d+)\s*ساعات?\s*و\s*(\d+)\s*دقائق/);
        if (m) { const h = parseInt(m[1] || m[3], 10); const mm = parseInt(m[2] || m[4], 10); return h + mm / 60; }
        m = t.match(/(\d+)\s*ساعات/);
        if (m) return parseInt(m[1], 10);
        m = t.match(/(\d+)\s*ساعة(?! )/);
        if (m) return parseInt(m[1], 10);
        m = t.match(/(\d+)\s*دقيقة/);
        if (m) return parseInt(m[1], 10) / 60;
        return 0;
      }

      function sessionHintForResource(r) {
        if (r.type !== 'video' && r.type !== 'course') return '';
        const h = parseResourceHours(r.title);
        if (!h || h <= 2.75) return '';
        const sessions = Math.ceil(h / 2.75);
        const hTxt = h >= 1 ? '~' + (Math.round(h * 10) / 10) + ' ساعة' : '~' + Math.round(h * 60) + ' دقيقة';
        if (r.type === 'course') return '<p class="text-[11px] text-sky-300/90 bg-sky-500/10 border border-sky-500/25 rounded-lg px-2 py-1 mt-1">⏱️ برنامج تدريبي متعدد الوحدات (المدة التقديرية ' + hTxt + '): تابع وحداته الرسمية بالترتيب وطبّق عمليًا بعد كل وحدة.</p>';
        if (r.sessionPlan) return '<p class="text-[11px] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2 py-1 mt-1">⏱️ فيديو طويل (المدة المعلنة ' + hTxt + '): ' + r.sessionPlan + '</p>';
        return '<p class="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1 mt-1">⏱️ فيديو طويل (المدة المعلنة ' + hTxt + '): تقسيم استرشادي إلى ' + sessions + ' جلسات × 2-3 ساعات (لم نجد فصول مرقّمة في وصف الفيديو، فهذا تقسيم مقترح غير موثّق) — طبّق عمليًا بعد كل جلسة حتى لا تتيه داخله.</p>';
      }

      function escapeHTML(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      // ---------------------------------------------------------------------------
      // 10. RENDER 9-MONTH PLAN TABLE, FREE-FOR.DEV TABLE, AND REPORT VIEW
      // ---------------------------------------------------------------------------
      function renderPlan9mTable() {
        const tbody = document.getElementById('plan-9m-tbody');
        if (!tbody) return;

        const monthsDesc = [
          { m: 1, focus: 'أساسيات الشبكات (TCP/IP, DNS) + مدخل خدمات AWS الأساسية (IAM, EC2, S3)' },
          { m: 2, focus: 'تأسيس وإدارة Linux المتقدمة على مختبر Rocky Linux Minimal + Kickstart و AWS EC2' },
          { m: 3, focus: 'أتمتة المهام بـ Bash Scripting + إتقان Git و GitHub لبناء معرض الأعمال' },
          { m: 4, focus: 'أتمتة سحابة AWS بلغة Python (Boto3) + شبكات VPC المتقدمة وقواعد البيانات RDS/DynamoDB' },
          { m: 5, focus: 'إتقان لغة YAML + حاويات Docker & Compose + تنسيق الحاويات بـ Kubernetes و AWS EKS' },
          { m: 6, focus: 'البنية التحتية ككود بـ Terraform (شهادة Associate) + معمارية AWS SAA-C03 المتقدمة' },
          { m: 7, focus: 'أنابيب CI/CD الشاملة باستخدام GitHub Actions و Jenkins و GitLab CI/CD' },
          { m: 8, focus: 'الرصد والمراقبة (Prometheus, Grafana, CloudWatch) + إدارة التهيئة بـ Ansible (RHCE)' },
          { m: 9, focus: 'مشروع التخرج الإنتاجي على AWS + الوعي متعدد السحابات (Azure AZ-900 & Google Cloud)' }
        ];

        tbody.innerHTML = monthsDesc.map(function (item) {
          const mUnits = UNITS_DATA.filter(function (u) { return u.phase === 1 && u.month === item.m; });
          const totalH = mUnits.reduce(function (acc, u) { return acc + u.hours; }, 0);
          const weeklyH = (totalH / 4).toFixed(1);
          const allDone = mUnits.every(function (u) { return getUnitStatus(u.id) === 'completed'; });
          const anyStarted = mUnits.some(function (u) { return getUnitStatus(u.id) !== 'not_started'; });

          const badge = allDone
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">✅ مكتمل</span>'
            : anyStarted
            ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">⏳ جاري العمل</span>'
            : '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">مجدول</span>';

          const unitTitles = mUnits.map(function (u) { return 'الوحدة ' + u.id + ' (' + u.hours + ' س)'; }).join(' + ');

          return '<tr>' +
            '<td class="py-3 px-4 font-extrabold text-brand-400 whitespace-nowrap">الشهر ' + item.m + '</td>' +
            '<td class="py-3 px-4 font-semibold text-white whitespace-nowrap">' + unitTitles + '</td>' +
            '<td class="py-3 px-4 text-slate-300">' + item.focus + '</td>' +
            '<td class="py-3 px-4 font-mono text-white whitespace-nowrap">' + totalH + ' ساعة</td>' +
            '<td class="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">' + weeklyH + ' ساعة/أسبوع</td>' +
            '<td class="py-3 px-4 whitespace-nowrap">' + badge + '</td>' +
          '</tr>';
        }).join('');
        renderWeeksPlan();
      }

      // ---------------------------------------------------------------------------
      // 10b. RENDER 4-WEEK MONTHLY BREAKDOWN WITH STUDY SESSIONS
      // ---------------------------------------------------------------------------
      function buildWeeksForMonth(monthNum) {
        const mUnits = UNITS_DATA.filter(function (u) { return u.month === monthNum; });
        if (!mUnits.length) return [];
        const totalH = mUnits.reduce(function (a, u) { return a + u.hours; }, 0);
        const weeks = [0, 1, 2, 3].map(function (i) {
          return { n: i + 1, startH: (totalH * i) / 4, endH: (totalH * (i + 1)) / 4, units: [], hours: Math.round(totalH / 4) };
        });
        let cursor = 0;
        mUnits.forEach(function (u) {
          const uStart = cursor, uEnd = cursor + u.hours;
          cursor = uEnd;
          weeks.forEach(function (w) {
            const overlap = Math.min(w.endH, uEnd) - Math.max(w.startH, uStart);
            if (overlap > 0.5) {
              w.units.push({ u: u, fromH: Math.round(Math.max(w.startH, uStart) - uStart), toH: Math.round(Math.min(w.endH, uEnd) - uStart), partH: Math.round(overlap) });
            }
          });
        });
        return weeks;
      }

      function renderWeeksPlan() {
        const select = document.getElementById('select-weeks-month');
        const grid = document.getElementById('plan-weeks-grid');
        if (!select || !grid) return;
        if (!select.options.length) {
          const months = [];
          UNITS_DATA.forEach(function (u) { if (months.indexOf(u.month) === -1) months.push(u.month); });
          months.sort(function (a, b) { return a - b; });
          months.forEach(function (m) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = (m <= 9 ? 'المرحلة 1 — الشهر ' + m : 'المرحلة 2 (DevSecOps) — الشهر ' + m);
            select.appendChild(opt);
          });
          select.addEventListener('change', renderWeeksPlan);
        }
        const m = parseInt(select.value || '1', 10);
        const weeks = buildWeeksForMonth(m);
        grid.innerHTML = weeks.map(function (w) {
          const sessions = Math.max(2, Math.round(w.hours / 2.75));
          const unitBits = w.units.map(function (x) {
            const status = getUnitStatus(x.u.id);
            const statusTxt = status === 'completed' ? '✅ ' : status === 'not_started' ? '' : '⏳ ';
            return '<li class="space-y-0.5">' +
              '<div class="font-semibold text-slate-200">' + statusTxt + 'الوحدة ' + x.u.id + ': ' + escapeHTML(x.u.title.replace(/^الوحدة \d+:\s*/, '')) + '</div>' +
              '<div class="text-[11px] text-slate-400">الجزء المخصص هذا الأسبوع: ~' + x.partH + ' ساعة (الساعات ' + x.fromH + ' إلى ' + x.toH + ' من خطة الوحدة)</div>' +
            '</li>';
          }).join('');
          return '<div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">' +
            '<div class="flex items-center justify-between">' +
              '<span class="font-extrabold text-brand-400 text-sm">الأسبوع ' + w.n + '</span>' +
              '<span class="text-[11px] font-mono text-slate-400">~' + w.hours + ' ساعة = ' + sessions + ' جلسات</span>' +
            '</div>' +
            '<ul class="space-y-2 text-xs">' + unitBits + '</ul>' +
            '<div class="text-[11px] text-slate-500 border-t border-slate-800/70 pt-1.5">مقترح: ' + sessions + ' جلسات × 2-3 ساعات توزّعها على أيامك (الجلسة = مشاهدة/قراءة + تطبيق فوري على جهازك وخادم المختبر)، وآخر جلسة للمراجعة والتثبيت.</div>' +
          '</div>';
        }).join('');
      }

      function renderFreeForDevTable() {
        const tbody = document.getElementById('freefordev-tbody');
        const selectCat = document.getElementById('select-free-category');
        if (!tbody) return;

        const selectedCategory = selectCat ? selectCat.value : 'all';
        const items = FREE_TOOLS_DIRECTORY.filter(function (item) {
          return selectedCategory === 'all' || item.category === selectedCategory;
        });

        tbody.innerHTML = items.map(function (item) {
          return '<tr class="hover:bg-slate-800/40 transition">' +
            '<td class="py-3 px-4 font-extrabold text-white">' + item.name + '</td>' +
            '<td class="py-3 px-4"><span class="free-tag">' + item.category + '</span></td>' +
            '<td class="py-3 px-4 text-slate-300 leading-relaxed">' + item.limits + '</td>' +
            '<td class="py-3 px-4 text-slate-300">' + item.usage + '</td>' +
            '<td class="py-3 px-4 font-mono text-brand-400 whitespace-nowrap">' + item.units + '</td>' +
            '<td class="py-3 px-4 whitespace-nowrap">' +
              '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline font-bold">فتح ↗</a>' +
            '</td>' +
          '</tr>';
        }).join('');
      }

      function renderReportView() {
        const m = calculateMetrics();
        const dateEl = document.getElementById('report-date-stamp');
        if (dateEl) {
          dateEl.textContent = 'تاريخ التقرير: ' + getTodayISO();
        }

        const metricsEl = document.getElementById('report-summary-metrics');
        if (metricsEl) {
          metricsEl.innerHTML =
            '<div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">' +
              '<div class="text-xs text-slate-400">الإنجاز الكلي للمسار</div>' +
              '<div class="text-xl font-extrabold text-white font-mono mt-1">' + m.overallPct + '% (' + m.completedCount + '/27)</div>' +
            '</div>' +
            '<div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">' +
              '<div class="text-xs text-slate-400">إنجاز المرحلة 1 (9 أشهر AWS)</div>' +
              '<div class="text-xl font-extrabold text-brand-400 font-mono mt-1">' + m.p1Pct + '% (' + m.p1CompletedHours + '/' + m.p1TotalHours + ' س)</div>' +
            '</div>' +
            '<div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">' +
              '<div class="text-xs text-slate-400">المصادر الفردية المكتملة</div>' +
              '<div class="text-xl font-extrabold text-emerald-400 font-mono mt-1">' + m.doneResources + ' / ' + m.totalResources + '</div>' +
            '</div>' +
            '<div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">' +
              '<div class="text-xs text-slate-400">سلسلة الاستمرارية (Streak)</div>' +
              '<div class="text-xl font-extrabold text-amber-400 font-mono mt-1">' + (appState.streakDays || 0) + ' يوم</div>' +
            '</div>';
        }

        const dolfinedUnits = UNITS_DATA.filter(function (u) { return u.hasDolfined; });
        const nonDolfinedUnits = UNITS_DATA.filter(function (u) { return !u.hasDolfined; });

        const dolfinedSummaryEl = document.getElementById('report-dolfined-summary');
        if (dolfinedSummaryEl) {
          dolfinedSummaryEl.innerHTML =
            '<div>• <strong>الوحدات التي حصلت على فيديو مباشر من قناة dolfined:</strong> <span class="text-emerald-400 font-bold">' + dolfinedUnits.length + ' وحدات</span> (الوحدات: ' + dolfinedUnits.map(function (u) { return u.id; }).join('، ') + ')</div>' +
            '<div>• <strong>الوحدات التي لم يتوفر لها فيديو مباشر في القناة (وتم تزويدها ببديل عربي موثق مع التنبيه القياسي):</strong> <span class="text-amber-400 font-bold">' + nonDolfinedUnits.length + ' وحدة</span> (الوحدات: ' + nonDolfinedUnits.map(function (u) { return u.id; }).join('، ') + ')</div>';
        }

        const freeSummaryEl = document.getElementById('report-freefordev-summary');
        if (freeSummaryEl) {
          freeSummaryEl.innerHTML =
            '<div>• <strong>عدد الوحدات التي حصلت على أداة مجانية مخصصة من free-for.dev:</strong> <span class="text-purple-400 font-bold">27 من 27 وحدة (تغطية 100%)</span></div>' +
            '<div>• بالإضافة إلى <strong>20 منصة وأداة مجانية رئيسية</strong> مصنفة في جدول دليل أدوات free-for.dev الشامل.</div>';
        }

        const reportTbody = document.getElementById('report-units-tbody');
        if (reportTbody) {
          reportTbody.innerHTML = UNITS_DATA.map(function (u) {
            const st = getUnitStatus(u.id);
            const stLabel = st === 'completed' ? '✅ مكتملة' : st === 'in_progress' ? '⏳ قيد الدراسة' : '⭕ لم تبدأ';
            const doneR = u.resources.filter(function (r) { return isResourceCompleted(r.id); }).length;
            const note = (appState.unitNotes[u.id] || '').trim() || '—';
            return '<tr>' +
              '<td class="py-2 px-3 font-mono font-bold">' + u.id + '</td>' +
              '<td class="py-2 px-3 font-bold text-white">' + u.title + '</td>' +
              '<td class="py-2 px-3 whitespace-nowrap">' + (u.phase === 1 ? 'المرحلة 1 (شهر ' + u.month + ')' : 'المرحلة 2 (DevSecOps)') + '</td>' +
              '<td class="py-2 px-3 font-mono whitespace-nowrap">' + u.hours + ' س</td>' +
              '<td class="py-2 px-3 font-mono whitespace-nowrap">' + doneR + ' / ' + u.resources.length + '</td>' +
              '<td class="py-2 px-3 whitespace-nowrap">' + stLabel + '</td>' +
              '<td class="py-2 px-3 text-slate-300">' + escapeHTML(note) + '</td>' +
            '</tr>';
          }).join('');
        }
      }

      // ---------------------------------------------------------------------------
      // 11. NAVIGATION SWITCHING
      // ---------------------------------------------------------------------------
      function switchView(viewName) {
        currentView = viewName;
        document.body.classList.toggle('study-mode', viewName === 'unit');
        const views = ['dashboard', 'curriculum', 'unit', 'plan9m', 'analysis', 'freefordev', 'report'];
        views.forEach(function (v) {
          const el = document.getElementById('view-' + v);
          if (el) {
            if (v === viewName) el.classList.remove('hidden');
            else el.classList.add('hidden');
          }
        });

        document.querySelectorAll('.nav-tab').forEach(function (btn) {
          const target = btn.getAttribute('data-nav');
          if (target === viewName) {
            btn.className = 'nav-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 bg-brand-500 text-slate-950 shadow-sm';
          } else {
            btn.className = 'nav-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800';
          }
        });

        if (viewName === 'plan9m') renderPlan9mTable();
        if (viewName === 'freefordev') renderFreeForDevTable();
        if (viewName === 'report') renderReportView();
      }

      // ---------------------------------------------------------------------------
      // 12. EXPORT / IMPORT JSON, MARKDOWN REPORT & PWA DEPLOYMENT ASSETS
      // ---------------------------------------------------------------------------
      function downloadBlobFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      function exportProgressJSON() {
        const payload = {
          app: 'Mostafa Cloud & DevOps Learning PWA',
          version: '2.0.0-offline',
          exportedAt: new Date().toISOString(),
          state: appState
        };
        downloadBlobFile(
          JSON.stringify(payload, null, 2),
          'mostafa-cloud-devops-progress-' + getTodayISO() + '.json',
          'application/json;charset=utf-8'
        );
        showToast('💾 تم تصدير ملف التقدم (JSON) بنجاح! يمكنك نقله لأي جهاز آخر.', 'success');
      }

      function copyProgressJSON() {
        const payload = {
          app: 'Mostafa Cloud & DevOps Learning PWA',
          version: '2.0.0-offline',
          exportedAt: new Date().toISOString(),
          state: appState
        };
        const jsonStr = JSON.stringify(payload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(jsonStr).then(function () {
            showToast('📋 تم نسخ كود التقدم (JSON) إلى الحافظة بنجاح!', 'success');
          }).catch(function () {
            fallbackCopyText(jsonStr);
          });
        } else {
          fallbackCopyText(jsonStr);
        }
      }

      function fallbackCopyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          showToast('📋 تم نسخ كود التقدم (JSON) إلى الحافظة بنجاح!', 'success');
        } catch (e) {
          showToast('⚠️ تعذر النسخ التلقائي، يرجى استخدام زر تحميل ملف JSON.', 'warning');
        }
        document.body.removeChild(ta);
      }

      function importProgressJSON(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            const parsed = JSON.parse(evt.target.result);
            const incomingState = parsed.state ? parsed.state : parsed;
            if (typeof incomingState !== 'object' || incomingState === null) {
              throw new Error('ملف غير صالح');
            }
            appState = Object.assign(getDefaultState(), incomingState);
            saveState();
            applyTheme();
            renderAll();
            showToast('✅ تم استيراد بيانات التقدم والملاحظات بنجاح!', 'success');
          } catch (err) {
            showToast('⚠️ الملف المختار ليس ملف JSON صالحاً لتقدم المسار.', 'warning');
          }
        };
        reader.readAsText(file);
      }

      function exportMarkdownReport() {
        const m = calculateMetrics();
        let md = '# تقرير التقدم الدراسي – مسار مصطفى السحابي (AWS & DevOps & DevSecOps)\n\n';
        md += '- **تاريخ التقرير:** ' + getTodayISO() + '\n';
        md += '- **الإنجاز الكلي:** ' + m.overallPct + '% (' + m.completedCount + ' من ' + m.totalUnits + ' وحدة)\n';
        md += '- **تقدم المرحلة 1 (خطة الـ 9 أشهر - AWS):** ' + m.p1Pct + '% (' + m.p1CompletedHours + ' من ' + m.p1TotalHours + ' ساعة)\n';
        md += '- **سلسلة أيام المذاكرة (Streak):** ' + (appState.streakDays || 0) + ' يوم\n\n';
        md += '## تفاصيل الوحدات والملاحظات\n\n';
        UNITS_DATA.forEach(function (u) {
          const st = getUnitStatus(u.id);
          const stAr = st === 'completed' ? 'مكتملة' : st === 'in_progress' ? 'قيد الدراسة' : 'لم تبدأ';
          const note = (appState.unitNotes[u.id] || '').trim();
          md += '### ' + u.title + '\n';
          md += '- **الحالة:** ' + stAr + ' | **الساعات:** ' + u.hours + ' ساعة\n';
          if (note) {
            md += '- **ملاحظات مصطفى:** ' + note + '\n';
          }
          md += '\n';
        });

        downloadBlobFile(
          md,
          'mostafa-progress-report-' + getTodayISO() + '.md',
          'text/markdown;charset=utf-8'
        );
        showToast('📄 تم تصدير تقرير التقدم بصيغة Markdown بنجاح!', 'success');
      }

      let deferredInstallPrompt = null;
      const APP_VERSION = '5.0.0';
      let swRegistrationRef = null;
      let swReloadPending = false;
      let swAutoReloaded = false;

      // Persistent, non-destructive update notice: reload happens only when the user taps the button.
      function showUpdateBanner(registration) {
        if (document.getElementById('sw-update-banner')) return;
        const bar = document.createElement('div');
        bar.id = 'sw-update-banner';
        bar.setAttribute('role', 'status');
        bar.style.cssText = 'position:fixed;bottom:14px;inset-inline-start:14px;z-index:70;max-width:320px;background:rgba(6,26,20,0.97);border:1px solid rgba(52,211,153,0.5);color:#a7f3d0;border-radius:14px;padding:10px 12px;font-size:12px;font-weight:700;line-height:1.6;box-shadow:0 10px 30px rgba(0,0,0,0.5);';
        bar.innerHTML =
          '<div>✨ وصل إصدار جديد من الموقع. تقدّمك وملاحظاتك محفوظة على جهازك ولن تُمسح بالتحديث.</div>' +
          '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button id="sw-update-now" type="button" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;cursor:pointer;">تحديث الآن</button>' +
            '<button id="sw-update-later" type="button" style="background:transparent;color:#a7f3d0;border:1px solid rgba(52,211,153,0.4);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">لاحقًا</button>' +
          '</div>';
        document.body.appendChild(bar);
        document.getElementById('sw-update-later').addEventListener('click', function () { bar.remove(); });
        document.getElementById('sw-update-now').addEventListener('click', function () {
          swReloadPending = true;
          if (registration && registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          else location.reload();
        });
      }

      // Small always-visible version badge; tapping it runs a manual update check.
      function setupVersionBadge() {
        if (document.getElementById('app-version-badge')) return;
        const badge = document.createElement('button');
        badge.id = 'app-version-badge';
        badge.type = 'button';
        badge.title = 'إصدار الموقع الحالي - اضغط للتحقق من وجود تحديث';
        badge.style.cssText = 'position:fixed;bottom:4px;inset-inline-start:10px;z-index:59;font-size:10px;font-weight:700;color:#94a3b8;background:rgba(15,10,12,0.6);border:1px solid rgba(148,163,184,0.25);border-radius:8px;cursor:pointer;opacity:0.85;padding:2px 8px;';
        badge.textContent = 'v' + APP_VERSION;
        badge.addEventListener('click', function () {
          if (!swRegistrationRef) { showToast('الإصدار الحالي: v' + APP_VERSION, 'info'); return; }
          badge.textContent = '…';
          swRegistrationRef.update().then(function () {
            setTimeout(function () {
              badge.textContent = 'v' + APP_VERSION;
              if (!document.getElementById('sw-update-banner')) {
                showToast('أنت على أحدث إصدار: v' + APP_VERSION, 'info');
              }
            }, 2000);
          }).catch(function () {
            badge.textContent = 'v' + APP_VERSION;
            showToast('تعذّر التحقق من التحديثات الآن - تحقق من الاتصال بالإنترنت.', 'warning');
          });
        });
        document.body.appendChild(badge);
      }

      function setupHardenedPWA() {
        try {
          // 1) Clean Production Service Worker Registration from Root (/sw.js) for Cloudflare Pages
          if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            // v4.5.2 hardened update path:
            // - updateViaCache:'none' bypasses GitHub Pages' 600s HTTP cache during sw.js update checks
            // - automatic update checks on load and whenever the app returns to the foreground
            // - a newly activated worker reloads the page automatically; progress, unit status and
            //   notes all live in localStorage under a stable key and notes autosave instantly
            const hadControllerAtLoad = !!navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener('controllerchange', function () {
              if (swAutoReloaded) return;
              if (swReloadPending || hadControllerAtLoad) {
                swAutoReloaded = true;
                location.reload();
              }
            });
            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (registration) {
              swRegistrationRef = registration;
              registration.update().catch(function () {});
              document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') registration.update().catch(function () {});
              });
              if (registration.waiting && navigator.serviceWorker.controller) showUpdateBanner(registration);
              registration.addEventListener('updatefound', function () {
                const newWorker = registration.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', function () {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateBanner(registration);
                  }
                });
              });
            }).catch(function () {
              // Silent fallback in restricted preview iframes where /sw.js is not served at root
            });
          }
          setupVersionBadge();
          setupQuickNav();
          const btnStudyBack = document.getElementById('btn-study-back');
          if (btnStudyBack) btnStudyBack.addEventListener('click', function () { switchView('curriculum'); });

          // 2) Support Manifest Shortcut URL Parameter (?view=dashboard | plan9m | freefordev | analysis | report)
          const params = new URLSearchParams(window.location.search);
          const initialView = params.get('view');
          if (initialView && ['dashboard', 'curriculum', 'plan9m', 'analysis', 'freefordev', 'report'].includes(initialView)) {
            switchView(initialView);
          }

          // 3) Live Online / Offline Status Indicator
          function updateConnectivityStatus() {
            const dot = document.getElementById('network-dot');
            const txt = document.getElementById('network-status-text');
            const badge = document.getElementById('pwa-status-badge');
            const isOnline = navigator.onLine !== false;
            if (isOnline) {
              if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
              if (txt) txt.textContent = 'متصل • جاهز للعمل دون إنترنت (Zero-CDN Offline)';
              if (badge) badge.className = 'inline-flex items-center gap-1.5 text-emerald-400 font-medium';
            } else {
              if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400';
              if (txt) txt.textContent = 'وضع عدم الاتصال نشط (Offline Mode) • كافة الميزات تعمل محلياً';
              if (badge) badge.className = 'inline-flex items-center gap-1.5 text-amber-300 font-bold';
            }
          }

          window.addEventListener('online', function () {
            updateConnectivityStatus();
            showToast('🌐 عاد الاتصال بالإنترنت. جميع بياناتك محفوظة محلياً.', 'success');
          });
          window.addEventListener('offline', function () {
            updateConnectivityStatus();
            showToast('⚡ أنت الآن في وضع عدم الاتصال (Offline). التطبيق يعمل بكامل ميزاته بدون إنترنت!', 'info');
          });
          updateConnectivityStatus();

          // 4) Capture Install Prompt
          window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferredInstallPrompt = e;
          });
        } catch (err) {
          console.warn('PWA initialization notice:', err);
        }
      }

      function handleInstallClick() {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          deferredInstallPrompt.userChoice.then(function (choice) {
            if (choice && choice.outcome === 'accepted') {
              showToast('🎉 تم تثبيت أكاديمية مصطفى السحابية بنجاح على جهازك!', 'success');
            }
            deferredInstallPrompt = null;
          });
        } else {
          const modalGuide = document.getElementById('modal-pwa-guide');
          if (modalGuide) modalGuide.classList.remove('hidden');
        }
      }

      // ---------------------------------------------------------------------------
      // 14. EVENT LISTENERS & DELEGATION
      // ---------------------------------------------------------------------------
      function bindEvents() {
        // Navigation Tabs
        document.querySelectorAll('.nav-tab').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const target = btn.getAttribute('data-nav');
            if (target) switchView(target);
          });
        });

        // Theme Toggles
        const btnTheme = document.getElementById('btn-theme');
        const btnThemeMobile = document.getElementById('btn-theme-mobile');
        if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
        if (btnThemeMobile) btnThemeMobile.addEventListener('click', toggleTheme);

        // Install PWA Buttons & Guide Modal
        const btnInstallPwa = document.getElementById('btn-install-pwa');
        const btnInstallMobile = document.getElementById('btn-install-mobile');
        const modalPwaGuide = document.getElementById('modal-pwa-guide');
        const btnClosePwaGuide = document.getElementById('btn-close-pwa-guide');
        const btnOkPwaGuide = document.getElementById('btn-ok-pwa-guide');
        const btnModalDlSw = document.getElementById('btn-modal-download-sw');
        const btnDownloadSw = document.getElementById('btn-download-sw');
        const btnDownloadManifest = document.getElementById('btn-download-manifest');

        if (btnInstallPwa) btnInstallPwa.addEventListener('click', handleInstallClick);
        if (btnInstallMobile) btnInstallMobile.addEventListener('click', handleInstallClick);
        if (btnClosePwaGuide) {
          btnClosePwaGuide.addEventListener('click', function () {
            if (modalPwaGuide) modalPwaGuide.classList.add('hidden');
          });
        }
        if (btnOkPwaGuide) {
          btnOkPwaGuide.addEventListener('click', function () {
            if (modalPwaGuide) modalPwaGuide.classList.add('hidden');
          });
        }

        // v5: download the actual deployed files instead of stale embedded copies
        function downloadDeployedFile(path, filename, mime, toastMsg) {
          fetch('./' + path, { cache: 'no-store' })
            .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
            .then(function (text) {
              downloadBlobFile(text, filename, mime);
              showToast(toastMsg, 'success');
            })
            .catch(function () { showToast('تعذر تحميل الملف الآن - تحقق من الاتصال بالإنترنت.', 'warning'); });
        }
        function downloadSwFile() {
          downloadDeployedFile('sw.js', 'sw.js', 'application/javascript;charset=utf-8', '⚙️ تم تحميل ملف sw.js الفعلي المنشور حالياً.');
        }
        function downloadManifestFile() {
          downloadDeployedFile('manifest.webmanifest', 'manifest.webmanifest', 'application/manifest+json;charset=utf-8', '📦 تم تحميل ملف manifest.webmanifest الفعلي المنشور حالياً.');
        }

        if (btnModalDlSw) btnModalDlSw.addEventListener('click', downloadSwFile);
        if (btnDownloadSw) btnDownloadSw.addEventListener('click', downloadSwFile);
        if (btnDownloadManifest) btnDownloadManifest.addEventListener('click', downloadManifestFile);

        // Streak Check-in Buttons
        const btnLogStudy = document.getElementById('btn-Log-study');
        const btnCardStreak = document.getElementById('btn-card-streak');
        if (btnLogStudy) btnLogStudy.addEventListener('click', logStudySessionToday);
        if (btnCardStreak) btnCardStreak.addEventListener('click', logStudySessionToday);

        // Quick Export Button in Header
        const btnExportQuick = document.getElementById('btn-export-quick');
        if (btnExportQuick) btnExportQuick.addEventListener('click', exportProgressJSON);

        // Search & Filter Controls
        const inputSearch = document.getElementById('input-search');
        const selectPhase = document.getElementById('select-phase');
        const selectStatus = document.getElementById('select-status');
        const selectDifficulty = document.getElementById('select-difficulty');

        if (inputSearch) {
          inputSearch.addEventListener('input', function (e) {
            filterState.search = e.target.value;
            renderUnits();
          });
        }
        if (selectPhase) {
          selectPhase.addEventListener('change', function (e) {
            filterState.phase = e.target.value;
            renderUnits();
          });
        }
        if (selectStatus) {
          selectStatus.addEventListener('change', function (e) {
            filterState.status = e.target.value;
            renderUnits();
          });
        }
        if (selectDifficulty) {
          selectDifficulty.addEventListener('change', function (e) {
            filterState.difficulty = e.target.value;
            renderUnits();
          });
        }

        // Quick Pills
        document.querySelectorAll('.quick-pill').forEach(function (pill) {
          pill.addEventListener('click', function () {
            const qf = pill.getAttribute('data-quick-filter') || 'all';
            filterState.quick = qf;
            updateQuickPillStyles();
            renderUnits();
          });
        });

        const btnFilterCoursera = document.getElementById('btn-filter-coursera');
        if (btnFilterCoursera) {
          btnFilterCoursera.addEventListener('click', function () {
            filterState.quick = filterState.quick === 'coursera' ? 'all' : 'coursera';
            updateQuickPillStyles();
            renderUnits();
            showToast(
              filterState.quick === 'coursera'
                ? '🎓 تم عرض الوحدات المرتبطة بشهادات Coursera فقط'
                : 'تم إظهار جميع الوحدات الـ 27',
              'info'
            );
          });
        }

        const btnJumpP1 = document.getElementById('btn-jump-phase1');
        const btnJumpP2 = document.getElementById('btn-jump-phase2');
        if (btnJumpP1) {
          btnJumpP1.addEventListener('click', function () {
            filterState.phase = '1';
            if (selectPhase) selectPhase.value = '1';
            renderUnits();
          });
        }
        if (btnJumpP2) {
          btnJumpP2.addEventListener('click', function () {
            filterState.phase = '2';
            if (selectPhase) selectPhase.value = '2';
            renderUnits();
          });
        }

        function resetAllFilters() {
          filterState = { search: '', phase: 'all', status: 'all', difficulty: 'all', quick: 'all' };
          if (inputSearch) inputSearch.value = '';
          if (selectPhase) selectPhase.value = 'all';
          if (selectStatus) selectStatus.value = 'all';
          if (selectDifficulty) selectDifficulty.value = 'all';
          updateQuickPillStyles();
          renderUnits();
        }

        const btnResetFilters = document.getElementById('btn-reset-filters');
        const btnEmptyReset = document.getElementById('btn-empty-reset');
        if (btnResetFilters) btnResetFilters.addEventListener('click', resetAllFilters);
        if (btnEmptyReset) btnEmptyReset.addEventListener('click', resetAllFilters);

        // Delegated Events on Units Container
        const unitsContainer = document.getElementById('units-container');
        if (unitsContainer) {
          document.addEventListener('change', function (e) {
            const target = e.target;
            if (!target) return;

            if (target.classList.contains('unit-status-select')) {
              const unitId = Number(target.getAttribute('data-unit-status'));
              const newStatus = target.value;
              appState.unitStatus[unitId] = newStatus;

              const unitObj = UNITS_DATA.find(function (item) { return item.id === unitId; });
              if (newStatus === 'completed' && unitObj) {
                unitObj.resources.forEach(function (r) {
                  appState.completedResources[r.id] = true;
                });
              }
              saveState();
              updateDashboardStats();
              renderUnits();
              showToast('✅ تم تحديث حالة الوحدة ' + unitId + ' بنجاح!', 'success');
            }

            if (target.classList.contains('res-checkbox')) {
              const resId = target.getAttribute('data-res-id');
              const unitId = Number(target.getAttribute('data-unit-id'));
              if (target.checked) {
                appState.completedResources[resId] = true;
              } else {
                delete appState.completedResources[resId];
              }

              const unitObj = UNITS_DATA.find(function (item) { return item.id === unitId; });
              if (unitObj) {
                const totalR = unitObj.resources.length;
                const doneR = unitObj.resources.filter(function (r) { return isResourceCompleted(r.id); }).length;
                if (doneR === totalR && totalR > 0) {
                  appState.unitStatus[unitId] = 'completed';
                } else if (doneR > 0) {
                  appState.unitStatus[unitId] = 'in_progress';
                }
              }

              saveState();
              updateDashboardStats();
              renderUnits();
            }
          });

          document.addEventListener('input', function (e) {
            const target = e.target;
            if (target && target.classList.contains('unit-note-textarea')) {
              const unitId = Number(target.getAttribute('data-unit-note'));
              appState.unitNotes[unitId] = target.value;
              saveState();
              const statusSpan = document.getElementById('note-status-' + unitId);
              if (statusSpan) {
                statusSpan.textContent = '💾 تم الحفظ تلقائياً';
              }
            }
          });

          document.addEventListener('click', function (e) {
            const modHead = e.target.closest('[data-toggle-module]');
            if (modHead) {
              const mod = modHead.closest('.kk-module');
              if (mod) {
                mod.classList.toggle('open');
                modHead.setAttribute('aria-expanded', mod.classList.contains('open') ? 'true' : 'false');
              }
              return;
            }
            const menuToggle = e.target.closest('[data-toggle-menu]');
            if (menuToggle) {
              const bar = document.getElementById('sticky-nav-bar');
              if (bar) {
                bar.classList.toggle('menu-open');
                menuToggle.setAttribute('aria-expanded', bar.classList.contains('menu-open') ? 'true' : 'false');
              }
              return;
            }
            if (e.target.closest('[data-nav]')) {
              const bar = document.getElementById('sticky-nav-bar');
              if (bar) bar.classList.remove('menu-open');
            }
            const filterToggle = e.target.closest('[data-toggle-filters]');
            if (filterToggle) {
              const panel = document.getElementById('filters-panel');
              if (panel) {
                panel.classList.toggle('filters-open');
                filterToggle.setAttribute('aria-expanded', panel.classList.contains('filters-open') ? 'true' : 'false');
              }
              return;
            }
            const sideToggle = e.target.closest('[data-toggle-side]');
            if (sideToggle) {
              const side = sideToggle.closest('.kk-side');
              if (side) side.classList.toggle('open');
              return;
            }
            const studyBtn = e.target.closest('[data-study-unit]');
            if (studyBtn) {
              openUnitStudy(Number(studyBtn.getAttribute('data-study-unit')));
              return;
            }
            const btn = e.target.closest('[data-scroll-unit]');
            if (!btn) return;
            const targetUnitId = Number(btn.getAttribute('data-scroll-unit'));
            openUnitStudy(targetUnitId);
            return;
          });
        }

        const selectFreeCat = document.getElementById('select-free-category');
        if (selectFreeCat) {
          selectFreeCat.addEventListener('change', renderFreeForDevTable);
        }

        const btnExportJson = document.getElementById('btn-export-json');
        const btnCopyJson = document.getElementById('btn-copy-json');
        const inputImportJson = document.getElementById('input-import-json');
        const btnPrintReport = document.getElementById('btn-print-report');
        const btnExportMd = document.getElementById('btn-export-md-report');

        if (btnExportJson) btnExportJson.addEventListener('click', exportProgressJSON);
        if (btnCopyJson) btnCopyJson.addEventListener('click', copyProgressJSON);
        if (inputImportJson) {
          inputImportJson.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
              importProgressJSON(e.target.files[0]);
              e.target.value = '';
            }
          });
        }
        if (btnPrintReport) {
          btnPrintReport.addEventListener('click', function () {
            window.print();
          });
        }
        if (btnExportMd) btnExportMd.addEventListener('click', exportMarkdownReport);

        // Modals (Shortcuts & Reset)
        const modalShortcuts = document.getElementById('modal-shortcuts');
        const btnShortcuts = document.getElementById('btn-shortcuts');
        const btnShortcutsMobile = document.getElementById('btn-shortcuts-mobile');
        const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');
        const btnOkShortcuts = document.getElementById('btn-ok-shortcuts');

        function openShortcutsModal() {
          if (modalShortcuts) modalShortcuts.classList.remove('hidden');
        }
        function closeShortcutsModal() {
          if (modalShortcuts) modalShortcuts.classList.add('hidden');
        }

        if (btnShortcuts) btnShortcuts.addEventListener('click', openShortcutsModal);
        if (btnShortcutsMobile) btnShortcutsMobile.addEventListener('click', openShortcutsModal);
        if (btnCloseShortcuts) btnCloseShortcuts.addEventListener('click', closeShortcutsModal);
        if (btnOkShortcuts) btnOkShortcuts.addEventListener('click', closeShortcutsModal);

        const modalReset = document.getElementById('modal-reset');
        const btnOpenReset = document.getElementById('btn-open-reset-modal');
        const btnCloseReset = document.getElementById('btn-close-reset');
        const btnCancelReset = document.getElementById('btn-cancel-reset');
        const btnConfirmReset = document.getElementById('btn-confirm-reset');

        function closeResetModal() {
          if (modalReset) modalReset.classList.add('hidden');
        }
        if (btnOpenReset) {
          btnOpenReset.addEventListener('click', function () {
            if (modalReset) modalReset.classList.remove('hidden');
          });
        }
        if (btnCloseReset) btnCloseReset.addEventListener('click', closeResetModal);
        if (btnCancelReset) btnCancelReset.addEventListener('click', closeResetModal);
        if (btnConfirmReset) {
          btnConfirmReset.addEventListener('click', function () {
            const currentTheme = appState.theme;
            appState = getDefaultState();
            appState.theme = currentTheme;
            saveState();
            closeResetModal();
            renderAll();
            showToast('🗑️ تمت إعادة ضبط التقدم الدراسي بالكامل.', 'info');
          });
        }

        document.addEventListener('keydown', function (e) {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

          if (e.key === 'Escape') {
            closeShortcutsModal();
            closeResetModal();
            if (modalPwaGuide) modalPwaGuide.classList.add('hidden');
            return;
          }

          if (!isTyping && e.key === '/') {
            e.preventDefault();
            switchView('curriculum');
            if (inputSearch) inputSearch.focus();
            return;
          }

          if (!isTyping && e.key === '?') {
            e.preventDefault();
            openShortcutsModal();
            return;
          }

          if (e.altKey && (e.key === 't' || e.key === 'T' || e.key === 'ف')) {
            e.preventDefault();
            toggleTheme();
            return;
          }

          if (e.altKey && (e.key === 'e' || e.key === 'E' || e.key === 'ث')) {
            e.preventDefault();
            exportProgressJSON();
            return;
          }

          if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
            e.preventDefault();
            const map = { '1': 'dashboard', '2': 'curriculum', '3': 'plan9m', '4': 'analysis', '5': 'freefordev', '6': 'report' };
            switchView(map[e.key]);
          }
        });
      }

      function updateQuickPillStyles() {
        document.querySelectorAll('.quick-pill').forEach(function (pill) {
          const qf = pill.getAttribute('data-quick-filter');
          if (qf === filterState.quick) {
            pill.className = 'quick-pill px-2.5 py-1 rounded-lg bg-brand-500 text-slate-950 font-bold transition';
          } else {
            pill.className = 'quick-pill px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition';
          }
        });
      }

      function renderAll() {
        updateDashboardStats();
        renderUnits();
        renderPlan9mTable();
        renderFreeForDevTable();
        renderReportView();
      }
      let mcaMascotTipIndex = 0;

      function initMascot() {
        const mascot = document.getElementById('mca-mascot');
        const restoreBtn = document.getElementById('mca-mascot-restore');
        if (!mascot) return;
        const HIDE_KEY = 'mca_mascot_hidden_v1';
        mcaMascotTipIndex = Math.floor(Math.random() * MCA_MASCOT_TIPS.length);

        function setMascotHidden(hidden) {
          mascot.classList.toggle('mca-hidden', hidden);
          if (restoreBtn) restoreBtn.classList.toggle('hidden', !hidden);
          try { localStorage.setItem(HIDE_KEY, hidden ? '1' : '0'); } catch (err) { /* ignore */ }
        }

        let isHidden = false;
        try { isHidden = localStorage.getItem(HIDE_KEY) === '1'; } catch (err) { /* ignore */ }
        setMascotHidden(isHidden);

        const showTip = function () {
          const tip = MCA_MASCOT_TIPS[mcaMascotTipIndex % MCA_MASCOT_TIPS.length];
          mcaMascotTipIndex += 1;
          showToast('🦇 ' + tip + ' (اضغط مرتين على ألوكارد لإخفائه)', 'info');
        };

        let lastTap = 0;
        mascot.addEventListener('click', function () {
          const now = Date.now();
          if (now - lastTap < 400) {
            lastTap = 0;
            setMascotHidden(true);
            showToast('تم إخفاء ألوكارد — اضغط على زر 🦇 الصغير بالأسفل لإظهاره مجدداً.', 'info');
            return;
          }
          lastTap = now;
          setTimeout(function () {
            if (lastTap !== 0 && Date.now() - lastTap >= 400) {
              showTip();
              lastTap = 0;
            }
          }, 420);
        });
        mascot.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showTip();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setMascotHidden(true);
          }
        });
        if (restoreBtn) {
          restoreBtn.addEventListener('click', function () {
            setMascotHidden(false);
            showToast('عاد ألوكارد! اضغط عليه لنصيحة دراسية.', 'success');
          });
        }
      }

      // ---------------------------------------------------------------------------
      // 15. INITIALIZE APPLICATION & DISMISS LOADING STATE
      // ---------------------------------------------------------------------------
      window.addEventListener('DOMContentLoaded', function () {
        loadState();
        applyTheme();
        bindEvents();
        renderAll();
        setupHardenedPWA();
        initMascot();

        const loader = document.getElementById('app-loading-overlay');
        if (loader) {
          requestAnimationFrame(function () {
            loader.classList.add('loaded');
          });
        }
      });
    })();
  
