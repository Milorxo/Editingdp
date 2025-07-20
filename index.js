/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default categories and tasks if nothing in localStorage
const DEFAULT_CATEGORIES_CONFIG = [
  { id: 'routine', name: 'Routine', order: 0, deletable: false, type: 'standard', tasks: [
    "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
    "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
    "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
  ]},
  { id: 'health', name: 'Health', order: 1, deletable: false, type: 'standard', tasks: [
    "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
    "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
    "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
    "Shower consistently", "Social media < 1 hour"
  ]},
  { id: 'god', name: 'God', order: 2, deletable: false, type: 'standard', tasks: [
    "Self-Bible Study", "Thursday congregation", "Sunday congregation",
    "Be the person God expects"
  ]},
  { id: 'personal', name: 'Personal', order: 3, deletable: false, type: 'standard', tasks: ["Content creation"] },
];


// Keys
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_'; 
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; 
const APP_CONTENT_KEY = 'lifeTrackerAppContent_v1'; // Hierarchical content structure
const CHECKLIST_ITEM_STATE_KEY_PREFIX = 'lifeTrackerChecklistState_';
const SCHEDULED_TASK_COMPLETION_KEY_PREFIX = 'lifeTrackerScheduledTaskCompletion_';
const STORAGE_KEY_VIEW_MODE = 'lifeTrackerViewMode';
const STORAGE_KEY_THEME = 'lifeTrackerTheme';
const STORAGE_KEY_PROGRESS_TRACKERS = 'lifeTrackerProgressTrackers_v1';
const STORAGE_KEY_SCHEDULED_TASKS = 'lifeTrackerScheduledTasks_v1';

const SCHEDULED_TASK_COLORS = [
    { id: 'default', 'value': 'var(--text-primary)' },
    { id: 'red', 'value': '#E57373' },
    { id: 'green', 'value': '#81C784' },
    { id: 'blue', 'value': '#64B5F6' },
    { id: 'purple', 'value': '#BA68C8' },
    { id: 'yellow', 'value': '#FFD54F' }
];

let currentCategories = []; 
let appContent = {}; // Main data structure for all items (folders, notes, tasks)
let progressTrackers = [];
let scheduledTasks = [];

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let itemToDelete = null; 
let currentPath = []; // Breadcrumb path: [{ id, name, type }, ...]
let currentViewMode = 'medium'; // 'large', 'medium', 'detail'
let currentTheme = 'original'; // 'original', 'flip-clock', 'power-safe'
let isAddActionMenuOpen = false;
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;
let longPressTimer = null; 
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null;
let itemContextMenu = { element: null, target: null };
let midnightTimer = null;
let tempItemCreationData = null;
let currentActiveViewId = 'main'; // 'main', 'activity-dashboard', 'progress-management', 'scheduled-tasks'
let currentlyEditingNote = null; // { id, name, content }
let currentlyEditingTaskList = null; // The task list being managed in the modal
let isTaskListEditMode = false;
let draggedItemId = null; // ID of the item being dragged
let currentlyEditingProgressTrackerId = null;
let activeProgressDetailTracker = null;
let currentlyEditingScheduledTaskId = null;
let timeProgressInterval = null;

// DOM Elements
const domElements = {
  // Main Views
  appViewWrapper: null,
  progressManagementView: null,
  scheduledTasksView: null,
  
  // Hamburger Menu & Side Panel
  hamburgerButton: null,
  sidePanelMenu: null,
  sidePanelOverlay: null,
  menuMainView: null, 
  menuActivityDashboard: null,
  menuProgressManagement: null,
  menuScheduledTasks: null,
  menuAppearance: null,
  appearanceMenuItemContainer: null,
  themeDropdownContainer: null,
  
  mainContentWrapper: null, 
  dashboardColumn: null, 
  dashboardTabButton: null,

  mobileProgressLocation: null,

  tabs: null,
  tabContent: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategory: null,
  ctxDeleteCategory: null,
  
  dashboardSummaries: null,
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
  
  // Category Type Choice Modal
  chooseCategoryTypeModal: null,
  chooseCategoryTypeCloseButton: null,
  selectStandardCategoryButton: null,
  selectSpecialCategoryButton: null,
  
  // Name Entry Modal
  nameEntryModal: null,
  nameEntryTitle: null,
  nameEntryInput: null,
  nameEntryCloseButton: null,
  confirmNameEntryButton: null,
  cancelNameEntryButton: null,
  nameEntryActions: null,

  // Note Editor Modal
  noteEditorModal: null,
  noteEditorTitle: null,
  noteEditorArea: null,
  noteEditorCloseButton: null,
  noteAddImageButton: null,

  // Task List Modal
  taskListModal: null,
  taskListTitle: null,
  taskListCloseButton: null,
  taskListEditButton: null,
  taskListResetButton: null,
  checklistItemsList: null,
  addChecklistItemForm: null,
  addChecklistItemInput: null,

  // Progress Management
  progressManagementList: null,
  activeProgressList: null,
  archivedProgressList: null,
  addNewProgressButton: null,
  progressEditorModal: null,
  progressEditorCloseButton: null,
  progressEditorTitle: null,
  progressNameInput: null,
  progressTargetInput: null,
  progressTypeSelect: null,
  progressCustomDatesContainer: null,
  progressStartDate: null,
  progressEndDate: null,
  saveProgressButton: null,
  progressHistoryDetailModal: null,
  progressHistoryDetailCloseButton: null,
  progressHistoryDetailTitle: null,
  progressHistoryCalendarView: null,
  progressHistoryDailySummary: null,

  // Scheduled Tasks
  scheduledTasksListContainer: null,
  addNewScheduledTaskButton: null,
  scheduledTasksTodayContainer: null,
  scheduledTasksTodayList: null,
  scheduledTaskEditorModal: null,
  scheduledTaskEditorCloseButton: null,
  scheduledTaskEditorTitle: null,
  scheduledTaskEditorInput: null,
  scheduledTaskEditorDateInput: null,
  scheduledTaskRecurrenceSelect: null,
  scheduledTaskColorPicker: null,
  saveScheduledTaskButton: null,

  imageUploadInput: null,

  // Time vs Progress
  timeProgressButton: null,
  timeProgressModal: null,
  timeProgressCloseButton: null,
  timeProgressBar: null,
  timeProgressPercentage: null,
  timeProgressRemaining: null,
  modalTaskProgressBar: null,
  modalTaskProgressStats: null,
  timeAsMoney: null,
  progressAsMoney: null,
};

function getProgressFillColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120; // 0 = red, 120 = green
    return `hsl(${hue}, 100%, 50%)`;
}

function getProgressGradient(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const midPoint = Math.max(5, Math.min(95, p));
    const color = getProgressFillColor(p);
    return `linear-gradient(90deg, #ff6b6b 0%, #ffd700 ${midPoint}%, ${color} 100%)`;
}

/**
 * A helper function to consistently apply progress bar styling based on the current theme.
 * @param {HTMLElement} element The fill element of the progress bar.
 * @param {number} percentage The completion percentage (0-100).
 */
function applyProgressStyles(element, percentage) {
    if (!element) return;
    
    if (currentTheme === 'original') {
        element.style.backgroundImage = getProgressGradient(percentage);
        element.style.backgroundColor = ''; // Clear solid color fallback
    } else { // 'power-safe' and 'flip-clock' themes
        element.style.backgroundColor = getProgressFillColor(percentage);
        element.style.backgroundImage = 'none'; // Clear gradient
    }
}


function formatDateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return formatDateToString(new Date());
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

function animateNumber(element, toValue) {
    const fromValue = parseInt(element.dataset.currentValue || toValue, 10);
    
    // Don't animate if the value hasn't changed
    if (fromValue === toValue) {
        const currentText = `$${toValue.toLocaleString('en-US')}`;
        if (element.textContent !== currentText) {
             element.textContent = currentText;
        }
        return;
    }
    
    element.dataset.currentValue = toValue; // Store new value immediately to prevent re-animation
    
    const duration = 400; // ms
    const range = toValue - fromValue;
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(fromValue + range * progress);
        element.textContent = `$${currentValue.toLocaleString('en-US')}`;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}

function getChecklistItemStateStorageKey(date, checklistItemId) {
  return `${CHECKLIST_ITEM_STATE_KEY_PREFIX}${date}_${checklistItemId}`;
}

function getScheduledTaskCompletionKey(date, taskId) {
    return `${SCHEDULED_TASK_COMPLETION_KEY_PREFIX}${date}_${taskId}`;
}

function getScheduledTasksForDate(dateStringToMatch) {
    const targetDate = getNormalizedDate(new Date(dateStringToMatch + 'T00:00:00'));
    const matchingTasks = [];

    scheduledTasks.forEach(task => {
        const startDate = getNormalizedDate(new Date(task.date + 'T00:00:00'));

        if (startDate > targetDate) {
            return; // Task recurrence hasn't started yet.
        }

        if (task.recurrence === 'none' || !task.recurrence) {
            if (task.date === dateStringToMatch) {
                matchingTasks.push(task);
            }
        } else if (task.recurrence === 'weekly') {
            if (startDate.getDay() === targetDate.getDay()) {
                matchingTasks.push(task);
            }
        } else if (task.recurrence === 'monthly') {
            if (startDate.getDate() === targetDate.getDate()) {
                 matchingTasks.push(task);
            }
        }
    });
    return matchingTasks;
}


function getAllTaskListFiles(items) {
    let taskListFiles = [];
    for (const item of items) {
        if (item.type === 'tasklist') {
            taskListFiles.push(item);
        } else if (item.type === 'folder' && item.content) {
            taskListFiles = taskListFiles.concat(getAllTaskListFiles(item.content));
        }
    }
    return taskListFiles;
}

function updateTodaysHistoryEntry() {
    const today = getTodayDateString();
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;

    const progressStandardOnly = calculateProgressForDate(today, true, dailyTarget);
    
    const completedTasksTodayStruct = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id]) return; // Just check if content exists
      
      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      const completedTasksForCat = [];
      taskLists.forEach(taskList => {
          const completedInList = (taskList.content || []).filter(checklistItem => localStorage.getItem(getChecklistItemStateStorageKey(today, checklistItem.id)) === 'true');
          if (completedInList.length > 0) {
              completedTasksForCat.push(...completedInList.map(ci => ci.text));
          }
      });

      if (completedTasksForCat.length > 0) {
        completedTasksTodayStruct[cat.id] = { 
            name: cat.name, 
            tasks: completedTasksForCat, 
            type: cat.type // Pass type to history object
        };
      }
    });

    const todaysScheduledTasks = getScheduledTasksForDate(today);
    const completedScheduledTasks = todaysScheduledTasks
        .filter(t => localStorage.getItem(getScheduledTaskCompletionKey(today, t.id)) === 'true')
        .map(t => t.text);

    if (completedScheduledTasks.length > 0) {
        completedTasksTodayStruct.scheduled = {
            name: "Scheduled Tasks",
            tasks: completedScheduledTasks,
            type: 'special' // So it doesn't get a standard category color in history
        };
    }

    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today) || "";

    const historyEntry = {
        date: today,
        completedTaskStructure: completedTasksTodayStruct,
        userNote: note,
        pointsEarned: progressStandardOnly.pointsEarned,
        percentageCompleted: progressStandardOnly.percentage,
        totalTasksOnDate: progressStandardOnly.totalStandardTasks,
        dailyTargetPoints: dailyTarget
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
}

function loadUserCategories() {
    const storedCategories = localStorage.getItem(USER_CATEGORIES_KEY);
    let categories;
    if (storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
        } catch (e) {
            console.error("Error parsing stored categories:", e);
            categories = [];
        }
    } else {
        categories = [];
    }
    
    const defaultCats = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
        ...cat,
        deletable: cat.deletable !== undefined ? cat.deletable : true,
        type: cat.type || 'standard' 
    }));

    if (!categories || categories.length === 0) {
        return defaultCats;
    }

    return categories.map(cat => ({
        ...cat,
        deletable: cat.deletable !== undefined ? cat.deletable : true,
        type: cat.type || 'standard'
    }));
}

function saveUserCategories(categories) {
    localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order)));
}

function loadAppContent() {
    const storedContent = localStorage.getItem(APP_CONTENT_KEY);
    if (storedContent) {
        try {
            return JSON.parse(storedContent);
        } catch (e) {
            console.error("Error parsing stored app content:", e);
        }
    }
    return {};
}

function saveAppContent() {
    localStorage.setItem(APP_CONTENT_KEY, JSON.stringify(appContent));
}

function loadProgressTrackers() {
    const storedTrackers = localStorage.getItem(STORAGE_KEY_PROGRESS_TRACKERS);
    if (storedTrackers) {
        try {
            progressTrackers = JSON.parse(storedTrackers);
             // Migration: remove isDefault property
            let needsSave = false;
            progressTrackers.forEach(t => {
                if (t.isDefault !== undefined) {
                    delete t.isDefault;
                    needsSave = true;
                }
            });
            if (needsSave) saveProgressTrackers();
            return;
        } catch (e) {
            console.error("Error parsing progress trackers:", e);
        }
    }
    
    // If no trackers, create defaults
    progressTrackers = [
        { id: 'progress-daily', name: "Today's Progress", type: 'daily', targetPoints: 2700, order: 0 },
        { id: 'progress-weekly', name: "Weekly Progress", type: 'weekly', targetPoints: 20000, order: 1 }
    ];
    saveProgressTrackers();
}

