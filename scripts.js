var modal = document.getElementById('modal-wrapper')
var background = document.querySelector('body')

let map = L.map('map').setView([51.505, -0.09], 13);
let route = L.polyline([], { color: 'red' }).addTo(map);
let marker = null;
let tracking = false;
let positions = [];
let startRun, finishRun;
let watchId = null;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const HIGH_ACCURACY = true;
const MAX_CACHE_AGE_MILLISECOND = 30000;
const MAX_NEW_POSITION_MILLISECOND = 5000;

const options = {
    enableHighAccuracy: HIGH_ACCURACY,
    maximumAge: MAX_CACHE_AGE_MILLISECOND,
    timeout: MAX_NEW_POSITION_MILLISECOND,
};

function start() {
    if (navigator.geolocation) {
        background.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
        modal.style.visibility = "visible";
        background.style.visibility = "hidden"
        tracking = true;
        startRun = new Date();
        watchId = navigator.geolocation.watchPosition(success, error, options);
    } else {
        alert('Geolocation not supported');
    }

    resetMap()

}

function stop() {
    tracking = false;
    finishRun = new Date();
    modal.style.visibility = "hidden"
    background.style.backgroundColor = ""
    background.style.visibility = "visible"

    //Day.JS
    const date = dayjs();

    //Calculate Time

    const time = (finishRun - startRun) / 1000;
    const timeHours = Math.floor(time / 3600);
    const timeMinutes = Math.floor((time % 3600) / 60);
    const timeSeconds = Math.floor(time % 60);

    let hours = String(timeHours).padStart(2, '0')
    let minutes = String(timeMinutes).padStart(2, '0')
    let seconds = String(timeSeconds).padStart(2, '0')

    const formatTime = timeHours > 0
    ? `${hours}:${minutes}:${seconds}` 
    : `${minutes}:${seconds}`

    console.log("Time: " + formatTime)

    //Calculate Distance in Stop Function
   
    let totalDistance = 0

    for (let i = 1; i < positions.length; i++) {
        totalDistance += haversineDistance(positions[i - 1], positions[i])
    } 
    console.log('Total distance: ' + totalDistance.toFixed(2) + ' miles')

    //Calculate Pace

    const totalMin = time / 60;
    const pace = totalMin / totalDistance;
    const paceMin = Math.floor(pace);
    const paceSec = Math.round((pace - paceMin) * 60);

    let formatPaceMin = String(paceMin).padStart(2, '0')

    let formatPaceSec = String(paceSec).padStart(2, '0')

    console.log('The pace is: ' + formatPaceMin + ':' + formatPaceSec)

    //Stops the Geolocation tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }

    //Display Run Data
    const displayRuns = document.getElementById('display-runs')
    
    const newEntry = document.createElement('div')
    newEntry.setAttribute("class", "entry")

    const itemList = document.createElement('div')
    itemList.setAttribute("class", "all-items")

    const dateItem = document.createElement('div')
    dateItem.setAttribute("class", "date")

    const timeItem = document.createElement('div')
    timeItem.setAttribute("class", "item")

    const distanceItem = document.createElement('div')
    distanceItem.setAttribute("class", "item")

    const paceItem = document.createElement('div')
    paceItem.setAttribute("class", "item")

    const newDate = document.createElement('p')

    const newTime = document.createElement('p')
    const timeBox = document.createElement('p')

    const newDistance = document.createElement('p')
    const distanceBox = document.createElement('p')

    const newPace = document.createElement('p')
    const paceBox = document.createElement('p')

    const dateEntry = document.createTextNode(date.format('M/D/YYYY'))

    const timeEntry1 = document.createTextNode(hours + ':' + minutes + ':' + seconds)
    const timeEntry2 = document.createTextNode(minutes + ':' + seconds)
    const timeLabel = document.createTextNode('Time')

    const distanceEntry = document.createTextNode(totalDistance.toFixed(2) +  ' miles')
    const distanceLabel = document.createTextNode('Distance')

    const paceEntry = document.createTextNode(formatPaceMin + ':' + formatPaceSec)
    const paceLabel = document.createTextNode('Pace')

    newDate.appendChild(dateEntry)
    dateItem.appendChild(newDate)

    if (timeHours  >= 60) {
        newTime.appendChild(timeEntry1)
    } else {
        newTime.appendChild(timeEntry2)
    }

    timeBox.appendChild(timeLabel)
    
    newDistance.appendChild(distanceEntry)
    distanceBox.appendChild(distanceLabel)

    newPace.appendChild(paceEntry)
    paceBox.appendChild(paceLabel)

    newEntry.appendChild(dateItem)

    timeItem.appendChild(newTime)
    timeItem.appendChild(timeBox)
    distanceItem.appendChild(newDistance)
    distanceItem.appendChild(distanceBox)
    paceItem.appendChild(newPace)
    paceItem.appendChild(paceBox)

    itemList.appendChild(timeItem)
    itemList.appendChild(distanceItem)
    itemList.appendChild(paceItem)

    newEntry.appendChild(itemList)

    displayRuns.appendChild(newEntry)

    //Save Data
    let savedRuns = localStorage.getItem('runs') ? JSON.parse(localStorage.getItem('runs')) : [];

    const runData  = {
        date: date.format('M/D/YYYY'),
        time: formatTime,
        distance: totalDistance.toFixed(2) + ' miles',
        pace: formatPaceMin + ':' + formatPaceSec
    }

    savedRuns.push(runData);

    localStorage.setItem('runs', JSON.stringify(savedRuns));

}

