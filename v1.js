// Satellite Passes - Large Widget Compact Pro for Scriptable
// 3 passes, aligned cards, footer with location + date

// ---------------- CONFIG ----------------
const FALLBACK_LATITUDE = 25.2048;
const FALLBACK_LONGITUDE = 55.2708;
const FALLBACK_LOCATION_NAME = "Dubai, UAE";

const MIN_ELEVATION = 30;
const HOURS_AHEAD = 24;
const MAX_PASSES_TO_SHOW = 3;

// ---------------- SATELLITES ----------------
const SATELLITES = [
  { name: "ISS (Zarya)", norad: 25544 },
  { name: "Tiangong", norad: 48274 },
  { name: "Hubble Space Telescope", norad: 20580 },
  { name: "NOAA 15", norad: 25338 },
  { name: "NOAA 18", norad: 28654 },
  { name: "NOAA 19", norad: 33591 },
  { name: "METEOR M2-2", norad: 44387 },
  { name: "SUOMI NPP", norad: 37849 },
  { name: "NOAA 20 (JPSS 1)", norad: 43013 },
  { name: "NOAA-21 (JPSS-2)", norad: 54234 },
  { name: "AO-7", norad: 7530 },
  { name: "AO-73 (FunCube-1)", norad: 39444 },
  { name: "AO-91 (Fox-1B)", norad: 43017 },
  { name: "FO-29 (JAS 2)", norad: 24278 },
  { name: "SO-50 (Saudisat 1C)", norad: 27607 },
  { name: "JY1SAT (JO-97)", norad: 43803 },
  { name: "CAS-6 (TO-108)", norad: 44881 },
  { name: "DOSAAF-85 (RS-44)", norad: 44909 },
  { name: "Terra (EOS AM-1)", norad: 25994 },
  { name: "Aqua (EOS PM-1)", norad: 27424 },
];

// ---------------- COUNTRY SHORT NAMES ----------------
function shortCountryName(country) {
  if (!country) return "";

const map = {
  // Middle East
  "United Arab Emirates": "UAE",
  "Saudi Arabia": "KSA",
  "Qatar": "QAT",
  "Oman": "OMN",
  "Kuwait": "KWT",
  "Bahrain": "BHR",
  "Jordan": "JOR",
  "Israel": "ISR",
  "Lebanon": "LBN",

  // South Asia
  "India": "IND",
  "Pakistan": "PAK",
  "Bangladesh": "BGD",
  "Sri Lanka": "SL",
  "Nepal": "NPL",
  "Bhutan": "BTN",
  "Maldives": "MDV",

  // East Asia
  "China": "CHN",
  "Japan": "JPN",
  "South Korea": "KOR",
  "North Korea": "PRK",
  "Taiwan": "TWN",
  "Hong Kong": "HKG",
  "Macao": "MAC",

  // Southeast Asia
  "Singapore": "SGP",
  "Malaysia": "MYS",
  "Indonesia": "IDN",
  "Thailand": "THA",
  "Vietnam": "VNM",
  "Philippines": "PHL",
  "Myanmar": "MMR",
  "Cambodia": "KHM",
  "Laos": "LAO",
  "Brunei": "BRN",

  // Europe
  "United Kingdom": "UK",
  "Ireland": "IRL",
  "France": "FRA",
  "Germany": "DEU",
  "Italy": "ITA",
  "Spain": "ESP",
  "Portugal": "PRT",
  "Netherlands": "NLD",
  "Belgium": "BEL",
  "Switzerland": "CHE",
  "Austria": "AUT",
  "Sweden": "SWE",
  "Norway": "NOR",
  "Denmark": "DNK",
  "Finland": "FIN",
  "Poland": "POL",
  "Czechia": "CZE",
  "Hungary": "HUN",
  "Greece": "GRC",
  "Turkey": "TUR",
  "Ukraine": "UKR",
  "Romania": "ROU",

  // Americas
  "United States": "USA",
  "Canada": "CAN",
  "Mexico": "MEX",
  "Brazil": "BRA",
  "Argentina": "ARG",
  "Chile": "CHL",
  "Colombia": "COL",
  "Peru": "PER",
  "Venezuela": "VEN",

  // Africa
  "South Africa": "ZAF",
  "Egypt": "EGY",
  "Nigeria": "NGA",
  "Kenya": "KEN",
  "Morocco": "MAR",
  "Algeria": "DZA",
  "Ethiopia": "ETH",
  "Ghana": "GHA",
  "Tanzania": "TZA",

  // Oceania
  "Australia": "AUS",
  "New Zealand": "NZL",
  "Fiji": "FJI",
  "Papua New Guinea": "PNG"
};

  return map[country] || country;
}

