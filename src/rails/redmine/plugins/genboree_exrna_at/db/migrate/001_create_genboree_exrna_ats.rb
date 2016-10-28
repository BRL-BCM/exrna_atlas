class CreateGenboreeExrnaAts < ActiveRecord::Migration
  def change
    create_table :genboree_exrna_ats do |t|
      t.integer :project_id
      t.string :gbHost
      t.string :gbGroup
      t.string :gbKb
      t.string :appLabel
      t.boolean :useRedmineLayout, :default => 1
      t.string :headerIncludeFileLocation
      t.string :footerIncludeFileLocation
      t.string :analysesColl, :default => 'Analyses'
      t.string :biosamplesColl, :default => 'Biosamples'
      t.string :donorsColl, :default => 'Donors'
      t.string :experimentsColl, :default => 'Experiments'
      t.string :jobsColl, :default => 'Jobs'
      t.string :resultFilesColl, :default => 'Result Files'
      t.string :runsColl, :default => 'Runs'
      t.string :studiesColl, :default => 'Studies'
      t.string :submissionsColl, :default => 'Submissions'
    end
  end
end
