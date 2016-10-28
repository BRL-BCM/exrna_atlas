var fields = [
  "Job Date",
  "RFA Title",
  "PI Name",
  "Submitter's Name",
  "Grant Number",
  "Mode of Submission",
  "Organization of PI",
  "Co PI Names",
  "Processing Pipeline",
  "Anticipated Public Data Repository",
  "Submission Category",
  "Project Registered by PI with dbGaP?",
  "Number of Submitted Samples"
]
Ext.onReady(function(){
   window.addEventListener('resize', function(event){
    if (Ext.getCmp('gridsContainerPanel')) {
      Ext.getCmp('gridsContainerPanel').doLayout() ;
    }
  });
  loadPageContents() ;
}) ;

function loadPageContents()
{
  Ext.Ajax.request({
    url: 'data/consortium/erccDccReport_extFormat_05102016.json',
    //url: 'data/erccDccReport_extFormat.json',
    success: function(response){
      var storeData = JSON.parse(response.responseText)
      Ext.Ajax.request({
        url: "erccDccRepColConfig.json",
        success: function(response){
          var columnConfig = JSON.parse(response.responseText) ;
          renderPanel(storeData, columnConfig) ;
        }
      }) ;
    }
  }) ;
  
   
}

function renderPanel(storeData, columnConfig)
{
  createStores(storeData) ;
  var gridByJob = Ext.create('Ext.grid.Panel', {
    title: 'Group: Submission Month/Year',
    store: Ext.data.StoreManager.lookup('storeByDate'),
    columns: createColConfig('Job Date', columnConfig),
    //height: 650,
    forceFit: true,
    listeners: {
      afterrender: function(){
        //Ext.getCmp('gridByJobDate').getStore().sort([ { property: "RFA Title", direction: "ASC"  }, { property: 'PI Name', direction: "ASC"} ]) ;
      }
    },
    viewConfig: {
      enableTextSelection: true
    },
    features: [{ftype: 'grouping', groupHeaderTpl: ['<span style="color:#000000;">Group: </span>', '<span style="color:#000000;">{name:this.formatName}</span>', { formatName: function(name){ return name ;}}]}],
    autoScroll: true,
    id: 'gridByJobDate'
  });
  var gridByRFA = Ext.create('Ext.grid.Panel', {
    title: 'Group: RFA Title',
    store: Ext.data.StoreManager.lookup('storeByRFATitle'),
    columns: createColConfig('RFA Title', columnConfig ),
    features: [{ftype: 'grouping', groupHeaderTpl: ['<span style="color:#000000;">Group: </span>', '<span style="color:#000000;">{name:this.formatName}</span>', { formatName: function(name){ return name ;}}]}],
    //height: 650,
    forceFit: true,
    listeners: {
      afterrender: function(){
        Ext.getCmp('gridByRFA').getStore().sort([ { property: "Job Date", direction: "ASC"  }, { property: 'PI Name', direction: "ASC"} ]) ;
      }
    },
    viewConfig: {
      enableTextSelection: true
    },
    autoScroll: true,
    id: 'gridByRFA'
  });
  Ext.create('Ext.tab.Panel', {
    frame: true,
    height: 650,
    id: 'gridsContainerPanel',
    activeTab: 0,
    items: [
      gridByJob,
      gridByRFA
    ],
    layout: 'fit',
    listener: {
      'resize': function(){
        this.doLayout() ;
      }
    },
    renderTo : 'panelContainer',
    header: {
      title: 'ERCC Data Coordination Center - Sample Submission Summary',
      titleAlign: 'center'
    }
  });
  
}

function createColConfig(groupByField, columnConfig)
{
  var ii ;
  var retVal = [] ;
  for(ii=0; ii<fields.length; ii++)
  {
    var field = fields[ii] ;
    // Remove self from config.
    if (field == groupByField) {
      continue ;
    }
    var draggable = ( columnConfig['columns'][groupByField]['nonDraggable'][field] ? false : true ) ;
    var colObj = {'text': field, 'dataIndex': field, draggable: draggable} ;
    if (columnConfig['columns'][field] && columnConfig['columns'][field]['minWidth']) {
      colObj['minWidth'] = columnConfig['columns'][field]['minWidth'] ;
    }
    retVal.push( colObj ) ;
  }
  return retVal ;
}

function createStores(data)
{
  var storeByDate = Ext.create('Ext.data.Store', {
    proxy: {
      type: 'memory',
      reader: {
        type: 'json',
        root: 'items'
      }
    },
    data: { "items": data},
    fields: fields,
    id: 'storeByDate',
    groupField : 'Job Date'
  });
  var storeByRFATitle = Ext.create('Ext.data.Store', {
    proxy: {
      type: 'memory',
      reader: {
         type: 'json',
         root: 'items'
      }
    },
    data: { "items": data},
    groupField: 'RFA Title',
    id: 'storeByRFATitle',
    fields: fields
  });
}



