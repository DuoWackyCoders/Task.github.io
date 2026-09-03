todoMain();

// Start of js

function todoMain() {
    const DEFAULT_OPTION = "Choose Category";

    let inputElem,
        inputElem2,
        dateInput,
        setTodayBtn,
        setTomorrowBtn,
        timeInput,
        addButton,
        sortButton,
        selectElem,
        todoList = [],
        calendar,
        shortlistBtn,
        changeBtn,
        quickTimePicker,
        quickTimePreview,
        selectedHour12 = null,
        selectedMinute = null,
        selectedAmPm = null,
        todoTable,
        draggingElement,
        currentPage = 1,
        itemsPerPage = Number.parseInt(localStorage.getItem("todo-itemsPerPage")) || 15,
        totalPages = 0,
        itemsPerPageSelectElem,
        peginationCtnr,
        todoModelCloseBtn,
        launchPendingBtn,
        themeSelect,
        categoryListElem,
        subcategoryInput,
        addSubcategoryBtn,
        todoEditSubcategoryInput,
        todoEditAddSubcategoryBtn,
        categorySubcategoryMap,
        briefingOverlay,
        briefingModal,
        briefingCloseBtn,
        briefingFooterCloseBtn,
        briefingSubtitle,
        briefingList,
        todoEditDoneCheckbox;



    getElements();
    applyStoredTheme();
    loadCategorySubcategoryMap();
    addListeners();
    initCalendar();
    load();
    defaultDateToTodayIfEmpty();
    clearTable();                  // ✅ ensure calendar/table start clean
    renderRows(todoList);
    updateSelectOptions();
    refreshSubcategoryUI();


    function getElements() {
        inputElem = document.getElementById("todoInput");
        inputElem2 = document.getElementById("categoryInput");
        dateInput = document.getElementById("dateInput");
        setTodayBtn = document.getElementById("setTodayBtn");
        setTomorrowBtn = document.getElementById("setTomorrowBtn");
        timeInput = document.getElementById("timeInput");
        addButton = document.getElementById("addBtn");
        sortButton = document.getElementById("sortBtn");
        selectElem = document.getElementById("categoryFilter");
        shortlistBtn = document.getElementById("shortlistBtn");
        changeBtn = document.getElementById("changeBtn");
        todoTable = document.getElementById("todoTable");
        itemsPerPageSelectElem = document.getElementById("itemsPerPageSelectElem");
        peginationCtnr = document.querySelector(".pagination-pages");
        todoModelCloseBtn = document.getElementById("todo-model-close-btn");
        launchPendingBtn = document.getElementById("launchPendingBtn");

        themeSelect = document.getElementById("themeSelect");
        categoryListElem = document.getElementById("categoryList");
        subcategoryInput = document.getElementById("subcategoryInput");
        addSubcategoryBtn = document.getElementById("addSubcategoryBtn");
        todoEditSubcategoryInput = document.getElementById("todo-edit-subcategory");
        todoEditAddSubcategoryBtn = document.getElementById("todoEditAddSubcategoryBtn");

        quickTimePicker = document.getElementById("quickTimePicker");
        quickTimePreview = document.getElementById("quickTimePreview");

        briefingOverlay = document.getElementById("briefing-overlay");
        briefingModal = document.getElementById("briefing-modal");
        briefingCloseBtn = document.getElementById("briefing-close-btn");
        briefingFooterCloseBtn = document.getElementById("briefing-footer-close-btn");
        briefingSubtitle = document.getElementById("briefing-subtitle");
        briefingList = document.getElementById("briefing-list");
        todoEditDoneCheckbox = document.getElementById("todo-edit-done");
    }

    function addListeners() {
        if (setTodayBtn) {
            setTodayBtn.addEventListener("click", setDateToToday, false);
        }

        if (setTomorrowBtn) {
            setTomorrowBtn.addEventListener("click", setDateToNextBusinessDay, false);
        }

        addButton.addEventListener("click", addEntry, false);
        sortButton.addEventListener("click", sortEntry, false);
        selectElem.addEventListener("change", multipleFilter, false);
        shortlistBtn.addEventListener("change", multipleFilter, false);

        todoModelCloseBtn.addEventListener("click", closeEditModelBox, false);

        if (briefingCloseBtn) {
            briefingCloseBtn.addEventListener("click", closeBriefing, false);
        }

        if (briefingFooterCloseBtn) {
          briefingFooterCloseBtn.addEventListener("click", closeBriefing, false);
        }

        if (briefingOverlay) {
            briefingOverlay.addEventListener("click", function (e) {
                if (e.target === briefingOverlay) closeBriefing();
            }, false);
        }

        if (quickTimePicker) {
          quickTimePicker.addEventListener("click", onQuickTimePickerClick, false);
        }

        if (briefingList) {
            briefingList.addEventListener("click", onBriefingListClick, false);
        }

        changeBtn.addEventListener("click", commitEdit, false);

        todoTable.addEventListener("dragstart", onDragstart, false);
        todoTable.addEventListener("drop", onDrop, false);
        todoTable.addEventListener("dragover", onDragover, false);

        peginationCtnr.addEventListener("click", onPaginationBtnsClick, false);

        itemsPerPageSelectElem.addEventListener("change", selectItemsPerPage, false);

        if (launchPendingBtn) {
          launchPendingBtn.addEventListener("click", openBriefing, false);
        }

        if (themeSelect) {
          themeSelect.addEventListener("change", onThemeSelectChange, false);
        }

        if (inputElem2) {
          inputElem2.addEventListener("input", refreshSubcategoryUI, false);
        }

        if (addSubcategoryBtn) {
          addSubcategoryBtn.addEventListener("click", onAddSubcategoryClick, false);
        }

        const todoEditCategoryInput = document.getElementById("todo-edit-category");
        if (todoEditCategoryInput) {
          todoEditCategoryInput.addEventListener("input", refreshEditSubcategoryUI, false);
        }

        if (todoEditAddSubcategoryBtn) {
          todoEditAddSubcategoryBtn.addEventListener("click", onAddEditSubcategoryClick, false);
        }

        document.addEventListener("keydown", function (e) {
          if (
            e.key === "Escape" &&
            briefingOverlay &&
            briefingOverlay.classList.contains("briefing-slidedIntoView")
          ) {
            closeBriefing();
          }
        }, false);
    }

    function applyStoredTheme() {
      const validThemes = ["light", "dark", "diablo", "bitcoin", "synthwave", "matrix", "gold", "aurora"];
      const stored = localStorage.getItem("tsk-theme");
      const theme = validThemes.includes(stored) ? stored : "light";
      document.documentElement.setAttribute("data-theme", theme);
      if (themeSelect) {
        themeSelect.value = theme;
      }
    }

    function onThemeSelectChange() {
      const next = themeSelect.value;
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("tsk-theme", next);
    }

    function loadCategorySubcategoryMap() {
      let retrieved = localStorage.getItem("tsk-categorySubcategories");
      categorySubcategoryMap = retrieved ? JSON.parse(retrieved) : {};
    }

    function saveCategorySubcategoryMap() {
      localStorage.setItem("tsk-categorySubcategories", JSON.stringify(categorySubcategoryMap));
    }

    function getSubcategoriesFor(category) {
      if (!category || !categorySubcategoryMap[category]) return [];
      return categorySubcategoryMap[category];
    }

    function addSubcategoryToCategory(category, subcategory) {
      if (!categorySubcategoryMap[category]) {
        categorySubcategoryMap[category] = [];
      }
      if (!categorySubcategoryMap[category].includes(subcategory)) {
        categorySubcategoryMap[category].push(subcategory);
        saveCategorySubcategoryMap();
      }
    }

    function populateSubcategorySelect(selectEl, subs) {
      selectEl.innerHTML = "";

      let blankOptionElem = document.createElement("option");
      blankOptionElem.value = "";
      blankOptionElem.innerText = "— none —";
      selectEl.appendChild(blankOptionElem);

      subs.forEach(sub => {
        let optionElem = document.createElement("option");
        optionElem.value = sub;
        optionElem.innerText = sub;
        selectEl.appendChild(optionElem);
      });
    }

    function refreshSubcategoryUI() {
      if (!subcategoryInput || !addSubcategoryBtn) return;

      const category = inputElem2.value.trim();
      const subs = getSubcategoriesFor(category);

      if (subs.length > 0) {
        populateSubcategorySelect(subcategoryInput, subs);
        subcategoryInput.style.display = "";
      } else {
        subcategoryInput.style.display = "none";
        subcategoryInput.innerHTML = "";
      }

      addSubcategoryBtn.disabled = !category;
    }

    function onAddSubcategoryClick() {
      const category = inputElem2.value.trim();
      if (!category) {
        alert("Enter a category first.");
        return;
      }

      const newSub = prompt(`New subcategory for "${category}":`);
      if (!newSub || !newSub.trim()) return;

      addSubcategoryToCategory(category, newSub.trim());
      refreshSubcategoryUI();
      subcategoryInput.value = newSub.trim();
    }

    function refreshEditSubcategoryUI() {
      if (!todoEditSubcategoryInput || !todoEditAddSubcategoryBtn) return;

      const category = document.getElementById("todo-edit-category").value.trim();
      const subs = getSubcategoriesFor(category);

      if (subs.length > 0) {
        populateSubcategorySelect(todoEditSubcategoryInput, subs);
        todoEditSubcategoryInput.style.display = "";
      } else {
        todoEditSubcategoryInput.style.display = "none";
        todoEditSubcategoryInput.innerHTML = "";
      }

      todoEditAddSubcategoryBtn.disabled = !category;
    }

    function onAddEditSubcategoryClick() {
      const category = document.getElementById("todo-edit-category").value.trim();
      if (!category) {
        alert("Enter a category first.");
        return;
      }

      const newSub = prompt(`New subcategory for "${category}":`);
      if (!newSub || !newSub.trim()) return;

      addSubcategoryToCategory(category, newSub.trim());
      refreshEditSubcategoryUI();
      todoEditSubcategoryInput.value = newSub.trim();
    }

    function addEntry(event) {

        let inputValue = inputElem.value;
        inputElem.value = "";

        let inputValue2 = inputElem2.value;
        inputElem2.value = "";

        let subcategoryValue = subcategoryInput ? subcategoryInput.value : "";

        let dateValue = dateInput.value;
        dateInput.value = "";

        let timeValue = timeInput.value;
        timeInput.value = "";

        resetQuickTimePicker();

        let obj = {
            id: _uuid(),
            todo: inputValue,
            category: inputValue2,
            subcategory: subcategoryValue,
            date: dateValue,
            time: timeValue,
            done: false,
        };

        todoList.push(obj);

        save();

        updateSelectOptions();
        refreshSubcategoryUI();

        multipleFilter();
    }

    function updateSelectOptions() {
        let categoryMap = new Map();

        todoList.forEach((obj) => {
            if (!obj.category) return;
            if (!categoryMap.has(obj.category)) {
                categoryMap.set(obj.category, new Set());
            }
            if (obj.subcategory) {
                categoryMap.get(obj.category).add(obj.subcategory);
            }
        });

        selectElem.innerHTML = "";

        let defaultOptionElem = document.createElement('option');
        defaultOptionElem.value = DEFAULT_OPTION;
        defaultOptionElem.innerText = DEFAULT_OPTION;
        selectElem.appendChild(defaultOptionElem);

        for (let [category, subcategorySet] of categoryMap) {
            let groupElem = document.createElement('optgroup');
            groupElem.label = category;

            let allOptionElem = document.createElement('option');
            allOptionElem.value = category;
            allOptionElem.innerText = `All ${category}`;
            groupElem.appendChild(allOptionElem);

            for (let subcategory of subcategorySet) {
                let subOptionElem = document.createElement('option');
                subOptionElem.value = `${category}::${subcategory}`;
                subOptionElem.innerText = subcategory;
                groupElem.appendChild(subOptionElem);
            }

            selectElem.appendChild(groupElem);
        }

        if (categoryListElem) {
            categoryListElem.innerHTML = "";
            for (let category of categoryMap.keys()) {
                let datalistOptionElem = document.createElement('option');
                datalistOptionElem.value = category;
                categoryListElem.appendChild(datalistOptionElem);
            }
        }
    }

    function save() {
        let stringified = JSON.stringify(todoList);
        localStorage.setItem("todoList", stringified);
    }

    function load() {
        let retrieved = localStorage.getItem("todoList");
        todoList = JSON.parse(retrieved);
        if (todoList == null)
            todoList = [];

        itemsPerPageSelectElem.value = String(itemsPerPage);
        if (itemsPerPageSelectElem.value !== String(itemsPerPage)) {
          itemsPerPage = 15;
          itemsPerPageSelectElem.value = "15";
          localStorage.setItem("todo-itemsPerPage", "15");
        }
    }

    function renderRows(arr) {
        renderPageNumbers(arr);

        if (totalPages === 0) {
          currentPage = 1;
        } else {
          currentPage = Math.min(currentPage, totalPages);
        }

        arr.forEach(addEvent);

        let slicedArr = arr.slice(itemsPerPage * (currentPage - 1), itemsPerPage * currentPage);
        slicedArr.forEach(todoObj => {
            renderRow(todoObj);
        })
    }

    function renderRow({ todo: inputValue, category: inputValue2, subcategory, id, date, time, done }) {
        let trElem = document.createElement("tr");
        const tbody = todoTable.querySelector("tbody");
        tbody.appendChild(trElem);

        trElem.draggable = "true";
        trElem.dataset.id = id;

        let checkboxElem = document.createElement("input");
        checkboxElem.type = "checkbox";
        checkboxElem.addEventListener("click", checkboxClickCallback, false);
        checkboxElem.dataset.id = id;
        let tdElem1 = document.createElement("td");
        tdElem1.appendChild(checkboxElem);
        trElem.appendChild(tdElem1);

        let dateElem = document.createElement("td");
        dateElem.innerText = date;
        trElem.appendChild(dateElem);
        dateElem.addEventListener("click", onDateClick, false);

        function onDateClick(e) {
            calendar.gotoDate(e.target.innerText);
        }

        let timeElem = document.createElement("td");
        timeElem.innerText = formatTimeForTable(time);
        trElem.appendChild(timeElem);

        let tdElem2 = document.createElement("td");
        tdElem2.innerText = inputValue;
        trElem.appendChild(tdElem2);

        let tdElem3 = document.createElement("td");
        tdElem3.innerText = subcategory ? `${inputValue2} › ${subcategory}` : inputValue2;
        tdElem3.className = "categoryCell";
        trElem.appendChild(tdElem3);

        let editSpan = document.createElement("span");
        editSpan.innerText = "edit";
        editSpan.className = "material-symbols-outlined";
        editSpan.setAttribute("title", "Edit");
        editSpan.setAttribute("aria-label", "Edit");
        editSpan.style.cursor = "pointer";
        editSpan.addEventListener("click", toEditItem, false);
        editSpan.dataset.id = id;

        let editTd = document.createElement("td");
        editTd.appendChild(editSpan);
        trElem.appendChild(editTd);

        let spanElem = document.createElement("span");
        spanElem.innerText = "delete";
        spanElem.className = "material-symbols-outlined";
        spanElem.setAttribute("title", "Delete");
        spanElem.setAttribute("aria-label", "Delete");
        spanElem.style.cursor = "pointer";
        spanElem.addEventListener("click", deleteItem, false);
        spanElem.dataset.id = id;

        let tdElem4 = document.createElement("td");
        tdElem4.appendChild(spanElem);
        trElem.appendChild(tdElem4);

        checkboxElem.type = "checkbox";
        checkboxElem.checked = done;
        if (done) {
            trElem.classList.add("strike");
        } else {
            trElem.classList.remove("strike");
        }

        dateElem.dataset.type = "date";
        timeElem.dataset.type = "time";
        tdElem2.dataset.type = "todo";
        tdElem3.dataset.type = "category";

        dateElem.dataset.id = id;
        timeElem.dataset.id = id;
        tdElem2.dataset.id = id;
        tdElem3.dataset.id = id;

        function deleteItem() {
            trElem.remove();
            updateSelectOptions();

            for (let i = 0; i < todoList.length; i++) {
                if (todoList[i].id == this.dataset.id)
                    todoList.splice(i, 1);
            }
            save();

            const calendarEvent = calendar.getEventById(this.dataset.id);
            if (calendarEvent) calendarEvent.remove();
        }

        function checkboxClickCallback() {
          const id = this.dataset.id;

          for (let i = 0; i < todoList.length; i++) {
            if (todoList[i].id === id) {
              todoList[i].done = this.checked;
              break;
            }
          }

          if (this.checked) {
            trElem.classList.add("strike");
          } else {
            trElem.classList.remove("strike");
          }

          const ev = calendar.getEventById(id);
          if (ev) {
            ev.setProp("classNames", this.checked ? ["event-done"] : ["event-pending"]);
          }

          save();
          multipleFilter();
        }
    }

    function _uuid() {
        var d = Date.now();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function sortEntry() {
        todoList.sort((a, b) => {
            let aDate = Date.parse(a.date);
            let bDate = Date.parse(b.date);
            return aDate - bDate;
        });

        save();

        multipleFilter();
    }

    function initCalendar() {
        var calendarEl = document.getElementById('calendar');

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            eventDisplay: "block",
            initialDate: new Date(),
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [],
            eventClick: function (info) {
                toEditItem(info.event);
            },
            eventBackgroundColor: "#153e31",
            eventBorderColor: "#578c8e",
            editable: true,
            eventDrop: function (info) {
                calendarEventDragged(info.event);
            },
            eventTimeFormat: {
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short',
                timeZone: "America/Chicago",
            }
        });

        calendar.render();
    }

    function addEvent({ id, todo, date, time, done }) {
      calendar.addEvent({
        id,
        title: todo,
        start: time === "" ? date : `${date}T${time}`,
        classNames: done ? ["event-done"] : ["event-pending"],
      });
    }

    function clearTable() {
      const tbody = todoTable.querySelector("tbody");
      if (tbody) tbody.innerHTML = "";

      calendar.getEvents().forEach(ev => ev.remove());
    }

    function multipleFilter() {
        clearTable();

        let selection = selectElem.value;

        let baseArray;

        if (selection == DEFAULT_OPTION) {
            baseArray = todoList;
        } else if (selection.indexOf("::") !== -1) {
            let [selCategory, selSubcategory] = selection.split("::");
            baseArray = todoList.filter(obj => obj.category == selCategory && obj.subcategory == selSubcategory);
        } else {
            baseArray = todoList.filter(obj => obj.category == selection);
        }

        if (shortlistBtn.checked) {
            let filteredIncompleteArray = baseArray.filter(obj => obj.done == false);
            let filteredDoneArray = baseArray.filter(obj => obj.done == true);
            renderRows([...filteredIncompleteArray, ...filteredDoneArray]);
        } else {
            renderRows(baseArray);
        }
    }

    function showEditModelBox(event) {
        document.getElementById("todo-overlay").classList.add("slidedIntoView");
    }

    function closeEditModelBox(event) {
        document.getElementById("todo-overlay").classList.remove("slidedIntoView");
    }

   function openBriefing() {
      renderBriefing();
      briefingOverlay.classList.add("briefing-slidedIntoView");
    }

    function closeBriefing() {
      briefingOverlay.classList.remove("briefing-slidedIntoView");
    }

    function renderBriefing() {
        if (!briefingSubtitle || !briefingList) return;

      const { pendingToday, completedCount } = getTodayStats();

      briefingSubtitle.innerText = `Pending today: ${pendingToday.length} • Completed: ${completedCount}`;

      briefingList.innerHTML = "";

      if (pendingToday.length === 0) {
      briefingList.innerHTML = `<div class="briefing-empty">No pending tasks for today. Maintain momentum.</div>`;
      return;
    }

    pendingToday.forEach(t => {
      const timeLabel = formatTimeHHMM(t.time);
      const categoryLabel = t.category || "—";

      briefingList.innerHTML += `
        <div class="briefing-row" data-id="${t.id}">
          <div class="briefing-time">${timeLabel}</div>
          <div class="briefing-task">${t.todo}</div>
          <div class="briefing-category">${categoryLabel}</div>
          <div class="briefing-actions">
            <button class="briefing-action-btn" type="button" data-action="done" data-id="${t.id}">✅ Done</button>
            <button class="briefing-action-btn" type="button" data-action="edit" data-id="${t.id}">✏️ Edit</button>
          </div>
        </div>
      `;
    });
    }

    function onQuickTimePickerClick(e) {
      const btn = e.target.closest("button.quicktime-btn");
      if (!btn) return;

      if (btn.dataset.hour) {
        selectedHour12 = Number(btn.dataset.hour);
        setActiveButton("[data-hour]", btn);
      }

      if (btn.dataset.minute) {
        selectedMinute = btn.dataset.minute;
        setActiveButton("[data-minute]", btn);
      }

      if (btn.dataset.ampm) {
        selectedAmPm = btn.dataset.ampm;
        setActiveButton("[data-ampm]", btn);
      }

      updateTimeInputFromQuickPicker();
    }

    function setActiveButton(selectorPrefix, activeBtn) {
      if (!quickTimePicker) return;
      const groupButtons = quickTimePicker.querySelectorAll(`button.quicktime-btn${selectorPrefix ? selectorPrefix : ""}`);
      groupButtons.forEach(b => b.classList.remove("is-active"));
      activeBtn.classList.add("is-active");
    }

    function updateTimeInputFromQuickPicker() {
      if (!timeInput || !quickTimePreview) return;

      if (!selectedHour12 || !selectedMinute || !selectedAmPm) {
        quickTimePreview.innerText = "Set: —";
        return;
      }

      let hour24 = selectedHour12 % 12;
      if (selectedAmPm === "PM") hour24 += 12;

      const hh = String(hour24).padStart(2, "0");
      const mm = String(selectedMinute).padStart(2, "0");

      timeInput.value = `${hh}:${mm}`;
      quickTimePreview.innerText = `Set: ${selectedHour12}:${mm} ${selectedAmPm}`;
    }

    function resetQuickTimePicker() {
      selectedHour12 = null;
      selectedMinute = null;
      selectedAmPm = null;

      if (quickTimePicker) {
        quickTimePicker.querySelectorAll(".quicktime-btn.is-active").forEach(b => b.classList.remove("is-active"));
      }

      if (quickTimePreview) {
        quickTimePreview.innerText = "Set: —";
      }
    }

    function onBriefingListClick(e) {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "done") {
        markTaskDoneFromBriefing(id);
        return;
      }

      if (action === "edit") {
        closeBriefing();
        showEditModelBox();
        preFillEditForm(id);
        return;
      }
    }

    function markTaskDoneFromBriefing(id) {
      let changed = false;
      for (let i = 0; i < todoList.length; i++) {
        if (todoList[i].id === id) {
          if (todoList[i].done) return;
          todoList[i].done = true;
          changed = true;
          break;
        }
      }
      if (!changed) return;

      save();
      multipleFilter();
      renderBriefing();
    }

    function commitEdit(event) {
        closeEditModelBox();

        let id = event.target.dataset.id;
        let todo = document.getElementById("todo-edit-todo").value;
        let category = document.getElementById("todo-edit-category").value;
        let subcategory = todoEditSubcategoryInput ? todoEditSubcategoryInput.value : "";
        let date = document.getElementById("todo-edit-date").value;
        let time = document.getElementById("todo-edit-time").value;
        let done = todoEditDoneCheckbox ? todoEditDoneCheckbox.checked : false;

        const ev = calendar.getEventById(id);
        if (ev) ev.remove();

        for (let i = 0; i < todoList.length; i++) {
            if (todoList[i].id == id) {
                todoList[i] = {
                    id: id,
                    todo: todo,
                    category: category,
                    subcategory: subcategory,
                    date: date,
                    time: time,
                    done: done,
                };

                addEvent(todoList[i]);
                break;
            }
        }

        save();
        updateSelectOptions();
        multipleFilter();

        if (briefingOverlay && briefingOverlay.classList.contains("briefing-slidedIntoView")) {
          renderBriefing();
        }
    }

    function toEditItem(event) {
        showEditModelBox();

        let id;

        if (event.target)
            id = event.target.dataset.id;
        else
            id = event.id;

        preFillEditForm(id);
    }

    function preFillEditForm(id) {
        let result = todoList.find(todoObj => todoObj.id == id);
        if (!result) return;

        let { todo, category, subcategory, date, time, done } = result;

        document.getElementById("todo-edit-todo").value = todo;
        document.getElementById("todo-edit-category").value = category;
        document.getElementById("todo-edit-date").value = date;
        document.getElementById("todo-edit-time").value = time;

        refreshEditSubcategoryUI();
        if (todoEditSubcategoryInput) {
          todoEditSubcategoryInput.value = subcategory || "";
        }

        if (todoEditDoneCheckbox) {
          todoEditDoneCheckbox.checked = !!done;
        }

        changeBtn.dataset.id = id;
    }

    function onDragstart(event) {
        draggingElement = event.target;
    }

    function onDrop(event) {
        if (event.target.matches("table"))
            return;

        let beforeTarget = event.target;

        while (!beforeTarget.matches("tr"))
            beforeTarget = beforeTarget.parentNode;

        if (beforeTarget.matches(":first-child"))
            return;

        todoTable.insertBefore(draggingElement, beforeTarget);

        let tempIndex;

        todoList.forEach((todoObj, index) => {
            if (todoObj.id == draggingElement.dataset.id)
                tempIndex = index;
        });

        let [toInsertObj] = todoList.splice(tempIndex, 1);

        todoList.forEach((todoObj, index) => {
            if (todoObj.id == beforeTarget.dataset.id)
                tempIndex = index;
        });

        todoList.splice(tempIndex, 0, toInsertObj);

        save();
    }

    function onDragover(event) {
        event.preventDefault();
    }

    function calendarEventDragged(event) {
        let id = event.id;
        let dateObj = new Date(event.start);
        let year = dateObj.getFullYear();
        let month = dateObj.getMonth() + 1;
        let date = dateObj.getDate();
        let hour = dateObj.getHours();
        let minute = dateObj.getMinutes();

        let paddedMonth = month.toString();
        if (paddedMonth.length < 2) {
            paddedMonth = "0" + paddedMonth;
        }

        let paddedDate = date.toString();
        if (paddedDate.length < 2) {
            paddedDate = "0" + paddedDate;
        }

        let toStoreDate = `${year}-${paddedMonth}-${paddedDate}`;

        todoList.forEach(todoObj => {
            if (todoObj.id == id) {
                todoObj.date = toStoreDate;
                if (hour !== 0)
                    todoObj.time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            }
        });

        save();

        multipleFilter();
    }

    function onPaginationBtnsClick(event) {
        switch (event.target.dataset.pagination) {
            case "pageNumber":
                currentPage = Number(event.target.innerText);
                break;
            case "previousPage":
                currentPage = currentPage == 1 ? currentPage : currentPage - 1;
                break;
            case "nextPage":
                currentPage = currentPage == totalPages ? currentPage : currentPage + 1;
                break;
            case "firstPage":
                currentPage = 1;
                break;
            case "lastPage":
                currentPage = totalPages;
                break;
            default:
        }
        multipleFilter();
    }

    function renderPageNumbers(arr) {
        let numberOfItems = arr.length;
        totalPages = Math.ceil(numberOfItems / itemsPerPage);

        let pageNumberDiv = document.querySelector(".pagination-pages");

        pageNumberDiv.innerHTML = `<span class="material-symbols-outlined chevron" data-pagination="firstPage">first_page</span>`;

        if (currentPage != 1)
            pageNumberDiv.innerHTML += `<span class="material-symbols-outlined chevron"
        data-pagination="previousPage">chevron_backward</span>`;

        if (totalPages > 0) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumberDiv.innerHTML += `<span data-pagination="pageNumber">${i}</span>`;
            }
        }

        if (currentPage != totalPages)
            pageNumberDiv.innerHTML += `<span class="material-symbols-outlined chevron"
        data-pagination="nextPage">chevron_forward</span>`;

        pageNumberDiv.innerHTML += `<span class="material-symbols-outlined chevron" data-pagination="lastPage">last_page</span>`;
    }

    function selectItemsPerPage(event) {
        itemsPerPage = Number(event.target.value);
        localStorage.setItem("todo-itemsPerPage", itemsPerPage);
        multipleFilter();
    }

    function formatTimeHHMM(t) {
      if (!t) return "—";
      const [h, m] = t.split(":").map(Number);
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h >= 12 ? "PM" : "AM";
      return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    function formatTimeForTable(t) {
      if (!t) return "";
      return formatTimeHHMM(t);
    }

    function getTodayKey() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    function defaultDateToTodayIfEmpty() {
      if (!dateInput) return;
      if (!dateInput.value) {
        dateInput.value = getTodayKey();
      }
    }

    function setDateToToday() {
      if (!dateInput) return;
      dateInput.value = getTodayKey();
    }

    function setDateToNextBusinessDay() {
      if (!dateInput) return;

      const d = new Date();
      d.setDate(d.getDate() + 1);

      const day = d.getDay();
      if (day === 6) {
        d.setDate(d.getDate() + 2);
      } else if (day === 0) {
        d.setDate(d.getDate() + 1);
      }

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    function getTodayStats() {
      const todayKey = getTodayKey();

      const todaysAll = todoList.filter(t => t.date === todayKey);

      const pendingToday = todaysAll
        .filter(t => !t.done)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

      const completedToday = todaysAll.filter(t => t.done);

      return {
        todayKey,
        pendingToday,
        completedCount: completedToday.length,
      };
    }

    function buildTodaysAgendaLines() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayKey = `${yyyy}-${mm}-${dd}`;

      const todays = todoList
        .filter(t => t.date === todayKey && !t.done)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

      if (todays.length === 0) {
        return { todayKey, lines: ["You are clear today. Use the time wisely."] };
      }

      const lines = [];
      todays.forEach(t => {
        lines.push(`• ${formatTimeHHMM(t.time)} — ${t.todo}`);
      });

      return { todayKey, lines };
    }

}
