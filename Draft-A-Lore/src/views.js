/* Draft A Lore — views.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
DAL = DAL || {};

/* Dashboard
   The Dashboard is composed from DAL.DASHBOARD_CARDS: each entry has a body
   renderer here, and the page is assembled in the reader's saved order at their
   saved widths. A body renderer returning an empty string means "nothing worth
   showing" and the card is dropped from the page entirely rather than left as an
   empty box — except while organizing, where every card must stay reachable so
   it can be moved or hidden. */
DAL.dashboardCardBody = {};

DAL.renderDashboard = function(){
  var layout = DAL.dashboardLayout();
  var organizing = DAL.organizeDashboard;

  var html = '<div class="dashboard' + (organizing ? ' organizing' : '') + '">';
  html += DAL.renderDashboardBar(layout, organizing);
  html += '<div class="dash-grid">';

  var visible = layout.order.filter(function(id){ return layout.hidden.indexOf(id) === -1; });
  var rendered = 0;
  visible.forEach(function(id, i){
    var card = DAL.dashboardCard(id);
    var body = DAL.dashboardCardBody[id] ? DAL.dashboardCardBody[id]() : '';
    if(!body && !organizing) return;
    rendered++;
    html += DAL.renderDashboardCard(card, layout.size[id], body, {
      organizing: organizing,
      first: i === 0,
      last: i === visible.length - 1,
      empty: !body
    });
  });
  if(!rendered){
    html += '<div class="dash-cell full"><div class="empty-state" style="padding:32px 16px">' +
      '<h3>Every card is hidden</h3><p>Turn on Organize Dashboard to bring cards back.</p></div></div>';
  }
  html += '</div>';

  if(organizing) html += DAL.renderHiddenCardTray(layout);
  html += '</div>';
  return html;
};

/* The bar above the grid. Outside organize mode it carries a single button and
   no per-card affordances anywhere on the page. */
DAL.renderDashboardBar = function(layout, organizing){
  var html = '<div class="dash-bar">';
  if(organizing){
    html += '<div class="dash-bar-text">' +
      '<strong>Organizing your dashboard</strong>' +
      '<span>Move, resize, and hide cards. Changes save as you make them.</span>' +
      '</div>' +
      '<div class="dash-bar-actions">' +
        '<button class="btn sm" data-action="dash-reset">Reset to default</button>' +
        '<button class="btn sm primary" data-action="dash-organize-off">Done</button>' +
      '</div>';
  } else {
    html += '<div class="dash-bar-text"><strong>Dashboard</strong></div>' +
      '<div class="dash-bar-actions">' +
        '<button class="btn sm" data-action="dash-organize-on">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>' +
          'Organize Dashboard</button>' +
      '</div>';
  }
  html += '</div>';
  return html;
};

DAL.renderDashboardCard = function(card, size, body, opts){
  var cls = 'dash-cell ' + size.w + (size.h === 'tall' ? ' tall' : '');
  var html = '<section class="' + cls + '" data-card="' + card.id + '" aria-label="' + DAL.escapeHtml(card.label) + '">';
  if(opts.organizing){
    html += DAL.renderCardOrganizeControls(card, size, opts);
  }
  html += '<div class="dash-card-body">';
  html += opts.empty
    ? '<div class="dash-card-placeholder">Nothing to show here yet.</div>'
    : body;
  html += '</div></section>';
  return html;
};

/* Buttons are the baseline for reordering: they work with a mouse, a keyboard,
   a screen reader and a thumb, which drag-and-drop alone does not. */
DAL.renderCardOrganizeControls = function(card, size, opts){
  var html = '<header class="dash-card-organize">';
  html += '<span class="dash-card-name">' + DAL.escapeHtml(card.label) + '</span>';
  html += '<div class="dash-card-tools">';
  html += '<button class="dash-tool" data-action="dash-move" data-card="' + card.id + '" data-dir="-1"' +
    (opts.first ? ' disabled' : '') + ' aria-label="Move ' + DAL.escapeHtml(card.label) + ' up" title="Move up">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg></button>';
  html += '<button class="dash-tool" data-action="dash-move" data-card="' + card.id + '" data-dir="1"' +
    (opts.last ? ' disabled' : '') + ' aria-label="Move ' + DAL.escapeHtml(card.label) + ' down" title="Move down">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg></button>';

  if(!card.alwaysFull){
    html += '<span class="dash-tool-sep"></span>';
    html += '<button class="dash-tool text' + (size.w === 'half' ? ' active' : '') + '" data-action="dash-width" data-card="' + card.id + '" data-w="half"' +
      ' aria-pressed="' + (size.w === 'half') + '" title="Half width">Half</button>';
    html += '<button class="dash-tool text' + (size.w === 'full' ? ' active' : '') + '" data-action="dash-width" data-card="' + card.id + '" data-w="full"' +
      ' aria-pressed="' + (size.w === 'full') + '" title="Full width">Full</button>';
  }
  if(card.tall){
    html += '<span class="dash-tool-sep"></span>';
    html += '<button class="dash-tool text' + (size.h === 'tall' ? ' active' : '') + '" data-action="dash-height" data-card="' + card.id + '"' +
      ' aria-pressed="' + (size.h === 'tall') + '" title="Toggle taller card">Tall</button>';
  }
  html += '<span class="dash-tool-sep"></span>';
  html += '<button class="dash-tool" data-action="dash-hide" data-card="' + card.id + '" aria-label="Hide ' + DAL.escapeHtml(card.label) + '" title="Hide this card">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/></svg></button>';
  html += '</div></header>';
  return html;
};

DAL.renderHiddenCardTray = function(layout){
  var html = '<div class="dash-hidden-tray">';
  html += '<div class="dash-hidden-title">Hidden cards</div>';
  if(!layout.hidden.length){
    html += '<p class="dash-hidden-empty">No hidden cards. Anything you hide lands here so you can bring it back.</p>';
  } else {
    html += '<div class="dash-hidden-list">';
    // Listed in registry order rather than the order they were hidden, so the
    // tray reads the same every time instead of shuffling as you work.
    DAL.DASHBOARD_CARDS.forEach(function(card){
      if(layout.hidden.indexOf(card.id) === -1) return;
      html += '<button class="dash-hidden-chip" data-action="dash-show" data-card="' + card.id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        DAL.escapeHtml(card.label) + '</button>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
};
DAL.dashboardCardBody.continue = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);
  if(!projects.length) return '';
  var last = projects.reduce(function(a, b){ return (a.updatedAt||0) > (b.updatedAt||0) ? a : b; });
  var wc = DAL.getProjectWordCount(last);
  return '<div class="dash-continue">' +
    '<div class="dash-continue-info">' +
      '<div class="dash-eyebrow">Continue writing</div>' +
      '<div class="dash-continue-name">' + DAL.escapeHtml(last.name) + '</div>' +
      '<div class="dash-badges">' +
        '<span class="badge accent">' + DAL.escapeHtml(last.type) + '</span>' +
        '<span class="badge">' + DAL.escapeHtml(last.status) + '</span>' +
        '<span class="badge">' + wc.total.toLocaleString() + ' words</span>' +
        '<span class="badge">' + DAL.escapeHtml(DAL.formatDate(last.updatedAt)) + '</span>' +
      '</div>' +
    '</div>' +
    '<button class="btn primary" data-action="open-project" data-pid="' + last.id + '">Continue Writing</button>' +
  '</div>';
};

DAL.dashboardCardBody.profile = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);
  var gwc = DAL.getGlobalWordCount();
  var streak = DAL.getWritingStreak();
  var hasProfile = DAL.state.authorName || DAL.state.authorBio || DAL.state.authorAvatar;
  var initials = (DAL.state.authorName||'?').split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();

  var html = '<div class="dashboard-profile-card">';
  html += '<div class="profile-card-header">';
  html += '<div class="profile-avatar">' + (DAL.state.authorAvatar ? '<img src="' + DAL.state.authorAvatar + '" alt="">' : DAL.escapeHtml(initials)) + '</div>';
  html += '<div style="flex:1;min-width:0">';
  html += DAL.state.authorName
    ? '<div class="profile-name brand-text">' + DAL.escapeHtml(DAL.state.authorName) + '</div>'
    : '<div class="profile-name brand-text muted">Your Author Name</div>';
  if(DAL.state.authorBio){
    html += '<div class="profile-bio">' + DAL.escapeHtml(DAL.state.authorBio) + '</div>';
  } else if(!hasProfile){
    html += '<div class="profile-bio faint">Set up your author profile in Settings to add your name, bio, and photo. This appears on your book covers, title pages, and exports when auto-fill is enabled.</div>';
  } else {
    html += '<div class="profile-bio faint">No bio written yet. Add one in Settings.</div>';
  }
  html += '</div>';
  html += '<button class="btn sm" data-action="nav-settings">Edit Profile</button>';
  html += '</div>';
  if(hasProfile){
    html += '<div class="profile-card-stats">' +
      '<div class="profile-stat"><span class="profile-stat-num">' + projects.length + '</span><span class="profile-stat-label">Projects</span></div>' +
      '<div class="profile-stat"><span class="profile-stat-num">' + gwc.total.toLocaleString() + '</span><span class="profile-stat-label">Words Written</span></div>' +
      '<div class="profile-stat"><span class="profile-stat-num">' + streak + '</span><span class="profile-stat-label">Day' + (streak !== 1 ? 's' : '') + ' Streak</span></div>' +
    '</div>';
  }
  html += '</div>';
  return html;
};

