# satellitePasses-Scriptable
<h3>Satellite Pass Predictor widget for Scriptable</h3>

![IMG_0424](https://github.com/user-attachments/assets/5557a8a5-6a51-4936-9ab0-eef7b1c3cd80)

A scriptable iOS widget that shows the next upcoming pass of popular amateur/weather/science satellites over your current location.


Location handling:
<ul><li>Tries to get device GPS (high accuracy).</li>
<li>If unavailable or permission denied, it falls back to the defined location.</li>
<li>Footer shows which coordinates are used (device or fallback) plus lat/lon.</li></ul>


Satellite list:
<ul><li>A curated array of well-known amateur radio related satellites (ISS, Tiangong, NOAA series, AMSAT birds, etc.).</li></ul>


API calls:
<ul><li>For each satellite, calls: https://api.g7vrd.co.uk/v1/satellite-passes/{norad}/{lat}/{lon}.json?min_elevation=70&hours=24</li>
<li>Expects a response with passes containing start, end, max_elevation, aos_azimuth, los_azimuth.</li>
<li>Attaches satellite_name (from API or fallback to configured name) and norad_id to the first pass.</li>
<li>For more info on the API: https://g7vrd.co.uk/public-satellite-pass-rest-api</li></ul>


Concurrency and selection:
<ul><li>Queries all satellites concurrently via Promise.all.</li>
<li>Filters out null/empty results and picks the soonest upcoming pass based on pass.start.</li></ul>


Widget UI:
<ul><li>Displays a single “next pass” with:</li>
<li>Name, NORAD ID</li>
<li>Date</li>
<li>Start time – End time – Duration</li>
<li>Max Elevation</li>
<li>AOS (Acquisition of Signal) / LOS (Loss of Signal) Azimuth </li>
<li>Footer: “Device location” or “Debrecen (fallback)” with coordinates.</li></ul>


Behavior in Scriptable:
<ul><li>If run as a widget: sets the widget.</li>
<li>If run in app: presents a medium preview.</li>
<li>Graceful handling: if no passes found, shows a friendly message; network/location errors fall back or return null without crashing.</li></ul>


