const startingTimeMS = 30000
const timerRefreshMS = 50;
const timerLabels = ["Jammer", "Blocker 1", "Blocker 2", "Blocker 3"]
const timerIDs = new Set()
const timersSet = new Set()

const iconStart = '<span class="material-symbols-outlined">play_circle</span>'
const iconPause = '<span class="material-symbols-outlined">pause_circle</span>'
const iconReset = '<span class="material-symbols-outlined">replay_30</span>'

const iconResetAll = `<span class="material-symbols-outlined">restart_alt</span>`
const iconResumeAll = `<span class="material-symbols-outlined">resume</span>`
const iconPauseAll = `<span class="material-symbols-outlined">pause</span>`

const iconSettings = `<span class="material-symbols-outlined">settings</span>`
const iconSetFullscreen = `<span id="fullscreenIcon" class="material-symbols-outlined">open_in_full</span>`
const iconExitFullscreen = `<span id="fullscreenIcon" class="material-symbols-outlined">close_fullscreen</span>`
const defaultConfig = {
            showTeam2: true,
            showResetAll: true,
            team1Color: "hsl(0, 0%, 100%)",
            team2Color: "hsl(190, 87%, 24%)",
            autoJammer: true
        }
var fullscreenState = false
var config
var settings
var screenLock

//Returns the current time in MS
function getTimeMS () {
    return new Date().getTime()
}

//Prevents devices from sleeping
async function getWakeLock() {
    return await navigator.wakeLock.request("screen")
}

//handles fullscreen requests
function setFullscreen () {

    btn = document.getElementById("fullscreenBtn")

    if (fullscreenState) {
        document.exitFullscreen()
        fullscreenState = false
        btn.innerHTML = iconSetFullscreen
    }
    else
    {
        document.body.requestFullscreen()
        fullscreenState = true
        btn.innerHTML = iconExitFullscreen
    }

}

//Takes a time in MS and returns a string in the format ##:##.## example 01:23.45
function formatTime (timeMS) {

    let sign = "\u2800"

    if (timeMS < 0) {
        sign = "-"
        timeMS = Math.abs(timeMS)
    }

    let mins = Math.floor(timeMS / 60000)
    let secs = Math.floor((timeMS % 60000) / 1000)
    let millis = Math.floor((timeMS % 1000) / 10)

    mins = String(mins).padStart(2,'0')
    secs = String(secs).padStart(2, '0')
    millis = String(millis).padStart(2, '0')
    
    return `${sign}${secs}.${millis}\u2800`
    // return `${sign}${mins}:${secs}.${millis}\u2800`
}

//Handles loading settings from config or sets defaults
function loadSettings() {

    //trys to load config from local storage
    config = localStorage.getItem("config")

    //when loading fails
    if (!config) {

        //sets default values
        config = defaultConfig
    }
    else {
        //sets values from storage
        config = JSON.parse(config)
    }

    //syncs show team 2
    settings.showTeam2.checked = config.showTeam2
    setTeam2()

    //syncs reset button
    settings.showResetAll.checked = config.showResetAll
    setResetAll()

    //syncs auto jammer
    settings.autoJammer.checked = config.autoJammer

    //sets border colors
    changeBorderColor(config.team1Color, document.getElementById("team1"))
    changeBorderColor(config.team2Color, document.getElementById("team2"))

}

//Saves all settings to local storage
function storeConfig() {

    localStorage.setItem("config", JSON.stringify(config))

}

//handles settings updates
function updateSettings(setting, value, updateFunction) {

    config[setting.id] = value

    updateFunction()

    storeConfig()
}

//Fills the passed table with rows labled by the passed info
function fillGrid(grid, labels) {

    //loops once for each item in the passed labels array
    for (let i = 0; i < labels.length; i++) {

        //create unique ID
        id = `${grid.id}-${labels[i]}`

        //store ID in set
        timerIDs.add(id)

        //creates all the elements
        grid.innerHTML += `<button id="${id} Start" class="startBtn">${iconStart}</button>`
        grid.innerHTML += `<button id="${id} Reset" class="resetBtn" disabled>${iconReset}</button>`
        grid.innerHTML += `<button id="${id} Display" class="countDisplay" disabled="True">00:00.00</button>`
        grid.innerHTML += `<p class="timerLbl">${labels[i]}</p>`

    }
}

