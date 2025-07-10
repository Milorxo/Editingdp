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

// Keys
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_'; 
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; 
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; 
const APP_CONTENT_KEY = 'lifeTrackerAppContent_v1'; // Hierarchical content structure
const CHECKLIST_ITEM_STATE_KEY_PREFIX = 'lifeTrackerChecklistState_';

let currentCategories = []; 
let appContent = {}; // Main data structure for all items (folders, notes, tasks)

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let itemToDelete = null; 
let currentPath = []; // Breadcrumb path: [{ id, name, type }, ...]
let currentViewMode = 'medium'; // 'large', 'medium', 'detail'
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
let liveClockInterval = null;
let analogClockInterval = null; 
let currentActiveViewId = 'main'; // 'main', 'live-clock', 'activity-dashboard'
let isLiveClockFullscreen = false;
let currentlyEditingNote = null; // { id, name, content }
let currentlyEditingTaskList = null; // The task list being managed in the modal
let isTaskListEditMode = false;
let draggedItemId = null; // ID of the item being dragged

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
  dashboardTabButton: null,

  mobileProgressLocation: null,

  tabsContainer: null,
  tabContentsContainer: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  
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

    const progressStandardOnly = calculateProgressForDate(today, true);
    
    const completedTasksTodayStruct = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id] || cat.type === 'special') return;
      
      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      const completedTasksForCat = [];
      taskLists.forEach(taskList => {
          const completedInList = (taskList.content || []).filter(checklistItem => localStorage.getItem(getChecklistItemStateStorageKey(today, checklistItem.id)) === 'true');
          if (completedInList.length > 0) {
              completedTasksForCat.push(...completedInList.map(ci => ci.text));
          }
      });

      if (completedTasksForCat.length > 0) {
        completedTasksTodayStruct[cat.id] = { name: cat.name, tasks: completedTasksForCat };
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
        dailyTargetPoints: DAILY_TARGET_POINTS
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
    
    const { pointsEarned, percentage, totalStandardTasks } = calculateProgressForDate(dateToSave, true);
    
    const completedTasksHistory = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id] || cat.type === 'special') return;
      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      taskLists.forEach(taskList => {
        const completedChecklistItems = (taskList.content || []).filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateToSave, ci.id)) === 'true');
        if(completedChecklistItems.length > 0) {
            if (!completedTasksHistory[cat.id]) {
                completedTasksHistory[cat.id] = { name: cat.name, tasks: [] };
            }
            completedTasksHistory[cat.id].tasks.push(...completedChecklistItems.map(ci => ci.text));
        }
      });
    });

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    
    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory,
        userNote: mainReflection, 
        pointsEarned: pointsEarned,
        percentageCompleted: percentage,
        totalTasksOnDate: totalStandardTasks,
        dailyTargetPoints: DAILY_TARGET_POINTS
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    currentCategories.forEach(cat => {
        if (!appContent[cat.id]) return;
        getAllTaskListFiles(appContent[cat.id]).forEach(taskList => {
            (taskList.content || []).forEach(checklistItem => {
                localStorage.removeItem(getChecklistItemStateStorageKey(dateToSave, checklistItem.id));
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

    if (domElements.todayPointsStat) domElements.todayPointsStat.classList.add('progress-value-resetting');
    if (domElements.todayProgressFill) domElements.todayProgressFill.classList.add('progress-value-resetting');
    
    updateAllProgress();

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

function showDeleteConfirmation(type, id, message, nameForConfirmation = '') {
    const found = findItemAndParent(id);
    const parentId = found?.parent?.id;
    itemToDelete = { type, id, nameForConfirmation, parentId };
    
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
            itemEl.addEventListener('animationend', () => {
                renderCategorySectionContent(currentPath[0].id);
            });
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
        <button class="icon-button" data-type="folder" title="Add Folder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg></button>
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
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>`;
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

function insertImageIntoNote(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const wrapper = document.createElement('div');
        wrapper.className = 'note-image-wrapper';
        wrapper.contentEditable = 'false';

        const img = document.createElement('img');
        img.src = e.target.result;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'note-image-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = () => wrapper.remove();

        wrapper.appendChild(img);
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
    reader.readAsDataURL(file);
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
    currentlyEditingTaskList = null;
    isTaskListEditMode = false;
    renderCategorySectionContent(currentPath[0].id);
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
            if (newText && newText.trim() !== '') {
                checklistItem.text = newText.trim();
                renderChecklist(); 
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
        const category = getCategoryById(activeTabId);
        currentPath = [{ id: activeTabId, name: category.name, type: 'category' }];
        renderCategorySectionContent(activeTabId); 
    } else {
        currentPath = [];
    }
}

function calculateProgressForDate(dateString, standardOnlyStats = false) {
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

  const percentage = totalChecklistItemsForCalc > 0 ? Math.round((completedCount / totalChecklistItemsForCalc) * 100) : 0;
  const pointsPerTask = totalStandardChecklistItemsCount > 0 ? DAILY_TARGET_POINTS / totalStandardChecklistItemsCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);
  
  return { 
    percentage, pointsEarned, completedCount,
    totalTasks: totalChecklistItemsForCalc, totalStandardTasks: totalStandardChecklistItemsCount
  };
}

function updateDashboardSummaries() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

  currentCategories.forEach(category => {
    if (category.id === 'dashboard' || category.type === 'special') return;
    
    const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
    let totalItems = 0;
    let completedItems = 0;
    allCategoryTaskLists.forEach(tl => {
        const checklistItems = tl.content || [];
        totalItems += checklistItems.length;
        completedItems += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
    });

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'dashboard-category-summary';
    summaryDiv.innerHTML = `<h3>${category.name}</h3><p class="category-stats">${completedItems} / ${totalItems}</p>`;
    if (totalItems > 0 && completedItems === totalItems) {
        summaryDiv.querySelector('.category-stats').classList.add('fully-completed');
    }
    domElements.dashboardSummariesContainer.appendChild(summaryDiv);
  });
}

function updateTodaysProgress() {
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
  const progress = calculateProgressForDate(today, true);
  
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
        if ((todayNormalized.getTime() - currentWeekStartDate.getTime()) / (1000 * 60 * 60 * 24) >= 7) { 
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
            pointsForDay = calculateProgressForDate(dateStringForIter, true).pointsEarned;
        } else { 
            const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter);
            if (historyDataString) {
                try { pointsForDay = JSON.parse(historyDataString).pointsEarned || 0; } catch (e) { /* ignore */ }
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
    
    let percentageCompleted = 0;
    let hasHistoryData = false; 
    const fillDiv = cell.querySelector('.calendar-day-fill');
    fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.1)'; 

    if (dateString === todayDateStr) { 
        cell.classList.add('current-day');
        const progress = calculateProgressForDate(dateString, true);
        percentageCompleted = progress.percentage;
        fillDiv.style.backgroundColor = getProgressFillColor(percentageCompleted); 
        if (percentageCompleted > 40) cell.classList.add('high-fill'); 
        const anyTaskProgress = calculateProgressForDate(dateString, false);
        hasHistoryData = anyTaskProgress.completedCount > 0 || !!localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString);
    } else { 
        const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
        if (historyDataString) { 
            try {
                const historyEntry = JSON.parse(historyDataString);
                percentageCompleted = historyEntry.percentageCompleted || 0;
                fillDiv.style.backgroundColor = getProgressFillColor(percentageCompleted);
                if (cellDate < todayNorm) fillDiv.style.opacity = '0.7'; 
                hasHistoryData = (historyEntry.completedTaskStructure && Object.values(historyEntry.completedTaskStructure).some(cat => cat.tasks && cat.tasks.length > 0)) || !!historyEntry.userNote;
            } catch(e) { 
                if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; 
            }
        } else if (cellDate < todayNorm) { 
             fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)';
        }
        if (cellDate < todayNorm) cell.classList.add('calendar-day-past');
    }

    if (hasHistoryData) cell.classList.add('has-history');
    fillDiv.style.height = `${percentageCompleted}%`;
    
    cell.addEventListener('click', () => showHistoryModal(dateString));
    domElements.calendarGrid.appendChild(cell);
  }
}

function showHistoryModal(dateString) {
  currentModalDate = dateString;
  if (!domElements.historyModal) return;
  domElements.historyModal.classList.add('opening');

  const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
  let historyEntryToDisplay = null;

  if (dateString === getTodayDateString() && !localStorage.getItem(historyKey)) {
    updateTodaysHistoryEntry();
  }
  
  const historyDataString = localStorage.getItem(historyKey);

  if (historyDataString) {
    try {
      historyEntryToDisplay = JSON.parse(historyDataString);
      if (historyEntryToDisplay.totalTasksOnDate === undefined) {
        const tempProgress = calculateProgressForDate(dateString, true);
        historyEntryToDisplay.totalTasksOnDate = tempProgress.totalStandardTasks;
      }
      if (historyEntryToDisplay.dailyTargetPoints === undefined) {
        historyEntryToDisplay.dailyTargetPoints = DAILY_TARGET_POINTS;
      }
    } catch (e) { console.error("Error parsing history for modal:", e); }
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
            Object.values(historyEntryToDisplay.completedTaskStructure).forEach(catData => {
                 if (catData.tasks && catData.tasks.length > 0) {
                    hasCompletedTasks = true;
                    const categoryGroup = document.createElement('div');
                    categoryGroup.className = 'history-category-group';
                    categoryGroup.innerHTML = `<h5 class="history-category-title">${catData.name}</h5>`;
                    const ul = document.createElement('ul');
                    catData.tasks.forEach(taskText => {
                        ul.innerHTML += `<li><span>${taskText}</span></li>`;
                    });
                    categoryGroup.appendChild(ul);
                    domElements.historyTasksList.appendChild(categoryGroup);
                }
            });
        }
        if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    }
    if (domElements.expandTasksButton) domElements.expandTasksButton.classList.toggle('hidden', !Object.values(historyEntryToDisplay.completedTaskStructure || {}).some(cat => cat.tasks && cat.tasks.length > 0));

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
  if (domElements.historyModal) {
    domElements.historyModal.classList.add('hidden');
    domElements.historyModal.classList.remove('opening');
  }
  currentModalDate = null; 
}

function saveHistoricalNote() {
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;
    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    let historyEntry;

    const existingHistoryStr = localStorage.getItem(historyKey);
    if (existingHistoryStr) {
        try { historyEntry = JSON.parse(existingHistoryStr); } catch (e) { return; }
    } else {
        const progress = calculateProgressForDate(currentModalDate, true);
        historyEntry = {
            date: currentModalDate, completedTaskStructure: {}, userNote: "",
            pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage,
            totalTasksOnDate: progress.totalStandardTasks, dailyTargetPoints: DAILY_TARGET_POINTS
        };
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    if (currentModalDate === getTodayDateString()) {
        if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = noteContent;
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
        domElements.monthYearPickerModal.classList.add('opening');
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        populateMonthYearPicker();
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else {
        domElements.monthYearPickerModal.classList.add('hidden');
        domElements.monthYearPickerModal.classList.remove('opening');
    }
}

function closeMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
    domElements.monthYearPickerModal.classList.remove('opening');
}

function updateCategoryTabIndicators() {
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    currentCategories.forEach(category => {
        const tabButton = document.getElementById(`tab-button-${category.id}`);
        if (!tabButton) return;

        tabButton.querySelector('.notification-badge')?.remove();
        tabButton.classList.remove('category-complete-indicator');

        if (category.type === 'special') return;

        const allTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        let totalTasksInCat = 0;
        let completedTasksInCat = 0;

        allTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalTasksInCat += checklistItems.length;
            completedTasksInCat += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
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
    
    tempItemCreationData = { mode, type, existingItem };

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

    const { mode, type, existingItem } = tempItemCreationData;

    if (mode === 'create') {
        const parentList = getItemsForPath(currentPath);
        const newItem = {
            id: createUniqueId(type),
            name: name,
            type: type,
            order: parentList.length
        };

        if (type === 'folder') newItem.content = [];
        else if (type === 'note') newItem.content = '';
        else if (type === 'tasklist') newItem.content = [];

        parentList.push(newItem);

    } else if (mode === 'rename' && existingItem) {
        const found = findItemAndParent(existingItem.id);
        if (found) {
            found.item.name = name;
        }
    } else if (mode === 'rename_category') { // Special case for categories
        const category = currentCategories.find(c => c.id === existingItem.id);
        if (category) {
            category.name = name;
            saveUserCategories(currentCategories);
            renderTabs();
            document.querySelector(`#category-section-${category.id} .category-title-text`).textContent = name;
            closeNameEntryModal();
            return;
        }
    }
    
    saveAppContent();
    renderCategorySectionContent(currentPath[0].id);
    updateAllProgress();
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


function initializeApp() {
    Object.keys(domElements).forEach(key => {
        const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        domElements[key] = document.getElementById(id);
    });

    domElements.tabsContainer = document.getElementById('tabs');
    domElements.tabContentsContainer = document.getElementById('tab-content');
    domElements.categorySectionTemplate = document.getElementById('category-section-template');
    domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
    domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
    domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
    domElements.dashboardColumnView = document.getElementById('dashboard-column');
    domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
    domElements.mobileProgressLocation = document.getElementById('mobile-progress-location');
    domElements.liveClockDigitalDisplayContainer = document.getElementById('live-clock-digital-display-container');
    domElements.nameEntryActions = document.getElementById('name-entry-actions');


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

    // Event Listeners
    if (domElements.dashboardTabButton) domElements.dashboardTabButton.addEventListener('click', () => switchTab('dashboard'));

    if (domElements.hamburgerButton) domElements.hamburgerButton.addEventListener('click', toggleSidePanel);
    if (domElements.sidePanelOverlay) domElements.sidePanelOverlay.addEventListener('click', toggleSidePanel);
    
    if (domElements.menuMainView) domElements.menuMainView.addEventListener('click', () => { showAppView(); switchTab('dashboard'); toggleSidePanel(); });
    if (domElements.menuLiveClock) domElements.menuLiveClock.addEventListener('click', () => { showLiveClockView(); toggleSidePanel(); });
    if (domElements.menuActivityDashboard) domElements.menuActivityDashboard.addEventListener('click', () => { showActivityDashboardView(); toggleSidePanel(); });
    
    if (domElements.liveClockFullscreenButton) domElements.liveClockFullscreenButton.addEventListener('click', toggleLiveClockFullscreen);
    if (domElements.liveClockViewWrapper) domElements.liveClockViewWrapper.addEventListener('click', (e) => {
        if (isLiveClockFullscreen && e.target !== domElements.liveClockFullscreenButton && !domElements.liveClockFullscreenButton.contains(e.target)) {
             if(domElements.liveClockDigitalDisplayContainer) domElements.liveClockDigitalDisplayContainer.classList.toggle('digital-hidden');
        }
    });

    if (domElements.addCategoryButton) domElements.addCategoryButton.addEventListener('click', openChooseCategoryTypeModal);
    if (domElements.chooseCategoryTypeCloseButton) domElements.chooseCategoryTypeCloseButton.addEventListener('click', closeChooseCategoryTypeModal);
    if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.addEventListener('click', () => handleSelectCategoryType('standard'));
    if (domElements.selectSpecialCategoryButton) domElements.selectSpecialCategoryButton.addEventListener('click', () => handleSelectCategoryType('special'));

    if (domElements.nameEntryCloseButton) domElements.nameEntryCloseButton.addEventListener('click', closeNameEntryModal);
    if (domElements.confirmNameEntryButton) domElements.confirmNameEntryButton.addEventListener('click', handleConfirmNameEntry);
    if (domElements.cancelNameEntryButton) domElements.cancelNameEntryButton.addEventListener('click', closeNameEntryModal);
    if (domElements.nameEntryInput) domElements.nameEntryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleConfirmNameEntry(); }
    });

    if (domElements.noteEditorCloseButton) domElements.noteEditorCloseButton.addEventListener('click', closeNoteEditorModal);
    if (domElements.noteAddImageButton) domElements.noteAddImageButton.addEventListener('click', handleAddImageToNote);
    if (domElements.imageUploadInput) domElements.imageUploadInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) insertImageIntoNote(e.target.files[0]);
    });

    if (domElements.taskListCloseButton) domElements.taskListCloseButton.addEventListener('click', closeTaskListModal);
    if (domElements.taskListEditButton) domElements.taskListEditButton.addEventListener('click', toggleTaskListEditMode);
    if (domElements.taskListResetButton) domElements.taskListResetButton.addEventListener('click', handleResetTasks);
    if (domElements.addChecklistItemForm) domElements.addChecklistItemForm.addEventListener('submit', handleAddChecklistItem);

    if (domElements.calendarPrevMonthButton) domElements.calendarPrevMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendar(); });
    if (domElements.calendarNextMonthButton) domElements.calendarNextMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendar(); });
    if (domElements.calendarMonthYearButton) domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
    if (domElements.monthYearPickerCloseButton) domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
    
    if (domElements.saveNoteButton) domElements.saveNoteButton.addEventListener('click', saveDailyNote);
    if (domElements.dailyNoteInput) domElements.dailyNoteInput.addEventListener('input', () => { if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note'; });

    if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
    if (domElements.saveHistoricalNoteButton) domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
    if (domElements.clearHistoricalNoteButton) domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
    if (domElements.expandTasksButton) domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));
    if (domElements.fullscreenModalCloseButton) domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);

    if (domElements.deleteConfirmationCloseButton) domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
    if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
    if (domElements.cancelDeleteButton) domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
    
    document.addEventListener('click', (e) => {
        hideCategoryContextMenu();
        hideItemContextMenu();
        const addActionContainer = document.querySelector('.add-action-container');
        const viewModeContainer = document.querySelector('.view-mode-container');
        if (isAddActionMenuOpen && addActionContainer && !addActionContainer.contains(e.target)) {
            isAddActionMenuOpen = false;
            addActionContainer.classList.remove('open');
        }
        if (viewModeContainer && viewModeContainer.classList.contains('open') && !viewModeContainer.contains(e.target)) {
            viewModeContainer.classList.remove('open');
        }
    });
    if(domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.addEventListener('click', (e) => e.stopPropagation());
    
    if(domElements.ctxRenameCategoryButton) domElements.ctxRenameCategoryButton.addEventListener('click', handleRenameCategoryAction);
    if(domElements.ctxDeleteCategoryButton) domElements.ctxDeleteCategoryButton.addEventListener('click', handleDeleteCategoryAction);
    
    window.addEventListener('resize', updateLayoutBasedOnScreenSize);
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
        
        if(activeTabId === category.id) {
             renderCategorySectionContent(category.id);
        }

        domElements.tabContentsContainer.appendChild(sectionElement);
    });
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
    
    openNameEntryModal('rename_category', 'category', category);
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
    showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}" and all its contents? This action cannot be undone.`, category.name);
    hideCategoryContextMenu();
}

