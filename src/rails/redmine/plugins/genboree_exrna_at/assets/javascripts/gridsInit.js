function gridInit()
{
  Ext.Loader.setPath('Ext.ux', urlMount+'/plugin_assets/genboree_exrna_at/javascripts/ux');
  Ext.require(['Ext.ux.grid.FiltersFeature']);
  Ext.onReady(function(){
    Ext.QuickTips.init() ;

    // check for atlas settings
    settingsValid = validateSettings() ;
    // initialize the grid
    if(settingsValid)
    {
      getGbKey() ;
      window.addEventListener('resize', function(event){
        if (Ext.getCmp('datapolicy')) { Ext.getCmp('datapolicy').doLayout() ; }
        if (Ext.getCmp('searchGrid')) { Ext.getCmp('searchGrid').doLayout() ; }
        if (Ext.getCmp('analysisTable')) { Ext.getCmp('analysisTable').doLayout() ; }
      }) ;
      // donuts selected
      if(donutSelections) {
        donutSelectionsObj = Ext.JSON.decode(unescape(donutSelections)) ;
        //get transformation and the rest of the steps associated with getting the data for the grid
        getTransformedData() ;
        renderSelectionGrid('searchGrid') ;
      }
      // tree selections
      else if(treeSelections) {
        treeSelectionsObj = Ext.JSON.decode(unescape(treeSelections)) ;
        getTransformation() ;
        renderSelectionGrid('searchGrid') ;

      }
      // one of the grids are present - fluidVsDis or fluidVsExp or studiesGrid
      else if(gridName == "fluidVsExp" || gridName == "fluidVsDis")
      {
         makeCrossCollTranformedGrids(gridName) ;
         window.addEventListener('resize', function(event){
           if (Ext.getCmp(gridName)) { Ext.getCmp(gridName).doLayout() ; }
         });
      }
      else if(gridName == "analysesTable")
      {
         makeAnalysisTable() ;
         window.addEventListener('resize', function(event){
           if(Ext.getCmp(gridName)) { Ext.getCmp(gridName).doLayout() ; }
         });
      }
      // view for analysis doc transformation
      else if(gridName.match(/^EXR/))
      {
        // get the read counts table and if the assay is qpcr - use just the biosamples
        // to show the common search grid
        // @todo - transformation of the analysis doc can be skipped
        // Old code still being used - can be merged with the method - getBiosamplesAndRender and
        // get rid of the document transformation all together.
        // Specifically the method getAnalysisTransformationOrRender can be skipped in future. 
        if(assay.match(/qpcr/i)) {
          getBiosamplesAndRender(gridName) ;
           renderSelectionGrid("searchGrid") ;
        }
        else {getAnalysisTransformationOrRender(gridName) ;}
      }
    }
   });
}

// render the grid
// this function is used to render
// grid from the donut selections, lineartree selections and pop up grids from the
// cross collection transformation grid selections (ex - selections from fluidVsDis)
function renderSelectionGrid(gridID)
{
  getsearchGrid(gridID) ;
  Ext.create(gridID,{ renderTo: "searchSummary", title: 'Search Results'}) ;
  var searchMask = new Ext.LoadMask(Ext.getCmp(gridID),
    {
      msg:"Loading search results . . .",
      id: 'masksearch'
    });
  searchMask.show();
}
function getsearchGrid(gridID)
{
  var fields = getCommonFields() ;
  var cellStore = new Ext.data.SimpleStore(
    {
      fields: fields,
      data: []
    }) ;
  var cols = getCommonColumns() ;
  var selMode = getSelModel() ;
  var toolBar = getToolBar(gridID) ;
  var filters = {
    ftype: 'filters',
    local: true,
    } ;
  Ext.define(gridID, {
    extend: 'Ext.grid.GridPanel',
    id: gridID,
    //title: title,
    forceFit: true ,
    useArrows: true,
    //autoScroll: true,
    store: cellStore,
    height: 500,
    frame: true,
    stripeRows: true,
    tbar: toolBar,
    selModel: selMode,
    columns: cols,
    features: [filters]
  }) ;
}



function getCommonFields()
{
  var fields = [
    { name : 'docId' },
    { name : 'biosamplelink' },
    { name : 'biosample' },
    { name: 'bioname' },
    { name: 'fluid' },
    { name: 'disease' },
    { name: 'location' },
    { name: 'source' },
    { name: 'cellculture' },
    { name: 'assay' },
    { name : 'rnakit' },
    { name: 'qcMetrics' },
    { name: 'refgenome' },
    { name: 'trgenome' },
    { name: 'trReads' }

  ] ;
  return fields ;
}


