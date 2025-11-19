/**
 * Build hierarchical structure from flat OAI data
 * Useful for tree views, nested displays, etc.
 */
export const buildHierarchy = (oais) => {
  const hierarchy = {};

  oais.forEach(oai => {
    // Initialize objective level
    if (!hierarchy[oai.objective]) {
      hierarchy[oai.objective] = {
        id: oai.objective,
        name: oai.objective,
        loes: {},
        type: 'objective'
      };
    }

    const objective = hierarchy[oai.objective];

    // Initialize LOE level
    if (!objective.loes[oai.loe]) {
      objective.loes[oai.loe] = {
        id: oai.loe,
        name: oai.loe,
        imos: {},
        type: 'loe'
      };
    }

    const loe = objective.loes[oai.loe];

    // Initialize IMO level
    if (!loe.imos[oai.imo]) {
      loe.imos[oai.imo] = {
        id: oai.imo,
        name: oai.imo,
        parentOais: {},
        type: 'imo'
      };
    }

    const imo = loe.imos[oai.imo];

    // Initialize Parent OAI level
    const parentId = oai.parentOaiId || 'default';
    if (!imo.parentOais[parentId]) {
      imo.parentOais[parentId] = {
        id: parentId,
        subOais: [],
        type: 'parentOai'
      };
    }

    // Add sub OAI
    imo.parentOais[parentId].subOais.push(oai);
  });

  return hierarchy;
};

/**
 * Get unique values for filters
 */
export const getUniqueValues = (oais, field) => {
  return [...new Set(oais.map(oai => oai[field]).filter(Boolean))];
};

/**
 * Calculate timeline statistics
 */
export const calculateStats = (oais) => {
  const stats = {
    total: oais.length,
    byDomain: {
      land: 0,
      sea: 0,
      air: 0,
      cyber: 0,
      space: 0
    },
    decisivePoints: 0,
    decisionPoints: 0,
    branches: 0,
    contingencies: 0,
    byStatus: {},
    byPriority: {}
  };

  oais.forEach(oai => {
    // Count by domain
    ['land', 'sea', 'air', 'cyber', 'space'].forEach(domain => {
      if (oai[domain]) stats.byDomain[domain]++;
    });

    // Count decision points
    if (oai.decisivePoint) stats.decisivePoints++;
    if (oai.decisionPoint) stats.decisionPoints++;
    if (oai.isBranch) stats.branches++;
    if (oai.isContingency) stats.contingencies++;

    // Count by status
    stats.byStatus[oai.status] = (stats.byStatus[oai.status] || 0) + 1;

    // Count by priority
    stats.byPriority[oai.priority] = (stats.byPriority[oai.priority] || 0) + 1;
  });

  return stats;
};

/**
 * Download file helper
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get domain color
 */
export const getDomainColor = (domain) => {
  const colors = {
    land: '#8B4513',
    sea: '#1E90FF',
    air: '#87CEEB',
    cyber: '#9400D3',
    space: '#000080'
  };
  return colors[domain] || '#666666';
};

/**
 * Get status color for Material-UI
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    in_review: 'info',
    approved: 'success',
    archived: 'warning',
    planned: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error'
  };
  return colors[status] || 'default';
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default'
  };
  return colors[priority] || 'default';
};
