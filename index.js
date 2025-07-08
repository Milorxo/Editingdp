

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


const DAILY_TARGET_POINTS = 2700;
const TARGET_POINTS_FOR_WEEKLY_VIEW = 20000;

// Old keys (for migration)
const OLD_STORAGE_KEY_TASK_PREFIX = 'lifeTrackerTask_';
const OLD_USER_DEFINED_TASKS_KEY = 'lifeTrackerUserDefinedTasks_v2'; 

// New and existing keys
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_'; // For main daily reflection
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; 
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; // Stays same for category definitions
const APP_FOLDERS_KEY = 'lifeTrackerAppFolders_v1'; // New key for folder structures and their task definitions/note content
const TASK_STATE_STORAGE_KEY_PREFIX = 'lifeTrackerTaskState_'; // For daily completion status: taskState_{date}_{folderId}_{taskId}


let currentCategories = []; 
let foldersByCategoryId = {}; // Main data structure for folders and their content definitions

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let draggedTaskElement = null; // For tasks within a folder
let itemToDelete = null; // { type: 'task' | 'folder' | 'category', id: string, nameForConfirmation?: string, categoryId?: string, folderId?: string }
let currentCategoryView = { mode: 'folders', categoryId: null, folderId: null }; // Tracks if showing folders, task folder content, or note folder content
let currentFolderEditModes = {}; // { folderId: boolean } for task reordering/editing within a task folder
let activeAddTaskForm = null; // { categoryId, folderId, position }
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;
let longPressTimer = null; // Specifically for category tab long press
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null; // For category tabs
let currentContextMenuTargetFolderBox = null; // For folder boxes (the visual square)
let midnightTimer = null;
let tempItemCreationData = null; // Used for folder and category creation { type: 'task_folder' | 'note_folder' | 'standard_category' | 'special_category', categoryId?: string, name?: string }
let liveClockInterval = null;
let analogClockInterval = null; 
let currentActiveViewId = 'main'; // 'main', 'live-clock', 'activity-dashboard'
let isLiveClockFullscreen = false;


// DOM Elements
const domElements = {
  // Hamburger Menu & Side Panel
  hamburgerButton: null,
  sidePanelMenu: null,
  sidePanelOverlay: null,
  menuMainView: null, 
  menuLiveClock: null,
  menuActivityDashboard: null,
  
  // Live Clock View
  liveClockViewWrapper: null,
  liveClockTime: null,
  liveClockPeriod: null,
  liveClockDigitalDisplayContainer: null, 
  liveClockDate: null,
  analogClockContainer: null,
  analogClockCanvas: null,
  liveClockFullscreenButton: null,

  appViewWrapper: null, 
  mainContentWrapper: null, 
  dashboardColumnView: null, 

  mobileProgressLocation: null,

  tabsContainer: null,
  tabContentsContainer: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  folderOptionsContextMenu: null,
  ctxRenameFolderButton: null,
  ctxDeleteFolderButton: null,
  
  dashboardSummariesContainer: null,
  todayProgressFill: null,
  todayPointsStat: null,
  currentWeekProgressFill: null,
  currentWeekPointsStat: null,
  todayProgressContainer: null, 
  currentWeekProgressContainer: null, 
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
  
  // Category Type Choice Modal
  chooseCategoryTypeModal: null,
  chooseCategoryTypeCloseButton: null,
  selectStandardCategoryButton: null,
  selectSpecialCategoryButton: null,
  
  // Name Entry Modal (generalized)
  nameEntryModal: null,
  nameEntryTitle: null,
  nameEntryInput: null,
  nameEntryCloseButton: null,
  confirmNameEntryButton: null,
  cancelNameEntryButton: null,
  nameEntryActions: null,

  // Folder Type Choice Modal
  chooseFolderTypeModal: null,
  chooseFolderTypeCloseButton: null, // from HTML choose-folder-type-close-button
  chooseFolderTypeTitleText: null, // from HTML choose-folder-type-title-text
  selectTaskFolderButton: null,
  selectNoteFolderButton: null,
  
  imageUploadInput: null,
};

function getProgressFillColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120; // 0 = red, 120 = green
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

// Generates storage key for a task's daily completion status
function getTaskStateStorageKey(date, folderId, taskId) {
  return `${TASK_STATE_STORAGE_KEY_PREFIX}${date}_${folderId}_${taskId}`;
}

function updateTodaysHistoryEntry() {
    const today = getTodayDateString();
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;

    // Stats based on standard tasks
    const progressStandardOnly = calculateProgressForDate(today, true);
    
    // Task list based on all tasks
    const completedTasksTodayStruct = {}; 
    currentCategories.forEach(cat => {
      completedTasksTodayStruct[cat.id] = {};
      (foldersByCategoryId[cat.id] || []).forEach(folder => {
        if (folder.type === 'task' && folder.content && folder.content.length > 0) {
          const folderTasks = [];
          folder.content.forEach(taskDef => {
            if (localStorage.getItem(getTaskStateStorageKey(today, folder.id, taskDef.id)) === 'true') {
              folderTasks.push(taskDef.text);
            }
          });
          if (folderTasks.length > 0) {
             completedTasksTodayStruct[cat.id][folder.id] = { name: folder.name, tasks: folderTasks };
          }
        }
      });
      if(Object.keys(completedTasksTodayStruct[cat.id]).length === 0) delete completedTasksTodayStruct[cat.id];
    });

    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today) || "";

    const historyEntry = {
        date: today,
        completedTaskStructure: completedTasksTodayStruct,
        userNote: note,
        pointsEarned: progressStandardOnly.pointsEarned,
        percentageCompleted: progressStandardOnly.percentage,
        totalTasksOnDate: progressStandardOnly.totalStandardTasks,
        dailyTargetPoints: DAILY_TARGET_POINTS
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
}

// Category and Folder/Task Data Management
function loadUserCategories() {
    const storedCategories = localStorage.getItem(USER_CATEGORIES_KEY);
    let categories;
    if (storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
        } catch (e) {
            console.error("Error parsing stored categories:", e);
            categories = []; // Fallback to empty or default
        }
    } else {
        categories = [];
    }
    
    // Ensure all categories have a 'type', default to 'standard' if missing
    // and provide default deletable value
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
        type: cat.type || 'standard' // Ensure existing categories get a type
    }));
}

function saveUserCategories(categories) {
    localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order)));
}

function loadFoldersByCategoryId() {
    const storedFolders = localStorage.getItem(APP_FOLDERS_KEY);
    if (storedFolders) {
        try {
            return JSON.parse(storedFolders);
        } catch (e) {
            console.error("Error parsing stored folders:", e);
        }
    }
    return {}; // Initialize as empty if not found
}

function saveFoldersByCategoryId(folders) {
    localStorage.setItem(APP_FOLDERS_KEY, JSON.stringify(folders));
}

function migrateOldTaskStructure() {
    const oldTasksData = localStorage.getItem(OLD_USER_DEFINED_TASKS_KEY);
    if (!oldTasksData) return false; // No old data to migrate

    console.log("Old task structure found. Migrating to new folder system...");
    try {
        const oldTasksByCatId = JSON.parse(oldTasksData);
        const newFoldersByCatId = {};
        const today = getTodayDateString(); // For migrating task states for today

        currentCategories.forEach(category => {
            // Ensure category has a type; default to standard during migration
            category.type = category.type || 'standard';

            const defaultFolderId = createUniqueId(`folder-${category.id}-default`);
            const newFolder = {
                id: defaultFolderId,
                name: "Tasks", // Default folder name
                type: "task",
                categoryId: category.id,
                order: 0,
                content: [] // Task definitions
            };

            const categoryOldTasks = oldTasksByCatId[category.id] || [];
            categoryOldTasks.forEach(oldTaskDef => {
                const newTaskId = oldTaskDef.id || createUniqueId('task'); // Ensure ID exists
                newFolder.content.push({
                    id: newTaskId,
                    text: oldTaskDef.text,
                });

                const oldTaskStatusKey = `${OLD_STORAGE_KEY_TASK_PREFIX}${newTaskId}_${today}`;
                const oldStatus = localStorage.getItem(oldTaskStatusKey);
                if (oldStatus === 'true') {
                    localStorage.setItem(getTaskStateStorageKey(today, defaultFolderId, newTaskId), 'true');
                }
                localStorage.removeItem(oldTaskStatusKey); 
            });
            
            newFoldersByCatId[category.id] = [newFolder];
        });

        foldersByCategoryId = newFoldersByCatId;
        saveFoldersByCategoryId(foldersByCategoryId);
        localStorage.removeItem(OLD_USER_DEFINED_TASKS_KEY); 
        console.log("Migration complete.");
        return true; 
    } catch (e) {
        console.error("Error migrating old task structure:", e);
        return false;
    }
}


function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories(); // This now ensures 'type' is present
    
    if (!localStorage.getItem(APP_FOLDERS_KEY) && localStorage.getItem(OLD_USER_DEFINED_TASKS_KEY)) {
        migrateOldTaskStructure(); 
    } else {
        foldersByCategoryId = loadFoldersByCategoryId();
    }

    let categoriesUpdated = false;
    let foldersUpdated = false;

    if (!currentCategories || currentCategories.length === 0) {
        currentCategories = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
            id: cat.id, name: cat.name, order: cat.order, 
            deletable: cat.deletable !== undefined ? cat.deletable : true,
            type: cat.type || 'standard'
        }));
        categoriesUpdated = true;
    } else {
         // Ensure all loaded categories have a type, defaulting to 'standard'
        currentCategories.forEach(cat => {
            if (!cat.type) {
                cat.type = 'standard';
                categoriesUpdated = true;
            }
            if (cat.deletable === undefined) {
                const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === cat.id);
                cat.deletable = defaultConfigCat ? (defaultConfigCat.deletable !== undefined ? defaultConfigCat.deletable : true) : true;
                categoriesUpdated = true;
            }
        });
    }
    
    currentCategories.forEach(category => {
        if (!foldersByCategoryId[category.id] || foldersByCategoryId[category.id].length === 0) {
            const defaultFolderId = createUniqueId(`folder-${category.id}-default`);
            const defaultFolder = {
                id: defaultFolderId,
                name: "Tasks",
                type: "task",
                categoryId: category.id,
                order: 0,
                content: [] 
            };

            const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === category.id);
            if (defaultConfigCat && defaultConfigCat.tasks) {
                defaultFolder.content = defaultConfigCat.tasks.map(taskText => ({
                    id: createUniqueId('task'),
                    text: taskText,
                }));
            }
            foldersByCategoryId[category.id] = [defaultFolder];
            foldersUpdated = true;
        }
        (foldersByCategoryId[category.id] || []).forEach(folder => {
            if (folder.type === 'task' && currentFolderEditModes[folder.id] === undefined) {
                currentFolderEditModes[folder.id] = false;
            }
        });
    });

    if (categoriesUpdated) saveUserCategories(currentCategories);
    if (foldersUpdated) saveFoldersByCategoryId(foldersByCategoryId);
}


function getTaskDefinitionsForFolder(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder && folder.type === 'task') {
            return folder.content || [];
        }
    }
    return [];
}
function getTasksForFolderForDay(folderId, dateString) {
    const taskDefinitions = getTaskDefinitionsForFolder(folderId);
    return taskDefinitions.map(taskDef => ({
        ...taskDef,
        completed: localStorage.getItem(getTaskStateStorageKey(dateString, folderId, taskDef.id)) === 'true'
    }));
}

