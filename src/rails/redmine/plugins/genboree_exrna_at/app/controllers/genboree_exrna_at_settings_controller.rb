require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtSettingsController < ApplicationController
  class GenboreeExrnaAtSettingsControllerError < StandardError; end

  include GenboreeExrnaAtHelper
  
  unloadable
  before_filter :find_project

  # updates the settings record by creating one if not found
  def update()
    @settingsFields, @settingsRec = GenboreeExrnaAtHelper.find_settings(@project)
    if(@settingsRec.nil?)
      # no rec, then make a new setting record
      hh = {}
      @settingsFields.each {|setting|
        field = setting[:setting]
        widget = ( setting[:widget] or :text_field )
        label = setting[:label]
        unless(widget == :_header)
          if(field == :updateData)
            value = params[field.to_s]['aa'] == "1" ? true : false
            hh[field] = value
          else
            hh[field] = params[field.to_s]
          end
        end
      }

      # associate these settings with a specific project
      hh[:project_id] = @project.id
      @settingsRec = GenboreeExrnaAt.new(hh)
      @settingsRec.save
    else
      # then update existing settings record
      begin
        @settingsFields.each { |setting|
          field = setting[:setting]
          widget = ( setting[:widget] or :text_field )
          unless(widget == :_header)
            if(field == :updateData)
              value = params[field.to_s]['aa'] == "1" ? true : false
              @settingsRec.send("#{field}=".to_sym, value)
            else
              @settingsRec.send("#{field}=".to_sym, params[field.to_s])
            end
          end
        }
      rescue => err
          $stderr.debugPuts(__FILE__, __method__, 'DEBUG',  "ERROR in settings update------- \n\n#{err.inspect}\n\n")
      end
      @settingsRec.save
    end
    kbMount = RedmineApp::Application.routes.default_scope[:path]
    redirect_to "#{kbMount}/projects/#{@project.identifier}/settings/genboreeExrnaAt"
    flash[:notice] = "Settings updated." 
  rescue GenboreeExrnaAtSettingsControllerError => e
      $stderr.puts "ERROR - #{__method__}() => Exception! #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}\n\n"
      render_error e.message
  end
end