function saveProgressTrackers() {
    localStorage.setItem(STORAGE_KEY_PROGRESS_TRACKERS, JSON.stringify(progressTrackers));
}

function loadScheduledTasks() {
    const storedTasks = localStorage.getItem(STORAGE_KEY_SCHEDULED_TASKS);
    if (storedTasks) {
        try {
            scheduledTasks = JSON.parse(storedTasks);
            // Migration: Ensure old tasks have a color property
            let needsSave = false;
            scheduledTasks.forEach(t => {
                if (!t.color) {
                    t.color = SCHEDULED_TASK_COLORS.find(c => c.id === 'default').value;
                    needsSave = true;
                }
            });
            if (needsSave) saveScheduledTasks();
            return;
        } catch (e) {
            console.error("Error parsing scheduled tasks:", e);
        }
    }
    scheduledTasks = [];
}

function saveScheduledTasks() {
    localStorage.setItem(STORAGE_KEY_SCHEDULED_TASKS, JSON.stringify(scheduledTasks));
}

function migrateTaskFilesToTaskList() {
    const MIGRATION_KEY = 'migration_tasklist_v1_complete';
    if (localStorage.getItem(MIGRATION_KEY)) {
        return;
    }

    let contentWasUpdated = false;
    console.log("Running migration: Consolidating Task Files into Task Lists...");

    function collectChecklistItems(items) {
        let collectedTasks = [];
        let remainingItems = [];

        for (const item of items) {
            if (item.type === 'task') { // This is the old, incorrect "Task File"
                if (item.content && item.content.length > 0) {
                     item.content.forEach(subTask => {
                        collectedTasks.push({ id: subTask.id || createUniqueId('checkitem'), text: subTask.text });
                     });
                } else {
                    collectedTasks.push({ id: item.id, text: item.name });
                }
                contentWasUpdated = true;
            } else if (item.type === 'folder' && item.content) {
                const nestedResult = collectChecklistItems(item.content);
                item.content = nestedResult.remainingItems;
                collectedTasks = [...collectedTasks, ...nestedResult.collectedTasks];
                remainingItems.push(item);
            } else {
                remainingItems.push(item);
            }
        }
        return { collectedTasks, remainingItems };
    }

    for (const categoryId in appContent) {
        if (!appContent.hasOwnProperty(categoryId) || !Array.isArray(appContent[categoryId])) continue;
        
        const { collectedTasks, remainingItems } = collectChecklistItems(appContent[categoryId]);

        if (collectedTasks.length > 0) {
            const newTaskList = {
                id: createUniqueId('tasklist'),
                type: 'tasklist',
                name: 'General Tasks',
                content: collectedTasks,
                order: 0,
            };
            appContent[categoryId] = [newTaskList, ...remainingItems];
            appContent[categoryId].forEach((item, index) => item.order = index);
        }
    }
    
    if (contentWasUpdated) {
        console.log("Migration complete. App content has been updated.");
        saveAppContent();
    }
    localStorage.setItem(MIGRATION_KEY, 'true');
}


function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    appContent = loadAppContent();
    loadProgressTrackers();
    loadScheduledTasks();

    let categoriesUpdated = false;
    let contentUpdated = false;

    if (!currentCategories || currentCategories.length === 0) {
        currentCategories = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
            id: cat.id, name: cat.name, order: cat.order, 
            deletable: cat.deletable !== undefined ? cat.deletable : true,
            type: cat.type || 'standard'
        }));
        categoriesUpdated = true;
    } else {
        currentCategories.forEach(cat => {
            if (!cat.type) { cat.type = 'standard'; categoriesUpdated = true; }
            if (cat.deletable === undefined) {
                const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === cat.id);
                cat.deletable = defaultConfigCat ? (defaultConfigCat.deletable !== undefined ? defaultConfigCat.deletable : true) : true;
                categoriesUpdated = true;
            }
        });
    }
    
    currentCategories.forEach(category => {
        if (!appContent[category.id]) {
            const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === category.id);
            if (defaultConfigCat && defaultConfigCat.tasks) {
                const newChecklistItems = defaultConfigCat.tasks.map((taskText, index) => ({
                    id: createUniqueId(`checkitem-${index}`),
                    text: taskText
                }));
                appContent[category.id] = [{
                    id: createUniqueId('tasklist'),
                    name: 'General Tasks',
                    type: 'tasklist',
                    order: 0,
                    content: newChecklistItems
                }];
            } else {
                appContent[category.id] = [];
            }
            contentUpdated = true;
        }
    });

    if (categoriesUpdated) saveUserCategories(currentCategories);
    if (contentUpdated) saveAppContent();
    
    migrateTaskFilesToTaskList();
}


function findItemAndParent(itemId, container = appContent) {
    for (const key in container) {
        const items = Array.isArray(container[key]) ? container[key] : (container[key].content || []);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.id === itemId) {
                const parent = container[key].content ? container[key] : { id: key, content: items };
                return { item, parent: parent, parentList: items };
            }
            if (item.type === 'folder' && item.content) {
                const found = findItemAndParent(itemId, { [item.id]: item });
                if (found) return found;
            }
        }
    }
    return null;
}

function getItemsForPath(path) {
    if (!path || path.length === 0) return [];
    let currentLevel = appContent[path[0].id] || [];
    if (path.length === 1) return currentLevel;

    for (let i = 1; i < path.length; i++) {
        const nextId = path[i].id;
        const parentFolder = currentLevel.find(item => item.id === nextId);
        if (parentFolder && parentFolder.type === 'folder') {
            currentLevel = parentFolder.content || [];
        } else {
            return []; // Path is invalid
        }
    }
    return currentLevel;
}


function saveChecklistItemStatus(checklistItemId, completed, dateString) {
  localStorage.setItem(getChecklistItemStateStorageKey(dateString, checklistItemId), completed.toString());
  if (dateString === getTodayDateString()) {
      updateTodaysHistoryEntry();
      updateAllProgress();
  }
}

function getCategoryById(categoryId) {
    return currentCategories.find(cat => cat.id === categoryId);
}
function getCategoryNameById(categoryId) {
    const category = getCategoryById(categoryId);
    return category ? category.name : "Unknown Category";
}

function archiveExpiredTrackers() {
    const today = getNormalizedDate(new Date());
    let wasChanged = false;

    progressTrackers.forEach(tracker => {
        if (tracker.type === 'custom' && tracker.endDate && !tracker.isArchived) {
            const endDate = getNormalizedDate(new Date(tracker.endDate));
            if (endDate < today) {
                console.log(`Archiving tracker "${tracker.name}" as its end date (${tracker.endDate}) has passed.`);
                tracker.isArchived = true;
                wasChanged = true;
            }
        }
    });

    if (wasChanged) {
        saveProgressTrackers();
    }
}

function saveDailyNote() {
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;
    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent);

    if (currentActiveDate === getTodayDateString()) {
        updateTodaysHistoryEntry();
    }

    if (domElements.saveNoteButton) {
        domElements.saveNoteButton.textContent = 'Note Saved!';
        setTimeout(() => {
            if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note';
        }, 1500);
    }
}

function loadCurrentDayNote() {
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate);
    domElements.dailyNoteInput.value = note || '';
}

function saveDayToHistory(dateToSave) {
    console.log(`[History] Saving full history for date: ${dateToSave}`);
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateToSave;
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
    
    const { pointsEarned, percentage, totalStandardTasks } = calculateProgressForDate(dateToSave, true, dailyTarget);
    
    const completedTasksHistory = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id]) return; // Only check for content existence

      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      const completedTasksForCat = [];
      taskLists.forEach(taskList => {
        const completedChecklistItems = (taskList.content || []).filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateToSave, ci.id)) === 'true');
        if(completedChecklistItems.length > 0) {
            completedTasksForCat.push(...completedChecklistItems.map(ci => ci.text));
        }
      });
      if(completedTasksForCat.length > 0) {
          completedTasksHistory[cat.id] = { name: cat.name, tasks: completedTasksForCat, type: cat.type };
      }
    });

    const scheduledTasksForDate = getScheduledTasksForDate(dateToSave);
    const completedScheduledTasks = scheduledTasksForDate
        .filter(t => localStorage.getItem(getScheduledTaskCompletionKey(dateToSave, t.id)) === 'true')
        .map(t => t.text);

    if (completedScheduledTasks.length > 0) {
        completedTasksHistory.scheduled = {
            name: "Scheduled Tasks",
            tasks: completedScheduledTasks,
            type: 'special'
        };
    }

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    
    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory,
        userNote: mainReflection, 
        pointsEarned: pointsEarned,
        percentageCompleted: percentage,
        totalTasksOnDate: totalStandardTasks,
        dailyTargetPoints: dailyTarget
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Clear the individual task states for the day that has been archived.
    console.log(`[History] Clearing individual task states for ${dateToSave}.`);
    currentCategories.forEach(cat => {
        if (!appContent[cat.id]) return;
        getAllTaskListFiles(appContent[cat.id]).forEach(taskList => {
            (taskList.content || []).forEach(checklistItem => {
                localStorage.removeItem(getChecklistItemStateStorageKey(dateToSave, checklistItemId));
            });
        });
    });
    // Clear scheduled task completion for the day
    scheduledTasks.forEach(t => {
        localStorage.removeItem(getScheduledTaskCompletionKey(dateToSave, t.id));
    });
    
    console.log(`[History] Finalized and states cleared for ${dateToSave}.`);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    console.log(`Clearing task states for previous month: ${lastProcessedMonthYear}`);
  }
  localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear);
}

function loadAppData() {
  seedInitialDataIfNeeded(); 
  loadScheduledTasks();
  
  const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
  if (savedViewMode && ['large', 'medium', 'detail'].includes(savedViewMode)) {
      currentViewMode = savedViewMode;
  }

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();
  console.log(`[App Load] Last visit: ${lastVisitDateStr}, Current date: ${currentDateStr}`);

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`[App Load] New day detected. Archiving data for ${lastVisitDateStr}.`);
    try {
        saveDayToHistory(lastVisitDateStr);
    } catch (e) {
        console.error(`[Critical Error] Failed to save history for ${lastVisitDateStr}.`, e);
        // We continue, as failing to save yesterday shouldn't block today.
    }
  } else if (!lastVisitDateStr) {
    console.log("[App Load] First visit or no last visit date found. Initializing for today.");
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  // Ensure today has a history entry if it's a new day or the entry is missing
  if ((lastVisitDateStr && lastVisitDateStr !== currentDateStr) || !localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentDateStr)) {
    console.log("[App Load] Creating or updating today's history entry.");
    updateTodaysHistoryEntry();
  }

  checkAndClearOldMonthlyData();
  archiveExpiredTrackers();
  loadCurrentDayNote(); 
  renderTodaysScheduledTasks();
  
  calendarDisplayDate = new Date(); 
  calendarDisplayDate.setDate(1); 
  calendarDisplayDate.setHours(0,0,0,0); 
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
  scheduleMidnightTask();
}

function handleMidnightReset() {
    console.log("Midnight reset triggered. Saving previous day's state and reloading for a fresh start.");
    const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); 
    
    if (dateThatJustEnded) {
        try {
            saveDayToHistory(dateThatJustEnded);
        } catch (e) {
            console.error('[Midnight Reset] Failed to save history on reset.', e);
        }
    }

    // Force a full reload to ensure the app initializes cleanly for the new day.
    // This is the most robust way to prevent state corruption from a background task.
    window.location.reload();
}

function scheduleMidnightTask() {
    if (midnightTimer) clearTimeout(midnightTimer);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0); 
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    console.log(`Next midnight reset scheduled in ${msUntilMidnight / 1000 / 60} minutes.`);
    midnightTimer = setTimeout(handleMidnightReset, msUntilMidnight);
}

