/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default categories and tasks if nothing in localStorage
const DEFAULT_CATEGORIES_CONFIG = [
  { id: 'routine', name: 'Routine', order: 0, deletable: false, folders: [
      { id: 'default_folder_routine', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
        "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
        "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
      ]}
  ]},
  { id: 'health', name: 'Health', order: 1, deletable: false, folders: [
      { id: 'default_folder_health', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
        "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
        "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
        "Shower consistently", "Social media < 1 hour"
      ]}
  ]},
  { id: 'god', name: 'God', order: 2, deletable: false, folders: [
      { id: 'default_folder_god', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Self-Bible Study", "Thursday congregation", "Sunday congregation",
        "Be the person God expects"
      ]}
  ]},
  { id: 'personal', name: 'Personal', order: 3, deletable: false, folders: [
      { id: 'default_folder_personal', name: 'Tasks', type: 'task', order: 0, tasks: ["Content creation"] }
  ]},
];


const DAILY_TARGET_POINTS = 2700;
let TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Will be updated by current progress plan

const STORAGE_KEY_TASK_COMPLETION_PREFIX = 'lifeTrackerTaskCompletion_';
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_';
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; // May be deprecated or used differently with plans
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';

const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2';
const USER_FOLDERS_KEY = 'lifeTrackerUserFolders_v2'; // Note: Data structure for notes folder content will change.

const STORAGE_KEY_CURRENT_PROGRESS_PLAN = 'lifeTrackerCurrentProgressPlan_v1';
const STORAGE_KEY_PROGRESS_HISTORY = 'lifeTrackerProgressHistory_v1';


let currentCategories = [];
let userFoldersByCategoryId = {};

let currentTaskCompletionStatus = {};

let activeTabId = 'dashboard';
let currentModalDate = null;
let draggedItemElement = null;
let itemToDelete = null;
let editModes = {};
let categoryViewMode = {};
let activeFolderIdForCategory = {};
let activeAddTaskForm = null;

let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;

let longPressTimer = null;
const LONG_PRESS_DURATION = 700;
let currentContextMenuTargetTab = null;
let currentFolderOptionsMenu = { element: null, folderId: null, categoryId: null };

let midnightTimer = null;
// let currentEditingNoteItem = null; // Obsolete with contenteditable notes


let currentProgressPlan = null; // { name: string, startDate: string, startDayOfWeek: number (0-6), targetWeeklyPoints: number }
let progressHistory = []; // [ { name, startDate, endDate, weeklyProgressDetails: { pointsEarned, targetPoints, percentage, totalWeeks?, avgWeeklyPoints? } }, ... ]
let currentView = 'dashboard'; // 'dashboard' or 'progress'


// DOM Elements
const domElements = {
  // Main App Structure
  appContainer: null,
  hamburgerMenuButton: null,
  sideMenu: null,
  sideMenuDashboardLink: null,
  sideMenuProgressLink: null,
  mainContentWrapper: null, // Existing main content area
  progressSystemView: null, // New view for progress system
  
  // Progress System Specific
  progressSystemHeader: null,
  progressSystemBackButton: null,
  progressTabSetup: null,
  progressTabHistory: null,
  progressSetupContent: null,
  progressHistoryContent: null,
  progressSetupForm: null,
  progressPlanNameInput: null,
  progressStartDateInput: null,
  progressStartDaySelect: null,
  progressTargetWeeklyPointsInput: null,
  saveProgressPlanButton: null,
  endCurrentPlanButton: null,
  activePlanSummary: null,
  activePlanNameDisplay: null,
  activePlanStartDateDisplay: null,
  activePlanStartDayDisplay: null,
  activePlanTargetPointsDisplay: null,
  progressHistoryList: null,
  noProgressHistoryMessage: null,

  // Existing Elements
  tabsContainer: null,
  tabContentsContainer: null,
  addCategoryButton: null,
  categorySectionTemplate: null,
  backToFoldersButtonTemplate: null,
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  folderOptionsContextMenu: null,
  ctxRenameFolderButton: null,
  ctxDeleteFolderButton: null,
  dashboardSummariesContainer: null,
  todayProgressFill: null,
  todayPointsStat: null,
  currentWeeklyPlanNameDisplay: null, // For displaying plan name on dashboard
  currentWeekProgressFill: null,
  currentWeekPointsStat: null,
  calendarMonthYearButton: null,
  calendarMonthYear: null,
  calendarGrid: null,
  calendarPrevMonthButton: null,
  calendarNextMonthButton: null,
  monthYearPickerModal: null,
  monthYearPickerContent: null,
  monthYearPickerCloseButton: null,
  pickerMonthsGrid: null,
  pickerYearsList: null,
  dailyNoteInput: null,
  saveNoteButton: null,
  historyModal: null,
  historyModalCloseButton: null,
  historyModalDate: null,
  historyModalPointsValue: null,
  historyModalPointsTotal: null,
  historyPercentageProgressFill: null,
  historyTasksList: null,
  expandTasksButton: null,
  historicalReflectionWrapper: null,
  expandReflectionButton: null,
  historyUserNoteDisplay: null,
  historyUserNoteEdit: null,
  historicalNoteControls: null,
  saveHistoricalNoteButton: null,
  clearHistoricalNoteButton: null,
  historicalNoteStatus: null,
  taskEditControlsTemplate: null,
  deleteConfirmationModal: null,
  deleteConfirmationTitle: null,
  deleteConfirmationMessage: null,
  deleteConfirmationCloseButton: null,
  confirmDeleteButton: null,
  cancelDeleteButton: null,
  fullscreenContentModal: null,
  fullscreenModalTitle: null,
  fullscreenModalArea: null,
  fullscreenModalCloseButton: null,
  addFolderModal: null,
  addFolderModalCloseButton: null,
  addFolderStep1: null,
  addFolderStep2: null,
  selectTaskFolderTypeButton: null,
  selectNotesFolderTypeButton: null,
  addFolderBackButton: null,
  selectedFolderTypeNameSpan: null,
  newFolderNameInput: null,
  createFolderButton: null,
  cancelAddFolderButton: null,
  // noteItemTemplate: null, // Obsolete
  // noteItemEditTextareaTemplate: null, // Obsolete
  // noteItemEditLinkTemplate: null, // Obsolete
  // noteItemEditImageTemplate: null, // Obsolete
};

function getProgressFillColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120;
    return `hsl(${hue}, 100%, 50%)`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNormalizedDate(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

function getCurrentMonthYearString() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function createUniqueId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTaskCompletionStorageKey(taskDefinitionId, dateString) {
  return `${STORAGE_KEY_TASK_COMPLETION_PREFIX}${taskDefinitionId}_${dateString}`;
}

function sanitizeHTMLForDisplay(htmlString) {
    // Basic sanitizer: replace < and > to prevent HTML injection in display areas
    // For contenteditable, this is more complex. Rely on browser's handling for now,
    // but a proper library (DOMPurify) is recommended for production.
    if (typeof htmlString !== 'string') return '';
    return htmlString.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


// Data Management: Categories, Folders, Tasks
function loadUserCategories() { return JSON.parse(localStorage.getItem(USER_CATEGORIES_KEY)) || DEFAULT_CATEGORIES_CONFIG.map(c => ({id:c.id, name:c.name, order:c.order, deletable: c.deletable !== undefined ? c.deletable:true})); }
function saveUserCategories(categories) { localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order))); }

function loadUserFolders() {
    const stored = localStorage.getItem(USER_FOLDERS_KEY);
    let foldersByCatId;
    if (stored) {
        foldersByCatId = JSON.parse(stored);
    } else {
        foldersByCatId = {};
        DEFAULT_CATEGORIES_CONFIG.forEach(c => {
            foldersByCatId[c.id] = (c.folders || []).map(f => ({
                id: f.id || createUniqueId('folder'),
                name: f.name,
                type: f.type || 'task',
                order: f.order || 0,
                tasks: (f.type === 'notes' || f.type === undefined && c.folders && c.folders.find(cf => cf.name === f.name)?.type === 'notes') ? undefined : (f.tasks || []).map(t => typeof t === 'string' ? { id: createUniqueId('taskdef'), text: t } : { id: t.id || createUniqueId('taskdef'), text: t.text }),
                content: (f.type === 'notes' || f.type === undefined && c.folders && c.folders.find(cf => cf.name === f.name)?.type === 'notes') ? (f.content || "") : undefined
            }));
        });
    }

    // Data migration and normalization
    Object.keys(foldersByCatId).forEach(catId => {
        foldersByCatId[catId].forEach(folder => {
            if (!folder.type) folder.type = 'task'; // Default to task if type is missing
            if (folder.type === 'task') {
                if (!folder.tasks) folder.tasks = [];
                folder.tasks = folder.tasks.map(t => typeof t === 'string' ? { id: createUniqueId('taskdef'), text: t } : (t.id ? t : { id: createUniqueId('taskdef'), text: t.text }));
                delete folder.content; // Remove content if it's a task folder
            } else if (folder.type === 'notes') {
                if (Array.isArray(folder.content)) { // Old array format for notes
                    let htmlContent = "";
                    folder.content.forEach(item => {
                        const itemValue = item.value || "";
                        if (item.type === 'text') htmlContent += `<p>${sanitizeHTMLForDisplay(itemValue)}</p>`;
                        else if (item.type === 'link' && typeof itemValue === 'object') {
                             htmlContent += `<p><a href="${sanitizeHTMLForDisplay(itemValue.url)}" target="_blank" rel="noopener noreferrer">${sanitizeHTMLForDisplay(itemValue.text || itemValue.url)}</a></p>`;
                        } else if (item.type === 'image' && typeof itemValue === 'object') {
                             htmlContent += `<p><img src="${sanitizeHTMLForDisplay(itemValue.dataUrl)}" alt="${sanitizeHTMLForDisplay(itemValue.alt || 'User image')}" style="max-width: 100%; display: block; margin: 10px 0;"></p>`;
                        }
                    });
                    folder.content = htmlContent;
                } else if (typeof folder.content !== 'string') {
                    folder.content = ""; // Ensure content is a string for notes folder
                }
                delete folder.tasks; // Remove tasks if it's a notes folder
            }
        });
    });
    return foldersByCatId;
}

function saveUserFolders(foldersByCatId) { localStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(foldersByCatId)); }
function migrateOldTaskStructureIfNeeded() { return false; }
function initializeTaskCompletionStatusForNewDay() { /* ... existing ... */ }
function getTaskCompletionStatus(taskDefinitionId, dateString) { return currentTaskCompletionStatus[getTaskCompletionStorageKey(taskDefinitionId, dateString)] || false; }
function setTaskCompletionStatus(taskDefinitionId, dateString, isCompleted) { const key = getTaskCompletionStorageKey(taskDefinitionId, dateString); if (isCompleted) currentTaskCompletionStatus[key] = true; else delete currentTaskCompletionStatus[key]; localStorage.setItem(key, isCompleted.toString()); }
function loadTaskCompletionForDate(dateString) { currentTaskCompletionStatus = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX) && key.endsWith(`_${dateString}`)) currentTaskCompletionStatus[key] = localStorage.getItem(key) === 'true'; } }

// Progress Plan Data Management
function loadProgressData() {
    const storedPlan = localStorage.getItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN);
    if (storedPlan) currentProgressPlan = JSON.parse(storedPlan); else currentProgressPlan = null;
    
    const storedHistory = localStorage.getItem(STORAGE_KEY_PROGRESS_HISTORY);
    if (storedHistory) progressHistory = JSON.parse(storedHistory); else progressHistory = [];
    
    if (currentProgressPlan && currentProgressPlan.targetWeeklyPoints) {
        TARGET_POINTS_FOR_WEEKLY_VIEW = currentProgressPlan.targetWeeklyPoints;
    } else {
        TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Default if no plan or old plan structure
    }
}

function saveProgressData() {
    if (currentProgressPlan) localStorage.setItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN, JSON.stringify(currentProgressPlan));
    else localStorage.removeItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN);
    localStorage.setItem(STORAGE_KEY_PROGRESS_HISTORY, JSON.stringify(progressHistory));
}

