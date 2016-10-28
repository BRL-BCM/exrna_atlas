require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
require 'brl/genboree/kb/kbDoc'
require 'brl/genboree/kb/propSelector'
# class for generating the studies profile grid data
# Request paths follow: Analyses-> Runs -> Studies-> Submissions
class GenboreeExrnaAtStudyProfileController < ApplicationController
  include GenboreeExrnaAtHelper
  unloadable

  before_filter :find_project, :find_settings, :authorize_with_public_project
  respond_to :json
  
  TRANS_RSRC_PATH = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?transform={trans}"
  VIEW_RSRC_PATH = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?matchView={view}"
  DOCS_RSRC_PATH = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?detailed=true"
  CACHE_FILE_NAME = "studiesGrData.json"  
  
  def asyncgetStudiesGridData()
    @trans = params['transformationName'].split(",") rescue nil
    collName = @settingsRec.analysesColl
    @fileName = params["writeToFile"]
    @analysesProfileData = Hash.new{ |hh,kk| hh[kk] = [] }
    @submissionsToAnalyses = {}
    @studiesToAnalyses = {}
    #using transformations to map from Analyses -> Runs -> Studies -> Submissions
    # transformation names are read in from the client side
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :trans => @trans.first }
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    @apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    @apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    @apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'] and !pBody['data'].empty?)
        respObj = pBody['data']
        respObj['Data'].each{ |item|
          item["data"].each {|subitem|
            if(subitem["cell"]["value"])
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first] = {}
              @submissionsToAnalyses[subitem['name']] = subitem['cell']['metadata']['docIds'].first
              @studiesToAnalyses[item['name']] = subitem['cell']['metadata']['docIds'].first
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['StudyTitle'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['StudyID'] = item['name']
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['PI'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['PIEmail'] = nil              
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['NumberOfSamples'] = subitem['cell']['value']              
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['FundingSource'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['Grant'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['Organization'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['Reference'] = nil
              @analysesProfileData[subitem['cell']['metadata']['docIds'].first]['Version'] = nil
              break 
            end
          }
        }
        getAllSubmissions()
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        headers['Content-Type'] = "text/plain"
        @apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        headers['Content-Type'] = "text/plain"
        @apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID:fieldMap: #{fieldMap.inspect} "
    @apiReq.get(TRANS_RSRC_PATH, fieldMap)
  end
  
  # Get property values for analysis docs using matchValue given in the view parm
  def getAnalysisInfo()
    view = params["view"]
    collName = @settingsRec.analysesColl
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :view => view}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    @apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    @apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        respObj.each{ |obj|
          @analysesProfileData[obj["Analysis"]["value"]]["Version"] = obj["Version"]["value"]
        }
        getAllSubmissions()
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        @apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        @apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID:fieldMap: #{fieldMap.inspect} "
    @apiReq.get(VIEW_RSRC_PATH, fieldMap)
  end  


  # get all the metadata from the submissions, do all the submission docs
  def getAllSubmissions()
    collName = @settingsRec.submissionsColl
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    @apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    @apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        respObj.each{ |doc|
          begin
            ps = BRL::Genboree::KB::KbDoc.new(doc)
            subId = ps.getPropVal('Submission')
            # get PI names
            firstName =  ps.getPropVal('Submission.Principal Investigator.First Name') 
            lastName = ps.getPropVal('Submission.Principal Investigator.Last Name') 
            # join the names
            if(@submissionsToAnalyses.key?(subId) and @submissionsToAnalyses[subId])
              @analysesProfileData[@submissionsToAnalyses[subId]]['PI'] = "#{firstName} #{lastName}"
              # PI Email
              piEmail = ps.getPropVal('Submission.Principal Investigator.Email') 
              @analysesProfileData[@submissionsToAnalyses[subId]]['PIEmail'] = piEmail
              # funding
              funding = ps.getPropVal('Submission.Funding Source')
              @analysesProfileData[@submissionsToAnalyses[subId]]['FundingSource'] = funding
              # grant
              grant = ps.getPropVal('Submission.Funding Source.Grant Details')
              @analysesProfileData[@submissionsToAnalyses[subId]]['Grant'] = grant
              # org
              org = ps.getPropVal('Submission.Organization')
              @analysesProfileData[@submissionsToAnalyses[subId]]['Organization'] = org
              # website
              website = ps.getPropVal('Submission.Address.Website') rescue nil
              @analysesProfileData[@submissionsToAnalyses[subId]]['Website'] = website
            end
          rescue => err
            $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID_ERROR: #{err.message} "
          end
        }
        getAllStudies()
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
        @apiReq.sendToClient(status, headers, [jsonResp])
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
        @apiReq.sendToClient(status, headers, [jsonResp])
      end
    }
    $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID:fieldMap: #{fieldMap.inspect} "
    @apiReq.get(DOCS_RSRC_PATH, fieldMap)
  end

  # get all the metadata from the studies, do all the studies docs
  def getAllStudies()
    collName = @settingsRec.studiesColl
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName}
    status = ''
    headers = {}
    rebody = ''
    targetHost = @settingsRec.gbHost.strip
    @apiReq.respCallback { |array|
      status, headers, body = array
        body.each { |chunk| rebody += chunk }
    }
    @apiReq.bodyFinish {
      pBody = JSON.parse(rebody) rescue nil
      if(pBody and pBody['data'])
        respObj = pBody['data']
        respObj.each{ |doc|
          begin
            ps = BRL::Genboree::KB::KbDoc.new(doc)
            subId = ps.getPropVal('Study')
            # get Study Title
            studyTitle =  ps.getPropVal('Study.Title')
            # Get other props from the same Study document
            if(@studiesToAnalyses.key?(subId) and @studiesToAnalyses[subId])
              @analysesProfileData[@studiesToAnalyses[subId]]['StudyTitle'] = studyTitle
              
              # references ## TODO: use getPropItems to get list and structure the list for display in UI
              references = ps.getPropItems('Study.References') rescue nil
              pubmedIdList = []
              if(references and references.is_a?(Array))
                references.each { |eachRef|
                  # Accession will be available since it is an item list identifier
                  pubmedId = eachRef["PubMed ID"]["value"]
                  pubmedIdList << "<a href=http://www.ncbi.nlm.nih.gov/pubmed/#{pubmedId} target=_blank>#{pubmedId}</a>"
                }  
              end
              if(pubmedIdList)
                @analysesProfileData[@studiesToAnalyses[subId]]['Reference'] = pubmedIdList.join("<br>")
              end
              
              # external databases ## TODO: use getPropItems to get list and structure the list for display in UI
              aliases = ps.getPropItems('Study.Aliases') rescue nil
              extDbList = []
              if(aliases and aliases.is_a?(Array))
                aliases.each { |eachAlias|
                  # Accession will be available since it is an item list identifier
                  extDbAccession = eachAlias["Accession"]["value"]
                  extDb = extDbAccession
                  # Check if any properties exist, then add to dbAccession
                  if(eachAlias["Accession"].key?("properties"))
                    # Check if dbName exists, then add to dbAccession
                    if(eachAlias["Accession"]["properties"].key?("dbName"))
                      extDbName = eachAlias["Accession"]["properties"]["dbName"]["value"]
                      extDb = "#{extDbName}: #{extDbAccession}"
                    end
                    # Check if URL exists, then add to dbAccession
                    if(eachAlias["Accession"]["properties"].key?("URL"))
                      extDbURL = eachAlias["Accession"]["properties"]["URL"]["value"]
                      extDb = "<a href=#{extDbURL} target=_blank>#{extDb}</a>"
                    end
                    extDbList << extDb
                  end
                }
                if(extDbList)
                  @analysesProfileData[@studiesToAnalyses[subId]]['ExtDBRefs'] = extDbList.join("<br>")  
                end
              end
              
              #co-PI Names
              authorList = ps.getPropItems('Study.Authors') rescue nil
              coPINames = []
              if(authorList and authorList.is_a?(Array))
                authorList.each { |author|
                  if(author["Author Name"].key?("properties") and author["Author Name"]["properties"].key?("Role"))
                    authorRole = author["Author Name"]["properties"]["Role"]["value"]
                    if(authorRole and authorRole == "Co-PI")
                      authorName = author["Author Name"]["value"]
                      coPINames <<  authorName.to_s
                    end
                  end
                }
                if(coPINames)
                  @analysesProfileData[@studiesToAnalyses[subId]]['CoPINames'] = coPINames.join(", ")  
                end
              end              
            end
          rescue => err
            $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID_ERROR: #{err.message} "
          end
        }
        jsonResp = JSON(@analysesProfileData)
        writeToFile(CACHE_FILE_NAME, @analysesProfileData) if(@fileName)
      elsif(pBody) # failed, send the failed response, do not go for the next request
        jsonResp = JSON( pBody )
      else # failed, send the failed response, do not go for the next request
        jsonResp = "Failed async request"
      end
      @apiReq.sendToClient(status, headers, [jsonResp])
    }
    $stderr.puts "DEBUG - #{__method__}() => STUDIES_GRID:fieldMap: #{fieldMap.inspect} "
    @apiReq.get(DOCS_RSRC_PATH, fieldMap)
  end

end
