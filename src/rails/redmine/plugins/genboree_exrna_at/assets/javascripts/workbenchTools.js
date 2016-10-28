function getGrpStore()
{
 var gpath = '/REST/v1/usr/'+user+'/grps' ;
 /*var url;
    if(publicVersion == "true"){ url = gpath; }
    else{ var url = '/java-bin/apiCaller.jsp' ; }
*/
  Ext.define('grps', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         //url : 'http://'+gHost+'/java-bin/apiCaller.jsp',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         },
         extraParams : {
           rsrcPath: gpath
         },
          listeners: {
            exception: function(proxy, response, operation, eOpts) {
            var apiRespObj  = JSON.parse(response.responseText) ;
            var documentInfo = apiRespObj['data'] ;
            var statusObj   = apiRespObj['status'] ;
            var displayMsg = 'The following error was encountered while fetching the Genboree Groups <br><br>' +response.request.options.params.rsrcPath;
            displayMsg += ( "<br><b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
            displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
            Ext.Msg.alert("ERROR", displayMsg) ;
         }
        }
       },

       fields: [{ name: 'value', mapping: 'text' }]
     });
    var groupStore = Ext.create('Ext.data.Store', {
       model: 'grps'
     });
  return groupStore ;
}

function getDbStore()
{
  Ext.define('dbs', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : '/java-bin/apiCaller.jsp',
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         },
          listeners: {
            exception: function(proxy, response, operation, eOpts) {
            var apiRespObj  = JSON.parse(response.responseText) ;
            var documentInfo = apiRespObj['data'] ;
            var statusObj   = apiRespObj['status'] ;
            var displayMsg = 'The following error was encountered while fetching the Genboree Groups <br><br>' +response.request.options.params.rsrcPath;
            displayMsg += ( "<br><b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
            displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
            Ext.Msg.alert("ERROR", displayMsg) ;
         }
        }
       },

       fields: [{ name: 'dbname', mapping: 'text' }]
     });
    var dbStore = Ext.create('Ext.data.Store', {
       model: 'dbs',
       listeners : {
        load: function(store, records, successful, operation) {
        if (successful) {
          if(records.length == 0) { createNewDbWin() ; }
        }
        else {
          if('error' in operation && 'response' in operation.error && 'responseText' in operation.error.response) {
            var apiRespObj  = JSON.parse(operation.error.response.responseText) ;
            var statusObj   = apiRespObj['status'] ;
            var displayMsg = "The following error was encountered while retreiving documents from the actionability collection: <br>" ;
            displayMsg += ( "</br><b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
            displayMsg += ( "</br><b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i>" );
            displayMsg += "<br><br>Please contact a project admin to arrange investigation and resolution." ;
            Ext.Msg.alert("ERROR", displayMsg) ;
          }
          else {
           displayMsg = "There was a problem retrieving databases, please try again in a few minutes or contact your project administrators if it persists" ;
           Ext.Msg.alert("ERROR", displayMsg) ;
           }
         }
       }
       }
     });

  return dbStore ;
}



