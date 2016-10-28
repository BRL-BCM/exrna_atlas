function getTransformedData()
{
  // global
  transformtracker = 0 ;
  biosCount = new Object();
  for(var ii=0; ii<donutSelectionsObj.length; ii++)
  {
    var url =  urlMount+'/projects/'+projectId+'/exat/transformDocs';

    Ext.Ajax.request(
    {
      url : url,
      timeout : 120000,
      method: 'GET',
      params:
      {
        facet: donutSelectionsObj[ii].facet,
        transformColl:  donutSelectionsObj[ii].transformColl,
        transformationName: donutSelectionsObj[ii].transformation,
        "authenticity_token" : csrf_token,
        count: ii
      },
      callback: function(opts, success, response)
      {
        var results = response.responseText ;
        if(response.status >= 200 && response.status < 400 && results)
        {
          var resp = JSON.parse(response.responseText) ;
          var respObj = resp ;
          searchData[response.request.options.params.facet] = {} ;
          var valObj = {} ;
          var sub;
          for(var vv=0; vv<donutSelectionsObj[response.request.options.params.count].values.length; vv++)
          {
            valObj[donutSelectionsObj[response.request.options.params.count].values[vv]] = true ;
          }
          for(var dd=0; dd<respObj.Data.length; dd++)
          {
            // for the time being all the transformed json contains single level partitions.
            // This should be made dynamic in future.
            if(respObj.Data[dd].name in valObj && 'metadata' in respObj.Data[dd].cell)
            {
              searchData[response.request.options.params.facet][respObj.Data[dd].name] = respObj.Data[dd].cell.metadata ;
              for(var jj=0; jj<respObj.Data[dd].cell.metadata.docIds.length; jj++)
              {
                for(var bb=0; bb<respObj.Data[dd].cell.metadata.subjects[jj].length; bb++)
                {
                  sub = respObj.Data[dd].cell.metadata.subjects[jj][bb] ;
                  if(sub in biosCount)
                  {
                    if(!(response.request.options.params.facet in biosCount[sub]))
                    {biosCount[sub][response.request.options.params.facet] = [respObj.Data[dd].name, respObj.Data[dd].cell.metadata.docIds[jj]] ;}
                  }
                  else
                  {
                    biosCount[sub] = new Object() ;
                    biosCount[sub][response.request.options.params.facet] = [respObj.Data[dd].name, respObj.Data[dd].cell.metadata.docIds[jj]] ;
                  }
                }
              }
            }
          }
          ++transformtracker ;
          if(response.request.options.params.count == donutSelectionsObj.length-1) {trackData('transform', null, 0) ;}
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving transformed documents for the facet :" +response.request.options.params.facet+ "<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
          Ext.getCmp('masksearch').destroy();
        }
      }
    });
  }
}

function getTransformation()
{
  var url =  urlMount+'/projects/'+projectId+'/exat/transformDocs';
  gridConfig.fastqDb = new Object() ;
  gridConfig.qcMetrics = new Object() ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      transformColl: treeSelectionsObj.transformColl,
      transformationName: treeSelectionsObj.transformation,
      "authenticity_token" : csrf_token,
    },
    callback: function(opts, success, response)
    {
      var results = response.responseText ;
      if(response.status >= 200 && response.status < 400 && results)
      {
        // global
        subjectsinStore = [] ;
        var gridstore = [];
        var resObj  = JSON.parse(results) ;
        var trDataObj = resObj.Data ;
        // Get the path to follow from the searchRes
        // searchRes is global
        var paths = getPathsFromDoc() ;
        var node = findNode(trDataObj, paths[0]) ;
        for(var ii=1; ii<paths.length; ii++)
        {
          if (node)
          {
            node = findNode(node.data, paths[ii]) ;
          }
          else
          {
            Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +paths.join(", ")+ "</b>") ;
            Ext.getCmp('masksearch').destroy();
            break 
          }
        }
        if(node){}
        else {
            Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +paths.join(", ")+ "</b>") ;
            Ext.getCmp('masksearch').destroy();
        }
        if ( node && 'cell' in node)
        {
          if (node.cell.value)
          {
            if ('metadata' in node.cell)
            {
              for(var ii=0; ii<node.cell.metadata.docIds.length; ii++)
              {
                for(var jj=0; jj<node.cell.metadata.subjects[ii].length; jj++)
                {
                 //'<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+key+'&docVersion=" target="_blank">'+key+'</a>'
                  gridstore.push([node.cell.metadata.docIds[ii], '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+node.cell.metadata.subjects[ii][jj] +'&docVersion=" target="_blank">'+node.cell.metadata.subjects[ii][jj]+'</a>', node.cell.metadata.subjects[ii][jj]]) ;
                 subjectsinStore.push(node.cell.metadata.subjects[ii][jj]) ;
                }
              }
              getfastqAndDbForBiosamples(subjectsinStore, null);
              qcMetricsForBiosamples(subjectsinStore, null) ;
              getBiosampleMetFromSubs(subjectsinStore, gridstore) ;
            }
          }
          else // No subjects
          {
            var panelobj = document.getElementById('searchSummary') ;
            Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +paths.join(", ")+ "</b>") ;
            Ext.getCmp('masksearch').destroy(); 
          }
        }
        else // has further nesting down stream, traverse till all the leaves and fetch all the subjects
        {
          if(paths.length == 1)
          {
            retVal = [[], []] ;
            for(var jj=0; jj<node.data.length; jj++){ retVal =  getAllcellValues(node.data[jj], retVal[0], retVal[1])}
            if(retVal[1].length == 0) {
              Ext.getCmp('masksearch').destroy();
              Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +paths[0]+ "</b><br>") ;
            }
          }
          if(paths.length == 2) { retVal = getAllcellValues(node, [], []) ;}
          if(retVal[1].length == 0) {
            Ext.getCmp('masksearch').destroy();
            Ext.Msg.alert("NOT_FOUND", "No Biosamples located that matched your query for the facets : <b>" +paths.join(',')+ "</b><br>") ;
          }
          for(var bb=0; bb<retVal[1].length; bb++){gridConfig.qcMetrics[retVal[1][bb]] = {} ; gridConfig.fastqDb[retVal[1][bb]] = {};}
          subjectsinStore = retVal[1] ;
          getfastqAndDbForBiosamples(retVal[1], null);
          qcMetricsForBiosamples(retVal[1], null) ;
          getBiosampleMetFromSubs(retVal[1], retVal[0]) ;
        }
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving transformation for the URL: " +trUrl+ " :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
        Ext.getCmp('masksearch').destroy();
      }
    }
  }) ;
}

