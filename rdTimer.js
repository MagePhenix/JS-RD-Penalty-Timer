const startingTimeMS = 5000
const timerRefreshMS = 50;
const timerLabels = ["Blocker 1", "Blocker 2", "Blocker 3", "Jammer", "Jammer", "Blocker 1", "Blocker 2", "Blocker 3"]
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
    
    //corrects the values when the timer runs over
    // if (timeMS < 0) {
    //     mins++
    //     secs++
    //     millis++
    // }

    mins = String(mins).padStart(2,'0')
    secs = String(secs).padStart(2, '0')
    millis = String(millis).padStart(2, '0')
    
    return `${sign}${mins}:${secs}.${millis}\u2800`
}
//Fills the passed table with rows labled by the passed info
function fillTable(table, labels) {

    //loops once for each item in the passed labels array
    for (let i = 0; i < labels.length; i++) {

        //create unique ID
        id = `${i}:${timerLabels[i]}`

        //store ID in set
        timerIDs.add(id)

        //creates a row for each label
        let newrow = table.insertRow(table.rows.length)
        //populates each row
        fillTableRow(newrow, labels[i], id)
    }


}

//Adds data to the passed table row
function fillTableRow(row, label, timerID) {

    row.insertCell(0).innerHTML = `<p>${label}:</p>`
    row.insertCell(row.length).innerHTML = `<button id="${timerID} Display" class="countDisplay">00:00.00</button>`
    row.insertCell(row.length).innerHTML = `<button id="${timerID} Start" class="startBtn">${iconStart}</button>`
    row.insertCell(row.length).innerHTML = `<button id="${timerID} Reset" class="resetBtn" disabled>${iconReset}</button>`

}

function initialize() {

    //removes html that calls initalizer
    document.getElementById("init1").remove()

    //fills table of timers
    fillTable(document.getElementById("timersTable"), timerLabels)

    //creates a timer for each item in the table
    for(const i of timerIDs) {
        timersSet.add(new Timer(i))
    }

    //adds icons to custom buttons
    document.getElementById("resumeAll").innerHTML = iconResumeAll
    document.getElementById("pauseAll").innerHTML = iconPauseAll
    document.getElementById("resetAll").innerHTML = iconResetAll

    //sets up listeners on extra buttons
    document.getElementById("resumeAll").addEventListener("click", resumeAll)
    document.getElementById("pauseAll").addEventListener("click", pauseAll)
    document.getElementById("resetAll").addEventListener("click", resetAll)

    //sets screen to stay on
    getWakeLock()

}

//handles timer management
class Timer {
    constructor(timerID) {
        this.timerInterval
        this.timeRemainingMS = startingTimeMS
        this.endTime
        this.state = "reset"

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

            //creates an interval that will call updateTimer every refresh MS
            this.timerInterval = setInterval (this.updateTimer, timerRefreshMS)

            //Update state
            this.state = "running"

            //Updates Visuals
            this.startBtn.innerHTML = iconPause
            this.resetBtn.disabled = false
        }
    }

    pauseTimer = () => {
        //while the timer is running
        if (this.state === "running") {
            
            //stop updater
            clearInterval(this.timerInterval)

            //run a final update
            this.updateTimer()

            //update state
            this.state = "paused"

            this.startBtn.innerHTML = iconStart
        }
    }

    resetTimer = () => {
        //when the timer hasn't been reset already
        if (this.state !== "reset") {

            //stop updater
            clearInterval(this.timerInterval)

            //reset time to startingMS
            this.timeRemainingMS = startingTimeMS

            //update the display
            this.updateDisplay()

            //update state
            this.state = "reset"

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

//pauses all timers that are currently running
function pauseAll () {
    for (const i of timersSet) {
        i.pauseTimer()
    }
}

//resumes all paused timers
function resumeAll () {
    for (const i of timersSet) {
        if (i.state === "paused") {
            i.startTimer()
        }
    }
}

//resets all timers
function resetAll () {
    for (const i of timersSet) {
        i.resetTimer()
    }
}

// initialize()