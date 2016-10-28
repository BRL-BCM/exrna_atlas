// Check for biosample counts and collects all that has the same number of selected facets
function mergeCount()
{
  var gridStore = [] ;
  subjectsinStore = [] ;
  // initialize the grid config objects
  gridConfig.fastqDb = new Object()
  gridConfig.qcMetrics = new Object() ;
  // go through the biosamples that match the count of the number
  // of facets selected
  var facetKey  = null ;
  for(var key in biosCount)
  {
    if(Object.keys(biosCount[key]).length == donutSelectionsObj.length)
    {
      // get the subtype within the facet, only one kind should go to the store(Ex- Blood/Serum)
      gridStore.push([biosCount[key][Object.keys(biosCount[key])[0]][1],  '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+key+'&docVersion=" target="_blank">'+key+'</a>', key]) ;
      subjectsinStore.push(key) ;
    }
  }
  if(gridStore.length > 0)
  {
    // see ajax.js for the following functions
    getfastqAndDbForBiosamples(subjectsinStore) ; 
    qcMetricsForBiosamples(subjectsinStore) ;
    getBiosampleMetFromSubs(subjectsinStore, gridStore) ;
  }
  else
  {
    var facets = [];
    for(var ii=0; ii<donutSelectionsObj.length; ii++)
    {
      facets.push( donutSelectionsObj[ii].facet );
    }
    Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +facets.join(", ")+ "</b>") ;
    if(Ext.getCmp('masksearch')){ Ext.getCmp('masksearch').destroy(); }
  }
}


// tracks if the required data is available before proceeding
function trackData(trackId, opts, tc, gaEvId)
{
  var maxWt = 20000 ;
  // tracks if all the transformation from the posted parameters are read before counting the biosamples from all the facets
  if(trackId == 'transform')
  {
     if(transformtracker == donutSelectionsObj.length)
     {
        console.log('Go ahead with ransformation data  . . . all fetched') ;
        mergeCount() ;
     }
     else if(tc > maxWt)
     {
       Ext.Msg.alert("TRANSFORMATION_ERROR", "Failed to read data from the transformation") ;
     }
     else
     {
        console.log('Going to wait for a while for all the transformation data to be fetched . . total time ' + tc) ;
        setTimeout(function(){console.log(transformtracker + "  " +donutSelectionsObj.length) ; trackData(trackId, null, tc+500) ;} , 500) ;
     }
  }
  else if(trackId == 'gridRender' || trackId == 'readCounts')
  {
    console.log(Object.keys(metObj).length+" " + Object.keys(gridConfig.qcMetrics).length+ " " +Object.keys(gridConfig.fastqDb).length+ " " +subjectsinStore.length) ;
    if((Object.keys(metObj).length == subjectsinStore.length) && (Object.keys(gridConfig.qcMetrics).length == subjectsinStore.length) && (Object.keys(gridConfig.fastqDb).length == subjectsinStore.length ))
    {
       console.log('Go ahead  with rendering grid') ;
       if(trackId == 'gridRender'){ combinestoredata(opts[0]) ;}
       if(trackId == 'readCounts'){combinestoredataForReadCounts(opts[0]); }
    }
    //exceeded the wait time
    else if(tc > maxWt)
    {
       Ext.Msg.alert("READ_ERROR", "Failed to read complete data for the grid to render") ;
       if(trackId == 'gridRender'){Ext.getCmp('masksearch').destroy();}
    }
    else
    {
      console.log('Going to wait for a while to get all the data for the grid. . . .totaltime  '+tc) ;
      setTimeout(function(){console.log(Object.keys(metObj).length+" " + Object.keys(gridConfig.qcMetrics).length+ " " +Object.keys(gridConfig.fastqDb).length+ " " +subjectsinStore.length) ;  ; trackData(trackId, opts, tc+500) ;} , 500) ;
    }
  }
}

//called from getBiosampleMetFromSubs
// add all the grid config values to the gridStore
function combinestoredata(gridStore)
{
  for(var ii=0; ii<gridStore.length; ii++)
  {
    var labels = ['Biosample Name', 'Biofluid Name', 'Disease Type', 'Anatomical Location', 'exRNA Source', 'Cell Culture Source', 'Profiling Assay', 'RNA Isolation Kit'] ;
    // gridStore[2] is the biosampleID of that row
    for(var ll=0; ll<labels.length; ll++){
      if(metObj[gridStore[ii][2]][labels[ll]]) { gridStore[ii].push(metObj[gridStore[ii][2]][labels[ll]]); }
      else { gridStore[ii].push('Not Applicable'); }
    }
    // ercc column values
    if(gridStore[ii][2].match(/(DWONG)/g)){ gridStore[ii].push("NA") ;}
    else if(gridConfig.qcMetrics[gridStore[ii][2]].Result == 'PASS') {gridStore[ii].push("YES") ; }
    else if(gridConfig.qcMetrics[gridStore[ii][2]].Result == 'FAIL') {gridStore[ii].push("NO") ; }
    else { gridStore[ii].push("NA") ; }


    if(gridConfig.qcMetrics[gridStore[ii][2]]['Reference Genome Reads']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Reference Genome Reads']) ;}
    else {gridStore[ii].push("NA") ;}
    if(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Genome Ratio']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Genome Ratio']) ;}
    else {gridStore[ii].push("NA") ;}
    if(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Reads']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Reads']) ;}
    else {gridStore[ii].push("NA") ;}
  }
  // load the grid
  var anStor = Ext.getCmp('searchGrid').store ;
  anStor.loadData(gridStore) ;
  // Set the new title
  // Add the store length (number of biosamples that matched the search)
  var title = Ext.getCmp('searchGrid').title ;
  if(title){ 
    var title = Ext.getCmp('searchGrid').title.split("<br>") ;
    var newtitle = "Search Results - "+gridStore.length+ " Biosamples" ;
    if (title.length == 2) {
      newtitle = newtitle + "<br>" + title[1] ;
    }
    Ext.getCmp('searchGrid').setTitle(newtitle) ;
  }
  if(Ext.getCmp('masksearch')){Ext.getCmp('masksearch').destroy(); }

  // if tool selected already, coming from iframe refresh
  // then set up tool settings for the job submission
  if(toolSelected && toolSelected.length) {
    if(toolSelected == "processPipelineRuns") {setUpProcessPipelineRunsJob('searchGrid', reSelectRowsObj) ; }
    else if(toolSelected == "DESeq2"){setUpDSeq2Job('searchGrid', reSelectRowsObj) ;}
  }
}