function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    migrateOldTaskStructureIfNeeded();
    userFoldersByCategoryId = loadUserFolders();
    currentCategories.forEach(cat => {
        if (!userFoldersByCategoryId[cat.id]) userFoldersByCategoryId[cat.id] = [];
        // Normalization moved to loadUserFolders
        if (editModes[cat.id] === undefined) editModes[cat.id] = false;
        if (categoryViewMode[cat.id] === undefined) categoryViewMode[cat.id] = 'list_folders';
        if (activeFolderIdForCategory[cat.id] === undefined) activeFolderIdForCategory[cat.id] = null;
    });
    saveUserCategories(currentCategories); saveUserFolders(userFoldersByCategoryId);
}
function saveDailyNote() { if (!domElements.dailyNoteInput) return; const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const noteContent = domElements.dailyNoteInput.value; localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent); if (currentActiveDate === getTodayDateString() && currentModalDate === currentActiveDate) { const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentActiveDate; const historyDataString = localStorage.getItem(historyKey); if (historyDataString) { try { let historyEntry = JSON.parse(historyDataString); historyEntry.userNote = noteContent; localStorage.setItem(historyKey, JSON.stringify(historyEntry)); } catch (e) { console.warn("Could not live update history note", e); } } } if (domElements.saveNoteButton) { domElements.saveNoteButton.textContent = 'Note Saved!'; setTimeout(() => { if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note'; }, 1500); } }
function loadCurrentDayNote() { if (!domElements.dailyNoteInput) return; const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate); domElements.dailyNoteInput.value = note || ''; }
function saveDayToHistory(dateToSave) { const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateToSave; loadTaskCompletionForDate(dateToSave); const completedTasksHistory = {}; let tasksCompletedCount = 0; let totalTasksForDay = 0; currentCategories.forEach(cat => { completedTasksHistory[cat.id] = []; const foldersInCat = userFoldersByCategoryId[cat.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task') { folder.tasks.forEach(taskDef => { totalTasksForDay++; if (getTaskCompletionStatus(taskDef.id, dateToSave)) { completedTasksHistory[cat.id].push(taskDef.text); tasksCompletedCount++; } }); } }); }); const pointsPerTaskCalculation = totalTasksForDay > 0 ? DAILY_TARGET_POINTS / totalTasksForDay : 0; const finalPointsEarned = Math.round(tasksCompletedCount * pointsPerTaskCalculation); const finalPercentageCompleted = totalTasksForDay > 0 ? Math.round((tasksCompletedCount / totalTasksForDay) * 100) : 0; const noteFromDay = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || ""; const historyEntry = { date: dateToSave, completedTasks: completedTasksHistory, userNote: noteFromDay, pointsEarned: finalPointsEarned, percentageCompleted: finalPercentageCompleted, totalTasksOnDate: totalTasksForDay, dailyTargetPoints: DAILY_TARGET_POINTS }; localStorage.setItem(historyKey, JSON.stringify(historyEntry)); localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave); currentCategories.forEach(cat => { const foldersInCat = userFoldersByCategoryId[cat.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task') { folder.tasks.forEach(taskDef => { localStorage.removeItem(getTaskCompletionStorageKey(taskDef.id, dateToSave)); }); } }); }); console.log(`History finalized and saved for ${dateToSave}:`, historyEntry); }
function checkAndClearOldMonthlyData() { const currentMonthYear = getCurrentMonthYearString(); const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED); if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX)) { const parts = key.split('_'); if (parts.length > 2) { const datePart = parts.slice(2).join('_'); if (datePart.length >= 7) { const monthYearOfKey = datePart.substring(0, 7); if (monthYearOfKey === lastProcessedMonthYear) localStorage.removeItem(key); } } } } } localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear); }
function loadAppData() { seedInitialDataIfNeeded(); loadProgressData(); let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); const currentDateStr = getTodayDateString(); if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) { console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`); saveDayToHistory(lastVisitDateStr); initializeTaskCompletionStatusForNewDay(); } else if (!lastVisitDateStr) { console.log("First visit or no last visit date found. Initializing for today."); initializeTaskCompletionStatusForNewDay(); } else { console.log("Resuming session for today:", currentDateStr); loadTaskCompletionForDate(currentDateStr); } localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr); checkAndClearOldMonthlyData(); loadCurrentDayNote(); calendarDisplayDate = new Date(); calendarDisplayDate.setDate(1); calendarDisplayDate.setHours(0,0,0,0); pickerSelectedMonth = calendarDisplayDate.getMonth(); pickerSelectedYear = calendarDisplayDate.getFullYear(); scheduleMidnightTask(); }
function handleMidnightReset() { console.log("Midnight reset triggered."); const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); if (!dateThatJustEnded) { console.error("Cannot perform midnight reset: last visit date unknown."); scheduleMidnightTask(); return; } saveDayToHistory(dateThatJustEnded); const newCurrentDate = getTodayDateString(); localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, newCurrentDate); initializeTaskCompletionStatusForNewDay(); currentTaskCompletionStatus = {}; if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = ''; loadCurrentDayNote(); if (domElements.todayPointsStat) domElements.todayPointsStat.classList.add('progress-value-resetting'); if (domElements.todayProgressFill) domElements.todayProgressFill.classList.add('progress-value-resetting'); updateAllProgress(); setTimeout(() => { if (domElements.todayPointsStat) domElements.todayPointsStat.classList.remove('progress-value-resetting'); if (domElements.todayProgressFill) domElements.todayProgressFill.classList.remove('progress-value-resetting'); }, 500); scheduleMidnightTask(); }
function scheduleMidnightTask() { if (midnightTimer) clearTimeout(midnightTimer); const now = new Date(); const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1); tomorrow.setHours(0, 0, 1, 0); const msUntilMidnight = tomorrow.getTime() - now.getTime(); console.log(`Next midnight reset scheduled in ${msUntilMidnight / 1000 / 60} minutes.`); midnightTimer = setTimeout(handleMidnightReset, msUntilMidnight); }
function getDragAfterElement(container, y, itemSelector) { const draggableElements = Array.from(container.querySelectorAll(`${itemSelector}:not(.dragging):not(.editing)`)); return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest; }, { offset: Number.NEGATIVE_INFINITY, element: null }).element; }
function toggleCategoryEditMode(categoryId) { editModes[categoryId] = !editModes[categoryId]; renderCategoryTasks(categoryId); }
function showTempAddTaskForm(categoryId, folderId, position) { if (activeAddTaskForm) hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position, false); activeAddTaskForm = { categoryId, folderId, position }; const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const formContainer = categorySection.querySelector(formContainerClass); if (!formContainer) return; const triggerButton = formContainer.querySelector('.add-item-trigger-button'); const form = formContainer.querySelector('.new-temp-task-form'); const input = formContainer.querySelector('.new-task-temp-input'); if (triggerButton) triggerButton.classList.add('hidden'); if (form) form.classList.remove('hidden'); if (input) input.focus(); }
function hideTempAddTaskForm(categoryId, folderId, position, resetActiveForm = true) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const formContainer = categorySection.querySelector(formContainerClass); if (!formContainer) return; const triggerButton = formContainer.querySelector('.add-item-trigger-button'); const form = formContainer.querySelector('.new-temp-task-form'); const input = formContainer.querySelector('.new-task-temp-input'); if (triggerButton) triggerButton.classList.remove('hidden'); if (form) form.classList.add('hidden'); if (input) input.value = ''; if (resetActiveForm) activeAddTaskForm = null; }
function handleSaveTempTask(categoryId, folderId, position) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const input = categorySection.querySelector(`${formContainerClass} .new-task-temp-input`); const taskText = input.value.trim(); if (taskText) { const newTaskDefinition = { id: createUniqueId('taskdef'), text: taskText }; const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { if (position === 'top') folder.tasks.unshift(newTaskDefinition); else folder.tasks.push(newTaskDefinition); saveUserFolders(userFoldersByCategoryId); renderCategoryTasks(categoryId); updateAllProgress(); hideTempAddTaskForm(categoryId, folderId, position); } else alert('Error: Could not find the task folder or incorrect folder type.'); } else alert('Task text cannot be empty.'); }
function getTaskDefinition(taskDefinitionId) { for (const catId in userFoldersByCategoryId) { const folders = userFoldersByCategoryId[catId]; for (const folder of folders) { if (folder.type === 'task' && folder.tasks) { const taskDef = folder.tasks.find(t => t.id === taskDefinitionId); if (taskDef) return { ...taskDef, categoryId: catId, folderId: folder.id }; } } } return null; }
function startTaskEdit(taskItemElement, taskDef, categoryId, folderId) { if (taskItemElement.classList.contains('editing')) return; taskItemElement.classList.add('editing'); const taskTextSpan = taskItemElement.querySelector('.task-text'); if (taskTextSpan) taskTextSpan.style.display = 'none'; const editControlsTemplate = domElements.taskEditControlsTemplate; if (!editControlsTemplate) return; const editControls = editControlsTemplate.cloneNode(true); editControls.removeAttribute('id'); editControls.style.display = 'flex'; const input = editControls.querySelector('.task-edit-input'); const saveButton = editControls.querySelector('.task-edit-save'); const cancelButton = editControls.querySelector('.task-edit-cancel'); input.value = taskDef.text; saveButton.onclick = () => saveTaskEdit(taskDef.id, categoryId, folderId, input.value, taskItemElement, editControls); cancelButton.onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan); const deleteButton = taskItemElement.querySelector('.task-delete-button-editmode'); if (deleteButton) taskItemElement.insertBefore(editControls, deleteButton); else taskItemElement.appendChild(editControls); input.focus(); input.select(); }
function saveTaskEdit(taskDefinitionId, categoryId, folderId, newText, taskItemElement, editControls) { newText = newText.trim(); if (!newText) { alert("Task text cannot be empty."); return; } const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { const taskDef = folder.tasks.find(t => t.id === taskDefinitionId); if (taskDef) { taskDef.text = newText; saveUserFolders(userFoldersByCategoryId); } } const taskTextSpan = taskItemElement.querySelector('.task-text'); if(taskTextSpan) { taskTextSpan.textContent = newText; taskTextSpan.style.display = ''; } taskItemElement.classList.remove('editing'); editControls.remove(); }
function cancelTaskEdit(taskItemElement, editControls, taskTextSpan) { if (taskTextSpan) taskTextSpan.style.display = ''; taskItemElement.classList.remove('editing'); editControls.remove(); }
function renderTaskItem(taskDef, categoryId, folderId) { const item = document.createElement('li'); item.className = 'task-item'; item.dataset.taskDefId = taskDef.id; item.setAttribute('role', 'listitem'); item.setAttribute('tabindex', '0'); const textSpan = document.createElement('span'); textSpan.className = 'task-text'; textSpan.textContent = taskDef.text; item.appendChild(textSpan); const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const isCompleted = getTaskCompletionStatus(taskDef.id, today); const updateAriaAndClass = (completedState) => { item.setAttribute('aria-label', `${taskDef.text}, ${completedState ? 'completed' : 'not completed'}`); item.classList.toggle('completed', completedState); }; updateAriaAndClass(isCompleted); if (editModes[categoryId]) { const deleteButton = document.createElement('button'); deleteButton.className = 'task-delete-button-editmode icon-button'; deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`; deleteButton.setAttribute('aria-label', `Delete task: ${taskDef.text}`); deleteButton.title = "Delete Task"; deleteButton.onclick = (e) => { e.stopPropagation(); showDeleteConfirmation('task', taskDef.id, `Are you sure you want to delete the task "${taskDef.text}"? This will remove it permanently.`, '', categoryId, folderId); }; item.appendChild(deleteButton); } item.addEventListener('click', (e) => { if (item.classList.contains('editing')) return; if (editModes[categoryId] && e.target === textSpan) { startTaskEdit(item, taskDef, categoryId, folderId); return; } if (!editModes[categoryId]) { const currentCompletion = getTaskCompletionStatus(taskDef.id, today); setTaskCompletionStatus(taskDef.id, today, !currentCompletion); updateAriaAndClass(!currentCompletion); item.classList.remove('animate-task-complete', 'animate-task-uncomplete'); void item.offsetWidth; item.classList.add(!currentCompletion ? 'animate-task-complete' : 'animate-task-uncomplete'); updateAllProgress(); } }); item.addEventListener('keydown', (e) => { if (item.classList.contains('editing')) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!editModes[categoryId]) item.click(); else if (editModes[categoryId] && document.activeElement === item) startTaskEdit(item, taskDef, categoryId, folderId); } }); if (editModes[categoryId] && !item.classList.contains('editing')) { item.draggable = true; item.addEventListener('dragstart', (e) => { if (!editModes[categoryId] || item.classList.contains('editing')) { e.preventDefault(); return; } draggedItemElement = item; setTimeout(() => item.classList.add('dragging'), 0); e.dataTransfer.effectAllowed = 'move'; }); item.addEventListener('dragend', () => { const taskListUl = item.closest('ul.task-list'); if (!taskListUl) return; item.classList.remove('dragging'); draggedItemElement = null; document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => { el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom'); }); const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { const newTaskOrderIds = Array.from(taskListUl.querySelectorAll('.task-item')).map(el => el.dataset.taskDefId); folder.tasks = newTaskOrderIds.map(id => folder.tasks.find(t => t.id === id)).filter(Boolean); saveUserFolders(userFoldersByCategoryId); } }); } else item.draggable = false; return item; }
function showDeleteConfirmation(type, id, message, nameForConfirmation = '', categoryId = null, folderId = null) { itemToDelete = { type, id, nameForConfirmation, categoryId, folderId }; if (domElements.deleteConfirmationModal) { if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message; if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)} Deletion`; domElements.deleteConfirmationModal.classList.remove('hidden'); domElements.confirmDeleteButton.focus(); } }
function confirmDeletion() { if (!itemToDelete) return; const { type, id, categoryId, folderId } = itemToDelete; if (type === 'task') { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { folder.tasks = folder.tasks.filter(t => t.id !== id); saveUserFolders(userFoldersByCategoryId); for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(getTaskCompletionStorageKey(id, ''))) localStorage.removeItem(key); } Object.keys(currentTaskCompletionStatus).forEach(key => { if (key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX + id + "_")) delete currentTaskCompletionStatus[key]; }); renderCategoryTasks(categoryId); } } else if (type === 'category') { const category = currentCategories.find(c => c.id === id); if (category && category.deletable === false) { alert(`Category "${category.name}" is a default category and cannot be deleted.`); hideDeleteConfirmation(); return; } currentCategories = currentCategories.filter(cat => cat.id !== id); saveUserCategories(currentCategories); delete userFoldersByCategoryId[id]; saveUserFolders(userFoldersByCategoryId); const tabButton = document.getElementById(`tab-button-${id}`); if (tabButton) tabButton.remove(); const categorySection = document.getElementById(`category-section-${id}`); if (categorySection) categorySection.remove(); if (activeTabId === id) switchTab('dashboard'); } else if (type === 'folder') { const foldersInCat = userFoldersByCategoryId[categoryId]; if (foldersInCat) { const folderToDelete = foldersInCat.find(f => f.id === id); if (folderToDelete && folderToDelete.type === 'task') { folderToDelete.tasks.forEach(taskDef => { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(getTaskCompletionStorageKey(taskDef.id, ''))) localStorage.removeItem(key); } Object.keys(currentTaskCompletionStatus).forEach(key => { if (key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX + taskDef.id + "_")) delete currentTaskCompletionStatus[key]; }); }); } else if (folderToDelete && folderToDelete.type === 'notes') { /* No specific item cleanup needed for new HTML string content */ } userFoldersByCategoryId[categoryId] = foldersInCat.filter(f => f.id !== id); saveUserFolders(userFoldersByCategoryId); renderCategoryTasks(categoryId); } } updateAllProgress(); hideDeleteConfirmation(); }
function hideDeleteConfirmation() { if (domElements.deleteConfirmationModal) domElements.deleteConfirmationModal.classList.add('hidden'); itemToDelete = null; }

function renderCategoryTasks(categoryId) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const category = currentCategories.find(c => c.id === categoryId); if (!category) return; const categoryContentArea = categorySection.querySelector('.category-content-area'); const taskListUl = categorySection.querySelector('ul.task-list'); const notesFolderWrapper = categorySection.querySelector('.notes-folder-content-wrapper'); const addTaskFormTop = categorySection.querySelector('.add-task-form-top'); const addTaskFormBottom = categorySection.querySelector('.add-task-form-bottom'); const categoryHeader = categorySection.querySelector('.category-header'); const categoryTitleText = categoryHeader.querySelector('.category-title-text'); const categoryHeaderControls = categoryHeader.querySelector('.category-header-controls'); categoryContentArea.innerHTML = ''; taskListUl.innerHTML = ''; taskListUl.classList.add('hidden'); notesFolderWrapper.classList.add('hidden'); const notesDisplayArea = notesFolderWrapper.querySelector('.notes-content-display-area'); if(notesDisplayArea) notesDisplayArea.innerHTML = ''; const activeFolder = userFoldersByCategoryId[categoryId]?.find(f => f.id === activeFolderIdForCategory[categoryId]); const isTaskFolderView = categoryViewMode[categoryId] === 'view_folder_content' && activeFolder?.type === 'task'; const isNotesFolderView = categoryViewMode[categoryId] === 'view_folder_content' && activeFolder?.type === 'notes'; [addTaskFormTop, addTaskFormBottom].forEach(form => form.style.display = (isTaskFolderView && editModes[categoryId]) ? 'block' : 'none'); if (categoryHeaderControls) { const editButton = categoryHeaderControls.querySelector('.edit-mode-toggle-button'); const undoButton = categoryHeaderControls.querySelector('.undo-category-button'); if (isTaskFolderView) { if(editButton) editButton.style.display = 'flex'; if(undoButton) undoButton.style.display = 'flex'; } else { if(editButton) editButton.style.display = 'none'; if(undoButton) undoButton.style.display = 'none'; } } let backButton = categoryHeader.querySelector('.back-to-folders-button'); if (categoryViewMode[categoryId] === 'view_folder_content') { if (!backButton) { const buttonTemplate = domElements.backToFoldersButtonTemplate.content.cloneNode(true); backButton = buttonTemplate.querySelector('.back-to-folders-button'); backButton.onclick = () => { categoryViewMode[categoryId] = 'list_folders'; activeFolderIdForCategory[categoryId] = null; if (activeAddTaskForm?.categoryId === categoryId) hideTempAddTaskForm(categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position); renderCategoryTasks(categoryId); }; categoryHeader.prepend(backButton); } backButton.style.display = 'flex'; categoryTitleText.textContent = activeFolder ? activeFolder.name : category.name; categoryHeader.classList.add('has-back-button'); } else { if (backButton) backButton.style.display = 'none'; categoryTitleText.textContent = category.name; categoryHeader.classList.remove('has-back-button'); } const editModeButton = categoryHeader.querySelector('.edit-mode-toggle-button'); if (editModeButton) { editModeButton.classList.toggle('active-glow', !!editModes[categoryId]); editModeButton.setAttribute('aria-pressed', !!editModes[categoryId]); } if (categoryViewMode[categoryId] === 'list_folders') { const folders = (userFoldersByCategoryId[categoryId] || []).sort((a,b) => a.order - b.order); const folderDisplayContainer = document.createElement('div'); folderDisplayContainer.className = 'task-folders-grid'; if (folders.length > 0) folders.forEach(folder => folderDisplayContainer.appendChild(renderFolderBox(folder, categoryId))); const addFolderWrapper = document.createElement('div'); addFolderWrapper.className = 'task-folder-box-wrapper add-new-folder-wrapper'; const addNewFolderPlusButton = document.createElement('button'); addNewFolderPlusButton.className = 'add-new-folder-plus-button'; addNewFolderPlusButton.title = "Add a new folder to this category"; addNewFolderPlusButton.setAttribute('aria-label', "Add new folder"); addNewFolderPlusButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`; addNewFolderPlusButton.onclick = () => openAddFolderModal(categoryId); addFolderWrapper.appendChild(addNewFolderPlusButton); folderDisplayContainer.appendChild(addFolderWrapper); categoryContentArea.appendChild(folderDisplayContainer); if (folders.length === 0 && !addFolderWrapper.previousSibling) { // Check if only the add button wrapper is there
        const emptyMessage = document.createElement('p'); emptyMessage.className = 'empty-tasks-message'; emptyMessage.textContent = 'No folders yet. Click the "+" button to add one.'; categoryContentArea.appendChild(emptyMessage); } } else if (isTaskFolderView) { taskListUl.classList.remove('hidden'); if (activeFolder && activeFolder.tasks.length > 0) activeFolder.tasks.forEach(taskDef => taskListUl.appendChild(renderTaskItem(taskDef, categoryId, activeFolder.id))); else { const emptyMessage = document.createElement('p'); emptyMessage.className = 'empty-tasks-message'; emptyMessage.textContent = editModes[categoryId] ? 'This folder is empty. Click "Add Item" to create tasks.' : 'This folder is empty.'; if (editModes[categoryId]) emptyMessage.classList.add('edit-mode-empty'); taskListUl.appendChild(emptyMessage); } categoryContentArea.appendChild(taskListUl); } else if (isNotesFolderView) { notesFolderWrapper.classList.remove('hidden'); renderNotesFolderContent(activeFolder, categoryId, notesFolderWrapper); categoryContentArea.appendChild(notesFolderWrapper); } }
function renderFolderBox(folder, categoryId) { const wrapper = document.createElement('div'); wrapper.className = 'task-folder-box-wrapper'; wrapper.dataset.folderId = folder.id; wrapper.setAttribute('role', 'button'); wrapper.setAttribute('tabindex', '0'); wrapper.setAttribute('aria-label', `Open folder: ${folder.name}`); const squareBox = document.createElement('div'); squareBox.className = 'task-folder-square-box'; const symbolSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); symbolSvg.setAttribute('class', 'task-folder-symbol'); symbolSvg.setAttribute('viewBox', '0 0 24 24'); if (folder.type === 'notes') { squareBox.classList.add('notes-folder-icon-box'); wrapper.classList.add('notes-folder-label'); symbolSvg.innerHTML = `<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z"></path>`; } else symbolSvg.innerHTML = `<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/><path d="M7.035 14.854l-1.889-1.889-1.061 1.061 2.95 2.95 5.869-5.869-1.061-1.061z"/>`; squareBox.appendChild(symbolSvg); wrapper.appendChild(squareBox); const label = document.createElement('span'); label.className = 'task-folder-label-text'; label.textContent = folder.name; wrapper.appendChild(label); const optionsIcon = document.createElement('div'); optionsIcon.className = 'folder-options-icon entity-options-icon'; optionsIcon.innerHTML = `<span></span><span></span><span></span>`; optionsIcon.setAttribute('aria-label', `Options for folder ${folder.name}`); optionsIcon.setAttribute('role', 'button'); optionsIcon.tabIndex = 0; optionsIcon.onclick = (e) => { e.stopPropagation(); showFolderContextMenu(folder.id, categoryId, optionsIcon); }; optionsIcon.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showFolderContextMenu(folder.id, categoryId, optionsIcon); }}; wrapper.appendChild(optionsIcon); let folderLongPressTimer; wrapper.addEventListener('touchstart', (e) => { if (e.target === optionsIcon || optionsIcon.contains(e.target)) return; clearTimeout(folderLongPressTimer); optionsIcon.classList.remove('visible'); const touchMoveHandler = () => clearTimeout(folderLongPressTimer); wrapper.addEventListener('touchmove', touchMoveHandler, { once: true }); folderLongPressTimer = setTimeout(() => { optionsIcon.classList.add('visible'); wrapper.removeEventListener('touchmove', touchMoveHandler); }, LONG_PRESS_DURATION); }, {passive: true}); wrapper.addEventListener('touchend', () => clearTimeout(folderLongPressTimer)); wrapper.addEventListener('touchcancel', () => clearTimeout(folderLongPressTimer)); wrapper.onclick = (e) => { if (e.target === optionsIcon || optionsIcon.contains(e.target) || wrapper.querySelector('.folder-inline-rename-input')) return; categoryViewMode[categoryId] = 'view_folder_content'; activeFolderIdForCategory[categoryId] = folder.id; renderCategoryTasks(categoryId); }; wrapper.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && (e.target !== optionsIcon && !optionsIcon.contains(e.target)) && !wrapper.querySelector('.folder-inline-rename-input')) { e.preventDefault(); categoryViewMode[categoryId] = 'view_folder_content'; activeFolderIdForCategory[categoryId] = folder.id; renderCategoryTasks(categoryId); } }; return wrapper; }

