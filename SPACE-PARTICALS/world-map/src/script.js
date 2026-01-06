// Initialize the map
var map = L.map('map').setView([20, 0], 2); // Centered on the world, zoom level 2

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Optional: Add a marker at a specific location, e.g., New York
L.marker([40.7128, -74.0060]).addTo(map)
    .bindPopup('Hello, World!')
    .openPopup();
