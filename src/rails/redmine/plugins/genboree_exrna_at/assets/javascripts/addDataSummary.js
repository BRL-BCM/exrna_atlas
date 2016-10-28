// ADD SAMPLE PIE
// - Establishes nested namespaces in which the info in the "file" record is used to make a bar chart.
// - Note that the nested closures established within addDataSummary()--the available variables and functions--are
//   ONLY available within addDataSummary() or its subclosures [don't move them out, will break].

function addDataSummary(div, file) {
  var currentpath = null ;
   
  var d3datapath = getD3dataPath() ;
  d3datapath += "?collName="+atlasSettings[file.transformColl]+"&format=flat&modifyd3="+file.modifyd3+"&percentage="+file.percentage+"&"+csrf_param+"="+csrf_token ;
  var transformations = []
  file.transformation.forEach (function (trans){
    transformations.push(encodeURIComponent(trans)) ;
  });
  d3datapath += "&transformationName="+transformations.join(",") ; 
  var sumSubjects = [];
  if(file.sumSubjectsMatchVal) {
    for(var ii=0; ii<file.sumSubjectsMatchVal.length; ii++) {
      sumSubjects.push(encodeURIComponent(file.sumSubjectsMatchVal[ii])) ;
    }
   d3datapath += "&sumSubjectsMatchVal="+sumSubjects.join(",") ;
  }
  d3datapath += "&writeToFile=true&confid=" +file.id+"&dataconf="+fileConf.dataSummaryConf
  var staticpath = buildPrjSpecFilePath(file.path) ;
  // based on the settings get the dat from the dynamic transformation or from the static file
  /*if(atlasSettings.updateData == "true") {currentpath = d3datapath ; }
  else { currentpath = staticpath ; }
  */
  currentpath = staticpath ;
  console.log(currentpath) ;
  var data ;
  d3.json(currentpath, function(error, data) {
    if(error) { // static file not found it will try to do the transformation dynamically
      
      barUpdated = true ; //global
      console.log(barUpdated) ;
      console.log(d3datapath) ;
      d3.json(d3datapath, function(error, data) {
        drawBars(div, file, data) ;
        });
    }
    else {
      drawBars(div, file, data) ;
    }
  }) ;
}


function drawBars(div, file, data)
{
  // Create SVG canvas for this pie chart
  var divRect = div.node().getBoundingClientRect() ;
  var viewBoxWidth = (divRect.width * BAR_CONF.canvas.vbWidth) ;
  var viewBoxHeight = (divRect.height * BAR_CONF.canvas.vbHeight) ;

  var x = d3.scale.ordinal().rangeRoundBands([0, BAR_CONF.INIT.barsAreaWidth], BAR_CONF.bars.innerPadding, BAR_CONF.bars.outerPadding) ;
  var y = d3.scale.linear().range([BAR_CONF.INIT.barsAreaHeight, 0]) ;
  var xAxis = d3.svg.axis().scale(x).orient("bottom") ;
  var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5) ;

  var svg =
    div.append("svg")
       .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
       .style("width", div.style("width"))
       .style("height", div.style("height"))
       .append("g") ; // First (and root) 'g' is our svg variable where we can add more graphic elements.
  svg.attr("id", "svg-" + file.id)
     .attr("transform", "translate(" + BAR_CONF.canvas.yAxis.width + ", " + BAR_CONF.canvas.margin.top + ")") ;

