// static/js/map.js
let map;
let selectedDate = null;
let countryLayers = {};

function initMap() {
   map = L.map('map').setView([20, 0], 2);
   
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
       attribution: '&copy; OpenStreetMap contributors'
   }).addTo(map);

   const countries = {
       USA: [
           [49.384358, -124.733253], [48.225216, -95.153320], [48.682930, -88.378906],
           [45.644768, -82.353516], [41.771312, -70.751953], [25.165173, -80.375977],
           [25.720735, -97.558594], [32.546813, -117.421875], [48.574789, -124.980469]
       ],
       FRA: [
           [51.089726, 2.328491], [49.095472, 8.031616], [47.115002, 7.075195],
           [45.706179, 6.987305], [43.548548, 7.558594], [42.439674, 3.481445],
           [43.068888, -1.582031], [48.922499, -4.746094], [49.553726, -1.757812]
       ],
       IND: [
           [35.317366, 76.464844], [27.916767, 88.769531], [21.616579, 88.857422],
           [8.407168, 77.167969], [23.241346, 68.774414], [28.921631, 70.048828]
       ]
   };

   Object.entries(countries).forEach(([countryCode, coordinates]) => {
       const polygon = L.polygon(coordinates, {
           color: '#d3d3d3',
           fillColor: '#d3d3d3',
           fillOpacity: 0.4,
           weight: 1,
           className: 'country-polygon'
       }).addTo(map);

       polygon.on({
           mouseover: () => showCountryInfo(countryCode),
           mouseout: () => {
               document.getElementById('info-panel').style.display = 'none';
           }
       });
       countryLayers[countryCode] = polygon;
   });
}

function createTimeline() {
   const timeline = document.getElementById('timeline');
   fetch('/api/events')
       .then(response => response.json())
       .then(data => {
           Object.keys(data).sort().forEach(date => {
               const dateDiv = document.createElement('div');
               dateDiv.className = 'timeline-date';
               dateDiv.textContent = date;
               dateDiv.onclick = () => selectDate(date, dateDiv, data);
               timeline.appendChild(dateDiv);
           });
       });
}

function selectDate(date, element, data) {
   document.querySelectorAll('.timeline-date').forEach(el => {
       el.classList.remove('selected');
   });
   
   Object.values(countryLayers).forEach(layer => {
       layer.setStyle({
           color: '#d3d3d3',
           fillColor: '#d3d3d3',
           fillOpacity: 0.4
       });
   });
   
   element.classList.add('selected');
   selectedDate = date;

   const events = data[date];
   Object.keys(events).forEach(country => {
       if (countryLayers[country]) {
           countryLayers[country].setStyle({
               color: '#007bff',
               fillColor: '#007bff',
               fillOpacity: 0.7
           });
       }
   });

   document.getElementById('info-panel').style.display = 'none';
}

function showCountryInfo(country) {
   if (selectedDate) {
       fetch('/api/events')
           .then(response => response.json())
           .then(data => {
               if (data[selectedDate][country]) {
                   const infoPanel = document.getElementById('info-panel');
                   infoPanel.textContent = data[selectedDate][country];
                   infoPanel.style.display = 'block';
               }
           });
   }
}

document.addEventListener('DOMContentLoaded', () => {
   initMap();
   createTimeline();
});