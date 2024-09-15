document.addEventListener('DOMContentLoaded', function () {
  const socket = new WebSocket('ws://localhost:4000/');
  
  socket.addEventListener('message', function (event) {
    const matchData = JSON.parse(event.data);

    // Aktualizacja interfejsu na podstawie odebranych danych meczu
    document.getElementById('teamA').value = matchData.TeamA_Name;
    document.getElementById('teamB').value = matchData.TeamB_Name;
    document.getElementById('result').value = matchData.Result;
    document.getElementById('resultDetailed').value = JSON.stringify(matchData.ResultDetailed, null, 2);
    
    // Jeśli mecz zakończony, wyłącz kontrolki
    if (matchData.Status === 'FINISHED') {
      document.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
    }
  });

  // Funkcje do obsługi logiki gry (sety, punkty, zmiana stron)
  function updateScore(team, increment) {
    const currentScore = parseInt(document.getElementById(`${team}Score`).innerText);
    const newScore = currentScore + increment;
    
    // Zapobiegaj punktacji poniżej zera
    if (newScore >= 0) {
      document.getElementById(`${team}Score`).innerText = newScore;
      
      // Przykład logiki kończenia seta (25 punktów + przewaga 2)
      checkSetEnd();
    }
  }

  function checkSetEnd() {
    const teamAScore = parseInt(document.getElementById('teamAScore').innerText);
    const teamBScore = parseInt(document.getElementById('teamBScore').innerText);

    if ((teamAScore >= 25 || teamBScore >= 25) && Math.abs(teamAScore - teamBScore) >= 2) {
      // Zakończ set, zaktualizuj wynik szczegółowy
      const resultDetailed = JSON.parse(document.getElementById('resultDetailed').value);
      resultDetailed.resD.push(`${teamAScore}:${teamBScore}`);

      // Resetuj wynik dla nowego seta
      document.getElementById('teamAScore').innerText = 0;
      document.getElementById('teamBScore').innerText = 0;

      document.getElementById('resultDetailed').value = JSON.stringify(resultDetailed, null, 2);
      
      // Wyślij aktualizację do serwera przez WebSocket
      socket.send(JSON.stringify({
        action: 'setEnd',
        resultDetailed: resultDetailed,
        matchId: matchData.ID
      }));
    }
  }

  // Obsługa zmiany stron
  document.getElementById('changeSides').addEventListener('click', function () {
    const teamA = document.getElementById('teamA').value;
    const teamB = document.getElementById('teamB').value;

    // Zamień drużyny miejscami
    document.getElementById('teamA').value = teamB;
    document.getElementById('teamB').value = teamA;
  });

  // Zakończenie meczu po spełnieniu warunków
  function checkMatchEnd() {
    const resultDetailed = JSON.parse(document.getElementById('resultDetailed').value);
    
    const teamAWins = resultDetailed.resD.filter(set => set.split(":")[0] > set.split(":")[1]).length;
    const teamBWins = resultDetailed.resD.filter(set => set.split(":")[1] > set.split(":")[0]).length;

    if (teamAWins === 3 || teamBWins === 3) {
      // Zakończ mecz, wyślij dane do serwera
      socket.send(JSON.stringify({
        action: 'matchEnd',
        matchId: matchData.ID,
        result: `${teamAWins}:${teamBWins}`,
        status: 'FINISHED'
      }));

      // Zablokuj wszystkie kontrolki
      document.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
    }
  }

  // Zakończenie seta ręcznie (np. gdy set jest krótszy w Tie-Breaku)
  document.getElementById('endSet').addEventListener('click', checkSetEnd);

  // Przyciski do manipulacji wynikiem
  document.getElementById('teamAInc').addEventListener('click', () => updateScore('teamA', 1));
  document.getElementById('teamBInc').addEventListener('click', () => updateScore('teamB', 1));
  document.getElementById('teamADec').addEventListener('click', () => updateScore('teamA', -1));
  document.getElementById('teamBDec').addEventListener('click', () => updateScore('teamB', -1));
});

// const ws = new WebSocket('ws://localhost:4000/ws/match');

// ws.onopen = function () {
//   console.log('Połączono z WebSocket');
// };

// ws.onmessage = function (event) {
//   const data = JSON.parse(event.data);
//   // Aktualizacja interfejsu na podstawie danych z WebSocket
// };

// document.getElementById('increaseTeamA').addEventListener('click', () => {
//   // Inkrementacja wyniku drużyny A
// });

// document.getElementById('increaseTeamB').addEventListener('click', () => {
//   // Inkrementacja wyniku drużyny B
// });

// document.getElementById('finishSet').addEventListener('click', () => {
//   // Logika zakończenia seta
// });

// document.getElementById('finishMatch').addEventListener('click', () => {
//   // Logika zakończenia meczu
// });
