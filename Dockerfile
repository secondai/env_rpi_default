# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

#FROM node:carbon
FROM resin/rpi-raspbian

#RUN wget https://nodejs.org/dist/latest-carbon/node-v8.11.3.tar.gz

RUN sudo apt-get update
RUN sudo apt-get install -y wget
RUN wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv6l.tar.gz \
 && tar -xzf node-v8.11.3-linux-armv6l.tar.gz \
 && cd node-v8.11.3-linux-armv6l/ | sudo cp -R * /usr/local/
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


