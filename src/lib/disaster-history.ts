export interface HistoricalDisaster {
  year: number;
  title: string;
  category: string;
  description: string;
  casualties?: string;
  magnitude?: number;
  affected?: string;
  region: string;
}

/**
 * Color map for disaster categories used in the DisasterHistory timeline.
 * Keys match the `category` field on each HistoricalDisaster entry.
 */
export const HISTORY_CATEGORY_COLORS: Record<string, string> = {
  earthquake: '#E53E3E',
  flood: '#3182CE',
  landslide: '#B7791F',
  avalanche: '#90CDF4',
  cyclone: '#805AD5',
  heatwave: '#F56565',
  drought: '#D69E2E',
  storm: '#805AD5',
};

/**
 * Curated list of major historical natural disasters in Pakistan.
 * Sources: NDMA Pakistan, ReliefWeb, USGS, EM-DAT.
 */
export const MAJOR_DISASTERS: HistoricalDisaster[] = [
  {
    year: 2024,
    title: "Balochistan & Sindh Floods",
    category: "flood",
    description: "Monsoon flooding across Balochistan and Sindh displaced hundreds of thousands. Flash floods destroyed homes and infrastructure in remote areas.",
    casualties: "300+",
    affected: "1.5 million+",
    region: "Balochistan, Sindh",
  },
  {
    year: 2023,
    title: "Herat-Badghis Earthquake (felt in Pakistan)",
    category: "earthquake",
    description: "Series of powerful earthquakes near the Afghanistan-Pakistan border. Tremors caused damage in Balochistan and KPK.",
    magnitude: 6.3,
    casualties: "Limited in Pakistan",
    region: "Balochistan, KPK",
  },
  {
    year: 2022,
    title: "Pakistan Super Floods",
    category: "flood",
    description: "Catastrophic flooding submerged one-third of Pakistan. Record monsoon rains and glacial melt caused unprecedented damage. Declared a climate catastrophe.",
    casualties: "1,739",
    affected: "33 million",
    region: "Sindh, Balochistan, Punjab, KPK",
  },
  {
    year: 2021,
    title: "Balochistan Earthquake",
    category: "earthquake",
    description: "Powerful earthquake struck Harnai district, destroying hundreds of homes in remote mountainous areas.",
    magnitude: 5.9,
    casualties: "20+",
    region: "Balochistan",
  },
  {
    year: 2019,
    title: "AJK Earthquake",
    category: "earthquake",
    description: "Earthquake struck Mirpur district in Azad Kashmir, damaging roads and infrastructure.",
    magnitude: 5.6,
    casualties: "40+",
    affected: "100,000+",
    region: "Azad Kashmir",
  },
  {
    year: 2015,
    title: "Hindu Kush Earthquake",
    category: "earthquake",
    description: "Deep earthquake in the Hindu Kush range felt across Pakistan, Afghanistan, and India. Caused panic and building damage in KPK.",
    magnitude: 7.5,
    casualties: "398 (Pakistan & Afghanistan)",
    region: "KPK, Gilgit-Baltistan",
  },
  {
    year: 2014,
    title: "Kashmir & Punjab Floods",
    category: "flood",
    description: "Severe flooding along the Jhelum and Chenab rivers affected Punjab and AJK. Massive displacement and crop destruction.",
    casualties: "367",
    affected: "2.5 million",
    region: "Punjab, AJK",
  },
  {
    year: 2013,
    title: "Awaran Earthquake",
    category: "earthquake",
    description: "Powerful earthquake devastated the Awaran district of Balochistan, destroying thousands of mud-brick homes.",
    magnitude: 7.7,
    casualties: "825",
    region: "Balochistan",
  },
  {
    year: 2012,
    title: "Siachen Avalanche",
    category: "avalanche",
    description: "Massive avalanche at Gayari Sector near the Siachen Glacier buried a military camp under snow and rock.",
    casualties: "140",
    region: "Gilgit-Baltistan (Siachen)",
  },
  {
    year: 2010,
    title: "Pakistan Mega Floods",
    category: "flood",
    description: "The worst floods in Pakistan's history. Record monsoon rains caused the Indus River to overflow, submerging entire provinces.",
    casualties: "1,985",
    affected: "20 million",
    region: "KPK, Punjab, Sindh, Balochistan",
  },
  {
    year: 2010,
    title: "Attabad Landslide",
    category: "landslide",
    description: "Massive landslide in Hunza blocked the river, creating Attabad Lake and displacing thousands. The Karakoram Highway was severed.",
    casualties: "20",
    affected: "25,000+",
    region: "Hunza, Gilgit-Baltistan",
  },
  {
    year: 2005,
    title: "Kashmir Earthquake",
    category: "earthquake",
    description: "Devastating earthquake struck Kashmir and northern Pakistan. One of the deadliest earthquakes in South Asian history. Entire towns like Balakot were flattened.",
    magnitude: 7.6,
    casualties: "87,351",
    affected: "3.5 million",
    region: "AJK, KPK, Islamabad",
  },
  {
    year: 2001,
    title: "Gujarat-Sindh Earthquake",
    category: "earthquake",
    description: "Earthquake centered in Gujarat, India caused significant damage in Sindh, particularly in Tharparkar and Badin districts.",
    magnitude: 7.7,
    region: "Sindh",
  },
  {
    year: 1999,
    title: "Balochistan Cyclone",
    category: "storm",
    description: "Cyclone 02A struck the Makran coast of Balochistan with destructive winds and storm surge.",
    casualties: "700+",
    region: "Balochistan (Makran coast)",
  },
  {
    year: 1997,
    title: "Balochistan Earthquake",
    category: "earthquake",
    description: "Series of earthquakes struck Balochistan, destroying villages across the remote Harnai-Ziarat region.",
    magnitude: 7.1,
    casualties: "65",
    region: "Balochistan",
  },
  {
    year: 1992,
    title: "Sindh-Balochistan Floods",
    category: "flood",
    description: "Monsoon flooding devastated southern Pakistan, destroying crops and displacing millions.",
    casualties: "1,000+",
    affected: "12 million",
    region: "Sindh, Balochistan",
  },
  {
    year: 1974,
    title: "Pattan Earthquake",
    category: "earthquake",
    description: "Earthquake in the Pattan area of northern Pakistan caused massive landslides and destruction.",
    magnitude: 6.2,
    casualties: "5,300",
    region: "KPK (Swat, Dir)",
  },
  {
    year: 1935,
    title: "Quetta Earthquake",
    category: "earthquake",
    description: "One of the deadliest earthquakes in history. Quetta city was almost completely destroyed. Led to major changes in building codes.",
    magnitude: 7.7,
    casualties: "30,000-60,000",
    region: "Balochistan (Quetta)",
  },
];
