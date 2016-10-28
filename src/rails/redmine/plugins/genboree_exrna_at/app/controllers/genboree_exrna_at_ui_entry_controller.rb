class GenboreeExrnaAtUiEntryController < ApplicationController  
  include GenboreeExrnaAtHelper 
  include PermHelper
  unloadable

  before_filter :find_project, :find_settings, :authorize, :is_consortium_atlas?, :trailing_slash_orig_url_redirect
  before_filter :getKbMount, :userPerms

  layout 'gbexat_entry'

  def show()
    @relLinkBase = "exat/"
    path = Rails.root.join('plugins', 'genboree_exrna_at', 'config', 'data_tmp', 'news.json').to_s
    @news = JSON.parse(File.read(path)) rescue nil
    render :show
  end
end