// Columns for the selection grid
function getCommonColumns()
{
  var textcols = [
  {
    text: '<span align:center; class="gridcol-header">Biosample Name</span>',
    dataIndex: 'bioname',
    tooltip: "<b>Biosample</b><br>Name of the biosample.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    sortable: true,
    filterable: true
  },
  {
    text: '<span class="gridcol-header">Condition</span>',
    dataIndex: 'disease',
    tooltip: "<b>Condition</b><br>List of health conditions from DOID and NCIT ontologies.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex: 1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Anatomical Location</span>',
    dataIndex: 'location',
    tooltip: "<b>Anatomical Location</b><br>Details about the anatomical location from which the fluid was collected.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Biofluid Name</span>',
    dataIndex: 'fluid',
    tooltip: "<b>Biofluid Name</b><br>Biofluid term retrieved from Bioportal ontologies.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">exRNA Source</span>',
    dataIndex: 'source',
    tooltip: "<b>exRNA Source</b><br>Details about exRNA Source material.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Cell Culture Source</span>',
    dataIndex: 'cellculture',
    tooltip: "<b>Cell Culture Source</b><br>Ontology terms for cell culture sources from BioPortal.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: '<span class="gridcol-header">Profiling Assay</span>',
    dataIndex: 'assay',
    tooltip: "<b>Profiling Assay</b><br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    flex:1,
    minWidth: 200,
    filterable: true,
    sortable: true
  },
  {
    text: 'RNA Isolation Kit',
    dataIndex: 'rnakit',
    flex:1,
    minWidth: 200,
    filterable: true,
    tooltip: "<b>RNA Isolation Kit</b><br>Name of the RNA isolation kit used for the biosample.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    sortable: true
  },
  getErccCols() ,
  getDownloadCols(),
  getMetadataCols() ,
  getActionCols(),
  {
    text: '<span class="gridcol-header">Biosample Metadata Accession</span>',
    tooltip: "<b>Biosample Accession ID</b><br>Click to view the Biosample metadata document in the GenboreeKB UI.<br><span class='gb-tip-footnote'>(Use the arrow in the right corner to sort and filter this column.)</span>", 
    dataIndex: 'biosamplelink',
    minWidth: 200,
    flex:1,
    filterable: true,
    sortable: true
  }
 ]
 return textcols ;
}


function getErccCols() 
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
                    }
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
    }]
  } ;
  return ercc ;
}


function getMetadataCols(down)
{
  var metCols = {
     xtype: 'actioncolumn',
     menuText: 'Download Metadata',
     text: 'Download Metadata',
     tooltip: "<b>Metadata Links</b><br>Download metadata documents for each sample (Biosample, Experiment, Donor).<span class='gb-tip-footnote'>(Use the arrow in the right corner to filter this column.)</span>",
     minWidth: 120,
     sortable: false,
     align: 'center',
     items: 
     [
       {
         icon: ( urlMount+'/plugin_assets/genboree_exrna_at/images/science-chemistry-icon.png' ),
         tooltip: 'Download the Biosample metadata document.', 
         align: 'center',
         handler: function(grid, rowIndex, colIndex) {
            var rec = grid.getStore().getAt(rowIndex);
            var biosample = rec.get('biosample') ;
            if(askDataAccess == false ){
              askForDataAccess('biodoc', [biosample, rec]) ;
            }
            else
            {
              appendIframe('download?authenticity_token='+csrf_token+'&coll='+escape(atlasSettings.biosamplesColl)+'&docId='+escape(biosample)+'&download_format=tabbed_prop_nesting') ;
              //groupSelectionsForGAUsingStoreRec("DownloadMeta", rec)
            }
          },
          getClass: function(v, meta, rec)
          {
            if(down){return 'icon_down' ;}
          }
        },
        {
          icon: ( urlMount+'/plugin_assets/genboree_exrna_at/images/Body-DNA-icon.png' ),
          tooltip: 'Download the Experiment metadata document.',
          handler: function(grid, rowIndex, colIndex) {
            var rec = grid.getStore().getAt(rowIndex);
            var biosample = rec.get('biosample') ;
            if(askDataAccess == false ){
              askForDataAccess('expdoc', [biosample, 'experimentsColl', rec]) ;
            }
            else
            {
               getDonorOrExpFromBiosample(biosample, "experimentsColl", false) ;
            }
          },
          getClass: function(v, meta, rec)
          {
            if(down){return 'icon_down' ;}
          }
       },
       {
         icon: '/images/silk/user.png',
         tooltip: 'Download the Donor metadata document.',
         handler: function(grid, rowIndex, colIndex) {
            var rec = grid.getStore().getAt(rowIndex);
            var biosample = rec.get('biosample') ;
            if(askDataAccess == false ){
              askForDataAccess('donordoc', [biosample, 'donorsColl', rec]) ;
            }
            else
            {
               getDonorOrExpFromBiosample(biosample, "donorsColl", false) ;
            }
          },
          getClass: function(v, meta, rec)
          {
            if(down){return 'icon_down' ;}
          }
       },
       {
        icon: '/images/download.png',
        tooltip: 'Download all metadata documents (Biosample, Experiment and Donor).',
        id: 'DownloadMetadata',
        handler: function(grid, rowIndex, colIndex) {
          var rec = grid.getStore().getAt(rowIndex);
          var biosample = rec.get('biosample') ;
          selectedSamples = [] ;
          if(askDataAccess == false ){askForDataAccess('DownloadMetadata', [biosample]) ;  }
          else {
            metadata = new Object() ;
            getDonorOrExpFromBiosample(biosample, null, true, 'DownloadMetadata') ;
          }
        }
       }
    ]};
  return metCols ;
}