function showDeleteConfirmation(type, id, message, nameForConfirmation = '') {
    let finalMessage = message;

    if (type === 'progressTracker') {
         const tracker = progressTrackers.find(t => t.id === id);
         finalMessage = `Are you sure you want to delete the tracker "${tracker.name}"? This action cannot be undone.`
         if (tracker && (tracker.type === 'daily' || tracker.type === 'weekly')) {
            finalMessage = `Are you sure you want to delete the "${tracker.name}" tracker? This may affect historical data and progress calculations. This action cannot be undone.`;
         }
    }
    
    if (type === 'progressTracker' || type === 'scheduledTask') {
         itemToDelete = { type, id };
    } else {
        const found = findItemAndParent(id);
        const parentId = found?.parent?.id;
        itemToDelete = { type, id, nameForConfirmation, parentId };
    }
    
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('opening');
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = finalMessage || `Are you sure you want to delete this? This action cannot be undone.`;
        if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm Deletion`;
        domElements.deleteConfirmationModal.classList.remove('hidden');
        if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.focus();
    }
}

function confirmDeletion() {
    if (!itemToDelete) return;
    
    const animateItemRemoval = (itemId) => {
        const itemEl = document.querySelector(`.item[data-item-id="${itemId}"]`);
        if (itemEl) {
            itemEl.classList.add('leaving');
            itemEl.addEventListener('animationend', () => itemEl.remove());
        } else {
             renderCategorySectionContent(currentPath[0].id);
        }
    };

    if (itemToDelete.type === 'category') {
        const categoryId = itemToDelete.id;
        const category = currentCategories.find(c => c.id === categoryId);
        if (category && category.deletable === false) {
            alert(`Category "${category.name}" is a default category and cannot be deleted.`);
        } else {
            currentCategories = currentCategories.filter(cat => cat.id !== categoryId);
            saveUserCategories(currentCategories);
            delete appContent[categoryId]; 
            saveAppContent();
            
            document.getElementById(`tab-button-${categoryId}`)?.remove();
            document.getElementById(`category-section-${categoryId}`)?.remove();
            if (activeTabId === categoryId) switchTab('dashboard');
        }
    } else if (itemToDelete.type === 'progressTracker') {
        progressTrackers = progressTrackers.filter(t => t.id !== itemToDelete.id);
        saveProgressTrackers();
        renderProgressManagementList();
        renderMainProgressBars();
    } else if (itemToDelete.type === 'scheduledTask') {
        scheduledTasks = scheduledTasks.filter(t => t.id !== itemToDelete.id);
        saveScheduledTasks();
        renderScheduledTasksManagementList();
        renderCalendar();
        renderTodaysScheduledTasks();
    } else { // Item is a folder, note, or tasklist
        const found = findItemAndParent(itemToDelete.id);
        if (found) {
            found.parentList.splice(found.parentList.indexOf(found.item), 1);
            saveAppContent();
            animateItemRemoval(itemToDelete.id);
        }
    }
    
    updateTodaysHistoryEntry();
    updateAllProgress();
    hideDeleteConfirmation();
}

function hideDeleteConfirmation() {
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('hidden');
        domElements.deleteConfirmationModal.classList.remove('opening');
    }
    itemToDelete = null;
}

// --- SCHEDULED TASKS FUNCTIONS ---

function openScheduledTaskEditor(taskId = null) {
    currentlyEditingScheduledTaskId = taskId;
    
    domElements.scheduledTaskColorPicker.innerHTML = '';
    SCHEDULED_TASK_COLORS.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-option';
        button.dataset.color = color.value;
        button.style.backgroundColor = color.value;
        button.setAttribute('aria-label', color.id);
        domElements.scheduledTaskColorPicker.appendChild(button);
    });

    if (taskId) {
        const task = scheduledTasks.find(t => t.id === taskId);
        if (task) {
            domElements.scheduledTaskEditorInput.value = task.text;
            domElements.scheduledTaskEditorDateInput.value = task.date;
            domElements.scheduledTaskRecurrenceSelect.value = task.recurrence || 'none';
            domElements.scheduledTaskEditorTitle.textContent = 'Edit Scheduled Task';
            const selectedColorButton = domElements.scheduledTaskColorPicker.querySelector(`[data-color="${task.color}"]`);
            if(selectedColorButton) selectedColorButton.classList.add('selected');
        }
    } else {
        domElements.scheduledTaskEditorInput.value = '';
        domElements.scheduledTaskEditorDateInput.value = getTodayDateString();
        domElements.scheduledTaskRecurrenceSelect.value = 'none';
        domElements.scheduledTaskEditorTitle.textContent = 'New Scheduled Task';
        domElements.scheduledTaskColorPicker.querySelector('[data-color="var(--text-primary)"]').classList.add('selected');
    }

    domElements.scheduledTaskEditorModal.classList.add('opening');
    domElements.scheduledTaskEditorModal.classList.remove('hidden');
    domElements.scheduledTaskEditorInput.focus();
}

function closeScheduledTaskEditor() {
    domElements.scheduledTaskEditorModal.classList.add('hidden');
    domElements.scheduledTaskEditorModal.classList.remove('opening');
    currentlyEditingScheduledTaskId = null;
}

function saveScheduledTask() {
    const text = domElements.scheduledTaskEditorInput.value.trim();
    if (!text) {
        alert('Task description cannot be empty.');
        return;
    }
    const date = domElements.scheduledTaskEditorDateInput.value;
    const recurrence = domElements.scheduledTaskRecurrenceSelect.value;
    const selectedColorEl = domElements.scheduledTaskColorPicker.querySelector('.selected');
    const color = selectedColorEl ? selectedColorEl.dataset.color : SCHEDULED_TASK_COLORS.find(c => c.id === 'default').value;
    
    if (currentlyEditingScheduledTaskId) {
        const task = scheduledTasks.find(t => t.id === currentlyEditingScheduledTaskId);
        if (task) {
            task.text = text;
            task.date = date;
            task.recurrence = recurrence;
            task.color = color;
        }
    } else {
        const newTask = {
            id: createUniqueId('scheduletask'),
            text,
            date,
            recurrence,
            color
        };
        scheduledTasks.push(newTask);
    }
    saveScheduledTasks();
    
    if (currentActiveViewId === 'scheduled-tasks') {
        renderScheduledTasksManagementList();
    }
    renderCalendar(); 
    renderTodaysScheduledTasks(); 
    updateTodaysHistoryEntry();
    updateAllProgress();

    closeScheduledTaskEditor();
}

function renderTodaysScheduledTasks() {
    if (!domElements.scheduledTasksTodayList || !domElements.scheduledTasksTodayContainer) return;
    
    const today = getTodayDateString();
    const todaysTasks = getScheduledTasksForDate(today);

    if (todaysTasks.length === 0) {
        domElements.scheduledTasksTodayContainer.classList.add('hidden');
        return;
    }

    domElements.scheduledTasksTodayContainer.classList.remove('hidden');
    domElements.scheduledTasksTodayList.innerHTML = '';

    todaysTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.dataset.scheduledTaskId = task.id;
        li.style.borderLeftColor = task.color || 'var(--panel-border)';
        
        const isCompleted = localStorage.getItem(getScheduledTaskCompletionKey(today, task.id)) === 'true';
        if(isCompleted) li.classList.add('completed');

        li.innerHTML = `
            <input type="checkbox" class="checklist-item-checkbox" ${isCompleted ? 'checked' : ''}>
            <span class="checklist-item-text">${task.text}</span>
        `;
        
        li.addEventListener('click', (e) => {
             if (e.target.type === 'checkbox') return;
             const checkbox = li.querySelector('.checklist-item-checkbox');
             checkbox.checked = !checkbox.checked;
             const changeEvent = new Event('change', { bubbles: true });
             checkbox.dispatchEvent(changeEvent);
        });

        li.querySelector('.checklist-item-checkbox').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem(getScheduledTaskCompletionKey(today, task.id), isChecked);

            updateTodaysHistoryEntry();
            updateAllProgress();
            li.classList.toggle('completed', isChecked);
            li.classList.add('animate-task-toggle');
            setTimeout(() => li.classList.remove('animate-task-toggle'), 300);
        });

        domElements.scheduledTasksTodayList.appendChild(li);
    });
}

function renderScheduledTasksManagementList() {
    if (!domElements.scheduledTasksListContainer) return;
    domElements.scheduledTasksListContainer.innerHTML = '';

    if (scheduledTasks.length === 0) {
        domElements.scheduledTasksListContainer.innerHTML = '<p class="empty-tasks-message">No scheduled tasks yet. Add one using the button below.</p>';
        return;
    }

    const tasksByDate = scheduledTasks.reduce((acc, task) => {
        const date = task.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach(date => {
        const dateGroupDiv = document.createElement('div');
        dateGroupDiv.className = 'scheduled-task-date-group';

        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        dateGroupDiv.innerHTML = `<h2 class="scheduled-task-date-header">${formattedDate}</h2>`;

        tasksByDate[date].forEach(task => {
            const itemEl = document.createElement('div');
            itemEl.className = 'scheduled-task-item';
            
            itemEl.innerHTML = `
                <p>${task.text} ${task.recurrence && task.recurrence !== 'none' ? `(Repeats ${task.recurrence})` : ''}</p>
                <div class="scheduled-task-item-actions">
                    <button class="icon-button item-rename" title="Edit"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                    <button class="icon-button item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
                </div>
            `;

            itemEl.querySelector('.item-rename').addEventListener('click', () => openScheduledTaskEditor(task.id));
            itemEl.querySelector('.item-delete').addEventListener('click', () => {
                showDeleteConfirmation('scheduledTask', task.id, `Are you sure you want to delete the scheduled task: "${task.text}"? This will remove all future recurrences as well.`);
            });
            
            dateGroupDiv.appendChild(itemEl);
        });

        domElements.scheduledTasksListContainer.appendChild(dateGroupDiv);
    });
}


function renderCategorySectionContent(categoryId) {
    const sectionElement = document.getElementById(`category-section-${categoryId}`);
    if (!sectionElement) return;

    const contentArea = sectionElement.querySelector('.category-content-area');
    const header = sectionElement.querySelector('.category-header');
    if (!contentArea || !header) return;

    contentArea.innerHTML = ''; 
    header.querySelector('.breadcrumbs-container').innerHTML = '';
    header.querySelector('.category-header-right').innerHTML = '';
    
    const backButton = header.querySelector('.category-back-button');
    backButton.onclick = () => {
        if (currentPath.length > 1) {
            currentPath.pop();
            renderCategorySectionContent(currentPath[0].id);
        } else {
            switchTab('dashboard');
        }
    };

    renderBreadcrumbs(header.querySelector('.breadcrumbs-container'));
    renderCategoryHeaderControls(header.querySelector('.category-header-right'));
    
    const itemsToRender = getItemsForPath(currentPath);
    renderContentGrid(itemsToRender, contentArea);
}

function renderBreadcrumbs(container) {
    container.innerHTML = '';
    const pathToShow = currentPath.slice(1);

    pathToShow.forEach((part, index) => {
        const partEl = document.createElement(index === pathToShow.length - 1 ? 'span' : 'button');
        partEl.className = 'breadcrumb-part';
        partEl.textContent = part.name;
        if (index < pathToShow.length - 1) {
            partEl.onclick = () => {
                currentPath = currentPath.slice(0, index + 2);
                renderCategorySectionContent(currentPath[0].id);
            };
        }
        container.appendChild(partEl);

        if (index < pathToShow.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '>';
            container.appendChild(separator);
        }
    });
}

function renderCategoryHeaderControls(container) {
    container.innerHTML = '';
    
    const viewModeContainer = document.createElement('div');
    viewModeContainer.className = 'view-mode-container';
    
    const viewModeButton = document.createElement('button');
    viewModeButton.className = 'icon-button view-mode-button';
    viewModeButton.title = 'Change View';
    viewModeButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h17v-6H4v6zM4 5v6h17V5H4z"></path></svg>`;
    viewModeContainer.appendChild(viewModeButton);

    const viewOptions = document.createElement('div');
    viewOptions.className = 'view-mode-options';
    viewOptions.innerHTML = `
        <button class="icon-button ${currentViewMode === 'large' ? 'active' : ''}" data-view="large" title="Large View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 13h8v-8h-8v8z"></path></svg></button>
        <button class="icon-button ${currentViewMode === 'medium' ? 'active' : ''}" data-view="medium" title="Medium View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v7H4V4zm10 0h7v7h-7V4zM4 14h7v7H4v-7zm10 0h7v7h-7v-7z"></path></svg></button>
        <button class="icon-button ${currentViewMode === 'detail' ? 'active' : ''}" data-view="detail" title="Detail View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"></path></svg></button>
    `;
    viewModeContainer.appendChild(viewOptions);

    viewModeButton.onclick = (e) => {
        e.stopPropagation();
        viewModeContainer.classList.toggle('open');
    };
    viewOptions.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            currentViewMode = btn.dataset.view;
            localStorage.setItem(STORAGE_KEY_VIEW_MODE, currentViewMode);
            renderCategorySectionContent(currentPath[0].id);
        };
    });
    
    container.appendChild(viewModeContainer);

    const addActionContainer = document.createElement('div');
    addActionContainer.className = 'add-action-container';
    
    const addActionButton = document.createElement('button');
    addActionButton.className = 'icon-button add-action-button';
    addActionButton.title = 'Add New Item';
    addActionButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`;
    addActionContainer.appendChild(addActionButton);

    const addOptions = document.createElement('div');
    addOptions.className = 'add-action-options';
    addOptions.innerHTML = `
        <button class="icon-button" data-type="folder" title="Add Folder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002 2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg></button>
        <button class="icon-button" data-type="note" title="Add Note File"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg></button>
        <button class="icon-button" data-type="tasklist" title="Add Task List"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9.17 16.17L6 13l1.41-1.41L9.17 13.34l3.42-3.41L14 11.34l-4.83 4.83z"></path></svg></button>
    `;
    addActionContainer.appendChild(addOptions);
    
    addActionButton.onclick = (e) => {
        e.stopPropagation();
        isAddActionMenuOpen = !isAddActionMenuOpen;
        addActionContainer.classList.toggle('open', isAddActionMenuOpen);
    };
    addOptions.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            isAddActionMenuOpen = false;
            addActionContainer.classList.remove('open');
            const type = btn.dataset.type;
            const parentList = getItemsForPath(currentPath);
            const defaultName = generateDefaultName(type, parentList);
            openNameEntryModal('create', type, null, defaultName);
        };
    });
    
    container.appendChild(addActionContainer);
}


function renderContentGrid(items, container) {
    const grid = document.createElement('div');
    grid.className = `items-grid view-mode-${currentViewMode}`;

    if (items.length === 0) {
        grid.innerHTML = `<p class="empty-tasks-message">This space is empty. Add a new item!</p>`;
    } else {
        items.sort((a,b) => a.order - b.order).forEach(item => {
            const itemEl = renderItem(item);
            itemEl.classList.add('entering');
            grid.appendChild(itemEl);
        });
    }
    container.appendChild(grid);
}

function renderItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = `item type-${item.type}`;
    itemEl.dataset.itemId = item.id;
    itemEl.draggable = true;
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'item-icon';
    if (item.type === 'folder') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002 2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>`;
    } else if (item.type === 'note') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`;
    } else if (item.type === 'tasklist') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9.17 16.17L6 13l1.41-1.41L9.17 13.34l3.42-3.41L14 11.34l-4.83 4.83z"></path></svg>`;
        itemEl.classList.add('type-task'); // Reuse styling for task icon color
    }
    itemEl.appendChild(iconDiv);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = item.name;
    itemEl.appendChild(nameSpan);

    if (currentViewMode === 'detail' || item.type === 'folder' || item.type === 'tasklist') {
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'item-details';
        if(item.type === 'folder') {
            detailsSpan.textContent = `${(item.content || []).length} items`;
        } else if (item.type === 'tasklist') {
            const today = getTodayDateString();
            const checklistItems = item.content || [];
            const completed = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
            detailsSpan.textContent = `${completed} / ${checklistItems.length} done`;
            if(checklistItems.length > 0 && completed === checklistItems.length) {
                itemEl.classList.add('completed');
            }
        }
        itemEl.appendChild(detailsSpan);
    }
    
    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'item-actions';
    itemEl.appendChild(actionsDiv);
    
    if (currentViewMode === 'detail') {
        const moreButton = document.createElement('button');
        moreButton.className = 'icon-button item-more-options';
        moreButton.title = 'More options';
        moreButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>`;
        moreButton.onclick = (e) => {
            e.stopPropagation();
            showItemContextMenu(e.currentTarget, item);
        };
        actionsDiv.appendChild(moreButton);
    } else {
        actionsDiv.innerHTML = `
            <button class="icon-button item-rename" title="Rename"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
            <button class="icon-button item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
        `;
        actionsDiv.querySelector('.item-rename').onclick = (e) => {
            e.stopPropagation();
            openNameEntryModal('rename', item.type, item);
        };
        actionsDiv.querySelector('.item-delete').onclick = (e) => {
            e.stopPropagation();
            showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}? This action cannot be undone.`);
        };
    }
    
    itemEl.addEventListener('click', () => {
        hideItemContextMenu();
        if (item.type === 'folder') {
            currentPath.push({ id: item.id, name: item.name, type: 'folder' });
            renderCategorySectionContent(currentPath[0].id);
        } else if (item.type === 'tasklist') {
            openTaskListModal(item);
        } else if (item.type === 'note') {
            openNoteEditorModal(item);
        }
    });

    itemEl.addEventListener('dragstart', (e) => handleDragStart(e, item));
    if (item.type === 'folder') {
        itemEl.addEventListener('dragover', handleDragOver);
        itemEl.addEventListener('dragleave', handleDragLeave);
        itemEl.addEventListener('drop', (e) => handleDrop(e, item));
    }
    
    return itemEl;
}

