require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
require 'brl/genboree/kb/graphics/d3/converters'
require 'brl/graphics/d3/d3LvpListHelpers'

class GenboreeExrnaAtSelectionsD3Controller < ApplicationController
  include GenboreeExrnaAtHelper
  unloadable
  
  before_filter :find_project, :find_settings, :authorize_with_public_project
  respond_to :json
  # ------------------------------------------------------------------
  # Possibly helps with API support and certainly API-KEY type authentication.
  # ------------------------------------------------------------------
  skip_before_filter :check_if_login_required
  skip_before_filter :verify_authenticity_token


  def asyncGetdata()
    # Post conversion modifications required if any
    modifyd3 = params["modifyd3"]

    if(modifyd3 !~ /merge/)
      asyncSingleTransToD3()
    else
      asyncMergeTransToD3()
    end
  end


  def asyncSingleTransToD3()
    projectId = @project.identifier
    d3LvpHelper =  BRL::Graphics::D3::D3LvpListHelpers
    # Post conversion modifications required if any
    modifyd3 = params["modifyd3"]

    transformationName = params["transformationName"]
    collName = params["collName"]

    # Supported formats include flat (donuts, bars, etc) and clustered (tree, sunburst, etc)
    format = params["format"].nil? ? "flat" : params["format"]

    # group label parameter pointing to the file name
    grouplabelconf = params["grouplabelconf"]
    # percentage on onelist or all lists
    percentage = params["percentage"]
    # 'SumSubjectsMatchVal'
    sumSubjectsMatchVal = params["sumSubjectsMatchVal"]
    # write the result to a file
    writetofile = params["writeToFile"]
    confid = params["confid"]
    dataconf = params["dataconf"]
    
    rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?transform={trans}"
    fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :trans => transformationName}
    @respbody = ''
    @respstatus = ''
    @respheaders = {}
    targetHost = @settingsRec.gbHost.strip
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.respCallback { |array|
    @respstatus, @respheaders, body = array
     body.each { |chunk|
      @respbody += chunk
    }
   }
   apiReq.bodyFinish {
    pBody = JSON.parse(@respbody) rescue nil
    if(pBody and pBody['data'] and !pBody['data'].empty?)
      bodyObj = pBody['data']
      resp = {}
      rawTransform = JSON.pretty_generate(bodyObj)
      # Create KB=>D3 converter
      d3conv = BRL::Genboree::KB::Graphics::D3::KbTransformConverter.from_string( rawTransform )
      if(format == "flat")
        # Convert to D3 JSON format
        d3json = d3conv.to_d3Lvp(rawTransform)
        # check for post conversion modifications
        if(modifyd3 =~ /grouplabel/i)
          labelGroups = []
          grouplabelconf = params["grouplabelconf"]
          if(grouplabelconf and File.file?("#{DATA_DIR}/#{grouplabelconf}") and File.readable?("#{DATA_DIR}/#{grouplabelconf}"))
            labelGroups = JSON(File.read("#{DATA_DIR}/#{grouplabelconf}")) rescue nil
            labelGroups = [] if(labelGroups.nil?)
            $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "labelgroups ------- #{labelGroups.inspect}")
          end
          resp = d3LvpHelper.mergeSimilarLabels(d3json, labelGroups)
          #$stderr.puts "DEBUG - #{__method__}() => d3json: #{d3json.inspect} "
        elsif(modifyd3 =~ /sumOfAllSubjects/i)
          d3json = d3conv.sumOfAllSubjects(0, true)
          resp = d3json
        elsif(modifyd3 =~ /sumAndPercentage/i)
          if(sumSubjectsMatchVal == "all")
            # sum all the subjects
            summed = d3conv.to_d3LvpSumSubjects
           else
            # sum a specific subject
            summed = d3conv.to_d3LvpSumSubjectsMatchVal(sumSubjectsMatchVal)
          end
          # percentage
          if(percentage =~ /onelist/)
            resp = d3LvpHelper.percentageD3LvpOneList(summed)
          else
            resp = d3LvpHelper.percentageD3LvpLists(d3json, summed)
           end
        elsif(modifyd3 =~ /percentage/)
          if(percentage =~ /onelist/i)
            resp = d3LvpHelper.percentageD3LvpOneList(d3json)
          end
        end
      else
        # format is cluster
        # Get pruned version of transformation; prune branches with 0 samples
        cleanTransform = d3conv.cleanPartData()
        d3hier = d3conv.to_d3Hierarchical(cleanTransform)
        BRL::Graphics::D3::D3HierarchyHelpers.addNodeSums(d3hier)
        d3hier["name"] = "All Samples"
        resp = d3hier
      end      
      respObj = JSON(resp)
      # use lockfile, this is just an initial test
      writeToFileFromConf(resp, dataconf, confid) if(writetofile)
    elsif(pBody)
      respObj = JSON(pBody)
    else
      respObj = "Failed Async request"
    end
     @respheaders['Content-Type'] = "text/plain"
     apiReq.sendToClient(@respstatus, @respheaders, [respObj])
  }
  apiReq.get(rsrcPath, fieldMap)

  end


  def asyncMergeTransToD3()
    @trans = params["transformationName"].split(",")
    @sumSubjectsMatchVal = params["sumSubjectsMatchVal"].split(",").map {|x| CGI.unescape(x)}
    @totalData = []
    @count = 0
    @body = ''
    @apiStatus = ''
    @apiHeaders = {}
    @apiReqChild = GbApi::SimpleAsyncApiRequester.new(env, @settingsRec.gbHost.strip, @project)
    makeNestedReq()
  end


  def makeNestedReq()
    d3LvpHelper =  BRL::Graphics::D3::D3LvpListHelpers
    collName = params["collName"]
    percentage = params["percentage"]
    # write the result to a file
    writetofile = params["writeToFile"]
    confid = params["confid"]
    dataconf = params["dataconf"]
    @apiReqChild.respCallback { |array|
      #$stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "-----MY CALLBACK [#{array.object_id}]-----\n  * STATUS: #{array[0].inspect}\n  * HEADERS:\n#{array[1].inspect}\n  * BODY CLASS: #{array[2].class}\n\n")
      @apiStatus, @apiHeaders, body = array
      body.each { |chunk|
        @body += chunk
      }
    }
   @apiReqChild.bodyFinish {
     pBody = JSON.parse(@body) rescue nil
     if(pBody and pBody['data'] and !pBody['data'].empty?)
       rawTransform = JSON.pretty_generate(pBody['data'])
       begin
         d3conv = BRL::Genboree::KB::Graphics::D3::KbTransformConverter.from_string( rawTransform )
         @totalData << d3conv.sumOfAllSubjects(0, true, @sumSubjectsMatchVal[@count])
       rescue => err
          $stderr.debugPuts(__FILE__, __method__, "DEBUG", "Error in conversion - #{err.inspect}")
       end
       #$stderr.debugPuts(__FILE__, __method__, "DEBUG", "Count - #{@count.inspect}")
       #$stderr.debugPuts(__FILE__, __method__, '>>>>>> STATUS just after request - ', "\n\nSTATUS:[#{@apiStatus.inspect}] ......")
       #$stderr.debugPuts(__FILE__, __method__, '>>>>>> STATUS just after request - ', "\n\nheaders:[#{@apiHeaders.inspect}] ......")
       @body = ''
       @count = @count + 1
       if(@count == @trans.size)
          unless(@totalData.empty?)
            if(percentage == "onelist")
              resp = d3LvpHelper.percentageD3LvpOneList(@totalData)
            else
              resp = @totalData
            end
              writeToFileFromConf(resp, dataconf, confid) if(writetofile)
          end
          @apiHeaders['Content-Type'] = "text/plain"
          begin
            @apiReqChild.sendToClient(@apiStatus, @apiHeaders, [resp.to_json])
          rescue => err
            $stderr.debugPuts(__FILE__, __method__, '>>>>>> FAILED - SENT TO CLIENT ?????????????????????????', "\n\nerr:[#{err.inspect}] ......") 
          end
       else
         makeNestedReq()
       end
    elsif(pBody) # failed body but no data obj or data obj empty - cannot proceed without a proper data obj
      @apiHeaders['Content-Type'] = "text/plain"
      @apiReqChild.sendToClient(@apiStatus, @apiHeaders, [@body])
    else # failed no body
      @apiHeaders['Content-Type'] = "text/plain"
      @apiReqChild.sendToClient(@apiStatus, @apiHeaders, ["Failed Async request"])
    end
    } 
   rsrcPath = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?transform={trans}"
   fieldMap  = {:grp => @settingsRec.gbGroup.strip, :kb=> @settingsRec.gbKb.strip, :coll => collName, :trans => @trans[@count]}
   @apiReqChild.get(rsrcPath, fieldMap)
  end

end
