class AddNewsAndEmailsToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :newsFile, :string
    add_column :genboree_exrna_ats, :contactTo, :string
    add_column :genboree_exrna_ats, :contactBccs, :string
  end
end
