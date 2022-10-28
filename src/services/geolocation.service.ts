import { City, Coordinates } from "../models/city";
import { ANGLE_THRESHOLD } from "../constants";

export class GeolocationService {
  private cities: City[] = [];

  /**
   * Initializes data
   *
   * @param {string} citiesUrl url to cities
   * @returns {Promise<void>}
   */
  async init(citiesUrl: string): Promise<void> {
    this.cities = await this.loadCities(citiesUrl);
  }


  /**
   * Load raw cities
   *
   * @param {City[]} cities cities to load
   */
  loadRawCities(cities: City[]): void {
    this.cities = cities;
  }

  /**
   * Get closest city in direction
   *
   * @param {Coordinates} userLocation user location
   * @param {number} direction direction to search
   */
  predictCity(userLocation: Coordinates, direction: number): {
    capital: string,
    distance: number,
  } | null {
    const candidates = this.cities
      .map((city) => {
        const cityDirection = this.getDirection(userLocation, city.coordinates);

        return {
          ...city,
          directionDiff: Math.abs(cityDirection - direction) % 360,
        }
      })
      // filter out cities that are not in direction
      .filter((candidate) => candidate.directionDiff < ANGLE_THRESHOLD);

    if (candidates.length === 0) {
      return null;
    }

    const smallestDiff = Math.min(...candidates.map((candidate) => candidate.directionDiff));

    const predictedCity = candidates
      .filter((candidate) => candidate.directionDiff === smallestDiff)
      .map((city) => ({
        ...city,
        distance: this.getDistance(userLocation, city.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    // round the distance
    predictedCity.distance = Math.round(predictedCity.distance)

    return predictedCity;
  }


  /**
   * Load cities from url
   *
   * @private
   * @param {string} citiesUrl url to load cities
   * @returns {Promise<City[]>} cities
   */
  private async loadCities(citiesUrl: string): Promise<City[]> {
    const response = await fetch(citiesUrl)

    const data = await response.json();

    return data.map((city: {
      geometry: {
        coordinates: [number, number]
      },
      properties: {
        capital: string,
      }
    }) => ({
      coordinates: {
        longitude: city.geometry.coordinates[0],
        latitude: city.geometry.coordinates[1],
      },
      capital: city.properties.capital
    } as City));
  }

  /**
   * Get direction from user location to city
   *
   * @param {Coordinates} userLocation
   * @param {Coordinates} coordinates
   * @private
   *
   * @returns {number} direction in degrees
   */
  private getDirection(userLocation: Coordinates, coordinates: Coordinates): number {
    const x = coordinates.longitude - userLocation.longitude;
    const y = coordinates.latitude - userLocation.latitude;

    return Math.atan2(y, x) * 180 / Math.PI;
  }

  /**
   * Get distance from user location to city using Haversine formula
   * see more: https://en.wikipedia.org/wiki/Haversine_formula
   *
   * @param {Coordinates} userLocation user location
   * @param {Coordinates} coordinates city coordinates
   * @private
   *
   * @returns {number} distance in km
   */
  private getDistance(userLocation: Coordinates, coordinates: Coordinates): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(coordinates.latitude - userLocation.latitude);  // deg2rad below
    const dLon = this.deg2rad(coordinates.longitude - userLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(userLocation.latitude)) * Math.cos(this.deg2rad(coordinates.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     // Distance in km
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}