function saveTaskStatus(folderId, taskId, completed, dateString) {
  localStorage.setItem(getTaskStateStorageKey(dateString, folderId, taskId), completed.toString());
  // Live-update today's consolidated history entry whenever a task status changes.
  if (dateString === getTodayDateString()) {
      updateTodaysHistoryEntry();
  }
}

function getCategoryById(categoryId) {
    return currentCategories.find(cat => cat.id === categoryId);
}
function getCategoryNameById(categoryId) {
    const category = getCategoryById(categoryId);
    return category ? category.name : "Unknown Category";
}
function getFolderNameById(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder) return folder.name;
    }
    return "Unknown Folder";
}


function saveDailyNote() {
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;
    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent);

    // If editing today's note, update the consolidated history entry.
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
    
    // Calculate progress based ONLY on 'standard' tasks for the historical entry's points and percentage.
    const { pointsEarned, percentage, totalStandardTasks } = calculateProgressForDate(dateToSave, true);
    
    const completedTasksHistory = {}; 
    currentCategories.forEach(cat => { // Iterate all categories to save all completed tasks
      completedTasksHistory[cat.id] = {};
      (foldersByCategoryId[cat.id] || []).forEach(folder => {
        if (folder.type === 'task') {
          const tasksInFolder = getTasksForFolderForDay(folder.id, dateToSave); 
          const completedTasksInFolder = tasksInFolder.filter(task => task.completed).map(task => task.text);
          if (completedTasksInFolder.length > 0) {
             completedTasksHistory[cat.id][folder.id] = { name: folder.name, tasks: completedTasksInFolder };
          }
        }
      });
      if(Object.keys(completedTasksHistory[cat.id]).length === 0) {
        delete completedTasksHistory[cat.id];
      }
    });

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    
    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory, // Includes tasks from ALL categories (standard and special)
        userNote: mainReflection, 
        pointsEarned: pointsEarned, // Based on STANDARD categories
        percentageCompleted: percentage, // Based on STANDARD categories
        totalTasksOnDate: totalStandardTasks, // Total STANDARD tasks defined on that day for consistent % calc
        dailyTargetPoints: DAILY_TARGET_POINTS // This target is for standard tasks
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // CRITICAL: Remove individual task states for the saved day to prevent interference
    // This applies to ALL categories as their states are now captured in history.
    currentCategories.forEach(cat => {
        (foldersByCategoryId[cat.id] || []).forEach(folder => {
            if (folder.type === 'task' && folder.content) {
                folder.content.forEach(taskDef => {
                    localStorage.removeItem(getTaskStateStorageKey(dateToSave, folder.id, taskDef.id));
                });
            }
        });
    });
    
    console.log(`History finalized and individual task states cleared for ${dateToSave}:`, historyEntry);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    console.log(`Clearing task states for previous month: ${lastProcessedMonthYear}`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TASK_STATE_STORAGE_KEY_PREFIX)) {
        const parts = key.split('_'); 
        if (parts.length > 1) { 
            const datePart = parts[1]; 
            if (datePart && datePart.length >= 7) { 
                const monthYearOfKey = datePart.substring(0, 7); 
                if (monthYearOfKey === lastProcessedMonthYear) { 
                    // This check is fine, but saveDayToHistory now handles daily cleanup,
                    // so this primarily acts as a larger sweep for very old, missed states.
                }
            }
        }
      }
    }
  }
  localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear);
}


function loadAppData() {
  seedInitialDataIfNeeded(); 

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`);
    saveDayToHistory(lastVisitDateStr);
  } else if (!lastVisitDateStr) {
    console.log("First visit or no last visit date found. Initializing for today.");
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  // If a new day has started or if today's history is missing, create/update it.
  if ((lastVisitDateStr && lastVisitDateStr !== currentDateStr) || !localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentDateStr)) {
    updateTodaysHistoryEntry();
  }

  checkAndClearOldMonthlyData(); 
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
    
    // Create the history entry for the new day
    updateTodaysHistoryEntry();

    if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = ''; 
    loadCurrentDayNote(); // Loads the (now empty) note for the new day

    if (domElements.todayPointsStat) domElements.todayPointsStat.classList.add('progress-value-resetting');
    if (domElements.todayProgressFill) domElements.todayProgressFill.classList.add('progress-value-resetting');
    
    updateAllProgress(); // This will reflect 0% for the new day

    setTimeout(() => {
        if (domElements.todayPointsStat) domElements.todayPointsStat.classList.remove('progress-value-resetting');
        if (domElements.todayProgressFill) domElements.todayProgressFill.classList.remove('progress-value-resetting');
    }, 500); 
    
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

// Drag & Drop for tasks within a folder
function getDragAfterElement(container, y) {
    const draggableElements = Array.from(container.querySelectorAll('.task-item:not(.dragging):not(.editing)'));
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

// Toggle edit mode for tasks within a specific task folder
function toggleTaskFolderEditMode(folderId) {
    currentFolderEditModes[folderId] = !currentFolderEditModes[folderId];
    const folder = findFolderById(folderId);
    if (folder) {
        renderTaskFolderContents(folder.categoryId, folderId);
    }
}

// Add Task form within a Task Folder
function showTempAddTaskForm(categoryId, folderId, position) {
    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position, false);
    }
    activeAddTaskForm = { categoryId, folderId, position };
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;

    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = taskFolderContentEl.querySelector(formContainerClass);
    if (!formContainer) return;
    
    formContainer.querySelector('.add-item-trigger-button')?.classList.add('hidden');
    formContainer.querySelector('.new-temp-task-form')?.classList.remove('hidden');
    formContainer.querySelector('.new-task-temp-input')?.focus();
}

function hideTempAddTaskForm(categoryId, folderId, position, resetActiveForm = true) {
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;
    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = taskFolderContentEl.querySelector(formContainerClass);
    if (!formContainer) return;

    formContainer.querySelector('.add-item-trigger-button')?.classList.remove('hidden');
    const form = formContainer.querySelector('.new-temp-task-form');
    form?.classList.add('hidden');
    const input = form.querySelector('.new-task-temp-input');
    if (input) input.value = '';
    if (resetActiveForm) activeAddTaskForm = null;
}

function handleSaveTempTask(categoryId, folderId, position) {
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;
    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const input = taskFolderContentEl.querySelector(`${formContainerClass} .new-task-temp-input`);
    const taskText = input.value.trim();

    if (taskText) {
        const newTaskDefinition = { id: createUniqueId('task'), text: taskText };
        const categoryFolders = foldersByCategoryId[categoryId] || [];
        const folder = categoryFolders.find(f => f.id === folderId);

        if (folder && folder.type === 'task') {
            if (!folder.content) folder.content = [];
            if (position === 'top') {
                folder.content.unshift(newTaskDefinition);
            } else {
                folder.content.push(newTaskDefinition);
            }
            saveFoldersByCategoryId(foldersByCategoryId);
            renderTaskFolderContents(categoryId, folderId); 
            updateAllProgress();
            // Since a task was added, the daily history needs an update.
            if(getCategoryById(categoryId)?.type === 'standard') {
                updateTodaysHistoryEntry();
            }
            hideTempAddTaskForm(categoryId, folderId, position);
        }
    } else {
        alert('Task text cannot be empty.');
    }
}

function findFolderById(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder) return folder;
    }
    return null;
}
function getTaskDefinitionById(folderId, taskId) {
    const folder = findFolderById(folderId);
    if (folder && folder.type === 'task' && folder.content) {
        return folder.content.find(taskDef => taskDef.id === taskId);
    }
    return null;
}


function startTaskEdit(taskItemElement, folderId, taskDef) {
    if (taskItemElement.classList.contains('editing')) return;
    taskItemElement.classList.add('editing');
    
    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if (taskTextSpan) taskTextSpan.style.display = 'none';

    const editControls = domElements.taskEditControlsTemplate.cloneNode(true);
    editControls.removeAttribute('id'); 
    editControls.style.display = 'flex'; 

    const input = editControls.querySelector('.task-edit-input');
    input.value = taskDef.text;

    editControls.querySelector('.task-edit-save').onclick = () => saveTaskEdit(folderId, taskDef.id, input.value, taskItemElement, editControls);
    editControls.querySelector('.task-edit-cancel').onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan);
    
    const deleteButton = taskItemElement.querySelector('.task-delete-button-editmode');
    if (deleteButton) taskItemElement.insertBefore(editControls, deleteButton);
    else taskItemElement.appendChild(editControls);
    
    input.focus();
    input.select();
}

function saveTaskEdit(folderId, taskId, newText, taskItemElement, editControls) {
    newText = newText.trim();
    if (!newText) {
        alert("Task text cannot be empty.");
        return;
    }
    const folder = findFolderById(folderId);
    if (folder && folder.type === 'task' && folder.content) {
        const taskIndex = folder.content.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            folder.content[taskIndex].text = newText;
            saveFoldersByCategoryId(foldersByCategoryId);
            // If the task text changes, the history entry for today should be updated.
            updateTodaysHistoryEntry();
        }
    }
    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if(taskTextSpan) {
        taskTextSpan.textContent = newText; 
        taskTextSpan.style.display = ''; 
    }
    taskItemElement.classList.remove('editing');
    editControls.remove();
}

function cancelTaskEdit(taskItemElement, editControls, taskTextSpan) {
    if (taskTextSpan) taskTextSpan.style.display = ''; 
    taskItemElement.classList.remove('editing');
    editControls.remove();
}

function renderTaskItem(task, folderId, categoryId) { 
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.dataset.folderId = folderId; 
  item.setAttribute('role', 'listitem');
  item.setAttribute('tabindex', '0'); 

  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  item.appendChild(textSpan);

  const updateAriaLabel = () => {
    item.setAttribute('aria-label', `${task.text}, ${item.classList.contains('completed') ? 'completed' : 'not completed'}`);
  };

  if (task.completed) item.classList.add('completed');
  updateAriaLabel();

  if (currentFolderEditModes[folderId]) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button-editmode icon-button';
      deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
      deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteButton.title = "Delete Task";
      deleteButton.onclick = (e) => {
          e.stopPropagation(); 
          showDeleteConfirmation('task', task.id, `Are you sure you want to delete the task "${task.text}"? This will remove it permanently.`, task.text, categoryId, folderId);
      };
      item.appendChild(deleteButton);
  }

  item.addEventListener('click', (e) => {
    if (item.classList.contains('editing')) return;
    const taskDef = getTaskDefinitionById(folderId, task.id);
    if (!taskDef) return;

    if (currentFolderEditModes[folderId] && e.target === textSpan) {
        startTaskEdit(item, folderId, taskDef);
    } else if (!currentFolderEditModes[folderId]) {
        task.completed = !task.completed;
        saveTaskStatus(folderId, task.id, task.completed, localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString());
        item.classList.toggle('completed');
        updateAriaLabel();
        item.classList.remove('animate-task-complete', 'animate-task-uncomplete');
        void item.offsetWidth; 
        item.classList.add(task.completed ? 'animate-task-complete' : 'animate-task-uncomplete');
        updateAllProgress();
    }
  });

  item.addEventListener('keydown', (e) => {
    if (item.classList.contains('editing')) return;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const taskDef = getTaskDefinitionById(folderId, task.id);
        if (!taskDef) return;
        if (!currentFolderEditModes[folderId]) { 
            item.click(); 
        } else if (currentFolderEditModes[folderId] && document.activeElement === item) {
             startTaskEdit(item, folderId, taskDef);
        }
    }
  });

  if (currentFolderEditModes[folderId] && !item.classList.contains('editing')) {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
        if (!currentFolderEditModes[folderId] || item.classList.contains('editing')) {
            e.preventDefault();
            return;
        }
        draggedTaskElement = item;
        setTimeout(() => item.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedTaskElement = null;
        document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
            el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
        });
        
        const taskListElement = item.closest('.task-list');
        if (taskListElement) {
            const fId = taskListElement.dataset.folderId;
            const newTaskOrderIds = Array.from(taskListElement.querySelectorAll('.task-item')).map(el => el.dataset.taskId);
            
            const folder = findFolderById(fId);
            if (folder && folder.type === 'task') {
                folder.content = newTaskOrderIds.map(id => folder.content.find(t => t.id === id)).filter(Boolean);
                saveFoldersByCategoryId(foldersByCategoryId);
            }
        }
    });
  } else {
    item.draggable = false;
  }
  return item;
}


function showDeleteConfirmation(type, id, message, nameForConfirmation = '', categoryId = null, folderId = null) {
    itemToDelete = { type, id, nameForConfirmation, categoryId, folderId };
    if (domElements.deleteConfirmationModal) {
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message;
        if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)} Deletion`;
        domElements.deleteConfirmationModal.classList.remove('hidden');
        if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.focus();
    }
}

