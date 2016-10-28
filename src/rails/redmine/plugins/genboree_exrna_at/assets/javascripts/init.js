// ------------------------------------------------------------------
// GLOBALS (should all be confined in CONF actually...)
var docReady = false ;

// make these vars dynamic .
var fileConfPath = "fileConf.json";
var fileConf = null; 
var BAR_CONF,
    CONF,
    arc,
    growInward,
    growOutward,
    growBothward,
    growBothwardSel,
    restoreGrowth,
    labelArc ;

// ------------------------------------------------------------------
// INIT the page, begin page production.
function init(method) {
  // Check settings
  settingsValid = validateSettings() ;
  if(settingsValid) {
    if(!docReady) { // Then first call, via one of several page listeners
      docReady = true;
      d3.json(buildConfPath(fileConfPath), function(error, json) {
        fileConf = json ;
        makeSampleSummaries() ;
        makeDataSummaries() ;
        // get total reads for the stats
        getTotalReads() ;
     });
    }
  }
  else
  {
    displayAlert("SETTINGS_ERROR, Error in atlas settings. Make sure all the settings are available or contact the project admin to resolve the issue.");
  }
}

// validates the atlas settings
function validateSettings()
{
 var retVal = false ;
  /* Check if all the config options have been set properly */
  if (atlasSettings && atlasSettings.gbHost != ''  && atlasSettings.gbGroup != '' && atlasSettings.gbKb != '' && atlasSettings.analysesColl != '' && atlasSettings.biosamplesColl != '' && atlasSettings.donorsColl != '' && atlasSettings.runsColl != '' && atlasSettings.experimentsColl != '' && atlasSettings.resultFilesColl != '' && atlasSettings.studiesColl != '' && atlasSettings.jobsColl != '' && atlasSettings.jobHost != '') {
    retVal = true ;
  }
  else {
    displayAlert('Incorrect Config/Settings', 'Please make sure the following fields are set properly:</br>gbHost</br>gbGroup</br>gbKb</br>ExRNA Atlas Data Collections</br>Contact the project administrator for help with setting up the application.') ;
  }
  return retVal ;

}

// builds the configuration data file path (local files)
function buildConfPath(confFile) {
  return urlMount + "/projects/" + projectId + "/exat/data/" + confFile ;
}

function buildPrjSpecFilePath(confFile) {
  return urlMount + "/projects/" + projectId + "/exat/prjdata/" + confFile ;
}

// builds d3 datapath
function getD3dataPath() {
  return urlMount + "/projects/" + projectId + "/exat/d3data" ;
}



// ------------------------------------------------------------------
// Page-prep functions. Arranges serial processing (d3.json() is an ajax call)
function makeSampleSummaries() {
  // (A) FIRST: load & init config needed
  d3.json(buildConfPath(fileConf.donutConf), function(error, json) {
    CONF = json ;
    // Compute some derived numbers.
    // CONF.INIT.radius = Math.min(CONF.canvas.width, CONF.canvas.height) / 4 ;
    CONF.INIT.radius = CONF.canvas.width / 4 ;
    CONF.INIT.arcOuter = CONF.INIT.radius * CONF.arc.outer ;
    CONF.INIT.arcInner = CONF.INIT.radius * CONF.arc.inner ;
    CONF.INIT.labelArcOuter = CONF.INIT.radius * CONF.labelArc.outer ;
    CONF.INIT.labelArcInner = CONF.INIT.radius * CONF.labelArc.inner ;
    CONF.INIT.summaryFontSize = CONF.INIT.radius / 6 ;
    // Cast some conf values
    CONF.color.hover = d3.rgb(CONF.color.hover) ;
    CONF.color.select = d3.rgb(CONF.color.select) ;
    // Create arc generation functions
    // - main donut arc function:
    arc = d3.svg.arc().outerRadius(CONF.INIT.arcOuter).innerRadius(CONF.INIT.arcInner) ;
    // - grow both inward and outward a little for "hover" effect:
    growBothward = d3.svg.arc()
      .outerRadius(CONF.INIT.arcOuter * CONF.grow.hoverOuter)
      .innerRadius(CONF.INIT.arcInner * CONF.grow.hoverInner);
    // - grow a lot inward, outward or bothward as options for "selected slice"
    //   . Note: code is using "growInward"!
    growInward = d3.svg.arc()
      .outerRadius(CONF.INIT.arcOuter)
      .innerRadius(CONF.INIT.arcInner * CONF.grow.selInner);
    growOutward = d3.svg.arc()
      .outerRadius(CONF.INIT.arcOuter * CONF.grow.selOuter)
      .innerRadius(CONF.INIT.arcInner);
    growBothwardSel = d3.svg.arc()
      .outerRadius(CONF.INIT.arcOuter * CONF.grow.hoverOuter)
      .innerRadius(CONF.INIT.arcInner * CONF.grow.selInner * CONF.grow.hoverInner);
    // - Restore growth to normal (should be same as arc ...)
    restoreGrowth = d3.svg.arc()
      .outerRadius(CONF.INIT.arcOuter)
      .innerRadius(CONF.INIT.arcInner);
    // - Create special "labelArc" used to make label-line inflection points
    labelArc = d3.svg.arc().innerRadius(CONF.INIT.labelArcOuter).outerRadius(CONF.INIT.labelArcInner);

    // (B) SECOND: now have conf, draw sample summaries
    drawSampleSummaries() ;
  }) ;
}

