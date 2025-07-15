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
const STORAGE_KEY_VIEW_MODE = 'lifeTrackerViewMode';
const STORAGE_KEY_THEME = 'lifeTrackerTheme';
const STORAGE_KEY_PROGRESS_TRACKERS = 'lifeTrackerProgressTrackers_v1';

let currentCategories = []; 
let appContent = {}; // Main data structure for all items (folders, notes, tasks)
let progressTrackers = [];

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
let currentActiveViewId = 'main'; // 'main', 'activity-dashboard', 'progress-management'
let currentlyEditingNote = null; // { id, name, content }
let currentlyEditingTaskList = null; // The task list being managed in the modal
let isTaskListEditMode = false;
let draggedItemId = null; // ID of the item being dragged
let currentlyEditingProgressTrackerId = null;
let activeProgressDetailTracker = null;

// DOM Elements
const domElements = {
  // Main Views
  appViewWrapper: null,
  progressManagementView: null,
  
  // Hamburger Menu & Side Panel
  hamburgerButton: null,
  sidePanelMenu: null,
  sidePanelOverlay: null,
  menuMainView: null, 
  menuActivityDashboard: null,
  menuProgressManagement: null,
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

  imageUploadInput: null,
};

function getProgressFillColor(percentage) {
    if (currentTheme === 'flip-clock') {
        return '#FFFFFF';
    }
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120; // 0 = red, 120 = green
    return `hsl(${hue}, 100%, 50%)`;
}

function getProgressGradient(percentage) {
    if (currentTheme === 'flip-clock' || currentTheme === 'power-safe') {
        return getProgressFillColor(percentage);
    }
    const p = Math.max(0, Math.min(100, percentage));
    const midPoint = Math.max(5, Math.min(95, p));
    const color = getProgressFillColor(p);
    return `linear-gradient(90deg, #ff6b6b 0%, #ffd700 ${midPoint}%, ${color} 100%)`;
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

function getChecklistItemStateStorageKey(date, checklistItemId) {
  return `${CHECKLIST_ITEM_STATE_KEY_PREFIX}${date}_${checklistItemId}`;
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
            return;
        } catch (e) {
            console.error("Error parsing progress trackers:", e);
        }
    }
    
    // If no trackers, create defaults
    progressTrackers = [
        { id: 'progress-daily', name: "Today's Progress", type: 'daily', targetPoints: 2700, isDefault: true, order: 0 },
        { id: 'progress-weekly', name: "Weekly Progress", type: 'weekly', targetPoints: 20000, isDefault: true, order: 1 }
    ];
    saveProgressTrackers();
}