function openNoteEditorModal(noteItem) {
    if (!domElements.noteEditorModal || !domElements.noteEditorTitle || !domElements.noteEditorArea) return;
    currentlyEditingNote = noteItem;
    domElements.noteEditorModal.classList.add('opening');
    domElements.noteEditorTitle.textContent = noteItem.name;
    domElements.noteEditorArea.innerHTML = noteItem.content || '';
    domElements.noteEditorModal.classList.remove('hidden');
    domElements.noteEditorArea.focus();
}

function closeNoteEditorModal() {
    if (!domElements.noteEditorModal || !currentlyEditingNote) return;
    const itemInfo = findItemAndParent(currentlyEditingNote.id);
    if(itemInfo) {
        itemInfo.item.content = domElements.noteEditorArea.innerHTML;
        saveAppContent();
    }
    domElements.noteEditorModal.classList.add('hidden');
    domElements.noteEditorModal.classList.remove('opening');
    currentlyEditingNote = null;
    renderCategorySectionContent(currentPath[0].id); // Re-render to show any changes
}

function handleAddImageToNote() {
    domElements.imageUploadInput.click();
}

function processAndInsertImage(file) {
    if (!file.type.startsWith('image/')) return;

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            const wrapper = document.createElement('div');
            wrapper.className = 'note-image-wrapper';
            wrapper.contentEditable = 'false';

            const imageEl = document.createElement('img');
            imageEl.src = dataUrl;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-image-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => wrapper.remove();

            wrapper.appendChild(imageEl);
            wrapper.appendChild(deleteBtn);

            domElements.noteEditorArea.focus();
            const selection = window.getSelection();
            if (selection.getRangeAt && selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(wrapper);
            } else {
                 domElements.noteEditorArea.appendChild(wrapper);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateTasklistItemView(item) {
    const itemEl = document.querySelector(`.item[data-item-id="${item.id}"]`);
    if (!itemEl) return;

    const detailsSpan = itemEl.querySelector('.item-details');
    if (detailsSpan && item.type === 'tasklist') {
        const today = getTodayDateString();
        const checklistItems = item.content || [];
        const completed = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        detailsSpan.textContent = `${completed} / ${checklistItems.length} done`;
        
        const isCompleted = checklistItems.length > 0 && completed === checklistItems.length;
        itemEl.classList.toggle('completed', isCompleted);
    }
}

function openTaskListModal(taskListFile) {
    if (!domElements.taskListModal) return;
    currentlyEditingTaskList = taskListFile;
    domElements.taskListModal.classList.add('opening');
    domElements.taskListTitle.textContent = taskListFile.name;
    isTaskListEditMode = false;
    renderChecklist();
    domElements.taskListModal.classList.remove('hidden');
    domElements.addChecklistItemInput.focus();
}

function closeTaskListModal() {
    if (!domElements.taskListModal) return;
    saveAppContent();
    domElements.taskListModal.classList.add('hidden');
    domElements.taskListModal.classList.remove('opening');

    if (currentlyEditingTaskList) {
        updateTasklistItemView(currentlyEditingTaskList);
    }

    currentlyEditingTaskList = null;
    isTaskListEditMode = false;
    updateAllProgress();
}

function toggleTaskListEditMode() {
    isTaskListEditMode = !isTaskListEditMode;
    domElements.checklistItemsList.classList.toggle('edit-mode', isTaskListEditMode);
    domElements.addChecklistItemForm.classList.toggle('hidden', !isTaskListEditMode);
    
    const editIcon = domElements.taskListEditButton.querySelector('.edit-icon');
    const doneIcon = domElements.taskListEditButton.querySelector('.done-icon');
    editIcon.classList.toggle('hidden', isTaskListEditMode);
    doneIcon.classList.toggle('hidden', !isTaskListEditMode);

    renderChecklist(); // Re-render to apply disabled state to checkboxes
}

function handleResetTasks() {
    if (!currentlyEditingTaskList) return;
    if (confirm("Are you sure you want to uncheck all completed tasks in this list for today? This action cannot be undone.")) {
        const today = getTodayDateString();
        (currentlyEditingTaskList.content || []).forEach(item => {
            saveChecklistItemStatus(item.id, false, today);
        });
        renderChecklist();
    }
}

function renderChecklist() {
    if (!currentlyEditingTaskList || !domElements.checklistItemsList) return;
    domElements.checklistItemsList.innerHTML = '';
    const today = getTodayDateString();

    (currentlyEditingTaskList.content || []).forEach(checklistItem => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.dataset.checklistItemId = checklistItem.id;

        const isCompleted = localStorage.getItem(getChecklistItemStateStorageKey(today, checklistItem.id)) === 'true';
        li.classList.toggle('completed', isCompleted);

        li.innerHTML = `
            <input type="checkbox" class="checklist-item-checkbox" ${isCompleted ? 'checked' : ''} ${isTaskListEditMode ? 'disabled' : ''}>
            <span class="checklist-item-text">${checklistItem.text}</span>
            <div class="checklist-item-actions">
                <button class="icon-button checklist-item-rename" title="Rename"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                <button class="icon-button checklist-item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
            </div>
        `;
        
        li.addEventListener('click', (e) => {
            if (isTaskListEditMode || e.target.closest('.checklist-item-actions') || e.target.type === 'checkbox') return;
            const checkbox = li.querySelector('.checklist-item-checkbox');
            checkbox.checked = !checkbox.checked;
            const changeEvent = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(changeEvent);
        });

        li.querySelector('.checklist-item-checkbox').addEventListener('change', (e) => {
            saveChecklistItemStatus(checklistItem.id, e.target.checked, today);
            li.classList.toggle('completed', e.target.checked);
            li.classList.add('animate-task-toggle');
            setTimeout(() => li.classList.remove('animate-task-toggle'), 300);
        });

        li.querySelector('.checklist-item-rename').addEventListener('click', () => {
            const newText = prompt('Enter new task text:', checklistItem.text);
            if (newText && newText.trim() !== '' && newText.trim() !== checklistItem.text) {
                checklistItem.text = newText.trim();
                li.querySelector('.checklist-item-text').textContent = checklistItem.text;
                saveAppContent();
            }
        });

        li.querySelector('.checklist-item-delete').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                currentlyEditingTaskList.content = currentlyEditingTaskList.content.filter(ci => ci.id !== checklistItem.id);
                renderChecklist();
                saveAppContent();
                updateCategoryTabBadges();
            }
        });

        domElements.checklistItemsList.appendChild(li);
    });
    
    domElements.checklistItemsList.classList.toggle('edit-mode', isTaskListEditMode);
}

function handleAddChecklistItem(e) {
    e.preventDefault();
    if (!currentlyEditingTaskList || !domElements.addChecklistItemInput) return;
    const text = domElements.addChecklistItemInput.value.trim();
    if (text) {
        const newItem = {
            id: createUniqueId('checkitem'),
            text: text,
        };
        if (!currentlyEditingTaskList.content) {
            currentlyEditingTaskList.content = [];
        }
        currentlyEditingTaskList.content.push(newItem);
        saveAppContent();
        renderChecklist();
        updateCategoryTabBadges();
        domElements.addChecklistItemInput.value = '';
    }
}


function renderTabs() {
    if (!domElements.tabs) return;
    domElements.tabs.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove());
    const addCatButton = domElements.addCategoryButton;

    currentCategories.sort((a, b) => a.order - b.order).forEach(category => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.id = `tab-button-${category.id}`;
        tabButton.dataset.categoryId = category.id;
        
        // Create a text node for the name to avoid issues when appending other elements
        const textNode = document.createTextNode(category.name);
        tabButton.appendChild(textNode);
        
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-selected', activeTabId === category.id ? 'true' : 'false');
        
        if (category.type === 'special') {
            tabButton.classList.add('special-category-tab');
        }
        if (activeTabId === category.id) {
            tabButton.classList.add('active');
        }

        const optionsIcon = document.createElement('div');
        optionsIcon.className = 'tab-options-icon';
        optionsIcon.setAttribute('aria-label', `Options for ${category.name}`);
        optionsIcon.setAttribute('role', 'button');
        optionsIcon.tabIndex = 0; 
        optionsIcon.innerHTML = `<span></span><span></span><span></span>`;
        tabButton.appendChild(optionsIcon);
        
        optionsIcon.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showCategoryContextMenu(category.id, tabButton); 
        });
        optionsIcon.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); }
        });

        let touchStartEvent = null; 

        const clearTabLongPressState = () => {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            tabButton.removeEventListener('touchmove', handleTabTouchMove);
            tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            touchStartEvent = null;
        };

        const handleTabTouchMove = () => { clearTabLongPressState(); };
        const handleTabTouchEndOrCancel = () => { clearTabLongPressState(); };
        
        tabButton.addEventListener('touchstart', (e) => {
            clearTabLongPressState(); touchStartEvent = e; 
            tabButton.addEventListener('touchmove', handleTabTouchMove);
            tabButton.addEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            longPressTimer = setTimeout(() => {
                if (touchStartEvent) { touchStartEvent.preventDefault(); }
                optionsIcon.classList.add('visible');
                showCategoryContextMenu(category.id, tabButton);
                longPressTimer = null; 
                tabButton.removeEventListener('touchmove', handleTabTouchMove);
                tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
                tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            }, LONG_PRESS_DURATION);
        });

        tabButton.addEventListener('click', (e) => {
            switchTab(category.id);
        });
        if (addCatButton) {
            domElements.tabs.insertBefore(tabButton, addCatButton);
        } else {
            domElements.tabs.appendChild(tabButton);
        }
    });
    updateCategoryTabBadges();
}

