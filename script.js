// Game constants and state
const statCap = 100;
let currentPlayer = 1;
let players = {
    1: { position: [0, 0], hp: 0, attack: 0, energyPerTurn: 0, shieldStrength: 0, agility: 0, energy: 0, shieldActive: false },
    2: { position: [18, 18], hp: 0, attack: 0, energyPerTurn: 0, shieldStrength: 0, agility: 0, energy: 0, shieldActive: false }
};

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

// Render the 19x19 board
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let y = 0; y < 19; y++) {
        for (let x = 0; x < 19; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (x === players[1].position[0] && y === players[1].position[1]) cell.classList.add('player1');
            if (x === players[2].position[0] && y === players[2].position[1]) cell.classList.add('player2');
            board.appendChild(cell);
        }
    }
}

// Update the UI with current player info
function updateUI() {
    document.getElementById('current-player').textContent = currentPlayer;
    document.getElementById('current-hp').textContent = players[currentPlayer].hp;
    document.getElementById('current-energy').textContent = players[currentPlayer].energy;
}

// Set up action button listeners
function setupActionButtons() {
    document.getElementById('move').addEventListener('click', movePlayer);
    document.getElementById('attack').addEventListener('click', attack);
    document.getElementById('shield').addEventListener('click', shield);
    document.getElementById('end-turn').addEventListener('click', endTurn);
}

// Handle movement (simplified to one step at a time)
function movePlayer() {
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Up, Down, Left, Right
    const choice = prompt('Move: 0-up, 1-down, 2-left, 3-right');
    const dir = directions[parseInt(choice)];
    if (!dir) return;
    const newPos = [players[currentPlayer].position[0] + dir[0], players[currentPlayer].position[1] + dir[1]];
    if (newPos[0] < 0 || newPos[0] > 18 || newPos[1] < 0 || newPos[1] > 18) return;
    const distance = 1; // One step
    const energyCost = Math.ceil(distance * (10 / players[currentPlayer].agility));
    if (players[currentPlayer].energy >= energyCost) {
        players[currentPlayer].energy -= energyCost;
        players[currentPlayer].position = newPos;
        renderBoard();
        updateUI();
    } else {
        alert('Not enough energy to move.');
    }
}

// Handle attack (Manhattan distance, simplified line-of-sight)
function attack() {
    const target = currentPlayer === 1 ? 2 : 1;
    const dx = Math.abs(players[currentPlayer].position[0] - players[target].position[0]);
    const dy = Math.abs(players[currentPlayer].position[1] - players[target].position[1]);
    const distance = dx + dy;
    if (distance === 0 || (dx !== 0 && dy !== 0)) return; // Must be in a straight line
    const damage = Math.floor(players[currentPlayer].attack / (distance + 1));
    let actualDamage = damage;
    if (players[target].shieldActive) {
        const reduction = Math.floor((players[target].shieldStrength * 10) / 100); // 10 energy used for shield
        actualDamage = Math.max(0, damage - reduction);
    }
    players[target].hp -= actualDamage;
    if (players[target].hp <= 0) {
        alert(`Player ${currentPlayer} wins!`);
        location.reload();
    }
    endTurn();
}

// Handle shield action
function shield() {
    const energyCost = 10; // Fixed cost for simplicity
    if (players[currentPlayer].energy >= energyCost) {
        players[currentPlayer].energy -= energyCost;
        players[currentPlayer].shieldActive = true;
        endTurn();
    } else {
        alert('Not enough energy to shield.');
    }
}

// Switch turns
function endTurn() {
    players[currentPlayer].shieldActive = false;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    players[currentPlayer].energy += 100 + players[currentPlayer].energyPerTurn;
    renderBoard();
    updateUI();
}