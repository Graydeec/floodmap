/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
let map, overview;
const OVERVIEW_DIFFERENCE = 1;
const OVERVIEW_MIN_ZOOM = 14;
const OVERVIEW_MAX_ZOOM = 16;

const btn_update = document.getElementById("btn_update");
const w_input = document.getElementById("w_input");
const h_input = document.getElementById("h_input");
const t_input = document.getElementById("t_input");
const w = document.getElementById("cur_width");
const h = document.getElementById("cur_height");
const t = document.getElementById("cur_threshold");

btn_update.addEventListener("click", () => {
  const w_val = w_input.value;
  const h_val = h_input.value;
  const t_val = t_input.value;
  if (w_val != "") {
    w.innerText = w_input.value;
  }
  if (h_val != "") {
    h.innerText = h_input.value;
  }
  if (t_val != "") {
    t.innerText = t_input.value;
  }
  w_input.value = "";
  h_input.value = "";
  t_input.value = "";
  initMap();
});

class CoordMapType {
  tileSize;
  mode;
  threshold;
  alt = null;
  maxZoom = OVERVIEW_MAX_ZOOM;
  minZoom = OVERVIEW_MIN_ZOOM;
  name = null;
  projection = null;
  radius = 6378137;
  constructor(tileSize, mode, threshold) {
    this.tileSize = tileSize;
    this.mode = mode;
    this.threshold = threshold;
  }
  getTile(coord, zoom, ownerDocument) {
    var elevator = new google.maps.ElevationService();

    const div = ownerDocument.createElement("div");
    div.style.width = this.tileSize.width + "px";
    div.style.height = this.tileSize.height + "px";
    div.style.fontSize = "10";

    // div.innerHTML = "Above";
    if (this.mode == 1) {
      div.style.borderStyle = "solid";
      div.style.borderWidth = "1.5px";
      div.style.borderColor = "#AAAAAA";
      return div;
    }

    const cur_zoom = zoom - OVERVIEW_DIFFERENCE;
    const cur_tileSize = new google.maps.Size(
      this.tileSize.width / (1 << OVERVIEW_DIFFERENCE),
      this.tileSize.height / (1 << OVERVIEW_DIFFERENCE)
    );
    const location = tileCoordsToLatLng(coord, cur_zoom, cur_tileSize);
    // Request elevation data for the specified location
    elevator
      .getElevationForLocations({
        locations: location,
      })
      .then(({ results }) => {
        results.forEach((result) => {
          if (result.elevation < this.threshold) {
            div.style.borderColor = "#ABCDEF";
            div.style.backgroundColor = "red";
            div.style.opacity = "0.3";
          }
        });
      });
    return div;
  }
  releaseTile(tile) {}
}

function initMap() {
  const newyork = new google.maps.LatLng(40.716, -73.99166);
  const chicago = new google.maps.LatLng(41.85, -87.65);
  const mapOptions = {
    center: newyork,
    zoom: 15,
    maxZoom: OVERVIEW_MAX_ZOOM,
    minZoom: OVERVIEW_MIN_ZOOM,
  };
  // instantiate the primary map
  map = new google.maps.Map(document.getElementById("map"), {
    ...mapOptions,
  });

  const coordMapType = new CoordMapType(
    new google.maps.Size(
      parseInt(w.innerText) * (1 << OVERVIEW_DIFFERENCE),
      parseInt(h.innerText) * (1 << OVERVIEW_DIFFERENCE)
    ),
    0,
    parseInt(t.innerText)
  );

  map.overlayMapTypes.pop();
  map.overlayMapTypes.insertAt(0, coordMapType);

  // instantiate the overview map without controls
  overview = new google.maps.Map(document.getElementById("overview"), {
    ...mapOptions,
    disableDefaultUI: true,
    gestureHandling: "none",
    zoomControl: false,
  });

  initOverview();

  function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  map.addListener("bounds_changed", () => {
    overview.setCenter(map.getCenter());
    overview.setZoom(
      clamp(
        map.getZoom() - OVERVIEW_DIFFERENCE,
        OVERVIEW_MIN_ZOOM,
        OVERVIEW_MAX_ZOOM
      )
    );
  });
}

function initOverview() {
  const coordMapType = new CoordMapType(
    new google.maps.Size(parseInt(w.innerText), parseInt(h.innerText)),
    1,
    parseInt(t.innerText)
  );

  overview.overlayMapTypes.pop();
  overview.overlayMapTypes.insertAt(0, coordMapType);
}

window.initMap = initMap;

function tileCoordsToLatLng(coord, zoom, tileSize) {
  let wPixelX = coord.x * tileSize.width;
  let nPixelY = coord.y * tileSize.height;
  let ePixelX = (coord.x + 1) * tileSize.width - 1;
  let sPixelY = (coord.y + 1) * tileSize.height - 1;

  let wWorldX = wPixelX / Math.pow(2, zoom);
  let nWorldY = nPixelY / Math.pow(2, zoom);
  let eWorldX = ePixelX / Math.pow(2, zoom);
  let sWorldY = sPixelY / Math.pow(2, zoom);

  let nwWorldPoint = new google.maps.Point(wWorldX, nWorldY);
  let neWorldPoint = new google.maps.Point(eWorldX, nWorldY);
  let seWorldPoint = new google.maps.Point(eWorldX, sWorldY);
  let swWorldPoint = new google.maps.Point(wWorldX, sWorldY);
  return [
    map.getProjection().fromPointToLatLng(nwWorldPoint),
    map.getProjection().fromPointToLatLng(neWorldPoint),
    map.getProjection().fromPointToLatLng(seWorldPoint),
    map.getProjection().fromPointToLatLng(swWorldPoint),
  ];
}