// ---------------- HELPERS ----------------
function getSatelliteIcon(name) {
  if (name.includes("ISS")) return "🛰";
  if (name.includes("NOAA") || name.includes("METEOR")) return "🌦";
  if (name.includes("Hubble")) return "🔭";
  if (name.includes("Tiangong")) return "🚀";
  if (name.includes("AO-") || name.includes("SO-") || name.includes("JO-") || name.includes("FO-")) return "📡";
  return "🛰";
}

function minutesUntil(date) {
  return Math.max(0, Math.round((date.getTime() - Date.now()) / 60000));
}

function formatDurationMinutes(start, end) {
  return Math.max(0, Math.round((end - start) / 60000));
}

function formatPlaceName(geo) {
  if (!geo || geo.length === 0) return FALLBACK_LOCATION_NAME;

  const g = geo[0];
  const city =
    g.postalAddressCity ||
    g.city ||
    g.locality ||
    g.subAdministrativeArea ||
    g.administrativeArea ||
    g.subLocality ||
    g.name ||
    "Unknown";

  const country = shortCountryName(g.country || "");
  return country ? `${city}, ${country}` : city;
}

function formatShortTime(dateObj) {
  const tf = new DateFormatter();
  tf.useNoDateStyle();
  tf.useShortTimeStyle();
  return tf.string(dateObj);
}

function formatFooterDateTime(dateObj) {
  const df = new DateFormatter();
  df.dateFormat = "dd/MMM HH:mm";
  return df.string(dateObj);
}

function addText(stack, text, size, color, bold = false, opacity = 1) {
  const t = stack.addText(String(text));
  t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = color;
  t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}

function addInfoRow(parent, label, value, valueColor = Color.white()) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const l = row.addText(label);
  l.font = Font.systemFont(10);
  l.textColor = new Color("#9CA3AF");
  l.lineLimit = 1;
  l.minimumScaleFactor = 0.7;

  row.addSpacer();

  const v = row.addText(String(value));
  v.font = Font.mediumSystemFont(10);
  v.textColor = valueColor;
  v.lineLimit = 1;
  v.minimumScaleFactor = 0.7;
}

// ---------------- API ----------------
async function getNextPass(satellite, latitude, longitude) {
  const url = `https://api.g7vrd.co.uk/v1/satellite-passes/${satellite.norad}/${latitude}/${longitude}.json?min_elevation=${MIN_ELEVATION}&hours=${HOURS_AHEAD}`;

  try {
    const req = new Request(url);
    req.timeoutInterval = 12;
    const response = await req.loadJSON();

    if (response && Array.isArray(response.passes) && response.passes.length > 0) {
      const pass = response.passes[0];
      pass.satellite_name = response.satellite_name || satellite.name;
      pass.norad_id = response.norad_id || satellite.norad;
      return pass;
    }

    return null;
  } catch (e) {
    console.log(`Pass load failed for ${satellite.name}: ${e}`);
    return null;
  }
}

async function getUpcomingPasses(satellites, latitude, longitude) {
  const promises = satellites.map(s => getNextPass(s, latitude, longitude));
  const results = await Promise.all(promises);

  return results
    .filter(Boolean)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, MAX_PASSES_TO_SHOW);
}

// ---------------- LOCATION ----------------
async function getLocationMeta() {
  let lat = FALLBACK_LATITUDE;
  let lon = FALLBACK_LONGITUDE;
  let placeName = FALLBACK_LOCATION_NAME;

  try {
    Location.setAccuracyToBest();
    const loc = await Location.current();

    if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      lat = loc.latitude;
      lon = loc.longitude;

      try {
        const geo = await Location.reverseGeocode(lat, lon);
        placeName = formatPlaceName(geo);
      } catch (e) {
        console.log(`Reverse geocode failed: ${e}`);
      }
    }
  } catch (e) {
    console.log(`Location fetch failed: ${e}`);
  }

  return { lat, lon, placeName };
}