// queries both  runs and studies collection to get the fastq urls (Runs) and the database names (Studies)
function getfastqAndDbForBiosamples(biosampleIDs)
{
  gridConfig.fastqDb = new Object() ;
  runstracker = new Object() ;
    var url = urlMount+'/projects/'+projectId+'/exat/fastqAndDb' ;
  
    Ext.Ajax.request(
    {
      url : url ,
      timeout : 120000,
      method: 'POST',
      params: 
      {
        studiesColl : atlasSettings.studiesColl,
        runsColl : atlasSettings.runsColl,
        biosampleIDs : biosampleIDs.join(","),
        "authenticity_token" : csrf_token
      },
      callback: function(opts, success, response)
      {
        var results = response.responseText ;
        if(response.status >= 200 && response.status < 400 && results)
        {
          var respObj = JSON.parse(response.responseText) ;
          gridConfig.fastqDb = respObj.fastqDb ;
          gridConfig.studies = respObj.studies ;
        }
        else
        {
          if(Ext.getCmp('masksearch')){Ext.getCmp('masksearch').destroy();}
          var displayMsg = "The following error was encountered while retrieving related studies from the Runs collection :<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
     }
   });
}
// get all the metadata associated with the biosamples - source, fluidname, location, disease, profiling assay, kit, etc 
function getBiosampleMetFromSubs(biosampleIDs, gridStore, renderReadcounts)
{
  metObj = new Object () ;
   var url =  urlMount+'/projects/'+projectId+'/exat/biosampleMetadata' ;
    Ext.Ajax.request(
    {
      url : url,
      timeout : 120000,
      method: 'POST',
      params:
      {
        biosampleIDs : biosampleIDs.join(","),
        biosampleColl: atlasSettings.biosamplesColl,
        experimentsColl: atlasSettings.experimentsColl,
        "authenticity_token" : csrf_token

      },
      callback: function(opts, success, response)
      {
        var results = response.responseText ;
        if(response.status >= 200 && response.status < 400 && results)
        {
          var respObj = JSON.parse(response.responseText) ;
          metObj = respObj
          if(renderReadcounts){trackData('readCounts' , [gridStore], 0) ;}
          else {trackData('gridRender' , [gridStore], 0) ;}
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the biosample documents from the Biosamples collection :<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
          Ext.getCmp('masksearch').destroy();
        }
      }
    });
}

// get the qcmetrics for a given set of biosamples
function qcMetricsForBiosamples(biosamples)
{
  //docs/qcMetrics
  var url =  urlMount+'/projects/'+projectId+'/exat/qcMetrics' ;
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 120000,
    method: 'POST',
    params:
    {
      analysesColl : atlasSettings.analysesColl,
      biosampleIDs : biosamples.join(","), 
      "authenticity_token" : csrf_token 
    },
    callback: function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && respObj)
      {
        gridConfig.qcMetrics = respObj ;
      }
      else
      {
        var displayMsg = "The following error was encountered while locating Analysis document matching one or more biosamples - "
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  }) ;
}

// gets donor and exp id from a biosample id 
// First get the biosample doc and get the exp or donor id
function getDonorOrExpFromBiosample(biosampleId, collName, gather, gaEvId)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/doc' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.biosamplesColl,
      docId: biosampleId,
      "authenticity_token" : csrf_token
    },
    callback: function(opts, success, response)
    {
        var respObj  = JSON.parse(response.responseText) ;
        if(response.status >= 200 && response.status < 400 && respObj)
        {
          if(gather == true) 
          {
            var bioSampleDoc = respObj ;
            var exp = bioSampleDoc.Biosample.properties['Related Experiments'].items[0]['Related Experiment'].value ;
            var donor = bioSampleDoc.Biosample.properties['Donor ID'].value ;
            appendIframe('downloadbatch?authenticity_token='+csrf_token+'&collNames='+escape(atlasSettings.biosamplesColl)+','+escape(atlasSettings.donorsColl)+','+escape(atlasSettings.experimentsColl)+'&docIds='+escape(biosampleId)+','+escape(donor)+','+escape(exp)+'&download_format=tabbed_prop_nesting') ;
             groupSelectionsForGA(gaEvId, null) ;

          }
          else if(collName == "experimentsColl")
          {
            var bioSampleDoc = respObj ;
            var exp = bioSampleDoc.Biosample.properties['Related Experiments'].items[0]['Related Experiment'].value ;
            appendIframe('download?authenticity_token='+csrf_token+'&coll='+escape(atlasSettings[collName])+'&docId='+escape(exp)+'&download_format=tabbed_prop_nesting') ;
            groupSelectionsForGA(gaEvId, null) ;
          }
          else if(collName == "donorsColl")
          {
            var bioSampleDoc = respObj;
            var donor = bioSampleDoc.Biosample.properties['Donor ID'].value ;
            appendIframe('download?authenticity_token='+csrf_token+'&coll='+escape(atlasSettings[collName])+'&docId='+escape(donor)+'&download_format=tabbed_prop_nesting') ;
            groupSelectionsForGA(gaEvId, null) ;
          }
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving the biosample document - " +biosampleId+" :<br><br>"
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
     }
  }) ;
}