function combinestoredataForReadCounts(gridStore)
{
  console.log("merge the transformation columns and metadata cols and render grid") ;
  var anStore = Ext.getCmp('searchGrid').store ;
  var trcnf = gridConfig.transform ;
  var cols = trcnf[1] ;
  var data = trcnf[2] ;
  var fields = anStore.model.prototype.fields ;
  for(var ii=0; ii<trcnf[0].length; ii++)
  {
    fields.add(Ext.create("Ext.data.Field", {
      name: trcnf[0][ii]
    }));
  }

  // get the common cols and fields
  var ccols = getCommonColumns();
  var cfields = getCommonFields() ;
  // biosample already in the fields and cols;
  // so remove it from the common varaibles;
  cfields.splice(2, 1);
  for(var ii=0; ii<ccols.length; ii++)
  {
    cols.push(ccols[ii]) ;
    fields.add(Ext.create("Ext.data.Field", {
      name: cfields[ii].name
    }));
  } 
  fields.add(Ext.create("Ext.data.Field", {
      name: cfields[cfields.length-1].name
    }));
   cols.splice(cols.length-1, 1);
  gridStore = data ;
  //biosCount[key][Object.keys(biosCount[key])[0]][1],  '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+key+'&docVersion=" target="_blank">'+key+'</a>', key
  for(var ii=0; ii<gridStore.length; ii++)
  {
    gridStore[ii].push(gridName);
    gridStore[ii].push('<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+gridStore[ii][1]+'&docVersion=" target="_blank">'+gridStore[ii][1]+'</a>') ;
    var labels = ['Biosample Name', 'Biofluid Name', 'Disease Type', 'Anatomical Location', 'exRNA Source', 'Cell Culture Source', 'Profiling Assay', 'RNA Isolation Kit'] ;
    // gridStore[1] is the biosampleID of that row
    for(var ll=0; ll<labels.length; ll++){
      if(metObj[gridStore[ii][1]][labels[ll]]) { gridStore[ii].push(metObj[gridStore[ii][1]][labels[ll]]); }
      else { gridStore[ii].push('Not Applicable'); }
    }
    // ercc column values
    if(gridStore[ii][1].match(/(DWONG)/g)){ gridStore[ii].push("NA") ;}
    else if(gridConfig.qcMetrics[gridStore[ii][1]].Result == 'PASS') {gridStore[ii].push("YES") ; }
    else if(gridConfig.qcMetrics[gridStore[ii][1]].Result == 'FAIL') {gridStore[ii].push("NO") ; }
    else { gridStore[ii].push("NA") ; }


    if(gridConfig.qcMetrics[gridStore[ii][1]]['Reference Genome Reads']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][1]]['Reference Genome Reads']) ;}
    else {gridStore[ii].push("NA") ;}
    if(gridConfig.qcMetrics[gridStore[ii][1]]['Transcriptome Genome Ratio']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][1]]['Transcriptome Genome Ratio']) ;}
    else {gridStore[ii].push("NA") ;}
    if(gridConfig.qcMetrics[gridStore[ii][1]]['Transcriptome Reads']){gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][1]]['Transcriptome Reads']) ;}
    else {gridStore[ii].push("NA") ;}
  }



  Ext.getCmp('searchGrid').reconfigure(null, cols) 
  anStore.loadData(gridStore) ;
  // set the title here
  var newtitle = "Grid with RNA profiles of "+gridStore.length+ " Biosamples" ;
  Ext.getCmp('searchGrid').setTitle(newtitle) ;

  Ext.getCmp('maskreadCountsTable').hide() ;
}