function getDownloadCols(down)
{
  var downcols =   {
    xtype: 'actioncolumn',
    menuText: 'Download Data',
    text : 'Download Data',
    sortable : false,
    tooltip: '<b>Download</b><br>Download Data',
    flex: 1,
    minWidth: 180,
    align: 'center',
    items: [
      {
      icon: '/images/download.png',
      tooltip: "<b>Core Results Archive</b><br>Download the processed core results archive associated with this biosample. This archive will contain read counts from all three stages of exceRpt (endogenous, exogenous miRNA and rRNA, and exogenous genomes).", 
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },

      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
        if(askDataAccess == false ){ askForDataAccess('singledownload', [[biosample], rec]) ;}
        else{ getResultUrlForBiosample([biosample], rec) ;}
      },
      getClass: function(v, meta, rec)
      {
        if(down){return 'icon_down' ;}
      }
    },
    {
      icon: '/images/silk/chart_organisation.png',
      tooltip: '<b>Exogenous Genomic Taxonomy Tree</b><br>Download the exogenous genomic taxonomy tree associated with this biosample.',
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },
      align: 'center',
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
          if(askDataAccess == false ){ askForDataAccess('rRNAtaxonomy', [[biosample], rec]) ;}
          else{ getResultUrlForBiosample([biosample], rec, 'rRNAtaxonomy');}
      },
    },
    {
      icon : '/images/silk/chart_organisation.png',
      tooltip : '<b>Exogenous Genomic Taxonomy Tree</b><br>Download the exogenous genomic taxonomy tree associated with this biosample.', 
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },
      align: 'center',
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
          if(askDataAccess == false ){ askForDataAccess('taxonomy', [[biosample], rec]) ;}
          else{ getResultUrlForBiosample([biosample], rec, 'taxonomy') ;}
      }
    },
    {
      align: 'center',
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
        if(gridConfig.fastqDb[biosample].show == true)
        {
          if(askDataAccess == false ){ askForDataAccess('result', [[biosample], rec]) ;}
          else{ getResultUrlForBiosample([biosample], rec, 'result');}
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
         val = 'exoandendo' ;
       }
       else {
         gridConfig.fastqDb[biosample].show = false ;
         val = 'fastq_dbGaP' ;
       }
       return val ;
       },
       getTip: function(v, meta, rec) {

         var val  = "<b>Full Endogenous Alignments and Exogenous miRNA and rRNA Alignments</b><br>"; 
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
           val += "Download the full results (alignments) for the first two stages of exceRpt (endogenous alignment and exogenous miRNA and rRNA alignment) for this biosample.<br>" ; 
         }
         else {
           if(dbnames.length > 0 && dbnames[0] == 'Embargo'){
             val += "This data is restricted access and is currently protected for some time (embargo). The embargo on this dataset ends on 07/01/2016." ;
           }
           else {
             val += 'This data is deposited in the controlled access dbGaP archive. <br> Click the <i> Link to external databases </i> icon under the Actions column to view the dbGaP Study Id and contact the PI through dbGaP to get access to these results files.' ;
           }
        }
        return val ;
      }
    },{
      align: 'center',
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },
      handler: function(grid, rowIndex, colIndex) {
        var rec = grid.getStore().getAt(rowIndex);
        var biosample = rec.get('biosample') ;
        if(gridConfig.fastqDb[biosample].show == true)
        {
          if(askDataAccess == false ){ askForDataAccess('exogenousGenome', [[biosample], rec]) ;}
          else{ getResultUrlForBiosample([biosample], rec, 'exogenousGenome') ;}
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
         val = 'exogenous' ;
       }
       else {
         gridConfig.fastqDb[biosample].show = false ;
         val = 'fastq_dbGaP' ;
       }
       return val ;
       },
       getTip: function(v, meta, rec) {

         var val = "<b>Full Exogenous Genomic Alignments</b><br>";
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
           val += 'Download the full results (alignments) for the third stage of exceRpt (exogenous genomic alignment) for this biosample.';
         }
         else {
           if(dbnames.length > 0 && dbnames[0] == 'Embargo'){
             val += 'This data is restricted access and is currently protected for some time (embargo). The embargo on this dataset ends on 07/01/2016.';
           }
           else {
             val += 'This data is deposited in the controlled access dbGaP archive. <br> Click the <i> Link to external databases </i> icon under the Actions column to view the dbGaP Study Id and contact the PI through dbGaP to get access to these files.' ;
           }
        }
        return val ;
      }
    },
    {
      align: 'center',
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
         var biosample = record.data.biosample ;
          if(record.data.assay.match(/qpcr assay/i) ){
            disable = true ;
          }
         return disable ;
      },
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
            var res =  fileUrl.match(/^ftp/) ? true : false ;
            if(res == true) {
            }
            else
            {
             if(gbKey && !(isPublic)){ window.location = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true';}
             else {fileUrl = fileUrl+'/data?&downloadAsFile=true'}
            }
            window.open(fileUrl);
            groupSelectionsForGA("DownloadRawData", null, rec) ;
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
         val = 'fastq' ;
       }
       else {
         gridConfig.fastqDb[biosample].show = false ;
         val = 'fastq_dbGaP' ;
       }
       return val ;
       },
       getTip: function(v, meta, rec) {

         var val  = "<b>Raw Data (FASTQ) File</b><br>";
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
           val += 'Download the raw data (FASTQ) file associated with this biosample.<br>' ;
         }
         else {
           if(dbnames.length > 0 && dbnames[0] == 'Embargo'){
             val += "This data is restricted access and is currently protected for some time (embargo). The embargo on this dataset ends on 07/01/2016." ; 
           }
           else {
             val += 'This data is deposited in the controlled access dbGaP archive. <br> Click the <i> Link to external databases </i> icon under the Actions column to view the dbGaP Study Id and contact the PI through dbGaP to get access to the raw FASTQ data files.' ;
           }
        }
        return val ;
      }
    },
    {
      icon: '/images/silk/chart_bar.png',
      tooltip: 'View a histogram of reads mapped to various libraries.',
      isDisabled: function(view, rowIndex, colIndex, item, record) {
         var disable = false ;
          if(record.data.assay.match(/qpcr assay/i)){
            disable = true ;
          }
         return disable ;
      },
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
      }
     ]};
  return downcols ;
}