function getResultUrlForBiosample(biosample, record, fileType)
{
  if(fileType) {}
  else { fileType ="core" ;}
  var url =  urlMount+'/projects/'+projectId+'/exat/docs' ;
  var fileTypeHash = {
   ga : {
     "exogenousGenome" : "DownloadExogenousGenome",
     "taxonomy" : "DownloadTaxonomyTree",
     "core" : "DownloadCore",
     "result" : "DownloadRawResult",
     "rRNAtaxonomy": "DownloadrRNATaxonomy"
   },
   path : {
     "exogenousGenome" : "Exogenous Genomic Results Archive File Name",
     "taxonomy" : "Exogenous Genomic Taxonomy Tree File Name",
     "core" : "Core Results Archive File Name",
     "result" : "Results Archive File Name",
     "rRNAtaxonomy": "Exogenous rRNA Taxonomy Tree File Name"
   }
  } ;


  Ext.Ajax.request(
  {
    url : url ,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.resultFilesColl,
      "authenticity_token" : csrf_token,
      matchProp: "Result Files.Biosample ID",
      matchValues: biosample.join(","),
      detailed: true
    },
    callback: function(opts, success, response)
    {
      var results = response.responseText ;
      if(response.status >= 200 && response.status < 400 && results)
      {
        var respObj = JSON.parse(response.responseText) ;
        if(respObj.length == 0)
        {
          Ext.Msg.alert("NOT_FOUND", "No result files located to download for the Biosample - "+biosample);
        }
        else
        {
          var resdoc = respObj[0] ;

          //if('Results Archive File Name' in resdoc['Result Files'].properties['Biosample ID'].properties)
          if(fileTypeHash.path[fileType] in resdoc['Result Files'].properties['Biosample ID'].properties)
          {
            var fileUrl = resdoc['Result Files'].properties['Biosample ID'].properties[fileTypeHash.path[fileType]].properties['Genboree URL'].value ; 
            var res =  fileUrl.match(/^ftp/) ? true : false
            if(res == false) { 
              if(gbKey && !(isPublic)){ fileUrl = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true'; }
                else { fileUrl = fileUrl+'/data?&downloadAsFile=true' ; }
              }
            console.log(fileUrl) ;
            window.open(fileUrl) ;
            groupSelectionsForGA(fileTypeHash.ga[fileType], null, record) ; 
          }
          else
          {
            Ext.Msg.alert("NOT_FOUND", "No property for Result file - "+ fileTypeHash.path[fileType] +" found in the result file document- "+ resdoc['Result Files'].value);
          }
        }
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
}

function getReadCounts(docId, biosample)
{
  var order = ["Input Reads", "After Clipping", "Failed Quality Filter", "Failed Homopolymer Filter", "Calibrator", "UniVec Contaminants", "rRNAs", "Reads Used for Alignment", "Reads Mapped to Reference Genome", "miRNAs Sense", "miRNAs Antisense", "piRNAs Sense", "piRNAs Antisense", "tRNAs Sense", "tRNAs Antisense", "Gencode Annotations Sense", "Gencode Annotations Antisense", "Repetitive Elements", "Circular RNAs Sense", "Circular RNAs Antisense", "miRNAs Precursor Sense", "miRNAs Precursor Antisense", "Reads Used for Exogenous Alignments", "Input to Exogenous miRNAs", "Exogenous miRNAs", "Endogenous Gapped", "Reads Not Mapped to Reference Genome or Endogenous Libraries"]
  var message ;
  var url =  urlMount+'/projects/'+projectId+'/exat/docs' ;
  var props = ["Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Biosamples.Biosample ID", "Analysis.Data Analysis Level.Type.qPCR Data Analysis Level.Biosamples.Biosample ID"] ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.analysesColl,
      "authenticity_token" : csrf_token,
      matchProps: props.join(","),
      matchValue: biosample,
      detailed: true
    },
    callback: function(opts, success, response)
    {
      var respObj = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && respObj)
      {
        var props = [];
        var values = [];
        var anObj = respObj[0];
        var subdoc = anObj["Analysis"]["properties"]["Data Analysis Level"]["properties"]["Type"]["properties"] ;
        if("Level 1 Reference Alignment" in subdoc)
        {
          var anObjItems = subdoc["Level 1 Reference Alignment"].properties["Biosamples"].items ;
        }
        else if("qPCR Data Analysis Level" in subdoc)
        {
          var anObjItems = subdoc["qPCR Data Analysis Level"].properties["Biosamples"].items ;
        }
        var bioId = biosample ;
        var value ;
        for(var ii=0; ii<anObjItems.length; ii++)
        {
          if(bioId == anObjItems[ii]['Biosample ID'].value)
          {
            for(var oo=0; oo<order.length; oo++)
            {
              if(order[oo] in anObjItems[ii]['Biosample ID'].properties['Read Counts at Various Stages'].properties)
              {
                value = anObjItems[ii]['Biosample ID'].properties['Read Counts at Various Stages'].properties[order[oo]].value ; 
                props.push(order[oo]);
                values.push(value) ;
              }
              else 
              {
                props.push(order[oo]);
                values.push(0) ;
              }
            }
          }
        }
        makeHighChart(props, values, bioId);
      }
      else
      {
        var message = "" ;
        message = message + "API Failed to get the analysis document - " + docId + "<br>" + "DETAILS: " + response.status + ', ' + response.statusText;
        Ext.Msg.alert("ERROR",  message) ;
      }
    }
  }) ;
}


