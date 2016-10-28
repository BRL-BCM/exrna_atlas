/** Analysis table associated functions 
  * Method to render the grid
  */
function makeAnalysisTable()
{
  var panelObj = document.getElementById('gridsContainer') ;
  panelObj.classList.add("studiestable") ;
  // Store for the analysis grid
  var studyAnalysisStore = new Ext.data.SimpleStore(
  {
    fields:
    [
      { name : 'analysisID' },        
      { name : 'studyTitle' },
      { name : 'piName' },
      { name : 'fundingSource' },
      { name : 'grantName' },
      { name : 'organization' }
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
    forceFit: true ,
    autoScroll: true,
    height: 500,
    title: 'Grid for exRNA Profiling Studies',
    frame: true,
    store: studyAnalysisStore,
    features: [filters],
    columns:
    [{
      id: 'analysisID',
      locked: true,
      text: 'Analysis Accession ID',
      tooltip: "<b>Value</b><br>Analysis Document Accession ID. Click to open the grid for this Analysis Document. Use the arrow on the corner to sort and filter this column.",
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
      tooltip: "<b>Study Title</b><br>Name of the Study. Click arrow on right corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'studyTitle',
      sortable: true,
      flex:1,
      minWidth: 150,
      filterable: true
    },
    {
      id: 'piName',
      text: 'PI Name',
      tooltip: "<b>Value</b><br>Name of the PI. Use the arrow on the corner to sort and filter this column.",
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
      id: 'fundingSource',
      text: 'Funding Source',
      tooltip: "<b>Value</b><br>Funding Source. Use the arrow on the corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
        var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
        return retVal ;
      },
      dataIndex: 'fundingSource',
      sortable: true,
      flex: 1,
      minWidth: 150,
      filterable: true
    },
    {
      id: 'grantName',
      text: 'Grant Name/Number',
      tooltip: "<b>Value</b><br>Grant Name/Number. Use the arrow on the corner to sort and filter this column.",
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
      tooltip: "<b>Value</b><br>Organization. Use the arrow on the corner to sort and filter this column.",
      renderer: function(value, md, rec, ri, ci, store, view){
          var retVal = "<span data-qtip='"+value+"'>"+value+"</span>" ;
          return retVal ;
      },
      dataIndex: 'organization',
      sortable: true,
      flex:1,
      minWidth: 150,
      filterable: true
    }],
    stripeRows: true,
    renderTo: 'gridsContainer'
  }) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp('analysisTable'),
            {
              msg:"Loading search results . . .",
              id: 'maskanalysisTable'
            });
  searchMask.show();
  /** gets the store from the cache*/
  getProfileTable() ;
}

/** RNA Profile Grid in a small pop-up window
 * @param {string} anDoc analysis doc identifier
 */
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

/** get the property-value pair from the selected analysis doc
 * @param {Object} result object of the ajax request
 * @param {Object} request object of the ajax request
 */
function getAnalysisData(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var anDoc = resObj['data'];
  var statusObj = resObj['status'] ;
  if(result.status >= 200 && result.status < 400 && anDoc)
  {
    var retVal = [] ;
    var docLink ;
    var docName = anDoc['Analysis']['value'] ;
    docLink = '<a href="'+decodeURIComponent(redMinePrj)+'&coll=Analyses&doc='+docName+'&docVersion=" target="_blank">'+docName+'</a>' ;
    retVal.push(['&nbsp;<b>Analysis</b>', docLink]);
    retVal.push(['&nbsp;<b>Genome Version</b>', anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties']['Genome Version']['value']]) ;
    if('Data Analysis Level' in anDoc['Analysis']['properties'] && 'Type' in anDoc['Analysis']['properties']['Data Analysis Level']['properties'])
      {
        retVal.push(['&nbsp;<b>Type</b>', anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['value']]);
        if('Level 1 Reference Alignment' in anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties'] && 'Alignment Method' in anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties'])
          {retVal.push(['&nbsp;<b>Alignment Method</b>', anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['Level 1 Reference Alignment']['properties']['Alignment Method']['value']]);}
      }
    else
    {
      retVal.push(['&nbsp;<b>Type</b>', 'No Data']) ;
    }
    retVal.push(['&nbsp;<b>Grid View</b>', '<a class="showHigh"  onclick="makeGridPage(\''+ docName +'\')"></a>']) ;
    var anStor = Ext.getCmp('anGrid').store ;
    anStor.loadData(retVal) ; 
  }   
  else
  {
    displayFailureDialog(result, request) ;
  }
}

/** launches the transformation table for a single analysis doc
 * @param {string} docName document identifier
 */
function makeGridPage(docName)
{
  var mount = ( window.location.toString().indexOf(urlMount) >= 0 ? urlMount : "" ) ;
  var jspMount = ( window.location.toString().indexOf(urlMount) >= 0 ? ("/java-bin" + urlMount) : "" ) ;
  if(publicVersion == "true")
  {
     var url = 'http://' + location.host + mount + '/exRNA-Grids.rhtml?anDoc='+ docName ;
  }
  else
  {
     var url = 'http://' + location.host + jspMount + '/exRNA-Grids.jsp?anDoc='+ docName ;
  }
  window.open(url);
}

/** Failure dialog to ajax request
 * @param {Object} result object of the ajax request
 * @param {Object} request object of the ajax request
 */
function displayFailureDialog(result, request)
{
  var resObj  = JSON.parse(result.responseText) ;
  var anDoc = resObj['data'];
  var statusObj = resObj['status']
  var message = statusObj['msg'] ;
  var statusCode = statusObj.statusCode ;
  var displayMsg = "The following error was encountered while retrieving the analysis document -"+message+ ":<br><br>"
  Ext.Msg.alert("ERROR", displayMsg) ;
}

/** Method to render the grid to the div element and to lauch the load mask
 * @param {string} type of the cross collection transformation - fluidVsDis or fluidVsExp
 */
function makeCrossCollTranformedGrids(type)
{
  /** Set height*/
  var ht = 310 ;
  if(type == "fluidVsExp"){title = 'Biofluids vs Assay Types'; ht = 270 ;}
  else if(type == "fluidVsDis"){title = 'Biofluids vs Conditions'; }

  var panelObj = document.getElementById('gridsContainer') ;
  panelObj.classList.add(type) ;
   var crossStore = new Ext.data.SimpleStore(
    {
      fields:[]
    }
   ) ;
   var crossGrid =  new Ext.grid.GridPanel({
      title: title,
      id: type,
      height: ht,
      loadMask: true,
      frame: true,
      autoScroll: true,
      forceFit: true,
      store: crossStore,
      columns: [],
      renderTo: 'gridsContainer'
    });
   /** load mask */
   
   var searchMask = new Ext.LoadMask(Ext.getCmp(type),
            {
              msg:"Loading search results . . .",
              id: 'maskCrossTable'
            });
   searchMask.show();
   getCrossCollTransformation(type) ;  
}


/** Renders a grid by fetching the dynamic columns and store 
 * for a transformed grid (document transformed)
 * @param {string} gridId id of the grid that is to be rendered
 */
function renderAnalysisTransformationGrid(gridId)
{
  var panelObj = document.getElementById('gridsContainer') ;
  panelObj.classList.add(gridId) ;
  var gStore = new Ext.data.SimpleStore(
    {
      fields: []
    }
   ) ;
  var downloadMenu = getDownloadMenu(gridId) ;
  var wbMenu = getWorkbenchMenu(gridId) ;
  Ext.getCmp('dseq').hide() ;
  var toolBar = new Ext.Toolbar({
    cls: 'searchToolBar',
    items: [
      {
        text:'Back to Search Page',
        id: "backToSearch",
        tooltip: "Go back to the search page",
        iconCls: 'backSearch',
        handler: function()
        {
          var mount = ( window.location.toString().indexOf(urlMount) >= 0 ? urlMount : "" ) ;
          var jspMount = ( window.location.toString().indexOf(urlMount) >= 0 ? ("/java-bin" + urlMount) : "" ) ;
          if(publicVersion == 'true') { window.open("http://"+location.host+mount+"/index.rhtml") ; }
          else { window.open("http://"+location.host+jspMount+"/index.jsp") ; }
        }
      },
      {
        text: 'Download Samples',
        id: "downloadAll",
        iconCls: 'downloadAll',
        tooltip: 'Download Samples',
        menu: downloadMenu
      },
      {
        text: 'Go to Genboree Workbench',
        id: "gbWorkbench",
        iconCls: 'gbWorkbench',
        tooltip: 'Go to Genboree Workbench to activate a tool. <br>The user must be logged in to the Genboree Workbench for this feature to be active.',
        menu: wbMenu
      }
    ]
  });
  var selMode = getSelModel() ;
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
    autoScroll: true,
    store: gStore,
    selModel: selMode,
    title: 'Grid with RNA Profile of Biosamples',
    columns: [],
    features: [filters],
    tbar:  toolBar,
    renderTo: 'gridsContainer'
  }) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp(gridId),
        {
          msg:"Loading search results . . .",
          id: 'maskreadCountsTable'
        });
  searchMask.show();
}


