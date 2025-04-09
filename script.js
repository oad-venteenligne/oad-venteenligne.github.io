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
  const sortBy = Array.from(document.querySelectorAll('.filter-sort')).find(rb => rb.checked)?.value || 'relevance';
  
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
    let matchesSearch = searchFilter(searchText)(item);
    
    // Vérifier la correspondance avec le filtre de texte (obligatoire)
    if (!matchesSearch) {
      // L'élément ne correspond pas à la recherche textuelle
      return {
        data: item,
        matchScore: 0,
        totalModalites: totalSelectedModalites,
        matchPercentage: 0
      };
    }
    
    // Calculer les correspondances pour chaque modalité de plateforme
    if (selectedPlatforms.length > 0) {
      if (selectedPlatforms.includes(item.listeListeTypeplateforme)) {
        matchScore++;
      }
    }
    
    // Calculer les correspondances pour chaque modalité de client
    if (selectedClients.length > 0) {
      const itemClients = (item.checkboxListeTypeclientid_typeclient || '').split(',').map(s => s.trim());
      // Compter chaque modalité de client qui correspond
      const matchingClientsCount = itemClients.filter(client => selectedClients.includes(client)).length;
      matchScore += matchingClientsCount;
    }
    
    // Calculer les correspondances pour chaque modalité de coût
    if (selectedCouts.length > 0) {
      const itemCosts = (item.checkboxListeCoutplateformeid_coutplateforme || '').split(',').map(s => s.trim());
      // Compter chaque modalité de coût qui correspond
      const matchingCostsCount = itemCosts.filter(cost => selectedCouts.includes(cost)).length;
      matchScore += matchingCostsCount;
    }
    
    // Calculer les correspondances pour chaque modalité de région
    if (selectedRegions.length > 0) {
      let matchingRegionsCount = 0;
      
      if (item.listeListeOuinonid_echellelocalisation === "1") {
        // Échelle nationale - correspond à toutes les régions sélectionnées
        matchingRegionsCount = selectedRegions.length; // Toutes les régions correspondent
      } else if (item.listeListeOuinonid_echellelocalisation === "2") {
        // Restriction géographique
        const itemRegions = (item.checkboxListeRegionsid_listeregions || '').split(',').map(s => s.trim());
        // Compter chaque modalité de région qui correspond
        matchingRegionsCount = itemRegions.filter(region => selectedRegions.includes(region)).length;
      }
      
      matchScore += matchingRegionsCount;
    }
    
    // Calculer les correspondances pour les produits commercialisés
    if (selectedProduits.length > 0) {
      const itemProduits = (item.checkboxListeProduitcommercialiseid_produitscommercialises || '').split(',').map(s => s.trim());
      const matchingProduitsCount = itemProduits.filter(produit => selectedProduits.includes(produit)).length;
      matchScore += matchingProduitsCount;
    }
    
    // Calculer les correspondances pour les types de support
    if (selectedSupports.length > 0) {
      const itemSupports = (item.checkboxListe021Typesupportplateformeid_typesupportplateforme || '').split(',').map(s => s.trim());
      const matchingSupportsCount = itemSupports.filter(support => selectedSupports.includes(support)).length;
      matchScore += matchingSupportsCount;
    }
    
    // Calculer les correspondances pour les modalités de vente
    if (selectedModalites.length > 0) {
      const itemModalites = (item.checkboxListeModaliteventeid_modalitevente || '').split(',').map(s => s.trim());
      const matchingModalitesCount = itemModalites.filter(modalite => selectedModalites.includes(modalite)).length;
      matchScore += matchingModalitesCount;
    }
    
    // Calculer les correspondances pour les systèmes de commande
    if (selectedSystemes.length > 0) {
      const itemSystemes = (item.checkboxListeSystemecommandeid_systemecommande || '').split(',').map(s => s.trim());
      const matchingSystemesCount = itemSystemes.filter(systeme => selectedSystemes.includes(systeme)).length;
      matchScore += matchingSystemesCount;
    }
    
    // Calculer les correspondances pour les options de paiement
    if (selectedPaiements.length > 0) {
      const itemPaiements = (item.checkboxListeOptionpaiementid_optionpaiement || '').split(',').map(s => s.trim());
      const matchingPaiementsCount = itemPaiements.filter(paiement => selectedPaiements.includes(paiement)).length;
      matchScore += matchingPaiementsCount;
    }
    
    // Pour les filtres Oui/Non, vérifier les correspondances
    
    // Compatibilité avec d'autres outils
    if (selectedCompatibilites.length > 0) {
      let matchingCompatibilitesCount = 0;
      
      for (const compatibilite of selectedCompatibilites) {
        const fieldName = ouiNonFiltres[compatibilite];
        if (item[fieldName] === "2") { // 2 = Oui
          matchingCompatibilitesCount++;
        }
      }
      
      matchScore += matchingCompatibilitesCount;
    }
    
    // Fonctionnalités en cas de vente à plusieurs
    if (selectedVentePlusieurs.length > 0) {
      let matchingVentePlusieurssCount = 0;
      
      for (const ventePlusieurs of selectedVentePlusieurs) {
        const fieldName = ouiNonFiltres[ventePlusieurs];
        if (item[fieldName] === "2") { // 2 = Oui
          matchingVentePlusieurssCount++;
        }
      }
      
      matchScore += matchingVentePlusieurssCount;
    }
    
    // Fonctionnalités Logistiques
    if (selectedLogistique.length > 0) {
      let matchingLogistiqueCount = 0;
      
      for (const logistique of selectedLogistique) {
        const fieldName = ouiNonFiltres[logistique];
        if (item[fieldName] === "2") { // 2 = Oui
          matchingLogistiqueCount++;
        }
      }
      
      matchScore += matchingLogistiqueCount;
    }
    
    // Fonctionnalités de Gestion Commerciale
    if (selectedGestion.length > 0) {
      let matchingGestionCount = 0;
      
      for (const gestion of selectedGestion) {
        const fieldName = ouiNonFiltres[gestion];
        if (item[fieldName] === "2") { // 2 = Oui
          matchingGestionCount++;
        }
      }
      
      matchScore += matchingGestionCount;
    }
    
    // Fonctionnalités de Communication
    if (selectedCommunication.length > 0) {
      let matchingCommunicationCount = 0;
      
      for (const communication of selectedCommunication) {
        const fieldName = ouiNonFiltres[communication];
        if (item[fieldName] === "2") { // 2 = Oui
          matchingCommunicationCount++;
        }
      }
      
      matchScore += matchingCommunicationCount;
    }
    
    // Calculer le pourcentage de correspondance
    const calculatedMatchPercentage = totalSelectedModalites > 0 ? 
      (matchScore / totalSelectedModalites) * 100 : 100;
      
    return {
      data: item,
      matchScore: matchScore,
      totalModalites: totalSelectedModalites,
      matchPercentage: calculatedMatchPercentage
    };
  });
  
  // Trier les éléments selon le critère choisi
  let sortedItems;
  
  if (sortBy === 'relevance') {
    // Trier par pourcentage de correspondance (décroissant) puis par titre
    sortedItems = [...scoredItems].sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage; // Trier par pourcentage décroissant
      }
      return a.data.bf_titre && b.data.bf_titre ? 
        a.data.bf_titre.localeCompare(b.data.bf_titre) : 
        !a.data.bf_titre ? 1 : -1; // Puis par ordre alphabétique
    });
  } else if (sortBy === 'alpha') {
    // Trier par ordre alphabétique
    sortedItems = [...scoredItems].sort((a, b) => {
      return a.data.bf_titre && b.data.bf_titre ? 
        a.data.bf_titre.localeCompare(b.data.bf_titre) : 
        !a.data.bf_titre ? 1 : -1;
    });
  } else if (sortBy === 'year') {
    // Trier par année décroissante
    sortedItems = [...scoredItems].sort((a, b) => {
      const yearA = parseInt(a.data.listeListeAnneeDeMiseEnLigne) || 0;
      const yearB = parseInt(b.data.listeListeAnneeDeMiseEnLigne) || 0;
      return yearB - yearA; // Plus récent d'abord
    });
  }
  
  // Filtrer pour ne garder que les éléments qui correspondent à la recherche textuelle
  const filteredItems = sortedItems.filter(item => searchFilter(searchText)(item.data));
  
  return {
    filteredData: filteredItems,
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
  
  // Afficher l'indicateur de chargement
  container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Chargement des résultats...</p></div>';
  
  // Utiliser setTimeout pour permettre au DOM de se rafraîchir et montrer le loader
  setTimeout(() => {
    // Récupérer les items filtrés et triés avec leurs scores
    const result = getFilteredItems();
    const filteredItems = result.filteredData;
    const totalActiveFilters = result.totalActiveFilters;
    
    // Afficher le nombre de résultats correspondants
    const matchingCount = filteredItems.filter(item => item.matchPercentage > 0).length;
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
    
    // Critère de tri actuel pour référence
    const currentSortMethod = document.querySelector('.filter-sort:checked')?.value || 'alpha';
    
    // Afficher toutes les fiches selon leur pourcentage de correspondance
    filteredItems.forEach(item => {
      // Seulement afficher les fiches qui correspondent à la recherche textuelle
      if (item.matchPercentage > 0 || document.querySelector('#search-input')?.value.trim() === '') {
        renderCard(item);
      }
    });
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
  
// Cette fonction va nous permettre de générer l'affichage des modalités sélectionnées
// avec une indication visuelle (barré ou non) si la modalité correspond à l'item

function generateModalitesList(item) {
  // Récupération des critères sélectionnés pour chaque filtre
  const selectedPlatforms = Array.from(document.querySelectorAll('.filter-platform:checked')).map(cb => cb.value);
  const selectedClients = Array.from(document.querySelectorAll('.filter-client:checked')).map(cb => cb.value);
  const selectedCouts = Array.from(document.querySelectorAll('.filter-cout:checked')).map(cb => cb.value);
  const selectedProduits = Array.from(document.querySelectorAll('.filter-produit:checked')).map(cb => cb.value);
  const selectedSupports = Array.from(document.querySelectorAll('.filter-support:checked')).map(cb => cb.value);
  const selectedModalites = Array.from(document.querySelectorAll('.filter-modalite:checked')).map(cb => cb.value);
  const selectedSystemes = Array.from(document.querySelectorAll('.filter-systeme:checked')).map(cb => cb.value);
  const selectedPaiements = Array.from(document.querySelectorAll('.filter-paiement:checked')).map(cb => cb.value);
  const selectedCompatibilites = Array.from(document.querySelectorAll('.filter-compatibilite:checked')).map(cb => cb.value);
  const selectedVentePlusieurs = Array.from(document.querySelectorAll('.filter-vente-plusieurs:checked')).map(cb => cb.value);
  const selectedLogistique = Array.from(document.querySelectorAll('.filter-logistique:checked')).map(cb => cb.value);
  const selectedGestion = Array.from(document.querySelectorAll('.filter-gestion:checked')).map(cb => cb.value);
  const selectedCommunication = Array.from(document.querySelectorAll('.filter-communication:checked')).map(cb => cb.value);
  
  // Liste de toutes les modalités sélectionnées
  const modalites = [];
  
  // Mappings pour obtenir les libellés correspondants
  const platformTypes = {
    "1": "Générateur de Boutique",
    "2": "Place de Marché",
    "3": "Outil de Gestion"
  };
  
  const clientTypes = {
    "1": "Consommateurs particuliers",
    "2": "Restauration collective",
    "3": "Restauration commerciale",
    "4": "GMS",
    "5": "Commerces de proximité",
    "6": "Grossistes",
    "7": "Transformateurs",
    "8": "Producteurs"
  };
  
  const coutTypes = {
    "1": "Totalement gratuit",
    "2": "Commission prélevée au producteur",
    "3": "Abonnement / droit d'entrée pour le producteur",
    "4": "Commission prélevée au consommateur",
    "5": "Abonnement / droit d'entrée pour le consommateur"
  };
  
  const produitTypes = {
    "1": "Fruits et légumes",
    "2": "Produits d'épicerie",
    "3": "Produits carnés",
    "4": "Produits de la pêche",
    "5": "Produits laitiers",
    "6": "Produits non alimentaires"
  };
  
  const supportTypes = {
    "1": "Site internet",
    "2": "Application mobile"
  };
  
  const modaliteTypes = {
    "1": "Vente permanente",
    "2": "Vente par sessions"
  };
  
  const systemeTypes = {
    "1": "Composition libre du panier",
    "2": "Paniers pré-composés avec abonnement",
    "3": "Paniers pré-composés sans abonnement"
  };
  
  const paiementTypes = {
    "1": "Paiement en ligne, à la commande",
    "2": "Paiement à la livraison"
  };
  
  const compatibiliteLabels = {
    "synchronisation": "Synchronisation des stocks",
    "systemecaisse": "Système de Caisse",
    "terminal": "Terminal de Paiement",
    "logiciel": "Logiciels de comptabilité"
  };
  
  const ventePlusiursLabels = {
    "plusieurscomptes": "Accès du compte à plusieurs",
    "synchroboutique": "Synchronisation avec d'autres boutiques",
    "commissionpersonalisee": "Commission personnalisée par producteur",
    "repartitionpaiements": "Répartition des paiements",
    "datelimite": "Paramétrage adapté à chaque producteur"
  };
  
  const logistiqueLabels = {
    "cliccollect": "Options de Clic-&-Collect",
    "zonelivraison": "Paramétrages de zones de livraisons",
    "solutionlogistique": "Partenariats solutions logistique",
    "colivraison": "Système de co-livraison",
    "partenairesemballage": "Partenariats emballage éco-responsable"
  };
  
  const gestionLabels = {
    "facturation": "Facturation",
    "bonslivraison": "Bons de Commande / Bons de livraison",
    "contractualisation": "Fonctionnalités de contractualisation",
    "reduc": "Mise en place d'offres ou réductions",
    "bdd": "Extraction BDD",
    "notation": "Système de notation par les clients"
  };
  
  const communicationLabels = {
    "pagepersonnalise": "Graphisme personnalisé",
    "url": "URL personnalisée",
    "seo": "Support SEO et référencement",
    "socialnetworks": "Intégration réseaux sociaux",
    "emailing": "Emailing et notifications clients",
    "messagerie": "Messagerie Instantanée",
    "com": "Modèles PLV ou supports de com",
    "carte": "Carte en ligne des producteurs"
  };
  
  // Vérifier les modalités de type de plateforme
  if (selectedPlatforms.length > 0) {
    selectedPlatforms.forEach(platformId => {
      const label = platformTypes[platformId];
      const matches = platformId === item.data.listeListeTypeplateforme;
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Type d'outil"
      });
    });
  }
  
  // Vérifier les modalités de type de client
  if (selectedClients.length > 0) {
    const itemClients = (item.data.checkboxListeTypeclientid_typeclient || '').split(',').map(s => s.trim());
    
    selectedClients.forEach(clientId => {
      const label = clientTypes[clientId];
      const matches = itemClients.includes(clientId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Type d'acheteurs"
      });
    });
  }
  
  // Vérifier les modalités de coût
  if (selectedCouts.length > 0) {
    const itemCouts = (item.data.checkboxListeCoutplateformeid_coutplateforme || '').split(',').map(s => s.trim());
    
    selectedCouts.forEach(coutId => {
      const label = coutTypes[coutId];
      const matches = itemCouts.includes(coutId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Coût de l'outil"
      });
    });
  }
  
  // Vérifier les modalités de produits
  if (selectedProduits.length > 0) {
    const itemProduits = (item.data.checkboxListeProduitcommercialiseid_produitscommercialises || '').split(',').map(s => s.trim());
    
    selectedProduits.forEach(produitId => {
      const label = produitTypes[produitId];
      const matches = itemProduits.includes(produitId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Produits commercialisés"
      });
    });
  }
  
  // Vérifier les modalités de support
  if (selectedSupports.length > 0) {
    const itemSupports = (item.data.checkboxListe021Typesupportplateformeid_typesupportplateforme || '').split(',').map(s => s.trim());
    
    selectedSupports.forEach(supportId => {
      const label = supportTypes[supportId];
      const matches = itemSupports.includes(supportId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Type de support"
      });
    });
  }
  
  // Vérifier les modalités de vente
  if (selectedModalites.length > 0) {
    const itemModalites = (item.data.checkboxListeModaliteventeid_modalitevente || '').split(',').map(s => s.trim());
    
    selectedModalites.forEach(modaliteId => {
      const label = modaliteTypes[modaliteId];
      const matches = itemModalites.includes(modaliteId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Modalité de vente"
      });
    });
  }
  
  // Vérifier les modalités de système de commande
  if (selectedSystemes.length > 0) {
    const itemSystemes = (item.data.checkboxListeSystemecommandeid_systemecommande || '').split(',').map(s => s.trim());
    
    selectedSystemes.forEach(systemeId => {
      const label = systemeTypes[systemeId];
      const matches = itemSystemes.includes(systemeId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Système de commande"
      });
    });
  }
  
  // Vérifier les modalités de paiement
  if (selectedPaiements.length > 0) {
    const itemPaiements = (item.data.checkboxListeOptionpaiementid_optionpaiement || '').split(',').map(s => s.trim());
    
    selectedPaiements.forEach(paiementId => {
      const label = paiementTypes[paiementId];
      const matches = itemPaiements.includes(paiementId);
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Option de paiement"
      });
    });
  }
  
  // Vérifier les modalités de compatibilité
  if (selectedCompatibilites.length > 0) {
    selectedCompatibilites.forEach(compatibiliteId => {
      const label = compatibiliteLabels[compatibiliteId];
      const fieldName = ouiNonFiltres[compatibiliteId];
      const matches = item.data[fieldName] === "2"; // 2 = Oui
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Compatibilité avec d'autres outils"
      });
    });
  }
  
  // Vérifier les modalités de vente à plusieurs
  if (selectedVentePlusieurs.length > 0) {
    selectedVentePlusieurs.forEach(ventePlusiersId => {
      const label = ventePlusiursLabels[ventePlusiersId];
      const fieldName = ouiNonFiltres[ventePlusiersId];
      const matches = item.data[fieldName] === "2"; // 2 = Oui
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Fonctionnalités en cas de vente à plusieurs"
      });
    });
  }
  
  // Vérifier les modalités de logistique
  if (selectedLogistique.length > 0) {
    selectedLogistique.forEach(logistiqueId => {
      const label = logistiqueLabels[logistiqueId];
      const fieldName = ouiNonFiltres[logistiqueId];
      const matches = item.data[fieldName] === "2"; // 2 = Oui
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Fonctionnalités Logistiques"
      });
    });
  }
  
  // Vérifier les modalités de gestion
  if (selectedGestion.length > 0) {
    selectedGestion.forEach(gestionId => {
      const label = gestionLabels[gestionId];
      const fieldName = ouiNonFiltres[gestionId];
      const matches = item.data[fieldName] === "2"; // 2 = Oui
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Fonctionnalités de Gestion Commerciale"
      });
    });
  }
  
  // Vérifier les modalités de communication
  if (selectedCommunication.length > 0) {
    selectedCommunication.forEach(communicationId => {
      const label = communicationLabels[communicationId];
      const fieldName = ouiNonFiltres[communicationId];
      const matches = item.data[fieldName] === "2"; // 2 = Oui
      
      modalites.push({
        label: label,
        matches: matches,
        category: "Fonctionnalités de Communication"
      });
    });
  }
  
  // Si aucune modalité n'est sélectionnée, retourner une chaîne vide
  if (modalites.length === 0) {
    return '';
  }
  
  // Grouper les modalités par catégorie
  const categorizedModalites = {};
  modalites.forEach(modalite => {
    if (!categorizedModalites[modalite.category]) {
      categorizedModalites[modalite.category] = [];
    }
    categorizedModalites[modalite.category].push(modalite);
  });
  
  // Générer le HTML pour les modalités
  let html = '<div class="modalites-list">';
  
  // Parcourir chaque catégorie
  for (const category in categorizedModalites) {
    html += `<div class="modalite-category"><strong>${category}</strong>: `;
    
    // Parcourir les modalités de cette catégorie
    categorizedModalites[category].forEach((modalite, index) => {
      // Ajouter la modalité avec ou sans style barré
      if (modalite.matches) {
        html += `<span class="modalite-match">${modalite.label}</span>`;
      } else {
        html += `<span class="modalite-no-match"><s>${modalite.label}</s></span>`;
      }
      
      // Ajouter une virgule si ce n'est pas la dernière modalité
      if (index < categorizedModalites[category].length - 1) {
        html += ', ';
      }
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

// Fonction pour afficher une carte
// Fonction pour afficher une carte
function renderCard(item) {
  const searchTerm = document.querySelector('#search-input')?.value.trim() || '';
  
  // Préparer les données de la carte
  const title = item.data.bf_titre || 'Sans titre';
  const description = item.data.bf_descriptiongenerale ? getFirstSentence(item.data.bf_descriptiongenerale) : 'Description non disponible';
  const platformType = getPlatformType(item.data.listeListeTypeplateforme);
  const anneeCreation = getYearFromNumber(item.data.listeListeAnneeDeMiseEnLigne);
  const imageUrl = item.data.imagebf_image 
                  ? `https://www.oad-venteenligne.org/cache/vignette_${item.data.imagebf_image}` 
                  : 'https://via.placeholder.com/100?text=Logo';
  
  // Mettre en surbrillance les termes recherchés
  const highlightedTitle = highlightText(title, searchTerm);
  const highlightedDescription = highlightText(description, searchTerm);

  // Définir le style selon le pourcentage de correspondance
  const getCardStyle = (percentage) => {
    if (percentage >= 70) {
      return {
        cardStyle: '', // Style normal (vert par défaut)
        badgeStyle: 'background: #4caf50; color: white;', // Badge vert
        textColor: '',
        matchInfoStyle: 'background: #e8f5e9; color: #2e7d32; font-weight: bold;'
      };
    } else if (percentage >= 50) {
      return {
        cardStyle: 'border-color: #ffc107;', // Bordure jaune
        badgeStyle: 'background: #ffc107; color: black;', // Badge jaune
        textColor: '',
        matchInfoStyle: 'background: #fff8e1; color: #ff8f00; font-weight: bold;'
      };
    } else {
      return {
        cardStyle: 'filter: grayscale(100%);', // Grisé
        badgeStyle: 'background: #9e9e9e; color: white;', // Badge gris
        textColor: 'color: #757575;',
        matchInfoStyle: 'background: #f5f5f5; color: #757575; font-weight: bold;'
      };
    }
  };

  // Récupérer les styles selon le pourcentage
  const percentage = item.matchPercentage;
  const styles = getCardStyle(percentage);

  // CSS pour les modalités et la section détails
  const detailsCss = `
    .details-list {
      margin-top: 10px;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 6px;
      font-size: 13px;
      border-left: 3px solid #ddd;
    }
    
    .details-category {
      margin-bottom: 10px;
    }
    
    .details-category h4 {
      font-size: 14px;
      margin: 0 0 5px 0;
      color: #555;
      border-bottom: 1px solid #eee;
      padding-bottom: 3px;
    }
    
    .modalite-match {
      font-weight: 500;
      color: #4caf50;
    }
    
    .modalite-no-match {
      color: #9e9e9e;
    }
    
    .details-toggle {
      cursor: pointer;
      display: block;
      margin: 15px 0 5px 0;
      font-size: 15px;
      color: #555;
      user-select: none;
      background: #f0f0f0;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .details-toggle:hover {
      background: #e0e0e0;
    }
    
    .details-toggle::after {
      content: " ▴";
      font-size: 12px;
      float: right;
    }
    
    .details-container[data-expanded="false"] .details-list {
      display: none;
    }
    
    .details-container[data-expanded="false"] .details-toggle::after {
      content: " ▾";
    }
    
    .info-row {
      margin-bottom: 5px;
    }
    
    .info-row strong {
      font-weight: 500;
    }
  `;

  // Ajouter le style à la page si ce n'est pas déjà fait
  if (!document.getElementById('details-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'details-css';
    styleEl.textContent = detailsCss;
    document.head.appendChild(styleEl);
  }

  // Générer la liste des modalités
  const modalitesList = generateModalitesList(item);

  // Créer la carte avec la nouvelle logique de style
  const card = document.createElement("div");
  card.className = "tool-card";
  card.setAttribute("tabindex", "0"); // Pour améliorer l'accessibilité
  card.style = styles.cardStyle;

  card.innerHTML = `
    <div class="card-left">
      <img src="${imageUrl}" alt="${title}" class="tool-logo" loading="lazy">
      <div class="tool-category" style="${styles.badgeStyle}">${platformType}</div>
      ${item.totalModalites > 0 
        ? `<div class="match-info" style="${styles.matchInfoStyle}">
            ${Math.round(percentage)}% (${item.matchScore}/${item.totalModalites})
           </div>`
        : ''
      }
    </div>
    <div class="card-right">
      <h2 class="tool-title" style="${styles.textColor}">${highlightedTitle}</h2>
      <p class="tool-description" style="${styles.textColor}">${highlightedDescription}</p>
      
      <div class="details-container" data-expanded="true">
        <div class="details-toggle">Informations générales</div>
        <div class="details-list">
          <div class="details-category">
            <p><strong>Année de création :</strong> ${anneeCreation}</p>
            ${item.data.bf_urloutil 
              ? `<p><strong>Site web :</strong> <a href="${item.data.bf_urloutil}" target="_blank" rel="noopener">${item.data.bf_urloutil.replace(/(https?:\/\/)?(www\.)?/i, '')}</a></p>` 
              : ''
            }
          </div>
        </div>
      </div>
      
      <div class="details-container" data-expanded="true">
        <div class="details-toggle">Critères sélectionnés</div>
        <div class="details-list">
          ${modalitesList ? modalitesList : '<p>Aucun critère sélectionné</p>'}
        </div>
      </div>
      
      <button class="cta-button view-details" aria-label="Voir les détails de ${title}">
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
  
  // Ajouter un écouteur pour le toggle des détails
  const detailsToggle = card.querySelector('.details-toggle');
  if (detailsToggle) {
    detailsToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const container = this.closest('.details-container');
      const isExpanded = container.getAttribute('data-expanded') === 'true';
      container.setAttribute('data-expanded', !isExpanded);
    });
  }
  
  // Ajouter un écouteur sur toute la carte pour ouvrir le modal
  card.addEventListener('click', function(e) {
    // Ne pas ouvrir le modal si on clique sur les détails
    if (e.target.closest('.details-toggle') || e.target.closest('.details-list') || e.target.closest('.view-details') || e.target.closest('a')) {
      return;
    }
    openToolModal(item.data);
  });
  
  const container = document.getElementById("fiches-container");
  if (container) {
    container.appendChild(card);
  }
}
  
 // ===== FONCTIONS DU MODAL =====

// Fonction modifiée pour la génération du modal - filtrage des fonctionnalités "Oui"
// Fonction pour ouvrir le modal avec les détails d'un outil
// Mise à jour de l'en-tête du modal avec étiquette stylisée
function openToolModal(itemData) {
  const modal = document.getElementById('tool-modal');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal || !modalBody) {
    console.error("Éléments du modal non trouvés");
    return;
  }
  
  // Construire le contenu du modal
  const platformType = getPlatformType(itemData.listeListeTypeplateforme);
  
  let content = `
    <div class="modal-header">
      <div class="modal-type-badge" data-type="${platformType}">${platformType}</div>
      ${itemData.imagebf_image ? 
        `<img src="https://www.oad-venteenligne.org/cache/vignette_${itemData.imagebf_image}" alt="${itemData.bf_titre || 'Sans titre'}" class="modal-logo">` : 
        `<img src="https://via.placeholder.com/150?text=Logo" alt="Logo par défaut" class="modal-logo">`
      }
      <h1>${itemData.bf_titre || 'Sans titre'}</h1>
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
  
  // Positionnement de l'outil
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
  
  // Fonction utilitaire pour générer une grille de fonctionnalités avec seulement les valeurs "Oui"
  function generateFeaturesGridOuiOnly(features, title) {
    // Filtrer pour ne garder que les fonctionnalités avec valeur "Oui"
    const ouiFeatures = features.filter(feature => itemData[feature.field] === "2");
    
    // S'il n'y a aucune fonctionnalité "Oui", ne pas afficher la section
    if (ouiFeatures.length === 0) return '';
    
    let html = `
      <div class="modal-section">
        <h2>${title}</h2>
        <div class="features-grid">
    `;
    
    ouiFeatures.forEach(feature => {
      html += `
        <div class="feature-item">
          <div class="feature-title">${feature.label}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }
  
  // Compatibilité avec d'autres outils - seulement les "Oui"
  content += generateFeaturesGridOuiOnly([
    { label: "Synchronisation des stocks", field: "listeListeOuinonid_synchronisation" },
    { label: "Système de Caisse", field: "listeListeOuinonid_systemecaisse" },
    { label: "Terminal de Paiement", field: "listeListeOuinonid_terminal" },
    { label: "Logiciels de comptabilité", field: "listeListeOuinonid_logiciel" }
  ], "Compatibilité avec d'autres outils");
  
  // Fonctionnalités en cas de vente à plusieurs - seulement les "Oui"
  content += generateFeaturesGridOuiOnly([
    { label: "Accès du compte à plusieurs", field: "listeListeOuinonid_plusieurscomptes" },
    { label: "Synchronisation entre boutiques", field: "listeListeOuinonid_synchroboutique" },
    { label: "Commission personnalisée par producteur", field: "listeListeOuinonid_commissionpersonalisee" },
    { label: "Répartition des paiements", field: "listeListeOuinonid_repartitionpaiements" },
    { label: "Paramétrage adapté à chaque producteur", field: "listeListeOuinonid_datelimite" }
  ], "Fonctionnalités en cas de vente à plusieurs");
  
  // Fonctionnalités Logistiques - seulement les "Oui"
  content += generateFeaturesGridOuiOnly([
    { label: "Options de Clic-&-Collect", field: "listeListeOuinonid_cliccollect" },
    { label: "Paramétrages de zones de livraisons", field: "listeListeOuinonid_zonelivraison" },
    { label: "Partenariats solutions logistique", field: "listeListeOuinonid_solutionlogistique" },
    { label: "Système de co-livraison", field: "listeListeOuinonid_colivraison" },
    { label: "Partenariats emballage éco-responsable", field: "listeListeOuinonid_partenairesemballage" }
  ], "Fonctionnalités Logistiques");
  
  // Fonctionnalités de Gestion Commerciale - seulement les "Oui"
  content += generateFeaturesGridOuiOnly([
    { label: "Facturation", field: "listeListeOuinonid_facturation" },
    { label: "Bons de Commande / Bons de livraison", field: "listeListeOuinonid_bonslivraison" },
    { label: "Fonctionnalités de contractualisation", field: "listeListeOuinonid_contractualisation" },
    { label: "Mise en place d'offres ou réductions", field: "listeListeOuinonid_reduc" },
    { label: "Extraction BDD", field: "listeListeOuinonid_bdd" },
    { label: "Système de notation par les clients", field: "listeListeOuinonid_notation" }
  ], "Fonctionnalités de Gestion Commerciale");
  
  // Fonctionnalités de Communication - seulement les "Oui"
  content += generateFeaturesGridOuiOnly([
    { label: "Graphisme personnalisé", field: "listeListeOuinonid_pagepersonnalise" },
    { label: "URL personnalisée", field: "listeListeOuinonid_url" },
    { label: "Support SEO et référencement", field: "listeListeOuinonid_seo" },
    { label: "Intégration réseaux sociaux", field: "listeListeOuinonid_socialnetworks" },
    { label: "Emailing et notifications clients", field: "listeListeOuinonid_emailing" },
    { label: "Messagerie Instantanée", field: "listeListeOuinonid_messagerie" },
    { label: "Supports de communication", field: "listeListeOuinonid_com" },
    { label: "Carte des producteurs", field: "listeListeOuinonid_carte" }
  ], "Fonctionnalités de Communication");
  
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
  
  // Ajouter les styles spécifiques pour le badge s'ils n'existent pas déjà
  if (!document.getElementById('modal-badge-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'modal-badge-styles';
    styleElement.textContent = `
      .modal-type-badge {
        background: #4caf50;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: absolute;
        top: 15px;
        left: 20px;
        z-index: 10;
        transition: all 0.3s ease;
      }
      
      .modal-header {
        text-align: center;
        margin-bottom: 30px;
        position: relative;
        padding-top: 40px;
      }
      
      /* Variation des couleurs pour différents types d'outils */
      .modal-type-badge[data-type="Générateur de Boutique"] {
        background: #4caf50;
      }
      
      .modal-type-badge[data-type="Place de Marché"] {
        background: #2196F3;
      }
      
      .modal-type-badge[data-type="Outil de Gestion"] {
        background: #FF9800;
      }
      
      /* Adaptation pour le mode sombre */
      .dark-mode .modal-type-badge {
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      .dark-mode .modal-type-badge[data-type="Générateur de Boutique"] {
        background: #66bb6a;
      }
      
      .dark-mode .modal-type-badge[data-type="Place de Marché"] {
        background: #42a5f5;
      }
      
      .dark-mode .modal-type-badge[data-type="Outil de Gestion"] {
        background: #ffb74d;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
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
