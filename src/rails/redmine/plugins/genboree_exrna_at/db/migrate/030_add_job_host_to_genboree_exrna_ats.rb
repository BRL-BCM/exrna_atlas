class AddJobHostToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :jobHost, :string
  end
end