function getWorkbenchMenu(gridName)
{
  var gridId = gridName ;
  var workbenchMenu = new Ext.menu.Menu({
    id: 'wbMenu',
    items: [
      {
        text: 'Pathway Finder',
        id: "pFinder",
        tip: "",
        hidden : true,
        handler: function()
        {
          // global
          toolSelected = "pFinder" ;
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          selectedSamples = [] ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
          else if(selections && selections.length > 1) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "More than one sample found in your selection. Select a single sample to activate the tool.") ;}
          else
          {
            if(user && (gHost == location.host))
            {
              // in session and user variable available
              selectedSamples.push(selections[0].data.biosample) ;
              getPipelineResultsForBiosamples(selectedSamples, 'readCounts_miRNAmature_sense.txt') ;
            }
            else if(ingbHostsession == "true")
            {
              selectedSamples.push(selections[0].data.biosample) ;
              getPipelineResultsForBiosamples(selectedSamples, 'readCounts_miRNAmature_sense.txt') ;
            }
            else
            {
              selectedSamples.push(selections[0].data.biosample) ;
              showUserLoginDialog() ;
            }
          }
        }
      },
      {
        text: 'Target Interaction Finder',
        id: "tiFinder",
        tip: "",
        hidden: true,
        handler: function()
        {
          toolSelected = "tiFinder" ;
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
          else
          {
            selectedSamples = [] ;
            // get the result url and populate the workbench
            for (var ss=0; ss<selections.length; ss++) {
              selectedSamples.push(selections[ss].data.biosample) ;
            }
            if(user && (gHost == location.host))
            {getPipelineResultsForBiosamples(selectedSamples, 'readCounts_miRNAmature_sense.txt', true) ; }
            else if(ingbHostsession == "true")
            {getPipelineResultsForBiosamples(selectedSamples, 'readCounts_miRNAmature_sense.txt', true) ;}
            else {showUserLoginDialog() ; }
          }
        }
      },
      {
        text: 'Run Post-Processing Tool',
        id: "ppTool",
        tip: "",
        handler: function()
        {
          toolSelected = "ppTool" ; 
          var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
          else
          {
            selectedSamples = [] ;
            // get the result url and populate the workbench
           for (var ss=0; ss<selections.length; ss++) { selectedSamples.push(selections[ss].data.biosample) ;}
           if(user && (gHost == location.host)) {getResultUrlsForBiosamples(selectedSamples, true, true) ; }
           else if(ingbHostsession == "true")
           {getResultUrlsForBiosamples(selectedSamples, true, true) ;}
           else { showUserLoginDialog() ;}
          
        }
      }
    },
    {
      text: 'Fold Change Calculation Using DESeq2',
      id: "dseq",
      tip: "",
      disabled : ((publicVersion == "true") && (location.host != gHost)),
      handler: function()
      {
        toolSelected = "dseq2" ;
        dseqFileLineList = new Object() ;//global
        var selections = Ext.getCmp(gridId).getSelectionModel().getSelection() ;
          if(selections && selections.length == 0) {Ext.Msg.alert("INVALID_SAMPLE_SELECTION", "No samples selected to activate the tool") ;}
          else
          {
            selectedSamples = [] ;
            // get the result url and populate the workbench
            for (var ss=0; ss<selections.length; ss++) 
            { 
              selectedSamples.push(selections[ss].data.biosample) ;
              dseqFileLineList[selections[ss].data.biosample] = [null, selections[ss].data.disease, selections[ss].data.fluid] ;
            }
            if(user && (gHost == location.host)) { getResultUrlsForBiosamples(selectedSamples, true, true) ; }
            else if(ingbHostsession == "true"){getResultUrlsForBiosamples(selectedSamples, true, true) ;}
            else {showUserLoginDialog() ; }
          }
      }

    }
    ]
   }) ;
  return workbenchMenu ;
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