/** generates, store, fields and columns for a tranformed output(json)
 * for a document transformation. There are a few customizations for 
 * document transformed grids in the atlas. Hence this function
 * is specific for such grids. For transforming a cross collection json 
 * @see getStoreForCrossColl()
 * @param {Object} output transformed output 
 * @param {string} gridid
 */ 
function getStoreFromOutput(output, gridid)
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
         val = "<br>"+output.Data[ii].data[jj].cell.value.toLocaleString() ;
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
         gridConfig.qcMetrics[bioname] = {} ;
         gridConfig.fastqDb[bioname] = {} ;
         data.push(['<a href="'+decodeURIComponent(redMinePrj)+'&coll=Biosamples&doc='+output.Data[ii].data[jj].name+'&docVersion=" target="_blank">'+output.Data[ii].data[jj].name+'</a>'+metadata, output.Data[ii].data[jj].name, val]);
       }
       else
       {
          data[jj].push(val);

       }
    }
  }
  var ercc = geterccCol(true) ;
  cols.push(ercc) ;
  var downcols = getDownloadCols(true);
  cols.push(downcols) ;
  var metCols = getMetCols(true) ;
  cols.push(metCols) ;
  var viewCols = getActionCols(true) ;
  cols.push(viewCols) ;
  gridConfig.transform = [fields, cols, data] ;
  getfastqAndDbForBiosamples(Object.keys(gridConfig.qcMetrics), true) ;
  qcMetricsForBiosamples(Object.keys(gridConfig.qcMetrics)) ;
  return [fields, cols, data] ;
}


function makeChartWindow()
{
  smallGridWindow = new Ext.Window({
    id: 'chartView',
    modal: true,
    stateful: false,
    width: 800,
    height: 610,
    bodyStyle: 'padding: 4px;',
    layout: 'border',
    html: '<div id="chartContainer"></div>'
  });
  smallGridWindow.show();
  smallGridWindow.center();
}

function makeHighChart(axis, data, label)
{


makeChartWindow() ;

$(function () {
    $('#chartContainer').highcharts({
        chart: {
            spacingTop:10,
            spacingRight:100,
            type: 'bar',
            height: 600
        },
        title: {
            text: 'RNA profile of the sample -' +label
        },
        xAxis: {
            categories: axis,
            labels : {
            step: 1,
            format: '<span style="color: black">{value}</span>'
           }
  
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of Reads',
                align: 'high'
            }
        },
        tooltip: {
            formatter: function() {
             return this.x + ': <b>' + this.y.toLocaleString() + '</b> reads';

    },
            valueSuffix: ' reads'
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Read Counts',
            data: data
       

           
        }]
    });
});
}

/**returns, store, field and columns from a cross collection output
 * @param {Object} transformed output
 * @param {string} gridid 
 */
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
         if(val){data.push([output.Data[ii].data[jj].name, '<b>'+output.Data[ii].data[jj].name+'</b>' , '<div class="popWindow" onclick=getBiosampleMetadata('+Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.docIds)+','+ Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.subjects)+',\''+escape(output.Data[ii].name)+'\',\''+escape(output.Data[ii].data[jj].name)+'\')>'+val+'</div>']); }
         else{data.push([output.Data[ii].data[jj].name, '<b>'+output.Data[ii].data[jj].name+'</b>', val]);}
       }
       else
       {
          if(val && 'metadata' in output.Data[ii].data[jj].cell){data[jj].push('<div class="popWindow" onclick=getBiosampleMetadata('+Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.docIds)+','+ Ext.JSON.encode(output.Data[ii].data[jj].cell.metadata.subjects)+',\''+escape(output.Data[ii].name)+'\',\''+escape(output.Data[ii].data[jj].name)+'\')>'+val+'</div>');}
          else {data[jj].push(val) ;}
       }
    }
  }
  return [fields, cols, data] ;

}

/**
 * Window that is popped after a cell is clicked in cross coll transformation table
 * @param {Array} docIds array of document identifiers
 * @param {Array} subjects array of subjects in the transformed output
 * @param {string} xvalue
 * @param {string} yvalue
 * @param {Object} bioMetObj object containing the metadata for each of the biosamples/subjects
 */
function popWindowForSubjects(docIds, subjects, xval, yval, bioMetObj)
{
  /** global */
  
  xvalue = unescape(xval) ;
  yvalue = unescape(yval) ;
  var windowstore = [];
  var count = 0
  // make store for the Window grid
  for(var ii=0; ii<docIds.length; ii++)
  {
    for(var jj=0; jj<subjects[ii].length; jj++)
    {
      var cellculture = bioMetObj[subjects[ii][jj]]['Cell Culture Source'].value ;
   
     if(subjects[ii][jj].match(/(DWONG)/g)){ result = "NA" ;}
     else if(gridConfig.qcMetrics[subjects[ii][jj]].Result == 'PASS') {result = "YES"; }
     else if(gridConfig.qcMetrics[subjects[ii][jj]].Result == 'FAIL') {result = "NO" ; }
     else { result = "NA"; }


      windowstore.push([docIds[ii], '<a href="'+decodeURIComponent(redMinePrj)+'&coll=Biosamples&doc='+subjects[ii][jj]+'&docVersion=" target="_blank">'+subjects[ii][jj]+'</a>', subjects[ii][jj], bioMetObj[subjects[ii][jj]]['Biosample Name'].value, bioMetObj[subjects[ii][jj]]['Anatomical Location'].value, bioMetObj[subjects[ii][jj]]['exRNA Source'].value, bioMetObj[subjects[ii][jj]]['Cell Culture Source'].value, result, gridConfig.qcMetrics[subjects[ii][jj]]['Reference Genome Reads'], gridConfig.qcMetrics[subjects[ii][jj]]['Transcriptome Genome Ratio'], gridConfig.qcMetrics[subjects[ii][jj]]['Transcriptome Reads'] ]) ;
      count++;
    }
  }
  var cellWindowStore = Ext.getCmp('cellGrid').store;
   
  cellWindowStore.loadData(windowstore) ;
  var title = Ext.getCmp('cellWindow').title ;
  Ext.getCmp('maskcellWindow').destroy() ;
  var parpath = unescape(xval)+'.'+unescape(yval) ;
  title = title + '<div class="metadata">' + parpath.replace(/\./g, "&nbsp;&raquo;&nbsp;") + '</div>' ;
  Ext.getCmp('cellWindow').setTitle(title) ;
}



/**
 * makes the pop up grid for each of the cell
 */
function makeCellWindow()
{
  var cellStore = new Ext.data.SimpleStore(
    {
      fields: 
      [
        { name : 'docId'},        
        { name : 'biosamplelink'},
        { name : 'biosample'},
        { name: 'bioname'},
        { name: 'location'},
        {name: 'source'},
        {name: 'cellculture'},
        {name: 'qcMetrics'},
        {name: 'refgenome'},
        {name: 'trgenome'},
        {name: 'trReads'}

      ]

    }) ;
   var downloadMenu = getDownloadMenu('cellGrid') ;
   var wbMenu = getWorkbenchMenu('cellGrid') ;
   Ext.getCmp('dseq').hide() ; /** hide the dseq tool menu for now. cannot fetch disease for fluidVsExp */
   var toolBar = new Ext.Toolbar({
    cls: 'searchToolBar',
    items: [
    {
      text:'Back to Search Page',
      id: "backToSearch",
      tooltip: "Go back to the search page",
      iconCls: 'backSearch',
      handler: function()
      {
        var mount = ( window.location.toString().indexOf(urlMount) >= 0 ? urlMount : "" ) ;
        var jspMount = ( window.location.toString().indexOf(urlMount) >= 0 ? ("/java-bin" + urlMount) : "" ) ;
        if(publicVersion == 'true') { window.open("http://"+location.host+mount+"/index.rhtml") ; }
        else { window.open("http://"+location.host+jspMount+"/index.jsp") ; }
      }
    },

    {
      text: 'Download Samples',
      id: "downloadAll",
      iconCls: 'downloadAll',
      tooltip: 'Download Samples',
      menu: downloadMenu
    },
    {
      text: 'Go to Genboree Workbench',
      id: "gbWorkbench",
      iconCls: 'gbWorkbench',
      tooltip: 'Go to Genboree Workbench to activate a tool. <br>The user must be logged in to the Genboree Workbench for this feature to be active.',
      menu: wbMenu
    }]
   });
  var selMode = getSelModel() ;
  var filters = {
    ftype: 'filters',
    local: true,
    } ;

  /** make the cols from the generic function */
  var textcols = getCommonTextCols() ;
  var cols = [
    textcols[0],
    textcols[2],
    textcols[4],
    textcols[5]
  ];
  cols.push(geterccCol()) ;
    cols.push(getDownloadCols()) ;
    cols.push(getMetCols()) ;
    cols.push(getActionCols()) ;
    cols.push(
    {
      text: '<span class="gridcol-header">Biosample Metadata Accession</span>',
      tooltip: "<b>Biosample Accession ID</b><br> Click to view the Biosample metadata document in GenboreeKB UI.<br> <span class='gb-tip-footnote'>(Click arrow on the right to sort and filter this column.)</span>",
      dataIndex: 'biosamplelink',
      minWidth: 200,
      flex:1,
      filterable: true,
      sortable: true
    }) ;
  /** panel for the cell, with metadata about biosamples in the cell */
  var cellGrid = new Ext.grid.GridPanel(
    {
      id: 'cellGrid',
      forceFit: true ,
      useArrows: true,
      autoScroll: true,
      store: cellStore,
      selModel: selMode,
      stripeRows: true,
      tbar: toolBar,
      features : [filters],
      columns: cols,
    }) ;


  title = 'Metadata about Biosamples:<br>';
  /** create and show the window. */
  var popWin = Ext.create('Ext.window.Window', {
    height: 500,
    width: 1000,
    padding: "0px 0px 0px 0px",
    title: title,
    modal: true,
    id: 'cellWindow',
    layout: 'fit',
    items:[cellGrid]
  });
  popWin.show();
  popWin.center() ;
  var searchMask = new Ext.LoadMask(Ext.getCmp('cellWindow'),
            {
              msg:"Loading search results . . .",
              id: 'maskcellWindow'
            });
  searchMask.show();

}

