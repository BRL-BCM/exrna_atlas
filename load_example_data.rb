#!/usr/bin/env ruby

require 'genboreeTools'


group_name = 'exrna-atlas'
work_kb_name = 'exrna-atlas'

colls = ['Submissions', 'Studies', 'Donors', 'Experiments', 'Biosamples', 'Analyses', 'Result_Files', 'Jobs', 'Runs']

# create transforms
colls.each { |t|
    t.strip!
    genboree_kb_add_documents_from_file(group_name, work_kb_name, t, 'kb/docs_example/' + t + '.docs.json')
}
