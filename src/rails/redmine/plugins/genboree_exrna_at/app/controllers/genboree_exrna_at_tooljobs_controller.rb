require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtTooljobsController < ApplicationController
  include GenboreeExrnaAtHelper
  unloadable

  before_filter :find_project, :find_settings, :checkForNonGbUser, :authorize_with_public_project
  respond_to :json
  
  DATA_DIR = "#{Rails.root}/plugins/genboree_exrna_at/config/data_tmp"  
  TOOL_DIR = "#{DATA_DIR}/toolConfs"


  
  def getUsrGrps()
    unless(@nonGbUser) 
      user = params["user"]
      rsrcPath = "/REST/v1/usr/{usr}/grps"
      fieldMap  = {:usr => user }
      # target host is the genboree job submission cluster host
      if(@settingsRec.jobHost =~ /\S/)
        targetHost = @settingsRec.jobHost.strip
        # make the request without a project context
        # Need to use the user login and pass word.
        # The requests could be made by non porject member, genboree registered user
        apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, nil)
        apiReq.bodyFinish {
          headers = apiReq.respHeaders
          status = apiReq.respStatus
          headers['Content-Type'] = "text/plain"
          #$stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "apiReq.respBody ------- #{apiReq.respBody.inspect}")
          apiReq.sendToClient(status, headers, JSON.generate(apiReq.respBody))
        }
        apiReq.get(rsrcPath, fieldMap)
      else
        renderForNoJobHost()
      end
     else
      renderForNonGbUser()
    end
  end

  def grpPermissions()
    unless(@nonGbUser)
      user = params["user"]
      group = params["grp"]
      rsrcPath = "/REST/v1/grp/{grp}/usr/{usr}/role?connect=no"
      fieldMap  = {:grp=> group, :usr => user }
      # target host is the genboree job submission cluster host
      if(@settingsRec.jobHost =~ /\S/)
        targetHost = @settingsRec.jobHost.strip
        # make the request without a project context
        # Need to use the user login and pass word.
        # The requests could be made by non porject member, genboree registered user
        apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, nil)
        apiReq.bodyFinish {
          headers = apiReq.respHeaders
          status = apiReq.respStatus
          headers['Content-Type'] = "text/plain"
          $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "apiReq.respBody ------- #{apiReq.respBody.inspect}")
          apiReq.sendToClient(status, headers, JSON.generate(apiReq.respBody))
        }
        apiReq.get(rsrcPath, fieldMap)
      else
        renderForNoJobHost()
      end
    else
      renderForNonGbUser()
    end
  end

  def getusrDbs()
    unless(@nonGbUser)
      group = params["grp"]
      rsrcPath = "/REST/v1/grp/{grp}/dbs"
      fieldMap  = {:grp=> group}
      if(@settingsRec.jobHost =~ /\S/)
        targetHost = @settingsRec.jobHost.strip
        # make the request without a project context
        # Need to use the user login and pass word.
        # The requests could be made by non porject member, genboree registered user
        apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, nil)
        apiReq.bodyFinish {
          headers = apiReq.respHeaders
          status = apiReq.respStatus
          headers['Content-Type'] = "text/plain"
          apiReq.sendToClient(status, headers, JSON.generate(apiReq.respBody))
        }
        apiReq.get(rsrcPath, fieldMap)
      else
        renderForNoJobHost()
      end
    else
      renderForNonGbUser()
    end

  end

  def submitToolJobAsync()
    unless(@nonGbUser)
      if(@settingsRec.jobHost =~ /\S/)
        toolIdStr = params["toolIdStr"]
        outputs = params["outputs"].split(",") rescue nil
        inputs = params["inputs"].split(",") rescue nil
        inputs.map! {|xx| xx = xx.gsub(/^ftp:\/\/ftp.genboree.org\/exRNA-atlas\//, "http://genboree.org/REST/v1/")}
        factorName = params["factorName"] rescue nil
        factorLevel1 = params["factorLevel1"] rescue nil
        factorLevel2 = params["factorLevel2"] rescue nil
        if(inputs and outputs and !inputs.empty?  and !outputs.empty?)
          jobConf = nil
          jobconfErr = nil
          errResp = {}
          # get the jobconf
          if(File.file?("#{TOOL_DIR}/#{toolIdStr}") and File.readable?("#{TOOL_DIR}/#{toolIdStr}"))
            begin
              jobConf = JSON(File.read("#{TOOL_DIR}/#{toolIdStr}"))
            rescue => err
              jobconfErr = err
            end
          $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "jobConf ------- #{jobConf.inspect}")
          if(jobConf)
            # first set an analysisname
            jobConf["settings"]["analysisName"] = "ExAt-#{Time.now.to_s.gsub("\s+", "-")}"
            # add the inputs
            jobConf["inputs"] = inputs
            jobConf["outputs"] = outputs
            # add specific settings for DESeq2
            if(toolIdStr == "DESeq2")
              jobConf["settings"]["factorName1"] = factorName
              jobConf["settings"]["factorLevel1"] = factorLevel1
              jobConf["settings"]["factorLevel2"] = factorLevel2
              if(@relatedJobIds)
                fileUploadJobId = @relatedJobIds
                jobConf['preconditionSet'] =  {
                  "willNeverMatch"=> false,
                  "numMet"=> 0,
                  "someExpired"=> false,
                  "count"=> 0,
                  "preconditions"=> [
                  {
                    "type" => "job",
                    "expires" => (Time.now + Time::WEEK_SECS).to_s,
                    "condition"=> {
                      "dependencyJobUrl" =>
                       "http://#{@settingsRec.jobHost}/REST/v1/job/#{fileUploadJobId}",
                       "acceptableStatuses" =>
                       {
                        "killed"=>true,
                        "failed"=>true,
                        "completed"=>true,
                        "partialSuccess"=>true,
                        "canceled"=>true
                      }
                     }
                   }
                 ]
                }
              end
            end
            
             $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "Async Put req $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
             $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "jobConf ------- \n#{jobConf.inspect}")
             jobSubmitter = GbTools::GbToolSubmitter.new(env, @settingsRec.jobHost, nil)
             jobSubmitter.submit(toolIdStr, jobConf)
          else
            errResp["status"] = {"statusCode" => 400, "msg" => "Failed to read the tool configuration file - #{TOOL_DIR}/#{toolIdStr}"}
            errResp["status"]["msg"] << jobconfErr if(jobconfErr)
            respond_with(errResp, :status => 400, :location => "")
          end # failed to find the jobConf
        else
          errResp["status"] = {"statusCode" => 404, "msg" => "Failed to find the tool configuration file - #{TOOL_DIR}/#{toolIdStr}"}
          respond_with(errResp, :status => 404, :location => "")
        end # no tool conf file
      else
        # no inputs and/or outputs Bad request
        errResp["status"] = {"statusCode" => 400, "msg" => "Incomplete job configuration parameters for the tool job #{toolIdStr}. Inputs or/and outputs parameters are missing."}
        respond_with(errResp, :status => 400, :location => "")
      end

      else
        renderForNoJobHost()
      end
    else
      renderForNonGbUser()
    end

  end



  def uploadFileToDb()
    filename = params["filename"] rescue nil
    grp = params["grp"] rescue nil
    db = params["db"] rescue nil
    rsrcPath = "/REST/v1/grp/{grp}/db/{db}/file/{file}/data?"
    fieldMap  = {:grp =>grp, :db=> db, :file => filename }
    fileInfo = JSON(params["payload"]) rescue nil
    filecontent = "#Biosample Name\tCondition\tBiofluid Name\tAnatomical Location\texRNA Source\tRNA Isolation Kit\n"
    fileInfo["biosamples"].each_key {|key|
      filecontent << fileInfo["biosamples"][key].join("\t")
      filecontent << "\n"
    }
    #$stderr.debugPuts(__FILE__, __method__, 'DEBUG', "FileCOntent :::: \n#{filecontent}") 
    syncReq = GbApi::SyncApiRequester.new(@settingsRec.jobHost, nil)
    apiResult = syncReq.apiPut(rsrcPath, filecontent, fieldMap)
    @relatedJobIds = nil
    if(apiResult[:respObj] and apiResult[:respObj].key?("status") and apiResult[:respObj]["status"].key?('relatedJobIds') and apiResult[:respObj]["status"]["relatedJobIds"].size > 0)
      @relatedJobIds = apiResult[:respObj]["status"]["relatedJobIds"][0]
    end
    if(@relatedJobIds)
      submitToolJobAsync()
    else
      if(apiResult[:respObj] and apiResult[:respObj].key?("status"))
        apiResult[:respObj]["status"]["msg"] << "No related job ids found. Cannot proceed without related job ids"
      end
      # bad request
      respond_with(apiResult[:respObj], :status => 404, :location => "")
    end
  end

  def createDb
    unless(@nonGbUser)
      db = params["dbname"]
      grp = params["grpname"]
      rsrcPath = "/REST/v1/grp/{grp}/db/{db}"
      payload = {"data" =>  {"name" => db, "entrypoints" => nil, "gbKey"=>"", "version"=> "hg19", "description"=> "Database from Exrna-atlas", "refSeqId"=>"", "species"=> "Homo sapiens", "public" => false}}
      fieldMap  = {:grp =>grp, :db=> db } 
      # target host is the genboree job submission cluster host
      if(@settingsRec.jobHost =~ /\S/)
        targetHost = @settingsRec.jobHost.strip
        # make the request without a project context
        # Need to use the user login and pass word.
        # The requests could be made by non porject member, genboree registered user
        apiReq = GbApi::JsonAsyncApiRequester.new(env, targetHost, nil)
        apiReq.bodyFinish {
          headers = apiReq.respHeaders
          status = apiReq.respStatus
          headers['Content-Type'] = "text/plain"
          #$stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "apiReq.respBody ------- #{apiReq.respBody.inspect}")
          apiReq.sendToClient(status, headers, JSON.generate(apiReq.respBody))
        }
        apiReq.put(rsrcPath, fieldMap, payload.to_json)
      else
        renderForNoJobHost()
      end
     else
      renderForNonGbUser()
    end
  end

  def renderForNonGbUser()
    resp = {}
    resp["status"] = {"statusCode" => 400, "msg" => "ERROR: Current Redmine user does not seem to be registered with Genboree. Are they a locally-registered Redmine user? That is NOT supported, ONLY Genboree users are supported."}
    jsonResp = JSON(resp)
    render(:json => jsonResp, :content_type => "text/html", :status => resp["status"]["statusCode"])
  end

  def renderForNoJobHost()
    resp = {}
    resp["status"] = {"statusCode" => 400, "msg" => "ERROR: No Genboree Tool Job host found. This settings for Job Host is empty? This is not allowed."}
    jsonResp = JSON(resp)
    render(:json => jsonResp, :content_type => "text/html", :status => resp["status"]["statusCode"])
  end
  
end