function getPipelineResultsForBiosamples(biosamples, matchText, getOutputParams)
{
  var respath = decodeURIComponent(datasource) ;
  var matchprop = 'Result Files.Biosample ID' ;
  var ii = 0 ;
  var filecontent = '' ;
  var counter = 220 ;
  var lastcount =  false;
  fileUrls = [] ; // global
  if (Ext.getCmp('searchGrid')) {var searchGrid = 'searchGrid' ;}
  else if (Ext.getCmp('readCounts')) {var searchGrid = 'readCounts' ;}
  else if (Ext.getCmp('cellWindow')) {var searchGrid = 'cellWindow' ;}
  else {searchGrid = "gridsContainer" ;}
  var searchMask = new Ext.LoadMask(Ext.getCmp(searchGrid),
  {
    msg:"Loading . . .",
    id: 'maskpipeline'
  });
  searchMask.show();
  // query is done with a set of 220 biosamples at a time to handle the URL length issue
  while(ii < biosamples.length)
  {
    var nextcount = ii+counter;
    subSamples = [];
    if(nextcount >= biosamples.length){ nextcount = biosamples.length; lastcount = true;}
    for(var jj=ii; jj<nextcount; jj++){ subSamples.push(biosamples[jj]) ;}
    //var respath = decodeURIComponent(datasource) + '/coll/Result%20Files/docs?detailed=true&matchProp='+encodeURIComponent(matchprop)+'&matchValues='+subSamples+'&matchMode=exact';



    var respath = decodeURIComponent(datasource) ;
    var url = respath +'/coll/Result%20Files/docs?' ;
    var addParams = {} ;
    //var digest = md5(url + 'detailed=true&matchProp='+encodeURIComponent(matchprop)+'&matchValues='+subSamples+'&matchMode=exact') ;
     if(publicVersion == "true"){
      //url += ("&digest=" + digest) ;
      addParams = {
        apiMethod : 'GET',
        lastc : lastcount,
        detailed : "true",
        matchProp: matchprop,
        matchValues: subSamples.join(","),
        matchMode: 'exact'
      }
    }
    else{
         addParams = {
           rsrcPath: (url + 'detailed=true&matchProp='+encodeURIComponent(matchprop)+'&matchValues='+subSamples+'&matchMode=exact') ,
           lastc : lastcount
        } ;
        url = '/java-bin/apiCaller.jsp' ;
     }

    Ext.Ajax.request(
    {
      url : url,
      timeout : 90000,
      method: 'POST',
      params: addParams,
      callback: function(opts, success, response)
      {
        var results = response.responseText ;
        var respObj = JSON.parse(response.responseText) ;
        if(response.status >= 200 && response.status < 400 && results)
        {
          var resObj = respObj['data'] ;
          for(var bb=0; bb<resObj.length; bb++)
          {
            var resdoc = resObj[bb] ;
            if('Pipeline Result Files' in resdoc['Result Files'].properties['Biosample ID'].properties && 'items' in resdoc['Result Files'].properties['Biosample ID'].properties['Pipeline Result Files'] && resdoc['Result Files'].properties['Biosample ID'].properties['Pipeline Result Files']['items'].length > 0)
            {
              var pipItems = resdoc['Result Files'].properties['Biosample ID'].properties['Pipeline Result Files']['items'] ;
              for(var pp=0; pp<pipItems.length; pp++) {
                if(pipItems[pp]['File ID']['properties']['File Name']['value'] == matchText)
                {
                  var genboreeFileUrl = pipItems[pp]['File ID']['properties']['Genboree URL']['value'] ;
                  fileUrls.push(genboreeFileUrl) ;
                  break ;
                }
              }
            }
          }
          // record the last ajax for the last set

          if(response.request.options.params.lastc == true) { trackData('pipelineResult', {output: getOutputParams}, 0) ; }
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the result files link from the Result Files collection :<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
     });
     ii = nextcount ;
  }
}

function postToWorkBench(input, output)
{
    wbForm = document.createElement("form") ;
    wbForm.method = "post" ;
    //post specifically to 10.15.55.128 or genboree.org. bug related to hosts in workbench code
    // for domain based posting
    //wbForm.action = "http://"+gHost+"/java-bin/workbench.jsp" ;
    var proto = window.location.protocol ;
    wbForm.action = proto+"//"+gHost+"/java-bin/workbench.jsp" ;
    console.log(wbForm.action) ;
    wbForm.target = "_blank" ;
    formAppend(wbForm, document.createElement("input") ,"populateWorkbench", true) ;
    formAppend(wbForm, document.createElement("input") ,"populateInputs", input) ;
    // Other resource Urls that are specific to Output Targets in the workbench.
    if(output) {formAppend(wbForm, document.createElement("input") ,"populateOutputs", output) ;}
    document.body.appendChild(wbForm) ;
    try 
    {
       wbForm.submit() ;
       document.body.removeChild(wbForm);
    }// in case of ns failure due to pop ups block, etc, just remove the mask, if any
    catch(err) 
    {
      document.body.removeChild(wbForm);
      if(Ext.getCmp('maskpipeline')){ Ext.getCmp('maskpipeline').destroy() ;}
    }
}

function formAppend(myForm, myInput, inputName, inputValue)
{
    myInput.setAttribute("name", inputName); //Tell gene browser which tracks are being displayed
    myInput.setAttribute("value", inputValue);
    myForm.appendChild(myInput);
}






function getToolSettings()
{

  var groupStor = getGrpStore() ;
  var dbStore = getDbStore() ;

  Ext.define('Toolsettings', {
    extend: 'Ext.window.Window',
    requires: [
    ],
    title: 'Tool Settings',
    border: true,
    modal : true,
    height: 150,
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
        items: [
           {
              xtype: 'combo',
              name: 'grp',
              fieldLabel: 'Group',
              labelStyle: 'font-weight:bold;padding:0',
              store: groupStor,
              //width: 350,
              id: 'grpCombo',
              displayField: 'value',
              typeAhead: false,
              autoScroll: true,
              editable: false,
              allowBlank : false,
              //autoSelect: true,
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
                   //Ext.getCmp('toolform').getForm().reset() ;
                   //combo.setValue(grp) ;
                   if(grp) { 
                     checkWriteGrpPermissions(grp) ;
                   }
                }
             }
           },
            {
              xtype: 'combo',
              name: 'database',
              fieldLabel: 'Database',
              labelStyle: 'font-weight:bold;padding:0',
              store: dbStore,
              //width: 350,
              id: 'dbCombo',
              displayField: 'dbname',
              typeAhead: true,
              minChars : 1,
              autoScroll: true,
              forceSelection: true,
              disabled: true,
              //hideTrigger: true,
              allowBlank : false,
              enableKeyEvents : true,
              emptyText: 'Type and Choose a Database . . .',
              queryMode   : 'remote',
              listConfig: {
                loadingText: 'Searching . . .',
                emptyText: 'No database found . . .',
                getInnerTpl: function() {
                    return '{dbname}' ;
              }
            },

           listeners : {
             beforequery: function(queryEvent, eOpts) {
                  queryEvent.combo.store.proxy.extraParams = {
                    rsrcPath: '/REST/v1/grp/'+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+'/dbs'
                 }
             }
          }
       }]
    }],

    buttons: [{
        text: 'Activate Tool',
        tooltip: 'Activates the tool and populating the Genboree Workbench.',
        handler: function () {
          // make the output parameters from the form value
          if(Ext.getCmp('toolform').getForm().isValid() && (Ext.getCmp('grpCombo').getValue()) && (Ext.getCmp('dbCombo').getValue())) 
          {
            var outputrsUri = "http://"+gHost+"/REST/v1/grp/"+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+"/db/"+encodeURIComponent(Ext.getCmp('dbCombo').getValue()) ;
            if(toolSelected == "dseq2")
            {
               //makeAndUploadFileToDb(outputrsUri) ;
               createEmptyFile(outputrsUri) ;
            }
            else
            {
              postToWorkBench(fileUrls, [outputrsUri]) ;
            }
            Ext.getCmp('toolWindow').close() ; 
             if(loginWin){loginWin.close() ;}
          }
        }
    },{
        text: 'Reset',
        handler: function() {Ext.getCmp('dbCombo').disable() ; Ext.getCmp('toolform').getForm().reset() ;} ,
        tooltip: 'Resets the form.'
    }, {
        text: 'Cancel',
        tooltip: 'Close',
        handler: function() {Ext.getCmp('toolWindow').close() ; if(loginWin){loginWin.close() ;}}
    }]
  });
  var toolWin = Ext.create('Toolsettings', {}) ;
  toolWin.show() ;
}


