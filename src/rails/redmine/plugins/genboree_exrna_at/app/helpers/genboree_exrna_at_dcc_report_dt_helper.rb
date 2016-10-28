module GenboreeExrnaAtDccReportDtHelper
  KB_PROP_PATH_DELIM = "."
  KB_VIEW_VALUE_KEY = "value"
  SUBMITTER_NAME_KEY = "Submitter's Name"

  # Most Datatables use of GenboreeKB view responses will simply require a flattening of
  #   the response object; we perform that transformation here
  # @param [Hash] single data object from ERCC Tool Usage View e.g.
  #   {
  #     "ERCC Tool Usage.PI Name": {
  #       "value": "Aleksandar Milosavljevic"
  #     },
  #     "ERCC Tool Usage.Grant Number": {
  #       "value": "1U54DA036134-01"
  #     },
  #     ...
  #   }
  # @return [Hash] parsed response; generally just flattened for DataTables
  #   {
  #     "PI Name": "Aleksandar Milosavljevic",
  #     "Grant Number": "1U54DA036134-01",
  #     ...
  #   }
  def parseViewDatum_dt(datum)
    rv = {}
    datum.each_key { |kk|
      propTokens = kk.split(KB_PROP_PATH_DELIM)
      rv[propTokens[-1]] = datum[kk][KB_VIEW_VALUE_KEY]
    }
    return rv
  end

  # In addition to flattening most fields, handle some specialized cases for tool usage
  # @see parseViewDatum_dt
  def parseToolUsageDatum_dt(datum)
    rv = parseViewDatum_dt(datum)

    # Transform "Submitter's First Name" and "Submitter's Last Name" to "Submitter's Name"
    firstName = rv.delete("Submitter's First Name")
    lastName = rv.delete("Submitter's Last Name")
    if(firstName.nil? and lastName.nil?)
      rv[SUBMITTER_NAME_KEY] = nil
    else
      rv[SUBMITTER_NAME_KEY] = "#{firstName} #{lastName}".strip()
    end

    # Rename "Platform" to "Mode of Submission"
    rv["Mode of Submission"] = rv.delete("Platform")

    # Total "Number of Failed Samples" and "Number of Successful Samples" to  "Number of Submitted Samples" @todo
    nFail = rv.delete("Number of Failed Samples")
    nSuccess = rv.delete("Number of Successful Samples")
    rv["Number of Submitted Samples"] = nSuccess.to_i + nFail.to_i

    # Rename "Anticipated Data Repository" to "Anticipated Public Data Repository"
    rv["Anticipated Public Data Repository"] = rv.delete("Anticipated Data Repository")

    return rv
  end
end
