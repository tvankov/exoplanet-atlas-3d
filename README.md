# Exoplanet Atlas 3D

Interactive 3D map of all confirmed exoplanets and their host stars, placed at their real positions relative to the Sun.

Data source: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), table `pscomppars`.

## Status

Phase 1 (data): raw download works. Cleaning and coordinate conversion are next.

## Usage

```bash
python src/fetch_data.py
```

Each run saves a dated snapshot to `data/raw/pscomppars_<date>.csv`.
