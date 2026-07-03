// Dormant point management prototype for Isometric Grid Explorer.
// This file is not loaded by index.html until the game layer is revived.

let points = 0;

// Get current points
function getPoints() {
    return points;
}

// Add points
function addPoints(amount) {
    points += amount;
    updatePointDisplay();
}

// Spend points
function spendPoints(amount) {
    if (points >= amount) {
        points -= amount;
        updatePointDisplay();
        return true;
    }
    return false;
}

// Update point display in UI
function updatePointDisplay() {
    const pointElement = document.getElementById('point-count');

    if (pointElement) {
        pointElement.textContent = `Points: ${points}`;
    }
}

// Initialize points display
window.addEventListener('load', () => {
    updatePointDisplay();
});

// Set initial points to 0
points = 0;