/** Gets the download menu items
 * @param {string} gridId grid component id for which the menu items are generated
 * @return {Object} downloadMenu
 */
function getDownloadMenu(gridId)
{
 var downloadMenu = new Ext.menu.Menu({
    id: 'evDocMenu',
    items: [
      {
        text: 'Download Core Result Files',
        id: "DownloadCore",
        tip: "Download the core files for the selected samples",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else {
             selectedSamples = [] ;
             for (var ss=0; ss<selections.length; ss++) {
                selectedSamples.push(selections[ss].data.biosample) ;
              }
            // check for data access
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId, obj.id]) ;
            }
            else {
              getResultUrlsForBiosamples(selectedSamples, true, false, gridId, obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Result Files',
        id: "DownloadRawResult",
        tip: "Download raw result files for the selected samples",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              getResultUrlsForBiosamples(selectedSamples, false, false, gridId, obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Raw Data Files',
        id: "DownloadRawData",
        tip: "Download raw data files for the selected samples",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              downloadFastqUrlsForBiosamples(selectedSamples, gridId, obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Metadata',
        id: 'DownloadMetadata',
        tip: 'Download all the metadata - Biosample, Experiment and Donor data for a selected sample',
        iconCls: 'downloadAll',
        handler: function(obj)
        {

          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections && selections.length >1 ) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "Select a single sample to download all the three metadata documents") ;}
          else {
            var searchMask = new Ext.LoadMask(Ext.getCmp(gridId),
            {
              msg:"Getting files . . .",
              id: 'maskdownload'
            });
            searchMask.show() ;
            selectedSamples = [] ;
            if(askDataAccess == false ){askForDataAccess(obj.id, [selections[0].data.biosample, gridId]) ;  }
            else {
              metadata = new Object() ;  
              var biosample = selections[0].data.biosample ;
              getDoc('Biosamples', 'Biosample', biosample, true) ;
              getDonorOrExp(biosample, null, true) ;
              trackData(obj.id, gridId, 0) ;
            }
          }
        }
    }]
   }) ;
  return downloadMenu ;
}

/** method to pop a window showing links to external databases
 * @param {Array} dbStore store data
 */
function showExtDataLinkWin(dbStore)
{
  /** destroy any pre-opened windows */
  var allWindows = Ext.ComponentQuery.query('window[id="dbWindow"]') ;
  for(ii=0; ii< allWindows.length; ii++)
  {
     allWindows[ii].destroy() ;
   }
  var dataLinkStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'accession'},
        { name : 'dbname'},
        { name : 'dburl'},
        { name: 'fastq'}
      ],
      data : dbStore
    }) ;

    var dbGrid = new Ext.grid.GridPanel(
    {
      id: 'dbGrid',
      forceFit: true ,
      useArrows: true,
      autoScroll: true,
      store: dataLinkStore,
      stripeRows: true,
      columns:
      [
       {
          text: 'Accession',
          tip: "<b>Accession</b><br>Accession ID of the Database. <br>",
          dataIndex: 'accession',
          minWidth: 100,
          flex:1,
          sortable: true
        },
        {
          text: 'Database Name',
          tip: "<b>Database Name</b>",
          dataIndex: 'dbname',
          minWidth: 100,
          flex:1,
          sortable: true
        }
       ]
    }) ;
    title = 'Links to External Databases' ;
  
  var popWin = Ext.create('Ext.window.Window', {
    height: 250,
    width: 300,
    padding: "0px 0px 0px 0px",
    title: title,
    id: 'dbWindow',
    modal: true,
    layout: 'fit',
    items:[dbGrid]
  });
  popWin.show();
  popWin.center() ;

}


function showAntDataWin() 
{
  var allWindows = Ext.ComponentQuery.query('window[id="dbWindow"]') ;
  for(ii=0; ii< allWindows.length; ii++)
   {
     allWindows[ii].destroy() ;
   }
  var popWin = Ext.create('Ext.window.Window', {
    height: 150,
    width: 400,
    title: 'Restricted Data as per ERCC Data Sharing Policy',
    padding: "0px 0px 0px 0px",
    id: 'dbWindow',
    layout: 'fit',
    modal: true,
    html: '<div class="embargo" align="left">This data is restricted access and is currently under the protected period (embargo). The embargo on this dataset ends on 07/01/2016. <br>Please refer to the <a href=\"http://exrna.org/resources/data/data-access-policy\" target=\"_blank\">ERCC Data Sharing Policy document<a> for more details.'
  });
  popWin.show();
  popWin.center() ;

}

/** Qc metric window.
 * @param {Array} qcData is the grid store data
 */
function showQcWindow(qcData) 
{
 var allWindows = Ext.ComponentQuery.query('window[id="qcWindow"]') ;
  for(ii=0; ii< allWindows.length; ii++){allWindows[ii].destroy() ;}
   var qcStore = new Ext.data.SimpleStore(
    {
      fields:
      [
        { name : 'property'},
        { name : 'value'}
      ],
      data : qcData
    }) ;

    var qcGrid = new Ext.grid.GridPanel(
    {
      id: 'qcGrid',
      forceFit: true ,
      useArrows: true,
      autoScroll: true,
      store: qcStore,
      stripeRows: true,
      columns:
      [
       {
          text: 'Property',
          dataIndex: 'property',
          minWidth: 200,
          flex:1,
          sortable: true
        },
        {
          text: 'Value',
          dataIndex: 'value',
          minWidth: 100,
          flex:1,
          sortable: true
        }
      ]
     }) ;
  var popWin = Ext.create('Ext.window.Window', {
    height: 160,
    width: 350,
    title: 'QC Metrics<br> <a href=\"http://exrna.org/resources/data/data-quality-control-standards/\" target=\"_blank\"><font class=\"metrics-header\"> View ERC Consortium QC Standards</font></a>',
    padding: "0px 0px 0px 0px",
    id: 'qcWindow',
    layout: 'fit',
    modal: true,
    items: [qcGrid]
  });
  popWin.show();
  popWin.center() ;

}

/** action column config
 * @param {Boolean} down
 */
function getActionCols(down)
{
  var actcols =   {
    xtype: 'actioncolumn',
    header: 'Actions',
    tooltip: '<b>Actions</b><br>Click the barchart or download icons',
    flex: 1,
    minWidth: 120,
    sortable: false,
    align: 'center',
    items: [
    {
      icon: '/images/silk/chart_bar.png',
      tooltip: 'View a histogram of reads mapped to various libraries.',
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
        var docId = rec.get('docId') ;
        // this is specific for readcounts table
        if(!(docId)) {docId = anDoc ;}
        getReadCounts(docId, biosample) ;
      },
      getClass: function(v, meta, rec)
      {
        if(down) return 'icon_down'
      }
    },
    {
      icon: '/images/silk/application_link.png',
      tooltip: 'View links to external databases like SRA, dbGaP, GEO, etc. if the data is available in a public domain archive or view the data access policy if the data is in the protected period (embargo).',
      handler: function(grid, rowIndex, colIndex) {
      var rec = grid.getStore().getAt(rowIndex);
      var biosample = rec.get('biosample') ;
      getDataRepositoryLink(biosample, null) ;
      },
      getClass: function(v, meta, rec)
      {
        if(down) return 'x-action-col-icon'
      }
    },
    {
      icon: '/images/silk/book_open.png',
      tooltip: 'View PubMed references.',
      handler: function(grid, rowIndex, colIndex) {
      var rec = grid.getStore().getAt(rowIndex);
      var biosample = rec.get('biosample') ;
      getDataRepositoryLink(biosample, true) ;
      },
      getClass: function(v, meta, rec)
      {
        if(down) return 'x-action-col-icon'
      }
    }
  ]} ;
  return actcols ;
}

