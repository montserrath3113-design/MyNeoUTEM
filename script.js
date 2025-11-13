/* script.js */
/*
  MyNeoUTEM — Versión liviana (JS)
  - Edita defaultPhrases para cambiar frases.
  - Guarda todo en localStorage.
  - Funciones principales: tareas, proyectos, notas, ajustes, export/import, alertas simples.
*/

const LS = {
  TASKS: 'mneo_tasks_v1',
  PROJECTS: 'mneo_projects_v1',
  NOTES: 'mneo_notes_v1',
  SETTINGS: 'mneo_settings_v1'
};

// Frases motivacionales (edítalas aquí)
const defaultPhrases = [
  '🚀 Hoy es un buen día para avanzar.',
  '🌈 Tu versión más brillante está cargando.',
  '💫 Activa tu modo Neo.',
  '✨ Una tarea menos, un paso más cerca.',
  '🔋 Energía al máximo — sigue así.'
];

// DOM
const neoPhrase = document.getElementById('neoPhrase');
const notesArea = document.getElementById('notesArea');
const noteFont = document.getElementById('noteFont');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const projectModal = document.getElementById('projectModal');
const addProjectBtn = document.getElementById('addProject');
const projectsList = document.getElementById('projectsList');
const tasksList = document.getElementById('tasksList');
const filterProject = document.getElementById('filterProject');
const filterPriority = document.getElementById('filterPriority');
const searchTask = document.getElementById('searchTask');
const progressPercent = document.getElementById('progressPercent');
const progressRingHolder = document.getElementById('progressRing');
const saveTaskBtn = document.getElementById('saveTask');
const cancelTaskBtn = document.getElementById('cancelTask');
const saveProjectBtn = document.getElementById('saveProject');
const cancelProjectBtn = document.getElementById('cancelProject');
const projectNameInput = document.getElementById('projectName');
const projectColorInput = document.getElementById('projectColor');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskDue = document.getElementById('taskDue');
const taskPriority = document.getElementById('taskPriority');
const taskProjectSelect = document.getElementById('taskProject');
const modalTitle = document.getElementById('modalTitle');
const projectModalTitle = document.getElementById('projectModalTitle');
const colorPrimary = document.getElementById('colorPrimary');
const colorAccent = document.getElementById('colorAccent');
const themeSelect = document.getElementById('themeSelect');
const toggleTheme = document.getElementById('toggleTheme');
const resetAppBtn = document.getElementById('resetApp');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const alertsList = document.getElementById('alertsList');

let tasks = [];
let projects = [];
let notes = '';
let settings = {};
let editingTaskId = null;
let editingProjectId = null;

// Carga inicial
function load() {
  try {
    tasks = JSON.parse(localStorage.getItem(LS.TASKS) || '[]');
    projects = JSON.parse(localStorage.getItem(LS.PROJECTS) || '[]');
    notes = localStorage.getItem(LS.NOTES) || '';
    settings = JSON.parse(localStorage.getItem(LS.SETTINGS) || '{}');
  } catch (e) {
    console.error('Error cargando localStorage', e);
  }
  if (!projects.length) {
    projects.push({ id: uid(), name: 'General', color: '#00b4ff' });
  }
  if (!settings.theme) settings.theme = 'dark';
  applySettingsToUI();
}

