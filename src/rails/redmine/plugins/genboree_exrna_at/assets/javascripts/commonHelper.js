// validates the atlas settings
// Used both by the atlas entry and grid entry
function validateSettings()
{
 var retVal = false ;
  /* Check if all the config options have been set properly */
  if (atlasSettings && atlasSettings.gbHost != ''  && atlasSettings.gbGroup != '' && atlasSettings.gbKb != '' && atlasSettings.analysesColl != '' && atlasSettings.biosamplesColl != '' && atlasSettings.donorsColl != '' && atlasSettings.runsColl != '' && atlasSettings.experimentsColl != '' && atlasSettings.resultFilesColl != '' && atlasSettings.studiesColl != '' && atlasSettings.jobsColl != '' && atlasSettings.submissionsColl != '' && atlasSettings.jobHost != '') { 
    retVal = true ;
  }
  else {
    Ext.Msg.alert('Incorrect Settings', "Please make sure the following fields are set properly:</br>ExRNA Atlas Host</br>ExRNA Atlas Group</br>ExRNA Atlas Kb</br>ExRNA Atlas Data Collections</br>Genboree Tool Job Host</br>Contact the project administrator for help with setting up the application.") ;
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

// Adds iframe for downloading files via browser
function appendIframe(src)
{
  Ext.DomHelper.append(document.body, {
    tag: 'iframe',
    frameBorder: 0,
    width: 0,
    height: 0,
    css: 'display:none;visibility:hidden;height:1px;',
    src: src
  });
}

function getDatasetsPostProcessingFilesWithDataAccess(docId, processId)
{
  if(askDataAccess)
  {
    var searchMask = new Ext.LoadMask(Ext.getCmp('analysisTable'),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
    searchMask.show() ;
    getDatasetsPostProcessingFiles(docId, processId)
  }
  else {askForDataAccess(processId, docId)}
}


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
      var maskFor ;
      if (Ext.getCmp('analysisTable')) {maskFor = 'analysisTable'}
      else if (Ext.getCmp('searchGrid')) {maskFor = 'searchGrid'}
      var searchMask = new Ext.LoadMask(Ext.getCmp(maskFor),
               {
                 msg:"Downloading . . .",
                 id: 'maskdownload'
               });
       askDataAccess = true ;
       if(eventId == 'DownloadCore')
       {
         searchMask.show();
         getResultUrlsForBiosamples(opts[0], "core", eventId) ;
       }
       else if(eventId == 'DownloadRawResult')
       {
         searchMask.show();
         getResultUrlsForBiosamples(opts[0], "result", eventId) ;
       }
       else if(eventId == 'DownloadFullExoResult')
       {
         searchMask.show();
         getResultUrlsForBiosamples(opts[0], "exogenousGenome", eventId) ;
       }
       else if(eventId == 'DownloadFullExoTaxonomy')
       {
         searchMask.show();
         getResultUrlsForBiosamples(opts[0], "exogenoustaxonomy", eventId) ;
       }
       else if(eventId == 'DownloadFullrRNATaxonomyTree')
       {
         searchMask.show();
         getResultUrlsForBiosamples(opts[0], "rRNAtaxonomy", eventId) ;
       }
       else if(eventId == 'singledownload')
       {
         getResultUrlForBiosample(opts[0], opts[1]) ;
       }
       else if(eventId == 'DownloadRawData')
       {
          searchMask.show();
         downloadFastqUrlsForBiosamples(opts[0], eventId) ;
       }
       else if(eventId == 'biodoc')
       {
          appendIframe('download?authenticity_token='+csrf_token+'&coll='+escape(atlasSettings.biosamplesColl)+'&docId='+escape(opts[0])+'&download_format=tabbed_prop_nesting') ;
          groupSelectionsForGA("DownloadMeta", null, opts[1]) ;
          
       }
       else if(eventId == 'expdoc')
       {
         getDonorOrExpFromBiosample(opts[0], "experimentsColl", false)
          groupSelectionsForGA("DownloadMeta", null, opts[2]) ;
       }
       else if(eventId == 'donordoc')
       {
          getDonorOrExpFromBiosample(opts[0], "donorsColl", false)
          groupSelectionsForGA("DownloadMeta", null, opts[2]) ;
       }
       else if(eventId == 'singlefastq')
       {
         var fileUrl = gridConfig.fastqDb[opts[0]].fastq ;
         var res =  fileUrl.match(/^ftp/) ? true : false
         if(res == true) {
         }
         else
         {
           if(gbKey && !(isPublic)){ window.location = fileUrl+'/data?gbKey='+gbKey+'&downloadAsFile=true';}
           else {fileUrl = fileUrl+'/data?&downloadAsFile=true'}
         }
        window.open(fileUrl);
         groupSelectionsForGA("DownloadRawData", null, opts[1]) ;
       }
       else if(eventId == 'exogenousGenome')
       {
         getResultUrlForBiosample(opts[0], opts[1], 'exogenousGenome') ;
       }
       else if(eventId == 'taxonomy')
       {
          getResultUrlForBiosample(opts[0], opts[1], 'taxonomy') ;
       }
       else if(eventId == 'result')
       {
         getResultUrlForBiosample(opts[0], opts[1], 'result') ;
       }
       else if(eventId ==  'rRNAtaxonomy')
       {
         getResultUrlForBiosample(opts[0], opts[1], 'rRNAtaxonomy') ;
       }
       else if(eventId == 'DownloadMetadata')
       {
         var biosample = opts[0] ;
         getDonorOrExpFromBiosample(biosample, null, true, eventId)
        }
       else if(eventId == 'diagnosticPlot' || eventId == 'ribosomal' || eventId == 'miRNAreadCounts' || eventId == 'exogenous' || eventId == 'postProcessArchive')
       {
         searchMask.show() ;
         getDatasetsPostProcessingFiles(opts, eventId) ;
       }
     }
    }    
  });
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
        { name : 'dburl'}
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
    //html: '<div class="embargo" align="left">This data is restricted access and is currently under the protected period (embargo). The embargo on this dataset ends on 07/01/2016. <br>Please refer to the <a href=\"http://exrna.org/resources/data/data-access-policy\" target=\"_blank\">ERCC Data Sharing Policy document<a> for more details.'
    html: '<div class="embargo" align="left">Links to external databases for this sample are forthcoming.'
  });
  popWin.show();
  popWin.center() ;

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




