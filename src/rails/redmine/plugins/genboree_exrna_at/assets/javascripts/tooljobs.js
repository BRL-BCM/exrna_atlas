function getToolSettings(gridId, factorStore)
{
  // has all the info from the tool settings here
  toolSettings = new Object() 
  if(Ext.getCmp('toolWindow')){Ext.getCmp('toolWindow').close() ;}

  var groupStor = getGrpStore() ;
  var dbStore = getDbStore() ;

  Ext.define('Toolsettings', {
    extend: 'Ext.window.Window',
    requires: [
    ],
    title: 'Tool Settings',
    border: true,
    modal : true,
    height: toolSelected == "DESeq2" ? 350: 150,
    width: 500,
    id: 'toolWindow',
    layout: 'fit',
    plain: true,
     items: [{
        xtype: 'form',
        id: 'toolform',
        labelCls: 'createNewformlabel',
        fieldDefaults: {
            labelWidth: 90
        },

        layout: {
            type: 'vbox',
            align: 'stretch'
        },

        bodyPadding: 5,
        border: false,
        scrollable: true,
        items: getToolFormItems(groupStor, dbStore, factorStore)
    }],

    buttons: [{
        text: 'Submit Tool Job',
        tooltip: 'Activates the tool and populating the Genboree Workbench.',
        handler: function () {
          // make the output parameters from the form value
          if(Ext.getCmp('toolform').getForm().isValid() && (Ext.getCmp('grpCombo').getValue()) && (Ext.getCmp('dbCombo').getValue())) 
          {
            // only two tools currenlty
            var dbUri = "http://"+atlasSettings.jobHost+"/REST/v1/grp/"+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+"/db/"+encodeURIComponent(Ext.getCmp('dbCombo').getValue()) ;
            toolSettings.dbUri = dbUri ;
            if(toolSelected == "processPipelineRuns")
            {
               var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
               selectedSamples = [] ;
                var searchMask = new Ext.LoadMask(Ext.getCmp(gridId),
               {
                 msg:"Submitting Tool Job . . .",
                 id: 'masksearch'
               });
               searchMask.show();
               for (var ss=0; ss<selections.length; ss++) { selectedSamples.push(selections[ss].data.biosample) ;}
               getResultUrlsForBiosamples(selectedSamples, 'core', null, 'tooljob') ;
            }
            else
            // tool job is for DESeq2
            {
               var searchMask = new Ext.LoadMask(Ext.getCmp(gridId),
               {
                 msg:"Submitting Tool Job . . .",
                 id: 'masksearch'
               });
               searchMask.show();
              toolSettings.factorName = Ext.getCmp('factorName').getValue() ; 
              toolSettings.factorLevel1 = Ext.getCmp('factorLevel1').getValue() ; 
              toolSettings.factorLevel2 = Ext.getCmp('factorLevel2').getValue() ; 
              toolSettings.grp = Ext.getCmp('grpCombo').getValue() ; 
              toolSettings.db = Ext.getCmp('dbCombo').getValue() ; 
              var dseqfilename = Date() ;
              dseqfilename = dseqfilename.replace(/ \(CDT\)/,"");
              dseqfilename = dseqfilename.replace(/ /g,'-') ;
              dseqfilename = "ExRNAAtlasDeseq2-" + dseqfilename+ ".txt" ;
              toolSettings.dseqfilename = dseqfilename ;
              var selectedSamples = Object.keys(dseqFileLineList.biosamples) ;
              getResultUrlsForBiosamples(selectedSamples, 'core', null, 'tooljob') ;
            }
            Ext.getCmp('toolWindow').close() ; 
          }
        }
    },{
        text: 'Reset',
        handler: function() {Ext.getCmp('dbCombo').disable() ; Ext.getCmp('toolform').getForm().reset() ; if(Ext.getCmp('factorset')) { Ext.getCmp('factorset').disable() ;}} ,
        tooltip: 'Resets the form.'
    }, {
        text: 'Cancel',
        tooltip: 'Close',
        handler: function() {Ext.getCmp('toolWindow').close() ;}
    }]
  });
  var toolWin = Ext.create('Toolsettings', {}) ;
  toolWin.show() ;
}



function roleSuccess(result, request)
{
  var jsonData = Ext.JSON.decode(result.responseText) ;
  var message = "" ;
  if(jsonData.data.role == "subscriber")
  {
      Ext.getCmp('grpCombo').clearValue() ;
      message = "You do not have sufficient permissions to write to this group - "+request.params.grp+". Please choose a different group.<br>" ;
      Ext.MessageBox.show({
      title: 'Error activating tool in Genboree Workbench',
      msg: message,
      buttons: Ext.MessageBox.OK,
      animEl: 'elId',
      icon: Ext.MessageBox.ERROR
    });
   }
   else {
   Ext.getCmp('dbCombo').enable() ;
  }
}


