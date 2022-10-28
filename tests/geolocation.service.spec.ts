import { beforeEach, describe, expect, it } from "vitest";
import { City } from "../src/models/city";
import { GeolocationService } from "../src/services/geolocation.service";

describe("GeolocationService", () => {
  let service: GeolocationService;

  describe('predictCity', () => {
    describe('directionTest', () => {
      beforeEach(() => {
        service = new GeolocationService();

        service.loadRawCities(directionTestCities);
      });

      it("should predict north", () => {
        const userLocation = {
          latitude: -73.984,
          longitude: 40.76,
        };
        const city = service.predictCity(userLocation, 0);

        expect(city?.capital).toBe('north');
      });

      it("should predict east", () => {
        const userLocation = {
          latitude: -73.984,
          longitude: 40.76,
        };
        const city = service.predictCity(userLocation, 90);

        expect(city?.capital).toBe('east');
      });

      it("should predict south", () => {
        const userLocation = {
          latitude: -73.984,
          longitude: 40.76,
        };
        const city = service.predictCity(userLocation, 180);

        expect(city?.capital).toBe('south');
      });

      it("should predict west", () => {
        const userLocation = {
          latitude: -73.984,
          longitude: 40.76,
        };
        const city = service.predictCity(userLocation, 270);

        expect(city?.capital).toBe('west');
      });
    });

    describe('takesClosestCity with distance', () => {
      beforeEach(() => {
        service = new GeolocationService();

        service.loadRawCities(closestTestCities);
      });

      it('should predict 1km north', () => {
        const userLocation = {
          longitude: 49.84758,
          latitude: 24.05954,
        };
        const city = service.predictCity(userLocation, 0)!;

        expect(city.capital).toBe('1km');

        expect(city.distance).toBe(1);
      });
    });
  });
});

const directionTestCities: City[] = [
  {
    capital: 'north',
    coordinates: {
      longitude: 40.788601,
      latitude: -73.984,
    }
  },
  {
    capital: 'east',
    coordinates: {
      longitude: 40.759937,
      latitude: -73.9458984,
    }
  },
  {
    capital: 'south',
    coordinates: {
      longitude: 40.7311399,
      latitude: -73.984,
    }
  },
  {
    capital: 'west',
    coordinates: {
      longitude: 40.7599937,
      latitude: -74.0221016,
    }
  }
];

const closestTestCities: City[] = [
  {
    capital: '1km',
    coordinates: {
      longitude: 49.85744,
      latitude: 24.05960,
    }
  },
  {
    capital: '2km',
    coordinates: {
      longitude: 49.86566,
      latitude: 24.05991,
    }
  }
];