// ---------------- UI ----------------
function applyBackground(widget) {
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("#0B0F17"),
    new Color("#111827")
  ];
  widget.backgroundGradient = gradient;
}

function addHeader(widget) {
  const top = widget.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();

  addText(top, "Satellite Passes", 15, Color.white(), true);

  widget.addSpacer(8);
}

function addPassCard(widget, pass, index, isLast = false) {
  const startTime = new Date(pass.start);
  const endTime = new Date(pass.end);

  const duration = formatDurationMinutes(startTime, endTime);
  const minsAway = minutesUntil(startTime);
  const elevation = Math.round(Number(pass.max_elevation) || 0);
  const aos = Math.round(Number(pass.aos_azimuth) || 0);
  const los = Math.round(Number(pass.los_azimuth) || 0);

  const card = widget.addStack();
  card.layoutVertically();
  card.setPadding(8, 12, 8, 12);
  card.cornerRadius = 16;
  card.backgroundColor = index === 0 ? new Color("#16233A") : new Color("#121826");

  const topRow = card.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();

  const leftTitle = topRow.addStack();
  leftTitle.layoutHorizontally();
  leftTitle.centerAlignContent();

  addText(leftTitle, getSatelliteIcon(pass.satellite_name), 12, Color.white());
  leftTitle.addSpacer(5);
  addText(leftTitle, pass.satellite_name, 12, Color.white(), true);

  topRow.addSpacer();

  addText(
    topRow,
    `${minsAway}m`,
    12,
    new Color(index === 0 ? "#67C6FF" : "#8BC9FF"),
    true
  );

  card.addSpacer(5);

  addInfoRow(card, "NORAD ID", pass.norad_id);
  card.addSpacer(2);

  addInfoRow(
    card,
    "Start - End - Duration",
    `${formatShortTime(startTime)} - ${formatShortTime(endTime)} - ${duration} min`
  );
  card.addSpacer(2);

  addInfoRow(card, "Max Elevation", `${elevation}°`);
  card.addSpacer(2);

  addInfoRow(card, "AOS / LOS Azimuth", `${aos}° / ${los}°`);

  if (!isLast) widget.addSpacer(7);
}

function addEmptyState(widget) {
  const box = widget.addStack();
  box.layoutVertically();
  box.setPadding(16, 16, 16, 16);
  box.backgroundColor = new Color("#121826");
  box.cornerRadius = 16;

  addText(box, "No upcoming passes", 14, Color.white(), true);
  box.addSpacer(4);
  addText(box, `No passes above ${MIN_ELEVATION}° in the next ${HOURS_AHEAD} hours.`, 10, new Color("#9CA3AF"));
}

function addFooter(widget, placeName, passes) {
  widget.addSpacer(2);

  const footer = widget.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();


  addText(footer, "📍", 10, new Color("#8A909C"));
  footer.addSpacer(4);
  addText(footer, placeName, 10, new Color("#8A909C"));
  footer.addSpacer();
  addText(footer,`Updated • ${formatFooterDateTime(new Date())}`,10,new Color("#8A909C"));
}

function createWidget(passes, locMeta) {
  const widget = new ListWidget();
  applyBackground(widget);
  widget.setPadding(12, 12, 10, 12);

  addHeader(widget);

  if (!passes || passes.length === 0) {
    widget.addSpacer();
    addEmptyState(widget);
    widget.addSpacer();
    addFooter(widget, locMeta.placeName, passes);
    return widget;
  }

  // Keep the header pinned at the top and footer pinned at the bottom.
  // The pass cards are centered within the remaining vertical space.
  widget.addSpacer();
  for (let i = 0; i < passes.length; i++) {
    addPassCard(widget, passes[i], i, i === passes.length - 1);
  }
  widget.addSpacer();

  addFooter(widget, locMeta.placeName, passes);
  return widget;
}

// ---------------- MAIN ----------------
async function main() {
  const locMeta = await getLocationMeta();
  const passes = await getUpcomingPasses(SATELLITES, locMeta.lat, locMeta.lon);
  const widget = createWidget(passes, locMeta);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentLarge();
  }

  Script.complete();
}

await main();
