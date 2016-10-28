// Check for biosample counts and collects all that has the same number of selected facets
function mergeCount()
{
  gridConfig.qcMetrics = new Object() ;
  gridConfig.fastqDb = new Object() ;
  var gridStore = [] ;
  var subjectsinStore = [] ;
  // go through the biosamples that match the count of the number
  // of facets selected
  var facetKey  = null ;
  var projectUrl = decodeURIComponent(redMinePrj) ;   
  for(var key in biosCount)
  {
    if(Object.keys(biosCount[key]).length == donutSelectionsObj.length)
    {
      // get the subtype within the facet, only one kind should go to the store(Ex- Blood/Serum)
      gridStore.push([biosCount[key][Object.keys(biosCount[key])[0]][1],  '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll=Biosamples&doc='+key+'&docVersion=" target="_blank">'+key+'</a>', key]) ;
      subjectsinStore.push(key) ;
      gridConfig.qcMetrics[key] = {} ;
      gridConfig.fastqDb[key] = {} ;
    }
  }
  if(gridStore.length > 0)
  {
    getfastqAndDbForBiosamples(subjectsinStore) ; 
    qcMetricsForBiosamples(subjectsinStore, null) ;
    getBiosampleMetFromSubs(subjectsinStore, gridStore) ;
  }
  else
  {
    var facets = [];
    for(var ii=0; ii<searchRes.length; ii++)
    {
      facets.push( searchRes[ii].facet );
    }
    Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +facets.join(", ")+ "</b>") ;
    Ext.getCmp('masksearch').destroy();
  }
}
var filters = {
    ftype: 'filters',
    local: true,
    } ;

// makes the pop up grid for each of the cell
function makesearchGrids(addKit, path)
{
  var fields = [
    { name : 'docId'},
    { name : 'biosamplelink'},
    { name : 'biosample'},
    { name: 'bioname'},
    { name: 'fluid'},
    { name: 'disease'},
    { name: 'location'},
    {name: 'source'},
    {name: 'cellculture'}
        //{name: 'qcMetrics'}   
  ] ;
  // get the common cols - Biosample Name, Condition . . .
  var textcols = getCommonTextCols() ;
  var cols = [
    textcols[0],
    textcols[1],
    textcols[2],
    textcols[3],
    textcols[4]
  ];
  // Add additional column if the kit facet is in search
  // Limitation - not dynamically fetched, info has to come from the posted data
    if (addKit) {
    fields.push({name : 'rnakit'})
    cols.push(
    {
      text: 'RNA Isolation Kit',
      dataIndex: 'rnakit',
      flex:1,
      minWidth: 200,
      filterable: true,
      tooltip: "<b>Biosample</b><br>Name of the isolation kit used for the biosample.<br> <i>(Click arrow on the right to sort this column.)</i>",
      sortable: true
    }) ;
  }
    cols.push(geterccCol()) ;
    cols.push(getDownloadCols()) ;
    cols.push(getMetCols()) ;
    cols.push(getActionCols()) ;
    cols.push(
    {
      text: '<span class="gridcol-header">Biosample Metadata Accession</span>',
      tooltip: "<b>Biosample Accession ID</b><br> Click to view the Biosample metadata document in GenboreeKB UI.<br> <span class='gb-tip-footnote'>(Click arrow on the right to sort this column.)</span>",
      dataIndex: 'biosamplelink',
      minWidth: 200,
      flex:1,
      filterable: true,
      sortable: true
    })
  fields.push( {name: 'qcMetrics'}) ; 
  fields.push( {name: 'refgenome'}) ; 
  fields.push( {name: 'trgenome'}) ; 
  fields.push( {name: 'trReads'}) ; 
  var cellStore = new Ext.data.SimpleStore(
    {
      fields: fields,
      data: []
    }) ;
  var downloadMenu = getDownloadMenu('searchGrid') ;
  var wbMenu = getWorkbenchMenu('searchGrid') ;
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
       window.history.back() ;
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
      iconCls: 'goToWbClass',
      tooltip: 'Go to Genboree Workbench to activate a tool. <br>The user must be logged in to the Genboree Workbench for this feature to be active.',
      menu: wbMenu,
      //hidden : !(publicVersion == false || publicVersion == "false")
    } 
    ]
  });

  var title = 'Search Results' ;
  if(path) {title = title + "<br>" + path.join("&nbsp;&raquo;&nbsp;") ;}
  var selMode = getSelModel() ;
  // panel for the cell, with metadata about biosamples in the cell
  var cellGrid = new Ext.grid.GridPanel(
  {
    id: 'searchGrid',
    title: title,
    forceFit: true ,
    useArrows: true,
    autoScroll: true,
    store: cellStore,
    height: 500,
    frame: true,
    stripeRows: true,
    tbar: toolBar,
    selModel: selMode,
    columns: cols,
    features: [filters],
    //disableSelection: true,
    renderTo: 'searchSummary'
  }) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
    {
      msg:"Loading search results . . .",
      id: 'masksearch'
    });
  searchMask.show();
}


