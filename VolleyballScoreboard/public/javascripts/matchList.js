document.addEventListener('DOMContentLoaded', function () {
    const matchList = document.getElementById('matchesList');
    const newMatchForm = document.getElementById('addMatchForm');
    const filterStatus = document.getElementById('filterStatus');
    
    // Funkcja do pobierania meczów z API
    function fetchMatches(statusFilter = 'ALL') {
      fetch('/matches')
        .then(res => res.json())
        .then(matches => {
          matchList.innerHTML = '';
          matches.filter(match => statusFilter === 'ALL' || match.status === statusFilter)
            .forEach(match => {
              matchList.innerHTML += `
                <tr>
                  <td>${new Date(match.date).toLocaleString()}</td>
                  <td>${match.teama_name}</td>
                  <td>${match.teamb_name}</td>
                  <td>${match.result || '-'}</td>
                  <td>${match.status}</td>
                  <td>
                    <button class="btn btn-info" data-id="${match.id}" onclick="viewMatch(${match.id})">Podgląd</button>
                    <button class="btn btn-danger" data-id="${match.id}" onclick="deleteMatch(${match.id})">Usuń</button>
                  </td>
                </tr>
              `;
            });
        });
    }
  
    // Obsługa dodawania nowego meczu
    newMatchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const teamA = document.getElementById('teamA').value;
      const teamB = document.getElementById('teamB').value;
      const date = document.getElementById('date').value;
      
      fetch('/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teama_name: teamA, teamb_name: teamB, date: date, status: 'PLANNED' })
      })
      .then(res => res.json())
      .then(() => {
        fetchMatches();
        const modal = bootstrap.Modal.getInstance(document.getElementById('newMatchModal'));
        modal.hide();
      });
    });


  
    // Filtr statusów meczów
    filterStatus.addEventListener('change', function () {
      fetchMatches(filterStatus.value);
    });
  
    // Początkowe pobranie meczów
    fetchMatches();
  });
  
  // Funkcje podglądu i usunięcia meczu
  function viewMatch(id) {
    // Obsługa strony podglądu meczu
  }
  
  function deleteMatch(id) {
    if (confirm('Czy na pewno chcesz usunąć ten mecz?')) {
      fetch(`/matches/${id}`, { method: 'DELETE' })
        .then(() => fetchMatches());
    }
  }
  