const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs')
const path = require('path');
const curDate = new Date();

const jsonDATA = loadJSON();

function loadJSON() {
    dataPath = path.join(app.getPath("userData"), 'data.json');
    if(!fs.existsSync(dataPath)){
        console.log("File not found, creating...");
        return createJSON();
    }
    const loadedJson = JSON.parse(fs.readFileSync(dataPath).toString());

    return loadedJson;
}
function saveJSON(){
    dataPath = path.join(app.getPath("userData"), 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(jsonDATA));
}
function createJSON(){
    return {
        lastOpened: dateToString(curDate),
        task: [],
        extra: [],
        scores: []
    };
}

function createWindow(){
    const win = new BrowserWindow({
        width: 600,
        height: 1000,
        icon: path.join(__dirname, 'src', 'img', 'icon.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //ipcMain.handle('load-data')
    win.loadFile('src/index.html')
}

app.whenReady().then(createWindow)

ipcMain.handle('recieve', (req, section) => receiveData(section))
ipcMain.handle('save', (req, section, toSave) => saveData(section, toSave))

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin'){
        saveJSON();
        app.quit();
    } 
})

async function receiveData(section){
    if(!section in jsonDATA){
        console.log("The item \"" + section + "\" is not in the json file");
        return null;
    }
    return jsonDATA[section];
}

async function saveData(section, toSave){
    if(!section in jsonDATA){
        console("The item \"" + section + "\" is not in the json file, data not saved!")
    }
    jsonDATA[section] = toSave;
}

function dateToString(date){
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
}

function saveScore(loadedJson){
    let totalTasks = loadedJson.task.length + loadedJson.extra.length;
    if(totalTasks === 0) return;
    let completed = 0;
    for(i=0; i<loadedJson.task.length; i++){
        completed = loadedJson.task[i].checked ? completed + 1 : completed;
        loadedJson.task[i].checked = false;
    }
    for(let extra in loadedJson.extra) completed = extra.checked ? completed + 1 : completed;
    loadedJson.scores[loadedJson.scores.length] = {
        date: loadedJson.lastOpened,
        score: completed,
        outOf: totalTasks,
        extra: loadedJson.extra.length
    }
    loadedJson.extra = [];
}
