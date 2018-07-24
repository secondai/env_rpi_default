FROM nickreed/rpi-second-basepackages-withnode

# static files (sounds) 
RUN mkdir -p /usr/src/staticfiles
COPY staticfiles /usr/src/staticfiles

# Switch to working directing (expected to be same as from nickreed/rpi-second-basepackages-withnode) 
WORKDIR /usr/src/app

# copy over javascript files 
COPY . .

# Second's port
EXPOSE 7001

# Mopidy's port 
EXPOSE 6680

CMD [ "npm", "run", "pi" ]