function getDataRepositoryLink(bioSampleId, getRefs)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/docs' ;
  var props = ["Run.Type.small RNA-Seq.Raw Data Files.Biosample ID", "Run.Type.qPCR.Raw Data Files.Biosample ID"]
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.runsColl,
      "authenticity_token" : csrf_token,
      matchProps: props.join(","),
      matchValue: bioSampleId,
      detailed: true
    },
    callback: function(opts, success, response)
    {
      var results = response.responseText ;
      if(response.status >= 200 && response.status < 400 && results)
      {
        var studies = [] ;
        var resObj = JSON.parse(response.responseText) ;
        if (resObj.length > 0) // if there is a run document corresponding to the biosample
        {
          if('Related Studies' in resObj[0].Run.properties && 'items' in resObj[0].Run.properties['Related Studies'] && resObj[0].Run.properties['Related Studies'].items.length > 0)
          {
            var studiesItems = resObj[0].Run.properties['Related Studies'].items ;
            for(ii=0; ii<studiesItems.length; ii++)
            {
              studies.push(studiesItems[ii]['Related Study'].value) ;
            }
          }
          else {Ext.Msg.alert("NO_STUDIES", "No studies id found from the Runs document for the biosample - ,"+bioSampleId+" Runs - "+resObj[0].Run.value) ;  }
          getdbLinkFromStudies(studies, getRefs) ;
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving related studies from the Runs collection :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
     }
   }
 });
}

// studies - list of studies id
// get the link to the database
function getdbLinkFromStudies(studies, getRefs)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/docs' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params: 
    {
      coll : atlasSettings.studiesColl,
      "authenticity_token" : csrf_token,
      matchProp: "Study",
      matchValues: studies.join(","),
      detailed: true
    },
    callback: function(opts, success, response)
    {
      var results = response.responseText ;
      if(response.status >= 200 && response.status < 400 && results)
      {
        var resObj = JSON.parse(response.responseText) ;
        if(resObj.length > 0)
        {
          var studyDoc = resObj[0] ;

          if(getRefs == true)
          {
           
            if('References' in studyDoc.Study.properties && 'items' in studyDoc.Study.properties.References && studyDoc.Study.properties.References.items.length > 0)
            {
             var publink = "http://www.ncbi.nlm.nih.gov/pubmed/";
             var pubmed = studyDoc.Study.properties.References.items[0]['PubMed ID'].value ;
             publink += pubmed ;
             window.open(publink);
            }
            else
            {
             var displayMsg = "No references currently available" ;
             Ext.Msg.alert("NOT_FOUND", displayMsg) ;
            }
         }

          else if('Aliases' in studyDoc.Study.properties && 'items' in studyDoc.Study.properties.Aliases && studyDoc.Study.properties.Aliases.items.length > 0 )
          {
            var dbStore = [];
            // get the db window
            var studyItems = studyDoc.Study.properties.Aliases.items ;
            for(var ii=0; ii<studyItems.length; ii++)
            { 
              var accession = "No Data";
              var dbname = "No Data" ;
              var dburl = null;
              if('Accession' in studyItems[ii]) {accession = studyItems[ii].Accession.value;}
              if('Accession' in studyItems[ii] && 'dbName' in studyItems[ii].Accession.properties) {dbname = studyItems[ii].Accession.properties.dbName.value;}              
              if('Accession' in studyItems[ii] && 'URL' in studyItems[ii].Accession.properties) {dburl = studyItems[ii].Accession.properties.URL.value;}  
               var acclink = '<a href="'+dburl+'" target="_blank">'+accession+'</a>' 
               dbStore.push([acclink, dbname, dburl]) ;            
            }
            showExtDataLinkWin(dbStore) ;

          }
          else
          { // get the Anticipated Data Repository value
            var antData = studyDoc.Study.properties['Anticipated Data Repository'].value ;
            showAntDataWin(antData + "<br> Additional text here . . .") ;
          }
        }
        else
        {
          var displayMsg = "No Study document - " +studies[0]+ "found in the Studies Collection. Please contact a project admin to resolve this issue."
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving the data link from the Studies collection :<br><br>"
         displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
         displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
         displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
         Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  }) ;
}

function getCrossCollTransformation(typeName)
{
  var message = "" ;
  var url =  urlMount+'/projects/'+projectId+'/exat/transformDocs';
  Ext.Ajax.request(
  {
    url : url,
    // timeout is large - if the response is not cached will be much longer for the first time
    timeout : 240000,
    method: 'GET',
    params:
    {
      transformColl:  atlasSettings.analysesColl,
      transformationName: gridName,
      "authenticity_token" : csrf_token,
    },
    callback: function(opts, success, response)
    {
      var trObj = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && trObj)
      {
        var trObj = JSON.parse(response.responseText) ;
        // gets the column, fields and data for the grid
        var storefields = getStoreForCrossColl(trObj, response.request.options.params.transformationName) ;
        // load the store
        var crossStore = Ext.getCmp(response.request.options.params.transformationName).store ;
        var fields = crossStore.model.prototype.fields ;
        for(var ii=0; ii<storefields[0].length; ii++)
        {
          fields.add(Ext.create("Ext.data.Field", {
            name: storefields[0][ii]
          }));
        }
          Ext.getCmp(response.request.options.params.transformationName).reconfigure(null, storefields[1]) ;
          crossStore.loadData(storefields[2]) ;
          Ext.getCmp('maskCrossTable').destroy();
      } 
      else
      {
        if(trObj)
        {
          var grStatusObj   = trObj['status'] ;
          message = grStatusObj['msg'] + "<br>" ;
        }
        message = message + "API Failed to get the grid data" + response.status + ', ' + response.statusText;
        Ext.Msg.alert("ERROR",  message) ;
        Ext.getCmp('maskCrossTable').destroy();
      }
    }
  }) ;
}


