# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

#FROM node:carbon
FROM resin/rpi-raspbian

#RUN wget https://nodejs.org/dist/latest-carbon/node-v8.11.3.tar.gz

RUN wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash
RUN sudo node-install -v 8.11.3
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