DAL.dashboardCardBody.totals = function(){
  var gwc = DAL.getGlobalWordCount();
  var rows = [
    { label: 'Manuscript', value: gwc.manuscript },
    { label: 'Supplementary', value: gwc.supplementary },
    { label: 'Total', value: gwc.total, strong: true }
  ];
  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Word Count</h3>' +
    DAL.infoIcon('Manuscript words are your chapters and scene text. Supplementary words are character sheets, lore entries and plot notes.') + '</div>';
  html += '<div class="stat-rows">';
  rows.forEach(function(r){
    html += '<div class="stat-row' + (r.strong ? ' strong' : '') + '">' +
      '<span class="stat-row-label">' + r.label + '</span>' +
      '<span class="stat-row-value">' + r.value.toLocaleString() + '</span>' +
    '</div>';
  });
  html += '</div>';

  // A single bar showing the manuscript share reads faster than the two numbers
  // alone when what you want to know is how much of the total is actual prose.
  if(gwc.total > 0){
    var share = Math.round((gwc.manuscript / gwc.total) * 100);
    html += '<div class="split-bar" role="img" aria-label="' + share + ' percent of your words are manuscript prose">' +
      '<span class="split-fill" style="width:' + share + '%"></span>' +
    '</div>';
    html += '<p class="split-note">' + share + '% of your words are manuscript prose.</p>';
  }
  return html;
};

DAL.dashboardCardBody.streak = function(){
  var streak = DAL.getWritingStreak();
  var flame = streak > 0
    ? '<path d="M12 2C10 5 8 7 8 11a4 4 0 0 0 8 0c0-2-1-4-2-5"/><path d="M12 22c4 0 7-2 7-6 0-3-2-5-3-6"/><path d="M5 16c0 4 3 6 7 6"/><path d="M9 11c0 1 .5 2 1.5 2.5"/>'
    : '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h4"/>';
  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Writing Streak</h3></div>';
  html += '<div class="streak-block' + (streak > 0 ? ' lit' : '') + '">' +
    '<svg class="streak-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' + flame + '</svg>' +
    '<div class="streak-text">' +
      '<div class="streak-num">' + streak + '<span class="streak-unit">day' + (streak !== 1 ? 's' : '') + '</span></div>' +
      '<div class="streak-note">' + (streak > 0 ? 'Consecutive days with words written' : 'Write anything today to start a streak') + '</div>' +
    '</div>' +
  '</div>';

  var best = DAL.getLongestStreak();
  if(best > 0){
    var record = streak > 0 && streak >= best;
    html += '<div class="streak-best">' +
      (record ? 'Your best run yet' : 'Best run: ' + best + ' day' + (best === 1 ? '' : 's')) +
    '</div>';
  }
  return html;
};

/* Project goals
   A target word count and optional deadline per project. Finished goals move to
   their own list so the working list stays about what is still ahead. */
DAL.dashboardCardBody.projectGoals = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);

  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Project Goals</h3>' +
    DAL.infoIcon('Set a target word count for a project, and a deadline if you want one. The pace shown is how many words a day would finish it on time.') +
    '</div>';

  if(!projects.length){
    html += '<p class="pg-empty">Create a project and you can set a target word count for it here.</p>';
    return html;
  }

  var active = [], done = [];
  projects.forEach(function(p){
    var st = DAL.projectGoalStats(p);
    (st.done ? done : active).push({ proj: p, st: st });
  });

  html += '<div class="pg-list">';
  active.forEach(function(row){ html += DAL.renderProjectGoalRow(row.proj, row.st); });
  html += '</div>';

  if(done.length){
    html += '<div class="pg-done-group">' +
      '<div class="pg-group-title">Reached <span class="pg-count">' + done.length + '</span></div>' +
      '<div class="pg-list">';
    done.forEach(function(row){ html += DAL.renderProjectGoalRow(row.proj, row.st); });
    html += '</div></div>';
  }
  return html;
};

DAL.renderProjectGoalRow = function(proj, st){
  var html = '<div class="pg-row' + (st.done ? ' done' : '') + (st.overdue ? ' overdue' : '') + '">';

  html += '<div class="pg-head">' +
    '<button class="pg-name" data-action="open-project" data-pid="' + proj.id + '">' + DAL.escapeHtml(proj.name) + '</button>' +
    (st.done ? '<span class="badge success">Reached</span>' : '') +
    (st.overdue ? '<span class="badge warning">Past deadline</span>' : '') +
  '</div>';

  html += '<div class="pg-fields">' +
    '<label class="pg-field"><span class="pg-field-label">Target words</span>' +
      '<input type="number" class="pg-input" min="0" step="1000" value="' + (st.target || '') + '" placeholder="0" ' +
        'data-project-goal="target" data-pid="' + proj.id + '" aria-label="Target word count for ' + DAL.escapeHtml(proj.name) + '">' +
    '</label>' +
    '<label class="pg-field"><span class="pg-field-label">Deadline</span>' +
      '<input type="date" class="pg-input" value="' + DAL.escapeHtml(st.deadline) + '" ' +
        'data-project-goal="deadline" data-pid="' + proj.id + '" aria-label="Deadline for ' + DAL.escapeHtml(proj.name) + '">' +
    '</label>' +
  '</div>';

  if(!st.set){
    html += '<p class="pg-hint">' + DAL.escapeHtml(st.words.toLocaleString()) + ' words written. Set a target to track progress.</p>';
    return html + '</div>';
  }

  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + st.percent + '%"></div></div>';

  var facts = [];
  facts.push('<span class="pg-fact"><strong>' + st.words.toLocaleString() + '</strong> of ' + st.target.toLocaleString() + ' words</span>');
  facts.push('<span class="pg-fact"><strong>' + st.percent + '%</strong></span>');
  if(st.done){
    facts.push('<span class="pg-fact">Target reached</span>');
  } else {
    facts.push('<span class="pg-fact"><strong>' + st.remaining.toLocaleString() + '</strong> to go</span>');
    if(st.daysLeft !== null){
      if(st.daysLeft >= 1){
        facts.push('<span class="pg-fact"><strong>' + st.daysLeft.toLocaleString() + '</strong> day' + (st.daysLeft === 1 ? '' : 's') + ' left</span>');
        facts.push('<span class="pg-fact"><strong>' + st.perDay.toLocaleString() + '</strong> words a day to finish</span>');
      } else {
        facts.push('<span class="pg-fact">Deadline passed ' + Math.abs(st.daysLeft - 1).toLocaleString() + ' day' + (Math.abs(st.daysLeft - 1) === 1 ? '' : 's') + ' ago</span>');
      }
    }
  }
  html += '<div class="pg-facts">' + facts.join('') + '</div>';

  return html + '</div>';
};

/* Word output bar graph
   Hand-built inline SVG. Colour comes from CSS custom properties rather than
   literal hex, so the chart follows the active theme without a redraw, and the
   geometry is plain arithmetic so there is nothing to load. */
/* Two geometries rather than one stretched drawing: an SVG scales uniformly, so
   a wide viewBox squeezed into a phone-width card would shrink its own labels
   into illegibility. The viewport bucket already re-renders when it changes. */
DAL.CHART_SIZES = {
  wide:    { W: 760, H: 240, padL: 52, padR: 12, padT: 12, padB: 30, maxLabels: 12 },
  compact: { W: 420, H: 300, padL: 44, padR: 8,  padT: 14, padB: 34, maxLabels: 7 }
};

DAL.chartSize = function(){
  var bucket = document.documentElement.getAttribute('data-viewport');
  return bucket === 'compact' ? DAL.CHART_SIZES.compact : DAL.CHART_SIZES.wide;
};

/* Rounds a maximum up to a readable axis top: 1, 2 or 5 times a power of ten. */
DAL.niceCeil = function(v){
  if(v <= 0) return 100;
  var mag = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
  var n = v / mag;
  var step = n <= 1 ? 1 : (n <= 2 ? 2 : (n <= 5 ? 5 : 10));
  return step * mag;
};

DAL.dashboardCardBody.wordGraph = function(){
  var data = DAL.wordBuckets(DAL.state.analyticsRange);

  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Word Output</h3>' +
    DAL.infoIcon('Words written in each period, taken from your daily writing history. Days before you started using Draft A Lore show as empty.') +
    '</div>';

  html += '<div class="chart-controls" role="group" aria-label="Chart range">';
  DAL.ANALYTICS_RANGES.forEach(function(r){
    var on = r.id === data.range.id;
    html += '<button class="chart-range' + (on ? ' active' : '') + '" data-action="analytics-range" data-range="' + r.id + '" aria-pressed="' + on + '">' + r.label + '</button>';
  });
  html += '</div>';

  html += '<div class="chart-summary">' +
    '<div class="chart-stat"><span class="chart-stat-num">' + data.total.toLocaleString() + '</span><span class="chart-stat-label">words in range</span></div>' +
    '<div class="chart-stat"><span class="chart-stat-num">' + data.average.toLocaleString() + '</span><span class="chart-stat-label">per day average</span></div>' +
  '</div>';

  if(data.total === 0){
    html += '<div class="chart-empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 20h18"/><rect x="5" y="13" width="3" height="5" rx="1"/><rect x="11" y="9" width="3" height="9" rx="1"/><rect x="17" y="15" width="3" height="3" rx="1"/></svg>' +
      '<p>No words recorded in this range yet. Anything you write from here on shows up the same day.</p>' +
    '</div>';
    return html;
  }

  html += '<div class="chart-readout" data-readout="wordGraph" aria-live="polite">Hover or tap a bar for its exact count.</div>';
  html += DAL.renderWordGraphSvg(data);
  return html;
};

