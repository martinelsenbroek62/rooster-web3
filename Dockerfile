FROM node:16-alpine

# Create app directory
WORKDIR /app

# Copy configs to /app 
COPY *.json ./
COPY *.yml ./
COPY yarn.lock ./

# Install app dependencies
RUN yarn install --ignore-scripts --frozen-lockfile

# Copy source to work directory
COPY src /app/src

#Generate types and manifests
RUN yarn npm-run-all generate-types codegen

#Compile TypeScript
RUN yarn build

EXPOSE 3000
CMD [ "yarn", "start" ]