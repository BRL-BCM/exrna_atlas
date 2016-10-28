
// ONCLICK HANDLERS AND HELPERS
// - For clicks on non-svg, non-pie stuff that affects svg/pie stuff
function togglePieSlices(btn, pieID) {
  var d3btn = d3.select(btn) ;
  var setToOn = d3btn.classed("setToOn") ;
  // Toggle classes in order to flip between "plus" and "minus" and what next click will do
  d3btn.classed("setToOn", !setToOn)
      .classed("setToOff", setToOn)
      .classed("fa-plus-square", !setToOn)
      .classed("fa-minus-square", setToOn) ;
  setPieSlices(pieID, setToOn) ;
}

function setPieSlices(pieID, setToOn) {
  var slices = d3.selectAll("#" + pieID + "-pie svg path.slice") ;
  // Properly clear out selection boxes
  // - We will do this by "clicking" the unselected or selected slices programmatically.
  //   . When want to setToOn=true, we click only the UNselected slcies
  //   . When watn to setToOn=false, we click only the selected slices
  // - Then we will do a mouse-over or out event on every slice to ensure its display state is updated
  // - This is exactly what manual mouse click and then mouse-move-out does.
  slices.each( function (d, i) {
    if( (setToOn ? !this.selected : this.selected) ) {
      // We will call the "click" listener, but we need to re-bind it
      // to "this" (the path.slice elem) because calling this way will be use
      // the browser *window* window as the "this" in the listener (since not actually a mouse click).
      // - This way, the "this" in the listener will be the "this" here (i.e. the path.slice elem)
      //   and it will not be the window element.
      d3.select(this).on("click").bind(this, d)() ;
    }
  }) ;
  var eventName = ( setToOn ? "mouseover" : "mouseout" ) ;
  slices.each( function (d, i) {
    d3.select(this).on(eventName).bind(this,d)() ;
  }) ;
}

function setAllPieBtns(setToOn) {
  var pieBtns = d3.selectAll("span.pieToggleBtn") ;
  pieBtns.each( function (ii) { // 'this' is button span element
    // Toggle by blindly removing class we don't want and adding class we do want
    var d3PieBtn = d3.select(this) ;
    d3PieBtn.classed("setToOff", !setToOn) ;
    d3PieBtn.classed("setToOn", setToOn) ;
    d3PieBtn.classed("fa-plus-square", setToOn)
    d3PieBtn.classed("fa-minus-square", !setToOn)
  }) ;
}

// ----------------------------------------------------------------

function countSelectedSlices() {
  var samplesHash = new Object() ;
  var donutsWithSelsHash = new Object() ;
  // Examine each donut in turn.
  var pies = d3.selectAll("div.pie.canvas") ;
  pies.each( function( kk) // 'this' will have the pie div elem
  {
    // Get the donut name
    var pieDiv = this ;
    var donutName = pieDiv.id ;
    // Examine slices in this pie
    var slices = d3.select(pieDiv).selectAll( "svg path.slice" );
    slices.each( function( ii )
    {
      if( this.selected )
      {
        // This donut has 1+ selected slices
        donutsWithSelsHash[ donutName ] = true;
        // Get the samples for this donut
        var d3slice = d3.select( this );
        var sliceData = d3slice.datum();
        if( sliceData && sliceData.data && sliceData.data.items && sliceData.data.items.forEach )
        {
          sliceData.data.items.forEach( function( runSamples, ii )
          {
            if( runSamples && runSamples.forEach )
            {
              runSamples.forEach( function( runSample, jj )
              {
                if( !samplesHash.hasOwnProperty( runSample ) )
                {
                  samplesHash[ runSample ] = [];
                }
                samplesHash[ runSample ].push( donutName );
              } );
            }
          } );
        }
      }
    } );
  });
  // Collect the donuts with 1+ selections (probably just need the count here, but we'll safely collect their ids)
  var donutsWithSels = [] ;
  for(propName in donutsWithSelsHash)
  {
    if(donutsWithSelsHash.hasOwnProperty(propName))
    {
      donutsWithSels.push( propName );
    }
  }
  // Only samples present in all donuts that have 1+ selections
  for(propName in samplesHash)
  {
    if( samplesHash.hasOwnProperty( propName ) )
    {
      if( samplesHash[ propName ].length != donutsWithSels.length )
      {
        delete samplesHash[ propName ];
      }
    }
  }
  // Count samples, safely given using Object.
  var sampleSelCount = 0 ;
  for(propName in samplesHash) {
    if(samplesHash.hasOwnProperty(propName)) {
      sampleSelCount += 1 ;
    }
  }
  // Update the count span
  var d3countSpan = d3.select("#selectedCount") ;
  var d3countNode = d3countSpan.node() ;
  d3countNode.textContent = "(" + sampleSelCount + " selected)" ;
}