DAL.renderWordGraphSvg = function(data){
  var m = DAL.chartSize();
  var W = m.W, H = m.H;
  var padL = m.padL, padR = m.padR, padT = m.padT, padB = m.padB;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  // Deriving the step first and the top from it keeps every gridline on a round
  // number. Rounding the top first instead produces labels like 1.3k and 3.8k.
  var peak = Math.max.apply(null, data.buckets.map(function(b){ return b.words; }));
  var step = DAL.niceCeil(peak / 4);
  var bands = Math.max(1, Math.ceil(peak / step));
  var top = step * bands;
  var n = data.buckets.length;
  var slot = plotW / n;
  var barW = Math.max(3, Math.min(38, slot * 0.68));
  var unitWord = data.range.unit === 'day' ? 'day' : (data.range.unit === 'week' ? 'week' : 'month');

  var svg = '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
    'aria-label="Words written per ' + unitWord + ' over the last ' + data.range.label + ', ' + data.total.toLocaleString() + ' words total">';

  // Horizontal gridlines with value labels, one per step.
  for(var g = 0; g <= bands; g++){
    var val = step * g;
    var y = padT + plotH - (plotH * (g / bands));
    svg += '<line class="chart-grid" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"/>';
    svg += '<text class="chart-axis-label" x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + DAL.compactNumber(val) + '</text>';
  }
  // The baseline is drawn last of the axis furniture so it sits above the grid.
  svg += '<line class="chart-baseline" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '"/>';

  data.buckets.forEach(function(b, i){
    var x = padL + slot * i + (slot - barW) / 2;
    var h = top > 0 ? (b.words / top) * plotH : 0;
    // Bars with a real value keep a sliver of height so a small day is still
    // visible rather than collapsing into the baseline.
    if(b.words > 0) h = Math.max(2, h);
    var y = padT + plotH - h;
    var label = b.full + ': ' + b.words.toLocaleString() + ' word' + (b.words === 1 ? '' : 's');

    svg += '<g class="chart-bar-group" data-bar="' + i + '" data-label="' + DAL.escapeHtml(label) + '" tabindex="0" role="listitem" aria-label="' + DAL.escapeHtml(label) + '">';
    // A full-height transparent target makes short bars just as easy to hit.
    svg += '<rect class="chart-hit" x="' + (padL + slot * i).toFixed(1) + '" y="' + padT + '" width="' + slot.toFixed(1) + '" height="' + plotH + '"/>';
    svg += '<title>' + DAL.escapeHtml(label) + '</title>';
    if(b.words > 0){
      svg += '<rect class="chart-bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + Math.min(3, barW / 3).toFixed(1) + '"/>';
    }
    // Value labels are printed only when there is room for them; past about a
    // dozen bars they overlap into noise, and the readout covers the rest.
    if(n <= m.maxLabels && b.words > 0){
      svg += '<text class="chart-value" x="' + (x + barW / 2).toFixed(1) + '" y="' + Math.max(padT + 9, y - 5).toFixed(1) + '" text-anchor="middle">' + DAL.compactNumber(b.words) + '</text>';
    }
    if(b.axis){
      svg += '<text class="chart-axis-label" x="' + (x + barW / 2).toFixed(1) + '" y="' + (padT + plotH + 18) + '" text-anchor="middle">' + DAL.escapeHtml(b.axis) + '</text>';
    }
    svg += '</g>';
  });

  svg += '</svg>';
  return svg;
};