function updateCategoryTabBadges() {
    if (!domElements.tabs) return;
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    currentCategories.forEach(category => {
        const tabButton = domElements.tabs.querySelector(`#tab-button-${category.id}`);
        if (!tabButton) return;

        // Remove existing badge first
        const existingBadge = tabButton.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        
        let totalTasks = 0;
        let completedTasks = 0;
        allCategoryTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalTasks += checklistItems.length;
            completedTasks += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        });

        const incompleteTasks = totalTasks - completedTasks;

        if (incompleteTasks > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = incompleteTasks;
            tabButton.appendChild(badge);
        }
    });
}

function switchTab(categoryIdToActivate) {
    activeTabId = categoryIdToActivate;
    hideCategoryContextMenu();

    if (domElements.tabs) {
        domElements.tabs.querySelectorAll('.tab-button').forEach(button => {
            const isCurrentActive = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button');
            button.classList.toggle('active', isCurrentActive);
            button.setAttribute('aria-selected', isCurrentActive.toString());
        });
    }

    if (domElements.tabContent) {
        domElements.tabContent.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard');
        domElements.tabContent.querySelectorAll('section[role="tabpanel"]').forEach(section => {
            const isCurrentActiveSection = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content');
            section.classList.toggle('hidden', !isCurrentActiveSection);
        });
    }
    
    if (activeTabId !== 'dashboard') {
        const category = getCategoryById(activeTabId);
        currentPath = [{ id: activeTabId, name: category.name, type: 'category' }];
        renderCategorySectionContent(activeTabId); 
    } else {
        currentPath = [];
    }
}

function switchView(viewId) {
    currentActiveViewId = viewId;

    const isMainDisplay = viewId === 'main';
    const isActivityDashboard = viewId === 'activity-dashboard';
    const isProgressManagement = viewId === 'progress-management';
    const isScheduledTasks = viewId === 'scheduled-tasks';

    // Toggle visibility of the main view containers
    const isAppViewContainerActive = isMainDisplay || isActivityDashboard;
    domElements.appViewWrapper.classList.toggle('hidden', !isAppViewContainerActive);
    domElements.progressManagementView.classList.toggle('hidden', !isProgressManagement);
    domElements.scheduledTasksView.classList.toggle('hidden', !isScheduledTasks);

    // If the main app container is active, decide which panel to show inside it.
    if (isAppViewContainerActive) {
        domElements.mainContentWrapper.classList.toggle('hidden', !isMainDisplay);
        domElements.dashboardColumn.classList.toggle('hidden', !isActivityDashboard);
    }

    // Update active menu item in side panel
    document.querySelectorAll('.side-panel-item').forEach(item => item.classList.remove('active-menu-item'));
    const activeMenuItem = document.getElementById(`menu-${viewId}`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active-menu-item');
    }

    // Call data update functions for the newly active view
    if (isProgressManagement) {
        renderProgressManagementList();
    } else if (isScheduledTasks) {
        renderScheduledTasksManagementList();
    } else if (isActivityDashboard) {
        updateDashboardSummaries();
    }

    closeSidePanel();
}


function calculateProgressForDate(dateString, standardOnlyStats = false, targetPoints) {
  let completedCount = 0;
  let totalTasksForCalc = 0;
  let totalStandardTasksCount = 0;

  currentCategories.forEach(category => {
    const isStandardCategory = category.type === 'standard';
    if (!appContent[category.id]) return;
    const allCategoryTaskLists = getAllTaskListFiles(appContent[category.id]);

    allCategoryTaskLists.forEach(taskList => {
        const checklistItems = taskList.content || [];
        const completedItems = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateString, ci.id)) === 'true').length;

        if (isStandardCategory) {
            totalStandardTasksCount += checklistItems.length;
        }
        
        if (standardOnlyStats) {
            if (isStandardCategory) {
                totalTasksForCalc += checklistItems.length;
                completedCount += completedItems;
            }
        } else {
            totalTasksForCalc += checklistItems.length;
            completedCount += completedItems;
        }
    });
  });

  // Include scheduled tasks in the calculation for standard-only stats
  const scheduledTasksForDate = getScheduledTasksForDate(dateString);
  const completedScheduled = scheduledTasksForDate.filter(t => localStorage.getItem(getScheduledTaskCompletionKey(dateString, t.id)) === 'true').length;
  totalStandardTasksCount += scheduledTasksForDate.length;
  if(standardOnlyStats) {
      totalTasksForCalc += scheduledTasksForDate.length;
      completedCount += completedScheduled;
  }


  const percentage = totalStandardTasksCount > 0 ? Math.round((completedCount / totalStandardTasksCount) * 100) : 0;
  const pointsPerTask = totalStandardTasksCount > 0 ? targetPoints / totalStandardTasksCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);
  
  return { 
    percentage, pointsEarned, completedCount,
    totalTasks: totalTasksForCalc, totalStandardTasks: totalStandardTasksCount
  };
}

function getWeekDates(forDate = new Date()) {
    const date = new Date(forDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const weekDay = new Date(startDate);
        weekDay.setDate(startDate.getDate() + i);
        weekDates.push(formatDateToString(weekDay));
    }
    return weekDates;
}