// Guardar todo
function saveAll() {
  localStorage.setItem(LS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(LS.PROJECTS, JSON.stringify(projects));
  localStorage.setItem(LS.NOTES, notes);
  localStorage.setItem(LS.SETTINGS, JSON.stringify(settings));
}

// Inicialización UI
function init() {
  load();
  // eventos
  addTaskBtn.addEventListener('click', () => openTaskModal());
  cancelTaskBtn.addEventListener('click', closeTaskModal);
  saveTaskBtn.addEventListener('click', saveTaskFromModal);
  addProjectBtn.addEventListener('click', () => openProjectModal());
  cancelProjectBtn.addEventListener('click', closeProjectModal);
  saveProjectBtn.addEventListener('click', saveProjectFromModal);
  notesArea.addEventListener('input', () => { notes = notesArea.value; saveAll(); });
  noteFont.addEventListener('change', () => {
    notesArea.style.fontFamily = noteFont.value === 'orbitron' ? 'Orbitron, sans-serif' : 'Poppins, sans-serif';
    settings.noteFont = noteFont.value; saveAll();
  });
  filterProject.addEventListener('change', renderTasks);
  filterPriority.addEventListener('change', renderTasks);
  searchTask.addEventListener('input', renderTasks);
  colorPrimary.addEventListener('input', () => { document.documentElement.style.setProperty('--primary', colorPrimary.value); settings.colorPrimary = colorPrimary.value; saveAll(); });
  colorAccent.addEventListener('input', () => { document.documentElement.style.setProperty('--accent', colorAccent.value); settings.colorAccent = colorAccent.value; saveAll(); });
  themeSelect.addEventListener('change', () => { settings.theme = themeSelect.value; applyTheme(); saveAll(); });
  toggleTheme.addEventListener('click', () => { themeSelect.value = themeSelect.value === 'dark' ? 'light' : 'dark'; themeSelect.dispatchEvent(new Event('change')); });
  resetAppBtn.addEventListener('click', resetApp);
  exportBtn.addEventListener('click', exportJSON);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImportFile);

  notesArea.value = notes;
  noteFont.value = settings.noteFont || 'poppins';
  notesArea.style.fontFamily = noteFont.value === 'orbitron' ? 'Orbitron, sans-serif' : 'Poppins, sans-serif';
  colorPrimary.value = settings.colorPrimary || '#003A70';
  colorAccent.value = settings.colorAccent || '#8A2BE2';
  themeSelect.value = settings.theme || 'dark';
  applyTheme();

  renderProjects();
  renderTasks();
  drawProgress();
  showRandomPhrase();

  setInterval(() => {
    checkAlerts();
    saveAll();
  }, 1000 * 30); // cada 30s
}

// Helpers
function uid(len = 8) { return Math.random().toString(36).slice(2, 2 + len); }
function findProject(id) { return projects.find(p => p.id === id) || projects[0]; }

// Proyectos
function renderProjects() {
  projectsList.innerHTML = '';
  filterProject.innerHTML = '<option value="all">Todos</option>';
  taskProjectSelect.innerHTML = '';
  projects.forEach(p => {
    const el = document.createElement('div'); el.className = 'project-pill';
    el.innerHTML = `<div style="display:flex;align-items:center"><div style="width:12px;height:12px;border-radius:4px;background:${p.color};margin-right:8px"></div><div>${p.name}</div></div>
      <div><button class='btn small edit'>Editar</button> <button class='btn small ghost del'>Eliminar</button></div>`;
    el.querySelector('.edit').addEventListener('click', () => openProjectModal(p.id));
    el.querySelector('.del').addEventListener('click', () => { if (confirm('Eliminar proyecto? Sus tareas irán a General.')) deleteProject(p.id); });
    projectsList.appendChild(el);

    const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; filterProject.appendChild(opt);
    const opt2 = opt.cloneNode(true); taskProjectSelect.appendChild(opt2);
  });
  saveAll();
}
function openProjectModal(id = null) {
  projectModal.classList.remove('hidden');
  editingProjectId = id;
  if (id) {
    const p = projects.find(x => x.id === id);
    projectNameInput.value = p.name; projectColorInput.value = p.color;
    projectModalTitle.textContent = 'Editar proyecto';
  } else {
    projectNameInput.value = ''; projectColorInput.value = '#00b4ff'; projectModalTitle.textContent = 'Nuevo proyecto';
  }
}
function closeProjectModal() { projectModal.classList.add('hidden'); editingProjectId = null; }
function saveProjectFromModal() {
  const name = projectNameInput.value.trim(); const color = projectColorInput.value;
  if (!name) return alert('Nombre requerido');
  if (editingProjectId) { const p = projects.find(x => x.id === editingProjectId); p.name = name; p.color = color; }
  else projects.push({ id: uid(), name, color });
  renderProjects(); closeProjectModal();
}
function deleteProject(id) {
  const general = projects[0];
  tasks.forEach(t => { if (t.projectId === id) t.projectId = general.id; });
  projects = projects.filter(p => p.id !== id);
  renderProjects(); renderTasks(); drawProgress(); saveAll();
}