document.addEventListener('DOMContentLoaded', loadRunData);

function success(position) {
    //If tracking is not active, then exit.
    if (!tracking) return;

    //Array that logs the lat and long of the users location.
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const latLong = [lat, lng];
    // console.log(latLong)
    
    // Add the new position to the route and positions array
    positions.push(latLong);
    route.addLatLng(latLong);

    // Update marker position
    if (marker) {
        marker.setLatLng(latLong);
    } else {
        marker = L.marker(latLong).addTo(map);
    }

    

    map.setView(latLong, 15);

}

function error(err) {
    if (err.code === 1) {
        alert("Need geolocation access!");
    } else {
        alert("Cannot get current location.");
    }
}

// // Distance Formula Set Up

function haversineDistance(coord1, coord2) {
    const earthRad = 6371; //km

    const diffLat = (coord2[0] - coord1[0]) * Math.PI / 180;  
    const diffLng = (coord2[1] - coord1[1]) * Math.PI / 180;
    
    const arc = Math.cos(
       coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) 
        * Math.sin(diffLng/2) * Math.sin(diffLng/2)
        + Math.sin(diffLat/2) * Math.sin(diffLat/2);

    const line = 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1-arc));

    const distance = earthRad * line

    const miles = distance * 0.621371

    return  miles
}

//Reset Map

function resetMap() {
    positions = [];

    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }

    route.setLatLngs([]);
}

//Display Data

function loadRunData(runData) {
    let savedRuns = localStorage.getItem('runs') ? JSON.parse(localStorage.getItem('runs')) : [];

    savedRuns.reverse();

    savedRuns.forEach(run=>{
        for (var i = 0; i < localStorage.length; i++){
            let data = document.createElement('p')
            data.append(localStorage.getItem(localStorage.key(i)))
        }

        let runInfo = document.getElementById('saved-runs');
        let entry = document.createElement('div');
        entry.setAttribute("class", "entry")
        entry.innerHTML =   `<div class='date'><p>${run.date}</p></div>
                            <div class='all-items'><div class='item'><p>${run.time}</p><p>Time</p></div>
                            <div class='item'><p>${run.distance}</p><p>Distance</p></div>
                            <div class='item'><p>${run.pace}</p><p>Pace</p></div></div>`;


        runInfo.appendChild(entry)
    });

}

//Reset Button

function reset() {
    const allRuns = document.getElementById('display-runs')

    if (confirm("This will clear all data. Are you sure?")){
        localStorage.clear()
        localStorage.length === 0
        allRuns.innerHTML = "";
    }
        
}

//Data Filter Menu

//Open
function dataFilterTool() {
    document.getElementById("content").classList.add("show")
}

//Close By Clicking Outside It
window.onclick = function(event) {
    if (!event.target.matches('.filter')) {

        var limits = document.getElementsByClassName("data-content");
        var i;
        for (i = 0; i < limits.length; i++) {
            var openFilter = limits[i];
            if (openFilter.classList.contains('show')) {
                openFilter.classList.remove('show')
            }
        }
    }
}

document.getElementById("content").addEventListener('click', function(event){
    event.stopPropagation();
})

function filterRuns(filterType) {

    let savedRuns = localStorage.getItem('runs') ? JSON.parse(localStorage.getItem('runs')) : [];
    let filteredData = [];
    savedRuns.reverse();

    let currentDate = dayjs()
    
    if (filterType === 'today') {
        filteredData = savedRuns.filter(run => dayjs(run.date, 'M/D/YYYY').isSame(currentDate, 'day'))

    } else if (filterType === 'last14') {
        const startDate = currentDate.subtract(14, 'day');
        filteredData = savedRuns.filter(run => {
            const runDate = dayjs(run.date, 'M/D/YYYY');
            return runDate.isAfter(startDate) && runDate.isBefore(currentDate.add(1, 'day'))
        })
       
    } else if (filterType === 'last30') {
        const startDate = currentDate.subtract(30, 'day');
        filteredData = savedRuns.filter(run => {
            const runDate = dayjs(run.date, 'M/D/YYYY');
            return runDate.isAfter(startDate) && runDate.isBefore(currentDate.add(1, 'day'))
        })
    
    } else if (filterType === 'all') {
        filteredData = savedRuns.filter(run => dayjs(run.date, 'M/D/YYYY'))
    }

    console.log(filteredData)
    displayFilteredRuns(filteredData)
}

function displayFilteredRuns(savedRuns) {

    const runList = document.getElementById('saved-runs')
    runList.innerHTML = "";
        
    savedRuns.forEach(run=>{
    
        const entry = document.createElement('div')
        entry.setAttribute("class", "entry")
        
        entry.innerHTML = `<div class='date'><p>${run.date}</p></div>
                            <div class='all-items'><div class='item'><p>${run.time}</p><p>Time</p></div>
                            <div class='item'><p>${run.distance}</p><p>Distance</p></div>
                            <div class='item'><p>${run.pace}</p><p>Pace</p></div></div>`;
        
        runList.appendChild(entry)
    })
    
}