function confirmDeletion() {
    if (!itemToDelete) return;
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    if (itemToDelete.type === 'task') {
        const { id: taskId, categoryId, folderId } = itemToDelete;
        const folder = findFolderById(folderId);
        if (folder && folder.type === 'task' && folder.content) {
            folder.content = folder.content.filter(t => t.id !== taskId);
            saveFoldersByCategoryId(foldersByCategoryId);
            localStorage.removeItem(getTaskStateStorageKey(today, folderId, taskId)); 
            renderTaskFolderContents(categoryId, folderId);
        }
    } else if (itemToDelete.type === 'folder') {
        const { id: folderId, categoryId } = itemToDelete;
        if (foldersByCategoryId[categoryId]) {
            const folderToDelete = foldersByCategoryId[categoryId].find(f => f.id === folderId);
            if (folderToDelete && folderToDelete.type === 'task' && folderToDelete.content) {
                folderToDelete.content.forEach(taskDef => {
                    localStorage.removeItem(getTaskStateStorageKey(today, folderId, taskDef.id));
                });
            }
            foldersByCategoryId[categoryId] = foldersByCategoryId[categoryId].filter(f => f.id !== folderId);
            saveFoldersByCategoryId(foldersByCategoryId);
            renderFolderSystemForCategory(categoryId, document.querySelector(`#category-section-${categoryId} .category-content-area`));
        }
    } else if (itemToDelete.type === 'category') {
        const categoryId = itemToDelete.id;
        const category = currentCategories.find(c => c.id === categoryId);
        if (category && category.deletable === false) {
            alert(`Category "${category.name}" is a default category and cannot be deleted.`);
        } else {
            (foldersByCategoryId[categoryId] || []).forEach(folder => {
                if (folder.type === 'task' && folder.content) {
                    folder.content.forEach(taskDef => {
                         localStorage.removeItem(getTaskStateStorageKey(today, folder.id, taskDef.id));
                    });
                }
            });

            currentCategories = currentCategories.filter(cat => cat.id !== categoryId);
            saveUserCategories(currentCategories);
            delete foldersByCategoryId[categoryId]; 
            saveFoldersByCategoryId(foldersByCategoryId);
            
            document.getElementById(`tab-button-${categoryId}`)?.remove();
            document.getElementById(`category-section-${categoryId}`)?.remove();
            if (activeTabId === categoryId) switchTab('dashboard');
        }
    }
    
    // After any deletion, update today's history entry to reflect the changes.
    updateTodaysHistoryEntry();
    updateAllProgress();
    hideDeleteConfirmation();
}

function hideDeleteConfirmation() {
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('hidden');
    }
    itemToDelete = null;
}

function renderCategorySectionContent(categoryId) {
    const sectionElement = document.getElementById(`category-section-${categoryId}`);
    if (!sectionElement) return;

    let contentArea = sectionElement.querySelector('.category-content-area');
    if (!contentArea) { 
        contentArea = document.createElement('div');
        contentArea.className = 'category-content-area';
        sectionElement.querySelectorAll('.task-list, .add-task-form-container').forEach(el => el.remove());
        sectionElement.appendChild(contentArea);
    }
    contentArea.innerHTML = ''; 

    sectionElement.querySelector('.category-header-controls')?.classList.add('hidden');


    if (currentCategoryView.categoryId === categoryId) {
        if (currentCategoryView.mode === 'folders') {
            renderFolderSystemForCategory(categoryId, contentArea);
        } else if (currentCategoryView.mode === 'task_folder') {
            renderTaskFolderContents(categoryId, currentCategoryView.folderId, contentArea);
        } else if (currentCategoryView.mode === 'note_folder') {
            renderNoteFolderContents(categoryId, currentCategoryView.folderId, contentArea);
        }
    }
}

function renderFolderSystemForCategory(categoryId, container) {
    container.innerHTML = ''; 
    
    const foldersGrid = document.createElement('div');
    foldersGrid.className = 'folders-grid';
    
    const folders = (foldersByCategoryId[categoryId] || []).sort((a,b) => a.order - b.order);
    folders.forEach(folder => {
        foldersGrid.appendChild(renderFolderBox(folder));
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'add-folder-button';
    addFolderBtn.setAttribute('aria-label', 'Add new folder');
    addFolderBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`;
    addFolderBtn.onclick = () => openChooseFolderTypeModal(categoryId);
    foldersGrid.appendChild(addFolderBtn);

    container.appendChild(foldersGrid);
}

function renderFolderBox(folder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'folder-item-container';
    wrapper.dataset.folderId = folder.id;
    wrapper.dataset.categoryId = folder.categoryId;
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', `Open folder: ${folder.name}`);

    const box = document.createElement('div'); 
    box.className = 'folder-box';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'folder-box-icon';
    if (folder.type === 'task') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-10V7h14v2H7z"></path></svg>`;
    } else { 
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`;
    }
    box.appendChild(iconDiv);

    const optionsTrigger = document.createElement('div');
    optionsTrigger.className = 'folder-options-trigger';
    optionsTrigger.innerHTML = `<span></span><span></span><span></span>`;
    optionsTrigger.setAttribute('aria-label', `Options for folder ${folder.name}`);
    optionsTrigger.setAttribute('role', 'button');
    optionsTrigger.tabIndex = 0; 
    optionsTrigger.onclick = (e) => { e.stopPropagation(); showFolderContextMenu(folder, box); }; 
    optionsTrigger.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); showFolderContextMenu(folder, box); }};
    box.appendChild(optionsTrigger);
    
    wrapper.appendChild(box);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'folder-box-name';
    nameSpan.textContent = folder.name;
    wrapper.appendChild(nameSpan);
    
    wrapper.onclick = () => {
        currentCategoryView = {
            mode: folder.type === 'task' ? 'task_folder' : 'note_folder',
            categoryId: folder.categoryId,
            folderId: folder.id
        };
        renderCategorySectionContent(folder.categoryId);
    };
    wrapper.onkeydown = (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrapper.click(); }};

    return wrapper;
}


function renderTaskFolderContents(categoryId, folderId, container) {
    if (!container) { 
        const sectionElement = document.getElementById(`category-section-${categoryId}`);
        if (!sectionElement) return;
        container = sectionElement.querySelector('.category-content-area');
        if (!container) return;
    }
    container.innerHTML = ''; 
    const folder = findFolderById(folderId);
    if (!folder) return;

    const header = document.createElement('div');
    header.className = 'folder-view-header';
    
    const backButton = document.createElement('button');
    backButton.className = 'folder-back-button icon-button'; 
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; 
    backButton.setAttribute('aria-label', 'Back to folders');
    backButton.title = 'Back to Folders';
    backButton.onclick = () => {
        currentCategoryView = { mode: 'folders', categoryId: categoryId, folderId: null };
        currentFolderEditModes[folderId] = false; 
        renderCategorySectionContent(categoryId);
    };
    header.appendChild(backButton);

    const title = document.createElement('h3');
    title.className = 'folder-view-title';
    title.textContent = folder.name;
    header.appendChild(title);

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'folder-view-header-controls';

    const editModeButton = document.createElement('button');
    editModeButton.className = 'edit-mode-toggle-button icon-button';
    editModeButton.title = 'Toggle Edit Mode for Tasks';
    editModeButton.setAttribute('aria-pressed', currentFolderEditModes[folderId] ? 'true' : 'false');
    editModeButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>`;
    editModeButton.onclick = () => toggleTaskFolderEditMode(folderId);
    if (currentFolderEditModes[folderId]) editModeButton.classList.add('active-glow');
    controlsDiv.appendChild(editModeButton);

    const undoButton = document.createElement('button');
    undoButton.className = 'undo-folder-button icon-button'; 
    undoButton.title = 'Uncheck All Tasks in this Folder';
    undoButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2c-5.621 0-10.211 4.44-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.95 3.589-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.875-2.875l-1.751 2.334c1.889 2.299 4.811 3.541 7.626 3.541 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z"></path></svg>`;
    undoButton.onclick = () => {
        const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
        (folder.content || []).forEach(taskDef => {
            saveTaskStatus(folderId, taskDef.id, false, today);
        });
        renderTaskFolderContents(categoryId, folderId, container); 
        updateAllProgress();
    };
    controlsDiv.appendChild(undoButton);
    header.appendChild(controlsDiv);
    container.appendChild(header);

    const taskFolderContentDiv = document.createElement('div');
    taskFolderContentDiv.id = `task-folder-content-${folderId}`;
    taskFolderContentDiv.className = 'task-folder-content';
    if(currentFolderEditModes[folderId]) taskFolderContentDiv.classList.add('edit-mode-active');


    const addTaskFormTop = createAddTaskForm(categoryId, folderId, 'top');
    taskFolderContentDiv.appendChild(addTaskFormTop);

    const taskListElement = document.createElement('ul');
    taskListElement.className = 'task-list';
    taskListElement.setAttribute('aria-live', 'polite');
    taskListElement.dataset.folderId = folderId; 
    taskListElement.dataset.categoryId = categoryId;


    const tasksForDay = getTasksForFolderForDay(folderId, localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString());
    if (tasksForDay.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = currentFolderEditModes[folderId] ? 'No tasks defined. Click "Add Item" to create new tasks.' : 'No tasks for today in this folder.';
        emptyMessage.className = 'empty-tasks-message';
        if (currentFolderEditModes[folderId]) emptyMessage.classList.add('edit-mode-empty');
        taskListElement.appendChild(emptyMessage);
    } else {
        tasksForDay.forEach(task => {
            taskListElement.appendChild(renderTaskItem(task, folderId, categoryId));
        });
    }
    taskFolderContentDiv.appendChild(taskListElement);

    const addTaskFormBottom = createAddTaskForm(categoryId, folderId, 'bottom');
    taskFolderContentDiv.appendChild(addTaskFormBottom);
    
    container.appendChild(taskFolderContentDiv);
}

function createAddTaskForm(categoryId, folderId, position) {
    const formContainer = document.createElement('div');
    formContainer.className = `add-task-form-container add-task-form-${position}`;

    const triggerButton = document.createElement('button');
    triggerButton.className = 'add-item-trigger-button icon-button';
    triggerButton.dataset.position = position;
    triggerButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg> Add Item`;
    triggerButton.onclick = () => showTempAddTaskForm(categoryId, folderId, position);
    formContainer.appendChild(triggerButton);

    const formDiv = document.createElement('div');
    formDiv.className = 'new-temp-task-form hidden';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'new-task-temp-input';
    input.placeholder = 'Enter task text...';
    input.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTempTask(categoryId, folderId, position); }};
    formDiv.appendChild(input);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'new-task-temp-save';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => handleSaveTempTask(categoryId, folderId, position);
    formDiv.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'new-task-temp-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => hideTempAddTaskForm(categoryId, folderId, position);
    formDiv.appendChild(cancelBtn);
    
    formContainer.appendChild(formDiv);
    return formContainer;
}

function renderNoteFolderContents(categoryId, folderId, container) {
     if (!container) { 
        const sectionElement = document.getElementById(`category-section-${categoryId}`);
        if (!sectionElement) return;
        container = sectionElement.querySelector('.category-content-area');
        if (!container) return;
    }
    container.innerHTML = ''; 
    const folder = findFolderById(folderId);
    if (!folder || folder.type !== 'note') return;

    const header = document.createElement('div');
    header.className = 'folder-view-header';
    
    const backButton = document.createElement('button');
    backButton.className = 'folder-back-button icon-button'; 
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; 
    backButton.setAttribute('aria-label', 'Back to folders');
    backButton.title = 'Back to Folders';
    backButton.onclick = () => {
        currentCategoryView = { mode: 'folders', categoryId: categoryId, folderId: null };
        renderCategorySectionContent(categoryId);
    };
    header.appendChild(backButton);

    const title = document.createElement('h3');
    title.className = 'folder-view-title';
    title.textContent = folder.name;
    header.appendChild(title);
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'folder-view-header-controls note-folder-controls'; 

    const addImageButton = document.createElement('button');
    addImageButton.className = 'add-image-button icon-button';
    addImageButton.title = 'Add Image';
    addImageButton.setAttribute('aria-label', 'Add image to note');
    addImageButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>`;
    
    controlsDiv.appendChild(addImageButton);
    header.appendChild(controlsDiv);
    container.appendChild(header);

    const noteContentWrapper = document.createElement('div');
    noteContentWrapper.className = 'note-folder-content-wrapper';

    const noteEditor = document.createElement('div');
    noteEditor.className = 'note-editor'; 
    noteEditor.setAttribute('contenteditable', 'true');
    noteEditor.setAttribute('aria-label', `Note content for ${folder.name}`);
    noteEditor.innerHTML = folder.content || ''; 
    autoLinkText(noteEditor); 

    addImageButton.onclick = () => {
        if (domElements.imageUploadInput) {
            domElements.imageUploadInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (readEvent) => {
                        const img = document.createElement('img');
                        img.src = readEvent.target.result;
                        img.alt = "Uploaded Image";

                        noteEditor.focus(); 
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(img);
                            range.setStartAfter(img);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        } else {
                            noteEditor.appendChild(img); 
                        }
                        noteEditor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    };
                    reader.readAsDataURL(file);
                    domElements.imageUploadInput.value = ''; 
                }
            };
            domElements.imageUploadInput.click();
        }
    };


    noteEditor.addEventListener('input', () => {
        folder.content = noteEditor.innerHTML;
        saveFoldersByCategoryId(foldersByCategoryId);
    });

    noteEditor.addEventListener('blur', () => {
        autoLinkText(noteEditor); 
        folder.content = noteEditor.innerHTML; 
        saveFoldersByCategoryId(foldersByCategoryId);
    });
    
    ['paste', 'drop'].forEach(eventType => {
        noteEditor.addEventListener(eventType, (event) => {
            if (eventType === 'drop') event.preventDefault();
            const items = (eventType === 'paste' ? event.clipboardData : event.dataTransfer)?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (e_reader) => {
                            const img = document.createElement('img');
                            img.src = e_reader.target.result;
                            
                            noteEditor.focus(); 
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(img);
                                range.setStartAfter(img);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);

                            } else {
                                noteEditor.appendChild(img);
                            }
                            noteEditor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        };
                        reader.readAsDataURL(blob);
                    }
                    if (eventType === 'paste') event.preventDefault(); 
                }
            }
        });
    });
    noteEditor.addEventListener('dragover', (event) => {
        event.preventDefault(); 
    });


    noteContentWrapper.appendChild(noteEditor);
    container.appendChild(noteContentWrapper);
}

