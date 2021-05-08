
import {ArcGIS} from "/static/arcgis.js";

// Initialize ArcGIS map
var map = new ArcGIS();
map.initialize();

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

  // Alert users of AJAX error
  $(document).ajaxError(function (event, jqXHR, settings, thrownError) {
    $("#ajax-error").slideDown("slow").delay(5000).slideUp("slow");
  });

  // Attempt to get location on click
  $("#trackUser").on("click", function() {
    map.handlePosition();    
  });

  // When modal is opened, load its content
  $('#myModal').on('shown.bs.modal', function () {
    // Get comments
    $.ajax({
      type: "POST",
      url: "/displaycomments",
      data: JSON.stringify({amenityName: map.currentAmenityName}),
      contentType: "application/json",
      success: function(response){
        $("#comment-div").html(response);
        showMoreLess();
      }
    });
  })

  // When modal is closed, reset its content
  $("#myModal").on("hidden.bs.modal", function () {
    // Reset work order form
    var form = $("#workorder-form");
    form[0].reset();
    form.removeClass("was-validated");

    // Manually reset all autofilled fields
    $("#building").attr("value", "");
    $("#room").attr("value", "");
    $("#floor").attr("value", "");
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
    $("#remainingC").text("");
    $("#numoflikes").text("...");
    $("#numofdislikes").text("...");
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
        $("#workorder-success").slideDown("slow").delay(5000).slideUp("slow");

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

  // Prevent user from entering only whitespace on the comment or work order description
  // html pattern doesn't work with <textarea> only with <input>, which is why this is necessary
  $("#message-text").on('input', function() {
    if ($.trim($("#message-text").val()) == "")
      $("#message-text").val("");
  });
  $("#description").on('input', function() {
    if ($.trim($("#description").val()) == "")
      $("#description").val("");
  });

  // display comments if home tab is clicked
  $("#nav-home-tab").on('click', function(){
    $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
    $.ajax({
      type: "POST",
      url: "/displaycomments",
      data: JSON.stringify({amenityName: map.currentAmenityName}),
      contentType: "application/json",
      success: function(response){
        $("#comment-div").html(response);
				showMoreLess();
      }
    });
  });

  // display likes/dislikes for amenity when comments tab is clicked
  $("#nav-comment-tab").on('click', function(){
    $("#myModalDialog").switchClass("modal-xl", "modal-lg", 300, "easeInOutQuad");
    $.ajax({
      type: "POST",
      url: "/displayupvotes",
      data: JSON.stringify({amenityName: map.currentAmenityName}),
      contentType: "application/json",
      success: function(response){
        $.ajax({
          type: "POST",
          url: "/displaydownvotes",
          data: JSON.stringify({amenityName: map.currentAmenityName}),
          contentType: "application/json",
          success: function(response){
            $("#numofdislikes").html(response);
          }
        });
        $("#numoflikes").html(response);
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
			return true;
  	}
    $("#remainingC").html("Remaining characters : " + (500 - this.value.length));
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
        data: JSON.stringify({amenityName: map.currentAmenityName, textComment: comment}),
        contentType: "application/json",
        success: function(comment){
          $("#message-text").val("");
          $("#remainingC").html("");
          $("#comment-success-message").slideDown("slow").delay(5000).slideUp("slow");
          //$("#comment-success").slideDown("slow").delay(5000).slideUp("slow");
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
      data: JSON.stringify({amenityName: map.currentAmenityName}),
      contentType: "application/json",
      success: function(){
        $.ajax({
          type: "POST",
          url: "/displayupvotes",
          data: JSON.stringify({amenityName: map.currentAmenityName}),
          contentType: "application/json",
          success: function(response){
            $("#numoflikes").html(response);
          }
        });
        $.ajax({
          type: "POST",
          url: "/displaydownvotes",
          data: JSON.stringify({amenityName: map.currentAmenityName}),
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
      data: JSON.stringify({amenityName: map.currentAmenityName}),
      contentType: "application/json",
      success: function(){
        $.ajax({
          type: "POST",
          url: "/displaydownvotes",
          data: JSON.stringify({amenityName: map.currentAmenityName}),
          contentType: "application/json",
          success: function(response){
            $("#numofdislikes").html(response);
          }
        });
        $.ajax({
          type: "POST",
          url: "/displayupvotes",
          data: JSON.stringify({amenityName: map.currentAmenityName}),
          contentType: "application/json",
          success: function(response){
            $("#numoflikes").html(response);
          }
        });
      }
    });
  });

  // Handle show more/show less text
  // adapted from https://www.viralpatel.net/dynamically-shortened-text-show-more-link-jquery/
  function showMoreLess() {
    var showChar = 175;
    var numOfLines = 3;
    var ellipsestext = "...";
    var moretext = "Read more";
    var lesstext = "Show less";
    $('.more').each(function() {
      var content = $(this).html();

      if(content.length > showChar) {
        var c = content.substr(0, showChar);
        var h = content.substr(showChar, content.length - showChar);
        var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink"> <br>' + moretext + '</a></span>';
        $(this).html(html);
      }
      else {
      if(content.split(/\r\n|\r|\n/).length > numOfLines) {
        var token = content.split('\n').slice(0, numOfLines);
        var c = token.join('\n')
        var token2 = content.split('\n').slice(numOfLines);
        var h = '\n' + token2.join('\n')
        var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;&nbsp;<a href="" class="morelink"> <br>' + moretext + '</a></span>';
        $(this).html(html);
      }
    }
    });

    $(".morelink").click(function(){
      if($(this).hasClass("less")) {
        $(this).removeClass("less");
        $(this).html('<br>' + moretext);
      } else {
        $(this).addClass("less");
        $(this).html('<br>' + lesstext);
      }
      $(this).parent().prev().toggle();
      $(this).prev().toggle();
      return false;
    });
  }

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

    $("#printers").switchClass("btn-danger", "btn-outline-danger");
    $("#clusters").switchClass("btn-warning", "btn-outline-warning");
    $("#scanners").switchClass("btn-maroon-full", "btn-maroon");
    $("#dhalls").switchClass("btn-primary", "btn-outline-primary");
    $("#cafes").switchClass("btn-success", "btn-outline-success");
    $("#vending").switchClass("btn-orange-full", "btn-orange");
    $("#athletics").switchClass("btn-purple-full", "btn-purple");
    $("#water").switchClass("btn-info", "btn-outline-info");

    map.clearAll();
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var printer = data_array[i];
          var point = map.createPoint(printer.long, printer.lat, [220, 53, 69],
            {name: printer.name, type:"Printer", description: printer.description, accessible: printer.accessible, printers: printer.printers, computers: printer.macs, scanners: printer.scanners,
            building: printer.buildingname, room: printer.room, floor: printer.floor, locationcode: printer.locationcode, locationmore: printer.locationmore});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);

        }

        // Re-render points and clusters
        map.renderAll();

        $("#printers").switchClass("btn-outline-danger", "btn-danger");
        $("#printers-load").hide(); // Hide loading symbol on finish
        printerClicks++;
        printerLoading = false;
      }
    });
    } else {
      map.removeGraphic("Printer");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var cluster = data_array[i];
          var point = map.createPoint(cluster.long, cluster.lat, [255, 193, 7],
            {name: cluster.name, type:"Computer Cluster", description: cluster.description, accessible: cluster.accessible, printers: cluster.printers, computers: cluster.macs, scanners: cluster.scanners,
            building: cluster.buildingname, room: cluster.room, floor: cluster.floor, locationcode: cluster.locationcode, locationmore: cluster.locationmore});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#clusters").switchClass("btn-outline-warning", "btn-warning");
        $("#clusters-load").hide(); // Hide loading symbol on finish
        clusterClicks++;
        clusterLoading = false;
      }
    });
  } else {
    map.removeGraphic("Computer Cluster");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var scanner = data_array[i];
          var point = map.createPoint(scanner.long, scanner.lat, [128, 0, 0],
            {name: scanner.name, type:"Scanner", description: scanner.description, accessible: scanner.accessible, printers: scanner.printers, computers: scanner.macs, scanners: scanner.scanners,
            building: scanner.buildingname, room: scanner.room, floor: scanner.floor, locationcode: scanner.locationcode, locationmore: scanner.locationmore});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#scanners").switchClass("btn-maroon", "btn-maroon-full");
        $("#scanners-load").hide(); // Hide loading symbol on finish
        scannerClicks++;
        scannerLoading = false;
      }
    });
  } else {
    map.removeGraphic("Scanner");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var dhall = data_array[i];
          var point = map.createPoint(dhall.long, dhall.lat, [0, 123, 255],
            {name: dhall.name, type:"Dining hall", who: dhall.who, payment: dhall.payment, open: dhall.open, capacity: dhall.capacity, rescollege: dhall.rescollege,
            building: dhall.buildingname, room: dhall.room, floor: dhall.floor, locationcode: dhall.locationcode});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#dhalls").switchClass("btn-outline-primary", "btn-primary");
        $("#dhalls-load").hide(); // Hide loading symbol on finish
        diningClicks++;
        diningLoading = false;
      }
    });
  } else {
    map.removeGraphic("Dining hall");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var cafe = data_array[i];
          var point = map.createPoint(cafe.long, cafe.lat, [40, 167, 69],
            {name: cafe.name, type:"Café", description: cafe.description, who: cafe.who, payment: cafe.payment, open: cafe.open,
            building: cafe.buildingname, room: cafe.room, floor: cafe.floor, locationcode: cafe.locationcode});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#cafes").switchClass("btn-outline-success", "btn-success");
        $("#cafes-load").hide(); // Hide loading symbol on finish
        cafeClicks++;
        cafeLoading = false;
      }
    });
  } else {
    map.removeGraphic("Café");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var vending_machine = data_array[i];
          var point = map.createPoint(vending_machine.long, vending_machine.lat, [255, 128, 0],
            {name: vending_machine.name, type:"Vending Machine", directions: vending_machine.directions, what: vending_machine.what, payment: vending_machine.payment,
            building: vending_machine.buildingname, room: vending_machine.room, floor: vending_machine.floor, locationcode: vending_machine.locationcode});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#vending").switchClass("btn-orange", "btn-orange-full");
        $("#vending-load").hide(); // Hide loading symbol on finish
        vendingClicks++;
        vendingLoading = false;
      }
    });
  } else {
    map.removeGraphic("Vending Machine");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var athletic_facility = data_array[i];
          var point = map.createPoint(athletic_facility.long * (-1), athletic_facility.lat, [136, 77, 255],
            {name: athletic_facility.buildingname, type:"Athletic Facility", sports: athletic_facility.sports,
            building: athletic_facility.buildingname, room: athletic_facility.room, floor: athletic_facility.floor});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#athletics").switchClass("btn-purple", "btn-purple-full");
        $("#athletics-load").hide(); // Hide loading symbol on finish
        athleticsClicks++;
        athleticsLoading = false;
      }
    });
  } else {
    map.removeGraphic("Athletic Facility");
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
        var data_array = JSON.parse(json_data);
        for (var i = 0; i < data_array.length; i++) {
          var water_station = data_array[i];
          var point = map.createPoint(water_station.long, water_station.lat, [23, 162, 184],
            {name: water_station.buildingname + ", Floor " + water_station.floor, directions: water_station.directions, type:"Bottle-Filling Station",
            building: water_station.buildingname, room: water_station.room, floor: water_station.floor, buildingcode: water_station.buildingcode, asset: water_station.asset});

          // Create new cluster if doesnt exist already
          map.checkPointCluster(point);
        }

        // Re-render points and clusters
        map.renderAll();

        $("#water").switchClass("btn-outline-info", "btn-info");
        $("#water-load").hide(); // Hide loading symbol on finish
        waterClicks++;
        waterLoading = false;
      }
    });

  } else {
    map.removeGraphic("Bottle-Filling Station");
    $("#water").switchClass("btn-info", "btn-outline-info");
    waterClicks++;
  }
  });
});