//function getResultUrlsForBiosamples(biosamples, resultFiletype, activateToolSettings, gridID, gaEventId)
//tasktype - activate tool or download
function getResultUrlsForBiosamples(biosamples, resultFiletype, gaEvId, tasktype)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/resultUrls';
  // get the outputs for the tool job
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'POST',
    params: 
    {
      coll: atlasSettings.resultFilesColl,
      biosampleIDs : biosamples.join(","),
      type : resultFiletype, // core or result
      "authenticity_token" : csrf_token
      
    },
    callback: function(opts, success, response)
    {
      var results = response.responseText ;
      var respObj = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && respObj)
      {
        if(resultFiletype == "core")
        {
          if('data' in  respObj && respObj.data.length == 0)
          {
            Ext.Msg.alert("ERROR", "No result urls for the selection. The selected samples are probably of the assay type (qpcr) that contain no result urls.") ;
            if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
            if(Ext.getCmp('maskdownload')) {Ext.getCmp('maskdownload').destroy() ; }
          }
          else if(tasktype && tasktype == "tooljob") 
          {
            // gather inputs and outputs and post to the job submit route
            console.log("toolSelected  " + toolSelected) ;
            var inputs = [] ;
            var outputs = [] ; 
            if('data' in  respObj && respObj.data.length == 0)
            {
              Ext.Msg.alert("ERROR", "No result urls for the selection") ;
            }
            else
            {
             if('data' in respObj) {respObj = respObj.data ;}
            
              for(var sample in respObj) 
              {  
                if(respObj[sample]){
                  inputs.push(respObj[sample]) ;
                  // get the sample name for DESeq2
                  if(toolSelected == "DESeq2") { dseqFileLineList.biosamples[sample][0] = getSampleNameFromCoreFileUrl(respObj[sample]) ;}
                }
                else { if(toolSelected == "DESeq2") delete dseqFileLineList.biosamples[sample] ;} 
              }
            }
            if(inputs.length < 1) {Ext.Msg.alert("ERROR", "The selected samples has no core results file to submit the tool.") ;}
            else { 
             outputs.push(toolSettings.dbUri) ;
              toolSettings.inputs = inputs ;
              toolSettings.outputs = outputs ;
              if(toolSelected == "DESeq2") { makeAndUploadFileForDseq2();}
              else {submitToolJob(); }
            }
          }
          else
          {
            makedownloadFile(true, respObj, gaEvId); 
          }
        } 
        else if(resultFiletype == "result" || resultFiletype =="exogenousGenome" || resultFiletype =="exogenoustaxonomy" || resultFiletype == "rRNAtaxonomy")
        {
          if('data' in  respObj && respObj.data.length == 0)
          {
            Ext.Msg.alert("ERROR", "No result urls for the selection. The selected samples are probably of the assay type (qpcr) that contain no result urls.") ;
            if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
            if(Ext.getCmp('maskdownload')) {Ext.getCmp('maskdownload').destroy() ; }
          }
          else {makedownloadFile(false, respObj, gaEvId); }
        }
        
      else
      {
        var displayMsg = "The following error was encountered while retrieving the result files link from the Result Files collection :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
        if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
        if(Ext.getCmp('maskdownload')) {Ext.getCmp('maskdownload').destroy() ; }
      }
    }
   }
  });
}

function getProfileTable()
{
  var url = urlMount+'/projects/'+projectId+'/exat/prjdata/studiesGrData.json';
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 120000,
    method: 'GET',
    params:
    {
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var profileTable = JSON.parse(response.responseText) ;
        gridValues = [] ;
        for (an in profileTable)
        {
          if(profileTable[an].Website) {
            var organization = "<a href="+profileTable[an].Website+" target=_blank>"+profileTable[an].Organization+"</a>" ;
          } else {
            var organization = profileTable[an].Organization;
          }
          gridValues.push(['&nbsp;<b><a href=javascript:makeAnPanel("'+an+'")>'+an+'</a></b>', profileTable[an].StudyTitle, profileTable[an].NumberOfSamples, profileTable[an].Reference, profileTable[an].ExtDBRefs, '&nbsp;<a href=mailto:'+profileTable[an].PIEmail+'>'+profileTable[an].PI+'</a>', profileTable[an].CoPINames, profileTable[an].FundingSource, profileTable[an].Grant, organization, an]) ;
        }
        // load the analysis table store and remove the mask
        var anStor = Ext.getCmp('analysisTable').store ;
        anStor.loadData(gridValues) ;
        Ext.getCmp('maskanalysisTable').destroy();
      }
      else if(response.status == 404)
      {
         // get the config and get the datasets grid dynamically
         readTransformationsFromConfigAndLoadStore() ;
      }
      else
      {
        var displayMsg = "The following error was encountered while getting data from the datasets cache file studiesGrData' :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}

// read the transformation and other config params for the datasets page
function readTransformationsFromConfigAndLoadStore()
{
  var url = buildConfPath("studiesProfileConf.json") ;
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 9000,
    method: 'GET',
    params:
    {
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var resp = response.responseText;
        dataSetsConf = JSON.parse(response.responseText) ;
        getdynamicProfile() ;
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving configuration file for the datasets grid <br><br>" ;
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}


function getdynamicProfile() 
{
  var url = urlMount+'/projects/'+projectId+'/exat/studiesGrData';
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 240000,
    method: 'GET',
    params:
    {
      apiMethod : 'GET',
      transformationName:  dataSetsConf.transformation.join(","),
      writeToFile: true
    },
    callback: function(opts, success, response)
    {
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var profileTable = JSON.parse(response.responseText) ;
        gridValues = [] ;
        for (an in profileTable)
        {
          if(profileTable[an].Website) {
            var organization = "<a href="+profileTable[an].Website+" target=_blank>"+profileTable[an].Organization+"</a>" ;
          } else {
            var organization = profileTable[an].Organization;
          }
          gridValues.push(['&nbsp;<b><a href=javascript:makeAnPanel("'+an+'")>'+an+'</a></b>', profileTable[an].StudyTitle, profileTable[an].NumberOfSamples, profileTable[an].Reference, profileTable[an].ExtDBRefs, '&nbsp;<a href=mailto:'+profileTable[an].PIEmail+'>'+profileTable[an].PI+'</a>', profileTable[an].CoPINames, profileTable[an].FundingSource, profileTable[an].Grant, organization, an]) ;
        }
        // load the analysis table store and remove the mask
        var anStor = Ext.getCmp('analysisTable').store ;
        anStor.loadData(gridValues) ;
        Ext.getCmp('maskanalysisTable').destroy();
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving data for the datasets table from the transformations' :<br><br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}

function fillAnalysisGrid(docName)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/doc' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.analysesColl,
      docId: docName,
      "authenticity_token" : csrf_token
    },
    method: 'GET',
    success: getAnalysisData,
    failure: displayFailureDialog
  }) ;
}

function getAnalysisTransformationOrRender(documentName)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/transformDoc';
  var message = '' ;
  
  // render the empty grid with mask before tranformation data is retrieved
  renderAnalysisTransformationGrid('searchGrid');
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      transformColl:  atlasSettings.analysesColl,
      transformationName: "exRNAAnalysis",
      docId : documentName,
      "authenticity_token" : csrf_token
    },
    callback: function(opts, success, response)
    {
      var gridTable = response.responseText ;
      if(response.status >= 200 && response.status < 400 && gridTable)
      {
        var trObj = JSON.parse(response.responseText) ;
        // gets store, fields and columns from a tansformed data
        // also gets additional common column configs and data - qcmetrics, fastqurls info, etc
        var gridparams = getStoreFromOutput(trObj) ;
      }
      else
      {
        message = message + "API Failed to get the transformation output for the document " +documentName+ "<br>" + "DETAILS: " + response.status + ', ' + response.statusText;
        Ext.Msg.alert("ERROR",  message) ;
        if(Ext.getCmp('maskreadCountsTable')){Ext.getCmp('maskreadCountsTable').destroy();}
      }
    }
  }) ;
}


