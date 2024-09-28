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
        tracking = true;
        startRun = new Date();
        watchId = navigator.geolocation.watchPosition(success, error, options);
    } else {
        alert('Geolocation not supported');
    }

    resetMap()

}

//Click Event - Save Data

// const saveData = document.getElementById('run-data')
// const saveTime = document.getElementById('time')
// const saveDistance =  document.getElementById('distance')

// let dataArray = localStorage.getItem('data') ? 
// JSON.parse(localStorage.getItem('data')) : []

// dataArray.forEach(addData);

// function addData() {
//     saveData.appendChild(saveTime)
//     saveData.appendChild(saveDistance)
// }

function stop() {
    tracking = false;
    finishRun = new Date();
    modal.style.visibility = "hidden"
    background.style.backgroundColor = ""

    const time = (finishRun - startRun) / 1000;
    const timeMinutes = Math.floor(time / 60);
    const timeSeconds = Math.floor(time % 60);
    document.getElementById("time").innerHTML = (timeMinutes + ' minutes and '  + timeSeconds + ' seconds');
    // console.log(timeMinutes + ' mins' + timeSeconds + ' seconds')

    //Calculate Distance in Stop Function
   
    let totalDistance = 0

    for (let i = 1; i < positions.length; i++) {
        totalDistance += haversineDistance(positions[i - 1], positions[i])
    } 
   
    document.getElementById("distance").innerHTML = ('Total distance: ' + totalDistance.toFixed(2) +  ' km')

    //Stops the Geolocation tracking
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }

}

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
    const diffLng = (coord2[1] - coord2[1]) * Math.PI / 180;
    
    const arc = Math.cos(
       coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) 
        * Math.sin(diffLng/2) * Math.sin(diffLng/2)
        + Math.sin(diffLat/2) * Math.sin(diffLat/2);

    const line = 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1-arc));

    const distance = earthRad * line

    return  distance
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


// Priorities:
// 2. Stop tracking and save data.
// 3. Display saved data on index.html page

//How to approach: Create a click event in the stop function. Save run-data in localStorage.