function saveProgressTrackers() {
    localStorage.setItem(STORAGE_KEY_PROGRESS_TRACKERS, JSON.stringify(progressTrackers));
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
    
    currentCategories.forEach(cat => {
        if (!appContent[cat.id]) return;
        getAllTaskListFiles(appContent[cat.id]).forEach(taskList => {
            (taskList.content || []).forEach(checklistItem => {
                localStorage.removeItem(getChecklistItemStateStorageKey(dateToSave, checklistItemId));
            });
        });
    });
    
    console.log(`History finalized and individual task states cleared for ${dateToSave}.`);
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
  
  const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
  if (savedViewMode && ['large', 'medium', 'detail'].includes(savedViewMode)) {
      currentViewMode = savedViewMode;
  }

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`);
    saveDayToHistory(lastVisitDateStr);
  } else if (!lastVisitDateStr) {
    console.log("First visit or no last visit date found. Initializing for today.");
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  if ((lastVisitDateStr && lastVisitDateStr !== currentDateStr) || !localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentDateStr)) {
    updateTodaysHistoryEntry();
  }

  checkAndClearOldMonthlyData();
  archiveExpiredTrackers();
  loadCurrentDayNote(); 
  
  calendarDisplayDate = new Date(); 
  calendarDisplayDate.setDate(1); 
  calendarDisplayDate.setHours(0,0,0,0); 
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
  scheduleMidnightTask();
}

function handleMidnightReset() {
    console.log("Midnight reset triggered.");
    const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); 
    
    if (!dateThatJustEnded) {
        console.error("Cannot perform midnight reset: last visit date unknown.");
        scheduleMidnightTask(); 
        return;
    }

    saveDayToHistory(dateThatJustEnded);

    const newCurrentDate = getTodayDateString();
    localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, newCurrentDate);
    
    updateTodaysHistoryEntry();

    if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = ''; 
    loadCurrentDayNote();
    
    updateAllProgress();
    archiveExpiredTrackers();
    
    scheduleMidnightTask(); 
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
    const found = findItemAndParent(id);
    const parentId = found?.parent?.id;

    if (type === 'progressTracker') {
         itemToDelete = { type, id };
    } else {
        itemToDelete = { type, id, nameForConfirmation, parentId };
    }
    
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('opening');
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message;
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
            if (e.target === tabButton && !optionsIcon.contains(e.target)) { 
                tabButton.classList.add('show-badge-highlight');
                setTimeout(() => tabButton.classList.remove('show-badge-highlight'), 300);
            }
            switchTab(category.id);
        });
        if (addCatButton) {
            domElements.tabs.insertBefore(tabButton, addCatButton);
        } else {
            domElements.tabs.appendChild(tabButton);
        }
    });
    updateCategoryTabIndicators();
}

function updateCategoryTabIndicators() {
    const today = getTodayDateString();
    if (!domElements.tabs) return;

    currentCategories.forEach(category => {
        const tabButton = domElements.tabs.querySelector(`#tab-button-${category.id}`);
        if (!tabButton || category.type !== 'standard') {
            if (tabButton) {
                tabButton.classList.remove('category-complete-indicator');
            }
            return;
        }
        
        const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        
        let totalItems = 0;
        let completedItems = 0;

        allCategoryTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalItems += checklistItems.length;
            completedItems += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        });

        if (totalItems > 0 && completedItems === totalItems) {
            tabButton.classList.add('category-complete-indicator');
        } else {
            tabButton.classList.remove('category-complete-indicator');
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

function calculateProgressForDate(dateString, standardOnlyStats = false, targetPoints) {
  let completedCount = 0;
  let totalChecklistItemsForCalc = 0;
  let totalStandardChecklistItemsCount = 0;

  currentCategories.forEach(category => {
    const isStandardCategory = category.type === 'standard';
    const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];

    allCategoryTaskLists.forEach(taskList => {
        const checklistItems = taskList.content || [];
        const completedItems = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateString, ci.id)) === 'true').length;

        if (isStandardCategory) {
            totalStandardChecklistItemsCount += checklistItems.length;
        }
        
        if (standardOnlyStats) {
            if (isStandardCategory) {
                totalChecklistItemsForCalc += checklistItems.length;
                completedCount += completedItems;
            }
        } else {
            totalChecklistItemsForCalc += checklistItems.length;
            completedCount += completedItems;
        }
    });
  });

  const percentage = totalStandardChecklistItemsCount > 0 ? Math.round((completedCount / totalStandardChecklistItemsCount) * 100) : 0;
  const pointsPerTask = totalStandardChecklistItemsCount > 0 ? targetPoints / totalStandardChecklistItemsCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);
  
  return { 
    percentage, pointsEarned, completedCount,
    totalTasks: totalChecklistItemsForCalc, totalStandardTasks: totalStandardChecklistItemsCount
  };
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

        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'dashboard-category-summary';

        summaryDiv.innerHTML = `
            <h3>${category.name}</h3>
            <p class="category-stats">${completedItems} / ${totalItems}</p>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;

        const fillEl = summaryDiv.querySelector('.progress-bar-fill');
        fillEl.style.width = `${percentage}%`;

        if (currentTheme === 'original') {
            fillEl.style.backgroundImage = getProgressGradient(percentage);
        } else {
            fillEl.style.backgroundColor = getProgressFillColor(percentage);
        }

        if (totalItems > 0 && completedItems === totalItems) {
            summaryDiv.querySelector('.category-stats').classList.add('fully-completed');
        }

        domElements.dashboardSummaries.appendChild(summaryDiv);
    });
}

function updateAllProgress() {
  if (currentActiveViewId === 'main') {
      renderMainProgressBars();
  }
  if (currentActiveViewId === 'activity-dashboard') {
    updateDashboardSummaries(); 
  }
  updateCategoryTabIndicators();
  renderCalendar(); 
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
        } else {
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `View history for ${monthName} ${day}`);
            cell.addEventListener('click', () => openHistoryModal(dateString));
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    openHistoryModal(dateString);
                }
            });

            // Add progress fill
            const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
            const historyData = localStorage.getItem(historyKey);
            if (historyData) {
                try {
                    const entry = JSON.parse(historyData);
                    const percentage = entry.percentageCompleted || 0;
                    const fillEl = cell.querySelector('.calendar-day-fill');
                    if (fillEl) {
                        fillEl.style.height = `${percentage}%`;
                        fillEl.style.backgroundColor = getProgressFillColor(percentage);
                    }
                    if (percentage > 75) {
                        cell.classList.add('high-fill');
                    }
                } catch(e) { console.error(`Error parsing history for ${dateString}:`, e); }
            }
        }
        domElements.calendarGrid.appendChild(cell);
    }
}

function openHistoryModal(dateString) {
    if (!domElements.historyModal) return;

    currentModalDate = dateString;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const isToday = dateString === getTodayDateString();
    let historyEntry = null;

    // Ensure today's history is up-to-date before displaying
    if (isToday) {
        updateTodaysHistoryEntry();
    }
    
    const historyDataString = localStorage.getItem(historyKey);
    if (historyDataString) {
        try {
            historyEntry = JSON.parse(historyDataString);
        } catch (e) {
            console.error(`Could not parse history for ${dateString}`, e);
            return;
        }
    }
    
    if (!historyEntry) {
        alert("No history found for this date.");
        return;
    }

    const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    domElements.historyModalDate.textContent = formattedDate;

    // Stats
    const points = historyEntry.pointsEarned || 0;
    const totalPoints = historyEntry.dailyTargetPoints || progressTrackers.find(t=>t.type==='daily')?.targetPoints || 2700;
    const percentage = historyEntry.percentageCompleted || 0;

    domElements.historyModalPointsValue.textContent = points;
    domElements.historyModalPointsTotal.textContent = totalPoints;
    domElements.historyPercentageProgressFill.style.width = `${percentage}%`;
    domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(percentage);
    domElements.historyPercentageProgressFill.textContent = `${percentage}%`;
    domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', percentage);

    // Completed Tasks
    domElements.historyTasksList.innerHTML = '';
    let hasCompletedTasks = false;
    if (historyEntry.completedTaskStructure) {
        Object.values(historyEntry.completedTaskStructure).forEach(catData => {
            if (catData.tasks && catData.tasks.length > 0) {
                hasCompletedTasks = true;
                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                
                const catTitle = document.createElement('h4');
                catTitle.className = 'history-category-title';
                catTitle.textContent = catData.name;
                if(catData.type === 'special') catTitle.classList.add('special-history-title');
                catGroup.appendChild(catTitle);

                const ul = document.createElement('ul');
                catData.tasks.forEach(taskText => {
                    const li = document.createElement('li');
                    li.textContent = taskText;
                    ul.appendChild(li);
                });
                catGroup.appendChild(ul);
                domElements.historyTasksList.appendChild(catGroup);
            }
        });
    }
    if (!hasCompletedTasks) {
        domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    }
    domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks);

    // Reflection Note
    const userNote = historyEntry.userNote || '';
    domElements.historyUserNoteDisplay.textContent = userNote;
    domElements.historyUserNoteEdit.value = userNote;
    
    domElements.expandReflectionButton.classList.toggle('hidden', !userNote);

    // Only today's note can be edited from this view
    const isEditable = isToday;
    domElements.historyUserNoteDisplay.classList.toggle('hidden', isEditable);
    domElements.historyUserNoteEdit.classList.toggle('hidden', !isEditable);
    domElements.historicalNoteControls.classList.toggle('hidden', !isEditable);
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';


    domElements.historyModal.classList.add('opening');
    domElements.historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
    if (domElements.historyModal) {
        domElements.historyModal.classList.add('hidden');
        domElements.historyModal.classList.remove('opening');
    }
    currentModalDate = null;
}

function saveHistoricalNote() {
    if (!currentModalDate) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry = {};
    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Also update the main note input if we're editing today's note
    if (currentModalDate === getTodayDateString()) {
        domElements.dailyNoteInput.value = noteContent;
    }

    if (domElements.historicalNoteStatus) {
        domElements.historicalNoteStatus.textContent = 'Saved!';
        setTimeout(() => {
            if(domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
        }, 1500);
    }
}

function clearHistoricalNote() {
    if (!currentModalDate || !confirm("Are you sure you want to clear this reflection?")) return;
    domElements.historyUserNoteEdit.value = '';
    saveHistoricalNote();
}


function toggleMonthYearPicker() {
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        renderMonthYearPicker();
        domElements.monthYearPickerModal.classList.add('opening');
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else {
        closeMonthYearPicker();
    }
}

function closeMonthYearPicker() {
    isMonthYearPickerOpen = false;
    if (domElements.monthYearPickerModal) {
        domElements.monthYearPickerModal.classList.add('hidden');
        domElements.monthYearPickerModal.classList.remove('opening');
    }
}

function renderMonthYearPicker() {
    if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return;

    // Render months
    domElements.pickerMonthsGrid.innerHTML = '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((month, index) => {
        const monthEl = document.createElement('button');
        monthEl.className = 'month-option';
        monthEl.textContent = month;
        monthEl.dataset.month = index;
        if (index === pickerSelectedMonth) {
            monthEl.classList.add('selected');
        }
        monthEl.addEventListener('click', () => handleSelectMonthOrYear('month', index));
        domElements.pickerMonthsGrid.appendChild(monthEl);
    });

    // Render years
    domElements.pickerYearsList.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 1; year >= currentYear - 5; year--) {
        const yearEl = document.createElement('button');
        yearEl.className = 'year-option';
        yearEl.textContent = year;
        yearEl.dataset.year = year;
        if (year === pickerSelectedYear) {
            yearEl.classList.add('selected');
        }
        yearEl.addEventListener('click', () => handleSelectMonthOrYear('year', year));
        domElements.pickerYearsList.appendChild(yearEl);
    }
}

function handleSelectMonthOrYear(type, value) {
    if (type === 'month') {
        pickerSelectedMonth = value;
    } else {
        pickerSelectedYear = value;
    }
    
    // Update display immediately for better feedback
    const tempDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1);
    domElements.calendarMonthYear.textContent = `${tempDate.toLocaleString('default', { month: 'long' })} ${pickerSelectedYear}`;
    
    // Mark the new selections in the picker
    renderMonthYearPicker();

    // Set the calendar date and close the picker
    calendarDisplayDate.setFullYear(pickerSelectedYear, pickerSelectedMonth, 1);
    renderCalendar();
    closeMonthYearPicker();
}

function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea) return;
    domElements.fullscreenContentModal.classList.add('opening');
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    let historyEntry = null;
    const isToday = date === getTodayDateString();

    if (isToday) { 
        if (!localStorage.getItem(historyKey)) updateTodaysHistoryEntry();
        historyEntry = JSON.parse(localStorage.getItem(historyKey));
    } else { 
        const historyDataString = localStorage.getItem(historyKey);
        if (historyDataString) {
          try { historyEntry = JSON.parse(historyDataString); } catch (e) { return; }
        }
    }

    if (!historyEntry) { domElements.fullscreenModalArea.innerHTML = '<p>No content available for this day.</p>'; domElements.fullscreenContentModal.classList.remove('hidden'); return; }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    domElements.fullscreenModalArea.innerHTML = ''; 

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTaskStructure) {
            Object.values(historyEntry.completedTaskStructure).forEach(catData => {
                if(catData.tasks && catData.tasks.length > 0) {
                    hasContent = true;
                    const catGroup = document.createElement('div');
                    catGroup.className = 'history-category-group';
                    catGroup.innerHTML = `<h4 class="history-category-title">${catData.name}</h4>`;
                    const ul = document.createElement('ul');
                    catData.tasks.forEach(taskText => { ul.innerHTML += `<li><span>${taskText}</span></li>`; });
                    catGroup.appendChild(ul);
                    domElements.fullscreenModalArea.appendChild(catGroup);
                }
            });
        }
        if (!hasContent) domElements.fullscreenModalArea.innerHTML = '<p>No tasks completed on this day.</p>';
    } else if (type === 'reflection') {
        domElements.fullscreenModalTitle.textContent = `Reflection for ${formattedDate}`;
        if (historyEntry.userNote) {
            const pre = document.createElement('pre');
            pre.textContent = historyEntry.userNote; 
            domElements.fullscreenModalArea.appendChild(pre);
        } else domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded for this day.</p>';
    }
    currentFullscreenContent = { type, date };
    domElements.fullscreenContentModal.classList.remove('hidden');
}


function closeFullscreenContentModal() {
    if (domElements.fullscreenContentModal) {
        domElements.fullscreenContentModal.classList.add('hidden');
        domElements.fullscreenContentModal.classList.remove('opening');
    }
    currentFullscreenContent = null;
}

function openChooseCategoryTypeModal() {
    tempItemCreationData = {};
    if (domElements.chooseCategoryTypeModal) {
        domElements.chooseCategoryTypeModal.classList.add('opening');
        domElements.chooseCategoryTypeModal.classList.remove('hidden');
    }
    if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.focus();
}
function closeChooseCategoryTypeModal() {
    if (domElements.chooseCategoryTypeModal) {
        domElements.chooseCategoryTypeModal.classList.add('hidden');
        domElements.chooseCategoryTypeModal.classList.remove('opening');
    }
}
function handleSelectCategoryType(type) {
    tempItemCreationData = { itemType: 'category', categoryType: type };
    closeChooseCategoryTypeModal();
    const defaultName = generateDefaultName('category', currentCategories);
    openNameEntryModal('create', 'category', null, defaultName);
}

// Theme Management
const THEMES = [
    { id: 'original', name: 'Original Theme' },
    { id: 'power-safe', name: 'Save Mode' },
    { id: 'flip-clock', name: 'Dark Theme' }
];

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    currentTheme = theme;
}

function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    applyTheme(theme);
    updateAllProgress(); // Re-render elements with dynamic colors
}

function toggleThemeDropdown() {
    const container = domElements.appearanceMenuItemContainer;
    if (!container) return;
    const isOpen = container.classList.toggle('open');
    if (isOpen) {
        renderThemeDropdown();
    }
}

function renderThemeDropdown() {
    const container = domElements.themeDropdownContainer;
    if (!container) return;

    container.innerHTML = '';
    THEMES.forEach(theme => {
        const optionButton = document.createElement('button');
        optionButton.className = 'theme-option-button';
        optionButton.dataset.themeId = theme.id;
        
        const isActive = theme.id === currentTheme;
        if (isActive) {
            optionButton.classList.add('active');
        }

        optionButton.innerHTML = `
            <span>${theme.name}</span>
            <span class="theme-active-indicator"></span>
        `;
        
        optionButton.addEventListener('click', () => {
            saveTheme(theme.id);
            renderThemeDropdown(); // Re-render to update the active dot
        });
        
        container.appendChild(optionButton);
    });
}


function generateDefaultName(type, parentList) {
    const baseNameMap = {
        folder: 'New Folder',
        note: 'Note File',
        tasklist: 'Task List',
        category: 'New Category'
    };
    const baseName = baseNameMap[type] || 'New Item';
    let counter = 1;
    let newName = `${baseName} ${counter}`;
    
    const existingNames = new Set(parentList.map(item => item.name));

    while (existingNames.has(newName)) {
        counter++;
        newName = `${baseName} ${counter}`;
    }
    return newName;
}

function openNameEntryModal(mode, type, existingItem = null, defaultName = '') {
    if (!domElements.nameEntryModal) return;
    domElements.nameEntryModal.classList.add('opening');
    
    // Merge with existing data for multi-step flows (like category creation)
    tempItemCreationData = { ...tempItemCreationData, mode, type, existingItem };

    let title = 'Name Your Item';
    let cta = 'Confirm';
    let placeholder = 'Enter name';
    let existingName = '';

    if (mode === 'create') {
        title = `Create New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        cta = `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        placeholder = `Enter ${type} name`;
    } else if (mode === 'rename' && existingItem) {
        title = `Rename ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        cta = 'Rename';
        existingName = existingItem.name;
    } else if (mode === 'rename_category' && existingItem) {
        title = `Rename Category`;
        cta = 'Rename';
        existingName = existingItem.name;
    }

    domElements.nameEntryTitle.textContent = title;
    domElements.confirmNameEntryButton.textContent = cta;
    domElements.nameEntryInput.placeholder = placeholder;
    domElements.nameEntryInput.value = existingName || defaultName;

    domElements.nameEntryModal.classList.remove('hidden');
    domElements.nameEntryInput.focus();
    domElements.nameEntryInput.select();
}
function closeNameEntryModal() {
    if (domElements.nameEntryModal) {
        domElements.nameEntryModal.classList.add('hidden');
        domElements.nameEntryModal.classList.remove('opening');
    }
    tempItemCreationData = null;
}
function handleConfirmNameEntry() {
    if (!tempItemCreationData || !domElements.nameEntryInput) return;
    const name = domElements.nameEntryInput.value.trim();
    if (!name) { alert("Name cannot be empty."); return; }

    const { mode, type, existingItem, categoryType } = tempItemCreationData;

    if (type === 'category') {
        if (mode === 'create') {
            if (currentCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                alert(`A category named "${name}" already exists.`);
                return;
            }
            const newCategory = {
                id: createUniqueId('cat'), name: name, order: currentCategories.length,
                deletable: true, type: categoryType || 'standard'
            };
            currentCategories.push(newCategory);
            saveUserCategories(currentCategories);
            appContent[newCategory.id] = [];
            saveAppContent();
            renderTabs();
            renderAllCategorySections();
            switchTab(newCategory.id);
        } else if (mode === 'rename_category' && existingItem) {
            const category = currentCategories.find(c => c.id === existingItem.id);
            if (category) {
                 if (currentCategories.some(c => c.id !== category.id && c.name.toLowerCase() === name.toLowerCase())) {
                    alert(`A category named "${name}" already exists.`);
                    return;
                }
                category.name = name;
                saveUserCategories(currentCategories);
                
                const tabButton = document.getElementById(`tab-button-${category.id}`);
                if (tabButton && tabButton.firstChild.nodeType === Node.TEXT_NODE) {
                    tabButton.firstChild.nodeValue = name;
                }
                const categorySection = document.querySelector(`#category-section-${category.id}`);
                if(categorySection) {
                    const titleEl = categorySection.querySelector('.category-title-text');
                    if (titleEl) titleEl.textContent = name;
                }
            }
        }
        closeNameEntryModal();
        return;
    }

    let itemWasChanged = false;
    if (mode === 'create') {
        const parentList = getItemsForPath(currentPath);
        const newItem = {
            id: createUniqueId(type), name: name, type: type, order: parentList.length
        };
        if (type === 'folder') newItem.content = [];
        else if (type === 'note') newItem.content = '';
        else if (type === 'tasklist') newItem.content = [];
        parentList.push(newItem);
        itemWasChanged = true;
    } else if (mode === 'rename' && existingItem) {
        const found = findItemAndParent(existingItem.id);
        if (found) {
            found.item.name = name;
            itemWasChanged = true;
            const itemEl = document.querySelector(`.item[data-item-id="${existingItem.id}"]`);
            if (itemEl) {
                const nameEl = itemEl.querySelector('.item-name');
                if (nameEl) nameEl.textContent = name;
            }
        }
    }
    
    if (itemWasChanged) {
        saveAppContent();
        if (mode === 'create') { // Only re-render grid for new items
           renderCategorySectionContent(currentPath[0].id);
        }
        updateAllProgress();
    }
    closeNameEntryModal();
}


