class ChangeStringDomainsInGenboreeExrnasAts < ActiveRecord::Migration
  def up
    change_column :genboree_exrna_ats, :homePageUrl, :text
    change_column :genboree_exrna_ats, :infoFlashHtml, :text
  end

  def down
    # Restore a version which cuts off strings >255 chars (could be bad for these settings)
    change_column :genboree_exrna_ats, :homePageUrl, :string
    change_column :genboree_exrna_ats, :infoFlashHtml, :string
  end
end