function checkWriteGrpPermissions(grpName)
{
  var rsrcPath = '/REST/v1/grp/'+encodeURIComponent(grpName)+'/usr/'+user+'/role?connect=no'
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp',
    timeout : 90000,
    params:
    {
      rsrcPath: rsrcPath,
      apiMethod : 'GET',
      grp: grpName
    },
    method: 'GET',
    success: roleSuccess,
    failure: grpFailureDialog
  }) ;

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



function roleSuccess(result, request)
{
  var jsonData = Ext.JSON.decode(result.responseText) ;
  var message = "" ;
  if(jsonData.data.role == "subscriber")
  {
      Ext.getCmp('grpCombo').clearValue() ;
      message = "You do not have sufficient permissions to write to this group - "+request.params.grp+". Please choose a different group.<br>"
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


function createNewDbWin()
{
  Ext.Msg.show({
    cls: 'mydbCls',
    id: 'newDb',
    title : 'Create New Database',
    msg : 'There are no databases for the group you selected - <b>'+Ext.getCmp('grpCombo').getValue()+ '</b>. <br>Do you wish to create a new database? If yes, note that a new database will be created by the name - <b>exRNA-atlas Output</b>',
    width : 500,
    height : 150,
    modal: true,
    buttons : Ext.Msg.YESNO,
    buttonText :
    {
      yes : 'Create & Continue',
      no: 'Cancel'
    },
    multiline : false,
    fn : function(buttonValue, inputText, showConfig){
     if(buttonValue == 'no'){ /*Ext.getCmp('newDb').close() ;*/ }
     else if (buttonValue == 'yes'){ createNewDb(true) ; }
     else { /*Ext.getCmp('newDb').close() ; */}
    }
  });
}


function createNewDb(gotoWb)
{
  var dbName = 'Exrna-atlas Output' ;
  var dbPath = '/REST/v1/grp/'+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+'/db/'+encodeURIComponent(dbName) ;
  var payload = {"data": {"name": dbName, "entrypoints": null, "gbKey":"", "version": "hg19", "description": "Database from Exrna-atlas", "refSeqId":"", "species": "Homo sapiens", "public" : false}} ;
  Ext.Ajax.request({
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: dbPath,
      apiMethod : 'PUT',
      gotoWb: gotoWb,
      dbname: dbName,
      payload: Ext.JSON.encode(payload)
    },
    method: 'POST',
    success: createAndgotoWb,
    failure: displayFailureDialogDb

  }) ;
}

function createAndgotoWb(result, request)
{
  if(request.params.gotoWb == true) {
    var outputrsUri = "http://"+gHost+"/REST/v1/grp/"+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+"/db/"+encodeURIComponent(request.params.dbname) ;
    Ext.getCmp('toolWindow').close() ;
    postToWorkBench(fileUrls, [outputrsUri]) ;
  }
  else
  {
  }
}

function displayFailureDialogDb(result, request)
{
  var message = "";
  var jsonData = Ext.JSON.decode(result.responseText) ;
  if(result.status == 403)
  {
    if(Ext.getCmp('grpCombo')){Ext.getCmp('grpCombo').clearValue() ;}
    message += "You do not have sufficient permissions to write to the grp - " + request.params.grp + ". Please choose another group."
  }
  else
  {
    message += "An unexpected error has occurred.<br>"
    resultText = (result.responseText && jsonData['status']) ? jsonData['status'].msg : "No response from server.";
    message += resultText;
  }
  Ext.MessageBox.show({
    title: 'Error creating file',
    msg: message,
    buttons: Ext.MessageBox.OK,
    animEl: 'elId',
    icon: Ext.MessageBox.ERROR
  });
}




function showUserLoginDialog()
{
 
  var pageDetails = window.location ;
  var proto = pageDetails.protocol ; 
  var parm = encodeURIComponent(proto+"//"+location.host+"/exRNA-atlas/exToWb.rhtml") ;
  var frameUrl = proto+"//"+gHost+"/java-bin"+urlMount+"/exAtlasLogin.jsp?cburl="+parm ;
  
  if((publicVersion == "true" || publicVersion == true) &&(gHost != location.host))
  {
    var grpinfo = true
    frameUrl += "&grpinfo="+grpinfo ;
  }
  frameUrl +="&gHost="+gHost ;
  //global
  frameUrl += "&ingbHostsession=true";
  loginWin = new Ext.Window({
    title: 'ExRNA Atlas Log in',
    modal: true ,
    id: 'userLoginWin',
    width: "40%",
    height: "40%",
    html: '<iframe src="'+frameUrl+'" width=100% height=100%> </iframe>'
  });
  loginWin.show() ;

}

function createEmptyFile(outputsUri)
{
  // make a file name
  var dseqfilename = Date() ;
  dseqfilename = dseqfilename.replace(/ \(CDT\)/,"");
  dseqfilename = dseqfilename.replace(/ /g,'-') ;
  dseqfilename = "ExRNAAtlasDeseq2-" + dseqfilename+ ".txt" ;
  // get the template
  var payload = getEmptyFilePayloadObj() ;
  // Add the filename
  payload.data.name = dseqfilename ;
  payload.data.label = dseqfilename ;
  var dbUri = outputsUri + "/file/"+encodeURIComponent(dseqfilename) ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: dbUri,
      apiMethod : 'PUT',
      outputsuri :outputsUri,
      filename: dseqfilename,
      payload: Ext.JSON.encode(payload)
    },
    method: 'POST',
    success: emptyfilepostsuccess,
    failure: displayFailureDialogDb
  }) ;

}

