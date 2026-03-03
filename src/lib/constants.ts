/**
 * Constants for the PakDisaster Alert system.
 * Covers all of Pakistan with emphasis on disaster-prone regions.
 */

/**
 * Geographic bounding box for ALL of Pakistan.
 */
export const PAKISTAN_BOUNDS = {
  lat: { min: 23.5, max: 37.5 },
  lon: { min: 60.5, max: 77.5 },
} as const;

/** Alias for backward compat */
export const N_PAKISTAN_BOUNDS = PAKISTAN_BOUNDS;

/**
 * Disaster category definitions with display metadata.
 */
export const DISASTER_CATEGORIES = [
  { id: "earthquake", label: "Earthquake", color: "#E53E3E", icon: "Activity" },
  { id: "flood", label: "Flood", color: "#3182CE", icon: "Waves" },
  { id: "landslide", label: "Landslide", color: "#B7791F", icon: "MountainSnow" },
  { id: "avalanche", label: "Avalanche", color: "#90CDF4", icon: "Snowflake" },
  { id: "glof", label: "GLOF", color: "#2B6CB0", icon: "Droplets" },
  { id: "drought", label: "Drought", color: "#D69E2E", icon: "Sun" },
  { id: "heatwave", label: "Heatwave", color: "#F56565", icon: "Thermometer" },
  { id: "storm", label: "Storm", color: "#805AD5", icon: "CloudLightning" },
] as const;

export type DisasterCategoryId = (typeof DISASTER_CATEGORIES)[number]["id"];

/**
 * Key cities across Pakistan with coordinates, region info, and cultural fun facts.
 */