if(file.sort) {
      data = data.sort(function (aa,bb) {
        var retVal = 0 ;
        retVal = aa.label.toLowerCase() > bb.label.toLowerCase() ? 1 : -1 ;
        if(retVal == 0) {
          aa.data.label > bb.label ? 1 : -1 ;
        }
        return retVal ;
      }) ;
    }
    x.domain( data.map(function(d) { return mapLabel(d.label) ; }) ) ;
    y.domain( [ (file.yAxis.min || 0), (file.yAxis.max || 100) ] )
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + BAR_CONF.INIT.barsAreaHeight  + ")")
      .call(xAxis) ;

    svg.selectAll(".tick text")
       .style("text-anchor", "end")
       .attr("dx", "-0.8em")
       .attr("dy", "0.15em")
       .attr("transform", "rotate(-38)") ;

    // y-axis scale
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
        .classed("title", true)
        //.attr("transform", "rotate(-90)") // after this x is y and y is x ... and +ve dirs are now -ve and -ve dirs are now +ve
        .attr("dx", "-40px")
        .attr("dy", BAR_CONF.INIT.barsAreaHeight / 2)
        .style("text-anchor", "middle")
        .text("%");

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")  // What to do when don't exist yet? (enter() == constructor)
        // Classes trick for locatability from data; has classes: bar, escaped(label), svg.id
        .attr("class", function(d) { return "bar " + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + " " + svg.attr("id") })
        .style("fill", function(d) { return file.colors(mapLabel(d.label)); })
        .attr("x", function(d) { return x(mapLabel(d.label)); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return BAR_CONF.INIT.barsAreaHeight - y(d.value); })
        .on("mouseover", hoverBar)
        .on("mouseout", restoreBar) ;

    // Create labels and and hide them (for hover only)
    svg.selectAll("text.label")
     .data(data)
     .enter().append("text") // What to do when don't exist yet? (enter() == constructor)
      .attr("id", function(d) { return "" + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_")})
      // Classes trick for locatability from data; has classes: label, hidden, escaped(label), svg.id
      .attr("class", function(d) { return "label hidden " + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + " " + svg.attr("id") })
      .text(function(d) {
        return d3.format("2.1f")(d.value) ;
      })
      .attr("x", function(d, i) {
        if(typeof(x(d.label)) == 'undefined') {
          return  (BAR_CONF.bars.outerPadding * x.rangeBand() +
                  ((i) * BAR_CONF.bars.innerPadding * x.rangeBand()) +
                  ((i) * x.rangeBand()) +
                  x.rangeBand() / 2) ;
        }
        else {
          return x(d.label) + x.rangeBand() / 2 ;
        }
      })
      .attr("y", function(d) {
        return y(d.value) - 5;
      }) ;

    // Register mouse events for tick labels
    // Note also d3.tip() and example http://plnkr.co/edit/jZKgo2fn2enSy4zm7QFY?p=preview
    svg.selectAll(".tick text")
       .data(data)
       .attr("class", function(d) { return "tickText " + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + " " + svg.attr("id") })
       .on('mouseover', hoverTick)
       .on('mouseout', restoreTick) ;

    // -------------- BAR EVENT HANDLERS -------------
    function hoverBar(d) {
      var d3Bar = d3.select(this) ;
      var d3Text = d3.select("text.label." + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id")) ;
      var d3TickText = d3.select("text.tickText." + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id"))
      d3TickText.classed("hover", true) ;
      d3Bar.classed("hover", true) ;
      d3Text.classed("hover", true) ;
      d3Text.classed("hidden", false) ;
    }

    function restoreBar(d) {
      var d3Bar = d3.select(this) ;
      var d3Text = d3.select("text.label." + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id")) ;
      var d3TickText = d3.select("text.tickText." + d.label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id"))
      d3TickText.classed("hover", false) ;
      d3Bar.classed("hover", false) ;
      d3Text.classed("hover", false) ;
      d3Text.classed("hidden", true) ;
    }

    function hoverTick(d) {
      var d3TickText = d3.select(this) ;
      // Find actual bar using classes-trick
      var d3Bar = d3.select("rect.bar." + d3TickText.datum().label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id")) ;
      // Call unhover with that bar as the "this" (rebind scoping tricks)
      hoverBar.bind(d3Bar.node())(d) ;
    }

    function restoreTick(d) {
      var d3TickText = d3.select(this) ;
      d3TickText.classed("hover", false) ;
      // Find actual bar using classes-trick
      var d3Bar = d3.select("rect.bar." + d3TickText.datum().label.replace(/[^a-zA-z0-9\-:\.]/g, "_") + "." + svg.attr("id")) ;
      // Call unhover with that bar as the "this" (rebind scoping tricks)
      restoreBar.bind(d3Bar.node())(d) ;
    }

    // -------------- BAR HELPERS -------------
    function mapLabel(label) {
      return (file.labelMap[label] || label) ;
    }

}
