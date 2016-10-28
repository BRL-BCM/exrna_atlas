
class GenboreeExrnaAtAsyncRenderTestController < ApplicationController
  include GenboreeExrnaAtHelper

  before_filter :find_project, :find_settings, :authorize_with_public_project

  def show()

    # Arrange external URL request and async handling
    targetHost = '10.15.55.128'
    targetPath = '/REST/v1/grp/{grp}/kb/{kb}?connect=no&format=json_pretty'
    testGrp = 'Extracellular RNA Atlas Dev'
    testKb = 'exRNA-atlas'
    apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)

    # Some capture/save variables
    @apiBody = ''
    @apiStatus = nil
    @apiHeaders = nil
    @apiRespArray = nil
    @tNow = Time.now # just an instance variable for testing

    # Register a callback for when external request is read (but body will not
    #   have been read yet...that will be done non-blocking/async when you call each)
    apiReq.respCallback { |array|
      @apiRespArray = array
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "-----MY CALLBACK [#{@apiRespArray.object_id}]-----\n  * STATUS: #{array[0].inspect}\n  * HEADERS:\n#{array[1].inspect}\n  * BODY CLASS: #{array[2].class}\n\n(request class: #{request.class rescue nil.class} ; uuid: #{request.uuid.inspect rescue nil})\n\n")
      @apiStatus, @apiHeaders, body = array
      # Each over body. This will be done async since resp body can be huge/slow, so this is just registering
      #   a chunk-iteration Proc that will be called in the future.
      body.each { |chunk|
        @apiBody += chunk
      }
      # NO CODE HERE! It will NOT run "after" the each(), it will run BEFORE. The each-ing is async!
    }

    # Register a callback for when all the resp body has been read (each-ed) so you can do follow-up
    #   processing.
    apiReq.bodyFinish {
      $stderr.debugPuts(__FILE__, __method__, 'DEBUG', "-----BODY FINISH [#{@apiRespArray.object_id}]-----]\n  * Accum body size: #{@apiBody.size}\n\n")
      # Parse the resp body safely:
      pBody = JSON.parse(@apiBody) rescue nil

      # Extract info
      if(pBody)
        # Dig out some info, make sure available to View:
        @aColl = pBody['data']['name']['properties']['collections']['items'].first['collection']['value']
      else
        @aColl = '[[API resp body parse failed]]'
      end

      #apiReq.renderToClient(self, { :inline => "<b><%= @aColl %></b><br><hr><hr><%= @tNow %>"} )
      #apiReq.renderToClient(self, :show)
      apiReq.renderToClient(self)
    }

    # Now actually do the request, now that we've set everything up and registered our callbacks.
    # * This will "throw :async" to thin for us.
    # * Does so by default, unless disabled via notifyWebServer=false
    apiReq.get(targetPath, { :grp => testGrp, :kb => testKb })
  end
end