function getBiosamplesAndRender(andoc)
{
  var url =  urlMount+'/projects/'+projectId+'/exat/doc' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 120000,
    method: 'GET',
    params:
    {
      coll : atlasSettings.analysesColl,
      docId: andoc,
      "authenticity_token" : csrf_token
    },
    callback: function(opts, success, response)
    {
      var andoc = response.responseText ;
      if(response.status >= 200 && response.status < 400 && andoc)
      {
         var anDoc = JSON.parse(response.responseText) ;
         var bioItems = [] ;
         if('Data Analysis Level' in anDoc['Analysis']['properties'] && 'Type' in anDoc['Analysis']['properties']['Data Analysis Level']['properties'] && 'qPCR Data Analysis Level' in anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties'])
         {
           bioItems = anDoc['Analysis']['properties']['Data Analysis Level']['properties']['Type']['properties']['qPCR Data Analysis Level']['properties']['Biosamples']['items'] ;
         }
         var gridStore = [] ;
         subjectsinStore = [] ;
         // initialize the grid config objects
         gridConfig.fastqDb = new Object()
         gridConfig.qcMetrics = new Object() ;
         // go through the biosamples that match the count of the number
         // of facets selected
         for(var ii=0; ii<bioItems.length;  ii++)
         {
           gridStore.push([bioItems[ii]['Biosample ID']['value'],  '<a href="'+urlMount+'/genboree_kbs?project_id='+projectId+'&coll='+atlasSettings.biosamplesColl+'&doc='+bioItems[ii]['Biosample ID']['value']+'&docVersion=" target="_blank">'+bioItems[ii]['Biosample ID']['value']+'</a>', bioItems[ii]['Biosample ID']['value']]) ;
           subjectsinStore.push(bioItems[ii]['Biosample ID']['value']) ;
        }
        if(gridStore.length > 0)
        {
        // see ajax.js for the following functions
          getfastqAndDbForBiosamples(subjectsinStore) ;
          qcMetricsForBiosamples(subjectsinStore) ;
          getBiosampleMetFromSubs(subjectsinStore, gridStore) ;
        }
      }
      else
      {
        var message = "" ;
        message = message + "API Failed to get the analysis document " +andoc+ "<br>" + "DETAILS: " + response.status + ', ' + response.statusText;
        Ext.Msg.alert("ERROR",  message) ;
        if(Ext.getCmp('maskreadCountsTable')){Ext.getCmp('maskreadCountsTable').destroy();}
      }
    }
  }) ;
}


