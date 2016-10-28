#!/usr/bin/env ruby

require 'genboreeTools'


# copy static files
# `cp ./src/data/conf/actionability.yaml /usr/local/brl/data/conf/`
# `cp -r ./src/data/redmine /usr/local/brl/data/`

# install app
`./install_app.sh`


group_name = 'exrna-atlas'
work_kb_name = 'exrna-atlas'
proj_name = 'exrna-atlas'

# genboree group
genboree_add_group(group_name)

# create KBs
genboree_add_kb(group_name, work_kb_name)
genboree_set_kb_public(group_name, work_kb_name)

# get list of collections
colls = []
`ls kb/collections`.each { |x|
    x.strip!
    colls << x[0..-12] if x =~ /\.model.json$/
}

# create collections
colls.each { |coll|
    genboree_kb_add_collection( group_name, work_kb_name, coll, File.read("kb/collections/#{coll}.model.json") )
}

# create transforms
`ls kb/transforms`.each { |t|
    t.strip!
    next if t !~ /\.json$/
    genboree_kb_add_transform( group_name, work_kb_name, File.read("kb/transforms/#{t}") )
}

# create project for work
redmine_add_project(proj_name, proj_name, ['genboree_exrna_at', 'genboree_kbs'], true)
redmine_configure_project_genboree_kb(proj_name, group_name, work_kb_name)
redmine_configure_project_genboree_exrna_at(proj_name, group_name, work_kb_name)


