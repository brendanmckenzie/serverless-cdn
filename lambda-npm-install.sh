# assumes you have run build.sh in ./docker/

docker run --rm --volume ${PWD}:/build -ti amazonlinux:nodejs /bin/bash -c "source ~/.bashrc; npm install"