// Satellite Passes - Large Widget Pro for Scriptable
// 3 passes, detailed cards, Apple-style, city + short country

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
    "United Arab Emirates": "UAE",
    "India": "IND",
    "Saudi Arabia": "KSA",
    "Sri Lanka": "SL",
    "United States": "USA",
    "United Kingdom": "UK",
    "Qatar": "QAT",
    "Oman": "OMN",
    "Kuwait": "KWT",
    "Bahrain": "BHR",
    "China": "CHN",
    "Japan": "JPN",
    "Pakistan": "PAK",
    "Bangladesh": "BGD",
    "Nepal": "NPL"
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

function formatMediumDate(dateObj) {
  const df = new DateFormatter();
  df.useMediumDateStyle();
  df.useNoTimeStyle();
  return df.string(dateObj);
}

function addText(stack, text, size, color, bold = false, opacity = 1) {
  const t = stack.addText(String(text));
  t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = color;
  t.textOpacity = opacity;
  t.lineLimit = 1;
  return t;
}

function addInfoRow(parent, label, value, valueColor = Color.white(), highlight = false) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const l = row.addText(label);
  l.font = Font.systemFont(11);
  l.textColor = new Color("#A1A6B0");
  l.lineLimit = 1;

  row.addSpacer();

  const v = row.addText(String(value));
  v.font = highlight ? Font.boldSystemFont(11) : Font.mediumSystemFont(11);
  v.textColor = valueColor;
  v.lineLimit = 1;
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
    new Color("#0C0F14"),
    new Color("#131923")
  ];
  widget.backgroundGradient = gradient;
}

function addHeader(widget, placeName) {
  const top = widget.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();

  addText(top, "Satellite Passes", 17, Color.white(), true);
  top.addSpacer();
  addText(top, placeName, 11, new Color("#9FA6B2"), false, 0.95);

  widget.addSpacer(10);
}

function addPassCard(widget, pass, index) {
  const startTime = new Date(pass.start);
  const endTime = new Date(pass.end);

  const duration = formatDurationMinutes(startTime, endTime);
  const minsAway = minutesUntil(startTime);
  const elevation = Math.round(Number(pass.max_elevation) || 0);
  const aos = Math.round(Number(pass.aos_azimuth) || 0);
  const los = Math.round(Number(pass.los_azimuth) || 0);

  const card = widget.addStack();
  card.layoutVertically();
  card.setPadding(10, 12, 10, 12);
  card.cornerRadius = 16;
  card.backgroundColor = index === 0 ? new Color("#1A2333") : new Color("#171C26");

  // Top row
  const topRow = card.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();

  addText(
    topRow,
    `${getSatelliteIcon(pass.satellite_name)} ${pass.satellite_name}`,
    13,
    Color.white(),
    true
  );

  topRow.addSpacer();

  addText(
    topRow,
    `${minsAway}m`,
    13,
    new Color(index === 0 ? "#5AC8FA" : "#8BC9FF"),
    true
  );

  card.addSpacer(7);

  addInfoRow(card, "NORAD ID", pass.norad_id);
  card.addSpacer(3);

  addInfoRow(card, "Date", formatMediumDate(startTime));
  card.addSpacer(3);

  addInfoRow(
    card,
    "Start - End - Duration",
    `${formatShortTime(startTime)} - ${formatShortTime(endTime)} - ${duration} min`
  );
  card.addSpacer(3);

  addInfoRow(card, "Max Elevation", `${elevation}°`);
  card.addSpacer(3);

  addInfoRow(card, "AOS / LOS Azimuth", `${aos}° / ${los}°`);

  widget.addSpacer(8);
}

function addEmptyState(widget, placeName) {
  const box = widget.addStack();
  box.layoutVertically();
  box.setPadding(16, 16, 16, 16);
  box.backgroundColor = new Color("#171C26");
  box.cornerRadius = 16;

  addText(box, "No upcoming passes", 15, Color.white(), true);
  box.addSpacer(4);
  addText(box, `No passes above ${MIN_ELEVATION}° in the next ${HOURS_AHEAD} hours.`, 11, new Color("#A1A6B0"));

  widget.addSpacer();
  const footer = widget.addText(`📍 ${placeName}`);
  footer.font = Font.systemFont(11);
  footer.textColor = new Color("#9FA6B2");
}

function addFooter(widget, placeName) {
  widget.addSpacer();

  const footer = widget.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();

  addText(footer, "📍", 11, new Color("#8A909C"));
  footer.addSpacer(4);
  addText(footer, placeName, 11, new Color("#8A909C"));

  footer.addSpacer();

  const tf = new DateFormatter();
  tf.useNoDateStyle();
  tf.useShortTimeStyle();
  addText(footer, `Updated ${tf.string(new Date())}`, 10, new Color("#6F7785"));
}

function createWidget(passes, locMeta) {
  const widget = new ListWidget();
  applyBackground(widget);
  widget.setPadding(14, 14, 14, 14);

  addHeader(widget, locMeta.placeName);

  if (!passes || passes.length === 0) {
    addEmptyState(widget, locMeta.placeName);
    return widget;
  }

  for (let i = 0; i < passes.length; i++) {
    addPassCard(widget, passes[i], i);
  }

  addFooter(widget, locMeta.placeName);
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
