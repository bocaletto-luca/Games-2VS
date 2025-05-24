"use strict";
// Dama - Versione Semplificata per 2 Player (senza tutte le regole complete)
// In questa versione il gioco utilizza una board 8x8. 
// Le celle scure (quando (row+col) è dispari) sono giocabili; le celle chiare sono non giocabili.
// I giocatori si alternano - il rosso inizia – e muovono le proprie pedine diagonalmente.
// Le mosse ammesse sono: spostamento diagonale semplice e cattura per salto (di base, una sola cattura).
// Alla fine, se un giocatore non può muovere, il gioco termina e comunica il risultato tramite window.parent.reportGameResult(result)
// con "red" se vince il Giocatore 1, "blue" se vince il Giocatore 2 e "draw" se pareggio.
// È presente un pulsante "✖ Chiudi" per abbandonare la sfida.

let board = [];
let currentPlayer = "r";  // "r" = Rosso, "b" = Blu
let gameActive = true;
let selectedPiece = null;

const boardContainer = document.getElementById("boardContainer");
const messageEl = document.getElementById("message");

// Pulsante "Chiudi" (già associato in dama.html)
document.getElementById("closeButton").addEventListener("click", () => {
  if (confirm("Vuoi davvero abbandonare il gioco?")) {
    window.parent.closeGame();
  }
});

// Inizializza la board e posiziona le pedine in modo convenzionale:
// - Le celle giocabili (scure) verranno usate per posizionare le pedine
// - Il Rosso viene posizionato nelle righe 0-2 (in alto)
// - Il Blu nelle righe 5-7 (in basso)
function initBoard() {
  board = [];
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    for (let c = 0; c < 8; c++) {
      // Le celle non giocabili (light): 
      board[r][c] = ((r + c) % 2 === 1) ? null : "light";
    }
  }
  // Posiziona le pedine del Rosso (in alto: righe 0,1,2) sulle celle giocabili (dove (r+c) % 2 === 1)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if (((r + c) % 2 === 1)) {
        board[r][c] = { player: "r", king: false };
      }
    }
  }
  // Posiziona le pedine del Blu (in basso: righe 5,6,7)
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (((r + c) % 2 === 1)) {
        board[r][c] = { player: "b", king: false };
      }
    }
  }
  // Imposta il giocatore iniziale: il Rosso inizia
  currentPlayer = "r";
  gameActive = true;
  selectedPiece = null;
  updateMessage(`Turno: Rosso 😃`);
  drawBoard();
}

// Disegna la board: crea le celle e, se presenti, le pedine
function drawBoard() {
  boardContainer.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      // Celle giocabili (scure) e non giocabili (light)
      if ((r + c) % 2 === 1) {
        cellDiv.classList.add("dark-square");
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;
        cellDiv.addEventListener("click", onCellClick);
      } else {
        cellDiv.classList.add("light-square");
      }
      const cellData = board[r][c];
      if (cellData && cellData !== "light") {
        const pieceDiv = document.createElement("div");
        pieceDiv.classList.add("piece");
        pieceDiv.classList.add(cellData.player === "r" ? "red" : "blue");
        if (cellData.king) pieceDiv.classList.add("king");
        cellDiv.appendChild(pieceDiv);
      }
      boardContainer.appendChild(cellDiv);
    }
  }
}

// Aggiorna il messaggio visuale sullo schermo
function updateMessage(text) {
  messageEl.innerText = text;
}

// Event handler per i click sulle celle giocabili
function onCellClick(e) {
  if (!gameActive) return;
  const r = parseInt(e.currentTarget.dataset.row);
  const c = parseInt(e.currentTarget.dataset.col);
  const cellData = board[r][c];
  // Se clicco su una mia pedina, la seleziono
  if (cellData && cellData !== "light" && cellData.player === currentPlayer) {
    selectedPiece = { row: r, col: c };
    highlightSelected(e.currentTarget);
  }
  // Altrimenti, se la cella è vuota e c'è una pedina selezionata, provo a muoverla
  else if (!cellData && selectedPiece) {
    const legal = getLegalMovesForPiece(selectedPiece.row, selectedPiece.col);
    const move = legal.find(m => m.destRow === r && m.destCol === c);
    if (move) {
      performMove(selectedPiece.row, selectedPiece.col, r, c, move);
      selectedPiece = null;
      removeHighlights();
    }
  }
}

