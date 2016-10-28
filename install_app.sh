#!/bin/bash

set -e  # stop on first error

rm -rf /usr/local/brl/local/rails/redmine/plugins/genboree_exrna_at
cp -r src/rails/redmine/plugins/genboree_exrna_at  /usr/local/brl/local/rails/redmine/plugins/

cd ${DIR_TARGET}/rails/redmine
RAILS_ENV=production rake db:migrate
RAILS_ENV=production rake redmine:plugins
cd -