// ADD SAMPLE PIE
// - Establishes nested namespaces in which the info in the "file" record is used to make a donut chart.
// - Note that the nested closures established within addSamplePie()--the available variables and functions--are
//   ONLY available within addSamplePie() or its subclosures [don't move them out, will break].

function addSamplePie(div, file) {
  var currentpath = null ;
  var d3datapath = getD3dataPath() ;
  d3datapath += "?collName="+atlasSettings[encodeURIComponent(file.transformColl)]+"&format=flat&transformationName="+encodeURIComponent(file.transformation)+"&modifyd3="+file.modifyd3+"&"+csrf_param+"="+csrf_token ;
  d3datapath += "&writeToFile=true&confid=" +file.id+"&dataconf="+fileConf.sampleSummaryConf ;
  if('groupLabelFile' in file) {d3datapath += "&grouplabelconf="+file.groupLabelFile ;}
  var staticpath = buildPrjSpecFilePath(file.path) ;
  /*if(atlasSettings.updateData == "true") { currentpath = d3datapath ; }
  else { currentpath = staticpath ; }
  */
  currentpath = staticpath ;
  d3.json(currentpath, function(error, data) {
    /* ------- PIE SLICES ------- */
     if(error) // static file not found?
     {
       donutsUpdated = true ; // global
       
       d3.json(d3datapath, function(error, data) {
         drawPie(div, file, data) ;
         if(totalSamples == 0) {getTotalSamples(data) ;}
       }) ;
     }
     else
     {
       drawPie(div, file, data) ;
       if(totalSamples == 0) {getTotalSamples(data) ;}
     }
  });
}

