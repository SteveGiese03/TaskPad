//Handles the div tabs and the respective divs
const tabButs = [document.getElementById('task-tab'), document.getElementById('config-tab'), document.getElementById('stats-tab')]
const tabDivs = [document.getElementById('task'), document.getElementById('config'), document.getElementById('stats'),
                document.getElementById('create'), document.getElementById('edit'), document.getElementById('delete')];
let lastDiv = "task";

//Handle the Date Time, Score, dynamic values on the main page
const dayLabel = document.getElementById('day-el');
const dateLabel = document.getElementById('date-el');

//The Edit and create tab, and the entry to clear on closing of the tab
const addEntry = document.getElementById('create-entry');
const editEntry = document.getElementById('edit-entry');
const editConfirm = document.getElementById('edit-confirm');


function switchTabs(section){
    if(section === "default") section = lastDiv;
    else lastDiv = section; 

    //editEntry.value = "";

    for(i=0; i<tabDivs.length; i++){
        if(i<tabButs.length && section !== 'create' && section !== 'edit')
            tabButs[i].className = tabButs[i].id === section + '-tab' ? 'tabButSel' : 'tabBut';
        tabDivs[i].hidden = tabDivs[i].id !== section;
    }
}

function switchCreate(){
    addEntry.value = "";
    document.getElementById("create-error").hidden = true;
    document.getElementById('create-h').textContent = 
        lastDiv === 'task' ? "Create Extra Task" : "Create New Task";
    document.getElementById('create-select-days').hidden = lastDiv === 'task';
    for(i=0; i<tabDivs.length; i++)
        tabDivs[i].hidden = i != 3; //the Index of create div in array
}

function switchEdit(task, index){
    const isExtra = lastDiv === 'task';
    document.getElementById("edit-error").hidden = true;
    document.getElementById('edit-select-days').hidden = isExtra;
    document.getElementById('edit-h').textContent =isExtra ? "Edit Extra Task" : "Edit Daily Task";

    for(i=0; i<tabDivs.length; i++)
        tabDivs[i].hidden = i != 4; //Index of edit div in array
    editEntry.value = task.entry;
    
    for(i=0; !isExtra && i<7; i++)
        document.getElementById('edit'+i).checked = task.dates[i];

    editConfirm.addEventListener('click', function(){
        updateEntry(index);
    });
}

function switchDelete(task, index){
    for(i=0; i<tabDivs.length; i++)
        tabDivs[i].hidden = i != 5;
    document.getElementById('delete-entry').textContent = task.entry;
    document.getElementById('delete-confirm').addEventListener('click', function(){
        deleteItem(index);
    });

}

//Reload the data onto the the different tables
function refreshTables(firstLoad = false){
    if(firstLoad) fillContainer();
    fillTasks('task');
    fillTasks('extra');
    fillConfig();
    fillStats();
}


//Fill the divs with task data
async function fillTasks(section){
    const day = new Date().getDay();
    const taskData = await data.receive(section);  //Load the json data
    const tableArea = document.getElementById(section + '-table'); //Grab and reset table
    let taskTody = false;
    tableArea.textContent = "";
    for(let i = 0; i < taskData.length; i++){
        if(section === 'task' && !taskData[i].dates[day]) continue;
        taskTody = true;
        let checkLabelCell = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = "" + section[0] + i;
        checkbox.checked = taskData[i].checked;
        checkbox.addEventListener('click', function(){
            updateCheck(section, i, checkbox.checked);
        });
        let label = document.createElement('label');
        label.textContent = taskData[i].entry;
        label.setAttribute('for', section[0] + i);

        checkLabelCell.appendChild(checkbox); checkLabelCell.appendChild(label);
        tableRow = document.createElement('tr');
        tableRow.appendChild(checkLabelCell);
        if(section === 'task'){
            tableArea.appendChild(tableRow);
            continue;
        }
        tableRow.appendChild(createButtonCell('Edit', taskData[i], i));
        tableRow.appendChild(createButtonCell('Delete', taskData[i], i));

        tableArea.appendChild(tableRow);
    }
    const noDataP = document.getElementById('no-' + section);

    noDataP.hidden = taskData.length > 0 && taskTody;
    if(section === 'task') document.getElementById('no-' + section).textContent = taskData.length === 0 ?
        "No daily tasks yet, create on in the config menu!" : "No tasks scheduled for today!";
}

async function fillConfig(){
    const taskData = await data.receive('task');
    const tableArea = document.getElementById('config-table');
    tableArea.textContent = "";
    document.getElementById('no-config').hidden = taskData.length > 0;

    for(let i = 0; i < taskData.length; i++){
        let entryCell = document.createElement('td');
        //entryCell.className = "tdEnrty";
        let entryP = document.createElement('p');
        entryP.textContent = taskData[i].entry;
        entryCell.appendChild(entryP);

        let tableRow = document.createElement('tr');
        tableRow.appendChild(entryCell);

        tableRow.appendChild(createButtonCell('Edit', taskData[i], i));
        tableRow.appendChild(createButtonCell("Delete", taskData[i], i));
        tableArea.appendChild(tableRow);
    }
}