function makeDataSummaries() {
  // (A) FIRST: load & init config needed
  d3.json(buildConfPath(fileConf.barConf), function(error, json) {
    BAR_CONF = json ;
    // Compute some derived numbers.
    BAR_CONF.INIT.barsAreaWidth = BAR_CONF.canvas.width - BAR_CONF.canvas.yAxis.width ;
    BAR_CONF.INIT.barsAreaHeight = BAR_CONF.canvas.height - BAR_CONF.canvas.xAxis.height ;

    // (B) SECOND: now have conf, draw sample summaries
    drawDataSummaries() ;
  }) ;
}

// ------------------------------------------------------------------
// DYNAMIC VISUALIZATIONS - SAMPLES SUMMARY DONUTS

function drawSampleSummaries() {
  // sampleSummaryConf is being used on both client and server side as-is. Dumb assumption, costly to maintain and adjust.
  d3.json(buildConfPath(fileConf.sampleSummaryConf), function(error, json) {
    CONF.files = json ;
    CONF.files.forEach( function(file) {
      file.colors = d3.scale.ordinal().range(file.colors) ;
      var container = d3.select("div#" + file.id + "-cont");
      var div = container.append("div") ;
      div.attr("id", file.id)
         .classed("titledPie", true) ;
      var svgDiv = div.append("div") ;
      svgDiv.attr("id", file.id + "-title")
         .classed("title", true) ;
      svgDiv.html(function(d) {
        var html = "" + file.title ;
        html += "<span id=\"" + file.id + "-pieToggleBtn\" " ;
        html += "class=\"pieToggleBtn setToOn fa fa-plus-square\" " ;
        html += "onclick=\"togglePieSlices(this, '" + file.id + "')\">" ;
        html += "</span>" ;
        return html ;
      }) ;
      var pieDiv = div.append("div") ;
      pieDiv.attr("id", file.id + "-pie")
         .classed("pie", true)
         .classed("canvas", true)
         .classed("center-block", true)
         .style("width", "" + CONF.canvas.width + "px")
         .style("height", "" + CONF.canvas.height + "px") ;
       // call the method to get the donut data from dynamic transformation
       pieDiv.call(addSamplePie, file) ;
    }) ;

    // Now that have conf and 1+ sample summary drawings, make filter menu
    // - Needs info about placement of 1st and last sample summary drawing, so serial.
    addFilterMenu() ;
  }) ;
}

// DYNAMIC VISULIZATIONS - DATA SUMMARY BAR CHARTS
function drawDataSummaries() {
  // dataSummaryConf is being used on both client and server side as-is. Dumb assumption, costly to maintain and adjust.
  d3.json(buildConfPath(fileConf.dataSummaryConf), function(error, json) {
    BAR_CONF.files = json ;

    BAR_CONF.files.forEach( function(file) {
      file.colors = d3.scale.ordinal().range(file.colors) ;
      var container = d3.select("div#" + file.id + "-cont");
      var div = container.append("div");
      div.attr("id", file.id)
         .classed("titledBar", true) ;
      var svgDiv = div.append("div") ;
      svgDiv.attr("id", file.id + "-title")
         .classed("title", true)
         .text(file.title) ;
      var barDiv = div.append("div") ;
      barDiv.attr("id", file.id + "-bar")
         .classed("bar", true)
         .classed("canvas", true)
         .style("width", "" + BAR_CONF.canvas.width + "px")
         .style("height", "" + BAR_CONF.canvas.height + "px") ;
      barDiv.call(addDataSummary, file) ;
    }) ;
  }) ;
}