function makedownloadFile(core, fileUrls, gaEvId)
{
  var filecontent = '' ;
  var datapol =  getDatapolicy() ;
  var downloadableUrls = [];
  var downloadablebiosamples = new Object() ;
  filecontent += datapol ;
  for(var key in fileUrls)
  {
    /** Filter dbGap */
    if(fileUrls[key]) // file urls absent for assays like qPCR
    {
      if(core == true || (core == false && gridConfig.fastqDb[key].dbnames[0] != 'dbGaP'))
      {
        var filename = fileUrls[key].split("/").pop() ;
        var res =  fileUrls[key].match(/^ftp/) ? true : false
        if(res == false) {
          var newUrl = fileUrls[key].replace("\/file\/", "/fileData/") ;
          if(gbKey && !(isPublic)) {newUrl += "?gbKey="+gbKey ;}
        }
        else {
          var newUrl = fileUrls[key] ;
        }
        filecontent = filecontent+filename+"\t"+newUrl+"\n" ;
        downloadableUrls.push(newUrl) ;     
        downloadablebiosamples[key] = true ; 
      }
    }
  }
  /** 
   * Send the urls to a browser as a file
   * Make a file only if there are files to download
   */
  if(downloadableUrls.length > 0){
    groupSelectionsForGA(gaEvId, downloadablebiosamples) ;
    if(core == true) {var filename = 'CoreResults' ;}
    else {var filename = gaEvId ;}
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
    if(Ext.getCmp('maskdownload')){Ext.getCmp('maskdownload').destroy();}
  }
  else{
    if(Ext.getCmp('maskdownload')) {Ext.getCmp('maskdownload').destroy(); }
    if(core == true) {
      Ext.Msg.alert("DATA_UNAVAILABLE", "CORE results are not available for the samples with qPCR assay type" ) ;
    }
    else
    {
      Ext.Msg.alert("FILES_CONTROLLED_ACCESS", "All the raw data files are in a controlled access archive like dbGaP. You can only download the core results files for the selected samples. " ) ;
    }
  }  
}