function drawPie(div, file, data)
{
    var divRect = div.node().getBoundingClientRect() ;
  var viewBoxWidth = (divRect.width * CONF.canvas.vbWidth) ;
  var viewBoxHeight = (divRect.height * CONF.canvas.vbHeight) ;
  var svg =
    div.append("svg")
       .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
       .attr("preserveAspectRatio", "xMinYMin meet")
       .style("width", div.style("width"))
       .style("height", div.style("height"))
       .append("g") ; // First (and root) 'g' is our svg variable where we can add more graphic elements.
  svg.append("g").attr("class", "slices") ;
  svg.append("g").attr("class", "labels") ;
  svg.append("g").attr("class", "lines") ;
  // Add a text element for the "total samples" summary in the middle of the donut.
  svg.append("text")
     .attr("x", 0)
     .attr("y", CONF.INIT.summaryFontSize / 3)
     .classed("summary", true)
     .style("font-size", CONF.INIT.summaryFontSize + "px") ;
  // Move the donut to the middle (meh) of the canvas.
  svg.attr("transform", "translate(" + viewBoxWidth / 2 + "," + (viewBoxHeight / 2 - (CONF.canvas.yNudge)) + ")");
  // Create selected-values div where we list the selections for this pie.
  var selections = d3.select(div.node().parentNode).append("div") ;
  selections.attr("id", file.id + "-sels")
            .classed("selections", true)
            .classed("hidden", true)
            .classed("center-block", true)
            .style("max-width", "" + divRect.width + "px") ; // Not css, to keep in sync

  // DEBUG: Uncomment to see location of new 0,0 coord (center of donut)
  //svg.append("circle").attr( {
  //    x: 0,
  //    y: 0,
  //    r: 2,
  //    fill: "#000"
  //}) ;

  // Create pie chart d3 object
  var pie = d3.layout.pie()
    .sort(null)
    .padAngle(0.01)
    .value(function(d) { // pie slice value based on the "value" field of each data record
      // Use log values and some minimums so we can *see* all values (unless >80 or something crazy)
      return (d.value <= 1 ? Math.log(1.2) : Math.log(d.value)) ;
    });
  var key = function(d) { return d.data.label; };
  var slice = svg.select(".slices").selectAll("path.slice").data(pie(data), key);

      // Set styling and event handlers for each slice
      slice.enter()
        .insert("path")
        .style("fill", function(d) { return file.colors(d.data.label); })
        .style("cursor", "pointer")
        .on("click", sliceSelected)
        .on("mouseover", hoverSlice)
        .on("mouseout", restoreSlice)
        .attr("class", "slice");

    // Draw slices using our arc definition above, interpolating it correctly
    //  so arc gets rotated etc for the current slice being drawn.
    slice.transition().duration(1000)
      .attrTween("d", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          return arc(interpolate(t));
        };
      }) ;

    slice.exit().remove();

    /* ------- PIE LABELS & LABEL LINES ------- */
    // Now we'll draw our label lines, etc.
    var enteringLabels = svg.selectAll("g.label").data(pie(data)).enter() ;
    var labelGroups = enteringLabels.append("g").attr("class", "label") ;
    labelGroups.append("circle").attr( {
      x: 0,
      y: 0,
      r: 2,
      fill: "#000",
      transform: function (d, i) {
        var centroid = arc.centroid(d);
          return "translate(" + arc.centroid(d) + ")";
      },
      'class': "label-end"
    });

    // Some trig to find end of label lines
    var textLines = labelGroups.append("line").attr({
      x1: function (d, i) {
        return arc.centroid(d)[0];
      },
      y1: function (d, i) {
        return arc.centroid(d)[1];
      },
      x2: function (d, i) {
        var centroid = arc.centroid(d);
        var midAngle = Math.atan2(centroid[1], centroid[0]);
        var x = Math.cos(midAngle) * CONF.INIT.labelArcOuter ;
        return x;
      },
      y2: function (d, i) {
        var centroid = arc.centroid(d);
        var midAngle = Math.atan2(centroid[1], centroid[0]);
        var y = Math.sin(midAngle) * 0.95 * CONF.INIT.labelArcOuter ;
        return y;
      },
      'class': "label-line"
    });

    // Similarly trig to find starting position of labels themselves
    var textLabels = labelGroups.append("text").attr({
      x: function (d, i) {
        var centroid = arc.centroid(d);
        var midAngle = Math.atan2(centroid[1], centroid[0]);
        var x = Math.cos(midAngle) * CONF.INIT.labelArcOuter ;
        var sign = (x > 0) ? 1 : -1
        var labelX = x + (3 * sign)
        return labelX;
      },
      y: function (d, i) {
        var centroid = arc.centroid(d);
        var midAngle = Math.atan2(centroid[1], centroid[0]);
        var y = Math.sin(midAngle) * CONF.INIT.labelArcOuter ;
        return y;
      },
      'text-anchor': function (d, i) {
        var centroid = arc.centroid(d);
        var midAngle = Math.atan2(centroid[1], centroid[0]);
        var x = Math.cos(midAngle) * CONF.INIT.labelArcOuter ;
        return (x > 0) ? "start" : "end";
      },
      'class': 'label-text'
    })
      .attr("dy", "0.35em")
      .style("cursor", "pointer")
      .on("mouseover", hoverLabel)
      .on("mouseout", restoreLabel)
      .on("click", labelSelected)
      .text(function (d) {
        return (file.labelMap[d.data.label] || d.data.label)
    });

    svg.selectAll("text.label-text")
      .call(wrapText) ;

    // ******** FUNCTIONS - EVENT HANDLERS and HELPERS ********
    // ------- PIE EVENT HANDLERS -------
    function hoverSlice(slicePath) {
      var elem = this ;
      var labelText = d3.select(slicePath).node().data.label ;
      doHover(labelText) ;
      updateSummary(d3.select(elem), slicePath) ;
    }

    function restoreSlice(slicePath) {
      var elem = this ;
      var labelText = d3.select(slicePath).node().data.label ;
      doUnhover(labelText) ;
      updateSummary(null, null) ;
    }

    function sliceSelected(slicePath) {
      var elem = this ;
      var labelText = d3.select(slicePath).node().data.label ;
      doToggle(labelText) ;
      // Update the summary & selections text for this pie
      d3.select(this)
        .call(updateSelections, slicePath)
        .call(updateSummary, slicePath) ;
      // Update the total samples selected across all pies
      countSelectedSlices() ;
    }

    // ------- PIE HELPERS --------
    // Hover all graphic elements related to label text. Label text used to find label-related slices & labels/lines.
    function doHover(label) {
      var isSelected = 0 ; // found in matching slice
      // Hover slice
      svg.selectAll("path.slice").each(function (d, i) {
        var plabel = d3.select(d).node().data.label ;
        if(plabel == label) {
          isSelected = this.selected ;
          d3.select(this).transition()
            .duration(500)
            .attr("d", (isSelected == 1 ? growBothwardSel : growBothward))
            .duration(100)
            .style("stroke", CONF.color.hover) // can stroke around the arc shape
            .style("stroke-width", CONF.strokeWidth.hover) ;
        }
      });
      // Hover text label
      var text = svg.selectAll("text").filter(function (d) { return ((typeof(d) != "undefined") && d.data.label == label) }) ;
      text.classed("select" , true)
          .style("fill", "#1565c0") ;
      // Hover line
      d3.select(text.node().parentNode)
        .selectAll("line")
          .classed("select", true) ;
      // Hover line-end circle
      d3.select(text.node().parentNode)
        .selectAll("circle")
          .classed("select", true) ;
    }

    // UNhover all graphic elements related to label text. Label text used to find label-related slices & labels/lines.
    function doUnhover(label)
    {
      var isSelected = 0 ; // found in matching slice
      // Unhover slice
      svg.selectAll("path.slice").each(function (d, i) {
        var plabel = d3.select(d).node().data.label ;
        if(plabel == label) {
          isSelected = this.selected ;
          d3.select(this).transition()
            .duration(500)
            .attr("d", (isSelected == 1 ? growInward : restoreGrowth))
            .duration(100)
            .style("stroke-width", (isSelected == 1 ? CONF.strokeWidth.select : CONF.strokeWidth.none)) ;
        }
      });
      // unhover text label
      var text = svg.selectAll("text").filter(function (d) { return ((typeof(d) != "undefined") && d.data.label == label) }) ;
      if(isSelected != 1)
      {
        text.classed("select", false)
            .style("fill", null);
        // Unhover line
        d3.select(text.node().parentNode)
          .selectAll("line")
            .classed("select", false) ;
        // Unhover line-end circle
        d3.select(text.node().parentNode)
          .selectAll("circle")
            .classed("select", false) ;
      }
    }

    // Toggle slice based on label text. Label text used to find label-related slices & labels/lines.
    function doToggle(label)
    {
      var isSelected = 0 ; // found in matching slice
      // Toggle slice
      svg.selectAll("path.slice").each(function (d,i) {
        var plabel = d3.select(d).node().data.label ;
        if(plabel == label) {
          isSelected = this.selected = (this.selected == 1 ? 0 : 1) ; // toggle to opposite state
          d3.select(this).transition()
            .duration(500)
            .attr("d", (this.selected ? growInward : growBothward))
            .duration(100)
            .style("stroke", CONF.color.select)
            .style("stroke-width", (this.selected ? CONF.strokeWidth.select : CONF.strokeWidth.none)) ;
        }
      }) ;
      // Update label & line display now that slice selected is toggled.
      doHover(label) ;
    }

    // Update the "total selected" summary number in middle of donut when
    // slice is hovered/selected/unhovered/unselected.
    function updateSummary(slice, slicePath) {
      // Sum of selected slices' values
      var d3slices = svg.select("g.slices") ;
      var selSum = 0 ;
      var selected = d3slices.selectAll("path").filter(function (d) { return this.selected == 1 } )
        .each( function (path, ii) {
        var val = d3.select(path).node().data.value ;
        selSum += val ;
      }) ;
      // Do we have a particular slice that's being operated on (hover or select-click), factor in its value.
      if(typeof(slice) != undefined && slice != null) {
        // Do we need to add slicePath's value to the sum?
        // - If not selected, then yes, probably because it's a hover event
        //   and temporarily summing it in.
        // - If is selected, it was summed when we added all selected slices.
        if(!slice.node().selected) {
          selSum += slicePath.data.value ;
        }
      }
      // Write out summary text
      var summary = svg.select("text.summary") ;
      summary.selectAll("*").remove() ;
      if(selSum > 0) {
        summary.append("tspan")
          .classed("title", true)
          .text("") ; // Like "Samples" or "Samples" and then new tspan for "selected" etc
        summary.append("tspan")
          .classed("value", true)
          .text(commify("" + selSum)) ;
      }
    }

    // Update the selections list box below the pie based on slice being selected/unselected.
    function updateSelections(slice, path) {
      var d3slices = d3.select( slice.node().parentNode ) ;
      var selected = d3slices.selectAll("path").filter(function (d) { return this.selected == 1 } ) ;
      selections.selectAll("div").remove() ; // Remove the inner divs from pie's selections div to clear its entries
      selected.sort(function (aa,bb) {
        var retVal = 0 ;
        retVal = d3.select(aa).node().data.label.toLowerCase() > d3.select(bb).node().data.label.toLowerCase() ? 1 : -1 ;
        if(retVal == 0) {
          retVal = d3.select(aa).node().data.label > d3.select(bb).node().data.label ? 1 : -1 ;
        }
        return retVal ;
      }).each( function (path, ii) {
        var pathFile = d3.select(this).style("fill") ;
        var node = d3.select(path).node() ;
        // The slice label could be an aggregate label.
        // * In all cases, the pooled/aggregated labels are in the "originalLabel" array
        // * For each "originalLabel" entry, there is a corresponding array of its specfic items
        //   in the "items" property.
        // * So for each "originalLabel", we will add a row for it and its specific value
        //   to the donut's selections div.
        var nodeItems = node.data.items ;
        var nodeOrigLabels = node.data.originalLabel ;
        for(var ii=0; ii<nodeOrigLabels.length; ii++)
        {
          var label = nodeOrigLabels[ii] ;
          var value = nodeItems[ii].length ;
          var selLabel = selections.append( "div" ); // Add inner div for this lable & value
          selLabel.classed( "x-label", true ) // use our "label" and not Bootstrap's
              .append( "div" ).classed( "colorSquare", true )
              .style( "background-color", pathFile );
          selLabel.append( "span" )
              .html( "&nbsp; " + label + " &nbsp;&nbsp;&nbsp;&nbsp;" ); // to force floating count div to next line if too close to text heh
          selLabel.append( "div" ).classed( "value", true )
              .text( "(" + value + ")" );
          if( ii % 2 == 0 )
          {
            selLabel.classed( "even", true );
          }
          else
          {
            selLabel.classed( "odd", true );
          }
        }
      }) ;
      selections.classed("hidden", (selections.selectAll("div").size() <= 0)) ;
      return ;
    }

    /* ------- TEXT LABEL EVENT HANDLERS------- */
    function hoverLabel(label) {
      var elem = this ;
      var labelText = d3.select(label).node().data.label ;
      var isSelected = label.selected ;
      doHover(labelText, isSelected) ;

      var slice = null ;
      svg.selectAll("path.slice").filter(function (d) { return d.data.label == label.data.label })
        .each(function (d, i) {
          slice = d3.select(d) ;
          updateSummary(d3.select(this), slice.node()) ;
        });
    }

    function restoreLabel(label) {
      var elem = this ;
      var labelText = d3.select(label).node().data.label ;
      var isSelected = label.selected ;
      doUnhover(labelText, isSelected) ;
      updateSummary(null, null) ;
    }

    function labelSelected(label) {
      // Tag label as selected
      labelToggle(label) ;
      hoverLabel(label) ;
      // Select slice too
      svg.selectAll("path.slice")
        .filter(function (d) { return d.data.label == label.data.label })
        .each(sliceSelected) ;
    }

    /* ------- TEXT LABEL HELPERS -------*/
    // Label and slice both know if they are "selected". Should be in sync, so maybe just need slice now.
    function labelToggle(label) {
      if(label.selected == 1) {
        label.selected = 0 ;
      }
      else {
        label.selected = 1;
      }
    }

    // Constraint relaxing for overlapping labels. Adjusts y-coord until the tspans in the text elements
    // don't overlap (works well, needs tweaking).
    function relax() {
      var again = false ; // Do we need to repeat the relaxation b/c still has overlap?
      textLabels.each(function (d, i) {
        var a = this ;
        var da = d3.select(a);
        var y1 = da.attr("y");
        var daTspans = da.select("tspan") ;
        textLabels.each(function (d, j) {
          var b = this;
          // a & b are the same element and don't collide.
          if(a != b) {
            var db = d3.select(b);
            var dbTspans = db.select("tspan") ;
            // a & b are on opposite sides of the chart and don't collide
            if(da.attr("text-anchor") == db.attr("text-anchor")) {
              // Now let's calculate the distance between these elements.
              var y2 = db.attr("y");
              var deltaY = y1 - y2;

              // Our spacing is greater than our specified spacing, so they don't collide.
              if(Math.abs(deltaY) <= (CONF.labels.spacing * (daTspans.size()+1))) {
                // If the labels collide, we'll push each of the two labels up and down a little bit.
                again = true;
                var sign = deltaY > 0 ? 1 : -1;
                //var adjust = (sign * CONF.labels.alpha * (daTspans.size()+1));
                var adjust = (sign * CONF.labels.alpha);
                da.attr("y", +y1 + adjust) ;
                db.attr("y", +y2 - adjust) ;
              }
            }
          }
          return ;
        });
      });
      // Adjust our line leaders here so that they follow the labels.
      if(again) {
        var labelElements = textLabels[0];
        textLines.attr("y2", function(d,i) {
          var labelForLine = d3.select(labelElements[i]);
          return labelForLine.attr("y") * 0.95 ;
        });
        // To see the "relaxing" that auto-spaces the labels, increase the 20:
        setTimeout(relax, 5) ;
      }
      // Put tspans in right places
      textLabels.each(function (dd, ii) {
        var tl = this ;
        var d3tl = d3.select(tl) ;
        var tly = d3tl.attr("y") ;
        var tspans = d3tl.selectAll("tspan") ;
        tspans.each(function (dd, jj) {
          var ts = this ;
          var d3ts = d3.select(ts) ;
          d3ts.attr("y", tly) ;
        })
      }) ;
    }

    // Takes the current text string in the "text" text element and REPLACES it with
    // a set of tspans (lines) of wrapped text.
    // - Will rejoin separate lines coming out of splitText() if doing so makes a line that is acceptably long.
    function wrapText(text) {
      text.each( function() {
        var text = d3.select(this) ;
        var x = text.attr("x") ;
        var y = text.attr("y") ;
        var dy = parseFloat(text.attr("dy")) ;
        var words = splitText(text.text(), CONF.labels.maxChrs, CONF.labels.minChrs).reverse() ;
        text.text(null)
        var word ;
        var line = [] ;
        var tspan = text.append("tspan") ;
        tspan.attr("x", x)
             .attr("y", y)
             .attr("dy", dy + "em") ;
        var lineNum = 1 ;
        while( (word = words.pop()) ) {
          if((line.length < 1) || ((line.join(" ").length + word.length) <= CONF.labels.maxChrs))
          {
            line.push(word) ;
          }
          else
          {
            tspan.text(line.join(" ")) ;
            //if(tspan.node().getComputedTextLength() > CONF.INIT.radius) // see http://bl.ocks.org/mbostock/7555321
            line = [ word ] ;
            tspan = text.append("tspan") ;
            tspan.attr("x", x)
                 .attr("y", y)
                 //.attr("dy", (lineNum == 0 ? "0em" : "1em")) ;
                 .attr("dy", "" + ((0.35 + lineNum) * 0.95) + "em") ;
            lineNum += 1 ;
          }
        }
        tspan.text(line.join(" ")) ;
      })
      relax() ;
    } ;

    // Splitting function. Able to split on words AND hyphenate.
    function splitText(str, tgtMax, tgtMin) {
      var retVal = [] ;
      if(str.length < tgtMax)
      {
        retVal.push(str) ;
      }
      else
      {
        var hyphRE = new RegExp(".{1," + tgtMax + "}", "g") ;
        var words = str.split(/\s/) ;
        words.forEach( function(word) {
          var parts = word.match(hyphRE) ;
          var lastIdx = parts.length - 1 ;
          if(parts.length >= 2)
          {
            if(parts[lastIdx].length < tgtMin)
            {
              parts[lastIdx-1] += parts[lastIdx] ;
              parts.splice(lastIdx, 1) ;
              lastIdx = parts.length - 1 ;
            }
          }
          for(var ii=0; ii<parts.length; ii++)
          {
            retVal.push( parts[ii] + (ii!=lastIdx ? "-" : "") ) ;
          }
        }) ;
      }
      return retVal ;
    }

    // Find midpoint angle of an angle. i.e. angle from 30deg to 60deg has midangle of 30deg to 45deg.
    function midAngle(d){
      return d.startAngle + (d.endAngle - d.startAngle)/2;
    }
}


function getTotalSamples(data)
{
  data.forEach(function(dataitem){
    totalSamples += dataitem.value ;
  }) ;

  $("#totalReadsPlaceHolder").html(commify("" + totalSamples)) ;
}
