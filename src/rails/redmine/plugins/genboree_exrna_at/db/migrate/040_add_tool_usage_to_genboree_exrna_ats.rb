class AddToolUsageToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :toolUsageHost, :string
    add_column :genboree_exrna_ats, :toolUsageGrp, :string
    add_column :genboree_exrna_ats, :toolUsageKb, :string
    add_column :genboree_exrna_ats, :toolUsageColl, :string
    add_column :genboree_exrna_ats, :toolUsageView, :string
  end
end
