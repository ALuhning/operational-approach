const fs = require('fs');
const Papa = require('papaparse');

/**
 * Parse CSV file and convert to OAI objects
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const oais = [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    try {
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        dynamicTyping: false
      });
      
      const records = result.data;

      records.forEach((row, index) => {
        // Calculate timeline phases (can be enhanced with actual dates)
        const startPhase = index * 2; // Simple sequential phasing
        const endPhase = startPhase + 2;

        const oai = {
          objective: row.Objective_Title || row.Objective || '',
          objectiveId: row.Objective_ID || '',
          loe: row.LOE_Title || row.LOE || '',
          loeId: row.LOE_ID || '',
          imo: row.IMO_Title || row.IMO || '',
          imoId: row.IMO_ID || '',
          parentOaiId: row.Parent_OAI_ID || null,
          subOaiId: row.OAI_ID || row.Sub_OAI_ID || '',
          oaiDescription: row.OAI_Description || '',
          land: row.Land || null,
          sea: row.Sea || null,
          air: row.Air || null,
          cyber: row.Cyber || null,
          space: row.Space || null,
          // Legacy single decision/decisive points
          decisivePoint: row.Decisive_Point || null,
          decisionPoint: row.Decision_Point || null,
          startPhase,
          endPhase,
          duration: endPhase - startPhase,
          // New time dimensions
          durationMonths: row.Duration_Months ? parseInt(row.Duration_Months) : null,
          startDate: row.Start_Date || null,
          endDate: row.End_Date || null,
          dpDate: row.DP_Date || null,
          decisionDate: row.Decision_Date || null,
          // Multiple decision/decisive points with labels
          decisionPoint1Label: row.Decision_Point_1_Label || null,
          decisionPoint1Date: row.Decision_Point_1_Date || null,
          decisionPoint2Label: row.Decision_Point_2_Label || null,
          decisionPoint2Date: row.Decision_Point_2_Date || null,
          decisionPoint3Label: row.Decision_Point_3_Label || null,
          decisionPoint3Date: row.Decision_Point_3_Date || null,
          decisivePoint1Label: row.Decisive_Point_1_Label || null,
          decisivePoint1Date: row.Decisive_Point_1_Date || null,
          decisivePoint2Label: row.Decisive_Point_2_Label || null,
          decisivePoint2Date: row.Decisive_Point_2_Date || null,
          decisivePoint3Label: row.Decisive_Point_3_Label || null,
          decisivePoint3Date: row.Decisive_Point_3_Date || null,
          dependsOn: row.Depends_On || null,
          branchNotes: row.Branch_Notes || null,
          priority: 'medium',
          status: 'planned'
        };

        oais.push(oai);
      });

      resolve(oais);
    } catch (error) {
      reject(new Error(`CSV parsing error: ${error.message}`));
    }
  });
};

/**
 * Export OAIs to CSV format
 */
const exportToCSV = (oais) => {
  const headers = [
    'Objective', 'LOE', 'IMO', 'Parent_OAI_ID', 'Sub_OAI_ID', 'OAI_Description',
    'Land', 'Sea', 'Air', 'Cyber', 'Space', 'Decisive_Point', 'Decision_Point',
    'Start_Phase', 'End_Phase', 'Duration', 'Priority', 'Status', 'Notes'
  ];

  const rows = oais.map(oai => [
    escapeCSV(oai.objective),
    escapeCSV(oai.loe),
    escapeCSV(oai.imo),
    escapeCSV(oai.parentOaiId),
    escapeCSV(oai.subOaiId),
    escapeCSV(oai.oaiDescription),
    escapeCSV(oai.land),
    escapeCSV(oai.sea),
    escapeCSV(oai.air),
    escapeCSV(oai.cyber),
    escapeCSV(oai.space),
    escapeCSV(oai.decisivePoint),
    escapeCSV(oai.decisionPoint),
    oai.startPhase,
    oai.endPhase,
    oai.duration,
    oai.priority,
    oai.status,
    escapeCSV(oai.notes)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Escape CSV values
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Transform flat OAIs into hierarchical structure for visualization
 */
const buildHierarchy = (oais) => {
  const hierarchy = {};

  oais.forEach(oai => {
    // Group by Objective
    if (!hierarchy[oai.objective]) {
      hierarchy[oai.objective] = {
        name: oai.objective,
        loes: {}
      };
    }

    // Group by LOE
    if (!hierarchy[oai.objective].loes[oai.loe]) {
      hierarchy[oai.objective].loes[oai.loe] = {
        name: oai.loe,
        imos: {}
      };
    }

    // Group by IMO
    if (!hierarchy[oai.objective].loes[oai.loe].imos[oai.imo]) {
      hierarchy[oai.objective].loes[oai.loe].imos[oai.imo] = {
        name: oai.imo,
        oais: []
      };
    }

    // Add OAI
    hierarchy[oai.objective].loes[oai.loe].imos[oai.imo].oais.push(oai);
  });

  return hierarchy;
};

module.exports = {
  parseCSV,
  exportToCSV,
  buildHierarchy
};