// Hamburger Menu Logic
function toggleSidePanel() {
    const isOpen = domElements.hamburgerButton.classList.toggle('open');
    domElements.hamburgerButton.setAttribute('aria-expanded', isOpen.toString());
    domElements.sidePanelMenu.classList.toggle('open');
    domElements.sidePanelMenu.setAttribute('aria-hidden', (!isOpen).toString());
    domElements.sidePanelOverlay.classList.toggle('hidden', !isOpen);

    if (isOpen) {
        const menuItems = domElements.sidePanelMenu.querySelectorAll('.side-panel-item');
        menuItems.forEach(item => item.classList.remove('active-menu-item'));
        
        let activeMenuItem = null;
        if (currentActiveViewId === 'main') {
            activeMenuItem = domElements.menuMainView;
        } else if (currentActiveViewId === 'activity-dashboard') {
            activeMenuItem = domElements.menuActivityDashboard;
        } else if (currentActiveViewId === 'progress-management') {
            activeMenuItem = domElements.menuProgressManagement;
        }
        
        if (activeMenuItem) {
             activeMenuItem.classList.add('active-menu-item');
        } else {
            // If it's the appearance dropdown, we don't highlight it as "active" since it's not a view
            const mainViewButton = domElements.sidePanelMenu.querySelector('#menu-main-view');
            if(mainViewButton) mainViewButton.classList.add('active-menu-item');
        }
        
        const firstItem = domElements.sidePanelMenu.querySelector('.side-panel-item');
        if(firstItem) firstItem.focus();
    } else {
        domElements.hamburgerButton.focus();
    }
}

