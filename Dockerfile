FROM nodesource/precise:latest

# cache package.json and node_modules to speed up builds
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app

# Add your source files
ADD . /usr/src/app
CMD ["npm","start"]