
require(["esri/config","esri/Map", "esri/views/MapView", "esri/Graphic"], function (esriConfig, Map, MapView, Graphic) {
  esriConfig.apiKey = "AAPKa10cbf4f4ee84d8a81f04d2002446fd8Y_3foKUUP7kErbyIPzQ_yAgYfKJhlcjIrHc-ig9_ZkQC1IaANThkbpGKv4PJlCW9";

  var map = new Map({
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html
    // arcgis-navigation and arcgis-navigation-night look interesting - could do something with day/nighttime?
    basemap: "osm-standard" // Basemap layer service
  });

  var view = new MapView({
    map: map,
    center: [-74.657, 40.346], // Longitude, latitude of PU
    zoom: 15, // Default zoom level
    container: "viewDiv" // Div element
  });

  view.constraints = {
    geometry: {       // Constrain map movement to PU area
      type: "extent",
      xmin: -74.667,
      ymin:  40.336,
      xmax: -74.647,
      ymax:  40.356
    },
    minZoom: 15 // Constrain zooming out
  };

  function addPoint(long, lat, col, attr) {
    const point = { //Create a point
      type: "point",
      longitude: long,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: col,
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };
    const pointGraphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol,
      attributes: attr
    });
    view.graphics.add(pointGraphic);
  }

  /*
  // Some test points
  addPoint(-74.657, 40.346, [226,119,40], { name:"1903", type:"printer" });
  addPoint(-74.658, 40.347, [3,65,252], { name:"McCormick", type:"library" });
  addPoint(-74.656, 40.345, [252,3,3], { name:"Wilcox", type:"dining" });
  */

  // Function for point clicks
  view.on("click", function(event) {
    const opts = { include: view.graphics }
    view.hitTest(event, opts).then(function(response) {
        // check if a graphic is returned
        if (response.results.length) {
          const graphic = response.results[0].graphic;
          console.log("Clicked on graphic");
          console.log(graphic.attributes); // Attributes of graphic
          $(".modal-title").text(graphic.attributes["name"] + " " + graphic.attributes["type"]); // Modify the modal
          $("#modalTrigger").click(); // Open the modal
        }
      });
  });

  $(document).ready(function(){
    $("#reset").click(function(){
      view.graphics.removeAll();
    });
    $("#printers").click(function(){
      $.getJSON( "printers_scanners.json", function(json1) {
          for (var i = 0; i < json1.length; i++) {
            var location = json1[i];
            addPoint(location.geoloc.long, location.geoloc.lat, [252,3,3], {name: location.name, type:"Printer"});
          }
      });
    });
    $("#dhalls").click(function(){
      $.getJSON( "dining_halls.json", function(json1) {
          for (var i = 0; i < json1.length; i++) {
            var location = json1[i];
            addPoint(location.geoloc.long, location.geoloc.lat, [3,65,252], {name: location.name, type:""});
          }
      });
    });
    $("#libraries").click(function(){
      $.getJSON( "printers_scanners.json", function(json1) {
          for (var i = 0; i < json1.length; i++) {
            var location = json1[i];
            addPoint(location.geoloc.long, location.geoloc.lat, [3,252,3], {name: location.name, type:""});
          }
      });
    });
    $("#bathrooms").click(function(){
    });
  });

});