function showMainAppView() {
    currentActiveViewId = 'main';
    domElements.progressManagementView.classList.add('hidden');
    domElements.appViewWrapper.classList.remove('hidden');
    
    if (domElements.mainContentWrapper) domElements.mainContentWrapper.classList.remove('hidden');
    if (domElements.dashboardColumn) domElements.dashboardColumn.classList.add('hidden');

    switchTab(activeTabId || 'dashboard');
    updateAllProgress();
}

function showActivityDashboardView() {
    currentActiveViewId = 'activity-dashboard';
    domElements.progressManagementView.classList.add('hidden');
    domElements.appViewWrapper.classList.remove('hidden');
    
    if (domElements.mainContentWrapper) domElements.mainContentWrapper.classList.add('hidden');
    if (domElements.dashboardColumn) {
        domElements.dashboardColumn.classList.remove('hidden');
        updateDashboardSummaries(); 
    }
}

function showProgressManagementView() {
    currentActiveViewId = 'progress-management';
    domElements.appViewWrapper.classList.add('hidden');
    domElements.progressManagementView.classList.remove('hidden');
    renderProgressManagementList();
}


// Drag and Drop Handlers
function handleDragStart(e, item) {
    draggedItemId = item.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, targetFolder) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetFolder.id) return;

    let tempPath = currentPath.slice();
    tempPath.push(targetFolder);
    if(tempPath.some(p => p.id === draggedId)) {
        alert("Cannot move a folder into itself or one of its children.");
        return;
    }

    const { item: draggedItem, parent: sourceParent } = findItemAndParent(draggedId);
    if (!draggedItem || !sourceParent) return;

    const sourceList = sourceParent.id === currentPath[0].id ? appContent[sourceParent.id] : sourceParent.content;
    const itemIndex = sourceList.findIndex(i => i.id === draggedId);
    if(itemIndex > -1) sourceList.splice(itemIndex, 1);
    
    if (!targetFolder.content) targetFolder.content = [];
    targetFolder.content.push(draggedItem);

    saveAppContent();
    renderCategorySectionContent(currentPath[0].id);
}

