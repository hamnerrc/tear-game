// Player objects with stats (hardcoded for now, summing to 100)
const player1 = {
    hp: 30,
    attack: 20,
    energyPerTurn: 25,
    shieldStrength: 5,
    agility: 20,
    position: { x: 0, y: 0 },
    energy: 0,
    shield: 0
};

const player2 = {
    hp: 40,
    attack: 15,
    energyPerTurn: 30,
    shieldStrength: 4,
    agility: 11,
    position: { x: 8, y: 8 },
    energy: 0,
    shield: 0
};

// Determine first player (lower HP goes first, Player 1 if tied)
let currentPlayer = player1.hp < player2.hp ? player1 : player2;

// Generate the 9x9 board
const board = document.get freeElementById('board');
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}-${j}`;
        board.appendChild(cell);
    }
}

// Place players on the board
const player1Div = document.createElement('div');
player1Div.className = 'player';
player1Div.id = 'player1';
player1Div.textContent = 'P1';
document.getElementById('cell-0-0').appendChild(player1Div);

const player2Div = document.createElement('div');
player2Div.className = 'player';
player2Div.id = 'player2';
player2Div.textContent = 'P2';
document.getElementById('cell-8-8').appendChild(player2Div);

// Update player info display
function updatePlayerInfo() {
    document.getElementById('current-player').textContent = `Player ${currentPlayer === player1 ? 1 : 2}'s Turn`;
    document.getElementById('hp').textContent = `HP: ${currentPlayer.hp}`;
    document.getElementById('energy').textContent = `Energy: ${currentPlayer.energy}`;
}

// Start a turn
function startTurn() {
    currentPlayer.energy += currentPlayer.energyPerTurn;
    updatePlayerInfo();
}

// Check if positions are adjacent (horizontal or vertical moves only)
function isAdjacent(x1, y1, x2, y2) {
    return (Math.abs(x1 - x2) === 1 && y1 === y2) || (Math.abs(y1 - y2) === 1 && x1 === x2);
}

// Move player to a new position
function movePlayer(newX, newY) {
    const cost = Math.ceil(10 / currentPlayer.agility); // Higher agility = lower cost
    if (currentPlayer.energy >= cost && isAdjacent(currentPlayer.position.x, currentPlayer.position.y, newX, newY)) {
        const oldCell = document.getElementById(`cell-${currentPlayer.position.x}-${currentPlayer.position.y}`);
        const playerDiv = document.getElementById(`player${currentPlayer === player1 ? 1 : 2}`);
        oldCell.removeChild(playerDiv);
        const newCell = document.getElementById(`cell-${newX}-${newY}`);
        newCell.appendChild(playerDiv);
        currentPlayer.position.x = newX;
        currentPlayer.position.y = newY;
        currentPlayer.energy -= cost;
        updatePlayerInfo();
    }
}

// Check if target is in line of sight (row, column, or diagonal)
function isLineOfSight(x1, y1, x2, y2) {
    return x1 === x2 || y1 === y2 || Math.abs(x1 - x2) === Math.abs(y1 - y2);
}

// Attack logic
document.getElementById('attack-btn').addEventListener('click', () => {
    const target = currentPlayer === player1 ? player2 : player1;
    const attackCost = 20; // Fixed attack cost
    if (currentPlayer.energy >= attackCost && isLineOfSight(currentPlayer.position.x, currentPlayer.position.y, target.position.x, target.position.y)) {
        const distance = Math.max(Math.abs(currentPlayer.position.x - target.position.x), Math.abs(currentPlayer.position.y - target.position.y)) || 1; // Min distance 1
        const damage = currentPlayer.attack / distance;
        const damageTaken = Math.max(0, damage - target.shield);
        target.hp -= damageTaken;
        target.shield = 0; // Shield is used up
        currentPlayer.energy -= attackCost;
        if (target.hp <= 0) {
            alert(`Player ${currentPlayer === player1 ? 1 : 2} wins!`);
            // Disable further actions (basic game over)
            document.getElementById('attack-btn').disabled = true;
            document.getElementById('shield-btn').disabled = true;
            document.getElementById('end-turn-btn').disabled = true;
        }
        endTurn();
    } else {
        alert('Not enough energy or target not in line of sight!');
    }
});

// Shield logic
document.getElementById('shield-btn').addEventListener('click', () => {
    const energyToSpend = prompt('Enter energy to spend on shield (1 or more):');
    const E = parseInt(energyToSpend);
    if (E > 0 && E <= currentPlayer.energy) {
        currentPlayer.shield = currentPlayer.shieldStrength * E;
        currentPlayer.energy -= E;
        endTurn();
    } else {
        alert('Invalid energy amount!');
    }
});

// End turn
document.getElementById('end-turn-btn').addEventListener('click', endTurn);

function endTurn() {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
    startTurn();
}

// Handle movement via clicks
board.addEventListener('click', (e) => {
    const cellId = e.target.id || e.target.parentElement.id; // Account for clicking player icon
    if (cellId && cellId.startsWith('cell-')) {
        const [_, x, y] = cellId.split('-');
        const newX = parseInt(x);
        const newY = parseInt(y);
        movePlayer(newX, newY);
    }
});

// Start the game
startTurn();