export const KEY_CITIES = [
  // Northern Areas
  { name: "Gilgit", lat: 35.92, lon: 74.31, region: "Gilgit-Baltistan", funFacts: [
    "Gateway to five of the world's fourteen 8,000m+ peaks",
    "The ancient Silk Road passed through Gilgit for centuries",
    "Home to the 700-year-old Kargah Buddha rock carving",
    "Three of the world's greatest mountain ranges meet here: Karakoram, Himalaya, Hindu Kush"
  ]},
  { name: "Skardu", lat: 35.30, lon: 75.63, region: "Gilgit-Baltistan", funFacts: [
    "Base camp for K2, the world's second highest peak",
    "Shangrila Resort here inspired the name 'heaven on earth'",
    "Home to Satpara Lake, one of Pakistan's highest lakes",
    "The ancient Skardu Fort (Kharpocho) dates back to the 8th century"
  ]},
  { name: "Hunza", lat: 36.32, lon: 74.65, region: "Gilgit-Baltistan", funFacts: [
    "Inspiration for the mythical Shangri-La in James Hilton's 'Lost Horizon'",
    "Attabad Lake was formed by a massive landslide in 2010",
    "Locals are known for exceptional longevity and health",
    "The 800-year-old Baltit Fort overlooks the spectacular valley"
  ]},
  { name: "Chitral", lat: 35.85, lon: 71.78, region: "KPK", funFacts: [
    "Home to the Kalash people, one of the world's smallest ethnic groups",
    "Tirich Mir at 7,708m is the highest peak of the Hindu Kush",
    "The Shandur Pass hosts the world's highest polo ground",
    "Chitral Fort has stood since the 14th century"
  ]},
  { name: "Muzaffarabad", lat: 34.37, lon: 73.47, region: "AJK", funFacts: [
    "Capital of Azad Jammu & Kashmir, at the confluence of Jhelum and Neelum rivers",
    "The Red Fort (Muzaffarabad Fort) dates back to 1646",
    "Devastated by the 2005 earthquake (7.6 magnitude), now rebuilt as a resilient city",
    "Surrounded by lush pine forests and flowing rivers"
  ]},
  { name: "Peshawar", lat: 34.01, lon: 71.58, region: "KPK", funFacts: [
    "One of the oldest living cities in South Asia, over 2,000 years old",
    "The legendary Khyber Pass starts just west of the city",
    "Peshawar Museum houses one of the finest collections of Gandhara art",
    "Famous for its Qissa Khwani Bazaar — the 'Bazaar of Storytellers'"
  ]},
  { name: "Mingora", lat: 34.78, lon: 72.36, region: "Swat, KPK", funFacts: [
    "Capital of the Swat Valley, once called the 'Switzerland of the East'",
    "Birthplace of Nobel laureate Malala Yousafzai",
    "Home to ancient Buddhist ruins at Butkara and Udegram",
    "The Swat River valley has been inhabited for over 3,000 years"
  ]},
  // Major Cities
  { name: "Islamabad", lat: 33.69, lon: 73.04, region: "Federal Capital", funFacts: [
    "One of the few purpose-built capital cities in the world (founded 1960s)",
    "Faisal Mosque is one of the largest mosques in the world",
    "Margalla Hills National Park is home to leopards and 600+ plant species",
    "The city was designed by Greek architect Constantinos Apostolou Doxiadis"
  ]},
  { name: "Lahore", lat: 31.55, lon: 74.35, region: "Punjab", funFacts: [
    "Cultural capital of Pakistan with over 2,000 years of history",
    "The Badshahi Mosque was the world's largest mosque for 313 years",
    "Lahore Fort and Shalimar Gardens are UNESCO World Heritage Sites",
    "Famous Food Street in the old city serves centuries-old recipes"
  ]},
  { name: "Karachi", lat: 24.86, lon: 67.01, region: "Sindh", funFacts: [
    "Pakistan's largest city and economic hub with 16+ million people",
    "Home to the tomb of Quaid-e-Azam Muhammad Ali Jinnah",
    "Clifton Beach stretches for over 8km along the Arabian Sea",
    "One of the world's fastest growing megacities"
  ]},
  { name: "Quetta", lat: 30.18, lon: 66.99, region: "Balochistan", funFacts: [
    "Known as the 'Fruit Garden of Pakistan' for its orchards",
    "Surrounded by dramatic mountains including Chiltan and Zarghun",
    "The Quaid-e-Azam Residency is where Jinnah spent his final days",
    "Gateway to the Bolan Pass, a historic route to Central Asia"
  ]},
  { name: "Multan", lat: 30.20, lon: 71.45, region: "Punjab", funFacts: [
    "Known as the 'City of Saints' with dozens of Sufi shrines",
    "One of the oldest cities in the subcontinent, over 5,000 years old",
    "Famous for its distinctive blue pottery and Multani mitti (clay)",
    "Alexander the Great was wounded during the siege of Multan in 326 BC"
  ]},
  { name: "Hyderabad", lat: 25.39, lon: 68.37, region: "Sindh", funFacts: [
    "Home to the largest bazaar in Asia — Shahi Bazaar",
    "The Sindh Museum showcases 5,000 years of Sindhi civilization",
    "Built on a limestone ridge along the Indus River",
    "Famous for its lacquer bangles and Sindhi ajrak textiles"
  ]},
  { name: "Abbottabad", lat: 34.15, lon: 73.21, region: "KPK", funFacts: [
    "Named after Major James Abbott who founded it in 1853",
    "Home to the Pakistan Military Academy at Kakul",
    "Ilyasi Mosque has a natural spring flowing through it",
    "Pleasant climate year-round earned it the nickname 'City of Pines'"
  ]},
  { name: "Dir", lat: 35.20, lon: 71.88, region: "KPK", funFacts: [
    "Dir district was once an independent princely state until 1969",
    "Known for its cedar and pine forests",
    "The Kumrat Valley is an emerging eco-tourism destination",
    "Ancient Buddhist relics found in the region date back to 2nd century"
  ]},
  { name: "Gwadar", lat: 25.12, lon: 62.33, region: "Balochistan", funFacts: [
    "Strategic deep-water port on the Arabian Sea, part of CPEC",
    "Hammerhead rock formation (Gwadar Rock) is a natural landmark",
    "Was an overseas territory of Oman until 1958",
    "Home to the Princess of Hope, a natural rock formation resembling a person"
  ]},
] as const;

/** External API base URLs */
export const API_URLS = {
  usgs: "https://earthquake.usgs.gov/fdsnws/event/1",
  reliefWeb: "https://api.reliefweb.int/v1",
  gdacs: "https://www.gdacs.org/gdacsapi/api",
  eonet: "https://eonet.gsfc.nasa.gov/api/v3",
  openMeteo: "https://api.open-meteo.com/v1",
  gnews: "https://gnews.io/api/v4",
} as const;

/** Default proximity alert radius in kilometers. */
export const DEFAULT_ALERT_RADIUS = 30;

/** Cache / ISR revalidation durations in seconds. */
export const CACHE_DURATIONS = {
  earthquakes: 300,
  weather: 900,
  news: 1800,
  disasters: 600,
  eonet: 900,
} as const;

/** All searchable locations (cities + landmarks) for the location picker */
export const SEARCHABLE_LOCATIONS = KEY_CITIES.map(c => ({
  name: c.name,
  lat: c.lat,
  lon: c.lon,
  region: c.region,
}));