function autoLinkText(element) {
    const urlPattern = /(?<!href="|href='|">)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(?<!href="|href='|">)(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?!.*?<\/a>)/ig;
    const textNodes = [];
    const collectTextNodes = (el) => {
        for (const child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                if (child.parentNode.nodeName.toUpperCase() !== 'A') {
                    textNodes.push(child);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName.toUpperCase() !== 'A') {
                collectTextNodes(child);
            }
        }
    };
    
    collectTextNodes(element);
    
    let madeChangesOverall = false;
    for (const node of textNodes) {
        const text = node.nodeValue;
        let newContentHTML = "";
        let lastIndex = 0;
        let matchFoundInNode = false;
        
        urlPattern.lastIndex = 0; 
        let match;
        while ((match = urlPattern.exec(text)) !== null) {
            matchFoundInNode = true;
            madeChangesOverall = true;
            newContentHTML += text.substring(lastIndex, match.index);
            let url = match[0];
            if (!url.startsWith('http') && !url.startsWith('ftp') && !url.startsWith('file')) {
                url = 'http://' + url;
            }
            newContentHTML += `<a href="${url}" target="_blank" rel="noopener noreferrer">${match[0]}</a>`;
            lastIndex = match.index + match[0].length;
        }
        newContentHTML += text.substring(lastIndex);

        if (matchFoundInNode) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContentHTML;
            const parent = node.parentNode;
            while (tempDiv.firstChild) {
                parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
        }
    }
    return madeChangesOverall;
}


function renderAllCategorySections() {
    if (!domElements.tabContentsContainer || !domElements.categorySectionTemplate) return;
    
    domElements.tabContentsContainer.querySelectorAll('.category-section:not(#dashboard-content)').forEach(sec => sec.remove());

    currentCategories.forEach(category => {
        if (category.id === 'dashboard') return; 

        const sectionClone = domElements.categorySectionTemplate.content.cloneNode(true);
        const sectionElement = sectionClone.querySelector('.category-section');
        
        sectionElement.id = `category-section-${category.id}`;
        sectionElement.setAttribute('aria-labelledby', `tab-button-${category.id}`);
        if (activeTabId !== category.id) {
            sectionElement.classList.add('hidden');
        }

        sectionElement.querySelector('.category-title-text').textContent = category.name;
        
        // This ensures that if a category is switched to, its content (folder view) is rendered.
        // It doesn't pre-render task/note views until a folder is clicked.
        if(activeTabId === category.id) { 
             currentCategoryView = { mode: 'folders', categoryId: category.id, folderId: null };
             renderCategorySectionContent(category.id); // Ensures current active tab's content is rendered.
        }

        domElements.tabContentsContainer.appendChild(sectionElement);
    });
}


function renderTabs() {
    if (!domElements.tabsContainer) return;
    domElements.tabsContainer.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove());
    const addCatButton = domElements.addCategoryButton;

    currentCategories.sort((a, b) => a.order - b.order).forEach(category => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.id = `tab-button-${category.id}`;
        tabButton.dataset.categoryId = category.id;
        tabButton.textContent = category.name;
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
        optionsIcon.innerHTML = `<span></span><span></span><span></span>`;
        optionsIcon.setAttribute('aria-label', `Options for ${category.name}`);
        optionsIcon.setAttribute('role', 'button');
        optionsIcon.tabIndex = 0; 
        tabButton.appendChild(optionsIcon);
        
        optionsIcon.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showCategoryContextMenu(category.id, tabButton); 
        });
        optionsIcon.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault(); 
                e.stopPropagation(); 
                showCategoryContextMenu(category.id, tabButton); 
            }
        });

        let touchStartEvent = null; 

        const clearTabLongPressState = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            tabButton.removeEventListener('touchmove', handleTabTouchMove);
            tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            touchStartEvent = null;
        };

        const handleTabTouchMove = () => {
            clearTabLongPressState(); 
        };

        const handleTabTouchEndOrCancel = () => {
            clearTabLongPressState();
        };
        
        tabButton.addEventListener('touchstart', (e) => {
            clearTabLongPressState(); 
            touchStartEvent = e; 

            tabButton.addEventListener('touchmove', handleTabTouchMove);
            tabButton.addEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);

            longPressTimer = setTimeout(() => {
                if (touchStartEvent) { 
                    touchStartEvent.preventDefault(); 
                }
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
            domElements.tabsContainer.insertBefore(tabButton, addCatButton);
        } else {
            domElements.tabsContainer.appendChild(tabButton);
        }
    });
    updateCategoryTabIndicators();
}


function switchTab(categoryIdToActivate) {
    activeTabId = categoryIdToActivate;
    hideCategoryContextMenu();
    hideFolderContextMenu();

    if (domElements.tabsContainer) {
        domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => {
            const isCurrentActive = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button');
            button.classList.toggle('active', isCurrentActive);
            button.setAttribute('aria-selected', isCurrentActive.toString());
        });
    }
    
    if (domElements.tabContentsContainer) {
        domElements.tabContentsContainer.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard');
        domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => {
            const isCurrentActiveSection = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content');
            section.classList.toggle('hidden', !isCurrentActiveSection);
        });
    }
    
    if (activeTabId !== 'dashboard') {
        currentCategoryView = { mode: 'folders', categoryId: activeTabId, folderId: null };
        renderCategorySectionContent(activeTabId); 
    } else {
        currentCategoryView = { mode: 'dashboard', categoryId: null, folderId: null };
    }

    if (activeAddTaskForm) { 
         const folder = findFolderById(activeAddTaskForm.folderId);
         if(folder) hideTempAddTaskForm(folder.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position);
    }
}

// standardOnlyStats: if true, calculates points/percentage based only on standard categories.
// Returns totalStandardTasks if standardOnlyStats is true, otherwise total tasks from all categories.
function calculateProgressForDate(dateString, standardOnlyStats = false) {
  let completedCount = 0;
  let totalTasksForCalc = 0; // Tasks used for percentage and point calculation (standard or all)
  let totalStandardTasksCount = 0; // Always tracks total standard tasks

  currentCategories.forEach(category => {
    const isStandardCategory = category.type === 'standard';
    (foldersByCategoryId[category.id] || []).forEach(folder => {
      if (folder.type === 'task' && folder.content) {
        const tasksInFolder = folder.content.length;
        let completedInFolder = 0;
        folder.content.forEach(taskDef => {
          if (localStorage.getItem(getTaskStateStorageKey(dateString, folder.id, taskDef.id)) === 'true') {
            completedInFolder++;
          }
        });

        if (isStandardCategory) {
            totalStandardTasksCount += tasksInFolder;
        }
        
        // Determine if this category's tasks should be included in the calculation
        if (standardOnlyStats) {
            if (isStandardCategory) {
                totalTasksForCalc += tasksInFolder;
                completedCount += completedInFolder;
            }
        } else { // if not standardOnly, include all tasks
            totalTasksForCalc += tasksInFolder;
            completedCount += completedInFolder;
        }
      }
    });
  });

  const percentage = totalTasksForCalc > 0 ? Math.round((completedCount / totalTasksForCalc) * 100) : 0;
  // Points are awarded based on completion of tasks in 'totalTasksForCalc' (which reflects standardOnly if true)
  const pointsPerTask = totalTasksForCalc > 0 ? DAILY_TARGET_POINTS / totalTasksForCalc : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);
  
  return { 
    percentage, 
    pointsEarned, 
    completedCount, // based on standardOnlyStats
    totalTasks: totalTasksForCalc, // based on standardOnlyStats
    totalStandardTasks: totalStandardTasksCount // always the count of standard tasks
  };
}