// Tasks
function renderTasks() {
  const proFilter = filterProject.value; const prioFilter = filterPriority.value; const search = searchTask.value.toLowerCase();
  tasksList.innerHTML = '';
  const ordered = [...tasks].sort((a, b) => (a.completed - b.completed) || (b.priority === 'high' - a.priority === 'high'));
  ordered.forEach(t => {
    if (proFilter !== 'all' && t.projectId !== proFilter) return;
    if (prioFilter !== 'all' && t.priority !== prioFilter) return;
    if (search && !(t.title.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search))) return;
    const el = document.createElement('div'); el.className = 'task-item';
    const project = findProject(t.projectId);
    el.innerHTML = `
      <div class='task-left'>
        <div class='checkbox ${t.completed ? "checked" : ""}' data-id='${t.id}'></div>
        <div>
          <div class='task-title'>${t.title}</div>
          <div class='task-meta'>${t.description ? (t.description.length > 70 ? t.description.slice(0, 70) + '...' : t.description) : ''}</div>
          <div class='task-meta'>${t.due ? '⏰ ' + t.due : ''} • <span style='color:${project.color}'>●</span> ${project.name} • ${t.priority}</div>
        </div>
      </div>
      <div class='task-actions'><button class='btn small edit'>Editar</button> <button class='btn small ghost del'>Eliminar</button></div>
    `;
    el.querySelector('.checkbox').addEventListener('click', () => toggleComplete(t.id));
    el.querySelector('.edit').addEventListener('click', () => openTaskModal(t.id));
    el.querySelector('.del').addEventListener('click', () => { if (confirm('Eliminar tarea?')) deleteTask(t.id); });
    tasksList.appendChild(el);
  });
}
function openTaskModal(id = null) {
  taskModal.classList.remove('hidden'); editingTaskId = id;
  if (id) {
    const t = tasks.find(x => x.id === id);
    modalTitle.textContent = 'Editar tarea'; taskTitle.value = t.title; taskDesc.value = t.description; taskDue.value = t.due || ''; taskPriority.value = t.priority || 'med'; taskProjectSelect.value = t.projectId || projects[0].id;
  } else {
    modalTitle.textContent = 'Crear tarea'; taskTitle.value = ''; taskDesc.value = ''; taskDue.value = ''; taskPriority.value = 'med'; taskProjectSelect.value = projects[0].id;
  }
}
function closeTaskModal() { taskModal.classList.add('hidden'); editingTaskId = null; }
function saveTaskFromModal() {
  const title = taskTitle.value.trim(); if (!title) return alert('Título requerido');
  const obj = { title, description: taskDesc.value.trim(), due: taskDue.value || null, priority: taskPriority.value, projectId: taskProjectSelect.value || projects[0].id };
  if (editingTaskId) { const t = tasks.find(x => x.id === editingTaskId); Object.assign(t, obj); } else { tasks.push(Object.assign({ id: uid(), completed: false, created: new Date().toISOString() }, obj)); }
  saveAll(); renderTasks(); drawProgress(); closeTaskModal();
}
function deleteTask(id) { tasks = tasks.filter(t => t.id !== id); saveAll(); renderTasks(); drawProgress(); }
function toggleComplete(id) {
  const t = tasks.find(x => x.id === id); t.completed = !t.completed; saveAll(); renderTasks(); drawProgress(); if (t.completed) { playCompleteSound(); showCompletePhrase(); }
}

// Progress ring (simple)
function drawProgress() {
  const total = tasks.length; const done = tasks.filter(t => t.completed).length; const pct = total ? Math.round(done / total * 100) : 0;
  progressPercent.textContent = pct + '%';
  const size = 160; const stroke = 12; const radius = (size - stroke) / 2; const circumference = 2 * Math.PI * radius; const offset = circumference * (1 - pct / 100);
  // choose gradient colors based on pct
  let gA = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  let gB = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  if (pct >= 100) { gA = '#FFD166'; gB = '#FFB703'; }
  else if (pct >= 70) { gA = getComputedStyle(document.documentElement).getPropertyValue('--accent'); gB = getComputedStyle(document.documentElement).getPropertyValue('--primary'); }
  else if (pct >= 30) { gA = '#8A2BE2'; gB = '#5A3FD6'; }
  else { gA = '#2E9AFE'; gB = '#003A70'; }

  progressRingHolder.innerHTML = `
    <svg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
      <defs>
        <linearGradient id='g1' x1='0' x2='1'><stop offset='0' stop-color='${gA}'/><stop offset='1' stop-color='${gB}'/></linearGradient>
      </defs>
      <g transform='translate(${size/2},${size/2})'>
        <circle r='${radius}' cx='0' cy='0' fill='transparent' stroke='rgba(255,255,255,0.03)' stroke-width='${stroke}' />
        <circle r='${radius}' cx='0' cy='0' fill='transparent' stroke='url(#g1)' stroke-width='${stroke}' stroke-linecap='round' stroke-dasharray='${circumference}' stroke-dashoffset='${offset}' transform='rotate(-90)' />
      </g>
    </svg>
  `;
  if (pct >= 100) {
    neoPhrase.textContent = '🌟 ¡Has alcanzado tu máximo brillo. Neo está orgulloso de ti!';
  }
}

