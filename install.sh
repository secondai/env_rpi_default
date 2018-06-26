#!/usr/bin/env bash

{ # this ensures the entire script is downloaded #

cd ~
git clone https://github.com/secondai/env_rpi_default.git
cd env_rpi_default
mv .env.rpi .env
docker-compose up

} # this ensures the entire script is downloaded #