function updateDashboardSummaries() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

  currentCategories.forEach(category => {
    if (category.id === 'dashboard' || category.type === 'special') return; // Exclude special categories

    let tasksInCategory = 0;
    let completedInCategory = 0;
    (foldersByCategoryId[category.id] || []).forEach(folder => {
        if (folder.type === 'task' && folder.content) {
            tasksInCategory += folder.content.length;
            folder.content.forEach(taskDef => {
                if (localStorage.getItem(getTaskStateStorageKey(today, folder.id, taskDef.id)) === 'true') {
                    completedInCategory++;
                }
            });
        }
    });

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'dashboard-category-summary';
    summaryDiv.innerHTML = `
      <h3>${category.name}</h3>
      <p class="category-stats">${completedInCategory} / ${tasksInCategory}</p>
    `;
    const statsP = summaryDiv.querySelector('.category-stats');
    if (tasksInCategory > 0 && completedInCategory === tasksInCategory) {
        statsP.classList.add('fully-completed');
    }
    domElements.dashboardSummariesContainer.appendChild(summaryDiv);
  });
}

function updateTodaysProgress() {
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
  // Today's progress bar and points should ONLY reflect standard categories
  const progress = calculateProgressForDate(today, true); // true for standardOnlyStats
  
  if (domElements.todayProgressFill) {
      domElements.todayProgressFill.style.width = `${progress.percentage}%`;
      domElements.todayProgressFill.style.backgroundColor = getProgressFillColor(progress.percentage);
      domElements.todayProgressFill.textContent = `${progress.percentage}%`;
      domElements.todayProgressFill.setAttribute('aria-valuenow', progress.percentage.toString());
  }
  if (domElements.todayPointsStat) {
      domElements.todayPointsStat.textContent = `${progress.pointsEarned} / ${DAILY_TARGET_POINTS} points`;
  }
}