function grpFailureDialog(result, request)
{
  var message = "";
    var jsonData = Ext.JSON.decode(result.responseText) ;
    if(result.status == 403)
    {
      Ext.getCmp('grpCombo').clearValue() ;
      message += "You do not have sufficient permissions to write to the grp - " + request.params.grp + ". Please choose another group."
    }
    else
    {
      message += "An unexpected error has occurred.<br>"
      resultText = (result.responseText && jsonData['status']) ? jsonData['status'].msg : "No response from server.";
      message += resultText;
    }
    Ext.MessageBox.show({
      title: 'Error choosing group',
      msg: message,
      buttons: Ext.MessageBox.OK,
      animEl: 'elId',
      icon: Ext.MessageBox.ERROR
    });
}




function getToolFormItems(groupStor, dbStore, factorStore)
{
  var formItems = [] ;
  
  formItems = [
  {
    xtype: 'combo',
    name: 'grp',
    fieldLabel: 'Group',
    labelStyle: 'font-weight:bold;padding:0',
    store: groupStor,
    id: 'grpCombo',
    displayField: 'value',
    typeAhead: false,
    autoScroll: true,
    editable: false,
    allowBlank : false,
    forceSelection: true,
    emptyText: 'Choose a group . . .',
    queryMode   : 'remote',
    listConfig: {
      loadingText: 'Searching . . .',
      emptyText: 'No matching terms found . . .',
        getInnerTpl: function() {
          return '{value}' ;
        }
    },
    listeners : {
      select: function(combo, rec, index) {
        var grp = combo.getValue() ;
        Ext.getCmp('dbCombo').disable() ;
        Ext.getCmp('dbCombo').clearValue() ;
        Ext.getCmp('dbCombo').getStore().removeAll()
       if(grp) { checkWriteGrpPermissions(grp) ;}
      }
    }
  },
  {
    xtype: 'combo',
    name: 'database',
    fieldLabel: 'Database',
    labelStyle: 'font-weight:bold;padding:0',
    store: dbStore,
    id: 'dbCombo',
    displayField: 'dbname',
    typeAhead: true,
    minChars : 1,
    autoScroll: true,
    forceSelection: true,
    disabled: true,
    allowBlank : false,
    enableKeyEvents : true,
    emptyText: 'Type and Choose a Database . . .',
    queryMode   : 'remote',
    listConfig: {
      loadingText: 'Searching . . .',
      emptyText: 'No database found . . .',
      getInnerTpl: function() {return '{dbname}' ;}
    },
    listeners : {
      beforequery: function(queryEvent, eOpts) {
        queryEvent.combo.store.proxy.extraParams = {
          grp: Ext.getCmp('grpCombo').getValue()
        }
       },
      select: function(combo, rec, index){
        if(Ext.getCmp('factorset')) { Ext.getCmp('factorset').enable() ;}
        
     }
    }
  }
  ];
  // Add tool specific settings here 
  if(toolSelected == "DESeq2")
  {
   formItems.push(
     {
        xtype: 'fieldset',
        title: 'Advanced Settings',
        defaultType: 'textfield',
        id: 'factorset',
        disabled: true,
        items: [
        { 
          xtype: 'combo',
          allowBlank:false, 
          fieldLabel: 'Factor Name',
          labelStyle: 'font-weight:bold;padding:0', 
          id: 'factorName', 
          emptyText: 'Select a factor name . ',
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          queryMode: 'local',
          store: factorStore,
          listeners: {
            select: function(combo, rec, index){
              Ext.getCmp('factorLevel1').clearValue();
              Ext.getCmp('factorLevel1').store.removeAll() ;

              Ext.getCmp('factorLevel2').clearValue();
              Ext.getCmp('factorLevel2').store.removeAll() ;
              Ext.getCmp('factorLevel2').disable() ;

              if(Ext.getCmp('factorLevel1')) {
               var level1Store = Ext.getCmp('factorLevel1').getStore() ;
               var newData = Object.keys(dseqFileLineList['factors'][combo.getValue()]) ;
               var data = [] ;
               for(var ii=0; ii < newData.length; ii++) {data.push([newData[ii]]) ;}
               level1Store.loadData( data );
               Ext.getCmp('factorLevel1').enable() ; 
              }   
            } 
          }
        },
        {
          xtype: 'combo',
          allowBlank:false,  
          fieldLabel: 'Factor Level1', 
          labelStyle: 'font-weight:bold;padding:0',
          id: 'factorLevel1', 
          emptyText: 'Select the first factor level', 
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          queryMode: 'local',
          store: [],
          disabled: true,
          listeners: {
            select: function(combo, rec, index){
              if(Ext.getCmp('factorLevel2')) {
               Ext.getCmp('factorLevel2').clearValue();
               Ext.getCmp('factorLevel2').store.removeAll() ;
               Ext.getCmp('factorLevel2').disable() ;
               var factor = Ext.getCmp('factorName').getValue() ;
               var factor1Val = Ext.getCmp('factorLevel1').getValue() ;              
               var newData = Object.keys(dseqFileLineList['factors'][factor]) ;
               var data = [] ;
               for(var ii=0; ii < newData.length; ii++) { if(newData[ii] != factor1Val) {data.push([newData[ii]]) ; }}
               var level2Store = Ext.getCmp('factorLevel2').getStore() ;
               level2Store.loadData( data );
               Ext.getCmp('factorLevel2').enable() ;
              }
            }
          }
        },
        {
           xtype: 'combo',
          allowBlank:false,
          fieldLabel: 'Factor Level2',
          labelStyle: 'font-weight:bold;padding:0',
          id: 'factorLevel2',
          emptyText: 'Select the second factor level',
          typeAhead: true,
          triggerAction: 'all',
          selectOnTab: true,
          forceSelection : true,
          queryMode: 'local',
          store: [],
          disabled: true

        }
      ]
    }
  );
  }
  return formItems
}


