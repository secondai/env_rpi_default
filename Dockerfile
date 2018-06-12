# dockerize 
# docker build -t nickreed/rpi-second .

ARG MONGODB

FROM node:carbon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
#RUN set -ex; yarn install --verbose --no-cache --frozen-lockfile;
#RUN yarn global add nodemon

RUN npm install --verbose
RUN npm install -g nodemon babel-register dotenv --verbose

# Bundle app source
COPY . .

EXPOSE 7001

CMD [ "npm", "run", "pi", "--", "--MONGODB=${MONGODB}" ]


