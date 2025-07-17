// Game constants and state
const statCap = 100;
let currentPlayer = 1;
let players = {
    1: { position: [0, 0], hp: 0, attack: 0, energyPerTurn: 0, shieldStrength: 0, agility: 0, energy: 0, shieldActive: false },
    2: { position: [18, 18], hp: 0, attack: 0, energyPerTurn: 0, shieldStrength: 0, agility: 0, energy: 0, shieldActive: false }
};
let tempPosition = null;
let draggedPiece = null;
let dragStartX, dragStartY;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupStatAllocation();
});

// Set up stat allocation screen
function setupStatAllocation() {
    const startButton = document.getElementById('start-game');
    startButton.addEventListener('click', () => {
        if (allocateStats(1) && allocateStats(2)) {
            document.getElementById('stat-allocation').classList.add('hidden');
            document.getElementById('game-board').classList.remove('hidden');
            initializeGame();
        } else {
            alert('Invalid stat allocation. Ensure all stats are at least 1 and total does not exceed 100.');
        }
    });

    setupStatInputs(1);
    setupStatInputs(2);
}

// Dynamically update points remaining as stats are adjusted
function setupStatInputs(player) {
    const stats = ['hp', 'attack', 'energy', 'shield', 'agility'];
    stats.forEach(stat => {
        const input = document.getElementById(`p${player}-${stat}`);
        input.addEventListener('input', () => updatePoints(player));
    });
    updatePoints(player);
}

function updatePoints(player) {
    const stats = ['hp', 'attack', 'energy', 'shield', 'agility'];
    let total = 0;
    stats.forEach(stat => total += parseInt(document.getElementById(`p${player}-${stat}`).value) || 0);
    document.getElementById(`p${player}-points`).textContent = statCap - total;
}

// Allocate stats and validate
function allocateStats(player) {
    const stats = ['hp', 'attack', 'energy', 'shield', 'agility'];
    let total = 0;
    stats.forEach(stat => {
        const value = parseInt(document.getElementById(`p${player}-${stat}`).value);
        if (value < 1) return false;
        players[player][stat] = value;
        total += value;
    });
    return total <= statCap;
}

// Start the game
function initializeGame() {
    currentPlayer = players[1].hp < players[2].hp ? 1 : 2; // Lower HP goes first
    players[1].energy = 100 + players[1].energyPerTurn;
    players[2].energy = 100 + players[2].energyPerTurn;
    renderBoard();
    updateUI();
    setupActionButtons();
}

// Render the board with SVG
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Clear the board

    // Draw grid lines with green stroke
    for (let i = 0; i <= 18; i++) {
        const lineH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineH.setAttribute('x1', 0);
        lineH.setAttribute('y1', i * 20);
        lineH.setAttribute('x2', 360);
        lineH.setAttribute('y2', i * 20);
        lineH.setAttribute('stroke', '#0f0');
        board.appendChild(lineH);

        const lineV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineV.setAttribute('x1', i * 20);
        lineV.setAttribute('y1', 0);
        lineV.setAttribute('x2', i * 20);
        lineV.setAttribute('y2', 360);
        lineV.setAttribute('stroke', '#0f0');
        board.appendChild(lineV);
    }

    // Draw players
    for (let p = 1; p <= 2; p++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', players[p].position[0] * 20);
        circle.setAttribute('cy', players[p].position[1] * 20);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', p === 1 ? 'red' : 'blue');
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('data-player', p);
        circle.addEventListener('mousedown', startDrag);
        board.appendChild(circle);
    }
}

// Update the UI with current player info and attack button visibility
function updateUI() {
    document.getElementById('current-player').textContent = currentPlayer;
    document.getElementById('current-hp').textContent = players[currentPlayer].hp;
    document.getElementById('current-energy').textContent = players[currentPlayer].energy;

    // Show attack button only if opponent is in line of sight
    const attackButton = document.getElementById('attack');
    const target = currentPlayer === 1 ? 2 : 1;
    const [px, py] = players[currentPlayer].position;
    const [tx, ty] = players[target].position;
    if (px === tx || py === ty) {
        attackButton.classList.remove('hidden');
    } else {
        attackButton.classList.add('hidden');
    }
}

// Set up action button listeners
function setupActionButtons() {
    document.getElementById('attack').addEventListener('click', attack);
    document.getElementById('shield').addEventListener('click', shield);
    document.getElementById('confirm-move').addEventListener('click', confirmMove);
    document.getElementById('undo-move').addEventListener('click', undoMove);
}

