"use strict";
// Tris.js: Gioco del Tic Tac Toe per 2 player

let boardState = Array(9).fill("");
let currentPlayer = "X"; // "X" → Giocatore 1 (Rosso), "O" → Giocatore 2 (Blu)
let gameOver = false;

const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");

document.getElementById("closeButton").addEventListener("click", () => {
  window.parent.closeGame();
});

function initBoard() {
  boardState = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  messageEl.innerText = "Turno: X 😃";
  boardEl.innerHTML = "";
  for(let i = 0; i < 9; i++){
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  }
}

function onCellClick(e) {
  const index = e.target.dataset.index;
  if(boardState[index] !== "" || gameOver) return;
  
  boardState[index] = currentPlayer;
  e.target.innerText = currentPlayer;
  e.target.classList.add("disabled");
  
  if(checkWinner(currentPlayer)){
    gameOver = true;
    messageEl.innerText = `Vittoria di ${currentPlayer}! 🎉`;
    setTimeout(() => {
      window.parent.reportGameResult(currentPlayer === "X" ? "red" : "blue");
    }, 1000);
    return;
  } else if(boardState.every(cell => cell !== "")) {
    gameOver = true;
    messageEl.innerText = "Pareggio! 😐";
    setTimeout(() => { window.parent.reportGameResult("draw"); }, 1000);
    return;
  }
  
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  messageEl.innerText = `Turno: ${currentPlayer} ${currentPlayer === "X" ? "😃" : "😊"}`;
}

function checkWinner(player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(combo => combo.every(i => boardState[i] === player));
}

initBoard();