function getActionCols(down)
{
  var actcols =   {
    xtype: 'actioncolumn',
    text: 'External References',
    menuText: 'External References',
    tooltip : '<b>External References</b><br>Click each icon to learn more about external links or references.',
    flex: 1,
    minWidth: 120,
    sortable: false,
    align: 'center',
    items: [
    {
      icon: '/images/silk/application_link.png',
      tooltip: 'View links to external databases like SRA, dbGaP, GEO, etc. if the data is available in a public domain archive or controlled access archive. Otherwise, view the data access policy if the data is currently protected via embargo.',
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


function getDownloadMenu(gridId)
{
 var downloadMenu = new Ext.menu.Menu({
    id: 'evDocMenu',
    items: [
      {
        text: 'Download Core Result Archives',
        id: "DownloadCore",
        tip: "Download archives containing core files for the selected samples",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
             selectedSamples = [] ;
             for (var ss=0; ss<selections.length; ss++) {
                selectedSamples.push(selections[ss].data.biosample) ;
              }
            // check for data access
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              getResultUrlsForBiosamples(selectedSamples, "core", obj.id) ;
            }
          }
        }
      },
       {
        text: "Download Exogenous rRNA Taxonomy Trees",
        id: "DownloadFullrRNATaxonomyTree",
        tip: "Download Exogenous rRNA Taxonomy Trees",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              getResultUrlsForBiosamples(selectedSamples, "rRNAtaxonomy", obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Exogenous Genomic Taxonomy Trees',
        id: "DownloadFullExoTaxonomy",
        tip: "Download Exogenous Genomic Taxonomy Trees",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              getResultUrlsForBiosamples(selectedSamples, "exogenoustaxonomy", obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Full Endogenous Alignments and Exogenous miRNA/rRNA Alignments', 
        id: "DownloadRawResult",
        tip: "Download Full Endogenous Alignments and Exogenous miRNA/rRNA Alignments",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              getResultUrlsForBiosamples(selectedSamples, "result", obj.id) ;
            }
          }
        }
      },
      {
        text: 'Download Full Exogenous Genomic Alignments',
        id: "DownloadFullExoResult",
        tip: "Download Full Exogenous Genomic Alignments",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples, gridId]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              getResultUrlsForBiosamples(selectedSamples, "exogenousGenome", obj.id) ;
            }
          }
        }
      },
       {
        text: 'Download Raw Data (FASTQ) Files',
        id: "DownloadRawData",
        tip: "Download raw data files for the selected samples",
        iconCls: 'downloadAll',
        handler: function(obj)
        {
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to download") ;}
          else if(selections.length > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample selection of 150 at a time. Please select fewer number of samples and try again.") ;}
          else {
            selectedSamples = [] ;
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(askDataAccess == false ){
              askForDataAccess(obj.id, [selectedSamples]) ;
            }
            else {
              var searchMask = new Ext.LoadMask(Ext.getCmp('searchGrid'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
               searchMask.show();
              downloadFastqUrlsForBiosamples(selectedSamples, obj.id) ;
            }
          }
        }
      }
    ]
   }) ;
  return downloadMenu ;
}