/* Axis and value labels need to stay short, so thousands collapse to 1.2k. */
DAL.compactNumber = function(v){
  v = Math.round(v);
  if(v >= 10000) return Math.round(v / 1000) + 'k';
  if(v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
};
DAL.HEATMAP_WEEKS = 12;

DAL.dashboardCardBody.heatmap = function(){
  var weekStart = DAL.goalPeriodStart('weekly');
  var first = new Date(weekStart); first.setDate(first.getDate() - (DAL.HEATMAP_WEEKS - 1) * 7);
  var today = new Date(); today.setHours(0,0,0,0);

  var weeks = [], peak = 0, activeDays = 0, total = 0;
  for(var w = 0; w < DAL.HEATMAP_WEEKS; w++){
    var days = [];
    for(var d = 0; d < 7; d++){
      var date = new Date(first);
      date.setDate(date.getDate() + w * 7 + d);
      var future = date > today;
      var words = future ? 0 : DAL.dayWords(DAL.dateKey(date)).total;
      if(words > peak) peak = words;
      if(words > 0){ activeDays++; total += words; }
      days.push({ date: date, words: words, future: future });
    }
    weeks.push(days);
  }

  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Writing Activity</h3>' +
    DAL.infoIcon('One square per day over the last 12 weeks. Darker squares are days you wrote more.') +
    '</div>';

  html += '<div class="chart-summary">' +
    '<div class="chart-stat"><span class="chart-stat-num">' + activeDays + '</span><span class="chart-stat-label">day' + (activeDays === 1 ? '' : 's') + ' written in</span></div>' +
    '<div class="chart-stat"><span class="chart-stat-num">' + peak.toLocaleString() + '</span><span class="chart-stat-label">best day</span></div>' +
  '</div>';

  if(total === 0){
    html += '<div class="chart-empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 2v4M16 2v4"/></svg>' +
      '<p>Nothing to map yet. Each day you write fills in a square here.</p>' +
    '</div>';
    return html;
  }

  html += '<div class="chart-readout" data-readout="heatmap" aria-live="polite">Hover or tap a square for that day.</div>';
  html += DAL.renderHeatmapSvg(weeks, peak);
  html += DAL.renderHeatmapLegend();
  return html;
};

/* Five steps rather than a continuous ramp: distinguishable at a glance, and
   the lightest step still reads as "wrote something" against an empty day. */
DAL.heatLevel = function(words, peak){
  if(words <= 0) return 0;
  if(peak <= 0) return 1;
  var r = words / peak;
  if(r <= 0.25) return 1;
  if(r <= 0.5) return 2;
  if(r <= 0.75) return 3;
  return 4;
};

DAL.renderHeatmapSvg = function(weeks, peak){
  // Geometry is sized so the SVG renders close to 1:1 at its capped width; a
  // smaller viewBox would scale the label text up with it.
  var cell = 26, gap = 6, labelW = 40, monthH = 26;
  var W = labelW + weeks.length * (cell + gap);
  var H = monthH + 7 * (cell + gap);
  var dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  var svg = '<svg class="heatmap-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
    'aria-label="Daily writing activity for the last ' + weeks.length + ' weeks">';

  // Month markers sit above the first column that begins a new month.
  var lastMonth = -1;
  weeks.forEach(function(days, w){
    var m = days[0].date.getMonth();
    if(m !== lastMonth){
      lastMonth = m;
      svg += '<text class="chart-axis-label" x="' + (labelW + w * (cell + gap)) + '" y="' + (monthH - 9) + '">' + DAL.MONTHS_SHORT[m] + '</text>';
    }
  });

  // Only alternate weekday labels are printed; all seven at this cell size
  // would collide.
  [0, 2, 4, 6].forEach(function(d){
    svg += '<text class="chart-axis-label" x="' + (labelW - 9) + '" y="' + (monthH + d * (cell + gap) + cell / 2 + 4) + '" text-anchor="end">' + dayNames[d][0] + '</text>';
  });

  weeks.forEach(function(days, w){
    days.forEach(function(day, d){
      if(day.future) return;
      var lvl = DAL.heatLevel(day.words, peak);
      var label = DAL.longDate(day.date) + ': ' + day.words.toLocaleString() + ' word' + (day.words === 1 ? '' : 's');
      svg += '<g class="heat-group" data-label="' + DAL.escapeHtml(label) + '" tabindex="0" role="listitem" aria-label="' + DAL.escapeHtml(label) + '">' +
        '<title>' + DAL.escapeHtml(label) + '</title>' +
        '<rect class="heat-cell heat-' + lvl + '" x="' + (labelW + w * (cell + gap)) + '" y="' + (monthH + d * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="5"/>' +
      '</g>';
    });
  });

  svg += '</svg>';
  return svg;
};

DAL.renderHeatmapLegend = function(){
  var html = '<div class="heat-legend"><span class="heat-legend-label">Less</span>';
  for(var i = 0; i <= 4; i++){
    html += '<span class="heat-swatch heat-' + i + '" aria-hidden="true"></span>';
  }
  html += '<span class="heat-legend-label">More</span></div>';
  return html;
};

/* Goal progress. Each row counts only the words written inside its own calendar
   period, so a goal empties again when that period rolls over. */
DAL.dashboardCardBody.goals = function(){
  var goals = [
    { label: 'Daily',   period: 'daily',   target: DAL.state.goalDaily,   key: 'goalDaily' },
    { label: 'Weekly',  period: 'weekly',  target: DAL.state.goalWeekly,  key: 'goalWeekly' },
    { label: 'Monthly', period: 'monthly', target: DAL.state.goalMonthly, key: 'goalMonthly' },
    { label: '6-Month', period: 'half',    target: DAL.state.goal6Month,  key: 'goal6Month' },
    { label: 'Yearly',  period: 'yearly',  target: DAL.state.goalYearly,  key: 'goalYearly' }
  ];
  var html = '<div class="dash-card-head"><h3 class="dash-card-title">Writing Goals</h3>' +
    DAL.infoIcon('Each goal counts the words you write inside that period only, and starts again when the period does.') +
    '</div>';
  html += '<div class="goal-list">';
  goals.forEach(function(g){
    var val = DAL.goalProgress(g.period).total;
    var target = g.target > 0 ? g.target : 0;
    var pct = target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0;
    var met = target > 0 && val >= target;
    html += '<div class="goal-row' + (met ? ' met' : '') + '">' +
      '<div class="goal-row-head">' +
        '<span class="goal-label">' + g.label +
          '<span class="goal-period">' + DAL.escapeHtml(DAL.goalPeriodLabel(g.period)) + '</span>' +
        '</span>' +
        '<span class="goal-numbers">' +
          '<span class="goal-current">' + val.toLocaleString() + '</span>' +
          '<span class="goal-sep">/</span>' +
          '<input type="number" class="goal-target" min="0" step="100" value="' + g.target + '" data-goal="' + g.key + '" aria-label="' + g.label + ' word goal">' +
          '<span class="goal-pct">' + (met ? 'Met' : pct + '%') + '</span>' +
        '</span>' +
      '</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
    '</div>';
  });
  html += '</div>';
  return html;
};
DAL.renderProjects = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);
  if(projects.length === 0){
    return '<div class="empty-state">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'+
      '<h3>No Projects Yet</h3><p>Create your first project to start writing.</p>'+
      '<button class="btn primary" data-action="new-project">Create Your First Project</button>'+
      '<div style="margin-top:8px"><button class="btn sm" data-action="import-project">Import project (.json)</button></div>'+
    '</div>';
  }

  var html = '<div class="section-header"><div class="section-title">Projects</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="btn sm" data-action="import-project">Import project (.json)</button>'+
      '<button class="btn primary" data-action="new-project">New Project</button>'+
    '</div></div>';
  html += '<div class="card-grid">';
  projects.forEach(function(p){
    var wc = DAL.getProjectWordCount(p);
    var typeLabel = p.type === 'novel' ? 'Novel' : (p.type === 'rpg' ? 'RPG Adventure' : 'Dual');
    html += '<div class="card hoverable" style="cursor:pointer" data-action="open-project" data-pid="'+p.id+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
        '<div style="font-weight:700;font-size:var(--ts-base)">'+DAL.escapeHtml(p.name)+'</div>'+
        '<div style="display:flex;gap:4px">'+
          '<button class="btn icon sm" data-action="project-settings" data-pid="'+p.id+'" style="width:24px;height:24px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:4px;margin-bottom:8px">'+
        '<span class="badge accent">'+typeLabel+'</span>'+
        '<span class="badge">'+DAL.escapeHtml(p.status)+'</span>'+
      '</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+wc.manuscript+' manuscript words</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px">Edited '+DAL.formatDate(p.updatedAt)+'</div>'+
      '<div style="display:flex;gap:4px;margin-top:8px">'+
        '<button class="btn sm" data-action="export-project" data-pid="'+p.id+'">Export project</button>'+
        '<button class="btn sm danger" data-action="delete-project" data-pid="'+p.id+'">Delete</button>'+
      '</div>'+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.showSaveAsModal = function(){
  if(!DAL.currentProjectId) return;
  var p = DAL.state.projects[DAL.currentProjectId];
  if(!p) return;
  // Suggest "Name - copy-1", bumping the number if that name is already taken.
  var base = p.name.replace(/ - copy-\d+$/, '');
  var n = 1;
  var taken = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id] && DAL.state.projects[id].name; });
  var suggested = base + ' - copy-' + n;
  while(taken.indexOf(suggested) !== -1){ n++; suggested = base + ' - copy-' + n; }
  var html = '<p style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-bottom:10px">Creates a new, independent copy of "'+DAL.escapeHtml(p.name)+'" so you can branch off without touching the original.</p>'+
    '<div class="form-group"><label class="form-label">New Project Name</label><input class="form-input" id="saNewName" value="'+DAL.escapeHtml(suggested)+'"></div>';
  DAL.modal('Save As', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="save-as-confirm">Save As</button>' });
};

DAL.GENRES = ['Fantasy','Science Fiction','Romance','Mystery','Thriller','Horror','Historical','Adventure','Literary Fiction','Young Adult','Children’s','Poetry','Memoir','Biography','Nonfiction','Dungeons & Dragons','Tabletop RPG','Interactive Fiction'];
DAL.genreChoices = function(selected, prefix){
  selected=selected||[];
  return '<fieldset class="form-group genre-choices"><legend class="form-label">Genres <span class="u-hint">choose up to 5</span></legend>'+DAL.GENRES.map(function(genre,index){return '<label class="genre-choice"><input type="checkbox" data-genre-choice="'+prefix+'" value="'+DAL.escapeHtml(genre)+'"'+(selected.indexOf(genre)>=0?' checked':'')+'> '+DAL.escapeHtml(genre)+'</label>';}).join('')+'</fieldset>';
};
DAL.readGenreChoices = function(prefix){return Array.from(document.querySelectorAll('[data-genre-choice="'+prefix+'"]:checked')).map(function(input){return input.value;}).slice(0,5);};

DAL.showNewProjectModal = function(){
  DAL._newProjectDraftId = DAL._newProjectDraftId || DAL.uid('proj');
  var html = '<div class="form-group"><label class="form-label">Project Name</label><input class="form-input" id="npName" placeholder="My Great Novel"></div>'+
    '<div class="form-group"><label class="form-label">Project Type</label><select class="form-select" id="npType">'+
      '<option value="novel">Standard Novel</option>'+
      '<option value="rpg">RPG Adventure</option>'+
      '<option value="dual">Dual (Novel + RPG)</option>'+
    '</select></div>'+DAL.genreChoices([], 'np')+'<div class="form-group"><label class="form-label">Writing language</label><input class="form-input" id="npLanguage" value="en" placeholder="en, en-US, fr, es…"><div class="u-hint">Used by your browser’s built-in spellchecker.</div></div>'+
    '<div class="form-group"><label class="form-label">Folder Connection</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<button class="btn sm" data-action="link-folder-new">Link to folder</button>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)" id="npFolderName">No folder linked</span>'+
    '</div></div>';
  DAL.modal('Create New Project', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="create-project">Create Project</button>' });
};

DAL.showProjectSettingsModal = function(pid){
  var p = DAL.state.projects[pid];
  if(!p) return;
  var html = '<div class="form-group"><label class="form-label">Project Name</label><input class="form-input" id="psName" value="'+DAL.escapeHtml(p.name)+'"></div>'+
    '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="psStatus">'+
      ['development','drafting','proofreading','completed','published'].map(function(s){ return '<option value="'+s+'"'+(p.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'; }).join('')+
    '</select></div>'+DAL.genreChoices(p.genres||[], 'ps')+'<div class="form-group"><label class="form-label">Writing language</label><input class="form-input" id="psLanguage" value="'+DAL.escapeHtml(p.language||'en')+'" placeholder="en, en-US, fr, es…"><div class="u-hint">Used by your browser’s built-in spellchecker.</div></div>'+
    '<div class="form-group"><label class="form-label">Folder Connection</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<button class="btn sm" data-action="link-folder" data-pid="'+pid+'">Link Folder</button>'+
      '<button class="btn sm" data-action="save-project-bundle" data-pid="'+pid+'">Save bundle (.dalz)</button>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(p.linkedFolderName||'Not linked')+'</span>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Cover</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<input type="text" class="form-input" id="psCoverTitle" value="'+DAL.escapeHtml(p.cover.title||'')+'" placeholder="Cover title" style="flex:1">'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<input type="text" class="form-input" id="psCoverSubtitle" value="'+DAL.escapeHtml(p.cover.subtitle||'')+'" placeholder="Subtitle" style="flex:1">'+
      '<input type="text" class="form-input" id="psCoverAuthor" value="'+DAL.escapeHtml(p.cover.author||'')+'" placeholder="Author" style="flex:1">'+
    '</div></div>';
  DAL.modal('Project Settings', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="save-project-settings" data-pid="'+pid+'">Save</button>' });
};

DAL.showDeleteConfirm = function(pid, step){
  var p = DAL.state.projects[pid];
  if(!p) return;
  if(step === 1){
    DAL.modal('Delete Project', '<p>Are you sure you want to delete "'+DAL.escapeHtml(p.name)+'"? This cannot be undone.</p><p style="margin-top:8px;color:var(--c-danger);font-weight:600">Click Delete again to confirm.</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="delete-project-confirm" data-pid="'+pid+'">Delete</button>' });
  }
};

DAL.recoveryKeys = function(){
  var keys=[];
  try{ for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key&&key.indexOf('draftALoreRecovery-')===0)keys.push(key);} }catch(e){}
  return keys.sort().reverse();
};

DAL.showStorageCenter = function(){
  DAL.modal('Storage & Recovery','<div id="storageCenterBody"><p class="writer-muted">Checking browser storage and project assets…</p></div>',{wide:true,footer:'<button class="btn" data-action="backup-workspace">Emergency workspace export</button><button class="btn primary" data-action="manual-save">Save Now</button><button class="btn" data-action="close-modal">Close</button>'});
  var estimate = navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve({});
  var assets = DAL.blobStore&&DAL.blobStore.usage?DAL.blobStore.usage().catch(function(){return {count:0,bytes:0};}):Promise.resolve({count:0,bytes:0});
  Promise.all([estimate,assets]).then(function(values){
    var holder=document.getElementById('storageCenterBody');if(!holder)return;
    var est=values[0]||{}, asset=values[1]||{}, recoveries=DAL.recoveryKeys();
    var h='<div class="report-grid"><div class="report-metric"><strong>'+DAL.escapeHtml(DAL.storageHealth.mode)+'</strong>workspace store</div><div class="report-metric"><strong>'+DAL.formatBytes(DAL.storageHealth.bytes||0)+'</strong>workspace data</div><div class="report-metric"><strong>'+DAL.formatBytes(est.usage||0)+'</strong>browser usage</div><div class="report-metric"><strong>'+DAL.formatBytes(est.quota||0)+'</strong>browser quota</div><div class="report-metric"><strong>'+asset.count+'</strong>stored assets</div><div class="report-metric"><strong>'+DAL.formatBytes(asset.bytes||0)+'</strong>asset bytes</div></div>'+
      '<div class="card" style="margin-top:12px"><strong>Persistence</strong><p class="writer-muted">'+(DAL.storageHealth.persistent?'The latest save is in persistent browser storage.':'The current workspace is only in memory. Export it before closing.')+(DAL.storageHealth.durable?' The browser granted protection from automatic eviction.':' The browser has not guaranteed protection from storage eviction; regular backups remain important.')+'</p><p class="writer-muted">Last successful save: '+(DAL.storageHealth.lastSavedAt?new Date(DAL.storageHealth.lastSavedAt).toLocaleString():'Not recorded')+'</p>'+(DAL.storageHealth.lastError?'<p style="color:var(--c-danger)">'+DAL.escapeHtml(DAL.storageHealth.lastError)+'</p>':'')+'</div>'+
      '<div class="card" style="margin-top:12px"><strong>Linked-folder copy</strong><p class="writer-muted">Status: '+DAL.escapeHtml(DAL.folderSyncHealth.status)+(DAL.folderSyncHealth.lastSyncedAt?' · '+new Date(DAL.folderSyncHealth.lastSyncedAt).toLocaleString():'')+'</p>'+(DAL.folderSyncHealth.lastError?'<p style="color:var(--c-danger)">'+DAL.escapeHtml(DAL.folderSyncHealth.lastError)+'</p>':'')+'</div><h3 style="margin-top:16px">Preserved recovery copies</h3>';
    h += recoveries.length?recoveries.map(function(key){var stamp=parseInt(key.split('-').pop(),10);return '<div class="version-item"><strong>'+(isFinite(stamp)?new Date(stamp).toLocaleString():DAL.escapeHtml(key))+'</strong><div class="writer-tool-actions"><button class="btn sm" data-action="download-recovery" data-recovery-key="'+DAL.escapeHtml(key)+'">Download</button><button class="btn sm" data-action="restore-recovery-confirm" data-recovery-key="'+DAL.escapeHtml(key)+'">Restore</button><button class="btn sm danger" data-action="delete-recovery" data-recovery-key="'+DAL.escapeHtml(key)+'">Delete</button></div></div>';}).join(''):'<p class="writer-muted">No damaged-workspace recovery copies are stored.</p>';
    holder.innerHTML=h;
  });
};

DAL.privacyPolicyContent = function(){
  return '<div class="privacy-policy">'+
    '<p><strong>Effective and last updated August 30, 2026</strong></p>'+
    '<p>Draft A Lore is an offline-first writing and RPG-building app by Hexxis-cmd (Daymien Vanhorn). It has no user accounts, advertising, analytics, tracking, or telemetry.</p>'+
    '<h3>Information stored on your device</h3><p>Projects, manuscripts, notes, character and RPG data, imported images, audio, fonts, preferences, recovery copies, and backups are processed and stored locally. The developer does not receive this content or sell personal information.</p>'+
    '<h3>Files, folders, imports, and exports</h3><p>File and media pickers open only after you choose an import, export, image, audio, font, backup, or folder action. Android folder linking uses the system folder picker and grants access only to the folder you select. Exports and portable bundles are created only when you request them.</p>'+
    '<h3>Optional Google Fonts connection</h3><p>Online Fonts is off by default, and the app works without it. If enabled while connected, Draft A Lore requests fonts from Google over HTTPS. Google may receive an IP address, which can reveal an approximate location, and browser or device request details. Turn Online Fonts off to stop future requests.</p>'+
    '<h3>Retention, deletion, and security</h3><p>Use Settings → Clear All Data to remove local app data. Clearing browser or Android app storage and uninstalling also remove local projects. Exported or synchronized files remain until you delete them. Project files rely on your device security and are not separately encrypted by the app.</p>'+
    '<h3>Children</h3><p>Draft A Lore is intended for a general audience age 13 and older and is not directed to children under 13. The developer does not knowingly collect personal information from users.</p>'+
    '<h3>Contact and changes</h3><p>Material policy changes will be published with a new effective date. GitHub issues are public, so do not include a private project or other sensitive information.</p>'+
    '<p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a></p>'+
    '<p><a href="https://github.com/Hexxis-cmd/Draft-A-Lore/issues" target="_blank" rel="noopener">Contact through GitHub Issues</a></p>'+
  '</div>';
};

DAL.showPrivacyPolicy = function(){
  DAL.modal('Privacy Policy', DAL.privacyPolicyContent(), {wide:true, footer:'<button class="btn primary" data-action="close-modal">Done</button>'});
};
DAL.renderSettings = function(){
  var html = '<div class="u-measure u-auto">';

  html += '<div class="section-header"><div class="section-title">Theme</div></div>';
  html += '<div class="theme-grid">';
  DAL.THEMES.forEach(function(t){
    var active = DAL.state.appTheme === t.id;
    // Swatch colours come from the theme's own palette tokens in styles.css.
    html += '<div class="card theme-option'+(active?' active':' hoverable')+'" data-action="set-theme" data-theme="'+t.id+'" data-swatch="'+t.id+'" role="button" tabindex="0" aria-pressed="'+(active?'true':'false')+'">'+
      '<div class="theme-option-head">'+
        '<span class="theme-chip theme-chip-bg" aria-hidden="true"></span>'+
        '<span class="theme-chip theme-chip-grad" aria-hidden="true"></span>'+
        '<span class="theme-option-name">'+DAL.escapeHtml(t.name)+'</span>'+
      '</div>'+
    '</div>';
  });
  html += '</div>';

  html += '<div class="section-header"><div class="section-title">Author Information</div></div>';
  html += '<div class="card" style="margin-bottom:20px">';
  html += '<div class="form-group"><label class="form-label">Author Photo</label>'+
    '<div style="display:flex;align-items:center;gap:12px">'+
    '<div class="author-avatar-preview">'+(DAL.state.authorAvatar?'<img src="'+DAL.state.authorAvatar+'">':DAL.escapeHtml((DAL.state.authorName||'?').charAt(0).toUpperCase()))+'</div>'+
    '<div>'+
      '<input type="file" id="authorAvatarInput" accept="image/*" style="display:none">'+
      '<button class="btn sm" data-action="upload-author-avatar">Upload Photo</button>'+
      (DAL.state.authorAvatar?' <button class="btn sm danger" data-action="remove-author-avatar">Remove</button>':'')+
    '</div></div></div>';
  html += '<div class="form-group"><label class="form-label">Author Name (or Pen Name)</label><input class="form-input" id="setAuthorName" value="'+DAL.escapeHtml(DAL.state.authorName||'')+'" placeholder="Your name or alias"></div>'+
    '<div class="form-group"><label class="form-label">Meet the Author</label><textarea class="form-textarea" id="setAuthorBio" placeholder="Write a short bio that readers will see...">'+DAL.escapeHtml(DAL.state.authorBio||'')+'</textarea></div>'+
    '<div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="setAutoFill" '+(DAL.state.autoFillAuthor?'checked':'')+'><label for="setAutoFill" style="font-size:var(--ts-sm);cursor:pointer">Auto-fill author info into covers, title pages, and exports</label></div>'+
    '<button class="btn primary" style="margin-top:12px" data-action="save-author-info">Save Author Info</button></div>';

  html += '<div class="section-header"><div class="section-title">Custom Fonts</div></div>';
  html += '<div class="card" style="margin-bottom:20px">'+
    '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:12px">Import .ttf, .otf, .woff, or .woff2 fonts. Available in all editors.</p>'+
    '<input type="file" id="fontImport" accept=".ttf,.otf,.woff,.woff2" style="display:none">'+
    '<button class="btn" data-action="import-font">Import Font</button>'+
    '<div style="margin-top:12px">';
  if(DAL.state.customFonts.length){
    DAL.state.customFonts.forEach(function(f,i){
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--c-divider)">'+
        '<span style="font-size:var(--ts-sm)">'+DAL.escapeHtml(f.name)+'</span>'+
        '<button class="btn sm danger" data-action="remove-font" data-idx="'+i+'">Remove</button></div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint)">No custom fonts imported.</div>';
  }
  html += '</div></div>';

  var online = DAL.isOnline();
  var onlineFonts = !!DAL.state.onlineFontsEnabled;
  html += '<div class="card" style="margin-bottom:20px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px">'+
      '<div><strong>Optional Online Fonts</strong><div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:3px">'+(onlineFonts?(online?'Enabled and connected':'Enabled, currently offline'):'Off — no font network requests')+'</div></div>'+
      '<button class="switch" data-action="toggle-online-fonts" aria-pressed="'+onlineFonts+'" aria-label="Toggle optional Google Fonts"><span class="track"></span></button>'+
    '</div>'+
    '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:10px;line-height:1.55">System and imported fonts work fully offline. If you enable this option, the app contacts Google Fonts while online; Google receives standard connection information. Read the Privacy Policy below for details.</p>'+
    '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  DAL.ONLINE_FONTS.forEach(function(f){
    html += '<span style="font-family:'+(onlineFonts&&online?'\''+f.family+'\', ':'')+'Georgia, serif;font-size:var(--ts-sm);padding:5px 10px;border:1px solid var(--c-border);border-radius:999px;'+(onlineFonts&&online?'':'opacity:.45')+'">'+DAL.escapeHtml(f.name)+'</span>';
  });
  html += '</div>';
  html += '</div>';

  html += '<div class="section-header"><div class="section-title">Saving</div></div>';
  html += '<div class="card" style="margin-bottom:20px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">'+
      '<div class="u-grow-label">'+
        '<div style="font-weight:600;margin-bottom:2px">Automatic saving</div>'+
        '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);line-height:1.5">Automatic saving covers manuscript typing. Project actions save immediately. Pending work saves when the app closes.</div>'+
      '</div>'+
      '<button class="switch" data-action="toggle-autosave" aria-pressed="'+DAL.state.autosave+'" aria-label="Toggle automatic saving of manuscript typing"><span class="track"></span></button>'+
    '</div>'+
    '<div style="border-top:1px solid var(--c-divider);padding-top:12px;margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
      '<button class="btn" data-action="manual-save">Save Now</button>'+
      '<button class="btn" data-action="storage-center">Storage & Recovery…</button>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">Writes all projects and settings to this device immediately.</span>'+
    '</div>'+
  '</div>';

  html += '<div class="section-header"><div class="section-title">Backup & Data</div></div>';
  html += '<div class="card" style="margin-bottom:20px">'+
    '<p class="export-group-note">A workspace backup holds every project plus your settings. Restoring one replaces everything currently on this device. To move a single project instead, use its Export tool and then Import project.</p>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
      '<button class="btn" data-action="backup-workspace">Download backup of all projects (.json)</button>'+
      '<button class="btn" data-action="restore-workspace">Restore backup of all projects…</button>'+
      '<input type="file" id="restoreInput" accept=".json" style="display:none">'+
    '</div>'+
    '<div style="border-top:1px solid var(--c-divider);padding-top:12px">'+
      '<button class="btn danger" data-action="clear-data">Clear All Data</button>'+
    '</div></div>';

  html += '<div class="section-header"><div class="section-title">Privacy</div></div>'+
    '<div class="card" style="margin-bottom:20px">'+
      '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);line-height:1.55;margin-bottom:12px">No account, ads, analytics, or telemetry. Your creative work is stored on this device and leaves only through actions you choose.</p>'+
      '<button class="btn" data-action="show-privacy-policy">Read Privacy Policy</button>'+
    '</div>';

  // Version + credit. This attribution is required by the project license
  // (see LICENSE.md, Supplemental Term S3) and must stay visible in forks.
  html += '<div style="text-align:center;font-size:var(--ts-xs);color:var(--c-text-faint);padding:16px;line-height:1.7">'+
    'Draft A Lore v1.0.0<br>'+
    'Drafted By Hexxis-cmd (Daymien Vanhorn)<br>'+
    '<a href="https://github.com/Hexxis-cmd/Draft-A-Lore" target="_blank" rel="noopener" style="color:var(--c-text-faint)">Draft A Lore on GitHub</a><br>'+
    'Free for noncommercial use \u2014 commercial use of the app itself requires a license<br>'+
    'Whatever you write here is yours: selling your own work needs no permission'+
  '</div>';
  html += '</div>';
  return html;
};
DAL.renderLibrary = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(function(p){ return p && (p.status === 'completed' || p.status === 'published'); });
  if(projects.length === 0){
    return '<div class="empty-state">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'+
      '<h3>Library Empty</h3><p>Completed and published projects will appear here.</p></div>';
  }
  var colors = ['var(--c-accent)','var(--c-info)','var(--c-success)','var(--c-warning)','var(--c-danger)'];
  var html = '<div class="section-header"><div class="section-title">Completed Books Library</div></div>';
  html += '<div class="library-grid">';
  projects.forEach(function(p, i){
    var color = colors[i % colors.length];
    var author = p.cover.author || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
    html += '<div class="book-spine" data-action="open-reader" data-pid="'+p.id+'" style="background:linear-gradient(135deg,'+color+','+color+'88);color:#fff">'+
      '<div class="book-spine-title">'+DAL.escapeHtml(p.cover.title||p.name)+'</div>'+
      (author ? '<div class="book-spine-author">'+DAL.escapeHtml(author)+'</div>' : '')+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.renderBookReader = function(pid){
  var p = DAL.state.projects[pid];
  if(!p) return '<div class="empty-state"><h3>Project not found</h3></div>';
  var pages = [];
  var author = p.cover.author || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
  pages.push({ type:'cover', html: '<div class="book-cover"><div class="book-cover-title">'+DAL.escapeHtml(p.cover.title||p.name)+'</div>'+(p.cover.subtitle?'<div style="font-size:var(--ts-sm);opacity:.7;margin-bottom:12px">'+DAL.escapeHtml(p.cover.subtitle)+'</div>':'')+(author?'<div class="book-cover-author">'+DAL.escapeHtml(author)+'</div>':'')+'</div>' });
  var tocHtml = '<h1>Table of Contents</h1>';
  if(p.chapters && p.chapters.length){
    p.chapters.forEach(function(ch, i){
      tocHtml += '<p style="cursor:pointer;color:var(--c-accent)" data-action="reader-goto" data-page="'+(i+2)+'">'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</p>';
    });
  }
  pages.push({ type:'toc', html: tocHtml });
  if(p.chapters){
    p.chapters.forEach(function(ch){
      /* Chapter prose is wrapped so a drop capital can be attached to the first
         paragraph of the chapter itself and nowhere else. Without the wrapper the
         rule also hit the first line of the table of contents. */
      pages.push({ type:'chapter', html: '<h2>'+DAL.escapeHtml(ch.title)+'</h2><div class="chapter-prose">'+ch.contentHTML+'</div>' });
    });
  }
  if(DAL.readerPage >= pages.length) DAL.readerPage = 0;

  /* Chapters follow the cover and the table of contents, so the narrator can work
     out which chapter is showing and use its bound voiceover if it has one. */
  var readCh = (p.chapters || [])[DAL.readerPage - 2] || null;
  DAL._readAloudCid = readCh ? readCh.id : '';

  var html = '<div class="book-reader"'+DAL.readerStyleAttr()+'>';
  html += '<div class="book-reader-toolbar">'+
    '<button class="btn sm" data-action="close-reader">← Back to Library</button>'+
    DAL.readerControls()+
    '</div>';
  html += '<div class="book-page-container"><div class="book-page" id="bookPage">'+pages[DAL.readerPage].html+'<div class="book-page-num">'+(DAL.readerPage+1)+' / '+pages.length+'</div></div></div>';
  html += '<div class="book-nav">'+
    '<button class="btn sm" data-action="reader-prev" '+(DAL.readerPage<=0?'disabled':'')+'>← Previous</button>'+
    '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(DAL.readerPage+1)+' / '+pages.length+'</span>'+
    '<button class="btn sm" data-action="reader-next" '+(DAL.readerPage>=pages.length-1?'disabled':'')+'>Next →</button>'+
  '</div></div>';
  return html;
};
DAL.handleClick = function(action, el, e){
  if(action === 'set-theme'){ DAL.setTheme(el.getAttribute('data-theme')); DAL.render(); return; }
  if(action === 'dash-organize-on'){ DAL.organizeDashboard = true; DAL.render(); return; }
  if(action === 'dash-organize-off'){ DAL.organizeDashboard = false; DAL.render(); return; }

  if(action === 'dash-move'){
    var moveId = el.getAttribute('data-card');
    var dir = parseInt(el.getAttribute('data-dir'), 10);
    if(DAL.moveDashboardCard(moveId, dir)){
      DAL.render();
      // Keep the keyboard on the button that was just pressed, so a card can be
      // moved several positions without hunting for focus after each re-render.
      var again = document.querySelector('[data-action="dash-move"][data-card="' + moveId + '"][data-dir="' + dir + '"]');
      if(again && !again.disabled) again.focus();
      else {
        var opposite = document.querySelector('[data-action="dash-move"][data-card="' + moveId + '"][data-dir="' + (-dir) + '"]');
        if(opposite) opposite.focus();
      }
    }
    return;
  }

  if(action === 'dash-width'){
    DAL.setDashboardCardSize(el.getAttribute('data-card'), 'w', el.getAttribute('data-w'));
    DAL.render();
    return;
  }

  if(action === 'dash-height'){
    var hId = el.getAttribute('data-card');
    var cur = DAL.dashboardLayout().size[hId];
    DAL.setDashboardCardSize(hId, 'h', (cur && cur.h === 'tall') ? 'normal' : 'tall');
    DAL.render();
    return;
  }

  if(action === 'dash-hide'){
    // No toast here: the Hidden cards tray is already on screen and names the
    // card, so a toast per hide would just stack up over the page.
    DAL.setDashboardCardHidden(el.getAttribute('data-card'), true);
    DAL.render();
    return;
  }

  if(action === 'dash-show'){
    DAL.setDashboardCardHidden(el.getAttribute('data-card'), false);
    DAL.render();
    return;
  }

  if(action === 'analytics-range'){
    DAL.state.analyticsRange = el.getAttribute('data-range');
    DAL.saveState(true);
    DAL.render();
    return;
  }

  if(action === 'dash-reset'){
    DAL.resetDashboardLayout();
    DAL.render();
    DAL.toast('Dashboard layout reset to default.', 'info');
    return;
  }

  if(action === 'save-author-info'){
    DAL.state.authorName = document.getElementById('setAuthorName').value;
    DAL.state.authorBio = document.getElementById('setAuthorBio').value;
    DAL.state.autoFillAuthor = document.getElementById('setAutoFill').checked;
    DAL.saveState(); DAL.render(); DAL.toast('Author info saved','success');
    return;
  }

  if(action === 'import-font'){ document.getElementById('fontImport').click(); return; }

  if(action === 'upload-author-avatar'){ document.getElementById('authorAvatarInput').click(); return; }

  if(action === 'remove-author-avatar'){
    DAL.state.authorAvatar = '';
    DAL.saveState(); DAL.render(); DAL.toast('Photo removed','info');
    return;
  }

  if(action === 'remove-font'){
    var idx = parseInt(el.getAttribute('data-idx'));
    DAL.state.customFonts.splice(idx, 1);
    DAL.saveState(); DAL.render(); DAL.toast('Font removed','info');
    return;
  }

  if(action === 'backup-workspace'){ DAL.downloadJSON('draft-a-lore-workspace-backup-'+DAL.todayKey()+'.json', DAL.state); DAL.toast('Backup of all projects downloaded.','success'); return; }

  if(action === 'storage-center'){ DAL.showStorageCenter(); return; }
  if(action === 'download-recovery'){
    try{ var recoveryKey=el.getAttribute('data-recovery-key'), recovery=localStorage.getItem(recoveryKey); if(!recovery)throw new Error('Recovery copy is no longer available.'); DAL.download(recoveryKey+'.json',recovery,'application/json'); }
    catch(recoveryError){DAL.toast(recoveryError.message,'error');} return;
  }
  if(action === 'delete-recovery'){
    try{localStorage.removeItem(el.getAttribute('data-recovery-key'));DAL.showStorageCenter();}catch(deleteRecoveryError){DAL.toast(deleteRecoveryError.message,'error');} return;
  }
  if(action === 'restore-recovery-confirm'){var restoreKey=el.getAttribute('data-recovery-key');DAL.modal('Restore Recovery Copy','<p>This replaces the current workspace with the preserved copy. Download an emergency workspace export first if you need the current state.</p>',{footer:'<button class="btn" data-action="storage-center">Cancel</button><button class="btn danger" data-action="restore-recovery-now" data-recovery-key="'+DAL.escapeHtml(restoreKey)+'">Restore copy</button>'});return;}
  if(action === 'restore-recovery-now'){
    try{var restoreRaw=localStorage.getItem(el.getAttribute('data-recovery-key'));DAL.state=DAL.normalizeWorkspace(JSON.parse(restoreRaw),true);DAL.finishStateLoad();Promise.resolve(DAL.saveState(true)).then(function(ok){DAL.closeModal();DAL.navigate('dashboard');DAL.toast(ok?'Recovery copy restored':'The copy loaded, but persistent saving failed',ok?'success':'error');});}catch(restoreCopyError){DAL.toast('Could not restore that copy: '+restoreCopyError.message,'error');}return;
  }

  if(action === 'restore-workspace'){ document.getElementById('restoreInput').click(); return; }

  if(action === 'clear-data'){
    DAL.modal('Clear All Data', '<p style="color:var(--c-danger)">This will permanently delete ALL projects, settings, and data.</p><p style="margin-top:8px;font-weight:600">Click Clear again to confirm.</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="clear-data-confirm">Clear Everything</button>' });
    return;
  }

  if(action === 'clear-data-confirm'){
    DAL._storage.removeItem('draftALore');
    DAL._storage.removeItem('draftALoreSavedAt');
    if(DAL.stateDB) DAL.stateDB.remove().catch(function(){});
    if(DAL.blobStore && DAL.blobStore.clear) DAL.blobStore.clear().catch(function(){});
    DAL.state = DAL.defaultState();
    DAL.closeModal(); DAL.render(); DAL.toast('All data cleared','warning');
    return;
  }

  if(action === 'open-project'){
    var pid = el.getAttribute('data-pid');
    DAL.navigate('workspace', pid);
    return;
  }

  if(action === 'new-project'){ DAL.showNewProjectModal(); return; }

  if(action === 'create-project'){
    var name = document.getElementById('npName').value.trim() || 'Untitled Project';
    var type = document.getElementById('npType').value;
    var proj = DAL.defaultProject(name, type);
    if(DAL._newProjectDraftId) proj.id = DAL._newProjectDraftId;
    proj.language = (document.getElementById('npLanguage')||{}).value || 'en';
    proj.genres = DAL.readGenreChoices('np');
    var pendingFolder = DAL.folderHandles[proj.id];
    if(pendingFolder) proj.linkedFolderName = pendingFolder.name || 'Linked folder';
    DAL.state.projects[proj.id] = proj;
    DAL.state.projectOrder.push(proj.id);
    DAL.saveState(); DAL.closeModal();
    DAL.navigate('workspace', proj.id);
    DAL._newProjectDraftId = null;
    if(pendingFolder) DAL.queueFolderSync();
    DAL.toast('Project created','success');
    return;
  }

  if(action === 'save-as-confirm'){
    var srcId = DAL.currentProjectId;
    var src = srcId && DAL.state.projects[srcId];
    if(!src) return;
    var newName = document.getElementById('saNewName').value.trim() || (src.name + ' - copy-1');
    var copy = DAL.clone(src);
    // A Save As copy is a brand-new file: fresh id/timestamps, no shared undo
    // history/version snapshots/folder link with the original.
    copy.id = DAL.uid('proj');
    copy.name = newName;
    copy.cover = copy.cover || {};
    copy.cover.title = newName;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    copy.history = []; copy.historyIndex = -1;
    copy.versions = [];
    copy.folderHandle = null;
    copy.linkedFolderName = null;
    delete DAL.folderHandles[copy.id];
    DAL.state.projects[copy.id] = copy;
    DAL.state.projectOrder.push(copy.id);
    DAL.saveState(true); DAL.closeModal();
    DAL.navigate('workspace', copy.id);
    DAL.toast('Saved as "'+newName+'"', 'success');
    return;
  }

  if(action === 'import-project'){
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = function(){
      if(inp.files[0]) DAL.readJSON(inp.files[0], function(data, err){
        if(err){ DAL.toast('Choose a Draft A Lore project JSON file.','error'); return; }
        try{ data = DAL.adoptImportedProject(data); }catch(importError){ DAL.toast(importError.message,'error'); return; }
        DAL.saveState(true); DAL.render(); DAL.toast('Project added from JSON.','success');
      });
    };
    inp.click();
    return;
  }

  if(action === 'project-settings'){ e.stopPropagation(); DAL.showProjectSettingsModal(el.getAttribute('data-pid')); return; }

  if(action === 'save-project-settings'){
    var spid = el.getAttribute('data-pid');
    var sp = DAL.state.projects[spid];
    if(sp){
      sp.name = document.getElementById('psName').value.trim() || sp.name;
      sp.status = document.getElementById('psStatus').value;
      sp.language = document.getElementById('psLanguage').value.trim() || 'en';
      sp.genres = DAL.readGenreChoices('ps');
      sp.cover.title = document.getElementById('psCoverTitle').value;
      sp.cover.subtitle = document.getElementById('psCoverSubtitle').value;
      sp.cover.author = document.getElementById('psCoverAuthor').value;
      sp.updatedAt = Date.now();
      DAL.saveState(); DAL.closeModal(); DAL.render(); DAL.toast('Settings saved','success');
    }
    return;
  }

  if(action === 'export-project'){
    e.stopPropagation();
    var epid = el.getAttribute('data-pid');
    DAL.showExportModal(epid);
    return;
  }

  if(action === 'delete-project'){
    e.stopPropagation();
    DAL.showDeleteConfirm(el.getAttribute('data-pid'), 1);
    return;
  }

  if(action === 'delete-project-confirm'){
    var dpid = el.getAttribute('data-pid');
    delete DAL.state.projects[dpid];
    DAL.state.projectOrder = DAL.state.projectOrder.filter(function(id){ return id !== dpid; });
    DAL.saveState(); DAL.closeModal(); DAL.render(); DAL.toast('Project deleted','warning');
    return;
  }

  if(action === 'link-folder' || action === 'link-folder-new'){
    var lpid = el.getAttribute('data-pid') || (action === 'link-folder-new' ? DAL._newProjectDraftId : DAL.currentProjectId);
    DAL.linkFolder(lpid);
    return;
  }

  if(action === 'open-reader'){
    DAL._readerPid = el.getAttribute('data-pid');
    DAL.readerPage = 0;
    DAL._inReader = true;
    document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
    return;
  }

  if(action === 'close-reader'){
    DAL._inReader = false;
    DAL.navigate('library');
    return;
  }

  if(action === 'reader-prev'){
    if(DAL.readerPage > 0){ DAL.readerPage--; DAL.flipPage(); }
    return;
  }
  if(action === 'reader-next'){
    DAL.readerPage++; DAL.flipPage();
    return;
  }
  if(action === 'reader-goto'){
    DAL.readerPage = parseInt(el.getAttribute('data-page')) || 0;
    DAL.flipPage();
    return;
  }
  /* Typeface, size, spacing, tint and drop caps all land here. The shared
     handler repaints whichever reader is open in place, so the page being read
     and any narration under way both survive the change. */
  if(DAL.applyReaderPref(action, el)) return;

  // The canvas view controls come first because both boards share them.
  if(DAL.handleCanvasClick) DAL.handleCanvasClick(action, el, e);
  if(DAL.handleWorkspaceClick) DAL.handleWorkspaceClick(action, el, e);
  if(DAL.handleStoryClick) DAL.handleStoryClick(action, el, e);
  if(DAL.handleAdventureClick) DAL.handleAdventureClick(action, el, e);
};

DAL.flipPage = function(){
  var page = document.getElementById('bookPage');
  if(page){
    page.classList.add('flipping');
    setTimeout(function(){
      document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
    }, 250);
  } else {
    document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
  }
};
document.addEventListener('input', function(e){
  var el = e.target;
  if(el.hasAttribute('data-field')){
    var field = el.getAttribute('data-field');
    if(field === 'authorName') DAL.state.authorName = el.value;
    else if(field === 'authorBio') DAL.state.authorBio = el.value;
    else if(field === 'autoFillAuthor') DAL.state.autoFillAuthor = el.checked;
    DAL.saveState();
  }
  if(el.hasAttribute('data-goal')){
    var key = el.getAttribute('data-goal');
    DAL.state[key] = parseInt(el.value) || 0;
    DAL.saveState();
  }
  if(el.hasAttribute('data-project-goal')){
    var gProj = DAL.state.projects[el.getAttribute('data-pid')];
    if(gProj){
      var gField = el.getAttribute('data-project-goal');
      var gGoal = DAL.projectGoal(gProj);
      if(gField === 'target') gGoal.target = Math.max(0, parseInt(el.value, 10) || 0);
      else gGoal.deadline = el.value || '';
      DAL.saveState();
    }
  }
  if(el.hasAttribute('data-illustration-name')){
    var projIllName = DAL.state.projects[DAL.currentProjectId];
    var illIdx = parseInt(el.getAttribute('data-illustration-name'));
    if(projIllName.images && projIllName.images[illIdx]){
      projIllName.images[illIdx].name = el.value;
      DAL.saveState();
    }
  }
  if(el.hasAttribute('data-illustration-page')){
    var projIllPageInput = DAL.state.projects[DAL.currentProjectId];
    var pageInputIdx = parseInt(el.getAttribute('data-illustration-page'),10);
    var pageInputImage = projIllPageInput.images && projIllPageInput.images[pageInputIdx];
    if(pageInputImage){
      var inputPage = Math.max(0,parseInt(el.value,10)||0);
      if(inputPage){
        projIllPageInput.images.forEach(function(image,index){ if(index!==pageInputIdx && Number(image.bookPage)===inputPage) image.bookPage=0; });
      }
      pageInputImage.bookPage = inputPage;
      if(inputPage===1){ pageInputImage.category='cover'; pageInputImage.pageFit='cover'; }
      var pageLabel = el.closest('.illustration-info');
      pageLabel = pageLabel && pageLabel.querySelector('.illustration-page-label');
      if(pageLabel) pageLabel.textContent = DAL.bookPageLabel(projIllPageInput,inputPage);
      DAL.saveState();
    }
  }
});

document.addEventListener('change', function(e){
  var el = e.target;
  if(el.hasAttribute && el.hasAttribute('data-genre-choice')){
    var prefix=el.getAttribute('data-genre-choice');
    if(DAL.readGenreChoices(prefix).length>=5 && el.checked && document.querySelectorAll('[data-genre-choice="'+prefix+'"]:checked').length>5){el.checked=false;DAL.toast('Choose up to five genres.','warning');}
    return;
  }
  // Project goal fields save on every keystroke but only redraw once the value is
  // committed; re-rendering mid-number would pull focus out of the input.
  if(el.hasAttribute && el.hasAttribute('data-project-goal')){
    DAL.render();
    return;
  }
  if(el.id === 'authorAvatarInput' && el.files[0]){
    DAL.readImageAsDataURL(el.files[0], function(dataUrl){
      DAL.state.authorAvatar = dataUrl;
      DAL.saveState(); DAL.render(); DAL.toast('Author photo updated','success');
    });
    return;
  }
  if(el.id === 'fontImport' && el.files[0]){
    var file = el.files[0];
    var reader = new FileReader();
    reader.onload = function(ev){
      var name = file.name.replace(/\.[^.]+$/,'');
      DAL.state.customFonts.push({ name: name, dataUrl: ev.target.result });
      DAL.loadCustomFonts();
      DAL.saveState(); DAL.render();
      DAL.toast('Font imported: '+name,'success');
    };
    reader.readAsDataURL(file);
    return;
  }
  if(el.id === 'restoreInput' && el.files[0]){
    DAL.readJSON(el.files[0], function(data, err){
      if(err || !data.projects){ DAL.toast('Invalid backup file','error'); return; }
      try{ data = DAL.normalizeWorkspace(data, true); }catch(restoreError){ DAL.toast(restoreError.message,'error'); return; }
      DAL.modal('Restore Backup', '<p>This will replace ALL current data with the backup. Continue?</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="restore-confirm">Restore</button>' });
      DAL._pendingRestore = data;
    });
    return;
  }
  if(el.id === 'illustrationUpload' && el.files.length){
    var projIll2 = DAL.state.projects[DAL.currentProjectId];
    if(!projIll2.images) projIll2.images = [];
    var remaining = el.files.length;
    Array.prototype.forEach.call(el.files, function(f){
      DAL.compressImage(f, 1800, 0.88, function(dataUrl){
        var name = f.name.replace(/\.[^.]+$/,'');
        projIll2.images.push({ id: DAL.uid('img'), name: name, dataUrl: dataUrl, category: 'other', usedIn: [], bookPage:0, pageFit:'contain' });
        remaining--;
        if(remaining === 0){
          DAL.saveState(); DAL.render();
          DAL.toast(el.files.length+' image'+(el.files.length!==1?'s':'')+' added to library','success');
        }
      });
    });
    return;
  }
  if(el.id === 'chapterImageInput' && el.files[0]){
    var projChImg = DAL.state.projects[DAL.currentProjectId];
    var chImg = projChImg.chapters.find(function(c){ return c.id === DAL._uploadChapterCid; });
    if(chImg){
      if(!chImg.images) chImg.images = [];
      if(chImg.images.length >= 2){ DAL.toast('Max 2 images per chapter','error'); return; }
      DAL.compressImage(el.files[0], 1000, 0.82, function(dataUrl){
        var imgName = el.files[0].name.replace(/\.[^.]+$/,'');
        chImg.images.push({ id: DAL.uid('img'), name: imgName, dataUrl: dataUrl });
        DAL.saveState(); DAL.render(); DAL.toast('Chapter image added','success');
      });
    }
    DAL._uploadChapterCid = null;
    return;
  }
  if(el.hasAttribute('data-illustration-category')){
    var projIllCat = DAL.state.projects[DAL.currentProjectId];
    var catIdx = parseInt(el.getAttribute('data-illustration-category'));
    if(projIllCat.images && projIllCat.images[catIdx]){
      projIllCat.images[catIdx].category = el.value;
      DAL.saveState();
    }
    return;
  }
  if(el.hasAttribute('data-illustration-page')){
    var projIllPage = DAL.state.projects[DAL.currentProjectId];
    var pageIdx = parseInt(el.getAttribute('data-illustration-page'),10);
    var pageImage = projIllPage.images && projIllPage.images[pageIdx];
    if(pageImage){
      var page = Math.max(0,parseInt(el.value,10)||0);
      if(page){
        projIllPage.images.forEach(function(image,index){ if(index!==pageIdx && Number(image.bookPage)===page) image.bookPage=0; });
      }
      pageImage.bookPage = page;
      if(page===1){ pageImage.category='cover'; pageImage.pageFit='cover'; }
      DAL.saveState(); DAL.render();
      DAL.toast(page?DAL.bookPageLabel(projIllPage,page):'Illustration removed from the book','success');
    }
    return;
  }
  if(el.hasAttribute('data-illustration-fit')){
    var projIllFit = DAL.state.projects[DAL.currentProjectId];
    var fitImage = projIllFit.images && projIllFit.images[parseInt(el.getAttribute('data-illustration-fit'),10)];
    if(fitImage){ fitImage.pageFit = el.value==='cover'?'cover':'contain'; DAL.saveState(); DAL.render(); }
    return;
  }
  if(el.id === 'itemImageInput' && el.files[0]){
    var projItem = DAL.state.projects[DAL.currentProjectId];
    var advItem = DAL.ensureAdventure(projItem);
    var itemIdx2 = parseInt(DAL._uploadItemIdx);
    if(advItem.items && advItem.items[itemIdx2]){
      DAL.compressImage(el.files[0], 400, 0.8, function(dataUrl){
        advItem.items[itemIdx2].imageDataUrl = dataUrl;
        DAL.saveState(); DAL.render(); DAL.toast('Item illustration set','success');
      });
    }
    DAL._uploadItemIdx = null;
    return;
  }
  if(el.id === 'sceneImageInput' && el.files[0]){
    var projScene = DAL.state.projects[DAL.currentProjectId];
    var advScene = DAL.ensureAdventure(projScene);
    var nodeScene = advScene.nodes.find(function(n){ return n.id === DAL._uploadSceneNodeId; });
    if(nodeScene){
      if(!nodeScene.images) nodeScene.images = [];
      DAL.compressImage(el.files[0], 800, 0.82, function(dataUrl){
        nodeScene.images.push({ id: DAL.uid('img'), name: el.files[0].name.replace(/\.[^.]+$/,''), dataUrl: dataUrl });
        DAL.saveState(); DAL.render(); DAL.toast('Scene illustration added','success');
      });
    }
    DAL._uploadSceneNodeId = null;
    return;
  }
});

document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action="restore-confirm"]');
  if(!el) return;
  if(DAL._pendingRestore){
    DAL.state = DAL.normalizeWorkspace(DAL._pendingRestore, true);
    DAL._pendingRestore = null;
    DAL.saveState(true); DAL.closeModal(); DAL.render();
    DAL.toast('Backup restored','success');
  }
});