function emptyfilepostsuccess(result, request)
{
 setTimeout(function(){makeAndUploadFileToDb(request.params.outputsuri, request.params.filename)} , 1000) ; 
  //makeAndUploadFileToDb(request.params.outputsuri, request.params.filename)
}



// first make the tsv file for the tool dseq2
// then post it to the user output database file
// add the posted uri to the file urls
// then post all the input and output resource paths to the genboree workbench
function makeAndUploadFileToDb(outputsUri, filename)
{
  var filecontent = "#Biosample Name\tCondition\tBiofluid Name\n" ;
  for(var key in dseqFileLineList)
  {
    filecontent += dseqFileLineList[key].join("\t")
    filecontent += "\n" ;
  }
  var dseqfilename = filename ;
  var dbUri = outputsUri + "/file/"+encodeURIComponent(dseqfilename)+"/data?" ;
  var filePath = outputsUri + "/file/"+encodeURIComponent(dseqfilename) ;
  Ext.Ajax.request(
  {
    url : '/java-bin/apiCaller.jsp' ,
    timeout : 90000,
    params:
    {
      rsrcPath: dbUri,
      apiMethod : 'PUT',
      outputsDb: outputsUri,
      dseqfileUrl: filePath,
      payload: filecontent
    },
    method: 'POST',
    success: filepostsuccess,
    failure: displayFailureDialogDb
  }) ; 
}

