const startingTimeMS = 30000
const timerRefreshMS = 50;
const timerLabels = ["Blocker 1", "Blocker 2", "Blocker 3", "Jammer"]
const timerIDs = new Set()
const timersSet = new Set()

const iconStart = '<span class="material-symbols-outlined">play_circle</span>'
const iconPause = '<span class="material-symbols-outlined">pause_circle</span>'
const iconReset = '<span class="material-symbols-outlined">replay_30</span>'

const iconResetAll = `<span class="material-symbols-outlined">restart_alt</span>`
const iconResumeAll = `<span class="material-symbols-outlined">resume</span>`
const iconPauseAll = `<span class="material-symbols-outlined">pause</span>`



//Returns the current time in MS
function getTimeMS () {
    return new Date().getTime()
}

//Prevents devices from sleeping
async function getWakeLock() {
    return await navigator.wakeLock.request("screen")
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
//Fills the passed table with rows labled by the passed info
function fillGrid(grid, labels) {

    //loops once for each item in the passed labels array
    for (let i = 0; i < labels.length; i++) {

        //create unique ID
        id = `${grid.id}-${timerLabels[i]}`

        //store ID in set
        timerIDs.add(id)

        //creates all the elements
        grid.innerHTML += `<p class="timerLbl">${timerLabels[i]}:</p>`
        grid.innerHTML += `<button id="${id} Display" class="countDisplay" disabled="True">00:00.00</button>`
        grid.innerHTML += `<button id="${id} Start" class="startBtn">${iconStart}</button>`
        grid.innerHTML += `<button id="${id} Reset" class="resetBtn" disabled>${iconReset}</button>`

    }
}

function initialize() {

    //removes html that calls initalizer
    document.getElementById("init1").remove()

    //fills in timer elements
    fillGrid(document.getElementById("team1"), timerLabels)
    fillGrid(document.getElementById("team2"), timerLabels)

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

    //sets up listeners on extra buttons
    document.getElementById("resumeAll").addEventListener("click", timerController.resumeAll)
    document.getElementById("pauseAll").addEventListener("click", timerController.pauseAll)
    document.getElementById("resetAll").addEventListener("click", timerController.resetAll)

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

        this.timerDisplay = document.getElementById(`${timerID} Display`)
        this.startBtn = document.getElementById(`${timerID} Start`)
        this.resetBtn = document.getElementById(`${timerID} Reset`)

        this.startBtn.addEventListener("click", this.handleStartPauseResume)
        this.resetBtn.addEventListener("click", this.resetTimer)

        this.updateDisplay()
    }

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

            //update visuals
            this.startBtn.className = 'startBtn'
            this.startBtn.innerHTML = iconStart
            this.resetBtn.disabled = true
        }
    }

    updateDisplay = () => {
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
    }

    updateAll = () => {

        //loops over all running timers
        for (const i of this.runningTimers) {
            //updates running timers
            i.updateTimer()
        }

    }

    addRunning = (timer) => {

        //creates a refresh interval if none is currently running
        if (this.runningTimers.size == 0) {
            this.timerInterval = setInterval (this.updateAll, timerRefreshMS)
        }

        //adds timer to the update set
        this.runningTimers.add(timer)
    }

    removeRunning = (timer) => {

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
}

// //pauses all timers that are currently running
// function pauseAll () {
//     for (const i of timersSet) {
//         i.pauseTimer()
//     }
// }

// //resumes all paused timers
// function resumeAll () {
//     for (const i of timersSet) {
//         if (i.state === "paused") {
//             i.startTimer()
//         }
//     }
// }

// //resets all timers
// function resetAll () {
//     for (const i of timersSet) {
//         i.resetTimer()
//     }
// }