// combines the biosample additional metadata dynamically retreived and the existing info
// loads the grid and removes the wait cursor
function combinestoredata(gridStore)
{
  var projectUrl = decodeURIComponent(redMinePrj) ;
  for(var ii=0; ii<gridStore.length; ii++)
  {
    var labels = ['Biosample Name', 'Biofluid Name', 'Disease Type', 'Anatomical Location', 'exRNA Source', 'Cell Culture Source'];
    for(var ll=0; ll<labels.length; ll++){
      if(metObj[gridStore[ii][2]][labels[ll]].value == '[No Value]'){gridStore[ii].push('Not Applicable');}
      else {gridStore[ii].push(metObj[gridStore[ii][2]][labels[ll]].value);}
    }
    // rna isolation kit make an additional column
    if (Ext.getCmp('searchGrid').columns.length == 14) { gridStore[ii].push(biosCount[gridStore[ii][2]].kits[0]) ;}
    
    //if(gridConfig.qcMetrics[gridStore[ii][2]].Result == 'PASS') {gridStore[ii].push("YES") ; }
    //else {gridStore[ii].push("NO") ;} 
    if(gridStore[ii][2].match(/(DWONG)/g)){ gridStore[ii].push("NA") ;}
    else if(gridConfig.qcMetrics[gridStore[ii][2]].Result == 'PASS') {gridStore[ii].push("YES") ; }
    else if(gridConfig.qcMetrics[gridStore[ii][2]].Result == 'FAIL') {gridStore[ii].push("NO") ; }
    else { gridStore[ii].push("NS") ; }


    gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Reference Genome Reads']) ;
    gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Genome Ratio']) ;
    gridStore[ii].push(gridConfig.qcMetrics[gridStore[ii][2]]['Transcriptome Reads']) ;
  }
  // load the grid
  var anStor = Ext.getCmp('searchGrid').store ;
  anStor.loadData(gridStore) ;
  // Set the new title
  // Add the store length (number of biosamples that matched the search)
  var title = Ext.getCmp('searchGrid').title.split("<br>") ;
  var newtitle = "Search Results - "+gridStore.length+ " Biosamples" ;
  if (title.length == 2) {
    newtitle = newtitle + "<br>" + title[1] ;
  }
  Ext.getCmp('searchGrid').setTitle(newtitle) ;
  var panelobj = document.getElementById('searchSummary') ;
  Ext.getCmp('masksearch').destroy();
  
}



// Given the posted search object, this method
// returns the 'values' of the facets in the order
// of the rank. The elements in the returned array is
// the path to the cell value.
// It may not end in a leaf.
function getPathsFromDoc()
{
  var pathElems = [] ;
  var pathObj = new Object() ;
  for(var ff=0; ff<searchRes.filters.length; ff++)
  {
    pathObj[searchRes.filters[ff].rank] =  searchRes.filters[ff].values[0] ;
  }
  var keys = Object.keys(pathObj).sort() ;
  for(var ii=0; ii<keys.length ; ii++)
  {
    pathElems.push(pathObj[keys[ii]]) ;
  }
  return pathElems  
}


// HELPER METHODS
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
            gStore.push([node.data[ii].cell.metadata.docIds[dd], '<a href="'+decodeURIComponent(redMinePrj)+'&coll=Biosamples&doc='+node.data[ii].cell.metadata.subjects[dd][jj] +'&docVersion=" target="_blank">'+node.data[ii].cell.metadata.subjects[dd][jj]+'</a>', node.data[ii].cell.metadata.subjects[dd][jj]]) ;
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

