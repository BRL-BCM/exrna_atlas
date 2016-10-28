require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
class GenboreeExrnaAtAsyncExternTestController < ApplicationController
  include GenboreeExrnaAtHelper

  before_filter :find_project, :find_settings

  def show()
    # http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/chainMacFas5.txt.gz

    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "PARAMS: #{params.inspect} ")
    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "project: #{@project.inspect} ")
    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "@settingsRec: #{@settingsRec.inspect} ")
    $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "USER: #{User.current.login.inspect} ")

    # Arrange external URL request and async handling
    targetHost = 'hgdownload.cse.ucsc.edu'
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
    # Some capture/save variables
    @sum = 0
    @apiBody = ''
    @apiStatus = ''
    @apiHeaders = {}
    @count = 0

    # Register a callback for when external request is read (but body will not
    #   have been read yet...that will be done non-blocking/async when you call each)
    apiReq.respCallback { |array|
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "-----MY CALLBACK!-----\n\n  * STATUS: #{array[0].inspect}\n  * HEADERS:\n#{array[1].inspect}\n  * BODY CLASS: #{array[2].class}\n\n")
      @apiStatus, @apiHeaders, body = array
      # Each over body. This will be done async since resp body can be huge/slow, so this is just registering
      #   a chunk-iteration Proc that will be called in the future.
      body.each { |chunk|
        @sum += chunk.size
        @apiBody += chunk
        $stderr.debugPuts(__FILE__, __method__, '',  "[#{array.object_id}] => CHUNK: #{chunk.size} bytes (#{@sum} vs #{@apiBody.size} totals)")
      }
      # NO CODE HERE! It will NOT run "after" the each(), it will run BEFORE. The each-ing is async!
    }

    # Register a callback for when all the resp body has been read (each-ed) so you can do follow-up
    #   processing.
    apiReq.bodyFinish {
      @count = @count + 1
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "-----MY BODY FINISH CALLBACK!-----\n\n   We read #{@sum.inspect} bytes of body via its non-blocking each().\n\n")
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "Response body String size: #{@apiBody.size}\n")
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "Api status: #{@apiStatus.inspect}\n")
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "Api bodyFinish count: #{@count.inspect}\n\n")

      # Sometimes just want to pass on resp headers, sometimes want brand new headers hash, sometimes just override couple headers
      #   but otherwise pass on resp headers.
      @apiHeaders['Content-Type'] = "text/plain"
      # Arrange to send response back to client.
      apiReq.sendToClient(@apiStatus, @apiHeaders, [ "resp body size: #{@apiBody.size}" ])
    }

    # Now actually do the request, now that we've set everything up and registered our callbacks.
    # * This will "throw :async" to thin for us.
    # * Does so by default, unless disabled via notifyWebServer=false
    #apiReq.get("/REST/v1/grp/{grp}/dbs?connect=no&format=json_pretty", { :grp => 'ARJ.a' })
    apiReq.get('/goldenPath/hg38/database/cloneEndABC7.txt.gz', {})
  end
end

