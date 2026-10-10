let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let xWins = 0;
let oWins = 0;

const statusDisplay = document.getElementById('status');
const playerDisplay = document.getElementById('current-player');
const cells = document.querySelectorAll('.cell');
const resetBtn = document.getElementById('reset-btn');
const scoreXDisplay = document.getElementById('score-x');
const scoreODisplay = document.getElementById('score-o');

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function handleCellClick(clickedCellEvent) {
  const clickedCell = clickedCellEvent.target;
  const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

  if (board[clickedCellIndex] !== '' || !gameActive) {
    return;
  }

  handleCellPlayed(clickedCell, clickedCellIndex);
  handleResultValidation();
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
  board[clickedCellIndex] = currentPlayer;
  clickedCell.classList.add(currentPlayer.toLowerCase());
}

function handleResultValidation() {
  let roundWon = false;
  let winningCombination = [];

  for (let i = 0; i <= 7; i++) {
    const winCondition = winningConditions[i];
    let a = board[winCondition[0]];
    let b = board[winCondition[1]];
    let c = board[winCondition[2]];

    if (a === '' || b === '' || c === '') {
      continue;
    }
    if (a === b && b === c) {
      roundWon = true;
      winningCombination = winCondition;
      break;
    }
  }

  if (roundWon) {
    statusDisplay.innerHTML = `Player <span class="${currentPlayer.toLowerCase()}">${currentPlayer}</span> Wins!`;
    gameActive = false;
    highlightWinners(winningCombination);
    updateScore();
    return;
  }

  let roundDraw = !board.includes('');
  if (roundDraw) {
    statusDisplay.innerText = "Game is a Draw!";
    gameActive = false;
    return;
  }

  handlePlayerChange();
}

function handlePlayerChange() {
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusDisplay.innerHTML = `Player <span id="current-player" class="${currentPlayer.toLowerCase()}">${currentPlayer}</span>'s Turn`;
}

function highlightWinners(combination) {
  combination.forEach(index => {
    cells[index].classList.add('winner');
  });
}

function updateScore() {
  if (currentPlayer === 'X') {
    xWins++;
    scoreXDisplay.innerText = xWins;
  } else {
    oWins++;
    scoreODisplay.innerText = oWins;
  }
}

function handleRestartGame() {
  gameActive = true;
  currentPlayer = 'X';
  board = ['', '', '', '', '', '', '', '', ''];
  statusDisplay.innerHTML = `Player <span id="current-player" class="x">X</span>'s Turn`;
  cells.forEach(cell => {
    cell.classList.remove('x');
    cell.classList.remove('o');
    cell.classList.remove('winner');
    cell.innerText = "";
  });
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', handleRestartGame);