// --- Notes Folder Rich Text Editor Functions ---
function renderNotesFolderContent(folder, categoryId, notesFolderWrapperElement) {
    const displayArea = notesFolderWrapperElement.querySelector('.notes-content-display-area');
    const controls = notesFolderWrapperElement.querySelector('.notes-editor-controls');

    // Ensure content is a string (handles migration from old array format if loadUserFolders missed it)
    if (Array.isArray(folder.content)) {
        let htmlContent = "";
        folder.content.forEach(item => {
            const itemValue = item.value || "";
            if (item.type === 'text') htmlContent += `<p>${sanitizeHTMLForDisplay(itemValue)}</p>`;
            else if (item.type === 'link' && typeof itemValue === 'object') {
                 htmlContent += `<p><a href="${sanitizeHTMLForDisplay(itemValue.url)}" target="_blank" rel="noopener noreferrer">${sanitizeHTMLForDisplay(itemValue.text || itemValue.url)}</a></p>`;
            } else if (item.type === 'image' && typeof itemValue === 'object') {
                 htmlContent += `<p><img src="${sanitizeHTMLForDisplay(itemValue.dataUrl)}" alt="${sanitizeHTMLForDisplay(itemValue.alt || 'User image')}" style="max-width: 100%; display: block; margin: 10px 0;"></p>`;
            }
        });
        folder.content = htmlContent;
        saveUserFolders(userFoldersByCategoryId); // Save converted format
    } else if (typeof folder.content !== 'string') {
        folder.content = ""; // Default to empty string
    }

    displayArea.innerHTML = folder.content || '<p><br></p>'; // Use <p><br></p> to ensure editable area has height

    // Remove old event listeners before adding new ones to prevent duplication
    const newControls = controls.cloneNode(true);
    controls.parentNode.replaceChild(newControls, controls);
    
    newControls.querySelector('.add-image-to-note-button').onclick = () => addImageToNotesArea(displayArea, folder);
    newControls.querySelector('#save-notes-folder-button').onclick = () => saveNotesContent(displayArea, folder, categoryId, notesFolderWrapperElement);

    // Auto-linking on input (simplified)
    displayArea.removeEventListener('input', handleNotesInput); // Remove previous if any
    displayArea.addEventListener('input', () => handleNotesInput(displayArea));
}