// Progress Management Implementation
function renderProgressManagementList() {
    const activeTrackers = progressTrackers.filter(t => !t.isArchived).sort((a,b) => a.order - b.order);
    const archivedTrackers = progressTrackers.filter(t => t.isArchived).sort((a, b) => new Date(getTrackerDateRange(b).endDate) - new Date(getTrackerDateRange(a).endDate));
    
    domElements.activeProgressList.innerHTML = '';
    activeTrackers.forEach(tracker => {
        const item = document.createElement('div');
        item.className = 'progress-tracker-item';
        const { startDate, endDate } = getTrackerDateRange(tracker);
        const dateString = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        const typeString = tracker.type.charAt(0).toUpperCase() + tracker.type.slice(1);

        item.innerHTML = `
            <div class="progress-tracker-info">
                <h4>${tracker.name}</h4>
                <p>${typeString} (${dateString})</p>
            </div>
            <div class="progress-tracker-actions">
                <button class="icon-button" data-action="edit" title="Edit"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                <button class="icon-button" data-action="reset" title="Reset"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path></svg></button>
                <button class="icon-button" data-action="delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
            </div>
        `;
        
        const deleteBtn = item.querySelector('[data-action="delete"]');
        if (tracker.isDefault) deleteBtn.disabled = true;
        else deleteBtn.addEventListener('click', () => showDeleteConfirmation('progressTracker', tracker.id, `Are you sure you want to delete the "${tracker.name}" progress tracker?`));
        
        item.querySelector('[data-action="edit"]').addEventListener('click', () => openProgressEditorModal('edit', tracker.id));
        item.querySelector('[data-action="reset"]').addEventListener('click', () => handleResetProgressTracker(tracker.id));
        domElements.activeProgressList.appendChild(item);
    });

    domElements.archivedProgressList.innerHTML = '';
    archivedTrackers.forEach(tracker => {
        const item = renderProgressHistoryItem(tracker);
        domElements.archivedProgressList.appendChild(item);
    });
}

function renderProgressHistoryItem(tracker) {
    const item = document.createElement('div');
    item.className = 'progress-history-item';
    
    const { startDate, endDate } = getTrackerDateRange(tracker);
    const dateString = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    
    const { pointsEarned, targetPoints, percentage } = calculateProgressForTracker(tracker);
    const isCompleted = percentage >= 100;

    item.innerHTML = `
        <div class="progress-history-item-header">
            <h4>${tracker.name}</h4>
            <span class="progress-status ${isCompleted ? 'progress-status-completed' : 'progress-status-incomplete'}">
                ${isCompleted ? 'Completed' : 'Incomplete'}
            </span>
        </div>
        <p class="points-stat">${dateString}</p>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${percentage}%; background-image: ${getProgressGradient(percentage)};"></div>
        </div>
        <p class="points-stat">${pointsEarned} / ${targetPoints} points (${percentage}%)</p>
    `;
    
    item.addEventListener('click', () => openProgressHistoryDetailModal(tracker.id));
    return item;
}

