// static/js/map.js
let map;
let countryLayers = {};
let countryNames = {};
let selectedDate = null;
let selectedTopics = new Set();
let isMobile = window.innerWidth <= 768;
let isTimelineVisible = !isMobile;

function initSettings() {
    const settingsButton = document.getElementById('settings-button');
    const modal = document.getElementById('settings-modal');
    const closeButton = document.getElementById('close-modal');
    const topicCheckboxes = document.getElementById('topic-checkboxes');

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

            topics.forEach(topic => {
                const div = document.createElement('div');
                div.className = 'topic-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = topic;
                checkbox.checked = true;
                selectedTopics.add(topic);
                
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

    settingsButton.onclick = () => {
        modal.style.display = "block";
        if (isMobile && isTimelineVisible) {
            toggleTimeline();
        }
    };
    
    closeButton.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function toggleTimeline() {
    const timeline = document.getElementById('timeline');
    isTimelineVisible = !isTimelineVisible;
    timeline.classList.toggle('collapsed', !isTimelineVisible);
}

function initMobileSupport() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const closeInfoButton = document.getElementById('close-info-button');
    const closeTimelineButton = document.getElementById('close-timeline-button');
    const infoPanel = document.getElementById('info-panel');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleTimeline);
    }

    if (closeInfoButton) {
        closeInfoButton.addEventListener('click', () => {
            infoPanel.style.display = 'none';
        });
    }

    if (closeTimelineButton) {
        closeTimelineButton.addEventListener('click', () => {
            toggleTimeline();
        });
    }

    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            isTimelineVisible = !isMobile;
            const timeline = document.getElementById('timeline');
            timeline.classList.toggle('collapsed', !isTimelineVisible);
        }
    });
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
                        countryNames[countryCode] = countryName;
                    }
                }
            });

            Object.entries(countries).forEach(([countryCode, coordinates]) => {
                const polygon = L.polygon(coordinates, {
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    opacity: 0,
                    weight: 1,
                    className: 'country-polygon'
                }).addTo(map);

                if (isMobile) {
                    polygon.on('click', () => showCountryInfo(countryCode));
                } else {
                    polygon.on({
                        mouseover: () => showCountryInfo(countryCode),
                        mouseout: () => {
                            if (!isMobile) {
                                document.getElementById('info-panel').style.display = 'none';
                            }
                        }
                    });
                }
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
                    dateDiv.onclick = () => {
                        selectDate(date, dateDiv, data);
                        if (isMobile) {
                            toggleTimeline();
                        }
                    };
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
            opacity: 0,
            fillOpacity: 0,
            fillColor: 'transparent',
            color: 'transparent'
        });
    });
    
    element.classList.add('selected');
    selectedDate = date;

    const events = data[date];
    const countries = Object.keys(events).filter(key => key !== 'order');
    
    Object.entries(events).forEach(([country, countryEvents]) => {
        if (countryLayers[country] && country !== 'order') {
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
        const filteredEvents = Object.entries(countryEvents)
            .filter(([theme]) => selectedTopics.has(theme));
            
        if (filteredEvents.length > 0) {
            const eventsText = filteredEvents
                .map(([theme, text]) => `${theme}:\n${text}`)
                .join('\n\n');
                
            infoPanel.innerHTML = `<strong>${countryNameText}</strong>\n\n${eventsText}`;
            infoPanel.style.display = 'block';
            
            if (isMobile) {
                infoPanel.style.position = 'fixed';
                infoPanel.style.top = '50%';
                infoPanel.style.left = '50%';
                infoPanel.style.transform = 'translate(-50%, -50%)';
            } else {
                infoPanel.style.position = 'absolute';
                infoPanel.style.top = '20px';
                infoPanel.style.right = '20px';
                infoPanel.style.transform = 'none';
            }
        }
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
                        
                        if (isMobile) {
                            infoPanel.style.position = 'fixed';
                            infoPanel.style.top = '50%';
                            infoPanel.style.left = '50%';
                            infoPanel.style.transform = 'translate(-50%, -50%)';
                            document.onmousemove = null;
                        } else {
                            document.onmousemove = function(e) {
                                infoPanel.style.position = 'fixed';
                                infoPanel.style.left = `${e.clientX}px`;
                                infoPanel.style.top = `${e.clientY}px`;
                                infoPanel.style.transform = 'none';
                            };
                        }
                        
                        infoPanel.style.display = 'block';
                    }
                }
            });
    }
}

function initSubmitFact() {
    const submitButton = document.getElementById('submit-fact-button');
    const modal = document.getElementById('submit-fact-modal');
    const form = document.getElementById('fact-submission-form');
    const cancelButton = document.getElementById('cancel-submission');
    const toast = document.getElementById('toast');

    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            const themes = new Set();
            
            Object.values(data).forEach(dateEvents => {
                Object.values(dateEvents).forEach(countryEvents => {
                    if (typeof countryEvents === 'object' && countryEvents !== null) {
                        Object.keys(countryEvents).forEach(theme => {
                            if (theme !== 'order') {
                                themes.add(theme);
                            }
                        });
                    }
                });
            });
            
            const themeSelect = document.getElementById('theme');
            themes.forEach(theme => {
                const option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                themeSelect.appendChild(option);
            });
        });

    submitButton.onclick = () => {
        modal.style.display = "block";
        if (isMobile && isTimelineVisible) {
            toggleTimeline();
        }
    };
    
    cancelButton.onclick = () => modal.style.display = "none";

    form.onsubmit = (e) => {
        e.preventDefault();
        toast.style.display = 'flex';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
        modal.style.display = 'none';
        form.reset();
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

// Close info panel when clicking outside on mobile
if (isMobile) {
    document.addEventListener('click', (event) => {
        const infoPanel = document.getElementById('info-panel');
        const isClickInsideInfoPanel = infoPanel.contains(event.target);
        const isClickOnCountry = event.target.classList.contains('country-polygon');
        
        if (!isClickInsideInfoPanel && !isClickOnCountry && infoPanel.style.display === 'block') {
            infoPanel.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
   initMap();
   createTimeline();
   initSettings();
   initSubmitFact();
   initMobileSupport();
});