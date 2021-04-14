require(["esri/config","esri/Map", "esri/views/MapView", "esri/Graphic", "esri/widgets/Track"], function (esriConfig, Map, MapView, Graphic, Track) {
  esriConfig.apiKey = "AAPKa10cbf4f4ee84d8a81f04d2002446fd8Y_3foKUUP7kErbyIPzQ_yAgYfKJhlcjIrHc-ig9_ZkQC1IaANThkbpGKv4PJlCW9";

  var cafeClicks = 0;
  var printerClicks = 0;
  var diningClicks = 0;
  var clusterClicks = 0;
  var scannerClicks = 0;
  var vendingClicks = 0;
  // var waterClicks = 0;
  var athleticsClicks = 0;

  let currentAmenityName = "";

  // Track all clusters
  var clusters = [];

  // Cluster symbol
  const expandSymbol = {
    type: "text",
    color: "#8600e6",
    text: "\ue63d",
    xoffset: 0,
    yoffset: -10,
    font: {
      size: 16,
      family: "CalciteWebCoreIcons"
    }
  };

  // Set up map
  var map = new Map({
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html
    // arcgis-navigation and arcgis-navigation-night look interesting - could do something with day/nighttime?
    // osm-standard
    basemap: "arcgis-navigation", // Basemap layer service
  });

  // Set up MapView on which to render graphics
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
    minZoom: 14 // Constrain zooming out
  };

  // Create a normal point
  function createPoint(long, lat, col, attr) {
    const point = { //Create a point
      type: "point",
      longitude: long,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: col,
      outline: {
        color: [255, 255, 255], // White outine
        width: 1
      }
    };
    const pointGraphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol,
      attributes: attr
    });
    return pointGraphic;
  }

  // Create a cluster point
  function checkPointCluster(point) {
    let isCluster = false;
    for (let j = 0; j < clusters.length; j++) {
      if (clusters[j].geometry.longitude == point.geometry.longitude && clusters[j].geometry.latitude == point.geometry.latitude) {
        isCluster = true;
        clusters[j].attributes.pts.push(point);
        break;
      }
    }
    if (!isCluster) {
      clust = createCluster(point.geometry.longitude, point.geometry.latitude, {pts: [point], isOpen: false, temp: []});
      clusters.push(clust);
    }
  }

  function createCluster(long, lat, attr) {
    const point = { //Create a point
      type: "point",
      longitude: long,
      latitude: lat
    };
    const pointGraphic = new Graphic({
      geometry: point,
      symbol: expandSymbol,
      attributes: attr
    });
    return pointGraphic;
  }



  // Remove all points of a certain type
  function removeGraphic(amenityType) {
    /*if (view.graphics.length) {
      for (i = 0; i < view.graphics.length; i++) {
        if (view.graphics.getItemAt(i).attributes.type == amenityType) {
          view.graphics.remove(view.graphics.getItemAt(i));
          i--;
        }
      }
    }*/
    for (let j = 0; j < clusters.length; j++) {
      pts = clusters[j].attributes.pts;
      for (let k = 0; k < pts.length; k++) {
        if (pts[k].attributes.type == amenityType) {
          pts.splice(k, 1);
          k--;
        }
      }
    }
    renderAll();
  }

  // Re-render all clusters/points
  function renderAll() {
    view.graphics.removeAll();

    for (let i = 0; i < clusters.length; i++) {
      let pts = clusters[i].attributes.pts;
      let numPts = pts.length;

      if (numPts > 1)
      {
        view.graphics.add(clusters[i]); // Add cluster itself to map if it contains >1 point
        if (clusters[i].attributes.isOpen) // If cluster was previously open, render its points
        {
          clusters[i].attributes.temp = [];
          for (let j = 0; j < numPts; j++) {
            sinDist = 0.00025 * Math.sin(2.0*Math.PI * j / numPts);
            cosDist = 0.00025 * Math.cos(2.0*Math.PI * j / numPts);
            point = createPoint(pts[j].geometry.longitude + sinDist, pts[j].geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
            view.graphics.add(point);
            clusters[i].attributes.temp.push(point);
          }
        }
      }
      else if (numPts == 1) { // Cluster has only one point; render it
        view.graphics.add(clusters[i].attributes.pts[0]);
        clusters[i].attributes.isOpen = false;
      }
      else // Cluster is empty
        clusters[i].attributes.isOpen = false;
    }
  }

  // Toggle showing points contained in cluster
  function toggleCluster(cluster) {
    let pts = cluster.attributes.pts;
    let numPts = pts.length;

    if (cluster.attributes.isOpen == true) {
      cluster.attributes.isOpen = false;
      for (let j = 0; j < cluster.attributes.temp.length; j++) {
        view.graphics.remove(cluster.attributes.temp[j]);
      }
      cluster.attributes.temp = [];
    }
    else {
      cluster.attributes.isOpen = true;
      for (let j = 0; j < numPts; j++) {
        sinDist = 0.00025 * Math.sin(2.0*Math.PI * j / numPts);
        cosDist = 0.00025 * Math.cos(2.0*Math.PI * j / numPts);
        point = createPoint(pts[j].geometry.longitude + sinDist, pts[j].geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
        view.graphics.add(point);
        cluster.attributes.temp.push(point);
      }
    }
  }

  // Create tracking widget
  var track = new Track({
    view: view,
    /*graphic: new Graphic({
      symbol: {
        type: "simple-marker",
        size: "12px",
        color: "green",
        outline: {
          color: "#efefef",
          width: "1.5px"
        }
      }
    }),*/
    useHeadingEnabled: false // Prevent map view from rotating
  });
  view.ui.add(track, "top-left");

  // Start tracking once view becomes ready
  view.when(function() {
    view.ui.move([ "zoom", track ], "top-right");
    track.start();
  });

  // Function for point clicks
  view.on("click", function(event) {
    const opts = { include: view.graphics }
    view.hitTest(event, opts).then(function(response) {
        // check if a graphic is returned
        if (response.results.length) {
          const graphic = response.results[0].graphic;
          if (!graphic.attributes.layerId) { // Bandaid solution to clicking on map when no graphics

            if (graphic.attributes.pts) {
              toggleCluster(graphic);
            }

            else {

            let titleString = graphic.attributes["type"] + " - " + graphic.attributes["name"];
            $(".modal-title").text(titleString); // Modify the modal

            //let bodyString = "Details: " + graphic.attributes["building"];
            //$(".modal-body-desc").text(bodyString);

            currentAmenityName = graphic.attributes["type"] + " - " + graphic.attributes["name"];
            $.ajax({
              type: "POST",
              url: "/displaycomments",
              data: JSON.stringify({amenityName: titleString}),
              contentType: "application/json",
              success: function(response){
                $("#nav-info").html(response);
              }
            });

            $("#modalTrigger").click(); // Open the modal

            }
          }
        }
      });
  });

  $(document).ready(function(){
    $("#nav-workorder-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-lg", "modal-xl", 300, "easeInOutQuad");
    });
    $("#nav-comment-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
    });
    $("#nav-home-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
      $.ajax({
        type: "POST",
        url: "/displaycomments",
        data: JSON.stringify({amenityName: currentAmenityName}),
        contentType: "application/json",
        success: function(response){
          $("#nav-info").html(response);
        }
      });
    });


    // When modal is closed, reset its content
    $("#myModal").on("hidden.bs.modal", function () {
        // Reset work order form
        var form = $("#workorder-form");
        form[0].reset();
        form.removeClass("was-validated");

        // Reset info content and set info tab as active
        $("#nav-home-tab").tab("show");
        $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
        $("#nav-info").html('<h5 class="text-center">Loading...</h5>');

        // Reset submit form
        var form = $("#submit-form");
        form[0].reset();
        form.removeClass("was-validated");
    });

    // Validate required fields in work order form when user clicks submit
    $("#open-confirmation").click(function(event){
      var form = $("#workorder-form");
      if (form[0].checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.addClass("was-validated");
    });

    // Close the confirmation modal when clicking submit button
    $("#confirm-btn").click(function(){
      $("#confirm-close").click();
    });

    // Submit comment
    $("#submitcomment").click(function(){
      var comment = $.trim($("#message-text").val());
      // If value is not blank, submit comment and reset form
      if(comment != ""){
        $("#submit-form").removeClass("was-validated");
        $.ajax({
          type: "POST",
          url: "/comment",
          data: JSON.stringify({amenityName: currentAmenityName, textComment: comment}),
          contentType: "application/json",
          success: function(comment){
            $("#message-text").val("");
          }
        });
      // If value is blank, alert user to enter something
      } else {
        $("#submit-form").addClass("was-validated");
      }
    });

    // Reset/remove all graphics
    $("#reset").click(function(){
      cafeClicks++;
      printerClicks++;
      diningClicks++;
      clusterClicks++;
      scannerClicks++;
      vendingClicks++;
      // waterClicks++;
      athleticsClicks++;
      $("#printers").switchClass("btn-danger", "btn-outline-danger");
      $("#clusters").switchClass("btn-warning", "btn-outline-warning");
      $("#scanners").switchClass("btn-danger", "btn-outline-danger");
      $("#dhalls").switchClass("btn-primary", "btn-outline-primary");
      $("#cafes").switchClass("btn-success", "btn-outline-success");
      $("#vending").switchClass("btn-secondary", "btn-outline-secondary");
      $("#athletics").switchClass("btn-dark", "btn-outline-dark");
      // $("#water").switchClass("btn-info", "btn-outline-info");

      //view.graphics.removeAll();
      removeGraphic("Printer");
      removeGraphic("Computer Cluster");
      removeGraphic("Scanner");
      removeGraphic("Dining hall");
      removeGraphic("Café");
      removeGraphic("Vending Machine");
      removeGraphic("Athletic Facility");
    });


    //$(".btn").click(function(e) {
    //e.preventDefault();
    //$(this).addClass('active');
    //});

    // Printers
    $("#printers").click(function(){
      if (printerClicks % 2 == 0) {
      $("#printers-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "printers"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var printer = data_array[i];
            point = createPoint(printer.long, printer.lat, [220, 53, 69], {name: printer.name, type:"Printer", building: printer.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#printers").switchClass("btn-outline-danger", "btn-danger");
          $("#printers-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          printerClicks++;
        }
      });
    } else {
      removeGraphic("Printer");
      $("#printers").switchClass("btn-danger", "btn-outline-danger");
      printerClicks++;
    }
    });

    // Computer Clusters
    $("#clusters").click(function(){
      if (clusterClicks % 2 == 0) {
      $("#clusters-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "macs"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var cluster = data_array[i];
            point = createPoint(cluster.long, cluster.lat, [255, 193, 7], {name: cluster.name, type:"Computer Cluster", building: cluster.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#clusters").switchClass("btn-outline-warning", "btn-warning");
          $("#clusters-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          clusterClicks++;
        }
      });
    } else {
      removeGraphic("Computer Cluster");
      $("#clusters").switchClass("btn-warning", "btn-outline-warning");
      clusterClicks++;
    }
    });

    // Scanners
    $("#scanners").click(function(){
      if (scannerClicks % 2 == 0) {
      $("#scanners-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "scanners"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var scanner = data_array[i];
            point = createPoint(scanner.long, scanner.lat, [128, 0, 0], {name: scanner.name, type:"Scanner", building: scanner.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#scanners").switchClass("btn-outline-danger", "btn-danger");
          $("#scanners-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          scannerClicks++;
        }
      });
    } else {
      removeGraphic("Scanner");
      $("#scanners").switchClass("btn-danger", "btn-outline-danger");
      scannerClicks++;
    }
    });

    // Dining Halls
    $("#dhalls").click(function(){
      if (diningClicks % 2 == 0) {
      $("#dhalls-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "dining"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var dhall = data_array[i];
            point = createPoint(dhall.long, dhall.lat, [0, 123, 255], {name: dhall.name, type:"Dining hall", building: dhall.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#dhalls").switchClass("btn-outline-primary", "btn-primary");
          $("#dhalls-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          diningClicks++;
        }
      });
    } else {
      removeGraphic("Dining hall");
      $("#dhalls").switchClass("btn-primary", "btn-outline-primary");
      diningClicks++;
    }
    });

    // Cafés
    $("#cafes").click(function(){
      if (cafeClicks % 2 == 0) {
      $("#cafes-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "cafes"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var cafe = data_array[i];
            point = createPoint(cafe.long, cafe.lat, [40, 167, 69], {name: cafe.name, type:"Café", building: cafe.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#cafes").switchClass("btn-outline-success", "btn-success");
          $("#cafes-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          cafeClicks++;
        }
      });
    } else {
      removeGraphic("Café");
      $("#cafes").switchClass("btn-success", "btn-outline-success");
      cafeClicks++;
    }
    });

    // Vending Machines
    $("#vending").click(function(){
      if (vendingClicks % 2 == 0) {
      $("#vending-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "vendingmachines"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var vending_machine = data_array[i];
            point = createPoint(vending_machine.long, vending_machine.lat, [108, 117, 125], {name: vending_machine.name,
              type:"Vending Machine", building: vending_machine.buildingname});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#vending").switchClass("btn-outline-secondary", "btn-secondary");
          $("#vending-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          vendingClicks++;
        }
      });
    } else {
      removeGraphic("Vending Machine");
      $("#vending").switchClass("btn-secondary", "btn-outline-secondary");
      vendingClicks++;
    }
    });

    // Athletic Facilities
    $("#athletics").click(function(){
      if (athleticsClicks % 2 == 0) {
      $("#athletics-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "athletics"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var athletic_facility = data_array[i];
            point = createPoint(athletic_facility.long * (-1), athletic_facility.lat, [34, 38, 42],
              {name: athletic_facility.buildingname, type:"Athletic Facility", building: athletic_facility.sports});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#athletics").switchClass("btn-outline-dark", "btn-dark");
          $("#athletics-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
          athleticsClicks++;
        }
      });
    } else {
      removeGraphic("Athletic Facility");
      $("#athletics").switchClass("btn-dark", "btn-outline-dark");
      athleticsClicks++;
    }
    });

    // Bottle Filling Stations NEED LAT LONG DATA FOR BUILDINGS
    // $("#water").click(function(){
    //   if (waterClicks % 2 == 0) {
    //   $("#water-load").switchClass("d-none", "d-inline-flex"); // Show loading symbol on start
    //   $.ajax({
    //     type: "POST",
    //     url: "/points",
    //     //url: "http://0.0.0.0:5000/points",
    //     data: JSON.stringify({amenity_type: "water"}),
    //     contentType: "application/json",
    //     success: function(json_data){
    //       data_array = JSON.parse(json_data)
    //       console.log(data_array);
    //       for (var i = 0; i < data_array.length; i++) {
    //         var water_station = data_array[i];
    //         addPoint(water_station.long, water_station.lat, [23, 162, 184], {name: water_station.name, type:"Vending Machine", building: water_station.buildingname});
    //
    //         // Create new cluster if doesnt exist already
    //         checkPointCluster(point);
    //       }
    //
    //       // Re-render points and clusters
    //       renderAll();
    //
    //       $("#water").switchClass("btn-outline-info", "btn-info");
    //       $("#water-load").switchClass("d-inline-flex", "d-none"); // Hide loading symbol on finish
    //       waterClicks++;
    //     }
    //   });
    //   
    // } else {
    //   removeGraphic("Water Filling");
    //   $("#water").switchClass("btn-info", "btn-outline-info");
    //   waterClicks++;
    // }
    // });
  });

});