function filepostsuccess(result, request)
{
  // once success then post to the workbench 
  // add the new posted file urls with the rest of the core file urls as "Inputs"
  fileUrls.push(request.params.dseqfileUrl)
  postToWorkBench(fileUrls, [request.params.outputsDb]) ;
}



function getSampleNameFromCoreFileUrl(coreUrl)
{
  var retVal = null ;
  var spl1 = coreUrl.split("/CORE_RESULTS/") ;
  var spl2 = spl1[0].split("/") ;
  retVal = spl2[spl2.length-1] ;
  return retVal
}



function getStaticToolSettings()
{
 var dd = [] ;
 for(var kk in grpsToDbs) {dd.push([kk])}
 var stGrpStore = Ext.create('Ext.data.ArrayStore', {
    fields: ['gname'],
    data : dd.sort()
  });
  var sgrp ;
  Ext.define('Toolsettings', {
    extend: 'Ext.window.Window',
    title: 'Tool Settings',
    border: true,
    modal : true,
    height: 150,
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
        items: [
           {
              xtype: 'combo',
              name: 'grp',
              fieldLabel: 'Group',
              labelStyle: 'font-weight:bold;padding:0',
              store: stGrpStore,
              id: 'grpCombo',
              displayField: 'gname',
              typeAhead: true,
              autoScroll: true,
              //editable: false,
              allowBlank : false,
              forceSelection: true,
              emptyText: 'Choose a group . . .',
              queryMode   : 'local',
              listConfig: {
                loadingText: 'Searching . . .',
                emptyText: 'No matching terms found . . .',
                getInnerTpl: function() {
                    return '{gname}' ;
                }
              },
              listeners : {
               select: function(combo, rec, index) {
                   sgrp = combo.getValue() ;
                   if(sgrp) {
                     Ext.getCmp('dbCombo').enable() ;
                   Ext.getCmp('dbCombo').clearValue() ;
                   Ext.getCmp('dbCombo').getStore().removeAll()
                    Ext.getCmp('dbCombo').bindStore(grpsToDbs[sgrp].sort());
                   }
                }
             }
         },
         {
              xtype: 'combo',
              typeAhead: true,
              triggerAction: 'all',
              selectOnTab: true,
              forceSelection : true,
              mode: 'local',
              name: 'database',
              fieldLabel: 'Database',
              labelStyle: 'font-weight:bold;padding:0',
              store: [],
              id: 'dbCombo',
              autoScroll: true,
              disabled: true,
              emptyText: 'Type and Choose a Database . . .'
            }
      ]
    }],
    buttons: [{
        text: 'Activate Tool',
        tooltip: 'Activates the tool and populating the Genboree Workbench.',
        handler: function () {
          if(Ext.getCmp('toolform').getForm().isValid() && (Ext.getCmp('grpCombo').getValue()) && (Ext.getCmp('dbCombo').getValue()))
          {
            var outputrsUri = "http://"+gHost+"/REST/v1/grp/"+encodeURIComponent(Ext.getCmp('grpCombo').getValue())+"/db/"+encodeURIComponent(Ext.getCmp('dbCombo').getValue()) ;
              postToWorkBench(fileUrls, [outputrsUri]) ;
            Ext.getCmp('toolWindow').close() ;
             if(loginWin){loginWin.close() ;}
          }
        }
    },{
        text: 'Reset',
        handler: function() {Ext.getCmp('dbCombo').disable() ; Ext.getCmp('toolform').getForm().reset() ;} ,
        tooltip: 'Resets the form.'
    }, {
        text: 'Cancel',
        tooltip: 'Close',
        handler: function() {Ext.getCmp('toolWindow').close() ; if(loginWin){loginWin.close() ;}}
    }]
  });
  var toolWin = Ext.create('Toolsettings', {}) ;
  toolWin.show() ;
}


function getEmptyFilePayloadObj()
{
  var payObj = {
    "data": {
      "attributes": {
    },
    "lastModified": "",
    "storageHost": "",
    "modifiedBy": "",
    "name": "em",
    "autoArchive": "",
    "size": "",
    "createdDate": "",
    "hide": "",
    "description": "",
    "type": "",
    "label": "empty",
    "storageType": ""
  },
  "status": {
    "statusCode": "OK",
    "msg": "OK"
  }

}
  return payObj
}