function handleNotesInput(displayArea) {
    // Basic auto-linking (very simplified)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // This is a naive approach and can be slow or buggy for large content.
    // A more robust solution would involve MutationObserver or a proper editor library.
    // For now, this is a placeholder idea that might not be fully implemented due to complexity.
    // We will rely on explicit save for final link processing.
}

function addImageToNotesArea(displayArea, folder) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                const dataUrl = re.target.result;
                displayArea.focus(); // Focus the editor
                // Insert image at cursor position
                document.execCommand('insertHTML', false, `<p><img src="${dataUrl}" alt="User image" style="max-width: 100%; display: block; margin: 10px 0;"></p>`);
                // Optionally save immediately or wait for explicit save
                folder.content = displayArea.innerHTML; 
                // saveUserFolders(userFoldersByCategoryId); // Or rely on explicit save
            };
            reader.readAsDataURL(file);
        }
    };
    fileInput.click();
}

function processAndSaveNotesContent(htmlContent) {
    // Create a temporary div to parse and manipulate HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Find all text nodes that are not already inside an <a> tag
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
        if (node.parentElement.tagName === 'A' || node.parentElement.closest('a')) {
            continue; // Skip text already in a link
        }

        const text = node.nodeValue;
        const urlRegex = /(https?:\/\/[^\s"<>]+)/g;
        let match;
        let lastIndex = 0;
        const fragments = [];

        while ((match = urlRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            const link = document.createElement('a');
            link.href = match[0];
            link.textContent = match[0];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            fragments.push(link);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.substring(lastIndex)));
        }

        if (fragments.length > 1 || (fragments.length === 1 && fragments[0].nodeType !== Node.TEXT_NODE)) {
            nodesToReplace.push({ oldNode: node, newNodes: fragments });
        }
    }

    nodesToReplace.forEach(replacement => {
        const parent = replacement.oldNode.parentElement;
        if (parent) {
            replacement.newNodes.forEach(newNode => {
                parent.insertBefore(newNode, replacement.oldNode);
            });
            parent.removeChild(replacement.oldNode);
        }
    });
    return tempDiv.innerHTML;
}


