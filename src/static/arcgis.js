export class ArcGIS {
  constructor() {
    this.map = null;
    this.locLayer = null;
    this.view = null;
    this.clusters = [];
    this.clusterDist = 0.00033;
    this.currentAmenityName = "";
  }

  // Initialize the map
  initialize() {
    require(["esri/config","esri/Map", "esri/views/MapView", "esri/core/watchUtils", "esri/layers/GraphicsLayer"],
      (esriConfig, Map, MapView, watchUtils, GraphicsLayer) => {

      esriConfig.apiKey = "AAPKa10cbf4f4ee84d8a81f04d2002446fd8Y_3foKUUP7kErbyIPzQ_yAgYfKJhlcjIrHc-ig9_ZkQC1IaANThkbpGKv4PJlCW9";

      // Set up map
      var map = new Map({
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html
        // arcgis-navigation and arcgis-navigation-night look interesting - could do something with day/nighttime?
        // osm-standard
        basemap: "arcgis-navigation", // Basemap layer service
      });

      // GraphicsLayer for holding user location
      var locLayer = new GraphicsLayer({
        graphics: []
      });

      map.add(locLayer);

      // Set up MapView on which to render graphics
      var view = new MapView({
        map: map,
        center: [-74.657, 40.345], // Longitude, latitude of PU
        zoom: 15, // Default zoom level
        container: "viewDiv" // Div element
      });

      view.constraints = {
        /*geometry: {       // Constrain map movement to PU area
          type: "extent",
          xmin: -74.667,
          ymin:  40.336,
          xmax: -74.647,
          ymax:  40.356
        },*/
        minZoom: 12 // Constrain zooming out
      };

      // When view is stationary, change cluster draw distance and re-render.
      watchUtils.whenTrue(view, "stationary", () => {
        if (view.zoom) {
          this.clusterDist = 0.00033 * Math.pow(2, 15-view.zoom);
          if (this.view != null)
            this.renderAll();
        }
      });

      // Things to do once the view is ready
      view.when(() => {
        // Move arcgis zoom buttons to top right
        view.ui.move([ "zoom" ], "top-right");

        // Handle point/cluster clicks
        view.on("click", (event) => {
          const opts = { include: view.graphics };
          view.hitTest(event, opts).then((response) => {
            // Check if a graphic is returned
            if (response.results.length && !response.results[0].graphic.attributes.layerId) {
              const graphic = response.results[0].graphic;
              const attr = graphic.attributes;

              // Toggle showing cluster points if user clicked on cluster
              if (attr.pts) {
                this.toggleCluster(graphic);
              }

              else {
                // Don't open modal if users click before map fully loads
                if (!("type" in attr)) {
                  return;
                }

                // Set title
                let titleString = attr["type"] + " - " + attr["name"];
                $(".modal-title").text(titleString);

                this.currentAmenityName = titleString;

                // Display information
                $.ajax({
                  type: "POST",
                  url: "/info",
                  data: JSON.stringify(attr),
                  contentType: "application/json",
                  success: function(response){
                    $("#info-div").html(response);
                  }
                });

                // Autofill work order inputs: building, room, floor
                var building = attr.building;
                var room = attr.room;
                var floor = attr.floor;
                if (building != "None")
                  $("#building").attr("value", building);
                if (room != "None")
                  $("#room").attr("value", room);
                if (floor != "None" && floor != "N/A")
                  $("#floor").attr("value", floor);

                // Autofill hidden fields: locationcode, buildingcode, asset, locationmore
                if ("locationcode" in attr)
                  $("#locationcode").attr("value", attr.locationcode);
                if ("buildingcode" in attr)
                  $("#buildingcode").attr("value", attr.buildingcode);
                if ("asset" in attr)
                  $("#asset").attr("value", attr.asset);
                if ("locationmore" in attr)
                  $("#locationmore").attr("value", attr.locationmore);

                //$("#modalTrigger").click(); // Open the modal
                $("#myModal").modal('show'); // Open the modal
              }
            }
          });
        });
      });

      this.view = view;
      this.map = map;
      this.locLayer = locLayer;
    });
  }
  
  // Create a normal point
  createPoint(long, lat, col, attr) {
    var pointGraphic;
    require(["esri/Graphic"], (Graphic) => {
      const point = { //Create a point
        type: "point",
        longitude: long,
        latitude: lat
      };
      const simpleMarkerSymbol = {
        type: "simple-marker",
        color: col,
        outline: {
          color: [0,0,0], // Black outine
          width: 0.7
        }
      };
      pointGraphic = new Graphic({
        geometry: point,
        symbol: simpleMarkerSymbol,
        attributes: attr
      });
    });
    return pointGraphic;
  }

  

  // Create a new cluster point if the input point's long/lat doesn't match any cluster's long/lat
  checkPointCluster(point) {
    let isCluster = false;
    var radius = 0.00015; // Radius to search for nearby cluster
    for (let j = 0; j < this.clusters.length; j++) {
      var longDist = this.clusters[j].geometry.longitude - point.geometry.longitude;
      var latDist = this.clusters[j].geometry.latitude - point.geometry.latitude;
      if (Math.abs(longDist) <= radius && Math.abs(latDist) <= radius) {
        isCluster = true;
        this.clusters[j].attributes.pts.push(point);
        break;
      }
    }
    if (!isCluster) {
      var clust = this.createCluster(point.geometry.longitude, point.geometry.latitude, {pts: [point], isOpen: false, temp: []});
      this.clusters.push(clust);
    }
  }

  // Re-render all clusters/points
  renderAll() {
    this.view.graphics.removeAll();

    for (let i = 0; i < this.clusters.length; i++) {
      let cluster = this.clusters[i];
      let pts = cluster.attributes.pts;
      let numPts = pts.length;

      if (numPts > 1)
      {
        this.view.graphics.add(cluster); // Add cluster itself to map if it contains >1 point
        if (cluster.attributes.isOpen) // If cluster was previously open, re-render its points
        {
          cluster.attributes.temp = [];
          for (let j = 0; j < numPts; j++) {
            var sinDist = this.clusterDist * Math.sin(2.0*Math.PI * j / numPts);
            var cosDist = this.clusterDist * Math.cos(2.0*Math.PI * j / numPts);
            var point = this.createPoint(cluster.geometry.longitude + sinDist*1.25, cluster.geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
            this.view.graphics.add(point);
            cluster.attributes.temp.push(point);
          }
        }
      }
      else if (numPts == 1) { // Cluster has only one point; render it (and close the cluster if necessary)
        this.view.graphics.add(pts[0]);
        if (cluster.attributes.isOpen) {
          cluster.attributes.isOpen = false;
          var newCluster = this.createCluster(cluster.geometry.longitude, cluster.geometry.latitude, cluster.attributes);
          this.clusters.splice(this.clusters.indexOf(cluster), 1, newCluster);
        }
      }
      else { // Cluster is empty; remove it
        this.clusters.splice(this.clusters.indexOf(cluster), 1);
        i--;
      }
    }
  }

  // Create a cluster point
  createCluster(long, lat, attr) {
    var pointGraphic;
    require(["esri/Graphic"], (Graphic) => {
      // Cluster symbol
      const expandSymbol = {
        type: "text",
        color: "#8600e6",
        text: "\ue63c",
        xoffset: 0.5,
        yoffset: -9.5,
        font: {
          size: 16,
          family: "CalciteWebCoreIcons"
        }
      };
      const point = { //Create a point
        type: "point",
        longitude: long,
        latitude: lat
      };
      pointGraphic = new Graphic({
        geometry: point,
        symbol: expandSymbol,
        attributes: attr
      });
    });
    return pointGraphic;
  }

  // Create an open cluster point
  createOpenCluster(long, lat, attr) {
    var pointGraphic;
    require(["esri/Graphic"], (Graphic) => {
      // Cluster opened symbol
      const contractSymbol = {
        type: "text",
        color: "#8600e6",
        text: "\ue63b",
        xoffset: 0.5,
        yoffset: -9.5,
        font: {
          size: 16,
          family: "CalciteWebCoreIcons"
        }
      };
      const point = { //Create a point
        type: "point",
        longitude: long,
        latitude: lat
      };
      pointGraphic = new Graphic({
        geometry: point,
        symbol: contractSymbol,
        attributes: attr
      });
    });
    return pointGraphic;
  }

  // Toggle showing points contained in cluster
  toggleCluster(cluster) {
    // Close the cluster
    if (cluster.attributes.isOpen == true) {
      cluster.attributes.isOpen = false;
      for (let j = 0; j < cluster.attributes.temp.length; j++) {
        this.view.graphics.remove(cluster.attributes.temp[j]);
      }
      cluster.attributes.temp = [];

      // Replace the cluster symbol
      var newCluster = this.createCluster(cluster.geometry.longitude, cluster.geometry.latitude, cluster.attributes);
      this.clusters.splice(this.clusters.indexOf(cluster), 1, newCluster);
      this.view.graphics.remove(cluster);
      this.view.graphics.add(newCluster);
    }
    // Open the cluster
    else {
      // Replace the cluster symbol (must be done before rendering contained pins)
      var newCluster = this.createOpenCluster(cluster.geometry.longitude, cluster.geometry.latitude, cluster.attributes);
      this.clusters.splice(this.clusters.indexOf(cluster), 1, newCluster);
      this.view.graphics.remove(cluster);
      this.view.graphics.add(newCluster);

      let pts = newCluster.attributes.pts;
      let numPts = pts.length;

      newCluster.attributes.isOpen = true;
      for (let j = 0; j < numPts; j++) {
        var sinDist = this.clusterDist * Math.sin(2.0*Math.PI * j / numPts);
        var cosDist = this.clusterDist * Math.cos(2.0*Math.PI * j / numPts);
        var point = this.createPoint(newCluster.geometry.longitude + sinDist*1.25, newCluster.geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
        this.view.graphics.add(point);
        newCluster.attributes.temp.push(point);
      }
    }
  }

  // Remove all points of a certain type
  removeGraphic(amenityType) {
    for (let j = 0; j < this.clusters.length; j++) {
      pts = this.clusters[j].attributes.pts;
      for (let k = 0; k < pts.length; k++) {
        if (pts[k].attributes.type == amenityType) {
          pts.splice(k, 1);
          k--;
        }
      }
    }
    this.renderAll();
  }

  // Attempt to get location of user and show position on map
  handlePosition() {
    // Get location of user
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {this.showPosition(position);}, this.handleLocationError);
      // watchPosition doesn't work with firefox location-spoofing addon
    }
    else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  // Update user position
  showPosition(position) {
    require(["esri/Graphic"], (Graphic) => {
      this.locLayer.removeAll();

      var lat = position.coords.latitude;
      var long = position.coords.longitude;

      // Create new location graphic
      var locGraphic = new Graphic({
        geometry: {
          type: "point",
          longitude: long,
          latitude: lat
        },
        symbol: {
          type: "simple-marker",
          color: [255, 0, 255],
          outline: {
            color: [255,255,255],
            width: 0.7
          }
        }
      });

      this.locLayer.graphics.push(locGraphic);

      this.view.center = [long, lat];

      $("#trackUser").html("<i class='fas fa-map-marker-alt'></i> Update Location");
    });
  }

  // Handle location error
  handleLocationError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        $("#location-error").slideDown("slow").delay(15000).slideUp("slow");
        console.log("User denied the request for Geolocation, or HTTPS is not used.");
        break;
      case error.POSITION_UNAVAILABLE:
        $("#position-error").slideDown("slow").delay(10000).slideUp("slow");
        console.log("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        $("#timeout-error").slideDown("slow").delay(10000).slideUp("slow");
        console.log("The request to get user location timed out.");
        break;
      case error.UNKNOWN_ERROR:
        $("#unknown-error").slideDown("slow").delay(10000).slideUp("slow");
        console.log("An unknown error occurred.");
        break;
    }
  }

  // Clear everything from map
  clearAll() {
    this.view.graphics.removeAll();
    this.clusters = [];
  }
}