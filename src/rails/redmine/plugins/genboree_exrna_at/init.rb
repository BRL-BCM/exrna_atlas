# extend Redmine functionality to add project-specific settings for plugins/modules
#   (and perhaps other hooks as well)
require 'redmine'
require_dependency 'genboree_exrna_at/hooks'

Redmine::Plugin.register :genboree_exrna_at do
  name 'Genboree ExRNA Atlas plugin'
  author 'Neethu Shah'
  description 'This is a redmine plugin for ExRNA Atlas'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'


  # Add plugin-specific settings accessible through Setting.plugin_genboree_csf_evb (per Plugin.register above)
  #   or via the "settings" local variable
  settings  :partial => 'settings/genboree_exrna_at',
    :default => {
      'menu' => 'ExRNA Atlas'
    }

  # Add module to list of admin-enabled project modules
  project_module(:genboree_exrna_at) {
    permission :gbexat_view_entry, {
      :genboree_exrna_at_ui_entry => [ :show ],
      :portal_proto_ui => [ :show ]
    }

    permission :gbexat_public_tool_job, {
     :genboree_exrna_at_frame_login => [:show] 
    }
  }

  # For projects with Genboree CSF EVB module enabled, add a tab to the menu bar
  menu :project_menu, 
    :genboree_exrna_at,
    {
      :controller => "genboree_exrna_at_ui_entry",
      :action => "show"
    },
    :caption => Proc.new { Setting.plugin_genboree_exrna_at['menu'] },
    :if      => Proc.new { !Setting.plugin_genboree_exrna_at['menu'].blank? }
end