// Frases
function showRandomPhrase() {
  const p = defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
  neoPhrase.textContent = p;
}
function showCompletePhrase() {
  const p = '✅ Bien hecho — sigue así. ' + defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
  neoPhrase.textContent = p;
}

// sonido sutil
function playCompleteSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.0001; o.connect(g); g.connect(ctx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02); o.stop(ctx.currentTime + 0.12);
  } catch (e) { /* no audio */ }
}

// Alerts: <=24h and <=7d
function checkAlerts() {
  const now = new Date();
  const soon = [];
  tasks.forEach(t => {
    if (!t.due || t.completed) return;
    const due = new Date(t.due + 'T23:59:59');
    const diff = (due - now) / (1000 * 60 * 60);
    if (diff <= 24 && diff >= 0) soon.push({ t, level: 'urgent' });
    else if (diff <= (24 * 7) && diff > 24) soon.push({ t, level: 'soon' });
  });
  renderAlerts(soon);
}
function renderAlerts(list) {
  alertsList.innerHTML = '';
  if (!list.length) {
    alertsList.innerHTML = '<div class="empty">Sin alertas</div>'; return;
  }
  list.forEach(it => {
    const el = document.createElement('div'); el.className = 'alert';
    if (it.level === 'urgent') el.innerHTML = `⚠️ <strong>¡Te queda poco tiempo!</strong> — ${it.t.title} (vence: ${it.t.due})`;
    else el.innerHTML = `⏳ Próxima entrega — ${it.t.title} (vence: ${it.t.due})`;
    alertsList.appendChild(el);
  });
}

// Theme & settings
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
}
function applySettingsToUI() {
  document.documentElement.style.setProperty('--primary', settings.colorPrimary || '#003A70');
  document.documentElement.style.setProperty('--accent', settings.colorAccent || '#8A2BE2');
  colorPrimary.value = settings.colorPrimary || '#003A70';
  colorAccent.value = settings.colorAccent || '#8A2BE2';
  themeSelect.value = settings.theme || 'dark';
  applyTheme();
}

// Export / Import JSON
function exportJSON() {
  const data = { tasks, projects, notes, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'MyNeoUTEM_export.json'; a.click();
  URL.revokeObjectURL(url);
}
function handleImportFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const obj = JSON.parse(ev.target.result);
      if (obj.tasks) tasks = obj.tasks;
      if (obj.projects) projects = obj.projects;
      if (obj.notes) { notes = obj.notes; notesArea.value = notes; }
      if (obj.settings) { settings = obj.settings; applySettingsToUI(); }
      saveAll(); renderProjects(); renderTasks(); drawProgress(); alert('Importación completada');
    } catch (err) { alert('Archivo inválido'); }
  };
  reader.readAsText(f);
}

// Reset
function resetApp() {
  if (!confirm('Resetear todos los datos?')) return;
  localStorage.removeItem(LS.TASKS); localStorage.removeItem(LS.PROJECTS); localStorage.removeItem(LS.NOTES); localStorage.removeItem(LS.SETTINGS);
  location.reload();
}

// Init
init();

// Expose functions for modal controls (bind after init)
document.getElementById('openSettings')?.addEventListener('click', () => document.querySelector('.settings')?.scrollIntoView({ behavior: 'smooth' }));
document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
document.getElementById('cancelTask').addEventListener('click', () => closeTaskModal);

// Modal buttons binding
document.getElementById('cancelTask').addEventListener('click', () => closeTaskModal());
document.getElementById('cancelProject').addEventListener('click', () => closeProjectModal());

// small fixes if elements not ready
(function bindModalButtons(){
  const saveT = document.getElementById('saveTask'); if (saveT) saveT.addEventListener('click', saveTaskFromModal);
  const cancelT = document.getElementById('cancelTask'); if (cancelT) cancelT.addEventListener('click', closeTaskModal);
  const saveP = document.getElementById('saveProject'); if (saveP) saveP.addEventListener('click', saveProjectFromModal);
  const cancelP = document.getElementById('cancelProject'); if (cancelP) cancelP.addEventListener('click', closeProjectModal);
})();
