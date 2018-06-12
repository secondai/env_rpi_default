# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

FROM node:carbon

# Install yarn
RUN npm install --global yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies

# Install Node.js dependencies
#COPY package*.json yarn.lock ./
COPY package*.json ./
RUN set -ex; yarn install --verbose --no-cache --frozen-lockfile;

RUN yarn global add nodemon

# Bundle app source
COPY . .

EXPOSE 7001

CMD [ "npm", "run", "pi", "--", "--MONGODB=${MONGODB}" ]


