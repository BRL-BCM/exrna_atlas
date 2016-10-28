require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtDatafileController < ApplicationController
  include GenboreeExrnaAtHelper
  unloadable

  layout false
  before_filter :find_project, :authorize_with_public_project

  DATA_DIR = "#{Rails.root}/plugins/genboree_exrna_at/config/data_tmp"
  PRJ_SPEC_DIR  = "#{Rails.root}/project-specific/genboree_exrna_at/cache"

  def show()
    datafile = params[:datafile]
    path = "#{DATA_DIR}/#{datafile}"
    if(File.file?(path) and File.readable?(path))
      send_file( path, :disposition => 'inline', :type => (Redmine::MimeType.of(path) or Redmine::MimeType::DEFAULT_MIME_TYPE) )
    else
      notFound()
    end
  end

  def getPrjFile()
    projectId = @project.identifier
    datafile = params[:datafile]
    path = "#{PRJ_SPEC_DIR}/#{projectId}/#{datafile}"
    if(File.file?(path) and File.readable?(path))
      send_file( path, :disposition => 'inline', :type => (Redmine::MimeType.of(path) or Redmine::MimeType::DEFAULT_MIME_TYPE) )
    else
      notFound()
    end
  end
end

