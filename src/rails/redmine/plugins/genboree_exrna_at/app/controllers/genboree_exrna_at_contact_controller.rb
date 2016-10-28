class GenboreeExrnaAtContactController < ApplicationController
  include GenboreeExrnaAtHelper 
  include PermHelper
  unloadable

  before_filter :find_project, :find_settings
  before_filter :getKbMount

  layout 'gbexat_no_redmine'

  def post
    to = bcc = nil
    begin
      to = @settingsRec.contactTo
      bcc = @settingsRec.contactBccs
    rescue NoMethodError => err
      to = bcc = nil
    end
    if(to.nil?)
      $stderr.debugPuts(__FILE__, __method__, "ERROR", "Cannot send \"Contact Us\" email because this Redmine installation doesn't support the required settings")
      raise StandardError.new("Internal server error while sending email")
    end
    if(to.empty? or bcc.empty?)
      $stderr.debugPuts(__FILE__, __method__, "ERROR", "Cannot send \"Contact Us\" email because this project has not been configured with email addresses to send the email to")
      raise StandardError.new("Internal server error while sending email")
    end
    bcc = bcc.split(",").map { |addr| addr.strip() }

    kwargs = {
      :to => to,
      :bcc => bcc,
      :from => params['userEmail'],
      :name => params['userName'],
      :institution => params['userInstitution'],
      :subject => params['emailSubject'],
      :body => params['emailBody']
    }
    deliveredMail = GenboreeExrnaAtMailers::GbexatContactMailer.contact(kwargs)
    #$stderr.debugPuts(__FILE__, __method__, 'DEBUG', "Delivered mail:\n\n#{deliveredMail.inspect}\n\n")
  end
end
