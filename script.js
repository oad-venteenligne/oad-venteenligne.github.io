document.addEventListener("DOMContentLoaded", function() {
  let allData = [];
  let isDarkMode = false;
  
  // Mapping des régions (ID -> nom)
  const regionMapping = {
    "1": "Auvergne-Rhône-Alpes",
    "2": "Bourgogne-Franche-Comté",
    "3": "Bretagne",
    "4": "Centre-Val de Loire",
    "5": "Corse",
    "6": "Grand Est",
    "7": "Hauts-de-France",
    "8": "Île-de-France",
    "9": "Normandie",
    "10": "Nouvelle-Aquitaine",
    "11": "Occitanie",
    "12": "Pays de la Loire",
    "13": "Provence-Alpes-Côte d'Azur",
    "14": "Guadeloupe",
    "15": "Martinique",
    "16": "Guyane",
    "17": "La Réunion",
    "18": "Mayotte"
  };

  // Permet d'ouvrir/fermer chaque bloc de filtre indépendamment
  document.querySelectorAll('.filter-header').forEach(header => {
    header.addEventListener('click', () => {
      const target = document.getElementById(header.getAttribute('data-target'));
      target.style.display = (target.style.display === "block") ? "none" : "block";
    });
  });
  
  // Bouton de mode sombre
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Fonction pour basculer le mode sombre
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeToggle.innerHTML = isDarkMode ? '☀️' : '🌙';
    
    // Sauvegarder la préférence de l'utilisateur
    localStorage.setItem('darkModePreference', isDarkMode ? 'dark' : 'light');
  }
  
  // Vérifier la préférence sauvegardée pour le mode sombre
  if (localStorage.getItem('darkModePreference') === 'dark') {
    toggleDarkMode();
  }
  
  // Bouton d'export
  const exportButton = document.getElementById('export-button');
  if (exportButton) {
    exportButton.addEventListener('click', exportResults);
  }

  // Fonction pour la recherche textuelle
  function searchFilter(searchText) {
    if (!searchText) return () => true;
    
    const searchLower = searchText.toLowerCase();
    return function(item) {
      return (
        (item.bf_titre && item.bf_titre.toLowerCase().includes(searchLower)) || 
        (item.bf_descriptiongenerale && item.bf_descriptiongenerale.toLowerCase().includes(searchLower))
      );
    };
  }
  
  // Fonction pour trier les résultats
  function sortItems(items, sortBy) {
    if (sortBy === 'alpha') {
      return [...items].sort((a, b) => a.bf_titre.localeCompare(b.bf_titre));
    } else if (sortBy === 'year') {
      return [...items].sort((a, b) => {
        const yearA = parseInt(a.listeListeAnneeDeMiseEnLigne) || 0;
        const yearB = parseInt(b.listeListeAnneeDeMiseEnLigne) || 0;
        return yearB - yearA; // Plus récent d'abord
      });
    } else if (sortBy === 'relevance') {
      // Le tri par pertinence est géré ailleurs
      return items;
    }
    return items;
  }
  
  // Fonction d'exportation des résultats
  function exportResults() {
    // Récupérer les items filtrés
    const filteredItems = getFilteredItems().filteredData;
    
    if (filteredItems.length === 0) {
      alert('Aucun résultat à exporter.');
      return;
    }
    
    // Préparer les données pour l'export
    const csvData = filteredItems.map(item => {
      return {
        'Nom': item.data.bf_titre || '',
        'Type': getPlatformType(item.data.listeListeTypeplateforme) || '',
        'Description': (item.data.bf_descriptiongenerale || '').replace(/"/g, '""'), // Échapper les guillemets
        'Année': getYearFromNumber(item.data.listeListeAnneeDeMiseEnLigne) || '',
        'URL': item.data.bf_urloutil || '',
        'Type de clients': getClientTypes(item.data.checkboxListeTypeclientid_typeclient) || '',
        'Coût': getCostType(item.data.checkboxListeCoutplateformeid_coutplateforme) || ''
      };
    });
    
    // Convertir en CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    // Créer un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `outils-agriculture-export-${date}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Fonction pour obtenir les items filtrés actuels avec leur score de correspondance
  function getFilteredItems() {
    // Récupération des critères sélectionnés pour chaque filtre
    const selectedPlatforms = Array.from(document.querySelectorAll('.filter-platform:checked')).map(cb => cb.value);
    const selectedClients = Array.from(document.querySelectorAll('.filter-client:checked')).map(cb => cb.value);
    const selectedCouts = Array.from(document.querySelectorAll('.filter-cout:checked')).map(cb => cb.value);
    const selectedRegions = Array.from(document.querySelectorAll('.filter-region:checked')).map(cb => cb.value);
    const searchText = document.querySelector('#search-input')?.value.trim().toLowerCase() || '';
    const sortBy = Array.from(document.querySelectorAll('.filter-sort')).find(rb => rb.checked)?.value || 'alpha';
    
    // Calculer le nombre total de groupes de filtres actifs
    const totalActiveFilters = 
      (selectedPlatforms.length > 0 ? 1 : 0) +
      (selectedClients.length > 0 ? 1 : 0) +
      (selectedCouts.length > 0 ? 1 : 0) +
      (selectedRegions.length > 0 ? 1 : 0);
    
    // Calculer le nombre total de modalités sélectionnées
    const totalSelectedModalites = selectedPlatforms.length + selectedClients.length + selectedCouts.length + selectedRegions.length;
    
    // Calculer le score de correspondance pour chaque item
    const scoredItems = allData.map(item => {
      let matchScore = 0;
      let matches = true;
      
      // Vérifier la correspondance avec le filtre de texte (obligatoire)
      const matchesSearch = searchFilter(searchText)(item);
      if (!matchesSearch) {
        matches = false;
      }
      
      // Calculer les correspondances pour chaque modalité de plateforme
      if (selectedPlatforms.length > 0) {
        if (selectedPlatforms.includes(item.listeListeTypeplateforme)) {
          matchScore++;
        } else {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour chaque modalité de client
      if (selectedClients.length > 0) {
        const itemClients = (item.checkboxListeTypeclientid_typeclient || '').split(',').map(s => s.trim());
        // Compter chaque modalité de client qui correspond
        const matchingClientsCount = itemClients.filter(client => selectedClients.includes(client)).length;
        matchScore += matchingClientsCount;
        
        // Si aucune modalité de client ne correspond, l'item ne correspond pas
        if (matchingClientsCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour chaque modalité de coût
      if (selectedCouts.length > 0) {
        const itemCosts = (item.checkboxListeCoutplateformeid_coutplateforme || '').split(',').map(s => s.trim());
        // Compter chaque modalité de coût qui correspond
        const matchingCostsCount = itemCosts.filter(cost => selectedCouts.includes(cost)).length;
        matchScore += matchingCostsCount;
        
        // Si aucune modalité de coût ne correspond, l'item ne correspond pas
        if (matchingCostsCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour chaque modalité de région
      if (selectedRegions.length > 0) {
        let matchesRegion = false;
        let matchingRegionsCount = 0;
        
        if (item.listeListeOuinonid_echellelocalisation === "1") {
          // Échelle nationale - correspond à toutes les régions sélectionnées
          matchesRegion = true;
          matchingRegionsCount = selectedRegions.length; // Toutes les régions correspondent
        } else if (item.listeListeOuinonid_echellelocalisation === "2") {
          // Restriction géographique
          const itemRegions = (item.checkboxListeRegionsid_listeregions || '').split(',').map(s => s.trim());
          // Compter chaque modalité de région qui correspond
          matchingRegionsCount = itemRegions.filter(region => selectedRegions.includes(region)).length;
          matchesRegion = matchingRegionsCount > 0;
        }
        
        matchScore += matchingRegionsCount;
        if (!matchesRegion) {
          matches = false;
        }
      }
      
      return {
        data: item,
        matchScore: matchScore,
        totalModalites: totalSelectedModalites,
        matches: matches && matchesSearch, // L'élément correspond uniquement si le texte correspond aussi
        matchPercentage: totalSelectedModalites > 0 ? (matchScore / totalSelectedModalites) * 100 : 100
      };
    });
    
    // Séparer les éléments correspondants et non correspondants
    const matchingItems = scoredItems.filter(item => item.matches);
    const nonMatchingItems = scoredItems.filter(item => !item.matches);
    
    // Trier les éléments
    let sortedItems;
    
    if (sortBy === 'relevance' && totalActiveFilters > 0) {
      // Trier par score de correspondance (décroissant) puis par titre
      sortedItems = [...matchingItems].sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore; // Trier par score de correspondance décroissant
        }
        return a.data.bf_titre.localeCompare(b.data.bf_titre); // Puis par ordre alphabétique
      });
    } else {
      // Utiliser le tri standard
      const sortedMatching = sortItems(matchingItems.map(item => item.data), sortBy).map(item => {
        return scoredItems.find(scored => scored.data === item);
      });
      sortedItems = sortedMatching;
    }
    
    // Ajouter les éléments non correspondants à la fin, triés alphabétiquement
    const sortedNonMatching = nonMatchingItems.sort((a, b) => 
      a.data.bf_titre.localeCompare(b.data.bf_titre)
    );
    
    // Combiner les résultats
    const allSortedItems = [...sortedItems, ...sortedNonMatching];
    
    return {
      filteredData: allSortedItems,
      totalActiveFilters: totalActiveFilters
    };
  }

  // Fonction de mise à jour de l'affichage des fiches
  function updateDisplay() {
    const container = document.getElementById("fiches-container");
    if (!container) {
      console.error("L'élément 'fiches-container' n'existe pas.");
      return;
    }
    
    container.innerHTML = '';
    
    // Afficher l'indicateur de chargement
    container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Chargement des résultats...</p></div>';
    
    // Utiliser setTimeout pour permettre au DOM de se rafraîchir et montrer le loader
    setTimeout(() => {
      // Récupérer les items filtrés et triés avec leurs scores
      const result = getFilteredItems();
      const filteredItems = result.filteredData;
      const totalActiveFilters = result.totalActiveFilters;
      
      // Afficher le nombre de résultats correspondants
      const matchingCount = filteredItems.filter(item => item.matches).length;
      updateResultsCount(matchingCount, filteredItems.length);
      
      // Vider le conteneur
      container.innerHTML = '';
      
      if (filteredItems.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h3>Aucun résultat disponible</h3>
            <p>Essayez de modifier votre recherche.</p>
          </div>
        `;
        return;
      }
      
      // Afficher toutes les fiches, correspondantes et non correspondantes
      filteredItems.forEach(item => renderCard(item));
    }, 100); // Délai court pour permettre l'affichage du loader
  }
  
  // Mise à jour du compteur de résultats
  function updateResultsCount(matchingCount, totalCount) {
    const resultsStats = document.getElementById("results-stats");
    if (!resultsStats) {
      console.error("L'élément 'results-stats' n'existe pas.");
      return;
    }
    
    if (matchingCount < totalCount) {
      resultsStats.innerHTML = `<div>${matchingCount} outil${matchingCount > 1 ? 's' : ''} correspondant${matchingCount > 1 ? 's' : ''} sur ${totalCount} au total</div>`;
    } else {
      resultsStats.innerHTML = `<div>${totalCount} outil${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}</div>`;
    }
  }

  // Fonctions utilitaires
  function getYearFromNumber(number) {
    const baseYear = 2005;
    return number && !isNaN(number) ? baseYear + (parseInt(number) - 1) : "Non renseigné";
  }
  
  function getPlatformType(type) {
    const types = {
      "1": "Générateur de Boutique",
      "2": "Place de Marché",
      "3": "Outil de gestion"
    };
    return types[type] || "Type inconnu";
  }
  
  function getClientTypes(clientTypes) {
    if (!clientTypes) return "Non renseigné";
    
    const types = {
      "1": "Consommateurs particuliers",
      "2": "Restauration collective",
      "3": "Restauration commerciale",
      "4": "GMS",
      "5": "Commerces de proximité",
      "6": "Grossistes",
      "7": "Transformateurs",
      "8": "Producteurs"
    };
    
    return clientTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  function getCostType(costType) {
    const types = {
      "1": "Totalement gratuit",
      "2": "Commission prélevée au producteur",
      "3": "Abonnement / droit d'entrée pour le producteur",
      "4": "Commission prélevée au consommateur",
      "5": "Abonnement / droit d'entrée pour le consommateur"
    };
    return types[costType] || "Non renseigné";
  }
  
  function getFirstSentence(text) {
    if (!text) return '';
    const match = text.match(/^(.*?)(?:\.\s|$)/);
    return match ? match[1] + '.' : text;
  }
  
  // Fonction pour mettre en surbrillance les termes recherchés
  function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);
    
    if (index === -1) return text;
    
    return text.substring(0, index) + 
           `<span class="highlight-match">${text.substring(index, index + searchTerm.length)}</span>` + 
           text.substring(index + searchTerm.length);
  }

  function renderCard(item) {
    const searchTerm = document.querySelector('#search-input')?.value.trim() || '';
    
    // Préparer les données de la carte
    const title = item.data.bf_titre || 'Sans titre';
    const description = item.data.bf_descriptiongenerale ? getFirstSentence(item.data.bf_descriptiongenerale) : 'Description non disponible';
    const platformType = getPlatformType(item.data.listeListeTypeplateforme);
    const anneeCreation = getYearFromNumber(item.data.listeListeAnneeDeMiseEnLigne);
    const typeClients = getClientTypes(item.data.checkboxListeTypeclientid_typeclient);
    const ficheUrl = `https://www.oad-venteenligne.org/?${item.data.id_fiche}`;
    const imageUrl = item.data.imagebf_image 
                    ? `https://www.oad-venteenligne.org/cache/vignette_${item.data.imagebf_image}` 
                    : 'https://via.placeholder.com/100?text=Logo';
    
    // Mettre en surbrillance les termes recherchés
    const highlightedTitle = highlightText(title, searchTerm);
    const highlightedDescription = highlightText(description, searchTerm);

    // Définir le style directement si non correspondant
    const isMatched = item.matches;
    const unmatchedStyle = !isMatched ? 
      'filter: grayscale(100%);' : '';
    const unmatchedBadge = !isMatched ? 
      `<div style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: white; 
      font-size: 10px; padding: 2px 8px; border-radius: 0 8px 0 8px; z-index: 10;">
      Ne correspond pas aux filtres</div>` : '';
    
    // Créer la carte avec structure verticale
    const card = document.createElement("div");
    card.className = "tool-card";
    card.setAttribute("tabindex", "0"); // Pour améliorer l'accessibilité
    
    // Appliquer le style directement
    card.style = unmatchedStyle;
    
    card.innerHTML = `
      ${unmatchedBadge}
      <div class="card-left" style="${!isMatched ? 'filter: grayscale(100%);' : ''}">
        <img src="${imageUrl}" alt="${title}" class="tool-logo" loading="lazy">
        <div class="tool-category" style="${!isMatched ? 'background-color: #aaa; color: white;' : ''}">${platformType}</div>
        ${item.totalModalites > 0 
          ? `<div class="match-info">${item.matchScore} critère${item.matchScore > 1 ? 's' : ''} sur ${item.totalModalites}</div>`
          : ''
        }
      </div>
      <div class="card-right">
        <h2 class="tool-title" style="${!isMatched ? 'color: #777;' : ''}">${highlightedTitle}</h2>
        <p class="tool-description" style="${!isMatched ? 'color: #888;' : ''}">${highlightedDescription}</p>
        <div class="highlight-box" style="${!isMatched ? 'background: #eee; border-left-color: #aaa;' : ''}">
          <p><strong>Année de création :</strong> ${anneeCreation}</p>
          <p><strong>Type d'acheteurs :</strong> ${typeClients}</p>
          ${item.data.bf_urloutil 
            ? `<p><strong>Site web :</strong> <a href="${item.data.bf_urloutil}" target="_blank" rel="noopener">${item.data.bf_urloutil}</a></p>` 
            : ''
          }
        </div>
        <button class="cta-button" style="${!isMatched ? 'background-color: #aaa;' : ''}" 
          onclick="window.open('${ficheUrl}', '_blank')" aria-label="En savoir plus sur ${title}">
          En savoir plus
        </button>
      </div>
    `;
    
    const container = document.getElementById("fiches-container");
    if (container) {
      container.appendChild(card);
    }
  }

  // Chargement des données depuis l'API avec mise en cache
  function loadData() {
    // Vérifier si des données en cache existent
    const cachedData = localStorage.getItem('toolsDataCache');
    const cacheTimestamp = parseInt(localStorage.getItem('toolsDataTimestamp') || '0');
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // Afficher l'indicateur de chargement
    const container = document.getElementById("fiches-container");
    if (!container) {
      console.error("L'élément 'fiches-container' n'existe pas.");
      return;
    }
    
    container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Chargement des données...</p></div>';
    
    // Si le cache est valide (moins d'un jour)
    if (cachedData && (now - cacheTimestamp) < oneDayInMs) {
      try {
        allData = JSON.parse(cachedData);
        updateDisplay();
        return;
      } catch (e) {
        console.error("Erreur lors de la lecture du cache:", e);
        // Si erreur, continuer et charger depuis l'API
      }
    }
    
    // Charger depuis l'API
    fetch("https://www.oad-venteenligne.org/?api/forms/7/entries")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur réseau: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        allData = Object.values(data);
        
        // Mettre en cache
        try {
          localStorage.setItem('toolsDataCache', JSON.stringify(allData));
          localStorage.setItem('toolsDataTimestamp', now.toString());
        } catch (e) {
          console.warn("Impossible de mettre en cache les données:", e);
        }
        
        updateDisplay();
      })
      .catch(error => {
        console.error("Erreur lors du chargement des données:", error);
        
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h3>Erreur de connexion</h3>
            <p>Impossible de charger les données. Veuillez vérifier votre connexion et réessayer.</p>
            <button onclick="loadData()" class="cta-button" style="margin: 20px auto;">Réessayer</button>
          </div>
        `;
      });
  }

  // Écoute des changements sur les filtres
  document.querySelectorAll('.filter-platform, .filter-client, .filter-cout, .filter-region, .filter-sort').forEach(cb => {
    cb.addEventListener('change', updateDisplay);
  });
  
  // Écoute des changements dans la barre de recherche (avec debounce)
  const searchInput = document.querySelector('#search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(updateDisplay, 300); // Attendre 300ms après la fin de la saisie
    });
  }
  
  // Exposer loadData au contexte global pour le bouton de réessai
  window.loadData = loadData;
  
  // Charger les données au démarrage
  loadData();
});
