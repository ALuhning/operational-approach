import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Drawer,
  Divider,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Grid,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CameraAlt as ScreenshotIcon,
  List as ListIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import * as api from '../services/api';
import GanttCanvas from '../components/GanttCanvas';

const DOMAINS = ['land', 'sea', 'air', 'cyber', 'space'];

const Visualization = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const visualizationRef = useRef(null);

  const [dataset, setDataset] = useState(null);
  const [oais, setOais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('planner'); // 'commander' or 'planner'
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [decisionPointsDialogOpen, setDecisionPointsDialogOpen] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [editOAIDialogOpen, setEditOAIDialogOpen] = useState(false);
  const [editingOAI, setEditingOAI] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState('');
  const [newItemData, setNewItemData] = useState({});
  const [editData, setEditData] = useState({
    problemStatement: '',
    currentOE: '',
    desiredFutureState: '',
    objectiveDesiredConditions: '',
    effects: '',
    coreCommunicationNarrative: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    domains: {
      land: true,
      sea: true,
      air: true,
      cyber: true,
      space: true,
    },
    loes: {},
    imos: {},
    showDecisivePoints: true,
    showDecisionPoints: true,
    showBranches: true,
  });

  const loadDataset = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDataset(datasetId);
      console.log('Loaded dataset:', data); // Debug log
      setDataset(data);
      setOais(data.oais || []);
      
      // Initialize LOE and IMO filters
      const loes = {};
      const imos = {};
      if (data.oais && data.oais.length > 0) {
        data.oais.forEach(oai => {
          if (oai.loe) loes[oai.loe] = true;
          if (oai.imo) imos[oai.imo] = true;
        });
      }
      setFilters(prev => ({ ...prev, loes, imos }));
      setError('');
    } catch (err) {
      console.error('Error loading dataset:', err);
      setError('Failed to load dataset: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  const handleExport = async () => {
    try {
      const blob = await api.exportDataset(datasetId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dataset.name}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export');
    }
  };

  const handleEditOpen = () => {
    setEditData({
      problemStatement: dataset?.problemStatement || '',
      currentOE: dataset?.currentOE || '',
      desiredFutureState: dataset?.desiredFutureState || '',
      objectiveDesiredConditions: dataset?.objectiveDesiredConditions || '',
      effects: dataset?.effects || '',
      coreCommunicationNarrative: dataset?.coreCommunicationNarrative || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await api.updateDataset(datasetId, editData);
      await loadDataset();
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update fields: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleUpdateOAI = async (oaiId, updates) => {
    try {
      // Update the database
      await api.updateOAI(oaiId, updates);
      
      // Update local state immediately for smooth UX
      setOais(prevOais => 
        prevOais.map(oai => 
          oai.id === oaiId ? { ...oai, ...updates } : oai
        )
      );
    } catch (err) {
      console.error('Failed to update OAI:', err);
      setError('Failed to update OAI dates');
      // Reload on error to ensure consistency
      await loadDataset();
    }
  };

  const handleEditOAI = (oai) => {
    setEditingOAI(oai);
    setEditOAIDialogOpen(true);
  };

  const handleReorderItems = async (type, item, newIndex) => {
    try {
      if (type === 'oai') {
        // Get all OAIs in the same IMO
        const imoOais = oais.filter(o => 
          o.objective === item.objective && 
          o.loe === item.loe && 
          o.imo === item.imo
        ).sort((a, b) => (a.subOaiId || '').localeCompare(b.subOaiId || ''));
        
        const oldIndex = item.oaiIndex;
        if (oldIndex === newIndex || newIndex >= imoOais.length || newIndex < 0) return;
        
        // Reorder the array
        const reordered = [...imoOais];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        
        // Get base ID from IMO or create one
        const baseId = item.imoId || item.imo?.split(' ')[0] || 'OAI';
        
        // Update IDs based on new positions
        const updates = reordered.map((oai, idx) => ({
          id: oai.id,
          subOaiId: `${baseId}.${idx + 1}`
        }));
        
        await api.bulkUpdateOAIs(updates);
        await loadDataset();
      } else if (type === 'imo') {
        // Reordering IMOs requires updating all subordinate OAIs
        // This is complex - for now, show a message
        setError('IMO reordering will be implemented in next update');
      } else if (type === 'loe') {
        setError('LOE reordering will be implemented in next update');
      }
    } catch (err) {
      console.error('Failed to reorder:', err);
      setError('Failed to reorder items: ' + (err.message || 'Unknown error'));
      await loadDataset();
    }
  };

  const handleAddNew = (type) => {
    setAddMenuAnchor(null);
    setAddDialogType(type);
    
    // Initialize new item data based on type
    if (type === 'oai') {
      setNewItemData({
        objective: '',
        objectiveId: '',
        loe: '',
        loeId: '',
        imo: '',
        imoId: '',
        subOaiId: '',
        oaiDescription: '',
        startDate: '',
        endDate: '',
        land: '',
        sea: '',
        air: '',
        cyber: '',
        space: ''
      });
    } else if (type === 'decisivePoint' || type === 'decisionPoint') {
      setNewItemData({
        oaiId: '',
        label: '',
        date: ''
      });
    } else {
      setNewItemData({
        name: '',
        id: '',
        parentId: ''
      });
    }
    
    setAddDialogOpen(true);
  };

  const handleScreenshot = async () => {
    if (!visualizationRef.current) return;
    
    try {
      setScreenshotLoading(true);
      const canvas = await html2canvas(visualizationRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `operational-approach-${dataset?.name || 'visualization'}-${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setScreenshotLoading(false);
      });
    } catch (err) {
      console.error('Screenshot failed:', err);
      setError('Failed to capture screenshot: ' + err.message);
      setScreenshotLoading(false);
    }
  };

  const getDecisionPoints = () => {
    const points = [];
    
    oais.forEach(oai => {
      // Collect decisive points
      if (oai.decisivePoint1Label) {
        points.push({
          type: 'Decisive',
          number: 1,
          label: oai.decisivePoint1Label,
          date: oai.decisivePoint1Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
      if (oai.decisivePoint2Label) {
        points.push({
          type: 'Decisive',
          number: 2,
          label: oai.decisivePoint2Label,
          date: oai.decisivePoint2Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
      if (oai.decisivePoint3Label) {
        points.push({
          type: 'Decisive',
          number: 3,
          label: oai.decisivePoint3Label,
          date: oai.decisivePoint3Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
      
      // Collect decision points
      if (oai.decisionPoint1Label) {
        points.push({
          type: 'Decision',
          number: 1,
          label: oai.decisionPoint1Label,
          date: oai.decisionPoint1Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
      if (oai.decisionPoint2Label) {
        points.push({
          type: 'Decision',
          number: 2,
          label: oai.decisionPoint2Label,
          date: oai.decisionPoint2Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
      if (oai.decisionPoint3Label) {
        points.push({
          type: 'Decision',
          number: 3,
          label: oai.decisionPoint3Label,
          date: oai.decisionPoint3Date,
          objective: oai.objective,
          objectiveId: oai.objectiveId,
          loe: oai.loe,
          loeId: oai.loeId,
          imo: oai.imo,
          imoId: oai.imoId,
          oai: oai.subOai,
          oaiId: oai.subOaiId,
          oaiDescription: oai.oaiDescription
        });
      }
    });
    
    // Sort by hierarchy: Objective -> LOE -> IMO -> OAI -> Date
    points.sort((a, b) => {
      if (a.objectiveId !== b.objectiveId) return (a.objectiveId || '').localeCompare(b.objectiveId || '');
      if (a.loeId !== b.loeId) return (a.loeId || '').localeCompare(b.loeId || '');
      if (a.imoId !== b.imoId) return (a.imoId || '').localeCompare(b.imoId || '');
      if (a.oaiId !== b.oaiId) return (a.oaiId || '').localeCompare(b.oaiId || '');
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      return 0;
    });
    
    return points;
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {dataset?.name}
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            sx={{ mr: 2 }}
          >
            <ToggleButton value="commander" sx={{ color: 'white' }}>
              <ViewIcon sx={{ mr: 1 }} /> Commander
            </ToggleButton>
            <ToggleButton value="planner" sx={{ color: 'white' }}>
              Planner
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton color="inherit" onClick={handleEditOpen}>
            <EditIcon />
          </IconButton>
          <IconButton color="inherit" onClick={(e) => setAddMenuAnchor(e.currentTarget)} title="Add New Item">
            <AddIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setFilterDrawerOpen(true)}>
            <FilterIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDecisionPointsDialogOpen(true)} title="View Decision/Decisive Points">
            <ListIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleScreenshot} disabled={screenshotLoading} title="Capture Screenshot">
            <ScreenshotIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleExport}>
            <DownloadIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          {oais.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
              No OAIs found in this dataset
            </Typography>
          ) : (
            <>
              <Box ref={visualizationRef} sx={{ width: '100%', minHeight: '600px', bgcolor: '#ffffff' }}>
                <GanttCanvas 
                  oais={oais} 
                  filters={filters} 
                  viewMode={viewMode}
                  problemStatement={dataset?.problemStatement}
                  currentOE={dataset?.currentOE}
                  desiredFutureState={dataset?.desiredFutureState}
                  objectiveDesiredConditions={dataset?.objectiveDesiredConditions}
                  effects={dataset?.effects}
                  coreCommunicationNarrative={dataset?.coreCommunicationNarrative}
                  onUpdateOAI={handleUpdateOAI}
                  onEditOAI={handleEditOAI}
                  onReorderItems={handleReorderItems}
                />
              </Box>
            </>
          )}
        </Paper>
      </Container>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Domains
          </Typography>
          <FormGroup>
            {DOMAINS.map(domain => (
              <FormControlLabel
                key={domain}
                control={
                  <Checkbox
                    checked={filters.domains[domain]}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        domains: { ...prev.domains, [domain]: e.target.checked },
                      }))
                    }
                  />
                }
                label={domain.toUpperCase()}
              />
            ))}
          </FormGroup>

          <Divider sx={{ my: 2 }} />

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showDecisivePoints}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, showDecisivePoints: e.target.checked }))
                  }
                />
              }
              label="Show Decisive Points"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showDecisionPoints}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, showDecisionPoints: e.target.checked }))
                  }
                />
              }
              label="Show Decision Points"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showBranches}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, showBranches: e.target.checked }))
                  }
                />
              }
              label="Show Branch Plans"
            />
          </FormGroup>
        </Box>
      </Drawer>

      {/* Add Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={() => setAddMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleAddNew('objective')}>Add Objective</MenuItem>
        <MenuItem onClick={() => handleAddNew('loe')}>Add Line of Effort</MenuItem>
        <MenuItem onClick={() => handleAddNew('imo')}>Add Intermediate Military Objective</MenuItem>
        <MenuItem onClick={() => handleAddNew('oai')}>Add OAI</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAddNew('decisivePoint')}>Add Decisive Point</MenuItem>
        <MenuItem onClick={() => handleAddNew('decisionPoint')}>Add Decision Point</MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Operational Context</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Problem Statement"
            value={editData.problemStatement}
            onChange={(e) => setEditData(prev => ({ ...prev, problemStatement: e.target.value }))}
            placeholder="Describe the problem this operational approach addresses..."
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Current Operational Environment"
            value={editData.currentOE}
            onChange={(e) => setEditData(prev => ({ ...prev, currentOE: e.target.value }))}
            placeholder="Describe the current situation and conditions..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Desired Future State"
            value={editData.desiredFutureState}
            onChange={(e) => setEditData(prev => ({ ...prev, desiredFutureState: e.target.value }))}
            placeholder="Describe the desired end state..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Objective Desired Conditions"
            value={editData.objectiveDesiredConditions}
            onChange={(e) => setEditData(prev => ({ ...prev, objectiveDesiredConditions: e.target.value }))}
            placeholder="Describe the objective desired conditions..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Effects"
            value={editData.effects}
            onChange={(e) => setEditData(prev => ({ ...prev, effects: e.target.value }))}
            placeholder="Describe the effects..."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Core Communication Narrative"
            value={editData.coreCommunicationNarrative}
            onChange={(e) => setEditData(prev => ({ ...prev, coreCommunicationNarrative: e.target.value }))}
            placeholder="Describe the core communication narrative..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit OAI Dialog */}
      <Dialog open={editOAIDialogOpen} onClose={() => setEditOAIDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit OAI - {editingOAI?.subOaiId || 'OAI'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="OAI Description"
            value={editingOAI?.oaiDescription || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, oaiDescription: e.target.value }))}
            multiline
            rows={3}
            sx={{ mt: 2, mb: 2 }}
          />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={editingOAI?.startDate || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={editingOAI?.endDate || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Domain Activities</Typography>
          <TextField
            fullWidth
            label="Land"
            value={editingOAI?.land || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, land: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Sea"
            value={editingOAI?.sea || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, sea: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Air"
            value={editingOAI?.air || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, air: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Cyber"
            value={editingOAI?.cyber || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, cyber: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Space"
            value={editingOAI?.space || ''}
            onChange={(e) => setEditingOAI(prev => ({ ...prev, space: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 'bold' }}>Decision Points</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decision Point 1 Label"
                value={editingOAI?.decisionPoint1Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint1Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisionPoint1Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint1Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decision Point 2 Label"
                value={editingOAI?.decisionPoint2Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint2Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisionPoint2Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint2Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decision Point 3 Label"
                value={editingOAI?.decisionPoint3Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint3Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisionPoint3Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisionPoint3Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 'bold' }}>Decisive Points</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decisive Point 1 Label"
                value={editingOAI?.decisivePoint1Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint1Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisivePoint1Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint1Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decisive Point 2 Label"
                value={editingOAI?.decisivePoint2Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint2Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisivePoint2Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint2Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Decisive Point 3 Label"
                value={editingOAI?.decisivePoint3Label || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint3Label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editingOAI?.decisivePoint3Date || ''}
                onChange={(e) => setEditingOAI(prev => ({ ...prev, decisivePoint3Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOAIDialogOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            try {
              await api.updateOAI(editingOAI.id, editingOAI);
              await loadDataset();
              setEditOAIDialogOpen(false);
            } catch (err) {
              setError('Failed to update OAI: ' + (err.response?.data?.error?.message || err.message));
            }
          }} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add New {addDialogType === 'oai' ? 'OAI' : 
                   addDialogType === 'loe' ? 'Line of Effort' :
                   addDialogType === 'imo' ? 'Intermediate Military Objective' :
                   addDialogType === 'objective' ? 'Objective' :
                   addDialogType === 'decisivePoint' ? 'Decisive Point' :
                   addDialogType === 'decisionPoint' ? 'Decision Point' : ''}
        </DialogTitle>
        <DialogContent>
          {addDialogType === 'oai' && (
            <>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Objective"
                    value={newItemData.objective || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, objective: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Objective ID"
                    value={newItemData.objectiveId || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, objectiveId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Line of Effort"
                    value={newItemData.loe || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, loe: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="LOE ID"
                    value={newItemData.loeId || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, loeId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Intermediate Military Objective"
                    value={newItemData.imo || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, imo: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="IMO ID"
                    value={newItemData.imoId || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, imoId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="OAI ID"
                    value={newItemData.subOaiId || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, subOaiId: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="OAI Description"
                    value={newItemData.oaiDescription || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, oaiDescription: e.target.value }))}
                    multiline
                    rows={3}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={newItemData.startDate || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={newItemData.endDate || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Domain Activities (Optional)</Typography>
              <TextField
                fullWidth
                label="Land"
                value={newItemData.land || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, land: e.target.value }))}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Sea"
                value={newItemData.sea || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, sea: e.target.value }))}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Air"
                value={newItemData.air || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, air: e.target.value }))}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Cyber"
                value={newItemData.cyber || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, cyber: e.target.value }))}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Space"
                value={newItemData.space || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, space: e.target.value }))}
                multiline
                rows={2}
              />
            </>
          )}

          {(addDialogType === 'decisivePoint' || addDialogType === 'decisionPoint') && (
            <>
              <TextField
                fullWidth
                select
                label="Select OAI"
                value={newItemData.oaiId || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, oaiId: e.target.value }))}
                sx={{ mt: 2, mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value=""></option>
                {oais.map(oai => (
                  <option key={oai.id} value={oai.id}>
                    {oai.subOaiId || 'OAI'} - {oai.oaiDescription?.substring(0, 50)}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Label"
                value={newItemData.label || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={newItemData.date || ''}
                onChange={(e) => setNewItemData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </>
          )}

          {(addDialogType === 'objective' || addDialogType === 'loe' || addDialogType === 'imo') && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Note: {addDialogType === 'objective' ? 'Objectives' : addDialogType === 'loe' ? 'Lines of Effort' : 'IMOs'} are currently created automatically when adding OAIs. 
              You can add a new OAI with the desired {addDialogType} information.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              try {
                if (addDialogType === 'oai') {
                  await api.createOAI(datasetId, newItemData);
                  await loadDataset();
                  setAddDialogOpen(false);
                } else if (addDialogType === 'decisivePoint' || addDialogType === 'decisionPoint') {
                  // Find the OAI and add the point to it
                  const oai = oais.find(o => o.id === newItemData.oaiId);
                  if (oai) {
                    // Find next available point slot
                    const updates = {};
                    if (addDialogType === 'decisivePoint') {
                      if (!oai.decisivePoint1Date) {
                        updates.decisivePoint1Label = newItemData.label;
                        updates.decisivePoint1Date = newItemData.date;
                      } else if (!oai.decisivePoint2Date) {
                        updates.decisivePoint2Label = newItemData.label;
                        updates.decisivePoint2Date = newItemData.date;
                      } else if (!oai.decisivePoint3Date) {
                        updates.decisivePoint3Label = newItemData.label;
                        updates.decisivePoint3Date = newItemData.date;
                      }
                    } else {
                      if (!oai.decisionPoint1Date) {
                        updates.decisionPoint1Label = newItemData.label;
                        updates.decisionPoint1Date = newItemData.date;
                      } else if (!oai.decisionPoint2Date) {
                        updates.decisionPoint2Label = newItemData.label;
                        updates.decisionPoint2Date = newItemData.date;
                      } else if (!oai.decisionPoint3Date) {
                        updates.decisionPoint3Label = newItemData.label;
                        updates.decisionPoint3Date = newItemData.date;
                      }
                    }
                    await api.updateOAI(newItemData.oaiId, updates);
                    await loadDataset();
                    setAddDialogOpen(false);
                  }
                }
              } catch (err) {
                setError('Failed to add item: ' + (err.response?.data?.error?.message || err.message));
              }
            }}
            variant="contained" 
            color="primary"
            disabled={
              (addDialogType === 'oai' && (!newItemData.subOaiId || !newItemData.oaiDescription)) ||
              ((addDialogType === 'decisivePoint' || addDialogType === 'decisionPoint') && (!newItemData.oaiId || !newItemData.label || !newItemData.date))
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decision/Decisive Points Dialog */}
      <Dialog 
        open={decisionPointsDialogOpen} 
        onClose={() => setDecisionPointsDialogOpen(false)} 
        maxWidth={compactView ? "lg" : "md"}
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ListIcon />
              Decision & Decisive Points
            </Box>
            <ToggleButtonGroup
              value={compactView ? 'compact' : 'list'}
              exclusive
              onChange={(e, value) => value && setCompactView(value === 'compact')}
              size="small"
            >
              <ToggleButton value="list">List View</ToggleButton>
              <ToggleButton value="compact">Compact View</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogTitle>
        <DialogContent>
          {(() => {
            const points = getDecisionPoints();
            if (points.length === 0) {
              return (
                <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  No decision or decisive points found
                </Typography>
              );
            }

            // Compact View - Two Column Layout
            if (compactView) {
              const decisivePoints = points.filter(p => p.type === 'Decisive');
              const decisionPoints = points.filter(p => p.type === 'Decision');
              
              return (
                <Box sx={{ display: 'flex', gap: 3 }}>
                  {/* Decisive Points Column */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#B8860B', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.2rem' }}>▲</span> Decisive Points ({decisivePoints.length})
                    </Typography>
                    {decisivePoints.map((point, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          mb: 1, 
                          p: 1, 
                          bgcolor: '#FFF9E6',
                          border: '1px solid #B8860B',
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          lineHeight: 1.3
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {point.label}
                          </Typography>
                          {point.date && (
                            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                              {new Date(point.date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                          {point.oaiId}: {point.oaiDescription || point.oai}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Decision Points Column */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1E90FF', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.2rem' }}>★</span> Decision Points ({decisionPoints.length})
                    </Typography>
                    {decisionPoints.map((point, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          mb: 1, 
                          p: 1, 
                          bgcolor: '#E6F3FF',
                          border: '1px solid #1E90FF',
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          lineHeight: 1.3
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {point.label}
                          </Typography>
                          {point.date && (
                            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                              {new Date(point.date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                          {point.oaiId}: {point.oaiDescription || point.oai}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            }

            // List View - Hierarchical Layout
            let currentObjective = null;
            let currentLOE = null;
            let currentIMO = null;

            return (
              <Box>
                {points.map((point, index) => {
                  const showObjective = point.objectiveId !== currentObjective;
                  const showLOE = point.loeId !== currentLOE || showObjective;
                  const showIMO = point.imoId !== currentIMO || showLOE;

                  if (showObjective) currentObjective = point.objectiveId;
                  if (showLOE) currentLOE = point.loeId;
                  if (showIMO) currentIMO = point.imoId;

                  return (
                    <Box key={index}>
                      {showObjective && (
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mt: index > 0 ? 3 : 0, 
                            mb: 1, 
                            color: '#3C5A3C', 
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        >
                          {point.objectiveId} - {point.objective}
                        </Typography>
                      )}
                      {showLOE && (
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            ml: 2, 
                            mt: 1, 
                            mb: 0.5, 
                            color: '#8B7355',
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                          }}
                        >
                          {point.loeId} - {point.loe}
                        </Typography>
                      )}
                      {showIMO && (
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            ml: 4, 
                            mt: 0.5, 
                            mb: 0.5, 
                            color: '#666',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          {point.imoId} - {point.imo}
                        </Typography>
                      )}
                      <Box 
                        sx={{ 
                          ml: 6, 
                          mb: 1, 
                          p: 1.5, 
                          bgcolor: point.type === 'Decisive' ? '#FFF9E6' : '#E6F3FF',
                          borderLeft: `4px solid ${point.type === 'Decisive' ? '#B8860B' : '#1E90FF'}`,
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip 
                            label={point.type === 'Decisive' ? '▲ DP' + point.number : '★ DC' + point.number}
                            size="small"
                            sx={{ 
                              bgcolor: '#FFD700', 
                              color: '#000', 
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {point.label}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', color: '#666', ml: 0.5 }}>
                          {point.oaiId} - {point.oai}
                        </Typography>
                        {point.oaiDescription && (
                          <Typography variant="body2" sx={{ display: 'block', color: '#444', ml: 0.5, mt: 0.5, fontStyle: 'italic' }}>
                            {point.oaiDescription}
                          </Typography>
                        )}
                        {point.date && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#888', ml: 0.5, mt: 0.5 }}>
                            Date: {new Date(point.date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionPointsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Visualization;
