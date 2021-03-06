require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'
class GenboreeExrnaAtTestingController < ApplicationController
  include GenboreeExrnaAtHelper

  before_filter :find_project, :find_settings

  def testasync()
   $stderr.puts "DEBUG - #{__method__}() => PARAMS: #{params.inspect} "
   $stderr.puts "DEBUG - #{__method__}() => @project: #{@project.inspect} "
   $stderr.puts "DEBUG - #{__method__}() => @settingsRec: #{@settingsRec.inspect} "
   $stderr.puts "DEBUG - #{__method__}() => USER: #{User.current.login.inspect} "
   u1 = User.find_by_login('neethus') 
   user = User.current.login ;
   #targetHost = '10.15.55.128'
   targetHost = @settingsRec.gbHost.strip
   #apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, nil, u1)
   apiReq = GbApi::SimpleAsyncApiRequester.new(env, targetHost, @project)
   @sum = 0
   @body = ''
   @status = ''
   @headers = {} 
   @count = 0
   apiReq.respCallback { |array|
    $stderr.puts "-----MY CALLBACK!-----\n\n  * STATUS: #{array[0].inspect}\n  * HEADERS:\n#{array[1].inspect}\n  * BODY CLASS: #{array[2].class} (has each? #{array[2].respond_to?(:each)})\n\n" 
     @status = array[0]
     @headers = array[1]
     array[2].each { |chunk|
      $stderr.puts "  - ARRAY ID: #{array.object_id} => CHUNK: #{chunk.size} bytes" 
      @sum += chunk.size
      @body += chunk
    }
   }
   apiReq.bodyFinish {
    @count = @count + 1
    $stderr.puts "-----MY BODY FINISH CALLBACK!-----\n\n   We read #{@sum.inspect} bytes of body via its non-blocking each().\n\n" 
    $stderr.puts "Here is the Genboree API response body:\n\n#{@body}\n\n"
    $stderr.puts "Here is the status:\n\n#{@status.inspect}\n\n"
    $stderr.puts "Here is the count:\n\n#{@count.inspect}\n\n"
    pBody = JSON.parse(@body) rescue nil
    respObj = nil
    if(pBody and pBody['data'])
      respObj = JSON(pBody["data"][0])
      $stderr.puts "Here is what I want testing =>>>>>>>>>>>>>-----:\n\n#{pBody["data"][0]}\n\n"
    elsif(pBody)
      respObj = JSON(pBody["status"])
    end

     headers = {}
     headers['Content-Type'] = "text/plain"
     apiReq.sendToClient(@status, headers, [respObj])
  }
  apiReq.get("/REST/v1/grp/{grp}/dbs?connect=no&format=json_pretty", { :grp => 'ARJ.a' })

  end


  def makeReq()
    apiReqChild = GbApi::SimpleAsyncApiRequester.new(env, @settingsRec.gbHost.strip, @project)
    apiReqChild.notifyWebServer = false
    apiReqChild.respCallback { |array|
      @sttus = array[0]
      array[2].each { |chunk|
        @body += chunk
      }
    }
   apiReqChild.bodyFinish {
     @count = @count + 1
     $stderr.puts "Here is the count:\n\n#{@count.inspect}\n\n"
     if(@count == 2)
        pBody = JSON.parse(@body) rescue nil
        headers = {}
        headers['Content-Type'] = "text/plain"
       apiReqChild.sendToClient(@status, headers, [pBody.to_jsonj])
     end
    }
  end
end
