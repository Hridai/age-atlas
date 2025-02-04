// static/js/map.js
let map;
let countryLayers = {};
let countryNames = {};  // Add this at the top with your other global variables
let selectedDate = null;
let selectedTopics = new Set();

function initSettings() {
    const settingsButton = document.getElementById('settings-button');
    const modal = document.getElementById('settings-modal');
    const closeButton = document.getElementById('close-modal');
    const topicCheckboxes = document.getElementById('topic-checkboxes');

    // Get unique topics from historical data
    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            const topics = new Set();
            Object.values(data).forEach(dateEvents => {
                Object.values(dateEvents).forEach(countryEvents => {
                    if (typeof countryEvents === 'object' && countryEvents !== null) {
                        Object.keys(countryEvents).forEach(topic => topics.add(topic));
                    }
                });
            });

            // Create checkboxes for each topic
            topics.forEach(topic => {
                const div = document.createElement('div');
                div.className = 'topic-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = topic;
                checkbox.checked = true; // Default all to checked
                selectedTopics.add(topic); // Add to selected topics
                
                const label = document.createElement('label');
                label.htmlFor = topic;
                label.textContent = topic;

                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedTopics.add(topic);
                    } else {
                        selectedTopics.delete(topic);
                    }
                    if (selectedDate) {
                        const dateDiv = document.querySelector('.timeline-date.selected');
                        selectDate(selectedDate, dateDiv, data);
                    }
                });

                div.appendChild(checkbox);
                div.appendChild(label);
                topicCheckboxes.appendChild(div);
            });
        });

    settingsButton.onclick = () => modal.style.display = "block";
    closeButton.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function initMap() {
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    fetch('/data/country_coordinates.csv')
        .then(response => response.text())
        .then(csvText => {
            const countries = {};
            const lines = csvText.trim().split('\n').slice(1);
            
            lines.forEach(line => {
                if (line) {
                    const [countryCode, countryName, coordsStr] = line.split('|');
                    const coordinates = coordsStr.split(';').map(pair => {
                        const [lat, lon] = pair.split(',').map(Number);
                        return [lat, lon];
                    });
                    
                    if(coordinates.length > 0) {
                        countries[countryCode] = coordinates;
                        countryNames[countryCode] = countryName;  // Store the country name
                    }
                }
            });


            // Create polygons for each country
            Object.entries(countries).forEach(([countryCode, coordinates]) => {
                const polygon = L.polygon(coordinates, {
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    opacity: 0,
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
        })
        .catch(error => console.error('Error loading country coordinates:', error));
}


function createTimeline() {
    const timeline = document.getElementById('timeline');
    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            Object.entries(data)
                .sort((a, b) => a[1].order - b[1].order)
                .forEach(([date, events]) => {
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
    
    // First hide all countries completely
    Object.values(countryLayers).forEach(layer => {
        layer.setStyle({
            opacity: 0,
            fillOpacity: 0,
            fillColor: 'transparent',
            color: 'transparent'
        });
    });
    
    element.classList.add('selected');
    selectedDate = date;

    // Show only countries with events
    const events = data[date];
    const countries = Object.keys(events).filter(key => key !== 'order');
    
    Object.entries(events).forEach(([country, countryEvents]) => {
        if (countryLayers[country] && country !== 'order') {
            // Check if country has any events in selected topics
            const hasSelectedTopics = Object.keys(countryEvents)
                .some(topic => selectedTopics.has(topic));
            
            if (hasSelectedTopics) {
                countryLayers[country].setStyle({
                    color: '#007bff',
                    fillColor: '#007bff',
                    fillOpacity: 0.7,
                    opacity: 1
                });
            }
        }
    });

    const infoPanel = document.getElementById('info-panel');
    if (countries.length === 1) {
        const countryEvents = events[countries[0]];
        const countryNameText = countryNames[countries[0]] || countries[0];
        const combinedText = Object.entries(countryEvents)
            .map(([theme, text]) => `${theme}:\n${text}`)
            .join('\n\n');
            
        infoPanel.innerHTML = `<strong>${countryNameText}</strong>\n\n${combinedText}`;
        infoPanel.style.position = 'absolute';
        infoPanel.style.top = '20px';
        infoPanel.style.right = '20px';
        infoPanel.style.display = 'block';
        document.onmousemove = null;
    } else {
        infoPanel.style.display = 'none';
    }
}



function showCountryInfo(country) {
    if (selectedDate) {
        fetch('/api/events')
            .then(response => response.json())
            .then(data => {
                if (data[selectedDate][country]) {
                    const countryEvents = data[selectedDate][country];
                    const filteredEvents = Object.entries(countryEvents)
                        .filter(([theme]) => selectedTopics.has(theme));

                    if (filteredEvents.length > 0) {
                        const infoPanel = document.getElementById('info-panel');
                        const countryNameText = countryNames[country] || country;
                        const eventsText = filteredEvents
                            .map(([theme, text]) => `${theme}:\n${text}`)
                            .join('\n\n');
                        
                        infoPanel.innerHTML = `<strong>${countryNameText}</strong>\n\n${eventsText}`;
                        
                        document.onmousemove = function(e) {
                            infoPanel.style.left = `${e.clientX}px`;
                            infoPanel.style.top = `${e.clientY}px`;
                            infoPanel.style.position = 'fixed';
                        };
                        
                        infoPanel.style.display = 'block';
                    }
                }
            });
    }
}



document.addEventListener('DOMContentLoaded', () => {
   initMap();
   createTimeline();
   initSettings();
});