//Opens and closes the settings menu
function toggleSettingsPage() {


    menu = document.getElementById("settingsMenu")

    if (menu.style.display != "flex") {
        menu.style.display = "flex"
    }
    else {
        menu.style.display = "none"
    }
}

//Shows/Hides Reset All
function setResetAll() {
    resetAllBtn = document.getElementById("resetAll")

    if (settings.showResetAll.checked) {
        resetAllBtn.style.display = "inline"
    }
    else {
        resetAllBtn.style.display = "none"
    }

    config.showResetAll = settings.showResetAll.checked
    storeConfig()
}

//Show or hide the second team
function setTeam2() {

    team1 = document.getElementById("team1")
    team2 = document.getElementById("team2")

    if (settings.showTeam2.checked) {
        team2.style.display = "grid"
        team1.className = "flexg2Team"
    } 
    else {
        team2.style.display = "none"
        team1.className = "flexg1Team"
    }

}

//Changes the border of target to passed color
function changeBorderColor(color, target) {

    target.style.borderColor = color
}

function initialize() {

    //removes html that calls initalizer
    document.getElementById("init1").remove()

    //fills in timer elements
    fillGrid(document.getElementById("team1"), timerLabels.toReversed())
    fillGrid(document.getElementById("team2"), timerLabels)

    //creates a dictionary of settings
    settings = {
        showTeam2: document.getElementById("showTeam2"),
        showResetAll: document.getElementById("showResetAll"),
        team1Color: document.getElementById("team1Color"),
        team2Color: document.getElementById("team2Color"),
        autoJammer: document.getElementById("autoJammer")
    }
    //creates the timer manager
    timerController = new timerManager()

    //creates a timer for each item in the table
    for(const i of timerIDs) {
        timersSet.add(new Timer(i , timerController))
    }

    //adds icons to custom buttons
    document.getElementById("resumeAll").innerHTML = iconResumeAll
    document.getElementById("pauseAll").innerHTML = iconPauseAll
    document.getElementById("resetAll").innerHTML = iconResetAll
    document.getElementById("settingsBtn").innerHTML = iconSettings
    document.getElementById("fullscreenBtn").innerHTML = iconSetFullscreen

    //sets up listeners on extra buttons
    document.getElementById("resumeAll").addEventListener("click", timerController.resumeAll)
    document.getElementById("pauseAll").addEventListener("click", timerController.pauseAll)
    document.getElementById("resetAll").addEventListener("click", timerController.resetAll)
    document.getElementById("fullscreenBtn").addEventListener("click", setFullscreen)

    //sets up listeners for settings options
    document.getElementById("settingsBtn").addEventListener("click", toggleSettingsPage)
    settings.showTeam2.addEventListener("click", function () {updateSettings(this, this.checked, setTeam2)})
    settings.showResetAll.addEventListener("click", function () {updateSettings(this, this.checked, setResetAll)})
    settings.autoJammer.addEventListener("click", function() {updateSettings(this, this.checked, function () {})})
    settings.team1Color.addEventListener("input", function() {updateSettings(this, this.value, changeBorderColor.bind(null, this.value, document.getElementById("team1")))})
    settings.team2Color.addEventListener("input", function() {updateSettings(this, this.value, changeBorderColor.bind(null, this.value, document.getElementById("team2")))})

    //loads settings
    loadSettings()

    //sets screen to stay on
    getWakeLock()

}

//handles timer management
class Timer {

    constructor(timerID, manager) {
        this.timerInterval
        this.timeRemainingMS = startingTimeMS
        this.endTime
        this.state = "reset"
        this.manager = manager
        this.isJammer = timerID.includes("Jammer")

        this.timerDisplay = document.getElementById(`${timerID} Display`)
        this.startBtn = document.getElementById(`${timerID} Start`)
        this.resetBtn = document.getElementById(`${timerID} Reset`)

        this.startBtn.addEventListener("click", this.handleStartPauseResume)
        this.resetBtn.addEventListener("click", this.resetTimer)

        this.updateDisplay()
    }

    //Calls the approiate method based on state
    handleStartPauseResume = () => {
        switch (this.state) {
            case "reset":
                this.startTimer()
                break
            
            case "running":
                this.pauseTimer()
                break

            case "paused":
                this.startTimer()
                break

            default:
                break
        }
    }