function calculateProgressForPeriod(tracker) {
    const today = new Date();
    const todayStr = formatDateToString(today);
    let datesInRange = [];
    
    switch(tracker.type) {
        case 'daily':
            datesInRange.push(todayStr);
            break;
        case 'weekly': {
            const weekDates = getWeekDates(today);
            for(const dateStr of weekDates) {
                datesInRange.push(dateStr);
                if (dateStr === todayStr) break;
            }
            break;
        }
        case 'monthly': {
             const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
             const daysInMonth = (new Date(today.getFullYear(), today.getMonth() + 1, 0)).getDate();
             for (let i = 1; i <= daysInMonth; i++) {
                 const date = new Date(today.getFullYear(), today.getMonth(), i);
                 const dateStr = formatDateToString(date);
                 if (getNormalizedDate(date) > today) break;
                 datesInRange.push(dateStr);
             }
             break;
        }
        case 'custom': {
            if (tracker.startDate && tracker.endDate) {
                let currentDate = getNormalizedDate(new Date(tracker.startDate));
                const endDate = getNormalizedDate(new Date(tracker.endDate));
                while(currentDate <= endDate) {
                    if (currentDate > today) break;
                    datesInRange.push(formatDateToString(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            break;
        }
        default:
            return { pointsEarned: 0, percentage: 0, totalPoints: tracker.targetPoints };
    }

    let totalPointsEarned = 0;
    datesInRange.forEach(dateString => {
        const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
        const historyData = localStorage.getItem(historyKey);
        if (historyData) {
            try {
                const entry = JSON.parse(historyData);
                totalPointsEarned += (entry.pointsEarned || 0);
            } catch (e) {
                console.error(`Error parsing history for ${dateString}:`, e);
            }
        }
    });

    const totalPoints = tracker.targetPoints;
    const percentage = totalPoints > 0 ? Math.round((totalPointsEarned / totalPoints) * 100) : 0;

    return { pointsEarned: Math.round(totalPointsEarned), percentage, totalPoints };
}

function renderMainProgressBars() {
    if (!domElements.mobileProgressLocation) return;
    domElements.mobileProgressLocation.innerHTML = '';

    const activeTrackers = progressTrackers.filter(t => !t.isArchived).sort((a,b) => a.order - b.order);

    if (activeTrackers.length === 0) {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.innerHTML = `<p class="empty-tasks-message" style="padding: 20px;">No active progress trackers. You can add one in Progress Management.</p>`;
        domElements.mobileProgressLocation.appendChild(container);
        return;
    }

    activeTrackers.forEach(tracker => {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.dataset.trackerId = tracker.id;
        
        const { pointsEarned, percentage, totalPoints } = calculateProgressForPeriod(tracker);
        
        container.innerHTML = `
            <h3>${tracker.name}</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percentage}%;" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div>
            </div>
            <p class="points-stat progress-value">${pointsEarned} / ${totalPoints} Points</p>
        `;
        
        const fillEl = container.querySelector('.progress-bar-fill');
        applyProgressStyles(fillEl, percentage);
        domElements.mobileProgressLocation.appendChild(container);
    });
}


function updateDashboardSummaries() {
    if (!domElements.dashboardSummaries) return;
    domElements.dashboardSummaries.innerHTML = '';
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    currentCategories.forEach(category => {
        if (category.id === 'dashboard') return;

        const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        let totalItems = 0;
        let completedItems = 0;
        allCategoryTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalItems += checklistItems.length;
            completedItems += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        });

        const incompleteItems = totalItems - completedItems;
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'dashboard-category-summary';

        let notificationHTML = '';
        if (totalItems > 0) {
            if (incompleteItems > 0) {
                notificationHTML = `<div class="category-notification-badge">${incompleteItems}</div>`;
            } else {
                notificationHTML = `<div class="category-completion-checkmark">✅</div>`;
            }
        }

        summaryDiv.innerHTML = `
            ${notificationHTML}
            <h3>${category.name}</h3>
            <p class="category-stats">${completedItems} / ${totalItems}</p>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;

        const fillEl = summaryDiv.querySelector('.progress-bar-fill');
        fillEl.style.width = `${percentage}%`;
        applyProgressStyles(fillEl, percentage);

        if (totalItems > 0 && completedItems === totalItems) {
            summaryDiv.querySelector('.category-stats').classList.add('fully-completed');
        }

        domElements.dashboardSummaries.appendChild(summaryDiv);
    });
}

function updateAllProgress() {
  try {
    if (currentActiveViewId === 'main' || currentActiveViewId === 'activity-dashboard') {
        renderMainProgressBars();
        renderTodaysScheduledTasks();
    }
    if (currentActiveViewId === 'activity-dashboard') {
      updateDashboardSummaries(); 
    }
    updateCategoryTabBadges();
    renderCalendar();
    if (domElements.timeProgressModal && !domElements.timeProgressModal.classList.contains('hidden')) {
        updateTimeProgress();
    }
  } catch (error) {
    console.error('[Critical Error] Failed during UI update in updateAllProgress(). App state might be inconsistent.', error);
  }
}

// --- CALENDAR & HISTORY FUNCTIONS ---

function renderCalendar() {
    if (!domElements.calendarGrid || !domElements.calendarMonthYear) return;

    domElements.calendarGrid.innerHTML = '';

    const monthName = calendarDisplayDate.toLocaleString('default', { month: 'long' });
    const year = calendarDisplayDate.getFullYear();
    domElements.calendarMonthYear.textContent = `${monthName} ${year}`;
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const headerEl = document.createElement('div');
        headerEl.className = 'calendar-day-header';
        headerEl.textContent = day;
        domElements.calendarGrid.appendChild(headerEl);
    });

    const today = getNormalizedDate(new Date());
    const month = calendarDisplayDate.getMonth();
    
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells for padding
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        domElements.calendarGrid.appendChild(emptyCell);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        
        const cellDate = getNormalizedDate(new Date(year, month, day));
        const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        cell.innerHTML = `<span class="calendar-day-number">${day}</span><div class="calendar-day-fill"></div>`;
        
        if (cellDate.getTime() === today.getTime()) {
            cell.classList.add('current-day');
        }

        if (cellDate > today) {
             cell.classList.add('future-day');
        } else { // Today or in the past
            let percentage = 0;
            if (cellDate.getTime() < today.getTime()) {
                // Past day logic
                const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
                const historyData = localStorage.getItem(historyKey);
                if (historyData) {
                    try {
                        const entry = JSON.parse(historyData);
                        percentage = entry.percentageCompleted || 0;
                    } catch(e) { console.error(`Error parsing history for ${dateString}:`, e); }
                }
            } else { // It's today
                const dailyTracker = progressTrackers.find(t => t.type === 'daily');
                const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
                const { percentage: todayPercentage } = calculateProgressForDate(dateString, true, dailyTarget);
                percentage = todayPercentage;
            }
            
            const fill = cell.querySelector('.calendar-day-fill');
            fill.style.height = `${percentage}%`;
            
            if(currentTheme !== 'flip-clock') {
                fill.style.backgroundColor = getProgressFillColor(percentage);
                fill.style.opacity = '0.4';
            } else {
                fill.style.opacity = percentage / 100;
            }
            
            if (percentage > 85) {
                cell.classList.add('high-fill');
            }

            cell.addEventListener('click', () => {
                openHistoryModal(dateString);
            });
        }
        
        // Add scheduled task indicator
        const scheduledForDay = getScheduledTasksForDate(dateString);
        if(scheduledForDay.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'scheduled-task-indicator';
            cell.appendChild(indicator);
        }

        domElements.calendarGrid.appendChild(cell);
    }
}

function changeMonth(delta) {
    calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + delta);
    pickerSelectedMonth = calendarDisplayDate.getMonth();
    pickerSelectedYear = calendarDisplayDate.getFullYear();
    renderCalendar();
}

function openMonthYearPicker() {
    isMonthYearPickerOpen = true;
    renderMonthYearPicker();
    domElements.monthYearPickerModal.classList.add('opening');
    domElements.monthYearPickerModal.classList.remove('hidden');
}

function closeMonthYearPicker() {
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
    domElements.monthYearPickerModal.classList.remove('opening');
}

function renderMonthYearPicker() {
    if (!isMonthYearPickerOpen) return;
    
    // Render Months
    domElements.pickerMonthsGrid.innerHTML = '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
        const monthEl = document.createElement('button');
        monthEl.className = 'month-option';
        monthEl.textContent = month;
        monthEl.dataset.month = index;
        if (index === pickerSelectedMonth) {
            monthEl.classList.add('selected');
        }
        monthEl.onclick = () => {
            pickerSelectedMonth = index;
            calendarDisplayDate.setMonth(pickerSelectedMonth);
            renderMonthYearPicker(); // Re-render to show selection
        };
        domElements.pickerMonthsGrid.appendChild(monthEl);
    });

    // Render Years
    domElements.pickerYearsList.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let i = currentYear + 1; i >= currentYear - 10; i--) {
        const yearEl = document.createElement('button');
        yearEl.className = 'year-option';
        yearEl.textContent = i;
        yearEl.dataset.year = i;
        if (i === pickerSelectedYear) {
            yearEl.classList.add('selected');
        }
        yearEl.onclick = () => {
            pickerSelectedYear = i;
            calendarDisplayDate.setFullYear(pickerSelectedYear);
            calendarDisplayDate.setMonth(pickerSelectedMonth);
            renderCalendar();
            closeMonthYearPicker();
        };
        domElements.pickerYearsList.appendChild(yearEl);
    }
    const selectedYearEl = domElements.pickerYearsList.querySelector('.selected');
    if (selectedYearEl) {
        selectedYearEl.scrollIntoView({ block: 'center' });
    }
}

function openHistoryModal(dateString) {
    currentModalDate = dateString;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const historyData = localStorage.getItem(historyKey);
    let historyEntry;
    
    try {
        historyEntry = historyData ? JSON.parse(historyData) : createEmptyHistoryEntry(dateString);
    } catch (e) {
        console.error("Error parsing history data:", e);
        historyEntry = createEmptyHistoryEntry(dateString);
    }
    
    currentFullscreenContent = {
        tasksHTML: '',
        noteText: historyEntry.userNote || "No reflection written for this day."
    };

    const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const dailyTarget = historyEntry.dailyTargetPoints || 2700;
    domElements.historyModalDate.textContent = formattedDate;
    domElements.historyModalPointsValue.textContent = historyEntry.pointsEarned;
    domElements.historyModalPointsTotal.textContent = dailyTarget;
    
    const percentage = historyEntry.percentageCompleted || 0;
    domElements.historyPercentageProgressFill.textContent = `${percentage}%`;
    domElements.historyPercentageProgressFill.style.width = `${percentage}%`;
    domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', percentage);
    applyProgressStyles(domElements.historyPercentageProgressFill, percentage);

    // Populate Completed Tasks
    domElements.historyTasksList.innerHTML = '';
    let hasTasks = false;
    let fullTasksHTML = '';
    const { completedTaskStructure } = historyEntry;

    if (completedTaskStructure && Object.keys(completedTaskStructure).length > 0) {
        for (const categoryId in completedTaskStructure) {
            hasTasks = true;
            const categoryData = completedTaskStructure[categoryId];
            const isSpecial = categoryData.type === 'special';
            const categoryTitleClass = isSpecial ? 'special-history-title' : '';
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'history-category-group';
            categoryDiv.innerHTML = `<h5 class="history-category-title ${categoryTitleClass}">${categoryData.name}</h5>`;
            fullTasksHTML += `<h5 class="history-category-title ${categoryTitleClass}">${categoryData.name}</h5>`;

            const ul = document.createElement('ul');
            fullTasksHTML += '<ul>';
            
            categoryData.tasks.forEach(taskText => {
                const li = document.createElement('li');
                li.textContent = taskText;
                ul.appendChild(li);
                fullTasksHTML += `<li>${taskText}</li>`;
            });
            categoryDiv.appendChild(ul);
            domElements.historyTasksList.appendChild(categoryDiv);
            fullTasksHTML += '</ul>';
        }
    }
    
    if (!hasTasks) {
        domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
        fullTasksHTML = '<p>No tasks were completed on this day.</p>';
    }
    currentFullscreenContent.tasksHTML = fullTasksHTML;
    domElements.expandTasksButton.classList.toggle('hidden', !hasTasks);
    
    // Populate Reflection Note
    const isToday = (currentModalDate === getTodayDateString());
    domElements.historyUserNoteDisplay.classList.add('hidden');
    domElements.historyUserNoteEdit.classList.toggle('hidden', isToday);
    domElements.historicalNoteControls.classList.toggle('hidden', isToday);

    if (isToday) {
        // Today's note is edited in the main view
        domElements.historyUserNoteDisplay.textContent = "Today's reflection can be edited on the main page.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
        domElements.expandReflectionButton.classList.add('hidden');
    } else {
        domElements.historyUserNoteEdit.value = historyEntry.userNote || "";
        domElements.historyUserNoteDisplay.textContent = historyEntry.userNote || "No reflection written for this day.";
        domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote);
    }
    
    domElements.historyModal.classList.add('opening');
    domElements.historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
    domElements.historyModal.classList.add('hidden');
    domElements.historyModal.classList.remove('opening');
    currentModalDate = null;
    currentFullscreenContent = null;
}

function saveHistoricalNote() {
    if (!currentModalDate) return;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    const historyData = localStorage.getItem(historyKey);
    let historyEntry = historyData ? JSON.parse(historyData) : createEmptyHistoryEntry(currentModalDate);

    historyEntry.userNote = domElements.historyUserNoteEdit.value;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Also update the daily note storage if it exists for that day, to keep sync
    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, historyEntry.userNote);
    
    domElements.historicalNoteStatus.textContent = 'Saved!';
    setTimeout(() => { domElements.historicalNoteStatus.textContent = ''; }, 2000);
}

function clearHistoricalNote() {
    if (confirm("Are you sure you want to clear this reflection?")) {
        domElements.historyUserNoteEdit.value = "";
        saveHistoricalNote();
    }
}

function createEmptyHistoryEntry(dateString) {
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
    return {
        date: dateString,
        completedTaskStructure: {},
        userNote: "",
        pointsEarned: 0,
        percentageCompleted: 0,
        totalTasksOnDate: 0,
        dailyTargetPoints: dailyTarget,
    };
}


function openFullscreenModal(title, content, isHtml) {
    domElements.fullscreenModalTitle.textContent = title;
    if (isHtml) {
        domElements.fullscreenModalArea.innerHTML = content;
    } else {
        domElements.fullscreenModalArea.innerHTML = `<pre>${content}</pre>`;
    }
    domElements.fullscreenContentModal.classList.add('opening');
    domElements.fullscreenContentModal.classList.remove('hidden');
}

function closeFullscreenModal() {
    domElements.fullscreenContentModal.classList.add('hidden');
    domElements.fullscreenContentModal.classList.remove('opening');
}

// --- CATEGORY & ITEM MANAGEMENT ---

function openCategoryTypeChoiceModal() {
    domElements.chooseCategoryTypeModal.classList.add('opening');
    domElements.chooseCategoryTypeModal.classList.remove('hidden');
}
function hideCategoryTypeChoiceModal() {
    domElements.chooseCategoryTypeModal.classList.add('hidden');
    domElements.chooseCategoryTypeModal.classList.remove('opening');
}

function openNameEntryModal(context, itemType, itemToRename = null, defaultName = '') {
    tempItemCreationData = { context, itemType, itemToRename };
    const modalTitle = domElements.nameEntryTitle;
    const input = domElements.nameEntryInput;
    const confirmButton = domElements.confirmNameEntryButton;

    if (context === 'create') {
        const typeName = itemType === 'tasklist' ? 'Task List' : itemType.charAt(0).toUpperCase() + itemType.slice(1);
        modalTitle.textContent = `New ${typeName}`;
        input.placeholder = `Enter ${typeName} Name`;
        confirmButton.textContent = `Create ${typeName}`;
        input.value = defaultName;
    } else if (context === 'rename') {
        const typeName = itemToRename.type.charAt(0).toUpperCase() + itemToRename.type.slice(1);
        modalTitle.textContent = `Rename ${typeName}`;
        input.placeholder = `Enter new name for ${itemToRename.name}`;
        confirmButton.textContent = 'Rename';
        input.value = itemToRename.name;
    } else if (context === 'rename-category') {
        modalTitle.textContent = 'Rename Category';
        input.placeholder = 'Enter new category name';
        confirmButton.textContent = 'Rename';
        input.value = itemToRename.name;
    }
    
    domElements.nameEntryModal.classList.add('opening');
    domElements.nameEntryModal.classList.remove('hidden');
    input.focus();
    input.select();
}

function hideNameEntryModal() {
    domElements.nameEntryModal.classList.add('hidden');
    domElements.nameEntryModal.classList.remove('opening');
    tempItemCreationData = null;
    domElements.nameEntryInput.value = '';
}

function confirmNameEntry() {
    const { context, itemType, itemToRename } = tempItemCreationData;
    const newName = domElements.nameEntryInput.value.trim();

    if (!newName) {
        alert('Name cannot be empty.');
        return;
    }

    if (context === 'create') {
        const newItem = {
            id: createUniqueId(itemType),
            name: newName,
            type: itemType,
            order: 0 // Will be re-ordered on render
        };
        if (itemType === 'folder' || itemType === 'tasklist') {
            newItem.content = [];
        } else if (itemType === 'note') {
            newItem.content = '';
        }

        if (itemType === 'standard' || itemType === 'special') { // Creating a category
            const newCategory = {
                id: createUniqueId('cat'),
                name: newName,
                order: currentCategories.length,
                deletable: true,
                type: itemType // 'standard' or 'special'
            };
            currentCategories.push(newCategory);
            saveUserCategories(currentCategories);
            appContent[newCategory.id] = [];
            saveAppContent();
            renderTabs();
            renderCategorySections();
            switchTab(newCategory.id);
        } else { // Creating an item inside a category
            const parentList = getItemsForPath(currentPath);
            parentList.push(newItem);
            parentList.forEach((item, index) => item.order = index);
            saveAppContent();
            renderCategorySectionContent(currentPath[0].id);
        }

    } else if (context === 'rename') {
        const found = findItemAndParent(itemToRename.id);
        if (found) {
            found.item.name = newName;
            saveAppContent();
            renderCategorySectionContent(currentPath[0].id);
        }
    } else if (context === 'rename-category') {
        const category = currentCategories.find(c => c.id === itemToRename.id);
        if (category) {
            category.name = newName;
            saveUserCategories(currentCategories);
            renderTabs();
            renderCategorySections();
        }
    }

    hideNameEntryModal();
}

function generateDefaultName(type, itemList) {
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    let counter = 1;
    let newName = `New ${typeName}`;
    while(itemList.some(item => item.name === newName)) {
        counter++;
        newName = `New ${typeName} ${counter}`;
    }
    return newName;
}

function renderCategorySections() {
    domElements.tabContent.querySelectorAll('.category-section').forEach(el => el.remove());
    currentCategories.forEach(category => {
        const template = domElements.categorySectionTemplate.content.cloneNode(true);
        const section = template.querySelector('.category-section');
        section.id = `category-section-${category.id}`;
        section.setAttribute('aria-labelledby', `tab-button-${category.id}`);
        section.querySelector('.category-title-text').textContent = category.name;
        domElements.tabContent.appendChild(section);
    });
}


function showCategoryContextMenu(categoryId, targetElement) {
    currentContextMenuTargetTab = categoryId;
    const category = currentCategories.find(cat => cat.id === categoryId);
    
    // Disable delete option for non-deletable categories
    domElements.ctxDeleteCategory.disabled = (category && category.deletable === false);

    const rect = targetElement.getBoundingClientRect();
    domElements.categoryTabContextMenu.style.top = `${rect.bottom + 5}px`;
    domElements.categoryTabContextMenu.style.left = `${rect.left}px`;
    domElements.categoryTabContextMenu.classList.remove('hidden');
}

function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) {
        domElements.categoryTabContextMenu.classList.add('hidden');
    }
    document.querySelectorAll('.tab-options-icon.visible').forEach(icon => icon.classList.remove('visible'));
    currentContextMenuTargetTab = null;
}

function handleContextMenuAction(e) {
    const action = e.currentTarget.id;
    const categoryId = currentContextMenuTargetTab;
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category) return;

    if (action === 'ctx-rename-category') {
        openNameEntryModal('rename-category', null, category);
    } else if (action === 'ctx-delete-category') {
        if(category.deletable === false) {
             alert(`The "${category.name}" category cannot be deleted.`);
        } else {
            showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the "${category.name}" category and all of its contents? This cannot be undone.`);
        }
    }

    hideCategoryContextMenu();
}

function showItemContextMenu(targetElement, item) {
    // This is a placeholder for a more robust popover/context menu system
    // For now, it will use a simplified context menu
    const existingMenu = document.getElementById('item-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'item-context-menu';
    menu.className = 'context-menu item-options-popover'; // Reuse styles
    menu.innerHTML = `
        <button data-action="rename">Rename</button>
        <button data-action="delete">Delete</button>
    `;
    
    menu.querySelector('[data-action="rename"]').onclick = (e) => {
        e.stopPropagation();
        menu.remove();
        openNameEntryModal('rename', item.type, item);
    };
    menu.querySelector('[data-action="delete"]').onclick = (e) => {
        e.stopPropagation();
        menu.remove();
        showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}?`);
    };

    document.body.appendChild(menu);
    const rect = targetElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - menu.offsetWidth + rect.width}px`;
    itemContextMenu = { element: menu, target: item };
}

function hideItemContextMenu() {
    if (itemContextMenu.element) {
        itemContextMenu.element.remove();
        itemContextMenu = { element: null, target: null };
    }
}

// --- DRAG & DROP ---
function handleDragStart(e, item) {
    draggedItemId = item.id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    draggedItemId = null;
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const targetFolderEl = e.target.closest('.item.type-folder');
    if (targetFolderEl && targetFolderEl.dataset.itemId !== draggedItemId) {
        targetFolderEl.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetFolderEl = e.target.closest('.item.type-folder');
    if (targetFolderEl) {
        targetFolderEl.classList.remove('drag-over');
    }
}

function handleDrop(e, targetFolder) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.item.type-folder')?.classList.remove('drag-over');
    
    if (!draggedItemId || draggedItemId === targetFolder.id) return;

    const draggedItemInfo = findItemAndParent(draggedItemId);
    const targetFolderInfo = findItemAndParent(targetFolder.id);

    if (draggedItemInfo && targetFolderInfo) {
        // Remove from old parent
        const itemIndex = draggedItemInfo.parentList.indexOf(draggedItemInfo.item);
        if (itemIndex > -1) {
            draggedItemInfo.parentList.splice(itemIndex, 1);
        }
        
        // Add to new parent (targetFolder)
        if (!targetFolderInfo.item.content) {
            targetFolderInfo.item.content = [];
        }
        targetFolderInfo.item.content.push(draggedItemInfo.item);
        
        // Re-order both lists
        draggedItemInfo.parentList.forEach((item, i) => item.order = i);
        targetFolderInfo.item.content.forEach((item, i) => item.order = i);
        
        saveAppContent();
        renderCategorySectionContent(currentPath[0].id); // Re-render the view
    }
}

// --- GLOBAL EVENT HANDLERS & INITIALIZATION ---

function handleGlobalClick(e) {
    // Hide add action menu if clicking outside
    const addActionContainer = e.target.closest('.add-action-container');
    if (!addActionContainer && isAddActionMenuOpen) {
        isAddActionMenuOpen = false;
        document.querySelector('.add-action-container.open')?.classList.remove('open');
    }

    // Hide view mode menu
    const viewModeContainer = e.target.closest('.view-mode-container');
    if (!viewModeContainer) {
        document.querySelector('.view-mode-container.open')?.classList.remove('open');
    }

    // Hide tab context menu
    if (!e.target.closest('.context-menu') && !e.target.closest('.tab-options-icon')) {
        hideCategoryContextMenu();
    }
    // Hide item context menu
    if (!e.target.closest('#item-context-menu') && !e.target.closest('.item-more-options')) {
        hideItemContextMenu();
    }

    // Hide month/year picker
    if (isMonthYearPickerOpen && !e.target.closest('.month-year-picker-content') && !e.target.closest('#calendar-month-year-button')) {
        closeMonthYearPicker();
    }
}

function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
        // Close modals in a prioritized order
        if(document.getElementById('item-context-menu')) {
            hideItemContextMenu();
        } else if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.classList.contains('hidden')) {
            hideCategoryContextMenu();
        } else if (domElements.fullscreenContentModal && !domElements.fullscreenContentModal.classList.contains('hidden')) {
            closeFullscreenModal();
        } else if (domElements.historyModal && !domElements.historyModal.classList.contains('hidden')) {
            closeHistoryModal();
        } else if (domElements.noteEditorModal && !domElements.noteEditorModal.classList.contains('hidden')) {
            closeNoteEditorModal();
        } else if (domElements.taskListModal && !domElements.taskListModal.classList.contains('hidden')) {
            closeTaskListModal();
        } else if (domElements.nameEntryModal && !domElements.nameEntryModal.classList.contains('hidden')) {
            hideNameEntryModal();
        } else if (domElements.deleteConfirmationModal && !domElements.deleteConfirmationModal.classList.contains('hidden')) {
            hideDeleteConfirmation();
        } else if (domElements.sidePanelMenu && domElements.sidePanelMenu.classList.contains('open')) {
            closeSidePanel();
        }
    }
}

