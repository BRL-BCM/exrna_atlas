require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
class GenboreeExrnaAtAsyncExtern2TestController < ApplicationController
  include GenboreeExrnaAtHelper

  before_filter :find_project, :find_settings

  def show()
    # http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/chainMacFas5.txt.gz
    targetHost = 'hgdownload.cse.ucsc.edu'
    targetPath = '/goldenPath/hg38/database/foldUtr3.txt.gz' # ~30MB file

    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    apiReq.nonGbApiTargetHost = true
    # Some capture/save variables
    @apiStatus = ''
    @apiHeaders = {}

    # Register a callback for when external request is read (but body will not
    #   have been read yet...that will be done non-blocking/async when you call each)
    apiReq.respCallback { |array|
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "-----MY CALLBACK [#{array.object_id}]-----\n\n  * STATUS: #{array[0].inspect}\n  * HEADERS:\n#{array[1].inspect}\n  * BODY CLASS: #{array[2].class}\n\n")
      @apiStatus, @apiHeaders, body = array
      # Here, we won't read the body...rather we want to forward it onward to the client.
      # * Thus, we also won't employ bodyFinish since we're not doing the reading.
      # * Just arrange response to client, trusting Rack will read the body async just like we would have.
      apiReq.sendToClient( @apiStatus, @apiHeaders, body )
    }

    # Now actually do the request, now that we've set everything up and registered our callbacks.
    # * This will "throw :async" to thin for us.
    # * Does so by default, unless disabled via notifyWebServer=false
    #apiReq.get("/REST/v1/grp/{grp}/dbs?connect=no&format=json_pretty", { :grp => 'ARJ.a' })
    apiReq.get(targetPath, {})
  end
end

