require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
require 'brl/genboree/kb/kbDoc'
require 'brl/genboree/kb/propSelector'

class GenboreeExrnaAtAsyncGridviewsController < ApplicationController
  include GenboreeExrnaAtHelper
  unloadable

  before_filter :find_project, :find_settings, :authorize_with_public_project
  respond_to :json
  
  def asynctransformDocs()
    collName = params["transformColl"]
    transformationName = params["transformationName"]
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?transform={trans}"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :trans => transformationName}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody["data"]
        jsonResp = JSON(respObj)
      elsif(pBody)
        jsonResp = JSON( pBody )
      else
        jsonResp = "Failed async request"
      end
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, [jsonResp])
    }
    
    $stderr.debugPuts(__FILE__, __method__, "DEBUG", "fieldMap - #{fieldMap.inspect}")
    apiReq.get(rsrcPath, fieldMap)
  end
  
  
  def asynctransformDoc()
    collName = params["transformColl"]
    docId = params["docId"]
    transformationName = params["transformationName"]
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/doc/{doc}?transform={trans}"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :doc => docId , :trans => transformationName}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody['data']
        jsonResp = JSON(respObj)
      elsif(pBody)
        jsonResp = JSON( pBody )
      else
        jsonResp = "Failed async request"
      end
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "STATUS - #{status.inspect}")
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "HEADERS - #{headers.inspect}")
      $stderr.debugPuts(__FILE__, __method__, "DEBUG", "jsonResp - #{respObj.size}")
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, [jsonResp])
    }
    apiReq.get(rsrcPath, fieldMap) 
  end
  
  
  # Gets a set of metadata for a given set of biosample ids
  # Get experiments related metadata from the experiments collection see getMetadataFromExp.
  def asyncgetBiosampleMetadata()
    biosamples = params['biosampleIDs'].split(",")
    collName = params["biosampleColl"]
    payload =  { "hash" =>
      {
        "matchProp" => "Biosample",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => biosamples
      }
    }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    status = ''
    headers = {}
    rebody = ''
    @metadataObj = {}
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody['data']
        metadata = {
          "Biosample Name" => "Biosample.Name",
          "Biofluid Name" => "Biosample.Biological Sample Elements.Biological Fluid.Biofluid Name",
          "Disease Type" => "Biosample.Biological Sample Elements.Disease Type",
          "Anatomical Location" => "Biosample.Biological Sample Elements.Anatomical Location",
          "exRNA Source" => "Biosample.Molecular Sample Elements.exRNA Source",
          "Cell Culture Source" => "Biosample.Biological Sample Elements.Cell Culture Supernatant.Source",
          "Species" => "Biosample.Biological Sample Elements.Species.Scientific Name"
        }
        metadataExp = {
         "RNA Isolation Kit" => "Experiment.exRNA Sample Preparation Protocol.RNA Isolation Method.RNA Isolation Kit",
         "Profiling Assay" => "Experiment.Experiment Type"
        }
        # initialize
        biosamples.inject(@metadataObj){|hh, kk| 
          hh[kk] = {} 
          metadata.each_key{|jj| hh[kk][jj] = "No Data" } 
          metadataExp.each_key{|jj| hh[kk][jj] = "No Data" } 
          hh ;
        }
        # get all the Biosample metadata from each of the bio docs
        expTobiosample = Hash.new{ |hh,kk| hh[kk] = []}# for experiment to biosample connection
        respObj.each {|bioObj|
          bioKB = BRL::Genboree::KB::KbDoc.new(bioObj)
          bioId = bioKB.getPropVal("Biosample")
          @metadataObj[bioId] = {} unless(@metadataObj.key?(bioId))
          metadata.each_key{|met|
            @metadataObj[bioId][met] = bioKB.getPropVal(metadata[met]) rescue nil
          }
          # get all the related experiments to query the experiments collection
          bioPS = BRL::Genboree::KB::PropSelector.new(bioObj)
          relatedExps = bioPS.getMultiPropValues('Biosample.Related Experiments.[].<>') rescue nil
          if(relatedExps and !relatedExps.empty?)
            relatedExps.each {|exp| expTobiosample[exp] << bioId}
          end
        } 
        # get the metadata from Experiments collection
        # another request is made and the final response will be send to the client
         asyncgetMetadataFromExp(expTobiosample)
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
      
  end

  # get experiment metadata for the biosamples
  def asyncgetMetadataFromExp(experimentsToBiosamplesHash={})
    collName = params["experimentsColl"]
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    payload =  { "hash" =>
      {
        "matchProp" => "Experiment",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => experimentsToBiosamplesHash.keys()
      }
    }
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody['data']
        metadata = {
         "RNA Isolation Kit" => "Experiment.exRNA Sample Preparation Protocol.RNA Isolation Method.RNA Isolation Kit",
         "Profiling Assay" => "Experiment.Experiment Type"
        }
        respObj.each {|expObj|
          expKB = BRL::Genboree::KB::KbDoc.new(expObj)
          expId = expKB.getPropVal("Experiment") rescue nil
          metadata.each_key{|met|
            if(experimentsToBiosamplesHash.key?(expId))
              experimentsToBiosamplesHash[expId].each{ |biosample|
                if(@metadataObj.key?(biosample))
                  @metadataObj[biosample][met] = expKB.getPropVal(metadata[met]) rescue nil
                end
              }
            end
          }
        }
        jsonResp = JSON(@metadataObj)
      elsif(pBody)
        jsonResp = JSON( pBody )
      else
        jsonResp = "Failed async request"
      end
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, [jsonResp])
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end

  
  
  
  
  
  
  def asyncqcMetrics()
    collName = params["analysesColl"]
    biosamples = params["biosampleIDs"].split(",")
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    payload =  {"hash" => 
      {
        "matchProp" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Biosamples.Biosample ID",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => biosamples
      }
    }
    @status = ''
    @headers = {}
    @body = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    # child request to be notified as not a async  req
    apiReq.respCallback { |array|
      @status, @headers, body = array
        body.each { |chunk| @body += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(@body) rescue nil
      if(pBody and pBody['data'])
        bodyObj = pBody['data']
        qcMetricsObj = {}
        metadata = ["Reference Genome Reads", "Result", "Transcriptome Genome Ratio", "Transcriptome Reads"]
        biosamples.inject(qcMetricsObj){|hh, kk|
          hh[kk] = {}
          metadata.each {|met| hh[kk][met] = nil}
          hh;
        }
        bodyObj.each{|anDoc|
          anPS = BRL::Genboree::KB::PropSelector.new(anDoc)
          anItems = anPS.getMultiPropItems('Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Biosamples.[]') rescue nil
          if(anItems and !anItems.empty?)
            anItems.each{|item|
              anKb = BRL::Genboree::KB::KbDoc.new(item)
              bioId = anKb.getPropVal('Biosample ID')
              metadata.each {|met|
                qcMetricsObj[bioId][met] = anKb.getPropVal("Biosample ID.QC Metrics.#{met}") if(qcMetricsObj.key?(bioId))
              }
            }
          end
        }
        respObj = JSON(qcMetricsObj)

      elsif(pBody)
        respObj = pBody
      else
        respObj = "Failed to get async response" 
      end
      @headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(@status, @headers, [respObj])
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end



  def asyncresultUrls()
    collName = params["coll"]
    type = params["type"].nil? ? "core" : params["type"]
    biosamples = params["biosampleIDs"].split(",")
    payload =  { "hash" =>
      {
        "matchProp" => "Result Files.Biosample ID",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => biosamples
      }
    }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody["data"]
        fileUrls = {}
        if(type == "core")
          resultpath = 'Core Results Archive File Name'
        elsif(type == 'exogenousGenome')
          resultpath = 'Exogenous Genomic Results Archive File Name'
        elsif(type == 'exogenoustaxonomy')
          resultpath = 'Exogenous Genomic Taxonomy Tree File Name'
        elsif(type == 'rRNAtaxonomy')
          resultpath = 'Exogenous rRNA Taxonomy Tree File Name'
        else
          resultpath = 'Results Archive File Name'
        end
        biosamples.inject(fileUrls){|hh, kk|
           hh[kk] = nil
           hh ;
         }
         # get the result file urls - results or core
         respObj.each {|resDoc|
           resKB = BRL::Genboree::KB::KbDoc.new(resDoc)
           bioId = resKB.getPropVal('Result Files.Biosample ID')
           fileUrls[bioId] = resKB.getPropVal("Result Files.Biosample ID.#{resultpath}.Genboree URL") rescue nil
         }
         jsonResp = JSON(fileUrls)
      elsif(pBody) # failed - no data obj
        jsonResp = JSON(pBody)
      else # failed - no body
        jsonResp = "Failed Async request"
      end
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, [jsonResp])
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end


  def asyncfastqAndDb()
    collName = params["runsColl"]
    biosamples = params["biosampleIDs"].split(",")
    payload =  { "hash" =>
        {
          "matchProp" => "Run.Type.small RNA-Seq.Raw Data Files.Biosample ID",
          "matchLogicOp" => "or",
          "matchMode" => "exact",
          "matchValues" => biosamples
        }
    }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName }
    status = ''
    headers = {}
    rebody = ''
    @combinedResponses = []
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        @combinedResponses << respObj
        @combinedResponses.flatten!
        
        # Go for the next request, match the samples for qPCR
        asyncQpcrRuns()
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end
   
   
  def asyncQpcrRuns()
    collName = params["runsColl"]
    biosamples = params["biosampleIDs"].split(",")
    payload =  { "hash" =>
      {
        "matchProp" => "Run.Type.qPCR.Raw Data Files.Biosample ID",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => biosamples
      }
    }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName }
    @fastqAndDbObj = {}
    studyTobios = {}
    @fastqAndDbObj["studies"] = []
    @fastqAndDbObj["fastqDb"] = {}
    biosamples.inject(@fastqAndDbObj["fastqDb"]){|hh, kk|
      hh[kk] = {}
      hh[kk]["fastq"] = nil
      hh[kk]["show"] = true
      hh[kk]["dbnames"] = []
      hh ;
    }
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        @combinedResponses << respObj
        @combinedResponses.flatten!
        # get the associated studies from each of the run document
        unless(@combinedResponses.empty?)
          @combinedResponses.each{|runDoc|
            runPS = BRL::Genboree::KB::PropSelector.new(runDoc)
            relatedStudies = runPS.getMultiPropValues('<>.Related Studies.[].<>') rescue nil
            stItems = runPS.getMultiPropItems('<>.Type.<>.Raw Data Files.[]') rescue nil
            bios = runPS.getMultiPropValues('<>.Type.<>.Raw Data Files.[].<>') rescue nil
            if(relatedStudies and !relatedStudies.empty?)
              relatedStudies.each{|study|
                # all the studies in a run doc
                @fastqAndDbObj["studies"] << study
                studyTobios[study] = {}
                if(bios and !bios.empty?)
                  # get all the biosamples for each study - used to get all the dbnames wrp to the biosample
                  bios.each{|sample| studyTobios[study][sample] = {} if(@fastqAndDbObj["fastqDb"].key?(sample))}
                end
              }
            end
            # get the fastqdb urls
            if(stItems and !stItems.empty?)
              stItems.each{|sti| 
                stKB = BRL::Genboree::KB::KbDoc.new(sti)
                bioId = stKB.getPropVal('Biosample ID') rescue nil
                @fastqAndDbObj["fastqDb"][bioId]["fastq"] = stKB.getPropVal('Biosample ID.File URL') if(@fastqAndDbObj["fastqDb"].key?(bioId)) 
              }
            end
          }
          asyncgetDbNamesFromStudies(studyTobios)
        else # No run documents found just return the empty hash
          jsonResp = JSON(  @fastqAndDbObj )
          headers['Content-Type'] = "text/plain"
          apiReq.sendToClient(status, headers, [jsonResp])
        end
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        headers['Content-Type'] = "text/plain"
        apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end
   
  # get dbnames from the studies collection
  # dbnames is set to Embargo if dbnames is absent
  def asyncgetDbNamesFromStudies(studyTobios)
    collName = params["studiesColl"]
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName }
    payload =  {"hash" =>
     {
        "matchProp" => "Study",
        "matchLogicOp" => "or",
        "matchMode" => "exact",
        "matchValues" => @fastqAndDbObj["studies"]
      }
   }
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        respObj.each{|study|
          studyPS = BRL::Genboree::KB::PropSelector.new(study)
          studyId = studyPS.getMultiPropValues('<>').first
          dbnames = studyPS.getMultiPropValues('<>.Aliases.[].Accession.dbName') rescue nil
          bios = studyTobios[studyId].keys()
          bios.each {|bio|
            if(dbnames.nil? or (dbnames and dbnames.empty?))
              #No db
              #@fastqAndDbObj["fastqDb"][bio]["dbnames"] = ["Embargo"]
              #@fastqAndDbObj["fastqDb"][bio]["show"] = false
            else
              @fastqAndDbObj["fastqDb"][bio]["dbnames"] = dbnames
            end
          }
        }
        jsonResp = JSON( @fastqAndDbObj)
      elsif(pBody) # failed
        jsonResp = JSON( pBody )
      else # failed
        jsonResp = "Failed async request"
      end
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, [jsonResp])
    }
    apiReq.get(rsrcPath, fieldMap, payload.to_json)
  end
  


  def getDoc()
    collName = params["coll"]
    docId = params["docId"]
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :doc => docId }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/doc/{doc}"
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, @project)
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, JSON.generate(apiReq.apiDataObj))
    }
    apiReq.get(rsrcPath, fieldMap)
  end


  def getDocs()
    collName = params["coll"]
    detailed = params["detailed"].nil? ? false : true
    payload =  {  
        "matchLogicOp" => "or",
        "matchMode" => "exact"
    }
    payload["matchProp"] = params["matchProp"] if(params.key?('matchProp'))
    payload["matchProps"] = params["matchProps"].split(",") if(params.key?('matchProps'))
    payload["matchValues"] = params["matchValues"].split(",") if(params.key?('matchValues'))
    payload["matchValue"] = params["matchValue"] if(params.key?('matchValue'))
    payloadEnt = {"hash" => payload}
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed={det}"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :det => detailed}
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, @project) 
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      apiReq.sendToClient(status, headers, JSON.generate(apiReq.apiDataObj))
    }
    apiReq.get(rsrcPath, fieldMap, payloadEnt.to_json)
 
  end

   # download kbdoc as an attachment
   def download()
     downloadFormat = params['download_format']
     rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/doc/{doc}"
     if( downloadFormat != 'json' )
       rsrcPath << "?format=#{downloadFormat}"
     end
    collName  = params['coll']
    docId     = params['docId']
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :doc => docId}
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, @project)
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      if(downloadFormat == 'json')
        resp = JSON.pretty_generate(apiReq.apiDataObj)
        fileExt = 'json'
      else
        resp = apiReq.rawRespBody
        fileExt = ( downloadFormat =~ /nesting/ ?  'compact.tsv' : 'fullPath.tsv' )
      end
      headers['Content-Type'] = "application/octet-stream"
      headers['Content-Disposition'] =  "attachment; filename=\"#{docId.makeSafeStr(:ultra)}.#{fileExt}\""
      apiReq.sendToClient(status, headers, resp)
    }
    apiReq.get(rsrcPath, fieldMap)
     
  end

  # Download all the three biosample, experiment and donors doc in batch and append all the three docs
  def downloadbatch()
    @downloadFormat = params['download_format']
    if( @downloadFormat != 'json' )
      @fullresp = ""
    else
      @fullresp = {}
    end
    @collNames = params["collNames"].split(",")
    @docIds = params["docIds"].split(",")
    targetHost = @settingsRec.gbHost.strip
    @apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, @project)
    @count = 0
    makeNestedDownloadReqs()
  end


  def makeNestedDownloadReqs()
    @apiReq.bodyFinish {
      headers = @apiReq.respHeaders
      status = @apiReq.respStatus
      if(@downloadFormat == 'json')
        @fullresp = @fullresp.merge(@apiReq.apiDataObj)
      else
        @fullresp << @apiReq.rawRespBody
        @fullresp << "\n"
      end
      @count = @count + 1
      # make file extensions and send out the req
      if(@count == @docIds.size)
        if(@downloadFormat == 'json')
          fileExt = 'json'
          fullresponse = JSON.pretty_generate(@fullresp)
        else
          fileExt = ( @downloadFormat =~ /nesting/ ?  'compact.tsv' : 'fullPath.tsv' )
          fullresponse = @fullresp
        end
        filename = Time.now.to_s
        headers['Content-Type'] = "application/octet-stream"
        headers['Content-Disposition'] =  "attachment; filename=\"#{filename.makeSafeStr(:ultra)}.#{fileExt}\""
        @apiReq.sendToClient(status, headers, fullresponse)
     else
       makeNestedDownloadReqs
     end
    }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/doc/{doc}"
    rsrcPath << "?format=#{@downloadFormat}" if(@downloadFormat != 'json')
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => @collNames[@count], :doc => @docIds[@count]}
    @apiReq.get(rsrcPath, fieldMap)
  end


  def analysisPostProcessFileUrls()
    collName = params["coll"]
    docId = params["docId"]
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :doc => docId }
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/doc/{doc}"
    targetHost = @settingsRec.gbHost.strip
    postProcess = { 
      "diagnosticPlot" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Diagnostic Plots File Name.Genboree URL",
      "miRNAreadCounts" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Raw miRNA Read Counts File Name.Genboree URL",
      "exogenous" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Exogenous Genomic Taxonomy Cumulative Read Counts File Name.Genboree URL",
      "ribosomal" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Exogenous Ribosomal Taxonomy Cumulative Read Counts File Name.Genboree URL",
      "postProcessArchive" => "Analysis.Data Analysis Level.Type.Level 1 Reference Alignment.Post-processing Results Archive File Name.Genboree URL"
    } 

    resphash = {}
    apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, @project)
    apiReq.bodyFinish {
      headers = apiReq.respHeaders
      status = apiReq.respStatus
      headers['Content-Type'] = "text/plain"
      #get all the property values
      if(apiReq.apiDataObj and !apiReq.apiDataObj.empty?)
        anDoc = BRL::Genboree::KB::KbDoc.new(apiReq.apiDataObj)
        postProcess.each_key {|key|
          resphash[key] = anDoc.getPropVal(postProcess[key]) rescue nil
        }        
          $stderr.debugPuts(__FILE__, __method__, "DEBUG", "resphash - #{resphash.inspect}")
        fullresp = {}
        fullresp[docId] = resphash
          $stderr.debugPuts(__FILE__, __method__, "DEBUG", "fullresp - #{fullresp.inspect}")
        apiReq.sendToClient(status, headers, JSON.generate(fullresp))
      else
        apiReq.sendToClient(status, headers, JSON.generate(apiReq.apiDataObj))
      end
    }
    apiReq.get(rsrcPath, fieldMap)
  end

   
end
