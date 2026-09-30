export const districts = [
  { name: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867 },
  { name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
  { name: "Kolkata", state: "West Bengal", latitude: 22.5726, longitude: 88.3639 },
  { name: "Bangalore", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", latitude: 26.9124, longitude: 75.7873 },
  { name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { name: "Bhopal", state: "Madhya Pradesh", latitude: 23.2599, longitude: 77.4126 },
  { name: "Patna", state: "Bihar", latitude: 25.5941, longitude: 85.1376 },
  { name: "Ranchi", state: "Jharkhand", latitude: 23.3441, longitude: 85.3096 },
  { name: "Bhubaneswar", state: "Odisha", latitude: 20.2961, longitude: 85.8245 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", latitude: 17.6868, longitude: 83.2185 },
  { name: "Warangal", state: "Telangana", latitude: 17.9784, longitude: 79.5941 },
  { name: "Nizamabad", state: "Telangana", latitude: 18.6725, longitude: 78.0941 },
  { name: "Kochi", state: "Kerala", latitude: 9.9312, longitude: 76.2673 },
  { name: "Coimbatore", state: "Tamil Nadu", latitude: 11.0168, longitude: 76.9558 },
  { name: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882 }
];

export const districtsByName = Object.fromEntries(
  districts.map((district) => [district.name.toLowerCase(), district])
);
