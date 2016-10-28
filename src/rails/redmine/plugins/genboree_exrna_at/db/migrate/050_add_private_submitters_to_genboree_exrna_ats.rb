class AddPrivateSubmittersToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :privateSubmitters, :string
  end
end
