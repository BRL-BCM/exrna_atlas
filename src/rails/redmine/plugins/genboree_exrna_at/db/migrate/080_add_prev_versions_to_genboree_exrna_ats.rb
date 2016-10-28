class AddPrevVersionsToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :prevVersions, :text
  end
end