/** 
 * Data download config
 */
function getDownloadCols(down)
{
  var downcols =   {
    xtype: 'actioncolumn',
    header: 'Download Data',
    sortable : false,
    tooltip: '<b>Download</b><br>Download Data',
    flex: 1,
    minWidth: 120,
    align: 'center',
    items: [{
      icon: '/images/download.png',
      tooltip: 'Download the processed core results archive for that biosample, with mapped read counts for various RNA types',
      handler: function(grid, rowIndex, colIndex) {
      var rec = grid.getStore().getAt(rowIndex);
      var biosample = rec.get('biosample') ;
      if(askDataAccess == false ){
        askForDataAccess('singledownload', [biosample, rec]) ;
      }
      else
      {
        getResultUrlForBiosample(biosample, rec) ;
      }
      },
      getClass: function(v, meta, rec)
      {
        if(down){return 'icon_down' ;}
      }
    },
    {
      align: 'center',
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
        if(gridConfig.fastqDb[biosample].show == true)
        {
          if(askDataAccess == false){
            askForDataAccess('singlefastq', [biosample, rec]);
          }
          else{        
            var fileUrl = gridConfig.fastqDb[biosample].fastq ;
            var res =  fileUrl.match(/^ftp/) ? true : false
            if(res == true) {
              window.location = fileUrl ;
     
            }
            else
            {
	      if(gbKey){ window.location = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true';}
              else {window.location = fileUrl+'/data?&downloadAsFile=true'}
            }
           groupSelectionsForGAUsingStoreRec("DownloadRawData", rec) ; 
          }
        }

      },
      getClass: function(v, meta, rec)
      {
       var val ;
       var dbnames =  [] ;
       var biosample = rec.data.biosample ;
       dbnames = gridConfig.fastqDb[biosample].dbnames ;
       var show = false ;
         for(var ii=0; ii<dbnames.length; ii++)
         {
           if(dbnames[ii] == 'SRA' || dbnames[ii] == 'GEO')
           {
             show = true ;
             break
           }
         }
       if(show == true) { 
         gridConfig.fastqDb[biosample].show = true ;
         if(down) {val = 'fastq_down' ;} else{val = 'fastq' ;}
       }
       else { 
         gridConfig.fastqDb[biosample].show = false ;
         if(down){
           if(dbnames.length > 0 && dbnames[0] == 'Embargo') {val = 'fastq_embargo_down' ;} else {val = 'fastq_dbGap_down' ;} 
         }
         else{
           if(dbnames.length > 0 && dbnames[0] == 'Embargo') {val = 'fastq_embargo' ;} else {val = 'fastq_dbGaP' ;} 
         }
       }
       return val ;
       },
       getTip: function(v, meta, rec) {

         var val ;
         var dbnames =  [] ;
         var biosample = rec.data.biosample ;
         dbnames = gridConfig.fastqDb[biosample].dbnames ;
         var show = false ;
         for(var ii=0; ii<dbnames.length; ii++)
         {
           if(dbnames[ii] == 'SRA' || dbnames[ii] == 'GEO')
           {
             show = true ;
             break
           }
         }
         if(show == true) {
           return 'Download FASTQ file for the sample';
         }
         else {
           if(dbnames.length > 0 && dbnames[0] == 'Embargo'){
             return 'This data is restricted access and is currently under the protected period (embargo). The embargo on this dataset ends on 07/01/2016.';
           }
           else {
             return 'This data is deposited in the controlled access dbGaP archive. <br> Click the <i> Link to external databases </i> icon under the Actions column to view the dbGaP Study Id and contact the PI through dbGaP to get access to the raw FASTQ data files.'
           }
        }
      }
    }
   ]
  };
  return downcols ;
}

/**
 * Col config for download metadata column.
 * Used by three grids,
 * @param {Boolean} down indicator to use a differnt css to center individual icons
 * @param {string} gridId grid id of the main searchGrid
 */
function getMetCols(down)
{
  var metCols = {
          xtype: 'actioncolumn',
          header: 'Download Metadata',
          tooltip: '<b>Metadata Links</b><br> Download Biosample, Experiment and Donor documents',
          minWidth: 120,
          sortable: false,
          align: 'center',
          items: [
          {
            icon: ( urlMount + '/images/science-chemistry-icon.png' ),
            tooltip: 'Download the biosample metadata document.',
            align: 'center',
            handler: function(grid, rowIndex, colIndex) {
              var rec = grid.getStore().getAt(rowIndex);
              var biosample = rec.get('biosample') ;

              if(askDataAccess == false ){
                askForDataAccess('biodoc', ['Biosamples', 'Biosample', biosample, rec]) ;
              }
              else
              {
                getDoc('Biosamples', 'Biosample', biosample) ;
                groupSelectionsForGAUsingStoreRec("DownloadMeta", rec)
              }
            },
            getClass: function(v, meta, rec)
            {
              // need styling to center the image icon
              if(down){return 'icon_down' ;}
            }
          },
          {
            icon: ( urlMount + '/images/Body-DNA-icon.png' ),
            tooltip: 'Download the experiment metadata document.',
            handler: function(grid, rowIndex, colIndex) {
              var rec = grid.getStore().getAt(rowIndex);
              var biosample = rec.get('biosample') ;
              if(askDataAccess == false ){
                askForDataAccess('expdoc', [biosample, 'Experiment', rec]) ;
              }
              else
              {
                 getDonorOrExp(biosample, 'Experiment') ;
                 groupSelectionsForGAUsingStoreRec("DownloadMeta", rec) ;
              }
            },
            getClass: function(v, meta, rec)
            {
              if(down){return 'icon_down' ;}
            }
         },
         {
           icon: '/images/silk/user.png',
           tooltip: 'Download the donor metadata document.',
           handler: function(grid, rowIndex, colIndex) {
              var rec = grid.getStore().getAt(rowIndex);
              var biosample = rec.get('biosample') ;
              if(askDataAccess == false ){
                askForDataAccess('donordoc', [biosample, 'Donor', rec]) ;
              }
              else
              {
                 getDonorOrExp(biosample, 'Donor') ;
                 groupSelectionsForGAUsingStoreRec("DownloadMeta", rec) ;
              }
            },
            getClass: function(v, meta, rec)
            {
              if(down){return 'icon_down' ;}
            }
         }]};
  return metCols ;

}

/**
 * col config for the ercc standards column
 */
function geterccCol(down)
{
     
  var ercc = {
   text: '<span class="gridcol-header">ERCC Quality Standards</span>',
   flex:2,
   sortable: false,
   columns: [
   {
     text: '<span class="ercc_subheader">Meets Standards?</span>',
     sortable: true,
     filterable : true,
     dataIndex:'qcMetrics',
     renderer : function(val) {
                    if (val == "YES") {
                        return '<span style="color:' + '#73b51e' + ';">'+val+'</span>';
                    } else if (val == "NO") {
                        return '<span style="color:' + '#cf4c35' + ';">'+val+'</span>';
                    } // NA
                    else {return '<span style="color:' + '#4169E1' + ';">'+val+'</span>';}
                }

   },
   {
     text: '<span class="ercc_subheader">Reference Genome Reads</span>',
     dataIndex: 'refgenome',
     filter : {type: 'numeric'},
     renderer: function(val)
     {
       return val.toLocaleString() ;
     }
  
   },
   {
     text: '<span class="ercc_subheader">Transcriptome Genome Ratio</span>',
     dataIndex: 'trgenome',
     filter : {type: 'numeric'}
   },
   {
     text: '<span class="ercc_subheader">Transcriptome Reads</span>',
     dataIndex: 'trReads',
     filter:{type: 'numeric'},
     renderer: function(val)
     {
       return val.toLocaleString() ;
     }
   }
   ]
  } ;

  return ercc

}

/** renders the analysis transformation grid - the read counts
 * after getting the metrics and information about the fastq urls
 * @param {string} gridId
 * @param {string} maskId
 */
