require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtFrameLoginController < ApplicationController
  include GenboreeExrnaAtHelper
  include PermHelper
  unloadable

  layout 'gbexat_entry'
  before_filter :find_project, :find_settings, :checkForNonGbUser, :authorize
  before_filter :getKbMount, :userPerms
  respond_to :json
  
  DATA_DIR = "#{Rails.root}/plugins/genboree_exrna_at/config/data_tmp"  
  TOOL_DIR = "#{DATA_DIR}/toolConfs"


  def show()
    render :show
  end
  

  
end
