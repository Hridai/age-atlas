// static/js/map.js
let map;
let selectedDate = null;
let countryLayers = {};

// Initialize the map
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Define country coordinates (simplified)
    const countries = {
        USA: [
            [48, -125], [48, -66],
            [25, -66], [25, -125]
        ],
        FRA: [
            [51, -5], [51, 8],
            [42, 8], [42, -5]
        ],
        IND: [
            [35, 68], [35, 97],
            [8, 97], [8, 68]
        ]
    };

    // Create polygon for each country
    Object.entries(countries).forEach(([countryCode, coordinates]) => {
        const polygon = L.polygon(coordinates, {
            color: '#d3d3d3',
            fillColor: '#d3d3d3',
            fillOpacity: 0.4,
            weight: 1,
            className: 'country-polygon'
        }).addTo(map);

        polygon.on('click', () => handleCountryClick(countryCode));
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
    // Clear previous selection
    document.querySelectorAll('.timeline-date').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Reset all country colors
    Object.values(countryLayers).forEach(layer => {
        layer.setStyle({
            color: '#d3d3d3',
            fillColor: '#d3d3d3',
            fillOpacity: 0.4
        });
    });
    
    // Update selection
    element.classList.add('selected');
    selectedDate = date;

    // Highlight countries with events
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

function handleCountryClick(country) {
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    createTimeline();
});