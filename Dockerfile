# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

#FROM node:carbon
FROM resin/rpi-raspbian

RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo apt-get install -y nodejs
RUN curl -o- -L https://yarnpkg.com/install.sh | bash

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./

#RUN yarn install --verbose
RUN yarn install

COPY . .

EXPOSE 7001

CMD [ "npm", "run", "pi" ]


