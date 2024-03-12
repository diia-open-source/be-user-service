#!/bin/sh

# Use "$@" to represent all the arguments
for envVar in "$@"
do
    echo $envVar >> .env
done