// HELPER METHODS
// Given the posted search object, this method
// returns the 'values' of the facets in the order
// of the rank. The elements in the returned array is
// the path to the cell value.
// It may not end in a leaf.
function getPathsFromDoc()
{
  var pathElems = [] ;
  var pathObj = new Object() ;
  for(var ff=0; ff<treeSelectionsObj.filters.length; ff++)
  {
    pathObj[treeSelectionsObj.filters[ff].rank] =  treeSelectionsObj.filters[ff].values[0] ;
  }
  var keys = Object.keys(pathObj).sort() ;
  for(var ii=0; ii<keys.length ; ii++)
  {
    pathElems.push(pathObj[keys[ii]]) ;
  }
  return pathElems  
}


// returns the node of interest in an array by finding a key-value of interest
function findNode(array, objVal)
{
  var node ;
  node = array.filter(function(a){ return a.name == objVal})[0] ;
  return node ;
}


// returns subjects and store structure for all the leaf nodes in a given node
function getAllcellValues(node, gStore, subs)
{
  for(var ii=0; ii<node.data.length; ii++)
  {
    if ('cell' in node.data[ii]) {
      if (node.data[ii].cell.value)
      {
        for(var dd=0; dd<node.data[ii].cell.metadata.docIds.length; dd++)
        {
          for(var jj=0; jj<node.data[ii].cell.metadata.subjects[dd].length; jj++)
          {
            //'<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+node.cell.metadata.subjects[ii][jj] +'&docVersion=" target="_blank">'+node.cell.metadata.subjects[ii][jj]+'</a>'
            gStore.push([node.data[ii].cell.metadata.docIds[dd], '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+node.data[ii].cell.metadata.subjects[dd][jj] +'&docVersion=" target="_blank">'+node.data[ii].cell.metadata.subjects[dd][jj]+'</a>', node.data[ii].cell.metadata.subjects[dd][jj]]) ;
            subs.push(node.data[ii].cell.metadata.subjects[dd][jj]) ;
          }
        }
      }
    }
    else
    {
      node = node.data[ii] ;
      getAllcellValues(node)
    }
  }
  return [gStore, subs]
}

// CROSS COLL TRANSFORMATION GRIDS RELATED METHODS
function makeCrossCollTranformedGrids()
{
  /** Set height*/
  var ht = 310 ;
  if(gridName == "fluidVsExp"){title = 'Biofluids vs Assay Types'; ht = 270 ;}
  else if(gridName == "fluidVsDis"){title = 'Biofluids vs Conditions'; }
  // use query
  //var panelObj = document.getElementById('searchSummary') ;
  //panelObj.classList.add(gridName) ;
  $("#searchSummary").addClass(gridName) ;
   var crossStore = new Ext.data.SimpleStore(
    {
      fields:[]
    }
   ) ;
   var crossGrid =  new Ext.grid.GridPanel({
      title: title,
      id: gridName,
      height: ht,
      loadMask: true,
      frame: true,
      //autoScroll: true,
      forceFit: true,
      store: crossStore,
      columns: [],
      renderTo: 'searchSummary'
    });
   /** load mask */
   
   var searchMask = new Ext.LoadMask(Ext.getCmp(gridName),
            {
              msg:"Loading search results . . .",
              id: 'maskCrossTable'
            });
   searchMask.show();
   getCrossCollTransformation() ;  
}



function getStoreForCrossColl(output, gridid)
{

  var fields = [] ;
  var cols = [] ;
  var data = [];
  fields.push('name') ;
  fields.push('id') ;
  /** setting width for the first column */
  cols.push({ dataIndex: 'id', flex:1, minWidth:250}) ;

  for (var ii = 0; ii< output.Data.length; ii++)
  {
    fields.push('field'+ii) ;
    /** width for the other columns. Col headers are wrapped using css */
    cols.push({
                text: output.Data[ii].name,
                dataIndex: 'field'+ii,
                align: 'center',
                flex:1,
                minWidth:110,
                renderer: function(value, md, rec, ri, ci, store, view){
                  if (value)
                  {
                  var retVal = "<span data-qtip='View biosample metadata details'>"+value+"</span>" ;
                  return retVal ;
                  }
                  else {return value ;}
                }
                }) ;
    for(var jj=0; jj<output.Data[ii].data.length; jj++)
    {
       var val ;
       if(!(output.Data[ii].data[jj].cell.value)){val = null ;}
       else{val = output.Data[ii].data[jj].cell.value.toLocaleString() ;}
       if(ii == 0)// enter values for both 'id' and the first field,
       {
         if(val){data.push([output.Data[ii].data[jj].name, '<b>'+output.Data[ii].data[jj].name+'</b>' , '<div class="popWindow" onclick=getDataForWindow('+Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.docIds)+','+ Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.subjects)+',\''+escape(output.Data[ii].name)+'\',\''+escape(output.Data[ii].data[jj].name)+'\')>'+val+'</div>']); }
         else{data.push([output.Data[ii].data[jj].name, '<b>'+output.Data[ii].data[jj].name+'</b>', val]);}
       }
       else
       {
          if(val && 'metadata' in output.Data[ii].data[jj].cell){data[jj].push('<div class="popWindow" onclick=getDataForWindow('+Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.docIds)+','+ Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.subjects)+',\''+escape(output.Data[ii].name)+'\',\''+escape(output.Data[ii].data[jj].name)+'\')>'+val+'</div>');}
          else {data[jj].push(val) ;}
       }
    }
  }
  return [fields, cols, data] ;
}

