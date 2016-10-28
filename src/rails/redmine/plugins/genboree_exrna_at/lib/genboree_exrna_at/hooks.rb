# Add a project-specific settings tab for this plugin/module (ExRNA Atlas)
module GenboreeExrnaAtSettingsHook
  class Hooks < Redmine::Hook::ViewListener
    def helper_projects_settings_tabs(context = {})
      context[:tabs].push({ 
        :name    => 'genboreeExrnaAt',
        :action  => :genboree_exrna_at_settings,
        :partial => 'projects/settings/genboree_exrna_at_settings',
        :label   => :gbexat_label_project_settings_tab
      })
    end
  end
end
