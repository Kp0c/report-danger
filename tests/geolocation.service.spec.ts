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
          latitude: 49.836832,
          longitude: 24.023606,
        };
        const city = service.predictCity(userLocation, 0);

        expect(city?.capital).toBe('north');
      });

      it("should predict east", () => {
        const userLocation = {
          latitude: 49.836832,
          longitude: 24.023606,
        };
        const city = service.predictCity(userLocation, 90);

        expect(city?.capital).toBe('east');
      });

      it("should predict south", () => {
        const userLocation = {
          latitude: 49.836832,
          longitude: 24.023606,
        };
        const city = service.predictCity(userLocation, 180);

        expect(city?.capital).toBe('south');
      });

      it("should predict west", () => {
        const userLocation = {
          latitude: 49.836832,
          longitude: 24.023606,
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
          latitude: 49.836832,
          longitude: 24.023606,
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
      latitude: 50.836832,
      longitude: 24.023606,
    }
  },
  {
    capital: 'east',
    coordinates: {
      latitude: 49.836832,
      longitude: 25.023606,
    }
  },
  {
    capital: 'south',
    coordinates: {
      latitude: 48.836832,
      longitude: 24.023606,
    }
  },
  {
    capital: 'west',
    coordinates: {
      latitude: 49.836832,
      longitude: 23.023606,
    }
  }
];

const closestTestCities: City[] = [
  {
    capital: '1km',
    coordinates: {
      latitude: 49.846832,
      longitude: 24.023606,
    }
  },
  {
    capital: '2km',
    coordinates: {
      latitude: 49.856832,
      longitude: 24.023606,
    }
  }
];