function getDataForWindow(docIds, subjects, xvalue, yvalue)
{
  // global
  subjectsinStore = [] ;
  var windowstore = [];
  makeCellWindow() ;
  gridConfig.fastqDb = new Object()
  gridConfig.qcMetrics = new Object() ;
  for(var ii=0; ii<docIds.length; ii++)
  {
    for(var jj=0; jj<subjects[ii].length; jj++)
    {
      subjectsinStore.push(subjects[ii][jj]) ;
      windowstore.push([docIds[ii], '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+subjects[ii][jj]+'&docVersion=" target="_blank">'+subjects[ii][jj]+'</a>', subjects[ii][jj]]) ;
    }
  }
  getfastqAndDbForBiosamples(subjectsinStore) ;
  qcMetricsForBiosamples(subjectsinStore) ;
  getBiosampleMetFromSubs(subjectsinStore, windowstore) ;   
}


function makeCellWindow()
{
  getsearchGrid('searchGrid') ;
  var windowGrid = Ext.create('searchGrid', { }) ;

  var title = 'Metadata about Biosamples:<br>';
  /** create and show the window. */
  var popWin = Ext.create('Ext.window.Window', {
    height: 500,
    title: title, 
    width: 1000,
    padding: "0px 0px 0px 0px",
    modal: true,
    id: 'cellWindow',
    layout: 'fit',
    items:[windowGrid]
  });
  popWin.show();
  popWin.center() ;
  var searchMask = new Ext.LoadMask(Ext.getCmp('cellWindow'),
            {
              msg:"Loading search results . . .",
              id: 'masksearch'
            });
  searchMask.show();

}



function makeAnalysisTable()
{
  // Store for the analysis grid
  var studyAnalysisStore = new Ext.data.SimpleStore(
  {
    fields:
    [
      { name : 'analysisID' },        
      { name : 'studyTitle' },
      { name : 'numberOfSamples' },
      { name : 'reference' },
      { name : 'extDB' },
      { name : 'piName' },
      { name : 'coPINames' },
      { name : 'fundingSource' },
      { name : 'grantName' },
      { name : 'organization' },
      { name : 'anDocId'}
     
     ]
   }) ;
  var filters = {
    ftype: 'filters',
    local: true,
    } ; 
  // Analysis grid definition
  var studyAnalysisGrid = new Ext.grid.GridPanel(
  {
    id: 'analysisTable',
    height: 600,
    autoScroll: true,
    title: 'exRNA Profiling Datasets',
    frame: true,
    store: studyAnalysisStore,
    features: [filters],
    columns:
    [{
      id: 'analysisID',
      locked: true,
      text: 'Dataset Accession ID',
      tooltip: "<b>Accession ID of this Dataset</b><br>Click to open the RNA profile grid for each dataset. Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'analysisID',
      minWidth: 200,
      flex:1,
      sortable: true,
      filterable: true
    },        
    {
      id: 'studyTitle',
      text: 'Study Title',
      tooltip: "<b>Study Title</b><br>Name of the Study. Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'studyTitle',
      sortable: true,
      flex:1,
      minWidth: 280,
      filterable: true,
      tdCls:'wrap-text'
    },
    {
      id: 'numberOfSamples',
      text: 'Number of Samples in the Dataset',
      tooltip: "<b>Number of Samples in the Dataset</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
         var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
         return retVal ;
      },
      dataIndex: 'numberOfSamples',
      sortable: true,
      flex: 1,
      minWidth: 120,
      filterable: true
    },
    {
       text: "Download Dataset Files",
       tooltip: "<b>Download Dataset Files</b><br>Links to various data files associated with each dataset. See more details below. Use the arrow in the right corner to filter this column.",
       id: 'download',
       minWidth: 200,
       align: 'center',
       renderer: function(value, p, record){
         var analysisDocId = record.get('anDocId') ;
         var ver = record.get('version');
         return Ext.String.format('<div>'+

           '<a class="postProcess diagnosticplot" data-qtip="<b>Diagnostic Plots PDF</b><br>Download PDF file containing diagnostic plots for this dataset." data-qwidth="200" onclick="getDatasetsPostProcessingFilesWithDataAccess(\''+ analysisDocId + '\', \'diagnosticPlot\')" > <i class="fa fa-area-chart"></i></a>' +

           '<a class="postProcess mirnareadcounts" data-qtip="<b>Raw miRNA Read Counts</b><br>Download text file containing raw (not normalized) read counts for endogenous miRNAs found in this dataset." data-qwidth="200" onclick="getDatasetsPostProcessingFilesWithDataAccess(\''+ analysisDocId + '\', \'miRNAreadCounts\')" > <i class="fa fa-file-text"></i></a>' +

           '<a class="postProcess exogenousGenome" data-qtip="<b>Exogenous Genome Taxonomy Cumulative Read Counts</b><br>Download text file containing exogenous genome taxonomy cumulative read counts for this dataset." data-qwidth="200" onclick="getDatasetsPostProcessingFilesWithDataAccess(\''+ analysisDocId + '\', \'exogenous\')" > <i class="fa fa-list"></i></a>' +

           '<a class="postProcess ribosomal" data-qtip="<b>Exogenous rRNA Taxonomy Cumulative Read Counts</b><br>Download text file containing exogenous ribosomal RNA taxonomy cumulative read counts for this dataset." data-qwidth="200" onclick="getDatasetsPostProcessingFilesWithDataAccess(\''+ analysisDocId + '\', \'ribosomal\')" > <i class="fa fa-list-alt"></i></a>'+

           '<a class="postProcess archive" data-qtip="<b>All Post&ndash;processing Files for Dataset</b><br>Download archive containing post-processing files for this dataset." data-qwidth="200" onclick="getDatasetsPostProcessingFilesWithDataAccess(\''+ analysisDocId + '\', \'postProcessArchive\')" > <i class="fa fa-archive"></i></a>'+
           '</div>'
         );
       }

     },
    {
      id: 'reference',
      text: 'PubMed ID',
      tooltip: "<b>PubMed ID Reference</b><br>PubMed ID related to each dataset.",
      renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "";
          if(value) {
            retVal = "<span data-qtip='"+value+"&nbsp;'><i class='fa fa-book'></i> "+value+"</span>" ;
          }  
          return retVal; 
      },
      dataIndex: 'reference',
      sortable: true,
      flex:1,
      minWidth: 120,
      filterable: true
    },
    {
      id: 'extDB',
      text: 'External Database References',
      tooltip: "<b>External Database References</b><br>Accession IDs related to each dataset.",
      renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "";
          if(value) {
            retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
          }  
          return retVal; 
      },
      dataIndex: 'extDB',
      sortable: true,
      flex:1,
      minWidth: 180,
      filterable: true
    },    
    {
      id: 'piName',
      text: 'PI Name',
      tooltip: "<b>PI Name.</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
         var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
         return retVal ;
      },
      dataIndex: 'piName',
      sortable: true,
      flex: 1,
      minWidth: 150,
      filterable: true
    },
    {
      id: 'coPINames',
      text: 'Co-PI Names',
      tooltip: "<b>Co-PI Names</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
         var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
         return retVal ;
      },
      dataIndex: 'coPINames',
      sortable: true,
      flex: 1,
      minWidth: 150,
      filterable: true,
      tdCls:'wrap-text'
    },
    {
      id: 'fundingSource',
      text: 'Funding Source',
      tooltip: "<b>Funding Source</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'fundingSource',
      sortable: true,
      flex: 1,
      minWidth: 200,
      filterable: true
    },
    {
      id: 'grantName',
      text: 'Grant Name/Number',
      tooltip: "<b>Grant Name/Number</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'grantName',
      sortable: true,
      flex:1,
      minWidth: 150,
      filterable: true
    },
    {
      id: 'organization',
      text: 'Organization',
      tooltip: "<b>Organization</b><br>Use the arrow in the right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
          return retVal ;
      },
      dataIndex: 'organization',
      sortable: true,
      flex:1,
      minWidth: 200,
      filterable: true
    }
    ],
    stripeRows: true,
    renderTo: 'searchSummary'
  }) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp('analysisTable'),
    {
      msg:"Loading search results . . .",
      id: 'maskanalysisTable'
    });
  searchMask.show();
  studyAnalysisStore.sort('numberOfSamples', 'ASC');
  /** gets the store from the cache*/
  // get the synamic data only through the settings
  if(atlasSettings.updateData == "true") {  readTransformationsFromConfigAndLoadStore(); }
  else {getProfileTable() ;}
}

