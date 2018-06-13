# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

FROM node:carbon

RUN curl -o- -L https://yarnpkg.com/install.sh | bash

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

#RUN yarn install --verbose
RUN yarn install

EXPOSE 7001

CMD [ "npm", "run", "pi" ]