function updateCurrentWeekProgress() {
    const todayNormalized = getNormalizedDate(new Date());
    let currentWeekStartDateString = localStorage.getItem(STORAGE_KEY_CURRENT_WEEK_START_DATE);
    let currentWeekStartDate;

    if (!currentWeekStartDateString) {
        currentWeekStartDate = new Date(todayNormalized); 
        localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
    } else {
        currentWeekStartDate = getNormalizedDate(new Date(currentWeekStartDateString));
        const daysPassed = (todayNormalized.getTime() - currentWeekStartDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 7) { 
            currentWeekStartDate = new Date(todayNormalized); 
            let dayOfWeek = todayNormalized.getDay(); 
            let diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
            currentWeekStartDate.setDate(todayNormalized.getDate() + diffToMonday);
            currentWeekStartDate = getNormalizedDate(currentWeekStartDate); 
            localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
        }
    }
    
    let totalPointsThisWeekCycle = 0;
    let currentDateIter = new Date(currentWeekStartDate); 
    const todayDateStringForLoop = getTodayDateString();

    while (currentDateIter <= todayNormalized) {
        const dateStringForIter = `${currentDateIter.getFullYear()}-${(currentDateIter.getMonth() + 1).toString().padStart(2, '0')}-${currentDateIter.getDate().toString().padStart(2, '0')}`;
        let pointsForDay = 0;

        if (dateStringForIter === todayDateStringForLoop) {
            // For today, calculate points based on current STANDARD task completions
            pointsForDay = calculateProgressForDate(dateStringForIter, true).pointsEarned; // true for standardOnlyStats
        } else { 
            // For past days, use the stored points from history (which are already based on standard tasks)
            const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter;
            const historyDataString = localStorage.getItem(historyKey);
            if (historyDataString) {
                try {
                    pointsForDay = JSON.parse(historyDataString).pointsEarned || 0;
                } catch (e) { /* ignore error, pointsForDay remains 0 */ }
            }
        }
        totalPointsThisWeekCycle += pointsForDay;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    const weeklyCyclePercentage = TARGET_POINTS_FOR_WEEKLY_VIEW > 0 ? Math.min(100, Math.round((totalPointsThisWeekCycle / TARGET_POINTS_FOR_WEEKLY_VIEW) * 100)) : 0;

    if (domElements.currentWeekProgressFill) {
        domElements.currentWeekProgressFill.style.width = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.style.backgroundColor = getProgressFillColor(weeklyCyclePercentage);
        domElements.currentWeekProgressFill.textContent = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.setAttribute('aria-valuenow', weeklyCyclePercentage.toString());
    }
    if (domElements.currentWeekPointsStat) {
        domElements.currentWeekPointsStat.textContent = `${totalPointsThisWeekCycle} / ${TARGET_POINTS_FOR_WEEKLY_VIEW} points`;
    }
}


function renderCalendar() {
  if (!domElements.calendarGrid || !domElements.calendarMonthYear) return;
  domElements.calendarGrid.innerHTML = ''; 
  const month = calendarDisplayDate.getMonth();
  const year = calendarDisplayDate.getFullYear();
  domElements.calendarMonthYear.textContent = `${calendarDisplayDate.toLocaleString('default', { month: 'long' })} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); 
  const todayNorm = getNormalizedDate(new Date());
  const todayDateStr = getTodayDateString();

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dayName => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dayName;
    domElements.calendarGrid.appendChild(dayHeader);
  });

  for (let i = 0; i < startingDayOfWeek; i++) {
    domElements.calendarGrid.appendChild(document.createElement('div')).className = 'calendar-day-cell empty';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = getNormalizedDate(new Date(year, month, day));
    const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.dataset.date = dateString;
    cell.innerHTML = `<span class="calendar-day-number">${day}</span><div class="calendar-day-fill"></div>`;
    
    let percentageCompleted = 0; // This percentage MUST be based on standard tasks only
    let hasHistoryData = false; 
    const fillDiv = cell.querySelector('.calendar-day-fill');
    fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.1)'; 

    if (dateString === todayDateStr) { 
        cell.classList.add('current-day');
        const progress = calculateProgressForDate(dateString, true); // True for standardOnlyStats for calendar fill
        percentageCompleted = progress.percentage;
        fillDiv.style.backgroundColor = getProgressFillColor(percentageCompleted); 
        if (percentageCompleted > 40) cell.classList.add('high-fill'); 
        // hasHistoryData checks any completed tasks (standard or special) or note
        const anyTaskProgress = calculateProgressForDate(dateString, false); // false for any task for hasHistory check
        hasHistoryData = anyTaskProgress.completedCount > 0 || !!localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString);
    } else { 
        const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
        if (historyDataString) { 
            try {
                const historyEntry = JSON.parse(historyDataString);
                // Use stored percentageCompleted, which is already based on standard tasks
                percentageCompleted = historyEntry.percentageCompleted || 0;
                fillDiv.style.backgroundColor = getProgressFillColor(percentageCompleted);
                if (cellDate < todayNorm) fillDiv.style.opacity = '0.7'; 

                // Check for any completed tasks (standard or special) or note in the history entry
                hasHistoryData = (historyEntry.completedTaskStructure && 
                                  Object.values(historyEntry.completedTaskStructure).some(cat => 
                                      Object.values(cat).some(folder => folder.tasks && folder.tasks.length > 0))) || 
                                 !!historyEntry.userNote;
            } catch(e) { 
                if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; 
            }
        } else if (cellDate < todayNorm) { 
             fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)';
        }
        if (cellDate < todayNorm) cell.classList.add('calendar-day-past');
    }

    if (hasHistoryData) cell.classList.add('has-history');
    fillDiv.style.height = `${percentageCompleted}%`; // Height based on standard task percentage
    
    cell.addEventListener('click', () => showHistoryModal(dateString));
    domElements.calendarGrid.appendChild(cell);
  }
}

function showHistoryModal(dateString) {
  currentModalDate = dateString;
  if (!domElements.historyModal) return;

  const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
  let historyEntryToDisplay = null;

  // For today, if the history entry doesn't exist for some reason, create it.
  // This ensures the modal always has data to show.
  if (dateString === getTodayDateString() && !localStorage.getItem(historyKey)) {
    updateTodaysHistoryEntry();
  }
  
  const historyDataString = localStorage.getItem(historyKey);

  if (historyDataString) {
    try {
      historyEntryToDisplay = JSON.parse(historyDataString);
      // Ensure historical entries have totalTasksOnDate and dailyTargetPoints for consistent display
      if (historyEntryToDisplay.totalTasksOnDate === undefined) {
        // Quick recalc for old entries if needed, assuming they were standard only
        const tempProgress = calculateProgressForDate(dateString, true);
        historyEntryToDisplay.totalTasksOnDate = tempProgress.totalStandardTasks;
      }
      if (historyEntryToDisplay.dailyTargetPoints === undefined) {
        historyEntryToDisplay.dailyTargetPoints = DAILY_TARGET_POINTS;
      }
    } catch (e) {
      console.error("Error parsing history for modal:", e);
    }
  }

  if (domElements.historyModalDate) domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (historyEntryToDisplay) {
    if (domElements.historyModalPointsValue) domElements.historyModalPointsValue.textContent = historyEntryToDisplay.pointsEarned !== undefined ? historyEntryToDisplay.pointsEarned.toString() : 'N/A';
    if (domElements.historyModalPointsTotal) domElements.historyModalPointsTotal.textContent = (historyEntryToDisplay.dailyTargetPoints || DAILY_TARGET_POINTS).toString();
    
    const completionPercentage = historyEntryToDisplay.percentageCompleted !== undefined ? historyEntryToDisplay.percentageCompleted : 0;
    if (domElements.historyPercentageProgressFill) {
        domElements.historyPercentageProgressFill.style.width = `${completionPercentage}%`;
        domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(completionPercentage);
        domElements.historyPercentageProgressFill.textContent = `${completionPercentage}%`;
        domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', completionPercentage);
    }

    if (domElements.historyTasksList) {
        domElements.historyTasksList.innerHTML = '';
        let hasCompletedTasks = false;
        if (historyEntryToDisplay.completedTaskStructure) {
            Object.keys(historyEntryToDisplay.completedTaskStructure).forEach(catId => {
                const categoryData = historyEntryToDisplay.completedTaskStructure[catId];
                const category = getCategoryById(catId); // Get full category object for type check
                if(Object.keys(categoryData).length === 0) return;

                const categoryGroup = document.createElement('div');
                categoryGroup.className = 'history-category-group';
                const categoryTitle = document.createElement('h5');
                categoryTitle.className = 'history-category-title';
                categoryTitle.textContent = getCategoryNameById(catId);
                if (category && category.type === 'special') {
                    categoryTitle.classList.add('special-history-title'); // Optional: style special cat titles in history
                }
                categoryGroup.appendChild(categoryTitle);
                
                Object.values(categoryData).forEach(folderData => { 
                    if (folderData.tasks && folderData.tasks.length > 0) {
                        hasCompletedTasks = true;
                        const folderTitle = document.createElement('h6'); 
                        folderTitle.className = 'history-folder-title';
                        folderTitle.textContent = folderData.name;
                        categoryGroup.appendChild(folderTitle);

                        const ul = document.createElement('ul');
                        folderData.tasks.forEach(taskText => {
                            const li = document.createElement('li');
                            li.innerHTML = `<span>${taskText}</span>`;
                            ul.appendChild(li);
                        });
                        categoryGroup.appendChild(ul);
                    }
                });
                if(categoryGroup.querySelector('ul')) domElements.historyTasksList.appendChild(categoryGroup);
            });
        }
        if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    }
    if (domElements.expandTasksButton) domElements.expandTasksButton.classList.toggle('hidden', !Object.values(historyEntryToDisplay.completedTaskStructure || {}).some(cat => Object.values(cat).some(folder => folder.tasks && folder.tasks.length > 0)));

    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = historyEntryToDisplay.userNote || "No reflection recorded for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
    }
    if (domElements.historyUserNoteEdit) {
        domElements.historyUserNoteEdit.value = historyEntryToDisplay.userNote || "";
        domElements.historyUserNoteEdit.classList.add('hidden'); 
    }
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.toggle('hidden', !historyEntryToDisplay.userNote);
    
    if (domElements.historyUserNoteDisplay) { 
        domElements.historyUserNoteDisplay.ondblclick = () => {
            if (domElements.historyUserNoteDisplay) domElements.historyUserNoteDisplay.classList.add('hidden');
            if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.remove('hidden');
            if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.remove('hidden');
            if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.focus();
        };
    }
  } else { 
    if (domElements.historyModalPointsValue) domElements.historyModalPointsValue.textContent = 'N/A';
    if (domElements.historyModalPointsTotal) domElements.historyModalPointsTotal.textContent = DAILY_TARGET_POINTS.toString();
    if (domElements.historyPercentageProgressFill) {
        domElements.historyPercentageProgressFill.style.width = `0%`;
        domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(0);
        domElements.historyPercentageProgressFill.textContent = `0%`;
        domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', 0);
    }
    if (domElements.historyTasksList) domElements.historyTasksList.innerHTML = '<p>No data available for this day.</p>';
    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = "No data available for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
         domElements.historyUserNoteDisplay.ondblclick = null; 
    }
    if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.add('hidden');
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
    if (domElements.expandTasksButton) domElements.expandTasksButton.classList.add('hidden');
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.add('hidden');
  }
  domElements.historyModal.classList.remove('hidden');
}


function closeHistoryModal() {
  if (domElements.historyModal) domElements.historyModal.classList.add('hidden');
  currentModalDate = null; 
}

function saveHistoricalNote() {
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;
    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    let historyEntry;

    const existingHistoryStr = localStorage.getItem(historyKey);
    if (existingHistoryStr) {
        try {
            historyEntry = JSON.parse(existingHistoryStr);
        } catch (e) {
            console.error("Could not parse history to save note", e);
            return; // Don't proceed if history is corrupt
        }
    } else {
        // This case should be rare, but as a fallback, create the entry.
        console.warn(`No history found for ${currentModalDate} while saving note. Creating a new entry.`);
        // updateTodaysHistoryEntry only works for today. This path needs to be robust.
        const progress = calculateProgressForDate(currentModalDate, true);
        historyEntry = {
            date: currentModalDate, completedTaskStructure: {}, userNote: "",
            pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage,
            totalTasksOnDate: progress.totalStandardTasks, dailyTargetPoints: DAILY_TARGET_POINTS
        };
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    // If it was today's note, also update the main reflection input and its storage key
    if (currentModalDate === getTodayDateString()) {
        if (domElements.dailyNoteInput) {
            domElements.dailyNoteInput.value = noteContent;
        }
        localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent);
    }

    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
    }
    if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.add('hidden');
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = 'Reflection saved!';
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.toggle('hidden', !noteContent);
    renderCalendar();
}

function clearHistoricalNote() {
     if (!domElements.historyUserNoteEdit) return;
    domElements.historyUserNoteEdit.value = "";
}

function populateMonthYearPicker() {
    if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return;
    domElements.pickerMonthsGrid.innerHTML = '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((month, index) => {
        const btn = document.createElement('button');
        btn.className = 'month-option';
        btn.textContent = month;
        btn.dataset.month = index.toString();
        if (index === pickerSelectedMonth) btn.classList.add('selected');
        btn.onclick = () => { pickerSelectedMonth = index; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); };
        domElements.pickerMonthsGrid.appendChild(btn);
    });
    domElements.pickerYearsList.innerHTML = '';
    let yearToScrollTo = null;
    for (let year = 2000; year <= 2100; year++) {
        const btn = document.createElement('button');
        btn.className = 'year-option';
        btn.textContent = year.toString();
        btn.dataset.year = year.toString();
        if (year === pickerSelectedYear) { btn.classList.add('selected'); yearToScrollTo = btn; }
        btn.onclick = () => { pickerSelectedYear = year; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); };
        domElements.pickerYearsList.appendChild(btn);
    }
    if (yearToScrollTo) yearToScrollTo.scrollIntoView({ block: 'nearest' });
}

function toggleMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        populateMonthYearPicker();
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else domElements.monthYearPickerModal.classList.add('hidden');
}

function closeMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
}

function updateCategoryTabIndicators() {
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    currentCategories.forEach(category => {
        const tabButton = document.getElementById(`tab-button-${category.id}`);
        if (!tabButton) return;

        tabButton.querySelector('.notification-badge')?.remove();
        tabButton.classList.remove('category-complete-indicator');

        if (category.type === 'special') return; // Special categories don't show indicators

        let totalTasksInCat = 0;
        let completedTasksInCat = 0;
        (foldersByCategoryId[category.id] || []).forEach(folder => {
            if (folder.type === 'task' && folder.content) {
                totalTasksInCat += folder.content.length;
                folder.content.forEach(taskDef => {
                    if (localStorage.getItem(getTaskStateStorageKey(today, folder.id, taskDef.id)) === 'true') {
                        completedTasksInCat++;
                    }
                });
            }
        });
        
        if (totalTasksInCat === 0) return; 
        const isFullyCompleted = completedTasksInCat === totalTasksInCat;
        const incompleteTasksCount = totalTasksInCat - completedTasksInCat;

        if (isFullyCompleted) tabButton.classList.add('category-complete-indicator');
        else if (incompleteTasksCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = incompleteTasksCount.toString();
            tabButton.appendChild(badge);
        }
    });
}


function updateAllProgress() {
  if (domElements.dashboardColumnView && !domElements.dashboardColumnView.classList.contains('hidden')) {
    updateDashboardSummaries(); 
  }
  updateTodaysProgress();
  updateCurrentWeekProgress();
  updateCategoryTabIndicators();
  renderCalendar(); 
}


function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea) return;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    let historyEntry = null;
    const isToday = date === getTodayDateString();

    if (isToday) { 
        // For today, construct live entry for modal, including all tasks for listing
        const completedTasksTodayStruct = {}; 
        currentCategories.forEach(cat => {
          completedTasksTodayStruct[cat.id] = {};
          (foldersByCategoryId[cat.id] || []).forEach(folder => {
            if (folder.type === 'task') {
              const folderTasks = [];
              (folder.content || []).forEach(taskDef => {
                if (localStorage.getItem(getTaskStateStorageKey(date, folder.id, taskDef.id)) === 'true') {
                  folderTasks.push(taskDef.text);
                }
              });
              if (folderTasks.length > 0) completedTasksTodayStruct[cat.id][folder.id] = { name: folder.name, tasks: folderTasks };
            }
          });
          if(Object.keys(completedTasksTodayStruct[cat.id]).length === 0) delete completedTasksTodayStruct[cat.id];
        });
        historyEntry = { completedTaskStructure: completedTasksTodayStruct, userNote: localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + date) || "" };
    } else { 
        const historyDataString = localStorage.getItem(historyKey);
        if (historyDataString) {
          try { historyEntry = JSON.parse(historyDataString); } catch (e) { console.error("Error parsing history for fullscreen:", e); return; }
        }
    }

    if (!historyEntry) { domElements.fullscreenModalArea.innerHTML = '<p>No content available for this day.</p>'; domElements.fullscreenContentModal.classList.remove('hidden'); return; }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    domElements.fullscreenModalArea.innerHTML = ''; 

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTaskStructure) {
            Object.keys(historyEntry.completedTaskStructure).forEach(catId => {
                const categoryData = historyEntry.completedTaskStructure[catId];
                const category = getCategoryById(catId);
                if(Object.keys(categoryData).length === 0) return;

                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                let categoryTitleHtml = `<h4 class="history-category-title">${getCategoryNameById(catId)}</h4>`;
                if (category && category.type === 'special') {
                     categoryTitleHtml = `<h4 class="history-category-title special-history-title">${getCategoryNameById(catId)}</h4>`;
                }
                catGroup.innerHTML = categoryTitleHtml;
                
                Object.values(categoryData).forEach(folderData => {
                    if (folderData.tasks && folderData.tasks.length > 0) {
                        hasContent = true;
                        catGroup.innerHTML += `<h5 class="history-folder-title" style="margin-left:10px; color: #A09CB8;">${folderData.name}</h5>`;
                        const ul = document.createElement('ul');
                        ul.style.paddingLeft = '30px';
                        folderData.tasks.forEach(taskText => {
                            ul.innerHTML += `<li><span>${taskText}</span></li>`;
                        });
                        catGroup.appendChild(ul);
                    }
                });
                 if(catGroup.querySelector('ul')) domElements.fullscreenModalArea.appendChild(catGroup);
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
    if (domElements.fullscreenContentModal) domElements.fullscreenContentModal.classList.add('hidden');
    currentFullscreenContent = null;
}

// Category Creation Flow
function openChooseCategoryTypeModal() {
    tempItemCreationData = {}; // Reset
    if (domElements.chooseCategoryTypeModal) domElements.chooseCategoryTypeModal.classList.remove('hidden');
    if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.focus();
}
function closeChooseCategoryTypeModal() {
    if (domElements.chooseCategoryTypeModal) domElements.chooseCategoryTypeModal.classList.add('hidden');
}
function handleSelectCategoryType(type) {
    tempItemCreationData = { itemType: 'category', categoryType: type };
    closeChooseCategoryTypeModal();
    openNameEntryModal('category');
}

// Folder Creation Flow
function openChooseFolderTypeModal(categoryId) {
    tempItemCreationData = { itemType: 'folder', categoryId: categoryId };
    if (domElements.chooseFolderTypeModal) domElements.chooseFolderTypeModal.classList.remove('hidden');
    if (domElements.selectTaskFolderButton) domElements.selectTaskFolderButton.focus();
}
function closeChooseFolderTypeModal() {
    if (domElements.chooseFolderTypeModal) domElements.chooseFolderTypeModal.classList.add('hidden');
}
function handleSelectFolderType(folderType) { // 'task' or 'note'
    if (!tempItemCreationData || tempItemCreationData.itemType !== 'folder') return;
    tempItemCreationData.folderType = folderType;
    closeChooseFolderTypeModal();
    openNameEntryModal('folder');
}

// Generic Name Entry Modal
function openNameEntryModal(mode) { // mode: 'category', 'folder', 'rename_category', 'rename_folder'
    if (!domElements.nameEntryModal || !domElements.nameEntryTitle || !domElements.nameEntryInput || !domElements.confirmNameEntryButton) return;
    
    tempItemCreationData.currentMode = mode; // Store current operation mode

    if (mode === 'category') {
        domElements.nameEntryTitle.textContent = 'Name Your New Category';
        domElements.confirmNameEntryButton.textContent = 'Create Category';
        domElements.nameEntryInput.value = '';
        domElements.nameEntryInput.placeholder = 'Enter category name';
    } else if (mode === 'folder') {
        domElements.nameEntryTitle.textContent = `Name Your New ${tempItemCreationData.folderType === 'task' ? 'Task' : 'Note'} Folder`;
        domElements.confirmNameEntryButton.textContent = 'Create Folder';
        domElements.nameEntryInput.value = '';
        domElements.nameEntryInput.placeholder = 'Enter folder name';
    } else if (mode === 'rename_category' && tempItemCreationData.existingName) {
        domElements.nameEntryTitle.textContent = 'Rename Category';
        domElements.confirmNameEntryButton.textContent = 'Rename';
        domElements.nameEntryInput.value = tempItemCreationData.existingName;
        domElements.nameEntryInput.placeholder = 'Enter new category name';
    } else if (mode === 'rename_folder' && tempItemCreationData.existingName) {
        domElements.nameEntryTitle.textContent = 'Rename Folder';
        domElements.confirmNameEntryButton.textContent = 'Rename';
        domElements.nameEntryInput.value = tempItemCreationData.existingName;
        domElements.nameEntryInput.placeholder = 'Enter new folder name';
    }

    domElements.nameEntryModal.classList.remove('hidden');
    domElements.nameEntryInput.focus();
    domElements.nameEntryInput.select();
}
function closeNameEntryModal() {
    if (domElements.nameEntryModal) domElements.nameEntryModal.classList.add('hidden');
    tempItemCreationData = null; // Clear temp data on close/cancel
}
function handleConfirmNameEntry() {
    if (!tempItemCreationData || !domElements.nameEntryInput) return;
    const name = domElements.nameEntryInput.value.trim();
    if (!name) {
        alert("Name cannot be empty.");
        return;
    }

    const mode = tempItemCreationData.currentMode;

    if (mode === 'category') {
        const newCategory = {
            id: createUniqueId('category'),
            name: name,
            order: currentCategories.length,
            deletable: true,
            type: tempItemCreationData.categoryType // 'standard' or 'special'
        };
        currentCategories.push(newCategory);
        foldersByCategoryId[newCategory.id] = []; 
        saveUserCategories(currentCategories);
        saveFoldersByCategoryId(foldersByCategoryId); // Ensure folders for new cat are saved
        renderTabs();
        renderAllCategorySections();
        switchTab(newCategory.id);
    } else if (mode === 'folder') {
        const { categoryId, folderType } = tempItemCreationData;
        if (!foldersByCategoryId[categoryId]) foldersByCategoryId[categoryId] = [];
        const newFolder = {
            id: createUniqueId('folder'),
            name: name,
            type: folderType, // 'task' or 'note'
            categoryId: categoryId,
            order: foldersByCategoryId[categoryId].length,
            content: folderType === 'task' ? [] : "" 
        };
        foldersByCategoryId[categoryId].push(newFolder);
        if (folderType === 'task') currentFolderEditModes[newFolder.id] = false; 
        saveFoldersByCategoryId(foldersByCategoryId);
        const categoryContentArea = document.querySelector(`#category-section-${categoryId} .category-content-area`);
        if (categoryContentArea) renderFolderSystemForCategory(categoryId, categoryContentArea);
    } else if (mode === 'rename_category') {
        const category = currentCategories.find(c => c.id === tempItemCreationData.id);
        if (category && name !== category.name) {
            category.name = name;
            saveUserCategories(currentCategories);
            renderTabs(); // Re-render tabs to show new name
            const titleElement = document.querySelector(`#category-section-${category.id} .category-title-text`);
            if (titleElement) titleElement.textContent = name;
        }
    } else if (mode === 'rename_folder') {
        const folder = findFolderById(tempItemCreationData.id);
        if (folder && name !== folder.name) {
            folder.name = name;
            saveFoldersByCategoryId(foldersByCategoryId);
            const categoryContentArea = document.querySelector(`#category-section-${folder.categoryId} .category-content-area`);
            if (categoryContentArea) renderFolderSystemForCategory(folder.categoryId, categoryContentArea);
        }
    }
    
    updateAllProgress(); // Update progress in case new standard tasks/cats affect it
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
        if (currentActiveViewId === 'main' && domElements.menuMainView) {
            domElements.menuMainView.classList.add('active-menu-item');
            domElements.menuMainView.focus();
        } else if (currentActiveViewId === 'live-clock' && domElements.menuLiveClock) {
            domElements.menuLiveClock.classList.add('active-menu-item');
            domElements.menuLiveClock.focus();
        } else if (currentActiveViewId === 'activity-dashboard' && domElements.menuActivityDashboard) {
            domElements.menuActivityDashboard.classList.add('active-menu-item');
            domElements.menuActivityDashboard.focus();
        } else if (menuItems.length > 0) {
            menuItems[0].focus();
        }
    } else {
        domElements.hamburgerButton.focus();
    }
}