// /////////////
// Methods associated with analysis document transformation and studies grid
// /////////////
function makeAnPanel(anDoc) {
  // Store for the analysis grid
  var analysisStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'property' },
        { name : 'value' }
      ]
    }) ;
  /** Analysis Grid definition */
  var analysisGrid = new Ext.grid.GridPanel(
    {
      id: 'anGrid',
      width: 890,
      viewConfig: { forceFit: true },
      autoScroll: true,
      store: analysisStore,
      columns:
      [
        {
          id: 'property',
          text: 'Property',
          tooltip: "<b>Property</b><br>Description of the property being defined. Click arrow on right corner to sort this column.",
          dataIndex: 'property',
          width: 250,
          sortable: true
        },
        {
          id: 'value',
          text: 'Value',
          tooltip: "<b>Value</b><br>The value associated with each of the property on the left. Use the arrow on the corner to sort this column.",
          dataIndex: 'value',
          width: 350,
          sortable: true
        }
      ],
      stripeRows: true
    }) ;


  Ext.onReady(function(){
    smallGridWindow = new Ext.Window({
      cls: 'mainPanel',
      bodyCls: 'colPanel',
      id: 'anView',
      title: 'RNA PROFILE GRID',
      modal: true,
      stateful: false,
      width: 605,
      height: 250,
      bodyStyle: 'padding: 4px;',
      layout: 'fit',
      region: 'center',
      items: [analysisGrid]
    });
    smallGridWindow.center();
    smallGridWindow.show();

    fillAnalysisGrid(anDoc);
  });
}