function renderGrid(gridId, maskId)
{
  var anStore = Ext.getCmp(gridId).store ;
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
  if('qcMetrics' in gridConfig)
  {
    var qcfields = ['qcMetrics', 'refgenome', 'trgenome', 'trReads'] ;
    for(var ff=0; ff<qcfields.length; ff++) {
      fields.add(Ext.create("Ext.data.Field", {name: qcfields[ff]}));
    }
    //cols already added 
    //
    for(var ii=0; ii<data.length; ii++)
    
    {
       // hacking DWONG samples must go!!!!
      if(data[ii][1].match(/(DWONG)/g)){ data[ii].push("NA") ;}
      else if(gridConfig.qcMetrics[data[ii][1]].Result == 'PASS') {data[ii].push("YES") ; }
      else if(gridConfig.qcMetrics[data[ii][1]].Result == 'FAIL') {data[ii].push("NO") ; }
      else { data[ii].push("NA") ; }

      data[ii].push(gridConfig.qcMetrics[data[ii][1]]['Reference Genome Reads']) ;
      data[ii].push(gridConfig.qcMetrics[data[ii][1]]['Transcriptome Genome Ratio']) ;
      data[ii].push(gridConfig.qcMetrics[data[ii][1]]['Transcriptome Reads']) ;
    } 
  }
  Ext.getCmp(gridId).reconfigure(null, cols) 
  anStore.loadData(data) ;
  Ext.getCmp(maskId).hide() ;
}

/**Asks for data access.
 * If policy is agreed then do the traced function
 * @param {string} eventId identifiers for each of the associated tasks
 * @param {Array} opts optional arguments associated with each task
 */