// get the groups associated with user login
function getGrpStore()
{
  
  var gpath = urlMount+'/projects/'+projectId+'/exat/userGrps';
  Ext.define('grps', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : gpath,
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         },
         extraParams : {
           "authenticity_token" : csrf_token,
            user: atlasSettings.gbLogin,
         },
          listeners: {
            exception: function(proxy, response, operation, eOpts) {
            if(Ext.getCmp('toolWindow')) {Ext.getCmp('toolWindow').close() ;}
            try { var apiRespObj  = JSON.parse(response.responseText) ;}
            catch(err) {
              var displayMsg = 'The following error was encountered while fetching the Genboree Groups <br><br>' ;
              displayMsg += ( "<br><b>Error Code:</b> <i>" + (response['status'] ? response['status'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
              displayMsg += ( "<b>Error Message:</b> <i>" + (response['statusText'] ? response['statusText'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
              Ext.Msg.alert("ERROR", displayMsg) ;
            }
            if(apiRespObj)
            {
              var statusObj   = apiRespObj['status'] ;
              var displayMsg = 'The following error was encountered while fetching the Genboree Groups <br><br>' ;
              displayMsg += ( "<br><b>Error Code:</b> <i>" + (statusObj['statusCode'] ? statusObj['statusCode'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
              displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
              Ext.Msg.alert("ERROR", displayMsg) ;
           }
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

function checkWriteGrpPermissions(grpName)
{
  var url = urlMount+'/projects/'+projectId+'/exat/grpPerm' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 90000,
    params:
    {
      grp: grpName,
      "authenticity_token" : csrf_token,
      user: atlasSettings.gbLogin

    },
    method: 'GET',
    success: roleSuccess,
    failure: grpFailureDialog
  }) ;

}

function getDbStore()
{
  var url = urlMount+'/projects/'+projectId+'/exat/usrDbs' ;
  Ext.define('dbs', {
     extend: 'Ext.data.Model',
       proxy: {
         type: 'ajax',
         url : url,
         timeout : 90000,
         reader: {
           type: 'json',
           root: 'data'
         },
         extraParams : {
           // grp param will be added once the group is chosen
           "authenticity_token" : csrf_token
         },
          listeners: {
            exception: function(proxy, response, operation, eOpts) {
            if(Ext.getCmp('toolWindow')) {Ext.getCmp('toolWindow').close() ;} 
            var apiRespObj  = JSON.parse(response.responseText) ;
            var statusObj   = apiRespObj['status'] ;
            var displayMsg = 'The following error was encountered while fetching the databases <br><br>';
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
          if(records.length == 0 ) { 
            console.log(records) ; 
            var displayMsg = "No data bases are located for the group selected. A new data base - Exrna-atlasOutput will be created for you and the tool job results will be deposited in this database."
            Ext.Msg.alert("NO DATABASES FOUND", displayMsg) ;
            //Ext.getCmp('dbCombo').setValue("ExRNA_Atlas") ;
            //var store = Ext.getCmp('dbCombo').getStore() ;
            //console.log(store) ;
            //store.loadData([["ExRNA_Atlas"]]);
            //var nextRecord = store.getAt( 0 );
            //console.log(nextRecord) ;
             //Ext.getCmp('dbCombo').select(nextRecord) ;
            createNewDb() ;
           } 
        }
        else {
          if('error' in operation && 'response' in operation.error && 'responseText' in operation.error.response) {
            var apiRespObj  = JSON.parse(operation.error.response.responseText) ;
            var statusObj   = apiRespObj['status'] ;
            if(Ext.getCmp('toolWindow')) {Ext.getCmp('toolWindow').close() ;}
            var displayMsg = "The following error was encountered while retreiving databases: <br>" ;
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



function createNewDb()
{
  var dbName = 'Exrna-atlasOutput' ;
  var url = urlMount+'/projects/'+projectId+'/exat/createDb' ;
  var grpname = Ext.getCmp('grpCombo').getValue() ;
  Ext.Ajax.request({
    url : url,
    timeout : 90000,
    method: 'POST',
    params:
    {
      dbname: "Exrna-atlasOutput",
      grpname: grpname,
      "authenticity_token" : csrf_token
    },
    callback: function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && respObj)
      {
         // successfully created new database
         var store = Ext.getCmp('dbCombo').getStore() ;
         store.loadData([["Exrna-atlasOutput"]]);
         var nextRecord = store.getAt( 0 );
         console.log(nextRecord) ;
         Ext.getCmp('dbCombo').select(nextRecord) ;
         if(Ext.getCmp('factorset')) { Ext.getCmp('factorset').enable() ;}
      }
      else
      {
        var displayMsg = "The following error was encountered while creating new database - " +Exrna-atlasOutput + "<br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        var statusObj   = respObj['status'] ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }

  }) ;
}

function submitToolJob(inputs, outputs)
{
   var url =  urlMount+'/projects/'+projectId+'/exat/tooljobSubmit' ;
   Ext.Ajax.request(
   {
     url : url ,
     timeout : 120000,
     method: 'POST',
     params:
     {
      "authenticity_token" : csrf_token,
      inputs: toolSettings.inputs.join(","),
      outputs: toolSettings.outputs.join(","),
      toolIdStr: toolSelected,
      factorName: ('factorName' in toolSettings) ? toolSettings.factorName : null,
      factorLevel1: ('factorLevel1' in toolSettings) ? toolSettings.factorLevel1 : null,
      factorLevel2: ('factorLevel2' in toolSettings) ? toolSettings.factorLevel2 : null
    },
    callback: function(opts, success, response)
    {
      var respObj  = JSON.parse(response.responseText) ;
      if(response.status >= 200 && response.status < 400 && respObj)
      {
        console.log("JOB sbmitted. . .")
        var jobId = respObj.data.text ;
        var displayMsg =  '<b>JobId: </b> '+ jobId + '<br><br>' ;

        displayMsg += 'Your job has been successfully submitted. You will be notified by email when your job has completed. <br>'
        displayMsg += 'Please log in to <a href='+'"http://'+atlasSettings.jobHost+'/java-bin/workbench.jsp" target="_blank">Genboree Workbench</a> and follow the instructions in your email to view the job results. <br>' ;
        Ext.Msg.alert("JOB SUBMISSION STATUS", displayMsg) ;
        if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
      }
      else
      {
        var displayMsg = "The following error was encountered while submitting job for the tool - " +toolSelected + "<br>"
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        var statusObj   = respObj['status'] ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (statusObj['msg'] ? statusObj['msg'] : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
        if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
      }
    }
  }) ;

}




// called after getting all the core result file urls, which are 
// set of inputs.
// Upload the metadata file to the user db
// This file is one of the inputs 
function makeAndUploadFileForDseq2()
{
  // 2. Insert it into the toolSettings var as one of the inputs
  var metadatapath = toolSettings.dbUri + "/file/"+encodeURIComponent(toolSettings.dseqfilename) ;
  toolSettings.inputs.push(metadatapath) ;
  // post the content to the controller
  var url = urlMount+'/projects/'+projectId+'/exat/uploadFile' ;
  Ext.Ajax.request(
  {
    url : url,
    timeout : 90000,
    params:
    {
      "authenticity_token" : csrf_token,
      filename: toolSettings.dseqfilename,
      db: toolSettings.db,
      grp: toolSettings.grp,
      payload: JSON.stringify(dseqFileLineList),
      inputs: toolSettings.inputs.join(","),
      outputs: toolSettings.outputs.join(","),
      toolIdStr: toolSelected,
      factorName: ('factorName' in toolSettings) ? toolSettings.factorName : null,
      factorLevel1: ('factorLevel1' in toolSettings) ? toolSettings.factorLevel1 : null,
      factorLevel2: ('factorLevel2' in toolSettings) ? toolSettings.factorLevel2 : null
    },
    method: 'POST',
    success: filepostsuccess,
    failure: displayFailureDialogDb
  }) ;
}


function filepostsuccess(result, request)
{
   var respObj  = JSON.parse(result.responseText) ;
   var jobId = respObj.data.text ;
   var displayMsg =  '<b>JobId: </b> '+ jobId + '<br><br>' ;
   displayMsg += 'Your job has been successfully submitted. You will be notified by email when your job has completed. <br>'
   displayMsg += 'Please log in to <a href='+'"http://'+atlasSettings.jobHost+'/java-bin/workbench.jsp" target="_blank">Genboree Workbench</a> and follow the instructions in your email to view the job results. <br>' ;
   Ext.Msg.alert("JOB SUBMISSION STATUS", displayMsg) ;
   if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
}

function getSampleNameFromCoreFileUrl(coreUrl)
{
  var retVal = null ;
  var spl1 = coreUrl.split("/CORE_RESULTS/") ;
  var spl2 = spl1[0].split("/") ;
  retVal = spl2[spl2.length-1] ;
  return retVal
}


function displayFailureDialogDb(result, request)
{
  var message = "";
  var jsonData = Ext.JSON.decode(result.responseText) ;
  if(Ext.getCmp('masksearch')) {Ext.getCmp('masksearch').destroy() ; }
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
function getGbKey()
{
  var url = buildConfPath("generalGridConf.json") ;
  Ext.Ajax.request(
  {
    url : url ,
    timeout : 9000,
    method: 'GET',
    params:
    {
      apiMethod : 'GET'
    },
    callback: function(opts, success, response)
    {
      if(response.status >= 200 && response.status < 400 && response.responseText)
      {
        var resp = response.responseText;
        respObj = JSON.parse(response.responseText) ;
        gbKey = respObj.gbKey ;
      }
      else
      {
        var displayMsg = "The following error was encountered while retrieving configuration file for general grid configs <br><br>" ;
        displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
        displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
        displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
        Ext.Msg.alert("ERROR", displayMsg) ;
      }
    }
  });
}

function getDatasetsPostProcessingFiles(docId, processId)
{
  // if docid in global var, then request was prviously made, check for the processId
  if(docId in postProcessFiles)
  {
    if(postProcessFiles[docId][processId])
    {
     var fileUrl = postProcessFiles[docId][processId] ;
     //if(gbKey && !(isPublic)){ fileUrl = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true'; }
     //else { fileUrl = fileUrl+'/data?&downloadAsFile=true' ; }
     window.open(fileUrl) ;
     console.log("GA to DownloadPostProcess") ;
     sendToGA('send', 'event', 'DownloadPostProcess', processId, docId, 1) ;
     if(Ext.getCmp('maskdownload')) Ext.getCmp('maskdownload').destroy();
    }
    else
    {
     // no url, no property, different assay, etc
     Ext.Msg.alert( "RESULT FILE NOT FOUND", "Failed to locate result file for this Dataset. The dataset could belong to an incompatible assay type or is outdated.<br>") ;
     if(Ext.getCmp('maskdownload')) Ext.getCmp('maskdownload').destroy();
    }

  }
  else
  {
    var analysisDocPath = urlMount+'/projects/'+projectId+'/exat/postPro' ;

    Ext.Ajax.request(
    {
      url : analysisDocPath,
      timeout : 90000,
      method: 'GET',
      params:
      {
        coll : atlasSettings.analysesColl,
        docId: docId,
        "authenticity_token" : csrf_token
      },
      callback: function(opts, success, response)
      {
        var results = response.responseText ;
        if(response.status >= 200 && response.status < 400 && results)
        {
          var respObj = JSON.parse(response.responseText) ;
          postProcessFiles[docId] = respObj[docId] ;
          if(postProcessFiles[docId][processId])
          {
            var fileUrl = postProcessFiles[docId][processId] ;
            //if(gbKey && !(isPublic)){ fileUrl = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true'; }
            //else { fileUrl = fileUrl+'/data?&downloadAsFile=true' ; }
            window.open(fileUrl) ;
            console.log("GA to DownloadPostProcess") ;
            sendToGA('send', 'event', 'DownloadPostProcess', processId, docId, 1) ;
            if(Ext.getCmp('maskdownload')) Ext.getCmp('maskdownload').destroy();
          }
          else
          {
            // no url, no property, different assay, etc
            if(Ext.getCmp('maskdownload')) Ext.getCmp('maskdownload').destroy();
            Ext.Msg.alert( "RESULT FILE NOT FOUND", "Failed to locate result file for this Dataset. The dataset could belong to an incompatible assay type or is outdated.<br>") ;
          }
        }
        else
        {
          var displayMsg = "The following error was encountered while retrieving doc " + docId +" from the " + atlasSettings.analysesColl+ " collections <br><br>" ;
          displayMsg += ( "<b>Error Code:</b> <i>" + (response.status ? response.status : "[ NOT INTELLIGIBLE ]") + "</i><br>" ) ;
          displayMsg += ( "<b>Error Message:</b> <i>" + (response.statusText? response.statusText : "[ NOT INTELLIGIBLE ]") + "</i><br>" );
          displayMsg += "<br><br>Please contact a project admin to resolve this issue." ;
          Ext.Msg.alert("ERROR", displayMsg) ;
        }
     }
   });
  }

}
