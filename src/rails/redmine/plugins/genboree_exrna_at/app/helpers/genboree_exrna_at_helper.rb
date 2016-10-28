# Common Helper module for Genboree Exrna Atlas plugin.

require 'yaml'
require 'json'
require 'uri'
require 'em-http-request'
require 'brl/util/util'
require 'brl/db/dbrc'
require 'brl/rest/apiCaller'

module GenboreeExrnaAtHelper
  # Make additional before_filter methods available from genboree_generic plugin.
  include GenericHelpers::BeforeFiltersHelper
  include PluginHelpers::BeforeFiltersHelper
  extend PluginHelpers::BeforeFiltersHelper  # so also available as "class" method when doing settings

  # Must have @project set before calling Redmine's authorize before_filter
  # Typical way to handle this is to have a find_project method and put *it* in the before_filter list too
  DATA_DIR = "#{Rails.root}/plugins/genboree_exrna_at/config/data_tmp"
  PRJ_SPEC_DIR  = "#{Rails.root}/project-specific/genboree_exrna_at/cache"
  PLUGIN_SETTINGS_MODEL_CLASS = GenboreeExrnaAt

  def find_project()
    @projectId = params[:id]
    @project = Project.find(@projectId)
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  # Set an instance variable with this projects Active Record settings (and which fields are 
  #   of interest there) in @settingsRec and @settingsFields
  # @note @project must be set (call find_project first)
  def find_settings()
    @settingsFields, @settingsRec = GenboreeExrnaAtHelper.find_settings(@project)
    # Get the home page URL for banner and the info flash message html if any available
    @homePageUrl = @settingsRec.homePageUrl rescue nil
    @infoFlashHtml = @settingsRec.infoFlashHtml.to_s.html_safe rescue nil
    return @settingsFields, @settingsRec
  end
  
  def self.find_settings(project)
    $stderr.puts "DEBUG - #{__method__}() => project: #{project.inspect} "
    # NOTE: :widget => :text_field is default if not set:
    settingsFields = [
      # KB location settings
      { :setting => :kb_settingsHeader, :label => :gbexat_kb_settings_header, :widget => :_header },
      { :setting => :gbHost,  :label => :gbexat_gb_host },
      { :setting => :gbGroup, :label => :gbexat_gb_group  },
      { :setting => :gbKb,    :label => :gbexat_gb_kb  },

      # Key collection names settings
      { :setting => :collNames_settingsHeader,  :label => :gbexat_coll_names_settings_header, :widget => :_header },
      { :setting => :analysesColl,    :label => :gbexat_gb_analyses_coll  },
      { :setting => :biosamplesColl,  :label => :gbexat_gb_biosamples_coll  },
      { :setting => :donorsColl,      :label => :gbexat_gb_donors_coll  },
      { :setting => :experimentsColl, :label => :gbexat_gb_experiments_coll  },
      { :setting => :jobsColl,        :label => :gbexat_gb_jobs_coll  },
      { :setting => :resultFilesColl, :label => :gbexat_gb_result_files_coll  },
      { :setting => :runsColl,        :label => :gbexat_gb_runs_coll  },
      { :setting => :studiesColl,     :label => :gbexat_gb_studies_coll  },
      { :setting => :submissionsColl, :label => :gbexat_gb_submissions_coll  },

      # Tool job submission settings
      { :setting => :toolJob_settingsHeader, :label => :gbexat_tool_job_settings_header, :widget => :_header },
      { :setting => :jobHost,       :label => :gbexat_job_host  },
      { :setting => :toolUsageHost, :label => :gbexat_tool_usage_host  },
      { :setting => :toolUsageGrp,  :label => :gbexat_tool_usage_grp  },
      { :setting => :toolUsageKb,   :label => :gbexat_tool_usage_kb  },
      { :setting => :toolUsageColl, :label => :gbexat_tool_usage_coll  },
      { :setting => :toolUsageView, :label => :gbexat_tool_usage_view  },
      { :setting => :privateSubmitters, :label => :gbexat_private_submitters  },

      # Contact us settings
      { :setting => :contact_settingsHeader,  :label => :gbexat_contact_settings_header, :widget => :_header },
      { :setting => :contactTo,   :label => :gbexat_contact_to  },
      { :setting => :contactBccs, :label => :gbexat_contact_bccs  },

      # Page content settings
      { :setting => :pageContent_settingsHeader,  :label => :gbexat_page_content_settings_header, :widget => :_header },
      { :setting => :homePageUrl,   :label => :gbexat_home_page_url },
      { :setting => :infoFlashHtml, :label => :gbexat_info_flash_html, :widget => :text_area },
      { :setting => :prevVersions,  :label => :gbexat_prev_versions, :title => "Enter 0+ comma-separated labeled URLs to previous versions in the following format: {html_cdata}:{url}" },

      # Uncategorized & no nice header label settings
      { :setting => :misc_settingsHeader, :label => :gbexat_misc_settings_header, :widget => :_header },
      { :setting => :newsFile,    :label => :gbexat_news_file },
      { :setting => :updateData,  :label => :gbexat_gb_data_update, :widget => :checkbox }
    ]
    settingsRec = plugin_proj_settings(project, GenboreeExrnaAtHelper::PLUGIN_SETTINGS_MODEL_CLASS)
    #$stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "settingsRec ----------- #{settingsRec.inspect}")
    return settingsFields, settingsRec
  end

  # Various features are disabled for the "public" atlas that are enabled for the "consortium" atlas
  # @todo may want to change this, but for now public Redmine project means "public" atlas
  def is_consortium_atlas?()
    if(@consortiumAtlas.nil?)
      @consortiumAtlas = !@project.is_public
    end
    return @consortiumAtlas
  end

  def find_gridName()
    @gridName = params['grid']
    @gridName = nil if(@gridName and @gridName !~ /\S/)
    return @gridName
  end 

  def find_assay()
    @assay = params['assay']
    @assay = nil if(@assay and @assay !~ /\S/)
    return @assay
  end
 
 def find_postedParams()
   @postedParams = {}
   @postedParams['json'] = params['json']
   @postedParams['hierTransform'] = params['hierTransform']
   @postedParams['toolSelected'] = params['toolSelected']
   @postedParams['reSelectRows'] = params['reSelectRows']
   @postedParams['json'] = nil if(@postedParams['json'] and @postedParams['json'] !~ /\S/)
   @postedParams['hierTransform'] = nil if(@postedParams['hierTransform'] and @postedParams['hierTransform'] !~ /\S/)
   @postedParams['reSelectRows'] = nil if(@postedParams['reSelectRows'] and @postedParams['reSelectRows'] !~ /\S/)
   @postedParams['toolSelected'] = nil if(@postedParams['toolSelected'] and @postedParams['toolSelected'] !~ /\S/)
   return @postedParams
  end


  def checkForNonGbUser()
    @nonGbUser = false
    gbAuthHelper = GbApi::GbAuthHelper.new()
    #authPair = gbAuthHelper.authPairForUserAndHostInProjContext(@project, @settingsRec.jobHost.strip, User.current)
    authPair = gbAuthHelper.authPairForUserAndHost(@settingsRec.jobHost.strip, User.current)
    login, pass = authPair
    @nonGbUser = (login and pass) ? false : true
    return @nonGbUser
  end

  # ----------------------------------------------------------------
  # OTHER COMMON HELPER METHODS
  # ----------------------------------------------------------------
  # Leverage existing rails functionality for 404 in a simple way.
  # * Useful because it will also interrupt your code processing while triggering rails handling
  # * Because this raises an exception, it _interrupts_ your code/processing immediately, and
  #   activates Rails' handling. This makes it better for writing controllers and such than other
  #   404 techniques (e.g. it's better than render_404 because of this)
  def notFound()
    raise ActionController::RoutingError.new('Not Found')
  end


  # @return [String] file path for Redmine project files
  def getPrjFilePath(fileName)
    filePath = "#{PRJ_SPEC_DIR}/#{@project.identifier}/#{fileName}"
  end

  # @return [Hash, Array, NilClass] parsed JSON from file or nil if failure
  def prjFileExists?(fileName)
    filePath = getPrjFilePath(fileName)
    return File.exists?(filePath)
  end

  def writeToFile(fileName, content)
    FileUtils.mkdir_p("#{PRJ_SPEC_DIR}/#{@project.identifier}")
    filePath = "#{PRJ_SPEC_DIR}/#{@project.identifier}/#{fileName}"
    locked = nil
    begin
      ff = File.open(filePath, "w")
      locked = ff.getLock(0, 0, false, false)
      if(locked)
        ff.write(JSON.pretty_generate(content))
        ff.close()
        ff.releaseLock()
      end
    rescue => err
    ensure
      ff.releaseLock()
    end
  end

  def writeToFileFromConf(content, confpath, itemId)
    begin
      prjSpecPath = "#{PRJ_SPEC_DIR}/#{@project.identifier}"
      FileUtils.mkdir_p(prjSpecPath)
    rescue => err
      $stderr.debugPuts(__FILE__, __method__, "ERROR", "Project specific directory missing. Failed to create one. See - #{err.inspect}") 
    end
    path = "#{DATA_DIR}/#{confpath}"
    fileName = nil
    if(File.directory?(prjSpecPath) and File.file?(path) and File.readable?(path))
      begin
        data = JSON(File.read(path))
        if(data.is_a?(Array))
          data.each{|item|
            if(item["id"] == itemId)
              fileName = item["path"]
              break
            end
          }
        elsif(data.is_a?(Hash))
          if(data.key?("id") and data["id"] == itemId)
            fileName = data["path"]
          end
        end
        if(fileName)
          filePath = "#{PRJ_SPEC_DIR}/#{@project.identifier}/#{fileName}"
          locked = nil
          begin
            ff = File.open(filePath, "w")
            locked = ff.getLock(0, 0, false, false)
            if(locked)
              ff.write(JSON.pretty_generate(content))
              ff.close()
              ff.releaseLock()
            end
          rescue => err
          ensure
            ff.releaseLock()
          end
        end
      rescue => err
        $stderr.debugPuts(__FILE__, __method__, "DEBUG", "FAILED_TO WRITE_TO_FILE - #{err.message} \n #{err.backtrace}")
      end
    else
     notFound()
    end 
  end
end
