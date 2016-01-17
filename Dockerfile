FROM nodesource/precise:latest

# cache package.json and node_modules to speed up builds
ADD package.json package.json
RUN npm install

# Add your source files
ADD . .
CMD ["npm","start"]