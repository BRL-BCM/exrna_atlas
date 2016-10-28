class GenboreeExrnaAtDccReportController < ApplicationController
  include GenboreeExrnaAtHelper 
  include PermHelper
  include GenboreeExrnaAtDccReportHelper
  unloadable

  before_filter :find_project, :find_settings, :authorize_with_public_project, :is_consortium_atlas?
  layout 'gbexat_entry'

  DISTINCT_VALUES_RSRC_PATH = "/REST/v1/grp/{grp}/kb/{kb}/coll/{coll}/docs/prop/{prop}/values/distinct"
  DISTINCT_VALUE_PROP_PATH = "distinctValue.value"
  RFA_TITLE_PROP_PATH = "ERCC Tool Usage.RFA Title"
  PI_NAME_PROP_PATH = "ERCC Tool Usage.PI Name"
  PROCESSING_PIPELINE_PROP_PATH = "ERCC Tool Usage.Processing Pipeline"
  PLATFORM_PROP_PATH = "ERCC Tool Usage.Platform"

  # @todo COPY from dt_controller; move to helper
  def parseSettings
    # @todo handle NoMethodError; handle settings not set
    kwargs = {}
    kwargs[:host] = @settingsRec.toolUsageHost
    kwargs[:grp] = @settingsRec.toolUsageGrp
    kwargs[:kb] = @settingsRec.toolUsageKb
    kwargs[:coll] = @settingsRec.toolUsageColl
    kwargs[:view] = @settingsRec.toolUsageView
    return kwargs
  end

  def show
    if(@consortiumAtlas)
      # this plugin is has two public routes to it: exrna-atlas.org and genboree.org/genboreeKB/projects/atlastest/exat
      # @relLinkBase must be defined in all controllers that use gbexat_entry as a layout
      # @relLinkBase is used to link to pages deeper in the site map 
      @relLinkBase = ""

      # the sister API controller GenboreeExrnaAtDccReportDtController returns data objects in JSON with these
      # values as keys; most are ultimately defined by a KB view, but some are custom
      @header = [
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
      @filters = [
        "RFA Title",
        "PI Name",
        "Mode of Submission",
        "Processing Pipeline"
      ]
      @filterValues = {}
      getFilterValues()
    else
      render_404
    end
  end

  # Collect data required by show() via async-IO before rendering show
  # @see getFilterValuesAsync
  def getFilterValues
    getRfaTitleValuesAsync {
      getPiNameValuesAsync {
        getModeOfSubmissionValuesAsync {
          getProcessingPipelineValuesAsync
        }
      }
    }
  end

  # For a collection configured in this project's settings, get the distinct values for the property
  #   @propPath@ and set the global @filterValues at the key @propName@ with those values
  # @param [Block] callback some action to perform after collecting the filter values;
  #   will perform renderToClient as a default
  def getFilterValuesAsync(propPath, propName, &callback)
    fieldMap = parseSettings()
    fieldMap[:prop] = propPath
    apiReq = GbApi::JsonAsyncApiRequester.new(env, fieldMap[:host], @project)
    apiReq.bodyFinish {
      begin
        if(apiReq.apiDataObj.nil? or apiReq.apiDataObj.is_a?(Exception))
          # then request failed
          # @todo errors raised here cause request to timeout rather than Rails behavior of sending Internal Server Error
          raise "Request to #{apiReq.fullApiUrl} failed"
        end

        distinctKbDocs = apiReq.apiDataObj
        values = distinctKbDocs.map { |obj|
          kbDoc = BRL::Genboree::KB::KbDoc.new(obj)
          kbDoc.getPropVal(DISTINCT_VALUE_PROP_PATH)
        }
        @filterValues[propName] = values.sort()
      rescue => err
        $stderr.debugPuts(__FILE__, __method__, "ERROR", "#{err.name}: #{err.message}\n#{err.backtrace.join("\n")}")
      ensure
        if(callback.nil?)
          apiReq.renderToClient(self)
        else
          callback.call
        end
      end
    }
    apiReq.get(DISTINCT_VALUES_RSRC_PATH, fieldMap)
  end

  # @see getFilterValuesAsync
  def getRfaTitleValuesAsync(&callback)
    getFilterValuesAsync(RFA_TITLE_PROP_PATH, :"RFA Title", &callback)
  end

  # @see getFilterValuesAsync
  def getPiNameValuesAsync(&callback)
    getFilterValuesAsync(PI_NAME_PROP_PATH, :"PI Name", &callback)
  end

  # @see getFilterValuesAsync
  def getModeOfSubmissionValuesAsync(&callback)
    getFilterValuesAsync(PLATFORM_PROP_PATH, :"Mode of Submission", &callback)
  end

  # @see getFilterValuesAsync
  def getProcessingPipelineValuesAsync(&callback)
    getFilterValuesAsync(PROCESSING_PIPELINE_PROP_PATH, :"Processing Pipeline", &callback)
  end
end
