import numpy as np

def generate_nearby_grid(lat, lon, step=0.005, size=5):
    """
    Generate dense surrounding grid
    step = distance between points
    size = grid radius
    """

    points = []

    for i in range(-size, size + 1):
        for j in range(-size, size + 1):

            new_lat = lat + (i * step)
            new_lon = lon + (j * step)

            points.append((round(new_lat, 6), round(new_lon, 6)))

    return points