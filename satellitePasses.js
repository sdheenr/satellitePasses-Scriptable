// Satellite Pass Predictor for Scriptable
// Tracks of the most popular and active amateur, weather, and scientific satellites.

// --- CONFIGURATION ---
// Default fallback coordinates: Debrecen, Hungary (used if device location is unavailable)
const FALLBACK_LATITUDE = 47.5316;
const FALLBACK_LONGITUDE = 21.6273;

// --- SATELLITE LIST ---
const SATELLITES = [
    { name: "ISS (Zarya)", norad: 25544 },
    { name: "Tiangong", norad: 48274 }, 
    { name: "Hubble Space Telescope", norad: 20580 },
    
    // --- NOAA & METEOROLOGICAL ---
    
    { name: "NOAA 15", norad: 25338 },
    { name: "NOAA 17", norad: 27453 },
    { name: "NOAA 18", norad: 28654 },
    { name: "NOAA 19", norad: 33591 },
    { name: "METEOR M2-2", norad: 44387 },
    { name: "SUOMI NPP", norad: 37849 },
    { name: "NOAA 20 (JPSS 1)", norad: 43013 },
    { name: "NOAA-21 (JPSS-2)", norad: 54234 },
    
    // --- AMATEUR RADIO (AMSAT/OSCAR) ---
    { name: "AO-7", norad: 7530 }, 
    { name: "AO-73 (FunCube-1)", norad: 39444 },
    { name: "AO-85 (Fox-1A)", norad: 40967 },
    { name: "AO-91 (Fox-1B)", norad: 43017 },
    { name: "BISONSAT", norad: 40968 },
    { name: "FO-29 (JAS 2)", norad: 24278 },
    { name: "SO-50 (Saudisat 1C)", norad: 27607 },
    { name: "LilacSat-2 (CAS-3H)", norad: 40908 },
    { name: "DIWATA 2B (PO-101)", norad: 43678 },
    { name: "HADES-R (SO-124)", norad: 62690 },
    { name: "JY1SAT (JO-97)", norad: 43803 },
    { name: "CAS-6 (TO-108)", norad: 44881 },
    { name: "DOSAAF-85 (RS-44)", norad: 44909 },
    { name: "PCSAT", norad: 26931 },
    { name: "ASRTU-1 (AO-123)", norad: 61781 },
    { name: "SONATE-2", norad: 59112 },
    { name: "GRBALPHA", norad: 47941 },
    { name: "LASARSAT", norad: 62391 },
    { name: "CROCUBE", norad: 62394 },
    { name: "CUBESAT XI-V", norad: 28895 },
    { name: "CUBESAT XI-IV", norad: 27848 },
    { name: "CATSAT", norad: 60246 },
    
    
    // --- EARTH OBSERVATION / SCIENTIFIC ---
    { name: "Terra (EOS AM-1)", norad: 25994 },
    { name: "Aqua (EOS PM-1)", norad: 27424 },


];
// --- END OF CONFIGURATION ---


/**
 * Fetches the next pass for a single satellite.
 * @param {object} satellite - A satellite object with name and norad properties.
 * @returns {Promise<object|null>} A promise that resolves to the satellite pass data or null.
 */
async function getNextPass(satellite, latitude, longitude) {
  const url = `https://api.g7vrd.co.uk/v1/satellite-passes/${satellite.norad}/${latitude}/${longitude}.json?min_elevation=70&hours=24`;
  try {
    const request = new Request(url);
    const response = await request.loadJSON();
    if (response && Array.isArray(response.passes) && response.passes.length > 0) {
      // API returns fields: start, tca, end, max_elevation, aos_azimuth, los_azimuth
      // Normalize the first pass and attach a satellite_name for display
      const pass = response.passes[0];
      // Prefer API-provided satellite_name, fallback to configured name
      pass.satellite_name = response.satellite_name || satellite.name;
      // Attach NORAD ID for display (from API, fallback to configured)
      pass.norad_id = response.norad_id || satellite.norad;
      return pass;
    }
    return null;
  } catch (error) {
    // Expected error for some satellites (no passes/API issue), so we just ignore and continue
    return null;
  }
}

/**
 * Finds the soonest upcoming pass from the extensive list of satellites.
 * @param {Array<object>} satellites - List of satellite objects.
 * @returns {Promise<object|null>} The pass data for the soonest pass.
 */
async function findSoonestPass(satellites, latitude, longitude) {
    let soonestPass = null;

    // Create a list of promises, one for each satellite API call. This runs all checks concurrently.
  const passPromises = satellites.map(sat => getNextPass(sat, latitude, longitude));
    
    // Wait for all the API calls to complete
    const allPasses = await Promise.all(passPromises);

    // Filter out any null results (from errors or no passes)
    const validPasses = allPasses.filter(pass => pass !== null);

    // Find the soonest pass among the valid ones
  for (const pass of validPasses) {
    // API uses ISO strings in `start` and `end`
    const passStartTime = new Date(pass.start);
    if (!soonestPass || passStartTime < new Date(soonestPass.start)) {
      soonestPass = pass;
    }
  }

    return soonestPass;
}


