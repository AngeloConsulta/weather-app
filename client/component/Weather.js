'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  TextField,
  Button,
  Container,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Opacity,
  Air,
  Visibility,
  LocationOn,
  Search,
  Refresh,
  Settings,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';

// Safe clipboard utility
const safeCopyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.warn('Copy to clipboard failed:', error);
    return false;
  }
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');
  const [localApiKey, setLocalApiKey] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [province, setProvince] = useState(''); // New state for province/state

  // Safe client-side initialization
  useEffect(() => {
    try {
      setIsClient(true);
      const storedKey = localStorage.getItem('openweather_api_key');
      setLocalApiKey(storedKey);
    } catch (error) {
      console.warn('Failed to initialize client state:', error);
      setIsClient(true); // Still set to true to prevent infinite loading
    }
  }, []);

  // Dynamic API key management with SSR safety
  const getApiKey = useCallback(() => {
    try {
      const envKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      return envKey || localApiKey || null;
    } catch (error) {
      console.warn('Failed to get API key:', error);
      return null;
    }
  }, [localApiKey]);

  const setApiKey = useCallback((key) => {
    try {
      if (isClient && key) {
        localStorage.setItem('openweather_api_key', key);
        setLocalApiKey(key);
      }
    } catch (error) {
      console.warn('Failed to set API key:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save API key to local storage',
        severity: 'warning'
      });
    }
  }, [isClient]);

  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // Validate API key after client-side initialization
  useEffect(() => {
    if (!isClient) return;

    const validateApiKey = async () => {
      try {
        const currentApiKey = getApiKey();
        if (!currentApiKey) {
          setApiKeyStatus('missing');
          return;
        }

        const response = await axios.get(`${BASE_URL}/weather`, {
          params: {
            q: 'London',
            appid: currentApiKey,
            units: 'metric'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (response.status === 200) {
          setApiKeyStatus('valid');
          fetchWeatherData();
        }
      } catch (err) {
        console.warn('API key validation failed:', err);
        if (err.response?.status === 401) {
          setApiKeyStatus('invalid');
        } else {
          setApiKeyStatus('error');
        }
      }
    };

    // Add delay to prevent rapid API calls during hydration
    const timer = setTimeout(validateApiKey, 100);
    return () => clearTimeout(timer);
  }, [isClient, localApiKey, getApiKey]);

  // Fetch province/state after weather data is fetched
  const fetchProvince = useCallback(async (lat, lon, apiKey) => {
    try {
      const geoResponse = await axios.get('https://api.openweathermap.org/geo/1.0/reverse', {
        params: {
          lat,
          lon,
          limit: 1,
          appid: apiKey
        },
        timeout: 10000
      });
      const provinceName = geoResponse.data[0]?.state || '';
      setProvince(provinceName);
    } catch (error) {
      console.warn('Failed to fetch province/state:', error);
      setProvince('');
    }
  }, []);

  // Update fetchWeatherData to also fetch province/state
  const fetchWeatherData = useCallback(async (cityName = city) => {
    try {
      const currentApiKey = getApiKey();
      
      if (!currentApiKey) {
        setError('API key not configured. Please add your OpenWeather API key.');
        setApiKeyStatus('missing');
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch current weather
      const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
        params: {
          q: cityName,
          appid: currentApiKey,
          units: 'metric'
        },
        timeout: 15000
      });

      // Fetch 5-day forecast
      const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          q: cityName,
          appid: currentApiKey,
          units: 'metric'
        },
        timeout: 15000
      });

      setWeatherData({
        current: weatherResponse.data,
        forecast: forecastResponse.data
      });
      setApiKeyStatus('valid');

      // Fetch province/state using coordinates
      const { lat, lon } = weatherResponse.data.coord;
      fetchProvince(lat, lon, currentApiKey);
    } catch (err) {
      console.error('Weather API Error:', err);
      setProvince('');
      
      if (err.response?.status === 401) {
        setError('Invalid API key. Please check your OpenWeather API configuration.');
        setApiKeyStatus('invalid');
      } else if (err.response?.status === 404) {
        setError('City not found. Please check the spelling and try again.');
      } else if (err.response?.status === 429) {
        setError('API rate limit exceeded. Please try again later.');
      } else if (err.response?.status >= 500) {
        setError('OpenWeather service is temporarily unavailable. Please try again later.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your internet connection and try again.');
      } else {
        setError('Failed to fetch weather data. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [city, getApiKey, fetchProvince]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    try {
      if (searchInput.trim()) {
        setCity(searchInput.trim());
        fetchWeatherData(searchInput.trim());
        setSearchInput('');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to search for city',
        severity: 'error'
      });
    }
  }, [searchInput, fetchWeatherData]);

  const handleApiKeySubmit = useCallback(() => {
    try {
      if (tempApiKey.trim()) {
        setApiKey(tempApiKey.trim());
        setApiKeyDialog(false);
        setTempApiKey('');
        
        // Re-validate and fetch data with delay
        setTimeout(() => {
          const newApiKey = getApiKey();
          if (newApiKey) {
            setApiKeyStatus('checking');
            fetchWeatherData();
          }
        }, 200);
      }
    } catch (error) {
      console.error('API key submission error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save API key',
        severity: 'error'
      });
    }
  }, [tempApiKey, setApiKey, getApiKey, fetchWeatherData]);

  const getWeatherIcon = useCallback((weatherCode) => {
    try {
      const code = weatherCode.toString();
      if (code.startsWith('2')) return '⚡'; // Thunderstorm
      if (code.startsWith('3')) return '🌧️'; // Drizzle
      if (code.startsWith('5')) return '🌧️'; // Rain
      if (code.startsWith('6')) return '❄️'; // Snow
      if (code.startsWith('7')) return '🌫️'; // Atmosphere
      if (code === '800') return '☀️'; // Clear
      if (code.startsWith('8')) return '☁️'; // Clouds
      return '🌤️';
    } catch (error) {
      console.warn('Weather icon error:', error);
      return '🌤️';
    }
  }, []);

  const formatDate = useCallback((timestamp) => {
    try {
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Unknown';
    }
  }, []);

  const formatTime = useCallback((timestamp) => {
    try {
      return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Time formatting error:', error);
      return 'Unknown';
    }
  }, []);

  // API Key Status Component
  const ApiKeyStatus = useCallback(() => {
    // Don't show anything during initial SSR/client hydration
    if (!isClient) {
      return null;
    }

    if (apiKeyStatus === 'checking') {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            Validating API key...
          </Box>
        </Alert>
      );
    }

    if (apiKeyStatus === 'missing') {
      return (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setApiKeyDialog(true)}
              startIcon={<Settings />}
            >
              Configure
            </Button>
          }
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Warning />
            OpenWeather API key not configured
          </Box>
        </Alert>
      );
    }

    if (apiKeyStatus === 'invalid') {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setApiKeyDialog(true)}
              startIcon={<Settings />}
            >
              Fix
            </Button>
          }
        >
          Invalid API key. Please check your OpenWeather API configuration.
        </Alert>
      );
    }

    return null;
  }, [isClient, apiKeyStatus]);

  // Show loading during initial client-side initialization
  if (!isClient) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (loading && !weatherData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Define style objects for city, province, and country
  const cityStyle = {
    fontWeight: 'bold',
    fontSize: '2rem',
    color: '#1a237e',
    textShadow: '0 1px 4px #fff',
    display: 'inline'
  };
  const provinceStyle = {
    fontWeight: 500,
    fontSize: '1.2rem',
    color: '#3949ab',
    marginLeft: '0.5rem',
    display: 'inline'
  };
  const countryStyle = {
    fontWeight: 400,
    fontSize: '1.1rem',
    color: '#5c6bc0',
    marginLeft: '0.5rem',
    display: 'inline'
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* API Key Status */}
      <ApiKeyStatus />

      {/* Search Form */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} display="flex" gap={2}>
          <TextField
            fullWidth
            label="Search for a city"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter city name..."
            variant="outlined"
            size="small"
            disabled={!isClient || apiKeyStatus !== 'valid'}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<Search />}
            disabled={!isClient || !searchInput.trim() || apiKeyStatus !== 'valid'}
          >
            Search
          </Button>
          <IconButton
            onClick={() => fetchWeatherData()}
            color="primary"
            title="Refresh"
            disabled={!isClient || apiKeyStatus !== 'valid'}
          >
            <Refresh />
          </IconButton>
          <IconButton
            onClick={() => setApiKeyDialog(true)}
            color="secondary"
            title="API Settings"
          >
            <Settings />
          </IconButton>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Weather Data Display */}
      {weatherData && !error && apiKeyStatus === 'valid' && (
        <>
          {/* Current Weather */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <span style={cityStyle}>{weatherData.current.name}</span>
                {province && <span style={provinceStyle}>, {province}</span>}
                <span style={countryStyle}>, {weatherData.current.sys.country}</span>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box textAlign="center">
                    <Typography variant="h1" component="div" sx={{ fontSize: '4rem' }}>
                      {getWeatherIcon(weatherData.current.weather[0].id)}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                      {Math.round(weatherData.current.main.temp)}°C
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {weatherData.current.weather[0].description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Feels like {Math.round(weatherData.current.main.feels_like)}°C
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Opacity color="primary" sx={{ mr: 1 }} />
                        <Typography>Humidity</Typography>
                      </Box>
                      <Typography variant="h6">{weatherData.current.main.humidity}%</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Air color="primary" sx={{ mr: 1 }} />
                        <Typography>Wind Speed</Typography>
                      </Box>
                      <Typography variant="h6">{weatherData.current.wind.speed} m/s</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Visibility color="primary" sx={{ mr: 1 }} />
                        <Typography>Visibility</Typography>
                      </Box>
                      <Typography variant="h6">{(weatherData.current.visibility / 1000).toFixed(1)} km</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <WbSunny color="primary" sx={{ mr: 1 }} />
                        <Typography>Pressure</Typography>
                      </Box>
                      <Typography variant="h6">{weatherData.current.main.pressure} hPa</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {formatTime(weatherData.current.dt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 5-Day Forecast */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="h3" mb={2}>
                5-Day Forecast
              </Typography>
              <Grid container spacing={2}>
                {weatherData.forecast.list
                  .filter((item, index) => index % 8 === 0) // Get one forecast per day
                  .slice(0, 5)
                  .map((forecast, index) => (
                    <Grid item xs={12} sm={6} md={2.4} key={index}>
                      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(forecast.dt)}
                        </Typography>
                        <Typography variant="h4" sx={{ my: 1 }}>
                          {getWeatherIcon(forecast.weather[0].id)}
                        </Typography>
                        <Typography variant="h6">
                          {Math.round(forecast.main.temp)}°C
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {forecast.weather[0].description}
                        </Typography>
                        <Box mt={1}>
                          <Chip
                            size="small"
                            label={`${Math.round(forecast.main.humidity)}%`}
                            icon={<Opacity />}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* API Key Configuration Dialog */}
      <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure OpenWeather API Key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To use this weather app, you need an OpenWeather API key. You can get one for free at{' '}
            <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer">
              openweathermap.org
            </a>
          </Typography>
          <TextField
            fullWidth
            label="API Key"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="Enter your OpenWeather API key"
            variant="outlined"
            type="password"
            helperText="This will be stored locally in your browser for development purposes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog(false)}>Cancel</Button>
          <Button onClick={handleApiKeySubmit} variant="contained" disabled={!tempApiKey.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Weather;
