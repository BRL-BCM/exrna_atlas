class AddHomeUrlAndInfoHtmlToGenboreeExrnaAts < ActiveRecord::Migration
  def change
    add_column :genboree_exrna_ats, :homePageUrl, :string
    add_column :genboree_exrna_ats, :infoFlashHtml, :string
  end
end