function getAnalysisData(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var anDoc = resObj;
  var statusObj = resObj['status'] ;
  if(result.status >= 200 && result.status < 400 && anDoc)
  {
    var retVal = [] ;
    var docLink ;
    var docName = anDoc['Analysis']['value'] ;
    docLink = '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.analysesColl+'&doc='+docName+'&docVersion=" target="_blank">'+docName+'</a>' ;
    retVal.push(['&nbsp;<b>Analysis</b>', docLink]);
    if('Data Analysis Level' in anDoc['Analysis']['properties'] && 'Type' in anDoc['Analysis']['properties']['Data Analysis Level']['properties'])
      {
        var type = anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['value'] ;
        retVal.push(['&nbsp;<b>Type</b>', type]);
        if('Level 1 Reference Alignment' in anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties'] && 'Alignment Method' in anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties'])
          {retVal.push(['&nbsp;<b>Alignment Method</b>', anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties']['Alignment Method']['value']]);}
         
         //retVal.push(['&nbsp;<b>Genome Version</b>', anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties']['Genome Version']['value']]) ;
         // add this row only if a valid type is present 
         retVal.push(['&nbsp;<b>Grid View</b>', '<a class="showHigh"  onclick="makeGridPage(\''+ docName +'\', \''+type+'\')"></a>']) ;
      }
    else
    {
      retVal.push(['&nbsp;<b>Type</b>', 'No Data']) ;
    }
    var anStor = Ext.getCmp('anGrid').store ;
    anStor.loadData(retVal) ;
  }
  else
  {
    displayFailureDialog(result, request) ;
  }
}


function displayFailureDialog(result, request)
{
  var displayMsg = "The following error was encountered while retrieving the Analyses document' :<br><br>"
  displayMsg += ( "<b>Error Code:</b> <i>" + (result.status ? result.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
  displayMsg += ( "<b>Error Message:</b> <i>" + (result.statusText? result.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
  displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
  Ext.Msg.alert("ERROR", displayMsg) ;
}



function makeGridPage(docName, assay)
{
   wbForm = document.createElement("form") ;
   wbForm.method = "post" ;
   wbForm.action = "gridview" ; 
   wbForm.target = "_blank" ;
   formAppend(wbForm, document.createElement("input") ,"grid", docName) ;
   formAppend(wbForm, document.createElement("input") ,"assay", assay) ;
   formAppend(wbForm, document.createElement("input") , csrf_param, csrf_token) ;
    document.body.appendChild(wbForm) ;
    try 
    {
       wbForm.submit() ;
       document.body.removeChild(wbForm);
    }
    catch(err) 
    {
      document.body.removeChild(wbForm);
    }
}


function formAppend(myForm, myInput, inputName, inputValue)
{
    myInput.setAttribute("name", inputName);
    myInput.setAttribute("value", inputValue);
    myForm.appendChild(myInput);
}

// analysis transformation table
// render the empty grid with no cols or fields
// are dynamic as per the trasnformed output
function renderAnalysisTransformationGrid(gridId)
{
  var gStore = new Ext.data.SimpleStore(
    {
      fields: []
    }
   ) ;
  var selMode = getSelModel() ;
  var toolBar = getToolBar(gridId) ;
   var filters = {
    ftype: 'filters',
    local: true,
    } ;
  var viewGrid = new Ext.grid.GridPanel(
  {
    id: gridId,
    border : true,
    height: 500,
    layout: 'fit',
    frame: true,
    useArrows: true,
    //autoScroll: true,
    store: gStore,
    selModel: selMode,
    title: 'Grid with RNA Profile of Biosamples',
    columns: [],
    features: [filters],
    tbar:  toolBar,
    renderTo: 'searchSummary'
  }) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp(gridId),
        {
          msg:"Loading search results . . .",
          id: 'maskreadCountsTable'
        });
  searchMask.show();
} 

function getStoreFromOutput(output)
{
  gridConfig.transform = {} ;
  gridConfig.qcMetrics = new Object() ;
  gridConfig.fastqDb = new Object() ;
  /** fields for the store */
  var fields = [] ;
  /** columns for the grid */
  var cols = [] ;

  /** data */
  var data = [];
  subjectsinStore = [] ; // global
  /** First field to hold the name of the last partition (displayed as rowheaders) */
  fields.push('id') ;
  /** Actually the text should be what is in the context. Ignoring that right now. Adding just a static value */
  cols.push({ dataIndex: 'id', filterable: true, text: '<b>Biosamples</b>', minWidth: 250, flex:1}) ;
  fields.push('biosample') ;
  for (var ii = 0; ii< output.Data.length; ii++)
  {
    fields.push('field'+ii) ;
    cols.push({text: output.Data[ii].name, dataIndex: 'field'+ii, minWidth: 110, filter:{type: 'numeric'}}) ;
    for(var jj=0; jj<output.Data[ii].data.length; jj++)
    {
       var val ;
       if(!(output.Data[ii].data[jj].cell.value)){val = null ;}
       else
       {
         val = output.Data[ii].data[jj].cell.value.toLocaleString() ;
       }
       if(ii == 0)
        /**
          * enter values for both 'id' and the first field, and also get metadata values for the first col
          */
       {
         var metadata = '<span class="metadata">' ;
         for(var met in output.Data[ii].data[jj].metadata)
         {
           if(output.Data[ii].data[jj].metadata[met].length > 0)
           {
             metadata = metadata + "<br><b>" + met +":</b> "+ output.Data[ii].data[jj].metadata[met].join(",") ;
           }
           else
           {
             metadata = metadata + "<br><b>" + met +":</b> [No Data]";
           }
         
         }
         metadata = metadata + '</span>' ;
         var bioname = output.Data[ii].data[jj].name ;
         subjectsinStore.push(bioname) ;
         //<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+key+'&docVersion=" target="_blank">'+key+'</a>
         data.push(['<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+output.Data[ii].data[jj].name+'&docVersion=" target="_blank">'+output.Data[ii].data[jj].name+'</a>', output.Data[ii].data[jj].name, val]);
       }
       else
       {
          data[jj].push(val);

       }
    }
  }
  gridConfig.transform = [fields, cols, data] ;
  getfastqAndDbForBiosamples(subjectsinStore) ;
  qcMetricsForBiosamples(subjectsinStore) ;
  getBiosampleMetFromSubs(subjectsinStore, [], true) ;
  return [fields, cols, data] ;
}