function saveNotesContent(displayArea, folder, categoryId, notesFolderWrapperElement) {
    const rawHTML = displayArea.innerHTML;
    folder.content = processAndSaveNotesContent(rawHTML);
    saveUserFolders(userFoldersByCategoryId);

    const saveButton = notesFolderWrapperElement.querySelector('#save-notes-folder-button');
    if (saveButton) {
        const originalButtonContent = saveButton.innerHTML;
        saveButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg> Notes Saved!`;
        setTimeout(() => { saveButton.innerHTML = originalButtonContent; }, 2000);
    }
    // Re-render to reflect processed links, or update displayArea.innerHTML directly if processAndSaveNotesContent is pure.
    displayArea.innerHTML = folder.content;
}


function renderAllCategorySections() { if (!domElements.tabContentsContainer || !domElements.categorySectionTemplate) return; domElements.tabContentsContainer.querySelectorAll('.category-section:not(#dashboard-content)').forEach(sec => sec.remove()); currentCategories.forEach(category => { if (category.id === 'dashboard') return; const sectionClone = domElements.categorySectionTemplate.content.cloneNode(true); const sectionElement = sectionClone.querySelector('.category-section'); sectionElement.id = `category-section-${category.id}`; sectionElement.setAttribute('aria-labelledby', `tab-button-${category.id}`); if (activeTabId !== category.id) sectionElement.classList.add('hidden'); sectionElement.querySelector('.category-title-text').textContent = category.name; const editModeButton = sectionElement.querySelector('.edit-mode-toggle-button'); editModeButton.onclick = () => toggleCategoryEditMode(category.id); sectionElement.querySelector('.undo-category-button').onclick = () => { const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const currentFolderId = activeFolderIdForCategory[category.id]; const folder = userFoldersByCategoryId[category.id]?.find(f => f.id === currentFolderId); if (folder && folder.type === 'task') { folder.tasks.forEach(taskDef => setTaskCompletionStatus(taskDef.id, today, false)); renderCategoryTasks(category.id); updateAllProgress(); } }; ['top', 'bottom'].forEach(position => { const formContainer = sectionElement.querySelector(position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'); if (formContainer) { formContainer.querySelector('.add-item-trigger-button').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') showTempAddTaskForm(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-save').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') handleSaveTempTask(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-cancel').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') hideTempAddTaskForm(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-input').addEventListener('keypress', (e) => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (e.key === 'Enter' && currentFolder && currentFolder.type === 'task') { e.preventDefault(); handleSaveTempTask(category.id, activeFolderIdForCategory[category.id], position); } }); } }); domElements.tabContentsContainer.appendChild(sectionElement); renderCategoryTasks(category.id); }); }
function clearLongPressTimer(tabButton) { if (longPressTimer) clearTimeout(longPressTimer); longPressTimer = null; if (tabButton) { tabButton.removeEventListener('touchmove', preventScrollDuringLongPress); tabButton.removeEventListener('touchend', () => clearLongPressTimer(tabButton)); tabButton.removeEventListener('touchcancel', () => clearLongPressTimer(tabButton)); } }
function preventScrollDuringLongPress(e) { clearTimeout(longPressTimer); }
function renderTabs() { if (!domElements.tabsContainer) return; domElements.tabsContainer.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove()); const addCatButton = domElements.addCategoryButton; currentCategories.sort((a, b) => a.order - b.order).forEach(category => { const tabButton = document.createElement('button'); tabButton.className = 'tab-button'; tabButton.id = `tab-button-${category.id}`; tabButton.dataset.categoryId = category.id; tabButton.textContent = category.name; tabButton.setAttribute('role', 'tab'); tabButton.setAttribute('aria-selected', activeTabId === category.id ? 'true' : 'false'); if (activeTabId === category.id) tabButton.classList.add('active'); const optionsIcon = document.createElement('div'); optionsIcon.className = 'tab-options-icon entity-options-icon'; optionsIcon.innerHTML = `<span></span><span></span><span></span>`; optionsIcon.setAttribute('aria-label', `Options for ${category.name}`); optionsIcon.setAttribute('role', 'button'); optionsIcon.tabIndex = 0; tabButton.appendChild(optionsIcon); optionsIcon.addEventListener('click', (e) => { e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); }); optionsIcon.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') {e.preventDefault();e.stopPropagation();showCategoryContextMenu(category.id,tabButton);}}); tabButton.addEventListener('touchstart', (e) => { clearLongPressTimer(tabButton); tabButton.addEventListener('touchmove', preventScrollDuringLongPress); longPressTimer = setTimeout(() => { e.preventDefault(); optionsIcon.classList.add('visible'); showCategoryContextMenu(category.id, tabButton); clearLongPressTimer(tabButton); }, LONG_PRESS_DURATION); tabButton.addEventListener('touchend', () => clearLongPressTimer(tabButton)); tabButton.addEventListener('touchcancel', () => clearLongPressTimer(tabButton)); }); tabButton.addEventListener('click', (e) => { if (e.target === tabButton && !optionsIcon.contains(e.target)) { tabButton.classList.add('show-badge-highlight'); setTimeout(() => tabButton.classList.remove('show-badge-highlight'), 300); } switchTab(category.id) }); domElements.tabsContainer.insertBefore(tabButton, addCatButton); }); updateCategoryTabIndicators(); }
function switchTab(categoryIdToActivate) { activeTabId = categoryIdToActivate; hideCategoryContextMenu(); hideFolderContextMenu(); domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => { const isCurrent = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button'); button.classList.toggle('active', isCurrent); button.setAttribute('aria-selected', isCurrent.toString()); }); if (domElements.tabContentsContainer) domElements.tabContentsContainer.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard'); domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => { const isCurrent = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content'); section.classList.toggle('hidden', !isCurrent); }); if (activeTabId !== 'dashboard') renderCategoryTasks(activeTabId); else { /* Ensure dashboard content is properly revealed if it was hidden by category view */ const dashboardContent = document.getElementById('dashboard-content'); if (dashboardContent) dashboardContent.classList.remove('hidden'); } if (activeAddTaskForm) hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position); }
function calculateProgress() { let completedCount = 0; let totalTasks = 0; const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { const foldersInCat = userFoldersByCategoryId[category.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { totalTasks++; if (getTaskCompletionStatus(taskDef.id, today)) completedCount++; }); } }); }); const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0; const pointsPerTask = totalTasks > 0 ? DAILY_TARGET_POINTS / totalTasks : 0; const pointsEarned = Math.round(completedCount * pointsPerTask); return { percentage, pointsEarned, completedCount, totalTasks }; }
function updateDashboardSummaries() { if (!domElements.dashboardSummariesContainer) return; domElements.dashboardSummariesContainer.innerHTML = ''; const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { if (category.id === 'dashboard') return; let categoryTotalTasks = 0; let categoryCompletedTasks = 0; const foldersInCat = userFoldersByCategoryId[category.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { categoryTotalTasks++; if (getTaskCompletionStatus(taskDef.id, today)) categoryCompletedTasks++; }); } }); if (foldersInCat.some(f => f.type === 'task')) { const summaryDiv = document.createElement('div'); summaryDiv.className = 'dashboard-category-summary'; summaryDiv.innerHTML = `<h3>${category.name}</h3> <p class="category-stats">${categoryCompletedTasks} / ${categoryTotalTasks}</p>`; const statsP = summaryDiv.querySelector('.category-stats'); if (categoryTotalTasks > 0 && categoryCompletedTasks === categoryTotalTasks) statsP.classList.add('fully-completed'); else statsP.classList.remove('fully-completed'); domElements.dashboardSummariesContainer.appendChild(summaryDiv); } }); }
function updateTodaysProgress() { const progress = calculateProgress(); if (domElements.todayProgressFill) { domElements.todayProgressFill.style.width = `${progress.percentage}%`; domElements.todayProgressFill.style.backgroundColor = getProgressFillColor(progress.percentage); domElements.todayProgressFill.textContent = `${progress.percentage}%`; domElements.todayProgressFill.setAttribute('aria-valuenow', progress.percentage.toString()); } if (domElements.todayPointsStat) domElements.todayPointsStat.textContent = `${progress.pointsEarned} / ${DAILY_TARGET_POINTS} points`; }

function updateCurrentWeekProgress() {
    let targetWeeklyPoints = TARGET_POINTS_FOR_WEEKLY_VIEW;
    let weekStartDate;
    const todayNorm = getNormalizedDate(new Date());

    if (currentProgressPlan) {
        targetWeeklyPoints = currentProgressPlan.targetWeeklyPoints || TARGET_POINTS_FOR_WEEKLY_VIEW;
        const planStartDateNorm = getNormalizedDate(new Date(currentProgressPlan.startDate + 'T00:00:00')); // Ensure time is zeroed
        const planStartDay = parseInt(currentProgressPlan.startDayOfWeek, 10);

        let currentPotentialWeekStart = new Date(todayNorm);
        while (currentPotentialWeekStart.getDay() !== planStartDay) {
            currentPotentialWeekStart.setDate(currentPotentialWeekStart.getDate() - 1);
        }
        weekStartDate = getNormalizedDate(currentPotentialWeekStart);
        
        if (weekStartDate < planStartDateNorm) {
            weekStartDate = planStartDateNorm;
        }

    } else {
        let storedWeekStartDateString = localStorage.getItem(STORAGE_KEY_CURRENT_WEEK_START_DATE);
        weekStartDate = new Date(todayNorm); 
        const dayOfWeek = todayNorm.getDay(); 
        const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStartDate.setDate(todayNorm.getDate() - offsetToMonday);
        weekStartDate = getNormalizedDate(weekStartDate);

        if (storedWeekStartDateString) {
            const storedDate = getNormalizedDate(new Date(storedWeekStartDateString));
            const diffDays = (todayNorm.getTime() - storedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays < 7) {
                 weekStartDate = storedDate;
            } else {
                 localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, weekStartDate.toISOString().split('T')[0]);
            }
        } else {
             localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, weekStartDate.toISOString().split('T')[0]);
        }
    }
    
    let totalPointsThisWeekCycle = 0;
    let currentDateIter = new Date(weekStartDate);
    const todayDateString = getTodayDateString();

    while (getNormalizedDate(currentDateIter) <= todayNorm) {
        const dateStringForIter = `${currentDateIter.getFullYear()}-${(currentDateIter.getMonth() + 1).toString().padStart(2, '0')}-${currentDateIter.getDate().toString().padStart(2, '0')}`;
        let pointsForDay = 0;
        if (dateStringForIter === todayDateString) {
            pointsForDay = calculateProgress().pointsEarned;
        } else {
            const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter);
            if (historyDataString) {
                try { pointsForDay = JSON.parse(historyDataString).pointsEarned || 0; } catch (e) { console.warn("Error parsing history for weekly progress:", e); }
            }
        }
        totalPointsThisWeekCycle += pointsForDay;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    const weeklyCyclePercentage = targetWeeklyPoints > 0 ? Math.min(100, Math.round((totalPointsThisWeekCycle / targetWeeklyPoints) * 100)) : 0;

    if (domElements.currentWeekProgressFill) {
        domElements.currentWeekProgressFill.style.width = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.style.backgroundColor = getProgressFillColor(weeklyCyclePercentage);
        domElements.currentWeekProgressFill.textContent = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.setAttribute('aria-valuenow', weeklyCyclePercentage.toString());
    }
    if (domElements.currentWeekPointsStat) domElements.currentWeekPointsStat.textContent = `${totalPointsThisWeekCycle} / ${targetWeeklyPoints} points`;
    displayCurrentPlanNameOnDashboard();
}


function displayCurrentPlanNameOnDashboard() {
    if (domElements.currentWeeklyPlanNameDisplay) {
        if (currentProgressPlan && currentProgressPlan.name) {
            domElements.currentWeeklyPlanNameDisplay.textContent = `${currentProgressPlan.name} (Weekly)`;
        } else {
            domElements.currentWeeklyPlanNameDisplay.textContent = "Weekly Progress";
        }
    }
}

function renderCalendar() { if (!domElements.calendarGrid || !domElements.calendarMonthYear) return; domElements.calendarGrid.innerHTML = ''; domElements.calendarMonthYear.textContent = `${calendarDisplayDate.toLocaleString('default', { month: 'long' })} ${calendarDisplayDate.getFullYear()}`; const month = calendarDisplayDate.getMonth(), year = calendarDisplayDate.getFullYear(); const firstDayOfMonth = new Date(year, month, 1), daysInMonth = new Date(year, month + 1, 0).getDate(); const startingDayOfWeek = firstDayOfMonth.getDay(); const todayNorm = getNormalizedDate(new Date()), todayDateString = getTodayDateString(); ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dayName => { const dayHeader = document.createElement('div'); dayHeader.className = 'calendar-day-header'; dayHeader.textContent = dayName; domElements.calendarGrid.appendChild(dayHeader); }); for (let i = 0; i < startingDayOfWeek; i++) { const emptyCell = document.createElement('div'); emptyCell.className = 'calendar-day-cell empty'; domElements.calendarGrid.appendChild(emptyCell); } for (let day = 1; day <= daysInMonth; day++) { const cellDate = getNormalizedDate(new Date(year, month, day)); const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; const cell = document.createElement('div'); cell.className = 'calendar-day-cell'; cell.dataset.date = dateString; const dayNumber = document.createElement('span'); dayNumber.className = 'calendar-day-number'; dayNumber.textContent = day.toString(); cell.appendChild(dayNumber); const fillDiv = document.createElement('div'); fillDiv.className = 'calendar-day-fill'; cell.appendChild(fillDiv); let percentageCompleted = 0, hasHistoryData = false; fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.1)'; if (dateString === todayDateString) { cell.classList.add('current-day'); percentageCompleted = calculateProgress().percentage; fillDiv.style.backgroundColor = 'hsl(185, 100%, 45%)'; if (percentageCompleted > 40) cell.classList.add('high-fill'); hasHistoryData = (calculateProgress().completedCount > 0) || !!localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString); } else { const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString); if (historyDataString) try { const historyEntry = JSON.parse(historyDataString); percentageCompleted = historyEntry.percentageCompleted || 0; if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.7)'; hasHistoryData = (historyEntry.completedTasks && Object.values(historyEntry.completedTasks).some(arr=>arr.length>0)) || !!historyEntry.userNote; } catch(e) { if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; } else if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; if (cellDate < todayNorm) cell.classList.add('calendar-day-past'); } if (hasHistoryData) cell.classList.add('has-history'); fillDiv.style.height = `${percentageCompleted}%`; cell.addEventListener('click', () => showHistoryModal(dateString)); domElements.calendarGrid.appendChild(cell); } }
function showHistoryModal(dateString) { currentModalDate = dateString; if (!domElements.historyModal) return; const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString); let historyEntry = null; const isToday = dateString === getTodayDateString(); const isPastDay = new Date(dateString + 'T23:59:59') < getNormalizedDate(new Date()) && !isToday; if (isToday) { const progress = calculateProgress(); const completedTasksTodayFlat = []; currentCategories.forEach(cat => { const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, dateString)) completedTasksTodayFlat.push(taskDef.text); }); }); }); const completedTasksTodayGrouped = {}; currentCategories.forEach(cat => { completedTasksTodayGrouped[cat.id] = []; const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, dateString)) completedTasksTodayGrouped[cat.id].push(taskDef.text); }); }); }); const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) || (domElements.dailyNoteInput ? domElements.dailyNoteInput.value : ""); historyEntry = { date: dateString, completedTasks: completedTasksTodayGrouped, userNote: note, pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage, totalTasksOnDate: progress.totalTasks, dailyTargetPoints: DAILY_TARGET_POINTS }; } else if (historyDataString) try { historyEntry = JSON.parse(historyDataString); } catch (e) {} domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); if (historyEntry) { const targetPoints = historyEntry.dailyTargetPoints || DAILY_TARGET_POINTS; domElements.historyModalPointsValue.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A'; domElements.historyModalPointsTotal.textContent = targetPoints.toString(); const completionPercentage = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted : 0; domElements.historyPercentageProgressFill.style.width = `${completionPercentage}%`; domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(completionPercentage); domElements.historyPercentageProgressFill.textContent = `${completionPercentage}%`; domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', completionPercentage); domElements.historyTasksList.innerHTML = ''; let hasCompletedTasks = false; if (historyEntry.completedTasks) { Object.keys(historyEntry.completedTasks).forEach(catId => { const tasksInCategory = historyEntry.completedTasks[catId]; if (tasksInCategory && tasksInCategory.length > 0) { hasCompletedTasks = true; const catGroup = document.createElement('div'); catGroup.className = 'history-category-group'; const catTitle = document.createElement('h5'); catTitle.className = 'history-category-title'; catTitle.textContent = getCategoryNameById(catId); catGroup.appendChild(catTitle); const ul = document.createElement('ul'); tasksInCategory.forEach(taskText => { const li = document.createElement('li'); const span = document.createElement('span'); span.textContent = taskText; li.appendChild(span); ul.appendChild(li); }); catGroup.appendChild(ul); domElements.historyTasksList.appendChild(catGroup); } }); } if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>'; domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks); domElements.historyUserNoteDisplay.textContent = historyEntry.userNote || "No reflection recorded for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.value = historyEntry.userNote || ""; domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = ''; domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote); if (isPastDay || isToday) domElements.historyUserNoteDisplay.ondblclick = () => { domElements.historyUserNoteDisplay.classList.add('hidden'); domElements.historyUserNoteEdit.classList.remove('hidden'); domElements.historicalNoteControls.classList.remove('hidden'); domElements.historyUserNoteEdit.focus(); }; else domElements.historyUserNoteDisplay.ondblclick = null; } else { domElements.historyModalPointsValue.textContent = 'N/A'; domElements.historyModalPointsTotal.textContent = DAILY_TARGET_POINTS.toString(); domElements.historyPercentageProgressFill.style.width = `0%`; domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(0); domElements.historyPercentageProgressFill.textContent = `0%`; domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', 0); domElements.historyTasksList.innerHTML = '<p>No data available for this day.</p>'; domElements.historyUserNoteDisplay.textContent = "No data available for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = ''; domElements.expandTasksButton.classList.add('hidden'); domElements.expandReflectionButton.classList.add('hidden'); domElements.historyUserNoteDisplay.ondblclick = null; } domElements.historyModal.classList.remove('hidden'); domElements.historyModalCloseButton.focus(); }

function getCategoryNameById(categoryId) { const category = currentCategories.find(c => c.id === categoryId); return category ? category.name : "Unknown Category"; }
function saveHistoricalNote() { if (!currentModalDate) return; const noteContent = domElements.historyUserNoteEdit.value; const isToday = currentModalDate === getTodayDateString(); let historyKey, historyEntry; if (isToday) { historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate; const progress = calculateProgress(); const completedTasksTodayGrouped = {}; currentCategories.forEach(cat => { completedTasksTodayGrouped[cat.id] = []; (userFoldersByCategoryId[cat.id] || []).forEach(folder => { if (folder.type === 'task') folder.tasks.forEach(taskDef => { if (getTaskCompletionStatus(taskDef.id, currentModalDate)) completedTasksTodayGrouped[cat.id].push(taskDef.text); }); }); }); historyEntry = { date: currentModalDate, completedTasks: completedTasksTodayGrouped, userNote: noteContent, pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage, totalTasksOnDate: progress.totalTasks, dailyTargetPoints: DAILY_TARGET_POINTS }; localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent); } else { historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate; const historyDataString = localStorage.getItem(historyKey); if (historyDataString) try { historyEntry = JSON.parse(historyDataString); } catch (e) { historyEntry = { date: currentModalDate, completedTasks: {}, pointsEarned: 0, percentageCompleted: 0, totalTasksOnDate: 0, dailyTargetPoints: DAILY_TARGET_POINTS }; } else historyEntry = { date: currentModalDate, completedTasks: {}, userNote: '', pointsEarned: 0, percentageCompleted: 0, totalTasksOnDate: 0, dailyTargetPoints: DAILY_TARGET_POINTS }; historyEntry.userNote = noteContent; } localStorage.setItem(historyKey, JSON.stringify(historyEntry)); domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = 'Saved!'; domElements.expandReflectionButton.classList.toggle('hidden', !noteContent); setTimeout(() => domElements.historicalNoteStatus.textContent = '', 2000); if(currentModalDate === getTodayDateString()) domElements.dailyNoteInput.value = noteContent; renderCalendar(); updateCategoryTabIndicators(); }
function clearHistoricalNote() { if (!currentModalDate) return; const isToday = currentModalDate === getTodayDateString(); let historyKey, historyEntry; if (isToday) { historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate; const progress = calculateProgress(); const completedTasksTodayGrouped = {}; currentCategories.forEach(cat => { completedTasksTodayGrouped[cat.id] = []; (userFoldersByCategoryId[cat.id] || []).forEach(folder => { if (folder.type === 'task') folder.tasks.forEach(taskDef => { if (getTaskCompletionStatus(taskDef.id, currentModalDate)) completedTasksTodayGrouped[cat.id].push(taskDef.text); }); }); }); historyEntry = { date: currentModalDate, completedTasks: completedTasksTodayGrouped, userNote: "", pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage, totalTasksOnDate: progress.totalTasks, dailyTargetPoints: DAILY_TARGET_POINTS }; localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate); } else { historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate; const historyDataString = localStorage.getItem(historyKey); if (historyDataString) try { historyEntry = JSON.parse(historyDataString); } catch (e) { historyEntry = { date: currentModalDate, completedTasks: {}, pointsEarned: 0, percentageCompleted: 0, totalTasksOnDate: 0, dailyTargetPoints: DAILY_TARGET_POINTS }; } else historyEntry = { date: currentModalDate, completedTasks: {}, userNote: '', pointsEarned: 0, percentageCompleted: 0, totalTasksOnDate: 0, dailyTargetPoints: DAILY_TARGET_POINTS }; historyEntry.userNote = ""; } localStorage.setItem(historyKey, JSON.stringify(historyEntry)); domElements.historyUserNoteEdit.value = ""; domElements.historyUserNoteDisplay.textContent = "No reflection recorded for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = 'Cleared!'; domElements.expandReflectionButton.classList.add('hidden'); setTimeout(() => domElements.historicalNoteStatus.textContent = '', 2000); if(currentModalDate === getTodayDateString()) domElements.dailyNoteInput.value = ""; renderCalendar(); updateCategoryTabIndicators(); }
function openMonthYearPicker() { if (!domElements.monthYearPickerModal) return; isMonthYearPickerOpen = true; pickerSelectedMonth = calendarDisplayDate.getMonth(); pickerSelectedYear = calendarDisplayDate.getFullYear(); renderMonthPicker(); renderYearPicker(); domElements.monthYearPickerModal.classList.remove('hidden'); domElements.monthYearPickerModal.setAttribute('aria-hidden', 'false'); if (domElements.monthYearPickerCloseButton) domElements.monthYearPickerCloseButton.focus(); }
function closeMonthYearPicker() { if (!domElements.monthYearPickerModal) return; isMonthYearPickerOpen = false; domElements.monthYearPickerModal.classList.add('hidden'); domElements.monthYearPickerModal.setAttribute('aria-hidden', 'true'); if (domElements.calendarMonthYearButton) domElements.calendarMonthYearButton.focus(); }
function renderMonthPicker() { if (!domElements.pickerMonthsGrid) return; domElements.pickerMonthsGrid.innerHTML = ''; const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; months.forEach((month, index) => { const monthButton = document.createElement('button'); monthButton.className = 'month-option'; monthButton.textContent = month; monthButton.dataset.month = index; if (index === pickerSelectedMonth) monthButton.classList.add('selected'); monthButton.onclick = () => { pickerSelectedMonth = index; calendarDisplayDate.setMonth(pickerSelectedMonth); calendarDisplayDate.setFullYear(pickerSelectedYear); renderCalendar(); closeMonthYearPicker(); }; domElements.pickerMonthsGrid.appendChild(monthButton); }); }
function renderYearPicker() { if (!domElements.pickerYearsList) return; domElements.pickerYearsList.innerHTML = ''; const currentYear = new Date().getFullYear(); for (let year = currentYear - 10; year <= currentYear + 10; year++) { const yearButton = document.createElement('button'); yearButton.className = 'year-option'; yearButton.textContent = year; yearButton.dataset.year = year; if (year === pickerSelectedYear) yearButton.classList.add('selected'); yearButton.onclick = () => { pickerSelectedYear = year; calendarDisplayDate.setFullYear(pickerSelectedYear); calendarDisplayDate.setMonth(pickerSelectedMonth); renderCalendar(); closeMonthYearPicker(); }; domElements.pickerYearsList.appendChild(yearButton); if (year === pickerSelectedYear) yearButton.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
function updateAllProgress() { updateTodaysProgress(); updateCurrentWeekProgress(); updateDashboardSummaries(); updateCategoryTabIndicators(); }
function updateCategoryTabIndicators() { const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { if (category.id === 'dashboard') return; const tabButton = document.getElementById(`tab-button-${category.id}`); if (!tabButton) return; let categoryTotalTasks = 0; let categoryCompletedTasks = 0; let categoryPendingTasks = 0; const foldersInCat = userFoldersByCategoryId[category.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { categoryTotalTasks++; if (getTaskCompletionStatus(taskDef.id, today)) categoryCompletedTasks++; else categoryPendingTasks++; }); } }); tabButton.classList.toggle('category-complete-indicator', categoryTotalTasks > 0 && categoryCompletedTasks === categoryTotalTasks); let badge = tabButton.querySelector('.notification-badge'); if (categoryPendingTasks > 0) { if (!badge) { badge = document.createElement('span'); badge.className = 'notification-badge'; tabButton.appendChild(badge); } badge.textContent = categoryPendingTasks; badge.style.display = 'flex'; } else if (badge) badge.style.display = 'none'; }); }
function showFullscreenContent(type, content) { if (!domElements.fullscreenContentModal) return; currentFullscreenContent = { type, content }; let title = "", displayHTML = ""; if (type === 'tasks') { title = `Completed Tasks for ${new Date(currentModalDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`; if (content && Object.keys(content).length > 0) { Object.keys(content).forEach(catId => { const tasksInCategory = content[catId]; if (tasksInCategory && tasksInCategory.length > 0) { displayHTML += `<div class="history-category-group"><h4 class="history-category-title">${getCategoryNameById(catId)}</h4><ul>`; tasksInCategory.forEach(taskText => { displayHTML += `<li><span>${sanitizeHTMLForDisplay(taskText)}</span></li>`; }); displayHTML += `</ul></div>`; } }); if (!displayHTML) displayHTML = "<p>No tasks were completed.</p>"; } else displayHTML = "<p>No tasks were completed.</p>"; } else if (type === 'reflection') { title = `My Reflection for ${new Date(currentModalDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`; displayHTML = `<pre>${sanitizeHTMLForDisplay(content || "No reflection recorded.")}</pre>`; } if (domElements.fullscreenModalTitle) domElements.fullscreenModalTitle.textContent = title; if (domElements.fullscreenModalArea) domElements.fullscreenModalArea.innerHTML = displayHTML; domElements.fullscreenContentModal.classList.remove('hidden'); if (domElements.fullscreenModalCloseButton) domElements.fullscreenModalCloseButton.focus(); }
function hideFullscreenContent() { if (!domElements.fullscreenContentModal) return; domElements.fullscreenContentModal.classList.add('hidden'); currentFullscreenContent = null; if (domElements.historyModal && !domElements.historyModal.classList.contains('hidden')) domElements.historyModalCloseButton.focus(); }
function addCategory() { const newCategoryName = prompt("Enter new category name:"); if (newCategoryName && newCategoryName.trim() !== "") { const newCategoryId = createUniqueId('cat'); const newCategory = { id: newCategoryId, name: newCategoryName.trim(), order: currentCategories.length, deletable: true }; currentCategories.push(newCategory); userFoldersByCategoryId[newCategoryId] = []; saveUserCategories(currentCategories); saveUserFolders(userFoldersByCategoryId); editModes[newCategoryId] = false; categoryViewMode[newCategoryId] = 'list_folders'; activeFolderIdForCategory[newCategoryId] = null; renderTabs(); renderAllCategorySections(); switchTab(newCategoryId); } }
function showCategoryContextMenu(categoryId, tabButton) { if (!domElements.categoryTabContextMenu) return; currentContextMenuTargetTab = tabButton; const rect = tabButton.getBoundingClientRect(); domElements.categoryTabContextMenu.style.top = `${rect.bottom + window.scrollY}px`; domElements.categoryTabContextMenu.style.left = `${rect.left + window.scrollX}px`; domElements.categoryTabContextMenu.classList.remove('hidden'); domElements.categoryTabContextMenu.dataset.categoryId = categoryId; domElements.ctxRenameCategoryButton.focus(); }
function hideCategoryContextMenu() { if (domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.classList.add('hidden'); currentContextMenuTargetTab = null; }
function renameCategory(categoryId) { const category = currentCategories.find(c => c.id === categoryId); if (!category) return; const newName = prompt(`Rename category "${category.name}" to:`, category.name); if (newName && newName.trim() !== "" && newName.trim() !== category.name) { category.name = newName.trim(); saveUserCategories(currentCategories); renderTabs(); if (document.getElementById(`category-section-${categoryId}`)) document.getElementById(`category-section-${categoryId}`).querySelector('.category-title-text').textContent = category.name; } hideCategoryContextMenu(); }
function openAddFolderModal(categoryId) { if (!domElements.addFolderModal) return; domElements.addFolderModal.dataset.categoryId = categoryId; domElements.addFolderStep1.classList.remove('hidden'); domElements.addFolderStep2.classList.add('hidden'); if(domElements.selectedFolderTypeNameSpan) domElements.selectedFolderTypeNameSpan.textContent = ''; if(domElements.newFolderNameInput) domElements.newFolderNameInput.value = ''; domElements.addFolderModal.classList.remove('hidden'); domElements.selectTaskFolderTypeButton.focus(); }
function handleFolderTypeSelection(type, categoryId) { if (!domElements.addFolderStep1 || !domElements.addFolderStep2 || !domElements.selectedFolderTypeNameSpan) return; domElements.addFolderStep1.classList.add('hidden'); domElements.addFolderStep2.classList.remove('hidden'); domElements.selectedFolderTypeNameSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1); domElements.addFolderModal.dataset.folderType = type; domElements.newFolderNameInput.focus(); }
function handleAddFolderBack() { if (!domElements.addFolderStep1 || !domElements.addFolderStep2) return; domElements.addFolderStep2.classList.add('hidden'); domElements.addFolderStep1.classList.remove('hidden'); delete domElements.addFolderModal.dataset.folderType; domElements.selectTaskFolderTypeButton.focus(); }
function createNewFolder() { if (!domElements.addFolderModal || !domElements.newFolderNameInput) return; const categoryId = domElements.addFolderModal.dataset.categoryId; const folderType = domElements.addFolderModal.dataset.folderType; const folderName = domElements.newFolderNameInput.value.trim(); if (!categoryId || !folderType || !folderName) { alert("Folder name cannot be empty."); return; } if (!userFoldersByCategoryId[categoryId]) userFoldersByCategoryId[categoryId] = []; const newFolder = { id: createUniqueId('folder'), name: folderName, type: folderType, order: userFoldersByCategoryId[categoryId].length, tasks: folderType === 'task' ? [] : undefined, content: folderType === 'notes' ? '' : undefined }; userFoldersByCategoryId[categoryId].push(newFolder); saveUserFolders(userFoldersByCategoryId); renderCategoryTasks(categoryId); closeAddFolderModal(); }
function closeAddFolderModal() { if (domElements.addFolderModal) domElements.addFolderModal.classList.add('hidden'); }
function showFolderContextMenu(folderId, categoryId, iconElement) { if (!domElements.folderOptionsContextMenu) return; currentFolderOptionsMenu.element = iconElement; currentFolderOptionsMenu.folderId = folderId; currentFolderOptionsMenu.categoryId = categoryId; const rect = iconElement.getBoundingClientRect(); domElements.folderOptionsContextMenu.style.top = `${rect.bottom + window.scrollY}px`; domElements.folderOptionsContextMenu.style.left = `${rect.left + window.scrollX - domElements.folderOptionsContextMenu.offsetWidth + rect.width}px`; domElements.folderOptionsContextMenu.classList.remove('hidden'); domElements.folderOptionsContextMenu.dataset.folderId = folderId; domElements.folderOptionsContextMenu.dataset.categoryId = categoryId; domElements.ctxRenameFolderButton.focus(); }
function hideFolderContextMenu() { if (domElements.folderOptionsContextMenu) domElements.folderOptionsContextMenu.classList.add('hidden'); if (currentFolderOptionsMenu.element) currentFolderOptionsMenu.element.classList.remove('visible'); currentFolderOptionsMenu = { element: null, folderId: null, categoryId: null }; }
function startFolderRename(folderId, categoryId) { hideFolderContextMenu(); const folderWrapper = document.querySelector(`.task-folder-box-wrapper[data-folder-id="${folderId}"]`); if (!folderWrapper) return; const labelSpan = folderWrapper.querySelector('.task-folder-label-text'); const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (!labelSpan || !folder) return; labelSpan.style.display = 'none'; let input = folderWrapper.querySelector('.folder-inline-rename-input'); if (!input) { input = document.createElement('input'); input.type = 'text'; input.className = 'folder-inline-rename-input'; folderWrapper.appendChild(input); } input.value = folder.name; input.style.display = 'block'; input.focus(); input.select(); const saveRename = () => { const newName = input.value.trim(); if (newName && newName !== folder.name) { folder.name = newName; saveUserFolders(userFoldersByCategoryId); labelSpan.textContent = newName; } labelSpan.style.display = ''; input.style.display = 'none'; }; input.onblur = saveRename; input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveRename(); input.blur(); } else if (e.key === 'Escape') { labelSpan.style.display = ''; input.style.display = 'none'; input.value = folder.name; input.blur(); } }; }

// Progress System UI Functions
function switchProgressTab(tabToActivate) {
    const tabs = [domElements.progressTabSetup, domElements.progressTabHistory];
    const contents = [domElements.progressSetupContent, domElements.progressHistoryContent];

    tabs.forEach((tab, index) => {
        const content = contents[index];
        if (tab.id === tabToActivate) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            content.classList.remove('hidden');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            content.classList.add('hidden');
        }
    });
    if (tabToActivate === 'progress-tab-history') renderProgressHistory();
}

function renderProgressSetupForm() {
    if (!currentProgressPlan) {
        domElements.progressPlanNameInput.value = '';
        domElements.progressStartDateInput.value = getTodayDateString();
        domElements.progressStartDaySelect.value = '1'; // Default to Monday
        domElements.progressTargetWeeklyPointsInput.value = '';
        domElements.activePlanSummary.classList.add('hidden');
        domElements.endCurrentPlanButton.classList.add('hidden');
        domElements.saveProgressPlanButton.textContent = 'Save Plan';
    } else {
        domElements.progressPlanNameInput.value = currentProgressPlan.name;
        domElements.progressStartDateInput.value = currentProgressPlan.startDate;
        domElements.progressStartDaySelect.value = currentProgressPlan.startDayOfWeek.toString();
        domElements.progressTargetWeeklyPointsInput.value = currentProgressPlan.targetWeeklyPoints.toString();
        
        domElements.activePlanNameDisplay.textContent = currentProgressPlan.name;
        domElements.activePlanStartDateDisplay.textContent = new Date(currentProgressPlan.startDate + 'T00:00:00').toLocaleDateString();
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        domElements.activePlanStartDayDisplay.textContent = dayNames[currentProgressPlan.startDayOfWeek];
        domElements.activePlanTargetPointsDisplay.textContent = currentProgressPlan.targetWeeklyPoints;
        domElements.activePlanSummary.classList.remove('hidden');
        domElements.endCurrentPlanButton.classList.remove('hidden');
        domElements.saveProgressPlanButton.textContent = 'Update Plan';
    }
}

function handleSaveProgressPlan(event) {
    event.preventDefault();
    const planName = domElements.progressPlanNameInput.value.trim();
    const startDate = domElements.progressStartDateInput.value;
    const startDayOfWeek = parseInt(domElements.progressStartDaySelect.value, 10);
    const targetWeeklyPoints = parseInt(domElements.progressTargetWeeklyPointsInput.value, 10);

    if (!planName || !startDate || isNaN(startDayOfWeek) || isNaN(targetWeeklyPoints) || targetWeeklyPoints <= 0) {
        alert("Please fill in all fields correctly. Target points must be a positive number.");
        return;
    }

    currentProgressPlan = { name: planName, startDate, startDayOfWeek, targetWeeklyPoints };
    TARGET_POINTS_FOR_WEEKLY_VIEW = targetWeeklyPoints; // Update global target
    saveProgressData();
    renderProgressSetupForm();
    updateCurrentWeekProgress(); // Re-calculate weekly progress based on new plan
    alert("Progress plan saved!");
}

function handleEndCurrentPlan() {
    if (!currentProgressPlan) {
        alert("No active plan to end.");
        return;
    }
    if (!confirm(`Are you sure you want to end the current plan "${currentProgressPlan.name}"? This will move it to history.`)) {
        return;
    }

    // Calculate final stats for the plan before ending
    const planStartDate = getNormalizedDate(new Date(currentProgressPlan.startDate + 'T00:00:00'));
    const planEndDate = getNormalizedDate(new Date()); // Today
    const planStartDay = currentProgressPlan.startDayOfWeek;
    
    let totalPointsEarnedForPlan = 0;
    let totalTargetPointsForPlan = 0;
    let numberOfFullWeeks = 0;

    let weekIteratorStartDate = new Date(planStartDate);
    while(weekIteratorStartDate.getDay() !== planStartDay) {
        weekIteratorStartDate.setDate(weekIteratorStartDate.getDate() + 1); // Align to first actual start day if plan start is mid-week
    }
    weekIteratorStartDate = getNormalizedDate(weekIteratorStartDate);


    while(weekIteratorStartDate <= planEndDate) {
        let weekPoints = 0;
        let weekStillActive = false;
        for (let i = 0; i < 7; i++) {
            const dayInWeek = getNormalizedDate(new Date(weekIteratorStartDate));
            dayInWeek.setDate(weekIteratorStartDate.getDate() + i);

            if (dayInWeek > planEndDate) break; // Don't count beyond plan end date
            weekStillActive = true;

            const dateStringForDay = `${dayInWeek.getFullYear()}-${(dayInWeek.getMonth() + 1).toString().padStart(2, '0')}-${dayInWeek.getDate().toString().padStart(2, '0')}`;
            
            let pointsForDay = 0;
            if (dateStringForDay === getTodayDateString()) { // If it's today, use current calculation
                pointsForDay = calculateProgress().pointsEarned;
            } else {
                const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForDay);
                if (historyDataString) {
                    try { pointsForDay = JSON.parse(historyDataString).pointsEarned || 0; } catch (e) { /* ignore */ }
                }
            }
            weekPoints += pointsForDay;
        }
        
        if (weekStillActive) {
            totalPointsEarnedForPlan += weekPoints;
            totalTargetPointsForPlan += currentProgressPlan.targetWeeklyPoints;
            numberOfFullWeeks++;
        }
        weekIteratorStartDate.setDate(weekIteratorStartDate.getDate() + 7);
    }
    
    const overallPercentage = totalTargetPointsForPlan > 0 ? Math.round((totalPointsEarnedForPlan / totalTargetPointsForPlan) * 100) : 0;

    const historicalPlanEntry = {
        name: currentProgressPlan.name,
        startDate: currentProgressPlan.startDate,
        endDate: planEndDate.toISOString().split('T')[0],
        weeklyProgressDetails: {
            pointsEarned: totalPointsEarnedForPlan,
            targetPoints: totalTargetPointsForPlan,
            percentage: overallPercentage,
            totalWeeks: numberOfFullWeeks,
            avgWeeklyPoints: numberOfFullWeeks > 0 ? Math.round(totalPointsEarnedForPlan / numberOfFullWeeks) : 0,
        }
    };

    progressHistory.unshift(historicalPlanEntry); // Add to the beginning of history
    currentProgressPlan = null;
    TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Reset to default
    saveProgressData();
    renderProgressSetupForm();
    updateCurrentWeekProgress();
    alert("Current plan ended and moved to history.");
}


function renderProgressHistory() {
    domElements.progressHistoryList.innerHTML = '';
    if (progressHistory.length === 0) {
        domElements.noProgressHistoryMessage.classList.remove('hidden');
        return;
    }
    domElements.noProgressHistoryMessage.classList.add('hidden');

    progressHistory.forEach(plan => {
        const li = document.createElement('li');
        const startDate = new Date(plan.startDate + 'T00:00:00').toLocaleDateString();
        const endDate = new Date(plan.endDate + 'T00:00:00').toLocaleDateString();
        const details = plan.weeklyProgressDetails;

        li.innerHTML = `
            <div class="history-item-name">${plan.name}</div>
            <div class="history-item-dates"><strong>Duration:</strong> ${startDate} - ${endDate} (${details.totalWeeks} weeks)</div>
            <div class="history-item-stats">
                <strong>Progress:</strong> ${details.pointsEarned} / ${details.targetPoints} points (${details.percentage}%)
            </div>
            <div class="history-item-stats">
                <strong>Avg Weekly Points:</strong> ${details.avgWeeklyPoints}
            </div>
        `;
        domElements.progressHistoryList.appendChild(li);
    });
}


function toggleMainView(viewToShow) { // 'dashboard' or 'progress'
    currentView = viewToShow;
    if (viewToShow === 'progress') {
        domElements.mainContentWrapper.classList.add('view-hidden');
        domElements.progressSystemView.classList.remove('hidden');
        domElements.sideMenuProgressLink.classList.add('active-view');
        domElements.sideMenuDashboardLink.classList.remove('active-view');
        renderProgressSetupForm(); // Ensure form is up-to-date
        switchProgressTab('progress-tab-setup'); // Default to setup tab
    } else { // 'dashboard'
        domElements.progressSystemView.classList.add('hidden');
        domElements.mainContentWrapper.classList.remove('view-hidden');
        domElements.sideMenuDashboardLink.classList.add('active-view');
        domElements.sideMenuProgressLink.classList.remove('active-view');
    }
    closeSideMenu();
}

function toggleSideMenu() {
    const isExpanded = domElements.hamburgerMenuButton.getAttribute('aria-expanded') === 'true';
    domElements.hamburgerMenuButton.setAttribute('aria-expanded', !isExpanded);
    domElements.sideMenu.classList.toggle('open');
    domElements.sideMenu.setAttribute('aria-hidden', isExpanded);
    if (!isExpanded) { // Opening menu
        domElements.sideMenu.querySelector('button').focus();
    } else { // Closing menu
        domElements.hamburgerMenuButton.focus();
    }
}
function closeSideMenu() {
    domElements.hamburgerMenuButton.setAttribute('aria-expanded', 'false');
    domElements.sideMenu.classList.remove('open');
    domElements.sideMenu.setAttribute('aria-hidden', 'true');
}


function initializeDOMReferences() {
  const ids = [
    'app-container', 'hamburger-menu-button', 'side-menu', 'side-menu-dashboard-link', 'side-menu-progress-link',
    'main-content-wrapper', 'progress-system-view', 'progress-system-header', 'progress-system-back-button',
    'progress-tab-setup', 'progress-tab-history', 'progress-setup-content', 'progress-history-content',
    'progress-setup-form', 'progress-plan-name', 'progress-start-date', 'progress-start-day', 'progress-target-weekly-points',
    'save-progress-plan-button', 'end-current-plan-button', 'active-plan-summary', 'active-plan-name-display',
    'active-plan-start-date-display', 'active-plan-start-day-display', 'active-plan-target-points-display',
    'progress-history-list', 'no-progress-history',
    'tabs', 'tab-content', 'add-category-button', 'category-section-template', 'back-to-folders-button-template',
    'category-tab-context-menu', 'ctx-rename-category', 'ctx-delete-category',
    'folder-options-context-menu', 'ctx-rename-folder', 'ctx-delete-folder',
    'dashboard-summaries', 'today-progress-fill', 'today-points-stat', 'current-weekly-plan-name-display',
    'current-week-progress-fill', 'current-week-points-stat',
    'calendar-month-year-button', 'calendar-month-year', 'calendar-grid', 'calendar-prev-month', 'calendar-next-month',
    'month-year-picker-modal', 'month-year-picker-content', 'month-year-picker-close-button',
    'picker-months-grid', 'picker-years-list', 'daily-note-input', 'save-note-button',
    'history-modal', 'history-modal-close-button', 'history-modal-date', 'history-modal-points-value',
    'history-modal-points-total', 'history-percentage-progress-fill', 'history-tasks-list',
    'expand-tasks-button', 'historical-reflection-wrapper', 'expand-reflection-button',
    'history-user-note-display', 'history-user-note-edit', 'historical-note-controls',
    'save-historical-note-button', 'clear-historical-note-button', 'historical-note-status',
    'task-edit-controls-template', 'delete-confirmation-modal', 'delete-confirmation-title',
    'delete-confirmation-message', 'delete-confirmation-close-button', 'confirm-delete-button', 'cancel-delete-button',
    'fullscreen-content-modal', 'fullscreen-modal-title', 'fullscreen-modal-area', 'fullscreen-modal-close-button',
    'add-folder-modal', 'add-folder-modal-close-button', 'add-folder-step-1', 'add-folder-step-2',
    'select-task-folder-type', 'select-notes-folder-type', 'add-folder-back-button',
    'selected-folder-type-name', 'new-folder-name-input', 'create-folder-button', 'cancel-add-folder-button',
  ];
  ids.forEach(id => {
    const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    domElements[camelCaseId] = document.getElementById(id);
  });
  domElements.tabContentsContainer = domElements.tabContent; // Alias for clarity
  domElements.tabsContainer = domElements.tabs;
  domElements.dashboardSummariesContainer = domElements.dashboardSummaries;
  // domElements.noteItemTemplate = document.getElementById('note-item-template'); // Obsolete
  // domElements.noteItemEditTextareaTemplate = document.getElementById('note-item-edit-form-template-text'); // Obsolete
  // domElements.noteItemEditLinkTemplate = document.getElementById('note-item-edit-form-template-link'); // Obsolete
  // domElements.noteItemEditImageTemplate = document.getElementById('note-item-edit-form-template-image'); // Obsolete
}
function setupEventListeners() {
  domElements.addCategoryButton?.addEventListener('click', addCategory);
  domElements.calendarPrevMonthButton?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendar(); });
  domElements.calendarNextMonthButton?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendar(); });
  domElements.calendarMonthYearButton?.addEventListener('click', openMonthYearPicker);
  domElements.monthYearPickerCloseButton?.addEventListener('click', closeMonthYearPicker);
  domElements.historyModalCloseButton?.addEventListener('click', () => domElements.historyModal.classList.add('hidden'));
  domElements.saveHistoricalNoteButton?.addEventListener('click', saveHistoricalNote);
  domElements.clearHistoricalNoteButton?.addEventListener('click', clearHistoricalNote);
  domElements.expandTasksButton?.addEventListener('click', () => showFullscreenContent('tasks', JSON.parse(localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate) || '{}').completedTasks));
  domElements.expandReflectionButton?.addEventListener('click', () => showFullscreenContent('reflection', JSON.parse(localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate) || '{}').userNote));
  domElements.fullscreenModalCloseButton?.addEventListener('click', hideFullscreenContent);
  domElements.saveNoteButton?.addEventListener('click', saveDailyNote);
  domElements.confirmDeleteButton?.addEventListener('click', confirmDeletion);
  domElements.cancelDeleteButton?.addEventListener('click', hideDeleteConfirmation);
  domElements.deleteConfirmationCloseButton?.addEventListener('click', hideDeleteConfirmation);
  domElements.ctxRenameCategoryButton?.addEventListener('click', () => renameCategory(domElements.categoryTabContextMenu.dataset.categoryId));
  domElements.ctxDeleteCategoryButton?.addEventListener('click', () => { const catId = domElements.categoryTabContextMenu.dataset.categoryId; const cat = currentCategories.find(c=>c.id === catId); showDeleteConfirmation('category', catId, `Are you sure you want to delete the category "${cat?.name || 'this category'}" and all its contents? This action cannot be undone.`); hideCategoryContextMenu(); });
  document.addEventListener('click', (e) => { if (currentContextMenuTargetTab && !domElements.categoryTabContextMenu.contains(e.target) && e.target !== currentContextMenuTargetTab && !currentContextMenuTargetTab.contains(e.target)) hideCategoryContextMenu(); if (currentFolderOptionsMenu.element && !domElements.folderOptionsContextMenu.contains(e.target) && e.target !== currentFolderOptionsMenu.element && !currentFolderOptionsMenu.element.contains(e.target)) hideFolderContextMenu(); });
  domElements.tabsContainer?.addEventListener('dragover', (e) => { e.preventDefault(); const afterElement = getDragAfterElement(domElements.tabsContainer, e.clientY, '.tab-button:not(#dashboard-tab-button):not(#add-category-button)'); const draggingTab = domElements.tabsContainer.querySelector('.dragging'); if (draggingTab) { if (afterElement == null) domElements.tabsContainer.insertBefore(draggingTab, domElements.addCategoryButton); else domElements.tabsContainer.insertBefore(draggingTab, afterElement); } });
  domElements.tabContentsContainer?.addEventListener('dragover', (e) => { e.preventDefault(); const taskList = e.target.closest('.task-list'); if (!taskList || !draggedItemElement || !draggedItemElement.classList.contains('task-item')) return; document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom')); const afterElement = getDragAfterElement(taskList, e.clientY, '.task-item'); const targetItem = e.target.closest('.task-item'); if (targetItem && targetItem !== draggedItemElement) { const rect = targetItem.getBoundingClientRect(); const isOverTopHalf = e.clientY < rect.top + rect.height / 2; if (isOverTopHalf) targetItem.classList.add('drag-over-indicator-task'); else targetItem.classList.add('drag-over-indicator-task-bottom'); } if (draggedItemElement) { if (afterElement == null) taskList.appendChild(draggedItemElement); else taskList.insertBefore(draggedItemElement, afterElement); } });
  domElements.tabContentsContainer?.addEventListener('drop', (e) => { e.preventDefault(); document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom')); });
  domElements.addFolderModalCloseButton?.addEventListener('click', closeAddFolderModal);
  domElements.selectTaskFolderTypeButton?.addEventListener('click', () => handleFolderTypeSelection('task', domElements.addFolderModal.dataset.categoryId));
  domElements.selectNotesFolderTypeButton?.addEventListener('click', () => handleFolderTypeSelection('notes', domElements.addFolderModal.dataset.categoryId));
  domElements.addFolderBackButton?.addEventListener('click', handleAddFolderBack);
  domElements.createFolderButton?.addEventListener('click', createNewFolder);
  domElements.cancelAddFolderButton?.addEventListener('click', closeAddFolderModal);
  domElements.newFolderNameInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); createNewFolder(); } });
  domElements.ctxRenameFolderButton?.addEventListener('click', () => startFolderRename(domElements.folderOptionsContextMenu.dataset.folderId, domElements.folderOptionsContextMenu.dataset.categoryId));
  domElements.ctxDeleteFolderButton?.addEventListener('click', () => { const folderId = domElements.folderOptionsContextMenu.dataset.folderId; const categoryId = domElements.folderOptionsContextMenu.dataset.categoryId; const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); showDeleteConfirmation('folder', folderId, `Are you sure you want to delete the folder "${folder?.name || 'this folder'}" and all its contents?`, '', categoryId); hideFolderContextMenu(); });

  // Progress System Event Listeners
  domElements.progressTabSetup?.addEventListener('click', () => switchProgressTab('progress-tab-setup'));
  domElements.progressTabHistory?.addEventListener('click', () => switchProgressTab('progress-tab-history'));
  domElements.progressSetupForm?.addEventListener('submit', handleSaveProgressPlan);
  domElements.endCurrentPlanButton?.addEventListener('click', handleEndCurrentPlan);
  domElements.progressSystemBackButton?.addEventListener('click', () => toggleMainView('dashboard'));
  domElements.hamburgerMenuButton?.addEventListener('click', toggleSideMenu);
  domElements.sideMenuDashboardLink?.addEventListener('click', () => toggleMainView('dashboard'));
  domElements.sideMenuProgressLink?.addEventListener('click', () => toggleMainView('progress'));
  document.addEventListener('click', (e) => { if (domElements.sideMenu.classList.contains('open') && !domElements.sideMenu.contains(e.target) && e.target !== domElements.hamburgerMenuButton && !domElements.hamburgerMenuButton.contains(e.target)) { closeSideMenu(); } });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!domElements.monthYearPickerModal.classList.contains('hidden')) closeMonthYearPicker();
      else if (!domElements.historyModal.classList.contains('hidden')) domElements.historyModal.classList.add('hidden');
      else if (!domElements.fullscreenContentModal.classList.contains('hidden')) hideFullscreenContent();
      else if (!domElements.deleteConfirmationModal.classList.contains('hidden')) hideDeleteConfirmation();
      else if (!domElements.addFolderModal.classList.contains('hidden')) closeAddFolderModal();
      else if (!domElements.categoryTabContextMenu.classList.contains('hidden')) hideCategoryContextMenu();
      else if (!domElements.folderOptionsContextMenu.classList.contains('hidden')) hideFolderContextMenu();
      else if (domElements.sideMenu.classList.contains('open')) closeSideMenu();
      else if (activeAddTaskForm) hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position);
      const activeEditingTask = document.querySelector('.task-item.editing');
      if (activeEditingTask) {
          const cancelButton = activeEditingTask.querySelector('.task-edit-cancel');
          if (cancelButton) cancelButton.click();
      }
      const activeFolderRename = document.querySelector('.folder-inline-rename-input:not([style*="display: none"])');
      if (activeFolderRename) activeFolderRename.blur();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeDOMReferences();
  loadAppData();
  renderTabs();
  renderAllCategorySections();
  updateAllProgress();
  renderCalendar();
  toggleMainView('dashboard'); // Start on dashboard
  setupEventListeners();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
      .catch(error => console.log('ServiceWorker registration failed: ', error));
  }
});
window.addEventListener('beforeunload', () => {
    // Optional: Any final cleanup or save operations before the page unloads
    // For example, if there's an unsaved note in an active notes folder.
    // However, most data is saved on interaction.
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const lastVisit = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
        const today = getTodayDateString();
        if (lastVisit && lastVisit !== today) {
            console.log("App became visible and date has changed. Reloading app data.");
            loadAppData(); // Reload data to handle day change if it occurred while tab was hidden
            renderTabs();
            renderAllCategorySections();
            updateAllProgress();
            renderCalendar();
        }
    }
});
MicroModal.init({
    onShow: modal => console.info(`${modal.id} is shown.`),
    onClose: modal => console.info(`${modal.id} is hidden.`),
    openTrigger: 'data-micromodal-trigger',
    closeTrigger: 'data-micromodal-close',
    openClass: 'is-open',
    disableScroll: true,
    disableFocus: false,
    awaitOpenAnimation: false,
    awaitCloseAnimation: false,
    debugMode: false
});

// Polyfill for Element.closest if needed for older browser support (though modern browsers have it)
if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
if (!Element.prototype.closest) { Element.prototype.closest = function(s) { let el = this; do { if (Element.prototype.matches.call(el, s)) return el; el = el.parentElement || el.parentNode; } while (el !== null && el.nodeType === 1); return null; }; }

// Simple drag-and-drop ghost image fix (optional, for better visual feedback)
document.addEventListener('dragstart', function(event) {
  if (event.target.classList.contains('task-item') || event.target.classList.contains('tab-button')) {
    var crt = event.target.cloneNode(true);
    crt.style.position = "absolute"; 
    crt.style.top = "-5000px"; 
    crt.style.left = "-5000px";
    crt.style.opacity = "0.7";
    crt.style.backgroundColor = "rgba(0,200,255,0.2)"; /* Light blueish tint */
    crt.style.padding = "10px";
    crt.style.borderRadius = "8px";
    document.body.appendChild(crt);
    event.dataTransfer.setDragImage(crt, 20, 20);
    // Remove cloned element after a short delay
    setTimeout(() => document.body.removeChild(crt), 10);
  }
});