function askForDataAccess(eventId, opts)
{

  var content = "<div class=\"policy\"><h3>Common Fund exRNA Communication Consortium (ERCC) Data Sharing and Access Policy</h3>" ;
  content += "<p><b>Revised December, 2015</b></p>" ;
  content += "<p><b>The ERCC.</b> The ERCC is a community resource project designed to catalyze exRNA research activities in the scientific community.  Thus, data are shared with the scientific community PRIOR to publication.  In pre-publication data sharing, the desire to share data widely with the scientific community must be balanced with the desire for the data generators to have a protected period of time to analyze and publish the data they have produced.</p>" ;
  content += "<p><b>ERCC Data Sharing Policy.</b>  The following policy has been developed to address this balance.  <b>By accessing pre-publication ERCC data, users agree to adhere to these policies and to follow appropriate scientific etiquette regarding collaboration, publication, and authorship.</b></p>" ;
  content += "<p>The entity responsible for ERCC data deposition is the ERCC Data Management and Resource Repository (DMRR).  All data are date stamped by the DMRR upon receipt from the data producers.  The DMRR processes all ERCC data through consortium-approved analysis pipelines to ensure that the data are processed in a uniform fashion.<b></b><br />ERCC Pre-publication Data Sharing.</b><b></b>Users of the pre-publication ERCC data agree to a protected period (embargo) of 12 months AFTER the DMRR date stamp.</b></p>" ;
  content += "By requesting and accepting any released ERCC dataset, the user:<ul><li>Agrees to comply with this pre-publication data sharing policy</li>" ;
  content += "<li>May access and analyze ERCC data</li><li>May NOT submit any analyses or conclusions for publication or scientific meeting presentation until the 12 month embargo period for that dataset has ended, or the data generator has published a manuscript on the data, whichever comes first</li><li>Takes full responsibility for adhering to a 12 month embargo period and is responsible for being aware of the publication status of the data they use</li><li>Agrees to cite ERCC data appropriately in meeting presentations and publications</li></ul>" ;
  content += "<p>Researchers wishing to publish on datasets prior to the expiration of the embargo should discuss their plans with the data generator(s) and must <ins>obtain their consent</ins> prior to using the unpublished data in their individual publications or grant submissions.</p>" ;
  content += "<p>Following expiration of the embargo period, any investigator may submit manuscripts or make presentations without restriction, including integrated analyses using multiple unrestricted datasets.</p><p><b></b>Proper Citation of the Datasets Used.</b> Researchers who use ERCC datasets in oral presentations or publications are expected to cite the Consortium in all of the following ways:</p>";
  content += "<ul><li>Cite the ERCC overview publication [The NIH Extracellular RNA Communication Consortium. <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/?term=PMID%3A+26320938\" target=\"_blank\">J Extracell Vesicles.</a> 2015 Aug 28;4:27493. doi: 10.3402/jev.v4.27493. eCollection 2015. (PMID: 26320938)</li><li>Reference the <a href=\"http://www.exrna.org\" target=\"_blank\">www.exrna.org</a> website and/or GEO accession numbers of the datasets </li><li>Acknowledge the NIH Common Fund, ERCC and the ERCC data producer that generated the dataset(s)</li>	</ul>" ;
  content += "<p><b></b>Data Quality Metrics.</b>  The consortium is still in the process of developing consensus data quality metrics for different assay types so that data users will have a sense of the relative quality of a given data set.  We encourage the scientific community to use these pre-publication datasets, however users should be aware that final determinations concerning the quality of a given dataset might not become clear until the consortium performs an integrative analysis of all the data produced by the ERCC.</p>" ;
  content += "<p><b></b>Unrestricted-Access and Controlled-Access Datasets.</b>  The ERCC will generate both unrestricted-access (e.g. GEO) and controlled-access datasets (e.g. dbGaP).  Currently only unrestricted-access datasets are available.  Once controlled-access ERCC datasets become available, we will update this link and describe in more detail how they can be accessed through dbGaP (<a href=\"http://www.ncbi.nlm.nih.gov/gap\" target=\"_blank\">http://www.ncbi.nlm.nih.gov/gap</a>).</p>" ;
  content +="<p><b></b>Questions?</b> Please contact Sai Lakshmi Subramanian <a href=\"mailto:sailakshmi.subramanian@bcm.edu\">sailakshmi.subramanian@bcm.edu</a></p>" ;
  content +="<p>The full data deposition, sharing, and publication policy is available <a href=\"http://exrna.org/resources/data/data-access-policy\" target=\"_blank\">here</a>.</p>" ;
  Ext.Msg.show({
    cls: 'myWindowCls',
    id: 'datapolicy',
    title : 'ERCC Data Sharing and Access Policy',
    msg : content,
    width : 600,
    height : 500,
    buttons : Ext.Msg.OK,
    buttonText :
    {
      ok : 'Agree'
    },
    multiline : false,
    fn : function(buttonValue, inputText, showConfig){
     if(buttonValue == 'ok'){
       askDataAccess = true ;
       if(eventId == 'DownloadCore')
       {
          /**
           * opts - list of arguments
           * 1. list of biosamples
           * 2. GridId of origin
           * 3. Google Analytics event id
           */
          getResultUrlsForBiosamples(opts[0], true, false, opts[1], eventId) ;
       }
       else if(eventId == 'DownloadRawResult')
       {
         getResultUrlsForBiosamples(opts[0], false, false, opts[1], eventId) ;
       }
       else if(eventId == 'singledownload')
       {
         getResultUrlForBiosample(opts[0], opts[1]) ;
       }
       else if(eventId == 'DownloadRawData')
       {
         downloadFastqUrlsForBiosamples(opts[0], opts[1], eventId) ;
       }
       else if(eventId == 'biodoc')
       {
          getDoc(opts[0], opts[1], opts[2]) ;
          groupSelectionsForGAUsingStoreRec("DownloadMeta", opts[3]) ;
          
       }
       else if(eventId == 'expdoc')
       {
         getDonorOrExp(opts[0], opts[1]) ;
         groupSelectionsForGAUsingStoreRec("DownloadMeta", opts[2]) ;
       }
       else if(eventId == 'donordoc')
       {
         getDonorOrExp(opts[0], opts[1]) ;
         groupSelectionsForGAUsingStoreRec("DownloadMeta", opts[2]) ;
       }
       else if(eventId == 'singlefastq')
       {
         var fileUrl = gridConfig.fastqDb[opts[0]].fastq ;
         var res =  fileUrl.match(/^ftp/) ? true : false
         if(res == true) {
           window.location = fileUrl ;
         }
         else
         {
           if(gbKey){ window.location = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true';}
           else {window.location = fileUrl+'/data?&downloadAsFile=true'}
         }
         groupSelectionsForGAUsingStoreRec("DownloadRawData", opts[1]) ;
       }
       else if(eventId == 'DownloadMetadata')
       {
         metadata = new Object() ;
         var biosample = opts[0] ;
         getDoc('Biosamples', 'Biosample', biosample, true) ;
         getDonorOrExp(biosample, null, true) ;
         trackData('DownloadMetadata', opts[1], 0) ;
       }
     }
    }    
  });
}


function getDatapolicy()
{
  var datapolicy ;
  var datapolicy = "##########################################################################################################\n" ;
   datapolicy += "##### ERC Consortium Data Access Policy #################\n" ;
   datapolicy += "##########################################################################################################\n"
   datapolicy += "# You are downloading the datasets from the exRNA Atlas by accepting this data access policy:\n";
   datapolicy += "# Common Fund exRNA Communication Consortium (ERCC) Data Sharing and Access Policy\n" ;
   datapolicy += "#\n";
   datapolicy += "# Revised December, 2015\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# The ERCC. The ERCC is a community resource project designed to catalyze exRNA research activities in the scientific community. Thus, data are shared with the scientific community PRIOR to publication. In pre-publication data sharing, the desire to share data widely with the scientific community must be balanced with the desire for the data generators to have a protected period of time to analyze and publish the data they have produced.\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# ERCC Data Sharing Policy. The following policy has been developed to address this balance. By accessing pre-publication ERCC data, users agree to adhere to these policies and to follow appropriate scientific etiquette regarding collaboration, publication, and authorship.\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# The entity responsible for ERCC data deposition is the ERCC Data Management and Resource Repository (DMRR). All data are date stamped by the DMRR upon receipt from the data producers. The DMRR processes all ERCC data through consortium-approved analysis pipelines to ensure that the data are processed in a uniform fashion. \n";
   datapolicy += "# ERCC Pre-publication Data Sharing.Users of the pre-publication ERCC data agree to a protected period (embargo) of 12 months AFTER the DMRR date stamp.\n" ;
   datapolicy += "# By requesting and accepting any released ERCC dataset, the user:\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# - Agrees to comply with this pre-publication data sharing policy\n" ;
   datapolicy += "# - May access and analyze ERCC data\n" ;
   datapolicy += "# - May NOT submit any analyses or conclusions for publication or scientific meeting presentation until the 12 month embargo period for that dataset has ended, or the data generator has published a manuscript on the data, whichever comes first\n" ;
   datapolicy += "# - Takes full responsibility for adhering to a 12 month embargo period and is responsible for being aware of the publication status of the data they use \n";
   datapolicy += "# - Agrees to cite ERCC data appropriately in meeting presentations and publications\n";
   datapolicy += "#\n";
   datapolicy += "# Researchers wishing to publish on datasets prior to the expiration of the embargo should discuss their plans with the data generator(s) and must obtain their consent prior to using the unpublished data in their individual publications or grant submissions.\n";
   datapolicy += "#\n";
   datapolicy += "# Following expiration of the embargo period, any investigator may submit manuscripts or make presentations without restriction, including integrated analyses using multiple unrestricted datasets.\n";
   datapolicy += "#\n";
   datapolicy += "# Proper Citation of the Datasets Used. Researchers who use ERCC datasets in oral presentations or publications are expected to cite the Consortium in all of the following ways:\n";
   datapolicy += "#\n";
   datapolicy += "# - Cite the ERCC overview publication [The NIH Extracellular RNA Communication Consortium. J Extracell Vesicles. 2015 Aug 28;4:27493. doi: 10.3402/jev.v4.27493. eCollection 2015. (PMID: 26320938)\n";
   datapolicy += "# - Reference the www.exrna.org website and/or GEO accession numbers of the datasets\n";
   datapolicy += "# - Acknowledge the NIH Common Fund, ERCC and the ERCC data producer that generated the dataset(s)\n";
   datapolicy += "#\n";
   datapolicy += "# Data Quality Metrics. The consortium is still in the process of developing consensus data quality metrics for different assay types so that data users will have a sense of the relative quality of a given data set. We encourage the scientific community to use these pre-publication datasets, however users should be aware that final determinations concerning the quality of a given dataset might not become clear until the consortium performs an integrative analysis of all the data produced by the ERCC.\n";
   datapolicy += "#\n";
   datapolicy += "# Unrestricted-Access and Controlled-Access Datasets. The ERCC will generate both unrestricted-access (e.g. GEO) and controlled-access datasets (e.g. dbGaP). Currently only unrestricted-access datasets are available. Once controlled-access ERCC datasets become available, we will update this link and describe in more detail how they can be accessed through dbGaP (http://www.ncbi.nlm.nih.gov/gap).\n";
   datapolicy += "#\n";
   datapolicy += "# Questions? Please contact Sai Lakshmi Subramanian sailakshmi.subramanian@bcm.edu\n";
   datapolicy += "#\n";
   datapolicy += "# The full data deposition, sharing, and publication policy is available at http://exrna.org/resources/data/data-access-policy.\n";
   datapolicy += "#\n";
   datapolicy += "##########################################################################################################\n";
   datapolicy += "#### INSTRUCTIONS TO DOWNLOAD THE DATASET ###########\n";
   datapolicy += "##########################################################################################################\n";
   datapolicy += "# This tab-delimitted file contains the list of URLs for batch downloading the processed result files. \n#The first column in this file contains the name of the file and the second column has the URL to download the actual processed result file for each sample. There are 2 ways to download these files:\n#\n" ;
   datapolicy += "# 1. You can copy and paste each URL in your browser and hit Enter to download each file in this list.\n" ;
   datapolicy += "# 2. (For more Advanced users) You can use a command line program like wget to download these files.\n"
   datapolicy += "# wget -O {FILE NAME in Column 1} {URL in Column 2}" ;
   datapolicy += "#\n" ;
   datapolicy += "# or \n" ;
   datapolicy += "# curl --output {FILE NAME in Column 1} {URL in Column 2}\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# Replace {FILE NAME in Column 1} with the actual file name in Column 1\n" ;
   datapolicy += "# and replace {URL in Column 2} with the actual URL in column 2.\n" ;
   datapolicy += "#\n" ;
   datapolicy += "# Please refer to this \"Download Help\": http://genboree.org/theCommons/projects/exrna-mads/wiki/Downloading_Datasets_from_the_exRNA_Atlas for more details.\n" ;


  return datapolicy ;
}

/**
 * Make a file for result and core files
 * @param {Boolean} core download core files or not
 */
function makedownloadFile(core, gridId, gaEvId)
{
  var filecontent = '' ;
  var datapol =  getDatapolicy() ;
  var downloadableUrls = [];
  var downloadablebiosamples = new Object() ;
  filecontent += datapol ;
  for(var ff=0; ff<fileUrls.length; ff++)
  {
    /** Filter dbGap */
    if(fileUrls[ff] != 'dbGaP')
    {
      var filename = fileUrls[ff].split("/").pop() ;
      var res =  fileUrls[ff].match(/^ftp/) ? true : false
      if(res == false) {
        var newUrl = fileUrls[ff].replace("\/file\/", "/fileData/") ;
      }
      else {
        var newUrl = fileUrls[ff] ;
      }
      filecontent = filecontent+filename+"\t"+newUrl+"\n" ;
      downloadableUrls.push(newUrl) ;     
      downloadablebiosamples[fileUrlsToBiosamples[fileUrls[ff]]] = true ; 
    }
  }
  /** 
   * Send the urls to a browser as a file
   * Make a file only if there are files to download
   */
  if(downloadableUrls.length > 0){
    groupSelectionsForGA(gridId, gaEvId, downloadablebiosamples) ;
    if(core == true) {var filename = 'CoreResults' ;}
    else {var filename = 'AllResults' ;}
    var str = Date() ;
    var filestr = str.replace(/ /g,'-') ;
    filename += filestr ;
    var uri = 'data:text/tsv;charset=utf-8,' + encodeURIComponent(filecontent);
    var link = document.createElement("a");
    link.href = uri;
    link.style = "visibility:hidden";
    link.download = filename + ".tsv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Ext.getCmp('maskdownload').destroy();
  }
  else{
    Ext.getCmp('maskdownload').destroy();
    Ext.Msg.alert("FILES_CONTROLLED_ACCESS", "All the raw data files are in a controlled access archive like dbGaP. You can only download the core results files for the selected samples. " ) ;
  }  
}


/** 
 * Compose all the file urls and file names
 * for a list of biosamples. Specific for fastq files
 * @param {Array} array of biosample identifiers
 * @param {string} gridId id of the main grid
 * @param {string} gaEvId google analytics event tracker id
 */
function downloadFastqUrlsForBiosamples(biosamples, gridId, gaEvId)
{
  if (Ext.getCmp('searchGrid')) {var searchGrid = 'searchGrid' ;}
  else if (Ext.getCmp('readCounts')) {var searchGrid = 'readCounts' ;}
  else if (Ext.getCmp('cellWindow')) {var searchGrid = 'cellWindow' ;}
  else {searchGrid = "gridsContainer" ;}
 
  var searchMask = new Ext.LoadMask(Ext.getCmp(searchGrid),
    {
      msg:"Downloading result files . . .",
      id: 'maskdownload'
    });
  searchMask.show();

  var filecontent = '' ;
  var downloadableUrls = [];
  var datapol =  getDatapolicy() ;
  filecontent += datapol ;
  /** biosamples that are actually downloadable */
  var downloadableBiosamples = new Object ;
  for(var ff=0; ff<biosamples.length; ff++)
  {
    var fileUrl = gridConfig.fastqDb[biosamples[ff]].fastq ;
    /** If the biosample has a fastq and is downloadable (not within embargo and has a db of SRA or GEO) */
    if(fileUrl && gridConfig.fastqDb[biosamples[ff]].show == true){
      var filename = fileUrl.split("/").pop() ;
      var res =  fileUrl.match(/^ftp/) ? true : false
      if(res == false) {
        var newUrl = fileUrl.replace("\/file\/", "/fileData/") ;
      }
      else {
        var newUrl = fileUrl;
      }
      filecontent = filecontent+filename+"\t"+newUrl+"\n" ;
      downloadableUrls.push(newUrl) ;
      downloadableBiosamples[biosamples[ff]] = true ;
    } 
  }
  /** Make a file only if there are files to download */
  if(downloadableUrls.length > 0){
    /** fire GA event */
    groupSelectionsForGA(gridId, gaEvId, downloadableBiosamples) ;
    /** make the downloadable file */
    var filename = "AllFastq" ;
    var str = Date() ;
    var filestr = str.replace(/ /g,'-') ;
    filename += filestr ;
    var uri = 'data:text/tsv;charset=utf-8,' + encodeURIComponent(filecontent);
    var link = document.createElement("a");
    link.href = uri;
    link.style = "visibility:hidden";
    link.download = filename + ".tsv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Ext.getCmp('maskdownload').destroy();
  }
  else{
    var message = '';
    message = "The selected samples are either: <br>- in embargo period or <br>- in dbGaP or <br>- a combination of datasets in controlled access dbGaP archive and also in the embargo period. <br><br>The embargo on those samples ends on 07/01/2016. <br>For samples in dbGaP, click the Links to External Databases icon under the Actions column to view the dbGaP Study Id and contact the PI through dbGaP to get access to the raw FASTQ data files. "              
    Ext.getCmp('maskdownload').destroy();
    Ext.Msg.alert("FILES_RESTRICTED_ACCESS", message ) ;
  }
}

/**
 * This method tracks various tasks, such as download, or getting files from Runs collection, etc
 * by polling respective data. 
 * @param {string} trackId - id specific to the tracking task
 * @param {Array} opts - list of arguments specific to the task
 * @param {number} tc - track time, starts with 0
 * @param {string} gaEvId - google analytics event id.
 */
function trackData(trackId, opts, tc, gaEvId)
{
  var maxWt = 20000 ;

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
        setTimeout(function(){console.log(transformtracker + "  " +searchRes.length) ; trackData(trackId, null, tc+500) ;} , 500) ;
     }
  }
  else if(trackId == 'trackruns')
  {
    console.log(Object.keys(runstracker).length + "  " +Object.keys(gridConfig.fastqDb).length) ;
    if(Object.keys(runstracker).length == Object.keys(gridConfig.fastqDb).length)
    {
      console.log('Go ahead getting dbnames from studies . . .') ;
      getdbNamesFromStudies(gridConfig.studies, opts) ;
    }
    else if(tc > maxWt)
     {
      var missed = [];
      for(var key in gridConfig.fastqDb)
      {
        if(!(key in runstracker))
         missed.push(key);
       }
       Ext.Msg.alert("RUNS_COLL_ERROR", "Failed to get RUNS collection for one or more biosamples " + missed.join(",")) ;
     }
    else
    {
      console.log('Going to wait for a while to get all the Runs . . . total time ' + tc) ;
      setTimeout(function(){console.log(Object.keys(runstracker).length + "  " +Object.keys(gridConfig.fastqDb).length) ; trackData(trackId, opts, tc+500) ;} , 500) ;
    }
  }
  else if(trackId == 'download')
  {
    /** has two elements in the opts array
     * 1. core or not
     * 2. gridId
     */
    console.log(fileUrls.length + "  " +selectedSamples.length) ;
    if(fileUrls.length == selectedSamples.length)
    {
      console.log('Go ahead with downloading file . . . ') ;
      makedownloadFile(opts[0], opts[1], gaEvId) ;
    }
    else if(tc > maxWt)
     {
       Ext.Msg.alert("DOWNLOAD_ERROR", "Failed to get all the fileUrls . . .") ;
     }
    else
    {
      console.log('Going to wait for a while to get all the File Urls to download . . . . ' + tc) ;
      setTimeout(function(){ console.log(fileUrls.length + "  " +selectedSamples.length) ; trackData(trackId, opts, tc+500, gaEvId) ;} , 500) ;
    }
  }
  // need to track dbnames, qcmetrics and metadata
  else if(trackId == 'gridRender' || trackId == 'popWin')
  {
    console.log(Object.keys(dbnamestracker).length + "  " +Object.keys(metObj).length+" " + Object.keys(qcMetricstracker).length+ " " +Object.keys(gridConfig.fastqDb).length) ;
    if((Object.keys(dbnamestracker).length == Object.keys(gridConfig.fastqDb).length) && (Object.keys(metObj).length == Object.keys(gridConfig.fastqDb).length) && (Object.keys(qcMetricstracker).length == Object.keys(gridConfig.fastqDb).length ))
    {
       console.log('Go ahead  with rendering grid') ;
       if(trackId == 'popWin'){popWindowForSubjects(opts[0], opts[1], opts[2], opts[3], opts[4]) ;}
       else if(trackId == 'gridRender')
       {
         combinestoredata(opts[0]) ;
       }
    }
    else if(tc > maxWt)
     {
       missed = []
       for(var kk in qcMetricstracker)
       {
          if(!(kk in dbnamestracker))

           {missed.push(kk) ;}

       }
       console.log(missed) ;
       Ext.Msg.alert("READ_ERROR", "Failed to read complete data for the grid to render") ;
       if(trackId == 'gridRender'){Ext.getCmp('masksearch').destroy();}
       if(trackId == 'popWin'){Ext.getCmp('maskcellWindow').destroy() ;}
     }
    else
    {
      console.log('Going to wait for a while to get all the data for the grid. . . .totaltime  '+tc) ;
      console.log(Object.keys(metObj).length) ;
      setTimeout(function(){console.log(Object.keys(dbnamestracker).length + "  " +Object.keys(metObj).length+" " + Object.keys(qcMetricstracker).length+ " " +Object.keys(gridConfig.fastqDb).length)  ; trackData(trackId, opts, tc+500) ;} , 500) ;
    }
  }
  else if(trackId == 'readCounts')
  {
    console.log(Object.keys(dbnamestracker).length + "  " + Object.keys(qcMetricstracker).length+ " " +Object.keys(gridConfig.fastqDb).length) ;
    if((Object.keys(dbnamestracker).length == Object.keys(gridConfig.fastqDb).length) && (Object.keys(qcMetricstracker).length == Object.keys(gridConfig.fastqDb).length ))
    {
       console.log('Go ahead  with rendering  readCounts grid') ;
       renderGrid('readCounts','maskreadCountsTable') ;
    }
    else if(tc > maxWt)
     {
       console.log(missed) ;
       Ext.Msg.alert("READ_ERROR", "Failed to read complete data for the grid to render") ;
       Ext.getCmp('maskreadCountsTable').destroy();
     }
    else
    {
      console.log('Going to wait for a while to get all the data for the grid. . . . ' + tc) ;
      setTimeout(function(){console.log(Object.keys(dbnamestracker).length + "  " + Object.keys(qcMetricstracker).length+ " " +Object.keys(gridConfig.fastqDb).length)  ; trackData(trackId, null, tc+500) ;} , 500) ;
    }
  }
  else if(trackId == 'pipelineResult')
  {
    if(fileUrls.length == selectedSamples.length)
    {
      var outputs = null ;
      if(opts.output == true) { 
          if(grpsToDbs){ getStaticToolSettings() ;}
          else {getToolSettings() ;}
        }
      else{ postToWorkBench(fileUrls, outputs) ;}
      if(Ext.getCmp('maskpipeline')){Ext.getCmp('maskpipeline').destroy() ;}
      if(Ext.getCmp('maskdownload')){Ext.getCmp('maskdownload').destroy() ;}
    }
    else if(tc > maxWt)
     {
       Ext.Msg.alert("READ_ERROR", "Failed to get the result files") ;
       if(Ext.getCmp('maskpipeline')){Ext.getCmp('maskpipeline').destroy() ;}
      if(Ext.getCmp('maskdownload')){Ext.getCmp('maskdownload').destroy() ;}
     }
    else
    {
      console.log('Going to wait for a while to get all the data for the grid. . . . ' + tc) ;
      setTimeout(function(){console.log(fileUrls.length + "  " + selectedSamples.length)  ; trackData(trackId, opts, tc+500) ;} , 500) ;
    }
  }
  else if(trackId == 'DownloadMetadata')
  {
    if('Biosample' in metadata && 'Experiment' in metadata && 'Donor' in metadata)
    {
       downloadAllthreeMeta(trackId, opts) ;
       if(Ext.getCmp('maskdownload')){Ext.getCmp('maskdownload').destroy() ;}
    }
    else if(tc > maxWt)
    {
       Ext.Msg.alert("READ_ERROR", "Failed to get the metadata files") ;
       if(Ext.getCmp('maskdownload')){Ext.getCmp('maskdownload').destroy() ;}
    }
    else
    {
      console.log('Going to wait for a while to get all the three metadata is downloaded. . . . ' + tc) ;
      setTimeout(function(){console.log(Object.keys(metadata).length)  ; trackData(trackId, opts, tc+500) ;} , 500) ;
    }

  }
}


