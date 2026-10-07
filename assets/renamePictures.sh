#!/bin/bash
declare -i i=1
cd essen

for file in ./*.jpeg; do
    mv "$file" "new/img_$i.jpeg"
    i+=1
    done