function openProgressEditorModal(mode, trackerId = null) {
    currentlyEditingProgressTrackerId = mode === 'edit' ? trackerId : null;
    const tracker = trackerId ? progressTrackers.find(t => t.id === trackerId) : null;

    domElements.progressEditorTitle.textContent = mode === 'edit' ? 'Edit Progress Tracker' : 'Add New Progress Tracker';
    domElements.saveProgressButton.textContent = mode === 'edit' ? 'Save Changes' : 'Create Tracker';

    domElements.progressNameInput.value = tracker ? tracker.name : '';
    domElements.progressTargetInput.value = tracker ? tracker.targetPoints : '';
    domElements.progressTypeSelect.value = tracker ? tracker.type : 'daily';
    
    if (tracker && tracker.isDefault) {
        domElements.progressTypeSelect.disabled = true;
    } else {
        domElements.progressTypeSelect.disabled = false;
    }

    if (tracker && tracker.type === 'custom') {
        domElements.progressStartDate.value = tracker.startDate;
        domElements.progressEndDate.value = tracker.endDate;
        domElements.progressCustomDatesContainer.classList.remove('hidden');
    } else {
        domElements.progressCustomDatesContainer.classList.add('hidden');
    }

    domElements.progressEditorModal.classList.add('opening');
    domElements.progressEditorModal.classList.remove('hidden');
    domElements.progressNameInput.focus();
}

function closeProgressEditorModal() {
    domElements.progressEditorModal.classList.add('hidden');
    domElements.progressEditorModal.classList.remove('opening');
    currentlyEditingProgressTrackerId = null;
}

function handleSaveProgressTracker() {
    const name = domElements.progressNameInput.value.trim();
    const targetPoints = parseInt(domElements.progressTargetInput.value, 10);
    const type = domElements.progressTypeSelect.value;
    
    if (!name || isNaN(targetPoints) || targetPoints <= 0) {
        alert("Please enter a valid name and a positive number for target points.");
        return;
    }

    if (currentlyEditingProgressTrackerId) { // Edit mode
        const tracker = progressTrackers.find(t => t.id === currentlyEditingProgressTrackerId);
        if (tracker) {
            tracker.name = name;
            tracker.targetPoints = targetPoints;
            if (!tracker.isDefault) {
                tracker.type = type;
                if (type === 'custom') {
                    tracker.startDate = domElements.progressStartDate.value;
                    tracker.endDate = domElements.progressEndDate.value;
                }
            }
        }
    } else { // Create mode
        const newTracker = {
            id: createUniqueId('progress'),
            name,
            targetPoints,
            type,
            isDefault: false,
            isArchived: false,
            order: progressTrackers.length
        };
        if (type === 'custom') {
            newTracker.startDate = domElements.progressStartDate.value;
            newTracker.endDate = domElements.progressEndDate.value;
            if (!newTracker.startDate || !newTracker.endDate || newTracker.endDate < newTracker.startDate) {
                alert("Please provide a valid start and end date for the custom tracker.");
                return;
            }
        }
        progressTrackers.push(newTracker);
    }

    archiveExpiredTrackers(); // Re-check archiving status after edits
    saveProgressTrackers();
    renderProgressManagementList();
    renderMainProgressBars();
    closeProgressEditorModal();
}

function handleResetProgressTracker(trackerId) {
    alert("Reset functionality is being developed. For now, you can edit the tracker's dates to restart it.");
}

function renderMainProgressBars() {
    if (!domElements.mobileProgressLocation) return;
    domElements.mobileProgressLocation.innerHTML = '';
    
    const activeTrackers = progressTrackers.filter(t => !t.isArchived).sort((a,b) => a.order - b.order);

    activeTrackers.forEach(tracker => {
        const { pointsEarned, targetPoints, percentage } = calculateProgressForTracker(tracker);
        
        const container = document.createElement('div');
        container.className = 'progress-container';
        
        container.innerHTML = `
            <h3>${tracker.name}</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" role="progressbar" aria-valuemin="0" aria-valuemax="${targetPoints}" aria-valuenow="${pointsEarned}">${percentage}%</div>
            </div>
            <p class="points-stat">${pointsEarned} / ${targetPoints} points</p>
        `;

        const fill = container.querySelector('.progress-bar-fill');
        fill.style.width = `${percentage}%`;
        fill.style.backgroundColor = getProgressFillColor(percentage);

        domElements.mobileProgressLocation.appendChild(container);
    });
}

function getTrackerDateRange(tracker) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate, endDate;

    switch (tracker.type) {
        case 'daily':
            startDate = today;
            endDate = today;
            break;
        case 'weekly':
            startDate = new Date(today);
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
            startDate.setDate(diff);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
        case 'monthly':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'custom':
            startDate = new Date(tracker.startDate + 'T00:00:00');
            endDate = new Date(tracker.endDate + 'T00:00:00');
            break;
    }
    return { startDate, endDate };
}

function calculateProgressForTracker(tracker) {
    const { startDate, endDate } = getTrackerDateRange(tracker);
    const today = getNormalizedDate(new Date());
    let totalPointsEarned = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d > today && tracker.type !== 'daily') break;
        
        const dateString = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        const dailyTarget = progressTrackers.find(t => t.type === 'daily')?.targetPoints || 2700;
        
        if (d.getTime() === today.getTime()) {
            totalPointsEarned += calculateProgressForDate(dateString, true, dailyTarget).pointsEarned;
        } else {
            const historyData = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
            if (historyData) {
                try {
                    const entry = JSON.parse(historyData);
                    totalPointsEarned += (entry.pointsEarned || 0);
                } catch (e) {
                    console.error(`Failed to parse history for tracker calc on ${dateString}`, e);
                }
            }
        }
    }
    
    const targetPoints = tracker.targetPoints;
    const percentage = targetPoints > 0 ? Math.min(100, Math.round((totalPointsEarned / targetPoints) * 100)) : 0;
    
    return { pointsEarned: totalPointsEarned, targetPoints, percentage };
}

function archiveExpiredTrackers() {
    const today = getNormalizedDate(new Date());
    let wasChanged = false;
    progressTrackers.forEach(tracker => {
        if (tracker.isDefault || tracker.isArchived) return;
        const { endDate } = getTrackerDateRange(tracker);
        if (endDate < today) {
            tracker.isArchived = true;
            wasChanged = true;
        }
    });
    if (wasChanged) {
        saveProgressTrackers();
    }
}