function renderAll() {
  renderMainProgressBars();
  updateDashboardSummaries();
  renderCategorySections();
  renderCalendar();
  switchTab('dashboard'); // Default to dashboard view
}

// --- Side Panel & Appearance ---
function toggleSidePanel() {
    const isOpen = domElements.hamburgerButton.classList.toggle('open');
    domElements.hamburgerButton.setAttribute('aria-expanded', isOpen.toString());
    domElements.sidePanelMenu.classList.toggle('open', isOpen);
    domElements.sidePanelMenu.setAttribute('aria-hidden', (!isOpen).toString());
    domElements.sidePanelOverlay.classList.toggle('hidden', !isOpen);
    if (isOpen) {
        domElements.sidePanelMenu.querySelector('button').focus();
    } else {
        domElements.hamburgerButton.focus();
    }
}

function closeSidePanel() {
    if (!domElements.sidePanelMenu.classList.contains('open')) return;
    domElements.hamburgerButton.classList.remove('open');
    domElements.hamburgerButton.setAttribute('aria-expanded', 'false');
    domElements.sidePanelMenu.classList.remove('open');
    domElements.sidePanelMenu.setAttribute('aria-hidden', 'true');
    domElements.sidePanelOverlay.classList.add('hidden');
}

function toggleThemeDropdown() {
    domElements.appearanceMenuItemContainer.classList.toggle('open');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const themes = [
        { id: 'original', name: 'Original Neon' },
        { id: 'power-safe', name: 'Power Safe' },
        { id: 'flip-clock', name: 'Flip Clock' }
    ];

    if (savedTheme && themes.some(t => t.id === savedTheme)) {
        currentTheme = savedTheme;
    }
    document.body.dataset.theme = currentTheme;
    
    // Populate dropdown
    domElements.themeDropdownContainer.innerHTML = '';
    themes.forEach(theme => {
        const button = document.createElement('button');
        button.className = 'theme-option-button';
        button.dataset.themeId = theme.id;
        button.innerHTML = `<span>${theme.name}</span><div class="theme-active-indicator"></div>`;
        if (theme.id === currentTheme) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => changeTheme(theme.id));
        domElements.themeDropdownContainer.appendChild(button);
    });
}

function changeTheme(themeId) {
    currentTheme = themeId;
    localStorage.setItem(STORAGE_KEY_THEME, themeId);
    document.body.dataset.theme = themeId;

    // Update active state in dropdown
    domElements.themeDropdownContainer.querySelectorAll('.theme-option-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeId === themeId);
    });

    // Re-render components that might have theme-dependent styles
    updateAllProgress();
}

// --- PROGRESS MANAGEMENT ---
function renderProgressManagementList() {
    if (!domElements.activeProgressList || !domElements.archivedProgressList) return;
    domElements.activeProgressList.innerHTML = '';
    domElements.archivedProgressList.innerHTML = '';

    const sortedTrackers = progressTrackers.sort((a,b) => a.order - b.order);

    if(sortedTrackers.length === 0) {
        domElements.activeProgressList.innerHTML = '<p class="empty-tasks-message">No progress trackers found.</p>';
        return;
    }

    sortedTrackers.forEach(tracker => {
        const itemEl = document.createElement('div');
        if (tracker.type === 'custom') { // Render as history item
            itemEl.className = 'progress-history-item';
            const { pointsEarned, percentage, totalPoints } = calculateProgressForPeriod(tracker);
            const statusClass = tracker.isArchived ? 'progress-status-completed' : 'progress-status-incomplete';
            const statusText = tracker.isArchived ? 'Completed' : 'In Progress';
            
            itemEl.innerHTML = `
                <div class="progress-history-item-header">
                    <h4>${tracker.name}</h4>
                    <span class="progress-status ${statusClass}">${statusText}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <p class="points-stat">${pointsEarned} / ${totalPoints} Points</p>
            `;
            applyProgressStyles(itemEl.querySelector('.progress-bar-fill'), percentage);
            itemEl.addEventListener('click', () => openProgressHistoryDetailModal(tracker.id));
        } else { // Render as standard tracker item
            itemEl.className = 'progress-tracker-item';
            itemEl.innerHTML = `
                <div class="progress-tracker-info">
                    <h4>${tracker.name}</h4>
                    <p>Tracks ${tracker.type} progress. Target: ${tracker.targetPoints} points.</p>
                </div>
                <div class="progress-tracker-actions">
                    <button class="icon-button" title="Edit Tracker"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                    <button class="icon-button" title="Delete Tracker"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
                </div>
            `;
            itemEl.querySelector('[title="Edit Tracker"]').addEventListener('click', () => openProgressEditor(tracker.id));
            itemEl.querySelector('[title="Delete Tracker"]').addEventListener('click', () => showDeleteConfirmation('progressTracker', tracker.id));
        }
        
        if (tracker.isArchived) {
            domElements.archivedProgressList.appendChild(itemEl);
        } else {
            domElements.activeProgressList.appendChild(itemEl);
        }
    });

    if(domElements.activeProgressList.innerHTML === '') domElements.activeProgressList.innerHTML = '<p class="empty-tasks-message">No active trackers.</p>';
    if(domElements.archivedProgressList.innerHTML === '') domElements.archivedProgressList.innerHTML = '<p class="empty-tasks-message">No archived history.</p>';

}

function openProgressEditor(trackerId = null) {
    currentlyEditingProgressTrackerId = trackerId;
    if (trackerId) {
        const tracker = progressTrackers.find(t => t.id === trackerId);
        domElements.progressEditorTitle.textContent = "Edit Progress Tracker";
        domElements.progressNameInput.value = tracker.name;
        domElements.progressTargetInput.value = tracker.targetPoints;
        domElements.progressTypeSelect.value = tracker.type;
        domElements.progressTypeSelect.disabled = tracker.type !== 'custom';

        const isCustom = tracker.type === 'custom';
        domElements.progressCustomDatesContainer.classList.toggle('hidden', !isCustom);
        if (isCustom) {
            domElements.progressStartDate.value = tracker.startDate || '';
            domElements.progressEndDate.value = tracker.endDate || '';
        }
    } else {
        domElements.progressEditorTitle.textContent = "New Progress Tracker";
        domElements.progressNameInput.value = '';
        domElements.progressTargetInput.value = '';
        domElements.progressTypeSelect.value = 'custom';
        domElements.progressTypeSelect.disabled = false;
        domElements.progressCustomDatesContainer.classList.remove('hidden');
        domElements.progressStartDate.value = '';
        domElements.progressEndDate.value = '';
    }
    
    domElements.progressEditorModal.classList.add('opening');
    domElements.progressEditorModal.classList.remove('hidden');
    domElements.progressNameInput.focus();
}

function closeProgressEditor() {
    domElements.progressEditorModal.classList.add('hidden');
    domElements.progressEditorModal.classList.remove('opening');
    currentlyEditingProgressTrackerId = null;
}

function saveProgressTracker() {
    const name = domElements.progressNameInput.value.trim();
    const targetPoints = parseInt(domElements.progressTargetInput.value, 10);
    const type = domElements.progressTypeSelect.value;
    
    if (!name || isNaN(targetPoints) || targetPoints <= 0) {
        alert("Please enter a valid name and a positive target point value.");
        return;
    }

    let startDate = null, endDate = null;
    if (type === 'custom') {
        startDate = domElements.progressStartDate.value;
        endDate = domElements.progressEndDate.value;
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            alert("Please enter valid start and end dates for a custom tracker.");
            return;
        }
    }

    if (currentlyEditingProgressTrackerId) {
        const tracker = progressTrackers.find(t => t.id === currentlyEditingProgressTrackerId);
        tracker.name = name;
        tracker.targetPoints = targetPoints;
        // Type is not editable for existing non-custom trackers
        if (tracker.type === 'custom') {
            tracker.startDate = startDate;
            tracker.endDate = endDate;
        }
    } else {
        const existingOfType = progressTrackers.find(t => t.type === type && type !== 'custom');
        if (existingOfType) {
            alert(`A tracker for "${type}" progress already exists. Please edit the existing one.`);
            return;
        }
        const newTracker = {
            id: createUniqueId('progress'),
            name,
            targetPoints,
            type,
            startDate,
            endDate,
            order: progressTrackers.length,
            isArchived: false,
        };
        progressTrackers.push(newTracker);
    }
    saveProgressTrackers();
    renderProgressManagementList();
    renderMainProgressBars();
    closeProgressEditor();
}

