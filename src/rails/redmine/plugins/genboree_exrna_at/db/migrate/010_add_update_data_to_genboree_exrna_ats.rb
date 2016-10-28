class AddUpdateDataToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :updateData, :boolean, :default => 0
  end
end