function openProgressHistoryDetailModal(trackerId) {
    const tracker = progressTrackers.find(t => t.id === trackerId);
    if (!tracker) return;
    activeProgressDetailTracker = tracker;

    domElements.progressHistoryDetailTitle.textContent = `Details for ${tracker.name}`;
    renderProgressHistoryCalendar();
    renderProgressDailySummary(null); // Render empty initially
    domElements.progressHistoryDetailModal.classList.add('opening');
    domElements.progressHistoryDetailModal.classList.remove('hidden');
}

function closeProgressHistoryDetailModal() {
    domElements.progressHistoryDetailModal.classList.add('hidden');
    domElements.progressHistoryDetailModal.classList.remove('opening');
    activeProgressDetailTracker = null;
}

function renderProgressHistoryCalendar() {
    if (!activeProgressDetailTracker) return;
    const { startDate, endDate } = getTrackerDateRange(activeProgressDetailTracker);
    const calendarView = domElements.progressHistoryCalendarView;
    calendarView.innerHTML = `<div id="progress-history-calendar-grid" class="calendar-grid"></div>`;
    const grid = calendarView.querySelector('#progress-history-calendar-grid');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        const day = d.getDate();

        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        cell.dataset.date = dateString;
        
        const historyData = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
        let percentage = 0;
        if (historyData) {
            try {
                percentage = JSON.parse(historyData).percentageCompleted || 0;
            } catch(e) {/* ignore */}
        }
        
        cell.innerHTML = `
            <span class="calendar-day-number">${day}</span>
            <div class="calendar-day-fill" style="height: 100%; opacity: 0.3; background-color: ${getProgressFillColor(percentage)};"></div>
        `;
        
        cell.addEventListener('click', () => {
            grid.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
            cell.classList.add('selected');
            renderProgressDailySummary(dateString);
        });
        grid.appendChild(cell);
    }
}

function renderProgressDailySummary(dateString) {
    const summaryView = domElements.progressHistoryDailySummary;
    if (!dateString) {
        summaryView.innerHTML = '<p>Select a date from the calendar to see details.</p>';
        return;
    }
    
    const historyData = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
    if (!historyData) {
        summaryView.innerHTML = '<p>No data available for this date.</p>';
        return;
    }
    
    try {
        const entry = JSON.parse(historyData);
        const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
        
        let tasksHtml = '<ul>';
        if (entry.completedTaskStructure && Object.keys(entry.completedTaskStructure).length > 0) {
            Object.values(entry.completedTaskStructure).forEach(cat => {
                tasksHtml += cat.tasks.map(task => `<li>${task}</li>`).join('');
            });
        } else {
            tasksHtml += '<li>No tasks completed.</li>';
        }
        tasksHtml += '</ul>';

        summaryView.innerHTML = `
            <div class="daily-summary-card">
                <h4>Daily Summary: ${formattedDate}</h4>
                <p class="points-stat">${entry.pointsEarned || 0} / ${entry.dailyTargetPoints || 2700} points</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${entry.percentageCompleted || 0}%; background-image: ${getProgressGradient(entry.percentageCompleted || 0)};"></div>
                </div>
                <div class="daily-summary-tasks">
                    <h5>Completed Tasks</h5>
                    ${tasksHtml}
                </div>
            </div>
        `;
    } catch(e) {
        summaryView.innerHTML = '<p>Error loading data for this date.</p>';
    }
}


function showCategoryContextMenu(categoryId, targetElement) {
    hideItemContextMenu();
    const menu = domElements.categoryTabContextMenu;
    if (!menu) return;

    currentContextMenuTargetTab = targetElement;
    const rect = targetElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    
    const category = currentCategories.find(c => c.id === categoryId);
    if(category && category.deletable === false) {
        menu.querySelector('#ctx-delete-category').disabled = true;
    } else {
        menu.querySelector('#ctx-delete-category').disabled = false;
    }

    menu.dataset.categoryId = categoryId;
    menu.classList.remove('hidden');
    menu.querySelector('button').focus();
}

function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) {
        domElements.categoryTabContextMenu.classList.add('hidden');
    }
    if (currentContextMenuTargetTab) {
        const icon = currentContextMenuTargetTab.querySelector('.tab-options-icon');
        if (icon) icon.classList.remove('visible');
    }
    currentContextMenuTargetTab = null;
}