// Aggiunge una classe per evidenziare la cella selezionata
function highlightSelected(cellEl) {
  removeHighlights();
  cellEl.classList.add("selected");
}

// Rimuove evidenziazioni da tutte le celle
function removeHighlights() {
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("selected"));
}

// Calcola le mosse legali per una pedina nella cella (r, c)
// Regole semplificate: se la pedina non è king, il Rosso si muove in avanti (verso righe maggiori)
// e il Blu in avanti (verso righe minori). Si considerano mosse semplici e catture per salto.
function getLegalMovesForPiece(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  let moves = [];
  let dirs = [];
  if (piece.king) {
    dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  } else {
    dirs = (piece.player === "r") ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];
  }
  // Mosse semplici
  dirs.forEach(([dr, dc]) => {
    const newRow = r + dr;
    const newCol = c + dc;
    if (isInside(newRow, newCol) && !board[newRow][newCol]) {
      moves.push({ destRow: newRow, destCol: newCol, capture: false });
    }
  });
  // Mosse di cattura: salta oltre la pedina avversaria, se la cella di destinazione è vuota.
  dirs.forEach(([dr, dc]) => {
    const midRow = r + dr, midCol = c + dc;
    const destRow = r + 2 * dr, destCol = c + 2 * dc;
    if (isInside(midRow, midCol) && isInside(destRow, destCol)) {
      const midCell = board[midRow][midCol];
      if (midCell && midCell !== "light" && midCell.player !== piece.player && !board[destRow][destCol]) {
        moves.push({ destRow: destRow, destCol: destCol, capture: true, captured: { row: midRow, col: midCol } });
      }
    }
  });
  return moves;
}

// Verifica se la cella (r, c) è all'interno del board
function isInside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Esegue la mossa dalla cella (fromR, fromC) alla cella (toR, toC), eventualmente eseguendo una cattura
function performMove(fromR, fromC, toR, toC, move) {
  board[toR][toC] = board[fromR][fromC];
  board[fromR][fromC] = null;
  if (move.capture) {
    board[move.captured.row][move.captured.col] = null;
  }
  // Promozione: se una pedina raggiunge l'ultima fila (per Rosso, r==7) o la prima (per Blu, r==0) diventa king.
  let piece = board[toR][toC];
  if (piece && !piece.king) {
    if (piece.player === "r" && toR === 7) { piece.king = true; }
    if (piece.player === "b" && toR === 0) { piece.king = true; }
  }
  drawBoard();
  // Controlla se il gioco è terminato: in questa versione semplificata, se uno dei due non ha mosse valide
  if (isGameOver()) {
    gameActive = false;
    let result = "draw";
    // Il vincitore è l'altro giocatore che ha ancora mosse
    if (!playerHasMoves("r")) { result = "blue"; }
    else if (!playerHasMoves("b")) { result = "red"; }
    updateMessage(`Gioco terminato! ${result==="red" ? "Rosso 😃" : result==="blue" ? "Blu 😊" : "Pareggio 😐"}`);
    setTimeout(() => { window.parent.reportGameResult(result); }, 1000);
  } else {
    // Cambia turno
    currentPlayer = (currentPlayer === "r") ? "b" : "r";
    updateMessage(`Turno: ${currentPlayer === "r" ? "Rosso 😃" : "Blu 😊"}`);
  }
}

// Controlla se un giocatore ha mosse valide per almeno una delle sue pedine
function playerHasMoves(player) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell !== "light" && cell.player === player) {
        const moves = getLegalMovesForPiece(r, c);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

// Determina se il gioco è finito: se almeno un giocatore non può muovere
function isGameOver() {
  return !playerHasMoves("r") || !playerHasMoves("b");
}

// Inizializza il gioco
initBoard();
