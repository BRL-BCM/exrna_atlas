# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
RedmineApp::Application.routes.draw do

  # per-project settings
  post '/projects/:id/settings/genboreeExrnaAt/update', :to => "genboree_exrna_at_settings#update", :as => :genboree_exrna_at_settings_update

  # Entry page
  get '/projects/:id/exat', :to => "genboree_exrna_at_ui_entry#show", :as => :genboree_exrna_at_ui_entry_show
  # Read data files
  get 'projects/:id/exat/data/(/*datafile(.:format))', :to => 'genboree_exrna_at_datafile#show', :as => :genboree_exrna_at_datafile_show
  get 'projects/:id/exat/prjdata/(/*datafile(.:format))', :to => 'genboree_exrna_at_datafile#getPrjFile', :as => :genboree_exrna_at_datafile_getPrjFile
  get 'projects/:id/genboree_exrna_at/prjdata/(/*datafile(.:format))', :to => 'genboree_exrna_at_datafile#getPrjFile', :as => :genboree_exrna_at_datafile_getPrjFile
  # D3 data
  get '/projects/:id/exat/d3data', :to => "genboree_exrna_at_selections_d3#asyncGetdata", :as => :genboree_exrna_at_selections_d3_asyncGetdata 
  get '/projects/:id/genboree_exrna_at/d3dataAsync', :to => "genboree_exrna_at_selections_d3#asyncGetdata", :as => :genboree_exrna_at_selections_d3_asyncGetdata 


  # GridView page
  get '/projects/:id/exat/gridview', :to => "genboree_exrna_at_ui_gridviews#show", :as => :genboree_exrna_at_ui_gridviews_show
  get '/projects/:id/exat/fluidVsDis', :to => "genboree_exrna_at_ui_gridviews#show", :as => :genboree_exrna_at_ui_gridviews_fluidvsdis, :defaults => { :grid => 'fluidVsDis' }
  get '/projects/:id/exat/fluidVsExp', :to => "genboree_exrna_at_ui_gridviews#show", :as => :genboree_exrna_at_ui_gridviews_fluidvsexp, :defaults => { :grid => 'fluidVsExp' }
  get '/projects/:id/exat/datasets', :to => "genboree_exrna_at_ui_gridviews#show", :as => :genboree_exrna_at_ui_gridviews_datasets, :defaults => { :grid => 'analysesTable' }
  get '/projects/:id/exat/transformDocs', :to => "genboree_exrna_at_async_gridviews#asynctransformDocs", :as => :genboree_exrna_at_async_gridviews_asynctransformDocs
  get '/projects/:id/exat/transformDoc', :to => "genboree_exrna_at_async_gridviews#asynctransformDoc", :as => :genboree_exrna_at_async_gridviews_asynctransformDoc
  get '/projects/:id/exat/download', :to => "genboree_exrna_at_async_gridviews#download", :as => :genboree_exrna_at_async_gridviews_download
  get '/projects/:id/exat/downloadbatch', :to => "genboree_exrna_at_async_gridviews#downloadbatch", :as => :genboree_exrna_at_async_gridviews_downloadbatch
  get '/projects/:id/exat/doc', :to => "genboree_exrna_at_async_gridviews#getDoc", :as => :genboree_exrna_at_async_gridviews_getDoc
  get '/projects/:id/exat/docs', :to => "genboree_exrna_at_async_gridviews#getDocs", :as => :genboree_exrna_at_async_gridviews_getDocs
  get '/projects/:id/exat/studiesGrData', :to => "genboree_exrna_at_study_profile#asyncgetStudiesGridData", :as => :genboree_exrna_at_study_profile_asyncgetStudiesGridData
  get '/projects/:id/exat/userGrps', :to => "genboree_exrna_at_tooljobs#getUsrGrps", :as => :genboree_exrna_at_tooljobs_getUsrGrps
  get '/projects/:id/exat/grpPerm', :to => "genboree_exrna_at_tooljobs#grpPermissions", :as => :genboree_exrna_at_tooljobs_getUsrGrps_grpPermissions
  get '/projects/:id/exat/usrDbs', :to => "genboree_exrna_at_tooljobs#getusrDbs", :as => :genboree_exrna_at_tooljobs_getUsrGrps_getusrDbs
  get '/projects/:id/exat/toolLogin', :to => "genboree_exrna_at_frame_login#show", :as => :genboree_exrna_at_frame_login_show
  get '/projects/:id/exat/postPro', :to => "genboree_exrna_at_async_gridviews#analysisPostProcessFileUrls", :as => :genboree_exrna_at_async_gridviews_analysisPostProcessFileUrls
 
  post '/projects/:id/exat/gridview', :to => "genboree_exrna_at_ui_gridviews#show", :as => :genboree_exrna_at_ui_gridviews_show
  post '/projects/:id/exat/biosampleMetadata', :to => "genboree_exrna_at_async_gridviews#asyncgetBiosampleMetadata", :as => :genboree_exrna_at_async_gridviews_asyncgetBiosampleMetadata
  post '/projects/:id/exat/fastqAndDb', :to => "genboree_exrna_at_async_gridviews#asyncfastqAndDb", :as => :genboree_exrna_at_async_gridviews_asyncfastqAndDb
  post '/projects/:id/exat/qcMetrics', :to => "genboree_exrna_at_async_gridviews#asyncqcMetrics", :as => :genboree_exrna_at_async_gridviews_asyncqcMetrics
  post '/projects/:id/exat/matchDocs', :to => "genboree_exrna_at_ui_gridviews#matchDocs", :as => :genboree_exrna_at_ui_gridviews_matchDocs
  post '/projects/:id/exat/resultUrls', :to => "genboree_exrna_at_async_gridviews#asyncresultUrls", :as => :genboree_exrna_at_async_gridviews_asyncresultUrls
  post '/projects/:id/exat/tooljobSubmit', :to => "genboree_exrna_at_tooljobs#submitToolJobAsync", :as => :genboree_exrna_at_tooljobs_submitToolJobAsync
  post '/projects/:id/exat/uploadFile', :to => "genboree_exrna_at_tooljobs#uploadFileToDb", :as => :genboree_exrna_at_tooljobs_uploadFileToDb
  post '/projects/:id/exat/createDb', :to => "genboree_exrna_at_tooljobs#createDb", :as => :genboree_exrna_at_tooljobs_createDb

  # News page
  get '/projects/:id/exat/news', :to => "genboree_exrna_at_news#show", :as => :genboree_exrna_at_news_show
  
  # LinearTree page
  get '/projects/:id/exat/lineartree', :to => 'genboree_exrna_at_ui_lineartree#show', :as => :genboree_exrna_at_ui_lineartree_show
  post '/projects/:id/genboree_exrna_at/docs/biosampleMetadata', :to => "genboree_exrna_at_ui_gridviews#getBiosampleMetadata", :as => :genboree_exrna_at_ui_gridviews_getBiosampleMetadata
  get '/projects/:id/genboree_exrna_at/docs/biosampleMetadataAsync', :to => "genboree_exrna_at_async_gridviews#asyncgetBiosampleMetadata", :as => :genboree_exrna_at_async_gridviews_asyncgetBiosampleMetadata
  post '/projects/:id/genboree_exrna_at/docs/fastqAndDb', :to => "genboree_exrna_at_ui_gridviews#fastqAndDb", :as => :genboree_exrna_at_ui_gridviews_fastqAndDb
  post '/projects/:id/genboree_exrna_at/docs/qcMetrics', :to => "genboree_exrna_at_ui_gridviews#qcMetrics", :as => :genboree_exrna_at_ui_gridviews_qcMetrics
  post '/projects/:id/genboree_exrna_at/docs/qcMetricsAsync', :to => "genboree_exrna_at_async_gridviews#asyncqcMetrics", :as => :genboree_exrna_at_async_gridviews_asyncqcMetrics
  post '/projects/:id/genboree_exrna_at/matchDocs', :to => "genboree_exrna_at_ui_gridviews#matchDocs", :as => :genboree_exrna_at_ui_gridviews_matchDocs
  post '/projects/:id/genboree_exrna_at/resultUrls', :to => "genboree_exrna_at_ui_gridviews#resultUrls", :as => :genboree_exrna_at_ui_gridviews_resultUrls
  post '/projects/:id/genboree_exrna_at/resultUrlsAsync', :to => "genboree_exrna_at_async_gridviews#asyncresultUrls", :as => :genboree_exrna_at_async_gridviews_asyncresultUrls

  # Biosample full report
  get '/projects/:id/exat/biosample/:biosampleId/report', :to => 'genboree_exrna_at_biosample_report#show', :as => :genboree_exrna_at_biosample_report_shoow

  # Contact Us
  post '/projects/:id/exat/contact', :to => 'genboree_exrna_at_contact#post', :as => :genboree_exrna_at_contact_post

  # ERCC DCC report
  get '/projects/:id/exat/report', :to => 'genboree_exrna_at_dcc_report#show', :as => :genboree_exrna_at_report_show
  get '/projects/:id/exat/report_dt', :to => 'genboree_exrna_at_dcc_report_dt#getToolUsageData', :as => :genboree_exrna_at_report_dt_get
  post '/projects/:id/exat/report_dt', :to => 'genboree_exrna_at_dcc_report_dt#postToolUsageData', :as => :genboree_exrna_at_report_dt_post


  # ----------------------------------------------------------------
  # TESTS/EXPLORATIONS/TMP
  # ----------------------------------------------------------------
  get '/projects/:id/exat/asyncExternTest', :to => "genboree_exrna_at_async_extern_test#show", :as => :genboree_exrna_at_async_extern_test
  get '/projects/:id/exat/asyncExtern2Test', :to => "genboree_exrna_at_async_extern2_test#show", :as => :genboree_exrna_at_async_extern2_test
  get '/projects/:id/exat/asyncRenderTest', :to => "genboree_exrna_at_async_render_test#show", :as => :genboree_exrna_at_async_render_test
end
