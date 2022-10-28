export class GeolocationService {
  private _geoLocation: Geolocation;

  constructor() {
    this._geoLocation = navigator.geolocation;
  }

  get geoLocation() {
    return this._geoLocation;
  }

  set geoLocation(value) {
    this._geoLocation = value;
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      this._geoLocation.getCurrentPosition((position) => {
        resolve(position);
      }, (error) => {
        reject(error);
      });
    });
  }
}
