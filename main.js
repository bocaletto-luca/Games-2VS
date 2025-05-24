"use strict";
window.addEventListener("DOMContentLoaded", function () {
  // I moduli di gioco reali sono ospitati in file separati (nella cartella "games")
  // La mappatura chiave (nome del gioco) → file HTML:
  const gameFiles = {
    "Tris": "tris.html",
    "Dama": "dama.html",
    "Indovina la Coppia": "indovina-coppia.html",
    "Gioco dell'Oca": "oca.html",
  };

  // Array dei moduli (usiamo il nome per la mappatura; le funzioni init e help non vengono più chiamate qui)
  const games = [
    { name: "Tris" },
    { name: "Dama" },
    { name: "Indovina la Coppia" },
    { name: "Gioco dell'Oca" },
  ];

  // Stato globale della competizione
  let competition = {
    players: { red: "", blue: "" },
    currentGameIndex: 0,
    score: { red: 0, blue: 0, draws: 0 },
  };

  const COMPETITION_RECORDS_KEY = "competitionRecords";

  // Funzioni per la persistenza
  function saveCompetitionState() {
    localStorage.setItem("competitionState", JSON.stringify(competition));
  }
  function loadCompetitionState() {
    const state = localStorage.getItem("competitionState");
    if (state) {
      competition = JSON.parse(state);
      return true;
    }
    return false;
  }
  function clearCompetitionState() {
    localStorage.removeItem("competitionState");
  }

  // Mostra la sezione con l'ID specificato (hub, competizione, finale, record)
  function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // Aggiorna il display globale della competizione (punteggio e info sul gioco corrente)
  function updateCompetitionDisplay() {
    const currentGameName = games[competition.currentGameIndex].name;
    document.getElementById("gameInfo").innerText =
      `Sfida: ${currentGameName} (${competition.currentGameIndex + 1} di ${games.length}) 🤩`;
    document.getElementById("scoreBoard").innerHTML =
      `<strong>${competition.players.blue}</strong> (Blu): ${competition.score.blue} - ` +
      `<strong>${competition.players.red}</strong> (Rosso): ${competition.score.red} - ` +
      `Pareggi: ${competition.score.draws}`;
    saveCompetitionState();
  }

  // Avvia il modulo di gioco corrente caricando il file HTML in un iframe
function startCurrentGame() {
  const game = games[competition.currentGameIndex];
  const file = gameFiles[game.name]; // Assicurati che gameFiles sia definito come mapping nome → file HTML
  const container = document.getElementById("gameContainer");
  // L'iframe occuperà l'intera area del contenitore
  container.innerHTML = `<iframe src="games/${file}" style="width:100%; height:100%; border:0;" scrolling="no"></iframe>`;
}


  // La funzione reportGameResult viene chiamata dai moduli (nei file nelle cartelle) tramite window.parent.reportGameResult(result)
  function reportGameResult(result) {
    console.log("Risultato dal gioco:", result);
    if (result === "red") {
      competition.score.red++;
    } else if (result === "blue") {
      competition.score.blue++;
    } else if (result === "draw") {
      competition.score.draws++;
    }
    updateCompetitionDisplay();
    nextGame();
    saveCompetitionState();
  }

  // Passa al gioco successivo oppure termina la competizione
  function nextGame() {
    competition.currentGameIndex++;
    if (competition.currentGameIndex >= games.length) {
      endCompetition();
    } else {
      startCurrentGame();
    }
  }

  // Termina la competizione, mostra il risultato finale e registra il record globale
  function endCompetition() {
    let finalWinner = "";
    if (competition.score.red > competition.score.blue) {
      finalWinner = competition.players.red;
    } else if (competition.score.red < competition.score.blue) {
      finalWinner = competition.players.blue;
    } else {
      finalWinner = "Draw";
    }
    document.getElementById("finalMessage").innerHTML =
      `<p>Punteggio Finale: R:${competition.score.red} - B:${competition.score.blue} - D:${competition.score.draws}</p>` +
      `<p>Vincitore: <strong>${finalWinner}</strong></p>`;
    saveCompetitionRecord(finalWinner);
    clearCompetitionState();
    showSection("finalSection");
  }

  // Registra il record globale della competizione in localStorage
  function saveCompetitionRecord(finalWinner) {
    const record = {
      date: new Date().toLocaleString(),
      players: `${competition.players.red} vs ${competition.players.blue}`,
      score: competition.score,
      winner: finalWinner,
    };
    let records = JSON.parse(localStorage.getItem(COMPETITION_RECORDS_KEY)) || [];
    records.push(record);
    localStorage.setItem(COMPETITION_RECORDS_KEY, JSON.stringify(records));
  }

  // Scarica i record globali in formato JSON
  function downloadCompetitionRecords() {
    let records = JSON.parse(localStorage.getItem(COMPETITION_RECORDS_KEY)) || [];
    let data = JSON.stringify(records, null, 2);
    let blob = new Blob([data], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "competition-records.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Aggiorna il display dei record globali nella sezione Record
  function updateCompetitionRecordsDisplay() {
    let records = JSON.parse(localStorage.getItem(COMPETITION_RECORDS_KEY)) || [];
    const tbody = document.getElementById("recordsTableBody");
    tbody.innerHTML = "";
    records.forEach(rec => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${rec.date}</td>
        <td>${rec.players}</td>
        <td>R:${rec.score.red} - B:${rec.score.blue} - D:${rec.score.draws}</td>
        <td>${rec.winner}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --------------------- Associa gli event listener ---------------------
  document.getElementById("competitionForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const p1 = document.getElementById("player1Name").value.trim();
    const p2 = document.getElementById("player2Name").value.trim();
    if (!p1 || !p2) {
      alert("Inserisci i nomi di entrambi i giocatori! 😢");
      return;
    }
    competition.players.red = p1;
    competition.players.blue = p2;
    competition.currentGameIndex = 0;
    competition.score = { red: 0, blue: 0, draws: 0 };
    saveCompetitionState();
    updateCompetitionDisplay();
    startCurrentGame();
    showSection("competitionSection");
  });

  document.getElementById("hubHelpButton").addEventListener("click", function () {
    alert(
      "Competizione:\n\n- Inserisci i nomi dei giocatori.\n- La competizione consiste in 4 sfide: Tris, Dama, Indovina la Coppia e Gioco dell'Oca.\n- Dopo aver cliccato 'Avvia Competizione', la sfida inizierà.\n- Il risultato di ogni gioco verrà registrato e, alla fine, verrà determinato il vincitore.\n\nBuona fortuna! 😊"
    );
  });

  document.getElementById("gameHelpButton").addEventListener("click", function () {
    // Per i moduli caricati tramite iframe, il pulsante Help può comunicare una direttiva.
    alert("Il modulo corrente dispone di un pulsante Help al suo interno. Se non vedi le istruzioni, chiudi il gioco e riprova.");
  });

  document.getElementById("gameCloseButton").addEventListener("click", function () {
    if (confirm("Vuoi abbandonare questa sfida?")) { showSection("hubSection"); }
  });

  document.getElementById("showRecordsButton").addEventListener("click", function () {
    updateCompetitionRecordsDisplay();
    showSection("recordsSection");
  });
  document.getElementById("recordsCloseButton").addEventListener("click", function () {
    showSection("hubSection");
  });
  document.getElementById("finalBackButton").addEventListener("click", function () {
    showSection("hubSection");
  });

  // Se il pulsante di download non è già presente, lo aggiungiamo
  if (!document.getElementById("downloadRecordsButton")) {
    document.getElementById("showRecordsButton").insertAdjacentHTML("afterend", `<button id="downloadRecordsButton" class="btn btn-dark btn-custom">Download Record JSON</button>`);
    document.getElementById("downloadRecordsButton").addEventListener("click", downloadCompetitionRecords);
  }

  // Espone la funzione reportGameResult per i moduli di gioco (che la chiameranno tramite window.parent.reportGameResult(result))
  window.reportGameResult = reportGameResult;

  // Al caricamento della pagina rimane visualizzato il HUB; la competizione parte solo al submit del form
  window.addEventListener("beforeunload", function () { saveCompetitionState(); });
});