function openProgressHistoryDetailModal(trackerId) {
    const tracker = progressTrackers.find(t => t.id === trackerId);
    if (!tracker) return;
    activeProgressDetailTracker = tracker;

    domElements.progressHistoryDetailTitle.textContent = tracker.name;

    renderProgressHistoryCalendar();
    renderProgressHistoryDailySummary(tracker.startDate); // Show first day by default

    domElements.progressHistoryDetailModal.classList.add('opening');
    domElements.progressHistoryDetailModal.classList.remove('hidden');
}

function closeProgressHistoryDetailModal() {
    domElements.progressHistoryDetailModal.classList.add('hidden');
    domElements.progressHistoryDetailModal.classList.remove('opening');
    activeProgressDetailTracker = null;
}

function renderProgressHistoryCalendar() {
    const { startDate, endDate } = activeProgressDetailTracker;
    const calendarView = domElements.progressHistoryCalendarView;
    calendarView.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    let currentDate = getNormalizedDate(new Date(startDate));
    const finalDate = getNormalizedDate(new Date(endDate));

    while (currentDate <= finalDate) {
        const dateString = formatDateToString(currentDate);
        const day = currentDate.getDate();

        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        cell.dataset.date = dateString;
        cell.innerHTML = `<span class="calendar-day-number">${day}</span><div class="calendar-day-fill"></div>`;

        const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
        const historyData = localStorage.getItem(historyKey);
        let percentage = 0;
        if (historyData) {
            try {
                percentage = JSON.parse(historyData).percentageCompleted || 0;
            } catch { /* ignore */ }
        }
        
        const fill = cell.querySelector('.calendar-day-fill');
        fill.style.height = `${percentage}%`;
        fill.style.backgroundColor = getProgressFillColor(percentage);
        
        cell.addEventListener('click', () => {
            calendarView.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            renderProgressHistoryDailySummary(dateString);
        });

        grid.appendChild(cell);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    calendarView.appendChild(grid);
}

function renderProgressHistoryDailySummary(dateString) {
    const summaryView = domElements.progressHistoryDailySummary;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const historyData = localStorage.getItem(historyKey);
    let entry;
    try {
        entry = historyData ? JSON.parse(historyData) : createEmptyHistoryEntry(dateString);
    } catch {
        entry = createEmptyHistoryEntry(dateString);
    }
    
    const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let tasksHtml = '';
    for(const catId in entry.completedTaskStructure) {
        const catData = entry.completedTaskStructure[catId];
        tasksHtml += `<h5>${catData.name}</h5><ul>`;
        catData.tasks.forEach(task => tasksHtml += `<li>${task}</li>`);
        tasksHtml += `</ul>`;
    }
    if (tasksHtml === '') tasksHtml = '<li>No tasks completed.</li>';

    summaryView.innerHTML = `
        <div class="daily-summary-card">
            <h4>${formattedDate}</h4>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${entry.percentageCompleted}%">${entry.percentageCompleted}%</div>
            </div>
            <p class="points-stat">${entry.pointsEarned} / ${entry.dailyTargetPoints} Points</p>
            <div class="daily-summary-tasks">${tasksHtml}</div>
        </div>
    `;
    applyProgressStyles(summaryView.querySelector('.progress-bar-fill'), entry.percentageCompleted);
}

// --- TIME VS PROGRESS MODAL ---
function updateTimeProgress() {
    if (!domElements.timeProgressModal || domElements.timeProgressModal.classList.contains('hidden')) {
        return;
    }

    // --- Time Remaining Calculation ---
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(5, 30, 0, 0); // 5:30 AM

    const endTime = new Date(now);
    endTime.setHours(21, 30, 0, 0); // 9:30 PM

    const totalDurationSeconds = (endTime - startTime) / 1000; // This is 57,600
    
    let elapsedSeconds;
    let activeRemainingSeconds;

    if (now < startTime) {
        elapsedSeconds = 0;
        activeRemainingSeconds = totalDurationSeconds;
    } else if (now > endTime) {
        elapsedSeconds = totalDurationSeconds;
        activeRemainingSeconds = 0;
    } else {
        elapsedSeconds = (now - startTime) / 1000;
        activeRemainingSeconds = totalDurationSeconds - elapsedSeconds;
    }

    const percentage = Math.min(100, (elapsedSeconds / totalDurationSeconds) * 100);
    
    const hoursRemaining = Math.floor(activeRemainingSeconds / 3600);
    const minutesRemaining = Math.floor((activeRemainingSeconds % 3600) / 60);

    domElements.timeProgressBar.style.width = `${percentage}%`;
    applyProgressStyles(domElements.timeProgressBar, percentage);
    domElements.timeProgressPercentage.textContent = `${Math.round(percentage)}% of time used`;
    domElements.timeProgressRemaining.textContent = `${hoursRemaining}h ${minutesRemaining}m remaining`;
    
    // --- Time as Money Calculation (Updated) ---
    domElements.timeAsMoney.textContent = `$${Math.round(activeRemainingSeconds).toLocaleString('en-US')}`;


    // --- Task Progress Calculation ---
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
    const { pointsEarned, percentage: taskPercentage } = calculateProgressForDate(getTodayDateString(), true, dailyTarget);
    
    domElements.modalTaskProgressBar.style.width = `${taskPercentage}%`;
    applyProgressStyles(domElements.modalTaskProgressBar, taskPercentage);
    
    const progressValueEl = domElements.modalTaskProgressStats;
    const progressResetting = progressValueEl.classList.contains('progress-value-resetting');

    if (!progressResetting) {
        progressValueEl.textContent = `${pointsEarned} / ${dailyTarget} Points (${taskPercentage}%)`;
    }
    
    // --- Progress as Money Calculation (Updated) ---
    const moneyEarned = Math.round((taskPercentage / 100) * totalDurationSeconds);
    animateNumber(domElements.progressAsMoney, moneyEarned);
}

function toggleTimeProgressModal() {
    const wasHidden = domElements.timeProgressModal.classList.contains('hidden');
    if (wasHidden) {
        domElements.timeProgressModal.classList.remove('hidden');
        domElements.timeProgressModal.classList.add('opening');
        updateTimeProgress(); // Initial update
        if (timeProgressInterval) clearInterval(timeProgressInterval);
        timeProgressInterval = setInterval(updateTimeProgress, 1000); // Update every second
    } else {
        domElements.timeProgressModal.classList.add('hidden');
        domElements.timeProgressModal.classList.remove('opening');
        if (timeProgressInterval) clearInterval(timeProgressInterval);
        timeProgressInterval = null;
    }
}


// --- INITIALIZATION & EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
  // Query all DOM elements
  Object.keys(domElements).forEach(key => {
    const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    domElements[key] = document.getElementById(id);
  });
  
  // Attach event listeners
  if (domElements.addCategoryButton) domElements.addCategoryButton.addEventListener('click', () => openCategoryTypeChoiceModal());
  if (domElements.chooseCategoryTypeCloseButton) domElements.chooseCategoryTypeCloseButton.addEventListener('click', hideCategoryTypeChoiceModal);
  if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.addEventListener('click', () => { hideCategoryTypeChoiceModal(); openNameEntryModal('create', 'standard'); });
  if (domElements.selectSpecialCategoryButton) domElements.selectSpecialCategoryButton.addEventListener('click', () => { hideCategoryTypeChoiceModal(); openNameEntryModal('create', 'special'); });

  if (domElements.nameEntryCloseButton) domElements.nameEntryCloseButton.addEventListener('click', () => hideNameEntryModal());
  if (domElements.cancelNameEntryButton) domElements.cancelNameEntryButton.addEventListener('click', () => hideNameEntryModal());
  if (domElements.confirmNameEntryButton) domElements.confirmNameEntryButton.addEventListener('click', confirmNameEntry);
  if (domElements.nameEntryInput) domElements.nameEntryInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmNameEntry(); });
  
  if (domElements.saveNoteButton) domElements.saveNoteButton.addEventListener('click', saveDailyNote);
  if (domElements.dashboardTabButton) domElements.dashboardTabButton.addEventListener('click', () => switchTab('dashboard'));

  if(domElements.calendarPrevMonthButton) domElements.calendarPrevMonthButton.addEventListener('click', () => { changeMonth(-1); });
  if(domElements.calendarNextMonthButton) domElements.calendarNextMonthButton.addEventListener('click', () => { changeMonth(1); });
  if(domElements.calendarMonthYearButton) domElements.calendarMonthYearButton.addEventListener('click', () => { openMonthYearPicker(); });
  if(domElements.monthYearPickerCloseButton) domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);

  if(domElements.historyModalCloseButton) domElements.historyModalCloseButton.addEventListener('click', () => { closeHistoryModal(); });
  if(domElements.expandTasksButton) domElements.expandTasksButton.addEventListener('click', () => { if(currentFullscreenContent) openFullscreenModal('Completed Tasks', currentFullscreenContent.tasksHTML, true); });
  if(domElements.expandReflectionButton) domElements.expandReflectionButton.addEventListener('click', () => { if(currentFullscreenContent) openFullscreenModal('My Reflection', currentFullscreenContent.noteText, false); });
  if(domElements.saveHistoricalNoteButton) domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
  if(domElements.clearHistoricalNoteButton) domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);

  if (domElements.deleteConfirmationCloseButton) domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
  if (domElements.cancelDeleteButton) domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
  if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
  
  if (domElements.fullscreenModalCloseButton) domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenModal);

  if (domElements.ctxRenameCategory) domElements.ctxRenameCategory.addEventListener('click', handleContextMenuAction);
  if (domElements.ctxDeleteCategory) domElements.ctxDeleteCategory.addEventListener('click', handleContextMenuAction);

  if (domElements.noteEditorCloseButton) domElements.noteEditorCloseButton.addEventListener('click', closeNoteEditorModal);
  if (domElements.noteAddImageButton) domElements.noteAddImageButton.addEventListener('click', handleAddImageToNote);
  if (domElements.imageUploadInput) domElements.imageUploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
          processAndInsertImage(e.target.files[0]);
      }
  });

  if (domElements.taskListCloseButton) domElements.taskListCloseButton.addEventListener('click', closeTaskListModal);
  if (domElements.taskListEditButton) domElements.taskListEditButton.addEventListener('click', toggleTaskListEditMode);
  if (domElements.taskListResetButton) domElements.taskListResetButton.addEventListener('click', handleResetTasks);
  if (domElements.addChecklistItemForm) domElements.addChecklistItemForm.addEventListener('submit', handleAddChecklistItem);

  // Hamburger & side panel listeners
  if (domElements.hamburgerButton) domElements.hamburgerButton.addEventListener('click', toggleSidePanel);
  if (domElements.sidePanelOverlay) domElements.sidePanelOverlay.addEventListener('click', closeSidePanel);
  if (domElements.menuMainView) domElements.menuMainView.addEventListener('click', () => switchView('main'));
  if (domElements.menuActivityDashboard) domElements.menuActivityDashboard.addEventListener('click', () => switchView('activity-dashboard'));
  if (domElements.menuProgressManagement) domElements.menuProgressManagement.addEventListener('click', () => switchView('progress-management'));
  if (domElements.menuScheduledTasks) domElements.menuScheduledTasks.addEventListener('click', () => switchView('scheduled-tasks'));
  if (domElements.menuAppearance) domElements.menuAppearance.addEventListener('click', toggleThemeDropdown);

  // Progress Management listeners
  if (domElements.addNewProgressButton) domElements.addNewProgressButton.addEventListener('click', () => openProgressEditor());
  if (domElements.progressEditorCloseButton) domElements.progressEditorCloseButton.addEventListener('click', closeProgressEditor);
  if (domElements.saveProgressButton) domElements.saveProgressButton.addEventListener('click', saveProgressTracker);
  if (domElements.progressTypeSelect) domElements.progressTypeSelect.addEventListener('change', (e) => {
    domElements.progressCustomDatesContainer.classList.toggle('hidden', e.target.value !== 'custom');
  });
  if (domElements.progressHistoryDetailCloseButton) domElements.progressHistoryDetailCloseButton.addEventListener('click', closeProgressHistoryDetailModal);

  // Scheduled Tasks listeners
  if (domElements.addNewScheduledTaskButton) domElements.addNewScheduledTaskButton.addEventListener('click', () => openScheduledTaskEditor());
  if (domElements.scheduledTaskEditorCloseButton) domElements.scheduledTaskEditorCloseButton.addEventListener('click', closeScheduledTaskEditor);
  if (domElements.saveScheduledTaskButton) domElements.saveScheduledTaskButton.addEventListener('click', saveScheduledTask);
  if (domElements.scheduledTaskColorPicker) {
    domElements.scheduledTaskColorPicker.addEventListener('click', e => {
        if (e.target.classList.contains('color-option')) {
            domElements.scheduledTaskColorPicker.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
  }

  // Time vs Progress listeners
  if(domElements.timeProgressButton) domElements.timeProgressButton.addEventListener('click', toggleTimeProgressModal);
  if(domElements.timeProgressCloseButton) domElements.timeProgressCloseButton.addEventListener('click', toggleTimeProgressModal);

  // Global listeners
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleGlobalKeydown);

  loadAppData();
  initializeTheme();
  renderTabs();
  renderAll();

});