async function fillStats(){
    const taskData = await data.receive('scores');
    const tableArea = document.getElementById('scores-table');
    tableArea.textContent = "";
    document.getElementById('no-scores').hidden = taskData.length > 0;

    for(i=taskData.length-1; i>=0; i--){
        let dateCell = document.createElement('td');
        let scoreCell = document.createElement('td');
        let date = document.createElement('p');
        let score = document.createElement('p');

        date.textContent = taskData[i].date;
        score.textContent = taskData[i].score + "/" + taskData[i].outOf;
        dateCell.appendChild(date);
        scoreCell.appendChild(score);
        
        let tabRow = document.createElement('tr');
        tabRow.appendChild(dateCell);
        tabRow.appendChild(scoreCell);
        tableArea.appendChild(tabRow);
    }
    //for(i=0; itaskData.length; i++){
        
    //}
    
}

//Breaking down repetitive instructions into re-usable functions
function createButtonCell(buttonType, task, index){
    let button = document.createElement('button');
    let buttonCell = document.createElement('td');
    buttonCell.className = "tdButton";
    button.textContent = buttonType;
    if(buttonType === 'Edit'){
        button.className = "editBut"
        button.addEventListener('click', function(){ switchEdit(task, index); });
    }
    else{
        button.className = "delBut";
        button.addEventListener('click', function(){ switchDelete(task, index); });
    }
    buttonCell.appendChild(button);
    return buttonCell;
}

//Data manipulation areas, handles the add, edit, and delete menu. 
async function addItem(){
    const error = document.getElementById("create-error");
    if(addEntry.value === ""){
        error.textContent = "Field can't be blank!";
        error.hidden = false;
        return;
    }
    saveTo = lastDiv === 'task' ? 'extra' : 'task';
    if(saveTo === 'extra'){

    }

    itemToSave = saveTo === 'task' ? {entry: addEntry.value,checked: false, dates: createDates()} : 
        {entry: addEntry.value,checked: false}

    toUpdate = await data.receive(saveTo);
    toUpdate[toUpdate.length] = itemToSave;
    data.save(saveTo, toUpdate);
    refreshTables();
    switchTabs('default');
}
function createDates(){
    let dates = Array();
    for(i=0; i<7; i++){
        dates.push(document.getElementById('day'+i).checked);
    }
    return dates;
}

async function updateEntry(index){
    if(editEntry.value === ""){
        document.getElementById("edit-error").hidden = false;
        return;
    }
    section = lastDiv === 'task' ? 'extra' : 'task';
    toUpdate = await data.receive(section);
    toUpdate[index].entry = editEntry.value;
    if(section === 'task') for(i=0; i<7; i++)
        toUpdate[index].dates[i] = document.getElementById('edit'+i).checked;

    data.save(section, toUpdate);
    refreshTables();
    switchTabs('default');
}
async function updateCheck(section, index, value){
    toUpdate = await data.receive(section);
    toUpdate[index].checked = value;
    data.save(section, toUpdate);

    refreshTables();
    switchTabs('default');
}

async function deleteItem(index){
    section = lastDiv === 'task' ? 'extra' : 'task';
    toRemove = await data.receive(section);
    toRemove.splice(index, 1);
    data.save(section, toRemove);
    refreshTables();
    switchTabs('default');
}
async function fillContainer(){
    const dayName = ["Sunday", "Monday", "Tuesday", "Wenesday", "Thursday", "Friday", "Saturday"];
    const date = new Date();
    dayLabel.textContent = dayName[date.getDay()];
    dateLabel.textContent = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear(); 
    const scores = await data.receive('scores');
    document.getElementById("main-score").textContent = findWeekStats(scores, date);
    document.getElementById("last-week-grade").textContent = findMonthAcc(scores, date);
}

function findWeekStats(scores, date){
    let weekStart = new Date();
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    let totalCompleted = 0;
    let totalOutOf = 0;

    for(i=scores.length - 1; i >=0; i--){
        if(weekStart > Date(scores[i].date)) break;
        totalCompleted += scores[i].score;
        totalOutOf += scores[i].outOf;
    }
    if(totalOutOf === 0) return "No previous scores this week";
    return "This weeks score: " + totalCompleted + "/" + totalOutOf;
}

function findMonthAcc(scores, date){
    let totalCompleted = 0;
    let totalOutOf = 0;
    console.log(scores.length)
    for(i=scores.length - 1; i>=0; i--){
        scoreDate = new Date(scores[i].date);
        if(date.getMonth() != scoreDate.getMonth()) break;
        totalCompleted += scores[i].score;
        totalOutOf += scores[i].outOf;
    }
    if(totalOutOf === 0) return "No previous month Scores";
    return "Month Accuracy: " + ((totalCompleted/totalOutOf) * 100).toFixed(2) + '%';
}