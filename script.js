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
      return [...items].sort((a, b) => {
        if (!a.bf_titre) return 1;
        if (!b.bf_titre) return -1;
        return a.bf_titre.localeCompare(b.bf_titre);
      });
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
  
  // Mappings des nouveaux filtres avec valeurs Oui/Non
  const ouiNonFiltres = {
    // Compatibilité avec d'autres outils
    "synchronisation": "listeListeOuinonid_synchronisation",
    "systemecaisse": "listeListeOuinonid_systemecaisse",
    "terminal": "listeListeOuinonid_terminal",
    "logiciel": "listeListeOuinonid_logiciel",
    
    // Fonctionnalités en cas de vente à plusieurs
    "plusieurscomptes": "listeListeOuinonid_plusieurscomptes",
    "synchroboutique": "listeListeOuinonid_synchroboutique",
    "commissionpersonalisee": "listeListeOuinonid_commissionpersonalisee",
    "repartitionpaiements": "listeListeOuinonid_repartitionpaiements",
    "datelimite": "listeListeOuinonid_datelimite",
    
    // Fonctionnalités Logistiques
    "cliccollect": "listeListeOuinonid_cliccollect",
    "zonelivraison": "listeListeOuinonid_zonelivraison",
    "solutionlogistique": "listeListeOuinonid_solutionlogistique",
    "colivraison": "listeListeOuinonid_colivraison",
    "partenairesemballage": "listeListeOuinonid_partenairesemballage",
    
    // Fonctionnalités de Gestion Commerciale
    "facturation": "listeListeOuinonid_facturation",
    "bonslivraison": "listeListeOuinonid_bonslivraison",
    "contractualisation": "listeListeOuinonid_contractualisation",
    "reduc": "listeListeOuinonid_reduc",
    "bdd": "listeListeOuinonid_bdd",
    "notation": "listeListeOuinonid_notation",
    
    // Fonctionnalités de Communication
    "pagepersonnalise": "listeListeOuinonid_pagepersonnalise",
    "url": "listeListeOuinonid_url",
    "seo": "listeListeOuinonid_seo",
    "socialnetworks": "listeListeOuinonid_socialnetworks",
    "emailing": "listeListeOuinonid_emailing",
    "messagerie": "listeListeOuinonid_messagerie",
    "com": "listeListeOuinonid_com",
    "carte": "listeListeOuinonid_carte"
  };

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
        'Coût': getCostType(item.data.checkboxListeCoutplateformeid_coutplateforme) || '',
        'Support': getSupportTypes(item.data.checkboxListe021Typesupportplateformeid_typesupportplateforme) || '',
        'Produits': getProductTypes(item.data.checkboxListeProduitcommercialiseid_produitscommercialises) || '',
        'Modalité vente': getModaliteVente(item.data.checkboxListeModaliteventeid_modalitevente) || '',
        'Système commande': getSystemeCommande(item.data.checkboxListeSystemecommandeid_systemecommande) || '',
        'Paiement': getOptionPaiement(item.data.checkboxListeOptionpaiementid_optionpaiement) || ''
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
    
    // Nouveaux filtres
    const selectedProduits = Array.from(document.querySelectorAll('.filter-produit:checked')).map(cb => cb.value);
    const selectedSupports = Array.from(document.querySelectorAll('.filter-support:checked')).map(cb => cb.value);
    const selectedModalites = Array.from(document.querySelectorAll('.filter-modalite:checked')).map(cb => cb.value);
    const selectedSystemes = Array.from(document.querySelectorAll('.filter-systeme:checked')).map(cb => cb.value);
    const selectedPaiements = Array.from(document.querySelectorAll('.filter-paiement:checked')).map(cb => cb.value);
    
    // Filtres avec valeurs Oui/Non
    const selectedCompatibilites = Array.from(document.querySelectorAll('.filter-compatibilite:checked')).map(cb => cb.value);
    const selectedVentePlusieurs = Array.from(document.querySelectorAll('.filter-vente-plusieurs:checked')).map(cb => cb.value);
    const selectedLogistique = Array.from(document.querySelectorAll('.filter-logistique:checked')).map(cb => cb.value);
    const selectedGestion = Array.from(document.querySelectorAll('.filter-gestion:checked')).map(cb => cb.value);
    const selectedCommunication = Array.from(document.querySelectorAll('.filter-communication:checked')).map(cb => cb.value);
    
    const searchText = document.querySelector('#search-input')?.value.trim().toLowerCase() || '';
    const sortBy = Array.from(document.querySelectorAll('.filter-sort')).find(rb => rb.checked)?.value || 'alpha';
    
    // Calculer le nombre total de groupes de filtres actifs
    const totalActiveFilters = 
      (selectedPlatforms.length > 0 ? 1 : 0) +
      (selectedClients.length > 0 ? 1 : 0) +
      (selectedCouts.length > 0 ? 1 : 0) +
      (selectedRegions.length > 0 ? 1 : 0) +
      (selectedProduits.length > 0 ? 1 : 0) +
      (selectedSupports.length > 0 ? 1 : 0) +
      (selectedModalites.length > 0 ? 1 : 0) +
      (selectedSystemes.length > 0 ? 1 : 0) +
      (selectedPaiements.length > 0 ? 1 : 0) +
      (selectedCompatibilites.length > 0 ? 1 : 0) +
      (selectedVentePlusieurs.length > 0 ? 1 : 0) +
      (selectedLogistique.length > 0 ? 1 : 0) +
      (selectedGestion.length > 0 ? 1 : 0) +
      (selectedCommunication.length > 0 ? 1 : 0);
    
    // Calculer le nombre total de modalités sélectionnées
    const totalSelectedModalites = 
      selectedPlatforms.length + 
      selectedClients.length + 
      selectedCouts.length + 
      selectedRegions.length +
      selectedProduits.length +
      selectedSupports.length +
      selectedModalites.length +
      selectedSystemes.length +
      selectedPaiements.length +
      selectedCompatibilites.length +
      selectedVentePlusieurs.length +
      selectedLogistique.length +
      selectedGestion.length +
      selectedCommunication.length;
    
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
      
      // Nouveaux filtres
      
      // Calculer les correspondances pour les produits commercialisés
      if (selectedProduits.length > 0) {
        const itemProduits = (item.checkboxListeProduitcommercialiseid_produitscommercialises || '').split(',').map(s => s.trim());
        const matchingProduitsCount = itemProduits.filter(produit => selectedProduits.includes(produit)).length;
        matchScore += matchingProduitsCount;
        
        if (matchingProduitsCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour les types de support
      if (selectedSupports.length > 0) {
        const itemSupports = (item.checkboxListe021Typesupportplateformeid_typesupportplateforme || '').split(',').map(s => s.trim());
        const matchingSupportsCount = itemSupports.filter(support => selectedSupports.includes(support)).length;
        matchScore += matchingSupportsCount;
        
        if (matchingSupportsCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour les modalités de vente
      if (selectedModalites.length > 0) {
        const itemModalites = (item.checkboxListeModaliteventeid_modalitevente || '').split(',').map(s => s.trim());
        const matchingModalitesCount = itemModalites.filter(modalite => selectedModalites.includes(modalite)).length;
        matchScore += matchingModalitesCount;
        
        if (matchingModalitesCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour les systèmes de commande
      if (selectedSystemes.length > 0) {
        const itemSystemes = (item.checkboxListeSystemecommandeid_systemecommande || '').split(',').map(s => s.trim());
        const matchingSystemesCount = itemSystemes.filter(systeme => selectedSystemes.includes(systeme)).length;
        matchScore += matchingSystemesCount;
        
        if (matchingSystemesCount === 0) {
          matches = false;
        }
      }
      
      // Calculer les correspondances pour les options de paiement
      if (selectedPaiements.length > 0) {
        const itemPaiements = (item.checkboxListeOptionpaiementid_optionpaiement || '').split(',').map(s => s.trim());
        const matchingPaiementsCount = itemPaiements.filter(paiement => selectedPaiements.includes(paiement)).length;
        matchScore += matchingPaiementsCount;
        
        if (matchingPaiementsCount === 0) {
          matches = false;
        }
      }
      
      // Pour les filtres Oui/Non, vérifier si l'item correspond à chaque critère sélectionné
      
      // Compatibilité avec d'autres outils
      if (selectedCompatibilites.length > 0) {
        let matchesCompatibilite = true;
        let matchingCompatibilitesCount = 0;
        
        for (const compatibilite of selectedCompatibilites) {
          const fieldName = ouiNonFiltres[compatibilite];
          if (item[fieldName] === "2") { // 2 = Oui
            matchingCompatibilitesCount++;
          } else {
            matchesCompatibilite = false;
          }
        }
        
        matchScore += matchingCompatibilitesCount;
        if (!matchesCompatibilite) {
          matches = false;
        }
      }
      
      // Fonctionnalités en cas de vente à plusieurs
      if (selectedVentePlusieurs.length > 0) {
        let matchesVentePlusieurs = true;
        let matchingVentePlusieurssCount = 0;
        
        for (const ventePlusieurs of selectedVentePlusieurs) {
          const fieldName = ouiNonFiltres[ventePlusieurs];
          if (item[fieldName] === "2") { // 2 = Oui
            matchingVentePlusieurssCount++;
          } else {
            matchesVentePlusieurs = false;
          }
        }
        
        matchScore += matchingVentePlusieurssCount;
        if (!matchesVentePlusieurs) {
          matches = false;
        }
      }
      
      // Fonctionnalités Logistiques
      if (selectedLogistique.length > 0) {
        let matchesLogistique = true;
        let matchingLogistiqueCount = 0;
        
        for (const logistique of selectedLogistique) {
          const fieldName = ouiNonFiltres[logistique];
          if (item[fieldName] === "2") { // 2 = Oui
            matchingLogistiqueCount++;
          } else {
            matchesLogistique = false;
          }
        }
        
        matchScore += matchingLogistiqueCount;
        if (!matchesLogistique) {
          matches = false;
        }
      }
      
      // Fonctionnalités de Gestion Commerciale
      if (selectedGestion.length > 0) {
        let matchesGestion = true;
        let matchingGestionCount = 0;
        
        for (const gestion of selectedGestion) {
          const fieldName = ouiNonFiltres[gestion];
          if (item[fieldName] === "2") { // 2 = Oui
            matchingGestionCount++;
          } else {
            matchesGestion = false;
          }
        }
        
        matchScore += matchingGestionCount;
        if (!matchesGestion) {
          matches = false;
        }
      }
      
      // Fonctionnalités de Communication
      if (selectedCommunication.length > 0) {
        let matchesCommunication = true;
        let matchingCommunicationCount = 0;
        
        for (const communication of selectedCommunication) {
          const fieldName = ouiNonFiltres[communication];
          if (item[fieldName] === "2") { // 2 = Oui
            matchingCommunicationCount++;
          } else {
            matchesCommunication = false;
          }
        }
        
        matchScore += matchingCommunicationCount;
        if (!matchesCommunication) {
          matches = false;
        }
      }
      
// Ne pas inclure les filtres où l'item n'a pas de correspondance
const activeFilterGroupCount = (
  (selectedPlatforms.length > 0 && matchesSearch ? 1 : 0) +
  (selectedClients.length > 0 && matchesSearch ? 1 : 0) +
  (selectedCouts.length > 0 && matchesSearch ? 1 : 0) +
  (selectedRegions.length > 0 && matchesSearch ? 1 : 0) +
  (selectedProduits.length > 0 && matchesSearch ? 1 : 0) +
  (selectedSupports.length > 0 && matchesSearch ? 1 : 0) +
  (selectedModalites.length > 0 && matchesSearch ? 1 : 0) +
  (selectedSystemes.length > 0 && matchesSearch ? 1 : 0) +
  (selectedPaiements.length > 0 && matchesSearch ? 1 : 0) +
  (selectedCompatibilites.length > 0 && matchesSearch ? 1 : 0) +
  (selectedVentePlusieurs.length > 0 && matchesSearch ? 1 : 0) +
  (selectedLogistique.length > 0 && matchesSearch ? 1 : 0) +
  (selectedGestion.length > 0 && matchesSearch ? 1 : 0) +
  (selectedCommunication.length > 0 && matchesSearch ? 1 : 0)
);

// Calculer le pourcentage seulement si des filtres sont actifs
const calculatedMatchPercentage = totalSelectedModalites > 0 ? 
  (matchScore / totalSelectedModalites) * 100 : 100;

return {
  data: item,
  matchScore: matchScore,
  totalModalites: totalSelectedModalites,
  matches: matches && matchesSearch, // L'élément correspond uniquement si le texte correspond aussi
  matchPercentage: calculatedMatchPercentage,
  activeFilterGroupCount: activeFilterGroupCount
};
    });
    
    // Séparer les éléments correspondants et non correspondants
    const matchingItems = scoredItems.filter(item => item.matches);
    const nonMatchingItems = scoredItems.filter(item => !item.matches);
    
// Trier les éléments
let sortedItems;

if (sortBy === 'relevance' && totalActiveFilters > 0) {
  // Trier par pourcentage de correspondance (décroissant) puis par titre
  sortedItems = [...matchingItems].sort((a, b) => {
    // Calculer les pourcentages pour comparer
    const percentA = a.matchScore / a.totalModalites * 100;
    const percentB = b.matchScore / b.totalModalites * 100;
    
    // Comparer d'abord par pourcentage
    if (percentB !== percentA) {
      return percentB - percentA;
    }
    
    // Si pourcentages égaux, trier par ordre alphabétique
    return a.data.bf_titre && b.data.bf_titre ? 
      a.data.bf_titre.localeCompare(b.data.bf_titre) : 
      !a.data.bf_titre ? 1 : -1;
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
  a.data.bf_titre && b.data.bf_titre ? 
    a.data.bf_titre.localeCompare(b.data.bf_titre) : 
    !a.data.bf_titre ? 1 : -1
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
      "3": "Outil de Gestion"
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
    if (!costType) return "Non renseigné";
    
    const types = {
      "1": "Totalement gratuit",
      "2": "Commission prélevée au producteur",
      "3": "Abonnement / droit d'entrée pour le producteur",
      "4": "Commission prélevée au consommateur",
      "5": "Abonnement / droit d'entrée pour le consommateur"
    };
    
    return costType.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  // Nouvelles fonctions pour les filtres ajoutés
  function getProductTypes(productTypes) {
    if (!productTypes) return "Non renseigné";
    
    const types = {
      "1": "Fruits et légumes",
      "2": "Produits d'épicerie",
      "3": "Produits carnés",
      "4": "Produits de la pêche",
      "5": "Produits laitiers",
      "6": "Produits non alimentaires"
    };
    
    return productTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  function getSupportTypes(supportTypes) {
    if (!supportTypes) return "Non renseigné";
    
    const types = {
      "1": "Site internet",
      "2": "Application mobile"
    };
    
    return supportTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  function getModaliteVente(modaliteTypes) {
    if (!modaliteTypes) return "Non renseigné";
    
    const types = {
      "1": "Vente permanente",
      "2": "Vente par sessions"
    };
    
    return modaliteTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  function getSystemeCommande(systemeTypes) {
    if (!systemeTypes) return "Non renseigné";
    
    const types = {
      "1": "Composition libre du panier",
      "2": "Paniers pré-composés avec abonnement",
      "3": "Paniers pré-composés sans abonnement"
    };
    
    return systemeTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  function getOptionPaiement(paiementTypes) {
    if (!paiementTypes) return "Non renseigné";
    
    const types = {
      "1": "Paiement en ligne, à la commande",
      "2": "Paiement à la livraison"
    };
    
    return paiementTypes.split(',')
      .map(id => types[id.trim()] || `Type ${id}`)
      .join(', ');
  }
  
  // Fonction pour obtenir les valeurs Oui/Non des fonctionnalités
  function getOuiNonValue(item, field) {
    if (!item || !item[field]) return "Non renseigné";
    return item[field] === "2" ? "Oui" : "Non";
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
  
  // Fonction pour obtenir les types de produits avec icônes
  function getProductTypesWithIcons(productTypes) {
    if (!productTypes) return "Aucun produit renseigné";
    
    const types = {
      "1": {
        icon: "🥕", // Fruits et légumes
        name: "Fruits et légumes"
      },
      "2": {
        icon: "🥫", // Produits d'épicerie
        name: "Produits d'épicerie"
      },
      "3": {
        icon: "🥩", // Produits carnés
        name: "Produits carnés"
      },
      "4": {
        icon: "🐟", // Produits de la pêche
        name: "Produits de la pêche"
      },
      "5": {
        icon: "🧀", // Produits laitiers
        name: "Produits laitiers"
      },
      "6": {
        icon: "🛍️", // Produits non alimentaires
        name: "Produits non alimentaires"
      }
    };
    
    // Récupérer les IDs des produits
    const productIds = productTypes.split(',').map(id => id.trim());
    
    // Générer le HTML avec icônes et tooltip
    let html = '<div class="product-icons">';
    
    // Pour chaque produit, ajouter l'icône avec tooltip
    productIds.forEach(id => {
      if (types[id]) {
        html += `<span class="product-icon" title="${types[id].name}">${types[id].icon}</span>`;
      }
    });
    
    html += '</div>';
    
    return html;
  }
  
  // Formater le texte avec des paragraphes
  function formatTextWithParagraphs(text) {
    if (!text) return '';
    return text.replace(/\r\n|\n/g, '<br>');
  }

  // Formater les nombres avec des séparateurs de milliers
  function formatNumber(num) {
    if (!num) return '0';
    return parseInt(num).toLocaleString('fr-FR');
  }
  
  // Fonction pour afficher une carte
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
    const unmatchedStyle = !isMatched ? 'filter: grayscale(100%);' : '';
    const unmatchedBadge = '';
    
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
        ? `<div class="match-info">${item.matchScore} critère${item.matchScore > 1 ? 's' : ''} sur ${item.totalModalites} (${Math.round(item.matchPercentage)}%)</div>`
        : ''
      }
      </div>
      <div class="card-right">
        <h2 class="tool-title" style="${!isMatched ? 'color: #777;' : ''}">${highlightedTitle}</h2>
        <p class="tool-description" style="${!isMatched ? 'color: #888;' : ''}">${highlightedDescription}</p>
        <div class="highlight-box" style="${!isMatched ? 'background: #eee; border-left-color: #aaa;' : ''}">
          <p><strong>Année de création :</strong> ${anneeCreation}</p>
          <p><strong>Type d'acheteurs :</strong> ${typeClients}</p>
          <p><strong>Support :</strong> ${getSupportTypes(item.data.checkboxListe021Typesupportplateformeid_typesupportplateforme)}</p>
          <p><strong>Produits :</strong> ${getProductTypes(item.data.checkboxListeProduitcommercialiseid_produitscommercialises)}</p>
          ${item.data.bf_urloutil 
            ? `<p><strong>Site web :</strong> <a href="${item.data.bf_urloutil}" target="_blank" rel="noopener">${item.data.bf_urloutil}</a></p>` 
            : ''
          }
        </div>
        <button class="cta-button view-details" style="${!isMatched ? 'background-color: #aaa;' : ''}" 
          aria-label="Voir les détails de ${title}">
          Voir les détails
        </button>
      </div>
    `;
    // Ajouter l'écouteur d'événement pour ouvrir le modal
    const viewDetailsBtn = card.querySelector('.view-details');
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openToolModal(item.data);
      });
    }
    
    // Ajouter un écouteur sur toute la carte pour ouvrir le modal
    card.addEventListener('click', function() {
      openToolModal(item.data);
    });
    
    const container = document.getElementById("fiches-container");
    if (container) {
      container.appendChild(card);
    }
  }
  
 // ===== FONCTIONS DU MODAL =====

// Fonction pour ouvrir le modal avec les détails d'un outil
function openToolModal(itemData) {
  const modal = document.getElementById('tool-modal');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal || !modalBody) {
    console.error("Éléments du modal non trouvés");
    return;
  }
  
  // Construire le contenu du modal
  let content = `
    <div class="modal-header">
      ${itemData.imagebf_image ? 
        `<img src="https://www.oad-venteenligne.org/cache/vignette_${itemData.imagebf_image}" alt="${itemData.bf_titre || 'Sans titre'}" class="modal-logo">` : 
        `<img src="https://via.placeholder.com/150?text=Logo" alt="Logo par défaut" class="modal-logo">`
      }
      <h1>${itemData.bf_titre || 'Sans titre'}</h1>
      <p>${getPlatformType(itemData.listeListeTypeplateforme)}</p>
    </div>
  `;
  
  // Informations générales
  content += `
    <div class="modal-section">
      <h2>Informations générales</h2>
      <div class="modal-field">
        <span class="modal-field-name">Description</span>
        <div class="modal-field-value">${formatTextWithParagraphs(itemData.bf_descriptiongenerale || 'Description non disponible')}</div>
      </div>
      ${itemData.bf_urloutil ? 
        `<div class="modal-field">
          <span class="modal-field-name">Site web</span>
          <div class="modal-field-value"><a href="${itemData.bf_urloutil}" target="_blank">${itemData.bf_urloutil}</a></div>
        </div>` : ''
      }
      <div class="modal-field">
        <span class="modal-field-name">Structure</span>
        <div class="modal-field-value">${itemData.bf_nomstructure || 'Non renseigné'}</div>
      </div>
      <div class="modal-field">
        <span class="modal-field-name">Année de mise en ligne</span>
        <div class="modal-field-value">${getYearFromNumber(itemData.listeListeAnneeDeMiseEnLigne)}</div>
      </div>
    </div>
  `;
  
  // Statistiques
  content += `
    <div class="modal-section">
      <h2>Chiffres clés</h2>
      <div class="features-grid">
        ${itemData.bf_nbretp ? 
          `<div class="feature-item">
            <div class="feature-title">Équipe</div>
            <div class="feature-description">${itemData.bf_nbretp}</div>
          </div>` : ''
        }
        ${itemData.bf_nbr_producteurs ? 
          `<div class="feature-item">
            <div class="feature-title">Nombre de producteurs</div>
            <div class="feature-description">${formatNumber(itemData.bf_nbr_producteurs)}</div>
          </div>` : ''
        }
        ${itemData.bf_nbrclientsactifs ? 
          `<div class="feature-item">
            <div class="feature-title">Clients actifs</div>
            <div class="feature-description">${formatNumber(itemData.bf_nbrclientsactifs)}</div>
          </div>` : ''
        }
        ${itemData.bf_nbrvolume ? 
          `<div class="feature-item">
            <div class="feature-title">Volume d'affaires</div>
            <div class="feature-description">${formatNumber(itemData.bf_nbrvolume)}€</div>
          </div>` : ''
        }
      </div>
    </div>
  `;
  
  // Échelle géo, produits, types de clients, coût de l'outil, support numérique
  content += `
    <div class="modal-section">
      <h2>Positionnement de l'Outil</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Type d'acheteurs</div>
          <div class="feature-description">${getClientTypes(itemData.checkboxListeTypeclientid_typeclient)}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Coût</div>
          <div class="feature-description">${getCostType(itemData.checkboxListeCoutplateformeid_coutplateforme)}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Produits commercialisés</div>
          <div class="feature-description">
            ${getProductTypesWithIcons(itemData.checkboxListeProduitcommercialiseid_produitscommercialises)}
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Type de support</div>
          <div class="feature-description">${getSupportTypes(itemData.checkboxListe021Typesupportplateformeid_typesupportplateforme)}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Modalité de vente</div>
          <div class="feature-description">${getModaliteVente(itemData.checkboxListeModaliteventeid_modalitevente)}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Système de commande</div>
          <div class="feature-description">${getSystemeCommande(itemData.checkboxListeSystemecommandeid_systemecommande)}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Option de paiement</div>
          <div class="feature-description">${getOptionPaiement(itemData.checkboxListeOptionpaiementid_optionpaiement)}</div>
        </div>
      </div>
    </div>
  `;
  
  // Compatibilité et autres fonctionnalités
  content += `
    <div class="modal-section">
      <h2>Compatibilité avec d'autres outils</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Synchronisation des stocks</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_synchronisation')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Système de Caisse</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_systemecaisse')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Terminal de Paiement</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_terminal')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Logiciels de comptabilité</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_logiciel')}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <h2>Fonctionnalités en cas de vente à plusieurs</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Accès du compte à plusieurs</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_plusieurscomptes')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Synchronisation entre boutiques</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_synchroboutique')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Commission personnalisée</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_commissionpersonalisee')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Répartition des paiements</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_repartitionpaiements')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Date limite adaptable</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_datelimite')}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <h2>Fonctionnalités Logistiques</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Options de Clic-&-Collect</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_cliccollect')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Zones de livraisons</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_zonelivraison')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Solutions logistiques</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_solutionlogistique')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Co-livraison</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_colivraison')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Emballage éco-responsable</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_partenairesemballage')}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <h2>Fonctionnalités de Gestion Commerciale</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Facturation</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_facturation')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Bons de Commande / Livraison</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_bonslivraison')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Contractualisation</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_contractualisation')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Réductions clients</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_reduc')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Extraction BDD</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_bdd')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Notation clients</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_notation')}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <h2>Fonctionnalités de Communication</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-title">Graphisme personnalisé</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_pagepersonnalise')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">URL personnalisée</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_url')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Support SEO</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_seo')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Intégration réseaux sociaux</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_socialnetworks')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Emailing</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_emailing')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Messagerie Instantanée</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_messagerie')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Supports de communication</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_com')}</div>
        </div>
        <div class="feature-item">
          <div class="feature-title">Carte des producteurs</div>
          <div class="feature-description">${getOuiNonValue(itemData, 'listeListeOuinonid_carte')}</div>
        </div>
      </div>
    </div>
  `;
  
  // Boutons d'action
  content += `
    <div class="modal-actions">
      <a href="${itemData.url || `https://www.oad-venteenligne.org/?${itemData.id_fiche}`}" target="_blank" class="modal-button">
        Voir la fiche détaillée
      </a>
      ${itemData.bf_urloutil ? 
        `<a href="${itemData.bf_urloutil}" target="_blank" class="modal-button">
          Visiter le site web
        </a>` : ''
      }
    </div>
  `;
  
  // Insérer le contenu dans le modal
  modalBody.innerHTML = content;
  
  // Afficher le modal
  modal.style.display = 'block';
  
  // Empêcher le défilement du contenu sous-jacent
  document.body.style.overflow = 'hidden';
  
  // Gérer la fermeture du modal
  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Supprimer les écouteurs d'événements pour éviter les fuites de mémoire
    document.removeEventListener('keydown', escapeHandler);
    window.removeEventListener('click', windowClickHandler);
  };
  
  // Gestionnaire d'événement pour la touche Escape
  const escapeHandler = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  
  // Gestionnaire d'événement pour les clics sur la fenêtre
  const windowClickHandler = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };
  
  // Ajouter les écouteurs d'événements
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }
  
  // Ajouter les écouteurs pour les clics à l'extérieur et la touche Escape
  document.addEventListener('keydown', escapeHandler);
  window.addEventListener('click', windowClickHandler);
}

// Écoute des changements sur les filtres
document.querySelectorAll('.filter-platform, .filter-client, .filter-cout, .filter-region, .filter-produit, .filter-support, .filter-modalite, .filter-systeme, .filter-paiement, .filter-compatibilite, .filter-vente-plusieurs, .filter-logistique, .filter-gestion, .filter-communication, .filter-sort').forEach(cb => {
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

// Expose loadData pour le bouton de réessai
window.loadData = loadData;

// Fonction de chargement des données
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

// Charger les données au démarrage
loadData();

});
