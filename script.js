document.addEventListener("DOMContentLoaded", function() {
  let allData = [];
  let selectedDepartments = [];
  let isDarkMode = false;
  
  // Définir globalement le mapping des régions pour qu'il soit accessible à toutes les fonctions
  const regionMappings = {
    "84": { code: "ARA", name: "Auvergne-Rhône-Alpes" },
    "27": { code: "BFC", name: "Bourgogne-Franche-Comté" },
    "53": { code: "BRE", name: "Bretagne" },
    "24": { code: "CVL", name: "Centre-Val de Loire" },
    "94": { code: "COR", name: "Corse" },
    "44": { code: "GES", name: "Grand Est" },
    "32": { code: "HDF", name: "Hauts-de-France" },
    "11": { code: "IDF", name: "Île-de-France" },
    "28": { code: "NOR", name: "Normandie" },
    "75": { code: "NAQ", name: "Nouvelle-Aquitaine" },
    "76": { code: "OCC", name: "Occitanie" },
    "52": { code: "PDL", name: "Pays de la Loire" },
    "93": { code: "PAC", name: "Provence-Alpes-Côte d'Azur" }
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
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
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
  exportButton.addEventListener('click', exportResults);

  // Initialiser les événements de la carte
  initRegionMap();
  
  function initRegionMap() {
    // Vérifier si Leaflet est disponible
    if (typeof L === 'undefined') {
      console.error('La bibliothèque Leaflet n\'est pas chargée.');
      return;
    }
    
    // Vérifier si le conteneur de carte existe
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.error('Le conteneur de carte n\'existe pas.');
      return;
    }
    
    // Créer la carte Leaflet centrée sur la France
    const map = L.map('map-container').setView([46.603354, 1.888334], 5);
    
    // Ajouter une couche de tuiles OpenStreetMap (fond de carte)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Définir le style par défaut des régions
    function defaultStyle() {
      return {
        fillColor: '#E8F5E9',
        weight: 1.5,
        opacity: 1,
        color: '#4caf50',
        fillOpacity: 0.7
      };
    }
    
    // Définir le style des régions sélectionnées
    function selectedStyle() {
      return {
        fillColor: '#4CAF50',
        weight: 2,
        opacity: 1,
        color: '#2E7D32',
        fillOpacity: 0.8
      };
    }
    
    // Variable pour stocker la couche GeoJSON et les entités régionales
    let geojsonLayer;
    let regionFeatures = {};
    
    // Charger le fichier GeoJSON
    fetch('https://france-geojson.gregoiredavid.fr/repo/regions.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error('Impossible de charger le fichier GeoJSON');
        }
        return response.json();
      })
      .then(data => {
        // Ajouter la couche GeoJSON à la carte
        geojsonLayer = L.geoJSON(data, {
          style: defaultStyle,
          onEachFeature: function(feature, layer) {
            // Récupérer le code de la région (format INSEE)
            const inseeCode = feature.properties.code;
            const mapping = regionMappings[inseeCode];
            
            if (mapping) {
              // Stocker la référence à cette couche
              regionFeatures[mapping.code] = layer;
              
              // Ajouter une popup avec le nom de la région
              layer.bindPopup(mapping.name);
              
              // Gestion des événements
              layer.on({
                mouseover: function(e) {
                  if (!selectedDepartments.includes(mapping.code)) {
                    layer.setStyle({
                      fillColor: '#C8E6C9',
                      weight: 2
                    });
                  }
                },
                mouseout: function(e) {
                  if (!selectedDepartments.includes(mapping.code)) {
                    layer.setStyle(defaultStyle());
                  }
                },
                click: function(e) {
                  if (selectedDepartments.includes(mapping.code)) {
                    // Désélectionner
                    selectedDepartments = selectedDepartments.filter(d => d !== mapping.code);
                    layer.setStyle(defaultStyle());
                  } else {
                    // Sélectionner
                    selectedDepartments.push(mapping.code);
                    layer.setStyle(selectedStyle());
                  }
                  updateSelectedDepartmentsList();
                  updateDisplay();
                }
              });
              
              // Appliquer le style sélectionné si déjà sélectionné
              if (selectedDepartments.includes(mapping.code)) {
                layer.setStyle(selectedStyle());
              }
            }
          }
        }).addTo(map);
        
        // Ajuster le zoom pour voir toutes les régions
        map.fitBounds(geojsonLayer.getBounds());
      })
      .catch(error => {
        console.error('Erreur:', error);
        document.querySelector('.department-map').innerHTML = `
          <div style="text-align: center; padding: 20px; color: #f44336;">
            Impossible de charger la carte. Veuillez réessayer ultérieurement.
          </div>
        `;
      });
      
    // Mettre à jour la liste des régions sélectionnées
    updateSelectedDepartmentsList();
  }

  // Fonction pour afficher les régions sélectionnées
  function updateSelectedDepartmentsList() {
    const list = document.getElementById('selected-dept-list');
    
    if (!list) {
      console.error("L'élément 'selected-dept-list' n'existe pas.");
      return;
    }
    
    if (selectedDepartments.length === 0) {
      list.textContent = 'Aucune';
    } else {
      // Construire un tableau des noms des régions correspondant aux codes
      const regionNames = selectedDepartments.map(code => {
        // Chercher le nom correspondant au code
        const region = Object.values(regionMappings).find(r => r.code === code);
        return region ? region.name : code;
      }).sort();
      
      list.textContent = regionNames.join(', ');
    }
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
    }
    return items;
  }
  
  // Fonction d'exportation des résultats
  function exportResults() {
    // Récupérer les items filtrés
    const filteredItems = getFilteredItems();
    
    if (filteredItems.length === 0) {
      alert('Aucun résultat à exporter.');
      return;
    }
    
    // Préparer les données pour l'export
    const csvData = filteredItems.map(item => {
      return {
        'Nom': item.bf_titre || '',
        'Type': getPlatformType(item.listeListeTypeplateforme) || '',
        'Description': (item.bf_descriptiongenerale || '').replace(/"/g, '""'), // Échapper les guillemets
        'Année': getYearFromNumber(item.listeListeAnneeDeMiseEnLigne) || '',
        'URL': item.bf_urloutil || '',
        'Type de clients': getClientTypes(item.checkboxListeTypeclientid_typeclient) || '',
        'Coût': getCostType(item.checkboxListeCoutplateformeid_coutplateforme) || ''
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
  
  // Fonction pour obtenir les items filtrés actuels
  function getFilteredItems() {
    // Récupération des critères sélectionnés pour chaque filtre
    const selectedPlatforms = Array.from(document.querySelectorAll('.filter-platform:checked')).map(cb => cb.value);
    const selectedClients = Array.from(document.querySelectorAll('.filter-client:checked')).map(cb => cb.value);
    const selectedCouts = Array.from(document.querySelectorAll('.filter-cout:checked')).map(cb => cb.value);
    const searchText = document.querySelector('#search-input')?.value.trim().toLowerCase() || '';
    const sortBy = Array.from(document.querySelectorAll('.filter-sort')).find(rb => rb.checked)?.value || 'alpha';
    
    // Appliquer tous les filtres
    let filteredItems = allData.filter(item => {
      // Filtre par type de plateforme
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(item.listeListeTypeplateforme);
      
      // Filtre par type de client
      const itemClients = (item.checkboxListeTypeclientid_typeclient || '').split(',').map(s => s.trim());
      const matchesClient = selectedClients.length === 0 || 
                          itemClients.some(client => selectedClients.includes(client));
      
      // Filtre par coût
      const matchesCout = selectedCouts.length === 0 || 
                        selectedCouts.includes(item.checkboxListeCoutplateformeid_coutplateforme);
      
      // Filtre par région (en utilisant les codes de région corrects)
      const matchesDepartment = selectedDepartments.length === 0 || 
                              (item.bf_region && selectedDepartments.includes(item.bf_region));
      
      // Filtre par texte de recherche
      const matchesSearch = searchFilter(searchText)(item);
      
      // Combiner tous les filtres (ET logique)
      return matchesPlatform && matchesClient && matchesCout && matchesDepartment && matchesSearch;
    });
    
    // Trier les résultats
    return sortItems(filteredItems, sortBy);
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
      // Récupérer les items filtrés et triés
      const filteredItems = getFilteredItems();
      
      // Afficher le nombre de résultats
      updateResultsCount(filteredItems.length);
      
      // Vider le conteneur
      container.innerHTML = '';
      
      if (filteredItems.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h3>Aucun résultat ne correspond à vos critères</h3>
            <p>Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        `;
        return;
      }
      
      // Calcul du nombre total de groupes de filtres actifs
      const totalActiveFilters = 
        (Array.from(document.querySelectorAll('.filter-platform:checked')).length > 0 ? 1 : 0) +
        (Array.from(document.querySelectorAll('.filter-client:checked')).length > 0 ? 1 : 0) +
        (Array.from(document.querySelectorAll('.filter-cout:checked')).length > 0 ? 1 : 0) +
        (selectedDepartments.length > 0 ? 1 : 0);
      
      // Afficher les fiches filtrées
      filteredItems.forEach(item => renderCard(item, true, totalActiveFilters));
    }, 100); // Délai court pour permettre l'affichage du loader
  }
  
  // Mise à jour du compteur de résultats
  function updateResultsCount(count) {
    const resultsStats = document.getElementById("results-stats");
    if (!resultsStats) {
      console.error("L'élément 'results-stats' n'existe pas.");
      return;
    }
    
    resultsStats.innerHTML = `<div>${count} outil${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}</div>`;
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

  function renderCard(item, isMatched, totalActiveFilters) {
    const searchTerm = document.querySelector('#search-input')?.value.trim() || '';
    
    // Préparer les données de la carte
    const title = item.bf_titre || 'Sans titre';
    const description = item.bf_descriptiongenerale ? getFirstSentence(item.bf_descriptiongenerale) : 'Description non disponible';
    const platformType = getPlatformType(item.listeListeTypeplateforme);
    const anneeCreation = getYearFromNumber(item.listeListeAnneeDeMiseEnLigne);
    const typeClients = getClientTypes(item.checkboxListeTypeclientid_typeclient);
    const ficheUrl = `https://www.oad-venteenligne.org/?${item.id_fiche}`;
    const imageUrl = item.imagebf_image 
                    ? `https://www.oad-venteenligne.org/cache/vignette_${item.imagebf_image}` 
                    : 'https://via.placeholder.com/100?text=Logo';
    
    // Mettre en surbrillance les termes recherchés
    const highlightedTitle = highlightText(title, searchTerm);
    const highlightedDescription = highlightText(description, searchTerm);
    
    // Calculer les filtres correspondants
    let matchedCount = 0;
    const selectedPlatforms = Array.from(document.querySelectorAll('.filter-platform:checked')).map(cb => cb.value);
    const selectedClients = Array.from(document.querySelectorAll('.filter-client:checked')).map(cb => cb.value);
    const selectedCouts = Array.from(document.querySelectorAll('.filter-cout:checked')).map(cb => cb.value);
    
    if (selectedPlatforms.length > 0 && selectedPlatforms.includes(item.listeListeTypeplateforme)) {
      matchedCount++;
    }
    
    if (selectedClients.length > 0) {
      const itemClients = (item.checkboxListeTypeclientid_typeclient || '').split(',').map(s => s.trim());
      if (itemClients.some(client => selectedClients.includes(client))) {
        matchedCount++;
      }
    }
    
    if (selectedCouts.length > 0 && selectedCouts.includes(item.checkboxListeCoutplateformeid_coutplateforme)) {
      matchedCount++;
    }
    
    if (selectedDepartments.length > 0 && item.bf_region && selectedDepartments.includes(item.bf_region)) {
      matchedCount++;
    }
    
    // Créer la carte avec structure verticale
    const card = document.createElement("div");
    card.className = isMatched ? "tool-card" : "tool-card unmatched";
    card.setAttribute("tabindex", "0"); // Pour améliorer l'accessibilité
    
    card.innerHTML = `
      <div class="card-left">
        <img src="${imageUrl}" alt="${title}" class="tool-logo" loading="lazy">
        <div class="tool-category">${platformType}</div>
        ${totalActiveFilters > 0 
          ? `<div class="match-info">${matchedCount} filtres sur ${totalActiveFilters}</div>`
          : ''
        }
      </div>
      <div class="card-right">
        <h2 class="tool-title">${highlightedTitle}</h2>
        <p class="tool-description">${highlightedDescription}</p>
        <div class="highlight-box">
          <p><strong>Année de création :</strong> ${anneeCreation}</p>
          <p><strong>Type d'acheteurs :</strong> ${typeClients}</p>
          ${item.bf_urloutil 
            ? `<p><strong>Site web :</strong> <a href="${item.bf_urloutil}" target="_blank" rel="noopener">${item.bf_urloutil}</a></p>` 
            : ''
          }
        </div>
        <button class="cta-button" onclick="window.open('${ficheUrl}', '_blank')" aria-label="En savoir plus sur ${title}">
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
  document.querySelectorAll('.filter-platform, .filter-client, .filter-cout, .filter-sort').forEach(cb => {
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