function updateLiveClockDigital() {
    if (!domElements.liveClockTime || !domElements.liveClockPeriod || !domElements.liveClockDate) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const hoursStr = hours.toString().padStart(2, '0');

    domElements.liveClockTime.textContent = `${hoursStr}:${minutes}:${seconds}`;
    domElements.liveClockPeriod.textContent = period;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    domElements.liveClockDate.textContent = now.toLocaleDateString(undefined, options);
}

function drawAnalogClock() {
    if (!domElements.analogClockCanvas) return;
    const canvas = domElements.analogClockCanvas;
    const ctx = canvas.getContext('2d');
    const radius = canvas.height / 2;
    ctx.translate(radius, radius);

    ctx.clearRect(-radius, -radius, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D0C15'; 
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#00CFE8'; 
    ctx.fill();

    ctx.font = radius * 0.15 + "px Poppins";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = '#E0E0FF'; 
    for (let num = 1; num <= 12; num++) {
        const ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.75);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.75);
        ctx.rotate(-ang);
    }

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    let hourAngle = (hour % 12 + minute / 60) * Math.PI / 6 - Math.PI / 2;
    drawHand(ctx, hourAngle, radius * 0.5, radius * 0.06, '#BE93FD'); 

    let minuteAngle = (minute + second / 60) * Math.PI / 30 - Math.PI / 2;
    drawHand(ctx, minuteAngle, radius * 0.7, radius * 0.04, '#7FFFD4'); 

    let secondAngle = second * Math.PI / 30 - Math.PI / 2;
    drawHand(ctx, secondAngle, radius * 0.8, radius * 0.02, '#00CFE8'); 

    ctx.translate(-radius, -radius); 
}

function drawHand(ctx, pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.rotate(-pos);
}

function clearLiveClockIntervals() {
    if (liveClockInterval) clearInterval(liveClockInterval);
    if (analogClockInterval) clearInterval(analogClockInterval);
    liveClockInterval = null;
    analogClockInterval = null;
}

function showLiveClockView() {
    currentActiveViewId = 'live-clock';
    if (domElements.mainContentWrapper) domElements.mainContentWrapper.classList.add('hidden');
    if (domElements.dashboardColumnView) domElements.dashboardColumnView.classList.add('hidden');
    if (domElements.liveClockViewWrapper) {
        domElements.liveClockViewWrapper.classList.remove('hidden');
        if (domElements.analogClockContainer && domElements.analogClockCanvas) {
            const size = Math.min(domElements.analogClockContainer.clientWidth, domElements.analogClockContainer.clientHeight);
            domElements.analogClockCanvas.width = size;
            domElements.analogClockCanvas.height = size;
        }
    }
    
    updateLiveClockDigital();
    drawAnalogClock();
    clearLiveClockIntervals();
    liveClockInterval = setInterval(updateLiveClockDigital, 1000);
    analogClockInterval = setInterval(drawAnalogClock, 1000);

    isLiveClockFullscreen = false;
    if(domElements.liveClockViewWrapper) domElements.liveClockViewWrapper.classList.remove('fullscreen-active');
    if(domElements.liveClockFullscreenButton) {
        domElements.liveClockFullscreenButton.querySelector('.fullscreen-icon-expand').classList.remove('hidden');
        domElements.liveClockFullscreenButton.querySelector('.fullscreen-icon-contract').classList.add('hidden');
    }
    if(domElements.liveClockDigitalDisplayContainer) domElements.liveClockDigitalDisplayContainer.classList.remove('digital-hidden');

}

function showAppView() {
    currentActiveViewId = 'main';
    if (domElements.liveClockViewWrapper) domElements.liveClockViewWrapper.classList.add('hidden');
    if (domElements.dashboardColumnView) domElements.dashboardColumnView.classList.add('hidden');
    if (domElements.mainContentWrapper) domElements.mainContentWrapper.classList.remove('hidden');
    clearLiveClockIntervals();
}

function showActivityDashboardView() {
    currentActiveViewId = 'activity-dashboard';
    if (domElements.mainContentWrapper) domElements.mainContentWrapper.classList.add('hidden');
    if (domElements.liveClockViewWrapper) domElements.liveClockViewWrapper.classList.add('hidden');
    if (domElements.dashboardColumnView) {
        domElements.dashboardColumnView.classList.remove('hidden');
        updateDashboardSummaries(); 
    }
    clearLiveClockIntervals();
}

function toggleLiveClockFullscreen() {
    if (!domElements.liveClockViewWrapper || !domElements.liveClockFullscreenButton) return;
    isLiveClockFullscreen = !isLiveClockFullscreen;
    domElements.liveClockViewWrapper.classList.toggle('fullscreen-active', isLiveClockFullscreen);
    domElements.liveClockFullscreenButton.querySelector('.fullscreen-icon-expand').classList.toggle('hidden', isLiveClockFullscreen);
    domElements.liveClockFullscreenButton.querySelector('.fullscreen-icon-contract').classList.toggle('hidden', !isLiveClockFullscreen);

    if (domElements.analogClockContainer && domElements.analogClockCanvas) {
            const size = Math.min(domElements.analogClockContainer.offsetWidth, domElements.analogClockContainer.offsetHeight);
            domElements.analogClockCanvas.width = size;
            domElements.analogClockCanvas.height = size;
            drawAnalogClock(); 
    }
    if (!isLiveClockFullscreen && domElements.liveClockDigitalDisplayContainer) {
        domElements.liveClockDigitalDisplayContainer.classList.remove('digital-hidden');
    }
}


