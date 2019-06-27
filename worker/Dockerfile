FROM node:alpine
WORKDIR "/app"
COPY ./package.json ./
RUN npm install
COPY . .
# Tell the image what to do when it starts
CMD ["npm", "run", "start"]