    startTimer = () => {
        if (this.state !== "running") {

            //Stores the time that the timer should end
            this.endTime = getTimeMS() + this.timeRemainingMS

            //adds timer to refresh cycle
            this.manager.addRunning(this)

            //Update state
            this.state = "running"

            //Updates Visuals
            this.startBtn.innerHTML = iconPause
            this.startBtn.className = 'pauseBtn'
            this.resetBtn.disabled = false
            this.timerDisplay.classList.remove('paused')
            this.timerDisplay.classList.add('running')
        }
    }

    pauseTimer = () => {
        //while the timer is running
        if (this.state === "running") {
            
            //remove from refresher
            this.manager.removeRunning(this)

            //run a final update
            this.updateTimer()

            //update state
            this.state = "paused"

            //update visuals
            this.startBtn.innerHTML = iconStart
            this.timerDisplay.classList.add('paused')
        }
    }

    resetTimer = () => {
        //when the timer hasn't been reset already
        if (this.state !== "reset") {

            //remove from refresher
            this.manager.removeRunning(this)

            //reset time to startingMS
            this.timeRemainingMS = startingTimeMS

            //update the display
            this.updateDisplay()

            //update state
            this.state = "reset"

            //enable startBtn
            this.startBtn.disabled = false

            //update visuals
            this.timerDisplay.className = 'countDisplay'
            this.startBtn.className = 'startBtn'
            this.startBtn.innerHTML = iconStart
            this.resetBtn.disabled = true
        }
    }

    updateDisplay = () => {

        //if time is done
        if (this.timeRemainingMS <= 0) {
            //change styling
            this.timerDisplay.classList.add('overTime')

            //update state
            this.state = 'overTime'

            //stop updates
            this.manager.removeRunning(this)

            //set remaining time to 0
            this.timeRemainingMS = 0

            //disable playpause
            this.startBtn.disabled = true
        }
        else if (this.timeRemainingMS < 11000) {
            this.timerDisplay.classList.add('standTime')
        }

        //update the text shown based on timeRemaining
        this.timerDisplay.textContent = formatTime(this.timeRemainingMS)
    }

    updateTimer = () => {
        this.timeRemainingMS = this.endTime - getTimeMS()
        this.updateDisplay()
    }

}

class timerManager {
    constructor () {
        this.runningTimers = new Set()
        this.pausedTimers = new Set()
        this.timerInterval = null
        this.runningJammer = null
        this.autoJammerCheckbox = settings.autoJammer
    }

    updateAll = () => {

        //loops over all running timers
        for (const i of this.runningTimers) {
            //updates running timers
            i.updateTimer()
        }

    }

    addRunning = (timer) => {

        //handles jammer handover
        if (this.autoJammerCheckbox.checked) {
            this.handleAutoJammer(timer)
        }

        //creates a refresh interval if none is currently running
        if (this.runningTimers.size == 0) {
            this.timerInterval = setInterval (this.updateAll, timerRefreshMS)
        }

        //adds timer to the update set
        this.runningTimers.add(timer)
    }

    removeRunning = (timer) => {

        //jammer timing removal
        if (timer === this.runningJammer) {
            this.runningJammer = null
        }

        //removes timer from the update set 
        this.runningTimers.delete(timer)
        
        //checks if set is empty
        if (this.runningTimers.size == 0) {
            //stops updater if so
            clearInterval(this.timerInterval)
        }
    }

    pauseAll = () => {

        //calls pause for all running timers
        for (const i of this.runningTimers) {
            i.pauseTimer()
        }
    }

    resumeAll = () => {

        //for every timer
        for (const i of timersSet) {
            
            //if its paused
            if (i.state === 'paused') {
                
                //restart it
                i.startTimer()
            }
        }
    }

    resetAll = () => {

        //for every timer
        for (const i of timersSet) {
            
            //reset it
            i.resetTimer()
        }
    }

    handleAutoJammer = (newTimer) => {

        //bail out if current timer isn't a jammer
        if (!newTimer.isJammer) {
            return
        }

        //if there is no running jammer add the current one and return
        if (this.runningJammer == null) {
            this.runningJammer = newTimer
            return
        }

        let remainingTimeMS = startingTimeMS - this.runningJammer.timeRemainingMS

        this.runningJammer.endTime = getTimeMS()

        newTimer.endTime = getTimeMS() + remainingTimeMS

        this.runningJammer = newTimer
    }
}