function getGbToolsMenu(gridName)
{
  var gbToolsMenu = new Ext.menu.Menu({
    id: 'wbMenu',
    items: [
      {
        text: 'Run Post-Processing Tool',
        id: "ppTool",
        tip: "",
        iconCls: 'goToWbClass', 
        handler: function()
        {
          toolSelected = "processPipelineRuns" ;
          // if not a redmine logged in user, then this will make a iframe with log in.
          if(!(pluginUserPerms.gbexat_public_tool_job))
          {
            showToolLogWin() ;
          }
          else
          {
            setUpProcessPipelineRunsJob(gridName) ;
          }
       } 
     },
     {
       text: 'Fold Change Calculation Using DESeq2',
       id: "dseq",
       tip: "",
       iconCls: 'goToWbClass',
       handler: function()
       {
          toolSelected = "DESeq2" ;
          dseqFileLineList = new Object() ;
          // if not a redmine logged in user, then this will make a iframe with log in.
          if(!(pluginUserPerms.gbexat_public_tool_job))
          {
            showToolLogWin() ;
          }
          else
          {
            setUpDSeq2Job(gridName) ;
          }
       }
     }
    ]
  }) ;
  return gbToolsMenu ;
}

function getToolBar(gridName)
{
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
        /*if(window.history && window.history.length > 1)
        {
          alert(window.history.length) ;
          window.history.back() ;
        }
        else 
        {
          */// no history, go the main entry page
          window.open(urlMount + "/projects/" + projectId + "/exat", "_self") ;
       // }
      }
    },
    {
      text: 'Download Samples',
      id: "downloadAll",
      iconCls: 'downloadAll',
      tooltip: 'Download Samples',
      menu: getDownloadMenu(gridName)
      //disabled: true
    },
    {
      text: 'Analyze Selected Samples',
      id: "gbTools",
      iconCls: 'goToWbClass',
      tooltip: 'Analyse a Genboree Tool. <br> This feature is currenlty in Beta Test Phase. <br>',
      menu: getGbToolsMenu(gridName)
    }]
  });
  return toolBar ;

}

function getSelModel()
{
  var selMode = Ext.create('Ext.selection.CheckboxModel', {
    id: 'checkboxSelection',
    checkOnly : true,
    listeners : {
      selectionchange : function(sm, selections) {
      }
    }
  }) ;
  return selMode

}
