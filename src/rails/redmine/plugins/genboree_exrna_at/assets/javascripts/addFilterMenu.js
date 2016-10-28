
function addFilterMenu() {
  function stickyMenu() {
    // var windowScrolled = d3.select("html").node().scrollTop ; // same as pageYOffset standard javascript
    var menu = d3.select("div#filterMenu") ;
    // - Get size of filterMenu:
    var menuRect = menu.node().getBoundingClientRect() ;
    // Must find new "top" (y) position for filterMenu:
    // - Get top of first pie area...which is where we want to place it
    var firstPieDiv = d3.select("div#" + CONF.files[0].id) ;
    var firstPieDivRect = firstPieDiv.node().getBoundingClientRect() ;
    if(firstPieDivRect.top >= (0 + CONF.menu.offsetTop)) {
      // Then top of first pie area is visible and can align to that
      menu.transition()
          .delay(500).style("top", "" + firstPieDivRect.top + "px")
          .style("display", "block") ; // Make sure it wasn't hidden before this
    }
    else { // Page is scrolled too much to align to first pie area. How much determines what to do.
      // - So get bottom of last pie canvas
      var lastPieDiv = d3.select("div#" + CONF.files[CONF.files.length-1].id) ;
      var lastPieDivRect = lastPieDiv.node().getBoundingClientRect() ;
      var scrolledTooFarY = (lastPieDivRect.bottom - 2 * menuRect.height - CONF.menu.minBottomDelta) ;
      if(scrolledTooFarY <= 0) {
        // Scrolled so can't even see last pie area or not enough to put menu.
        menu.transition()
            .delay(500)
            .style("display", "none") ;
      }
      else {
        // There's still enough of last pie area showing to put the menu
        d3.select("div#filterMenu").transition()
          .delay(500)
          .style("top", "" + CONF.menu.minBottomDelta + "px")
          .style("display", "block") ;
      }
    }
  }

  d3.json(buildConfPath(fileConf.filterMenu), function(error, data) {
    filterMenu = data ;
    // Setup menu
    var firstPieDiv = d3.select("div#" + CONF.files[0].id) ;
    var firstPieDivRect = firstPieDiv.node().getBoundingClientRect() ;
    var menu = d3.select("body").append("div") ;
    menu.attr("id", "filterMenu")
        .classed("floatMenu-ng", true)
        .classed("filterMenu", true)
        .style("top", "" + firstPieDivRect.top + "px")
        .style("left", "" +  firstPieDivRect.left + "px") ;
    var menuItems = menu.append("ul") ;
    data.forEach( function (item) {
      menuItem = item ;
      menuItems.append("li").classed(item.name, true)
        .append("a")
          .attr("title", item.title)
          .html("&nbsp;")
          .on("click", menuClick) ;
    }) ;
    //menuItems.html("<li class=\"search\"><a href=\"#placeholder\">Search</a>") ;
        //.append("ul")
        //  .append("li")
        //    .classed("search", true)
        //    .append("a").attr("href", "#non").text("Search") ;

    d3.select(window).on("scroll", stickyMenu) ;
    stickyMenu() ;
  }) ;

  function menuClick(d, i) {
    var li = d3.select(this).node().parentNode ;
    var liClasses = li.classList ;
    if(liClasses.contains("delete")) {
      setSelections(false) ;
    }
    else if(liClasses.contains("search")) {
      applyFilters() ;
    }
    else if(liClasses.contains("add")) {
      setSelections(true)
    }
  }

  function togglePieSlices(btn, pieID) {
    debugger ;
    var d3btn = d3.select(btn) ;
    var setToOn = d3btn.classed("setToOn") ;
    setToOn = (setToOn === 'true') ;
    // Toggle classes in order to flip between "plus" and "minus" and what next click will do
    d3btn.classed("setToOn", !setToOn)
         .classed("setToOff", setToOn)
         .classed("fa-plus-square", !setToOn)
         .classed("fa-minus-square", setToOn) ;
    setPieSlices(pieID, setToOn) ;
  }

  function setPieSlices(pieID, setToOn) {
    var slices = d3.selectAll("#diseases-pie svg path.slice") ;
    var eventName = ( setToOn ? "mouseover" : "mouseout" ) ;
    slices.each( function (d, i) {
      d3.select(this).on(eventName).bind(this,d)() ;
    }) ;
  }

  function setSelections(setToOn) {
    // Clear selection boxes
    // - We will do this by "clicking" the unselected or selected slices programmatically.
    //   . When want to setToOn=true, we click only the UNselected slcies
    //   . When watn to setToOn=false, we click only the selected slices
    // - Then we will do a mouse-out event on every slice to ensure its display state is updated
    // - This is exactly what manual mouse click and then mouse-move-out does.
    var d3slices = d3.selectAll("path.slice").each( function (d, i) {
      if( (setToOn ? !this.selected : this.selected) ) {
        // We will call the "click" listener, but we need to re-bind it
        // to "this" (the path.slice elem) because calling this way will be use
        // the browser *window* window as the "this" in the listener (since not actually a mouse click).
        // - This way, the "this" in the listener will be the "this" here (i.e. the path.slice elem)
        //   and it will not be the window element.
        d3.select(this).on("click").bind(this, d)() ;
      }
    }) ;
    var d3slices = d3.selectAll("path.slice").each( function (d, i) {
      if(setToOn) {
        // See note about re-binding "this" so it's right in the listener.
        d3.select(this).on("mouseover").bind(this, d)() ;
      }
      else { // set to off
        // See note about re-binding "this" so it's right in the listener.
        d3.select(this).on("mouseout").bind(this, d)() ;
      }
    }) ;
    // Need to reset the individual pie buttons properly.
    setAllPieBtns(!setToOn) ;
  }

  function applyFilters() {
    var output = [] ;
    var searchUrl = null ;
    // For each file record in files
    CONF.files.forEach( function(file) {
      var facet = file.id ;
      searchUrl = file.search ; // Should all have same search url value, but we'll use whatever the last conf has.
      var facetPieSelector = "div#" + facet + "-pie" ;
      // Find selected values for this facet
      var facetSelections = [] ;
      d3.selectAll(facetPieSelector + " path.slice").each( function (d, i) {
        if(this.selected) {
          var d3path = d3.select(this) ;
          // The slice label could be an aggregate label.
          // * In all cases, the pooled/aggregated labels are in the "originalLabel" array
          // * For each "originalLabel" entry, there is a corresponding array of its specfic items
          //   in the "items" property.
          // * So for each "originalLabel", we will add a row for it and its specific value
          //   to the donut's selections div.
          var origLabels = d3path.datum().data.originalLabel ;
          for(var ii=0; ii<origLabels.length; ii++)
          {
            facetSelections.push( origLabels[ ii ] );
          }
        }
      }) ;
      // If there is at least 1 value for this facet, add output record
      if(facetSelections.length > 0) {
        output.push({
          "facet" : facet,
          "transformation" : file.transformation,
          "transformColl" : atlasSettings[file.transformColl],
          "values" : facetSelections
        }) ;
      }
    }) ;
    // If they actually made selections, do post, else do nothing.
    if(output.length > 0) {
        postAsJson(searchUrl, output) ;
    }
  }

  function postAsJson(path, data) {
    var form = d3.select("body").append("form") ;
    form.attr("method", "post")
        .attr("action", path) ;
        //.attr("target", "_blank") ;
    var field = form.append("input") ;
    field.attr("type", "hidden")
         .attr("name", "json")
         .attr("value", JSON.stringify(data)) ;
   var fieldcsrf = form.append("input") ;
    fieldcsrf.attr("type", "hidden")
          .attr("name", csrf_param)
          .attr("value", csrf_token) 
          .attr("id", "facetForm") ;
    
    form.node().submit() ;
  }
}
