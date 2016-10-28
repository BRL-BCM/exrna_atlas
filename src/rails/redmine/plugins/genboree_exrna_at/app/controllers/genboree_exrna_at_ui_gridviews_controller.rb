require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtUiGridviewsController < ApplicationController
  include GenboreeExrnaAtHelper
  include PermHelper
  unloadable

  layout 'gbexat_entry'
  before_filter :find_project, :find_settings, :find_gridName, :find_postedParams, :find_assay, :authorize_with_public_project
  before_filter :getKbMount, :userPerms
  respond_to :json

  def show()
    @relLinkBase = ""
    render :show
  end

end