function downloadFastqUrlsForBiosamples(biosamples, gaEvId)
{
 
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
    groupSelectionsForGA(gaEvId, downloadableBiosamples) ;
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

// fire events from the selections - check if any selections are to be filtered
// Either use record of interest from the recFromStore
// Or use it from the selections
function groupSelectionsForGA(eventCategory, filterBiosamples, recFromStore)
{

  var gaEvents  = new Object() ;
  var selections = [] ;
  var groups = ["PIs", "Fluids", "Diseases", "Experiments", "Sources", "Kits"] ;
  
  for(var gg=0; gg<groups.length; gg++) { gaEvents[groups[gg]] = new Object() ;}
  /** get the selections for the grid */
  if(recFromStore)
  {
    console.log("Data from the store") ;
    selections = [recFromStore] ;
  }
  else
  {
    console.log("Data from the selection") ;
    selections = Ext.getCmp('searchGrid').getSelectionModel().getSelection() ;
  }
  if(selections && selections.length > 0) { /** no events to send */  }
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
      var pi = selections[ii].data.biosample.substring(0, 10) ;
      if(pi in gaEvents.PIs) { gaEvents.PIs[pi]++ ;}
      else { gaEvents.PIs[pi] = 1 ;}
      if('fluid' in selections[ii].data) { fluid = selections[ii].data.fluid ; }
      if(fluid){
        if(fluid in gaEvents.Fluids) { gaEvents.Fluids[fluid]++ ;}
        else { gaEvents.Fluids[fluid] = 1 ;}
      }
      if('disease' in selections[ii].data) {dis = selections[ii].data.disease ; }
      if(dis) {
        if(dis in gaEvents[groups[2]]) { gaEvents[groups[2]][dis]++ ;}
        else { gaEvents[groups[2]][dis] = 1 ;}
      }
      if("source" in selections[ii].data) {
        var src = selections[ii].data.source ;
        if(src in gaEvents.Sources) { gaEvents.Sources[src]++ ;}
        else { gaEvents.Sources[src] = 1 ;}
     } 
     if('rnakit' in selections[ii].data)
      {
        var kit = selections[ii].data.rnakit ;
        if(kit in gaEvents.Kits) {gaEvents.Kits[kit]++ ;}
        else {gaEvents.Kits[kit] = 1 ;}
      }
      if('assay' in selections[ii].data)
      {
        var assay = selections[ii].data.assay ;
        if(assay in gaEvents.Experiments) {gaEvents.Experiments[assay]++ ;}
        else {gaEvents.Experiments[assay] = 1 ;}

      }
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
          console.log(eventCategory) ;
          console.log(groups[ii]) ; 
          console.log(key) ; 
          console.log(gaEvents[groups[ii]][key]) ; 
          sendToGA('send', 'event', eventCategory, groups[ii], key, gaEvents[groups[ii]][key]) ;
        }
        else
        {
          break ;
        }
      }
    }

}


function postToSelf(data, name, toolId, reSelectRows) {
    var form = document.createElement("form") ;
    form.method = "post" ;
    form.action = "" ;
    var field = document.createElement("input") ;
    field.setAttribute("type", "hidden") ;
    field.setAttribute("name", name) ;
    field.setAttribute("value", JSON.stringify(data)) ;

    form.appendChild(field) ;
    var fieldcsrf = document.createElement("input") ;
    fieldcsrf.setAttribute("type", "hidden") ;
    fieldcsrf.setAttribute("name", csrf_param) ;
    fieldcsrf.setAttribute("value", csrf_token) ;
    form.appendChild(fieldcsrf) ;
    
    var toolfd = document.createElement("input") ;
    toolfd.setAttribute("type", "hidden") ;
    toolfd.setAttribute("name", "toolSelected") ;
    toolfd.setAttribute("value", toolId) ;
    form.appendChild(toolfd) ;

    if(reSelectRows)
    {
      var toolRows = document.createElement("input") ;
      toolRows.setAttribute("type", "hidden") ;
      toolRows.setAttribute("name", "reSelectRows") ;
      toolRows.setAttribute("value", reSelectRows) ;
      form.appendChild(toolRows) ;
    }
    document.body.appendChild(form) ;

    form.submit() ;
  }

