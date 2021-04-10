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
  var map = new Map({
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html
    // arcgis-navigation and arcgis-navigation-night look interesting - could do something with day/nighttime?
    // osm-standard
    basemap: "arcgis-navigation" // Basemap layer service
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
    minZoom: 14 // Constrain zooming out
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
        color: [255, 255, 255], // White outine
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

  // Remove all points of a certain type
  function removeGraphic(amenityType) {
    if (view.graphics.length) {
      for (i = 0; i < view.graphics.length; i++) {
        if (view.graphics.getItemAt(i).attributes.type == amenityType) {
          view.graphics.remove(view.graphics.getItemAt(i));
          i--;
        }
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
            // console.log("Clicked on graphic"); // console.log for testing purposes
            // console.log(graphic.attributes); // Attributes of graphic

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
        $("#nav-info").html('<h5 class="text-center">Loading...</h5>');
        $("#nav-home-tab").click();

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
      view.graphics.removeAll();
    });


    //$(".btn").click(function(e) {
    //e.preventDefault();
    //$(this).addClass('active');
    //});

    // Printers
    $("#printers").click(function(){
      if (printerClicks % 2 == 0) {
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
              addPoint(printer.long, printer.lat, [252, 65, 3], {name: printer.name, type:"Printer", building: printer.buildingname});
          }
        }
      });
      printerClicks++;
    } else {
      printerClicks++;
      removeGraphic("Printer")
    }
    });

    // Computer Clusters
    $("#clusters").click(function(){
      if (clusterClicks % 2 == 0) {
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
              addPoint(cluster.long, cluster.lat, [255, 193, 7], {name: cluster.name, type:"Computer Cluster", building: cluster.buildingname});
          }
        }
      });
      clusterClicks++;
    } else {
      clusterClicks++;
      removeGraphic("Computer Cluster")
    }
    });

    // Scanners
    $("#scanners").click(function(){
      if (scannerClicks % 2 == 0) {
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
              addPoint(scanner.long, scanner.lat, [133, 92, 214], {name: scanner.name, type:"Scanner", building: scanner.buildingname});
          }
        }
      });
      scannerClicks++;
    } else {
      scannerClicks++;
      removeGraphic("Scanner")
    }
    });

    // Dining Halls
    $("#dhalls").click(function(){
      if (diningClicks % 2 == 0) {
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
              addPoint(dhall.long, dhall.lat, [3,65,252], {name: dhall.name, type:"Dining hall", building: dhall.buildingname});
          }
        }
      });
      diningClicks++;
    } else {
      diningClicks++;
      removeGraphic("Dining hall")
    }
    });

    // Cafés
    $("#cafes").click(function(){
      if (cafeClicks % 2 == 0) {
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
              addPoint(cafe.long, cafe.lat, [40, 167, 69], {name: cafe.name, type:"Café", building: cafe.buildingname});
          }
        }
      });
      cafeClicks++;
    } else {
      cafeClicks++;
      removeGraphic("Café")
    }
    });

    // Vending Machines
    $("#vending").click(function(){
      if (vendingClicks % 2 == 0) {
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
              addPoint(vending_machine.long, vending_machine.lat, [108, 117, 125], {name: vending_machine.name,
                type:"Vending Machine", building: vending_machine.buildingname});
          }
        }
      });
      vendingClicks++;
    } else {
      vendingClicks++;
      removeGraphic("Vending Machine")
    }
    });

    // Athletic Facilities
    $("#athletics").click(function(){
      if (athleticsClicks % 2 == 0) {
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
              addPoint(athletic_facility.long * (-1), athletic_facility.lat, [255, 163, 26],
               {name: athletic_facility.buildingname, type:"Athletic Facility", building: athletic_facility.sports});
          }
        }
      });
      athleticsClicks++;
    } else {
      athleticsClicks++;
      removeGraphic("Athletics")
    }
    });

    // Bottle Filling Stations NEED LAT LONG DATA FOR BUILDINGS
    // $("#water").click(function(){
    //   if (waterClicks % 2 == 0) {
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
    //           var water_station = data_array[i];
    //           addPoint(water_station.long, water_station.lat, [72, 129, 234], {name: water_station.name, type:"Vending Machine", building: water_station.buildingname});
    //       }
    //     }
    //   });
    //   waterClicks++;
    // } else {
    //   waterClicks++;
    //   removeGraphic("Water Filling")
    // }
    // });
  });

});