// Drag-and-drop functions
function startDrag(event) {
    const playerNum = parseInt(event.target.getAttribute('data-player'));
    if (playerNum !== currentPlayer || tempPosition) return; // Only current player can drag, no dragging if previewing
    draggedPiece = event.target;
    dragStartX = players[currentPlayer].position[0];
    dragStartY = players[currentPlayer].position[1];
    showPossiblePaths();
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(event) {
    if (!draggedPiece) return;
    const rect = document.getElementById('board').getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.round(x / 20);
    const gridY = Math.round(y / 20);

    // Restrict to horizontal or vertical movement
    const player = players[currentPlayer];
    const costPerStep = Math.ceil(10 / player.agility);
    const maxDistance = Math.floor(player.energy / costPerStep);

    if (gridX === dragStartX && Math.abs(gridY - dragStartY) <= maxDistance && gridY >= 0 && gridY <= 18) {
        draggedPiece.setAttribute('cx', dragStartX * 20);
        draggedPiece.setAttribute('cy', gridY * 20);
    } else if (gridY === dragStartY && Math.abs(gridX - dragStartX) <= maxDistance && gridX >= 0 && gridX <= 18) {
        draggedPiece.setAttribute('cx', gridX * 20);
        draggedPiece.setAttribute('cy', dragStartY * 20);
    }
}

function stopDrag(event) {
    if (!draggedPiece) return;
    const gridX = Math.round(parseInt(draggedPiece.getAttribute('cx')) / 20);
    const gridY = Math.round(parseInt(draggedPiece.getAttribute('cy')) / 20);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.querySelectorAll('[data-highlight]').forEach(el => el.remove());

    if (gridX === dragStartX && gridY === dragStartY) {
        renderBoard(); // Revert if dropped at start
    } else {
        tempPosition = [dragStartX, dragStartY];
        players[currentPlayer].position = [gridX, gridY];
        document.getElementById('move-controls').classList.remove('hidden');
    }
    draggedPiece = null;
}

function showPossiblePaths() {
    document.querySelectorAll('[data-highlight]').forEach(el => el.remove());
    const player = players[currentPlayer];
    const [cx, cy] = player.position;
    const costPerStep = Math.ceil(10 / player.agility);
    const maxDistance = Math.floor(player.energy / costPerStep);

    // Highlight along the row
    for (let x = Math.max(0, cx - maxDistance); x <= Math.min(18, cx + maxDistance); x++) {
        if (x !== cx) {
            addHighlight(x, cy);
        }
    }
    // Highlight along the column
    for (let y = Math.max(0, cy - maxDistance); y <= Math.min(18, cy + maxDistance); y++) {
        if (y !== cy) {
            addHighlight(cx, y);
        }
    }
}

function addHighlight(x, y) {
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlight.setAttribute('cx', x * 20);
    highlight.setAttribute('cy', y * 20);
    highlight.setAttribute('r', '5');
    highlight.setAttribute('fill', 'yellow');
    highlight.setAttribute('opacity', '0.5');
    highlight.setAttribute('data-highlight', `${x},${y}`);
    document.getElementById('board').appendChild(highlight);
}

// Confirm the move
function confirmMove() {
    if (!tempPosition) return;
    const [oldX, oldY] = tempPosition;
    const [newX, newY] = players[currentPlayer].position;
    const distance = Math.abs(newX - oldX) + Math.abs(newY - oldY);
    const costPerStep = Math.ceil(10 / players[currentPlayer].agility);
    const totalCost = distance * costPerStep;

    players[currentPlayer].energy -= totalCost;
    tempPosition = null;
    document.getElementById('move-controls').classList.add('hidden');
    renderBoard();
    updateUI();
    if (players[currentPlayer].energy <= 0) {
        switchTurn();
    }
}

// Undo the move
function undoMove() {
    if (!tempPosition) return;
    players[currentPlayer].position = tempPosition;
    tempPosition = null;
    document.getElementById('move-controls').classList.add('hidden');
    renderBoard();
    updateUI();
}

// Handle attack (ends turn)
function attack() {
    if (tempPosition) {
        alert('Please confirm or undo your move first.');
        return;
    }
    const target = currentPlayer === 1 ? 2 : 1;
    const [px, py] = players[currentPlayer].position;
    const [tx, ty] = players[target].position;
    if (px === tx || py === ty) { // Same row or column
        const distance = Math.abs(px - tx) + Math.abs(py - ty);
        const damage = Math.floor(players[currentPlayer].attack / (distance + 1));
        let actualDamage = damage;
        if (players[target].shieldActive) {
            const reduction = Math.floor((players[target].shieldStrength * 10) / 100);
            actualDamage = Math.max(0, damage - reduction);
        }
        players[target].hp -= actualDamage;
        if (players[target].hp <= 0) {
            alert(`Player ${currentPlayer} wins!`);
            location.reload();
        }
        switchTurn();
    } else {
        alert('Target is not in line of sight.');
    }
}

// Handle shield (ends turn)
function shield() {
    if (tempPosition) {
        alert('Please confirm or undo your move first.');
        return;
    }
    const energyCost = 10;
    if (players[currentPlayer].energy >= energyCost) {
        players[currentPlayer].energy -= energyCost;
        players[currentPlayer].shieldActive = true;
        switchTurn();
    } else {
        alert('Not enough energy to shield.');
    }
}

// Switch turns
function switchTurn() {
    if (tempPosition) {
        undoMove(); // Automatically undo unconfirmed move
    }
    players[currentPlayer].shieldActive = false;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    players[currentPlayer].energy += 100 + players[currentPlayer].energyPerTurn;
    renderBoard();
    updateUI();
}