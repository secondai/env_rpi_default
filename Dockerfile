# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

FROM node:carbon

RUN curl -o- -L https://yarnpkg.com/install.sh | bash

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./

#RUN yarn install --verbose
RUN yarn install

COPY . .

## Add the wait script to the image
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

EXPOSE 7001

CMD /wait && npm run pi


