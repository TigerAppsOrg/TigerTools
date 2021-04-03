require(["esri/config","esri/Map", "esri/views/MapView", "esri/Graphic"], function (esriConfig, Map, MapView, Graphic) {
  esriConfig.apiKey = "AAPKa10cbf4f4ee84d8a81f04d2002446fd8Y_3foKUUP7kErbyIPzQ_yAgYfKJhlcjIrHc-ig9_ZkQC1IaANThkbpGKv4PJlCW9";

  var cafeClicks = 0;
  var printerClicks = 0;
  var diningClicks = 0;
  var clusterClicks = 0;
  var scannerClicks = 0;
  var vendingClicks = 0;

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

            let bodyString = "Details: " + graphic.attributes["building"];
            $(".modal-body-desc").text(bodyString);

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

            /*$.ajax({
              type: "POST",
              url: "http://0.0.0.0:5000/getcomments",
              data: JSON.stringify({AmenityName: $(".modal-body-desc").text()}),
              contentType: "application/json",
              success: function(comments){
                $.ajax({
                  type: "POST",
                  url: "http://0.0.0.0:5000/displaycomments",
                  data: comments,
                  contentType: "application/json",
                  success: function(response){
                    //console.log(comments.list_of_data[0][1]);
                    $("#nav-info").html(response);
                  }
                });
                console.log(comments.list_of_data[0][1]);
              }
            });*/

            $("#modalTrigger").click(); // Open the modal
          }
        }
      });
  });

  $(document).ready(function(){

    // submit comment
    $("#submitcomment").click(function(){
      var comment = $.trim($("#message-text").val());
      //var comment = $("#comment").val();
      //console.log(comment);
      if(comment != ""){
                // Show alert dialog if value is not blank
                //alert("Please enter a comment");
                $.ajax({
                  type: "POST",
                  url: "/comment",
                  data: JSON.stringify({amenityName: currentAmenityName, textComment: comment}),
                  contentType: "application/json",
                  success: function(comment){
                    $("#message-text").val("");
                  }
                });
      } else {
        alert("Please enter a comment")
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
      view.graphics.removeAll();
    });


    //$(".btn").click(function(e) {
    //e.preventDefault();
    //$(this).addClass('active');
    //});

    // Fixed Printers
    $("#printers").click(function(){
      if (printerClicks % 2 == 0) {
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({categoryid: 6}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var printer = data_array.locations.location[i];
              var amenities = printer.amenities.amenity
              for (var j = 0; j < amenities.length; j++) {
                //console.log("reached")
                if (amenities[j].name.indexOf("Printers") !== -1) {
                  //console.log("hi!");
                  addPoint(printer.geoloc.long, printer.geoloc.lat, [252, 65, 3], {name: printer.name, type:"Printer", building: printer.building.name});
                }
              }
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
        data: JSON.stringify({categoryid: 6}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var cluster = data_array.locations.location[i];
              var amenities = cluster.amenities.amenity
              for (var j = 0; j < amenities.length; j++) {
                //console.log("reached")
                if (amenities[j].name.indexOf("Macs") !== -1) {
                  //console.log("hi!");
                  addPoint(cluster.geoloc.long, cluster.geoloc.lat, [128, 128, 128], {name: cluster.name, type:"Computer Cluster", building: cluster.building.name});
                }
              }
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
        data: JSON.stringify({categoryid: 6}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var scanner = data_array.locations.location[i];
              var amenities = scanner.amenities.amenity
              for (var j = 0; j < amenities.length; j++) {
                //console.log("reached")
                if (amenities[j].name.indexOf("Scanners") !== -1) {
                  //console.log("hi!");
                  addPoint(scanner.geoloc.long, scanner.geoloc.lat, [238, 210, 2], {name: scanner.name, type:"Scanner", building: scanner.building.name});
                }
              }
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
        data: JSON.stringify({categoryid: 2}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var dhall = data_array.locations.location[i];
              addPoint(dhall.geoloc.long, dhall.geoloc.lat, [3,65,252], {name: dhall.name, type:"Dining hall", building: dhall.building.name});
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
        data: JSON.stringify({categoryid: 3}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var cafe = data_array.locations.location[i];
              addPoint(cafe.geoloc.long, cafe.geoloc.lat, [3,252,65], {name: cafe.name, type:"Café", building: cafe.building.name});
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
        data: JSON.stringify({categoryid: 4}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.locations.location.length; i++) {
              var vending_machine = data_array.locations.location[i];
              addPoint(vending_machine.geoloc.long, vending_machine.geoloc.lat, [0,0,0], {name: vending_machine.name, type:"Vending Machine", building: vending_machine.building.name});
          }
        }
      });
      vendingClicks++;
    } else {
      vendingClicks++;
      removeGraphic("Vending Machine")
    }
    });
  });

});
