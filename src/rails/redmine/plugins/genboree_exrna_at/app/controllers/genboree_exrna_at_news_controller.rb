class GenboreeExrnaAtNewsController < ApplicationController
  unloadable

  include GenboreeExrnaAtHelper 
  include PermHelper

  before_filter :find_project, :find_settings
  before_filter :getKbMount, :userPerms

  layout 'gbexat_entry'

  def show
    # @todo plugin name variable
    $stderr.debugPuts(__FILE__, __method__, "DEBUG", "starting show")
    path = Rails.root.join('plugins', 'genboree_exrna_at', 'config', 'data_tmp', 'news.json').to_s
    @news = JSON.parse(File.read(path)) rescue nil
    render :show
  end
end