function showItemContextMenu(targetElement, item) {
    hideCategoryContextMenu();
    if(itemContextMenu.element) { hideItemContextMenu(); }
    
    const popover = document.createElement('div');
    popover.className = 'context-menu item-options-popover';
    
    popover.innerHTML = `
        <button data-action="rename">Rename</button>
        <button data-action="delete">Delete</button>
    `;
    popover.querySelector('[data-action="rename"]').onclick = () => {
        openNameEntryModal('rename', item.type, item);
        hideItemContextMenu();
    };
    popover.querySelector('[data-action="delete"]').onclick = () => {
        showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}?`);
        hideItemContextMenu();
    };
    
    document.body.appendChild(popover);
    const rect = targetElement.getBoundingClientRect();
    popover.style.top = `${rect.bottom + 2}px`;
    popover.style.left = `${rect.left}px`;

    itemContextMenu = { element: popover, target: item.id };
    popover.querySelector('button').focus();
}

function hideItemContextMenu() {
    if (itemContextMenu.element) {
        itemContextMenu.element.remove();
        itemContextMenu = { element: null, target: null };
    }
}

function renderAllCategorySections() {
    const container = domElements.tabContent;
    if (!container) return;
    container.querySelectorAll('section.category-section').forEach(s => s.remove());

    currentCategories.forEach(category => {
        const sectionTemplate = domElements.categorySectionTemplate.content.cloneNode(true);
        const sectionElement = sectionTemplate.querySelector('section');
        sectionElement.id = `category-section-${category.id}`;
        sectionElement.setAttribute('aria-labelledby', `tab-button-${category.id}`);
        sectionElement.querySelector('.category-title-text').textContent = category.name;
        container.appendChild(sectionElement);
    });
}

// Initialization function
function initializeApp() {
  // Query all DOM elements
  for (const key in domElements) {
    const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    domElements[key] = document.getElementById(id);
  }

  loadAppData();
  
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  if (savedTheme && THEMES.map(t=>t.id).includes(savedTheme)) {
      applyTheme(savedTheme);
  } else {
      applyTheme('original');
  }

  renderTabs();
  renderAllCategorySections();
  updateAllProgress();
  showMainAppView();
  
  // Attach Event Listeners
  domElements.saveNoteButton.addEventListener('click', saveDailyNote);
  domElements.calendarPrevMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendar(); });
  domElements.calendarNextMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendar(); });
  domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
  
  // Month/Year Picker
  domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
  domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
  domElements.monthYearPickerModal.addEventListener('click', (e) => {
      if (!domElements.monthYearPickerContent.contains(e.target)) {
          closeMonthYearPicker();
      }
  });

  // History Modal Buttons
  domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
  domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));
  domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
  domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);

  // Fullscreen Modal
  domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);

  // Delete Confirmation Modal
  domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
  domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
  domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);

  // Category Creation Modals
  domElements.addCategoryButton.addEventListener('click', openChooseCategoryTypeModal);
  domElements.chooseCategoryTypeCloseButton.addEventListener('click', closeChooseCategoryTypeModal);
  domElements.selectStandardCategoryButton.addEventListener('click', () => handleSelectCategoryType('standard'));
  domElements.selectSpecialCategoryButton.addEventListener('click', () => handleSelectCategoryType('special'));
  
  // Name Entry Modal
  domElements.nameEntryCloseButton.addEventListener('click', closeNameEntryModal);
  domElements.cancelNameEntryButton.addEventListener('click', closeNameEntryModal);
  domElements.confirmNameEntryButton.addEventListener('click', handleConfirmNameEntry);
  domElements.nameEntryInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleConfirmNameEntry(); });
  
  // Category Context Menu
  domElements.ctxRenameCategory.addEventListener('click', () => {
      const categoryId = domElements.categoryTabContextMenu.dataset.categoryId;
      const category = currentCategories.find(c => c.id === categoryId);
      if(category) openNameEntryModal('rename_category', 'category', category);
      hideCategoryContextMenu();
  });
  domElements.ctxDeleteCategory.addEventListener('click', () => {
      const categoryId = domElements.categoryTabContextMenu.dataset.categoryId;
      const category = currentCategories.find(c => c.id === categoryId);
      if(category) showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}"? All its contents will be lost.`);
      hideCategoryContextMenu();
  });

  // Hamburger Menu & Side Panel
  domElements.hamburgerButton.addEventListener('click', toggleSidePanel);
  domElements.sidePanelOverlay.addEventListener('click', toggleSidePanel);
  domElements.menuMainView.addEventListener('click', () => { showMainAppView(); toggleSidePanel(); });
  domElements.menuActivityDashboard.addEventListener('click', () => { showActivityDashboardView(); toggleSidePanel(); });
  domElements.menuProgressManagement.addEventListener('click', () => { showProgressManagementView(); toggleSidePanel(); });
  domElements.menuAppearance.addEventListener('click', toggleThemeDropdown);
  
  // Main Tab
  domElements.dashboardTabButton.addEventListener('click', () => switchTab('dashboard'));

  // Note Editor
  domElements.noteEditorCloseButton.addEventListener('click', closeNoteEditorModal);
  domElements.noteAddImageButton.addEventListener('click', handleAddImageToNote);
  domElements.imageUploadInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processAndInsertImage(e.target.files[0]);
    }
  });

  // Task List
  domElements.taskListCloseButton.addEventListener('click', closeTaskListModal);
  domElements.taskListEditButton.addEventListener('click', toggleTaskListEditMode);
  domElements.taskListResetButton.addEventListener('click', handleResetTasks);
  domElements.addChecklistItemForm.addEventListener('submit', handleAddChecklistItem);

  // Progress Management
  domElements.addNewProgressButton.addEventListener('click', () => openProgressEditorModal('create'));
  domElements.progressEditorCloseButton.addEventListener('click', closeProgressEditorModal);
  domElements.saveProgressButton.addEventListener('click', handleSaveProgressTracker);
  domElements.progressTypeSelect.addEventListener('change', (e) => {
      domElements.progressCustomDatesContainer.classList.toggle('hidden', e.target.value !== 'custom');
  });
  domElements.progressHistoryDetailCloseButton.addEventListener('click', closeProgressHistoryDetailModal);

  // Global listeners
  document.addEventListener('click', (e) => {
    // Hide add action menu
    const addActionContainer = document.querySelector('.add-action-container');
    if (isAddActionMenuOpen && addActionContainer && !addActionContainer.contains(e.target)) {
        isAddActionMenuOpen = false;
        addActionContainer.classList.remove('open');
    }
    // Hide view mode menu
    const viewModeContainer = document.querySelector('.view-mode-container');
    if (viewModeContainer && viewModeContainer.classList.contains('open') && !viewModeContainer.contains(e.target)) {
        viewModeContainer.classList.remove('open');
    }
    // Hide context menus
    if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.contains(e.target) && !e.target.closest('.tab-options-icon')) {
        hideCategoryContextMenu();
    }
    if (itemContextMenu.element && !itemContextMenu.element.contains(e.target) && !e.target.closest('.item-more-options')) {
        hideItemContextMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (domElements.sidePanelMenu.classList.contains('open')) { toggleSidePanel(); }
      else if (!domElements.historyModal.classList.contains('hidden')) { closeHistoryModal(); }
      else if (!domElements.monthYearPickerModal.classList.contains('hidden')) { closeMonthYearPicker(); }
      else if (!domElements.deleteConfirmationModal.classList.contains('hidden')) { hideDeleteConfirmation(); }
      else if (!domElements.fullscreenContentModal.classList.contains('hidden')) { closeFullscreenContentModal(); }
      else if (!domElements.nameEntryModal.classList.contains('hidden')) { closeNameEntryModal(); }
      else if (!domElements.chooseCategoryTypeModal.classList.contains('hidden')) { closeChooseCategoryTypeModal(); }
      else if (!domElements.noteEditorModal.classList.contains('hidden')) { closeNoteEditorModal(); }
      else if (!domElements.taskListModal.classList.contains('hidden')) { closeTaskListModal(); }
      else if (!domElements.progressEditorModal.classList.contains('hidden')) { closeProgressEditorModal(); }
      else if (!domElements.progressHistoryDetailModal.classList.contains('hidden')) { closeProgressHistoryDetailModal(); }
      hideCategoryContextMenu();
      hideItemContextMenu();
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeApp);