/**
 * Creates the widget UI.
 * @param {object|null} passData - The data for the next satellite pass.
 * @returns {ListWidget} The configured Scriptable widget.
 */
function createWidget(passData) {
  const locMeta = globalThis.__LOC_META__ || { lat: FALLBACK_LATITUDE, lon: FALLBACK_LONGITUDE, isFallback: true };
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1C1C1E"); // Dark background
  widget.setPadding(15, 15, 15, 15);


  // --- Body ---
  if (passData) {
    // API provides `start` and `end`; compute duration from them
    const startTime = new Date(passData.start);
    const endTime = new Date(passData.end);
    const durationMinutes = Math.max(0, Math.round((endTime - startTime) / 60000));
    const maxElevationVal = Number(passData.max_elevation);
    const maxElevation = Number.isFinite(maxElevationVal) ? Math.round(maxElevationVal) : null;
    const aosAzVal = Number(passData.aos_azimuth);
    const losAzVal = Number(passData.los_azimuth);
    const aosAz = Number.isFinite(aosAzVal) ? Math.round(aosAzVal) : null;
    const losAz = Number.isFinite(losAzVal) ? Math.round(losAzVal) : null;

    const dateFormatter = new DateFormatter();
    dateFormatter.useMediumDateStyle();
    
    const timeFormatter = new DateFormatter();
    timeFormatter.useShortTimeStyle();
    
    addInfoRow(widget, "🛰️ Next Satellite", passData.satellite_name, true);
    widget.addSpacer(5);
    addInfoRow(widget, "NORAD ID", String(passData.norad_id || "-"));
    widget.addSpacer(5);
    addInfoRow(widget, "Date", dateFormatter.string(startTime));
    widget.addSpacer(5);
    addInfoRow(widget, "Start - End - Duration", `${timeFormatter.string(startTime)} - ${timeFormatter.string(endTime)} - ${durationMinutes} min`);
    widget.addSpacer(5);
    addInfoRow(widget, "Max Elevation", `${maxElevation != null ? maxElevation : '-'}°`);
    widget.addSpacer(5);
    addInfoRow(widget, "AOS / LOS Azimuth", `${aosAz != null ? aosAz : '-'}° / ${losAz != null ? losAz : '-'}°`);
    
  } else {
    const errorText = widget.addText("No upcoming passes found for the next 24 hours. Check again later.");
    errorText.textColor = Color.lightGray();
    errorText.font = Font.systemFont(12);
  }
  
  widget.addSpacer();
  const coordStr = `${locMeta.lat.toFixed(4)}, ${locMeta.lon.toFixed(4)}`;
  const footerLabel = locMeta.isFallback ? `📍🗺️ Debrecen (fallback) • ${coordStr}` : `📍🗺️ Device location • ${coordStr}`;
  const footer = widget.addText(footerLabel);
  footer.font = Font.footnote();
  footer.textColor = Color.lightGray();
  footer.rightAlignText();

  return widget;
}

/**
 * Helper function to create a formatted row in the widget.
 */
function addInfoRow(widget, label, value, isHighlight = false) {
  const stack = widget.addStack();
  stack.layoutHorizontally();
  
  const labelText = stack.addText(label + ":");
  labelText.font = Font.mediumSystemFont(12);
  labelText.textColor = Color.lightGray();
  
  stack.addSpacer();
  
  const valueText = stack.addText(value);
  if (isHighlight) {
      valueText.font = Font.boldSystemFont(12);
      valueText.textColor = new Color("#0099ffff"); 
  } else {
      valueText.font = Font.boldSystemFont(12);
      valueText.textColor = Color.white();
  }
  valueText.rightAlignText();
}

// --- Main script execution ---
async function main() {
  let lat = FALLBACK_LATITUDE;
  let lon = FALLBACK_LONGITUDE;
  let isFallback = true;
  try {
    Location.setAccuracyToBest();
    const loc = await Location.current();
    if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      lat = loc.latitude;
      lon = loc.longitude;
      isFallback = false;
    }
  } catch (e) {
    // Permission denied or unavailable; use fallback silently in widget
    isFallback = true;
  }

  // Store location meta for widget footer
  globalThis.__LOC_META__ = { lat, lon, isFallback };

  // Find the soonest pass among all named satellites using device (or fallback) coordinates
  const soonestPass = await findSoonestPass(SATELLITES, lat, lon);
  const widget = createWidget(soonestPass);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Preview the widget in the app for testing
    widget.presentMedium();
  }

  Script.complete();
}

// Run the main function
main();

