export interface CityGeo {
  name: string;
  lat: number;
  lng: number;
}

export interface StateGeo {
  name: string;
  code: string;
  cities: CityGeo[];
}

export const INDIAN_STATES: StateGeo[] = [
  {
    name: 'Maharashtra',
    code: 'MH',
    cities: [
      { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
      { name: 'Thane', lat: 19.2183, lng: 72.9781 },
      { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    ],
  },
  {
    name: 'Delhi',
    code: 'DL',
    cities: [
      { name: 'Delhi', lat: 28.6139, lng: 77.209 },
      { name: 'Central Delhi', lat: 28.6506, lng: 77.2303 },
      { name: 'Rohini', lat: 28.7383, lng: 77.1086 },
      { name: 'South Delhi', lat: 28.4817, lng: 77.1873 },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    cities: [
      { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
      { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
      { name: 'Mangaluru', lat: 12.9141, lng: 74.856 },
      { name: 'Hubballi', lat: 15.3647, lng: 75.124 },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    cities: [
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
      { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
      { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
    ],
  },
  {
    name: 'Telangana',
    code: 'TG',
    cities: [
      { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
      { name: 'Warangal', lat: 17.9689, lng: 79.5941 },
      { name: 'Nizamabad', lat: 18.6725, lng: 78.0941 },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    cities: [
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      { name: 'Surat', lat: 21.1702, lng: 72.8311 },
      { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
      { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    cities: [
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Howrah', lat: 22.5958, lng: 88.2636 },
      { name: 'Siliguri', lat: 26.7271, lng: 88.3953 },
      { name: 'Durgapur', lat: 23.5204, lng: 87.3119 },
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    cities: [
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
      { name: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
      { name: 'Kota', lat: 25.2138, lng: 75.8648 },
      { name: 'Udaipur', lat: 24.5854, lng: 73.7125 },
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    cities: [
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
      { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
      { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
      { name: 'Agra', lat: 27.1767, lng: 78.0081 },
      { name: 'Prayagraj', lat: 25.4358, lng: 81.8463 },
      { name: 'Noida', lat: 28.5355, lng: 77.391 },
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    cities: [
      { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
      { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    cities: [
      { name: 'Indore', lat: 22.7196, lng: 75.8577 },
      { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
      { name: 'Jabalpur', lat: 23.1815, lng: 79.9864 },
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    cities: [
      { name: 'Ludhiana', lat: 30.901, lng: 75.8573 },
      { name: 'Amritsar', lat: 31.634, lng: 74.8723 },
      { name: 'Jalandhar', lat: 31.326, lng: 75.5762 },
    ],
  },
  {
    name: 'Haryana',
    code: 'HR',
    cities: [
      { name: 'Gurugram', lat: 28.4595, lng: 77.0266 },
      { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
      { name: 'Panipat', lat: 29.3909, lng: 76.9635 },
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    cities: [
      { name: 'Patna', lat: 25.5941, lng: 85.1376 },
      { name: 'Gaya', lat: 24.7914, lng: 85.0002 },
      { name: 'Bhagalpur', lat: 25.2425, lng: 86.9842 },
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    cities: [
      { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
      { name: 'Vijayawada', lat: 16.5062, lng: 80.648 },
      { name: 'Guntur', lat: 16.3067, lng: 80.4365 },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    cities: [
      { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
      { name: 'Cuttack', lat: 20.4625, lng: 85.883 },
      { name: 'Rourkela', lat: 22.2604, lng: 84.8536 },
    ],
  },
  {
    name: 'Assam',
    code: 'AS',
    cities: [
      { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
      { name: 'Silchar', lat: 24.8333, lng: 92.7789 },
      { name: 'Dibrugarh', lat: 27.4728, lng: 94.912 },
    ],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    cities: [
      { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
      { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029 },
      { name: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
    ],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    cities: [
      { name: 'Raipur', lat: 21.2514, lng: 81.6296 },
      { name: 'Bhilai', lat: 21.1938, lng: 81.3509 },
      { name: 'Bilaspur', lat: 22.0797, lng: 82.1409 },
    ],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    cities: [
      { name: 'Dehradun', lat: 30.3165, lng: 78.0322 },
      { name: 'Haridwar', lat: 29.9457, lng: 78.1642 },
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    cities: [
      { name: 'Panaji', lat: 15.4909, lng: 73.8278 },
      { name: 'Margao', lat: 15.2832, lng: 73.9862 },
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    cities: [
      { name: 'Shimla', lat: 31.1048, lng: 77.1734 },
      { name: 'Dharamshala', lat: 32.219, lng: 76.3234 },
    ],
  },
  {
    name: 'Jammu & Kashmir',
    code: 'JK',
    cities: [
      { name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
      { name: 'Jammu', lat: 32.7266, lng: 74.857 },
    ],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    cities: [
      { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    ],
  },
  {
    name: 'Puducherry',
    code: 'PY',
    cities: [
      { name: 'Puducherry', lat: 11.9416, lng: 79.8083 },
    ],
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    cities: [
      { name: 'Port Blair', lat: 11.6234, lng: 92.7265 },
    ],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    cities: [
      { name: 'Itanagar', lat: 27.0844, lng: 93.6053 },
    ],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DNHDD',
    cities: [
      { name: 'Daman', lat: 20.3974, lng: 72.8328 },
      { name: 'Silvassa', lat: 20.2763, lng: 73.0083 },
    ],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    cities: [
      { name: 'Leh', lat: 34.1526, lng: 77.5771 },
      { name: 'Kargil', lat: 34.5539, lng: 76.1349 },
    ],
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    cities: [
      { name: 'Kavaratti', lat: 10.5667, lng: 72.6417 },
    ],
  },
  {
    name: 'Manipur',
    code: 'MN',
    cities: [
      { name: 'Imphal', lat: 24.8170, lng: 93.9368 },
    ],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    cities: [
      { name: 'Shillong', lat: 25.5788, lng: 91.8933 },
    ],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    cities: [
      { name: 'Aizawl', lat: 23.7271, lng: 92.7176 },
    ],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    cities: [
      { name: 'Kohima', lat: 25.6751, lng: 94.1086 },
      { name: 'Dimapur', lat: 25.9094, lng: 93.7266 },
    ],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    cities: [
      { name: 'Gangtok', lat: 27.3314, lng: 88.6138 },
    ],
  },
  {
    name: 'Tripura',
    code: 'TR',
    cities: [
      { name: 'Agartala', lat: 23.8315, lng: 91.2868 },
    ],
  },
];

export function getCitiesForState(stateName: string): CityGeo[] {
  const match = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
  return match ? match.cities : INDIAN_STATES[0].cities;
}

export function getStateForCity(cityName: string): StateGeo | undefined {
  return INDIAN_STATES.find((s) =>
    s.cities.some((c) => c.name.toLowerCase() === cityName.toLowerCase())
  );
}

export function getStateByCodeOrName(codeOrName: string | null): StateGeo | undefined {
  if (!codeOrName) return undefined;
  const target = codeOrName.trim().toUpperCase();
  return INDIAN_STATES.find(
    (s) =>
      s.code.toUpperCase() === target ||
      (target === 'TS' && s.code.toUpperCase() === 'TG') ||
      (target === 'TG' && s.code.toUpperCase() === 'TG') ||
      s.name.toUpperCase() === target
  );
}

export function firstCityOf(stateCodeOrName: string | null): string | null {
  if (!stateCodeOrName) return null;
  const st = getStateByCodeOrName(stateCodeOrName);
  return st?.cities[0]?.name || null;
}

export function stateOfCity(cityName: string | null): string | null {
  if (!cityName) return null;
  const st = getStateForCity(cityName);
  return st?.code || null;
}

export const CITY_FIRST_WARD: Record<string, number | null> = {
  Mumbai: 1,
  Delhi: 25,
};

export const WARD_CITY_MAP: Record<number, string> = {
  1: 'Mumbai', 2: 'Mumbai', 3: 'Mumbai', 4: 'Mumbai', 5: 'Mumbai', 6: 'Mumbai',
  7: 'Mumbai', 8: 'Mumbai', 9: 'Mumbai', 10: 'Mumbai', 11: 'Mumbai', 12: 'Mumbai',
  13: 'Mumbai', 14: 'Mumbai', 15: 'Mumbai', 16: 'Mumbai', 17: 'Mumbai', 18: 'Mumbai',
  19: 'Mumbai', 20: 'Mumbai', 21: 'Mumbai', 22: 'Mumbai', 23: 'Mumbai', 24: 'Mumbai',
  25: 'Delhi', 26: 'Delhi',
};

export function firstWardOf(cityName: string | null): number | null {
  if (!cityName) return null;
  const key = Object.keys(CITY_FIRST_WARD).find(
    (k) => k.toLowerCase() === cityName.trim().toLowerCase()
  );
  if (key && CITY_FIRST_WARD[key] !== undefined) {
    return CITY_FIRST_WARD[key];
  }
  return null;
}

export function wardBelongsToCity(wardId: number, cityName: string | null): boolean {
  if (!cityName) return false;
  const mappedCity = WARD_CITY_MAP[wardId];
  if (!mappedCity) return true; // dynamic / custom location
  return mappedCity.toLowerCase() === cityName.trim().toLowerCase();
}

