# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

#FROM node:carbon
FROM resin/rpi-raspbian

#RUN wget https://nodejs.org/dist/latest-carbon/node-v8.11.3.tar.gz

# Make "source" work by replacing shell with bash 
RUN rm /bin/sh && ln -s /bin/bash /bin/sh


#RUN apt-key adv --fetch-keys http://dl.yarnpkg.com/debian/pubkey.gpg && \
#    echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN sudo apt-get update
RUN sudo apt-get install -y wget curl bluetooth bluez libbluetooth-dev libudev-dev build-essential git

#RUN wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv6l.tar.gz \
# && tar -xzf node-v8.11.3-linux-armv6l.tar.gz \
# && cd node-v8.11.3-linux-armv6l/ | sudo cp -R * /usr/local/


# nvm environment variables
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 8.11.3

# install nvm
# https://github.com/creationix/nvm#install-script
RUN mkdir -p $NVM_DIR
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

# install node and npm
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# confirm installation
RUN node -v
RUN npm -v


#RUN curl -o- -L https://yarnpkg.com/install.sh | bash
#RUN sudo apt-get install -y yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./

#RUN yarn install --verbose
#RUN yarn install
RUN npm install

COPY . .

EXPOSE 7001

CMD [ "npm", "run", "pi" ]


