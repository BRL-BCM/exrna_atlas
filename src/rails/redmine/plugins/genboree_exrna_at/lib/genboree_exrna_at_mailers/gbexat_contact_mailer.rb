
module GenboreeExrnaAtMailers # Plugin specific namespace, and agrees with dir under lib/
  class GbexatContactMailer < ActionMailer::Base # Class name--can be plugin specific but need not be since use full namespace
    include GenboreeExrnaAtHelper
    # @return [Mail::Message] delivered mail message
    def contact(kwargs)
      rv = nil
      kwargs = kwargs.deep_clone()
      requiredKwargs = [:to, :bcc, :name, :from, :institution, :subject, :body]
      unless(kwargs.keys?(requiredKwargs))
        raise ArgumentError.new("Cannot send email due to missing arguments: #{requiredKwargs - kwargs.keys()}")
      end

      kwargs[:subject] = "[exRNA Atlas] #{kwargs[:subject]}"

      mailMessage = mail({
        :subject => kwargs[:subject],
        :from => kwargs[:from],
        :to => kwargs[:to],
        :bcc => kwargs[:bcc]
      }) { |format|
        format.text { render :text=> "
          ExRNA Atlas user #{kwargs[:name].inspect} from institution #{kwargs[:institution].inspect} wrote:\n
          #{kwargs[:body]}
        "
        }
      }
      rv = mailMessage.deliver()
    end
  end
end
