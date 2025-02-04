// static/js/map.js
let map;
let selectedDate = null;
let countryLayers = {};

function initMap() {
   map = L.map('map').setView([20, 0], 2);
   
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
       attribution: '&copy; OpenStreetMap contributors'
   }).addTo(map);

   const countries = {  // https://umap.openstreetmap.fr/en/map/new/ to get coordinates, swap the values of each sublist around when pasting geojson data here.
        USA: [[49.384358, -124.733253], [48.225216, -95.153320], [48.682930, -88.378906], [45.644768, -82.353516], [41.771312, -70.751953], [25.165173, -80.375977], [25.720735, -97.558594], [32.546813, -117.421875], [48.574789, -124.980469]],
        FRA: [[51.089726, 2.328491], [49.095472, 8.031616], [47.115002, 7.075195], [45.706179, 6.987305], [43.548548, 7.558594], [42.439674, 3.481445], [43.068888, -1.582031], [48.922499, -4.746094], [49.553726, -1.757812]],
        IND: [[35.317366, 76.464844], [27.916767, 88.769531], [21.616579, 88.857422], [8.407168, 77.167969], [23.241346, 68.774414], [28.921631, 70.048828]],
        GBR: [[58.635, -3.005], [50.066, -5.713], [50.734, 1.370], [52.850, 1.764], [58.635, -3.005]],
        GRE: [[39.606, 20.039], [40.914, 21.489], [41.278, 26.191], [40.905, 26.334], [40.196, 22.753], [38.048, 24.412], [35.960, 22.896], [39.606, 20.039]],
        DEU: [[54.983, 8.227], [51.052, 12.447], [47.402, 10.488], [47.580, 7.589], [53.439, 7.208], [54.983, 8.227]],
        BRA: [[-5.090944, -73.037109], [4.390229, -62.226563], [0.35156, -50.097656], [-5.178482, -35.244141], [-23.160563, -41.396484], [-33.358062, -52.207031], [-30.297018, -56.689453], [-24.686952, -52.646484], [-5.090944, -73.037109]],
        CHN: [[49.037868, 87.539063], [37.439974, 74.267578], [28.149503, 87.1875], [20.632784, 108.28125], [28.767659, 122.167969], [53.644638, 127.001953], [41.640078, 103.710938], [49.037868, 87.539063]],
        JPN: [[45.551, 141.855], [35.729, 140.887], [31.450, 130.859], [33.588, 135.439], [37.926, 138.604], [45.551, 141.855]],
        MEX: [[30.202114, -112.895508], [29.286399, -95.141602], [23.281719, -98.305664], [18.75031, -94.174805], [21.739091, -89.626465], [19.456234, -86.506348], [15.728814, -97.207031], [19.993998, -105.776367], [25.542441, -108.720703], [30.202114, -112.895508]],
        AUS: [[-11.867, 131.836], [-38.685, 145.898], [-34.307, 115.137], [-22.593, 114.082], [-11.867, 131.836]],
        SAU: [[31.77, 39.42], [28.30, 48.65], [21.21, 55.68], [17.10, 42.67], [28.19, 34.80]],
        RUS: [[65.730626, 39.023438], [77.118032, 101.777344], [74.164085, 112.5], [66.160511, 189.84375], [51.289406, 158.203125], [59.534318, 64.335938], [65.730626, 39.023438]],
        TUR: [[40.380, 25.972], [42.098, 33.926], [41.112, 43.330], [36.915, 44.604], [36.244, 27.861], [40.380, 25.972]],
        PNG: [[1.055, 126.914], [-4.916, 149.854], [-11.695, 151.260], [-4.916, 131.572], [1.055, 126.914]],
        EGY: [[31.653, 24.961], [22.025, 25.049], [21.984, 36.958], [26.313, 34.189], [31.579, 31.860], [31.653, 24.961]],
        ITA: [[42.261, 14.502], [45.275, 11.162], [44.716, 8.569], [41.804, 12.019], [39.572, 15.908], [37.579, 16.084], [40.246, 18.853], [42.261, 14.502]],
        IRQ: [[33.870, 45.494], [35.889, 46.044], [37.178, 44.703], [37.370, 42.935], [33.468, 38.848], [32.101, 39.221], [31.185, 42.012], [29.210, 44.736], [29.037, 46.648], [30.808, 48.076], [32.250, 47.615], [33.870, 45.494]],
        Mesopotamia: [[32.694866, 35.463867], [36.809285, 36.694336], [37.160317, 44.780273], [31.090574, 48.076172], [28.960089, 46.450195], [31.989442, 40.517578], [32.694866, 35.463867]],
        Eurasia: [[56.753, 21.709], [42.553, 40.605], [52.429, 50.537], [56.170, 75.234], [49.724, 135.176], [71.636, 156.270], [77.274, 107.578], [67.809, 45.000], [56.753, 21.709]],
        Mesoamerica: [[-48.225, -75.938], [-19.973, -69.961], [-13.411, -78.047], [-1.055, -79.629], [-28.459, -48.340], [-40.847, -63.281], [-58.356, -69.434], [-48.225, -75.938]],
        WestAfrica: [[18.396, -15.293], [14.350, 25.049], [3.952, 19.336], [4.478, -9.053], [11.953, -16.611], [18.396, -15.293]],
        World: [[83.7, 89.1], [79.9, 89.1], [79.9, -9.0], [83.7, -9.0]] // Rectangle at top of the map
   };

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
    
    Object.keys(events).forEach(country => {
        if (countryLayers[country] && country !== 'order') {
            countryLayers[country].setStyle({
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.7,
                opacity: 1
            });
        }
    });
 
    const infoPanel = document.getElementById('info-panel');
    if (countries.length === 1) {
        infoPanel.textContent = events[countries[0]];
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
                    const infoPanel = document.getElementById('info-panel');
                    infoPanel.textContent = data[selectedDate][country];
                    
                    document.onmousemove = function(e) {
                        infoPanel.style.left = `${e.clientX}px`;
                        infoPanel.style.top = `${e.clientY}px`;
                        infoPanel.style.position = 'fixed';
                    };
                    
                    infoPanel.style.display = 'block';
                }
            });
    }
 }

document.addEventListener('DOMContentLoaded', () => {
   initMap();
   createTimeline();
});