function initializeApp() {
    // Cache DOM elements
    Object.keys(domElements).forEach(key => {
        const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        domElements[key] = document.getElementById(id);
    });

    // Specific overrides for elements not matching the auto-generated ID
    domElements.tabsContainer = document.getElementById('tabs');
    domElements.tabContentsContainer = document.getElementById('tab-content');
    domElements.categorySectionTemplate = document.getElementById('category-section-template');
    domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
    domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
    domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
    domElements.folderOptionsContextMenu = document.getElementById('folder-options-context-menu');
    domElements.ctxRenameFolderButton = document.getElementById('ctx-rename-folder');
    domElements.ctxDeleteFolderButton = document.getElementById('ctx-delete-folder');
    domElements.dashboardColumnView = document.getElementById('dashboard-column');
    domElements.taskEditControlsTemplate = document.getElementById('task-edit-controls-template');
    domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
    domElements.mobileProgressLocation = document.getElementById('mobile-progress-location');
    domElements.liveClockDigitalDisplayContainer = document.getElementById('live-clock-digital-display-container');
    domElements.nameEntryActions = document.getElementById('name-entry-actions'); // Ensure this is cached
    // Folder Type Choice Modal elements
    domElements.chooseFolderTypeModal = document.getElementById('choose-folder-type-modal');
    domElements.chooseFolderTypeCloseButton = document.getElementById('choose-folder-type-close-button');
    domElements.chooseFolderTypeTitleText = document.getElementById('choose-folder-type-title-text');


    loadAppData();
    renderTabs();
    renderAllCategorySections(); 
    
    if (domElements.dashboardColumnView) { 
        domElements.dashboardColumnView.classList.add('hidden');
    }
    showAppView(); 
    switchTab('dashboard'); 
    
    updateAllProgress();
    updateLayoutBasedOnScreenSize(); 

    // Hamburger Menu Event Listeners
    if (domElements.hamburgerButton) domElements.hamburgerButton.addEventListener('click', toggleSidePanel);
    if (domElements.sidePanelOverlay) domElements.sidePanelOverlay.addEventListener('click', toggleSidePanel);
    
    if (domElements.menuMainView) { 
        domElements.menuMainView.addEventListener('click', () => {
            showAppView();
            switchTab('dashboard'); 
            toggleSidePanel();
        });
    }
    if (domElements.menuLiveClock) {
        domElements.menuLiveClock.addEventListener('click', () => {
            showLiveClockView();
            toggleSidePanel();
        });
    }
    if (domElements.menuActivityDashboard) {
        domElements.menuActivityDashboard.addEventListener('click', () => {
            showActivityDashboardView();
            toggleSidePanel();
        });
    }
    if (domElements.liveClockFullscreenButton) {
        domElements.liveClockFullscreenButton.addEventListener('click', toggleLiveClockFullscreen);
    }
    if (domElements.liveClockViewWrapper) {
        domElements.liveClockViewWrapper.addEventListener('click', (e) => {
            if (isLiveClockFullscreen && e.target !== domElements.liveClockFullscreenButton && !domElements.liveClockFullscreenButton.contains(e.target)) {
                 if(domElements.liveClockDigitalDisplayContainer) {
                    domElements.liveClockDigitalDisplayContainer.classList.toggle('digital-hidden');
                 }
            }
        });
    }

    // Category Creation
    if (domElements.addCategoryButton) domElements.addCategoryButton.addEventListener('click', openChooseCategoryTypeModal);
    if (domElements.chooseCategoryTypeCloseButton) domElements.chooseCategoryTypeCloseButton.addEventListener('click', closeChooseCategoryTypeModal);
    if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.addEventListener('click', () => handleSelectCategoryType('standard'));
    if (domElements.selectSpecialCategoryButton) domElements.selectSpecialCategoryButton.addEventListener('click', () => handleSelectCategoryType('special'));

    // Generic Name Entry Modal
    if (domElements.nameEntryCloseButton) domElements.nameEntryCloseButton.addEventListener('click', closeNameEntryModal);
    if (domElements.confirmNameEntryButton) domElements.confirmNameEntryButton.addEventListener('click', handleConfirmNameEntry);
    if (domElements.cancelNameEntryButton) domElements.cancelNameEntryButton.addEventListener('click', closeNameEntryModal);
    if (domElements.nameEntryInput) domElements.nameEntryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmNameEntry();
        }
    });


    if (domElements.tabsContainer) {
        domElements.tabsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('tab-button') && event.target.dataset.categoryId) {
                switchTab(event.target.dataset.categoryId);
            } else if (event.target.id === 'dashboard-tab-button') {
                switchTab('dashboard');
            }
        });
    }
    
    document.addEventListener('dragover', (e) => {
        if (e.target.classList.contains('task-list') || e.target.closest('.task-list')) {
            e.preventDefault();
            if (!draggedTaskElement) return;

            const taskList = e.target.closest('.task-list');
            if (!taskList) return;

            taskList.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
                el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
            });

            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                const lastTask = taskList.querySelector('.task-item:not(.dragging):last-child');
                if (lastTask && lastTask !== draggedTaskElement) {
                     lastTask.classList.add('drag-over-indicator-task-bottom');
                }
            } else {
                if (afterElement !== draggedTaskElement) {
                     afterElement.classList.add('drag-over-indicator-task');
                }
            }
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('drop', (e) => {
        if (e.target.classList.contains('task-list') || e.target.closest('.task-list')) {
            e.preventDefault();
            if (!draggedTaskElement) return;
            
            const taskList = e.target.closest('.task-list');
            if (!taskList) return;

            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                taskList.appendChild(draggedTaskElement);
            } else {
                taskList.insertBefore(draggedTaskElement, afterElement);
            }
        }
    });

    if (domElements.calendarPrevMonthButton) domElements.calendarPrevMonthButton.addEventListener('click', () => {
      calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
      renderCalendar();
    });
    if (domElements.calendarNextMonthButton) domElements.calendarNextMonthButton.addEventListener('click', () => {
      calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
      renderCalendar();
    });
    if (domElements.calendarMonthYearButton) domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
    if (domElements.monthYearPickerCloseButton) domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
    
    if (domElements.saveNoteButton) domElements.saveNoteButton.addEventListener('click', saveDailyNote);
    if (domElements.dailyNoteInput) domElements.dailyNoteInput.addEventListener('input', () => {
        if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note'; 
    });

    if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
    if (domElements.saveHistoricalNoteButton) domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
    if (domElements.clearHistoricalNoteButton) domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
    if (domElements.expandTasksButton) domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));
    if (domElements.fullscreenModalCloseButton) domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);

    if (domElements.deleteConfirmationCloseButton) domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
    if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
    if (domElements.cancelDeleteButton) domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
    
    // Folder Type Choice Modal Listeners
    if (domElements.chooseFolderTypeCloseButton) domElements.chooseFolderTypeCloseButton.addEventListener('click', closeChooseFolderTypeModal);
    if (domElements.selectTaskFolderButton) domElements.selectTaskFolderButton.addEventListener('click', () => handleSelectFolderType('task'));
    if (domElements.selectNoteFolderButton) domElements.selectNoteFolderButton.addEventListener('click', () => handleSelectFolderType('note'));

    // Context Menu global listeners
    document.addEventListener('click', () => {
        hideCategoryContextMenu();
        hideFolderContextMenu();
    });
    if(domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.addEventListener('click', (e) => e.stopPropagation());
    if(domElements.folderOptionsContextMenu) domElements.folderOptionsContextMenu.addEventListener('click', (e) => e.stopPropagation());
    
    if(domElements.ctxRenameCategoryButton) domElements.ctxRenameCategoryButton.addEventListener('click', handleRenameCategoryAction);
    if(domElements.ctxDeleteCategoryButton) domElements.ctxDeleteCategoryButton.addEventListener('click', handleDeleteCategoryAction);
    if(domElements.ctxRenameFolderButton) domElements.ctxRenameFolderButton.addEventListener('click', handleRenameFolderAction);
    if(domElements.ctxDeleteFolderButton) domElements.ctxDeleteFolderButton.addEventListener('click', handleDeleteFolderAction);
    
    window.addEventListener('resize', updateLayoutBasedOnScreenSize);
}

function updateLayoutBasedOnScreenSize() {
    if (currentActiveViewId === 'live-clock' && domElements.liveClockViewWrapper && !domElements.liveClockViewWrapper.classList.contains('hidden')) {
        if (domElements.analogClockContainer && domElements.analogClockCanvas) {
            const parentStyle = window.getComputedStyle(domElements.analogClockContainer);
            const newSize = Math.min(parseInt(parentStyle.width, 10), parseInt(parentStyle.height, 10));
            if (domElements.analogClockCanvas.width !== newSize || domElements.analogClockCanvas.height !== newSize) {
                 domElements.analogClockCanvas.width = newSize;
                 domElements.analogClockCanvas.height = newSize;
                 drawAnalogClock();
            }
        }
    }
}

function showCategoryContextMenu(categoryId, targetButton) {
    hideFolderContextMenu(); 
    if (!domElements.categoryTabContextMenu) return;
    currentContextMenuTargetTab = targetButton;
    
    const category = currentCategories.find(c => c.id === categoryId);
    if (domElements.ctxDeleteCategoryButton) {
        domElements.ctxDeleteCategoryButton.disabled = category ? (category.deletable === false) : true;
        domElements.ctxDeleteCategoryButton.title = (category && category.deletable === false) ? "Default categories cannot be deleted." : "Delete this category";
    }

    const rect = targetButton.getBoundingClientRect();
    domElements.categoryTabContextMenu.style.top = `${rect.bottom + window.scrollY}px`;
    domElements.categoryTabContextMenu.style.left = `${rect.left + window.scrollX}px`;
    domElements.categoryTabContextMenu.classList.remove('hidden');
    domElements.categoryTabContextMenu.querySelector('button:not([disabled])')?.focus();
}
function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.classList.add('hidden');
    currentContextMenuTargetTab = null;
    document.querySelectorAll('.tab-options-icon.visible').forEach(icon => icon.classList.remove('visible'));
}
function handleRenameCategoryAction() {
    if (!currentContextMenuTargetTab) return;
    const categoryId = currentContextMenuTargetTab.dataset.categoryId;
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    tempItemCreationData = { id: category.id, existingName: category.name };
    openNameEntryModal('rename_category');
    hideCategoryContextMenu();
}
function handleDeleteCategoryAction() {
    if (!currentContextMenuTargetTab) return;
    const categoryId = currentContextMenuTargetTab.dataset.categoryId;
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category || category.deletable === false) {
         if (category) alert(`Category "${category.name}" is a default category and cannot be deleted.`);
         hideCategoryContextMenu();
         return;
    }
    showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}" and all its folders and tasks? This action cannot be undone.`, category.name);
    hideCategoryContextMenu();
}

function showFolderContextMenu(folder, targetBoxElement) {
    hideCategoryContextMenu();
    if (!domElements.folderOptionsContextMenu) return;
    currentContextMenuTargetFolderBox = targetBoxElement; 
    
    domElements.folderOptionsContextMenu.dataset.folderId = folder.id; 
    domElements.folderOptionsContextMenu.dataset.categoryId = folder.categoryId;

    const rect = targetBoxElement.getBoundingClientRect();
    domElements.folderOptionsContextMenu.style.top = `${rect.bottom + window.scrollY}px`;
    domElements.folderOptionsContextMenu.style.left = `${rect.left + window.scrollX}px`;
    domElements.folderOptionsContextMenu.classList.remove('hidden');
    domElements.folderOptionsContextMenu.querySelector('button')?.focus();
}
function hideFolderContextMenu() {
    if (domElements.folderOptionsContextMenu) domElements.folderOptionsContextMenu.classList.add('hidden');
    currentContextMenuTargetFolderBox = null;
    document.querySelectorAll('.folder-options-trigger.visible').forEach(icon => icon.classList.remove('visible'));
}
function handleRenameFolderAction() {
    if (!domElements.folderOptionsContextMenu) return;
    const folderId = domElements.folderOptionsContextMenu.dataset.folderId;
    const folder = findFolderById(folderId);
    if (folder) {
        tempItemCreationData = { id: folder.id, categoryId: folder.categoryId, existingName: folder.name };
        openNameEntryModal('rename_folder');
    }
    hideFolderContextMenu();
}
function handleDeleteFolderAction() {
    if (!domElements.folderOptionsContextMenu) return;
    const folderId = domElements.folderOptionsContextMenu.dataset.folderId;
    const folder = findFolderById(folderId);
    if (folder) {
        const message = (folder.type === 'task' && folder.content && folder.content.length > 0) || (folder.type === 'note' && folder.content && folder.content.trim() !== "")
        ? `Folder "${folder.name}" contains data. Are you sure you want to delete it and all its contents?`
        : `Are you sure you want to delete the folder "${folder.name}"?`;
        showDeleteConfirmation('folder', folder.id, message, folder.name, folder.categoryId);
    }
    hideFolderContextMenu();
}

document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', () => {
    if (currentActiveViewId === 'live-clock') { 
        // No specific save needed for clock view on unload
    }
});
