require(["esri/config","esri/Map", "esri/views/MapView", "esri/Graphic", "esri/widgets/Track", "esri/core/watchUtils", "esri/layers/GraphicsLayer"], function (esriConfig, Map, MapView, Graphic, Track, watchUtils, GraphicsLayer) {
  esriConfig.apiKey = "AAPKa10cbf4f4ee84d8a81f04d2002446fd8Y_3foKUUP7kErbyIPzQ_yAgYfKJhlcjIrHc-ig9_ZkQC1IaANThkbpGKv4PJlCW9";

  var currentAmenityName = "";

  // Track all clusters
  var clusters = [];
  var clusterDist = 0.00033;

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
        color: [0,0,0], // Black outine
        width: 0.7
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

  // Create a new cluster point if the input point's long/lat doesn't match any cluster's long/lat
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
            sinDist = clusterDist * Math.sin(2.0*Math.PI * j / numPts);
            cosDist = clusterDist * Math.cos(2.0*Math.PI * j / numPts);
            point = createPoint(pts[j].geometry.longitude + sinDist*1.25, pts[j].geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
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
        sinDist = clusterDist * Math.sin(2.0*Math.PI * j / numPts);
        cosDist = clusterDist * Math.cos(2.0*Math.PI * j / numPts);
        point = createPoint(pts[j].geometry.longitude + sinDist*1.25, pts[j].geometry.latitude + cosDist, pts[j].symbol.color, pts[j].attributes);
        view.graphics.add(point);
        cluster.attributes.temp.push(point);
      }
    }
  }

  // Remove all points of a certain type
  function removeGraphic(amenityType) {
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

  // GraphicsLayer for holding user location
  var layer = new GraphicsLayer({
    graphics: []
  });
  map.add(layer);

  var initPos = true;

  // Continually update user position
  function showPosition(position) {
    layer.removeAll();

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
        color: [102, 153, 255],
        outline: {
          color: [255,255,255],
          width: 0.7
        }
      }
    });
    
    layer.graphics.push(locGraphic);

    if (initPos) {
      initPos = false;
      view.center = [long, lat];
    }
  }

  // Handle location error
  function handleLocationError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        console.log("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        break;
      case error.UNKNOWN_ERROR:
        console.log("An unknown error occurred.");
        break;
    }
  }

  // Start tracking once view becomes ready
  view.when(function() {
    // Move arcgis zoom buttons to top right
    view.ui.move([ "zoom" ], "top-right");

    // Watch for location changes
    // https://www.w3schools.com/html/html5_geolocation.asp
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(showPosition, handleLocationError);
    }
    else {
      console.log("Geolocation is not supported by this browser.");
    }

    // Handle point/cluster clicks
    view.on("click", function(event) {
      const opts = { include: view.graphics }
      view.hitTest(event, opts).then(function(response) {
        // Check if a graphic is returned
        const graphic = response.results[0].graphic;
        if (response.results.length && !graphic.attributes.layerId) {

          const attr = graphic.attributes;

          // Toggle showing cluster points if user clicked on cluster
          if (attr.pts) {
            toggleCluster(graphic);
          }

          else {
            // Set title
            let titleString = attr["type"] + " - " + attr["name"];
            $(".modal-title").text(titleString);

            // Get information
            $.ajax({
              type: "POST",
              url: "/info",
              data: JSON.stringify(attr),
              contentType: "application/json",
              success: function(response){
                $("#info-div").html(response);
              }
            });

            currentAmenityName = titleString;

            // Get comments
            $.ajax({
              type: "POST",
              url: "/displaycomments",
              data: JSON.stringify({amenityName: titleString}),
              contentType: "application/json",
              success: function(response){
                $("#comment-div").html(response);
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

            $("#modalTrigger").click(); // Open the modal
          }
        }
      });
    });
  });

  // When view is stationary, change cluster draw distance and re-render.
  watchUtils.whenTrue(view, "stationary", function() {
    if (view.zoom) {
      clusterDist = 0.00033 * Math.pow(2, 15-view.zoom);
      renderAll();
    }
  });

  // Alert users of AJAX error
  $(document).ajaxError(function (event, jqXHR, settings, thrownError) {
    $("#ajax-error").slideDown("slow").delay(4000).slideUp("slow");
  });

  $(document).ready(function(){
    var printerClicks = 0;
    var diningClicks = 0;
    var clusterClicks = 0;
    var cafeClicks = 0;
    var scannerClicks = 0;
    var vendingClicks = 0;
    var waterClicks = 0;
    var athleticsClicks = 0;

    var printerLoading = false;
    var diningLoading = false;
    var clusterLoading = false;
    var cafeLoading = false;
    var scannerLoading = false;
    var vendingLoading = false;
    var waterLoading = false;
    var athleticsLoading = false;

    // Handle work order form submit
    // https://code.tutsplus.com/tutorials/submit-a-form-without-page-refresh-using-jquery--net-59
    $("form").on("submit", function(e) {
      var dataString = $(this).serialize();
      $.ajax({
        type: "POST",
        url: "/wkorder",
        data: dataString,
        success: function () {
          // Show confirmation message
          $("#workorder-success").slideDown("slow").delay(4000).slideUp("slow");

          // Reset work order form
          var form = $("#workorder-form");
          form[0].reset();
          form.removeClass("was-validated");

          // Set main info tab as active
          $("#nav-home-tab").tab("show");
          $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
        }
      });
      // Prevent form from doing default submit & page refresh
      e.preventDefault();
    });

    // Filtering menu search bar
    var oldSearch = "";
    $("#buttonsearch").on("change keyup paste", function() {
      var currentSearch = $(this).val();
      if(currentSearch == oldSearch) {
        return; //check to prevent multiple simultaneous triggers
      }
      oldSearch = currentSearch;
      var matches = 0;
      //action to be performed on textarea changed
      if (("printers").match(currentSearch.toLowerCase())){
        $("#printers").show();
        matches++;
      } else {
        $("#printers").hide();
      }
      if (("dining halls").match(currentSearch.toLowerCase())){
        $("#dhalls").show();
        matches++;
      } else {
        $("#dhalls").hide();
      }
      if (("computer clusters").match(currentSearch.toLowerCase())){
        $("#clusters").show();
        matches++;
      } else {
        $("#clusters").hide();
      }
      if (("cafes").match(currentSearch.toLowerCase())){
        $("#cafes").show();
        matches++;
      } else {
        $("#cafes").hide();
      }
      if (("scanners").match(currentSearch.toLowerCase())){
        $("#scanners").show();
        matches++;
      } else {
        $("#scanners").hide();
      }
      if (("vending machines").match(currentSearch.toLowerCase())){
        $("#vending").show();
        matches++;
      } else {
        $("#vending").hide();
      }
      if (("water filling").match(currentSearch.toLowerCase())){
        $("#water").show();
        matches++;
      } else {
        $("#water").hide();
      }
      if (("athletics").match(currentSearch.toLowerCase())){
        $("#athletics").show();
        matches++;
      } else {
        $("#athletics").hide();
      }

      if (matches == 0) {
        searchmessage.innerText = "No results found! Please try a different search."
      } else {
        searchmessage.innerText = ""
      }
    });
    
    // display likes/dislikes for amenity when comments tab is clicked
    $("#nav-comment-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
      $.ajax({
        type: "POST",
        url: "/displayupvotes",
        data: JSON.stringify({amenityName: currentAmenityName}),
        contentType: "application/json",
        success: function(response){
          $.ajax({
            type: "POST",
            url: "/displaydownvotes",
            data: JSON.stringify({amenityName: currentAmenityName}),
            contentType: "application/json",
            success: function(response){
              $("#numofdislikes").html(response);
            }
          });
          $("#numoflikes").html(response);
        }
      });
    });
    
    // display comments if home tab is clicked
    $("#nav-home-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
      $.ajax({
        type: "POST",
        url: "/displaycomments",
        data: JSON.stringify({amenityName: currentAmenityName}),
        contentType: "application/json",
        success: function(response){
          $("#comment-div").html(response);
        }
      });
    });

    // display characters remaining in comment box
		$("#message-text").on("change keyup paste", function() {
			if(this.value.length > 500){
        return false;
    	}
			if(this.value.length == 0){
				$("#remainingC").html("");
				return false;
    	}
    $("#remainingC").html("Remaining characters : " + (500 - this.value.length));
	});
    
    // Expand modal when opening work order tab
    $("#nav-workorder-tab").on('click', function(){
      $("#myModalDialog").switchClass("modal-lg", "modal-xl", 300, "easeInOutQuad");
    });

    // Attach functionality to work order reset button
    $("#reset-workorder").on("click", function() {
      // Reset work order form
      var form = $("#workorder-form");
      form[0].reset();
      form.removeClass("was-validated");
    });

    // When modal is closed, reset its content
    $("#myModal").on("hidden.bs.modal", function () {
      // Reset work order form
      var form = $("#workorder-form");
      form[0].reset();
      form.removeClass("was-validated");

      // Manually reset hidden fields
      $("#locationcode").attr("value", "");
      $("#buildingcode").attr("value", "");
      $("#asset").attr("value", "");
      $("#locationmore").attr("value", "");

      // Reset info content and set info tab as active
      $("#nav-home-tab").tab("show");
      $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
      $("#nav-info").html('<div id="info-div"></div><div id="comment-div"><h5 class="text-center">Loading...</h5></div>');

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
            $("#remainingC").html("");
            $("#comment-success-message").slideDown("slow").delay(4000).slideUp("slow");
            //$("#comment-success").slideDown("slow").delay(4000).slideUp("slow");
          }
        });
      // If value is blank, alert user to enter something
      } else {
        $("#submit-form").addClass("was-validated");
      }
    });

    // place upvote
    $("#likebutton").click(function(){
      //currentVoteType = "like"
      $.ajax({
        type: "POST",
        url: "/placeupvote",
        data: JSON.stringify({amenityName: currentAmenityName}),
        contentType: "application/json",
        success: function(){
          $.ajax({
            type: "POST",
            url: "/displayupvotes",
            data: JSON.stringify({amenityName: currentAmenityName}),
            contentType: "application/json",
            success: function(response){
              $("#numoflikes").html(response);
            }
          });
          $.ajax({
            type: "POST",
            url: "/displaydownvotes",
            data: JSON.stringify({amenityName: currentAmenityName}),
            contentType: "application/json",
            success: function(response){
              $("#numofdislikes").html(response);
            }
          });
        }
      });
    });

    // place downvote
    $("#dislikebutton").click(function(){
      //currentVoteType = "dislike"
      $.ajax({
        type: "POST",
        url: "/placedownvote",
        data: JSON.stringify({amenityName: currentAmenityName}),
        contentType: "application/json",
        success: function(){
          $.ajax({
            type: "POST",
            url: "/displaydownvotes",
            data: JSON.stringify({amenityName: currentAmenityName}),
            contentType: "application/json",
            success: function(response){
              $("#numofdislikes").html(response);
            }
          });
          $.ajax({
            type: "POST",
            url: "/displayupvotes",
            data: JSON.stringify({amenityName: currentAmenityName}),
            contentType: "application/json",
            success: function(response){
              $("#numoflikes").html(response);
            }
          });
        }
      });
    });
    
    // Reset/remove all graphics
    $("#reset").click(function(){
      cafeClicks=0;
      printerClicks=0;
      diningClicks=0;
      clusterClicks=0;
      scannerClicks=0;
      vendingClicks=0;
      waterClicks=0;
      athleticsClicks=0;
      
      $("#buttonsearch").val("")
      $("#printers").show();
      $("#clusters").show();
      $("#scanners").show();
      $("#dhalls").show();
      $("#cafes").show();
      $("#vending").show();
      $("#athletics").show();
      $("#water").show();
      
      $("#printers").switchClass("btn-danger", "btn-outline-danger");
      $("#clusters").switchClass("btn-warning", "btn-outline-warning");
      $("#scanners").switchClass("btn-maroon-full", "btn-maroon");
      $("#dhalls").switchClass("btn-primary", "btn-outline-primary");
      $("#cafes").switchClass("btn-success", "btn-outline-success");
      $("#vending").switchClass("btn-orange-full", "btn-orange");
      $("#athletics").switchClass("btn-purple-full", "btn-purple");
      $("#water").switchClass("btn-info", "btn-outline-info");

      //view.graphics.removeAll();
      removeGraphic("Printer");
      removeGraphic("Computer Cluster");
      removeGraphic("Scanner");
      removeGraphic("Dining hall");
      removeGraphic("Café");
      removeGraphic("Vending Machine");
      removeGraphic("Athletic Facility");
      removeGraphic("Bottle-Filling Station");
    });

    // Printers
    $("#printers").click(function(){
      if (printerLoading)
        return;

      if (printerClicks % 2 == 0) {
      printerLoading = true;

      $("#printers-load").show(); // Show loading symbol on start
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
            point = createPoint(printer.long, printer.lat, [220, 53, 69],
              {name: printer.name, type:"Printer", description: printer.description, accessible: printer.accessible, printers: printer.printers, computers: printer.macs, scanners: printer.scanners,
              building: printer.buildingname, room: printer.room, floor: printer.floor, locationcode: printer.locationcode, locationmore: printer.locationmore});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#printers").switchClass("btn-outline-danger", "btn-danger");
          $("#printers-load").hide(); // Hide loading symbol on finish
          printerClicks++;
          printerLoading = false;
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
      if (clusterLoading)
        return;

      if (clusterClicks % 2 == 0) {
      clusterLoading = true;
      $("#clusters-load").show(); // Show loading symbol on start
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
            point = createPoint(cluster.long, cluster.lat, [255, 193, 7],
              {name: cluster.name, type:"Computer Cluster", description: cluster.description, accessible: cluster.accessible, printers: cluster.printers, computers: cluster.macs, scanners: cluster.scanners,
              building: cluster.buildingname, room: cluster.room, floor: cluster.floor, locationcode: cluster.locationcode, locationmore: cluster.locationmore});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#clusters").switchClass("btn-outline-warning", "btn-warning");
          $("#clusters-load").hide(); // Hide loading symbol on finish
          clusterClicks++;
          clusterLoading = false;
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
      if (scannerLoading)
        return;
      if (scannerClicks % 2 == 0) {
      scannerLoading = true;
      $("#scanners-load").show(); // Show loading symbol on start
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
            point = createPoint(scanner.long, scanner.lat, [128, 0, 0],
              {name: scanner.name, type:"Scanner", description: scanner.description, accessible: scanner.accessible, printers: scanner.printers, computers: scanner.macs, scanners: scanner.scanners,
              building: scanner.buildingname, room: scanner.room, floor: scanner.floor, locationcode: scanner.locationcode, locationmore: scanner.locationmore});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#scanners").switchClass("btn-maroon", "btn-maroon-full");
          $("#scanners-load").hide(); // Hide loading symbol on finish
          scannerClicks++;
          scannerLoading = false;
        }
      });
    } else {
      removeGraphic("Scanner");
      $("#scanners").switchClass("btn-maroon-full", "btn-maroon");
      scannerClicks++;
    }
    });

    // Dining Halls
    $("#dhalls").click(function(){
      if (diningLoading)
        return;

      if (diningClicks % 2 == 0) {
      diningLoading = true;

      $("#dhalls-load").show(); // Show loading symbol on start
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
            point = createPoint(dhall.long, dhall.lat, [0, 123, 255],
              {name: dhall.name, type:"Dining hall", who: dhall.who, payment: dhall.payment, open: dhall.open, capacity: dhall.capacity, rescollege: dhall.rescollege,
              building: dhall.buildingname, room: dhall.room, floor: dhall.floor, locationcode: dhall.locationcode});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#dhalls").switchClass("btn-outline-primary", "btn-primary");
          $("#dhalls-load").hide(); // Hide loading symbol on finish
          diningClicks++;
          diningLoading = false;
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
      if (cafeLoading)
        return;
      if (cafeClicks % 2 == 0) {
      cafeLoading = true;
      $("#cafes-load").show(); // Show loading symbol on start
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
            point = createPoint(cafe.long, cafe.lat, [40, 167, 69],
              {name: cafe.name, type:"Café", description: cafe.description, who: cafe.who, payment: cafe.payment, open: cafe.open,
              building: cafe.buildingname, room: cafe.room, floor: cafe.floor, locationcode: cafe.locationcode});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#cafes").switchClass("btn-outline-success", "btn-success");
          $("#cafes-load").hide(); // Hide loading symbol on finish
          cafeClicks++;
          cafeLoading = false;
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
      if (vendingLoading)
        return;
      if (vendingClicks % 2 == 0) {
      vendingLoading = true;
      $("#vending-load").show(); // Show loading symbol on start
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
            point = createPoint(vending_machine.long, vending_machine.lat, [255, 128, 0],
              {name: vending_machine.name, type:"Vending Machine", directions: vending_machine.description, what: vending_machine.what, payment: vending_machine.payment,
              building: vending_machine.buildingname, room: vending_machine.room, floor: vending_machine.floor, locationcode: vending_machine.locationcode});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#vending").switchClass("btn-orange", "btn-orange-full");
          $("#vending-load").hide(); // Hide loading symbol on finish
          vendingClicks++;
          vendingLoading = false;
        }
      });
    } else {
      removeGraphic("Vending Machine");
      $("#vending").switchClass("btn-orange-full", "btn-orange");
      vendingClicks++;
    }
    });

    // Athletic Facilities
    $("#athletics").click(function(){
      if (athleticsLoading)
        return;
      if (athleticsClicks % 2 == 0) {
      athleticsLoading = true;
      $("#athletics-load").show(); // Show loading symbol on start
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
            point = createPoint(athletic_facility.long * (-1), athletic_facility.lat, [136, 77, 255],
              {name: athletic_facility.buildingname, type:"Athletic Facility", sports: athletic_facility.sports,
              building: athletic_facility.buildingname, room: athletic_facility.room, floor: athletic_facility.floor});

            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }

          // Re-render points and clusters
          renderAll();

          $("#athletics").switchClass("btn-purple", "btn-purple-full");
          $("#athletics-load").hide(); // Hide loading symbol on finish
          athleticsClicks++;
          athleticsLoading = false;
        }
      });
    } else {
      removeGraphic("Athletic Facility");
      $("#athletics").switchClass("btn-purple-full", "btn-purple");
      athleticsClicks++;
    }
    });

    // Bottle Filling Stations NEED LAT LONG DATA FOR BUILDINGS
    $("#water").click(function(){
      if (waterLoading)
        return;
      if (waterClicks % 2 == 0) {
      waterLoading = true;
      $("#water-load").show(); // Show loading symbol on start
      $.ajax({
        type: "POST",
        url: "/points",
        //url: "http://0.0.0.0:5000/points",
        data: JSON.stringify({amenity_type: "water"}),
        contentType: "application/json",
        success: function(json_data){
          data_array = JSON.parse(json_data)
          console.log(data_array);
          for (var i = 0; i < data_array.length; i++) {
            var water_station = data_array[i];
            point = createPoint(water_station.long, water_station.lat, [23, 162, 184],
              {name: water_station.buildingname + ", Floor " + water_station.floor, directions: water_station.directions, type:"Bottle-Filling Station",
              building: water_station.buildingname, room: water_station.room, floor: water_station.floor, buildingcode: water_station.buildingcode, asset: water_station.asset});
    
            // Create new cluster if doesnt exist already
            checkPointCluster(point);
          }
    
          // Re-render points and clusters
          renderAll();
    
          $("#water").switchClass("btn-outline-info", "btn-info");
          $("#water-load").hide(); // Hide loading symbol on finish
          waterClicks++;
          waterLoading = false;
        }
      });
      
    } else {
      removeGraphic("Bottle-Filling Station");
      $("#water").switchClass("btn-info", "btn-outline-info");
      waterClicks++;
    }
    });
  });

});