function showItemContextMenu(buttonElement, item) {
    hideItemContextMenu(); // Hide any existing menu
    
    const menu = document.createElement('div');
    menu.id = 'item-context-menu';
    menu.className = 'context-menu item-options-popover'; // Reuse styles
    menu.innerHTML = `
        <button class="item-rename-ctx">Rename</button>
        <button class="item-delete-ctx">Delete</button>
    `;

    document.body.appendChild(menu);
    itemContextMenu.element = menu;
    itemContextMenu.target = buttonElement;

    menu.querySelector('.item-rename-ctx').onclick = () => {
        openNameEntryModal('rename', item.type, item);
        hideItemContextMenu();
    };
    menu.querySelector('.item-delete-ctx').onclick = () => {
        showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}? This action cannot be undone.`);
        hideItemContextMenu();
    };

    const rect = buttonElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${rect.right + window.scrollX - menu.offsetWidth}px`;
}
function hideItemContextMenu() {
    if (itemContextMenu.element) {
        itemContextMenu.element.remove();
        itemContextMenu.element = null;
        itemContextMenu.target = null;
    }
}


document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', () => {
    if (currentlyEditingNote) {
        closeNoteEditorModal();
    }
    if (currentlyEditingTaskList) {
        closeTaskListModal();
    }
});