function setUpProcessPipelineRunsJob(gridName, reSelectRowsObj)
{
  var selections = [] ;
  var species =   new Object() ;
  var nocrossspecies = true ;
  // if reSelectRowObj is populated that means need to reselect the grid, after a reload from the iframe.
  if(reSelectRowsObj && reSelectRowsObj.length > 0)
  {
   for(var ii =0; ii<reSelectRowsObj.length; ii++) {Ext.getCmp(gridName).getSelectionModel().select(parseInt(reSelectRowsObj[ii]), true, false);} 
  }

  selections = Ext.getCmp(gridName).getSelectionModel().getSelection() ;
  var otherassays = 0;
  var species = new Object () ;
  var sampleName ;
  for (var ss=0; ss<selections.length; ss++)
  {
    if(!(selections[ss].data.assay.match(/qpcr/i))) {
      otherassays++ ;
      sampleName = selections[ss].data.biosample ;
      if(metObj[sampleName].Species) {species[metObj[sampleName].Species] = null ;}
      if(Object.keys(species).length > 1)
      {
        nocrossspecies = false ;
        Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "Selected samples belong to more than one species - <i>"+Object.keys(species).join(", ")+" </i> <br>Analysis is restricted for samples with the same species. <br>Please make a fresh selection and try again!<br><br>") ;
        break ;
      }
    }
  }
  if(nocrossspecies)
  {
    if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
    else if(otherassays > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum of 150 samples at a time for tool job submission. Please select fewer number of samples and try again.") ;}
    else if(otherassays == 0)
    {
      Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "All the samples selected are of the assay type qPCR. This is not allowed. Please try again with another selections") ;
    }
    else
    {
       // show the tool settings
      getToolSettings(gridName) ;
    }
  }
}


