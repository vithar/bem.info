#!/bin/bash

cd output/bem.info/

# init new repo
git init
git remote add origin $1

git checkout -b gh-pages

git add .
git commit -m "deploy"
git push -f origin gh-pages

cd ..
