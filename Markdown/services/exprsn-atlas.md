# Exprsn Atlas (exprsn-atlas)

**Version:** 1.0.0
**Port:** 3019
**Status:** 🚧 In Development
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Atlas** is a mapping and location services platform that provides geospatial features, location-based search, and map visualization.

---

## Key Features (Planned)

### Mapping
- **Interactive Maps** - Leaflet/Mapbox integration
- **Custom Markers** - User-defined map markers
- **Geofencing** - Location-based triggers
- **Route Planning** - Navigation assistance
- **Heatmaps** - Activity density visualization

### Location Services
- **Geocoding** - Address to coordinates
- **Reverse Geocoding** - Coordinates to address
- **Place Search** - Find nearby places
- **Distance Calculation** - Between locations
- **Location Sharing** - Share current location

---

## API Endpoints (Planned)

#### `POST /api/geocode`
Geocode address.

#### `POST /api/search/nearby`
Search nearby locations.

#### `POST /api/routes`
Calculate route.

---

## Configuration

```env
PORT=3019
DB_NAME=exprsn_atlas
MAPBOX_API_KEY=your-key
DEFAULT_MAP_CENTER=37.7749,-122.4194
```

---

## Status

🚧 **In Development** - Not yet production-ready

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
