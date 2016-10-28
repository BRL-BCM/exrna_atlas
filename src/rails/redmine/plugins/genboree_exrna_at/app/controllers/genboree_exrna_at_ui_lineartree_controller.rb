require 'plugins/genboree_exrna_at/app/helpers/genboree_exrna_at_helper'

class GenboreeExrnaAtUiLineartreeController < ApplicationController
  include GenboreeExrnaAtHelper
  include PermHelper
  unloadable

  layout 'gbexat_entry'
  before_filter :find_project, :find_settings, :authorize_with_public_project, :trailing_slash_orig_url_redirect
  before_filter :getKbMount, :userPerms

  def show()
    @relLinkBase = ""
    render :show
  end
end
