class GenboreeExrnaAtDccReportDtController < ApplicationController
  include GenboreeExrnaAtHelper 
  include PermHelper
  include GenboreeExrnaAtDccReportDtHelper
  unloadable

  before_filter :find_project, :find_settings, :authorize_with_public_project

  # @note template substrings like "{grp}" must correspond to symbols in _getToolUsageData
  TOOL_USAGE_RSRC_PATH = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs?matchView={view}"
  DT_DATA_KEY = "data"
  CACHE_FILE_NAME = "toolUsage.json"

  # Respond to GET request: return tool usage data to client
  # @return [NilClass] nil
  def getToolUsageData()
    kwargs = parseSettings()
    kwargs[:project] = @project
    kwargs[:env] = env

    # Make API request to get docs that have been transformed by a view, unless we have a cached copy
    path = getPrjFilePath(CACHE_FILE_NAME)
    if(File.exists?(path))
      # then there is cache data
      send_file(path, :disposition => 'inline', :type => (Redmine::MimeType.of(path) or Redmine::MimeType::DEFAULT_MIME_TYPE))
    else
      # then there is no cache data; make request, update cache, and return the data
      _getToolUsageData(kwargs)
    end
    nil
  end

  # Respond to POST request: update cache of tool usage data, return no data
  # @return [NilClass] nil
  def postToolUsageData()
    fieldMap = parseSettings()
    # Make API request to get docs that have been transformed by a view
    apiReq = GbApi::JsonAsyncApiRequester.new(env, fieldMap[:host], @project)
    apiReq.bodyFinish { postToolUsageBodyFinish(apiReq) }
    apiReq.get(TOOL_USAGE_RSRC_PATH, fieldMap)
    nil
  end

  private 

  def parseSettings
    # @todo handle NoMethodError; handle settings not set
    kwargs = {}
    kwargs[:host] = @settingsRec.toolUsageHost
    kwargs[:grp] = @settingsRec.toolUsageGrp
    kwargs[:kb] = @settingsRec.toolUsageKb
    kwargs[:coll] = @settingsRec.toolUsageColl
    kwargs[:view] = @settingsRec.toolUsageView
    kwargs.each_key { |kk|
      vv = kwargs[kk]
      if(vv.nil? or vv.empty?)
        raise "Unable to access Tool Usage settings. Please configure them from the Redmine project page's Settings tab"
      end
    }
    return kwargs
  end

  def getPrivateSubmitters
    @settingsRec.privateSubmitters.split(",").map { |xx| xx.strip() }
  end

  # Proxy request to Genboree KB and transform response for DataTables
  # @param [Hash] kwargs
  #   :host, :grp, :kb, :coll, :view Genboree HTTP API request parameters
  #   :project [ActiveRecord] Project instance 
  #   :env [Hash] Rack request environment; must respond to:
  #     ['async.callback']
  #     ['async.close']
  #     ['action_dispatch.request_id']
  # @return [NilClass] nil; this method sets the response for an HTTP request
  # @todo may still not be able to use this function in ripl; lots of globals!
  def _getToolUsageData(kwargs)
    requiredKeys = [:host, :grp, :kb, :coll, :view, :project, :env]
    unless(kwargs.keys?(requiredKeys))
      raise ArgumentError.new("Missing required keys #{(kwargs.keys - requiredKeys).join(", ")}")
    end

    # Make API request to get docs that have been transformed by a view
    apiReq = GbApi::JsonAsyncApiRequester.new(kwargs[:env], kwargs[:host], kwargs[:project]) 
    apiReq.bodyFinish { getToolUsageBodyFinish(apiReq) }
    apiReq.get(TOOL_USAGE_RSRC_PATH, kwargs)
    nil
  end

  # Translate Genboree HTTP API response for toolUsageData to format DataTables expects
  # @param [Array, Hash] respData object or array "data" value from Genboree HTTP API
  def formatToolUsageData(respData)
    privateSubmitters = getPrivateSubmitters()
    respData = respData.deep_clone()
    respBody = {
      DT_DATA_KEY => []
    }

    # "parse" objects by transforming keys
    respBody[DT_DATA_KEY] = respData.map { |datum|
      parseToolUsageDatum_dt(datum)
    }

    # filter objects from upstream; the submitter must not be a "private submitter"
    $stderr.debugPuts(__FILE__, __method__, "STATUS", "Removing tool usage reports from private submitters: #{privateSubmitters.inspect}")
    respBody[DT_DATA_KEY] = respBody[DT_DATA_KEY].select { |datum|
      !privateSubmitters.include?(datum[SUBMITTER_NAME_KEY])
    }

    return respBody
  end

  # Send response data to client
  def getToolUsageBodyFinish(apiRequester)
    headers = apiRequester.respHeaders
    status = apiRequester.respStatus
    headers['Content-Type'] = "text/plain"

    if(apiRequester.apiDataObj.nil? or apiRequester.apiDataObj.is_a?(Exception))
      # then request failed
      raise "Request to #{apiRequester.fullApiUrl} failed"
    end # otherwise, will be able to get respBody
    respBody = formatToolUsageData(apiRequester.apiDataObj)

    # update cache
    writeToFile(CACHE_FILE_NAME, respBody)
    apiRequester.sendToClient(status, headers, JSON.generate(respBody))
    # @note sendToClient raises exception
    nil
  end

  # Update cache; do not send data to client (to save time, it is not used)
  def postToolUsageBodyFinish(apiRequester)
    headers = apiRequester.respHeaders
    status = apiRequester.respStatus
    headers['Content-Type'] = "text/plain"

    if(apiRequester.apiDataObj.nil? or apiRequester.apiDataObj.is_a?(Exception))
      # then request failed
      raise "Request to #{apiRequester.fullApiUrl} failed"
    end # otherwise, will be able to get cacheData
    cacheData = formatToolUsageData(apiRequester.apiDataObj)

    # update cache
    writeToFile(CACHE_FILE_NAME, cacheData)
    apiRequester.sendToClient(status, headers, [])
    # @note sendToClient raises exception
    nil
  end
end
