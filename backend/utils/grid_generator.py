import numpy as np

def generate_city_grid():

    lat_min = 12.95
    lat_max = 13.20

    lon_min = 80.15
    lon_max = 80.35

    step = 0.08  # grid spacing (~2km)

    latitudes = np.arange(lat_min, lat_max, step)
    longitudes = np.arange(lon_min, lon_max, step)

    grid = []

    for lat in latitudes:
        for lon in longitudes:
            grid.append((round(lat,4), round(lon,4)))

    return grid