function downloadAllthreeMeta(gaEvId, gridId)
{
  groupSelectionsForGA(gridId, gaEvId, null) ;
  var fileName = "metadata" ;
  var str = Date() ;
  var filestr = str.replace(/ /g,'-') ;
  fileName += filestr + ".tsv" ;
  var uri = 'data:text/tsv;charset=utf-8,' + escape(metadata.Biosample+"\n"+metadata.Experiment+"\n"+metadata.Donor);
  var link = document.createElement("a");
  link.href = uri;
  link.style = "visibility:hidden";
  link.download = fileName ;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


function getCommonTextCols()
{
  var textcols = [
  {
    text: '<span align:center; class="gridcol-header">Biosample Name</span>',
    dataIndex: 'bioname',
    tooltip: "<b>Biosample</b><br>Name of the biosample.<br> <i>(Click arrow on the right to sort and filter this column.)</i>",
    flex:1,
    minWidth: 200,
    sortable: true,
    filterable: true
  },
  {
    text: '<span class="gridcol-header">Condition</span>',
    dataIndex: 'disease',
    tooltip: "<b>Condition</b><br>List of health conditions from DOID and NCIT Ontologies.<br> <i>(Click arrow on the right to sort and filter this column.)</i>",
    flex: 1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Anatomical Location</span>',
    dataIndex: 'location',
    tooltip: "<b>Anatomical Location</b><br>Details about the anatomical location from which the fluid was collected.<br> <i>(Click arrow on the right to sort and filter this column.)</i>",
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Biofluid Name</span>',
    dataIndex: 'fluid',
    tooltip: "<b>Biofluid Name</b><br>Biofluid term retrieved from Bioportal Ontologies.<br> <i>(Click arrow on the right to sort and filter this column.)</i>",
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">exRNA Source</span>',
    dataIndex: 'source',
    tooltip: "<b>exRNA Source</b><br>Details of exRNA Source material.<br> <i>(Click arrow on the right to sort and filter this column.)</i>",
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Cell Culture Source</span>',
    dataIndex: 'cellculture',
    tooltip: "<b>Cell Culture Source</b><br>Ontology terms for cell culture sources from BioPortal.<br> <i>(Click arrow on the right to sort and filter this column.)</i",
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  }

 ]
 return textcols ;

}



function sendToGA(action, ev, evCategory, evAction, evLabel, evValue)
{
    try
    {
       
      console.log("Sending info to GA " + evValue) ;
      console.log("Sending info to GA " + evCategory) ;
      ga(action, ev, evCategory, evAction, evLabel, evValue) ;
    }
    catch(err)
    {
      console.log("Failed to fire events to google analytics for the event category " + evCategory) ;
      console.log("Details: "+ err.message) ;
    }
}

/**
 * group the selections to prepare to fire events for GA
 * Not more than 25 events are generated
 * get all the events and group them as follows:
 * 1. PI codes - and also get the count of the samples
 * 2. Get the biofluids - with the count
 * 3. Get the disease, exRNA source, kits
 * @param {string} gridId
 * @param {string} eventCategory
 * @param {Object} filterBiosamples object with biosample ids as keys. Consider only these 
 *   biosamples if present and not the full selections
 */
function groupSelectionsForGA(gridId, eventCategory, filterBiosamples)
{
 
  var gaEvents  = new Object() ;
  var groups = ["PIs", "Fluids", "Diseases", "Sources", "Kits"] ;
  if(grid && grid == "fluidVsExp") {groups[2] = "Experiments" ;}
  for(var gg=0; gg<groups.length; gg++) {
    gaEvents[groups[gg]] = new Object() ;
  }
  /** get the selections for the grid */
  var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
  if(selections && selections.length == 0) {
    /** no events to send */
  }
  else
  {
    for(var ii=0; ii<selections.length; ii++)
    {
      var fluid = null ;
      var dis = null ;
      if(filterBiosamples && Object.keys(filterBiosamples).length > 0)
      {
        /** skip the selection */
        if(!(selections[ii].data.biosample in filterBiosamples)) { continue ; }
       
      }
      /** get the unique PI code with "EXR-" as prefix */
      var pi = selections[ii].data.biosample.substring(0, 10) ;
      if(pi in gaEvents.PIs) { gaEvents.PIs[pi]++ ;}
      else { gaEvents.PIs[pi] = 1 ;}
      if('fluid' in selections[ii].data) { 
        /** fluid available in the store */
        fluid = selections[ii].data.fluid ; }
      else if(yvalue) {
       /** fluid not available in the store */
       /** get it from the global */
       fluid = yvalue ;
      }
      if(fluid){
        if(fluid in gaEvents.Fluids) { gaEvents.Fluids[fluid]++ ;}
        else { gaEvents.Fluids[fluid] = 1 ;}
      }
      if('disease' in selections[ii].data) {
        dis = selections[ii].data.disease ;
      }
      else if(xvalue) {
        dis = xvalue ;
      }
      if(dis) {
        if(dis in gaEvents[groups[2]]) { gaEvents[groups[2]][dis]++ ;}
        else { gaEvents[groups[2]][dis] = 1 ;}
      }
     
      if("source" in selections[ii].data) {
        var src = selections[ii].data.source ;
        if(src in gaEvents.Sources) { gaEvents.Sources[src]++ ;}
        else { gaEvents.Sources[src] = 1 ;}
       /** rna kit is not always present in the selections or store info
         *  this is bad design - need change in future.
         */
     } 
     if('rnakit' in selections[ii].data)
      {
        var kit = selections[ii].data.rnakit ;
        if(kit in gaEvents.Kits) {gaEvents.Kits[kit]++ ;}
        else {gaEvents.Kits[kit] = 1 ;}
      }
    }
   
    /** Now gather and fire events not more than 25 */
    console.log(gaEvents);
    count = 0;
    /** replace disease with experiments */
    for(var ii=0; ii<groups.length; ii++)
    {
      for(var key in gaEvents[groups[ii]]) {
        if(count < 25)
        {
          sendToGA('send', 'event', eventCategory, groups[ii], key, gaEvents[groups[ii]][key]) ;          
        }
        else
        {
          break ;
        }
      }
    } 
  }
}


/**
 * group the selections to prepare to fire events for GA, same as groupSelectionsForGA
 * but uses the record from the store instead of selections
 * Not more than 25 events are generated
 * get all the events and group them as follows:
 * 1. PI codes - and also get the count of the samples
 * 2. Get the biofluids - with the count
 * 3. Get the disease, exRNA source, kits
 * @param {string} eventCategory
 * @param {Object} rec store record for a single row
 */
function groupSelectionsForGAUsingStoreRec(eventCategory, record)
{
  var gaEvents  = new Object() ;
  var groups = ["PIs", "Fluids", "Diseases", "Sources", "Kits"] ;
  if(grid && grid == "fluidVsExp") {groups[2] = "Experiments" ;}
  for(var gg=0; gg<groups.length; gg++) {
    gaEvents[groups[gg]] = new Object() ;
  }
    var fluid = null ;
    var dis = null ;
    var pi = record.data.biosample.substring(0, 10) ;
    if(pi in gaEvents.PIs) { gaEvents.PIs[pi]++ ;}
    else { gaEvents.PIs[pi] = 1 ;}

    if('fluid' in record.data) {
        /** fluid available in the store */
        fluid = record.data.fluid ; }
      else if(yvalue) {
       /** fluid not available in the store */
       /** get it from the global */
       fluid = yvalue ;
      }
      if(fluid){
        if(fluid in gaEvents.Fluids) { gaEvents.Fluids[fluid]++ ;}
        else { gaEvents.Fluids[fluid] = 1 ;}
      }
      if('disease' in record.data) {
        dis = record.data.disease ;
      }
      else if(xvalue) {
        dis = xvalue ;
      }
      if(dis) {
        if(dis in gaEvents[groups[2]]) { gaEvents[groups[2]][dis]++ ;}
        else { gaEvents[groups[2]][dis] = 1 ;}
     }
    if("source" in record.data) {
      var src = record.data.source ;
      if(src in gaEvents.Sources) { gaEvents.Sources[src]++ ;}
      else { gaEvents.Sources[src] = 1 ;}
      /** rna kit is not always present in the selections or store info
      *  this is bad design - need change in future.
      */
    }
    if('rnakit' in record.data)
    {
      var kit = record.data.rnakit ;
      if(kit in gaEvents.Kits) {gaEvents.Kits[kit]++ ;}
      else {gaEvents.Kits[kit] = 1 ;}
    }

    /** Now gather and fire events not more than 25 */
    console.log(gaEvents);
    count = 0;
    for(var ii=0; ii<groups.length; ii++)
    {
      for(var key in gaEvents[groups[ii]]) {
        if(count < 25)
        {
          sendToGA('send', 'event', eventCategory, groups[ii], key, gaEvents[groups[ii]][key]) ;
        }
        else
        {
          break ;
        }
      }
   }
}
