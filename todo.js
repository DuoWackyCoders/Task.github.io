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
        todoTable,
        draggingElement,
        currentPage = 1,
        itemsPerPage = Number.parseInt(localStorage.getItem("todo-itemsPerPage")) || 15,
        totalPages = 0,
        itemsPerPageSelectElem,
        peginationCtnr,
        todoModelCloseBtn,
        launchPendingBtn,
        briefingOverlay,
        briefingModal,
        briefingCloseBtn,
        briefingFooterCloseBtn,
        briefingSubtitle,
        briefingList;



    getElements();
    addListeners();
    initCalendar();
    load();
    defaultDateToTodayIfEmpty();
    clearTable();                  // ✅ ensure calendar/table start clean
    requestNotifPermission();
    sendMorningBriefingIfNeeded();
    renderRows(todoList);
    updateSelectOptions();


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
        console.log("launchPendingBtn:", launchPendingBtn);

        briefingOverlay = document.getElementById("briefing-overlay");
        briefingModal = document.getElementById("briefing-modal");
        briefingCloseBtn = document.getElementById("briefing-close-btn");
        briefingFooterCloseBtn = document.getElementById("briefing-footer-close-btn");
        briefingSubtitle = document.getElementById("briefing-subtitle");
        briefingList = document.getElementById("briefing-list");

        console.log("briefingOverlay:", briefingOverlay);
        console.log("briefingCloseBtn:", briefingCloseBtn);
        console.log("briefingList:", briefingList);
        console.log("briefingSubtitle:", briefingSubtitle);

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

    function addEntry(event) {

        let inputValue = inputElem.value;
        inputElem.value = "";

        let inputValue2 = inputElem2.value;
        inputElem2.value = "";

        let dateValue = dateInput.value;
        dateInput.value = "";

        let timeValue = timeInput.value;
        timeInput.value = "";

        let obj = {
            // A comma is used to seperate the properties
            id: _uuid(),
            todo: inputValue,
            category: inputValue2,
            date: dateValue,
            time: timeValue,
            done: false,
        };

        todoList.push(obj);

        save();

        updateSelectOptions();

        // ✅ rebuild list/calendar using your current filter + “Incomplete First”
        multipleFilter();
    }

    function updateSelectOptions() {
        let Options = [];

        todoList.forEach((obj) => {
            Options.push(obj.category);
        });

        let optionsSet = new Set(Options);

        //empty the select options
        selectElem.innerHTML = "";

        let newOptionElem = document.createElement('option');
        newOptionElem.value = DEFAULT_OPTION;
        newOptionElem.innerText = DEFAULT_OPTION;
        selectElem.appendChild(newOptionElem);

        for (let option of optionsSet) {
            let newOptionElem = document.createElement('option');
            newOptionElem.value = option;
            newOptionElem.innerText = option;
            selectElem.appendChild(newOptionElem);
        }


    }

    function save() {
        let stringified = JSON.stringify(todoList);
        localStorage.setItem("todoList", stringified);
    }

    function load() {
        let retrieved = localStorage.getItem("todoList");
        todoList = JSON.parse(retrieved);
        //console.log(typeof todoList)
        if (todoList == null)
            todoList = [];

        // set the dropdown; if missing option, fall back to 15
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

    function renderRow({ todo: inputValue, category: inputValue2, id, date, time, done }) {
        //add a new rule

        let trElem = document.createElement("tr");
        const tbody = todoTable.querySelector("tbody");
        tbody.appendChild(trElem);

        trElem.draggable = "true";
        trElem.dataset.id = id;

        //checkbox cell
        let checkboxElem = document.createElement("input");
        checkboxElem.type = "checkbox";
        checkboxElem.addEventListener("click", checkboxClickCallback, false);
        checkboxElem.dataset.id = id;
        let tdElem1 = document.createElement("td");
        tdElem1.appendChild(checkboxElem);
        trElem.appendChild(tdElem1);

        //date cell
        let dateElem = document.createElement("td");
        dateElem.innerText = date; //formatDate(date);
        trElem.appendChild(dateElem);
        dateElem.addEventListener("click", onDateClick, false);

        function onDateClick(e) {
            //console.log(calendar);
            calendar.gotoDate(e.target.innerText);
        }


        //time cell
        let timeElem = document.createElement("td");
        timeElem.innerText = time;
        trElem.appendChild(timeElem);

        //to-do cell
        let tdElem2 = document.createElement("td");
        tdElem2.innerText = inputValue;
        trElem.appendChild(tdElem2);

        //category cell
        let tdElem3 = document.createElement("td");
        tdElem3.innerText = inputValue2;
        tdElem3.className = "categoryCell";
        trElem.appendChild(tdElem3);

        // edit cell
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

        //delete cell
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

        // done button
        checkboxElem.type = "checkbox";
        checkboxElem.checked = done;
        if (done) {
            trElem.classList.add("strike");
        } else {
            trElem.classList.remove("strike");
        }


        dateElem.dataset.type = "date";
        //dateElem.dataset.value = date;
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

          // update data model
          for (let i = 0; i < todoList.length; i++) {
            if (todoList[i].id === id) {
              todoList[i].done = this.checked;
              break;
            }
          }

          // update row style
          if (this.checked) {
            trElem.classList.add("strike");
          } else {
            trElem.classList.remove("strike");
          }

          // update calendar event color
          const ev = calendar.getEventById(id);
            if (ev) {
              ev.setProp("color", this.checked ? "#7a0000" : "#041421");
            }

          save();
          multipleFilter();
        }

    }

    function _uuid() {
        var d = Date.now();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
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

        clearTable();

        // let table = document.getElementById("todoTable");
        // table.innerHTML = `
        // < tr >
        //     <td></td>
        //     <td>date</td>
        //     <td>time</td>
        //     <td>to-do</td>
        //     <td>
        //         <select id="categoryFilter">
        //         </select>
        //     </td>
        //     <td></td>
        // </tr > `;

        // selectElem = document.getElementById("categoryFilter");
        // console.log(selectElem);
        // updateSelectOptions();
        // selectElem.addEventListener("change", filterEntries, false);

        renderRows(todoList);
    }

    function initCalendar() {
        var calendarEl = document.getElementById('calendar');

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            eventDisplay: "block",
            initialDate: new Date(), //'2024-05-07',
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
        color: done ? "#b23b3b" : "#2f3b3b", // dark red when completed
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

        if (selection == DEFAULT_OPTION) {

            if (shortlistBtn.checked) {
                let resultArray = [];

                let filteredIncompleteArray = todoList.filter(obj => obj.done == false);
                // renderRows(filteredIncompleteArray);

                let filteredDoneArray = todoList.filter(obj => obj.done == true);
                // renderRows(filteredDoneArray);

                resultArray = [...filteredIncompleteArray, ...filteredDoneArray];
                renderRows(resultArray);
            } else {
                renderRows(todoList);
            }

        } else {

            let filteredCategoryArray = todoList.filter(obj => obj.category == selection);

            if (shortlistBtn.checked) {
                let resultArray = [];

                let filteredIncompleteArray = filteredCategoryArray.filter(obj => obj.done == false);
                // renderRows(filteredIncompleteArray);

                let filteredDoneArray = filteredCategoryArray.filter(obj => obj.done == true);
                // renderRows(filteredDoneArray);

                resultArray = [...filteredIncompleteArray, ...filteredDoneArray];
                renderRows(resultArray);
            } else {
                renderRows(filteredCategoryArray);
            }

        }
    }

    function onTableClicked(event) {
        if (event.target.matches("td") && event.target.dataset.editable == "true") {
            let tempInputElem;
            switch (event.target.dataset.type) {
                case "date":
                    tempInputElem = document.createElement("input");
                    tempInputElem.type = "date";
                    tempInputElem.value = event.target.dataset.value;
                    break;
                case "time":
                    tempInputElem = document.createElement("input");
                    tempInputElem.type = "time";
                    tempInputElem.value = event.target.innerText;
                    break;
                case "todo":
                case "category":
                    tempInputElem = document.createElement("input");
                    tempInputElem.value = event.target.innerText;

                    break;
                default:
            }
            event.target.innerText = "";
            event.target.appendChild(tempInputElem);

            tempInputElem.addEventListener("change", onChange, false);
        }

        function onChange(event) {
            let changedValue = event.target.value;
            let id = event.target.parentNode.dataset.id;
            let type = event.target.parentNode.dataset.type;

            // remove from calendar
            calendar.getEventById(id).remove();

            todoList.forEach(todoObj => {
                if (todoObj.id == id) {
                    //todoObj.todo = changedValue;
                    todoObj[type] = changedValue;

                    addEvent({
                        id: id,
                        title: todoObj.todo,
                        start: todoObj.date,
                    });
                }
            });
            save();

            if (type == "date") {
                event.target.parentNode.innerText = formatDate(changedValue);
            } else {
                event.target.parentNode.innerText = changedValue;
            }

        }
    }

    function formatDate(date) {
        let dateObj = new Date(date);
        console.log(dateObj);
        let formattedDate = dateObj.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "America/Chicago",
        });
        return formattedDate;
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
      const { pendingToday, completedCount } = getTodayStats();

        // subtitle
      briefingSubtitle.innerText = `Pending today: ${pendingToday.length} • Completed: ${completedCount}`;

      // clear list
      briefingList.innerHTML = "";

      // empty state
      if (pendingToday.length === 0) {
      briefingList.innerHTML = `<div class="briefing-empty">No pending tasks for today. Maintain momentum.</div>`;
      return;
    }

    // render rows
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
      for (let i = 0; i < todoList.length; i++) {
        if (todoList[i].id === id) {
          todoList[i].done = true;
          break;
        }
      }

      const ev = calendar.getEventById(id);
      if (ev) {
        ev.setProp("color", "#7a0000");
      }

      save();
      multipleFilter();
      renderBriefing();
    }



    function commitEdit(event) {
        closeEditModelBox();

        let id = event.target.dataset.id;
        let todo = document.getElementById("todo-edit-todo").value;
        let category = document.getElementById("todo-edit-category").value;
        let date = document.getElementById("todo-edit-date").value;
        let time = document.getElementById("todo-edit-time").value;

        // remove from calendar
        calendar.getEventById(id).remove();

        for (let i = 0; i < todoList.length; i++) {
            if (todoList[i].id == id) {
                todoList[i] = {
                    id: id,
                    todo: todo,
                    category: category,
                    date: date,
                    time: time,
                    done: todoList[i].done,
                };

                addEvent(todoList[i]);
            }
        }

        save();
        
        multipleFilter(); // ✅ rebuild table + calendar view correctly under pagination/filter

    }

    function toEditItem(event) {
        showEditModelBox();

        let id;

        if (event.target)
            id = event.target.dataset.id;
        else // calendar event
            id = event.id;

        preFillEditForm(id);
    }

    function preFillEditForm(id) {
        let result = todoList.find(todoObj => todoObj.id == id);
        let { todo, category, date, time } = result;

        document.getElementById("todo-edit-todo").value = todo;
        document.getElementById("todo-edit-category").value = category;
        document.getElementById("todo-edit-date").value = date;
        document.getElementById("todo-edit-time").value = time;

        changeBtn.dataset.id = id;
    }

    function onDragstart(event) {
        draggingElement = event.target; //trElem
    }

    function onDrop(event) {

        /* handling visual drag and drop of the rows */

        // prevent when target is table
        if (event.target.matches("table"))
            return;

        let beforeTarget = event.target;

        // to look thought parent until it is tr
        while (!beforeTarget.matches("tr"))
            beforeTarget = beforeTarget.parentNode;

        // to be implemented
        //beforeTarget.style.marginTop = "1rem";

        // prevent when the tr is the first row
        if (beforeTarget.matches(":first-child"))
            return;

        // visualize the drag and drop
        todoTable.insertBefore(draggingElement, beforeTarget);

        /* handling the array */

        let tempIndex;

        // find the index of one to be taken out
        todoList.forEach((todoObj, index) => {
            if (todoObj.id == draggingElement.dataset.id)
                tempIndex = index;
        });

        //pop the element
        let [toInsertObj] = todoList.splice(tempIndex, 1);

        //find the index of the one to be inserted before
        todoList.forEach((todoObj, index) => {
            if (todoObj.id == beforeTarget.dataset.id)
                tempIndex = index;
        });

        //insert the temp 
        todoList.splice(tempIndex, 0, toInsertObj);

        // update storage
        save();
    }


    function onDragover(event) {
        event.preventDefault();
    }

    function calendarEventDragged(event) {
        let id = event.id;
        console.log(`event.start :${event.start}`);
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
        console.log(toStoreDate);

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

    function requestNotifPermission() {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        Notification.requestPermission().then(() => sendMorningBriefingIfNeeded());
      }
    }

    function formatTimeHHMM(t) {
      if (!t) return "—";
      const [h, m] = t.split(":").map(Number);
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h >= 12 ? "PM" : "AM";
      return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
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

      // 0=Sun, 6=Sat
      const day = d.getDay();
      if (day === 6) {        // Saturday -> Monday
        d.setDate(d.getDate() + 2);
      } else if (day === 0) { // Sunday -> Monday
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

    function sendMorningBriefingIfNeeded(mode = "auto") {
        console.log("Notification.permission:", Notification.permission, "mode:", mode);
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const { todayKey, lines } = buildTodaysAgendaLines();

        console.log("Briefing key:", todayKey);
        console.log("Briefing lines:", lines);


      const lastSent = localStorage.getItem("todo-lastMorningBriefing");
      if (lastSent === todayKey) return;

      const header =
      mode === "manual"
        ? `High Commander — here is what is still pending for today:\n`
        : `Good morning, High Commander.\n\nIt's time to reign.\n\n`;

    const notifTag =
      mode === "manual" ? `todo-daily-briefing-manual-${Date.now()}` : "todo-daily-briefing";

    new Notification("Daily Command Briefing", {
      body: `${header}
    ${lines.join("\n")}

    Execute with precision.`,
      tag: notifTag,
        requireInteraction: true,
    });

      localStorage.setItem("todo-lastMorningBriefing", todayKey);
    }

    function launchPendingTasks() {
      console.log("🚀 Launch Pending Tasks clicked");

      localStorage.removeItem("todo-lastMorningBriefing");

      if (!("Notification" in window)) return;

      if (Notification.permission === "granted") {
        sendMorningBriefingIfNeeded("manual");
        return;
      }

      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            sendMorningBriefingIfNeeded("manual");
          } else {
            alert("Notifications are blocked. Allow notifications to use Launch Pending Tasks.");
          }
        });
        return;
      }

      // permission === "denied"
      alert("Notifications are blocked. Enable them in browser site settings to use Launch Pending Tasks.");
    }
}