function setUpDSeq2Job(gridName)
{
   var selections = [] ;
   var species =   new Object() ;
   var nocrossspecies = true ;
   if(reSelectRowsObj && reSelectRowsObj.length > 0)
   {
    for(var ii =0; ii<reSelectRowsObj.length; ii++) {Ext.getCmp(gridName).getSelectionModel().select(parseInt(reSelectRowsObj[ii]), true, false);}
   }

   selections = Ext.getCmp(gridName).getSelectionModel().getSelection() ;
   if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
   else
   {
      dseqFileLineList['biosamples'] = new Object() ;
      dseqFileLineList['factors'] = new Object() ;
      dseqFileLineList['factors']['Condition'] = new Object() ;
      dseqFileLineList['factors']['Biofluid Name']= new Object() ;
      dseqFileLineList['factors']['Anatomical Location']= new Object() ;
      dseqFileLineList['factors']['exRNA Source']= new Object() ;
      dseqFileLineList['factors']['RNA Isolation Kit']= new Object() ;
      var qpcr = 0 ;
      var otherassays = 0 ;
      var sampleName ;
      
      // get the result url and populate the workbench
      for (var ss=0; ss<selections.length; ss++)
      {
        // get the data for the metadata file and advanced tool settings
        console.log(selections[ss]) ;
        if(!(selections[ss].data.assay.match(/qpcr/i)))
        {
          otherassays ++ ;
          sampleName = selections[ss].data.biosample ;
          if(metObj[sampleName].Species) {species[metObj[sampleName].Species] = null ;}
          if(Object.keys(species).length > 1)
          {
            nocrossspecies = false ;
            Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "Selected samples belong to more than one species - <i>"+Object.keys(species).join(", ")+" </i> <br>Analysis is restricted for samples with the same species. <br>Please make a fresh selection and try again!<br><br>") ;
            break ;
          }
            dseqFileLineList['biosamples'][selections[ss].data.biosample] = [null, selections[ss].data.disease, selections[ss].data.fluid, selections[ss].data["location"], selections[ss].data.source, selections[ss].data.rnakit] ;
            if(!(selections[ss].data.disease in dseqFileLineList.factors.Condition)) {dseqFileLineList.factors.Condition[selections[ss].data.disease] = {}}
            if(!(selections[ss].data.fluid in dseqFileLineList.factors['Biofluid Name'])) {dseqFileLineList.factors['Biofluid Name'][selections[ss].data.fluid] = {}}
            if(!(selections[ss].data["location"] in dseqFileLineList.factors['Anatomical Location'])) {dseqFileLineList.factors['Anatomical Location'][selections[ss].data["location"]] = {}}
            if(!(selections[ss].data.source in dseqFileLineList.factors['exRNA Source'])) {dseqFileLineList.factors['exRNA Source'][selections[ss].data.source] = {}}
            if(!(selections[ss].data.rnakit in dseqFileLineList.factors['RNA Isolation Kit'])) {dseqFileLineList.factors['RNA Isolation Kit'][selections[ss].data.rnakit] = {}}
        }
        else
        {
          qpcr++;
        }
        //console.log(qpcr) ;
      }
      if(nocrossspecies)
      {
          if(otherassays == 0){Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples from the allowed assay types are present to activate the tool") ;}
          else if(otherassays > 150) {Ext.Msg.alert("SAMPLE_SELECTION_LIMIT_EXCEEDED", "This release of atlas supports a maximum sample of 150 at a time for tool job submission. Please select fewer number of samples and try again.") ;}
          else
          {
            //if(qpcr > 0) {Ext.Msg.alert("WARNING", "Your selections include samples with the qPCR assay type. These samples will be excluded from the tool analysis") ; }
            var factorStore = [] ;
            // check for factor levels before activating the tool settings
            if(Object.keys(dseqFileLineList['factors']['Condition']).length > 1 || Object.keys(dseqFileLineList['factors']['Biofluid Name']).length > 1 || Object.keys(dseqFileLineList.factors['Anatomical Location']).length > 1 || Object.keys(dseqFileLineList.factors['exRNA Source']).length > 1 || Object.keys(dseqFileLineList.factors['RNA Isolation Kit']).length >1 ) {
              if(Object.keys(dseqFileLineList['factors']['Condition']).length > 1) factorStore.push('Condition') ;
              if(Object.keys(dseqFileLineList['factors']['Biofluid Name']).length > 1) factorStore.push('Biofluid Name') ;
              if(Object.keys(dseqFileLineList['factors']['Anatomical Location']).length > 1) factorStore.push('Anatomical Location') ;
              if(Object.keys(dseqFileLineList['factors']['exRNA Source']).length > 1) factorStore.push('exRNA Source') ;
              if(Object.keys(dseqFileLineList['factors']['RNA Isolation Kit']).length > 1) factorStore.push('RNA Isolation Kit') ;
                getToolSettings(gridName, factorStore) ;
            }
            else
            {
              Ext.Msg.alert("ERROR", "No multiple factor levels for Condition or Biofluid levels detected to activate the DESeq2 Tool for the allowed assay types. Please try again with another set of sample selections.") ;
            }
         }
      }
      
    }
}


function showToolLogWin()
{
  var frameUrl = urlMount+'/projects/'+projectId+'/exat/toolLogin?csrf_param=authenticity_token&csrf_token='+csrf_token ;
  var loginWin = new Ext.Window({
    title: 'ExRNA Atlas Log in',
    modal: true ,
    id: 'userLoginWin',
    width: "40%",
    height: "60%",
    html: '<iframe src="'+frameUrl+'" width=100% height=100%> </iframe>'
  });
  loginWin.show() ;
}
