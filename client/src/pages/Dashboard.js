import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  AccountCircle,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    problemStatement: '',
    currentOE: '',
    desiredFutureState: '',
    objectiveDesiredConditions: '',
    effects: '',
    coreCommunicationNarrative: ''
  });
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (err) {
      setError('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.name) {
        setUploadData({ ...uploadData, name: file.name.replace('.csv', '') });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', uploadData.name);
    formData.append('description', uploadData.description);
    formData.append('problemStatement', uploadData.problemStatement);
    formData.append('currentOE', uploadData.currentOE);
    formData.append('desiredFutureState', uploadData.desiredFutureState);

    try {
      await api.uploadDataset(formData);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ 
        name: '', 
        description: '', 
        problemStatement: '', 
        currentOE: '', 
        desiredFutureState: '' 
      });
      setError('');
      loadDatasets();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dataset?')) {
      try {
        await api.deleteDataset(id);
        loadDatasets();
      } catch (err) {
        setError('Failed to delete dataset');
      }
    }
  };

  const handleExport = async (id, name) => {
    try {
      const blob = await api.exportDataset(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export dataset');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      in_review: 'info',
      approved: 'success',
      archived: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Operational Approach Visualization
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.rank} {user?.firstName} {user?.lastName}
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              My Operational Approaches
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload New Dataset
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {datasets.map((dataset) => (
              <Grid item xs={12} sm={6} md={4} key={dataset.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {dataset.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {dataset.description || 'No description'}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={dataset.status}
                        color={getStatusColor(dataset.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip label={`${dataset.oaiCount} OAIs`} size="small" />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      Created: {new Date(dataset.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/visualization/${dataset.id}`)}
                    >
                      Visualize
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleExport(dataset.id, dataset.name)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {datasets.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No datasets yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Upload your first operational approach CSV to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Dataset
              </Button>
            </Box>
          )}
        </Box>
      </Container>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Operational Approach Dataset</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Dataset Name"
            value={uploadData.name}
            onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={uploadData.description}
            onChange={(e) =>
              setUploadData({ ...uploadData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Problem Statement"
            value={uploadData.problemStatement}
            onChange={(e) =>
              setUploadData({ ...uploadData, problemStatement: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe the problem this operational approach addresses..."
          />
          <TextField
            fullWidth
            label="Current Operational Environment"
            value={uploadData.currentOE}
            onChange={(e) =>
              setUploadData({ ...uploadData, currentOE: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe the current situation..."
          />
          <TextField
            fullWidth
            label="Desired Future State"
            value={uploadData.desiredFutureState}
            onChange={(e) =>
              setUploadData({ ...uploadData, desiredFutureState: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe the desired end state..."
          />
          <TextField
            fullWidth
            label="Objective Desired Conditions"
            value={uploadData.objectiveDesiredConditions}
            onChange={(e) =>
              setUploadData({ ...uploadData, objectiveDesiredConditions: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe the objective desired conditions..."
          />
          <TextField
            fullWidth
            label="Effects"
            value={uploadData.effects}
            onChange={(e) =>
              setUploadData({ ...uploadData, effects: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe the effects..."
          />
          <TextField
            fullWidth
            label="Core Communication Narrative"
            value={uploadData.coreCommunicationNarrative}
            onChange={(e) =>
              setUploadData({ ...uploadData, coreCommunicationNarrative: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe the core communication narrative..."
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
            startIcon={<UploadIcon />}
          >
            {selectedFile ? selectedFile.name : 'Select CSV File'}
            <input type="file" hidden accept=".csv" onChange={handleFileSelect} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard;
