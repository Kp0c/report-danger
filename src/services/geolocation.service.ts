import { City, Coordinates } from "../models/city";
import { ANGLE_THRESHOLD } from "../constants";
import citiesJson from '../data/cities.json?raw';

/**
 * Service to work with cities and their location
 */
export class GeolocationService {
  private cities: City[] = [];

  /**
   * constructor
   */
  constructor() {
    this.cities = this.loadCities();
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
   *
   * @returns {capital: string, distance: number} city and distance
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
   * Load cities
   *
   * @private
   * @returns {City[]} cities
   */
  private loadCities(): City[] {
    const data = JSON.parse(citiesJson);

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

    const degress = Math.atan2(y, x) * 180 / Math.PI;

    const northDegrees = 90 - degress;

    return northDegrees < 0 ? 360 + northDegrees : northDegrees;
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

  /**
   * Convert degrees to radians
   * @param {number} deg degrees
   * @private
   *
   * @returns {number} radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}
