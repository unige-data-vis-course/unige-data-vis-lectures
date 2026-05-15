# The data service is a single zero-dependency Node script, so its image is
# tiny and there is no `npm install` step at all.
FROM node:20-alpine

WORKDIR /service
COPY package.json server.js spectra.mgf ./

# The service listens on 8081 (see server.js).
EXPOSE 8081
CMD ["node", "server.js"]