// get the total reads - either from the static file or dynamically from the d3 generators.
function getTotalReads()
{
  d3.json(buildConfPath(fileConf.totalReadsConf), function(error, file) {
    // dynamic data path
    var d3datapath = getD3dataPath() ;
    d3datapath += "?collName="+encodeURIComponent(atlasSettings[file.transformColl])+"&format=flat&modifyd3=sumOfAllSubjects&"+csrf_param+"="+csrf_token+"&transformationName="+encodeURIComponent(file.transformation) ;
    d3datapath += "&writeToFile=true&confid=" +file.id+"&dataconf="+fileConf.totalReadsConf ;
    // static path
    var staticpath = buildPrjSpecFilePath(file.path) ;
    var currentpath = null; 
    /*if(atlasSettings.updateData == "true") { currentpath = d3datapath ;}
    else { currentpath = staticpath ; }
    */
   currentpath = staticpath ;
   console.log(currentpath) ; 
    d3.json(currentpath, function(error, data) {
       if(error) // stattic file not written or absent
       {
         totalReadsUpdated = true ;
         d3.json(d3datapath, function(error, json){
           totalReads = json.value ;
           $('#totalPlaceHolder').html(commify("" + totalReads)) ;
        });

       }
       else
       {
          totalReads = data.value ;
          $('#totalPlaceHolder').html(commify("" + totalReads)) ;
       }
    });
  }) ;

}


function updateBars()
{
  console.log("update bars data and write to project specific area. . . . . . . .") ;
  var fileC ;
  //d3.json(buildConfPath("fileConf.json"), function(error, json) {
         d3.json(buildConfPath(fileConf.dataSummaryConf), function(error, json) {
           fil = json;
           fil.forEach( function(fileitem) {
             var d3datapath = getD3dataPath() ;
             d3datapath += "?collName="+encodeURIComponent(atlasSettings[fileitem.transformColl])+"&format=flat&modifyd3="+fileitem.modifyd3+"&percentage="+fileitem.percentage+"&"+csrf_param+"="+csrf_token;
             var transformations = []
             fileitem.transformation.forEach (function (trans){
               transformations.push(encodeURIComponent(trans)) ;
             }); 
             d3datapath += "&transformationName="+transformations.join(",") ;
             var sumSubjects = [];
             if(fileitem.sumSubjectsMatchVal) {
               for(var ii=0; ii<fileitem.sumSubjectsMatchVal.length; ii++) {
                 sumSubjects.push(encodeURIComponent(fileitem.sumSubjectsMatchVal[ii])) ;
               }
               d3datapath += "&sumSubjectsMatchVal="+sumSubjects.join(",") ;
             }
            d3datapath += "&writeToFile=true&confid=" +fileitem.id+"&dataconf="+fileConf.dataSummaryConf ;
            d3.json(d3datapath, function(error, json){});
           });
         }) ;
  //}) ;
  
}

function updateDonuts()
{
  console.log("Updating donuts data and writing to project specific area");
  d3.json(buildConfPath(fileConf.sampleSummaryConf), function(error, json) {  
    files = json;
    files.forEach( function(file) {
      var d3datapath = getD3dataPath() ;
      d3datapath += "?collName="+encodeURIComponent(atlasSettings[file.transformColl])+"&format=flat&transformationName="+encodeURIComponent(file.transformation)+"&modifyd3="+file.modifyd3+"&"+csrf_param+"="+csrf_token ;
      d3datapath += "&writeToFile=true&confid=" +file.id+"&dataconf="+fileConf.sampleSummaryConf ;
      if('groupLabelFile' in file) {d3datapath += "&grouplabelconf="+file.groupLabelFile ;}
      console.log(d3datapath) ;
      d3.json(d3datapath, function(error, json){
      });
    });
  });
}

function updateTotalReads()
{
  console.log("Update total reads ......");
  d3.json(buildConfPath(fileConf.totalReadsConf), function(error, file) {
    var d3datapath = getD3dataPath() ;
    d3datapath += "?collName="+encodeURIComponent(atlasSettings[file.transformColl])+"&format=flat&modifyd3=sumOfAllSubjects&"+csrf_param+"="+csrf_token+"&transformationName="+encodeURIComponent(file.transformation) ;
    d3datapath += "&writeToFile=true&confid=" +file.id+"&dataconf="+fileConf.totalReadsConf ;
    console.log(d3datapath) ;
    d3.json(d3datapath, function(error, json){
    });
 });
}

// alerts
function displayAlert(message) {
  $("#alertModal").modal("show");
  $("#alertText").text(message);
}
